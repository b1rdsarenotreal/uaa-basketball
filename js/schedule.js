// Regular-season schedule for college basketball, early November to early
// March (18 weeks by default; week 1 starts the first Monday in November).
//
// - Non-conference games are played any day of the week. Each team gets a
//   share of its non-conference games each week (most in November, fewer
//   during December exams, none on Thanksgiving or December 24–26), paired
//   with a team from another conference that's nearby and of a similar
//   level; a much stronger team usually hosts (a "buy game"). Never on back-
//   to-back days, except at a tournament.
// - Preseason tournaments: almost every team plays one four-team event at a
//   neutral site (three games, one a day), most in Thanksgiving week, some
//   the week before and a few over the December holidays. Events group
//   teams of a similar level from different conferences.
// - A conference challenge week in early December: conferences of similar
//   strength pair off, and their teams meet by rank.
// - Holiday showcases: some December games between good teams are played at
//   a neutral big-city arena.
// - Conference play is home and away against everyone (a double round
//   robin), at most `confMatches` (18) games, so a conference of 11 plays
//   some teams once. It runs from the last days of December to the end of
//   the regular season, two games a week on the conference's set days
//   (Standings → Commissioner); a conference that needs more than 20 rounds
//   plays its first two in early December, like the Big Ten and ACC.
// - At most `maxMatches` (31) regular-season games.
// When `prev` (last season) is given, conference opponents who met once last
// year swap home and away.

import { isIndependent } from './standings.js?v=20261105175349';
import { cityPoint, miles } from './geo.js?v=20261105175349';
import { rng, shuffle, hashStr } from './util.js?v=20261105175349';

export const DEFAULT_REG_WEEKS = 18;
export const DEFAULT_TOURNEY_WEEKS = 0; // kept for older code paths
export const CONF_START_WEEK = 9;  // the week of New Year's Day
export const EARLY_CONF_WEEK = 5;  // early December
export const CHALLENGE_WEEK = 5;
export const MAX_CONF_WEEKS = 14;
export const PER_WEEK = 2; // conference games a week
export const DEFAULT_CONF_MATCHES = 18; // most conference games a team plays
export const DEFAULT_MAX_MATCHES = 31;  // most regular-season games (the NCAA's limit with an exempt event)

// Conference games each team in an n-team conference plays: everyone twice
// (home and away), never more than `max`.
export const DOUBLE_ROUND_ROBIN_MAX = 99;
export const confTarget = (n, max = DEFAULT_CONF_MATCHES) => (n < 2 ? 0 : Math.min(2 * (n - 1), max));

// Kept for older code paths that read these.
export const MIDWEEK = {}; export const MIDWEEK_FREQ = {};

export const DAY_ORDER = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ---------- the calendar ----------

// Week 1 starts on the first Monday in November of the season's year.
export function seasonStart(year) {
  const nov1 = new Date(Date.UTC(year, 10, 1));
  return new Date(Date.UTC(year, 10, 1 + ((8 - nov1.getUTCDay()) % 7)));
}
// The calendar date of a week and day (a Date at UTC midnight).
export function dateOf(year, week, day) {
  const d = new Date(seasonStart(year));
  d.setUTCDate(d.getUTCDate() + (week - 1) * 7 + Math.max(0, DAYS.indexOf(day)));
  return d;
}
// The week and day of a date.
export function weekDayOf(year, month, date) {
  const n = Math.round((Date.UTC(year, month, date) - seasonStart(year).getTime()) / 864e5);
  return { week: Math.floor(n / 7) + 1, day: DAYS[((n % 7) + 7) % 7] };
}
// Days with no games: Thanksgiving (except at tournaments) and December 24–26.
function blackout(year, week, day) {
  const d = dateOf(year, week, day), m = d.getUTCMonth(), n = d.getUTCDate();
  if (m === 11 && n >= 24 && n <= 26) return true;
  if (m === 10 && d.getUTCDay() === 4 && n >= 22 && n <= 28) return true;
  return false;
}

// The conference weeks: from week `start` to the last regular-season week.
export function confWeeksFor(regWeeks) { return Math.max(1, Math.min(MAX_CONF_WEEKS, regWeeks - CONF_START_WEEK + 1)); }
export function confWeeksMax(regWeeks) { return confWeeksFor(regWeeks) + 1; }
const rrRounds = n => (n < 2 ? 0 : n % 2 ? n : n - 1);

export function blankGame(season, fields) {
  return {
    id: season.nextId++, type: 'regular', week: 1, day: 'Sat', order: DAY_ORDER.Sat,
    home: null, away: null, neutral: false, confGame: false, series: null, label: '',
    final: false, homeLine: [], awayLine: [], homeR: null, homeH: null, homeE: null, awayR: null, awayH: null, awayE: null,
    pitching: null, source: null, ...fields,
  };
}

// The two days a conference plays each week. Set per conference (Standings →
// Commissioner); the default is the side's (`settings.confDays`): men's
// Wednesday and Saturday, women's Thursday and Sunday. In a week with one
// conference game it's on the second day.
export const CONF_WEEKENDS = [
  ['tus', 'Tuesday and Saturday'],
  ['ws', 'Wednesday and Saturday'],
  ['wsu', 'Wednesday and Sunday'],
  ['ts', 'Thursday and Saturday'],
  ['tsu', 'Thursday and Sunday'],
  ['fs', 'Friday and Saturday'],
  ['fsu', 'Friday and Sunday'],
];
const WEEKEND_DAYS = { tus: ['Tue', 'Sat'], ws: ['Wed', 'Sat'], wsu: ['Wed', 'Sun'], ts: ['Thu', 'Sat'], tsu: ['Thu', 'Sun'], fs: ['Fri', 'Sat'], fsu: ['Fri', 'Sun'] };
export function seriesDays(fmt) {
  return (WEEKEND_DAYS[fmt] || WEEKEND_DAYS.ws).map(day => ({ day, order: DAY_ORDER[day] }));
}
export const confDaysOf = (season, conf) => season.settings?.confWeekend?.[conf] || season.settings?.confDays || 'ws';
// Re-lay a conference's unplayed conference games after its days change.
export function applyConfWeekend(season, conf) {
  const days = seriesDays(confDaysOf(season, conf));
  let n = 0;
  for (const g of season.games) {
    if (g.type !== 'regular' || !g.confGame || g.final || season.teams[g.home]?.conference !== conf || g.slot == null) continue;
    Object.assign(g, days[g.slot]);
    n++;
  }
  return n;
}

// Count each team's conference games in a set of rounds.
export function confSeriesCounts(rounds, list) {
  const n = Object.fromEntries(list.map(t => [t, 0]));
  for (const pairs of rounds) for (const [a, b] of pairs) if (a && b) { n[a]++; n[b]++; }
  return n;
}

// Pick games to drop so every team ends with the same number: team t must
// lose `need[t]` games, each shared with another team that has games to
// lose. Small conferences, so a backtracking search is quick.
function pickDrops(edges, need, r) {
  const left = { ...need }, chosen = [], used = new Set();
  let steps = 0;
  const solve = () => {
    if (++steps > 20000) return false;
    const todo = Object.keys(left).filter(t => left[t] > 0);
    if (!todo.length) return true;
    const opts = t => edges.filter((e, i) => !used.has(i) && (e.a === t ? left[e.b] > 0 : e.b === t && left[e.a] > 0));
    const t = todo.reduce((x, y) => (opts(y).length - left[y] < opts(x).length - left[x] ? y : x));
    for (const e of shuffle(opts(t), r)) {
      const i = edges.indexOf(e);
      used.add(i); left[e.a]--; left[e.b]--; chosen.push(i);
      if (solve()) return true;
      used.delete(i); left[e.a]++; left[e.b]++; chosen.pop();
    }
    return false;
  };
  return solve() ? chosen : null;
}

// Home/away for single meetings so every team hosts half its conference
// games. Pairs that meet twice already have one home each. The rest are
// walked as closed trails (an Euler orientation: every visit to a team is one
// arrival and one departure, so hosts and visits balance). A team with an
// odd number of single meetings gets a dummy partner, so it ends at most one
// off. `prefer(a, b)` > 0 means a should host (last season's swap); each
// trail runs whichever way satisfies more of those.
function balanceHomes(edges, r, prefer) {
  const adj = new Map(), deg = new Map();
  const all = edges.map(e => ({ ...e }));
  for (const e of all) for (const t of [e.a, e.b]) deg.set(t, (deg.get(t) || 0) + 1);
  const odd = [...deg].filter(([, d]) => d % 2).map(([t]) => t);
  for (let i = 0; i + 1 < odd.length; i += 2) all.push({ a: odd[i], b: '\u0000', dummy: true }, { a: odd[i + 1], b: '\u0000', dummy: true });
  all.forEach((e, i) => { for (const t of [e.a, e.b]) { if (!adj.has(t)) adj.set(t, []); adj.get(t).push(i); } });
  for (const l of adj.values()) l.splice(0, l.length, ...shuffle(l, r));
  const used = new Set();
  for (const start of shuffle([...adj.keys()], r)) {
    while ((adj.get(start) || []).some(i => !used.has(i))) {
      const trail = [];
      let at = start;
      for (;;) {
        const i = adj.get(at).find(j => !used.has(j));
        if (i == null) break;
        used.add(i);
        const e = all[i], to = e.a === at ? e.b : e.a;
        trail.push({ e, host: at, visit: to });
        at = to;
      }
      const score = trail.reduce((s2, x) => s2 + (x.e.dummy || !prefer ? 0 : Math.sign(prefer(x.host, x.visit))), 0);
      for (const x of trail) [x.e.home, x.e.away] = score < 0 ? [x.visit, x.host] : [x.host, x.visit];
    }
  }
  return all.filter(e => !e.dummy);
}

// A conference's rounds for the season, at most `maxRounds`: a round robin,
// then a second one with home and away swapped, taken until every team has
// its number of conference matches (confTarget). Fail-safe: every member plays
// the same number, with an even home/away split. When the last rounds give
// some teams an extra game, extra second meetings are dropped (those teams
// get a non-conference game or an open date instead); if no clean set of
// drops exists, the round robin is redrawn and tried again.
export function confRounds(list, maxRounds, r, max = DEFAULT_CONF_MATCHES, prefer = null) {
  if (list.length < 2) return [];
  const T = confTarget(list.length, max);
  for (let attempt = 0; attempt < 40; attempt++) {
    const first = roundRobin(list, r);
    const all = [...first, ...first.map(pairs => pairs.map(([a, b]) => [b, a]))];
    const rounds = [], cnt = Object.fromEntries(list.map(t => [t, 0]));
    for (const pairs of all) {
      if (rounds.length >= maxRounds || list.every(t => cnt[t] >= T)) break;
      rounds.push(pairs);
      for (const [a, b] of pairs) if (a && b) { cnt[a]++; cnt[b]++; }
    }
    let k = Math.min(T, ...Object.values(cnt));
    if ((list.length * k) % 2) k--;
    const edges = rounds.flatMap((pairs, ri) => pairs.filter(([a, b]) => a && b).map(([a, b]) => ({ a, b, ri, second: ri >= first.length })));
    const need = Object.fromEntries(list.map(t => [t, cnt[t] - k]));
    let gone = new Set();
    if (Object.values(need).some(x => x > 0)) {
      const seconds = edges.filter(e => e.second);
      let drops = pickDrops(seconds, need, r);
      if (drops) drops = drops.map(i => seconds[i]);
      else { drops = pickDrops(edges, need, r); if (drops) drops = drops.map(i => edges[i]); }
      if (!drops) continue;
      gone = new Set(drops);
    }
    const kept = edges.filter(e => !gone.has(e));
    // Pairs meeting twice keep their swapped home and away; balance the rest.
    const meets = {};
    for (const e of kept) meets[key(e.a, e.b)] = (meets[key(e.a, e.b)] || 0) + 1;
    const singles = kept.filter(e => meets[key(e.a, e.b)] === 1);
    for (const e of balanceHomes(singles, r, prefer)) { const o = singles.find(x => x.a === e.a && x.b === e.b && x.ri === e.ri); o.home = e.home; o.away = e.away; }
    const out = rounds.map(() => []);
    for (const e of kept) out[e.ri].push(e.home ? [e.home, e.away] : [e.a, e.b]);
    while (out.length && !out[out.length - 1].length) out.pop();
    return out;
  }
  throw new Error(`Couldn't give every team in a ${list.length}-team conference the same number of conference games.`);
}

// Circle-method round robin. Returns rounds of [a, b] pairs (null = bye).
export function roundRobin(teams, r) {
  const list = shuffle(teams, r);
  if (list.length % 2) list.push(null);
  const n = list.length, rounds = [];
  for (let k = 0; k < n - 1; k++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i], b = list[n - 1 - i];
      pairs.push(k % 2 ? [b, a] : [a, b]);
    }
    rounds.push(pairs);
    list.splice(1, 0, list.pop());
  }
  return rounds;
}

const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
// Conference rivals; independents are nobody's rivals.
const rival = (teams, a, b) => teams[a].conference === teams[b].conference && !isIndependent(teams[a].conference);

// Pair teams across conferences, avoiding repeat opponents when possible.
function crossPairs(pool, teams, met, r) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const left = shuffle(pool, r), pairs = [];
    let ok = true;
    while (left.length > 1) {
      const a = left.shift();
      let j = left.findIndex(b => !rival(teams, a, b) && !met.has(key(a, b)));
      if (j < 0) j = left.findIndex(b => !rival(teams, a, b));
      if (j < 0) { ok = false; break; }
      pairs.push([a, left.splice(j, 1)[0]]);
    }
    if (ok) return { pairs, idle: left };
  }
  return { pairs: [], idle: [...pool] };
}

// Pair teams across conferences for non-conference games: each team (in
// random order) takes the free opponent with the lowest cost, which is the
// distance between their homes, the gap in their ratings and some
// randomness, with a big penalty for a repeat opponent. `dist` is in miles.
function nearCross(pool, teams, met, r, dist) {
  const lvl = t => (teams[t].off ?? 65) * 0.4 + (teams[t].pit ?? 65) * 0.3 + (teams[t].def ?? 65) * 0.3;
  const left = shuffle(pool, r), pairs = [];
  while (left.length > 1) {
    const a = left.shift();
    let best = -1, bs = Infinity;
    left.forEach((b, j) => {
      if (rival(teams, a, b)) return;
      // Teams of a similar level, too: a Division I power rarely plays a
      // Division III school (about 40 miles a rating point).
      const c = dist(a, b) + r() * 700 + Math.abs(lvl(a) - lvl(b)) * 30 + (met.has(key(a, b)) ? 4000 : 0);
      if (c < bs) { bs = c; best = j; }
    });
    if (best >= 0) pairs.push([a, left.splice(best, 1)[0]]);
  }
  return pairs;
}

// Event sizes for n teams in `events` events, as even as possible.
export function eventSizes(n, events = Math.floor(n / 4)) {
  if (n < 3 || events < 1) return [];
  const base = Math.floor(n / events), extra = n % events;
  return Array.from({ length: events }, (_, i) => base + (i < extra ? 1 : 0));
}


// Neutral sites for preseason tournaments: [event name, arena, city].
export const EVENT_SITES = [
  ['Las Vegas Invitational', 'T-Mobile Arena', 'Las Vegas, Nev.'],
  ['Bahamas Showcase', 'Imperial Arena', 'Paradise Island, Bahamas'],
  ['Orlando Classic', 'Addition Financial Arena', 'Orlando, Fla.'],
  ['Brooklyn Classic', 'Barclays Center', 'Brooklyn, N.Y.'],
  ['Heartland Classic', 'T-Mobile Center', 'Kansas City, Mo.'],
  ['Gulf Coast Showcase', 'Suncoast Credit Union Arena', 'Fort Myers, Fla.'],
  ['Anaheim Classic', 'Honda Center', 'Anaheim, Calif.'],
  ['Charleston Classic', 'TD Arena', 'Charleston, S.C.'],
  ['New England Classic', 'Mohegan Sun Arena', 'Uncasville, Conn.'],
  ['Myrtle Beach Invitational', 'HTC Center', 'Conway, S.C.'],
  ['Fort Worth Classic', 'Dickies Arena', 'Fort Worth, Texas'],
  ['Sunshine Classic', 'Ocean Center', 'Daytona Beach, Fla.'],
  ['San Diego Showcase', 'Pechanga Arena', 'San Diego, Calif.'],
  ['Portland Invitational', 'Veterans Memorial Coliseum', 'Portland, Ore.'],
  ['Boardwalk Classic', 'Boardwalk Hall', 'Atlantic City, N.J.'],
  ['Windy City Classic', 'Wintrust Arena', 'Chicago, Ill.'],
  ['Cancún Challenge', 'Hard Rock Hotel Riviera Maya', 'Cancún, Mexico'],
  ['Music City Classic', 'Bridgestone Arena', 'Nashville, Tenn.'],
  ['Phoenix Classic', 'Footprint Center', 'Phoenix, Ariz.'],
  ['Hoops for the Holidays', 'Prudential Center', 'Newark, N.J.'],
];
// Holiday tournaments, the week before Christmas.
export const HOLIDAY_SITES = [
  ['Honolulu Holiday Classic', 'Stan Sheriff Center', 'Honolulu, Hawaii'],
  ['Las Vegas Holiday Hoops', 'MGM Grand Garden Arena', 'Las Vegas, Nev.'],
  ['Desert Holiday Classic', 'Acrisure Arena', 'Palm Desert, Calif.'],
];
// Neutral big-city arenas for December showcase games.
export const SHOWCASE_SITES = [
  ['Madison Square Garden', 'New York, N.Y.'], ['United Center', 'Chicago, Ill.'], ['Capital One Arena', 'Washington, D.C.'],
  ['State Farm Arena', 'Atlanta, Ga.'], ['Chase Center', 'San Francisco, Calif.'], ['Crypto.com Arena', 'Los Angeles, Calif.'],
  ['TD Garden', 'Boston, Mass.'], ['Little Caesars Arena', 'Detroit, Mich.'], ['Toyota Center', 'Houston, Texas'], ['Spectrum Center', 'Charlotte, N.C.'],
];
const lvl = t => (t.off ?? 65) * 0.4 + (t.pit ?? 65) * 0.3 + (t.def ?? 65) * 0.3;
// "Coastal Atlantic Conference" → "Coastal Atlantic", for challenge names.
const shortConf = c => c.replace(/ (Conference|League)$/, '');

export function generateSchedule(season, seed = hashStr(String(season.year)), prev = null) {
  const r = rng(seed);
  const teams = season.teams, year = season.year;
  const names = Object.keys(teams);
  const st = season.settings || {};
  const homeCount = Object.fromEntries(names.map(n => [n, 0]));
  const played = Object.fromEntries(names.map(n => [n, 0]));
  const met = new Set();
  const games = [];
  const REG = Math.max(CONF_START_WEEK + 1, st.regWeeks ?? DEFAULT_REG_WEEKS);
  season.regWeeks = REG;
  const cap = st.maxMatches ?? DEFAULT_MAX_MATCHES;
  // busy[t] = set of absolute day numbers (week * 7 + day) with a game.
  const busy = Object.fromEntries(names.map(n => [n, new Set()]));
  const abs = (week, day) => week * 7 + DAY_ORDER[day];
  const free = (t, a, rest = 1) => { for (let k = -rest; k <= rest; k++) if (busy[t].has(a + k)) return false; return true; };

  const hosts = new Map();
  for (const g of prev?.games || []) if (g.type === 'regular' && g.confGame) { const k = key(g.home, g.away); hosts.set(k, hosts.has(k) ? 'both' : g.home); }
  const orient = (a, b) => {
    // A much stronger team usually hosts (a buy game); otherwise even out
    // home games.
    const d = lvl(teams[a]) - lvl(teams[b]);
    if (Math.abs(d) >= 8 && r() < 0.8) return d > 0 ? [a, b] : [b, a];
    if (homeCount[a] > homeCount[b]) return [b, a];
    if (homeCount[a] < homeCount[b]) return [a, b];
    return r() < 0.5 ? [a, b] : [b, a];
  };
  const add = (week, day, home, away, extra = {}) => {
    games.push(blankGame(season, { week, day, order: DAY_ORDER[day], home, away, ...extra }));
    if (!extra.neutral) homeCount[home]++;
    played[home]++; played[away]++;
    met.add(key(home, away));
    busy[home].add(abs(week, day)); busy[away].add(abs(week, day));
  };

  // ---- conference play ----
  const byConf = {};
  for (const n of names) if (!isIndependent(teams[n].conference)) (byConf[teams[n].conference] ||= []).push(n);
  const window = [];
  for (let w = CONF_START_WEEK; w <= REG; w++) window.push(w);
  // Weeks that get a second conference game first (the opening week of
  // conference play gets one game when there's a choice).
  const doubleOrder = [...window.slice(1).filter((_, i) => i % 2 === 0), ...window.slice(1).filter((_, i) => i % 2 === 1), window[0]];
  const confGames = Object.fromEntries(names.map(n => [n, 0]));
  for (const [conf, list] of Object.entries(byConf).sort((a, b) => a[0].localeCompare(b[0]))) {
    if (list.length < 2) continue;
    const prefer = (a, b) => { const h = hosts.get(key(a, b)); return !h || h === 'both' ? 0 : h === a ? -1 : 1; };
    const maxRounds = window.length * PER_WEEK + PER_WEEK;
    const rounds = confRounds(list, maxRounds, r, st.confMatches ?? DEFAULT_CONF_MATCHES, prefer);
    while (rounds.length && !rounds[rounds.length - 1].length) rounds.pop();
    // Slots: [week, slot] in order. Early December takes what doesn't fit.
    const R = rounds.length, W = window.length;
    const per = Object.fromEntries(window.map(w => [w, 0]));
    let left = Math.min(R, W * PER_WEEK);
    for (const w of window) if (left > 0 && R >= W) { per[w] = 1; left--; }
    if (R < W) { for (const w of [...doubleOrder].reverse().slice(0, R)) per[w] = 1; left = 0; }
    for (const w of doubleOrder) if (left > 0 && per[w] < PER_WEEK) { per[w]++; left--; }
    const slots = [];
    for (let k = 0; k < R - W * PER_WEEK; k++) slots.push([EARLY_CONF_WEEK, k % PER_WEEK]);
    for (const w of window) { if (per[w] === 2) slots.push([w, 0], [w, 1]); else if (per[w] === 1) slots.push([w, 1]); }
    const days = seriesDays(confDaysOf(season, conf));
    rounds.forEach((pairs, i) => {
      const [week, slot] = slots[i];
      for (const [a, b] of pairs) if (a && b) { add(week, days[slot].day, a, b, { confGame: true, slot }); confGames[a]++; confGames[b]++; }
    });
  }

  const pts = Object.fromEntries(names.map(n => [n, cityPoint(teams[n].city)]));
  const dist = (a, b) => (pts[a] && pts[b] ? miles(pts[a], pts[b]) : 900);

  // ---- preseason tournaments: four teams, three games, neutral site ----
  const tourneyGames = Object.fromEntries(names.map(n => [n, 0]));
  {
    const order = names.map(n => [n, lvl(teams[n]) + (r() - 0.5) * 10]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
    const E = Math.floor(order.length / 4);
    const events = Array.from({ length: E }, () => []);
    // Fill events in order of level; a team goes to the first open event
    // without a conference rival.
    const spare = [];
    for (const t of order) {
      const i = events.findIndex(ev => ev.length < 4 && !ev.some(x => rival(teams, x, t)));
      if (i < 0) spare.push(t); else events[i].push(t);
    }
    // Swap spares into events that still have room.
    for (const t of spare.splice(0)) {
      let done = false;
      for (const ev of events) {
        if (ev.length >= 4 || done) continue;
        for (const other of events) {
          if (other === ev || done) continue;
          const j = other.findIndex(x => !ev.some(y => rival(teams, x, y)) && !other.some(y => y !== x && rival(teams, t, y)));
          if (j >= 0) { ev.push(other[j]); other[j] = t; done = true; }
        }
      }
      if (!done) spare.push(t);
    }
    const full = events.filter(ev => ev.length === 4);
    // Weeks: most at Thanksgiving, about a quarter the week before, a few
    // over the holidays.
    const holidayN = Math.min(HOLIDAY_SITES.length, Math.round(full.length * 0.12));
    const earlyN = Math.round(full.length * 0.25);
    const idx = shuffle(full.map((_, i) => i), r);
    const sites = shuffle(EVENT_SITES, r);
    // Thanksgiving: the fourth Thursday in November.
    const nov1 = new Date(Date.UTC(year, 10, 1)).getUTCDay();
    const thanks = weekDayOf(year, 10, 1 + ((4 - nov1 + 7) % 7) + 21).week;
    let si = 0, hi = 0, no = 1;
    idx.forEach((i, k) => {
      const ev = full[i];
      let slots, site; // slots: [week, day] for each of the three rounds
      if (k < holidayN) {
        // Holiday events: December 20 to 22.
        site = HOLIDAY_SITES[hi++];
        slots = [20, 21, 22].map(d => { const x = weekDayOf(year, 11, d); return [x.week, x.day]; });
      } else {
        site = sites[si++ % sites.length];
        const week = k < holidayN + earlyN ? thanks - 1 : thanks;
        const days = k < holidayN + earlyN ? (r() < 0.5 ? ['Thu', 'Fri', 'Sun'] : ['Fri', 'Sat', 'Sun']) : [['Mon', 'Tue', 'Wed'], ['Wed', 'Fri', 'Sat'], ['Fri', 'Sat', 'Sun']][Math.floor(r() * 3)];
        slots = days.map(d => [week, d]);
      }
      const id = `${year}-t${no++}`;
      const rounds = roundRobin(ev, r);
      rounds.forEach((pairs, j) => {
        const [week, day] = slots[j];
        pairs.filter(([a, b]) => a && b).forEach(([a, b], m) => {
          const [h, aw] = orient(a, b);
          add(week, day, h, aw, { neutral: true, venue: { stadium: site[1], city: site[2] }, tourney: id, label: site[0], order: DAY_ORDER[day] + m * 0.01 });
          tourneyGames[a]++; tourneyGames[b]++;
        });
      });
    });
  }

  // ---- conference challenge: conferences of similar strength pair off ----
  const challenge = Object.fromEntries(names.map(n => [n, 0]));
  if (st.challenge !== false) {
    const confs = Object.entries(byConf).filter(([, l]) => l.length >= 2)
      .map(([c, l]) => [c, l.reduce((s2, t) => s2 + lvl(teams[t]), 0) / l.length]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
    for (let i = 0; i + 1 < confs.length; i += 2) {
      const [A, B] = [confs[i], confs[i + 1]];
      const la = [...byConf[A]].sort((x, y) => lvl(teams[y]) - lvl(teams[x])), lb = [...byConf[B]].sort((x, y) => lvl(teams[y]) - lvl(teams[x]));
      const aHosts = hashStr(`${year}|${A}|${B}`) % 2 === 0;
      const label = `${shortConf(A)}–${shortConf(B)} Challenge`;
      for (let k = 0; k < Math.min(la.length, lb.length); k++) {
        const day = k % 2 ? 'Wed' : 'Tue';
        const [h, aw] = (k % 2 === 0) === aHosts ? [la[k], lb[k]] : [lb[k], la[k]];
        if (!free(h, abs(CHALLENGE_WEEK, day)) || !free(aw, abs(CHALLENGE_WEEK, day))) continue;
        add(CHALLENGE_WEEK, day, h, aw, { label });
        challenge[la[k]]++; challenge[lb[k]]++;
      }
    }
  }

  // ---- the rest of the non-conference schedule, any day of the week ----
  // Each team's games left under the cap, shared out over its open weeks.
  const lastWeekFor = t => {
    const ws = games.filter(g => g.confGame && (g.home === t || g.away === t) && g.week >= CONF_START_WEEK).map(g => g.week);
    return ws.length ? Math.min(...ws) - 1 : REG;
  };
  const WEIGHT = w => ({ 1: 3, 2: 2.6, 3: 2.2, 4: 2.2, 5: 1.4, 6: 2, 7: 1, 8: 1.6 }[w] ?? 1.4);
  const need = {}; // need[t][week]
  for (const t of names) {
    const budget = Math.max(0, cap - confGames[t] - tourneyGames[t] - challenge[t]);
    const last = lastWeekFor(t);
    const weeks = [];
    for (let w = 1; w <= last; w++) {
      const busyDays = [...busy[t]].filter(a => Math.floor(a / 7) === w).length;
      let wt = WEIGHT(w) - busyDays * 0.7;
      if (wt > 0.2) weeks.push([w, wt]);
    }
    const tot = weeks.reduce((s2, [, x]) => s2 + x, 0) || 1;
    const share = weeks.map(([w, x]) => [w, (budget * x) / tot]);
    const n = Object.fromEntries(share.map(([w, x]) => [w, Math.floor(x)]));
    let rest = budget - Object.values(n).reduce((a, b) => a + b, 0);
    for (const [w] of share.map(([w, x]) => [w, x - Math.floor(x) + r() * 0.3]).sort((a, b) => b[1] - a[1])) { if (rest <= 0) break; n[w]++; rest--; }
    need[t] = n;
  }
  const DAY_WEIGHT = { Mon: 0.8, Tue: 1.1, Wed: 1, Thu: 0.7, Fri: 1, Sat: 1.3, Sun: 1.1 };
  const carry = Object.fromEntries(names.map(n => [n, 0]));
  for (let week = 1; week <= REG; week++) {
    const want = Object.fromEntries(names.map(t => [t, (need[t][week] || 0) + (week <= lastWeekFor(t) ? carry[t] : 0)]));
    for (let d = 0; d < 7; d++) {
      const day = DAYS[d], a0 = abs(week, day);
      if (blackout(year, week, day)) continue;
      const pool = names.filter(t => {
        if (want[t] <= 0 || !free(t, a0)) return false;
        // Days still open to this team this week, to spread its games out.
        let open = 0;
        for (let e = d; e < 7; e++) if (!blackout(year, week, DAYS[e]) && free(t, abs(week, DAYS[e]))) open++;
        const p = open <= want[t] * 2 - 1 ? 1 : Math.min(1, (want[t] / Math.max(1, open / 2)) * DAY_WEIGHT[day] * 0.75);
        return r() < p;
      });
      for (const [a, b] of nearCross(pool, teams, met, r, dist)) {
        const [h, aw] = orient(a, b);
        // December showcases: good teams at a neutral big-city arena.
        const showcase = week >= CHALLENGE_WEEK && week < CONF_START_WEEK && lvl(teams[a]) >= 74 && lvl(teams[b]) >= 74 && r() < 0.3;
        if (showcase) {
          const s = SHOWCASE_SITES[hashStr(`${year}|${a}|${b}`) % SHOWCASE_SITES.length];
          add(week, day, h, aw, { neutral: true, venue: { stadium: s[0], city: s[1] }, label: 'Holiday Showcase' });
        } else add(week, day, h, aw);
        want[a]--; want[b]--;
      }
    }
    for (const t of names) carry[t] = Math.max(0, want[t]);
  }
  games.sort((a, b) => a.week - b.week || a.order - b.order);
  return games;
}
