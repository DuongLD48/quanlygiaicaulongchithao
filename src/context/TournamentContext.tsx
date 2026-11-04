import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Tournament } from '../models';
import { TournamentRepository } from '../services/TournamentRepository';

interface TournamentContextType {
  tournament: Tournament | null;
  isAdmin: boolean;
  isLoading: boolean;
  isRealtimeConnected: boolean;
  connectionError: string | null;
  loginAdmin: (pin: string) => Promise<boolean>;
  logoutAdmin: () => void;
  updateAdminPin: (newPin: string) => Promise<void>;
  saveTournament: (updatedTournament: Tournament) => Promise<void>;
  initializeNewTournament: (name?: string) => Promise<void>;
  reloadTournament: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

const ADMIN_SESSION_KEY = 'badminton_admin_auth_session';
const DEFAULT_TOURNAMENT_ID = 'tourney_badminton_main';

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Bắt đầu với null, không dùng dữ liệu giả lập/bộ nhớ đệm
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const repository = useMemo(() => TournamentRepository.getInstance(), []);

  // Đăng ký lắng nghe Firebase Realtime Database
  useEffect(() => {
    // Kiểm tra phiên admin
    const savedAdminSession = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (savedAdminSession === 'true') {
      setIsAdmin(true);
    }

    const unsubscribe = repository.subscribe(DEFAULT_TOURNAMENT_ID, {
      onData: (loadedTournament) => {
        setTournament(loadedTournament);
        setIsLoading(false);
        // Nếu nhận dữ liệu thành công thì xóa thông báo lỗi (nếu có)
        setConnectionError(null);
      },
      onError: (error) => {
        console.error('Lỗi từ Firebase Database:', error);
        setConnectionError(error.message);
        setIsLoading(false);
      },
      onConnectionChange: (connected) => {
        setIsRealtimeConnected(connected);
        if (connected) {
          setConnectionError((prev) => (prev?.includes('Offline') ? null : prev));
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [repository]);

  const loginAdmin = async (pin: string): Promise<boolean> => {
    if (!tournament) return false;
    const isValid = await tournament.verifyAdminPin(pin);
    if (isValid) {
      setIsAdmin(true);
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  };

  const updateAdminPin = async (newPin: string): Promise<void> => {
    if (!tournament) throw new Error('Chưa tải được dữ liệu giải đấu!');
    if (!isRealtimeConnected || connectionError) {
      throw new Error('Mất kết nối Database! Không thể đổi mã PIN.');
    }
    await tournament.setAdminPin(newPin);
    await saveTournament(tournament);
  };

  const saveTournament = async (updatedTournament: Tournament): Promise<void> => {
    if (!isRealtimeConnected || connectionError) {
      const msg = connectionError
        ? `Không thể lưu dữ liệu: ${connectionError}`
        : 'Không thể lưu: Đang mất kết nối với Firebase Realtime Database!';
      alert(msg);
      throw new Error(msg);
    }

    // Đẩy trực tiếp lên Firebase Realtime Database
    await repository.save(updatedTournament);
    // Cập nhật state nội bộ
    setTournament(Tournament.fromJSON(updatedTournament.toJSON()));
  };

  // Khởi tạo giải đấu mới trực tiếp lên Firebase (chỉ dùng khi DB trống)
  const initializeNewTournament = async (name: string = 'Giải Cầu Lông Mở Rộng 2026'): Promise<void> => {
    if (!isRealtimeConnected) {
      throw new Error('Không thể khởi tạo khi chưa kết nối được tới Database!');
    }
    const newTourney = Tournament.createDefaultTournament(name);
    await repository.save(newTourney);
    setTournament(newTourney);
  };

  const reloadTournament = async (): Promise<void> => {
    setIsLoading(true);
    setConnectionError(null);
    try {
      const loaded = await repository.get(DEFAULT_TOURNAMENT_ID);
      setTournament(loaded);
      setIsRealtimeConnected(repository.isRealtimeConnected());
    } catch (err) {
      setConnectionError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TournamentContext.Provider
      value={{
        tournament,
        isAdmin,
        isLoading,
        isRealtimeConnected,
        connectionError,
        loginAdmin,
        logoutAdmin,
        updateAdminPin,
        saveTournament,
        initializeNewTournament,
        reloadTournament,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = (): TournamentContextType => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
