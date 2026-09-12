# Phase 1 Golden Master harness

Baseline commit: `6295bec41fceec7dc9a410016c2ea0dd9d1d909d`.
Authoritative input: ENG-009-04 REQUEST; ENG-009-02 RESPONSE; CREATIVE-001-02 RESPONSE;
ENG-009-03 RESPONSE. The last file actually ends at section 8.2, immediately after
`assignment.game_world_id == current GW` (blob `4893323fb7d73b028523348a471c815d9663ffaf`,
confirmed through both file and blob APIs). No missing text has been reconstructed.
The explicit Phase 1 requirements and complete earlier contracts govern this work.

## Automated gates

`node --test minisite/tests/contracts.test.mjs` validates declarations, inert
assembly, registry isolation, required capabilities, source states/cancellation,
semantic models, URL round trips, hash preservation, context compatibility, fixed
context sets, extension cleanup and a synthetic new-world composition.

`node minisite/tests/verify-isolation.mjs` checks the exact Git blob hash of all 83
legacy files in `source-baseline.json`, including both world packages, assets and
the historical shared core. It imports no platform code and runs with the entire
platform directory absent. This is the Phase 1 rollback/non-dependency gate.

`python3 minisite/tests/live-check.py report.json` compares public HTTP bytes to the
frozen repository packages, including the GW007 WebP generated from tracked base64
by its existing deploy workflow. It does not request protected `.htaccess` content;
that file remains covered by source hashes. No DB or API is queried. Network errors
are failures, not successful checks. This verifies published assets, not full
interaction correctness or visual approval.

The dedicated `minisite-platform-foundation.yml` Action runs these gates without
deployment or secrets. Existing pilot deploy workflows remain unchanged. The broad
website deploy ignores only the new foundation/tests/workflow paths, preventing a
foundation commit from triggering unrelated production uploads.

## Real runtime inventory

GW001: ten current destinations use `exploration-data.js` then `exploration.js`,
`exploration-fonts.css`, `exploration.css`. Exact HTML/script inventory is in the
source baseline. `app.js`, `home-app.js` and older styles remain legacy files.
`legacy.html` alone references `/minisite/shared/app-core.js`; this shared path is
absent from the repository. The deploy manifest does not deploy legacy.html.
`visual-review.html` is a separate review surface.

GW007: fourteen destinations use `data.js` then `app.js` and `style.css`.
`review.html` is a separate responsive review surface. No reference to either old
shared app-core path exists in the current package or its deploy workflow.
`site-assets/gameworld/app-core.js` is retained, unchanged, for the historical
gameworld entrypoints; it is not the new platform and is not imported by these pilots.

## Current behavior is the baseline, not the future contract

| Current route/behavior | GW001 | GW007 |
|---|---|---|
| Home | index.html | index.html |
| Competition | competitions.html hub; no distinct competition detail | competitions.html; four league paths |
| Results | division + date initial query | k initial query |
| Schedule | division initial query; rows have no Match links | k initial query; rows link to Match |
| Standings | illustrative demo ranking; local sort | derived single-turn Power Ranking, not league standings; k ignored |
| Match | id searches Results; unknown id produces not-found | id searches Results + Schedule; missing/unknown id uses Real Madrid fixture |
| Club | name; unknown sample has empty/not-found state | name + k; result country takes precedence |
| Player | demo dossier; no id behavior | id; unknown/missing uses first sample |
| Manager | demo dossier | unverified identity/empty source dossier |
| Archive | archive.html narrative chapters | no archive route |
| Four-context surface | not applicable | world.html; ENG, ESP, GER, ITA fixed order |
| Kingdom / Map | not applicable | kingdom.html?k; map.html; invalid k defaults ENG |
| Filter changes | DOM-only, URL unchanged | DOM-only, URL unchanged |
| Primary navigation | full document links, query generally lost | full document links, k generally lost |
| Back / forward | native browser document history | native browser document history |
| Explicit Match back | results.html (drops division/date) | no explicit back; native browser back |

Exact real path/query inventories: `GW001/routes.json`, `GW007/routes.json`.
These are offline inputs for codec tests; they are not live adapters. In particular,
the family requirement that Schedule reaches Match must not be confused with the
current GW001 behavior. Phase 1 deliberately does not repair these legacy gaps.

## Responsive, accessibility and data-state review

Use the existing public review surfaces `/minisite/GW001/visual-review.html` and
`/minisite/GW007/review.html`. Select each recorded page at 390 and 1440 CSS pixels;
GW001 also exposes 360. These are iframe composition widths, not iPhone/Safari
emulation. Browser snapshots in `browser-evidence/` record observed headings,
landmarks, navigation, labels and content for the selected width/page.

Manual repeatable checks:

1. Home → Results → Match → browser Back → Forward. Verify URL, fixture and source.
2. GW001 Competition → division result link; date and division filters; reopen URL.
3. GW007 four context links → Kingdom → Results; switch filter; reopen URL; browser Back.
4. GW001 mobile More opens native dialog; Escape closes; inspect focus restoration.
5. GW007 mobile Menu toggles sidebar and aria-expanded; complete contexts reachable.
6. Tab through navigation and controls; inspect focus-visible, skip link and names.
7. Review all semantic destinations at both widths, including long teams, tables,
   Archive, map, Kingdom and Match. Inspect overflow and information reachability.
8. Invalid Match IDs, unknown Club and empty filters: preserve documented behavior.

GW001 signature preservation: cinema, titanium score plate, ranking spine, ivory
chapter, historical annotation, archive chapter, dossier imagery and chart rhythm.
GW007: fixed Kingdom identities/colors, border scores, territory map/regions/nodes,
balance bars, manifesto paper, converging paths and territorial motion.

Both live runtimes consume checked-in snapshots synchronously; loading/error network
states are not normally exposed. Do not invent a runtime loading/error baseline.
Those states are tested at the new boundary. Existing DEMO and unavailable-data
labels remain unchanged. No new MySQL facts are claimed by this baseline.

Accessibility limitations are preserved: GW001 mobile primary bar has Archive rather
than Schedule (Schedule is in More); GW007 has a toggle sidebar, no bottom primary
bar and no aria-current on primary links. No conformance certification is claimed.
Both stylesheets declare focus-visible and reduced-motion behavior. Further assistive
technology/touch-target audit remains an adapter acceptance task.

## Visual evidence limits

The available cloud browser does not expose viewport resizing. Existing review
iframes provide the required composition widths, but the outer screenshot may clip
a wide iframe or include review chrome. Full-page screenshot capture also produced
a protocol timeout. Unverified/stale captures are not accepted as Golden Masters.
No screenshot engine or browser install has been added to CI solely for Phase 1.
The minimum reproducible visual harness is the existing review surfaces plus the
frozen 83-file source/asset baseline and recorded DOM evidence. Pixel regression
requires a fixed browser/font/render environment and Creative review in Phase 2;
it is not claimed as passed here. Do not overwrite the baseline automatically.

## Rollback

Remove `minisite/platform/`; both pilots still use precisely their previous runtime.
The isolation verifier can run while the directory is temporarily outside the tree.
No live deploy is needed. To remove all Phase 1 infrastructure, revert its commit;
this also removes tests and restores the previous broad-deploy filter. A normal
revert can trigger that old broad workflow, so plan rollback of the workflow filter
separately from runtime removal. No DB, gateway or other world needs rollback.

## Phase 2 proposal (not executed)

One bounded GW001 adapter CASE: freeze missing Blueprint text if required, establish
a reproducible approved pixel baseline, then extract only URL/context/navigation
behind the existing exploration renderer. Decide explicitly which documented legacy
gaps may be corrected. Preserve all rendering/assets and all existing URLs. Require
behavior, accessibility, responsive and creative acceptance before changing imports.
GW007 remains the unchanged MULTI_GOLD acceptance baseline until its own adapter CASE.
