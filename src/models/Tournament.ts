import { Category, type ICategoryJSON } from './Category';
import { Group } from './Group';
import { MatchRule } from './MatchRule';
import { StageRuleConfig } from './StageRuleConfig';

export interface ITournamentContentConfig {
  websiteTitle?: string;
  tournamentName?: string;
  tournamentSubtitle?: string;
  footerText?: string;
  rulesTitle?: string;
  rulesGroupStage?: string;
  rulesKnockoutStage?: string;
  rulesPointRules?: string;
  rulesReferees?: string;
  rulesTieBreak1?: string;
  rulesTieBreak2?: string;
  rulesTieBreak3?: string;
  rulesTieBreak4?: string;
  rulesAdvancement?: string;
}

export const DEFAULT_CONTENT_CONFIG: ITournamentContentConfig = {
  websiteTitle: 'Quản Lý Giải Cầu Lông - CLB Cầu Lông Chí Thảo',
  tournamentName: 'Giải Cầu Lông CLB Chí Thảo 2026',
  tournamentSubtitle: 'Tiêu chuẩn thi đấu và xếp hạng thời gian thực',
  footerText: 'Giải Cầu Lông CLB Chí Thảo 2026 • CLB Cầu Lông Chí Thảo',
  rulesTitle: 'Điều Lệ & Quy Tắc Tính Điểm Giải Đấu',
  rulesGroupStage: 'Thi đấu vòng tròn tính điểm. Tất cả các trận Vòng Bảng thi đấu 1 set chạm 21 hoặc 31 điểm (tùy thể thức cài đặt), đổi sân khi một đội đạt mốc nửa set (11 hoặc 16 điểm).',
  rulesKnockoutStage: 'Bán kết & Chung kết thi đấu loại trực tiếp. Đội thắng giành quyền đi tiếp vào Chung kết, đội thua vào tranh Hạng Ba.',
  rulesPointRules: 'Đội đạt đến mốc điểm quy định trước sẽ giành chiến thắng trong trận đấu (áp dụng deuce cách biệt 2 điểm nếu được cấu hình).',
  rulesReferees: 'Các trận đấu được điều phối tự động phân bổ theo sân và thời gian hiển thị trên hệ thống.',
  rulesTieBreak1: 'Xếp hạng ưu tiên theo tổng số trận thắng nhiều nhất (Thắng: +1 điểm, Thua: 0 điểm).',
  rulesTieBreak2: 'Tổng số điểm quả ghi được trừ đi tổng số điểm quả bị mất (+/-).',
  rulesTieBreak3: 'Tổng số điểm quả đội đã ghi được trong tất cả các trận vòng bảng.',
  rulesTieBreak4: 'Nếu vẫn bằng nhau, xét kết quả trận đối đầu trực tiếp giữa hai đội.',
  rulesAdvancement: 'Top 1 (Nhất bảng) và Top 2 (Nhì bảng) của mỗi bảng đấu sẽ giành quyền vào thi đấu Vòng Loại Trực Tiếp (Bán kết chéo bảng).',
};

export interface ITournamentJSON {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  courts: string[];
  adminPinHash: string;
  categories: ICategoryJSON[];
  contentConfig?: ITournamentContentConfig;
}

export class Tournament {
  public id: string;
  public name: string;
  public location: string;
  public startDate: string;
  public endDate: string;
  public courts: string[];
  public adminPinHash: string;
  public categories: Category[];
  public contentConfig: ITournamentContentConfig;

  constructor(
    id: string,
    name: string,
    location: string = 'Nhà Thi Đấu',
    startDate: string = '',
    endDate: string = '',
    courts: string[] = ['Sân 1', 'Sân 2', 'Sân 3', 'Sân 4', 'Sân 5', 'Sân 6'],
    adminPinHash: string = '',
    categories: Category[] = [],
    contentConfig: ITournamentContentConfig = { ...DEFAULT_CONTENT_CONFIG }
  ) {
    this.id = id || `tourney_${Date.now()}`;
    this.name = name.trim();
    this.location = location.trim();
    this.startDate = startDate;
    this.endDate = endDate;
    this.courts =
      courts.length > 0
        ? courts
        : ['Sân 1', 'Sân 2', 'Sân 3', 'Sân 4', 'Sân 5', 'Sân 6'];
    // Mã PIN mặc định là 123456 (hash SHA-256) nếu chưa được đặt
    this.adminPinHash =
      adminPinHash ||
      '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'; // sha256("123456")
    this.categories = categories;
    this.contentConfig = { ...DEFAULT_CONTENT_CONFIG, ...contentConfig };
  }

  public addCategory(category: Category): void {
    if (!this.categories.some((c) => c.id === category.id)) {
      this.categories.push(category);
    }
  }

  public removeCategory(categoryId: string): void {
    this.categories = this.categories.filter((c) => c.id !== categoryId);
  }

  public getCategory(categoryId: string): Category | undefined {
    return this.categories.find((c) => c.id === categoryId);
  }

  /**
   * Tính mã băm SHA-256 cho mã PIN sử dụng Web Crypto API
   */
  public static async hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Xác thực mã PIN của Quản trị viên
   */
  public async verifyAdminPin(pin: string): Promise<boolean> {
    if (!pin) return false;
    const inputHash = await Tournament.hashPin(pin);
    return inputHash === this.adminPinHash;
  }

  /**
   * Đổi mã PIN quản trị viên mới
   */
  public async setAdminPin(newPin: string): Promise<void> {
    this.adminPinHash = await Tournament.hashPin(newPin);
  }

  public toJSON(): ITournamentJSON {
    return {
      id: this.id,
      name: this.name,
      location: this.location,
      startDate: this.startDate,
      endDate: this.endDate,
      courts: this.courts,
      adminPinHash: this.adminPinHash,
      categories: this.categories.map((c) => c.toJSON()),
      contentConfig: this.contentConfig,
    };
  }

  public static fromJSON(json: ITournamentJSON): Tournament {
    const categories = (json.categories || []).map((c) => Category.fromJSON(c));
    const defaultCourts = ['Sân 1', 'Sân 2', 'Sân 3', 'Sân 4', 'Sân 5', 'Sân 6'];
    const courtsList = Array.from(new Set([...(json.courts || []), ...defaultCourts]));

    return new Tournament(
      json.id,
      json.name,
      json.location,
      json.startDate,
      json.endDate,
      courtsList,
      json.adminPinHash,
      categories,
      json.contentConfig ? { ...DEFAULT_CONTENT_CONFIG, ...json.contentConfig } : { ...DEFAULT_CONTENT_CONFIG }
    );
  }

  /**
   * Khởi tạo giải đấu mẫu ban đầu với 3 nội dung theo yêu cầu:
   * 1. Đôi nam (có sẵn 2 bảng: Bảng A, Bảng B)
   * 2. Đôi nam nữ
   * 3. Đôi nữ
   */
  public static createDefaultTournament(name: string = 'Giải Cầu Lông Mở Rộng 2026'): Tournament {
    const tourney = new Tournament(
      'tourney_badminton_main',
      name,
      'CLB Cầu Lông Chí Thảo',
      new Date().toISOString().split('T')[0],
      new Date().toISOString().split('T')[0],
      ['Sân 1', 'Sân 2', 'Sân 3', 'Sân 4', 'Sân 5', 'Sân 6']
    );

    // 1. Đôi nam (2 bảng: Bảng A, Bảng B)
    const catMenDoubles = new Category(
      'cat_men_doubles',
      'Đôi nam',
      'MEN_DOUBLES',
      new StageRuleConfig(
        MatchRule.standard31OneSet(), // Vòng bảng: 1 set 31đ
        MatchRule.standard31OneSet(),
        MatchRule.standard21ThreeSets(), // Tứ kết: 3 set 21đ
        MatchRule.standard21ThreeSets(), // Bán kết: 3 set 21đ
        MatchRule.standard21ThreeSets(), // Chung kết: 3 set 21đ
        MatchRule.standard21ThreeSets() // Tranh 3-4: 3 set 21đ
      ),
      [
        new Group('grp_men_a', 'Bảng A'),
        new Group('grp_men_b', 'Bảng B'),
      ]
    );

    // 2. Đôi nam nữ
    const catMixedDoubles = new Category(
      'cat_mixed_doubles',
      'Đôi nam nữ',
      'MIXED_DOUBLES',
      new StageRuleConfig(
        MatchRule.standard31OneSet(),
        MatchRule.standard31OneSet(),
        MatchRule.standard21ThreeSets(),
        MatchRule.standard21ThreeSets(),
        MatchRule.standard21ThreeSets(),
        MatchRule.standard21ThreeSets()
      ),
      [
        new Group('grp_mixed_a', 'Bảng A'),
        new Group('grp_mixed_b', 'Bảng B'),
      ]
    );

    // 3. Đôi nữ
    const catWomenDoubles = new Category(
      'cat_women_doubles',
      'Đôi nữ',
      'WOMEN_DOUBLES',
      new StageRuleConfig(
        MatchRule.standard31OneSet(),
        MatchRule.standard31OneSet(),
        MatchRule.standard21ThreeSets(),
        MatchRule.standard21ThreeSets(),
        MatchRule.standard21ThreeSets(),
        MatchRule.standard21ThreeSets()
      ),
      [
        new Group('grp_women_a', 'Bảng A'),
        new Group('grp_women_b', 'Bảng B'),
      ]
    );

    tourney.addCategory(catMenDoubles);
    tourney.addCategory(catMixedDoubles);
    tourney.addCategory(catWomenDoubles);

    return tourney;
  }
}
