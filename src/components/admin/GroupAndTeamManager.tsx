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
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-5">
      {/* Group Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-base">Quản Lý Bảng Đấu & Đội</h3>
        </div>

        {isAdmin && !isAddingGroup && (
          <button
            onClick={() => setIsAddingGroup(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Thêm Bảng Mới
          </button>
        )}
      </div>

      {/* Form tạo bảng */}
      {isAdmin && isAddingGroup && (
        <form onSubmit={handleAddGroup} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <input
            type="text"
            placeholder="Tên bảng (VD: Bảng C, Bảng D...)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            autoFocus
            required
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
          >
            Tạo
          </button>
          <button
            type="button"
            onClick={() => setIsAddingGroup(false)}
            className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
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
              <div key={group.id} className="flex items-center gap-1 bg-white border-2 border-indigo-500 rounded-xl p-1">
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="px-2 py-1 text-xs font-semibold focus:outline-none w-28"
                  autoFocus
                />
                <button
                  onClick={() => handleUpdateGroupName(group)}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditingGroupId(null)}
                  className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={group.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveGroupId(group.id)}
                className="flex items-center gap-1.5"
              >
                <span>{group.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {group.teams.length} đội
                </span>
              </button>

              {isAdmin && (
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => {
                      setEditingGroupId(group.id);
                      setEditGroupName(group.name);
                    }}
                    className="p-1 rounded hover:bg-black/10"
                    title="Đổi tên bảng"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-1 rounded hover:bg-rose-500/20 text-rose-300 hover:text-rose-100"
                    title="Xóa bảng"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
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
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              Danh Sách Đội ({activeGroup.name})
            </div>

            {isAdmin && !isAddingTeam && (
              <button
                onClick={() => setIsAddingTeam(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Thêm Đội Vào {activeGroup.name}
              </button>
            )}
          </div>

          {/* Form thêm đội */}
          {isAdmin && isAddingTeam && (
            <form onSubmit={handleAddTeam} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Thêm Đội Mới Vào {activeGroup.name}</span>
                <button
                  type="button"
                  onClick={() => setIsAddingTeam(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Vận động viên 1 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Họ và tên VĐV 1"
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Vận động viên 2 (Nếu đánh đôi)
                  </label>
                  <input
                    type="text"
                    placeholder="Họ và tên VĐV 2"
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Tên Đội / Cặp Đôi (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Để trống sẽ tự động lấy tên 2 VĐV"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Câu Lạc Bộ / Đơn Vị
                  </label>
                  <input
                    type="text"
                    placeholder="CLB Cầu Lông..."
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTeam(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Lưu Đội
                </button>
              </div>
            </form>
          )}

          {/* Danh sách thẻ đội */}
          {activeGroup.teams.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Chưa có đội nào trong {activeGroup.name}. Hãy bấm nút "Thêm Đội" ở trên để nhập các thành viên!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeGroup.teams.map((team, idx) => (
                <div
                  key={team.id}
                  className="p-3.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm">{team.name}</h4>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingTeam(team)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-200/50"
                            title="Sửa đội"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeam(team.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="Xóa đội"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      {team.players.map((p, pIdx) => (
                        <div key={p.id || pIdx} className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{p.fullName}</span>
                          {p.club && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSaveEditTeam}
            className="bg-white rounded-2xl p-5 max-w-md w-full border border-slate-200 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-800">Chỉnh Sửa Thông Tin Đội</h4>
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Tên Đội</label>
              <input
                type="text"
                value={editingTeam.name}
                onChange={(e) => {
                  editingTeam.name = e.target.value;
                  setEditingTeam(Team.fromJSON(editingTeam.toJSON()));
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            {editingTeam.players.map((player, pIdx) => (
              <div key={player.id} className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-700">Vận động viên {pIdx + 1}</span>
                <input
                  type="text"
                  placeholder="Họ tên"
                  value={player.fullName}
                  onChange={(e) => {
                    player.fullName = e.target.value;
                    setEditingTeam(Team.fromJSON(editingTeam.toJSON()));
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
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
