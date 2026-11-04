import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Lock, KeyRound, AlertCircle, X, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminAuthModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isAdmin, loginAdmin, logoutAdmin, updateAdminPin } = useTournament();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await loginAdmin(pin);
    if (success) {
      setPin('');
      onClose();
    } else {
      setError('Mã PIN không đúng. Vui lòng thử lại!');
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setChangeSuccess(false);

    if (newPin.length < 4) {
      setError('Mã PIN mới phải có ít nhất 4 ký tự!');
      return;
    }

    if (newPin !== confirmPin) {
      setError('Xác nhận mã PIN mới không khớp!');
      return;
    }

    const isCurrentValid = await loginAdmin(currentPin);
    if (!isCurrentValid) {
      setError('Mã PIN hiện tại không chính xác!');
      return;
    }

    await updateAdminPin(newPin);
    setChangeSuccess(true);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => {
      setIsChangingPin(false);
      setChangeSuccess(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0c1524] border border-[#16263f] rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#16263f]">
          <div className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-wide">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>{isAdmin ? 'Quản Trị Ban Tổ Chức' : 'Xác Thực Ban Tổ Chức'}</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#121f33] hover:bg-[#1a2b45] text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isAdmin ? (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Bạn đang có toàn quyền quản trị: Thêm/Sửa đội, Xếp lịch, Nhập tỷ số.</span>
            </div>

            {isChangingPin ? (
              <form onSubmit={handleChangePin} className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-cyan-300 uppercase">Đổi Mã PIN Mới</h4>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">Mã PIN hiện tại</label>
                  <input
                    type="password"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="Nhập mã PIN hiện tại"
                    className="w-full px-3 py-1.5 bg-[#091120] border border-[#16263f] rounded-lg text-xs text-white focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">Mã PIN mới</label>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Tối thiểu 4 số"
                    className="w-full px-3 py-1.5 bg-[#091120] border border-[#16263f] rounded-lg text-xs text-white focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">Xác nhận mã PIN mới</label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Nhập lại mã PIN mới"
                    className="w-full px-3 py-1.5 bg-[#091120] border border-[#16263f] rounded-lg text-xs text-white focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>

                {changeSuccess && (
                  <p className="text-xs text-emerald-400 font-medium">Đổi mã PIN thành công!</p>
                )}
                {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg text-xs transition shadow-md shadow-cyan-600/20"
                  >
                    Lưu PIN Mới
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(false)}
                    className="px-3 py-2 bg-[#091120] hover:bg-[#11233e] text-slate-300 rounded-lg text-xs border border-[#16263f]"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsChangingPin(true)}
                  className="w-full py-2 bg-[#091120] hover:bg-[#11233e] text-slate-200 border border-[#16263f] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  Đổi Mã PIN Quản Trị
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logoutAdmin();
                    onClose();
                  }}
                  className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold transition"
                >
                  Đăng Xuất Ban Tổ Chức
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="py-4 space-y-4 text-center">
            <div className="w-14 h-14 bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-cyan-950">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Nhập mã PIN Ban Tổ Chức (Mặc định: <span className="font-mono text-cyan-300 font-bold">123456</span>)
              </p>
            </div>

            <div>
              <input
                type="password"
                maxLength={10}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••"
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2.5 px-4 rounded-xl bg-[#091120] border border-[#16263f] text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                autoFocus
                required
              />
              {error && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 mt-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-black text-xs transition shadow-lg shadow-cyan-600/25 cursor-pointer uppercase tracking-wider"
            >
              Xác Nhận & Mở Khóa
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
