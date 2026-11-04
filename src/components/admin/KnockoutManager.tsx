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

  // Thêm trận knockout tự do
  const [isAddingCustomMatch, setIsAddingCustomMatch] = useState(false);
  const [customRoundName, setCustomRoundName] = useState('Bán kết');
  const [customMatchCode, setCustomMatchCode] = useState('BK-01');
  const [customTeamAId, setCustomTeamAId] = useState('');
  const [customTeamBId, setCustomTeamBId] = useState('');
  const [customCourt, setCustomCourt] = useState(tournament?.courts?.[0] || 'Sân 1');
  const [customTime, setCustomTime] = useState('14:00');

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

    const catCode = category.type === 'MEN_DOUBLES' ? 'DN' : category.type === 'WOMEN_DOUBLES' ? 'DNu' : 'DNN';

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

    const matchRule = category.rulesConfig.getRuleForStage(customRoundName);

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

    const idx = category.knockoutMatches.findIndex((m) => m.id === editingMatch.id);
    if (idx !== -1) {
      category.knockoutMatches[idx] = editingMatch;
      KnockoutScheduler.propagateWinners(category.knockoutMatches);
      await saveTournament(tournament);
    }
    setEditingMatch(null);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-600" />
            Vòng Loại Trực Tiếp / Vòng Trong ({category.name})
          </h3>
          <p className="text-xs text-slate-500">
            Quản trị viên nhập thủ công các đội vào nhánh Bán kết, Chung kết, Tranh 3-4
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingCustomMatch(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Thêm Trận Đơn Lẻ
            </button>

            <button
              type="button"
              onClick={() => setIsSettingUp4Team(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              Thiết Lập Nhánh Bán Kết & Chung Kết
            </button>
          </div>
        )}
      </div>

      {/* Form Thiết Lập Nhánh 4 Đội Chuẩn (Nhất A, Nhì B...) */}
      {isAdmin && isSettingUp4Team && (
        <form
          onSubmit={handleGenerateStandard4Team}
          className="p-5 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-indigo-950">
                Nhập Thủ Công Các Đội Vô Vòng Trong (Bán Kết & Chung Kết)
              </h4>
              <p className="text-xs text-slate-500">
                Chọn các đội Nhất A, Nhì B, Nhất B, Nhì A sau khi kết thúc vòng bảng:
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingUp4Team(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Cặp Bán kết 1 */}
            <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-3">
              <span className="text-xs font-bold text-indigo-800 flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-indigo-600" /> Bán Kết 1 (Nhất A vs Nhì B)
              </span>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Đội Nhất Bảng A:
                </label>
                <select
                  value={team1AId}
                  onChange={(e) => setTeam1AId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                >
                  <option value="">-- Chọn Đội Nhất A --</option>
                  {allCategoryTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Đội Nhì Bảng B:
                </label>
                <select
                  value={team2BId}
                  onChange={(e) => setTeam2BId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                >
                  <option value="">-- Chọn Đội Nhì B --</option>
                  {allCategoryTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cặp Bán kết 2 */}
            <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-3">
              <span className="text-xs font-bold text-indigo-800 flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-indigo-600" /> Bán Kết 2 (Nhất B vs Nhì A)
              </span>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Đội Nhất Bảng B:
                </label>
                <select
                  value={team1BId}
                  onChange={(e) => setTeam1BId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                >
                  <option value="">-- Chọn Đội Nhất B --</option>
                  {allCategoryTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Đội Nhì Bảng A:
                </label>
                <select
                  value={team2AId}
                  onChange={(e) => setTeam2AId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                >
                  <option value="">-- Chọn Đội Nhì A --</option>
                  {allCategoryTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
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
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-100"
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
          className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Thêm Trận Knockout Mới</span>
            <button
              type="button"
              onClick={() => setIsAddingCustomMatch(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Vòng thi đấu</label>
              <input
                type="text"
                placeholder="VD: Tứ kết 1, Bán kết 1..."
                value={customRoundName}
                onChange={(e) => setCustomRoundName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Mã trận</label>
              <input
                type="text"
                value={customMatchCode}
                onChange={(e) => setCustomMatchCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Đội 1 (A)</label>
              <select
                value={customTeamAId}
                onChange={(e) => setCustomTeamAId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Chọn Đội A (hoặc để trống) --</option>
                {allCategoryTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Đội 2 (B)</label>
              <select
                value={customTeamBId}
                onChange={(e) => setCustomTeamBId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Chọn Đội B (hoặc để trống) --</option>
                {allCategoryTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Sân</label>
              <select
                value={customCourt}
                onChange={(e) => setCustomCourt(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {tournament.courts.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Giờ đấu</label>
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingCustomMatch(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
            >
              Tạo Trận
            </button>
          </div>
        </form>
      )}

      {/* Danh sách trận knockout */}
      {category.knockoutMatches.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">
            Chưa có nhánh đấu loại trực tiếp cho nội dung này.
          </p>
          {isAdmin && (
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Nhấn <b>"Thiết Lập Nhánh Bán Kết & Chung Kết"</b> ở trên để chọn thủ công các đội xuất sắc nhất bảng vào tranh tài huy chương!
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {category.knockoutMatches.map((match, idx) => {
            const isFinished = match.status === 'FINISHED';
            const isPlaying = match.status === 'PLAYING';
            const isFinal = match.roundName.includes('Chung kết');
            const isThirdPlace = match.roundName.includes('Tranh') || match.roundName.includes('hạng 3');

            return (
              <div
                key={match.id}
                className={`p-4 rounded-xl border transition flex flex-col md:flex-row items-center justify-between gap-4 ${
                  isFinal
                    ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border-amber-300 shadow-sm'
                    : isThirdPlace
                    ? 'bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-white border-cyan-200'
                    : isFinished
                    ? 'bg-white border-slate-200'
                    : isPlaying
                    ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Vòng & Mã Trận */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isFinal
                        ? 'bg-amber-500 text-white shadow-sm'
                        : isThirdPlace
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isFinal ? 'CK' : isThirdPlace ? 'T3' : idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800">
                        {match.roundName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        ({match.matchCode})
                      </span>
                      {isPlaying && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 fill-current" /> Đang đấu
                        </span>
                      )}
                      {isFinished && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Hoàn thành
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      {match.court && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {match.court}
                        </span>
                      )}
                      {match.scheduledTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {match.scheduledTime}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        ({match.rule.setsCount}c/{match.rule.pointsPerSet}đ)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Đội A vs Đội B & Tỉ số */}
                <div className="flex-1 flex items-center justify-center gap-4 w-full">
                  <div
                    className={`text-right flex-1 font-bold text-sm ${
                      match.winnerId === match.teamA?.id
                        ? 'text-indigo-600 font-extrabold flex items-center justify-end gap-1'
                        : 'text-slate-800'
                    }`}
                  >
                    {match.winnerId === match.teamA?.id && (
                      <Trophy className="w-3.5 h-3.5 text-amber-500 inline" />
                    )}
                    <span>{match.teamA?.getDisplayName() || 'Chờ xác định'}</span>
                  </div>

                  <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono font-bold">
                    {match.scores.map((set, sIdx) => (
                      <span
                        key={sIdx}
                        className={sIdx > 0 ? 'ml-1 pl-1 border-l border-slate-300' : ''}
                      >
                        {set.teamA} - {set.teamB}
                      </span>
                    ))}
                  </div>

                  <div
                    className={`text-left flex-1 font-bold text-sm ${
                      match.winnerId === match.teamB?.id
                        ? 'text-indigo-600 font-extrabold flex items-center gap-1'
                        : 'text-slate-800'
                    }`}
                  >
                    <span>{match.teamB?.getDisplayName() || 'Chờ xác định'}</span>
                    {match.winnerId === match.teamB?.id && (
                      <Trophy className="w-3.5 h-3.5 text-amber-500 inline" />
                    )}
                  </div>
                </div>

                {/* Hành động */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setScoringMatch(match)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition"
                    >
                      Nhập Điểm
                    </button>
                  )}

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingMatch(Match.fromJSON(match.toJSON()))}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Chỉnh sửa trận"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMatch(match.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Xóa trận"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Sửa Trận Knockout */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSaveEditMatch}
            className="bg-white rounded-2xl p-5 max-w-md w-full border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-800">
                Chỉnh Sửa Trận {editingMatch.roundName}
              </h4>
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Tên vòng đấu</label>
              <input
                type="text"
                value={editingMatch.roundName}
                onChange={(e) => {
                  editingMatch.roundName = e.target.value;
                  setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Đội 1 (A)</label>
              <select
                value={editingMatch.teamA?.id || ''}
                onChange={(e) => {
                  const t = allCategoryTeams.find((x) => x.id === e.target.value);
                  editingMatch.teamA = t || null;
                  setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Chọn Đội A (hoặc để trống) --</option>
                {allCategoryTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Đội 2 (B)</label>
              <select
                value={editingMatch.teamB?.id || ''}
                onChange={(e) => {
                  const t = allCategoryTeams.find((x) => x.id === e.target.value);
                  editingMatch.teamB = t || null;
                  setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Chọn Đội B (hoặc để trống) --</option>
                {allCategoryTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Sân</label>
                <select
                  value={editingMatch.court}
                  onChange={(e) => {
                    editingMatch.court = e.target.value;
                    setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {tournament.courts.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Giờ đấu</label>
                <input
                  type="time"
                  value={editingMatch.scheduledTime}
                  onChange={(e) => {
                    editingMatch.scheduledTime = e.target.value;
                    setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                  }}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
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
    </div>
  );
};
