import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Lock, KeyRound, CheckCircle, AlertCircle, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
            <Lock className="w-5 h-5 text-indigo-600" />
            <span>{isAdmin ? 'Quản Trị Viên Đã Đăng Nhập' : 'Xác Thực Quản Trị Viên'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isAdmin ? (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Bạn đang có toàn quyền quản trị giải đấu (Thêm/Sửa đội, Xếp lịch, Nhập điểm).</span>
            </div>

            {isChangingPin ? (
              <form onSubmit={handleChangePin} className="space-y-3 pt-2">
                <h4 className="text-sm font-semibold text-slate-700">Đổi Mã PIN Mới</h4>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Mã PIN hiện tại</label>
                  <input
                    type="password"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="Nhập mã PIN hiện tại"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Mã PIN mới</label>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Nhập mã PIN mới (tối thiểu 4 số)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Xác nhận mã PIN mới</label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Nhập lại mã PIN mới"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {changeSuccess && (
                  <p className="text-xs text-emerald-600 font-medium">Đổi mã PIN thành công!</p>
                )}
                {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    Lưu Mã PIN Mới
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(false)}
                    className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPin(true)}
                  className="w-full py-2.5 px-4 flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-sm transition"
                >
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  Đổi Mã PIN Quản Trị
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logoutAdmin();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-medium text-sm transition"
                >
                  Đăng Xuất Quyền Quản Trị
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="py-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Nhập Mã PIN / Secret Key
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Mã PIN (Mặc định: 123456)"
                autoFocus
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-center text-lg tracking-widest font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                Mã PIN mặc định ban đầu là: <span className="font-semibold text-slate-600">123456</span>
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-200 transition"
            >
              Mở Khóa Quản Trị
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
