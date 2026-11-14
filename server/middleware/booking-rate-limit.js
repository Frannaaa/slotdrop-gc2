import { isIP } from 'node:net';

// Group assignment: Fran (M1) server integration. Optional GC2 +1 backend half.
export function bookingRateLimiter({
  max = 30,
  windowMs = 60000,
  now = () => Date.now(),
  useRenderForwardedIp = process.env.RENDER === 'true',
} = {}) {
  if(!Number.isSafeInteger(max)||max<1||!Number.isSafeInteger(windowMs)||windowMs<1000
    ||typeof now!=='function') throw new Error('Invalid rate-limit configuration');
  const requests=new Map();
  return (req,res,next) => {
    // Do not impede receipt reads, Owner lists or other API routes.
    if(req.method!=='POST'||req.path!=='/') return next();
    const stamp=now();
    // Render's public ingress sets the first forwarded address to the client.
    // Direct deployments use the socket and ignore forwarded headers.
    const forwarded = useRenderForwardedIp
      ? req.get('x-forwarded-for')?.split(',', 1)[0].trim()
      : undefined;
    const key = forwarded && isIP(forwarded) ? forwarded : req.socket.remoteAddress || 'unknown';
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
