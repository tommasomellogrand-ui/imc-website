# IMC | SM MASTER DATABASE

Global canonical Soccer Manager / SoccerWiki data store. No Game World-specific data belongs here.

Baseline snapshot: 2026-09-03.

Sources supported:
- Soccer Manager `superworldsdata.xml`: players, clubs.
- SoccerWiki JSON: players, clubs, leagues, cups, stadiums, football managers, national teams, international cups, awards, player action images.

The Aruba admin importer uploads files in 512 KiB chunks, archives the original source file by SHA-256, writes source tables idempotently, and rebuilds canonical master tables. MySQL credentials are generated only during deployment from GitHub repository secrets and are never committed.
