import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  Search,
  X,
  BookOpen,
  Trophy,
  GitBranch,
  Calendar,
  Shuffle,
  Users,
  Layers,
  Globe,
} from 'lucide-react';

export type MainTab =
  | 'STANDINGS'
  | 'BRACKET'
  | 'RULES'
  | 'MATCHES_ADMIN'
  | 'FIXTURES_ADMIN'
  | 'TEAMS_GROUPS'
  | 'KNOCKOUT_ADMIN'
  | 'WEBSITE_CONTENT';

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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Left: Primary Navigation Tabs with Badminton Racket Brand Icon */}
          <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none">
            {/* Icon Vợt Cầu Lông Tiêu Đề */}
            <div
              title={tournament?.contentConfig?.tournamentName || tournament?.name || 'Giải Cầu Lông'}
              className="flex items-center gap-1.5 shrink-0 pr-1.5 border-r border-[#192b45]"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-md shadow-cyan-950/50">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4 text-cyan-400"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <ellipse cx="14" cy="7" rx="5" ry="6" stroke="currentColor" fill="#081c33" fillOpacity="0.6" />
                  <line x1="12" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.7" />
                  <line x1="16" y1="2" x2="16" y2="12" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.7" />
                  <line x1="9.5" y1="5" x2="18.5" y2="5" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.7" />
                  <line x1="9.5" y1="9" x2="18.5" y2="9" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.7" />
                  <line x1="10.5" y1="11.5" x2="5" y2="17" stroke="currentColor" strokeWidth="2" />
                  <line x1="5" y1="17" x2="2.5" y2="19.5" stroke="#f8fafc" strokeWidth="2.8" strokeLinecap="square" />
                  <path d="M18 16.5 L21.5 14.5 L22 17.5 Z" fill="#fbbf24" stroke="#fbbf24" strokeWidth="0.8" />
                  <circle cx="17.5" cy="17" r="1.2" fill="#ffffff" />
                </svg>
              </div>
              <span className="hidden xl:inline font-black text-[11px] text-white uppercase tracking-wider truncate max-w-[120px]">
                {tournament?.contentConfig?.tournamentName
                  ? tournament.contentConfig.tournamentName.replace('Giải Cầu Lông ', '')
                  : tournament?.name || 'Cầu Lông'}
              </span>
            </div>

            <nav className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
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

                <button
                  type="button"
                  onClick={() => onTabChange('WEBSITE_CONTENT')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-black tracking-wide uppercase transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                    activeTab === 'WEBSITE_CONTENT'
                      ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                      : 'text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Sửa Nội Dung Web</span>
                </button>
              </>
            )}
          </nav>
        </div>

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
