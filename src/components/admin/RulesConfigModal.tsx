import React, { useState } from 'react';
import { Category, MatchRule, StageRuleConfig } from '../../models';
import { Settings, X, Sliders, Check } from 'lucide-react';

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

  const handleApplyPreset = (preset: '1c_31' | '3c_21' | '3c_15') => {
    if (preset === '1c_31') {
      updateCurrentRule({ setsCount: 1, pointsPerSet: 31, maxPoints: 31, deuceEnabled: false });
    } else if (preset === '3c_21') {
      updateCurrentRule({ setsCount: 3, pointsPerSet: 21, maxPoints: 30, deuceEnabled: true });
    } else if (preset === '3c_15') {
      updateCurrentRule({ setsCount: 3, pointsPerSet: 15, maxPoints: 21, deuceEnabled: true });
    }
  };

  const handleSave = () => {
    category.rulesConfig = config;
    onSave(category);
    onClose();
  };

  const tabs: Array<{
    key: 'groupStage' | 'roundOf16' | 'quarterFinals' | 'semiFinals' | 'finals' | 'thirdPlace';
    label: string;
  }> = [
    { key: 'groupStage', label: 'Vòng Bảng' },
    { key: 'roundOf16', label: 'Vòng Loại (1/8)' },
    { key: 'quarterFinals', label: 'Tứ Kết' },
    { key: 'semiFinals', label: 'Bán Kết' },
    { key: 'finals', label: 'Chung Kết' },
    { key: 'thirdPlace', label: 'Tranh Hạng 3-4' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Tùy Chỉnh Thể Thức Thi Đấu
              </h3>
              <p className="text-xs text-slate-500">
                Nội dung: <span className="font-semibold text-indigo-600">{category.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs for Stage / Round */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-100/60 px-4 pt-2 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 text-xs font-semibold whitespace-nowrap rounded-t-lg transition border-t-2 ${
                activeTab === tab.key
                  ? 'bg-white text-indigo-600 border-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
              }`}
            >
              {tab.label}
              <span className="ml-1 text-[10px] opacity-75 font-normal">
                ({config[tab.key].setsCount}c/{config[tab.key].pointsPerSet}đ)
              </span>
            </button>
          ))}
        </div>

        {/* Body Settings */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Presets */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              Chọn mẫu định dạng nhanh:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('1c_31')}
                className={`p-3 rounded-xl border text-left transition ${
                  currentRule.setsCount === 1 && currentRule.pointsPerSet === 31
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="font-bold text-sm">1 Set 31 Điểm</div>
                <div className="text-xs text-slate-500">Đánh 1 set chạm 31 (Không deuce)</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('3c_21')}
                className={`p-3 rounded-xl border text-left transition ${
                  currentRule.setsCount === 3 && currentRule.pointsPerSet === 21
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="font-bold text-sm">3 Set 21 Điểm</div>
                <div className="text-xs text-slate-500">Thắng 2 set 21 (Deuce, trần 30)</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('3c_15')}
                className={`p-3 rounded-xl border text-left transition ${
                  currentRule.setsCount === 3 && currentRule.pointsPerSet === 15
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="font-bold text-sm">3 Set 15 Điểm</div>
                <div className="text-xs text-slate-500">Thắng 2 set 15 (Deuce, trần 21)</div>
              </button>
            </div>
          </div>

          {/* Detailed Inputs */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-slate-500" />
              Chi Tiết Cấu Hình Cho {tabs.find((t) => t.key === activeTab)?.label}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Số set thi đấu:
                </label>
                <select
                  value={currentRule.setsCount}
                  onChange={(e) => updateCurrentRule({ setsCount: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value={1}>1 Set (Đánh 1 hiệp duy nhất)</option>
                  <option value={3}>3 Set (Đội thắng 2 set trước là thắng)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Điểm số chuẩn mỗi set:
                </label>
                <input
                  type="number"
                  min={11}
                  max={50}
                  value={currentRule.pointsPerSet}
                  onChange={(e) => updateCurrentRule({ pointsPerSet: parseInt(e.target.value, 10) || 21 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Điểm trần tối đa (Max Points):
                </label>
                <input
                  type="number"
                  min={currentRule.pointsPerSet}
                  max={50}
                  value={currentRule.maxPoints}
                  onChange={(e) => updateCurrentRule({ maxPoints: parseInt(e.target.value, 10) || 30 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">
                  Khi tỷ số chạm mốc này, bên chạm trước thắng ngay lập tức.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Luật Deuce (Cách biệt 2 điểm):
                </label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentRule.deuceEnabled}
                    onChange={(e) => updateCurrentRule({ deuceEnabled: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Bật luật deuce (Phải cách biệt 2 điểm)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 transition"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 flex items-center gap-1.5 transition"
          >
            <Check className="w-4 h-4" />
            Lưu Thể Thức
          </button>
        </div>
      </div>
    </div>
  );
};
