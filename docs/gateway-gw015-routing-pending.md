# Gateway GW001–GW015
Prepared range extension for standard routing, explicit importer routing, ingress namespace and Transfers validation.
Explicit importer routing now uses the same configuration as standard and ingress routing.
All six importer repositories are covered by routing regression tests, in both database families.

## Deployment prerequisite
The production config currently assigns only GW001–GW009.
Assign GW010–GW015 to gold_worlds or custom_worlds before deployment.
The raw repository tables exist in BOTH databases, so table existence is not routing evidence.
Aruba CORE and gw_game_worlds inspections did not establish assignments for these six worlds.
Do not deploy this branch as a completed activation until those assignments are provided.
