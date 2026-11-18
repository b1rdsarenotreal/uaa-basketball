// Travel partners (the owner's ask, Nov. 2026): in a conference that plays
// two games a weekend, schools close to each other travel as a pair. One
// pair visits another for the weekend: on the first day each visitor plays
// one host, on the second they swap (USC at Arizona and UCLA at Arizona
// State, then USC at Arizona State and UCLA at Arizona). Partners meet on
// the weekend their pair has no other pair to play, or on a rivalry weekend
// when every pair has one. In a conference with an odd number of schools one
// school has no partner: it plays both schools of a pair in a weekend.
//
// Partners are picked by distance (`autoPartners`, the closest pairing
// overall) unless the commissioner set them (`settings.partners[conf]`, a
// list of [a, b]); `settings.partnersOff[conf]` turns them off for a
// conference. The schedule uses them when each team plays everyone at least
// once and at most twice; otherwise it falls back to the plain round robin.

import { cityPoint, miles } from './geo.js?v=20261117172925';
import { shuffle } from './util.js?v=20261117172925';

const KEY = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

// The pairing with the least total distance (exact for conferences up to 16
// schools); with an odd number one school is left without a partner.
export function autoPartners(list, teams) {
  const names = [...list].sort();
  const n = names.length;
  if (n < 2) return { pairs: [], solo: names[0] || null };
  const pts = names.map(t => cityPoint(teams[t]?.city));
  const d = (i, j) => (pts[i] && pts[j] ? miles(pts[i], pts[j]) : 900);
  if (n > 16) {
    // Too many for the exact search: closest pair first.
    const left = names.map((_, i) => i), pairs = [];
    while (left.length > 1) {
      let best = null;
      for (let x = 0; x < left.length; x++) for (let y = x + 1; y < left.length; y++) { const c = d(left[x], left[y]); if (!best || c < best[0]) best = [c, x, y]; }
      const [, x, y] = best; pairs.push([names[left[x]], names[left[y]]]); left.splice(y, 1); left.splice(x, 1);
    }
    return { pairs, solo: left.length ? names[left[0]] : null };
  }
  const odd = n % 2 === 1, memo = new Map();
  // best(mask): the cheapest way to pair everyone in mask (one may be left
  // out when the conference is odd).
  const best = (mask, skipUsed) => {
    if (mask === 0) return [0, []];
    const k = `${mask}|${skipUsed}`;
    if (memo.has(k)) return memo.get(k);
    let i = 0; while (!(mask & (1 << i))) i++;
    let out = [Infinity, []];
    const rest = mask & ~(1 << i);
    if (odd && !skipUsed) { const [c, p] = best(rest, true); if (c < out[0]) out = [c, [...p, [i]]]; }
    for (let j = i + 1; j < n; j++) if (rest & (1 << j)) {
      const [c, p] = best(rest & ~(1 << j), skipUsed);
      if (c + d(i, j) < out[0]) out = [c + d(i, j), [...p, [i, j]]];
    }
    memo.set(k, out);
    return out;
  };
  const [, parts] = best((1 << n) - 1, false);
  const pairs = parts.filter(p => p.length === 2).map(([i, j]) => [names[i], names[j]]);
  const solo = parts.find(p => p.length === 1);
  return { pairs, solo: solo ? names[solo[0]] : null };
}

// This conference's partners: the commissioner's pairs still in it, the rest
// paired by distance among themselves. null when turned off.
export function partnersOf(season, conf, list) {
  if (season.settings?.partnersOff?.[conf]) return null;
  const set = new Set(list), used = new Set(), pairs = [];
  for (const [a, b] of season.settings?.partners?.[conf] || []) {
    if (a !== b && set.has(a) && set.has(b) && !used.has(a) && !used.has(b)) { pairs.push([a, b]); used.add(a); used.add(b); }
  }
  const auto = autoPartners(list.filter(t => !used.has(t)), season.teams);
  return { pairs: [...pairs, ...auto.pairs], solo: auto.solo };
}

// Circle-method round robin of units (null = bye), in shuffled order.
function unitRoundRobin(units, r) {
  const list = shuffle(units, r);
  if (list.length % 2) list.push(null);
  const n = list.length, rounds = [];
  for (let k = 0; k < n - 1; k++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) pairs.push([list[i], list[n - 1 - i]]);
    rounds.push(pairs);
    list.splice(1, 0, list.pop());
  }
  return rounds;
}

// Conference rounds built from travel partners: rounds of [home, away]
// pairs, two to a weekend (rounds 2k and 2k + 1). `target` is the number of
// conference games each team should play: everyone once (n - 1), everyone
// twice (2(n - 1)), or in between, when some second meetings are left out
// (whole weekends where possible, so every team still plays `target`);
// null when it can't be built this way. Hosts are then chosen so every team
// is home for half its games (as near as the count allows), swapping hosts
// from last year where that costs nothing: `prefer(a, b)` is -1 if a hosted
// b last year (so b should host now), 1 the other way, 0 unknown.
export function partnerRounds(list, partners, target, r, prefer = () => 0) {
  const n = list.length;
  if (!partners || n < 4 || !partners.pairs.length || target < n - 1 || target > 2 * (n - 1)) return null;
  const units = [...partners.pairs.map(p => [...p]), ...(partners.solo ? [[partners.solo]] : [])];
  const unitRounds = unitRoundRobin(units, r);
  const allMeet = unitRounds.every(round => round.every(([u, v]) => u && v));
  // A leg: weekends of items. An item is a meeting of two units (the visitor
  // plays each host once) or partners playing each other, on the weekend
  // their pair has no one else, or on a rivalry weekend when every unit is
  // busy every weekend. `key` ties an item to its twin in the other leg.
  const legOf = leg => {
    const weekends = unitRounds.map(round => round.map(([u, v]) => {
      if (u && v) return { kind: 'meet', u, v, key: `${u.join('+')}#${v.join('+')}`, leg };
      const bye = u || v;
      return bye.length === 2 ? { kind: 'mates', u: bye, key: bye.join('+'), leg } : null;
    }).filter(Boolean));
    if (allMeet) weekends.splice(Math.floor(r() * (weekends.length + 1)), 0, units.filter(u => u.length === 2).map(u => ({ kind: 'mates', u, key: u.join('+'), leg })));
    return weekends;
  };
  const teamsIn = it => (it.kind === 'mates' ? [...it.u] : [...it.u.flatMap(() => it.v), ...it.v.flatMap(() => it.u)]);
  const legs = [legOf(0)];
  if (target > n - 1) {
    const second = legOf(1), drop = 2 * (n - 1) - target;
    if (drop > 0) {
      // Leave out second-leg items so every team loses exactly `drop` games,
      // emptying as many whole weekends as possible (fewer weekends to fit).
      const items = second.flat(), wkOf = new Map(second.flatMap((w, i) => w.map(it => [it, i])));
      let best = null;
      for (let attempt = 0; attempt < 24; attempt++) {
        const lose = Object.fromEntries(list.map(t => [t, 0])), gone = new Set();
        const rank = new Map(shuffle(second.map((_, i) => i), r).map((w, i) => [w, i]));
        const order = items.map((_, i) => i).sort((a, b) => rank.get(wkOf.get(items[a])) - rank.get(wkOf.get(items[b])) || teamsIn(items[b]).length - teamsIn(items[a]).length);
        let steps = 0;
        const search = k => {
          if (++steps > 20000) return false;
          if (list.every(t => lose[t] === drop)) return true;
          if (k >= order.length) return false;
          const it = items[order[k]], ts = teamsIn(it);
          if (ts.every(t => lose[t] + ts.filter(x => x === t).length <= drop)) {
            ts.forEach(t => lose[t]++); gone.add(it);
            if (search(k + 1)) return true;
            ts.forEach(t => lose[t]--); gone.delete(it);
          }
          return search(k + 1);
        };
        if (!search(0)) continue;
        const kept = second.map(w => w.filter(it => !gone.has(it))).filter(w => w.length);
        if (!best || kept.length < best.length) best = kept;
      }
      if (!best) return null;
      legs.push(best);
    } else legs.push(second);
  }
  // Hosts. One choice per item key: for a meeting, which unit hosts in leg 1
  // (the other hosts in leg 2); for partners, which one hosts in leg 1.
  const all = legs.flat(2), keys = [...new Set(all.map(it => it.key))];
  const pick = new Map(keys.map(k => [k, r() < 0.5]));
  const hostOf = it => { const f = pick.get(it.key) !== (it.leg === 1); return it.kind === 'meet' ? (f ? it.u : it.v) : (f ? it.u[0] : it.u[1]); };
  const homeCount = () => {
    const h = Object.fromEntries(list.map(t => [t, 0])), g = Object.fromEntries(list.map(t => [t, 0]));
    for (const it of all) {
      if (it.kind === 'mates') { h[hostOf(it)]++; g[it.u[0]]++; g[it.u[1]]++; continue; }
      const host = hostOf(it), away = host === it.u ? it.v : it.u;
      for (const t of host) { h[t] += away.length; g[t] += away.length; }
      for (const t of away) g[t] += host.length;
    }
    return { h, g };
  };
  // Last year's hosts: a meeting this year only once goes the other way.
  const lastCost = () => all.reduce((c, it) => {
    if (legs.length > 1 && all.filter(x => x.key === it.key).length > 1) return c;
    const host = hostOf(it);
    const [a, b] = it.kind === 'meet' ? [it.u[0], it.v[0]] : it.u;
    const hostIsA = it.kind === 'meet' ? host === it.u : host === a;
    const p = prefer(a, b);
    return c + ((p < 0 && hostIsA) || (p > 0 && !hostIsA) ? 1 : 0);
  }, 0);
  // Home for exactly half when every meeting comes twice; otherwise (one
  // meeting, or some second meetings left out) at most one game off half:
  // partners split their game, so they can't both be exact.
  const slack = target === 2 * (n - 1) ? 0 : 2;
  const cost = () => { const { h, g } = homeCount(); return list.reduce((c, t) => c + Math.max(0, Math.abs(2 * h[t] - g[t]) - Math.max(slack, g[t] % 2)) * 100, 0) + lastCost(); };
  let cur = cost();
  for (let pass = 0; pass < 60 && cur >= 100; pass++) {
    let moved = false;
    for (const k of shuffle(keys, r)) {
      pick.set(k, !pick.get(k));
      const c = cost();
      if (c < cur || (c === cur && r() < 0.2)) { if (c < cur) moved = true; cur = c; } else pick.set(k, !pick.get(k));
    }
    if (!moved && cur >= 100) for (const k of shuffle(keys, r).slice(0, 2)) pick.set(k, !pick.get(k)), cur = cost();
  }
  if (cur >= 100) return null;
  // Games: a meeting's visitors play each host once, swapping on day two;
  // partners play on the weekend's second day.
  const play = it => {
    if (it.kind === 'mates') { const h = hostOf(it); return [[], [[h, h === it.u[0] ? it.u[1] : it.u[0]]]]; }
    const host = hostOf(it), away = host === it.u ? it.v : it.u, d1 = [], d2 = [];
    if (host.length === 2 && away.length === 2) {
      const [h1, h2] = r() < 0.5 ? host : [host[1], host[0]];
      d1.push([h1, away[0]], [h2, away[1]]); d2.push([h2, away[0]], [h1, away[1]]);
    } else if (away.length === 1) { const h = r() < 0.5 ? host : [host[1], host[0]]; d1.push([h[0], away[0]]); d2.push([h[1], away[0]]); }
    else { const a = r() < 0.5 ? away : [away[1], away[0]]; d1.push([host[0], a[0]]); d2.push([host[0], a[1]]); }
    return [d1, d2];
  };
  const rounds = legs.flatMap(weekends => shuffle(weekends, r).flatMap(w => { const g = w.map(play); return [g.flatMap(x => x[0]), g.flatMap(x => x[1])]; }));
  const cnt = Object.fromEntries(list.map(t => [t, 0]));
  for (const round of rounds) for (const [a, b] of round) { cnt[a]++; cnt[b]++; }
  if (list.some(t => cnt[t] !== target)) return null;
  return rounds;
}
