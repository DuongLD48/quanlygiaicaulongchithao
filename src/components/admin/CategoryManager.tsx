import React, { useState } from 'react';
import { Category, type CategoryType, StageRuleConfig } from '../../models';
import { useTournament } from '../../context/TournamentContext';
import { RulesConfigModal } from './RulesConfigModal';
import { Plus, Edit2, Trash2, Sliders, Trophy, Check, X } from 'lucide-react';

interface Props {
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryManager: React.FC<Props> = ({
  selectedCategoryId,
  onSelectCategory,
}) => {
  const { tournament, saveTournament, isAdmin, isRealtimeConnected, connectionError } = useTournament();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<CategoryType>('MEN_DOUBLES');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [rulesModalCat, setRulesModalCat] = useState<Category | null>(null);

  if (!tournament) return null;

  const isLocked = !isRealtimeConnected || !!connectionError;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert('Không thể thêm nội dung: Mất kết nối tới Database!');
      return;
    }
    if (!newCatName.trim()) return;

    const newCat = new Category(
      `cat_${Date.now()}`,
      newCatName.trim(),
      newCatType,
      new StageRuleConfig()
    );

    tournament.addCategory(newCat);
    await saveTournament(tournament);
    onSelectCategory(newCat.id);
    setNewCatName('');
    setIsAddingCategory(false);
  };

  const handleUpdateCategory = async (cat: Category) => {
    if (isLocked) {
      alert('Không thể cập nhật: Mất kết nối tới Database!');
      return;
    }
    if (!editCatName.trim()) return;
    cat.name = editCatName.trim();
    await saveTournament(tournament);
    setEditingCatId(null);
  };

  const handleDeleteCategory = async (catId: string) => {
    if (isLocked) {
      alert('Không thể xóa: Mất kết nối tới Database!');
      return;
    }
    if (tournament.categories.length <= 1) {
      alert('Giải đấu phải có tối thiểu 1 nội dung thi đấu!');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn xóa nội dung thi đấu này không? Tất cả bảng và trận trong nội dung sẽ bị xóa.')) {
      tournament.removeCategory(catId);
      await saveTournament(tournament);
      if (selectedCategoryId === catId) {
        onSelectCategory(tournament.categories[0]?.id || '');
      }
    }
  };

  const handleSaveRules = async (updatedCat: Category) => {
    if (isLocked) {
      alert('Không thể lưu luật thi đấu: Mất kết nối tới Database!');
      return;
    }
    const idx = tournament.categories.findIndex((c) => c.id === updatedCat.id);
    if (idx !== -1) {
      tournament.categories[idx] = updatedCat;
      await saveTournament(tournament);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="font-bold text-slate-800 text-base">Nội Dung Thi Đấu</h2>
        </div>

        {isAdmin && !isAddingCategory && (
          <button
            onClick={() => setIsAddingCategory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Thêm Nội Dung
          </button>
        )}
      </div>

      {/* Add Category Form */}
      {isAdmin && isAddingCategory && (
        <form onSubmit={handleAddCategory} className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Tạo nội dung mới</span>
            <button
              type="button"
              onClick={() => setIsAddingCategory(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Tên nội dung (VD: Đôi nam, Đôi nữ...)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              autoFocus
              required
            />
            <select
              value={newCatType}
              onChange={(e) => setNewCatType(e.target.value as CategoryType)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="MEN_DOUBLES">Đôi Nam</option>
              <option value="WOMEN_DOUBLES">Đôi Nữ</option>
              <option value="MIXED_DOUBLES">Đôi Nam Nữ</option>
              <option value="MEN_SINGLES">Đơn Nam</option>
              <option value="WOMEN_SINGLES">Đơn Nữ</option>
              <option value="CUSTOM">Khác (Tùy chỉnh)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingCategory(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
            >
              Thêm Ngay
            </button>
          </div>
        </form>
      )}

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {tournament.categories.map((cat) => {
          const isSelected = cat.id === selectedCategoryId;
          const isEditing = editingCatId === cat.id;

          if (isEditing) {
            return (
              <div key={cat.id} className="flex items-center gap-1 bg-white border-2 border-indigo-500 rounded-xl p-1">
                <input
                  type="text"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="px-2 py-1 text-xs font-semibold focus:outline-none w-32"
                  autoFocus
                />
                <button
                  onClick={() => handleUpdateCategory(cat)}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditingCatId(null)}
                  className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={cat.id}
              className={`group flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className="text-left"
              >
                {cat.name}
              </button>

              {isAdmin && (
                <div className={`flex items-center gap-0.5 ml-1 ${isSelected ? 'opacity-90' : 'opacity-60 group-hover:opacity-100'}`}>
                  {/* Edit Rules */}
                  <button
                    type="button"
                    title="Chỉnh sửa thể thức thi đấu"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRulesModalCat(cat);
                    }}
                    className={`p-1 rounded hover:bg-black/10 transition`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit Name */}
                  <button
                    type="button"
                    title="Đổi tên nội dung"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCatId(cat.id);
                      setEditCatName(cat.name);
                    }}
                    className={`p-1 rounded hover:bg-black/10 transition`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    title="Xóa nội dung"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat.id);
                    }}
                    className={`p-1 rounded hover:bg-rose-500/20 text-rose-300 hover:text-rose-100 transition`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rulesModalCat && (
        <RulesConfigModal
          category={rulesModalCat}
          isOpen={true}
          onClose={() => setRulesModalCat(null)}
          onSave={handleSaveRules}
        />
      )}
    </div>
  );
};
