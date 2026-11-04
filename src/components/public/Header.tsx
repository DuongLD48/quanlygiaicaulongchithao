import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { AdminAuthModal } from '../admin/AdminAuthModal';
import { DatabaseConfigModal } from '../admin/DatabaseConfigModal';
import {
  Trophy,
  ShieldCheck,
  Lock,
  Database,
  Search,
  Wifi,
  WifiOff,
  AlertTriangle,
  Calendar,
  MapPin,
  X,
} from 'lucide-react';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<Props> = ({ searchQuery, onSearchChange }) => {
  const { tournament, isAdmin, isRealtimeConnected, connectionError } = useTournament();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  return (
    <>
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Logo & Tên giải đấu */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                <Trophy className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-base sm:text-lg tracking-tight text-white line-clamp-1">
                    {tournament ? tournament.name : 'Quản Lý Giải Cầu Lông'}
                  </h1>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {tournament ? tournament.location : 'CLB Cầu Lông'}
                  </span>
                  {tournament?.startDate && (
                    <span className="flex items-center gap-1 hidden sm:flex">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {tournament.startDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Thanh Tìm Kiếm Trực Tiếp (Search bar) */}
            <div className="flex-1 max-w-md w-full relative">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm theo tên VĐV, tên đội, bảng, sân..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-800 text-xs sm:text-sm text-white placeholder-slate-400 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Trạng thái DB & Nút Quản trị */}
            <div className="flex items-center gap-2 self-end md:self-center">
              {/* Nút Cấu hình DB */}
              <button
                type="button"
                onClick={() => setIsDbModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  connectionError
                    ? 'bg-rose-950/70 border-rose-600/60 text-rose-300 hover:bg-rose-900/80'
                    : isRealtimeConnected
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-amber-950/70 border-amber-600/60 text-amber-300 hover:bg-amber-900/80'
                }`}
                title={connectionError || (isRealtimeConnected ? 'Firebase Realtime: Đã kết nối' : 'Mất kết nối')}
              >
                {connectionError ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span className="hidden sm:inline">Lỗi kết nối DB</span>
                  </>
                ) : isRealtimeConnected ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Realtime</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Offline</span>
                  </>
                )}
                <Database className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {/* Nút Quản Trị Viên (Xác thực PIN) */}
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                  isAdmin
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                }`}
              >
                {isAdmin ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Quản Trị Viên</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Đăng Nhập Admin</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <AdminAuthModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      <DatabaseConfigModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </>
  );
};
