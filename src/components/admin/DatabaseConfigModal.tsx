import React, { useState } from 'react';
import {
  getStoredFirebaseConfig,
  saveFirebaseConfig,
  type IFirebaseConfig,
} from '../../services/firebase';
import { useTournament } from '../../context/TournamentContext';
import { Database, CheckCircle, AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isRealtimeConnected, connectionError, reloadTournament } = useTournament();
  const currentConfig = getStoredFirebaseConfig();

  const [databaseURL, setDatabaseURL] = useState(currentConfig?.databaseURL || '');
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig?.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');

  const [jsonInput, setJsonInput] = useState('');
  const [showJsonTab, setShowJsonTab] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  if (!isOpen) return null;

  const handleParseJson = () => {
    try {
      const match = jsonInput.match(/\{[\s\S]*\}/);
      if (!match) {
        alert('Không tìm thấy JSON hợp lệ trong chuỗi bạn dán!');
        return;
      }
      const parsed = JSON.parse(match[0]);
      if (parsed.databaseURL) setDatabaseURL(parsed.databaseURL);
      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
      if (parsed.appId) setAppId(parsed.appId);
      setShowJsonTab(false);
    } catch {
      alert('Định dạng JSON không hợp lệ! Vui lòng kiểm tra lại.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!databaseURL.trim()) {
      alert('Vui lòng nhập Database URL của Firebase Realtime Database!');
      return;
    }

    const config: IFirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      databaseURL: databaseURL.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    saveFirebaseConfig(config);
    setSavedMessage(true);
    await reloadTournament();
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0c1524] rounded-3xl shadow-2xl max-w-lg w-full border border-[#16263f] overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#091120] border-b border-[#16263f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-wider">Cấu Hình Realtime Database</h3>
              <p className="text-[10px] text-slate-400">Kết nối Firebase Realtime Database để đồng bộ dữ liệu</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-[#121f33] hover:bg-[#1a2b45] text-slate-400 hover:text-white flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Trạng thái hiện tại */}
        <div className="p-3 bg-[#070d19] border-b border-[#16263f] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] text-slate-400">Trạng thái:</span>
            {isRealtimeConnected && !connectionError ? (
              <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Đã kết nối Realtime
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-500/40">
                <AlertCircle className="w-3 h-3 text-rose-400" /> {connectionError ? 'Lỗi kết nối DB' : 'Chưa kết nối'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowJsonTab(!showJsonTab)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold underline"
          >
            {showJsonTab ? 'Nhập từng ô' : 'Dán nhanh mã JSON'}
          </button>
        </div>

        {/* Form Content */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
          {showJsonTab ? (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 block">
                Dán cấu hình Firebase từ Firebase Console:
              </label>
              <textarea
                rows={7}
                placeholder={`{\n  "apiKey": "your_api_key",\n  "databaseURL": "https://your-app-default-rtdb.firebaseio.com",\n  "projectId": "your-app"\n}`}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full p-3 font-mono text-[11px] bg-[#070d19] border border-[#16263f] rounded-xl text-white focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleParseJson}
                className="w-full py-2 bg-[#121f33] hover:bg-[#1a2b45] text-cyan-300 border border-[#1d3252] rounded-xl font-bold text-xs transition"
              >
                Trích Xuất Thông Tin
              </button>
            </div>
          ) : (
            <form id="db-form" onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Database URL <span className="text-rose-400">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://your-app-default-rtdb.asia-southeast1.firebasedatabase.app"
                  value={databaseURL}
                  onChange={(e) => setDatabaseURL(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#070d19] border border-[#16263f] rounded-lg text-xs text-white focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  API Key
                </label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#070d19] border border-[#16263f] rounded-lg text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Project ID
                  </label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#070d19] border border-[#16263f] rounded-lg text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#070d19] border border-[#16263f] rounded-lg text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </form>
          )}

          {savedMessage && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Đã lưu cấu hình và kết nối lại!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#16263f] bg-[#091120]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-[#16263f] text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-black rounded-xl text-xs shadow-lg shadow-cyan-600/25 transition cursor-pointer"
          >
            Lưu & Kết Nối
          </button>
        </div>
      </div>
    </div>
  );
};
