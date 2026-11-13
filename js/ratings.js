// In-season rating movement. Each team keeps its preseason ratings in
// `base`; its current OFF / CTL / DEF (stored as off / pit / def) come from
// replaying every final game in order. A tie counts as half a win. Beating a better team (or losing to
// a worse one) moves ratings, and the part of the game that decided it gets
// most of the change (see `shares`). Because it's a replay, edited or
// cleared results always give consistent ratings.

import { winProbability, OVR_WEIGHTS } from './sim.js?v=20261112225223';
import { isFinal } from './standings.js?v=20261112225223';
import { clamp } from './util.js?v=20261112225223';

export const FORM_LEVELS = { none: 0, small: 0.45, normal: 0.8, big: 1.2 };
const KEYS = ['off', 'pit', 'def'];
const MAX_DRIFT = 10; // furthest a rating can move from preseason in one season

export function ensureBase(t) {
  if (!t.base) t.base = { off: t.off, pit: t.pit, def: t.def };
  return t.base;
}

// Change of rating `k` for one game. `surprise` = result − win chance
// (positive when the team did better than expected). The part of the game
// that decided it gets most of the change: points scored move OFF, winning
// the boards and the turnover battle moves CTL, and holding the other team
// down moves DEF. Per 40 minutes about 70 points, and even rebounds and
// turnovers, is average.
function shares(surprise, pts, oppPts, reb, oppReb, to, oppTo, minutes) {
  const n = Math.max(1, minutes / 40);
  const off = clamp((pts / n - 70) / 12, -1, 1), pit = clamp(((reb - oppReb) / 8 + (oppTo - to) / 5) / n, -1, 1), def = clamp((70 - oppPts / n) / 12, -1, 1);
  const sign = surprise >= 0 ? 1 : -1;
  const w = [Math.max(0.15, 0.5 + (sign * off) / 2), Math.max(0.15, 0.5 + (sign * pit) / 2), Math.max(0.15, 0.5 + (sign * def) / 2)];
  // Scale so the overall rating (OVR) moves by `surprise` × level.
  const ovrShare = OVR_WEIGHTS.off * w[0] + OVR_WEIGHTS.pit * w[1] + OVR_WEIGHTS.def * w[2];
  return w.map(x => x / ovrShare);
}

export function replayRatings(season) {
  const level = FORM_LEVELS[season.settings.form ?? 'normal'] ?? FORM_LEVELS.normal;
  const cur = {};
  for (const [name, t] of Object.entries(season.teams)) cur[name] = { ...ensureBase(t) };
  if (level) {
    const games = season.games.filter(isFinal).sort((a, b) => a.week - b.week || a.order - b.order || a.id - b.id);
    for (const g of games) {
      const h = cur[g.home], a = cur[g.away];
      if (!h || !a) continue;
      const periods = season.settings.periods ?? 4;
      const p = winProbability(h, a, g, { periods });
      const s = (g.homeR > g.awayR ? 1 : g.homeR === g.awayR ? 0.5 : 0) - p;
      const minutes = 40 + Math.max(0, (g.homeLine?.length || periods) - periods) * 5;
      for (const [r, sur, pts, opp, reb, oreb, to, oto, name] of [[h, s, g.homeR, g.awayR, g.homeH ?? 35, g.awayH ?? 35, g.homeE ?? 12, g.awayE ?? 12, g.home], [a, -s, g.awayR, g.homeR, g.awayH ?? 35, g.homeH ?? 35, g.awayE ?? 12, g.homeE ?? 12, g.away]]) {
        const sh = shares(sur, pts, opp, reb, oreb, to, oto, minutes);
        const base = season.teams[name].base;
        KEYS.forEach((k, i) => { r[k] = clamp(r[k] + level * sur * sh[i], base[k] - MAX_DRIFT, base[k] + MAX_DRIFT); });
      }
    }
  }
  for (const [name, t] of Object.entries(season.teams)) {
    for (const k of KEYS) t[k] = clamp(Math.round(cur[name][k]), 40, 99);
  }
}

// The commissioner sets a rating: shift the preseason base so the current
// value becomes `value` after results are replayed.
export function setRating(t, k, value) {
  ensureBase(t);
  t.base[k] = clamp(t.base[k] + (value - t[k]), 30, 109);
  t[k] = value;
}
