import React from 'react';
import { Category } from '../../models';
import { Trophy, Medal, Award, Users } from 'lucide-react';

interface Props {
  category: Category;
  searchQuery?: string;
}

export const StandingsView: React.FC<Props> = ({ category, searchQuery = '' }) => {
  const query = searchQuery.toLowerCase().trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Bảng Xếp Hạng Vòng Bảng ({category.name})
          </h3>
          <p className="text-xs text-slate-500">
            Tính điểm chuẩn BWF: Số trận thắng &gt; Hiệu số Set &gt; Hiệu số Điểm &gt; Đối đầu trực tiếp
          </p>
        </div>
      </div>

      {category.groups.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200">
          Chưa có bảng đấu nào trong nội dung này.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {category.groups.map((group) => {
            const standings = group.calculateStandings();

            // Lọc theo từ khóa tìm kiếm nếu có
            const filteredRows = query
              ? standings.filter(
                  (row) =>
                    row.team.name.toLowerCase().includes(query) ||
                    row.team.players.some((p) => p.fullName.toLowerCase().includes(query)) ||
                    group.name.toLowerCase().includes(query)
                )
              : standings;

            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col"
              >
                {/* Header Bảng */}
                <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <h4 className="font-bold text-slate-800 text-sm">{group.name}</h4>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {group.teams.length} đội tham gia
                  </span>
                </div>

                {/* Table BXH */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3 text-center w-12">Hạng</th>
                        <th className="py-2.5 px-3">Đội / VĐV</th>
                        <th className="py-2.5 px-2 text-center" title="Số trận đã đấu">Trận</th>
                        <th className="py-2.5 px-2 text-center" title="Thắng / Thua">T / B</th>
                        <th className="py-2.5 px-2 text-center" title="Hiệu số Set">HS Set</th>
                        <th className="py-2.5 px-3 text-right" title="Hiệu số Điểm">HS Điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            {group.teams.length === 0
                              ? 'Chưa có đội nào trong bảng này.'
                              : 'Không tìm thấy đội phù hợp từ khóa.'}
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row) => {
                          const isTop2 = row.rank <= 2 && row.played > 0;
                          return (
                            <tr
                              key={row.team.id}
                              className={`hover:bg-slate-50/80 transition ${
                                row.rank === 1 && row.played > 0
                                  ? 'bg-amber-50/30'
                                  : isTop2
                                  ? 'bg-indigo-50/20'
                                  : ''
                              }`}
                            >
                              {/* Hạng */}
                              <td className="py-3 px-3 text-center font-bold">
                                {row.rank === 1 && row.played > 0 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[11px] shadow-sm">
                                    1
                                  </span>
                                ) : row.rank === 2 && row.played > 0 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-bold text-[11px]">
                                    2
                                  </span>
                                ) : (
                                  <span className="text-slate-500">{row.rank}</span>
                                )}
                              </td>

                              {/* Tên Đội & VĐV */}
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-800 text-xs sm:text-sm">
                                  {row.team.name}
                                  {isTop2 && (
                                    <span className="ml-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                      Vào vòng trong
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Users className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">
                                    {row.team.players.map((p) => p.fullName).join(' • ')}
                                  </span>
                                </div>
                              </td>

                              {/* Số trận */}
                              <td className="py-3 px-2 text-center font-semibold text-slate-600">
                                {row.played}
                              </td>

                              {/* Thắng / Thua */}
                              <td className="py-3 px-2 text-center font-semibold">
                                <span className="text-emerald-600 font-bold">{row.won}</span>
                                <span className="text-slate-300 mx-0.5">/</span>
                                <span className="text-rose-500 font-bold">{row.lost}</span>
                              </td>

                              {/* Hiệu số Set */}
                              <td className="py-3 px-2 text-center font-mono font-medium text-slate-600">
                                {row.setsDiff > 0 ? `+${row.setsDiff}` : row.setsDiff}
                              </td>

                              {/* Hiệu số Điểm */}
                              <td className="py-3 px-3 text-right font-mono font-bold">
                                <span
                                  className={
                                    row.pointsDiff > 0
                                      ? 'text-emerald-600'
                                      : row.pointsDiff < 0
                                      ? 'text-rose-600'
                                      : 'text-slate-600'
                                  }
                                >
                                  {row.pointsDiff > 0 ? `+${row.pointsDiff}` : row.pointsDiff}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Chú Thích */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Medal className="w-3.5 h-3.5 text-amber-500" /> Nhất bảng
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-indigo-500" /> Nhì bảng
                    </span>
                  </div>
                  <span>Top 2 đội mỗi bảng sẽ giành vé vào Bán Kết</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
