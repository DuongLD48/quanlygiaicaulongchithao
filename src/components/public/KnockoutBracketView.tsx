import React from 'react';
import { Category, Match } from '../../models';
import { Trophy, Award, Play, CheckCircle2, MapPin, Clock } from 'lucide-react';

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
      <div className="p-12 text-center text-slate-400 text-xs bg-[#0c1524] rounded-2xl border border-[#16263f] space-y-2">
        <Trophy className="w-10 h-10 mx-auto text-amber-400/50" />
        <p className="font-bold text-white text-sm">Chưa có dữ liệu nhánh đấu vòng trong.</p>
        <p className="text-slate-500">
          Ban tổ chức sẽ thiết lập các cặp Bán Kết và Chung Kết sau khi kết thúc vòng bảng!
        </p>
      </div>
    );
  }

  const renderMatchCard = (match?: Match, title?: string) => {
    if (!match) return null;

    const isFinished = match.status === 'FINISHED';
    const isPlaying = match.status === 'PLAYING';
    const teamAWon = match.winnerId === match.teamA?.id;
    const teamBWon = match.winnerId === match.teamB?.id;

    return (
      <div
        className={`bg-[#0c1524] rounded-2xl border p-4 shadow-xl w-full max-w-sm transition ${
          isPlaying
            ? 'border-amber-400/80 ring-2 ring-amber-400/20'
            : isFinished
            ? 'border-cyan-500/40'
            : 'border-[#16263f]'
        }`}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-[#16263f] text-xs">
          <span className="font-bold text-cyan-300 uppercase tracking-wide text-[11px]">
            {title || match.roundName}
          </span>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-[#101e33] border border-[#1d3252] text-[10px] font-mono font-black text-cyan-300">
              {match.matchCode}
            </span>
            {isPlaying ? (
              <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Play className="w-2.5 h-2.5 fill-current" /> Đang đấu
              </span>
            ) : isFinished ? (
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Xong
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">
                {match.scheduledTime || 'Chưa đấu'}
              </span>
            )}
          </div>
        </div>

        <div className="py-3 space-y-2.5">
          {/* Đội A */}
          <div
            className={`flex items-center justify-between p-2 rounded-xl transition ${
              teamAWon
                ? 'bg-cyan-950/40 border border-cyan-500/30'
                : 'bg-[#091120] border border-[#14233a]'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className={`text-xs truncate ${teamAWon ? 'font-black text-white' : 'font-semibold text-slate-300'}`}>
                {match.teamA?.getDisplayName() || 'Chờ xác định (Nhất/Nhì)'}
              </div>
              {match.teamA?.players && match.teamA.players.length > 0 && (
                <div className="text-[10px] text-slate-500 truncate">
                  {match.teamA.players.map((p) => p.fullName).join(' • ')}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 font-mono font-black ml-2">
              {match.scores.map((set, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded text-xs ${
                    match.rule.getSetWinner(set.teamA, set.teamB) === 'A'
                      ? 'bg-cyan-500 text-black font-extrabold'
                      : 'bg-[#101e33] text-slate-400'
                  }`}
                >
                  {set.teamA}
                </span>
              ))}
            </div>
          </div>

          {/* Đội B */}
          <div
            className={`flex items-center justify-between p-2 rounded-xl transition ${
              teamBWon
                ? 'bg-cyan-950/40 border border-cyan-500/30'
                : 'bg-[#091120] border border-[#14233a]'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className={`text-xs truncate ${teamBWon ? 'font-black text-white' : 'font-semibold text-slate-300'}`}>
                {match.teamB?.getDisplayName() || 'Chờ xác định (Nhất/Nhì)'}
              </div>
              {match.teamB?.players && match.teamB.players.length > 0 && (
                <div className="text-[10px] text-slate-500 truncate">
                  {match.teamB.players.map((p) => p.fullName).join(' • ')}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 font-mono font-black ml-2">
              {match.scores.map((set, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded text-xs ${
                    match.rule.getSetWinner(set.teamA, set.teamB) === 'B'
                      ? 'bg-cyan-500 text-black font-extrabold'
                      : 'bg-[#101e33] text-slate-400'
                  }`}
                >
                  {set.teamB}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#16263f] flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-500" />
            {match.court || 'Chưa xếp sân'}
          </span>
          {match.scheduledTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {match.scheduledTime}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 🏆 BANNER PODIUM VINH DANH NHÀ VÔ ĐỊCH */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-950/90 via-slate-900 to-yellow-950/90 rounded-3xl border-2 border-amber-400/80 p-5 sm:p-6 shadow-[0_0_35px_rgba(251,191,36,0.25)] space-y-4">
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-xl font-black shadow-lg">
              <Trophy className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-wider">
                Vinh Danh Nhà Vô Địch ({category.name})
              </h3>
              <p className="text-xs text-amber-200/70">
                Chúc mừng các vận động viên thi đấu xuất sắc nhất Vòng Chung Kết!
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono text-xs font-bold">
            🏆 CƠ CẤU GIẢI THƯỞNG
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 🥇 VÔ ĐỊCH */}
          <div className="bg-amber-950/60 border border-amber-400/60 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
            <span className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md">
              🥇
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                NHÀ VÔ ĐỊCH
              </span>
              {champion ? (
                <div className="font-black text-white text-xs truncate mt-0.5">
                  {champion.getDisplayName()}
                </div>
              ) : (
                <span className="text-xs font-medium text-amber-200/60 italic mt-0.5 block">
                  Chờ kết quả Chung Kết
                </span>
              )}
            </div>
          </div>

          {/* 🥈 Á QUÂN */}
          <div className="bg-slate-900/80 border border-slate-600/60 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
            <span className="w-10 h-10 rounded-xl bg-slate-300 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md">
              🥈
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">
                Á QUÂN (HẠNG 2)
              </span>
              {runnerUp ? (
                <div className="font-black text-white text-xs truncate mt-0.5">
                  {runnerUp.getDisplayName()}
                </div>
              ) : (
                <span className="text-xs font-medium text-slate-400 italic mt-0.5 block">
                  Chờ kết quả Chung Kết
                </span>
              )}
            </div>
          </div>

          {/* 🥉 HẠNG BA */}
          <div className="bg-amber-950/40 border border-amber-700/50 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
            <span className="w-10 h-10 rounded-xl bg-amber-700 text-amber-100 font-black text-lg flex items-center justify-center shrink-0 shadow-md">
              🥉
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
                HẠNG BA (HẠNG 3)
              </span>
              {thirdPlace ? (
                <div className="font-black text-white text-xs truncate mt-0.5">
                  {thirdPlace.getDisplayName()}
                </div>
              ) : (
                <span className="text-xs font-medium text-amber-200/60 italic mt-0.5 block">
                  Chờ kết quả Tranh 3-4
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sơ đồ nhánh thi đấu */}
      <div className="bg-[#0c1524] rounded-2xl border border-[#16263f] p-5 sm:p-6 space-y-6 shadow-xl">
        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-cyan-400" />
          Sơ Đồ Nhánh Knockout & Lịch Thi Đấu Vòng Loại
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Cột 1: Bán Kết */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wide border-b border-[#16263f] pb-2 flex items-center justify-between">
              <span>Vòng Bán Kết</span>
              <span className="text-[10px] text-slate-400">2 cặp đấu</span>
            </div>
            {renderMatchCard(sf1, 'Bán Kết 1 (Nhất A vs Nhì B)')}
            {renderMatchCard(sf2, 'Bán Kết 2 (Nhất B vs Nhì A)')}
          </div>

          {/* Cột 2: Chung Kết & Tranh Hạng Ba */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wide border-b border-[#16263f] pb-2 flex items-center justify-between">
              <span>Chung Kết & Tranh Hạng 3</span>
              <span className="text-[10px] text-slate-400">Tranh Huy Chương</span>
            </div>
            {renderMatchCard(finalMatch, 'Chung Kết (Tranh Cúp Vô Địch)')}
            {renderMatchCard(thirdMatch, 'Tranh Hạng Ba (Huy Chương Đồng)')}
          </div>
        </div>
      </div>
    </div>
  );
};
