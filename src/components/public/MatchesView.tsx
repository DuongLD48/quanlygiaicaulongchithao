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

  // Lấy tất cả trận đấu trong nội dung
  const allMatches = category.getAllMatches();
  const query = searchQuery.toLowerCase().trim();

  // Lọc danh sách trận đấu
  const filteredMatches = allMatches.filter((match) => {
    if (courtFilter !== 'ALL' && match.court !== courtFilter) return false;
    if (statusFilter !== 'ALL' && match.status !== statusFilter) return false;

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
    let found = false;
    for (const group of category.groups) {
      const idx = group.matches.findIndex((m) => m.id === updatedMatch.id);
      if (idx !== -1) {
        group.matches[idx] = updatedMatch;
        found = true;
        break;
      }
    }

    if (!found) {
      const koIdx = category.knockoutMatches.findIndex((m) => m.id === updatedMatch.id);
      if (koIdx !== -1) {
        category.knockoutMatches[koIdx] = updatedMatch;
      }
    }

    await saveTournament(tournament);
  };

  return (
    <div className="space-y-5">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0c1524] p-4 rounded-2xl shadow-xl border border-[#16263f]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h3 className="font-black text-white text-xs uppercase tracking-wide">
            Nhập Tỷ Số & Quản Lý Trận Đấu ({category.name})
          </h3>
          <span className="text-[11px] px-2 py-0.5 bg-[#101e33] border border-[#1d3252] text-cyan-300 font-bold rounded-md">
            {filteredMatches.length} trận
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc theo Sân */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={courtFilter}
              onChange={(e) => setCourtFilter(e.target.value)}
              className="px-2.5 py-1 bg-[#091120] border border-[#16263f] text-slate-200 rounded-lg text-xs font-semibold focus:border-cyan-400 focus:outline-none"
            >
              <option value="ALL">Tất cả sân</option>
              {tournament?.courts?.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Trạng thái */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-[#091120] border border-[#16263f] text-slate-200 rounded-lg text-xs font-semibold focus:border-cyan-400 focus:outline-none"
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
        <div className="p-12 text-center text-slate-500 text-xs bg-[#0c1524] rounded-2xl border border-[#16263f] space-y-2">
          <Calendar className="w-8 h-8 mx-auto text-slate-600" />
          <p className="font-bold text-slate-400">Không tìm thấy trận đấu nào phù hợp.</p>
          <p className="text-slate-600">Thử thay đổi bộ lọc sân, trạng thái hoặc từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => {
            const isPlaying = match.status === 'PLAYING';
            const isFinished = match.status === 'FINISHED';
            const teamAWon = match.winnerId === match.teamA?.id;
            const teamBWon = match.winnerId === match.teamB?.id;

            return (
              <div
                key={match.id}
                className={`bg-[#0c1524] rounded-2xl border p-4 shadow-xl transition flex flex-col justify-between ${
                  isPlaying
                    ? 'border-amber-400/80 ring-2 ring-amber-400/20'
                    : isFinished
                    ? 'border-cyan-500/40'
                    : 'border-[#16263f]'
                }`}
              >
                {/* Header Card */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#16263f]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-black text-cyan-300 bg-[#101e33] border border-[#1d3252] px-2 py-0.5 rounded">
                      {match.matchCode}
                    </span>
                    <span className="text-xs font-bold text-slate-300 truncate max-w-[150px]">
                      {match.roundName}
                    </span>
                  </div>

                  {isPlaying ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full animate-pulse">
                      <Play className="w-2.5 h-2.5 fill-current" /> Đang đấu
                    </span>
                  ) : isFinished ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Xong
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 bg-[#091120] px-2 py-0.5 rounded-full border border-[#16263f]">
                      Sắp đấu
                    </span>
                  )}
                </div>

                {/* Score Board */}
                <div className="py-3 space-y-2">
                  {/* Đội A */}
                  <div className={`flex items-center justify-between p-2 rounded-xl transition ${
                    teamAWon ? 'bg-cyan-950/40 border border-cyan-500/30' : 'bg-[#091120]'
                  }`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {teamAWon && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <div className="min-w-0">
                        <div className={`text-xs truncate ${teamAWon ? 'font-black text-white' : 'font-semibold text-slate-300'}`}>
                          {match.teamA?.getDisplayName() || 'Chờ xác định'}
                        </div>
                        {match.teamA?.players && match.teamA.players.length > 0 && (
                          <div className="text-[10px] text-slate-500 truncate">
                            {match.teamA.players.map((p) => p.fullName).join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-mono font-black shrink-0">
                      {match.scores.map((set, sIdx) => (
                        <span
                          key={sIdx}
                          className={`w-6 h-6 flex items-center justify-center text-xs rounded-md ${
                            match.rule.getSetWinner(set.teamA, set.teamB) === 'A'
                              ? 'bg-cyan-500 text-black font-extrabold'
                              : 'bg-[#101e33] text-slate-400'
                          }`}
                        >
                          {set.teamA}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Đội B */}
                  <div className={`flex items-center justify-between p-2 rounded-xl transition ${
                    teamBWon ? 'bg-cyan-950/40 border border-cyan-500/30' : 'bg-[#091120]'
                  }`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {teamBWon && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <div className="min-w-0">
                        <div className={`text-xs truncate ${teamBWon ? 'font-black text-white' : 'font-semibold text-slate-300'}`}>
                          {match.teamB?.getDisplayName() || 'Chờ xác định'}
                        </div>
                        {match.teamB?.players && match.teamB.players.length > 0 && (
                          <div className="text-[10px] text-slate-500 truncate">
                            {match.teamB.players.map((p) => p.fullName).join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-mono font-black shrink-0">
                      {match.scores.map((set, sIdx) => (
                        <span
                          key={sIdx}
                          className={`w-6 h-6 flex items-center justify-center text-xs rounded-md ${
                            match.rule.getSetWinner(set.teamA, set.teamB) === 'B'
                              ? 'bg-cyan-500 text-black font-extrabold'
                              : 'bg-[#101e33] text-slate-400'
                          }`}
                        >
                          {set.teamB}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Card */}
                <div className="flex items-center justify-between pt-2.5 border-t border-[#16263f] text-xs text-slate-400">
                  <div className="flex items-center gap-3 text-[11px]">
                    {match.court && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {match.court}
                      </span>
                    )}
                    {match.scheduledTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {match.scheduledTime}
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => setScoringMatch(match)}
                      className={`px-3 py-1 font-bold rounded-lg transition text-xs cursor-pointer ${
                        isLocked
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-md shadow-cyan-600/20'
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

      {/* Score Modal */}
      {scoringMatch && (
        <ScoreModal
          isOpen={!!scoringMatch}
          match={scoringMatch}
          onClose={() => setScoringMatch(null)}
          onSave={handleSaveScore}
        />
      )}
    </div>
  );
};
