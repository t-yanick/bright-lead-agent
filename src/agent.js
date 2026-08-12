import { NORMALIZE_SYSTEM, buildReplySystem } from "./prompts.js";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function callOpenRouter(messages, { temperature = 0.4 } = {}) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("Missing OPENROUTER_API_KEY. Copy .env.example to .env and add your key.");
  }
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

// Some models wrap JSON in ```json fences. Strip them before parsing.
function stripFences(text) {
  return text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

// Step 1: turn a messy lead into clean structured data.
export async function normalizeLead(rawLead) {
  const content = await callOpenRouter(
    [
      { role: "system", content: NORMALIZE_SYSTEM },
      { role: "user", content: rawLead },
    ],
    { temperature: 0 }
  );

  try {
    return JSON.parse(stripFences(content));
  } catch {
    throw new Error(`Could not parse normalize output as JSON:\n${content}`);
  }
}

// Step 2: write the customer-facing reply, in their language.
export async function draftReply(lead) {
  const bookingLink = process.env.BOOKING_LINK || "https://brightcleaningservices.ca/contact";
  const system = buildReplySystem({ ...lead, bookingLink });

  return callOpenRouter(
    [
      { role: "system", content: system },
      { role: "user", content: lead.raw_message || "" },
    ],
    { temperature: 0.5 }
  );
}
