export interface ISetScore {
  teamA: number;
  teamB: number;
}

export interface IMatchRuleJSON {
  setsCount: number; // 1 hoặc 3
  pointsPerSet: number; // Ví dụ 21, 31, 15
  maxPoints: number; // Điểm chạm tối đa (VD: 30 khi có deuce, hoặc 31)
  deuceEnabled: boolean; // Có áp dụng cách biệt 2 điểm hay không
}

export class MatchRule {
  public setsCount: number;
  public pointsPerSet: number;
  public maxPoints: number;
  public deuceEnabled: boolean;

  constructor(
    setsCount: number = 1,
    pointsPerSet: number = 31,
    maxPoints: number = 31,
    deuceEnabled: boolean = false
  ) {
    this.setsCount = setsCount === 3 ? 3 : 1;
    this.pointsPerSet = pointsPerSet > 0 ? pointsPerSet : 31;
    this.maxPoints = maxPoints >= this.pointsPerSet ? maxPoints : this.pointsPerSet;
    this.deuceEnabled = deuceEnabled;
  }

  /**
   * Kiểm tra set đấu đã kết thúc hay chưa
   */
  public isSetFinished(scoreA: number, scoreB: number): boolean {
    if (scoreA < 0 || scoreB < 0) return false;

    // Chạm mốc điểm tối đa (ví dụ chạm 30 điểm thì dừng ngay)
    if (scoreA >= this.maxPoints || scoreB >= this.maxPoints) {
      return scoreA !== scoreB;
    }

    // Chưa đạt điểm set tối thiểu
    if (scoreA < this.pointsPerSet && scoreB < this.pointsPerSet) {
      return false;
    }

    if (this.deuceEnabled) {
      // Luật deuce: Phải cách nhau tối thiểu 2 điểm
      return Math.abs(scoreA - scoreB) >= 2;
    } else {
      // Không deuce: Ai chạm điểm trước là thắng
      return scoreA >= this.pointsPerSet || scoreB >= this.pointsPerSet;
    }
  }

  /**
   * Lấy đội thắng trong 1 set
   */
  public getSetWinner(scoreA: number, scoreB: number): 'A' | 'B' | null {
    if (!this.isSetFinished(scoreA, scoreB)) return null;
    return scoreA > scoreB ? 'A' : 'B';
  }

  /**
   * Tính toán kết quả toàn bộ trận đấu từ danh sách set đấu
   */
  public evaluateMatch(scores: ISetScore[]): {
    finished: boolean;
    winner: 'A' | 'B' | null;
    setsWonA: number;
    setsWonB: number;
  } {
    let setsWonA = 0;
    let setsWonB = 0;
    const requiredWins = this.setsCount === 3 ? 2 : 1;

    for (const set of scores) {
      const winner = this.getSetWinner(set.teamA, set.teamB);
      if (winner === 'A') setsWonA++;
      if (winner === 'B') setsWonB++;

      if (setsWonA >= requiredWins) {
        return { finished: true, winner: 'A', setsWonA, setsWonB };
      }
      if (setsWonB >= requiredWins) {
        return { finished: true, winner: 'B', setsWonA, setsWonB };
      }
    }

    return { finished: false, winner: null, setsWonA, setsWonB };
  }

  public toJSON(): IMatchRuleJSON {
    return {
      setsCount: this.setsCount,
      pointsPerSet: this.pointsPerSet,
      maxPoints: this.maxPoints,
      deuceEnabled: this.deuceEnabled,
    };
  }

  public static fromJSON(json?: Partial<IMatchRuleJSON>): MatchRule {
    if (!json) return new MatchRule();
    return new MatchRule(
      json.setsCount ?? 1,
      json.pointsPerSet ?? 31,
      json.maxPoints ?? 31,
      json.deuceEnabled ?? false
    );
  }

  // Pre-configured templates
  public static standard31OneSet(): MatchRule {
    return new MatchRule(1, 31, 31, false);
  }

  public static standard21ThreeSets(): MatchRule {
    return new MatchRule(3, 21, 30, true);
  }

  public static standard15ThreeSets(): MatchRule {
    return new MatchRule(3, 15, 21, true);
  }
}
