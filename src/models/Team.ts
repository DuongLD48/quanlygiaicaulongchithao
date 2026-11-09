import { Player, type IPlayerJSON } from './Player';

export interface ITeamJSON {
  id: string;
  name: string;
  players: IPlayerJSON[];
  seed?: number;
}

export class Team {
  public id: string;
  public name: string;
  public players: Player[];
  public seed?: number;

  constructor(id: string, name: string, players: Player[] = [], seed?: number) {
    this.id = id || `team_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.name = name.trim();
    this.players = players;
    this.seed = seed;
  }

  public getDisplayName(): string {
    if (this.name) return this.name;
    if (this.players.length > 0) {
      return this.players.map((p) => p.fullName).join(' / ');
    }
    return 'Chưa xác định';
  }

  public getFullSelectLabel(): string {
    const athletes =
      this.players && this.players.length > 0
        ? this.players.map((p) => p.fullName).filter(Boolean).join(' / ')
        : '';
    return athletes ? `${this.name} (${athletes})` : this.name;
  }

  public addPlayer(player: Player): void {
    this.players.push(player);
    if (!this.name) {
      this.name = this.getDisplayName();
    }
  }

  public removePlayer(playerId: string): void {
    this.players = this.players.filter((p) => p.id !== playerId);
  }

  public toJSON(): ITeamJSON {
    const json: ITeamJSON = {
      id: this.id,
      name: this.name,
      players: this.players.map((p) => p.toJSON()),
    };
    if (this.seed !== undefined && this.seed !== null) {
      json.seed = this.seed;
    }
    return json;
  }

  public static fromJSON(json: ITeamJSON): Team {
    const players = (json.players || []).map((p) => Player.fromJSON(p));
    return new Team(json.id, json.name || '', players, json.seed);
  }
}
