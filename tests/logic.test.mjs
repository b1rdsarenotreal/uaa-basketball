// Logic tests: run with `node tests/logic.test.mjs`
import assert from 'node:assert/strict';
import { ALIGNMENT, newLeague, currentSeason, simGames, startNextSeason, beginOffseason, draftWarnings, clearResult, estimateHE, migrateLeague, addConference, rebuildSchedule, weekName, defaultSettings } from '../js/league.js';
import { simulateGame, winProbability, simulatedWinRate, matchOdds, ovr } from '../js/sim.js';
import { confRounds, confSeriesCounts, confTarget, DEFAULT_REG_WEEKS, DEFAULT_MAX_MATCHES, DEFAULT_CONF_MATCHES, dateOf, seriesDays, CONF_START_WEEK } from '../js/schedule.js';
import { isFinal, isTie, winnerOf, resultFor } from '../js/standings.js';
import { firstRoundPairs, shownSeed, gameVenue, postseasonFinish, postseasonRecord, wsTeams, ncaaProblems, fieldSize, DEFAULT_NCAA, postWeeks, aqConferences, autoBids } from '../js/postseason.js';
import { recordBook } from '../js/records.js';
import { readAauLogos, applyAauLogos } from '../js/logo-import.js';
import { seedTeams, splitOvr, COACHES, MEN_COACHES, CONFERENCES, SIDES } from '../js/data.js';
import { existsSync } from 'node:fs';
import { rng } from '../js/util.js';

const t0 = Date.now();
let n = 0;
const check = (name, fn) => {
  try { fn(); } catch (e) { console.error(`✗ ${name}`); throw e; }
  n++;
};
const reg = s => s.games.filter(g => g.type === 'regular');
const count = (games, pick = () => true) => { const c = {}; for (const g of games) for (const t of [g.home, g.away]) if (pick(g, t)) c[t] = (c[t] || 0) + 1; return c; };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const absDay = g => g.week * 7 + DAYS.indexOf(g.day);

check('all 73 AAU schools, women\'s and men\'s, in the commissioner\'s conferences', () => {
  assert.deepEqual(Object.keys(SIDES), ['women', 'men']);
  for (const side of ['women', 'men']) {
    const T = seedTeams(side);
    assert.equal(Object.keys(T).length, 73, side);
    const sizes = {};
    for (const t of Object.values(T)) sizes[t.conference] = (sizes[t.conference] || 0) + 1;
    assert.deepEqual(sizes, { 'Big Ten': 11, 'Coastal Atlantic Conference': 9, 'Ivy League': 8, 'Metro Conference': 9, 'Pacific-10 Conference': 10, 'Southwest Conference': 8, 'UC Athletic Association': 7, 'University Athletic Association': 11 });
    assert.ok(Object.values(T).every(t => t.stadium && t.city && t.color && t.mascot), 'arenas, cities, colors, mascots');
    for (const t of Object.values(T)) assert.ok(Math.abs(ovr(t) - (t.off * 0.4 + t.pit * 0.3 + t.def * 0.3)) < 1);
    assert.ok(ovr(T.Duke) > ovr(T.Caltech) + 35, 'Division I above Division III');
  }
  const M = seedTeams('men'), W = seedTeams('women');
  assert.equal(M.Michigan.coach, 'Dusty May');
  assert.equal(W.UCLA.coach, 'Cori Close');
  assert.equal(M.Georgetown.stadium, 'Capital One Arena');
  assert.equal(W.Georgetown.stadium, 'McDonough Arena');
  assert.equal(M.McGill.mascot, 'Redbirds'); assert.equal(W.McGill.mascot, 'Martlets');
  assert.ok(ovr(M.Michigan) >= 95 && ovr(W.UCLA) >= 95, 'the 2026 national champions lead');
  assert.equal(new Set(Object.values(MEN_COACHES)).size, Object.keys(MEN_COACHES).length, 'every men\'s coach is a different person');
  assert.equal(new Set(Object.values(COACHES)).size, Object.keys(COACHES).length);
  for (const c of Object.keys(CONFERENCES)) assert.ok((/^https:\/\//.test(CONFERENCES[c].logo) || existsSync(new URL(`../${CONFERENCES[c].logo}`, import.meta.url))), `${c} logo`);
  const s = splitOvr('Duke', 80);
  assert.ok(Math.abs(0.4 * s.off + 0.3 * s.pit + 0.3 * s.def - 80) <= 0.5);
  assert.equal(newLeague({ side: 'men' }).sport, 'basketball');
});

check('games: halves or quarters, overtime until someone leads, never a tie', () => {
  for (const periods of [2, 4]) {
    const T = seedTeams(periods === 2 ? 'men' : 'women'), A = T.Purdue, B = T.Iowa;
    let ots = 0, pts = 0, reb = 0, to = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      const r = simulateGame(A, B, { type: 'regular' }, { seed: i + 1, periods });
      assert.ok(r.homeLine.length >= periods);
      assert.equal(r.home.R, r.homeLine.reduce((a, b) => a + b, 0));
      assert.notEqual(r.home.R, r.away.R, 'no ties');
      const reg = l => l.slice(0, periods).reduce((a, b) => a + b, 0);
      if (r.homeLine.length > periods) { ots++; assert.equal(reg(r.homeLine), reg(r.awayLine), 'overtime only after a tie'); }
      pts += r.home.R + r.away.R; reb += r.home.H + r.away.H; to += r.home.E + r.away.E;
    }
    console.log(`  ${periods === 2 ? 'men' : 'women'}: ${(pts / N / 2).toFixed(1)} points, ${(reb / N / 2).toFixed(1)} rebounds, ${(to / N / 2).toFixed(1)} turnovers per team, ${(100 * ots / N).toFixed(1)}% overtime`);
    assert.ok(pts / N / 2 > (periods === 2 ? 64 : 58) && pts / N / 2 < (periods === 2 ? 80 : 74));
    assert.ok(ots > 0 && ots / N < 0.12);
  }
  const T = seedTeams('men');
  const o = matchOdds(T.Duke, T.MIT, {}, { periods: 2 });
  assert.ok(o.win > 0.97 && o.tie === 0);
  const est = winProbability(T.Iowa, T.Purdue, {}, { periods: 2 }), simd = simulatedWinRate(T.Iowa, T.Purdue, {}, { periods: 2 }, 1500);
  assert.ok(Math.abs(est - simd) < 0.06, `win chance ${est.toFixed(2)} vs simulated ${simd.toFixed(2)}`);
  const g = { type: 'regular', home: 'A', away: 'B', homeR: 70, awayR: 72, final: true, homeLine: [30, 32, 8], awayLine: [28, 34, 10] };
  assert.equal(winnerOf(g), 'B'); assert.equal(resultFor(g, 'A'), 'L'); assert.ok(!isTie(g));
  const L = newLeague(), s = currentSeason(L), x = reg(s)[0];
  const e = estimateHE(s, x, [20, 15, 18, 17], [10, 12, 14, 20]);
  assert.ok(e.home.H >= 20 && e.home.E >= 2);
});

for (const side of ['women', 'men']) check(`${side}'s schedule: non-conference any day, preseason tournaments, conference play on set days`, () => {
  const L = newLeague({ side }), s = currentSeason(L), g = reg(s);
  assert.equal(s.regWeeks, DEFAULT_REG_WEEKS);
  assert.equal(dateOf(s.year, 1, 'Mon').toISOString().slice(0, 10), '2030-11-04', 'week 1 starts the first Monday in November');
  const nc = g.filter(x => !x.confGame);
  assert.deepEqual([...new Set(nc.map(x => x.day))].sort(), [...DAYS].sort(), 'non-conference games on every day of the week');
  // One game a day at most; no back-to-back non-conference days outside tournaments.
  const seen = new Set();
  for (const x of g) for (const t of [x.home, x.away]) { const k = `${t}|${absDay(x)}`; assert.ok(!seen.has(k), k); seen.add(k); }
  const byTeam = {};
  for (const x of g) for (const t of [x.home, x.away]) (byTeam[t] ||= []).push(x);
  for (const [t, list] of Object.entries(byTeam)) {
    list.sort((a, b) => absDay(a) - absDay(b));
    for (let i = 1; i < list.length; i++) {
      const [a, b] = [list[i - 1], list[i]];
      if (absDay(b) - absDay(a) === 1 && !(a.confGame && b.confGame) && !(a.tourney && b.tourney)) assert.fail(`${t}: back to back on ${b.week} ${b.day}`);
    }
  }
  // No games on Christmas Eve, Christmas or the day after.
  for (const x of g) { const d = dateOf(s.year, x.week, x.day); assert.ok(!(d.getUTCMonth() === 11 && d.getUTCDate() >= 24 && d.getUTCDate() <= 26), `${x.home}-${x.away} on Dec ${d.getUTCDate()}`); }
  const totals = Object.values(count(g));
  console.log(`  ${side}: ${Math.min(...totals)}–${Math.max(...totals)} games per team`);
  assert.ok(Math.min(...totals) >= 27 && Math.max(...totals) <= DEFAULT_MAX_MATCHES);
  // Conference play: home and away, at most 18, everyone the same number,
  // on the conference's days, from New Year's week.
  const sizes = {};
  for (const t of Object.values(s.teams)) sizes[t.conference] = (sizes[t.conference] || 0) + 1;
  const conf = count(g.filter(x => x.confGame));
  for (const t of Object.values(s.teams)) assert.equal(conf[t.school], confTarget(sizes[t.conference]), t.school);
  const homeC = count(g.filter(x => x.confGame), (x, t) => t === x.home);
  for (const t of Object.values(s.teams)) assert.ok(Math.abs(2 * (homeC[t.school] || 0) - conf[t.school]) <= 1, `${t.school} hosts half its conference games`);
  for (const x of g.filter(x => x.confGame)) {
    const c = s.teams[x.home].conference, days = seriesDays(s.settings.confWeekend?.[c] || s.settings.confDays).map(d => d.day);
    assert.ok(days.includes(x.day), `${c} plays ${days.join('/')}, not ${x.day}`);
    assert.ok(x.week >= CONF_START_WEEK || sizes[c] >= 11, 'early December conference games only for the biggest conferences');
  }
  assert.ok(g.every(x => x.confGame || s.teams[x.home].conference !== s.teams[x.away].conference));
  // Preseason tournaments: four teams, three games each, at a neutral arena.
  const tour = {};
  for (const x of g.filter(x => x.tourney)) (tour[x.tourney] ||= []).push(x);
  assert.ok(Object.keys(tour).length >= 16);
  for (const gs of Object.values(tour)) {
    assert.equal(gs.length, 6);
    assert.deepEqual(Object.values(count(gs)), [3, 3, 3, 3]);
    assert.ok(gs.every(x => x.neutral && x.venue?.stadium && gameVenue(s, x).stadium === x.venue.stadium));
    const confs = new Set(Object.keys(count(gs)).map(t => s.teams[t].conference));
    assert.equal(confs.size, 4, 'no two teams from one conference');
  }
  assert.ok(g.some(x => / Challenge$/.test(x.label) && !x.tourney), 'a conference challenge');
  const days = side === 'men' ? ['Wed', 'Sat'] : ['Thu', 'Sun'];
  assert.ok(g.filter(x => x.confGame && s.teams[x.home].conference === 'Big Ten').every(x => days.includes(x.day)));
  assert.ok(g.filter(x => x.confGame && s.teams[x.home].conference === 'Ivy League').every(x => ['Fri', 'Sat'].includes(x.day)));
});

check('conference schedules are fair at every size', () => {
  const r = rng(7);
  for (let k = 2; k <= 13; k++) {
    const list = Array.from({ length: k }, (_, i) => `T${i}`);
    const c = confSeriesCounts(confRounds(list, 22, r), list);
    assert.equal(new Set(Object.values(c)).size, 1, `${k} teams`);
    assert.equal(Object.values(c)[0], Math.min(confTarget(k), k % 2 && confTarget(k) % 2 ? confTarget(k) - 1 : confTarget(k)), `${k} teams play ${confTarget(k)}`);
  }
  assert.equal(confTarget(8), 14); assert.equal(confTarget(10), 18); assert.equal(confTarget(11), DEFAULT_CONF_MATCHES);
});

check('every conference gets an automatic bid; format checks; week names', () => {
  const L = newLeague(), s = currentSeason(L);
  assert.equal(aqConferences(s).length, 8);
  assert.equal(fieldSize(DEFAULT_NCAA), 32);
  assert.deepEqual(ncaaProblems(DEFAULT_NCAA, 73), []);
  assert.deepEqual(postWeeks(s), { conf: 19, regional: 20, regional2: 21, mcws: 22 });
  assert.equal(weekName(20, s), 'Round of 32');
  assert.equal(weekName(21, s), 'Sweet 16 & Elite Eight');
  assert.equal(weekName(22, s), 'Final Four');
  const g = reg(s).find(x => !x.neutral);
  assert.equal(gameVenue(s, g).stadium, s.teams[g.home].stadium);
  assert.equal(defaultSettings('men').periods, 2);
  assert.equal(defaultSettings('women').periods, 4);
});

const leagues = {};
for (const side of ['women', 'men']) {
  const league = newLeague({ side });
  const s = currentSeason(league);
  simGames(s, undefined, { autoLock: true, max: 9000 });
  leagues[side] = league;
  check(`${side}'s season: conference tournaments, 32 teams, campus round of 32, regional sites, the Final Four`, () => {
    assert.equal(s.phase, 'complete');
    const R = reg(s);
    assert.ok(R.every(isFinal) && !R.some(isTie), 'no ties');
    assert.ok(R.some(g => g.homeLine.length > s.settings.periods), 'some games go to overtime');
    assert.equal(Object.keys(s.post.confT).length, 8);
    for (const ev of Object.values(s.post.confT)) {
      const n = Object.values(s.teams).filter(t => t.conference === ev.conf).length;
      assert.equal(ev.size, n, `${ev.conf}: everyone`);
      const days = [...new Set(s.games.filter(g => g.event === ev.id).map(g => g.day))];
      assert.equal(days[days.length - 1] === 'Sun' || days.includes('Sun'), true);
      assert.equal(new Set(days).size, Math.ceil(Math.log2(n)), 'one round a day, back to back');
    }
    const auto = Object.values(autoBids(s));
    assert.equal(auto.length, 8);
    assert.ok(auto.every(t => s.post.field.some(f => f.team === t)));
    assert.equal(s.post.field.length, 32);
    const W = postWeeks(s);
    for (const ev of s.post.regionals) {
      assert.equal(ev.seeds.length, 8);
      const gs = s.games.filter(g => g.event === ev.id);
      assert.equal(gs.length, 7);
      const r32 = gs.filter(g => g.node.startsWith('R1-')), later = gs.filter(g => !g.node.startsWith('R1-'));
      assert.ok(r32.every(g => !g.neutral && g.week === W.regional && ['Fri', 'Sat'].includes(g.day)), 'round of 32 on campus');
      for (const g of r32) assert.ok(ev.seeds.indexOf(g.home) < ev.seeds.indexOf(g.away), 'the higher seed hosts');
      assert.ok(later.every(g => g.neutral && g.week === W.regional2 && gameVenue(s, g).stadium === ev.venue.stadium), 'Sweet 16 and Elite Eight at the regional site');
      assert.match(ev.name, / Region$/);
    }
    // The top two seeds in each region are national seeds 1–8 (1 with 8, 2 with 7…).
    const nat = t => s.post.field.find(f => f.team === t).seed;
    assert.deepEqual(s.post.regionals.map(ev => [nat(ev.seeds[0]), nat(ev.seeds[1])]), [[1, 8], [2, 7], [3, 6], [4, 5]]);
    assert.deepEqual(firstRoundPairs(8), [[1, 8], [4, 5], [2, 7], [3, 6]]);
    assert.ok(shownSeed(s, s.post.regionals[0].seeds[1]) === 8 && shownSeed(s, s.post.regionals[0].seeds[2]) == null, 'national seeds 1–8 are shown');
    const ff = s.games.filter(g => g.type === 'mcws');
    assert.equal(ff.length, 3);
    assert.ok(ff.every(g => g.neutral && gameVenue(s, g).stadium === s.settings.mcwsVenue));
    assert.deepEqual(ff.map(g => g.day).sort(), side === 'men' ? ['Mon', 'Sat', 'Sat'] : ['Fri', 'Fri', 'Sun']);
    assert.equal(postseasonFinish(s, s.post.champion), 'National champion');
    assert.equal(wsTeams(s).length, 4);
    const elite = s.post.regionals.map(ev => s.games.find(g => g.event === ev.id && g.node === 'R3-1')).map(g => winnerOf(g) === g.home ? g.away : g.home);
    assert.ok(elite.every(t => postseasonFinish(s, t) === 'Elite Eight'));
    assert.equal(postseasonRecord(s, s.post.champion).ncaa.w, 5, 'the champion wins five national games');
    assert.ok(s.polls.final);
  });
}

check('clearing a result', () => {
  const s = currentSeason(leagues.women);
  const copy = { ...s.games.find(isFinal) };
  clearResult(copy);
  assert.ok(!copy.final && copy.homeR == null);
});

check('logos from the AAU Dynasty', () => {
  const L = newLeague();
  const backup = { schools: [{ id: 'x', name: 'Duke University', short: 'Duke', logo: 'data:image/png;base64,AAAA' }], conferences: { c1: { name: 'Ivy League', logo: 'https://e.com/ivy.png' } } };
  const got = applyAauLogos(L, readAauLogos(backup));
  assert.deepEqual(got, { teams: ['Duke'], conferences: ['Ivy League'] });
  assert.throws(() => readAauLogos({ seasons: {} }));
});

check('an unstarted saved dynasty picks up the commissioner\'s conferences', () => {
  const L = newLeague(), s0 = currentSeason(L);
  delete L.alignment;
  s0.teams.Stanford.conference = 'Big Ten';
  migrateLeague(L);
  assert.equal(L.alignment, ALIGNMENT);
  assert.equal(s0.teams.Stanford.conference, 'Pacific-10 Conference');
});

check('record book', () => {
  const B = recordBook(leagues.men);
  assert.ok(B.games.length > 1000);
  assert.ok(B.programs.some(x => x.titles === 1));
});

check('offseason and the next season', () => {
  const league = leagues.men, prev = currentSeason(league);
  beginOffseason(league);
  assert.ok(Array.isArray(draftWarnings(league)));
  addConference(league, 'West Coast', { abbr: 'WC', color: '#123456' });
  for (const t of ['California', 'Stanford', 'UC Davis', 'UC Irvine']) league.draft.teams[t].conference = 'West Coast';
  const s2 = startNextSeason(league);
  assert.equal(s2.year, 2031);
  assert.equal(s2.settings.periods, 2);
  const conf = count(reg(s2).filter(g => g.confGame && s2.teams[g.home].conference === 'West Coast'));
  assert.deepEqual(Object.values(conf), [6, 6, 6, 6], 'a 4-team conference plays everyone twice');
  rebuildSchedule(s2, prev);
  assert.ok(reg(s2).length > 1000);
});

check('a saved league loads again', () => {
  const copy = JSON.parse(JSON.stringify(leagues.men));
  delete copy.sport;
  migrateLeague(copy);
  assert.equal(copy.currentYear, 2031);
  assert.equal(copy.sport, 'basketball');
});

console.log(`${n} checks ok in ${Date.now() - t0} ms`);
