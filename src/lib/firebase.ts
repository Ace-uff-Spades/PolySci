import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let dbInstance: Firestore | null = null;

function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Handle private key formatting - it may come with escaped newlines or quotes
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    // Remove surrounding quotes if present
    privateKey = privateKey.replace(/^["']|["']$/g, '');
    // Replace escaped newlines (both \\n and \n formats)
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // Check each variable individually for better error messages
  const missing: string[] = [];
  if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID.trim() === '') {
    missing.push('FIREBASE_PROJECT_ID');
  }
  if (!process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL.trim() === '') {
    missing.push('FIREBASE_CLIENT_EMAIL');
  }
  if (!privateKey || privateKey.trim() === '') {
    missing.push('FIREBASE_PRIVATE_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      `Firebase credentials not properly configured. Missing or empty: ${missing.join(', ')}. ` +
      `Please check your .env.local file and ensure all Firebase environment variables are set.`
    );
  }

  try {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  } catch (error) {
    throw new Error(`Failed to parse private key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function getDb(): Firestore | null {
  // Check if credentials are available before initializing
  const hasCredentials = 
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;
  
  if (!hasCredentials) {
    return null; // Return null if credentials missing
  }

  if (!dbInstance) {
    try {
      const app = getFirebaseApp();
      dbInstance = getFirestore(app);
    } catch (error) {
      // If initialization fails, return null
      return null;
    }
  }
  return dbInstance;
}

// Lazy export - only initialize when accessed
// Returns a proxy that handles missing credentials gracefully
export const db = new Proxy({} as Firestore, {
  get(_target, prop) {
    const db = getDb();
    if (!db) {
      // Return a proxy for collection() that returns a no-op document reference
      if (prop === 'collection') {
        return () => {
          // Return a proxy that makes all methods no-ops
          return new Proxy({} as any, {
            get(_target, docProp) {
              if (docProp === 'doc') {
                return () => new Proxy({} as any, {
                  get(_target, methodProp) {
                    if (methodProp === 'get' || methodProp === 'set') {
                      return async () => ({ exists: false, data: () => null });
                    }
                    return () => {};
                  },
                });
              }
              return () => new Proxy({} as any, {
                get() {
                  return async () => ({ exists: false, data: () => null });
                },
              });
            },
          });
        };
      }
      // For other properties, return a no-op
      return () => {};
    }
    const value = (db as any)[prop];
    if (typeof value === 'function') {
      return value.bind(db);
    }
    return value;
  },
}) as Firestore;
