# Reddit Launch Posts — Per-Subreddit Drafts

**Reddit rules to follow or get banned fast:**
1. Never copy-paste the same post into multiple subs. Reddit detects this and shadowbans.
2. Read each sub's rules first. Some require flair. Some forbid promotion. Some require an "I made this" tag.
3. Wait at least 24 hours between subs.
4. Reply to every comment in the first 4 hours.
5. Don't use marketing-speak. Reddit smells it instantly.

---

## 1. r/developersIndia (~600k members)

**Title:** `I built a yearly progress tracker for Indian devs — covers job search, certs, SIPs, and side projects. Free demo inside.`

**Flair:** General / Showcase (check current sub flairs)

**Body:**
```
Background: I'm a software engineer in [your city]. Last year I realized I was opening 5 different apps to track different parts of my life — Notion for goals, a spreadsheet for SIPs, LinkedIn for job applications, a Google doc for certs. None of them gave me the one view I actually wanted.

So I built one. It's a single dashboard with 8 tabs:
- Life Goals (with current vs target progress)
- Certifications (study hours tracked, not just %)
- Side Projects (with milestones)
- Job Search Pipeline (Applied / Interview / Offer / Rejected)
- Investments (₹, SIPs, emergency fund, target amounts)
- Travel
- Ideas notepad
- Overview (radar chart, year progress, monthly trend)

A few decisions I'm proud of:
- Single-file HTML — runs in any browser, no install, no signup
- Data lives in localStorage — nothing leaves your machine
- Currency switcher (₹ default, but works for €/$/£)
- Backup/restore as JSON in case browser data clears

Why it might be useful for r/developersIndia specifically: certs (AWS, GCP, PMP) are a huge part of our career narrative, and I haven't found a tracker that integrates cert study hours + job apps + investments into one view that respects Indian realities (SIPs, ₹ amounts, 6-month emergency fund framing).

Free demo (open in browser, no signup): [LINK]

Code is React + Recharts + Tailwind CDN — totally inspectable.

Would love brutally honest feedback. What's missing? What's bloated? What do you actually want from a tracker like this?

(Note: there's also a paid kit with a Notion template + planner if anyone wants more, but the demo is the full app — happy if everyone just uses that.)
```

**Why this works on r/developersIndia:** No marketing tone, asks for feedback (Reddit's love language), discloses the paid version transparently at the bottom (Reddit hates hidden monetization but is fine with honest disclosure).

---

## 2. r/IndiaInvestments (~400k)

**Title:** `Made a simple SIP + emergency-fund + investment-goals dashboard — works offline, free demo`

**Flair:** Tools / Resources

**Body:**
```
Hi all — built this for myself first and figured it might be useful here.

It's a single-page dashboard where you can plug in:
- Your emergency fund (target = 6 months expenses by default — feel free to override)
- Monthly SIPs in mutual funds (current vs annual target)
- Other instruments (crypto, FDs, EPF, custom)
- Life goals tied to financial targets

It shows:
- A portfolio breakdown pie chart
- Total saved vs total target
- Per-instrument progress bars

What it's NOT:
- It's not Kuvera / INDmoney — it doesn't pull live NAV, doesn't connect to your demat. You enter values manually (which is also why your data stays on your device).
- It's not a robo-advisor — it doesn't tell you what to invest in.

What it IS:
- A clean, single-screen view of your savings/investing plan for the year
- Currency-flexible (defaults to ₹)
- Local-first: your numbers never leave your browser

Free demo: [LINK]

I wanted something that wasn't a SaaS subscription and didn't ask me for OAuth into my bank, and figured a manual-entry tracker is fine because most of us only update once a month anyway.

Would appreciate feedback — especially if you're tracking something I missed (PPF, NPS, SGB, real estate?).
```

---

## 3. r/de (~500k members, German-speaking sub)

**Title (English is fine on r/de — the audience is bilingual):** `I built a privacy-first yearly progress dashboard — local-only, works offline. Looking for DACH feedback.`

**Body:**
```
Hi r/de,

I'm a software engineer (based in India, but most of my friends and a chunk of my professional network are in Germany). I built a yearly tracker for myself and shipped it as a small product.

Why I'm posting here: I noticed a lot of the productivity tools in this space (Sunsama, Motion, Reclaim, Notion templates) are either subscription-based or want you to upload your data to their cloud. I wanted something that:

- Stores everything in your browser's localStorage — nothing is sent to a server
- Works completely offline
- Is a single HTML file you can self-host or just keep on your hard drive
- Costs once or is free, no monthly subscription

It tracks 8 things on one screen: goals, certifications, projects, finances, job applications, travel, ideas, and a year-overview with a life-balance radar chart.

The free demo is here, open it in any browser: [LINK]

I'd love feedback specifically from a DACH perspective:
- Does the privacy / local-first framing land for you, or is it overdone?
- Currency is switchable (€/₹/$/£) — anything else culturally that's missing? (e.g., I noticed German users often want a "Krankenversicherung / Steuerklasse" line — would that be useful in v2?)
- The structure is in English — would a German UI translation help, or is English fine for working professionals?

It's not a Notion template, not a SaaS, just a self-contained file. Genuinely curious what works and what doesn't for this audience.
```

**Why this works on r/de:** Acknowledges the audience explicitly, asks specific feedback questions (Reddit loves being asked), shows you're not just dumping a generic post. The German-specific question at the bottom shows you've thought about them.

---

## 4. r/indiehackers (Indie Hackers community on Reddit, ~50k)

**Title:** `Launched my first $0-infra product: 2026 Life OS — a single-file yearly tracker. Day 1 retrospective.`

**Body:**
```
Just launched after a 3-week sprint. Here's the build:

**Product:** 2026 Life OS — a yearly progress tracker for professionals (goals, certs, projects, finances, jobs, travel, ideas, overview).

**Stack:**
- Single-file React app via CDN imports + Babel standalone (no build step)
- localStorage for persistence
- Tailwind CDN for styling
- Recharts for visualization
- Total bundle: 1 HTML file, ~70KB

**Infra cost:** $0
- Free demo: GitHub Pages
- Checkout: Gumroad (handles EU VAT automatically — important for me since I'm targeting both India and DACH)
- Landing page: my existing blog
- Analytics: GoatCounter free tier

**Pricing:** ₹499 / €6.99 / ~$5.99 — one-time

**What's in the kit:**
- The standalone HTML
- Notion template mirror
- Goal-setting guide PDF
- Printable planner PDF

**Why I'm posting here:** The decision I want to validate is whether local-first + zero-subscription is the right wedge in 2026, or whether I'm leaving money on the table by not building auth + sync.

Initial signal will come from: ratio of free demo users → paid kit buyers, and which feature requests dominate in the first 30 days. If "I want sync" comes up in 50%+ of DMs, v2 needs auth. If it's <20%, the local-first thesis holds.

**Demo:** [LINK]
**Kit:** [LINK]
**Build retro Twitter thread:** [LINK if you have one]

Happy to answer any questions about the build, the marketing approach, or the Notion-template-vs-web-app tradeoffs.
```

**Why this works:** IH audience cares about transparency, build details, and the strategic decision. They reward $0-infra stories.

---

## 5. r/getdisciplined (~3.5M members, global, English)

**Title:** `I built a one-screen yearly dashboard so I'd stop opening 5 apps to check on my life. Free demo.`

**Body:**
```
For the past 4 months I've been using a single dashboard to track my year across 8 dimensions: goals, certifications, projects, job search, investments, travel, ideas, and an overview.

Three things changed for me:

1. **Tracking goals against a target instead of as a binary.** Instead of "lose weight: yes/no" I have "Health & Fitness: 20% → target 60%." The first time I saw 20% I started running again.

2. **Certifications in study hours, not "I'll get to it."** Showing "32 of 80 hours done" creates much stronger pull than "I'll do my AWS sometime."

3. **One screen.** When I had it spread across Notion, spreadsheets, and a journal, I avoided looking at the parts I was failing on. One screen forces honesty.

I shipped it as a free web app — no signup, your data stays in your browser, works offline.

Demo: [LINK]

Would be curious whether the 8-dimension structure resonates for others, or whether you'd cut/add. The idea isn't to use mine specifically — it's to find a structure that forces you to look at all of your life weekly, not just the parts that are going well.
```

**Why this works:** Discipline subs reward insight and self-honesty over self-promotion. The post leads with three insights, then mentions the tool in passing. This is the way.

---

## 6. r/ProductivityApps (~150k)

**Title:** `2026 Life OS — single-file yearly tracker, no signup, works offline (free + ₹499/€6.99 paid kit)`

**Body (shorter is fine here, this sub is direct):**
```
Built this for myself, productized it for others. One dashboard, 8 sections (goals, certs, projects, jobs, investments, travel, ideas, overview). 

Key differences from Notion / Sunsama / Tability:
- No signup, no subscription
- localStorage-only — your data never leaves your browser
- Single HTML file (~70KB)
- Free demo, full kit ₹499/€6.99 (Notion template + planner included)

Free demo: [LINK]

Genuinely interested in feedback on the section structure — is the 8-section split right, or is there bloat?
```

---

## Posting calendar (do not deviate)

| Day | Sub | Time |
|---|---|---|
| Launch day Tue | r/developersIndia | 9:00 IST |
| Launch day Tue | r/indiehackers | 18:00 IST (= 14:30 CET = 8:30 ET, hits Europe + US) |
| Wed +1 | r/getdisciplined | 8:00 ET |
| Thu +2 | r/IndiaInvestments | 9:00 IST |
| Fri +3 | r/de | 9:00 CET |
| Sat +4 | r/ProductivityApps | 10:00 ET |

---

## Comment-reply playbook

For every comment you receive, in this order of priority:

1. **Direct feedback** ("the radar chart is confusing") — thank, ask follow-up: *"That's useful — was it the labels, the scale, or the radar metaphor itself? Trying to figure out if I should redesign or kill it."*
2. **Feature request** — acknowledge, log it (literally add it to the Ideas tab), say you'll consider for v2.
3. **"Cool, will check it out"** — quick thanks + "would love your thoughts after you try it."
4. **Skeptic / hostile** — never argue. Acknowledge their point, then state your tradeoff calmly. Walking away is fine.
5. **Buyer / interested in paid** — DM them within an hour with the Gumroad link and a "let me know if you have any setup questions."

The first 4 hours determine the post's reach. Reply fast.
