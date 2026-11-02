# AAU Basketball

A commissioner-style college basketball dynasty. It's 2030: the NCAA has
collapsed and the **Association of American Universities** runs college
athletics. Every one of the **73 AAU members** plays basketball, women's and
men's, as **two separate dynasties** behind the switch in the top bar (each
with its own save). It has box scores by half or quarter, overtime, a real
basketball calendar (non-conference games any day of the week, preseason
tournaments, conference play from New Year's), standings, the RPI, a voters'
poll, conference tournaments, a 32-team **AAU National Tournament** through
the **Final Four**, coaches, the offseason and a record book.

It's built on the MCS Dynasty engine (by way of AAU Soccer and AAU Field
Hockey) and works the same way, with basketball's rules, schedule and
tournament.

Open `index.html` through any static web server (GitHub Pages works: Settings
→ Pages → Deploy from a branch → `main`, `/ (root)`). The dynasties save in
the browser; **Settings → Download backup** keeps a copy or moves it to
another device. AAU History reads these backups (they carry
`sport: 'basketball'`).

## The league

The teams start in the owner's conference alignment from the AAU Dynasty,
each conference with a drawn logo:

| Conference | Teams |
|---|---|
| Big Ten | Illinois, Indiana, Iowa, Michigan, Michigan State, Minnesota, Northwestern, Ohio State, Penn State, Purdue, Wisconsin |
| Coastal Atlantic Conference | Duke, Florida, Georgia Tech, Maryland, Miami, North Carolina, Notre Dame, South Florida, Virginia |
| Ivy League | Brown, Columbia, Cornell, Dartmouth, Harvard, Penn, Princeton, Yale |
| Metro Conference | Boston University, Buffalo, George Washington, Georgetown, McGill, Pittsburgh, Rutgers, Stony Brook, Toronto |
| Pacific-10 Conference | Arizona, Arizona State, California, Colorado, Oregon, Stanford, UCLA, USC, Utah, Washington |
| Southwest Conference | Kansas, Missouri, Rice, Texas, Texas A&M, Tulane, UAB, Vanderbilt |
| UC Athletic Association | Caltech, UC Davis, UC Irvine, UC Riverside, UC San Diego, UC Santa Barbara, UC Santa Cruz |
| University Athletic Association | Brandeis, Carnegie Mellon, Case Western, Chicago, Emory, Johns Hopkins, MIT, NYU, Rochester, Tufts, WashU (Division III) |

Every team has its school's real colors, its real 2026 head coach (a few
Division III jobs start open) and its real home arena.

## Ratings

Three ratings from 40 to 99: **OFF** (offense), **CTL** (ball control and
rebounding) and **DEF** (defense). **OVR = 40% OFF + 30% CTL + 30% DEF.**
Starting ratings come from the real 2025-26 season: conference strength, plus
conference record, plus how far the team went in the NCAA tournament. Michigan
(men's champion) and UCLA (women's champion) start on top. `js/data.js`
lists the formula and sources. Ratings move with results during the season
and develop between seasons.

## Games

- **Men's: two 20-minute halves. Women's: four 10-minute quarters.** Played
  possession by possession: about 72 points a team for men and 66 for women,
  with rebounds and turnovers.
- **No ties:** a game tied after regulation plays 5-minute overtimes until
  someone leads.
- **Entering a score:** points per half or quarter (add overtimes when tied);
  rebounds and turnovers left blank are estimated.

## The season

Eighteen weeks from the first Monday in November to early March.

- **Non-conference games any day of the week**, most in November, fewer
  during December exams, none on Thanksgiving or December 24–26. Opponents
  are nearby teams of a similar level; a much stronger team usually hosts.
  Nobody plays on back-to-back days except at a tournament or in Ivy
  Friday–Saturday weekends.
- **Preseason tournaments:** almost every team plays a four-team event at a
  neutral site (Las Vegas, the Bahamas, Brooklyn, Cancún and more), three
  games on three days, most in Thanksgiving week, some the week before and a
  few holiday events in Honolulu and Las Vegas.
- **Conference challenge week** in early December (Big Ten–Coastal Atlantic
  and others, paired by strength) and **holiday showcases** at big-city
  arenas.
- **Conference play is home and away against everyone, at most 18 games**
  (the 11-team Big Ten and UAA play some teams once). It runs from New Year's
  week to the end of the season, two games a week on each conference's days:
  men's Wednesday and Saturday, women's Thursday and Sunday, the Ivy Friday
  and Saturday, the UAA Friday and Sunday (change them on the Standings page).
- At most **31 regular-season games**.

## The postseason

1. **Conference tournaments:** every team, single elimination on back-to-back
   days at one school's arena, the final on Sunday. Every champion gets an
   automatic bid.
2. **AAU National Tournament: 32 teams in four regions of eight.** The top 16
   seeds host the **round of 32** on campus (Friday and Saturday). The next
   week each region's last four play the **Sweet 16** (Friday) and **Elite
   Eight** (Sunday) at a neutral regional arena (men's East, South, Midwest
   and West at Madison Square Garden, State Farm Arena, United Center and
   Chase Center; women's at Albany, Spokane, Birmingham and Sacramento).
3. **The Final Four:** men's at Lucas Oil Stadium (semifinals Saturday, final
   Monday), women's at Target Center (Friday and Sunday). Venues and the
   format are in Settings.

## Development

Plain ES modules, no build step. Before every commit:

```
python3 tools/stamp.py
sh tools/check.sh
node tests/logic.test.mjs
python3 tests/ui_test.py
```
