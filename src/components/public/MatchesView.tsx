import React, { useState } from 'react';
import { Category, Match } from '../../models';
import { useTournament } from '../../context/TournamentContext';
import { ScoreModal } from '../admin/ScoreModal';
import {
  Calendar,
  Clock,
  MapPin,
  Play,
  CheckCircle2,
  Filter,
  Trophy,
} from 'lucide-react';

interface Props {
  category: Category;
  searchQuery?: string;
}

export const MatchesView: React.FC<Props> = ({ category, searchQuery = '' }) => {
  const { tournament, saveTournament, isAdmin, isRealtimeConnected, connectionError } = useTournament();

  const [courtFilter, setCourtFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);

  const isLocked = !isRealtimeConnected || !!connectionError;

  // Lấy tất cả trận đấu trong nội dung (Cả Vòng bảng và Knockout)
  const allMatches = category.getAllMatches();

  const query = searchQuery.toLowerCase().trim();

  // Lọc danh sách trận đấu
  const filteredMatches = allMatches.filter((match) => {
    // Lọc theo Sân
    if (courtFilter !== 'ALL' && match.court !== courtFilter) {
      return false;
    }

    // Lọc theo Trạng thái
    if (statusFilter !== 'ALL' && match.status !== statusFilter) {
      return false;
    }

    // Lọc theo Từ khóa tìm kiếm (tên VĐV, tên đội, bảng đấu, mã trận, sân)
    if (query) {
      const matchCodeMatch = match.matchCode.toLowerCase().includes(query);
      const roundMatch = match.roundName.toLowerCase().includes(query);
      const courtMatch = match.court.toLowerCase().includes(query);
      const teamAMatch =
        match.teamA?.name.toLowerCase().includes(query) ||
        match.teamA?.players.some((p) => p.fullName.toLowerCase().includes(query));
      const teamBMatch =
        match.teamB?.name.toLowerCase().includes(query) ||
        match.teamB?.players.some((p) => p.fullName.toLowerCase().includes(query));

      if (!matchCodeMatch && !roundMatch && !courtMatch && !teamAMatch && !teamBMatch) {
        return false;
      }
    }

    return true;
  });

  const handleSaveScore = async (updatedMatch: Match) => {
    if (!tournament) return;
    if (isLocked) {
      alert('Không thể lưu điểm: Đang mất kết nối tới Firebase Database!');
      return;
    }
    // Tìm trong groups
    let found = false;
    for (const group of category.groups) {
      const idx = group.matches.findIndex((m) => m.id === updatedMatch.id);
      if (idx !== -1) {
        group.matches[idx] = updatedMatch;
        found = true;
        break;
      }
    }

    // Nếu không có trong groups thì tìm trong knockout
    if (!found) {
      const koIdx = category.knockoutMatches.findIndex((m) => m.id === updatedMatch.id);
      if (koIdx !== -1) {
        category.knockoutMatches[koIdx] = updatedMatch;
      }
    }

    await saveTournament(tournament);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-base">Lịch & Tỉ Số Trực Tiếp</h3>
          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-full">
            {filteredMatches.length} trận
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc theo Sân */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={courtFilter}
              onChange={(e) => setCourtFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">Tất cả sân đấu</option>
              {tournament?.courts?.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Trạng thái */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PLAYING">Đang thi đấu</option>
              <option value="PENDING">Chưa diễn ra</option>
              <option value="FINISHED">Đã kết thúc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid danh sách trận đấu */}
      {filteredMatches.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
          <Calendar className="w-8 h-8 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-600">Không tìm thấy trận đấu nào phù hợp.</p>
          <p className="text-xs text-slate-400">
            Thử thay đổi bộ lọc sân, trạng thái hoặc từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => {
            const isPlaying = match.status === 'PLAYING';
            const isFinished = match.status === 'FINISHED';

            return (
              <div
                key={match.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm hover:shadow transition flex flex-col justify-between ${
                  isPlaying
                    ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20'
                    : isFinished
                    ? 'border-slate-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Header Card: Mã trận, Vòng, Sân, Giờ */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {match.matchCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 line-clamp-1">
                      {match.roundName}
                    </span>
                  </div>

                  {/* Badge Trạng thái */}
                  {isPlaying ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                      <Play className="w-2.5 h-2.5 fill-current" /> Đang đấu
                    </span>
                  ) : isFinished ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Hoàn thành
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      Sắp diễn ra
                    </span>
                  )}
                </div>

                {/* Score Board Giữa 2 Đội */}
                <div className="py-4 space-y-2.5">
                  {/* Đội A */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {match.winnerId === match.teamA?.id && (
                        <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <div
                          className={`text-sm truncate ${
                            match.winnerId === match.teamA?.id
                              ? 'font-extrabold text-indigo-900'
                              : 'font-semibold text-slate-800'
                          }`}
                        >
                          {match.teamA?.getDisplayName() || 'Chờ xác định'}
                        </div>
                        {match.teamA?.players && match.teamA.players.length > 0 && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {match.teamA.players.map((p) => p.fullName).join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Điểm các set của Đội A */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {match.scores.map((set, sIdx) => (
                        <span
                          key={sIdx}
                          className={`w-7 h-7 flex items-center justify-center font-mono text-sm font-bold rounded-lg ${
                            match.rule.getSetWinner(set.teamA, set.teamB) === 'A'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {set.teamA}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Đội B */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {match.winnerId === match.teamB?.id && (
                        <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <div
                          className={`text-sm truncate ${
                            match.winnerId === match.teamB?.id
                              ? 'font-extrabold text-indigo-900'
                              : 'font-semibold text-slate-800'
                          }`}
                        >
                          {match.teamB?.getDisplayName() || 'Chờ xác định'}
                        </div>
                        {match.teamB?.players && match.teamB.players.length > 0 && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {match.teamB.players.map((p) => p.fullName).join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Điểm các set của Đội B */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {match.scores.map((set, sIdx) => (
                        <span
                          key={sIdx}
                          className={`w-7 h-7 flex items-center justify-center font-mono text-sm font-bold rounded-lg ${
                            match.rule.getSetWinner(set.teamA, set.teamB) === 'B'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {set.teamB}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Card: Địa điểm, Giờ & Quyền Admin Nhập Điểm */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    {match.court && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {match.court}
                      </span>
                    )}
                    {match.scheduledTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {match.scheduledTime}
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => setScoringMatch(match)}
                      className={`px-2.5 py-1 font-bold rounded-lg transition text-xs ${
                        isLocked
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer'
                      }`}
                      title={isLocked ? 'Đang khóa (Mất kết nối Database)' : 'Nhập điểm'}
                    >
                      {isLocked ? 'Khóa' : 'Nhập Điểm'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {scoringMatch && (
        <ScoreModal
          match={scoringMatch}
          isOpen={true}
          onClose={() => setScoringMatch(null)}
          onSave={handleSaveScore}
        />
      )}
    </div>
  );
};
