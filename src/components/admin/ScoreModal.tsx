import React, { useState } from 'react';
import { Match, type MatchStatus } from '../../models';
import { X, Check, Trophy, Play, CheckCircle2, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedMatch: Match) => void;
}

export const ScoreModal: React.FC<Props> = ({ match, isOpen, onClose, onSave }) => {
  // Bản sao để thao tác
  const [workingMatch] = useState<Match>(() => Match.fromJSON(match.toJSON()));
  const [scores, setScores] = useState(
    workingMatch.scores.length > 0 ? [...workingMatch.scores] : [{ teamA: 0, teamB: 0 }]
  );
  const [status, setStatus] = useState<MatchStatus>(workingMatch.status);
  const [winnerId, setWinnerId] = useState<string | null>(workingMatch.winnerId);

  if (!isOpen) return null;

  const rule = workingMatch.rule;
  const isThreeSets = rule.setsCount === 3;

  // Đảm bảo số set khớp với thể thức
  const displaySets = isThreeSets ? 3 : 1;
  while (scores.length < displaySets) {
    scores.push({ teamA: 0, teamB: 0 });
  }

  const updateSetScore = (setIndex: number, deltaA: number, deltaB: number) => {
    const updated = scores.map((s, idx) => {
      if (idx === setIndex) {
        return {
          teamA: Math.max(0, s.teamA + deltaA),
          teamB: Math.max(0, s.teamB + deltaB),
        };
      }
      return s;
    });

    setScores(updated);

    // Tính toán thắng thua tự động theo rule
    const evaluation = rule.evaluateMatch(updated);
    if (evaluation.finished) {
      setStatus('FINISHED');
      if (evaluation.winner === 'A') {
        setWinnerId(workingMatch.teamA ? workingMatch.teamA.id : null);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } else if (evaluation.winner === 'B') {
        setWinnerId(workingMatch.teamB ? workingMatch.teamB.id : null);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
    } else {
      const anyPoints = updated.some((s) => s.teamA > 0 || s.teamB > 0);
      setStatus(anyPoints ? 'PLAYING' : 'PENDING');
      setWinnerId(null);
    }
  };

  const handleDirectScoreChange = (
    setIndex: number,
    field: 'teamA' | 'teamB',
    val: number
  ) => {
    const safeVal = Math.max(0, isNaN(val) ? 0 : val);
    const updated = scores.map((s, idx) => {
      if (idx === setIndex) {
        return {
          ...s,
          [field]: safeVal,
        };
      }
      return s;
    });
    setScores(updated);

    const evaluation = rule.evaluateMatch(updated);
    if (evaluation.finished) {
      setStatus('FINISHED');
      if (evaluation.winner === 'A') setWinnerId(workingMatch.teamA?.id || null);
      if (evaluation.winner === 'B') setWinnerId(workingMatch.teamB?.id || null);
    } else {
      const anyPoints = updated.some((s) => s.teamA > 0 || s.teamB > 0);
      setStatus(anyPoints ? 'PLAYING' : 'PENDING');
      setWinnerId(null);
    }
  };

  const handleResetScores = () => {
    if (confirm('Đặt lại tất cả tỉ số về 0-0?')) {
      const reset = [{ teamA: 0, teamB: 0 }];
      if (isThreeSets) {
        reset.push({ teamA: 0, teamB: 0 }, { teamA: 0, teamB: 0 });
      }
      setScores(reset);
      setStatus('PENDING');
      setWinnerId(null);
    }
  };

  const handleSave = () => {
    workingMatch.scores = scores;
    workingMatch.status = status;
    workingMatch.winnerId = winnerId;
    onSave(workingMatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 font-mono text-xs font-bold rounded">
              {workingMatch.matchCode}
            </span>
            <span className="text-xs text-slate-300">
              {workingMatch.roundName} {workingMatch.court && `• ${workingMatch.court}`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thể thức trận đấu */}
        <div className="bg-slate-100/70 px-4 py-2 flex items-center justify-between text-xs text-slate-600 border-b border-slate-200">
          <span>
            Thể thức: <b>{rule.setsCount} Set</b> (Chạm {rule.pointsPerSet} điểm
            {rule.deuceEnabled ? `, deuce trần ${rule.maxPoints}` : ''})
          </span>
          <button
            type="button"
            onClick={handleResetScores}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            Làm mới
          </button>
        </div>

        {/* Body Bàn Nhập Điểm */}
        <div className="p-5 space-y-6">
          {/* 2 Đội & Trạng Thái Thắng Cuộc */}
          <div className="grid grid-cols-2 gap-4 text-center items-center">
            {/* Đội A */}
            <div
              className={`p-3 rounded-xl border transition ${
                winnerId === workingMatch.teamA?.id
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đội 1 (A)</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5 line-clamp-1">
                {workingMatch.teamA?.getDisplayName() || 'Chưa xác định'}
              </div>
              {winnerId === workingMatch.teamA?.id && (
                <div className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Trophy className="w-3 h-3 text-amber-600" /> Thắng cuộc
                </div>
              )}
            </div>

            {/* Đội B */}
            <div
              className={`p-3 rounded-xl border transition ${
                winnerId === workingMatch.teamB?.id
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đội 2 (B)</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5 line-clamp-1">
                {workingMatch.teamB?.getDisplayName() || 'Chưa xác định'}
              </div>
              {winnerId === workingMatch.teamB?.id && (
                <div className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Trophy className="w-3 h-3 text-amber-600" /> Thắng cuộc
                </div>
              )}
            </div>
          </div>

          {/* Bảng nhập điểm từng set */}
          <div className="space-y-3">
            {scores.slice(0, displaySets).map((setScore, setIdx) => (
              <div
                key={setIdx}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{isThreeSets ? `Hiệp ${setIdx + 1}` : 'Tỉ Số Set Đấu'}</span>
                  {rule.isSetFinished(setScore.teamA, setScore.teamB) && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Đã kết thúc hiệp
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                  {/* Điều khiển điểm Đội A */}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateSetScore(setIdx, -1, 0)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={setScore.teamA}
                      onChange={(e) =>
                        handleDirectScoreChange(setIdx, 'teamA', parseInt(e.target.value, 10))
                      }
                      className="w-14 h-12 text-center text-2xl font-black bg-white border-2 border-indigo-400 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateSetScore(setIdx, 1, 0)}
                      className="w-8 h-8 rounded-lg bg-indigo-600 font-bold text-white hover:bg-indigo-700 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>

                  {/* Điều khiển điểm Đội B */}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateSetScore(setIdx, 0, -1)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={setScore.teamB}
                      onChange={(e) =>
                        handleDirectScoreChange(setIdx, 'teamB', parseInt(e.target.value, 10))
                      }
                      className="w-14 h-12 text-center text-2xl font-black bg-white border-2 border-indigo-400 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateSetScore(setIdx, 0, 1)}
                      className="w-8 h-8 rounded-lg bg-indigo-600 font-bold text-white hover:bg-indigo-700 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trạng thái trận đấu */}
          <div className="pt-1">
            <label className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">
              Trạng thái trận đấu:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('PENDING')}
                className={`py-2 rounded-lg text-xs font-bold border transition ${
                  status === 'PENDING'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Chưa đấu
              </button>
              <button
                type="button"
                onClick={() => setStatus('PLAYING')}
                className={`py-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 transition ${
                  status === 'PLAYING'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Play className="w-3 h-3 fill-current" /> Đang đấu
              </button>
              <button
                type="button"
                onClick={() => setStatus('FINISHED')}
                className={`py-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 transition ${
                  status === 'FINISHED'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5 transition"
          >
            <Check className="w-4 h-4" />
            Lưu Điểm Số & Cập Nhật Realtime
          </button>
        </div>
      </div>
    </div>
  );
};
