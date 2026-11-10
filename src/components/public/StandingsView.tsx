import React, { useState } from 'react';
import { Category, Match, Team, Group } from '../../models';
import { useTournament } from '../../context/TournamentContext';
import { ScoreModal } from '../admin/ScoreModal';
import {
  Trophy,
  HelpCircle,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Props {
  category: Category;
  searchQuery?: string;
}

const getTeamGroupCode = (group: Group, team: Team | null, fallbackNum: number): string => {
  if (!team) return `?${fallbackNum}`;
  const groupChar = group.name.replace(/^bảng\s*/i, '').trim() || 'A';
  const idx = group.teams.findIndex((t) => t.id === team.id);
  if (idx !== -1) {
    return `${groupChar}${idx + 1}`;
  }
  if (team.seed) {
    return `${groupChar}${team.seed}`;
  }
  const matchCode = team.name.match(/^([A-Za-z]\d+)$/);
  if (matchCode) {
    return matchCode[1];
  }
  return `${groupChar}${fallbackNum}`;
};

const getAthleteDisplay = (team: Team | null): string => {
  if (!team) return 'Chờ xác định';

  const playerNames =
    team.players && team.players.length > 0
      ? team.players.map((p) => p.fullName).filter(Boolean).join(' / ')
      : '';

  const clubs = team.players
    ? Array.from(new Set(team.players.map((p) => p.club).filter(Boolean))).join(', ')
    : '';

  if (playerNames) {
    if (clubs) {
      return `${playerNames} | ${clubs}`;
    }
    if (
      team.name &&
      team.name !== playerNames &&
      !team.name.match(/^[A-Za-z]\d+$/) &&
      !team.name.toLowerCase().startsWith('đội ')
    ) {
      return `${playerNames} | ${team.name}`;
    }
    return playerNames;
  }

  return team.name || team.getDisplayName() || 'Chờ';
};

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
                        <th className="py-2.5 px-2 w-16">Đội</th>
                        <th className="py-2.5 px-3">VĐV</th>
                        <th className="py-2.5 px-2 text-center" title="Số trận thắng">T</th>
                        <th className="py-2.5 px-2 text-center" title="Hiệu số điểm (+/-)">HS</th>
                        <th className="py-2.5 px-3 text-center" title="Điểm (Thắng +1 điểm)">Đ</th>
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
                                  {getTeamGroupCode(group, row.team, rank)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-white max-w-[180px] truncate" title={athleteNames}>
                                <div className="truncate">{athleteNames}</div>
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
                                {row.won}
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

                          const teamACode = getTeamGroupCode(group, match.teamA, 1);
                          const teamBCode = getTeamGroupCode(group, match.teamB, 2);
                          const teamAName = getAthleteDisplay(match.teamA);
                          const teamBName = getAthleteDisplay(match.teamB);

                          const matchCodeStr = match.matchCode.startsWith('#')
                            ? match.matchCode
                            : `#${match.matchCode}`;
                          const matchMeta = [match.court, match.scheduledTime].filter(Boolean).join(' • ');

                          return (
                            <div
                              key={match.id}
                              className="bg-[#0c1524] rounded-xl border border-[#16263f] p-3 text-xs flex flex-col gap-2 hover:border-cyan-800/40 transition"
                            >
                              {/* Header: #mã-trận  Sân 1 • 07:30      [Đã đấu] */}
                              <div className="flex items-center justify-between gap-2 pb-0.5">
                                <div className="flex items-center gap-2 truncate text-xs sm:text-[13px]">
                                  <span className="font-mono text-slate-400 font-bold">
                                    {matchCodeStr}
                                  </span>
                                  {matchMeta && (
                                    <span className="text-cyan-400 font-semibold truncate">
                                      {matchMeta}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={`text-xs font-mono font-medium ${
                                      isFinished
                                        ? 'text-slate-400'
                                        : isPlaying
                                        ? 'text-amber-400 font-bold animate-pulse'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {isFinished ? '[Đã đấu]' : isPlaying ? '[Đang đấu]' : '[Chưa đấu]'}
                                  </span>

                                  {isAdmin && (
                                    <button
                                      type="button"
                                      disabled={isLocked}
                                      onClick={() => setScoringMatch(match)}
                                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
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

                              {/* Đội A */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[11px] font-black shrink-0 ${
                                      teamAWon
                                        ? 'bg-cyan-400 text-black font-extrabold shadow-sm'
                                        : 'bg-[#091527] border border-[#173354] text-cyan-400 font-bold'
                                    }`}
                                  >
                                    {teamACode}
                                  </span>
                                  <span
                                    className={`truncate text-xs sm:text-sm ${
                                      teamAWon ? 'font-black text-white' : 'font-semibold text-slate-200'
                                    }`}
                                    title={teamAName}
                                  >
                                    {teamAName}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 font-mono">
                                  {match.scores.map((set, sIdx) => {
                                    const isSetWinner = match.rule.getSetWinner(set.teamA, set.teamB) === 'A';
                                    return (
                                      <span
                                        key={sIdx}
                                        className={`w-7 h-6 sm:w-8 sm:h-7 flex items-center justify-center rounded text-xs sm:text-sm font-bold ${
                                          isFinished && isSetWinner
                                            ? 'bg-cyan-950/70 border border-cyan-500/60 text-cyan-300'
                                            : 'text-slate-300'
                                        }`}
                                      >
                                        {isFinished || isPlaying ? set.teamA : '-'}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Đội B */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[11px] font-black shrink-0 ${
                                      teamBWon
                                        ? 'bg-cyan-400 text-black font-extrabold shadow-sm'
                                        : 'bg-[#091527] border border-[#173354] text-cyan-400 font-bold'
                                    }`}
                                  >
                                    {teamBCode}
                                  </span>
                                  <span
                                    className={`truncate text-xs sm:text-sm ${
                                      teamBWon ? 'font-black text-white' : 'font-semibold text-slate-200'
                                    }`}
                                    title={teamBName}
                                  >
                                    {teamBName}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 font-mono">
                                  {match.scores.map((set, sIdx) => {
                                    const isSetWinner = match.rule.getSetWinner(set.teamA, set.teamB) === 'B';
                                    return (
                                      <span
                                        key={sIdx}
                                        className={`w-7 h-6 sm:w-8 sm:h-7 flex items-center justify-center rounded text-xs sm:text-sm font-bold ${
                                          isFinished && isSetWinner
                                            ? 'bg-cyan-950/70 border border-cyan-500/60 text-cyan-300'
                                            : 'text-slate-300'
                                        }`}
                                      >
                                        {isFinished || isPlaying ? set.teamB : '-'}
                                      </span>
                                    );
                                  })}
                                </div>
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
          <div className="bg-[#0c1524] border border-[#1e314f] rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
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
                    <span className="font-bold text-white">Điểm xếp hạng (Đ):</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Mỗi trận thắng được tính 1 điểm (Thắng: 1 điểm, Thua: 0 điểm).</p>
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
