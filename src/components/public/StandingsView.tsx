import React, { useState } from 'react';
import { Category, Match } from '../../models';
import { useTournament } from '../../context/TournamentContext';
import { ScoreModal } from '../admin/ScoreModal';
import {
  Trophy,
  HelpCircle,
  X,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Props {
  category: Category;
  searchQuery?: string;
}

export const StandingsView: React.FC<Props> = ({ category, searchQuery = '' }) => {
  const { tournament, saveTournament, isAdmin, isRealtimeConnected, connectionError } = useTournament();
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const isLocked = !isRealtimeConnected || !!connectionError;
  const query = searchQuery.toLowerCase().trim();

  const toggleGroupMatches = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: prev[groupId] === undefined ? false : !prev[groupId],
    }));
  };

  const handleSaveScore = async (updatedMatch: Match) => {
    if (!tournament) return;
    if (isLocked) {
      alert('Không thể lưu điểm: Mất kết nối tới Database!');
      return;
    }

    for (const group of category.groups) {
      const idx = group.matches.findIndex((m) => m.id === updatedMatch.id);
      if (idx !== -1) {
        group.matches[idx] = updatedMatch;
        break;
      }
    }
    await saveTournament(tournament);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Tiêu đề Vòng Bảng + Nút Cách tính xếp hạng */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <h2 className="text-xs sm:text-sm font-black text-white tracking-wider uppercase flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            VÒNG BẢNG ({category.name})
          </h2>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] inline-block animate-pulse"></span>
        </div>

        <button
          type="button"
          onClick={() => setIsRankModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-[#0c182a] hover:bg-[#11233e] border border-cyan-800/50 hover:border-cyan-500/60 px-3 py-1.5 rounded-lg transition font-medium shadow-sm cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Cách tính xếp hạng</span>
        </button>
      </div>

      {category.groups.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-[#0c1524] rounded-2xl border border-[#16263f]">
          Chưa có bảng đấu nào trong nội dung này. Vui lòng thêm bảng đấu trong phần Quản trị!
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {category.groups.map((group) => {
            const standings = group.calculateStandings();
            const groupMatches = group.matches;
            const completedCount = groupMatches.filter((m) => m.status === 'FINISHED').length;
            const isExpanded = expandedGroups[group.id] !== false; // Mặc định mở rộng

            // Lọc theo tìm kiếm
            const filteredRows = query
              ? standings.filter(
                  (row) =>
                    row.team.name.toLowerCase().includes(query) ||
                    row.team.players.some((p) => p.fullName.toLowerCase().includes(query)) ||
                    group.name.toLowerCase().includes(query)
                )
              : standings;

            const filteredMatches = query
              ? groupMatches.filter((m) => {
                  const teamAName = m.teamA?.name.toLowerCase() || '';
                  const teamBName = m.teamB?.name.toLowerCase() || '';
                  const playersA = m.teamA?.players.map((p) => p.fullName.toLowerCase()).join(' ') || '';
                  const playersB = m.teamB?.players.map((p) => p.fullName.toLowerCase()).join(' ') || '';
                  return (
                    m.matchCode.toLowerCase().includes(query) ||
                    m.court.toLowerCase().includes(query) ||
                    teamAName.includes(query) ||
                    teamBName.includes(query) ||
                    playersA.includes(query) ||
                    playersB.includes(query)
                  );
                })
              : groupMatches;

            return (
              <div
                key={group.id}
                className="bg-[#0c1524] rounded-2xl border border-[#16263f] overflow-hidden flex flex-col shadow-xl"
              >
                {/* Header Bảng */}
                <div className="p-3.5 sm:p-4 bg-[#091120] border-b border-[#16263f] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <h3 className="font-black text-white text-xs sm:text-sm tracking-wide uppercase">
                      {group.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#101e33] border border-[#1d3252] text-[11px] font-bold text-cyan-300">
                      Đã đấu {completedCount}/{groupMatches.length} trận
                    </span>
                  </div>
                </div>

                {/* Table BXH */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#0a1322] text-slate-400 uppercase tracking-wider font-bold border-b border-[#16263f] text-[11px]">
                        <th className="py-2.5 px-3 text-center w-12">Hạng</th>
                        <th className="py-2.5 px-2 w-16">Mã</th>
                        <th className="py-2.5 px-3">Đội / VĐV</th>
                        <th className="py-2.5 px-2 text-center" title="Số trận thắng">T</th>
                        <th className="py-2.5 px-2 text-center" title="Hiệu số điểm (+/-)">HS</th>
                        <th className="py-2.5 px-3 text-center" title="Tổng điểm">Đ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#121f33]/60 text-slate-200">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500 italic text-xs">
                            Không tìm thấy đội nào phù hợp.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, rIdx) => {
                          const rank = rIdx + 1;
                          const ptDiff = row.pointsWon - row.pointsLost;
                          const athleteNames =
                            row.team.players.length > 0
                              ? row.team.players.map((p) => p.fullName).join(' / ')
                              : row.team.name;

                          let rankBadge = (
                            <span className="text-slate-400 font-bold text-xs">{rank}</span>
                          );
                          if (rank === 1) {
                            rankBadge = (
                              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center justify-center font-black text-[11px] shadow-sm">
                                1
                              </span>
                            );
                          } else if (rank === 2) {
                            rankBadge = (
                              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 inline-flex items-center justify-center font-black text-[11px] shadow-sm">
                                2
                              </span>
                            );
                          } else if (rank === 3) {
                            rankBadge = (
                              <span className="w-5 h-5 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/40 inline-flex items-center justify-center font-bold text-[11px]">
                                3
                              </span>
                            );
                          }

                          return (
                            <tr key={row.team.id} className="hover:bg-[#0e1b2f]/80 transition">
                              <td className="py-2.5 px-3 text-center font-black">{rankBadge}</td>
                              <td className="py-2.5 px-2">
                                <span className="px-1.5 py-0.5 rounded bg-[#101e33] text-cyan-300 border border-[#1d3252] text-[10px] font-black">
                                  {group.name.replace('Bảng ', '')}{rank}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-white max-w-[180px] truncate" title={athleteNames}>
                                <div>{row.team.name || athleteNames}</div>
                                {row.team.players.length > 0 && row.team.name && (
                                  <div className="text-[10px] text-slate-400 font-normal truncate">
                                    {athleteNames}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono font-black text-emerald-400">
                                {row.won}
                              </td>
                              <td
                                className={`py-2.5 px-2 text-center font-mono font-bold text-xs ${
                                  ptDiff > 0
                                    ? 'text-emerald-400'
                                    : ptDiff < 0
                                    ? 'text-rose-400'
                                    : 'text-slate-400'
                                }`}
                              >
                                {ptDiff > 0 ? `+${ptDiff}` : ptDiff}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-400">
                                {row.pointsWon}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Sub-section: Danh sách các trận vòng bảng thuộc bảng này */}
                <div className="border-t border-[#16263f] bg-[#091120]/50">
                  <button
                    type="button"
                    onClick={() => toggleGroupMatches(group.id)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-slate-300 hover:text-white hover:bg-[#0d182b] transition"
                  >
                    <span className="font-bold flex items-center gap-1.5 uppercase text-[11px] tracking-wide text-cyan-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Lịch đấu {group.name} ({filteredMatches.length} trận)
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-3 space-y-2 border-t border-[#14233a] bg-[#070d19]/80">
                      {filteredMatches.length === 0 ? (
                        <p className="text-center text-slate-500 text-xs py-3 italic">
                          Chưa có lịch đấu nào trong bảng này.
                        </p>
                      ) : (
                        filteredMatches.map((match) => {
                          const isFinished = match.status === 'FINISHED';
                          const isPlaying = match.status === 'PLAYING';
                          const teamAWon = match.winnerId === match.teamA?.id;
                          const teamBWon = match.winnerId === match.teamB?.id;

                          return (
                            <div
                              key={match.id}
                              className="bg-[#0c1524] rounded-xl border border-[#16263f] p-3 text-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 hover:border-cyan-800/40 transition"
                            >
                              {/* Thông tin mã trận & Sân */}
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="px-1.5 py-0.5 rounded bg-[#101e33] border border-[#1d3252] text-[10px] font-mono font-black text-cyan-300">
                                  {match.matchCode}
                                </span>
                                {match.court && (
                                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                    <MapPin className="w-3 h-3 text-slate-500" />
                                    {match.court}
                                  </span>
                                )}
                                {match.scheduledTime && (
                                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    {match.scheduledTime}
                                  </span>
                                )}
                              </div>

                              {/* Đội A vs Đội B & Tỷ số */}
                              <div className="flex-1 flex items-center justify-between sm:justify-center gap-3">
                                {/* Team A */}
                                <div className={`text-right flex-1 truncate ${teamAWon ? 'font-black text-cyan-300' : 'text-slate-200'}`}>
                                  <div className="truncate font-semibold">{match.teamA?.getDisplayName() || 'Chờ'}</div>
                                </div>

                                {/* Score badge */}
                                <div className="flex items-center gap-1 shrink-0 font-mono font-black px-2 py-0.5 bg-[#091120] rounded-lg border border-[#16263f]">
                                  {match.scores.map((set, sIdx) => (
                                    <span key={sIdx} className="text-xs">
                                      <span className={teamAWon ? 'text-cyan-400' : 'text-white'}>{set.teamA}</span>
                                      <span className="text-slate-500 mx-1">-</span>
                                      <span className={teamBWon ? 'text-cyan-400' : 'text-white'}>{set.teamB}</span>
                                    </span>
                                  ))}
                                </div>

                                {/* Team B */}
                                <div className={`text-left flex-1 truncate ${teamBWon ? 'font-black text-cyan-300' : 'text-slate-200'}`}>
                                  <div className="truncate font-semibold">{match.teamB?.getDisplayName() || 'Chờ'}</div>
                                </div>
                              </div>

                              {/* Trạng thái & Nút Admin */}
                              <div className="flex items-center justify-end gap-2 shrink-0">
                                {isPlaying && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 text-[10px] font-bold animate-pulse">
                                    Đang đấu
                                  </span>
                                )}
                                {isFinished && (
                                  <span className="px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-300 text-[10px] font-bold">
                                    Xong
                                  </span>
                                )}

                                {isAdmin && (
                                  <button
                                    type="button"
                                    disabled={isLocked}
                                    onClick={() => setScoringMatch(match)}
                                    className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                                      isLocked
                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        : 'bg-cyan-600 hover:bg-cyan-500 text-black cursor-pointer'
                                    }`}
                                  >
                                    Nhập Điểm
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Cách tính xếp hạng */}
      {isRankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#0c1524] border border-[#1e314f] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#16263f]">
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <span>Cách Tính Xếp Hạng Vòng Bảng</span>
              </h3>
              <button
                onClick={() => setIsRankModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#121f33] hover:bg-[#1a2b45] text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Thứ tự xếp hạng các đội trong từng bảng được xác định tự động theo các tiêu chuẩn ưu tiên chuẩn BWF:
              </p>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5 bg-[#091120] p-2.5 rounded-xl border border-[#16263f]">
                  <span className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-white">Tổng số trận thắng (T):</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Xếp hạng theo tổng trận thắng nhiều nhất (Thắng: +1 điểm, Thua: 0 điểm).</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-[#091120] p-2.5 rounded-xl border border-[#16263f]">
                  <span className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-white">Hiệu số Điểm (HS):</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Tổng số điểm quả ghi được trừ đi tổng số điểm quả bị mất (+/-).</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-[#091120] p-2.5 rounded-xl border border-[#16263f]">
                  <span className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <span className="font-bold text-white">Tổng điểm (Đ):</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Tổng số điểm quả ghi được trong tất cả các trận đấu vòng bảng.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-[#091120] p-2.5 rounded-xl border border-[#16263f]">
                  <span className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    4
                  </span>
                  <div>
                    <span className="font-bold text-white">Đối đầu trực tiếp:</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Nếu vẫn bằng nhau, xét kết quả trận đối đầu trực tiếp giữa 2 đội.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#16263f]">
              <button
                type="button"
                onClick={() => setIsRankModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition shadow-lg cursor-pointer"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
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
