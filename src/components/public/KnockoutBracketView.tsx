import React, { useState } from 'react';
import { Category, Match, Team } from '../../models';
import { useTournament } from '../../context/TournamentContext';
import { KnockoutScheduler } from '../../engine';
import { ScoreModal } from '../admin/ScoreModal';
import {
  Trophy,
  Award,
  Play,
  CheckCircle2,
  Layers,
  Edit2,
  X,
} from 'lucide-react';

interface Props {
  category: Category;
}

export const KnockoutBracketView: React.FC<Props> = ({ category }) => {
  const { tournament, saveTournament, isAdmin } = useTournament();
  const [selectedStageTab, setSelectedStageTab] = useState<string>('ALL');
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  React.useEffect(() => {
    if (!editingMatch) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [editingMatch]);

  const allCategoryTeams = category.getAllTeams();

  const getPlaceholderSuggestions = () => {
    const list: string[] = [];
    category.groups.forEach((g) => {
      list.push(`Nhất ${g.name}`);
      list.push(`Nhì ${g.name}`);
      list.push(`Ba ${g.name}`);
    });
    category.knockoutMatches.forEach((m) => {
      if (m.matchCode) {
        list.push(`Thắng ${m.matchCode}`);
        list.push(`Thua ${m.matchCode}`);
      }
    });
    list.push('Thắng Bán Kết 1', 'Thắng Bán Kết 2');
    list.push('Thua Bán Kết 1', 'Thua Bán Kết 2');
    list.push('Thắng Tứ Kết 1', 'Thắng Tứ Kết 2', 'Thắng Tứ Kết 3', 'Thắng Tứ Kết 4');
    return Array.from(new Set(list));
  };

  const knockoutStages = [
    { key: 'roundOf16', label: 'Vòng 1/8', prefix: 'V18', rule: category.rulesConfig.roundOf16 },
    { key: 'quarterFinals', label: 'Tứ Kết', prefix: 'TK', rule: category.rulesConfig.quarterFinals },
    { key: 'semiFinals', label: 'Bán Kết', prefix: 'BK', rule: category.rulesConfig.semiFinals },
    { key: 'finals', label: 'Chung Kết', prefix: 'CK', rule: category.rulesConfig.finals },
    { key: 'thirdPlace', label: 'Tranh Hạng 3', prefix: 'TH3', rule: category.rulesConfig.thirdPlace },
  ];

  const handleSaveEditMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch || !tournament) return;

    if (!editingMatch.matchCode.trim()) {
      alert('Vui lòng nhập mã trận đấu!');
      return;
    }

    const idx = category.knockoutMatches.findIndex((m) => m.id === editingMatch.id);
    if (idx !== -1) {
      const matchedStage = knockoutStages.find((s) => s.label === editingMatch.roundName);
      editingMatch.rule = matchedStage?.rule || category.rulesConfig.getRuleForStage(editingMatch.roundName);
      category.knockoutMatches[idx] = editingMatch;
      KnockoutScheduler.propagateWinners(category.knockoutMatches);
      await saveTournament(tournament);
    }
    setEditingMatch(null);
  };

  const koMatches = category.knockoutMatches || [];

  // Phân loại các trận Knockout theo từng vòng đấu
  const r16Matches = koMatches.filter(
    (m) =>
      m.roundName.includes('1/8') ||
      m.roundName.includes('16') ||
      m.matchCode.includes('V18') ||
      m.matchCode.includes('R16')
  );

  const qfMatches = koMatches.filter(
    (m) =>
      (m.roundName.toLowerCase().includes('tứ kết') ||
        m.roundName.toLowerCase().includes('quarter') ||
        m.matchCode.includes('TK')) &&
      !m.roundName.includes('1/8')
  );

  const sfMatches = koMatches.filter(
    (m) =>
      m.roundName.toLowerCase().includes('bán kết') ||
      m.roundName.toLowerCase().includes('semi') ||
      m.matchCode.includes('BK')
  );

  const finalMatches = koMatches.filter(
    (m) =>
      (m.roundName.toLowerCase().includes('chung kết') || m.matchCode.includes('CK')) &&
      !m.roundName.toLowerCase().includes('bán kết')
  );

  const thirdPlaceMatches = koMatches.filter(
    (m) =>
      m.roundName.toLowerCase().includes('tranh') ||
      m.roundName.toLowerCase().includes('hạng 3') ||
      m.roundName.toLowerCase().includes('hạng ba') ||
      m.matchCode.includes('TH3')
  );

  const otherMatches = koMatches.filter(
    (m) =>
      !r16Matches.includes(m) &&
      !qfMatches.includes(m) &&
      !sfMatches.includes(m) &&
      !finalMatches.includes(m) &&
      !thirdPlaceMatches.includes(m)
  );

  // Xác định các vị trí bục vinh quang (Podium)
  const primaryFinal = finalMatches[0];
  const primaryThird = thirdPlaceMatches[0];

  const champion = primaryFinal?.getWinner();
  const runnerUp =
    primaryFinal?.status === 'FINISHED' && primaryFinal?.winnerId
      ? primaryFinal.winnerId === primaryFinal.teamA?.id
        ? primaryFinal.teamB
        : primaryFinal.teamA
      : null;
  const thirdPlace = primaryThird?.getWinner();

  // Lấy tên VĐV (không hiện tên đội như A1, A2...) cho phần vinh danh Podium
  const getPodiumAthleteNames = (team: Team | null | undefined): string => {
    if (!team) return '';
    if (team.players && team.players.length > 0) {
      const names = team.players
        .map((p) => p.fullName)
        .filter(Boolean)
        .join(' / ');
      if (names.trim()) return names;
    }
    const matchedTeam = allCategoryTeams.find((t) => t.id === team.id || t.name === team.name);
    if (matchedTeam && matchedTeam.players && matchedTeam.players.length > 0) {
      const names = matchedTeam.players
        .map((p) => p.fullName)
        .filter(Boolean)
        .join(' / ');
      if (names.trim()) return names;
    }
    return team.name || 'Chưa xác định';
  };

  const handleSaveScore = async (updatedMatch: Match) => {
    if (!tournament) return;
    const idx = category.knockoutMatches.findIndex((m) => m.id === updatedMatch.id);
    if (idx !== -1) {
      category.knockoutMatches[idx] = updatedMatch;
      KnockoutScheduler.propagateWinners(category.knockoutMatches);
      await saveTournament(tournament);
    }
  };

  if (koMatches.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs bg-[#0c1524] rounded-2xl border border-[#16263f] space-y-2">
        <Trophy className="w-10 h-10 mx-auto text-amber-400/50" />
        <p className="font-bold text-white text-sm">Chưa có dữ liệu nhánh đấu vòng trong.</p>
        <p className="text-slate-500">
          Ban tổ chức sẽ thiết lập các cặp Bán Kết và Chung Kết sau khi kết thúc vòng bảng!
        </p>
      </div>
    );
  }

  // Render từng thẻ trận đấu đồng bộ Cyber Dark
  const renderMatchCard = (match: Match) => {
    const isFinished = match.status === 'FINISHED';
    const isPlaying = match.status === 'PLAYING';
    const teamAWon = match.winnerId === match.teamA?.id;
    const teamBWon = match.winnerId === match.teamB?.id;

    const hasTeamA = !!match.teamA;
    const hasTeamB = !!match.teamB;
    const teamAName = match.teamA?.name || match.placeholderA || 'Chờ xác định';
    const teamBName = match.teamB?.name || match.placeholderB || 'Chờ xác định';
    const athletesA = match.teamA?.players?.map((p) => p.fullName).join(' / ') || '';
    const athletesB = match.teamB?.players?.map((p) => p.fullName).join(' / ') || '';

    return (
      <div
        key={match.id}
        className={`bg-[#0c1524] rounded-2xl border p-4 shadow-xl transition flex flex-col justify-between ${
          isPlaying
            ? 'border-amber-400/80 ring-2 ring-amber-400/20'
            : isFinished
            ? 'border-cyan-500/40 hover:border-cyan-400/60'
            : 'border-[#16263f] hover:border-[#223b61]'
        }`}
      >
        <div>
          {/* Header row: Mã trận, Sân • Giờ, Trạng thái */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#16263f] text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-cyan-400 font-mono text-xs">
                #{match.matchCode}
              </span>
              <span className="text-cyan-300 font-medium text-[11px]">
                {match.court || 'Sân ?'} • {match.scheduledTime || '--:--'}
              </span>
            </div>

            <div>
              {isPlaying ? (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Play className="w-2.5 h-2.5 fill-current" /> Đang đấu
                </span>
              ) : isFinished ? (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> [Đã đấu]
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 bg-[#091120] border border-[#16263f] px-2 py-0.5 rounded-full">
                  Chưa đấu
                </span>
              )}
            </div>
          </div>

          {/* Vòng thi đấu tag */}
          <div className="pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>{match.roundName}</span>
            {match.rule && (
              <span className="text-slate-500 text-[10px] font-normal lowercase">
                {match.rule.setsCount} set • {match.rule.pointsPerSet}đ
              </span>
            )}
          </div>

          {/* Body: Danh sách 2 đội */}
          <div className="py-2.5 space-y-2">
            {/* Đội A */}
            <div
              className={`flex items-center justify-between p-2 rounded-xl transition ${
                teamAWon
                  ? 'bg-cyan-950/40 border border-cyan-500/40'
                  : 'bg-[#091120] border border-[#14233a]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {teamAWon && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <span
                    className={`text-xs block truncate ${
                      hasTeamA
                        ? teamAWon ? 'font-black text-white' : 'font-semibold text-slate-300'
                        : 'text-cyan-400 font-semibold italic'
                    }`}
                  >
                    {teamAName}
                  </span>
                  {athletesA ? (
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px] text-slate-400 truncate block">{athletesA}</span>
                      {match.placeholderA && (
                        <span className="text-[9px] px-1 rounded bg-[#101e33] text-cyan-300 border border-cyan-800/40 shrink-0 font-medium">
                          {match.placeholderA}
                        </span>
                      )}
                    </div>
                  ) : (
                    !hasTeamA && match.placeholderA && (
                      <span className="text-[10px] text-slate-500 italic block">
                        Vị trí: {match.placeholderA}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Tỉ số Đội A */}
              <div className="flex items-center gap-1 ml-2 font-mono font-black">
                {match.scores.map((set, idx) => (
                  <span
                    key={idx}
                    className={`min-w-7 h-6 px-1.5 rounded-md flex items-center justify-center text-xs ${
                      match.rule.getSetWinner(set.teamA, set.teamB) === 'A'
                        ? 'bg-cyan-500 text-black font-extrabold shadow-sm'
                        : 'bg-[#101e33] text-slate-400'
                    }`}
                  >
                    {set.teamA}
                  </span>
                ))}
              </div>
            </div>

            {/* Đội B */}
            <div
              className={`flex items-center justify-between p-2 rounded-xl transition ${
                teamBWon
                  ? 'bg-cyan-950/40 border border-cyan-500/40'
                  : 'bg-[#091120] border border-[#14233a]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {teamBWon && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <span
                    className={`text-xs block truncate ${
                      hasTeamB
                        ? teamBWon ? 'font-black text-white' : 'font-semibold text-slate-300'
                        : 'text-cyan-400 font-semibold italic'
                    }`}
                  >
                    {teamBName}
                  </span>
                  {athletesB ? (
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px] text-slate-400 truncate block">{athletesB}</span>
                      {match.placeholderB && (
                        <span className="text-[9px] px-1 rounded bg-[#101e33] text-cyan-300 border border-cyan-800/40 shrink-0 font-medium">
                          {match.placeholderB}
                        </span>
                      )}
                    </div>
                  ) : (
                    !hasTeamB && match.placeholderB && (
                      <span className="text-[10px] text-slate-500 italic block">
                        Vị trí: {match.placeholderB}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Tỉ số Đội B */}
              <div className="flex items-center gap-1 ml-2 font-mono font-black">
                {match.scores.map((set, idx) => (
                  <span
                    key={idx}
                    className={`min-w-7 h-6 px-1.5 rounded-md flex items-center justify-center text-xs ${
                      match.rule.getSetWinner(set.teamA, set.teamB) === 'B'
                        ? 'bg-cyan-500 text-black font-extrabold shadow-sm'
                        : 'bg-[#101e33] text-slate-400'
                    }`}
                  >
                    {set.teamB}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer của thẻ: Xem chi tiết / Nhập điểm / Chỉnh sửa nếu admin */}
        {isAdmin && (
          <div className="pt-2 border-t border-[#16263f] flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setScoringMatch(match)}
              className="px-2.5 py-1 bg-[#101e33] hover:bg-cyan-600 hover:text-black text-cyan-300 text-[11px] font-bold rounded-lg border border-[#1d3252] flex items-center gap-1 transition cursor-pointer"
            >
              Nhập Điểm
            </button>
            <button
              type="button"
              onClick={() => setEditingMatch(Match.fromJSON(match.toJSON()))}
              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-[#101e33] rounded-lg border border-[#1d3252] transition cursor-pointer"
              title="Chỉnh sửa trận đấu"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Các tabs lọc vòng
  const stageTabs: Array<{ id: string; label: string; count: number }> = [
    { id: 'ALL', label: 'Tất Cả', count: koMatches.length },
    ...(r16Matches.length > 0
      ? [{ id: 'R16', label: 'Vòng 1/8', count: r16Matches.length }]
      : []),
    ...(qfMatches.length > 0
      ? [{ id: 'QF', label: 'Tứ Kết', count: qfMatches.length }]
      : []),
    ...(sfMatches.length > 0
      ? [{ id: 'SF', label: 'Bán Kết', count: sfMatches.length }]
      : []),
    ...(finalMatches.length > 0 || thirdPlaceMatches.length > 0
      ? [
          {
            id: 'FINALS',
            label: 'Chung Kết & Tranh 3',
            count: finalMatches.length + thirdPlaceMatches.length,
          },
        ]
      : []),
    ...(otherMatches.length > 0
      ? [{ id: 'OTHER', label: 'Vòng Khác', count: otherMatches.length }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* 🏆 BANNER PODIUM VINH DANH NHÀ VÔ ĐỊCH */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-950/90 via-slate-900 to-yellow-950/90 rounded-3xl border-2 border-amber-400/80 p-5 sm:p-6 shadow-[0_0_35px_rgba(251,191,36,0.25)] space-y-4">
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-xl font-black shadow-lg">
              <Trophy className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-wider">
                Vinh Danh Nhà Vô Địch ({category.name})
              </h3>
              <p className="text-xs text-amber-200/70">
                Chúc mừng các vận động viên thi đấu xuất sắc nhất Vòng Chung Kết!
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono text-xs font-bold">
            🏆 CƠ CẤU GIẢI THƯỞNG
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 🥇 VÔ ĐỊCH */}
          <div className="bg-amber-950/60 border border-amber-400/60 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
            <span className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md">
              🥇
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                NHÀ VÔ ĐỊCH
              </span>
              {champion ? (
                <div className="font-black text-white text-xs truncate mt-0.5">
                  {getPodiumAthleteNames(champion)}
                </div>
              ) : (
                <span className="text-xs font-medium text-amber-200/60 italic mt-0.5 block">
                  Chờ kết quả Chung Kết
                </span>
              )}
            </div>
          </div>

          {/* 🥈 Á QUÂN */}
          <div className="bg-slate-900/80 border border-slate-600/60 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
            <span className="w-10 h-10 rounded-xl bg-slate-300 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md">
              🥈
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">
                Á QUÂN (HẠNG 2)
              </span>
              {runnerUp ? (
                <div className="font-black text-white text-xs truncate mt-0.5">
                  {getPodiumAthleteNames(runnerUp)}
                </div>
              ) : (
                <span className="text-xs font-medium text-slate-400 italic mt-0.5 block">
                  Chờ kết quả Chung Kết
                </span>
              )}
            </div>
          </div>

          {/* 🥉 HẠNG BA */}
          <div className="bg-amber-950/40 border border-amber-700/50 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
            <span className="w-10 h-10 rounded-xl bg-amber-700 text-amber-100 font-black text-lg flex items-center justify-center shrink-0 shadow-md">
              🥉
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
                HẠNG BA (HẠNG 3)
              </span>
              {thirdPlace ? (
                <div className="font-black text-white text-xs truncate mt-0.5">
                  {getPodiumAthleteNames(thirdPlace)}
                </div>
              ) : (
                <span className="text-xs font-medium text-amber-200/60 italic mt-0.5 block">
                  Chờ kết quả Tranh 3-4
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DANH SÁCH CÁC TRẬN ĐẤU VÒNG KNOCKOUT */}
      <div className="bg-[#0c1524] rounded-2xl border border-[#16263f] p-4 sm:p-6 space-y-6 shadow-xl">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#16263f]">
          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            Lịch Thi Đấu & Kết Quả Vòng Loại ({category.name})
          </h4>

          {/* Stage Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {stageTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStageTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  selectedStageTab === tab.id
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'bg-[#091120] text-slate-400 hover:text-white border border-[#16263f]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedStageTab === tab.id ? 'bg-black/20 text-black' : 'bg-[#14233a] text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* CÁC PHẦN THEO TỪNG VÒNG */}
        <div className="space-y-6">
          {/* 1. Vòng 1/8 */}
          {r16Matches.length > 0 &&
            (selectedStageTab === 'ALL' || selectedStageTab === 'R16') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#16263f]">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Vòng 1/8 (Round of 16)
                  </span>
                  <span className="text-[11px] text-slate-400">{r16Matches.length} trận</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {r16Matches.map(renderMatchCard)}
                </div>
              </div>
            )}

          {/* 2. Tứ Kết */}
          {qfMatches.length > 0 &&
            (selectedStageTab === 'ALL' || selectedStageTab === 'QF') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#16263f]">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Vòng Tứ Kết (Quarter-Finals)
                  </span>
                  <span className="text-[11px] text-slate-400">{qfMatches.length} trận</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {qfMatches.map(renderMatchCard)}
                </div>
              </div>
            )}

          {/* 3. Bán Kết */}
          {sfMatches.length > 0 &&
            (selectedStageTab === 'ALL' || selectedStageTab === 'SF') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#16263f]">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Vòng Bán Kết (Semi-Finals)
                  </span>
                  <span className="text-[11px] text-slate-400">{sfMatches.length} trận</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sfMatches.map(renderMatchCard)}
                </div>
              </div>
            )}

          {/* 4. Chung Kết & Tranh Hạng Ba */}
          {(finalMatches.length > 0 || thirdPlaceMatches.length > 0) &&
            (selectedStageTab === 'ALL' || selectedStageTab === 'FINALS') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#16263f]">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" />
                    Vòng Chung Kết & Tranh Hạng Ba
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {finalMatches.length + thirdPlaceMatches.length} trận
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {finalMatches.map(renderMatchCard)}
                  {thirdPlaceMatches.map(renderMatchCard)}
                </div>
              </div>
            )}

          {/* 5. Vòng khác (nếu có) */}
          {otherMatches.length > 0 &&
            (selectedStageTab === 'ALL' || selectedStageTab === 'OTHER') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#16263f]">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Các Trận Đấu Khác
                  </span>
                  <span className="text-[11px] text-slate-400">{otherMatches.length} trận</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {otherMatches.map(renderMatchCard)}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Modal Nhập Điểm (nếu Admin thao tác) */}
      {scoringMatch && (
        <ScoreModal
          match={scoringMatch}
          isOpen={true}
          onClose={() => setScoringMatch(null)}
          onSave={handleSaveScore}
        />
      )}

      {/* Modal Chỉnh Sửa Trận (nếu Admin thao tác) */}
      {editingMatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in text-left overscroll-contain"
          onClick={() => setEditingMatch(null)}
        >
          <form
            onSubmit={handleSaveEditMatch}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0c1524] rounded-3xl p-4 sm:p-5 max-w-lg w-full border border-[#16263f] shadow-2xl space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto overflow-x-hidden touch-pan-y"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#16263f]">
              <h4 className="font-bold text-sm text-white">
                Chỉnh Sửa Trận <span className="text-cyan-400 font-mono">{editingMatch.matchCode}</span>
                {editingMatch.roundName && <span className="text-slate-400 font-normal ml-1.5">({editingMatch.roundName})</span>}
              </h4>
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Mã trận đấu</label>
              <input
                type="text"
                value={editingMatch.matchCode}
                onChange={(e) => {
                  editingMatch.matchCode = e.target.value;
                  setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                }}
                className="w-full px-3 py-2 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs font-mono font-bold text-white focus:border-cyan-400 focus:outline-none"
                placeholder="VD: DN-TK-01, DNu-BK-01,..."
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Tên vòng đấu (theo thể thức)
              </label>
              <select
                value={editingMatch.roundName}
                onChange={(e) => {
                  editingMatch.roundName = e.target.value;
                  const matchedStage = knockoutStages.find((s) => s.label === e.target.value);
                  editingMatch.rule = matchedStage?.rule || category.rulesConfig.getRuleForStage(e.target.value);
                  setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                }}
                className="w-full px-3 py-2 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs font-semibold text-cyan-300 focus:border-cyan-400 focus:outline-none cursor-pointer"
                required
              >
                {!knockoutStages.some((st) => st.label === editingMatch.roundName) && (
                  <option value={editingMatch.roundName} className="bg-[#0c1524] text-white">
                    {editingMatch.roundName}
                  </option>
                )}
                {knockoutStages.map((st) => (
                  <option key={st.key} value={st.label} className="bg-[#0c1524] text-white">
                    {st.label} ({st.rule.setsCount} set • {st.rule.pointsPerSet}đ{st.rule.deuceEnabled ? ' deuce' : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Thiết lập Đội 1 (A) */}
            <div className="p-3 bg-[#091120] rounded-2xl border border-[#16263f] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cyan-300">Đội 1 (A)</label>
                <span className="text-[10px] text-slate-400">Placeholder / Vị trí</span>
              </div>
              <div className="space-y-1.5">
                <input
                  type="text"
                  autoComplete="off"
                  value={editingMatch.placeholderA || ''}
                  onChange={(e) => {
                    editingMatch.placeholderA = e.target.value;
                    setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                  }}
                  placeholder="Nhập vị trí (VD: Nhất Bảng A, Thắng TK-01...)"
                  className="w-full px-3 py-2 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      editingMatch.placeholderA = e.target.value;
                      setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-[#101e33] border border-[#1d3252] rounded-xl text-xs text-cyan-300 hover:border-cyan-400 focus:outline-none cursor-pointer truncate"
                  title="Chọn gợi ý vị trí / placeholder"
                >
                  <option value="" disabled>-- Hoặc chọn nhanh từ danh sách gợi ý --</option>
                  {getPlaceholderSuggestions().map((s) => (
                    <option key={`a-${s}`} value={s} className="bg-[#0c1524] text-white">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Đội thực tế (A):
                </label>
                <select
                  value={editingMatch.teamA?.id || ''}
                  onChange={(e) => {
                    const t = allCategoryTeams.find((x) => x.id === e.target.value);
                    editingMatch.teamA = t || null;
                    setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                  }}
                  className="w-full px-3 py-2 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="" className="bg-[#0c1524]">
                    -- {editingMatch.placeholderA ? `Chưa có (sẽ hiện: "${editingMatch.placeholderA}")` : 'Chưa có đội (để trống)'} --
                  </option>
                  {allCategoryTeams.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#0c1524]">
                      {t.getFullSelectLabel ? t.getFullSelectLabel() : t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thiết lập Đội 2 (B) */}
            <div className="p-3 bg-[#091120] rounded-2xl border border-[#16263f] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cyan-300">Đội 2 (B)</label>
                <span className="text-[10px] text-slate-400">Placeholder / Vị trí</span>
              </div>
              <div className="space-y-1.5">
                <input
                  type="text"
                  autoComplete="off"
                  value={editingMatch.placeholderB || ''}
                  onChange={(e) => {
                    editingMatch.placeholderB = e.target.value;
                    setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                  }}
                  placeholder="Nhập vị trí (VD: Nhì Bảng B, Thắng TK-02...)"
                  className="w-full px-3 py-2 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      editingMatch.placeholderB = e.target.value;
                      setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-[#101e33] border border-[#1d3252] rounded-xl text-xs text-cyan-300 hover:border-cyan-400 focus:outline-none cursor-pointer truncate"
                  title="Chọn gợi ý vị trí / placeholder"
                >
                  <option value="" disabled>-- Hoặc chọn nhanh từ danh sách gợi ý --</option>
                  {getPlaceholderSuggestions().map((s) => (
                    <option key={`b-${s}`} value={s} className="bg-[#0c1524] text-white">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Đội thực tế (B):
                </label>
                <select
                  value={editingMatch.teamB?.id || ''}
                  onChange={(e) => {
                    const t = allCategoryTeams.find((x) => x.id === e.target.value);
                    editingMatch.teamB = t || null;
                    setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                  }}
                  className="w-full px-3 py-2 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="" className="bg-[#0c1524]">
                    -- {editingMatch.placeholderB ? `Chưa có (sẽ hiện: "${editingMatch.placeholderB}")` : 'Chưa có đội (để trống)'} --
                  </option>
                  {allCategoryTeams.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#0c1524]">
                      {t.getFullSelectLabel ? t.getFullSelectLabel() : t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Sân</label>
                <select
                  value={editingMatch.court}
                  onChange={(e) => {
                    editingMatch.court = e.target.value;
                    setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                  }}
                  className="w-full px-3 py-2 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  {tournament?.courts.map((c) => (
                    <option key={c} value={c} className="bg-[#0c1524]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Giờ đấu (24h)</label>
                <input
                  type="text"
                  list="time-presets-24h"
                  placeholder="14:00 (24h)"
                  maxLength={5}
                  value={editingMatch.scheduledTime}
                  onChange={(e) => {
                    editingMatch.scheduledTime = e.target.value;
                    setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                  }}
                  className="w-full px-3 py-1.5 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#16263f]">
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-[#121f33] rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black rounded-xl text-xs font-bold transition shadow cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Datalist 24h presets */}
      <datalist id="time-presets-24h">
        <option value="07:00" />
        <option value="07:30" />
        <option value="08:00" />
        <option value="08:25" />
        <option value="08:30" />
        <option value="08:50" />
        <option value="09:00" />
        <option value="09:15" />
        <option value="09:30" />
        <option value="10:00" />
        <option value="10:30" />
        <option value="11:00" />
        <option value="13:30" />
        <option value="14:00" />
        <option value="14:30" />
        <option value="15:00" />
        <option value="15:30" />
        <option value="16:00" />
        <option value="16:30" />
        <option value="17:00" />
        <option value="17:30" />
        <option value="18:00" />
      </datalist>
    </div>
  );
};
