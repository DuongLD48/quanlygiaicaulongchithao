import { Team, type ITeamJSON } from './Team';
import { MatchRule, type IMatchRuleJSON, type ISetScore } from './MatchRule';

export type MatchStatus = 'PENDING' | 'PLAYING' | 'FINISHED';
export type StageType = 'GROUP' | 'KNOCKOUT';

export interface IMatchJSON {
  id: string;
  matchCode: string;
  categoryId: string;
  stageType: StageType;
  roundName: string;
  court: string;
  scheduledTime: string;
  teamA?: ITeamJSON | null;
  teamB?: ITeamJSON | null;
  rule: IMatchRuleJSON;
  scores: ISetScore[];
  status: MatchStatus;
  winnerId?: string | null;
  groupId?: string;
  groupName?: string;
  nextMatchId?: string; // ID của trận tiếp theo trong nhánh knockout
}

export class Match {
  public id: string;
  public matchCode: string;
  public categoryId: string;
  public stageType: StageType;
  public roundName: string;
  public court: string;
  public scheduledTime: string;
  public teamA: Team | null;
  public teamB: Team | null;
  public rule: MatchRule;
  public scores: ISetScore[];
  public status: MatchStatus;
  public winnerId: string | null;
  public groupId?: string;
  public groupName?: string;
  public nextMatchId?: string;

  constructor(
    id: string,
    matchCode: string,
    categoryId: string,
    stageType: StageType,
    roundName: string,
    court: string = '',
    scheduledTime: string = '',
    teamA: Team | null = null,
    teamB: Team | null = null,
    rule: MatchRule = new MatchRule(),
    scores: ISetScore[] = [],
    status: MatchStatus = 'PENDING',
    winnerId: string | null = null,
    groupId?: string,
    groupName?: string,
    nextMatchId?: string
  ) {
    this.id = id || `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.matchCode = matchCode;
    this.categoryId = categoryId;
    this.stageType = stageType;
    this.roundName = roundName;
    this.court = court;
    this.scheduledTime = scheduledTime;
    this.teamA = teamA;
    this.teamB = teamB;
    this.rule = rule;
    this.scores = scores.length > 0 ? scores : [{ teamA: 0, teamB: 0 }];
    this.status = status;
    this.winnerId = winnerId;
    this.groupId = groupId;
    this.groupName = groupName;
    this.nextMatchId = nextMatchId;
  }

  /**
   * Cập nhật điểm cho set đấu và tự động kiểm tra thắng/thua
   */
  public updateScore(setIndex: number, scoreA: number, scoreB: number): void {
    while (this.scores.length <= setIndex) {
      this.scores.push({ teamA: 0, teamB: 0 });
    }
    this.scores[setIndex] = {
      teamA: Math.max(0, scoreA),
      teamB: Math.max(0, scoreB),
    };

    this.recalculateStatus();
  }

  /**
   * Tính lại trạng thái và đội thắng
   */
  public recalculateStatus(): void {
    const evaluation = this.rule.evaluateMatch(this.scores);
    if (evaluation.finished) {
      this.status = 'FINISHED';
      if (evaluation.winner === 'A') {
        this.winnerId = this.teamA ? this.teamA.id : null;
      } else if (evaluation.winner === 'B') {
        this.winnerId = this.teamB ? this.teamB.id : null;
      }
    } else {
      const anyPointsScored = this.scores.some((s) => s.teamA > 0 || s.teamB > 0);
      this.status = anyPointsScored ? 'PLAYING' : 'PENDING';
      this.winnerId = null;
    }
  }

  /**
   * Đổi chỗ 2 đội thi đấu
   */
  public swapTeams(): void {
    const temp = this.teamA;
    this.teamA = this.teamB;
    this.teamB = temp;
    this.scores = this.scores.map((s) => ({ teamA: s.teamB, teamB: s.teamA }));
    this.recalculateStatus();
  }

  /**
   * Kiểm tra xem đội nào là đội thắng
   */
  public getWinner(): Team | null {
    if (!this.winnerId) return null;
    if (this.teamA && this.teamA.id === this.winnerId) return this.teamA;
    if (this.teamB && this.teamB.id === this.winnerId) return this.teamB;
    return null;
  }

  public toJSON(): IMatchJSON {
    return {
      id: this.id,
      matchCode: this.matchCode,
      categoryId: this.categoryId,
      stageType: this.stageType,
      roundName: this.roundName,
      court: this.court,
      scheduledTime: this.scheduledTime,
      teamA: this.teamA ? this.teamA.toJSON() : null,
      teamB: this.teamB ? this.teamB.toJSON() : null,
      rule: this.rule.toJSON(),
      scores: this.scores,
      status: this.status,
      winnerId: this.winnerId,
      groupId: this.groupId,
      groupName: this.groupName,
      nextMatchId: this.nextMatchId,
    };
  }

  public static fromJSON(json: IMatchJSON): Match {
    const teamA = json.teamA ? Team.fromJSON(json.teamA) : null;
    const teamB = json.teamB ? Team.fromJSON(json.teamB) : null;
    const rule = MatchRule.fromJSON(json.rule);

    return new Match(
      json.id,
      json.matchCode,
      json.categoryId,
      json.stageType,
      json.roundName,
      json.court || '',
      json.scheduledTime || '',
      teamA,
      teamB,
      rule,
      json.scores || [],
      json.status || 'PENDING',
      json.winnerId ?? null,
      json.groupId,
      json.groupName,
      json.nextMatchId
    );
  }
}
