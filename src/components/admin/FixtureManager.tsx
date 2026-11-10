import React, { useState, useEffect } from 'react';
import { Category, Match, Group } from '../../models';
import { useTournament } from '../../context/TournamentContext';
import { RoundRobinScheduler, KnockoutScheduler } from '../../engine';
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
  Filter,
} from 'lucide-react';

interface Props {
  category: Category;
  selectedCategoryId?: string;
  onSelectCategory?: (id: string) => void;
}

interface IDisplayMatchItem {
  match: Match;
  category: Category;
  group?: Group;
  stageLabel: string;
}

export const FixtureManager: React.FC<Props> = ({
  category,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const { tournament, saveTournament, isAdmin, isRealtimeConnected, connectionError } = useTournament();

  const isLocked = !isRealtimeConnected || !!connectionError;

  // Lọc nội dung: Mặc định là 'ALL' (Tất Cả)
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>(
    selectedCategoryId || 'ALL'
  );

  // Lọc sân: Mặc định là 'ALL' (Tất Cả Sân)
  const [selectedCourt, setSelectedCourt] = useState<string>('ALL');

  // Lọc bảng (khi chọn 1 nội dung cụ thể)
  const [activeGroupId, setActiveGroupId] = useState<string>('ALL_GROUPS');

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

  // Thêm trận mới thủ công
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [manualCatId, setManualCatId] = useState(category.id);
  const [manualGroupId, setManualGroupId] = useState(category.groups[0]?.id || '');
  const [newTeamAId, setNewTeamAId] = useState('');
  const [newTeamBId, setNewTeamBId] = useState('');
  const [newCourt, setNewCourt] = useState(tournament?.courts?.[0] || 'Sân 1');
  const [newTime, setNewTime] = useState('08:00');

  // Đồng bộ khi prop selectedCategoryId thay đổi từ thanh menu cha
  useEffect(() => {
    if (selectedCategoryId) {
      setSelectedCatFilter(selectedCategoryId);
      if (selectedCategoryId !== 'ALL') {
        const cat = tournament?.categories.find((c) => c.id === selectedCategoryId);
        if (cat) {
          setManualCatId(cat.id);
          setManualGroupId(cat.groups[0]?.id || '');
        }
      }
    }
  }, [selectedCategoryId, tournament]);

  if (!tournament) return null;

  const currentCategory =
    selectedCatFilter === 'ALL'
      ? null
      : tournament.categories.find((c) => c.id === selectedCatFilter) || category;

  const manualCategory =
    tournament.categories.find((c) => c.id === manualCatId) || category;
  const manualGroup =
    manualCategory.groups.find((g) => g.id === manualGroupId) || manualCategory.groups[0];

  // Helper tìm vị trí trận đấu trong Tournament để sửa / xóa / cập nhật điểm
  const findMatchLocation = (matchId: string) => {
    for (const cat of tournament.categories) {
      for (const group of cat.groups) {
        const mIdx = group.matches.findIndex((m) => m.id === matchId);
        if (mIdx !== -1) {
          return { type: 'GROUP' as const, category: cat, group, index: mIdx };
        }
      }
      const kIdx = cat.knockoutMatches.findIndex((m) => m.id === matchId);
      if (kIdx !== -1) {
        return { type: 'KNOCKOUT' as const, category: cat, index: kIdx };
      }
    }
    return null;
  };

  // Thu thập tất cả các trận đấu cần hiển thị
  const allDisplayMatches: IDisplayMatchItem[] = [];
  const targetCategories =
    selectedCatFilter === 'ALL'
      ? tournament.categories
      : currentCategory
      ? [currentCategory]
      : tournament.categories;

  targetCategories.forEach((cat) => {
    cat.groups.forEach((g) => {
      if (
        selectedCatFilter !== 'ALL' &&
        activeGroupId !== 'ALL_GROUPS' &&
        activeGroupId !== 'KNOCKOUT' &&
        g.id !== activeGroupId
      ) {
        return;
      }
      if (selectedCatFilter !== 'ALL' && activeGroupId === 'KNOCKOUT') {
        return;
      }
      g.matches.forEach((m) => {
        allDisplayMatches.push({
          match: m,
          category: cat,
          group: g,
          stageLabel: `${cat.name} • ${g.name}`,
        });
      });
    });

    if (
      selectedCatFilter === 'ALL' ||
      activeGroupId === 'ALL_GROUPS' ||
      activeGroupId === 'KNOCKOUT'
    ) {
      cat.knockoutMatches.forEach((m) => {
        allDisplayMatches.push({
          match: m,
          category: cat,
          stageLabel: `${cat.name} • ${m.roundName}`,
        });
      });
    }
  });

  // Lọc theo Sân
  const filteredMatches = allDisplayMatches.filter((item) => {
    if (selectedCourt !== 'ALL' && item.match.court !== selectedCourt) {
      return false;
    }
    return true;
  });

  // =========================================================================
  // MẶC ĐỊNH SẮP XẾP CÁC SÂN THEO GIỜ TỪ THẤP LÊN CAO: 00:00 -> 23:59
  // =========================================================================
  const parseTimeToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 9999;
    const parts = timeStr.trim().split(':');
    if (parts.length < 2) return 9999;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return 9999;
    return h * 60 + m;
  };

  filteredMatches.sort((a, b) => {
    const tA = parseTimeToMinutes(a.match.scheduledTime);
    const tB = parseTimeToMinutes(b.match.scheduledTime);
    if (tA !== tB) return tA - tB;
    const cA = a.match.court || '';
    const cB = b.match.court || '';
    if (cA !== cB) return cA.localeCompare(cB, 'vi');
    return a.match.matchCode.localeCompare(b.match.matchCode, 'vi');
  });

  // Xếp lịch tự động vòng tròn random (cho nhóm bảng cụ thể)
  const handleAutoGenerateRandomFixtures = async (groupToGenerate?: Group) => {
    if (isLocked) {
      alert('Không thể bốc thăm: Mất kết nối tới Database!');
      return;
    }
    const targetGroup = groupToGenerate || (currentCategory && currentCategory.groups.find((g) => g.id === activeGroupId)) || currentCategory?.groups[0];
    if (!targetGroup || !currentCategory) {
      alert('Vui lòng chọn một bảng đấu cụ thể để bốc thăm xếp trận!');
      return;
    }

    if (targetGroup.teams.length < 2) {
      alert(`Bảng ${targetGroup.name} cần tối thiểu 2 đội để xếp trận!`);
      return;
    }

    if (
      targetGroup.matches.length > 0 &&
      !confirm(
        `Bảng ${targetGroup.name} (${currentCategory.name}) đã có sẵn ${targetGroup.matches.length} trận đấu. Bạn có muốn xếp lại ngẫu nhiên không? Các tỉ số cũ của bảng này sẽ bị xóa.`
      )
    ) {
      return;
    }

    const groupRule = currentCategory.rulesConfig.groupStage;
    const catCode = currentCategory.getShortCode();

    const generated = RoundRobinScheduler.generateMatches(targetGroup.teams, {
      categoryId: currentCategory.id,
      categoryCode: catCode,
      groupId: targetGroup.id,
      groupName: targetGroup.name,
      rule: groupRule,
      courts: tournament.courts,
      startTime: '08:00',
      matchDurationMinutes: 25,
      randomize: true,
    });

    targetGroup.matches = generated;
    await saveTournament(tournament);
  };

  // Đổi chỗ Team A và Team B
  const handleSwapTeams = async (match: Match) => {
    match.swapTeams();
    await saveTournament(tournament);
  };

  // Xóa trận
  const handleDeleteMatch = async (matchId: string) => {
    if (confirm('Bạn có chắc muốn xóa trận đấu này khỏi lịch thi đấu?')) {
      const loc = findMatchLocation(matchId);
      if (loc) {
        if (loc.type === 'GROUP') {
          loc.group.matches = loc.group.matches.filter((m) => m.id !== matchId);
        } else {
          loc.category.knockoutMatches = loc.category.knockoutMatches.filter((m) => m.id !== matchId);
        }
        await saveTournament(tournament);
      }
    }
  };

  // Lưu chỉnh sửa trận
  const handleSaveEditMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;

    if (!editingMatch.matchCode.trim()) {
      alert('Vui lòng nhập mã trận đấu!');
      return;
    }

    const loc = findMatchLocation(editingMatch.id);
    if (loc) {
      if (loc.type === 'GROUP') {
        loc.group.matches[loc.index] = editingMatch;
      } else {
        loc.category.knockoutMatches[loc.index] = editingMatch;
        KnockoutScheduler.propagateWinners(loc.category.knockoutMatches);
      }
      await saveTournament(tournament);
    }
    setEditingMatch(null);
  };

  // Thêm trận đấu thủ công
  const handleCreateManualMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualGroup || !newTeamAId || !newTeamBId) return;

    if (newTeamAId === newTeamBId) {
      alert('Không thể chọn cùng một đội thi đấu với chính mình!');
      return;
    }

    const teamA = manualGroup.findTeam(newTeamAId);
    const teamB = manualGroup.findTeam(newTeamBId);
    if (!teamA || !teamB) return;

    const matchNumber = manualGroup.matches.length + 1;
    const catCode = manualCategory.getShortCode();
    const groupShort = manualGroup.name.replace(/\s+/g, '').replace('Bảng', 'B');

    const newMatch = new Match(
      `match_${manualGroup.id}_manual_${Date.now()}`,
      `${catCode}-${groupShort}-${matchNumber.toString().padStart(2, '0')}`,
      manualCategory.id,
      'GROUP',
      `Vòng bảng - ${manualGroup.name}`,
      newCourt,
      newTime,
      teamA,
      teamB,
      manualCategory.rulesConfig.groupStage,
      [{ teamA: 0, teamB: 0 }],
      'PENDING',
      null,
      manualGroup.id,
      manualGroup.name
    );

    manualGroup.matches.push(newMatch);
    await saveTournament(tournament);
    setIsAddingMatch(false);
    setNewTeamAId('');
    setNewTeamBId('');
  };

  // Cập nhật điểm từ Modal
  const handleSaveScore = async (updatedMatch: Match) => {
    const loc = findMatchLocation(updatedMatch.id);
    if (loc) {
      if (loc.type === 'GROUP') {
        loc.group.matches[loc.index] = updatedMatch;
      } else {
        loc.category.knockoutMatches[loc.index] = updatedMatch;
        KnockoutScheduler.propagateWinners(loc.category.knockoutMatches);
      }
      await saveTournament(tournament);
    }
  };

  const handleSelectCat = (catId: string) => {
    setSelectedCatFilter(catId);
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    if (catId === 'ALL') {
      setActiveGroupId('ALL_GROUPS');
    } else {
      const cat = tournament.categories.find((c) => c.id === catId);
      if (cat) {
        setManualCatId(cat.id);
        setManualGroupId(cat.groups[0]?.id || '');
        setActiveGroupId('ALL_GROUPS');
      }
    }
  };

  return (
    <div className="bg-[#0c1524] rounded-2xl p-4 sm:p-5 shadow-xl border border-[#16263f] space-y-4 text-slate-100">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#16263f]">
        <div>
          <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Lịch Thi Đấu & Điều Phối Sân{' '}
            {selectedCatFilter === 'ALL' ? (
              <span className="text-amber-400">(Tất Cả Các Nội Dung)</span>
            ) : (
              <span className="text-cyan-400">({currentCategory?.name})</span>
            )}
          </h3>
          <p className="text-[11px] text-slate-400">
            Tổng hợp toàn bộ lịch thi đấu, lọc theo sân và sắp xếp theo khung giờ tăng dần (00:00 - 23:59)
          </p>
        </div>

        {/* Action Buttons */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingMatch(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#091120] hover:bg-[#11233e] text-slate-200 border border-[#192b45] rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              Thêm Trận Thủ Công
            </button>

            {selectedCatFilter !== 'ALL' && currentCategory && activeGroupId !== 'ALL_GROUPS' && activeGroupId !== 'KNOCKOUT' && (
              <button
                type="button"
                onClick={() => handleAutoGenerateRandomFixtures()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-black rounded-xl text-xs shadow-lg shadow-cyan-600/20 transition cursor-pointer"
                title="Tự động bốc thăm xếp cặp đấu ngẫu nhiên cho bảng hiện tại"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Xếp Trận Random Bảng Này
              </button>
            )}
          </div>
        )}
      </div>

      {/* 1. HÀNG NÚT CHỌN NỘI DUNG THI ĐẤU (Có nút TẤT CẢ) */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[11px] font-black text-slate-400 shrink-0 flex items-center gap-1 uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-amber-400" /> Nội Dung:
          </span>

          <button
            type="button"
            onClick={() => handleSelectCat('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border shrink-0 cursor-pointer ${
              selectedCatFilter === 'ALL'
                ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)] font-black'
                : 'bg-[#091120] hover:bg-[#11233e] text-amber-300 border-amber-500/30'
            }`}
          >
            Tất Cả ({allDisplayMatches.length} trận)
          </button>

          {tournament.categories.map((cat) => {
            const isSelected = selectedCatFilter === cat.id;
            const catMatchesCount = cat.getAllMatches().length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCat(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.4)] font-black'
                    : 'bg-[#091120] hover:bg-[#11233e] text-slate-300 border-[#192b45]'
                }`}
              >
                {cat.name} ({catMatchesCount})
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. HÀNG NÚT LỌC THEO SÂN (Nhiều button [Sân 1]... [Sân 6]) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[11px] font-black text-slate-400 shrink-0 flex items-center gap-1 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Sân Thi Đấu:
          </span>

          <button
            type="button"
            onClick={() => setSelectedCourt('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border shrink-0 cursor-pointer ${
              selectedCourt === 'ALL'
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.3)] font-black'
                : 'bg-[#091120] hover:bg-[#11233e] text-slate-300 border-[#192b45]'
            }`}
          >
            Tất Cả Sân ({allDisplayMatches.length})
          </button>

          {tournament.courts.map((court) => {
            const countOnCourt = allDisplayMatches.filter(
              (item) => item.match.court === court
            ).length;
            const isSelected = selectedCourt === court;
            return (
              <button
                key={court}
                type="button"
                onClick={() => setSelectedCourt(court)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.3)] font-black'
                    : 'bg-[#091120] hover:bg-[#11233e] text-slate-300 border-[#192b45]'
                }`}
              >
                {court} ({countOnCourt})
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. NẾU CHỌN 1 NỘI DUNG CỤ THỂ: CHO PHÉP LỌC THEO BẢNG HOẶC VÒNG TRONG */}
      {selectedCatFilter !== 'ALL' && currentCategory && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#16263f]">
          <span className="text-[10px] uppercase font-bold text-slate-400">Giai đoạn:</span>
          <button
            type="button"
            onClick={() => setActiveGroupId('ALL_GROUPS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border cursor-pointer ${
              activeGroupId === 'ALL_GROUPS'
                ? 'bg-[#1a3356] text-cyan-300 border-cyan-500/50 font-bold'
                : 'bg-[#091120] text-slate-400 border-[#192b45] hover:text-white'
            }`}
          >
            Tất Cả Bảng & Vòng Trong
          </button>

          {currentCategory.groups.map((group) => {
            const isSelected = activeGroupId === group.id;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroupId(group.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                  isSelected
                    ? 'bg-[#1a3356] text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-[#091120] text-slate-400 border-[#192b45] hover:text-white'
                }`}
              >
                {group.name} ({group.matches.length})
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setActiveGroupId('KNOCKOUT')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border cursor-pointer ${
              activeGroupId === 'KNOCKOUT'
                ? 'bg-[#1a3356] text-cyan-300 border-cyan-500/50 font-bold'
                : 'bg-[#091120] text-slate-400 border-[#192b45] hover:text-white'
            }`}
          >
            Vòng Trong ({currentCategory.knockoutMatches.length})
          </button>
        </div>
      )}

      {/* Form thêm trận thủ công */}
      {isAdmin && isAddingMatch && (
        <form onSubmit={handleCreateManualMatch} className="p-4 bg-[#070d19]/90 border border-[#1d3252] rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300">
              Thêm Trận Đấu Vào {manualCategory.name} - {manualGroup?.name}
            </span>
            <button
              type="button"
              onClick={() => setIsAddingMatch(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Chọn Nội dung & Bảng */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Nội dung & Bảng</label>
              <select
                value={`${manualCatId}__${manualGroupId}`}
                onChange={(e) => {
                  const [cId, gId] = e.target.value.split('__');
                  setManualCatId(cId);
                  setManualGroupId(gId);
                  setNewTeamAId('');
                  setNewTeamBId('');
                }}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs font-semibold text-cyan-300 focus:border-cyan-400 focus:outline-none"
              >
                {tournament.categories.map((cat) =>
                  cat.groups.map((grp) => (
                    <option key={`${cat.id}__${grp.id}`} value={`${cat.id}__${grp.id}`} className="bg-[#0c1524]">
                      {cat.name} - {grp.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Đội 1 (A)</label>
              <select
                value={newTeamAId}
                onChange={(e) => setNewTeamAId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
                required
              >
                <option value="" className="bg-[#0c1524]">-- Chọn Đội A --</option>
                {manualGroup?.teams.map((t) => (
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
                {manualGroup?.teams.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0c1524]">
                    {t.getFullSelectLabel ? t.getFullSelectLabel() : t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Sân</label>
              <select
                value={newCourt}
                onChange={(e) => setNewCourt(e.target.value)}
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
                placeholder="08:00 (24h)"
                maxLength={5}
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingMatch(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl text-xs transition"
            >
              Lưu Trận
            </button>
          </div>
        </form>
      )}

      {/* DANH SÁCH CÁC TRẬN ĐẤU (SẮP XẾP THEO GIỜ 00:00 -> 23:59) */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 pb-1">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          Tổng số trận: <strong className="text-white">{filteredMatches.length}</strong> trận
          {selectedCourt !== 'ALL' && <span className="text-cyan-300">({selectedCourt})</span>}
          {selectedCatFilter !== 'ALL' && currentCategory && (
            <span className="text-amber-300">({currentCategory.name})</span>
          )}
        </span>
        <span className="text-[11px] text-slate-500 italic">
          Được sắp xếp theo giờ đấu từ sớm đến muộn (00:00 - 23:59)
        </span>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-xs bg-[#070d19] rounded-2xl border border-[#16263f] space-y-2">
          <Filter className="w-8 h-8 mx-auto text-slate-600" />
          <p className="font-semibold text-slate-300">Không có trận đấu nào phù hợp với bộ lọc hiện tại.</p>
          <p className="text-[11px] text-slate-500">
            Hãy thử chọn "Tất Cả Sân" hoặc "Tất Cả Nội Dung" để xem thêm các trận khác.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map(({ match, stageLabel }, index) => {
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-5 h-5 rounded-md bg-[#101e33] border border-[#1d3252] text-cyan-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-mono text-[10px] font-black text-cyan-300 bg-[#101e33] border border-[#1d3252] px-2 py-0.5 rounded">
                      {match.matchCode}
                    </span>
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded truncate max-w-[160px]">
                      {stageLabel}
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
                          {match.teamA?.getDisplayName() || (
                            <span className="text-cyan-400 font-semibold italic">
                              {match.placeholderA || 'Chờ xác định'}
                            </span>
                          )}
                        </div>
                        {match.teamA?.players && match.teamA.players.length > 0 ? (
                          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                            <span>{match.teamA.players.map((p) => p.fullName).join(' • ')}</span>
                            {match.placeholderA && (
                              <span className="text-[9px] px-1 rounded bg-[#101e33] text-cyan-300 border border-cyan-800/40 shrink-0 font-medium">
                                {match.placeholderA}
                              </span>
                            )}
                          </div>
                        ) : (
                          !match.teamA && match.placeholderA && (
                            <div className="text-[10px] text-slate-500 italic truncate">
                              Vị trí: {match.placeholderA}
                            </div>
                          )
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
                          {match.teamB?.getDisplayName() || (
                            <span className="text-cyan-400 font-semibold italic">
                              {match.placeholderB || 'Chờ xác định'}
                            </span>
                          )}
                        </div>
                        {match.teamB?.players && match.teamB.players.length > 0 ? (
                          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                            <span>{match.teamB.players.map((p) => p.fullName).join(' • ')}</span>
                            {match.placeholderB && (
                              <span className="text-[9px] px-1 rounded bg-[#101e33] text-cyan-300 border border-cyan-800/40 shrink-0 font-medium">
                                {match.placeholderB}
                              </span>
                            )}
                          </div>
                        ) : (
                          !match.teamB && match.placeholderB && (
                            <div className="text-[10px] text-slate-500 italic truncate">
                              Vị trí: {match.placeholderB}
                            </div>
                          )
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
                    <span className="flex items-center gap-1 font-semibold text-cyan-300 bg-[#091120] border border-[#192b45] px-2 py-0.5 rounded-lg">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      {match.court || 'Chưa xếp sân'}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-amber-300 bg-[#091120] border border-[#192b45] px-2 py-0.5 rounded-lg font-mono">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {match.scheduledTime || '--:--'}
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
      {editingMatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in overscroll-contain"
          onClick={() => setEditingMatch(null)}
        >
          <form
            onSubmit={handleSaveEditMatch}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0c1524] rounded-3xl p-4 sm:p-5 max-w-md w-full border border-[#16263f] shadow-2xl space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto overflow-x-hidden touch-pan-y"
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

            {(() => {
              const matchCat =
                tournament.categories.find((c) => c.id === editingMatch.categoryId) || category;
              const allCatTeams = matchCat.getAllTeams();

              return (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Đội 1 (A)</label>
                    <select
                      value={editingMatch.teamA?.id || ''}
                      onChange={(e) => {
                        const t = allCatTeams.find((x) => x.id === e.target.value);
                        editingMatch.teamA = t || null;
                        setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                      }}
                      className="w-full px-3 py-2 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="" className="bg-[#0c1524]">-- Chọn Đội A (hoặc để trống) --</option>
                      {allCatTeams.map((t) => (
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
                        const t = allCatTeams.find((x) => x.id === e.target.value);
                        editingMatch.teamB = t || null;
                        setEditingMatch(Match.fromJSON(editingMatch.toJSON()));
                      }}
                      className="w-full px-3 py-2 bg-[#070d19] border border-[#1d3252] rounded-xl text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="" className="bg-[#0c1524]">-- Chọn Đội B (hoặc để trống) --</option>
                      {allCatTeams.map((t) => (
                        <option key={t.id} value={t.id} className="bg-[#0c1524]">
                          {t.getFullSelectLabel ? t.getFullSelectLabel() : t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              );
            })()}

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
