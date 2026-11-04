import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

export interface IFirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const STORAGE_KEY = 'badminton_firebase_config';

/**
 * Lấy cấu hình Firebase:
 * 1. Ưu tiên biến môi trường Vite (.env hoặc Environment Variables trên Netlify)
 * 2. Dự phòng cấu hình người dùng nhập qua giao diện modal (lưu trong localStorage)
 */
export function getStoredFirebaseConfig(): IFirebaseConfig | null {
  if (import.meta.env.VITE_FIREBASE_DATABASE_URL) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.databaseURL) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Lỗi đọc cấu hình Firebase từ localStorage', err);
  }

  return null;
}

/**
 * Lưu cấu hình Firebase thủ công nếu người dùng nhập qua modal
 */
export function saveFirebaseConfig(config: IFirebaseConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  initFirebase();
}

let app: FirebaseApp | null = null;
let database: Database | null = null;

export function initFirebase(): { app: FirebaseApp | null; database: Database | null } {
  const config = getStoredFirebaseConfig();
  if (!config || !config.databaseURL) {
    return { app: null, database: null };
  }

  try {
    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      app = initializeApp(config);
    }
    database = getDatabase(app);
    return { app, database };
  } catch (err) {
    console.error('Không thể khởi tạo Firebase:', err);
    return { app: null, database: null };
  }
}

export function getFirebaseDatabase(): Database | null {
  if (!database) {
    initFirebase();
  }
  return database;
}
