// Basketball game simulator. Plays the game possession by possession from
// the teams' ratings: OFF (offense, stored as `off`), CTL (ball control and
// rebounding, `pit`) and DEF (defense, `def`). College rules (NCAA, 2026):
// - men's: two 20-minute halves; women's: four 10-minute quarters
//   (`settings.periods`, 2 or 4);
// - a game tied at the end of regulation goes to a 5-minute overtime, and
//   another, until one team is ahead. There are no ties.
//
// The result keeps the field names the rest of the app uses for every game:
// homeLine / awayLine are points per period (halves or quarters, then any
// overtimes), R is points, H is rebounds, E is turnovers and `innings` is the
// number of periods played. A simulation is only a suggestion — the
// commissioner reviews and saves it.

import { rng as makeRng } from './util.js?v=20261112194853';

export const OVR_WEIGHTS = { off: 0.4, pit: 0.3, def: 0.3 };
const ovrExact = t => t.off * OVR_WEIGHTS.off + t.pit * OVR_WEIGHTS.pit + t.def * OVR_WEIGHTS.def;
export function ovr(t) { return Math.round(ovrExact(t)); }

// Regulation periods for the league being shown (2 halves for men, 4 quarters
// for women). The app sets it when a league loads (setPeriods); simulations
// can also pass `periods`.
export let QUARTERS = 4;
export const OT = 5, OT_PERIODS = 6; // overtime minutes; the most overtimes a hand entry offers
export const REG_MINUTES = 40;
export function setPeriods(n) { QUARTERS = n === 2 ? 2 : 4; }
export const periodMinutes = n => REG_MINUTES / (n === 2 ? 2 : 4);

const PACE = 68;          // possessions per team per 40 minutes
const PPP = { 2: 1.05, 4: 0.96 }; // points per possession between equal teams (men's, women's)
const TALENT = 190;       // rating points per unit of log efficiency (lower = fewer upsets)
const HOME = 0.022;       // home court, on the log efficiency (about 3 points a game)

// Points per possession a team expects against this opponent.
function efficiency(att, opp, home, vol, periods) {
  const x = ((att.off - opp.def) * 0.65 + (att.pit - opp.pit) * 0.35) / TALENT / vol + (home ? HOME / 2 : -HOME / 2);
  return (PPP[periods] || PPP[4]) * Math.exp(x);
}

// Every basketball game is played to a finish.
export const isKnockout = () => true;

// One possession: a turnover, a free-throw trip, a three or a two. Make
// rates are scaled so a team scores `ppp` points a possession on average.
// A miss is rebounded by the defense (ending the possession) or, about 28%
// of the time, by the offense, who shoot again (a putback or a reset).
const EXPECTED = 1.24; // points per shot-ending possession at k = 1, offensive rebounds included
function possession(side, ppp, ctl, r, stats) {
  const other = side === 'home' ? 'away' : 'home';
  const pTO = Math.max(0.1, Math.min(0.24, 0.17 - (ctl - 70) / 900));
  if (r() < pTO) { stats[side].E++; return 0; }
  const k = ppp / (1 - pTO) / EXPECTED;
  const pOreb = Math.max(0.18, Math.min(0.38, 0.28 + (ctl - 70) / 600));
  for (let tries = 0; tries < 4; tries++) {
    const x = r();
    if (x < 0.12) { // free throws
      let p = 0;
      for (let i = 0; i < 2; i++) { if (r() < Math.min(0.92, 0.72 * Math.sqrt(k))) p++; }
      if (p === 2) return p;
      if (p === 1 || r() < 0.5) { stats[r() < 0.15 ? side : other].H++; return p; }
      if (r() < pOreb) { stats[side].H++; continue; }
      stats[other].H++; return p;
    }
    const three = x < 0.12 + 0.36;
    const make = Math.min(0.75, (three ? 0.34 : 0.5) * k);
    if (r() < make) return three ? 3 : 2;
    if (r() < pOreb) { stats[side].H++; continue; }
    stats[other].H++;
    return 0;
  }
  return 0;
}

function playPeriod(minutes, eff, ctl, r, stats) {
  const pts = { home: 0, away: 0 };
  const n = Math.max(1, Math.round(PACE * minutes / REG_MINUTES * (0.92 + r() * 0.16)));
  for (let i = 0; i < n; i++) {
    for (const side of ['home', 'away']) pts[side] += possession(side, eff[side], ctl[side], r, stats);
  }
  return pts;
}

export function simulateGame(homeTeam, awayTeam, game = {}, { seed, volatility = 1, periods = QUARTERS } = {}) {
  const r = makeRng(seed);
  const neutral = !!game.neutral;
  const eff = { home: efficiency(homeTeam, awayTeam, !neutral, volatility, periods), away: efficiency(awayTeam, homeTeam, false, volatility, periods) };
  if (neutral) eff.away *= Math.exp(HOME / 2), eff.home *= Math.exp(-HOME / 2);
  const ctl = { home: homeTeam.pit, away: awayTeam.pit };
  const stats = { home: { H: 0, E: 0 }, away: { H: 0, E: 0 } };
  const homeLine = [], awayLine = [];
  for (let q = 0; q < periods; q++) {
    const p = playPeriod(periodMinutes(periods), eff, ctl, r, stats);
    homeLine.push(p.home); awayLine.push(p.away);
  }
  const total = l => l.reduce((a, b) => a + b, 0);
  for (let ot = 0; total(homeLine) === total(awayLine); ot++) {
    const p = playPeriod(OT, eff, ctl, r, stats);
    if (ot >= 9 && p.home === p.away) p[r() < 0.5 ? 'home' : 'away'] += 1; // a guard: never ten overtimes
    homeLine.push(p.home); awayLine.push(p.away);
  }
  return {
    homeLine, awayLine,
    home: { R: total(homeLine), H: stats.home.H, E: stats.home.E },
    away: { R: total(awayLine), H: stats.away.H, E: stats.away.E },
    innings: homeLine.length, runRule: false, pk: null,
  };
}

// Rebounds and turnovers for a score entered by hand, from the points and
// both teams' ratings: about 35 rebounds and 12 turnovers in 40 minutes, a
// little more of the boards (and fewer turnovers) for the better CTL team.
export function estimateHitsErrors(homeTeam, awayTeam, game, homeLine, awayLine, { seed, periods = QUARTERS } = {}) {
  const r = makeRng(seed ?? 1);
  const minutes = REG_MINUTES + Math.max(0, homeLine.length - periods) * OT;
  const one = (me, opp) => {
    const lean = (me.pit - opp.pit) / 10;
    const H = Math.max(10, Math.round((35 + lean + r() * 8 - 4) * minutes / REG_MINUTES));
    const E = Math.max(2, Math.round((12 - lean / 2 + r() * 6 - 3) * minutes / REG_MINUTES));
    return { H, E };
  };
  return { home: one(homeTeam, awayTeam), away: one(awayTeam, homeTeam) };
}

// Home team's chance to win: the expected margin over a game, with a spread
// of about 13 points (a close fit to the simulator).
export function matchOdds(homeTeam, awayTeam, game = {}, { volatility = 1, periods = QUARTERS } = {}) {
  const neutral = !!game.neutral;
  let eh = efficiency(homeTeam, awayTeam, !neutral, volatility, periods), ea = efficiency(awayTeam, homeTeam, false, volatility, periods);
  if (neutral) ea *= Math.exp(HOME / 2), eh *= Math.exp(-HOME / 2);
  const margin = (eh - ea) * PACE * 0.92;
  const sd = 12.8 * Math.sqrt(volatility);
  const win = 1 / (1 + Math.exp(-1.7 * margin / sd));
  return { win, tie: 0, loss: 1 - win, margin };
}

export function winProbability(homeTeam, awayTeam, game = {}, opts = {}) {
  return matchOdds(homeTeam, awayTeam, game, opts).win;
}

// Slower check of the formula above by simulating the matchup.
export function simulatedWinRate(homeTeam, awayTeam, game = {}, opts = {}, n = 2000) {
  let wins = 0;
  for (let i = 0; i < n; i++) {
    const res = simulateGame(homeTeam, awayTeam, game, { ...opts, seed: i * 7919 + 1 });
    if (res.home.R > res.away.R) wins++;
  }
  return wins / n;
}
