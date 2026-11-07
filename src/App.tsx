import React, { useState } from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import {
  Header,
  StandingsView,
  MatchesView,
  KnockoutBracketView,
  type MainTab,
} from './components/public';
import { RulesView } from './components/public/RulesView';
import {
  CategoryManager,
  GroupAndTeamManager,
  FixtureManager,
  KnockoutManager,
  AdminAuthModal,
  DatabaseConfigModal,
  WebsiteContentManager,
} from './components/admin';
import {
  RefreshCw,
  Database,
  Lock,
  Sparkles,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';

const TournamentDashboard: React.FC = () => {
  const {
    tournament,
    isAdmin,
    isLoading,
    isRealtimeConnected,
    connectionError,
    initializeNewTournament,
    reloadTournament,
  } = useTournament();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<MainTab>('STANDINGS');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  // Cập nhật tiêu đề trang web động
  React.useEffect(() => {
    if (tournament?.contentConfig?.websiteTitle) {
      document.title = tournament.contentConfig.websiteTitle;
    } else if (tournament?.name) {
      document.title = `${tournament.name} - Quản Lý Giải Cầu Lông`;
    }
  }, [tournament]);

  // Chọn Category hợp lệ
  const activeCategory = tournament
    ? tournament.categories.find((c) => c.id === selectedCategoryId) ||
      tournament.categories[0]
    : null;

  // 1. Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070d19] text-white">
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">Đang kết nối Realtime Database...</p>
          <p className="text-[11px] text-slate-500">Đồng bộ trực tiếp dữ liệu giải đấu</p>
        </div>
      </div>
    );
  }

  // 2. Màn hình thông báo thân thiện khi chưa kết nối được
  if (!tournament && connectionError) {
    const isPermissionError =
      connectionError.toLowerCase().includes('permission') ||
      connectionError.toLowerCase().includes('phân quyền');

    return (
      <div className="min-h-screen bg-[#070d19] text-white flex flex-col font-sans">
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery=""
          onSearchChange={() => {}}
        />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0c1524] rounded-3xl shadow-2xl border border-[#16263f] overflow-hidden text-center p-6 sm:p-8 space-y-5">
            {/* Friendly Icon */}
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-950">
              <WifiOff className="w-7 h-7" />
            </div>

            {/* Friendly Title & Message */}
            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                Tạm Thời Gián Đoạn Kết Nối
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hệ thống tạm thời chưa thể kết nối tới máy chủ dữ liệu giải đấu. Vui lòng kiểm tra lại đường truyền mạng hoặc thử kết nối lại.
              </p>
            </div>

            {/* Subtle Status Notice */}
            <div className="bg-[#091120] rounded-xl p-3 border border-[#16263f] text-[11px] text-slate-400">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Trạng thái:</span>
              <span className="text-amber-300 font-medium">
                {isPermissionError
                  ? 'Máy chủ đang cần cấp quyền truy cập dữ liệu.'
                  : connectionError.includes('Chưa khởi tạo')
                  ? 'Chưa tìm thấy cấu hình kết nối máy chủ.'
                  : 'Mất kết nối mạng Internet hoặc máy chủ đang bận.'}
              </span>
            </div>

            {/* Permission hint for BTC if needed */}
            {isPermissionError && (
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-200 text-left space-y-1">
                <span className="font-bold text-amber-300 block">Dành cho Ban tổ chức:</span>
                <span>Vui lòng kiểm tra quyền truy cập (Rules) trên Firebase Console: đặt <code>.read: true, .write: true</code>.</span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => reloadTournament()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-black font-black text-xs rounded-xl transition shadow-lg shadow-cyan-600/25 cursor-pointer uppercase tracking-wider"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Thử Lại Kết Nối
              </button>

              <button
                type="button"
                onClick={() => setIsDbModalOpen(true)}
                className="w-full py-2 px-4 bg-[#091120] hover:bg-[#11233e] text-slate-300 border border-[#16263f] hover:border-cyan-500/40 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Cài Đặt Kết Nối Máy Chủ
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-[#08101c] border-t border-[#14233a] py-4 mt-auto text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© 2026 CLB Cầu Lông Chí Thảo</p>
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className="text-slate-400 hover:text-cyan-400 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Ban tổ chức</span>
            </button>
          </div>
        </footer>

        <DatabaseConfigModal
          isOpen={isDbModalOpen}
          onClose={() => setIsDbModalOpen(false)}
        />
        <AdminAuthModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
        />
      </div>
    );
  }

  // 3. Database trống
  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#070d19] text-white flex flex-col font-sans">
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery=""
          onSearchChange={() => {}}
        />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#0c1524] rounded-3xl shadow-2xl border border-[#16263f] p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">Cơ Sở Dữ Liệu Đang Trống</h2>
              <p className="text-xs text-slate-400 mt-1">
                Đã kết nối thành công tới Firebase Database nhưng chưa có giải đấu nào.
              </p>
            </div>
            <button
              type="button"
              disabled={isInitializing}
              onClick={async () => {
                try {
                  setIsInitializing(true);
                  await initializeNewTournament('Giải Cầu Lông CLB Chí Thảo 2026');
                } catch (e) {
                  alert((e as Error).message);
                } finally {
                  setIsInitializing(false);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-black font-black text-xs rounded-xl transition shadow-lg shadow-cyan-600/20 cursor-pointer disabled:opacity-50"
            >
              {isInitializing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Khởi Tạo Giải Đấu Lên Database
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isEditingLocked = !isRealtimeConnected || !!connectionError;

  return (
    <div className="min-h-screen bg-[#070d19] text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-black">
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Banner Khóa Chỉnh Sửa nếu mất mạng trong lúc dùng */}
        {isEditingLocked && (
          <div className="bg-rose-950/80 border border-rose-500/60 text-rose-200 rounded-xl p-3.5 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="text-xs font-bold">
                CHẾ ĐỘ CHỈ ĐỌC: Đang mất kết nối với Database! Toàn bộ thao tác sửa đã bị khóa để bảo toàn dữ liệu.
              </p>
            </div>
            <button
              onClick={() => reloadTournament()}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition shrink-0 cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Category Pills Selector */}
        <CategoryManager
          selectedCategoryId={activeCategory?.id || ''}
          onSelectCategory={setSelectedCategoryId}
        />

        {/* Dynamic Tab Body */}
        {activeCategory ? (
          <div>
            {/* TAB: THỂ LỆ */}
            {activeTab === 'RULES' && (
              <RulesView onGoToStandings={() => setActiveTab('STANDINGS')} />
            )}

            {/* TAB: BẢNG ĐIỂM (Bảng điểm + Lịch đấu theo từng Bảng) */}
            {activeTab === 'STANDINGS' && (
              <StandingsView category={activeCategory} searchQuery={searchQuery} />
            )}

            {/* TAB: VÒNG LOẠI (Knockout Bracket & Podium) */}
            {activeTab === 'BRACKET' && (
              <KnockoutBracketView category={activeCategory} />
            )}

            {/* ADMIN TABS */}
            {isAdmin && activeTab === 'MATCHES_ADMIN' && (
              <MatchesView category={activeCategory} searchQuery={searchQuery} />
            )}

            {isAdmin && activeTab === 'FIXTURES_ADMIN' && (
              <FixtureManager category={activeCategory} />
            )}

            {isAdmin && activeTab === 'TEAMS_GROUPS' && (
              <GroupAndTeamManager category={activeCategory} />
            )}

            {isAdmin && activeTab === 'KNOCKOUT_ADMIN' && (
              <KnockoutManager category={activeCategory} />
            )}

            {isAdmin && activeTab === 'WEBSITE_CONTENT' && (
              <WebsiteContentManager />
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs bg-[#0c1524] rounded-2xl border border-[#16263f]">
            Không tìm thấy nội dung thi đấu nào. Vui lòng bấm "Thêm Nội Dung" ở trên!
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#08101c] border-t border-[#14233a] py-4 mt-auto text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 {tournament.contentConfig?.footerText || `${tournament.name} • CLB Cầu Lông Chí Thảo`}</p>
          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            className="text-slate-400 hover:text-cyan-400 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Ban tổ chức (Quản trị viên)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Ban tổ chức</span>
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Admin Auth Modal */}
      <AdminAuthModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {/* Database Config Modal */}
      <DatabaseConfigModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <TournamentProvider>
      <TournamentDashboard />
    </TournamentProvider>
  );
}
