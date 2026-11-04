import { MatchRule, type IMatchRuleJSON } from './MatchRule';

export type StageRoundType =
  | 'GROUP'
  | 'ROUND_OF_16'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'FINALS'
  | 'THIRD_PLACE'
  | 'CUSTOM';

export interface IStageRuleConfigJSON {
  groupStage: IMatchRuleJSON;
  roundOf16: IMatchRuleJSON;
  quarterFinals: IMatchRuleJSON;
  semiFinals: IMatchRuleJSON;
  finals: IMatchRuleJSON;
  thirdPlace: IMatchRuleJSON;
}

export class StageRuleConfig {
  public groupStage: MatchRule;
  public roundOf16: MatchRule;
  public quarterFinals: MatchRule;
  public semiFinals: MatchRule;
  public finals: MatchRule;
  public thirdPlace: MatchRule;

  constructor(
    groupStage: MatchRule = MatchRule.standard31OneSet(),
    roundOf16: MatchRule = MatchRule.standard31OneSet(),
    quarterFinals: MatchRule = MatchRule.standard21ThreeSets(),
    semiFinals: MatchRule = MatchRule.standard21ThreeSets(),
    finals: MatchRule = MatchRule.standard21ThreeSets(),
    thirdPlace: MatchRule = MatchRule.standard21ThreeSets()
  ) {
    this.groupStage = groupStage;
    this.roundOf16 = roundOf16;
    this.quarterFinals = quarterFinals;
    this.semiFinals = semiFinals;
    this.finals = finals;
    this.thirdPlace = thirdPlace;
  }

  public getRuleForStage(stageOrRound: string): MatchRule {
    const normalized = stageOrRound.toUpperCase();
    if (normalized.includes('GROUP') || normalized.includes('BẢNG')) {
      return this.groupStage;
    }
    if (normalized.includes('16') || normalized.includes('VÒNG LOẠI')) {
      return this.roundOf16;
    }
    if (normalized.includes('QUARTER') || normalized.includes('TỨ KẾT')) {
      return this.quarterFinals;
    }
    if (normalized.includes('SEMI') || normalized.includes('BÁN KẾT')) {
      return this.semiFinals;
    }
    if (normalized.includes('THIRD') || normalized.includes('TRANH 3') || normalized.includes('HẠNG 3')) {
      return this.thirdPlace;
    }
    if (normalized.includes('FINAL') || normalized.includes('CHUNG KẾT')) {
      return this.finals;
    }
    return this.groupStage;
  }

  public toJSON(): IStageRuleConfigJSON {
    return {
      groupStage: this.groupStage.toJSON(),
      roundOf16: this.roundOf16.toJSON(),
      quarterFinals: this.quarterFinals.toJSON(),
      semiFinals: this.semiFinals.toJSON(),
      finals: this.finals.toJSON(),
      thirdPlace: this.thirdPlace.toJSON(),
    };
  }

  public static fromJSON(json?: Partial<IStageRuleConfigJSON>): StageRuleConfig {
    if (!json) return new StageRuleConfig();
    return new StageRuleConfig(
      MatchRule.fromJSON(json.groupStage),
      MatchRule.fromJSON(json.roundOf16),
      MatchRule.fromJSON(json.quarterFinals),
      MatchRule.fromJSON(json.semiFinals),
      MatchRule.fromJSON(json.finals),
      MatchRule.fromJSON(json.thirdPlace)
    );
  }
}
