// Records, conference standings with tiebreakers, the RPI and the NET.

import { pct, hashStr } from './util.js?v=20261110235151';

export const isFinal = g => g.final && g.homeR != null && g.awayR != null;
// Basketball has no ties: a game tied after regulation goes to overtime
// until someone leads. (A tied score can only come from an unfinished hand
// entry; `pk` is never set and stays from the shared engine.)
export const isTie = g => g.homeR === g.awayR && !g.pk;
// Who won (or, after penalties, advanced); null for a regular-season tie.
export const winnerOf = g => (g.homeR > g.awayR ? g.home : g.homeR < g.awayR ? g.away : g.pk ? (g.pk.home > g.pk.away ? g.home : g.away) : null);
export const loserOf = g => { const w = winnerOf(g); return w == null ? null : w === g.home ? g.away : g.home; };
// 'W' or 'L' for team t, 'T' only for a tied (unfinished) entry.
export const resultFor = (g, t) => (isTie(g) ? 'T' : winnerOf(g) === t ? 'W' : 'L');
// Points for a result: 3 a win, 1 a tie.
export const POINTS = { W: 3, T: 1, L: 0 };
// Conference points from a record.
export const confPts = r => 3 * r.cw + r.ct;

function blank() {
  return { w: 0, l: 0, t: 0, cw: 0, cl: 0, ct: 0, hw: 0, hl: 0, ht: 0, aw: 0, al: 0, at: 0, nw: 0, nl: 0, nt: 0, rs: 0, ra: 0, streak: '', results: [] };
}

// filter(g) narrows which games count (e.g. through a given week).
export function records(season, filter = null) {
  const out = {};
  for (const t of Object.keys(season.teams)) out[t] = blank();
  const games = season.games.filter(g => isFinal(g) && (!filter || filter(g))).sort((a, b) => a.week - b.week || a.order - b.order || a.id - b.id);
  for (const g of games) {
    for (const [t, rs, ra, where] of [[g.home, g.homeR, g.awayR, g.neutral ? 'n' : 'h'], [g.away, g.awayR, g.homeR, g.neutral ? 'n' : 'a']]) {
      const r = out[t];
      if (!r) continue;
      const res = resultFor(g, t), k = res.toLowerCase();
      r[k]++;
      r[where + k]++;
      if (g.type === 'regular' && g.confGame) r['c' + k]++;
      r.rs += rs; r.ra += ra;
      r.results.push(res);
    }
  }
  for (const r of Object.values(out)) {
    const res = r.results;
    if (res.length) {
      const last = res[res.length - 1];
      let n = 0;
      for (let i = res.length - 1; i >= 0 && res[i] === last; i--) n++;
      r.streak = `${last}${n}`;
    }
  }
  return out;
}

// The ranking the committee sorts by: the NET by default, the RPI in older
// seasons (settings.index). Both come back in the same shape, the ranking
// value in `rpi` (the shared code's name for it), with `rank` and `sosRank`.
export const usesNet = season => season?.settings?.index === 'net';
export const indexName = season => (usesNet(season) ? 'NET' : 'RPI');
export function rating(season, filter = null) {
  return usesNet(season) ? net(season, filter) : rpi(season, filter);
}

// The NET (NCAA Evaluation Tool), as the NCAA has described it since 2020:
// two parts, the Team Value Index (results: who you beat, where) and adjusted
// net efficiency (points scored minus allowed per 100 possessions, adjusted
// for the opponents and where the games were played). The NCAA doesn't
// publish the formula or the weights, so these dials are ours:
// - eff / tvi: how much each part counts in the NET (half each);
// - pace: possessions a team has in 40 minutes (the sim's), +5 minutes' worth
//   per overtime, used to turn a score into points per 100 possessions;
// - prior: a team's efficiency starts as if it had played this many games
//   against an average team, so a few early blowouts don't run away with it;
// - sigma: how many points one game can swing either way, for the TVI.
// The TVI is wins above bubble per game: each win is worth the chance a
// bubble team (the one at the field's last spot in efficiency) would have
// lost that game, at that site; each loss costs the chance it would have won.
export const NET_DIALS = { eff: 0.5, tvi: 0.5, pace: 68, prior: 2, sigma: 11 };

function normCdf(x) {
  // Abramowitz and Stegun 7.1.26
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

export function net(season, filter = null, dials = { ...NET_DIALS, ...(season.settings?.net || {}) }) {
  const D = dials;
  const periods = season.settings?.periods === 2 ? 2 : 4;
  const teams = Object.keys(season.teams), n = teams.length;
  const games = season.games.filter(g => isFinal(g) && !isTie(g) && (!filter || filter(g)) && season.teams[g.home] && season.teams[g.away]);
  // Each game from the home team's side: margin per 100 possessions and
  // where it was played (+1 home, 0 neutral, -1 away).
  const rows = games.map(g => {
    const ot = Math.max(0, (g.homeLine?.length || periods) - periods);
    const poss = D.pace * (40 + 5 * ot) / 40;
    const loc = gameLocation(g, g.home);
    return { g, h: g.home, a: g.away, m: (g.homeR - g.awayR) / poss * 100, loc: loc === 'home' ? 1 : loc === 'away' ? -1 : 0 };
  });
  const by = Object.fromEntries(teams.map(t => [t, []]));
  for (const r of rows) { by[r.h].push({ o: r.a, m: r.m, loc: r.loc, won: r.m > 0, g: r.g }); by[r.a].push({ o: r.h, m: -r.m, loc: -r.loc, won: r.m < 0, g: r.g }); }
  // Adjusted net efficiency: margin = a_team - a_opp + home edge, solved by
  // passes until it settles; the home edge comes from the games themselves.
  let a = Object.fromEntries(teams.map(t => [t, 0])), hca = 0;
  for (let it = 0; it < 300; it++) {
    let diff = 0;
    for (const t of teams) {
      const gs = by[t];
      const v = gs.reduce((s, x) => s + x.m - x.loc * hca + a[x.o], 0) / (gs.length + D.prior);
      diff = Math.max(diff, Math.abs(v - a[t])); a[t] = v;
    }
    const sited = rows.filter(r => r.loc);
    hca = sited.length ? sited.reduce((s, r) => s + r.loc * (r.m - (a[r.h] - a[r.a])), 0) / sited.length : 0;
    if (diff < 1e-5) break;
  }
  const mean = teams.reduce((s, t) => s + a[t], 0) / (n || 1);
  for (const t of teams) a[t] -= mean;
  // The bubble team: the field's last spot in efficiency.
  const cfg = season.settings?.ncaa || {};
  const size = cfg.regionals ? cfg.regionals * cfg.perRegional : cfg.wsSize || 32;
  const effOrder = [...teams].sort((x, y) => a[y] - a[x]);
  const bubble = a[effOrder[Math.min(n - 1, Math.max(0, size - 1))]] ?? 0;
  const out = {};
  for (const t of teams) {
    const gs = by[t];
    let tvi = 0;
    for (const x of gs) {
      // The bubble team's expected margin in this game, in points.
      const pts = (bubble - a[x.o] + x.loc * hca) * D.pace / 100;
      const pWin = normCdf(pts / D.sigma);
      tvi += x.won ? 1 - pWin : -pWin;
    }
    out[t] = {
      eff: a[t], tvi, tviPer: gs.length ? tvi / gs.length : 0,
      sos: gs.length ? gs.reduce((s, x) => s + a[x.o], 0) / gs.length : 0,
      games: gs.length, w: gs.filter(x => x.won).length, l: gs.filter(x => !x.won).length,
    };
  }
  // The NET: both parts as z-scores, weighted by the dials.
  const played = teams.filter(t => out[t].games);
  const z = k => {
    const v = played.map(t => out[t][k]), m = v.reduce((s, x) => s + x, 0) / (v.length || 1);
    const sd = Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length || 1)) || 1;
    return t => (out[t][k] - m) / sd;
  };
  const ze = z('eff'), zt = z('tvi');
  for (const t of teams) out[t].rpi = out[t].games ? D.eff * ze(t) + D.tvi * zt(t) : -99;
  const rankBy = (k, field) => played.sort((x, y) => out[y][k] - out[x][k]).forEach((t, i) => { out[t][field] = i + 1; });
  rankBy('eff', 'effRank'); rankBy('tvi', 'tviRank'); rankBy('sos', 'sosRank'); rankBy('rpi', 'rank');
  Object.defineProperty(out, 'homeEdge', { value: hca * D.pace / 100 }); // points a game
  return out;
}

// Rating Percentage Index: 25% winning pct, 50% opponents' winning pct
// (excluding games against the team), 25% opponents' opponents' pct.
export function rpi(season, filter = null) {
  const games = season.games.filter(g => isFinal(g) && (!filter || filter(g)));
  const teams = Object.keys(season.teams);
  const opps = {}, wl = {}, vs = {};
  for (const t of teams) { opps[t] = []; wl[t] = { w: 0, n: 0 }; vs[t] = {}; }
  for (const g of games) {
    for (const [t, o] of [[g.home, g.away], [g.away, g.home]]) {
      if (!wl[t]) continue;
      // A win counts 1, a tie half.
      const x = { W: 1, T: 0.5, L: 0 }[resultFor(g, t)];
      wl[t].n++; wl[t].w += x;
      opps[t].push(o);
      const v = (vs[t][o] ||= { w: 0, n: 0 });
      v.n++; v.w += x;
    }
  }
  const wp = t => (wl[t]?.n ? wl[t].w / wl[t].n : 0);
  const wpExcl = (o, t) => {
    const a = wl[o]; if (!a) return 0;
    const v = vs[o][t] || { w: 0, n: 0 };
    const n = a.n - v.n;
    return n > 0 ? (a.w - v.w) / n : 0;
  };
  const owp = {};
  for (const t of teams) owp[t] = opps[t].length ? opps[t].reduce((s, o) => s + wpExcl(o, t), 0) / opps[t].length : 0;
  const out = {};
  for (const t of teams) {
    const oowp = opps[t].length ? opps[t].reduce((s, o) => s + (owp[o] ?? 0), 0) / opps[t].length : 0;
    // Strength of schedule: opponents' winning pct (2/3) and their
    // opponents' (1/3), the NCAA's usual SOS formula.
    let ow = 0, ol = 0;
    for (const o of new Set(opps[t])) {
      const times = opps[t].filter(x => x === o).length, a = wl[o], v = vs[o][t] || { w: 0, n: 0 };
      if (!a) continue;
      ow += times * (a.w - v.w); ol += times * ((a.n - v.n) - (a.w - v.w));
    }
    out[t] = { wp: wp(t), owp: owp[t], oowp, rpi: 0.25 * wp(t) + 0.5 * owp[t] + 0.25 * oowp, sos: (2 * owp[t] + oowp) / 3, oppW: ow, oppL: ol, games: wl[t].n };
  }
  const ranked = teams.filter(t => out[t].games).sort((a, b) => out[b].rpi - out[a].rpi);
  ranked.forEach((t, i) => { out[t].rank = i + 1; });
  teams.filter(t => out[t].games).sort((a, b) => out[b].sos - out[a].sos).forEach((t, i) => { out[t].sosRank = i + 1; });
  return out;
}

// NCAA team-sheet quadrants. A game's quadrant depends on the opponent's RPI
// rank and where it was played, as on the NCAA's own sheets. These are the
// cut-offs for a 300-team league; they scale with league size (quadCuts):
//   Q1: home 1-30, neutral 1-50, away 1-75
//   Q2: home 31-75, neutral 51-100, away 76-135
//   Q3: home 76-160, neutral 101-200, away 136-240
//   Q4: everything else
// `rec[i]` is each team's record in Quadrant i+1. `q` is the quadrant a home
// game against the team would count as (used for display).
export const QUAD_CUTS = { home: [30, 75, 160], neutral: [50, 100, 200], away: [75, 135, 240] };
export function gameLocation(g, t) {
  if (g.site) return g.site === t ? 'home' : 'away';
  if (g.neutral) return 'neutral';
  return g.home === t ? 'home' : 'away';
}
// The cut-offs for a league of `teamCount` teams, by location.
export function quadCuts(teamCount = 300) {
  const k = teamCount / 300;
  return Object.fromEntries(Object.entries(QUAD_CUTS).map(([loc, cuts]) => [loc, cuts.map(c => Math.max(1, Math.round(c * k)))]));
}
export function quadOf(rank, loc, teamCount = 300) {
  if (!rank) return 4;
  const all = quadCuts(teamCount), cuts = all[loc] || all.neutral;
  const i = cuts.findIndex(c => rank <= c);
  return i < 0 ? 4 : i + 1;
}
export function quadrants(season, r = rating(season), filter = null) {
  const teams = Object.keys(season.teams), n = teams.length;
  const out = {};
  for (const t of teams) out[t] = { q: quadOf(r[t]?.rank, 'home', n), rec: [0, 1, 2, 3].map(() => ({ w: 0, l: 0, t: 0 })) };
  for (const g of season.games) {
    if (!isFinal(g) || (filter && !filter(g))) continue;
    for (const [t, o] of [[g.home, g.away], [g.away, g.home]]) {
      if (!out[t] || !out[o]) continue;
      const x = out[t].rec[quadOf(r[o]?.rank, gameLocation(g, t), n) - 1];
      x[resultFor(g, t).toLowerCase()]++;
    }
  }
  return out;
}

// One number for a team's quadrant résumé: wins count more the better the
// quadrant, losses cost more the worse the quadrant, and a tie is half of
// each.
export const QUAD_WIN = [4, 2, 1, 0.25], QUAD_LOSS = [0, 0.5, 2, 4];
export function quadScore(x) {
  return x.rec.reduce((a, q, i) => a + (q.w + (q.t || 0) / 2) * QUAD_WIN[i] - (q.l + (q.t || 0) / 2) * QUAD_LOSS[i], 0);
}

// Conference games only: each team's record against a set of opponents.
function recordVs(season, teams, opps) {
  const tset = new Set(teams), oset = new Set(opps), res = {};
  for (const t of teams) res[t] = { w: 0, l: 0, t: 0 };
  for (const g of season.games) {
    if (!isFinal(g) || g.type !== 'regular' || !g.confGame) continue;
    for (const [t, o] of [[g.home, g.away], [g.away, g.home]]) {
      if (!tset.has(t) || !oset.has(o) || t === o) continue;
      res[t][resultFor(g, t).toLowerCase()]++;
    }
  }
  return res;
}

// Split `group` into tiers by a score (higher first). Returns null when the
// score doesn't separate anyone.
function tiers(group, score) {
  const vals = new Map(group.map(t => [t, score(t)]));
  const distinct = [...new Set(vals.values())].sort((a, b) => b - a);
  if (distinct.length < 2) return null;
  return distinct.map(v => group.filter(t => vals.get(t) === v));
}

export const TIEBREAKERS = [
  'Conference points (3 for a win, 1 for a tie)',
  'Head-to-head points among all the tied teams (teams still tied start over with head-to-head among just them)',
  'Points against common conference opponents, starting with the highest-placed opponent and working down',
  'NET (the RPI in seasons before the switch)',
  'Coin flip',
];

// Points per game from a record (3 a win, 1 a tie).
const ppm = x => { const n = x.w + x.l + x.t; return n ? (3 * x.w + x.t) / n : 0; };
// Order teams tied on conference points. Each step that splits
// the group sends every smaller group that is still tied back to
// head-to-head. `why[t]` records the step that last separated a team.
function breakTie(season, conf, group, others, r, why) {
  if (group.length < 2) return group;
  const recurse = (split, label) => split.flatMap(sub => {
    if (sub.length === 1) { why[sub[0]] = label; return sub; }
    for (const t of sub) why[t] = label;
    return breakTie(season, conf, sub, others, r, why);
  });
  // Head-to-head, only when every tied team has played the others.
  const hh = recordVs(season, group, group);
  if (group.every(t => hh[t].w + hh[t].l + hh[t].t > 0)) {
    const split = tiers(group, t => ppm(hh[t]));
    if (split) return recurse(split, { step: 'h2h', text: 'Head-to-head' });
  }
  // Common opponents, from the top of the standings down. Opponents tied
  // with each other are taken together.
  const vs = t => new Set(season.games.filter(g => isFinal(g) && g.type === 'regular' && g.confGame && (g.home === t || g.away === t)).map(g => (g.home === t ? g.away : g.home)));
  const played = group.map(vs);
  for (const block of others) {
    const common = block.filter(o => played.every(p => p.has(o)));
    if (!common.length) continue;
    const rec = recordVs(season, group, common);
    const split = tiers(group, t => ppm(rec[t]));
    if (split) return recurse(split, { step: 'common', text: `Record vs ${common.join(', ')}` });
  }
  const byRpi = tiers(group, t => r[t]?.rpi ?? 0);
  if (byRpi) return recurse(byRpi, { step: 'rpi', text: indexName(season) });
  // Coin flip: fixed for the season, so the order doesn't change on reload.
  const flip = t => hashStr(`${season.year}|${conf}|${[...group].sort().join('|')}|${t}`);
  for (const t of group) why[t] = { step: 'coin', text: 'Coin flip' };
  return [...group].sort((a, b) => flip(a) - flip(b));
}

// Conference table, best first, with points (3 a win, 1 a tie) and points
// behind the leader (`gb`). Each row's `tb` says which tiebreaker placed it,
// when it was tied. Every member plays the same number of conference games,
// so points rank fairly.
export function confStandings(season, conf, recs = records(season), r = rating(season)) {
  const teams = Object.values(season.teams).filter(t => t.conference === conf).map(t => t.school);
  const cp = t => confPts(recs[t]);
  const groups = [];
  for (const t of [...teams].sort((a, b) => cp(b) - cp(a) || a.localeCompare(b))) {
    const last = groups[groups.length - 1];
    if (last && cp(last[0]) === cp(t)) last.push(t); else groups.push([t]);
  }
  const why = {};
  const out = groups.flatMap(g => breakTie(season, conf, g, groups.filter(x => x !== g), r, why));
  const lead = out[0];
  return out.map(t => ({
    team: t, ...recs[t],
    pts: confPts(recs[t]),
    gb: lead ? confPts(recs[lead]) - confPts(recs[t]) : 0,
    rpiRank: r[t]?.rank ?? null,
    tb: why[t] || null,
  }));
}

// Independent teams belong to no conference: no conference games, title,
// tournament or automatic bid.
export const INDEPENDENT = 'Independent';
export const isIndependent = c => c === INDEPENDENT;
// Conference rivals (independents are never rivals of each other).
export const sameConf = (teams, a, b) => teams[a]?.conference === teams[b]?.conference && !isIndependent(teams[a]?.conference);

export function conferences(season) {
  return [...new Set(Object.values(season.teams).map(t => t.conference))].filter(c => !isIndependent(c)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function regularSeasonDone(season) {
  return season.games.filter(g => g.type === 'regular').every(isFinal);
}

// Regular-season champions: every team tied for the most conference points
// shares the title (a commissioner override names one champion).
export function regSeasonChamps(season, conf, recs = records(season, g => g.type === 'regular'), r = rating(season, g => g.type === 'regular')) {
  if (isIndependent(conf)) return [];
  if (season.overrides?.regChamps?.[conf]) return [season.overrides.regChamps[conf]];
  const st = confStandings(season, conf, recs, r);
  if (!st.length || st[0].cw + st[0].cl + st[0].ct === 0) return [];
  const best = st[0].pts;
  return st.filter(x => x.cw + x.cl + x.ct > 0 && x.pts === best).map(x => x.team);
}

// The one team that takes the top spot: the regular-season champion, or the
// co-champion that wins the tiebreakers (commissioner override wins). This is
// the tournament's top seed and, with no tournament, the automatic bid.
export function regSeasonChamp(season, conf, recs, r) {
  if (season.overrides?.regChamps?.[conf]) return season.overrides.regChamps[conf];
  const st = confStandings(season, conf, recs, r);
  return st.length && (st[0].cw + st[0].cl + st[0].ct) > 0 ? st[0].team : null;
}
