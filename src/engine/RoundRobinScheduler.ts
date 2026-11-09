import { Team, Match, MatchRule } from '../models';

export interface IScheduleOptions {
  categoryId: string;
  categoryCode?: string; // Mã viết tắt, ví dụ 'DN' cho Đôi nam
  groupId: string;
  groupName: string;
  rule: MatchRule;
  courts?: string[]; // Danh sách sân, ví dụ ['Sân 1', 'Sân 2']
  startTime?: string; // Giờ bắt đầu, ví dụ '08:00'
  matchDurationMinutes?: number; // Thời lượng mỗi trận dự kiến (phút), mặc định 25
  randomize?: boolean; // Xáo trộn ngẫu nhiên thứ tự thi đấu
}

export class RoundRobinScheduler {
  /**
   * Trộn ngẫu nhiên một mảng (Fisher-Yates Shuffle)
   */
  public static shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Tạo lịch thi đấu vòng tròn (Round-Robin) cho danh sách đội trong bảng
   */
  public static generateMatches(
    teams: Team[],
    options: IScheduleOptions
  ): Match[] {
    if (!teams || teams.length < 2) {
      return [];
    }

    // Nếu chọn randomize, ta xáo trộn danh sách đội ban đầu trước khi bốc thăm
    const workingTeams: (Team | null)[] = options.randomize
      ? this.shuffle(teams)
      : [...teams];

    // Nếu số đội lẻ, thêm 1 đội "ảo" (null / Bye) để số lượng chẵn
    const isOdd = workingTeams.length % 2 !== 0;
    if (isOdd) {
      workingTeams.push(null);
    }

    const n = workingTeams.length;
    const roundsCount = n - 1;
    const matchesPerRound = n / 2;

    const roundPairings: Array<{ roundIndex: number; teamA: Team; teamB: Team }> = [];

    // Thuật toán Round-Robin vòng tròn (Circle / Berger Method)
    const rotatingTeams = [...workingTeams];

    for (let round = 0; round < roundsCount; round++) {
      for (let i = 0; i < matchesPerRound; i++) {
        const team1 = rotatingTeams[i];
        const team2 = rotatingTeams[n - 1 - i];

        // Bỏ qua trận đấu với đội ảo (Bye)
        if (team1 !== null && team2 !== null) {
          roundPairings.push({
            roundIndex: round,
            teamA: team1,
            teamB: team2,
          });
        }
      }

      // Xoay vòng: Giữ cố định phần tử đầu tiên (index 0), xoay các phần tử còn lại
      const fixed = rotatingTeams[0];
      const last = rotatingTeams[n - 1];
      for (let k = n - 1; k > 1; k--) {
        rotatingTeams[k] = rotatingTeams[k - 1];
      }
      rotatingTeams[1] = last;
      rotatingTeams[0] = fixed;
    }

    // Nếu randomize toàn bộ, có thể xáo trộn thứ tự các cặp đấu để tạo tính bất ngờ
    let finalPairings = roundPairings;
    if (options.randomize) {
      finalPairings = this.shuffle(roundPairings);
    }

    // Cấu hình sân đấu và giờ đấu
    const courts = options.courts && options.courts.length > 0
      ? options.courts
      : ['Sân 1', 'Sân 2', 'Sân 3', 'Sân 4', 'Sân 5', 'Sân 6'];
    const duration = options.matchDurationMinutes ?? 25;
    const startHour = options.startTime ? parseInt(options.startTime.split(':')[0], 10) : 8;
    const startMinute = options.startTime ? parseInt(options.startTime.split(':')[1], 10) : 0;

    const prefixCode = options.categoryCode || 'VB';
    const groupShort = options.groupName.replace(/\s+/g, '').replace('Bảng', 'B');

    // Tạo các đối tượng Match hoàn chỉnh
    const generatedMatches: Match[] = [];

    finalPairings.forEach((pair, index) => {
      const matchNumber = index + 1;
      const formattedNum = matchNumber.toString().padStart(2, '0');
      const matchCode = `${prefixCode}-${groupShort}-${formattedNum}`;

      // Phân bổ sân quay vòng (Round-robin court allocation)
      const courtIndex = index % courts.length;
      const court = courts[courtIndex];

      // Tính giờ dự kiến (mỗi lượt trên cùng 1 sân thì tăng thêm `duration` phút)
      const slotIndex = Math.floor(index / courts.length);
      const totalMinutesFromStart = slotIndex * duration;
      const matchTotalMinutes = startHour * 60 + startMinute + totalMinutesFromStart;
      const hour = Math.floor(matchTotalMinutes / 60) % 24;
      const min = matchTotalMinutes % 60;
      const scheduledTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

      const match = new Match(
        `match_${options.groupId}_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
        matchCode,
        options.categoryId,
        'GROUP',
        `Vòng bảng - ${options.groupName}`,
        court,
        scheduledTime,
        pair.teamA,
        pair.teamB,
        options.rule,
        [{ teamA: 0, teamB: 0 }],
        'PENDING',
        null,
        options.groupId,
        options.groupName
      );

      generatedMatches.push(match);
    });

    return generatedMatches;
  }
}
