import { Team, Match, StandingRow } from '../models';

export class StandingsCalculator {
  /**
   * Tính toán bảng xếp hạng dựa trên danh sách đội và các trận đã đấu
   */
  public static calculate(teams: Team[], matches: Match[]): StandingRow[] {
    const standingsMap = new Map<string, StandingRow>();

    for (const team of teams) {
      standingsMap.set(team.id, new StandingRow(team));
    }

    for (const match of matches) {
      if (match.status !== 'FINISHED' || !match.teamA || !match.teamB) {
        continue;
      }

      const rowA = standingsMap.get(match.teamA.id);
      const rowB = standingsMap.get(match.teamB.id);
      if (!rowA || !rowB) continue;

      rowA.played += 1;
      rowB.played += 1;

      let setsWonA = 0;
      let setsWonB = 0;

      for (const set of match.scores) {
        rowA.pointsWon += set.teamA;
        rowA.pointsLost += set.teamB;
        rowB.pointsWon += set.teamB;
        rowB.pointsLost += set.teamA;

        const setWinner = match.rule.getSetWinner(set.teamA, set.teamB);
        if (setWinner === 'A') setsWonA++;
        if (setWinner === 'B') setsWonB++;
      }

      rowA.setsWon += setsWonA;
      rowA.setsLost += setsWonB;
      rowB.setsWon += setsWonB;
      rowB.setsLost += setsWonA;

      if (match.winnerId === match.teamA.id) {
        rowA.won += 1;
        rowB.lost += 1;
      } else if (match.winnerId === match.teamB.id) {
        rowB.won += 1;
        rowA.lost += 1;
      }
    }

    const rows = Array.from(standingsMap.values());

    // Sắp xếp thứ hạng theo tiêu chuẩn BWF:
    rows.sort((a, b) => {
      // 1. Số trận thắng
      if (b.won !== a.won) return b.won - a.won;

      // 2. Hiệu số Set
      if (b.setsDiff !== a.setsDiff) return b.setsDiff - a.setsDiff;

      // 3. Hiệu số Điểm
      if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;

      // 4. Đối đầu trực tiếp (Head-to-head)
      const headToHeadMatch = matches.find(
        (m) =>
          m.status === 'FINISHED' &&
          ((m.teamA?.id === a.team.id && m.teamB?.id === b.team.id) ||
            (m.teamA?.id === b.team.id && m.teamB?.id === a.team.id))
      );
      if (headToHeadMatch && headToHeadMatch.winnerId) {
        return headToHeadMatch.winnerId === a.team.id ? -1 : 1;
      }

      return 0;
    });

    // Gán hạng rank
    rows.forEach((row, index) => {
      row.rank = index + 1;
    });

    return rows;
  }
}
