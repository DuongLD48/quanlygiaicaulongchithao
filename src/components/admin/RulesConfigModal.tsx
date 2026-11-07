import React, { useState } from 'react';
import { Category, MatchRule, StageRuleConfig } from '../../models';
import { X, Sliders, Check } from 'lucide-react';

interface Props {
  category: Category;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCategory: Category) => void;
}

export const RulesConfigModal: React.FC<Props> = ({
  category,
  isOpen,
  onClose,
  onSave,
}) => {
  const [config, setConfig] = useState<StageRuleConfig>(
    StageRuleConfig.fromJSON(category.rulesConfig.toJSON())
  );
  const [activeTab, setActiveTab] = useState<
    'groupStage' | 'roundOf16' | 'quarterFinals' | 'semiFinals' | 'finals' | 'thirdPlace'
  >('groupStage');

  if (!isOpen) return null;

  const currentRule = config[activeTab];

  const updateCurrentRule = (updates: Partial<MatchRule>) => {
    const nextRule = new MatchRule(
      updates.setsCount ?? currentRule.setsCount,
      updates.pointsPerSet ?? currentRule.pointsPerSet,
      updates.maxPoints ?? currentRule.maxPoints,
      updates.deuceEnabled ?? currentRule.deuceEnabled
    );

    const nextConfig = StageRuleConfig.fromJSON({
      ...config.toJSON(),
      [activeTab]: nextRule.toJSON(),
    });
    setConfig(nextConfig);
  };

  const handleSave = () => {
    category.rulesConfig = config;
    category.syncMatchesWithRules();
    onSave(category);
    onClose();
  };

  const tabs: Array<{
    key: 'groupStage' | 'roundOf16' | 'quarterFinals' | 'semiFinals' | 'finals' | 'thirdPlace';
    label: string;
  }> = [
    { key: 'groupStage', label: 'Vòng Bảng' },
    { key: 'roundOf16', label: 'Vòng 1/8' },
    { key: 'quarterFinals', label: 'Tứ Kết' },
    { key: 'semiFinals', label: 'Bán Kết' },
    { key: 'finals', label: 'Chung Kết' },
    { key: 'thirdPlace', label: 'Tranh Hạng 3' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0c1524] rounded-3xl shadow-2xl max-w-3xl w-full border border-[#16263f] overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
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
              const rule = config[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
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
                    {rule.setsCount}c • {rule.pointsPerSet}đ
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body Settings */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Detailed Inputs */}
          <div className="p-4 bg-[#091120] rounded-2xl border border-[#16263f] space-y-4">
            <h4 className="font-black text-white text-xs uppercase tracking-wide text-cyan-300">
              Chi Tiết Cho: {tabs.find((t) => t.key === activeTab)?.label}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                  Số Set Đấu
                </label>
                <select
                  value={currentRule.setsCount}
                  onChange={(e) => updateCurrentRule({ setsCount: parseInt(e.target.value, 10) as 1 | 3 })}
                  className="w-full px-3 py-1.5 bg-[#070d19] border border-[#16263f] rounded-lg text-xs text-white focus:border-cyan-400 focus:outline-none"
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
                  type="number"
                  min={5}
                  max={50}
                  value={currentRule.pointsPerSet}
                  onChange={(e) => updateCurrentRule({ pointsPerSet: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-1.5 bg-[#070d19] border border-[#16263f] rounded-lg text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#16263f]">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deuceEnabled"
                  checked={currentRule.deuceEnabled}
                  onChange={(e) => updateCurrentRule({ deuceEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 bg-[#070d19] border-[#16263f]"
                />
                <label htmlFor="deuceEnabled" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Áp dụng cách biệt 2 điểm (Deuce)
                </label>
              </div>

              {currentRule.deuceEnabled && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    Điểm Trần Tối Đa
                  </label>
                  <input
                    type="number"
                    min={currentRule.pointsPerSet}
                    max={50}
                    value={currentRule.maxPoints}
                    onChange={(e) => updateCurrentRule({ maxPoints: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-1.5 bg-[#070d19] border border-[#16263f] rounded-lg text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
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
            className="px-4 py-1.5 border border-[#16263f] text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-black rounded-xl text-xs shadow-lg shadow-cyan-600/25 transition cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Lưu Thể Thức
          </button>
        </div>
      </div>
    </div>
  );
};
