# Lawgin — GenAI Legal Intelligence & Access Platform

> **Hackathon Submission** | AI for Legal Assistance & Access

A production-grade, full-stack GenAI legal assistant powered by **Gemini 3.8 Flash** that democratizes legal document comprehension, contract risk analysis, and attorney consultation preparation.

---

## Live Demo

```bash
npm install && npm run dev   # Opens at http://localhost:3000
```

---

## 8 Core Feature Modules

| # | Module | Description |
|---|--------|-------------|
| 1 | **Document Studio** | Upload custom contracts or select from 4 pre-loaded benchmark agreements with real hidden traps |
| 2 | **Plain-English Simplifier** | Multi-persona translations (Tenant / Freelancer / Consumer / Business) with TTS narration |
| 3 | **Risk Radar + Trap Detector** | Animated 0-100 risk gauge, predatory clause detection (auto-renewals, arbitration, IP grabs, indemnity) |
| 4 | **Contract Redline Comparator** | Side-by-side diff of two versions with favorable/unfavorable impact classification |
| 5 | **Citation-Grounded Q&A** | Ask any question, get answers backed by exact clause citations with jump-to-clause |
| 6 | **"What If?" Scenario Simulator** | Test real situations and preview penalties, legal exposure, and step-by-step action plans |
| 7 | **Actions & Counter-Proposal** | Compliance deadline checklist + AI-drafted redline negotiation email |
| 8 | **Attorney Intake Dossier** | Printable 1-page briefing with 5 strategic questions to maximize consultation ROI |

---

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite 6
- **AI Engine**: Google Gemini API (`gemini-3.7-flash`, REST + structured JSON output) with an automatic free-model fallback ladder (`3.7 → 3.6 → 3.5 → 3.1-flash-lite`)
- **Styling**: Tailwind CSS v4 + a custom **"Classical Lex"** design system — a Greek/Roman legal idiom (ink, marble, gilded bronze, laurel, terracotta)
- **Icons**: Lucide React
- **Testing**: Vitest (12 automated tests, 3 files, 100% pass rate)
- **Fonts**: Cinzel (inscriptional display), Cormorant Garamond (law reading), Inter (UI), Lexend (dyslexia), Fira Code (code)

---

## Visual Identity — "Classical Lex"

Lawgin is dressed as a classical hall of law rather than a generic dark dashboard:

- **Palette**: near-black basalt ink, warm marble/parchment, gilded gold + bronze accents, laurel green for safe clauses, terracotta for critical risk.
- **Typographic system**: Cinzel inscriptional capitals for headings, Cormorant Garamond for legal reading, Inter for UI chrome.
- **Dynamic backdrop** (`src/components/ClassicalBackdrop.tsx`): a receding colonnade with cursor parallax, a torch-light glow that tracks the pointer, drifting dust motes drawn on canvas, scrolling Greek-key (meander) friezes, and a slowly rotating seal of justice.
- **Motion graphics**: animated risk-index count-up and gauge, gilded sheen on primary actions, staggered tab reveals, and full `prefers-reduced-motion` support.
- **Themes**: "Night" (ink & gold) and "Daylight" (marble & bronze) plus a WCAG-AAA high-contrast mode — all driven by themeable Tailwind color tokens.

---

## Evaluation Criteria Coverage

### High Impact

- All 7+ problem statement use cases implemented end-to-end
- Gemini API integrated with system prompt engineering, JSON output mode, and graceful offline heuristic fallback
- API key read from environment variables only (never hardcoded), sent via the `x-goog-api-key` header, and redacted client-side before any request
- Predatory trap detection: forced arbitration, auto-renewals, IP surrender, uncapped indemnity

### Security

- **Client-Side PII Shield**: Redacts SSNs, emails, phone numbers, addresses, card numbers BEFORE AI processing
- **Non-UPL Ethical Guardrails**: Persistent disclaimers, citation verification, hallucination guardrails
- **API Key Safety**: Key stored in localStorage, transmitted only to Google's official API endpoint

### Accessibility (WCAG AA/AAA)

- Text-to-Speech narration via Web Speech API
- Dyslexia-Friendly Font Toggle (Lexend)
- High-Contrast Mode (WCAG AAA)
- Font Size Cycler: Normal / Large / X-Large
- Keyboard navigation with ARIA landmarks and focus states

### Code Quality

- Modular service layer: `GeminiService`, `HeuristicsEngine`, `PIIShieldService`, `TTSService`
- Full TypeScript strict mode across all files
- Centralized domain types in `types/legal.ts`

### Testing

```
✓ piiRedactor.test.ts          5 tests — SSN, email, phone, card, restore
✓ heuristicsEngine.test.ts     6 tests — segmentation, risk detection, readability
✓ contractComparator.test.ts   2 tests — model classification + offline fallback
✓ geminiService.test.ts        8 tests — model config, free-tier failover, header auth, JSON parsing, no-key degradation
✓ app.render.test.tsx          2 tests — App shell, all 8 modules, skip link, live region
──────────────────────────────────────────────────────
  23 Tests | 5 Files | 100% Pass Rate   (npm run test:coverage)
```

All network calls are mocked, so the suite is deterministic and offline.

### Efficiency

- **Code-split modules** — only the default tab ships in the initial bundle; the other 7 load on demand
- **Memoized PII redaction** — the multi-regex sweep runs only when the document changes, not on every render
- **Paused render loop** — the animated backdrop stops its `requestAnimationFrame` loop when the tab is hidden
- **Cheap structured output** — thinking tokens disabled (`thinkingBudget: 0`), 8K output cap, 14K character document chunking
- **Free-tier failover** — rate-limited models are skipped automatically instead of failing the request
- Offline heuristic fallback engine — full functionality even without an API key

---

## Project Structure

```
Lawgin/
├── src/
│   ├── types/legal.ts                 # All domain types
│   ├── services/
│   │   ├── geminiService.ts           # Gemini AI integration + system prompt
│   │   ├── heuristicsEngine.ts        # Offline legal rule engine
│   │   ├── piiRedactor.ts             # Client-side PII sanitization
│   │   └── ttsService.ts              # Web Speech API narrator
│   ├── data/sampleContracts.ts        # 4 realistic contracts with traps
│   ├── components/
│   │   ├── ClassicalBackdrop.tsx      # Animated Greek/law motion backdrop
│   │   ├── Header.tsx
│   │   ├── DisclaimerBanner.tsx
│   │   ├── ApiKeyModal.tsx
│   │   ├── DocumentStudio/
│   │   ├── Simplifier/
│   │   ├── RiskRadar/
│   │   ├── ContractComparator/
│   │   ├── GroundedQA/
│   │   ├── ScenarioSimulator/
│   │   ├── ActionChecklist/
│   │   └── LawyerBrief/
│   └── tests/
│       ├── setup.ts                    # jsdom browser-API stubs
│       ├── piiRedactor.test.ts
│       ├── heuristicsEngine.test.ts
│       ├── contractComparator.test.ts
│       ├── geminiService.test.ts
│       └── app.render.test.tsx
├── .env                               # Gemini API key (pre-configured)
├── .env.example                       # Template for other devs
└── vite.config.ts
```

---

## Setup Instructions

```bash
# 1. Install dependencies
npm install

# 2. Add your free Gemini key to .env
#    Get one at https://aistudio.google.com/app/apikey
cp .env.example .env   # then edit VITE_GEMINI_API_KEY

# 3. Start development server
npm run dev        # http://localhost:3000

# 4. Run automated test suite  (npm run test:coverage for coverage)
npm test

# 5. Production build (TypeScript checked)
npm run build
```

---

## Deployment (Vercel)

The repo ships a `vercel.json` (Vite build + SPA rewrite + security headers).

1. Push the repository to GitHub and **Import** it in Vercel (framework auto-detects Vite).
2. Add these **Environment Variables** in the Vercel project before deploying —
   `.env` is gitignored, so the key is never committed:
   - `VITE_GEMINI_API_KEY` — your Gemini key
   - `VITE_GEMINI_MODEL` — `gemini-3.7-flash`
3. Deploy. Security headers (`CSP`, `X-Frame-Options: DENY`, `nosniff`, HSTS) are applied automatically.

---

## Ethical & Legal Notes

- Lawgin provides **legal information and educational document analysis**, not formal legal advice
- It does **not** establish an attorney-client relationship
- All AI outputs clearly cite source clauses and disclose AI-generated nature
- Users are encouraged to consult a licensed attorney for binding legal decisions

---

*Built for the AI for Legal Assistance & Access Hackathon*
