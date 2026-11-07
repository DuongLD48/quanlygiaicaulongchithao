import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { DEFAULT_CONTENT_CONFIG } from '../../models/Tournament';
import { BookOpen, Trophy, ShieldCheck, Award } from 'lucide-react';

interface Props {
  onGoToStandings?: () => void;
}

export const RulesView: React.FC<Props> = ({ onGoToStandings }) => {
  const { tournament } = useTournament();

  const content = {
    ...DEFAULT_CONTENT_CONFIG,
    ...(tournament?.contentConfig || {}),
  };

  return (
    <div className="bg-[#0c1524] rounded-2xl border border-[#16263f] p-5 sm:p-7 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#14233a]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
              {content.rulesTitle || 'Điều Lệ & Quy Tắc Tính Điểm Giải Đấu'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              <span className="font-bold text-cyan-300">
                {content.tournamentName || (tournament ? tournament.name : 'CLB Cầu Lông')}
              </span>{' '}
              • {content.tournamentSubtitle || 'Tiêu chuẩn thi đấu và xếp hạng thời gian thực'}
            </p>
          </div>
        </div>

        {onGoToStandings && (
          <button
            onClick={onGoToStandings}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold transition shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Xem Bảng Điểm</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Box 1: Thể thức thi đấu */}
        <div className="bg-[#091120] rounded-xl border border-[#16263f] p-5 space-y-3">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            1. Thể Thức Thi Đấu
          </h3>
          <ul className="text-xs text-slate-300 space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <div>
                <b className="text-white">Vòng Bảng:</b> {content.rulesGroupStage}
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <div>
                <b className="text-white">Vòng Loại (Knockout):</b> {content.rulesKnockoutStage}
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <div>
                <b className="text-white">Quy định điểm số:</b> {content.rulesPointRules}
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <div>
                <b className="text-white">Trọng tài & Sân bãi:</b> {content.rulesReferees}
              </div>
            </li>
          </ul>
        </div>

        {/* Box 2: Tiêu chí xếp hạng */}
        <div className="bg-[#091120] rounded-xl border border-[#16263f] p-5 space-y-3">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            2. Tiêu Chí Xếp Hạng Vòng Bảng (Chuẩn BWF)
          </h3>
          <div className="text-xs text-slate-300 space-y-2.5">
            <div className="flex items-start gap-2.5 bg-[#0c1524] p-2.5 rounded-lg border border-[#16263f]">
              <span className="w-5 h-5 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                1
              </span>
              <div>
                <b className="text-white">Tổng số trận thắng (T):</b>
                <p className="text-slate-400 text-[11px] mt-0.5">{content.rulesTieBreak1}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-[#0c1524] p-2.5 rounded-lg border border-[#16263f]">
              <span className="w-5 h-5 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                2
              </span>
              <div>
                <b className="text-white">Hiệu số Điểm (HS):</b>
                <p className="text-slate-400 text-[11px] mt-0.5">{content.rulesTieBreak2}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-[#0c1524] p-2.5 rounded-lg border border-[#16263f]">
              <span className="w-5 h-5 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                3
              </span>
              <div>
                <b className="text-white">Tổng điểm ghi được (Đ):</b>
                <p className="text-slate-400 text-[11px] mt-0.5">{content.rulesTieBreak3}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-[#0c1524] p-2.5 rounded-lg border border-[#16263f]">
              <span className="w-5 h-5 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                4
              </span>
              <div>
                <b className="text-white">Đối đầu trực tiếp:</b>
                <p className="text-slate-400 text-[11px] mt-0.5">{content.rulesTieBreak4}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="bg-[#061826] border border-cyan-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-amber-400 shrink-0" />
          <span className="text-xs text-slate-200">
            <b className="text-amber-300">Quy định đi tiếp:</b>{' '}
            {content.rulesAdvancement}
          </span>
        </div>
        {onGoToStandings && (
          <button
            onClick={onGoToStandings}
            className="sm:hidden w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold transition text-center"
          >
            Xem Bảng Điểm
          </button>
        )}
      </div>
    </div>
  );
};
