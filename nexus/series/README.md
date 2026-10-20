# Fuori dal Campo — GW011

Public routes: `/nexus/series/?world=GW011`, club route adds `&club=139` (Core club entity ID); an episode can be opened with `&episode=prologo-atletico`.

`catalog.json` is the editorial source. Only `status: published` episodes render. `publishedAt` sorts episodes descending; messages stay in written order. Club associations are arrays of Core club IDs, allowing one canonical episode on several pages. Character IDs and fixed face coordinates reference the same illustrated cast atlas in every appearance. The opening episode is explicitly a fictional introduction, not a reported sporting event.

Live club-manager assignments come from the existing read-only directory API. A timestamped snapshot provides a clearly marked offline fallback. Cast is complete only for Atlético; the other pages honestly show preparation state. A change of IMC manager must also be reviewed editorially before changing a historical cast.

No automated writing or publication is enabled. Next stage: ingest dated GW011 sporting events, deduplicate on source event ID, group related events, generate drafts with approved character profiles, review, then publish. Keep facts in structured records separate from fictional dialogue; do not publish unsupported transfers/results. Store credentials and draft-generation controls server-side with existing admin authentication. Never place private drafts in the public catalog.

Deploy via the dedicated series workflow; only listed files are uploaded. Do not run a broad website deployment for this feature.
