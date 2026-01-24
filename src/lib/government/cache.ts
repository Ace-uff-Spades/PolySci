import { db } from '../firebase';
import { GovernmentData } from './index';
import crypto from 'crypto';

const CACHE_COLLECTION = 'government_data_cache';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours (government data updates less frequently than news)

interface CachedGovernmentDataEntry {
  topic: string;
  data: GovernmentData;
  cachedAt: number;
  expiresAt: number;
}

function generateCacheKey(topic: string): string {
  // Normalize topic for consistent caching
  const normalized = topic.toLowerCase().trim();
  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Get cached government data for a topic
 */
export async function getCachedGovernmentData(
  topic: string
): Promise<GovernmentData | null> {
  const cacheKey = generateCacheKey(topic);

  try {
    const doc = await db.collection(CACHE_COLLECTION).doc(cacheKey).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as CachedGovernmentDataEntry;

    if (Date.now() > data.expiresAt) {
      return null; // Cache expired
    }

    return data.data;
  } catch (error) {
    console.error('Government data cache read error:', error);
    return null; // Fail open - if cache fails, fetch fresh
  }
}

/**
 * Cache government data for a topic
 */
export async function cacheGovernmentData(
  topic: string,
  data: GovernmentData
): Promise<void> {
  const cacheKey = generateCacheKey(topic);
  const now = Date.now();

  const entry: CachedGovernmentDataEntry = {
    topic: topic.toLowerCase().trim(),
    data,
    cachedAt: now,
    expiresAt: now + CACHE_TTL_MS,
  };

  try {
    await db.collection(CACHE_COLLECTION).doc(cacheKey).set(entry);
  } catch (error) {
    console.error('Government data cache write error:', error);
    // Fail silently - caching is optimization, not critical path
  }
}

/**
 * Clear expired cache entries (can be run periodically)
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const now = Date.now();
    const snapshot = await db
      .collection(CACHE_COLLECTION)
      .where('expiresAt', '<', now)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
}
