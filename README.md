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
- **AI Engine**: Google Gemini 3.8 Flash (REST API — structured JSON output mode)
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
- Gemini 3.8 Flash integrated with system prompt engineering, JSON output mode, and graceful offline heuristic fallback
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
✓ piiRedactor.test.ts         5 tests — SSN, email, phone, card, restore
✓ heuristicsEngine.test.ts    6 tests — segmentation, risk detection, readability
✓ contractComparator.test.ts  1 test  — live AI comparison with unfavorable classification
─────────────────────────────────────────────────────
  12 Tests | 3 Files | 100% Pass Rate
```

### Efficiency

- Offline heuristic fallback engine — full functionality even without API
- Token-optimized prompts with 14K character document chunking
- Lazy analysis triggers, no auto-requests on idle

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
│       ├── piiRedactor.test.ts
│       ├── heuristicsEngine.test.ts
│       └── contractComparator.test.ts
├── .env                               # Gemini API key (pre-configured)
├── .env.example                       # Template for other devs
└── vite.config.ts
```

---

## Setup Instructions

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Replace API key in .env
#    Default key is pre-configured for the demo
cp .env.example .env

# 3. Start development server
npm run dev        # http://localhost:3000

# 4. Run automated test suite
npm test

# 5. Production build (TypeScript checked)
npm run build
```

---

## Ethical & Legal Notes

- Lawgin provides **legal information and educational document analysis**, not formal legal advice
- It does **not** establish an attorney-client relationship
- All AI outputs clearly cite source clauses and disclose AI-generated nature
- Users are encouraged to consult a licensed attorney for binding legal decisions

---

*Built for the AI for Legal Assistance & Access Hackathon*
