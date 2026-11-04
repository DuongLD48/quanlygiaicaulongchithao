import { Tournament, Category, Group, Team, Player, Match, MatchRule, StageRuleConfig } from './models';

async function runTests() {
  console.log('=== TEST 1: Default Tournament Creation ===');
  const tournament = Tournament.createDefaultTournament('Giải Cầu Lông Mở Rộng 2026');
  console.log(`Tournament Name: ${tournament.name}`);
  console.log(`Categories count: ${tournament.categories.length}`);
  const catNames = tournament.categories.map((c) => c.name);
  console.log(`Categories: ${catNames.join(', ')}`);
  if (tournament.categories.length !== 3) {
    throw new Error('Expected 3 categories (Đôi nam, Đôi nam nữ, Đôi nữ)!');
  }

  console.log('\n=== TEST 2: Admin PIN Verification (Mã PIN / Secret Key) ===');
  const isDefaultPinValid = await tournament.verifyAdminPin('123456');
  const isWrongPinValid = await tournament.verifyAdminPin('999999');
  console.log(`Default PIN 123456 valid: ${isDefaultPinValid} (Expected: true)`);
  console.log(`Wrong PIN 999999 valid: ${isWrongPinValid} (Expected: false)`);
  if (!isDefaultPinValid || isWrongPinValid) {
    throw new Error('PIN verification failed!');
  }

  await tournament.setAdminPin('654321');
  const isNewPinValid = await tournament.verifyAdminPin('654321');
  console.log(`Changed PIN 654321 valid: ${isNewPinValid} (Expected: true)`);
  if (!isNewPinValid) {
    throw new Error('New PIN verification failed!');
  }

  console.log('\n=== TEST 3: MatchRule & Score Evaluation ===');
  // 1 set to 31
  const rule31 = MatchRule.standard31OneSet();
  const eval31_inProgress = rule31.evaluateMatch([{ teamA: 25, teamB: 20 }]);
  console.log('25-20 in 31-pt match finished:', eval31_inProgress.finished); // false

  const eval31_finished = rule31.evaluateMatch([{ teamA: 31, teamB: 28 }]);
  console.log('31-28 in 31-pt match finished:', eval31_finished.finished, 'Winner:', eval31_finished.winner); // true, A

  // 3 sets to 21
  const rule21 = MatchRule.standard21ThreeSets();
  const eval21 = rule21.evaluateMatch([
    { teamA: 21, teamB: 18 },
    { teamA: 19, teamB: 21 },
    { teamA: 21, teamB: 15 },
  ]);
  console.log('3 sets (21-18, 19-21, 21-15) finished:', eval21.finished, 'Winner:', eval21.winner); // true, A

  console.log('\n=== TEST 4: Standings Calculation in Group ===');
  const groupA = new Group('grp_test', 'Bảng A');
  const team1 = new Team('t1', 'Đội Nguyễn / Trần', [
    new Player('p1', 'Nguyễn Văn A'),
    new Player('p2', 'Trần Văn B'),
  ]);
  const team2 = new Team('t2', 'Đội Lê / Phạm', [
    new Player('p3', 'Lê Văn C'),
    new Player('p4', 'Phạm Văn D'),
  ]);
  const team3 = new Team('t3', 'Đội Hoàng / Vũ', [
    new Player('p5', 'Hoàng Văn E'),
    new Player('p6', 'Vũ Văn F'),
  ]);

  groupA.addTeam(team1);
  groupA.addTeam(team2);
  groupA.addTeam(team3);

  // Match 1: Team 1 vs Team 2 -> Team 1 thắng 31-25
  const match1 = new Match(
    'm1',
    'DN-01',
    'cat_men_doubles',
    'GROUP',
    'Bảng A',
    'Sân 1',
    '08:00',
    team1,
    team2,
    rule31,
    [{ teamA: 31, teamB: 25 }],
    'FINISHED',
    team1.id
  );

  // Match 2: Team 2 vs Team 3 -> Team 2 thắng 31-20
  const match2 = new Match(
    'm2',
    'DN-02',
    'cat_men_doubles',
    'GROUP',
    'Bảng A',
    'Sân 2',
    '08:45',
    team2,
    team3,
    rule31,
    [{ teamA: 31, teamB: 20 }],
    'FINISHED',
    team2.id
  );

  // Match 3: Team 1 vs Team 3 -> Team 1 thắng 31-15
  const match3 = new Match(
    'm3',
    'DN-03',
    'cat_men_doubles',
    'GROUP',
    'Bảng A',
    'Sân 1',
    '09:30',
    team1,
    team3,
    rule31,
    [{ teamA: 31, teamB: 15 }],
    'FINISHED',
    team1.id
  );

  groupA.matches = [match1, match2, match3];
  const standings = groupA.calculateStandings();

  console.log('Bảng xếp hạng:');
  standings.forEach((s) => {
    console.log(
      `Hạng ${s.rank}: ${s.team.name} | Thắng: ${s.won}/${s.played} | Hiệu số điểm: ${s.pointsDiff > 0 ? '+' : ''}${s.pointsDiff}`
    );
  });

  if (standings[0].team.id !== team1.id || standings[1].team.id !== team2.id || standings[2].team.id !== team3.id) {
    throw new Error('Standings order calculation mismatch!');
  }

  console.log('\n=== TEST 5: JSON Serialization / Deserialization (No hardcoding) ===');
  const jsonOutput = tournament.toJSON();
  const rehydratedTournament = Tournament.fromJSON(jsonOutput);
  if (rehydratedTournament.categories.length !== 3) {
    throw new Error('Rehydration failed!');
  }
  console.log('Rehydration successful. All models serializable and valid.');

  console.log('\n🎉 ALL PHASE 1 TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
