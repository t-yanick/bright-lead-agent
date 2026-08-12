# Bright Lead Agent

A bilingual (French / English) AI lead-response agent for a real Montreal cleaning business, **Bright Cleaning Services**. It reads an incoming lead, extracts the key details, and drafts a warm, on-brand reply in the customer's own language — with a human approving the send.

This is **v1: human-in-the-loop by design.** The AI does the reading and writing; a person clicks send. That is a deliberate reliability choice, not a shortcut (see below).

## The problem

Local service businesses live and die on **speed-to-lead** — the faster you reply, the more jobs you win. But leads arrive from many places (Yelp, website, Bark, Google, phone) and in **two languages**, so replies are slow and inconsistent, and some leads are missed entirely.

## What it does (v1)

Given the raw text of a lead, the agent:

1. **Parses** it into structured data (name, language, service type, location, frequency, urgency).
2. **Detects the language** (FR/EN) and drafts a reply in that language.
3. **Asks only the qualifying questions that are still missing** (space size, frequency, area).
4. **Refuses to invent prices** — it promises a quote once details are known.
5. **Logs** every lead + drafted reply to a CSV.

The human reviews the draft and pastes it into the conversation. Under a minute of effort per lead, in the right language, every time.

## Why human-in-the-loop is a feature

The reply drafting is automated; the **send is gated on human approval**. For a business that touches real customers, that means:

- No wrong or hallucinated information reaches a customer.
- No prices are ever quoted without a person confirming.
- Every action is logged and reviewable.

This is the same guardrail / human-approval pattern production agent teams ask for. v2 automates the send once the drafts are trusted — the approval gate stays configurable.

## Architecture

```
v1 (this repo) — human-in-the-loop
  raw lead ──▶ [normalize LLM] ──▶ structured JSON ──▶ [reply LLM] ──▶ draft reply
                                                                          │
                                                          human reviews & sends
                                                                          │
                                                                    CSV lead log

v2 (roadmap) — automated
  Yelp lead ──▶ Zapier ──▶ n8n (same two LLM steps) ──▶ Zapier posts reply ──▶ Google Sheet + notify
```

The two LLM steps are the reusable "brain." Everything else (Zapier, n8n, channels) is plumbing that swaps per client.

## Quickstart

Requires Node.js 18+ and an [OpenRouter](https://openrouter.ai) API key.

```bash
npm install
cp .env.example .env      # then add your OPENROUTER_API_KEY
npm run lead:en           # try the English sample
npm run lead:fr           # try the French sample
```

Run against your own lead text:

```bash
node src/index.js path/to/lead.txt
# or pipe it in:
echo "Bonjour, besoin d'un ménage..." | node src/index.js
```

## Example output

Input (`samples/lead-en.txt`):

> Hi, I found you on Yelp. We just bought a condo in Griffintown and need a deep clean before we move in next weekend. It's a 2-bedroom, around 900 sq ft. Do you do move-in cleaning? What would that cost?

Parsed:

```json
{
  "name": null,
  "language": "en",
  "service_type": "move-in-out",
  "location": "Griffintown",
  "frequency": "one-time",
  "urgency": "high",
  "raw_message": "Hi, I found you on Yelp..."
}
```

Drafted reply:

> Thanks so much for reaching out! Yes, we do move-in deep cleaning, and a 2-bedroom in Griffintown is right in our service area. To lock in your slot before next weekend, could you confirm the exact date you'd like us there? I'll put together a quote once I have that. You can also book a quick visit here: https://book.squareup.com/appointments/mx5y0typl5fa4a/location/L4J9D8CW0ECV9/services — looking forward to helping you settle in!
>
> Bright Cleaning Services

## Roadmap

- **v1 (done):** manual, human-in-the-loop lead responder.
- **v1.1:** 24h follow-up nudge; Google Sheets logging.
- **v2:** automated Yelp path via Zapier + n8n (auto-post reply, notify owner).
- **v2.1:** add email-intake (Bark, Google, direct email) through the same brain.
- **v3:** WhatsApp + Facebook/Instagram channels.

## Tech

Node.js · OpenRouter (model-agnostic LLM access) · CSV logging · zero heavy dependencies.

## License

MIT
