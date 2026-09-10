# IMC OFFICIAL WEBSITE — SYSTEM MOODBOARD · PROPOSAL 01

## Creative thesis
IMC · ONE CLUB. MANY WORLDS. THE LIVE INDEX OF THE IMC UNIVERSE.
An editorial index whose scale comes from verified records and whose stories remain connected to their match, person and world.

## System moodboard
1. Thesis: the universe is the content; the master site gives it hierarchy.
2. Keywords: precise, alive, expansive, sporting, documented.
3. Color: Oxford #071A30, deep navy #06111F, white #FFFFFF, silver #CCD4DD, charcoal #20252B. Tricolore only at the masthead signature.
4. Typography: condensed display for headlines and scores; Inter/system sans for interface; serif editorial pauses; tabular numbers throughout data.
5. Materials: opaque navy stage, white editorial paper, hairline silver separators. No ubiquitous glass or floating containers.
6. Lighting: flat readable data surfaces, restrained tonal depth on world stages; no glowing KPI boxes.
7. Photography: existing verified club/player imagery; no fabricated manager portrait.
8. Generative imagery: optional conceptual atmosphere only; not needed to communicate the V1 data.
9. Editorial language: English section signatures with Italian reading copy; factual headings identify what, where and when.
10. Broadcast: explicit completed/scheduled status and source date; never imply minute-by-minute live coverage from imported results.
11. Objects: match is a score plate; manager is a name with assignments; record is an oversized number with evidence; world is a wide identity panel.
12. Charts: labelled horizontal bars for world match volume, coverage matrix for datasets, season timeline. No decorative networks.
13. Motion: 160–220ms interaction; no autoplay rails; respect reduced motion.
14. Mobile: masthead, Pulse, results, worlds, Today; 44px controls, single reading column, bounded horizontal tables.
15. Desktop: broad number stage alongside recent activity; asymmetric editorial rows; expanded comparisons.
16. Signatures: compact IMC masthead, section index, uppercase metadata, big tabular number, thin editorial rule.
17. Worlds: titanium GW001, emerald GW002, ranked vertical accent GW004, territory line GW007, pixel rhythm GW009. These remain accents inside the master frame.
18. Rhythm: number → compact events → world panorama → people → score → data → market → archive.
19. Do: expose scope, dates, source and uncertainty. Don't: equate imported rows with distinct matches or sum player snapshots into career totals.
20. Risks: duplicate fixtures, incomplete histories, unverified current club associations, missing player metrics, misleading season comparisons, unrelated deployment side effects.

## Audit — 10 September 2026
- Existing root index.html is a one-page institutional presentation. Navigation uses section anchors; managers are hardcoded in imc-site.js.
- Main dependencies: site-assets/css/imc-site.css, site-assets/js/imc-site.js, IMC logo, nine world images and competition images.
- Root links target gameworld001–009; repository also contains independent minisite explorations and GW010 creation/draw tools.
- CORE query confirms ten worlds and sixty managers. Existing root still describes nine worlds.
- Site-ready API is restricted to GW004. Older public API uses earlier normalized data structures. Master implementation must use the audited IMC tables.
- Results contain duplicate fixtures in GW004 and GW005. Resolve display identity by (game_world_id, sm_fixture_id), using newest synchronized row. Counts and goals use the same identity.
- Some player-stat fields are null. Null is unavailable, not zero. Missing season identity prevents all-time player rankings.
- Sample event classification contradicts its commentary (a missed shot classified as a goal). Preserve source commentary and player box scores; do not generate scorer attribution from primary_player_name.
- General website workflow clears unrelated world and draw directories. Master release must have an isolated upload manifest and no deletion.
- Existing desktop opening fills the viewport with logo and claim, without sporting activity. Menu trigger lacks an accessible name. Mobile audit remains to be completed during QA.

## Research principles
- ESPN scoreboard: competition context, compact scores and direct report access. https://www.espn.com/soccer/scoreboard
- F1 editorial: alternate event context, stories and sporting rankings. https://www.formula1.com/
- Apple HIG charts reference: progressive disclosure and accessible data presentation; page requires JavaScript, substantive guidance not yet verified. https://developer.apple.com/design/human-interface-guidelines/charts
- Material reference retrieval failed; no unverified claims taken from it.

## Information architecture
Home; Worlds → World; Managers → Manager; Clubs → Club; Players → Player; Matches → Match; Results; Schedule; Transfers; Rankings; Record Book; Stories; Archive; About; Today; Competitions.
Profiles use explicit identifiers. Every match stays scoped to a world. Records disclose the observed archive interval. Rankings use comparable, explicitly defined metrics only.

## Data inventory and rendering contract
- Global import coverage: exclusively IMC Repository Report from GOLD and CUSTOM.
- CORE: IMC Game World Codex Global, IMC Manager Codex Global, IMC Manager Assignment Global, IMC Club Codex Global, IMC Player Codex Global, IMC Game World Club Mapping, IMC Competition Codex Global; season registry used only with its own labels.
- Results and match/goal metrics: deduplicated IMC Site Results, completed matches with valid scores.
- Schedule/Today: deduplicated IMC Site Schedule, imported times labelled as source times; completed result takes precedence.
- Match detail: IMC Site Match Report, team statistics, player performances, source commentary.
- Transfers: IMC Site Transfers; preserve amount_text, no fabricated monetary sum.
- Players: individual snapshots per world and competition; do not add snapshots across competitions or periods.
- Manager assignments: display as registered assignments with dates. Results-derived club associations are historical match evidence, not automatically current assignments.
- Unavailable trophy histories and streaks are omitted. Stories may feature documented matches and directly link to evidence.
