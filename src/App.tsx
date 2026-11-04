import React, { useState } from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import {
  Header,
  StandingsView,
  MatchesView,
  KnockoutBracketView,
} from './components/public';
import {
  CategoryManager,
  GroupAndTeamManager,
  FixtureManager,
  KnockoutManager,
} from './components/admin';
import {
  Calendar,
  Trophy,
  GitBranch,
  Users,
  Shuffle,
  Shield,
  Layers,
  Sparkles,
  AlertOctagon,
  RefreshCw,
  Database,
  Lock,
} from 'lucide-react';

type MainTab = 'MATCHES' | 'STANDINGS' | 'BRACKET' | 'TEAMS_GROUPS' | 'FIXTURES_ADMIN' | 'KNOCKOUT_ADMIN';

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
  const [activeTab, setActiveTab] = useState<MainTab>('MATCHES');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);

  // Đảm bảo chọn đúng category khi tournament có dữ liệu
  const activeCategory = tournament
    ? tournament.categories.find((c) => c.id === selectedCategoryId) ||
      tournament.categories[0]
    : null;

  // 1. Màn hình Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-700">Đang kết nối Firebase Realtime Database...</p>
          <p className="text-xs text-slate-400">Đồng bộ trực tiếp từ máy chủ đám mây, không lưu cache bộ nhớ đệm</p>
        </div>
      </div>
    );
  }

  // 2. Màn hình Lỗi kết nối (Khi không tải được dữ liệu và có lỗi từ Firebase)
  if (!tournament && connectionError) {
    const isPermissionError =
      connectionError.toLowerCase().includes('permission') ||
      connectionError.toLowerCase().includes('phân quyền');

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
        <Header searchQuery="" onSearchChange={() => {}} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-rose-200 overflow-hidden">
            <div className="bg-rose-50 border-b border-rose-100 p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-rose-900">
                  Không thể kết nối đến Firebase Database!
                </h2>
                <p className="text-xs text-rose-700 mt-1 font-medium">
                  Hệ thống không sử dụng dữ liệu mẫu hay bộ nhớ đệm cục bộ. Mọi thao tác chỉnh sửa đã bị KHÓA.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-700 space-y-1 font-mono break-all">
                <span className="font-bold text-slate-500 block uppercase font-sans text-[11px]">Thông báo lỗi từ hệ thống:</span>
                <span className="text-rose-600">{connectionError}</span>
              </div>

              {isPermissionError && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <Database className="w-4 h-4" /> Hướng dẫn khắc phục lỗi Quyền truy cập (Rules):
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-amber-950 font-sans">
                    <li>Vào <b>Firebase Console</b> &gt; chọn dự án của bạn.</li>
                    <li>Vào mục <b>Realtime Database</b> &gt; chọn tab <b>Rules (Quy tắc)</b>.</li>
                    <li>Sửa quy tắc thành:
                      <pre className="mt-1 bg-amber-100/80 p-2 rounded-lg font-mono text-[11px] text-amber-900">
{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
                      </pre>
                    </li>
                    <li>Bấm nút <b>Publish (Xuất bản)</b> và nhấn nút "Thử lại kết nối" bên dưới.</li>
                  </ol>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => reloadTournament()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-indigo-100 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Thử Lại Kết Nối
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. Màn hình Cơ sở dữ liệu trống (Chưa có giải đấu trên Firebase Database)
  if (!tournament) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
        <Header searchQuery="" onSearchChange={() => {}} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Cơ Sở Dữ Liệu Đang Trống</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Đã kết nối thành công tới Firebase Database, nhưng chưa có dữ liệu giải đấu nào được khởi tạo.
              </p>
            </div>
            <div className="pt-2">
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
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-indigo-100 disabled:opacity-50 cursor-pointer"
              >
                {isInitializing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                Khởi Tạo Giải Đấu Lên Database
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 4. Màn hình hoạt động bình thường khi đã tải dữ liệu từ Firebase
  const totalTeams = activeCategory ? activeCategory.getAllTeams().length : 0;
  const totalMatches = activeCategory ? activeCategory.getAllMatches().length : 0;
  const finishedMatches = activeCategory
    ? activeCategory.getAllMatches().filter((m) => m.status === 'FINISHED').length
    : 0;

  const isEditingLocked = !isRealtimeConnected || !!connectionError;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Cảnh báo nếu mất kết nối trong lúc đang chạy */}
        {isEditingLocked && (
          <div className="bg-rose-500 text-white rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-extrabold">
                  CHẾ ĐỘ KHÓA CHỈNH SỬA: Mất kết nối tới Database Firebase!
                </p>
                <p className="text-[11px] text-rose-100 mt-0.5">
                  {connectionError || 'Vui lòng kiểm tra đường truyền mạng hoặc cấu hình Database để tiếp tục sửa dữ liệu.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => reloadTournament()}
              className="px-3 py-1.5 bg-white text-rose-700 font-bold rounded-xl text-xs hover:bg-rose-50 transition shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Thử lại
            </button>
          </div>
        )}

        {/* Banner Chào Mừng / Thống Kê Nhanh */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider bg-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-400/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Hệ Thống Quản Lý Giải
              </span>
              {isAdmin && (
                <span className="text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" /> Chế Độ Quản Trị Viên
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-white tracking-tight">
              {tournament.name}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1">
              {tournament.location} • {tournament.courts.length} Sân thi đấu • Nguồn dữ liệu: Firebase Realtime Database
            </p>
          </div>

          {/* Stat Badges */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="px-3.5 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-indigo-200 block font-medium">Tổng Đội</span>
              <span className="text-base sm:text-lg font-black text-white">{totalTeams}</span>
            </div>
            <div className="px-3.5 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-indigo-200 block font-medium">Tổng Trận</span>
              <span className="text-base sm:text-lg font-black text-white">{totalMatches}</span>
            </div>
            <div className="px-3.5 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-indigo-200 block font-medium">Đã Đấu</span>
              <span className="text-base sm:text-lg font-black text-emerald-300">{finishedMatches}</span>
            </div>
          </div>
        </div>

        {/* Thanh chọn Nội Dung Thi Đấu */}
        <CategoryManager
          selectedCategoryId={activeCategory?.id || ''}
          onSelectCategory={setSelectedCategoryId}
        />

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
          {/* Tab 1: Lịch thi đấu & Kết quả */}
          <button
            onClick={() => setActiveTab('MATCHES')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition border ${
              activeTab === 'MATCHES'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Lịch & Tỉ Số
          </button>

          {/* Tab 2: Bảng xếp hạng */}
          <button
            onClick={() => setActiveTab('STANDINGS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition border ${
              activeTab === 'STANDINGS'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            Bảng Xếp Hạng Vòng Bảng
          </button>

          {/* Tab 3: Cây nhánh đấu trực quan */}
          <button
            onClick={() => setActiveTab('BRACKET')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition border ${
              activeTab === 'BRACKET'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4 text-indigo-400" />
            Sơ Đồ Nhánh Knockout
          </button>

          {/* Tab 4 (Admin): Xếp trận & Tinh chỉnh */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('FIXTURES_ADMIN')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition border ${
                activeTab === 'FIXTURES_ADMIN'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                  : 'bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              Bốc Thăm & Sắp Lịch
            </button>
          )}

          {/* Tab 5 (Admin): Quản lý Đội & Bảng */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('TEAMS_GROUPS')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition border ${
                activeTab === 'TEAMS_GROUPS'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                  : 'bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Quản Lý Đội & Bảng
            </button>
          )}

          {/* Tab 6 (Admin): Thiết lập Vòng trong */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('KNOCKOUT_ADMIN')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition border ${
                activeTab === 'KNOCKOUT_ADMIN'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                  : 'bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              Cài Đặt Vòng Trong
            </button>
          )}
        </div>

        {/* Dynamic Tab Body */}
        {activeCategory ? (
          <div>
            {activeTab === 'MATCHES' && (
              <MatchesView category={activeCategory} searchQuery={searchQuery} />
            )}

            {activeTab === 'STANDINGS' && (
              <StandingsView category={activeCategory} searchQuery={searchQuery} />
            )}

            {activeTab === 'BRACKET' && (
              <KnockoutBracketView category={activeCategory} />
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
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200">
            Không tìm thấy nội dung thi đấu nào.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            {tournament.name} • Quản Lý Giải Cầu Lông Thời Gian Thực
          </p>
          <p className="text-slate-400">
            Đồng bộ hóa 100% qua Firebase Realtime Database
          </p>
        </div>
      </footer>
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
