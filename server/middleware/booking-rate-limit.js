import { isIP } from 'node:net';

// Group assignment: Fran (M1) server integration. Optional GC2 +1 backend half.
export function bookingRateLimiter({
  max = 30,
  windowMs = 60000,
  now = () => Date.now(),
  // Enable a trusted client-IP header only on its matching deployment.
  useRenderClientIp = process.env.RENDER === 'true',
  useVercelClientIp = process.env.VERCEL === '1',
} = {}) {
  if(!Number.isSafeInteger(max)||max<1||!Number.isSafeInteger(windowMs)||windowMs<1000
    ||typeof now!=='function') throw new Error('Invalid rate-limit configuration');
  const requests=new Map();
  return (req,res,next) => {
    // Do not impede receipt reads, Owner lists or other API routes.
    if(req.method!=='POST'||req.path!=='/') return next();
    const stamp=now();
    // Trust a provider-owned client-IP header only behind that provider's
    // ingress. Render appends to caller-controlled X-Forwarded-For, so use
    // Cloudflare's CF-Connecting-IP instead; Vercel overwrites its own
    // X-Vercel-Forwarded-For. Direct servers ignore forwarding headers.
    // An absent/invalid trusted header falls back to the socket address.
    const trustedIp = useRenderClientIp
      ? req.get('cf-connecting-ip')?.trim()
      : useVercelClientIp
        ? req.get('x-vercel-forwarded-for')?.trim()
        : undefined;
    const key = trustedIp && isIP(trustedIp)
      ? trustedIp
      : req.socket.remoteAddress || 'unknown';
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
