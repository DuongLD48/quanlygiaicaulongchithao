import React, { useState } from 'react';
import { Category, Match } from '../../models';
import { useTournament } from '../../context/TournamentContext';
import { RoundRobinScheduler } from '../../engine';
import { ScoreModal } from './ScoreModal';
import {
  Shuffle,
  Clock,
  MapPin,
  Edit2,
  Trash2,
  Plus,
  Play,
  CheckCircle2,
  ArrowRightLeft,
  Calendar,
  X,
  Trophy,
} from 'lucide-react';

interface Props {
  category: Category;
}

export const FixtureManager: React.FC<Props> = ({ category }) => {
  const { tournament, saveTournament, isAdmin, isRealtimeConnected, connectionError } = useTournament();

  const isLocked = !isRealtimeConnected || !!connectionError;

  const [activeGroupId, setActiveGroupId] = useState<string>(
    category.groups[0]?.id || ''
  );
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);

  // Chỉnh sửa cặp đấu
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // Thêm trận mới
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [newTeamAId, setNewTeamAId] = useState('');
  const [newTeamBId, setNewTeamBId] = useState('');
  const [newCourt, setNewCourt] = useState(tournament?.courts?.[0] || 'Sân 1');
  const [newTime, setNewTime] = useState('08:00');

  const activeGroup =
    category.groups.find((g) => g.id === activeGroupId) || category.groups[0];

  if (!tournament) return null;

  // ==========================================
  // XẾP TRẬN TỰ ĐỘNG RANDOM CHO VÒNG BẢNG
  // ==========================================
  const handleAutoGenerateRandomFixtures = async () => {
    if (isLocked) {
      alert('Không thể bốc thăm: Mất kết nối tới Database!');
      return;
    }
    if (!activeGroup) return;

    if (activeGroup.teams.length < 2) {
      alert(`Bảng ${activeGroup.name} cần tối thiểu 2 đội để xếp trận!`);
      return;
    }

    if (
      activeGroup.matches.length > 0 &&
      !confirm(
        `Bảng ${activeGroup.name} đã có sẵn ${activeGroup.matches.length} trận đấu. Bạn có muốn xếp lại ngẫu nhiên không? Các tỉ số cũ của bảng này sẽ bị xóa.`
      )
    ) {
      return;
    }

    // Lấy quy tắc cho vòng bảng
    const groupRule = category.rulesConfig.groupStage;
    const catCode = category.getShortCode();

    const generated = RoundRobinScheduler.generateMatches(activeGroup.teams, {
      categoryId: category.id,
      categoryCode: catCode,
      groupId: activeGroup.id,
      groupName: activeGroup.name,
      rule: groupRule,
      courts: tournament.courts,
      startTime: '08:00',
      matchDurationMinutes: 25,
      randomize: true, // XẾP RANDOM THEO YÊU CẦU
    });

    activeGroup.matches = generated;
    await saveTournament(tournament);
  };

  // Đổi chỗ Team A và Team B
  const handleSwapTeams = async (match: Match) => {
    match.swapTeams();
    await saveTournament(tournament);
  };

  // Xóa trận
  const handleDeleteMatch = async (matchId: string) => {
    if (!activeGroup) return;
    if (confirm('Bạn có chắc muốn xóa trận đấu này?')) {
      activeGroup.matches = activeGroup.matches.filter((m) => m.id !== matchId);
      await saveTournament(tournament);
    }
  };

  // Lưu chỉnh sửa trận
  const handleSaveEditMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch || !activeGroup) return;

    const idx = activeGroup.matches.findIndex((m) => m.id === editingMatch.id);
    if (idx !== -1) {
      activeGroup.matches[idx] = editingMatch;
      await saveTournament(tournament);
    }
    setEditingMatch(null);
  };

  // Thêm trận đấu thủ công
  const handleCreateManualMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !newTeamAId || !newTeamBId) return;

    if (newTeamAId === newTeamBId) {
      alert('Không thể chọn cùng một đội thi đấu với chính mình!');
      return;
    }

    const teamA = activeGroup.findTeam(newTeamAId);
    const teamB = activeGroup.findTeam(newTeamBId);
    if (!teamA || !teamB) return;

    const matchNumber = activeGroup.matches.length + 1;
    const catCode = category.getShortCode();
    const groupShort = activeGroup.name.replace(/\s+/g, '').replace('Bảng', 'B');

    const newMatch = new Match(
      `match_${activeGroup.id}_manual_${Date.now()}`,
      `${catCode}-${groupShort}-${matchNumber.toString().padStart(2, '0')}`,
      category.id,
      'GROUP',
      `Vòng bảng - ${activeGroup.name}`,
      newCourt,
      newTime,
      teamA,
      teamB,
      category.rulesConfig.groupStage,
      [{ teamA: 0, teamB: 0 }],
      'PENDING',
      null,
      activeGroup.id,
      activeGroup.name
    );

    activeGroup.matches.push(newMatch);
    await saveTournament(tournament);
    setIsAddingMatch(false);
    setNewTeamAId('');
    setNewTeamBId('');
  };

  // Cập nhật điểm từ Modal
  const handleSaveScore = async (updatedMatch: Match) => {
    if (!activeGroup) return;
    const idx = activeGroup.matches.findIndex((m) => m.id === updatedMatch.id);
    if (idx !== -1) {
      activeGroup.matches[idx] = updatedMatch;
      await saveTournament(tournament);
    }
  };

  return (
    <div className="bg-[#0c1524] rounded-2xl p-4 sm:p-5 shadow-xl border border-[#16263f] space-y-5 text-slate-100">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#16263f]">
        <div>
          <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Lịch Thi Đấu Vòng Bảng ({category.name})
          </h3>
          <p className="text-[11px] text-slate-400">
            Xem lịch thi đấu, bốc thăm random tự động hoặc chỉnh sửa các cặp đấu
          </p>
        </div>

        {/* Action Buttons for Admin */}
        {isAdmin && activeGroup && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingMatch(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#091120] hover:bg-[#11233e] text-slate-200 border border-[#192b45] rounded-xl text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              Thêm Trận Thủ Công
            </button>

            <button
              type="button"
              onClick={handleAutoGenerateRandomFixtures}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-black rounded-xl text-xs shadow-lg shadow-cyan-600/20 transition cursor-pointer"
              title="Tự động bốc thăm xếp cặp đấu ngẫu nhiên cho bảng hiện tại"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Xếp Trận Random Tự Động
            </button>
          </div>
        )}
      </div>

      {/* Tabs Bảng */}
      <div className="flex flex-wrap gap-2">
        {category.groups.map((group) => {
          const isSelected = activeGroup?.id === group.id;
          return (
            <button
              key={group.id}
              onClick={() => setActiveGroupId(group.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.3)] font-black'
                  : 'bg-[#091120] hover:bg-[#11233e] text-slate-300 border-[#192b45]'
              }`}
            >
              {group.name} ({group.matches.length} trận)
            </button>
          );
        })}
      </div>

      {/* Form thêm trận thủ công */}
      {isAdmin && isAddingMatch && activeGroup && (
        <form onSubmit={handleCreateManualMatch} className="p-4 bg-[#070d19]/90 border border-[#1d3252] rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300">Thêm Trận Đấu Vào {activeGroup.name}</span>
            <button
              type="button"
              onClick={() => setIsAddingMatch(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Đội 1 (A)</label>
              <select
                value={newTeamAId}
                onChange={(e) => setNewTeamAId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
                required
              >
                <option value="" className="bg-[#0c1524]">-- Chọn Đội A --</option>
                {activeGroup.teams.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0c1524]">
                    {t.getFullSelectLabel ? t.getFullSelectLabel() : t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Đội 2 (B)</label>
              <select
                value={newTeamBId}
                onChange={(e) => setNewTeamBId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
                required
              >
                <option value="" className="bg-[#0c1524]">-- Chọn Đội B --</option>
                {activeGroup.teams.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0c1524]">
                    {t.getFullSelectLabel ? t.getFullSelectLabel() : t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Sân đấu</label>
              <select
                value={newCourt}
                onChange={(e) => setNewCourt(e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                {tournament.courts.map((c) => (
                  <option key={c} value={c} className="bg-[#0c1524]">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Giờ đấu (24h)</label>
              <input
                type="text"
                list="time-presets-24h"
                placeholder="08:00 (24h)"
                maxLength={5}
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingMatch(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-[#121f33] rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl text-xs transition shadow cursor-pointer"
            >
              Tạo Trận Đấu
            </button>
          </div>
        </form>
      )}

      {/* Danh sách trận đấu */}
      {!activeGroup || activeGroup.matches.length === 0 ? (
        <div className="text-center py-12 bg-[#070d19]/60 rounded-2xl border border-dashed border-[#1d3252] space-y-3">
          <p className="text-sm font-semibold text-slate-300">
            Chưa có lịch thi đấu cho {activeGroup?.name || 'bảng này'}.
          </p>
          {isAdmin && (
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Hãy nhấn nút <b className="text-cyan-400">"Xếp Trận Random Tự Động"</b> ở góc phải trên để hệ thống tự động bốc thăm và lên lịch cho toàn bộ các cặp đấu!
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeGroup.matches.map((match, index) => {
            const isFinished = match.status === 'FINISHED';
            const isPlaying = match.status === 'PLAYING';
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
                    : 'border-[#16263f] hover:border-cyan-800/40'
                }`}
              >
                {/* Header Card */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#16263f]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#101e33] border border-[#1d3252] text-cyan-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                      {index + 1}
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

                    {/* Sửa cặp đấu & Đổi chỗ */}
                    {isAdmin && (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleSwapTeams(match)}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-[#101e33] rounded-lg transition cursor-pointer"
                          title="Đổi sân / đổi vị trí đội A và B"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingMatch(Match.fromJSON(match.toJSON()))}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-[#101e33] rounded-lg transition cursor-pointer"
                          title="Chỉnh sửa chi tiết trận đấu"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMatch(match.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          title="Xóa trận này"
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

      {/* Modal Sửa Trận Đấu Thủ Công */}
      {editingMatch && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <form
            onSubmit={handleSaveEditMatch}
            className="bg-[#0c1524] rounded-3xl p-5 max-w-md w-full border border-[#16263f] shadow-2xl space-y-4 text-slate-100"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#16263f]">
              <h4 className="font-bold text-sm text-white">
                Chỉnh Sửa Trận <span className="text-cyan-400 font-mono">{editingMatch.matchCode}</span>
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
              <label className="text-xs font-semibold text-slate-300 block mb-1">Mã trận</label>
              <input
                type="text"
                value={editingMatch.matchCode}
                onChange={(e) => {
                  editingMatch.matchCode = e.target.value;
                  setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                }}
                className="w-full px-3 py-2 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs font-mono font-bold text-white focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Đội 1 (A)</label>
              <select
                value={editingMatch.teamA?.id || ''}
                onChange={(e) => {
                  const t = activeGroup.findTeam(e.target.value);
                  editingMatch.teamA = t || null;
                  setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                }}
                className="w-full px-3 py-2 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="" className="bg-[#0c1524]">-- Chọn Đội A --</option>
                {activeGroup.teams.map((t) => (
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
                  const t = activeGroup.findTeam(e.target.value);
                  editingMatch.teamB = t || null;
                  setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                }}
                className="w-full px-3 py-2 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="" className="bg-[#0c1524]">-- Chọn Đội B --</option>
                {activeGroup.teams.map((t) => (
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
                  placeholder="08:00 (24h)"
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
