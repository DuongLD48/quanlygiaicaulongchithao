import React, { useState } from 'react';
import { Category, Group, Team, Player } from '../../models';
import { useTournament } from '../../context/TournamentContext';
import { Plus, Users, Edit3, Trash2, Check, X, Shield, User } from 'lucide-react';

interface Props {
  category: Category;
}

export const GroupAndTeamManager: React.FC<Props> = ({ category }) => {
  const { tournament, saveTournament, isAdmin, isRealtimeConnected, connectionError } = useTournament();

  const isLocked = !isRealtimeConnected || !!connectionError;

  const [activeGroupId, setActiveGroupId] = useState<string>(
    category.groups[0]?.id || ''
  );

  // Thêm bảng mới
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Sửa tên bảng
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');

  // Thêm đội mới
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [clubName, setClubName] = useState('');

  // Sửa đội
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const activeGroup = category.groups.find((g) => g.id === activeGroupId) || category.groups[0];

  if (!tournament) return null;

  // Handler: Thêm bảng
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert('Không thể thêm bảng: Mất kết nối tới Database!');
      return;
    }
    if (!newGroupName.trim()) return;

    const group = new Group(`grp_${Date.now()}`, newGroupName.trim());
    category.addGroup(group);
    await saveTournament(tournament);
    setActiveGroupId(group.id);
    setNewGroupName('');
    setIsAddingGroup(false);
  };

  // Handler: Đổi tên bảng
  const handleUpdateGroupName = async (group: Group) => {
    if (!editGroupName.trim()) return;
    group.name = editGroupName.trim();
    await saveTournament(tournament);
    setEditingGroupId(null);
  };

  // Handler: Xóa bảng
  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Bạn có chắc muốn xóa bảng này không? Toàn bộ đội và lịch đấu của bảng sẽ bị xóa.')) {
      category.removeGroup(groupId);
      await saveTournament(tournament);
      setActiveGroupId(category.groups[0]?.id || '');
    }
  };

  // Handler: Thêm đội vào bảng hiện tại
  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;

    const p1 = new Player(`p1_${Date.now()}`, player1Name.trim(), clubName.trim());
    const players: Player[] = [p1];
    if (player2Name.trim()) {
      players.push(new Player(`p2_${Date.now()}`, player2Name.trim(), clubName.trim()));
    }

    const displayName = teamName.trim()
      ? teamName.trim()
      : player2Name.trim()
      ? `${player1Name.trim()} / ${player2Name.trim()}`
      : player1Name.trim();

    const newTeam = new Team(`team_${Date.now()}`, displayName, players);
    activeGroup.addTeam(newTeam);
    await saveTournament(tournament);

    // Reset form
    setTeamName('');
    setPlayer1Name('');
    setPlayer2Name('');
    setClubName('');
    setIsAddingTeam(false);
  };

  // Handler: Sửa đội
  const handleSaveEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    await saveTournament(tournament);
    setEditingTeam(null);
  };

  // Handler: Xóa đội khỏi bảng
  const handleDeleteTeam = async (teamId: string) => {
    if (!activeGroup) return;
    if (confirm('Xác nhận xóa đội này khỏi bảng đấu?')) {
      activeGroup.removeTeam(teamId);
      await saveTournament(tournament);
    }
  };

  return (
    <div className="bg-[#0c1524] rounded-2xl p-4 sm:p-5 shadow-xl border border-[#16263f] space-y-5 text-slate-100">
      {/* Group Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#16263f]">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-wide">
            Quản Lý Bảng Đấu & Danh Sách Đội
          </h3>
        </div>

        {isAdmin && !isAddingGroup && (
          <button
            onClick={() => setIsAddingGroup(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm Bảng Mới
          </button>
        )}
      </div>

      {/* Form tạo bảng */}
      {isAdmin && isAddingGroup && (
        <form onSubmit={handleAddGroup} className="flex items-center gap-2 p-3 bg-[#091120] border border-[#16263f] rounded-xl">
          <input
            type="text"
            placeholder="Tên bảng (VD: Bảng C, Bảng D...)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-[#070d19] border border-[#16263f] rounded-lg text-xs text-white focus:border-cyan-400 focus:outline-none"
            autoFocus
            required
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-cyan-600 text-black rounded-lg text-xs font-black hover:bg-cyan-500 cursor-pointer"
          >
            Tạo
          </button>
          <button
            type="button"
            onClick={() => setIsAddingGroup(false)}
            className="px-2 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            Hủy
          </button>
        </form>
      )}

      {/* Tabs Bảng */}
      <div className="flex flex-wrap gap-2">
        {category.groups.map((group) => {
          const isSelected = activeGroup?.id === group.id;
          const isEditing = editingGroupId === group.id;

          if (isEditing) {
            return (
              <div key={group.id} className="flex items-center gap-1 bg-[#091120] border-2 border-cyan-400 rounded-xl p-1">
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="px-2 py-0.5 text-xs font-semibold bg-transparent text-white focus:outline-none w-24"
                  autoFocus
                />
                <button
                  onClick={() => handleUpdateGroupName(group)}
                  className="p-1 text-emerald-400 hover:bg-emerald-950/60 rounded cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditingGroupId(null)}
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={group.id}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.3)] font-black'
                  : 'bg-[#091120] hover:bg-[#11233e] text-slate-300 border-[#192b45]'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveGroupId(group.id)}
                className="text-left cursor-pointer"
              >
                {group.name} ({group.teams.length} đội)
              </button>

              {isAdmin && (
                <div className={`flex items-center gap-0.5 ml-1 ${isSelected ? 'opacity-90' : 'opacity-60 group-hover:opacity-100'}`}>
                  <button
                    type="button"
                    title="Đổi tên bảng"
                    onClick={() => {
                      setEditingGroupId(group.id);
                      setEditGroupName(group.name);
                    }}
                    className={`p-1 rounded ${isSelected ? 'hover:bg-cyan-600/30' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>

                  {category.groups.length > 1 && (
                    <button
                      type="button"
                      title="Xóa bảng đấu"
                      onClick={() => handleDeleteGroup(group.id)}
                      className={`p-1 rounded ${isSelected ? 'hover:bg-cyan-600/30 text-rose-900' : 'hover:bg-slate-800 text-slate-400 hover:text-rose-400'}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Chi tiết Đội trong Bảng được chọn */}
      {activeGroup ? (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" />
              Danh Sách Đội ({activeGroup.name})
            </div>

            {isAdmin && !isAddingTeam && (
              <button
                onClick={() => setIsAddingTeam(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl text-xs shadow transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm Đội Vào {activeGroup.name}
              </button>
            )}
          </div>

          {/* Form thêm đội */}
          {isAdmin && isAddingTeam && (
            <form onSubmit={handleAddTeam} className="p-4 bg-[#070d19]/90 border border-[#1d3252] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">Thêm Đội Mới Vào {activeGroup.name}</span>
                <button
                  type="button"
                  onClick={() => setIsAddingTeam(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Vận động viên 1 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Họ và tên VĐV 1"
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Vận động viên 2 (Nếu đánh đôi)
                  </label>
                  <input
                    type="text"
                    placeholder="Họ và tên VĐV 2"
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Tên Đội / Cặp Đôi (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Để trống sẽ tự động lấy tên 2 VĐV"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Câu Lạc Bộ / Đơn Vị
                  </label>
                  <input
                    type="text"
                    placeholder="CLB Cầu Lông..."
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTeam(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-[#121f33] rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black rounded-xl text-xs font-bold transition shadow cursor-pointer"
                >
                  Lưu Đội
                </button>
              </div>
            </form>
          )}

          {/* Danh sách thẻ đội */}
          {activeGroup.teams.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs bg-[#070d19]/60 rounded-xl border border-dashed border-[#1d3252]">
              Chưa có đội nào trong {activeGroup.name}. Hãy bấm nút "Thêm Đội" ở trên để nhập các thành viên!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeGroup.teams.map((team, idx) => (
                <div
                  key={team.id}
                  className="p-3.5 bg-[#091120] hover:bg-[#0c1729] border border-[#16263f] hover:border-cyan-500/40 rounded-xl transition flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#101e33] border border-[#1d3252] text-cyan-300 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-white text-sm truncate">{team.name}</h4>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingTeam(team)}
                            className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-[#101e33] rounded transition cursor-pointer"
                            title="Sửa đội"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeam(team.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition cursor-pointer"
                            title="Xóa đội"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 space-y-1.5 text-xs text-slate-300">
                      {team.players.map((p, pIdx) => (
                        <div key={p.id || pIdx} className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-cyan-400/70 shrink-0" />
                          <span className="font-medium text-slate-200">{p.fullName}</span>
                          {p.club && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-[#101e33] text-cyan-300 border border-[#1d3252] rounded">
                              {p.club}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400 text-xs">
          Nội dung này chưa có bảng đấu nào. Hãy bấm "Thêm Bảng Mới" ở trên!
        </div>
      )}

      {/* Modal chỉnh sửa đội */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <form
            onSubmit={handleSaveEditTeam}
            className="bg-[#0c1524] rounded-3xl p-5 max-w-md w-full border border-[#16263f] shadow-2xl space-y-4 text-slate-100"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#16263f]">
              <h4 className="font-bold text-sm text-white">Chỉnh Sửa Thông Tin Đội</h4>
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Tên Đội</label>
              <input
                type="text"
                value={editingTeam.name}
                onChange={(e) => {
                  editingTeam.name = e.target.value;
                  setEditingTeam(Team.fromJSON(editingTeam.toJSON()));
                }}
                className="w-full px-3 py-2 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>

            {editingTeam.players.map((player, pIdx) => (
              <div key={player.id} className="p-3 bg-[#070d19] rounded-xl space-y-2 border border-[#16263f]">
                <span className="text-[11px] font-bold text-cyan-300">Vận động viên {pIdx + 1}</span>
                <input
                  type="text"
                  placeholder="Họ tên"
                  value={player.fullName}
                  onChange={(e) => {
                    player.fullName = e.target.value;
                    setEditingTeam(Team.fromJSON(editingTeam.toJSON()));
                  }}
                  className="w-full px-3 py-1.5 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="CLB / Đơn vị"
                  value={player.club}
                  onChange={(e) => {
                    player.club = e.target.value;
                    setEditingTeam(Team.fromJSON(editingTeam.toJSON()));
                  }}
                  className="w-full px-3 py-1.5 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#16263f]">
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-[#121f33] rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black rounded-xl text-xs font-bold transition shadow cursor-pointer"
              >
                Cập Nhật
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
