import { Team } from './Team';

export interface IStandingRowJSON {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  pointsWon: number;
  pointsLost: number;
  pointsDiff: number;
  rank: number;
}

export class StandingRow {
  public team: Team;
  public played: number = 0;
  public won: number = 0;
  public lost: number = 0;
  public setsWon: number = 0;
  public setsLost: number = 0;
  public pointsWon: number = 0;
  public pointsLost: number = 0;
  public rank: number = 0;

  constructor(team: Team) {
    this.team = team;
  }

  public get setsDiff(): number {
    return this.setsWon - this.setsLost;
  }

  public get pointsDiff(): number {
    return this.pointsWon - this.pointsLost;
  }

  public toJSON(): IStandingRowJSON {
    return {
      teamId: this.team.id,
      teamName: this.team.getDisplayName(),
      played: this.played,
      won: this.won,
      lost: this.lost,
      setsWon: this.setsWon,
      setsLost: this.setsLost,
      setsDiff: this.setsDiff,
      pointsWon: this.pointsWon,
      pointsLost: this.pointsLost,
      pointsDiff: this.pointsDiff,
      rank: this.rank,
    };
  }
}
