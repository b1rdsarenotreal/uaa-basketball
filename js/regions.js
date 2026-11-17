// Region sites for the national tournament.
import { hashStr, rng, shuffle } from './util.js?v=20261117005227';

// Arenas that have hosted the NCAA tournament's regionals (men's Sweet 16
// and Elite Eight sites, 2016–2026, by region; women's regional sites since
// 2016). With `regionMode` 'rotate' (the default) each season draws its
// region sites from these (`regionSitesFor`); 'fixed' keeps
// `settings.regionSites`, which the Settings page can set from this list.
export const REGION_POOL = {
  men: {
    East: [
      { stadium: 'Madison Square Garden', city: 'New York, N.Y.' },
      { stadium: 'TD Garden', city: 'Boston, Mass.' },
      { stadium: 'Capital One Arena', city: 'Washington, D.C.' },
      { stadium: 'Xfinity Mobile Arena', city: 'Philadelphia, Pa.' },
      { stadium: 'Prudential Center', city: 'Newark, N.J.' },
    ],
    South: [
      { stadium: 'State Farm Arena', city: 'Atlanta, Ga.' },
      { stadium: 'KFC Yum! Center', city: 'Louisville, Ky.' },
      { stadium: 'American Airlines Center', city: 'Dallas, Texas' },
      { stadium: 'Toyota Center', city: 'Houston, Texas' },
      { stadium: 'FedExForum', city: 'Memphis, Tenn.' },
      { stadium: 'Frost Bank Center', city: 'San Antonio, Texas' },
    ],
    Midwest: [
      { stadium: 'United Center', city: 'Chicago, Ill.' },
      { stadium: 'T-Mobile Center', city: 'Kansas City, Mo.' },
      { stadium: 'Little Caesars Arena', city: 'Detroit, Mich.' },
      { stadium: 'Lucas Oil Stadium', city: 'Indianapolis, Ind.' },
      { stadium: 'CHI Health Center', city: 'Omaha, Neb.' },
    ],
    West: [
      { stadium: 'Chase Center', city: 'San Francisco, Calif.' },
      { stadium: 'Crypto.com Arena', city: 'Los Angeles, Calif.' },
      { stadium: 'T-Mobile Arena', city: 'Las Vegas, Nev.' },
      { stadium: 'Honda Center', city: 'Anaheim, Calif.' },
      { stadium: 'SAP Center', city: 'San Jose, Calif.' },
    ],
  },
  women: [
    { name: 'Albany', stadium: 'MVP Arena', city: 'Albany, N.Y.' },
    { name: 'Spokane', stadium: 'Spokane Arena', city: 'Spokane, Wash.' },
    { name: 'Birmingham', stadium: 'Legacy Arena', city: 'Birmingham, Ala.' },
    { name: 'Sacramento', stadium: 'Golden 1 Center', city: 'Sacramento, Calif.' },
    { name: 'Fort Worth', stadium: 'Dickies Arena', city: 'Fort Worth, Texas' },
    { name: 'Portland', stadium: 'Moda Center', city: 'Portland, Ore.' },
    { name: 'Greenville', stadium: 'Bon Secours Wellness Arena', city: 'Greenville, S.C.' },
    { name: 'Seattle', stadium: 'Climate Pledge Arena', city: 'Seattle, Wash.' },
    { name: 'Greensboro', stadium: 'Greensboro Coliseum', city: 'Greensboro, N.C.' },
    { name: 'Chicago', stadium: 'Wintrust Arena', city: 'Chicago, Ill.' },
    { name: 'Wichita', stadium: 'Intrust Bank Arena', city: 'Wichita, Kan.' },
    { name: 'Lexington', stadium: 'Rupp Arena', city: 'Lexington, Ky.' },
    { name: 'Oklahoma City', stadium: 'Paycom Center', city: 'Oklahoma City, Okla.' },
    { name: 'Bridgeport', stadium: 'Total Mortgage Arena', city: 'Bridgeport, Conn.' },
  ],
};
const MEN_REGION_NAMES = ['East', 'South', 'Midwest', 'West'];
const poolSide = settings => (settings.periods === 2 ? 'men' : 'women');
// Every site in the pool for a side, for the Settings page's pickers.
export function regionChoices(settings) {
  const P = REGION_POOL[poolSide(settings)];
  return Array.isArray(P) ? P : Object.entries(P).flatMap(([name, l]) => l.map(x => ({ ...x, name })));
}
// The season's region sites, in region order. 'rotate' draws a different
// set each year, steadily (the same year always gets the same sites, and
// every arena in a list comes round before one repeats): men's
// regions keep their names (East, South, Midwest, West) and each draws an
// arena in its part of the country; women's regions are four of the cities.
export function regionSitesFor(season) {
  const st = season.settings || {}, fixed = st.regionSites || [];
  if ((st.regionMode || 'rotate') === 'fixed') return fixed;
  const n = Math.max(4, fixed.length);
  // Each list is put in a set order once (a shuffle seeded by its name),
  // then each year takes the next sites in that order, so every arena comes
  // round before any repeats.
  const pick = (list, salt, k) => {
    const order = shuffle(list, rng(hashStr(`regions|${salt}`)));
    return Array.from({ length: k }, (_, j) => order[(((season.year - 2030) * k + j) % order.length + order.length) % order.length]);
  };
  if (poolSide(st) === 'men') return Array.from({ length: n }, (_, i) => { const name = MEN_REGION_NAMES[i % 4]; return { name, ...pick(REGION_POOL.men[name], name, 1)[0] }; });
  return pick(REGION_POOL.women, 'women', n);
}

// Which site each region gets. Region i (the pod built around the i-th
// best 1 seed) plays at site i, unless the commissioner sent its top seed
// somewhere else on the Selection tab (`post.siteFor`: team -> site index);
// the region that had that site takes the moved region's.
export function siteOrder(season, pods) {
  const order = pods.map((_, i) => i), pick = season.post?.siteFor || {};
  pods.forEach((teams, i) => {
    const want = pick[teams[0]];
    if (want == null || want === order[i] || want < 0 || want >= pods.length) return;
    const j = order.indexOf(want);
    [order[i], order[j]] = [order[j], order[i]];
  });
  return order;
}
