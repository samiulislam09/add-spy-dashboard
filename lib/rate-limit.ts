const requestMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit = 120, windowMs = 60_000) {
  const now = Date.now();
  const current = requestMap.get(key);

  if (!current || current.resetAt < now) {
    requestMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count };
}
