import { Team, Player, MatchRule, StageRuleConfig } from './models';
import { RoundRobinScheduler, StandingsCalculator, KnockoutScheduler } from './engine';

async function runPhase2Tests() {
  console.log('=== TEST 1: RoundRobinScheduler Fixtures Generation ===');
  const team1 = new Team('t1', 'Đội A1');
  const team2 = new Team('t2', 'Đội A2');
  const team3 = new Team('t3', 'Đội A3');
  const team4 = new Team('t4', 'Đội A4');

  const rule31 = MatchRule.standard31OneSet();

  const matches = RoundRobinScheduler.generateMatches([team1, team2, team3, team4], {
    categoryId: 'cat_men_doubles',
    categoryCode: 'DN',
    groupId: 'grp_a',
    groupName: 'Bảng A',
    rule: rule31,
    courts: ['Sân 1', 'Sân 2'],
    startTime: '08:00',
    matchDurationMinutes: 25,
    randomize: false,
  });

  console.log(`Số trận được tạo cho bảng 4 đội: ${matches.length} (Kỳ vọng: 6)`);
  if (matches.length !== 6) {
    throw new Error('Số trận đấu vòng tròn 4 đội phải chính xác là 6 trận!');
  }

  // Kiểm tra mã trận và giờ đấu
  matches.forEach((m) => {
    console.log(`- [${m.matchCode}] [${m.court}] [${m.scheduledTime}] ${m.teamA?.name} vs ${m.teamB?.name}`);
  });

  // Kiểm tra tính duy nhất của từng cặp đấu
  const pairKeys = new Set<string>();
  for (const m of matches) {
    const key = [m.teamA?.id, m.teamB?.id].sort().join('_vs_');
    if (pairKeys.has(key)) {
      throw new Error(`Trùng lặp cặp đấu: ${key}`);
    }
    pairKeys.add(key);
  }
  console.log('Tất cả 6 cặp đấu đều phân biệt và duy nhất 100%.');

  console.log('\n=== TEST 2: RoundRobinScheduler với Randomize ===');
  const randomMatches = RoundRobinScheduler.generateMatches([team1, team2, team3, team4], {
    categoryId: 'cat_men_doubles',
    categoryCode: 'DN',
    groupId: 'grp_a',
    groupName: 'Bảng A',
    rule: rule31,
    randomize: true,
  });
  console.log(`Số trận tạo khi chọn ngẫu nhiên: ${randomMatches.length}`);
  if (randomMatches.length !== 6) {
    throw new Error('Số trận random phải bằng 6!');
  }

  console.log('\n=== TEST 3: KnockoutScheduler & Automatic Progression ===');
  const stageConfig = new StageRuleConfig();
  const koMatches = KnockoutScheduler.createStandard4TeamKnockout(
    'cat_men_doubles',
    'DN',
    stageConfig,
    ['Sân 1', 'Sân 2'],
    '14:00',
    '15:30',
    team1, // Nhất A
    team4, // Nhì B
    team2, // Nhất B
    team3  // Nhì A
  );

  console.log(`Số trận nhánh knockout được tạo: ${koMatches.length} (Kỳ vọng: 4)`);
  if (koMatches.length !== 4) {
    throw new Error('Cần 4 trận: 2 Bán kết, 1 Chung kết, 1 Tranh 3-4!');
  }

  const [sf1, sf2, thirdPlace, finalMatch] = koMatches;
  console.log(`Bán kết 1: ${sf1.teamA?.name} vs ${sf1.teamB?.name}`);
  console.log(`Bán kết 2: ${sf2.teamA?.name} vs ${sf2.teamB?.name}`);
  console.log(`Chung kết ban đầu: ${finalMatch.teamA?.name || 'Chờ BK1'} vs ${finalMatch.teamB?.name || 'Chờ BK2'}`);

  // Mô phỏng kết thúc Bán kết 1: Team 1 thắng Team 4 (21-18, 21-15)
  sf1.updateScore(0, 21, 18);
  sf1.updateScore(1, 21, 15);
  console.log(`BK1 kết thúc: Thắng cuộc = ${sf1.getWinner()?.name}`);

  // Mô phỏng kết thúc Bán kết 2: Team 3 thắng Team 2 (21-19, 21-17)
  sf2.updateScore(0, 21, 19);
  sf2.updateScore(1, 21, 17);
  console.log(`BK2 kết thúc: Thắng cuộc = ${sf2.getWinner()?.name}`);

  // Tự động đẩy người thắng vào Chung kết và người thua vào Tranh 3-4
  KnockoutScheduler.propagateWinners(koMatches);

  console.log(`\nSau khi hoàn thành Bán kết:`);
  console.log(`- Trận Chung kết: ${finalMatch.teamA?.name} vs ${finalMatch.teamB?.name}`);
  console.log(`- Trận Tranh 3-4: ${thirdPlace.teamA?.name} vs ${thirdPlace.teamB?.name}`);

  if (finalMatch.teamA?.id !== team1.id || finalMatch.teamB?.id !== team2.id) {
    throw new Error('Đội vào Chung kết không đúng!');
  }
  if (thirdPlace.teamA?.id !== team4.id || thirdPlace.teamB?.id !== team3.id) {
    throw new Error('Đội vào Tranh 3-4 không đúng!');
  }

  console.log('\n🎉 ALL PHASE 2 TESTS PASSED PERFECTLY! 🎉');
}

runPhase2Tests().catch((err) => {
  console.error('Test Phase 2 error:', err);
  process.exit(1);
});
