# 🛡️ ScamShield Bharat (स्कैमशील्ड भारत)

> **Evidence-First Financial Verification & Scam Resilience Assistant for Indian Investors**  
> *"Check the claim before you act."*

🌐 **Live Public Application:** **[https://scamshield-bharat-kappa.vercel.app](https://scamshield-bharat-kappa.vercel.app)**  
📊 **Interactive Presentation Deck:** **[`presentation/index.html`](presentation/index.html)**

---

## 📌 Problem

Indian retail investors, especially first-time digital-finance participants, face widespread financial cyber fraud:
- **Impersonation & Fake Regulators:** Fraudulent WhatsApp/Telegram groups falsely claiming SEBI or RBI registration.
- **Guaranteed Returns:** Unrealistic promises (e.g. "30% guaranteed monthly profit" or "pre-IPO quota allocations").
- **Coercive Urgency & Account Suspension Panics:** Phishing SMS claiming "Your KYC has expired tonight; trading account will be blocked" with malicious links.
- **Remote Access & Sideloaded APKs:** Fraudsters demanding remote-control apps (AnyDesk, QuickSupport) or custom APK downloads to compromise bank accounts.

---

## 👤 Target User

- **Primary:** Emerging and first-time digital-finance users in Tier-2 and Tier-3 Bharat receiving unsolicited financial proposals over WhatsApp, Telegram, or SMS.
- **Secondary:** Senior citizens, vernacular Hindi users, and individuals seeking independent pre-action verification before sending funds.

---

## 💡 Solution Architecture

$$\text{Suspicious Content} \longrightarrow \text{Claims} \longrightarrow \text{Risk Signals} \longrightarrow \text{Trusted Official Sources} \longrightarrow \text{Uncertainty} \longrightarrow \text{Safe Next Steps}$$

1. **Suspicious Content Ingestion:** Accepts untrusted text, screenshot images, or web links with in-memory PII masking.
2. **Claim Extraction:** Isolates explicit financial assertions (guaranteed returns, artificial deadlines, regulatory claims).
3. **Risk Signal Detection:** Matches content against 20 calibrated fraud patterns in English and Hindi.
4. **Cross-Examination Matrix:** Correlates claims with official SEBI, RBI, CERT-In, and Cybercrime advisories.
5. **Epistemic Uncertainty:** Transparently separates verified facts from unverifiable claims (*"Unverified does not mean false"*).
6. **Safe Next Steps:** Provides a containment protocol (**STOP, PROTECT, VERIFY, REPORT Helpline 1930, RECOVER**).

---

## 🚀 Actual Capabilities

- **Suspicious Text Analysis:** Real-time extraction of financial promises and threat indicators.
- **Screenshot / Image Analysis:** Safe image validation with context analysis (blank/unrelated images return structured `UNABLE_TO_ASSESS` without synthetic scam injection).
- **Web Link Security Analysis:** Structural URL validation, domain heuristics, and SSRF prevention.
- **Claim Cross-Examination Matrix:** Responsive 5-column investigation matrix mapping claims to official circulars.
- **Deterministic Risk Signals:** 20 regulatory fraud pattern detectors.
- **Epistemic Uncertainty Handling:** Clear disclosure of what could not be independently verified.
- **Bilingual Accessibility:** Full English and Devanagari Hindi support (`EN | हिंदी`).
- **Audio Readout:** On-device Web Speech API audio briefings.
- **Official Reporting Links:** Direct access to National Cybercrime Helpline (1930) and regulatory registries.

---

## ⚖️ Non-Advisory Guardrails

ScamShield Bharat enforces strict non-advisory guardrails:
- ❌ **No stock tips or investment picks.**
- ❌ **No buy, sell, or hold recommendations.**
- ❌ **No stock price predictions or market targets.**
- ❌ **No commercial broker, instrument, or scheme promotions.**
- ❌ **No personalized fiduciary investment advice.**

---

## 🔒 Privacy & Security

Implemented security controls:
- **In-Memory PII Masking:** Regex-based sanitization of Indian phone numbers (+91), PAN cards, Aadhaar, bank accounts, and OTPs before processing.
- **Zero Data Retention:** Stateless execution; submissions are analyzed in-memory and raw data is discarded without database persistence.
- **SSRF Defense:** URL parser blocks `localhost`, RFC 1918 private subnets, cloud metadata (`169.254.169.254`), and non-HTTP protocols.
- **Upload Hardening:** MIME header, magic byte inspection, and 5MB size limits; executable extensions (`.exe`, `.apk`, `.bat`) rejected.
- **Rate Limiting:** In-memory sliding-window limiter ($30\text{ requests/min/IP}$) preventing automated abuse.

> *Disclaimer: No automated system is 100% infallible. ScamShield provides educational risk assessments and does not replace official law enforcement investigations or certified financial fiduciary consultation.*

---

## 🏛️ Official Sources Registry

| Official Source | Regulatory Domain | Purpose in ScamShield |
|---|---|---|
| **SEBI Recognised Intermediaries** | [sebi.gov.in](https://www.sebi.gov.in/) | Registration verification for brokers, RAs, and IAs |
| **SEBI Spot Any Scam** | [investor.sebi.gov.in](https://investor.sebi.gov.in/) | Official circulars on guaranteed return schemes & social tipping |
| **RBI Sachet Portal** | [sachet.rbi.org.in](https://sachet.rbi.org.in/) | Registry check for unauthorized deposit collectors |
| **National Cybercrime Portal** | [cybercrime.gov.in](https://www.cybercrime.gov.in/) | Direct citizen reporting for financial cyber fraud |
| **Cybercrime Helpline 1930** | `tel:1930` | 24/7 Financial Cyber Fraud Emergency Helpline (MHA / I4C) |
| **CERT-In Alerts** | [cert-in.org.in](https://www.cert-in.org.in/) | Malicious APK, phishing, and remote-access software alerts |

---

## 🛠️ Tech Stack & Third-Party Disclosures

- **Frontend & Backend Framework:** Next.js 14 (App Router), React 18, TypeScript.
- **Styling:** Tailwind CSS with custom institutional financial palette.
- **Validation & Schemas:** Zod.
- **Testing:** Vitest (79 automated tests across 7 test suites).
- **Icons:** Lucide React.
- **Hosting & Edge Delivery:** Vercel Production.
- **AI & LLM Technology:** Google Gemini 1.5 Flash (used as optional plain-language summary synthesis; core classification engine operates 100% deterministically offline).
- **Speech Synthesis:** W3C Web Speech API (`window.speechSynthesis`).

---

## ⚠️ Known Limitations

1. **Independent Verification Scope:** ScamShield routes users to official registries (SEBI, RBI) for manual lookup rather than maintaining a private mirror of all intermediary licenses.
2. **URL Safety Heuristics:** Remote JavaScript is never executed from submitted links; analysis is based strictly on structural domain heuristics and phishing patterns.
3. **OCR Scope:** Image processing evaluates uploaded screenshots safely; complex multi-layered infographics with low contrast may require user-entered context notes.

---

## 📦 Local Development

### Prerequisites
- Node.js 18.x or 20.x
- npm 9.x+

### Getting Started
```bash
# 1. Clone repository
git clone https://github.com/your-org/scamshield-bharat.git
cd scamshield-bharat

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
# Running on http://localhost:3000
```

### Environment Configuration
Copy `.env.example` to `.env.local` (optional — offline deterministic mode runs with zero configuration):
```bash
cp .env.example .env.local
```

---

## 🧪 Automated Testing

ScamShield Bharat maintains a comprehensive automated test suite (79 unit, integration, and adversarial tests):

```bash
# Run test suite
npm test

# Run linter
npm run lint

# Run TypeScript typecheck
npx tsc --noEmit

# Run production build
npm run build
```

---

## 🌐 Live Deployment

Production URL: **[https://scamshield-bharat-kappa.vercel.app/](https://scamshield-bharat-kappa.vercel.app/)**
