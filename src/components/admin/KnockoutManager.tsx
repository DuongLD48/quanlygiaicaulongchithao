import React, { useState } from 'react';
import { Category, Match } from '../../models';
import { useTournament } from '../../context/TournamentContext';
import { KnockoutScheduler } from '../../engine';
import { ScoreModal } from './ScoreModal';
import {
  Trophy,
  GitBranch,
  Medal,
  Play,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';

interface Props {
  category: Category;
}

export const KnockoutManager: React.FC<Props> = ({ category }) => {
  const { tournament, saveTournament, isAdmin, isRealtimeConnected, connectionError } = useTournament();
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);

  const isLocked = !isRealtimeConnected || !!connectionError;

  // Form thiết lập nhánh 4 đội nhanh (Nhất A - Nhì B, Nhất B - Nhì A)
  const [isSettingUp4Team, setIsSettingUp4Team] = useState(false);
  const [team1AId, setTeam1AId] = useState('');
  const [team2BId, setTeam2BId] = useState('');
  const [team1BId, setTeam1BId] = useState('');
  const [team2AId, setTeam2AId] = useState('');

  // Chỉnh sửa trận knockout
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // Danh sách các vòng knockout lấy trực tiếp từ Tùy Chỉnh Thể Thức Thi Đấu
  const knockoutStages = [
    { key: 'roundOf16', label: 'Vòng 1/8', prefix: 'V18', rule: category.rulesConfig.roundOf16 },
    { key: 'quarterFinals', label: 'Tứ Kết', prefix: 'TK', rule: category.rulesConfig.quarterFinals },
    { key: 'semiFinals', label: 'Bán Kết', prefix: 'BK', rule: category.rulesConfig.semiFinals },
    { key: 'finals', label: 'Chung Kết', prefix: 'CK', rule: category.rulesConfig.finals },
    { key: 'thirdPlace', label: 'Tranh Hạng 3', prefix: 'TH3', rule: category.rulesConfig.thirdPlace },
  ];

  // Thêm trận knockout tự do
  const getCatCode = () => category.getShortCode();

  const [isAddingCustomMatch, setIsAddingCustomMatch] = useState(false);
  const [customRoundName, setCustomRoundName] = useState('Bán Kết');
  const [customMatchCode, setCustomMatchCode] = useState(() => `${getCatCode()}-BK-01`);
  const [customTeamAId, setCustomTeamAId] = useState('');
  const [customTeamBId, setCustomTeamBId] = useState('');
  const [customCourt, setCustomCourt] = useState(tournament?.courts?.[0] || 'Sân 1');
  const [customTime, setCustomTime] = useState('14:00');

  const handleStageSelectChange = (stageLabel: string) => {
    setCustomRoundName(stageLabel);
    const catCode = getCatCode();
    const stage = knockoutStages.find((s) => s.label === stageLabel);
    const prefix = stage ? stage.prefix : 'KO';
    const countInStage = category.knockoutMatches.filter((m) =>
      m.roundName.toLowerCase().includes(stageLabel.toLowerCase())
    ).length;
    setCustomMatchCode(`${catCode}-${prefix}-${String(countInStage + 1).padStart(2, '0')}`);
  };

  const handleOpenAddCustomMatch = () => {
    const catCode = getCatCode();
    const defaultStage = knockoutStages[2]; // Bán Kết
    setCustomRoundName(defaultStage.label);
    const countInStage = category.knockoutMatches.filter((m) =>
      m.roundName.toLowerCase().includes(defaultStage.label.toLowerCase())
    ).length;
    setCustomMatchCode(`${catCode}-${defaultStage.prefix}-${String(countInStage + 1).padStart(2, '0')}`);
    setIsAddingCustomMatch(true);
  };

  if (!tournament) return null;

  const allCategoryTeams = category.getAllTeams();

  // Khởi tạo bộ khung 4 đội (Bán kết + Chung kết + Tranh 3-4)
  const handleGenerateStandard4Team = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert('Không thể tạo nhánh: Mất kết nối tới Database!');
      return;
    }

    const team1A = allCategoryTeams.find((t) => t.id === team1AId) || null;
    const team2B = allCategoryTeams.find((t) => t.id === team2BId) || null;
    const team1B = allCategoryTeams.find((t) => t.id === team1BId) || null;
    const team2A = allCategoryTeams.find((t) => t.id === team2AId) || null;

    const catCode = getCatCode();

    const matches = KnockoutScheduler.createStandard4TeamKnockout(
      category.id,
      catCode,
      category.rulesConfig,
      tournament.courts,
      '14:00',
      '15:30',
      team1A,
      team2B,
      team1B,
      team2A
    );

    category.knockoutMatches = matches;
    await saveTournament(tournament);
    setIsSettingUp4Team(false);
  };

  // Cập nhật điểm cho trận Knockout
  const handleSaveScore = async (updatedMatch: Match) => {
    const idx = category.knockoutMatches.findIndex((m) => m.id === updatedMatch.id);
    if (idx !== -1) {
      category.knockoutMatches[idx] = updatedMatch;

      // Tự động chuyển đội thắng vào Chung kết và đội thua vào Tranh 3-4
      KnockoutScheduler.propagateWinners(category.knockoutMatches);

      await saveTournament(tournament);
    }
  };

  // Xóa trận knockout
  const handleDeleteMatch = async (matchId: string) => {
    if (confirm('Bạn có chắc muốn xóa trận đấu này trong nhánh knockout?')) {
      category.knockoutMatches = category.knockoutMatches.filter((m) => m.id !== matchId);
      await saveTournament(tournament);
    }
  };

  // Thêm trận knockout tự do
  const handleAddCustomMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const teamA = allCategoryTeams.find((t) => t.id === customTeamAId) || null;
    const teamB = allCategoryTeams.find((t) => t.id === customTeamBId) || null;

    const matchedStage = knockoutStages.find((s) => s.label === customRoundName);
    const matchRule = matchedStage?.rule || category.rulesConfig.getRuleForStage(customRoundName);

    const newMatch = KnockoutScheduler.createCustomKnockoutMatch(
      category.id,
      customRoundName,
      customMatchCode,
      matchRule,
      teamA,
      teamB,
      customCourt,
      customTime
    );

    category.knockoutMatches.push(newMatch);
    await saveTournament(tournament);
    setIsAddingCustomMatch(false);
  };

  // Sửa trận knockout
  const handleSaveEditMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;

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

  return (
    <div className="bg-[#0c1524] rounded-2xl p-4 sm:p-5 shadow-xl border border-[#16263f] space-y-5 text-slate-100">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#16263f]">
        <div>
          <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-cyan-400" />
            Vòng Loại Trực Tiếp / Vòng Trong ({category.name})
          </h3>
          <p className="text-[11px] text-slate-400">
            Quản trị viên thiết lập các đội vào nhánh Bán kết, Chung kết, Tranh 3-4
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddCustomMatch}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#091120] hover:bg-[#11233e] text-slate-200 border border-[#192b45] rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              Thêm Trận Đơn Lẻ
            </button>

            <button
              type="button"
              onClick={() => setIsSettingUp4Team(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-black rounded-xl text-xs shadow-lg shadow-cyan-600/20 transition cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              Thiết Lập Nhánh Bán Kết & Chung Kết
            </button>
          </div>
        )}
      </div>

      {/* Form Thiết Lập Nhánh 4 Đội Chuẩn (Nhất A, Nhì B...) */}
      {isAdmin && isSettingUp4Team && (
        <form
          onSubmit={handleGenerateStandard4Team}
          className="p-5 bg-[#070d19]/90 border border-[#1d3252] rounded-2xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-white">
                Nhập Thủ Công Các Đội Vô Vòng Trong (Bán Kết & Chung Kết)
              </h4>
              <p className="text-xs text-slate-400">
                Chọn các đội Nhất A, Nhì B, Nhất B, Nhì A sau khi kết thúc vòng bảng:
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingUp4Team(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Cặp Bán kết 1 */}
            <div className="p-3.5 bg-[#091120] rounded-xl border border-[#16263f] space-y-3">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Medal className="w-3.5 h-3.5 text-cyan-400" /> Bán Kết 1 (Nhất A vs Nhì B)
              </span>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Đội Nhất Bảng A:
                </label>
                <select
                  value={team1AId}
                  onChange={(e) => setTeam1AId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                  required
                >
                  <option value="" className="bg-[#0c1524]">-- Chọn Đội Nhất A --</option>
                  {allCategoryTeams.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#0c1524]">
                      {t.getFullSelectLabel ? t.getFullSelectLabel() : t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Đội Nhì Bảng B:
                </label>
                <select
                  value={team2BId}
                  onChange={(e) => setTeam2BId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                  required
                >
                  <option value="" className="bg-[#0c1524]">-- Chọn Đội Nhì B --</option>
                  {allCategoryTeams.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#0c1524]">
                      {t.getFullSelectLabel ? t.getFullSelectLabel() : t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cặp Bán kết 2 */}
            <div className="p-3.5 bg-[#091120] rounded-xl border border-[#16263f] space-y-3">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Medal className="w-3.5 h-3.5 text-cyan-400" /> Bán Kết 2 (Nhất B vs Nhì A)
              </span>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Đội Nhất Bảng B:
                </label>
                <select
                  value={team1BId}
                  onChange={(e) => setTeam1BId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                  required
                >
                  <option value="" className="bg-[#0c1524]">-- Chọn Đội Nhất B --</option>
                  {allCategoryTeams.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#0c1524]">
                      {t.getFullSelectLabel ? t.getFullSelectLabel() : t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Đội Nhì Bảng A:
                </label>
                <select
                  value={team2AId}
                  onChange={(e) => setTeam2AId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                  required
                >
                  <option value="" className="bg-[#0c1524]">-- Chọn Đội Nhì A --</option>
                  {allCategoryTeams.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#0c1524]">
                      {t.getFullSelectLabel ? t.getFullSelectLabel() : t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsSettingUp4Team(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-[#121f33] rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-black rounded-xl text-xs font-bold transition shadow cursor-pointer"
            >
              Khởi Tạo Nhánh Knockout
            </button>
          </div>
        </form>
      )}

      {/* Form thêm trận đơn lẻ */}
      {isAdmin && isAddingCustomMatch && (
        <form
          onSubmit={handleAddCustomMatch}
          className="p-4 bg-[#070d19]/90 border border-[#1d3252] rounded-2xl space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300">Thêm Trận Knockout Mới</span>
            <button
              type="button"
              onClick={() => setIsAddingCustomMatch(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Vòng thi đấu
              </label>
              <select
                value={customRoundName}
                onChange={(e) => handleStageSelectChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs font-semibold text-cyan-300 focus:border-cyan-400 focus:outline-none cursor-pointer"
                required
              >
                {knockoutStages.map((st) => (
                  <option key={st.key} value={st.label} className="bg-[#0c1524] text-white">
                    {st.label} ({st.rule.setsCount} set • {st.rule.pointsPerSet}đ{st.rule.deuceEnabled ? ' deuce' : ''})
                  </option>
                ))}
              </select>
              {(() => {
                const currentRule = knockoutStages.find((s) => s.label === customRoundName)?.rule;
                if (!currentRule) return null;
                return (
                  <p className="text-[10px] text-cyan-400/80 mt-1">
                    Thể thức: {currentRule.setsCount} set • {currentRule.pointsPerSet} điểm {currentRule.deuceEnabled ? `(Cách biệt 2đ, max ${currentRule.maxPoints}đ)` : '(Không deuce)'}
                  </p>
                );
              })()}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Mã trận</label>
              <input
                type="text"
                value={customMatchCode}
                onChange={(e) => setCustomMatchCode(e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs font-mono font-bold text-white focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Đội 1 (A)</label>
              <select
                value={customTeamAId}
                onChange={(e) => setCustomTeamAId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="" className="bg-[#0c1524]">-- Chọn Đội A (hoặc để trống) --</option>
                {allCategoryTeams.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0c1524]">
                    {t.getFullSelectLabel ? t.getFullSelectLabel() : t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Đội 2 (B)</label>
              <select
                value={customTeamBId}
                onChange={(e) => setCustomTeamBId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="" className="bg-[#0c1524]">-- Chọn Đội B (hoặc để trống) --</option>
                {allCategoryTeams.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0c1524]">
                    {t.getFullSelectLabel ? t.getFullSelectLabel() : t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Sân</label>
              <select
                value={customCourt}
                onChange={(e) => setCustomCourt(e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                {tournament.courts.map((c) => (
                  <option key={c} value={c} className="bg-[#0c1524]">{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Giờ đấu (24h)</label>
              <input
                type="text"
                list="time-presets-24h"
                placeholder="14:00 (24h)"
                maxLength={5}
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingCustomMatch(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-[#121f33] rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl text-xs transition shadow cursor-pointer"
            >
              Tạo Trận
            </button>
          </div>
        </form>
      )}

      {/* Danh sách trận knockout */}
      {category.knockoutMatches.length === 0 ? (
        <div className="text-center py-12 bg-[#070d19]/60 rounded-2xl border border-dashed border-[#1d3252] space-y-3">
          <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            Chưa có nhánh đấu loại trực tiếp cho nội dung này.
          </p>
          {isAdmin && (
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Nhấn <b className="text-cyan-400">"Thiết Lập Nhánh Bán Kết & Chung Kết"</b> ở trên để chọn thủ công các đội xuất sắc nhất bảng vào tranh tài huy chương!
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {category.knockoutMatches.map((match, idx) => {
            const isFinished = match.status === 'FINISHED';
            const isPlaying = match.status === 'PLAYING';
            const isFinal = match.roundName.includes('Chung kết');
            const isThirdPlace = match.roundName.includes('Tranh') || match.roundName.includes('hạng 3');
            const teamAWon = match.winnerId === match.teamA?.id;
            const teamBWon = match.winnerId === match.teamB?.id;

            return (
              <div
                key={match.id}
                className={`bg-[#0c1524] rounded-2xl border p-4 shadow-xl transition flex flex-col justify-between ${
                  isFinal
                    ? 'border-amber-400/80 ring-2 ring-amber-400/20'
                    : isThirdPlace
                    ? 'border-cyan-400/80 ring-2 ring-cyan-400/20'
                    : isPlaying
                    ? 'border-amber-400/80 ring-2 ring-amber-400/20'
                    : isFinished
                    ? 'border-cyan-500/40'
                    : 'border-[#16263f] hover:border-cyan-800/40'
                }`}
              >
                {/* Header Card */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#16263f]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                        isFinal
                          ? 'bg-amber-400 text-black font-black shadow-sm'
                          : isThirdPlace
                          ? 'bg-cyan-400 text-black font-black shadow-sm'
                          : 'bg-[#101e33] border border-[#1d3252] text-cyan-300 font-mono'
                      }`}
                    >
                      {isFinal ? 'CK' : isThirdPlace ? 'T3' : idx + 1}
                    </span>
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
                  <div
                    className={`flex items-center justify-between p-2 rounded-xl transition ${
                      teamAWon ? 'bg-cyan-950/40 border border-cyan-500/30' : 'bg-[#091120]'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {teamAWon && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <div className="min-w-0">
                        <div
                          className={`text-xs truncate ${
                            teamAWon ? 'font-black text-white' : 'font-semibold text-slate-300'
                          }`}
                        >
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
                  <div
                    className={`flex items-center justify-between p-2 rounded-xl transition ${
                      teamBWon ? 'bg-cyan-950/40 border border-cyan-500/30' : 'bg-[#091120]'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {teamBWon && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <div className="min-w-0">
                        <div
                          className={`text-xs truncate ${
                            teamBWon ? 'font-black text-white' : 'font-semibold text-slate-300'
                          }`}
                        >
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
                        <MapPin className="w-3 h-3 text-cyan-400/70" />
                        {match.court}
                      </span>
                    )}
                    {match.scheduledTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400/70" />
                        {match.scheduledTime}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500">
                      ({match.rule.setsCount}c/{match.rule.pointsPerSet}đ)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Nhập điểm */}
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
                      >
                        Nhập Điểm
                      </button>
                    )}

                    {/* Sửa & Xóa */}
                    {isAdmin && (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setEditingMatch(Match.fromJSON(match.toJSON()))}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-[#101e33] rounded-lg transition cursor-pointer"
                          title="Chỉnh sửa trận"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMatch(match.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          title="Xóa trận"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Sửa Trận Knockout */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <form
            onSubmit={handleSaveEditMatch}
            className="bg-[#0c1524] rounded-3xl p-5 max-w-md w-full border border-[#16263f] shadow-2xl space-y-4 text-slate-100"
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
              {(() => {
                const currentRule = knockoutStages.find((s) => s.label === editingMatch.roundName)?.rule || editingMatch.rule;
                if (!currentRule) return null;
                return (
                  <p className="text-[10px] text-cyan-400/80 mt-1">
                    Thể thức: {currentRule.setsCount} set • {currentRule.pointsPerSet} điểm {currentRule.deuceEnabled ? `(Cách biệt 2đ, max ${currentRule.maxPoints}đ)` : '(Không deuce)'}
                  </p>
                );
              })()}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Đội 1 (A)</label>
              <select
                value={editingMatch.teamA?.id || ''}
                onChange={(e) => {
                  const t = allCategoryTeams.find((x) => x.id === e.target.value);
                  editingMatch.teamA = t || null;
                  setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                }}
                className="w-full px-3 py-2 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="" className="bg-[#0c1524]">-- Chọn Đội A (hoặc để trống) --</option>
                {allCategoryTeams.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0c1524]">
                    {t.getFullSelectLabel ? t.getFullSelectLabel() : t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Đội 2 (B)</label>
              <select
                value={editingMatch.teamB?.id || ''}
                onChange={(e) => {
                  const t = allCategoryTeams.find((x) => x.id === e.target.value);
                  editingMatch.teamB = t || null;
                  setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                }}
                className="w-full px-3 py-2 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="" className="bg-[#0c1524]">-- Chọn Đội B (hoặc để trống) --</option>
                {allCategoryTeams.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0c1524]">
                    {t.getFullSelectLabel ? t.getFullSelectLabel() : t.name}
                  </option>
                ))}
              </select>
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
                  {tournament.courts.map((c) => (
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

      {/* Modal Nhập Điểm */}
      {scoringMatch && (
        <ScoreModal
          match={scoringMatch}
          isOpen={true}
          onClose={() => setScoringMatch(null)}
          onSave={handleSaveScore}
        />
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
        <option value="18:30" />
        <option value="19:00" />
        <option value="19:30" />
        <option value="20:00" />
        <option value="20:30" />
        <option value="21:00" />
      </datalist>
    </div>
  );
};
