import { Team, type ITeamJSON } from './Team';
import { Match, type IMatchJSON } from './Match';
import { StandingRow } from './StandingRow';
import { StandingsCalculator } from '../engine/StandingsCalculator';

export interface IGroupJSON {
  id: string;
  name: string;
  teams: ITeamJSON[];
  matches?: IMatchJSON[];
}

export class Group {
  public id: string;
  public name: string;
  public teams: Team[];
  public matches: Match[];

  constructor(id: string, name: string, teams: Team[] = [], matches: Match[] = []) {
    this.id = id || `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.name = name.trim();
    this.teams = teams;
    this.matches = matches;
  }

  public addTeam(team: Team): void {
    if (!this.teams.some((t) => t.id === team.id)) {
      this.teams.push(team);
    }
  }

  public removeTeam(teamId: string): void {
    this.teams = this.teams.filter((t) => t.id !== teamId);
    this.matches = this.matches.filter(
      (m) => m.teamA?.id !== teamId && m.teamB?.id !== teamId
    );
  }

  public findTeam(teamId: string): Team | undefined {
    return this.teams.find((t) => t.id === teamId);
  }

  /**
   * Tính toán Bảng xếp hạng bảng đấu theo tiêu chuẩn BWF
   */
  public calculateStandings(): StandingRow[] {
    return StandingsCalculator.calculate(this.teams, this.matches);
  }

  public toJSON(): IGroupJSON {
    return {
      id: this.id,
      name: this.name,
      teams: this.teams.map((t) => t.toJSON()),
      matches: this.matches.map((m) => m.toJSON()),
    };
  }

  public static fromJSON(json: IGroupJSON): Group {
    const teams = (json.teams || []).map((t) => Team.fromJSON(t));
    const matches = (json.matches || []).map((m) => Match.fromJSON(m));
    return new Group(json.id, json.name, teams, matches);
  }
}
