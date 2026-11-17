# AAU Basketball

A college basketball dynasty set in 2030, women's and men's as two separate
dynasties behind a switch in the top bar, each with all 73 AAU schools in the
owner's eight conferences. It started as a copy of AAU Field Hockey (itself
from AAU Soccer, AAU Volleyball and the owner's MCS Dynasty) and keeps that
engine and its features, adapted to basketball.

**It is not synced with MCS Dynasty, SACAA Dynasty, AAU Volleyball, AAU
Soccer, AAU Field Hockey, AAU Softball & Baseball or AAU Dynasty.** Changes
here aren't ported to those repos, and theirs aren't ported here, unless the
owner asks.

## Basketball adaptations to keep in mind

- Game fields keep the MCS names: `homeLine`/`awayLine` are points per period
  (men's two halves, women's four quarters, then 5-minute overtimes),
  `homeR`/`awayR` points, `homeH`/`awayH` rebounds, `homeE`/`awayE`
  turnovers. `g.pk` is never set. A record's `rs`/`ra` are points for and
  against.
- Regulation periods come from `settings.periods` (2 men's, 4 women's);
  `setPeriods` in `js/sim.js` sets the live `QUARTERS` when a league loads.
  Never hardcode 2 or 4.
- **No ties:** overtime until someone leads. The tie fields stay from the
  soccer engine and are always 0.
- Ratings are stored as `off`, `pit`, `def` and shown as OFF, CTL (ball
  control and rebounding), DEF. OVR = 0.4/0.3/0.3.
- Every league has `league.sport = 'basketball'` so AAU History can detect it.
- Schedule (`js/schedule.js`): week 1 starts the first Monday in November
  (`dateOf`); 18 weeks. Non-conference games on any day (no back-to-back
  days, no Thanksgiving or Dec 24–26), four-team round-robin preseason
  tournaments at neutral sites (`g.venue`; each draws one team from each
  quarter of the field by rating), a conference challenge week,
  holiday showcases. Top-third teams play few non-conference games against
  each other (`MARQUEE` 400 per one a team already has, tournament and
  challenge games included). Conference play is a double round robin capped at
  `confMatches` (18), weeks 9–18 (early December for conferences needing more
  than 20 rounds), on each conference's days (`confWeekend[conf]`, else
  `settings.confDays`). Cap `maxMatches` 31.
- Postseason stages keep the MCS internal names: `regionals` = regions,
  `supers`, `mcws` = the Final Four. Default 4 regions of 8 (32 teams):
  `campusRounds: 1` puts the round of 32 at the higher seed's arena, then the
  Sweet 16 and Elite Eight at the region's neutral arena the next week
  (`homeWeeks: 2`). Region sites (`js/regions.js`, `regionSitesFor`): with
  `regionMode` 'rotate' (the default) each season takes the next arenas from
  `REGION_POOL`, the real regional sites since 2016 (men's by region: East,
  South, Midwest, West; women's 14 cities, regions named for them), every
  arena coming round before one repeats; 'fixed' uses `settings.regionSites`,
  picked per region on the Settings page. On the Selection tab the
  commissioner can send any region's top seed to another site ("Plays at";
  `post.siteFor`, team -> site; `siteOrder` swaps the two regions' sites;
  the bracket pairings don't change). Men's Final Four
  Saturday/Monday, women's Friday/Sunday. Conference tournaments take every
  team, single elimination on back-to-back days. User-facing text never says
  NCAA or MCWS.
- The team-sheet ranking is the NET (`net` in `js/standings.js`, dials in
  `NET_DIALS`: adjusted net efficiency and a Team Value Index, half each;
  the NCAA doesn't publish its weights) when `settings.index` is 'net' (the
  default; `indexVersion` 1 switched older saves from the current or next
  season on). It replaces the RPI in Tier 1 of the committee, the quadrants
  and the tiebreakers. `rating(season)` gives the season's ranking in the
  RPI's shape (value in `rpi`, plus `rank`, `sosRank`); use it, not `rpi()`,
  and `indexName(season)` for on-screen labels.
- The AAU look (Nov. 2026, ported from AAU Field Hockey, built to match the
  owner's mockups): a two-row top bar (brand row, then the menu); scoreboard
  cards (`gameCard`: the conference's color bar and logo, a row per team with
  each period and the final, the loser faded); standings with the conference
  list down the side (`st-*`), each conference in its colors (`confVars`,
  `confHead`; conference W-L, GB), All conferences compact, the last 5 (postseason
  included) opening the poll's game pop-up; the poll as a board (`pb-*`)
  beside movers, receiving votes and dropped out, under the No. 1 team's
  card; the team page header in the team's colors with title banners and a
  numbers strip (`teamHero`) and schedule boxes (`ts2-*`: one regular-season
  box, conference logo on conference games, a box per tournament, a venue
  column, the result opening the box score); Postseason → Full bracket
  (`renderBoard`). Navy `--board`, gold `--optic`; Oswald, Saira Condensed,
  Inter.
- On-screen text says "game".
- Women's and men's: `league.side` is 'women' or 'men', each with its own
  save key (`js/store.js`), team rows and coaches (`js/data.js`, edited
  directly) and default settings (`defaultSettings(side)`). Keep features
  shared; put differences in data or settings.
- Ratings come from the real 2025-26 season with the formula in `js/data.js`;
  coaches are the real 2026 head coaches. Say where data came from there.
- Regionals avoid first-round matchups between conference rivals
  (`avoidConferenceMatchups` in `js/postseason.js`, the owner's rule): after
  the serpentine, teams on one seed line trade regionals (lowest lines
  first), then, as a last resort, a team moves one seed line; the top line
  never moves. `pods(field, n, season)` applies it, so bracketology, the
  selection preview and the announced field agree. Bracketology and the
  preview show each regional's first-round matchups.
- The Greater South Conference (the owner's, coming in; Kansas, Missouri,
  Tulane, UAB, Vanderbilt, Iowa State, Saint Louis, Memphis) has its logo
  ready (`gsc.svg`, the owner's pick: slanted GSC, striped S, compass in the
  G; Saira Black): it's in the Add conference pick (`AAU_CONFERENCES`), and
  a Greater South made by hand gets it on load (`migrateLeague`).
- The Horizon Valley Conference (the owner's, coming in; Loyola Chicago, UIC,
  IU Indianapolis, UMKC, Missouri S&T, Cincinnati, Dayton, West Virginia,
  Ohio, Southern Illinois) has its logo ready the same way (`hvc.svg`, the
  owner's pick: slanted HVC in Archivo Expanded Black with white, orange and
  plum outlines, a striped orange sun rising behind).
- The Western Athletic Conference is coming back (the owner's; Northern
  Arizona, San Diego State, Nevada, UNLV, Oregon State, BYU, Utah State,
  Washington State) with the owner's pick for its logo, the 1992–2010 WAC
  logo linked from the web (`CONF_LOGO_LINKS.wac`), ready the same way.
- Realignment from AAU Dynasty (`js/realign.js`, Nov. 2026): the hub's
  Realignment page leaves a plan in localStorage `aau-realignment`; the
  Offseason page shows it (`realignBanner`) with a review where each move,
  join and leave can be unticked (`realignModal`). Only teams in the AAU's
  all-sports conferences move; schools join only if they play this sport
  (`AAU_PROGRAMS`), at `JOIN_RATING` (60) with their venue and logo; new
  conferences get their logo; empty ones can be retired. Applied or skipped
  is kept in `league.realign[planId]`.

## Before every commit

- `python3 tools/stamp.py`
- `sh tools/check.sh`
- `node tests/logic.test.mjs`
- `python3 tests/ui_test.py` (Playwright; Chromium is preinstalled)
