// Starting league: all 73 members of the Association of American
// Universities, in the 2030 season after the AAU took over college
// athletics. Every member plays basketball, women's and men's, as two
// separate dynasties (the switch in the top bar). Conferences are the
// commissioner's alignment from the owner's AAU Dynasty file. Colors and
// mascots are each school's real ones.
//
// Ratings: OFF (offense), CTL (ball control and rebounding) and DEF
// (defense), 40–97, stored as off / pit / def. OVR comes from each program's
// real 2025-26 season:
//   OVR = conference strength + (conference win % − .500) × 22 + NCAA finish
// with the finish worth +9 for the title, +7 the Final Four, +5 the Elite
// Eight, +4 the Sweet 16, +2 the round of 32 and +1 the round of 64.
// Conference strength is a fixed number for each real 2025-26 conference
// (men: SEC 80, Big Ten and Big 12 79, ACC 76, Big East 75, American 66,
// Ivy and Big West 60; women: SEC and Big Ten 79, ACC 77, Big 12 75,
// Ivy 62, Big West 60).
// - Men's (Wikipedia, "2026 NCAA Division I men's basketball tournament"
//   and the 2025-26 conference season articles): Michigan won the title
//   69–63 over UConn, 19-1 in the Big Ten; Arizona and Illinois reached the
//   Final Four, Duke, Purdue and Iowa the Elite Eight, Texas and Michigan
//   State the Sweet 16; Kansas, Florida and Virginia went out in the round
//   of 32. Conference records: Big Ten (Michigan 19-1 … Penn State 3-17),
//   ACC (Duke 17-1 … Georgia Tech 2-16), Big 12 (Arizona 16-2, Kansas 12-6,
//   Colorado and Arizona State 7-11, Utah 2-16), SEC (Florida 16-2,
//   Vanderbilt and Texas A&M 11-7, Missouri 10-8, Texas 9-9), Big East
//   (Georgetown 6-14), American (South Florida 15-3, champion; UAB 11-7,
//   Tulane 8-10, Rice 7-11), Ivy (Yale 11-3, Harvard 10-4, Penn 9-5 and
//   tournament champion …), Big West (UC Irvine 15-5 … UC Riverside 5-15).
//   Boston University, Buffalo, Stony Brook and George Washington are
//   estimates.
// - Women's (Wikipedia, "2026 NCAA Division I women's basketball
//   tournament" and the conference season articles): UCLA won the title
//   79–51 over South Carolina after an 18-0 Big Ten season; Texas reached
//   the Final Four, Michigan, Duke and Notre Dame the Elite Eight,
//   Vanderbilt, North Carolina and Minnesota the Sweet 16. Conference
//   records: Big Ten (UCLA 18-0, Iowa and Michigan 15-3 … Rutgers 1-17), ACC
//   (Duke 16-2, champion … Pittsburgh 1-17), SEC (Vanderbilt and Texas
//   13-3 …), Big 12 (Colorado 11-7 … Arizona 3-15), Ivy (Princeton 12-2,
//   champion … Dartmouth 1-13), Big West (UC Irvine and UC San Diego 17-3 …).
//   The American, Big East, A-10, Patriot, MAC and CAA programs are
//   estimates.
// - Division III and Canadian programs sit below Division I (OVR 40–55),
//   ordered by their 2025-26 UAA records (d3hoops.com): Emory's men (12-2,
//   27-4) were the Division III national runner-up and Chicago's (11-3)
//   reached the Sweet 16; NYU's women went 13-0 in the UAA, WashU and
//   Chicago 9-4. Johns Hopkins, Tufts, MIT, Caltech, UC Santa Cruz, Toronto
//   and McGill are estimates.
//
// Head coaches are the real ones for 2026 (Wikipedia's lists of Division I
// coaches, school athletics sites and d3hoops.com). Coaches who couldn't be
// confirmed (some Division III programs) start as open jobs; name them on
// the Coaches page. Arenas are each school's home court.

import { DEFAULT_LOGOS } from './logo-import.js?v=20261113225427';

export const START_YEAR = 2030;

// The commissioner's conference alignment (from the AAU Dynasty), each with a
// logo drawn for these dynasties (img/conf/, made by tools/conf_logos.py,
// transparent backgrounds).
// Conference logos the owner picked from the web (linked, not copied; the
// drawn ones in img/conf/ stay for CAC, SWC, UCAA and as fallbacks).
export const CONF_LOGO_LINKS = {
  bigten: 'https://content.sportslogos.net/logos/153/4661/full/big_ten_conference_logo_primary_20115933.png',
  ivy: 'https://content.sportslogos.net/logos/153/4824/full/ivy_league_logo_primary_2019_sportslogosnet-9024.png',
  metro: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/METRO_Primary_LtBG.png/500px-METRO_Primary_LtBG.png',
  pac10: 'https://content.sportslogos.net/logos/153/4945/full/pacific-10_conference_logo_wordmark_1995_sportslogosnet-1134.png',
  uaa: 'https://dbukjj6eu5tsf.cloudfront.net/uaasports.info/images/responsive_2023/logo-main.svg',
};
const L = f => CONF_LOGO_LINKS[f] || `img/conf/${f}.svg`;
export const CONFERENCES = {
  'Big Ten': { abbr: 'B1G', color: '#0088CE', altColor: '#0B2A4A', logo: L('bigten') },
  'Coastal Atlantic Conference': { abbr: 'CAC', color: '#3A4A5C', altColor: '#5CC6C2', logo: L('cac') },
  'Ivy League': { abbr: 'IVY', color: '#026937', altColor: '#C9B37E', logo: L('ivy') },
  'Metro Conference': { abbr: 'METRO', color: '#E03A3E', altColor: '#23262D', logo: L('metro') },
  'Pacific-10 Conference': { abbr: 'P10', color: '#092346', altColor: '#D6A84B', logo: L('pac10') },
  'Southwest Conference': { abbr: 'SWC', color: '#719AE8', altColor: '#F28C38', logo: L('swc') },
  'UC Athletic Association': { abbr: 'UCAA', color: '#0F6E7A', altColor: '#F2C14E', logo: L('ucaa') },
  'University Athletic Association': { abbr: 'UAA', color: '#003087', altColor: '#F2B33D', logo: L('uaa') },
};

// [school, conference, abbr, mascot, color, altColor, OVR]
const WOMEN = [
  ["Michigan", 'Big Ten', 'MICH', "Wolverines", '#00274C', '#FFCB05', 91],
  ["Iowa", 'Big Ten', 'IOWA', "Hawkeyes", '#000000', '#FFCD00', 88],
  ["Minnesota", 'Big Ten', 'MINN', "Golden Gophers", '#7A0019', '#FFCC33', 88],
  ["Ohio State", 'Big Ten', 'OSU', "Buckeyes", '#BB0000', '#666666', 86],
  ["Michigan State", 'Big Ten', 'MSU', "Spartans", '#18453B', '#FFFFFF', 82],
  ["Illinois", 'Big Ten', 'ILL', "Fighting Illini", '#13294B', '#E84A27', 80],
  ["Indiana", 'Big Ten', 'IND', "Hoosiers", '#990000', '#EEEDEB', 75],
  ["Purdue", 'Big Ten', 'PUR', "Boilermakers", '#000000', '#CFB991', 74],
  ["Wisconsin", 'Big Ten', 'WIS', "Badgers", '#C5050C', '#FFFFFF', 74],
  ["Penn State", 'Big Ten', 'PSU', "Nittany Lions", '#041E42', '#FFFFFF', 73],
  ["Northwestern", 'Big Ten', 'NU', "Wildcats", '#4E2A84', '#FFFFFF', 70],
  ["Duke", 'Coastal Atlantic Conference', 'DUKE', "Blue Devils", '#00539B', '#FFFFFF', 91],
  ["North Carolina", 'Coastal Atlantic Conference', 'UNC', "Tar Heels", '#7BAFD4', '#13294B', 87],
  ["Notre Dame", 'Coastal Atlantic Conference', 'ND', "Fighting Irish", '#0C2340', '#C99700', 86],
  ["Maryland", 'Coastal Atlantic Conference', 'MD', "Terrapins", '#E21833', '#FFD200', 82],
  ["Virginia", 'Coastal Atlantic Conference', 'UVA', "Cavaliers", '#232D4B', '#E57200', 80],
  ["Georgia Tech", 'Coastal Atlantic Conference', 'GT', "Yellow Jackets", '#B3A369', '#003057', 76],
  ["Miami", 'Coastal Atlantic Conference', 'MIA', "Hurricanes", '#005030', '#F47321', 76],
  ["Florida", 'Coastal Atlantic Conference', 'FLA', "Gators", '#0021A5', '#FA4616', 75],
  ["South Florida", 'Coastal Atlantic Conference', 'USF', "Bulls", '#006747', '#CFC493', 68],
  ["Princeton", 'Ivy League', 'PRIN', "Tigers", '#E77500', '#000000', 71],
  ["Columbia", 'Ivy League', 'CLMB', "Lions", '#1D4F91', '#9BCBEB', 68],
  ["Harvard", 'Ivy League', 'HARV', "Crimson", '#A51C30', '#1E1E1E', 67],
  ["Brown", 'Ivy League', 'BRWN', "Bears", '#4E3629', '#C00404', 64],
  ["Penn", 'Ivy League', 'PENN', "Quakers", '#011F5B', '#990000', 62],
  ["Cornell", 'Ivy League', 'COR', "Big Red", '#B31B1B', '#FFFFFF', 57],
  ["Yale", 'Ivy League', 'YALE', "Bulldogs", '#00356B', '#FFFFFF', 56],
  ["Dartmouth", 'Ivy League', 'DART', "Big Green", '#00693E', '#FFFFFF', 53],
  ["Rutgers", 'Metro Conference', 'RUTG', "Scarlet Knights", '#CC0033', '#5F6A72', 69],
  ["Pittsburgh", 'Metro Conference', 'PITT', "Panthers", '#003594', '#FFB81C', 67],
  ["Georgetown", 'Metro Conference', 'GTWN', "Hoyas", '#041E42', '#63666A', 64],
  ["George Washington", 'Metro Conference', 'GW', "Revolutionaries", '#033C5A', '#AA9868', 63],
  ["Stony Brook", 'Metro Conference', 'SBU', "Seawolves", '#990000', '#16243E', 60],
  ["Buffalo", 'Metro Conference', 'BUFF', "Bulls", '#005BBB', '#FFFFFF', 58],
  ["Boston University", 'Metro Conference', 'BU', "Terriers", '#CC0000', '#FFFFFF', 56],
  ["Toronto", 'Metro Conference', 'TOR', "Varsity Blues", '#1E3765', '#FFFFFF', 46],
  ["McGill", 'Metro Conference', 'MCG', "Martlets", '#ED1B2F', '#FFFFFF', 45],
  ["UCLA", 'Pacific-10 Conference', 'UCLA', "Bruins", '#2D68C4', '#F2A900', 97],
  ["Washington", 'Pacific-10 Conference', 'UW', "Huskies", '#4B2E83', '#B7A57A', 81],
  ["USC", 'Pacific-10 Conference', 'USC', "Trojans", '#990000', '#FFC72C', 80],
  ["Oregon", 'Pacific-10 Conference', 'ORE', "Ducks", '#154733', '#FEE123', 79],
  ["Colorado", 'Pacific-10 Conference', 'COLO', "Buffaloes", '#000000', '#CFB87C', 78],
  ["California", 'Pacific-10 Conference', 'CAL', "Golden Bears", '#003262', '#FDB515', 77],
  ["Arizona State", 'Pacific-10 Conference', 'ASU', "Sun Devils", '#8C1D40', '#FFC627', 76],
  ["Stanford", 'Pacific-10 Conference', 'STAN', "Cardinal", '#8C1515', '#FFFFFF', 76],
  ["Utah", 'Pacific-10 Conference', 'UTAH', "Utes", '#CC0000', '#000000', 76],
  ["Arizona", 'Pacific-10 Conference', 'ARIZ', "Wildcats", '#0C234B', '#AB0520', 68],
  ["Texas", 'Southwest Conference', 'TEX', "Longhorns", '#BF5700', '#FFFFFF', 93],
  ["Vanderbilt", 'Southwest Conference', 'VAN', "Commodores", '#000000', '#CFAE70', 90],
  ["Texas A&M", 'Southwest Conference', 'TAMU', "Aggies", '#500000', '#FFFFFF', 78],
  ["Kansas", 'Southwest Conference', 'KU', "Jayhawks", '#0051BA', '#E8000D', 74],
  ["Missouri", 'Southwest Conference', 'MIZ', "Tigers", '#000000', '#F1B82D', 74],
  ["Rice", 'Southwest Conference', 'RICE', "Owls", '#00205B', '#7C7E7F', 66],
  ["Tulane", 'Southwest Conference', 'TUL', "Green Wave", '#006747', '#418FDE', 62],
  ["UAB", 'Southwest Conference', 'UAB', "Blazers", '#1E6B52', '#F4C300', 60],
  ["UC San Diego", 'UC Athletic Association', 'UCSD', "Tritons", '#182B49', '#C69214', 69],
  ["UC Irvine", 'UC Athletic Association', 'UCI', "Anteaters", '#0064A4', '#FFD200', 68],
  ["UC Davis", 'UC Athletic Association', 'UCD', "Aggies", '#022851', '#FFBF00', 66],
  ["UC Santa Barbara", 'UC Athletic Association', 'UCSB', "Gauchos", '#003660', '#FEBC11', 62],
  ["UC Riverside", 'UC Athletic Association', 'UCR', "Highlanders", '#003DA5', '#FFB81C', 58],
  ["UC Santa Cruz", 'UC Athletic Association', 'UCSC', "Banana Slugs", '#003C6C', '#FDC700', 42],
  ["Caltech", 'UC Athletic Association', 'CIT', "Beavers", '#FF6C0C', '#333333', 40],
  ["NYU", 'University Athletic Association', 'NYU', "Violets", '#57068C', '#FFFFFF', 55],
  ["Chicago", 'University Athletic Association', 'UCHI', "Maroons", '#800000', '#FFFFFF', 51],
  ["WashU", 'University Athletic Association', 'WUSTL', "Bears", '#A51417', '#007360', 51],
  ["Johns Hopkins", 'University Athletic Association', 'JHU', "Blue Jays", '#002D72', '#68ACE5', 50],
  ["Tufts", 'University Athletic Association', 'TUFT', "Jumbos", '#3E8EDE', '#002E6D', 50],
  ["Carnegie Mellon", 'University Athletic Association', 'CMU', "Tartans", '#C41230', '#6D6E71', 49],
  ["Emory", 'University Athletic Association', 'EMRY', "Eagles", '#012169', '#F2A900', 46],
  ["Rochester", 'University Athletic Association', 'ROCH', "Yellowjackets", '#001E5F', '#FFD100', 46],
  ["Brandeis", 'University Athletic Association', 'BRAN', "Judges", '#003478', '#FFFFFF', 45],
  ["Case Western", 'University Athletic Association', 'CWRU', "Spartans", '#0A304E', '#FFFFFF', 45],
  ["MIT", 'University Athletic Association', 'MIT', "Engineers", '#A31F34', '#8A8B8C', 45],
];
const MEN = [
  ["Michigan", 'Big Ten', 'MICH', "Wolverines", '#00274C', '#FFCB05', 97],
  ["Illinois", 'Big Ten', 'ILL', "Fighting Illini", '#13294B', '#E84A27', 92],
  ["Michigan State", 'Big Ten', 'MSU', "Spartans", '#18453B', '#FFFFFF', 88],
  ["Purdue", 'Big Ten', 'PUR', "Boilermakers", '#000000', '#CFB991', 87],
  ["Iowa", 'Big Ten', 'IOWA', "Hawkeyes", '#000000', '#FFCD00', 84],
  ["Wisconsin", 'Big Ten', 'WIS', "Badgers", '#C5050C', '#FFFFFF', 84],
  ["Ohio State", 'Big Ten', 'OSU', "Buckeyes", '#BB0000', '#666666', 82],
  ["Indiana", 'Big Ten', 'IND', "Hoosiers", '#990000', '#EEEDEB', 78],
  ["Minnesota", 'Big Ten', 'MINN', "Golden Gophers", '#7A0019', '#FFCC33', 77],
  ["Northwestern", 'Big Ten', 'NU', "Wildcats", '#4E2A84', '#FFFFFF', 74],
  ["Penn State", 'Big Ten', 'PSU', "Nittany Lions", '#041E42', '#FFFFFF', 71],
  ["Duke", 'Coastal Atlantic Conference', 'DUKE', "Blue Devils", '#00539B', '#FFFFFF', 91],
  ["Florida", 'Coastal Atlantic Conference', 'FLA', "Gators", '#0021A5', '#FA4616', 91],
  ["Virginia", 'Coastal Atlantic Conference', 'UVA', "Cavaliers", '#232D4B', '#E57200', 85],
  ["Miami", 'Coastal Atlantic Conference', 'MIA', "Hurricanes", '#005030', '#F47321', 82],
  ["North Carolina", 'Coastal Atlantic Conference', 'UNC', "Tar Heels", '#7BAFD4', '#13294B', 81],
  ["South Florida", 'Coastal Atlantic Conference', 'USF', "Bulls", '#006747', '#CFC493', 74],
  ["Maryland", 'Coastal Atlantic Conference', 'MD', "Terrapins", '#E21833', '#FFD200', 72],
  ["Notre Dame", 'Coastal Atlantic Conference', 'ND', "Fighting Irish", '#0C2340', '#C99700', 70],
  ["Georgia Tech", 'Coastal Atlantic Conference', 'GT', "Yellow Jackets", '#B3A369', '#003057', 67],
  ["Yale", 'Ivy League', 'YALE', "Bulldogs", '#00356B', '#FFFFFF', 66],
  ["Harvard", 'Ivy League', 'HARV', "Crimson", '#A51C30', '#1E1E1E', 65],
  ["Penn", 'Ivy League', 'PENN', "Quakers", '#011F5B', '#990000', 64],
  ["Cornell", 'Ivy League', 'COR', "Big Red", '#B31B1B', '#FFFFFF', 62],
  ["Columbia", 'Ivy League', 'CLMB', "Lions", '#1D4F91', '#9BCBEB', 57],
  ["Dartmouth", 'Ivy League', 'DART', "Big Green", '#00693E', '#FFFFFF', 57],
  ["Princeton", 'Ivy League', 'PRIN', "Tigers", '#E77500', '#000000', 57],
  ["Brown", 'Ivy League', 'BRWN', "Bears", '#4E3629', '#C00404', 54],
  ["Rutgers", 'Metro Conference', 'RUTG', "Scarlet Knights", '#CC0033', '#5F6A72', 75],
  ["Georgetown", 'Metro Conference', 'GTWN', "Hoyas", '#041E42', '#63666A', 71],
  ["Pittsburgh", 'Metro Conference', 'PITT', "Panthers", '#003594', '#FFB81C', 71],
  ["George Washington", 'Metro Conference', 'GW', "Revolutionaries", '#033C5A', '#AA9868', 64],
  ["Boston University", 'Metro Conference', 'BU', "Terriers", '#CC0000', '#FFFFFF', 57],
  ["Buffalo", 'Metro Conference', 'BUFF', "Bulls", '#005BBB', '#FFFFFF', 55],
  ["Stony Brook", 'Metro Conference', 'SBU', "Seawolves", '#990000', '#16243E', 55],
  ["Toronto", 'Metro Conference', 'TOR', "Varsity Blues", '#1E3765', '#FFFFFF', 46],
  ["McGill", 'Metro Conference', 'MCG', "Redbirds", '#ED1B2F', '#FFFFFF', 45],
  ["Arizona", 'Pacific-10 Conference', 'ARIZ', "Wildcats", '#0C234B', '#AB0520', 95],
  ["UCLA", 'Pacific-10 Conference', 'UCLA', "Bruins", '#2D68C4', '#F2A900', 83],
  ["Arizona State", 'Pacific-10 Conference', 'ASU', "Sun Devils", '#8C1D40', '#FFC627', 77],
  ["Colorado", 'Pacific-10 Conference', 'COLO', "Buffaloes", '#000000', '#CFB87C', 77],
  ["California", 'Pacific-10 Conference', 'CAL', "Golden Bears", '#003262', '#FDB515', 76],
  ["Stanford", 'Pacific-10 Conference', 'STAN', "Cardinal", '#8C1515', '#FFFFFF', 76],
  ["USC", 'Pacific-10 Conference', 'USC', "Trojans", '#990000', '#FFC72C', 76],
  ["Washington", 'Pacific-10 Conference', 'UW', "Huskies", '#4B2E83', '#B7A57A', 76],
  ["Oregon", 'Pacific-10 Conference', 'ORE', "Ducks", '#154733', '#FEE123', 74],
  ["Utah", 'Pacific-10 Conference', 'UTAH', "Utes", '#CC0000', '#000000', 70],
  ["Kansas", 'Southwest Conference', 'KU', "Jayhawks", '#0051BA', '#E8000D', 85],
  ["Texas", 'Southwest Conference', 'TEX', "Longhorns", '#BF5700', '#FFFFFF', 84],
  ["Texas A&M", 'Southwest Conference', 'TAMU', "Aggies", '#500000', '#FFFFFF', 83],
  ["Vanderbilt", 'Southwest Conference', 'VAN', "Commodores", '#000000', '#CFAE70', 83],
  ["Missouri", 'Southwest Conference', 'MIZ', "Tigers", '#000000', '#F1B82D', 82],
  ["UAB", 'Southwest Conference', 'UAB', "Blazers", '#1E6B52', '#F4C300', 68],
  ["Tulane", 'Southwest Conference', 'TUL', "Green Wave", '#006747', '#418FDE', 65],
  ["Rice", 'Southwest Conference', 'RICE', "Owls", '#00205B', '#7C7E7F', 64],
  ["UC Irvine", 'UC Athletic Association', 'UCI', "Anteaters", '#0064A4', '#FFD200', 66],
  ["UC San Diego", 'UC Athletic Association', 'UCSD', "Tritons", '#182B49', '#C69214', 62],
  ["UC Davis", 'UC Athletic Association', 'UCD', "Aggies", '#022851', '#FFBF00', 61],
  ["UC Santa Barbara", 'UC Athletic Association', 'UCSB', "Gauchos", '#003660', '#FEBC11', 61],
  ["UC Riverside", 'UC Athletic Association', 'UCR', "Highlanders", '#003DA5', '#FFB81C', 54],
  ["UC Santa Cruz", 'UC Athletic Association', 'UCSC', "Banana Slugs", '#003C6C', '#FDC700', 43],
  ["Caltech", 'UC Athletic Association', 'CIT', "Beavers", '#FF6C0C', '#333333', 40],
  ["Emory", 'University Athletic Association', 'EMRY', "Eagles", '#012169', '#F2A900', 55],
  ["Chicago", 'University Athletic Association', 'UCHI', "Maroons", '#800000', '#FFFFFF', 53],
  ["NYU", 'University Athletic Association', 'NYU', "Violets", '#57068C', '#FFFFFF', 51],
  ["WashU", 'University Athletic Association', 'WUSTL', "Bears", '#A51417', '#007360', 51],
  ["Johns Hopkins", 'University Athletic Association', 'JHU', "Blue Jays", '#002D72', '#68ACE5', 50],
  ["Tufts", 'University Athletic Association', 'TUFT', "Jumbos", '#3E8EDE', '#002E6D', 49],
  ["Brandeis", 'University Athletic Association', 'BRAN', "Judges", '#003478', '#FFFFFF', 48],
  ["Case Western", 'University Athletic Association', 'CWRU', "Spartans", '#0A304E', '#FFFFFF', 46],
  ["MIT", 'University Athletic Association', 'MIT', "Engineers", '#A31F34', '#8A8B8C', 46],
  ["Rochester", 'University Athletic Association', 'ROCH', "Yellowjackets", '#001E5F', '#FFD100', 46],
  ["Carnegie Mellon", 'University Athletic Association', 'CMU', "Tartans", '#C41230', '#6D6E71', 45],
];

// Home arenas: [arena, city]. Every one can be edited on the team page.
export const SITES = {
  "Arizona": ["McKale Center", "Tucson, Ariz."],
  "Arizona State": ["Desert Financial Arena", "Tempe, Ariz."],
  "Boston University": ["Case Gym", "Boston, Mass."],
  "Brandeis": ["Red Auerbach Arena", "Waltham, Mass."],
  "Brown": ["Pizzitola Sports Center", "Providence, R.I."],
  "Buffalo": ["Alumni Arena", "Amherst, N.Y."],
  "California": ["Haas Pavilion", "Berkeley, Calif."],
  "Caltech": ["Braun Athletic Center", "Pasadena, Calif."],
  "Carnegie Mellon": ["Skibo Gymnasium", "Pittsburgh, Pa."],
  "Case Western": ["Horsburgh Gymnasium", "Cleveland, Ohio"],
  "Chicago": ["Ratner Athletics Center", "Chicago, Ill."],
  "Colorado": ["CU Events Center", "Boulder, Colo."],
  "Columbia": ["Levien Gymnasium", "New York, N.Y."],
  "Cornell": ["Newman Arena", "Ithaca, N.Y."],
  "Dartmouth": ["Leede Arena", "Hanover, N.H."],
  "Duke": ["Cameron Indoor Stadium", "Durham, N.C."],
  "Emory": ["Woodruff P.E. Center", "Atlanta, Ga."],
  "Florida": ["O'Connell Center", "Gainesville, Fla."],
  "George Washington": ["Charles E. Smith Center", "Washington, D.C."],
  "Georgetown": ["McDonough Arena", "Washington, D.C."],
  "Georgia Tech": ["McCamish Pavilion", "Atlanta, Ga."],
  "Harvard": ["Lavietes Pavilion", "Boston, Mass."],
  "Illinois": ["State Farm Center", "Champaign, Ill."],
  "Indiana": ["Simon Skjodt Assembly Hall", "Bloomington, Ind."],
  "Iowa": ["Carver-Hawkeye Arena", "Iowa City, Iowa"],
  "Johns Hopkins": ["Goldfarb Gymnasium", "Baltimore, Md."],
  "Kansas": ["Allen Fieldhouse", "Lawrence, Kan."],
  "MIT": ["Rockwell Cage", "Cambridge, Mass."],
  "Maryland": ["Xfinity Center", "College Park, Md."],
  "McGill": ["Love Competition Hall", "Montreal, Que."],
  "Miami": ["Watsco Center", "Coral Gables, Fla."],
  "Michigan": ["Crisler Center", "Ann Arbor, Mich."],
  "Michigan State": ["Breslin Center", "East Lansing, Mich."],
  "Minnesota": ["Williams Arena", "Minneapolis, Minn."],
  "Missouri": ["Mizzou Arena", "Columbia, Mo."],
  "NYU": ["Paulson Center", "New York, N.Y."],
  "North Carolina": ["Dean E. Smith Center", "Chapel Hill, N.C."],
  "Northwestern": ["Welsh-Ryan Arena", "Evanston, Ill."],
  "Notre Dame": ["Purcell Pavilion", "Notre Dame, Ind."],
  "Ohio State": ["Value City Arena", "Columbus, Ohio"],
  "Oregon": ["Matthew Knight Arena", "Eugene, Ore."],
  "Penn": ["The Palestra", "Philadelphia, Pa."],
  "Penn State": ["Bryce Jordan Center", "University Park, Pa."],
  "Pittsburgh": ["Petersen Events Center", "Pittsburgh, Pa."],
  "Princeton": ["Jadwin Gymnasium", "Princeton, N.J."],
  "Purdue": ["Mackey Arena", "West Lafayette, Ind."],
  "Rice": ["Tudor Fieldhouse", "Houston, Texas"],
  "Rochester": ["Louis Alexander Palestra", "Rochester, N.Y."],
  "Rutgers": ["Jersey Mike's Arena", "Piscataway, N.J."],
  "South Florida": ["Yuengling Center", "Tampa, Fla."],
  "Stanford": ["Maples Pavilion", "Stanford, Calif."],
  "Stony Brook": ["Island Federal Arena", "Stony Brook, N.Y."],
  "Texas": ["Moody Center", "Austin, Texas"],
  "Texas A&M": ["Reed Arena", "College Station, Texas"],
  "Toronto": ["Goldring Centre", "Toronto, Ont."],
  "Tufts": ["Cousens Gymnasium", "Medford, Mass."],
  "Tulane": ["Devlin Fieldhouse", "New Orleans, La."],
  "UAB": ["Bartow Arena", "Birmingham, Ala."],
  "UC Davis": ["University Credit Union Center", "Davis, Calif."],
  "UC Irvine": ["Bren Events Center", "Irvine, Calif."],
  "UC Riverside": ["SRC Arena", "Riverside, Calif."],
  "UC San Diego": ["LionTree Arena", "La Jolla, Calif."],
  "UC Santa Barbara": ["The Thunderdome", "Santa Barbara, Calif."],
  "UC Santa Cruz": ["East Gym", "Santa Cruz, Calif."],
  "UCLA": ["Pauley Pavilion", "Los Angeles, Calif."],
  "USC": ["Galen Center", "Los Angeles, Calif."],
  "Utah": ["Jon M. Huntsman Center", "Salt Lake City, Utah"],
  "Vanderbilt": ["Memorial Gymnasium", "Nashville, Tenn."],
  "Virginia": ["John Paul Jones Arena", "Charlottesville, Va."],
  "WashU": ["WU Field House", "St. Louis, Mo."],
  "Washington": ["Hec Edmundson Pavilion", "Seattle, Wash."],
  "Wisconsin": ["Kohl Center", "Madison, Wis."],
  "Yale": ["John J. Lee Amphitheater", "New Haven, Conn."],
};
// Men's teams that play somewhere else.
export const MEN_SITES = {
  "Georgetown": ["Capital One Arena", "Washington, D.C."],
};

// Names the logo lists may know a school by.
export const LOGO_ALIASES = { 'Penn': 'Pennsylvania', 'Miami': 'Miami', 'UC Santa Barbara': 'UC Santa Barbara', 'George Washington': 'George Washington', 'UConn': 'Connecticut' };

// Head coaches for the 2026 season (see above). By 2030 some will have moved
// on; rename anyone on the Coaches page.
export const COACHES = {
  "Arizona": "Becky Burke",
  "Arizona State": "Molly Miller",
  "Boston University": "Melissa Graves",
  "Brandeis": "Carol Simon",
  "Brown": "Monique LeBlanc",
  "Buffalo": "Kristen Sharkey",
  "California": "Charmin Smith",
  "Case Western": "Jennifer Reimer",
  "Chicago": "Michelle Gardner-Bilek",
  "Colorado": "JR Payne",
  "Columbia": "Megan Griffith",
  "Cornell": "Emily Garner",
  "Dartmouth": "Linda Cimino",
  "Duke": "Kara Lawson",
  "Emory": "Misha Jackson",
  "Florida": "Tammi Reiss",
  "George Washington": "Ganiyat Adeduntan",
  "Georgetown": "Darnell Haney",
  "Georgia Tech": "Karen Blair",
  "Harvard": "Carrie Moore",
  "Illinois": "Shauna Green",
  "Indiana": "Teri Moren",
  "Iowa": "Jan Jensen",
  "Kansas": "Brandon Schneider",
  "Maryland": "Brenda Frese",
  "Miami": "Tricia Cullop",
  "Michigan": "Kim Barnes Arico",
  "Michigan State": "Robyn Fralick",
  "Minnesota": "Dawn Plitzuweit",
  "Missouri": "Kellie Harper",
  "NYU": "Meg Barber",
  "North Carolina": "Courtney Banghart",
  "Northwestern": "Carla Berube",
  "Notre Dame": "Niele Ivey",
  "Ohio State": "Kevin McGuff",
  "Oregon": "Kelly Graves",
  "Penn": "Mike McLaughlin",
  "Penn State": "Tanisha Wright",
  "Pittsburgh": "Robin Harmony",
  "Princeton": "Lauren Gosselin",
  "Purdue": "Katie Gearlds",
  "Rice": "Lindsay Edmonds",
  "Rutgers": "Gary Redus II",
  "South Florida": "Kristy Curry",
  "Stanford": "Kate Paye",
  "Stony Brook": "Joy McCorvey",
  "Texas": "Vic Schaefer",
  "Texas A&M": "Joni Taylor",
  "Toronto": "Dianna Ros",
  "Tufts": "Clare Fitzpatrick",
  "Tulane": "Ashley Langford",
  "UAB": "Randy Norton",
  "UC Davis": "Jennifer Gross",
  "UC Irvine": "Tamara Inoue",
  "UC Riverside": "Brad Langston",
  "UC San Diego": "Heidi VanDerveer",
  "UC Santa Barbara": "Renee Jimenez",
  "UCLA": "Cori Close",
  "USC": "Lindsay Gottlieb",
  "Utah": "Gavin Petersen",
  "Vanderbilt": "Shea Ralph",
  "Virginia": "Aaron Roussell",
  "WashU": "Randi Henderson",
  "Washington": "Tina Langley",
  "Wisconsin": "Robin Pingeton",
  "Yale": "Dalila Eshe",
};
export const MEN_COACHES = {
  "Arizona": "Tommy Lloyd",
  "Arizona State": "Randy Bennett",
  "Boston University": "Joe Jones",
  "Brown": "Mike Martin",
  "Buffalo": "George Halcovage",
  "California": "Mark Madsen",
  "Caltech": "Bryan Joel",
  "Chicago": "Mike McGrath",
  "Colorado": "Tad Boyle",
  "Columbia": "Kevin Hovde",
  "Cornell": "Jon Jaques",
  "Dartmouth": "Brett MacConnell",
  "Duke": "Jon Scheyer",
  "Emory": "Jason Zimmerman",
  "Florida": "Todd Golden",
  "George Washington": "Chris Caputo",
  "Georgetown": "Ed Cooley",
  "Georgia Tech": "Scott Cross",
  "Harvard": "Tommy Amaker",
  "Illinois": "Brad Underwood",
  "Indiana": "Darian DeVries",
  "Iowa": "Ben McCollum",
  "Johns Hopkins": "Ryan Cain",
  "Kansas": "Bill Self",
  "MIT": "B.J. Dunne",
  "Maryland": "Buzz Williams",
  "McGill": "Ryan Thorne",
  "Miami": "Jai Lucas",
  "Michigan": "Dusty May",
  "Michigan State": "Tom Izzo",
  "Minnesota": "Niko Medved",
  "Missouri": "Dennis Gates",
  "NYU": "Dave Klatsky",
  "North Carolina": "Michael Malone",
  "Northwestern": "Chris Collins",
  "Notre Dame": "Micah Shrewsberry",
  "Ohio State": "Jake Diebler",
  "Oregon": "Dana Altman",
  "Penn": "Fran McCaffery",
  "Penn State": "Mike Rhoades",
  "Pittsburgh": "Jeff Capel III",
  "Princeton": "Mitch Henderson",
  "Purdue": "Matt Painter",
  "Rice": "Rob Lanier",
  "Rochester": "Luke Flockerzi",
  "Rutgers": "Steve Pikiell",
  "South Florida": "Chris Mack",
  "Stanford": "Kyle Smith",
  "Stony Brook": "Geno Ford",
  "Texas": "Sean Miller",
  "Texas A&M": "Bucky McMillan",
  "Toronto": "Madhav Trivedi",
  "Tufts": "Brian Meehan",
  "Tulane": "Ron Hunter",
  "UAB": "Andy Kennedy",
  "UC Davis": "Jim Les",
  "UC Irvine": "Russell Turner",
  "UC Riverside": "Gus Argenal",
  "UC San Diego": "Clint Allard",
  "UC Santa Barbara": "Joe Pasternack",
  "UCLA": "Mick Cronin",
  "USC": "Eric Musselman",
  "Utah": "Alex Jensen",
  "Vanderbilt": "Mark Byington",
  "Virginia": "Ryan Odom",
  "WashU": "Pat Juckem",
  "Washington": "Danny Sprinkle",
  "Wisconsin": "Greg Gard",
  "Yale": "James Jones",
};

function hashName(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; }

export function makeTeam({ school, conference, abbr, mascot = '', coach = '', coachId = null, color = '#555555', altColor = '#dddddd', off = 65, pit = 65, def = 65, stadium, city, men = false }) {
  const known = (men && MEN_SITES[school]) || SITES[school] || [];
  return {
    school, conference, abbr: abbr || school.replace(/[^A-Za-z ]/g, '').split(/\s+/).map(w => w[0]).join('').slice(0, 4).toUpperCase(),
    mascot, coach, coachId, color, altColor, off, pit, def, base: { off, pit, def }, logoOverride: null,
    stadium: stadium || known[0] || '', city: city || known[1] || '',
  };
}

// Gives a team its home arena from SITES if it has none yet (older saves).
export function fillSite(t) {
  if (t.stadium !== undefined && t.city !== undefined) return;
  const known = SITES[t.school] || [];
  t.stadium ??= known[0] || '';
  t.city ??= known[1] || '';
}

// OVR → OFF / CTL / DEF: each team leans a little one way (a high-scoring
// offense, a team that takes care of the ball and owns the glass, a stingy
// defense), keeping the same OVR.
export function splitOvr(school, ovr) {
  const h = hashName(school);
  const a = (h % 7) - 3, b = ((h >>> 4) % 5) - 2;
  const off = ovr + a, pit = ovr + b, def = Math.round(ovr - (0.4 * a + 0.3 * b) / 0.3);
  const c = x => Math.max(40, Math.min(99, x));
  return { off: c(off), pit: c(pit), def: c(def) };
}

// Women's and men's are separate leagues (the switch at the top of the
// page). `side` is 'women' (the default) or 'men'.
export const SIDES = {
  women: { label: "Women's", name: "AAU Women's Basketball" },
  men: { label: "Men's", name: "AAU Men's Basketball" },
};
export const sideOf = league => (league?.side === 'men' ? 'men' : 'women');

export function seedTeams(side = 'women') {
  const teams = {};
  const men = side === 'men';
  for (const [school, conference, abbr, mascot, color, altColor, ovr] of men ? MEN : WOMEN) {
    teams[school] = makeTeam({ school, conference, abbr, mascot, coach: (men ? MEN_COACHES : COACHES)[school] || '', color, altColor, men, ...splitOvr(school, ovr) });
    // The AAU Dynasty's logos win over the automatic logo lists.
    teams[school].logoOverride = DEFAULT_LOGOS[school] || null;
  }
  return teams;
}
// Conferences each side starts with: only those with teams in that sport.
export function conferencesFor(side) {
  const used = new Set((side === 'men' ? MEN : WOMEN).map(r => r[1]));
  return Object.fromEntries(Object.entries(CONFERENCES).filter(([c]) => used.has(c)));
}
