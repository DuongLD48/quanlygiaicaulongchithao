import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  MapPin,
  Search,
  X,
  BookOpen,
  Trophy,
  GitBranch,
  Calendar,
  Shuffle,
  Users,
  Layers,
} from 'lucide-react';

export type MainTab =
  | 'STANDINGS'
  | 'BRACKET'
  | 'RULES'
  | 'MATCHES_ADMIN'
  | 'FIXTURES_ADMIN'
  | 'TEAMS_GROUPS'
  | 'KNOCKOUT_ADMIN';

interface Props {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}) => {
  const { tournament, isAdmin } = useTournament();

  return (
    <header className="bg-[#091120]/95 backdrop-blur-md border-b border-[#14233a] sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 space-y-2.5">
        {/* Row 1: Brand Logo & Tournament Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-black text-sm shrink-0 shadow-md shadow-cyan-500/20">
            🏸
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-xs sm:text-sm text-white tracking-wide truncate">
              {tournament ? tournament.name : 'Giải Cầu Lông'}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-cyan-400" />
                {tournament ? tournament.location : 'CLB Cầu Lông'}
              </span>
              {tournament && (
                <span className="hidden sm:inline-block text-slate-500">• {tournament.courts.length} Sân</span>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Nav Tabs + Search Bar (Single unified navigation line) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-[#14233a]">
          {/* Left: Primary Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-0.5 scrollbar-none">
            {/* Tab: Thể lệ */}
            <button
              type="button"
              onClick={() => onTabChange('RULES')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black tracking-wide uppercase transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeTab === 'RULES'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-[#11233e] border border-[#1d3252]'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>THỂ LỆ</span>
            </button>

            {/* Tab: Bảng Điểm */}
            <button
              type="button"
              onClick={() => onTabChange('STANDINGS')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black tracking-wide uppercase transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeTab === 'STANDINGS'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-[#11233e] border border-[#1d3252]'
              }`}
            >
              <Trophy className="w-3 h-3" />
              <span>BẢNG ĐIỂM</span>
            </button>

            {/* Tab: Vòng Loại */}
            <button
              type="button"
              onClick={() => onTabChange('BRACKET')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black tracking-wide uppercase transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeTab === 'BRACKET'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-[#11233e] border border-[#1d3252]'
              }`}
            >
              <GitBranch className="w-3 h-3" />
              <span>VÒNG LOẠI</span>
            </button>

            {/* Admin Tabs */}
            {isAdmin && (
              <>
                <span className="text-[#1e314f] px-0.5">|</span>

                <button
                  type="button"
                  onClick={() => onTabChange('MATCHES_ADMIN')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-black tracking-wide uppercase transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                    activeTab === 'MATCHES_ADMIN'
                      ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                      : 'text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>Nhập Tỷ Số</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('FIXTURES_ADMIN')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-black tracking-wide uppercase transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                    activeTab === 'FIXTURES_ADMIN'
                      ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                      : 'text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
                  }`}
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Lịch & Sân</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('TEAMS_GROUPS')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-black tracking-wide uppercase transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                    activeTab === 'TEAMS_GROUPS'
                      ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                      : 'text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>Đội & Bảng</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('KNOCKOUT_ADMIN')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-black tracking-wide uppercase transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                    activeTab === 'KNOCKOUT_ADMIN'
                      ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                      : 'text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Cài Vòng Trong</span>
                </button>
              </>
            )}
          </nav>

          {/* Right: Search Bar */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-3.5 h-3.5 text-cyan-400/80 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm VĐV, Sân, Đội..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#0a1322] text-[11px] text-white placeholder-slate-500 pl-8 pr-7 py-1.5 rounded-lg border border-[#192b45] focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[11px]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
