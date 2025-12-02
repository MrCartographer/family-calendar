import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const FAMILY_PASSWORD = process.env.FAMILY_PASSWORD || 'Bruno';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Family-Password');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const password = req.headers['x-family-password'];
  if (password !== FAMILY_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { year, weeks } = req.body;

  if (!year || !Array.isArray(weeks)) {
    return res.status(400).json({ error: 'Year and weeks array are required' });
  }

  try {
    const redisKey = `family-calendar:weeks:${year}`;

    // Check if data already exists
    const existing = await redis.get(redisKey);
    if (existing && existing.length > 0) {
      return res.status(200).json({
        success: false,
        message: `Data for ${year} already exists in Redis (${existing.length} weeks). Skipping to avoid overwrite.`,
        skipped: true
      });
    }

    // Migrate the data
    await redis.set(redisKey, weeks);

    return res.status(200).json({
      success: true,
      message: `Successfully migrated ${weeks.length} weeks for ${year}`
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: 'Migration failed', details: error.message });
  }
}
