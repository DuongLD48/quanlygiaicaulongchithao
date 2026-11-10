import React, { useState } from 'react';
import { Category, MatchRule, StageRuleConfig } from '../../models';
import { X, Sliders, Check, AlertCircle } from 'lucide-react';

interface Props {
  category: Category;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCategory: Category) => void;
}

type TabKey =
  | 'groupStage'
  | 'roundOf16'
  | 'quarterFinals'
  | 'semiFinals'
  | 'finals'
  | 'thirdPlace';

interface TabRuleForm {
  setsCount: 1 | 3;
  pointsPerSet: string;
  maxPoints: string;
  deuceEnabled: boolean;
}

export const RulesConfigModal: React.FC<Props> = ({
  category,
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('groupStage');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Khởi tạo state form độc lập dạng string để người dùng có thể xóa trắng và gõ tự do
  const [rulesForm, setRulesForm] = useState<Record<TabKey, TabRuleForm>>(() => {
    const rc = category.rulesConfig;
    return {
      groupStage: {
        setsCount: (rc.groupStage.setsCount === 3 ? 3 : 1) as 1 | 3,
        pointsPerSet: String(rc.groupStage.pointsPerSet || 21),
        maxPoints: String(rc.groupStage.maxPoints || rc.groupStage.pointsPerSet || 21),
        deuceEnabled: !!rc.groupStage.deuceEnabled,
      },
      roundOf16: {
        setsCount: (rc.roundOf16.setsCount === 3 ? 3 : 1) as 1 | 3,
        pointsPerSet: String(rc.roundOf16.pointsPerSet || 21),
        maxPoints: String(rc.roundOf16.maxPoints || rc.roundOf16.pointsPerSet || 21),
        deuceEnabled: !!rc.roundOf16.deuceEnabled,
      },
      quarterFinals: {
        setsCount: (rc.quarterFinals.setsCount === 3 ? 3 : 1) as 1 | 3,
        pointsPerSet: String(rc.quarterFinals.pointsPerSet || 21),
        maxPoints: String(rc.quarterFinals.maxPoints || rc.quarterFinals.pointsPerSet || 21),
        deuceEnabled: !!rc.quarterFinals.deuceEnabled,
      },
      semiFinals: {
        setsCount: (rc.semiFinals.setsCount === 3 ? 3 : 1) as 1 | 3,
        pointsPerSet: String(rc.semiFinals.pointsPerSet || 21),
        maxPoints: String(rc.semiFinals.maxPoints || rc.semiFinals.pointsPerSet || 21),
        deuceEnabled: !!rc.semiFinals.deuceEnabled,
      },
      finals: {
        setsCount: (rc.finals.setsCount === 3 ? 3 : 1) as 1 | 3,
        pointsPerSet: String(rc.finals.pointsPerSet || 21),
        maxPoints: String(rc.finals.maxPoints || rc.finals.pointsPerSet || 21),
        deuceEnabled: !!rc.finals.deuceEnabled,
      },
      thirdPlace: {
        setsCount: (rc.thirdPlace.setsCount === 3 ? 3 : 1) as 1 | 3,
        pointsPerSet: String(rc.thirdPlace.pointsPerSet || 21),
        maxPoints: String(rc.thirdPlace.maxPoints || rc.thirdPlace.pointsPerSet || 21),
        deuceEnabled: !!rc.thirdPlace.deuceEnabled,
      },
    };
  });

  React.useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentRule = rulesForm[activeTab];

  const updateCurrentField = <K extends keyof TabRuleForm>(field: K, val: TabRuleForm[K]) => {
    setErrorMessage(null);
    setRulesForm((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: val,
      },
    }));
  };

  const tabs: Array<{
    key: TabKey;
    label: string;
  }> = [
    { key: 'groupStage', label: 'Vòng Bảng' },
    { key: 'roundOf16', label: 'Vòng 1/8' },
    { key: 'quarterFinals', label: 'Tứ Kết' },
    { key: 'semiFinals', label: 'Bán Kết' },
    { key: 'finals', label: 'Chung Kết' },
    { key: 'thirdPlace', label: 'Tranh Hạng 3' },
  ];

  const tabLabels: Record<TabKey, string> = {
    groupStage: 'Vòng Bảng',
    roundOf16: 'Vòng 1/8',
    quarterFinals: 'Tứ Kết',
    semiFinals: 'Bán Kết',
    finals: 'Chung Kết',
    thirdPlace: 'Tranh Hạng 3',
  };

  const handleSave = () => {
    // 1. Kiểm tra toàn bộ dữ liệu nhập ở tất cả các vòng trước khi lưu
    for (const key of Object.keys(rulesForm) as TabKey[]) {
      const f = rulesForm[key];
      const stageName = tabLabels[key];

      const pointsStr = f.pointsPerSet.trim();
      const points = parseInt(pointsStr, 10);

      if (!pointsStr || isNaN(points) || points <= 0) {
        setActiveTab(key);
        setErrorMessage(
          `Vui lòng nhập điểm chạm hợp lệ cho [${stageName}]. Điểm chạm không được để trống và phải lớn hơn 0!`
        );
        return;
      }

      if (points < 5 || points > 100) {
        setActiveTab(key);
        setErrorMessage(
          `Điểm chạm tại [${stageName}] phải nằm trong khoảng từ 5 đến 100 điểm!`
        );
        return;
      }

      if (f.deuceEnabled) {
        const maxStr = f.maxPoints.trim();
        const maxPts = parseInt(maxStr, 10);

        if (!maxStr || isNaN(maxPts)) {
          setActiveTab(key);
          setErrorMessage(
            `Vui lòng nhập điểm trần tối đa khi bật luật Deuce cho [${stageName}]!`
          );
          return;
        }

        if (maxPts < points) {
          setActiveTab(key);
          setErrorMessage(
            `Điểm trần tối đa (${maxPts}đ) tại [${stageName}] phải lớn hơn hoặc bằng điểm chạm (${points}đ)!`
          );
          return;
        }
      }
    }

    // 2. Chuyển đổi dữ liệu form sang MatchRule và StageRuleConfig
    const nextConfig = new StageRuleConfig(
      new MatchRule(
        rulesForm.groupStage.setsCount,
        parseInt(rulesForm.groupStage.pointsPerSet.trim(), 10),
        rulesForm.groupStage.deuceEnabled
          ? parseInt(rulesForm.groupStage.maxPoints.trim(), 10)
          : parseInt(rulesForm.groupStage.pointsPerSet.trim(), 10),
        rulesForm.groupStage.deuceEnabled
      ),
      new MatchRule(
        rulesForm.roundOf16.setsCount,
        parseInt(rulesForm.roundOf16.pointsPerSet.trim(), 10),
        rulesForm.roundOf16.deuceEnabled
          ? parseInt(rulesForm.roundOf16.maxPoints.trim(), 10)
          : parseInt(rulesForm.roundOf16.pointsPerSet.trim(), 10),
        rulesForm.roundOf16.deuceEnabled
      ),
      new MatchRule(
        rulesForm.quarterFinals.setsCount,
        parseInt(rulesForm.quarterFinals.pointsPerSet.trim(), 10),
        rulesForm.quarterFinals.deuceEnabled
          ? parseInt(rulesForm.quarterFinals.maxPoints.trim(), 10)
          : parseInt(rulesForm.quarterFinals.pointsPerSet.trim(), 10),
        rulesForm.quarterFinals.deuceEnabled
      ),
      new MatchRule(
        rulesForm.semiFinals.setsCount,
        parseInt(rulesForm.semiFinals.pointsPerSet.trim(), 10),
        rulesForm.semiFinals.deuceEnabled
          ? parseInt(rulesForm.semiFinals.maxPoints.trim(), 10)
          : parseInt(rulesForm.semiFinals.pointsPerSet.trim(), 10),
        rulesForm.semiFinals.deuceEnabled
      ),
      new MatchRule(
        rulesForm.finals.setsCount,
        parseInt(rulesForm.finals.pointsPerSet.trim(), 10),
        rulesForm.finals.deuceEnabled
          ? parseInt(rulesForm.finals.maxPoints.trim(), 10)
          : parseInt(rulesForm.finals.pointsPerSet.trim(), 10),
        rulesForm.finals.deuceEnabled
      ),
      new MatchRule(
        rulesForm.thirdPlace.setsCount,
        parseInt(rulesForm.thirdPlace.pointsPerSet.trim(), 10),
        rulesForm.thirdPlace.deuceEnabled
          ? parseInt(rulesForm.thirdPlace.maxPoints.trim(), 10)
          : parseInt(rulesForm.thirdPlace.pointsPerSet.trim(), 10),
        rulesForm.thirdPlace.deuceEnabled
      )
    );

    category.rulesConfig = nextConfig;
    category.syncMatchesWithRules();
    onSave(category);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-fade-in overscroll-contain"
      onClick={onClose}
    >
      <div
        className="bg-[#0c1524] rounded-3xl shadow-2xl max-w-3xl w-full border border-[#16263f] overflow-hidden flex flex-col max-h-[90vh] text-slate-100 touch-pan-y"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#091120] border-b border-[#16263f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                Tùy Chỉnh Thể Thức Thi Đấu
              </h3>
              <p className="text-[10px] text-slate-400">
                Nội dung: <span className="font-bold text-cyan-300">{category.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#121f33] hover:bg-[#1a2b45] text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs for Stage / Round */}
        <div className="p-3 bg-[#070d19] border-b border-[#16263f]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.key;
              const rule = rulesForm[tab.key];
              const displayPts = rule.pointsPerSet ? `${rule.pointsPerSet}đ` : '--đ';

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setErrorMessage(null);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center text-center cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.25)] font-black'
                      : 'bg-[#091120] text-slate-300 border-[#16263f] hover:border-cyan-500/40 hover:text-white hover:bg-[#0d1829]'
                  }`}
                >
                  <span className="truncate w-full">{tab.label}</span>
                  <span
                    className={`text-[10px] mt-0.5 font-mono ${
                      isSelected ? 'text-black/80 font-bold' : 'text-cyan-400 font-medium'
                    }`}
                  >
                    {rule.setsCount}c • {displayPts}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body Settings */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Thông báo lỗi validation */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-semibold flex items-start gap-2 animate-fade-in shadow-lg">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Detailed Inputs */}
          <div className="p-4 bg-[#091120] rounded-2xl border border-[#16263f] space-y-4">
            <h4 className="font-black text-white text-xs uppercase tracking-wide text-cyan-300">
              Chi Tiết Cho: {tabLabels[activeTab]}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                  Số Set Đấu
                </label>
                <select
                  value={currentRule.setsCount}
                  onChange={(e) =>
                    updateCurrentField('setsCount', parseInt(e.target.value, 10) as 1 | 3)
                  }
                  className="w-full px-3 py-2 bg-[#070d19] border border-[#16263f] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value={1}>1 Set (Thắng 1)</option>
                  <option value={3}>3 Set (Thắng 2)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                  Điểm Chạm Mỗi Set
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="VD: 21, 31, 15..."
                  value={currentRule.pointsPerSet}
                  onChange={(e) => updateCurrentField('pointsPerSet', e.target.value)}
                  className="w-full px-3 py-2 bg-[#070d19] border border-[#16263f] rounded-xl text-xs font-mono font-bold text-white focus:border-cyan-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Nhập điểm kết thúc set (từ 5 đến 100 điểm)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#16263f] items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deuceEnabled"
                  checked={currentRule.deuceEnabled}
                  onChange={(e) => updateCurrentField('deuceEnabled', e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-[#070d19] border-[#16263f] cursor-pointer"
                />
                <label
                  htmlFor="deuceEnabled"
                  className="text-xs font-semibold text-slate-300 cursor-pointer select-none"
                >
                  Áp dụng cách biệt 2 điểm (Deuce)
                </label>
              </div>

              {currentRule.deuceEnabled && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    Điểm Trần Tối Đa
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="VD: 30"
                    value={currentRule.maxPoints}
                    onChange={(e) => updateCurrentField('maxPoints', e.target.value)}
                    className="w-full px-3 py-2 bg-[#070d19] border border-[#16263f] rounded-xl text-xs font-mono font-bold text-white focus:border-cyan-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Mốc điểm dừng ngay khi giằng co điểm số (≥ điểm chạm)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#16263f] bg-[#091120]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#16263f] text-slate-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-black rounded-xl text-xs shadow-lg shadow-cyan-600/25 transition cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Lưu Thể Thức
          </button>
        </div>
      </div>
    </div>
  );
};
