import "dotenv/config";
import { readFileSync, existsSync, appendFileSync } from "node:fs";
import { normalizeLead, draftReply } from "./agent.js";

// Read the lead from a file argument, or from stdin.
function readInput() {
  const fileArg = process.argv[2];
  if (fileArg) return readFileSync(fileArg, "utf8");
  try {
    return readFileSync(0, "utf8"); // stdin
  } catch {
    return "";
  }
}

function logLead(lead, reply) {
  const path = "leads-log.csv";
  const header = "timestamp,name,language,service_type,location,frequency,urgency,reply\n";
  if (!existsSync(path)) appendFileSync(path, header);

  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const row =
    [
      new Date().toISOString(),
      lead.name,
      lead.language,
      lead.service_type,
      lead.location,
      lead.frequency,
      lead.urgency,
      (reply || "").replace(/\n/g, " "),
    ]
      .map(esc)
      .join(",") + "\n";

  appendFileSync(path, row);
}

async function main() {
  const raw = readInput().trim();
  if (!raw) {
    console.error("No input. Usage: node src/index.js samples/lead-en.txt");
    process.exit(1);
  }

  console.log("\n=== RAW LEAD ===\n" + raw + "\n");

  const lead = await normalizeLead(raw);
  console.log("=== PARSED (JSON) ===");
  console.log(JSON.stringify(lead, null, 2) + "\n");

  const reply = await draftReply(lead);
  console.log(`=== SUGGESTED REPLY (${lead.language}) ===\n` + reply + "\n");

  logLead(lead, reply);
  console.log("Logged to leads-log.csv. Review the reply above, then paste it into the Yelp conversation.\n");
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
