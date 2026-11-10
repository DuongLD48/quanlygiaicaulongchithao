import React, { useState, useEffect } from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  type ITournamentContentConfig,
  DEFAULT_CONTENT_CONFIG,
} from '../../models/Tournament';
import {
  Globe,
  Save,
  RotateCcw,
  BookOpen,
  Award,
  CheckCircle2,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react';

export const WebsiteContentManager: React.FC = () => {
  const { tournament, saveTournament, isAdmin, isRealtimeConnected, connectionError } =
    useTournament();

  const isLocked = !isRealtimeConnected || !!connectionError;

  const [form, setForm] = useState<ITournamentContentConfig>({
    ...DEFAULT_CONTENT_CONFIG,
    ...(tournament?.contentConfig || {}),
  });

  const [courts, setCourts] = useState<string[]>(
    () => tournament?.courts || ['Sân 1', 'Sân 2', 'Sân 3', 'Sân 4', 'Sân 5', 'Sân 6']
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (tournament?.contentConfig) {
      setForm({
        ...DEFAULT_CONTENT_CONFIG,
        ...tournament.contentConfig,
      });
    }
    if (tournament?.courts && tournament.courts.length > 0) {
      setCourts(tournament.courts);
    }
  }, [tournament]);

  if (!tournament) return null;

  const handleChange = (key: keyof ITournamentContentConfig, val: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: val,
    }));
    setSavedSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert('Không thể lưu: Mất kết nối tới máy chủ Database!');
      return;
    }

    tournament.contentConfig = { ...form };
    tournament.name = form.tournamentName || tournament.name;
    tournament.courts = courts.filter((c) => c.trim().length > 0);

    await saveTournament(tournament);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (
      confirm(
        'Bạn có chắc muốn khôi phục toàn bộ nội dung văn bản về mặc định ban đầu không?'
      )
    ) {
      setForm({ ...DEFAULT_CONTENT_CONFIG });
      setSavedSuccess(false);
    }
  };

  return (
    <div className="bg-[#0c1524] rounded-2xl border border-[#16263f] p-4 sm:p-6 space-y-6 shadow-xl text-slate-100">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#16263f]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold shadow-lg">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
              Chỉnh Sửa Nội Dung Website & Thể Lệ
            </h3>
            <p className="text-[11px] text-slate-400">
              Tùy biến toàn bộ văn bản tiêu đề, thể lệ, quy tắc và chân trang mà không cần code
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#091120] hover:bg-[#11233e] text-slate-300 border border-[#1d3252] rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              Khôi Phục Mặc Định
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-black rounded-xl text-xs shadow-lg shadow-cyan-600/25 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Lưu Nội Dung
            </button>
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Đã lưu và đồng bộ toàn bộ nội dung website lên hệ thống thành công!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* PHẦN 1: TIÊU ĐỀ & THƯƠNG HIỆU CHUNG */}
        <div className="bg-[#091120] rounded-xl border border-[#16263f] p-4 sm:p-5 space-y-4">
          <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-[#14233a]">
            <Globe className="w-4 h-4 text-cyan-400" />
            1. Tiêu Đề Website & Nhận Diện Thương Hiệu
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Tiêu đề Metafield / Tab trình duyệt (Meta Title):
              </label>
              <input
                type="text"
                value={form.websiteTitle || ''}
                onChange={(e) => handleChange('websiteTitle', e.target.value)}
                placeholder="VD: Giải Cầu Lông CLB Daha Badminton"
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Hiển thị trên tab trình duyệt và tiêu đề chính khi chia sẻ link (Zalo, Facebook, v.v.).
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Mô tả Metafield khi chia sẻ link (Meta Description):
              </label>
              <input
                type="text"
                value={form.metaDescription || ''}
                onChange={(e) => handleChange('metaDescription', e.target.value)}
                placeholder="Để trống nếu không muốn hiện mô tả khi chia sẻ link"
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Dòng mô tả bên dưới link khi chia sẻ. Để trống nếu muốn ẩn hoàn toàn.
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Tên Giải Đấu:
              </label>
              <input
                type="text"
                value={form.tournamentName || ''}
                onChange={(e) => handleChange('tournamentName', e.target.value)}
                placeholder="VD: Giải Cầu Lông CLB Daha Badminton 2026"
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none font-bold"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Tên chính thức của giải đấu hiển thị ở các banner và trang công khai.
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Tiêu Đề Phụ / Slogan:
              </label>
              <input
                type="text"
                value={form.tournamentSubtitle || ''}
                onChange={(e) => handleChange('tournamentSubtitle', e.target.value)}
                placeholder="VD: Tiêu chuẩn thi đấu và xếp hạng thời gian thực"
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Dòng khẩu hiệu nằm dưới tên giải đấu tại trang Thể Lệ và Header.
              </span>
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Văn Bản Chân Trang (Footer):
              </label>
              <input
                type="text"
                value={form.footerText || ''}
                onChange={(e) => handleChange('footerText', e.target.value)}
                placeholder="VD: Giải Cầu Lông CLB Daha Badminton 2026 • CLB Daha Badminton"
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Hiển thị ở dòng bản quyền cuối cùng của trang web.
              </span>
            </div>
          </div>
        </div>

        {/* PHẦN 2: DANH SÁCH SÂN THI ĐẤU */}
        <div className="bg-[#091120] rounded-xl border border-[#16263f] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#14233a]">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              2. Danh Sách Sân Thi Đấu ({courts.length} Sân)
            </h4>
            <button
              type="button"
              onClick={() => {
                const newNum = courts.length + 1;
                setCourts([...courts, `Sân ${newNum}`]);
                setSavedSuccess(false);
              }}
              className="px-2.5 py-1 bg-[#0c1524] hover:bg-[#152742] text-cyan-400 border border-cyan-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Thêm Sân
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {courts.map((court, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 bg-[#0c1524] border border-[#1d3252] rounded-xl p-1.5 focus-within:border-cyan-400"
              >
                <input
                  type="text"
                  value={court}
                  onChange={(e) => {
                    const next = [...courts];
                    next[idx] = e.target.value;
                    setCourts(next);
                    setSavedSuccess(false);
                  }}
                  className="w-full bg-transparent px-1.5 py-1 text-xs font-bold text-white focus:outline-none"
                />
                {courts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCourts(courts.filter((_, i) => i !== idx));
                      setSavedSuccess(false);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition cursor-pointer"
                    title="Xóa sân này"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Hệ thống tự động sử dụng danh sách các sân này khi xếp trận tự động, thêm trận thủ công hoặc cài vòng trong.
          </span>
        </div>

        {/* PHẦN 3: NỘI DUNG TRANG THỂ LỆ */}
        <div className="bg-[#091120] rounded-xl border border-[#16263f] p-4 sm:p-5 space-y-4">
          <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-[#14233a]">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            3. Nội Dung Trang Thể Lệ & Quy Định Thi Đấu
          </h4>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Tiêu Đề Chính Của Trang Thể Lệ:
            </label>
            <input
              type="text"
              value={form.rulesTitle || ''}
              onChange={(e) => handleChange('rulesTitle', e.target.value)}
              placeholder="VD: Điều Lệ & Quy Tắc Tính Điểm Giải Đấu"
              className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none font-bold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Thể thức Vòng Bảng:
              </label>
              <textarea
                rows={3}
                value={form.rulesGroupStage || ''}
                onChange={(e) => handleChange('rulesGroupStage', e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Thể thức Vòng Loại (Knockout):
              </label>
              <textarea
                rows={3}
                value={form.rulesKnockoutStage || ''}
                onChange={(e) => handleChange('rulesKnockoutStage', e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Quy định điểm số & chạm điểm:
              </label>
              <textarea
                rows={2}
                value={form.rulesPointRules || ''}
                onChange={(e) => handleChange('rulesPointRules', e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Trọng tài & Sân bãi điều phối:
              </label>
              <textarea
                rows={2}
                value={form.rulesReferees || ''}
                onChange={(e) => handleChange('rulesReferees', e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* PHẦN 4: TIÊU CHÍ XẾP HẠNG & QUY ĐỊNH ĐI TIẾP */}
        <div className="bg-[#091120] rounded-xl border border-[#16263f] p-4 sm:p-5 space-y-4">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-[#14233a]">
            <Award className="w-4 h-4 text-amber-400" />
            4. Tiêu Chí Xếp Hạng Vòng Bảng & Quy Định Đi Tiếp
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Tiêu chí 1 - Tổng số trận thắng (T):
              </label>
              <textarea
                rows={2}
                value={form.rulesTieBreak1 || ''}
                onChange={(e) => handleChange('rulesTieBreak1', e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Tiêu chí 2 - Hiệu số điểm (HS):
              </label>
              <textarea
                rows={2}
                value={form.rulesTieBreak2 || ''}
                onChange={(e) => handleChange('rulesTieBreak2', e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Tiêu chí 3 - Tổng điểm ghi được (Đ):
              </label>
              <textarea
                rows={2}
                value={form.rulesTieBreak3 || ''}
                onChange={(e) => handleChange('rulesTieBreak3', e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Tiêu chí 4 - Đối đầu trực tiếp:
              </label>
              <textarea
                rows={2}
                value={form.rulesTieBreak4 || ''}
                onChange={(e) => handleChange('rulesTieBreak4', e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Quy định đi tiếp vào Vòng Trong (Banner cuối trang Thể Lệ):
            </label>
            <input
              type="text"
              value={form.rulesAdvancement || ''}
              onChange={(e) => handleChange('rulesAdvancement', e.target.value)}
              className="w-full px-3 py-2 bg-[#0c1524] border border-[#1d3252] rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Nút lưu cuối trang */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-[#121f33] rounded-xl transition cursor-pointer"
          >
            Khôi Phục Mặc Định
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black rounded-xl text-xs font-black transition shadow-lg shadow-cyan-600/30 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Lưu Toàn Bộ Cài Đặt Nội Dung
          </button>
        </div>
      </form>
    </div>
  );
};
