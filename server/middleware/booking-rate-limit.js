// Group assignment: Fran (M1) server integration. Optional GC2 +1 backend half.
// Demo-only per-socket-IP, fixed-window limiter; does not trust spoofed proxy headers.
export function bookingRateLimiter({max = 30, windowMs = 60000, now = () => Date.now()} = {}) {
  if(!Number.isSafeInteger(max)||max<1||!Number.isSafeInteger(windowMs)||windowMs<1000
    ||typeof now!=='function') throw new Error('Invalid rate-limit configuration');
  const requests=new Map();
  return (req,res,next) => {
    // Do not impede receipt reads, Owner lists or other API routes.
    if(req.method!=='POST'||req.path!=='/') return next();
    const stamp=now();
    const key=req.socket.remoteAddress||'unknown';
    let record=requests.get(key);
    if(!record||stamp>=record.resetAt){
      record={count:0,resetAt:stamp+windowMs};
      requests.set(key,record);
    }
    // Keep a bounded number of stale counters in this single-process demo.
    if(requests.size>1000) for(const [address,value] of requests){
      if(stamp>=value.resetAt)requests.delete(address);
    }
    if(record.count>=max){
      const seconds=Math.max(1,Math.ceil((record.resetAt-stamp)/1000));
      res.set('Retry-After',String(seconds));
      return res.status(429).json({error:{
        code:'RATE_LIMITED',
        message:'Too many booking attempts. Try again shortly.',
        retryAfterSeconds:seconds,
      }});
    }
    record.count++;
    next();
  };
}
