const { readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const importers = join(__dirname, "..", "importers");
const source = readFileSync(join(importers, "IMC_Match_Report_Import_V3.js"), "utf8");
const setting = "    const BACKFILL = false;";
if (source.split(setting).length !== 2) throw new Error("Match Report backfill setting missing or duplicated");

writeFileSync(
    join(importers, "IMC_Match_Report_Backfill_Import_V3.js"),
    source.replace(setting, "    const BACKFILL = true;")
);
