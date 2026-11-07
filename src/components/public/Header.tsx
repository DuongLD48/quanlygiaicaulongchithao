import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Search, X } from 'lucide-react';

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
  const { isAdmin } = useTournament();

  return (
    <header className="bg-[#091120]/95 backdrop-blur-md border-b border-[#14233a] sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Left: Primary Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-0.5 scrollbar-none">
            {/* Tab: Thể lệ */}
            <button
              type="button"
              onClick={() => onTabChange('RULES')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-black tracking-wide uppercase transition whitespace-nowrap cursor-pointer ${
                activeTab === 'RULES'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-[#11233e] border border-[#1d3252]'
              }`}
            >
              <span>THỂ LỆ</span>
            </button>

            {/* Tab: Bảng Điểm */}
            <button
              type="button"
              onClick={() => onTabChange('STANDINGS')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-black tracking-wide uppercase transition whitespace-nowrap cursor-pointer ${
                activeTab === 'STANDINGS'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-[#11233e] border border-[#1d3252]'
              }`}
            >
              <span>BẢNG ĐIỂM</span>
            </button>

            {/* Tab: Vòng Loại */}
            <button
              type="button"
              onClick={() => onTabChange('BRACKET')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-black tracking-wide uppercase transition whitespace-nowrap cursor-pointer ${
                activeTab === 'BRACKET'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-[#11233e] border border-[#1d3252]'
              }`}
            >
              <span>VÒNG LOẠI</span>
            </button>

            {/* Admin Tabs */}
            {isAdmin && (
              <>
                <span className="text-[#1e314f] px-0.5">|</span>

                <button
                  type="button"
                  onClick={() => onTabChange('MATCHES_ADMIN')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-black tracking-wide uppercase transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'MATCHES_ADMIN'
                      ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                      : 'text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
                  }`}
                >
                  <span>Nhập Tỷ Số</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('FIXTURES_ADMIN')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-black tracking-wide uppercase transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'FIXTURES_ADMIN'
                      ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                      : 'text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
                  }`}
                >
                  <span>Lịch & Sân</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('TEAMS_GROUPS')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-black tracking-wide uppercase transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'TEAMS_GROUPS'
                      ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                      : 'text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
                  }`}
                >
                  <span>Đội & Bảng</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('KNOCKOUT_ADMIN')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-black tracking-wide uppercase transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'KNOCKOUT_ADMIN'
                      ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                      : 'text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
                  }`}
                >
                  <span>Cài Vòng Trong</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('WEBSITE_CONTENT')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-black tracking-wide uppercase transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'WEBSITE_CONTENT'
                      ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                      : 'text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
                  }`}
                >
                  <span>Sửa Nội Dung Web</span>
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
