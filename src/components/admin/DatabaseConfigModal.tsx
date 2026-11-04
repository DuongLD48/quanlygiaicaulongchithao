import React, { useState } from 'react';
import {
  getStoredFirebaseConfig,
  saveFirebaseConfig,
  type IFirebaseConfig,
} from '../../services/firebase';
import { useTournament } from '../../context/TournamentContext';
import { Database, CheckCircle, AlertCircle, X, HelpCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isRealtimeConnected, reloadTournament } = useTournament();
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
      // Tìm object trong chuỗi (kể cả khi người dùng copy cả const firebaseConfig = { ... })
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Cấu Hình Firebase Realtime DB</h3>
              <p className="text-xs text-slate-500">Đồng bộ tỉ số trực tiếp thời gian thực cho khán giả</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trạng thái hiện tại */}
        <div className="p-4 bg-slate-100/50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Trạng thái:</span>
            {isRealtimeConnected ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" /> Đã kết nối Realtime
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-bold border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" /> Chế độ Offline / LocalStorage
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowJsonTab(!showJsonTab)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
          >
            {showJsonTab ? 'Nhập từng ô' : 'Dán nhanh mã JSON'}
          </button>
        </div>

        {/* Nội dung form */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {showJsonTab ? (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Dán cấu hình Firebase từ Firebase Console:
              </label>
              <textarea
                rows={7}
                placeholder={`{\n  "apiKey": "your_api_key",\n  "databaseURL": "https://your-app-default-rtdb.firebaseio.com",\n  "projectId": "your-app"\n}`}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleParseJson}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
              >
                Trích Xuất & Điền Vào Form
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Database URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://your-project-default-rtdb.firebaseio.com"
                  value={databaseURL}
                  onChange={(e) => setDatabaseURL(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Project ID
                  </label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-2 text-xs text-indigo-900">
                <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Lưu ý khi tạo Firebase Realtime Database:</p>
                  <p className="text-[11px] text-slate-600">
                    Vào Firebase Console &gt; Realtime Database &gt; Tab Rules &gt; đổi thành{' '}
                    <code className="bg-white px-1 py-0.5 rounded border border-indigo-200">
                      ".read": true, ".write": true
                    </code>{' '}
                    để ứng dụng có thể đọc và ghi tỉ số tức thì mà không cần máy chủ riêng.
                  </p>
                </div>
              </div>

              {savedMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Đã lưu cấu hình Firebase! Đang kết nối...
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100"
                >
                  Lưu & Kết Nối Database
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
