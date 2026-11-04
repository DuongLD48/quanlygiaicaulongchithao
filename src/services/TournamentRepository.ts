import { ref, onValue, set, get as fbGet } from 'firebase/database';
import { Tournament, type ITournamentJSON } from '../models';
import { getFirebaseDatabase } from './firebase';

export interface ITournamentRepository {
  get(tournamentId: string): Promise<Tournament | null>;
  save(tournament: Tournament): Promise<void>;
  subscribe(
    tournamentId: string,
    callbacks: {
      onData: (tournament: Tournament | null) => void;
      onError: (error: Error) => void;
      onConnectionChange: (connected: boolean) => void;
    }
  ): () => void;
  isRealtimeConnected(): boolean;
}

export class TournamentRepository implements ITournamentRepository {
  private static instance: TournamentRepository;
  private isConnected: boolean = false;

  private constructor() {
    // Dọn sạch toàn bộ cache tournament cũ trong localStorage để đảm bảo chỉ dùng 1 nguồn database duy nhất
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('badminton_tourney_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Bỏ qua lỗi trình duyệt nếu có
    }
  }

  public static getInstance(): TournamentRepository {
    if (!TournamentRepository.instance) {
      TournamentRepository.instance = new TournamentRepository();
    }
    return TournamentRepository.instance;
  }

  public isRealtimeConnected(): boolean {
    return this.isConnected && getFirebaseDatabase() !== null;
  }

  public async get(tournamentId: string): Promise<Tournament | null> {
    const db = getFirebaseDatabase();
    if (!db) {
      throw new Error('Chưa kết nối Firebase Database');
    }

    const tournamentRef = ref(db, `tournaments/${tournamentId}`);
    const snapshot = await fbGet(tournamentRef);
    if (snapshot.exists()) {
      return Tournament.fromJSON(snapshot.val() as ITournamentJSON);
    }
    return null;
  }

  public async save(tournament: Tournament): Promise<void> {
    const db = getFirebaseDatabase();
    if (!db || !this.isConnected) {
      throw new Error('Mất kết nối với Firebase Database! Không thể lưu dữ liệu.');
    }

    // Loại bỏ triệt để các thuộc tính undefined để Firebase không báo lỗi 'value argument contains undefined'
    const rawJson = tournament.toJSON();
    const cleanJson = JSON.parse(JSON.stringify(rawJson));

    const tournamentRef = ref(db, `tournaments/${tournament.id}`);
    await set(tournamentRef, cleanJson);
  }

  public subscribe(
    tournamentId: string,
    callbacks: {
      onData: (tournament: Tournament | null) => void;
      onError: (error: Error) => void;
      onConnectionChange: (connected: boolean) => void;
    }
  ): () => void {
    const db = getFirebaseDatabase();

    if (!db) {
      this.isConnected = false;
      callbacks.onConnectionChange(false);
      callbacks.onError(new Error('Chưa khởi tạo được Firebase Realtime Database. Vui lòng kiểm tra cấu hình.'));
      return () => {};
    }

    // 1. Lắng nghe trạng thái kết nối mạng thời gian thực từ Firebase (.info/connected)
    const connectedRef = ref(db, '.info/connected');
    const unsubConnected = onValue(connectedRef, (snap) => {
      const isOnline = snap.val() === true;
      this.isConnected = isOnline;
      callbacks.onConnectionChange(isOnline);
      if (!isOnline) {
        callbacks.onError(new Error('Mất kết nối mạng tới Firebase Database (Offline).'));
      }
    });

    // 2. Lắng nghe dữ liệu giải đấu
    const tournamentRef = ref(db, `tournaments/${tournamentId}`);
    const unsubData = onValue(
      tournamentRef,
      (snapshot) => {
        if (snapshot.exists()) {
          try {
            const data = snapshot.val() as ITournamentJSON;
            callbacks.onData(Tournament.fromJSON(data));
          } catch (err) {
            callbacks.onError(new Error('Dữ liệu trên Firebase bị lỗi định dạng: ' + (err as Error).message));
          }
        } else {
          // Database trống (chưa có dữ liệu giải đấu)
          callbacks.onData(null);
        }
      },
      (error) => {
        this.isConnected = false;
        callbacks.onConnectionChange(false);
        let errorMsg = error.message;
        if (error.message.toLowerCase().includes('permission_denied') || error.message.toLowerCase().includes('permission denied')) {
          errorMsg = 'Lỗi phân quyền Firebase (Permission Denied): Cần cấu hình Rules trong Firebase Console cho phép .read: true và .write: true.';
        }
        callbacks.onError(new Error(errorMsg));
      }
    );

    return () => {
      unsubConnected();
      unsubData();
    };
  }
}
