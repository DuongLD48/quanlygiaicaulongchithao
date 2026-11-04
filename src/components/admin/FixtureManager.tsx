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
    const catCode = category.type === 'MEN_DOUBLES' ? 'DN' : category.type === 'WOMEN_DOUBLES' ? 'DNu' : 'DNN';

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
    const catCode = category.type === 'MEN_DOUBLES' ? 'DN' : category.type === 'WOMEN_DOUBLES' ? 'DNu' : 'DNN';
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
        <form onSubmit={handleCreateManualMatch} className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900">Thêm Trận Đấu Vào {activeGroup.name}</span>
            <button
              type="button"
              onClick={() => setIsAddingMatch(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Đội 1 (A)</label>
              <select
                value={newTeamAId}
                onChange={(e) => setNewTeamAId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              >
                <option value="">-- Chọn Đội A --</option>
                {activeGroup.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Đội 2 (B)</label>
              <select
                value={newTeamBId}
                onChange={(e) => setNewTeamBId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              >
                <option value="">-- Chọn Đội B --</option>
                {activeGroup.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Sân đấu</label>
              <select
                value={newCourt}
                onChange={(e) => setNewCourt(e.target.value)}
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
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Giờ đấu</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingMatch(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
            >
              Tạo Trận Đấu
            </button>
          </div>
        </form>
      )}

      {/* Danh sách trận đấu */}
      {!activeGroup || activeGroup.matches.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <p className="text-sm font-semibold text-slate-600">
            Chưa có lịch thi đấu cho {activeGroup?.name || 'bảng này'}.
          </p>
          {isAdmin && (
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Hãy nhấn nút <b>"Xếp Trận Random Tự Động"</b> ở góc phải trên để hệ thống tự động bốc thăm và lên lịch cho toàn bộ các cặp đấu!
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {activeGroup.matches.map((match, index) => {
            const isFinished = match.status === 'FINISHED';
            const isPlaying = match.status === 'PLAYING';

            return (
              <div
                key={match.id}
                className={`p-4 rounded-xl border transition flex flex-col md:flex-row items-center justify-between gap-4 ${
                  isFinished
                    ? 'bg-white border-slate-200'
                    : isPlaying
                    ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Cột thông tin: Mã, Sân, Giờ */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {match.matchCode}
                      </span>
                      {isPlaying && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                          <Play className="w-2.5 h-2.5 fill-current" /> Đang đấu
                        </span>
                      )}
                      {isFinished && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Đã xong
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
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
                    </div>
                  </div>
                </div>

                {/* Cột Cặp Đấu & Tỉ Số */}
                <div className="flex-1 flex items-center justify-center gap-4 w-full">
                  {/* Đội A */}
                  <div
                    className={`text-right flex-1 font-bold text-sm ${
                      match.winnerId === match.teamA?.id
                        ? 'text-indigo-600 font-extrabold'
                        : 'text-slate-800'
                    }`}
                  >
                    {match.teamA?.getDisplayName() || 'Chờ đội A'}
                  </div>

                  {/* Tỉ số hiển thị */}
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

                  {/* Đội B */}
                  <div
                    className={`text-left flex-1 font-bold text-sm ${
                      match.winnerId === match.teamB?.id
                        ? 'text-indigo-600 font-extrabold'
                        : 'text-slate-800'
                    }`}
                  >
                    {match.teamB?.getDisplayName() || 'Chờ đội B'}
                  </div>
                </div>

                {/* Các nút bấm thao tác */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {/* Nhập điểm */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setScoringMatch(match)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition"
                    >
                      Nhập Điểm
                    </button>
                  )}

                  {/* Sửa cặp đấu & Đổi chỗ */}
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSwapTeams(match)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                        title="Đổi sân / đổi vị trí đội A và B"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingMatch(Match.fromJSON(match.toJSON()))}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Chỉnh sửa chi tiết trận đấu"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteMatch(match.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Xóa trận này"
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

      {/* Modal Sửa Trận Đấu Thủ Công */}
      {editingMatch && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSaveEditMatch}
            className="bg-white rounded-2xl p-5 max-w-md w-full border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-800">
                Chỉnh Sửa Trận {editingMatch.matchCode}
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
              <label className="text-xs font-semibold text-slate-600 block mb-1">Mã trận</label>
              <input
                type="text"
                value={editingMatch.matchCode}
                onChange={(e) => {
                  editingMatch.matchCode = e.target.value;
                  setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Đội 1 (A)</label>
              <select
                value={editingMatch.teamA?.id || ''}
                onChange={(e) => {
                  const t = activeGroup.findTeam(e.target.value);
                  editingMatch.teamA = t || null;
                  setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Chọn Đội A --</option>
                {activeGroup.teams.map((t) => (
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
                  const t = activeGroup.findTeam(e.target.value);
                  editingMatch.teamB = t || null;
                  setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Chọn Đội B --</option>
                {activeGroup.teams.map((t) => (
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
