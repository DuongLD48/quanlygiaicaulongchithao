import { Group, type IGroupJSON } from './Group';
import { Match, type IMatchJSON } from './Match';
import { StageRuleConfig, type IStageRuleConfigJSON } from './StageRuleConfig';
import { Team } from './Team';

export type CategoryType =
  | 'MEN_DOUBLES'
  | 'WOMEN_DOUBLES'
  | 'MIXED_DOUBLES'
  | 'MEN_SINGLES'
  | 'WOMEN_SINGLES'
  | 'CUSTOM';

export interface ICategoryJSON {
  id: string;
  name: string;
  type: CategoryType;
  rulesConfig: IStageRuleConfigJSON;
  groups: IGroupJSON[];
  knockoutMatches?: IMatchJSON[];
}

export class Category {
  public id: string;
  public name: string;
  public type: CategoryType;
  public rulesConfig: StageRuleConfig;
  public groups: Group[];
  public knockoutMatches: Match[];

  constructor(
    id: string,
    name: string,
    type: CategoryType = 'CUSTOM',
    rulesConfig: StageRuleConfig = new StageRuleConfig(),
    groups: Group[] = [],
    knockoutMatches: Match[] = []
  ) {
    this.id = id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.name = name.trim();
    this.type = type;
    this.rulesConfig = rulesConfig;
    this.groups = groups;
    this.knockoutMatches = knockoutMatches;
  }

  public addGroup(group: Group): void {
    if (!this.groups.some((g) => g.id === group.id)) {
      this.groups.push(group);
    }
  }

  public removeGroup(groupId: string): void {
    this.groups = this.groups.filter((g) => g.id !== groupId);
  }

  public getGroup(groupId: string): Group | undefined {
    return this.groups.find((g) => g.id === groupId);
  }

  public getAllTeams(): Team[] {
    const map = new Map<string, Team>();
    for (const group of this.groups) {
      for (const team of group.teams) {
        map.set(team.id, team);
      }
    }
    return Array.from(map.values());
  }

  public getAllMatches(): Match[] {
    const list: Match[] = [];
    for (const g of this.groups) {
      list.push(...g.matches);
    }
    list.push(...this.knockoutMatches);
    return list;
  }

  public toJSON(): ICategoryJSON {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      rulesConfig: this.rulesConfig.toJSON(),
      groups: this.groups.map((g) => g.toJSON()),
      knockoutMatches: this.knockoutMatches.map((m) => m.toJSON()),
    };
  }

  public static fromJSON(json: ICategoryJSON): Category {
    const rulesConfig = StageRuleConfig.fromJSON(json.rulesConfig);
    const groups = (json.groups || []).map((g) => Group.fromJSON(g));
    const knockoutMatches = (json.knockoutMatches || []).map((m) => Match.fromJSON(m));

    return new Category(
      json.id,
      json.name,
      json.type || 'CUSTOM',
      rulesConfig,
      groups,
      knockoutMatches
    );
  }
}
