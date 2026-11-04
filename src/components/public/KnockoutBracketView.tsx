import React from 'react';
import { Category, Match } from '../../models';
import { Trophy, Medal, Award, Play, CheckCircle2 } from 'lucide-react';

interface Props {
  category: Category;
}

export const KnockoutBracketView: React.FC<Props> = ({ category }) => {
  const koMatches = category.knockoutMatches;

  const sf1 = koMatches.find(
    (m) => m.roundName.includes('Bán kết 1') || m.matchCode.endsWith('BK-01')
  );
  const sf2 = koMatches.find(
    (m) => m.roundName.includes('Bán kết 2') || m.matchCode.endsWith('BK-02')
  );
  const finalMatch = koMatches.find(
    (m) => m.roundName.includes('Chung kết') && !m.roundName.includes('Bán kết')
  );
  const thirdMatch = koMatches.find(
    (m) => m.roundName.includes('Tranh') || m.roundName.includes('hạng 3')
  );

  const champion = finalMatch?.getWinner();
  const runnerUp =
    finalMatch?.status === 'FINISHED' && finalMatch?.winnerId
      ? finalMatch.winnerId === finalMatch.teamA?.id
        ? finalMatch.teamB
        : finalMatch.teamA
      : null;
  const thirdPlace = thirdMatch?.getWinner();

  if (koMatches.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
        <Trophy className="w-10 h-10 mx-auto text-slate-300" />
        <p className="font-semibold text-slate-600">Chưa có dữ liệu nhánh đấu vòng trong.</p>
        <p className="text-xs text-slate-400">
          Ban tổ chức sẽ nhập các đội Nhất A, Nhì B... vào nhánh Bán Kết sau khi kết thúc vòng bảng!
        </p>
      </div>
    );
  }

  const renderMatchCard = (match?: Match, title?: string, highlightWinner: boolean = true) => {
    if (!match) return null;

    const isFinished = match.status === 'FINISHED';
    const isPlaying = match.status === 'PLAYING';

    return (
      <div
        className={`bg-white rounded-2xl border p-4 shadow-sm w-full max-w-sm transition ${
          isFinished
            ? 'border-slate-200'
            : isPlaying
            ? 'border-amber-300 ring-2 ring-amber-400/20'
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
          <span className="font-bold text-slate-700">{title || match.roundName}</span>
          {isPlaying ? (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Play className="w-2.5 h-2.5 fill-current" /> Đang đấu
            </span>
          ) : isFinished ? (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> Xong
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono">
              {match.scheduledTime || 'Chưa đấu'}
            </span>
          )}
        </div>

        <div className="py-2.5 space-y-2">
          {/* Đội A */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {highlightWinner && match.winnerId === match.teamA?.id && (
                <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              <span
                className={`text-xs truncate ${
                  match.winnerId === match.teamA?.id
                    ? 'font-extrabold text-indigo-900'
                    : 'font-semibold text-slate-800'
                }`}
              >
                {match.teamA?.getDisplayName() || 'Chờ xác định'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {match.scores.map((s, idx) => (
                <span
                  key={idx}
                  className={`w-6 h-6 flex items-center justify-center font-mono text-xs font-bold rounded ${
                    match.rule.getSetWinner(s.teamA, s.teamB) === 'A'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {s.teamA}
                </span>
              ))}
            </div>
          </div>

          {/* Đội B */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {highlightWinner && match.winnerId === match.teamB?.id && (
                <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              <span
                className={`text-xs truncate ${
                  match.winnerId === match.teamB?.id
                    ? 'font-extrabold text-indigo-900'
                    : 'font-semibold text-slate-800'
                }`}
              >
                {match.teamB?.getDisplayName() || 'Chờ xác định'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {match.scores.map((s, idx) => (
                <span
                  key={idx}
                  className={`w-6 h-6 flex items-center justify-center font-mono text-xs font-bold rounded ${
                    match.rule.getSetWinner(s.teamA, s.teamB) === 'B'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {s.teamB}
                </span>
              ))}
            </div>
          </div>
        </div>

        {match.court && (
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-right">
            {match.court}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Vinh Danh Nhà Vô Địch (Podium) nếu đã hoàn thành Chung kết */}
      {champion && (
        <div className="p-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-3xl text-slate-900 shadow-xl shadow-amber-200/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-md flex items-center justify-center text-amber-950 shadow-inner shrink-0">
              <Trophy className="w-10 h-10 fill-amber-300 stroke-amber-950" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-950/80">
                Chúc Mừng Nhà Vô Địch {category.name}
              </span>
              <h2 className="text-2xl font-black text-slate-950 mt-0.5">
                {champion.getDisplayName()}
              </h2>
              {champion.players && champion.players.length > 0 && (
                <p className="text-xs font-semibold text-amber-950/80 mt-1">
                  VĐV: {champion.players.map((p) => p.fullName).join(' & ')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {runnerUp && (
              <div className="flex-1 md:flex-initial px-4 py-2.5 bg-white/20 backdrop-blur-md rounded-2xl text-center">
                <Medal className="w-4 h-4 mx-auto text-slate-200" />
                <span className="text-[10px] font-bold uppercase tracking-wider block mt-1">
                  Á Quân
                </span>
                <span className="text-xs font-bold truncate max-w-[120px] block mt-0.5">
                  {runnerUp.getDisplayName()}
                </span>
              </div>
            )}
            {thirdPlace && (
              <div className="flex-1 md:flex-initial px-4 py-2.5 bg-white/20 backdrop-blur-md rounded-2xl text-center">
                <Award className="w-4 h-4 mx-auto text-amber-800" />
                <span className="text-[10px] font-bold uppercase tracking-wider block mt-1">
                  Hạng Ba
                </span>
                <span className="text-xs font-bold truncate max-w-[120px] block mt-0.5">
                  {thirdPlace.getDisplayName()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sơ đồ Nhánh Đấu Trực Quan */}
      <div className="overflow-x-auto pb-6">
        <div className="min-w-[700px] flex items-center justify-center gap-8 lg:gap-12 py-4">
          {/* Cột 1: Bán Kết */}
          <div className="flex flex-col justify-around gap-12 flex-1 max-w-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                Bán Kết 1 (Nhất A vs Nhì B)
              </span>
              {renderMatchCard(sf1, 'Bán Kết 1')}
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                Bán Kết 2 (Nhất B vs Nhì A)
              </span>
              {renderMatchCard(sf2, 'Bán Kết 2')}
            </div>
          </div>

          {/* Cột 2: Chung Kết & Tranh Hạng 3 */}
          <div className="flex flex-col justify-around gap-12 flex-1 max-w-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-2 text-center flex items-center justify-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> Chung Kết Tranh Vô Địch
              </span>
              {renderMatchCard(finalMatch, 'Chung Kết Vô Địch')}
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2 text-center flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-cyan-600" /> Tranh Hạng Ba - Tư
              </span>
              {renderMatchCard(thirdMatch, 'Trận Tranh Hạng 3')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
