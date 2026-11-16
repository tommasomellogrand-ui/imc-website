# World identity migration verification

Canonical identifiers IMC001–IMC008 are persisted in the active CORE and Custom datasets. The six CORE and fifty-six Custom per-table plans completed successfully. Transformed unique keys had no collisions; active world-reference columns have no remaining GW or hyphenated IMC values. All eight world registries retain eighty national teams.

Row counts are unchanged across all sixty-two checked tables. Checksums of non-identity fields are unchanged in CORE and in all primary sporting tables. The six derived IMC_Site_* tables changed their automatic synced_at timestamp (ON UPDATE CURRENT_TIMESTAMP), as expected from the identity update; their counts are unchanged. Original triggers were restored and leading normalization triggers prevent legacy inputs from being persisted.

The final views plan updates eight legacy projections and the IMC005 youth view to expose/filter canonical identifiers. Inactive reserve tables remain untouched as historical backups. Legacy input envelopes remain accepted for downloaded importers; canonical clients request format=canonical.
