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
  const [workingMatch] = useState<Match>(() => Match.fromJSON(match.toJSON()));
  const [scores, setScores] = useState(
    workingMatch.scores.length > 0 ? [...workingMatch.scores] : [{ teamA: 0, teamB: 0 }]
  );
  const [status, setStatus] = useState<MatchStatus>(workingMatch.status);
  const [winnerId, setWinnerId] = useState<string | null>(workingMatch.winnerId);

  if (!isOpen) return null;

  const rule = workingMatch.rule;
  const isThreeSets = rule.setsCount === 3;

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

  const handleDirectScoreChange = (setIndex: number, team: 'teamA' | 'teamB', value: number) => {
    const parsed = isNaN(value) ? 0 : Math.max(0, value);
    const updated = scores.map((s, idx) => {
      if (idx === setIndex) {
        return {
          ...s,
          [team]: parsed,
        };
      }
      return s;
    });

    setScores(updated);

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

  const handleResetScores = () => {
    if (confirm('Bạn có muốn đặt lại tỷ số trận đấu về 0-0 không?')) {
      const zero = scores.map(() => ({ teamA: 0, teamB: 0 }));
      setScores(zero);
      setStatus('PENDING');
      setWinnerId(null);
    }
  };

  const handleSave = () => {
    let resolvedWinnerId = winnerId;
    if (status === 'FINISHED' && !resolvedWinnerId) {
      const totalA = scores.reduce((sum, s) => sum + s.teamA, 0);
      const totalB = scores.reduce((sum, s) => sum + s.teamB, 0);
      if (totalA > totalB) resolvedWinnerId = workingMatch.teamA?.id || null;
      else if (totalB > totalA) resolvedWinnerId = workingMatch.teamB?.id || null;
    }
    workingMatch.scores = scores;
    workingMatch.status = status;
    workingMatch.winnerId = resolvedWinnerId;
    onSave(workingMatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#0c1524] rounded-3xl shadow-2xl max-w-lg w-full border border-[#16263f] overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#091120] border-b border-[#16263f] shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#101e33] border border-[#1d3252] text-cyan-300 font-mono text-xs font-black rounded">
              {workingMatch.matchCode}
            </span>
            <span className="text-xs font-bold text-white">
              {workingMatch.roundName} {workingMatch.court && `• ${workingMatch.court}`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#121f33] hover:bg-[#1a2b45] text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thể thức trận đấu */}
        <div className="bg-[#070d19] px-4 py-2 flex items-center justify-between text-xs text-slate-400 border-b border-[#16263f] shrink-0">
          <span>
            Thể thức: <b className="text-cyan-300">{rule.setsCount} Set</b> (Chạm {rule.pointsPerSet} điểm
            {rule.deuceEnabled ? `, deuce trần ${rule.maxPoints}` : ''})
          </span>
          <button
            type="button"
            onClick={handleResetScores}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 font-medium cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Làm mới
          </button>
        </div>

        {/* Body Bàn Nhập Điểm */}
        <div className="p-3.5 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* 2 Đội & Trạng Thái Thắng Cuộc */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-center items-center">
            {/* Đội A */}
            <div
              className={`p-2.5 sm:p-3 rounded-2xl border transition ${
                winnerId === workingMatch.teamA?.id
                  ? 'bg-cyan-950/60 border-cyan-400 ring-2 ring-cyan-400/30 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'bg-[#091120] border-[#16263f]'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đội 1 (A)</div>
              <div className="font-black text-cyan-300 text-xs sm:text-sm mt-0.5 truncate">
                {workingMatch.teamA?.name || workingMatch.placeholderA || 'Đội A'}
              </div>
              {workingMatch.teamA?.players && workingMatch.teamA.players.length > 0 && (
                <div className="text-[11px] text-slate-300 font-medium mt-0.5 truncate">
                  {workingMatch.teamA.players.map((p) => p.fullName).join(' / ')}
                </div>
              )}
              {winnerId === workingMatch.teamA?.id && (
                <div className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-black text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/40">
                  <Trophy className="w-3 h-3 text-amber-300" /> Thắng cuộc
                </div>
              )}
            </div>

            {/* Đội B */}
            <div
              className={`p-2.5 sm:p-3 rounded-2xl border transition ${
                winnerId === workingMatch.teamB?.id
                  ? 'bg-cyan-950/60 border-cyan-400 ring-2 ring-cyan-400/30 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'bg-[#091120] border-[#16263f]'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đội 2 (B)</div>
              <div className="font-black text-cyan-300 text-xs sm:text-sm mt-0.5 truncate">
                {workingMatch.teamB?.name || workingMatch.placeholderB || 'Đội B'}
              </div>
              {workingMatch.teamB?.players && workingMatch.teamB.players.length > 0 && (
                <div className="text-[11px] text-slate-300 font-medium mt-0.5 truncate">
                  {workingMatch.teamB.players.map((p) => p.fullName).join(' / ')}
                </div>
              )}
              {winnerId === workingMatch.teamB?.id && (
                <div className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-black text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/40">
                  <Trophy className="w-3 h-3 text-amber-300" /> Thắng cuộc
                </div>
              )}
            </div>
          </div>

          {/* Bảng nhập điểm từng set */}
          <div className="space-y-3">
            {scores.slice(0, displaySets).map((setScore, setIdx) => (
              <div
                key={setIdx}
                className="p-3 bg-[#091120] rounded-xl border border-[#16263f] space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="uppercase text-[10px] tracking-wider text-cyan-400">
                    {isThreeSets ? `Hiệp ${setIdx + 1}` : 'Tỷ Số Set Đấu'}
                  </span>
                  {rule.isSetFinished(setScore.teamA, setScore.teamB) && (
                    <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                      Xong hiệp
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-4 items-center">
                  {/* Điều khiển điểm Đội A */}
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => updateSetScore(setIdx, -1, 0)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#121f33] border border-[#1d3252] font-black text-slate-300 hover:text-white hover:bg-[#1a2b45] flex items-center justify-center cursor-pointer text-sm sm:text-base shrink-0"
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
                      className="w-11 sm:w-14 h-10 sm:h-12 text-center text-xl sm:text-2xl font-black bg-[#070d19] border-2 border-cyan-500 rounded-xl text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateSetScore(setIdx, 1, 0)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-black text-black flex items-center justify-center shadow-md shadow-cyan-600/20 cursor-pointer text-sm sm:text-base shrink-0"
                    >
                      +
                    </button>
                  </div>

                  {/* Điều khiển điểm Đội B */}
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => updateSetScore(setIdx, 0, -1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#121f33] border border-[#1d3252] font-black text-slate-300 hover:text-white hover:bg-[#1a2b45] flex items-center justify-center cursor-pointer text-sm sm:text-base shrink-0"
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
                      className="w-11 sm:w-14 h-10 sm:h-12 text-center text-xl sm:text-2xl font-black bg-[#070d19] border-2 border-cyan-500 rounded-xl text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateSetScore(setIdx, 0, 1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-black text-black flex items-center justify-center shadow-md shadow-cyan-600/20 cursor-pointer text-sm sm:text-base shrink-0"
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
            <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
              Trạng thái trận đấu:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('PENDING')}
                className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  status === 'PENDING'
                    ? 'bg-slate-700 text-white border-slate-500'
                    : 'bg-[#091120] text-slate-400 border-[#16263f] hover:text-white'
                }`}
              >
                Chưa đấu
              </button>
              <button
                type="button"
                onClick={() => setStatus('PLAYING')}
                className={`py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 transition cursor-pointer ${
                  status === 'PLAYING'
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-[#091120] text-slate-400 border-[#16263f] hover:text-white'
                }`}
              >
                <Play className="w-3 h-3 fill-current" /> Đang đấu
              </button>
              <button
                type="button"
                onClick={() => setStatus('FINISHED')}
                className={`py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 transition cursor-pointer ${
                  status === 'FINISHED'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-[#091120] text-slate-400 border-[#16263f] hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#16263f] bg-[#091120] shrink-0">
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
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-black rounded-xl text-xs shadow-lg shadow-cyan-600/25 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Lưu Tỷ Số
          </button>
        </div>
      </div>
    </div>
  );
};
