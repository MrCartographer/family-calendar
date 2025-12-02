import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const FAMILY_PASSWORD = process.env.FAMILY_PASSWORD || 'Bruno';

// Verify password from request header
function verifyPassword(req) {
  const password = req.headers['x-family-password'];
  return password === FAMILY_PASSWORD;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Family-Password');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify authentication
  if (!verifyPassword(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { year } = req.query;

  if (!year) {
    return res.status(400).json({ error: 'Year parameter is required' });
  }

  const redisKey = `family-calendar:weeks:${year}`;

  try {
    if (req.method === 'GET') {
      const weeks = await redis.get(redisKey);
      return res.status(200).json({
        id: 1,
        name: 'Family Calendar',
        year: parseInt(year),
        weeks: weeks || []
      });
    }

    if (req.method === 'PUT') {
      const { weeks } = req.body;

      if (!Array.isArray(weeks)) {
        return res.status(400).json({ error: 'Weeks must be an array' });
      }

      await redis.set(redisKey, weeks);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Redis error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
