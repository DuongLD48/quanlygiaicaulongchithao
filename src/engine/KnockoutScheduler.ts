import { Team, Match, MatchRule, StageRuleConfig } from '../models';

export interface IKnockoutSlot {
  label: string; // Ví dụ: "Nhất A", "Nhì B"
  team: Team | null;
}

export interface IKnockoutPairing {
  roundName: string; // "Bán kết 1", "Bán kết 2", "Chung kết", "Tranh hạng 3-4"
  matchCode: string; // "BK-01", "CK-01"
  slotA: IKnockoutSlot;
  slotB: IKnockoutSlot;
  court: string;
  scheduledTime: string;
}

export class KnockoutScheduler {
  /**
   * Tạo bộ khung vòng loại trực tiếp 4 đội tiêu chuẩn (2 Bán kết, 1 Chung kết, 1 Tranh 3-4)
   * Phổ biến nhất cho giải có 2 bảng A và B (Nhất A vs Nhì B, Nhất B vs Nhì A)
   */
  public static createStandard4TeamKnockout(
    categoryId: string,
    categoryCode: string = 'ND',
    rulesConfig: StageRuleConfig,
    courts: string[] = ['Sân 1', 'Sân 2', 'Sân 3', 'Sân 4', 'Sân 5', 'Sân 6'],
    sfStartTime: string = '14:00',
    finalStartTime: string = '15:30',
    team1A: Team | null = null,
    team2B: Team | null = null,
    team1B: Team | null = null,
    team2A: Team | null = null,
    groupAName: string = 'Bảng A',
    groupBName: string = 'Bảng B'
  ): Match[] {
    const court1 = courts[0] || 'Sân 1';
    const court2 = courts[1] || court1;

    // Trận Chung kết
    const finalMatch = new Match(
      `match_final_${Date.now()}`,
      `${categoryCode}-CK-01`,
      categoryId,
      'KNOCKOUT',
      'Chung kết',
      court1,
      finalStartTime,
      null, // Sẽ được điền khi có kết quả BK
      null,
      rulesConfig.finals,
      [{ teamA: 0, teamB: 0 }],
      'PENDING',
      null,
      undefined,
      undefined,
      undefined,
      'Thắng Bán Kết 1',
      'Thắng Bán Kết 2'
    );

    // Trận Tranh hạng 3-4
    const thirdPlaceMatch = new Match(
      `match_third_${Date.now()}`,
      `${categoryCode}-TH3-01`,
      categoryId,
      'KNOCKOUT',
      'Tranh hạng 3-4',
      court2,
      finalStartTime,
      null,
      null,
      rulesConfig.thirdPlace,
      [{ teamA: 0, teamB: 0 }],
      'PENDING',
      null,
      undefined,
      undefined,
      undefined,
      'Thua Bán Kết 1',
      'Thua Bán Kết 2'
    );

    // Bán kết 1: Nhất A vs Nhì B
    const sf1Match = new Match(
      `match_sf1_${Date.now()}`,
      `${categoryCode}-BK-01`,
      categoryId,
      'KNOCKOUT',
      `Bán kết 1 (Nhất ${groupAName} - Nhì ${groupBName})`,
      court1,
      sfStartTime,
      team1A,
      team2B,
      rulesConfig.semiFinals,
      [{ teamA: 0, teamB: 0 }],
      'PENDING',
      null,
      undefined,
      undefined,
      finalMatch.id, // Đội thắng vào Chung kết
      `Nhất ${groupAName}`,
      `Nhì ${groupBName}`
    );

    // Bán kết 2: Nhất B vs Nhì A
    const sf2Match = new Match(
      `match_sf2_${Date.now()}`,
      `${categoryCode}-BK-02`,
      categoryId,
      'KNOCKOUT',
      `Bán kết 2 (Nhất ${groupBName} - Nhì ${groupAName})`,
      court2,
      sfStartTime,
      team1B,
      team2A,
      rulesConfig.semiFinals,
      [{ teamA: 0, teamB: 0 }],
      'PENDING',
      null,
      undefined,
      undefined,
      finalMatch.id, // Đội thắng vào Chung kết
      `Nhất ${groupBName}`,
      `Nhì ${groupAName}`
    );

    return [sf1Match, sf2Match, thirdPlaceMatch, finalMatch];
  }

  /**
   * Tự động đẩy đội thắng Bán kết vào Chung kết và đội thua vào Tranh 3-4
   */
  public static propagateWinners(matches: Match[]): void {
    const sf1 = matches.find((m) => m.roundName.includes('Bán kết 1') || m.matchCode.endsWith('BK-01'));
    const sf2 = matches.find((m) => m.roundName.includes('Bán kết 2') || m.matchCode.endsWith('BK-02'));
    const finalMatch = matches.find((m) => m.roundName.includes('Chung kết') && !m.roundName.includes('Bán kết'));
    const thirdMatch = matches.find((m) => m.roundName.includes('Tranh') || m.roundName.includes('hạng 3'));

    if (sf1 && finalMatch && thirdMatch) {
      if (sf1.status === 'FINISHED' && sf1.winnerId) {
        const winner = sf1.getWinner();
        const loser = sf1.winnerId === sf1.teamA?.id ? sf1.teamB : sf1.teamA;
        finalMatch.teamA = winner;
        thirdMatch.teamA = loser;
      }
    }

    if (sf2 && finalMatch && thirdMatch) {
      if (sf2.status === 'FINISHED' && sf2.winnerId) {
        const winner = sf2.getWinner();
        const loser = sf2.winnerId === sf2.teamA?.id ? sf2.teamB : sf2.teamA;
        finalMatch.teamB = winner;
        thirdMatch.teamB = loser;
      }
    }
  }

  /**
   * Tạo một trận đấu loại trực tiếp tự do
   */
  public static createCustomKnockoutMatch(
    categoryId: string,
    roundName: string,
    matchCode: string,
    rule: MatchRule,
    teamA: Team | null,
    teamB: Team | null,
    court: string = 'Sân 1',
    scheduledTime: string = '14:00',
    placeholderA?: string,
    placeholderB?: string
  ): Match {
    return new Match(
      `match_ko_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      matchCode,
      categoryId,
      'KNOCKOUT',
      roundName,
      court,
      scheduledTime,
      teamA,
      teamB,
      rule,
      [{ teamA: 0, teamB: 0 }],
      'PENDING',
      null,
      undefined,
      undefined,
      undefined,
      placeholderA,
      placeholderB
    );
  }
}
