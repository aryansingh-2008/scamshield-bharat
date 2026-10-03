# 🛡️ ScamShield Bharat — Final SANGYAN Judging Presentation Deck (15 Slides)

**Event:** SANGYAN — Investor Resilience Hackathon  
**Organizers:** SNTC, IIT (BHU) Varanasi in collaboration with SEBI and NSDL  
**Project:** ScamShield Bharat (स्कैमशील्ड भारत)  
**Tagline:** “Check the claim before you act.”  
**Live URL:** [https://scamshield-bharat-kappa.vercel.app/](https://scamshield-bharat-kappa.vercel.app/)  
**GitHub Repository:** [https://github.com/aryansingh-2008/scamshield-bharat](https://github.com/aryansingh-2008/scamshield-bharat)  
**PowerPoint File:** `presentation/SCAMSHIELD-BHARAT-FINAL-SANGYAN-DECK.pptx`  
**Web Deck View:** `presentation/index.html`  

---

## Slide 1: Title & Vision
### SCAMSHIELD BHARAT
> **“Check the claim before you act.”**
* **Subtitle:** Evidence-first investor safety console for checking suspicious financial messages, screenshots, and web links against trusted regulatory records.
* **Hackathon:** SANGYAN — Investor Resilience Hackathon (SNTC, IIT (BHU) × SEBI × NSDL)
* **Live Deployment:** [https://scamshield-bharat-kappa.vercel.app/](https://scamshield-bharat-kappa.vercel.app/)
* **Engineering Validation:** 79/79 Automated Tests | 54/54 Red-Team Attack Vectors Passed
* *Source:* SANGYAN Official Hackathon Portal (https://sangyan.sntciitbhu.co.in/)

---

## Slide 2: The Problem
### THE MOMENT BEFORE MONEY LEAVES
* **Guaranteed Return Tipping Scams:** Unregistered operators promise '300% monthly returns' on Telegram/WhatsApp VIP channels using fake institutional allocations.
* **Regulatory & Authority Impersonation:** Fraudsters forge SEBI certificates, RBI letters, and police notices to threaten victims with tax penalties or digital arrest.
* **Urgency & Account Suspension Panics:** Coercive SMS alerts claim 'Trading account blocked tonight due to incomplete KYC' with clone phishing links.
* **Malicious APK Sideloading:** Victims are urged to install customized APK files or screen-sharing tools (AnyDesk/QuickSupport) to drain bank accounts.
* *Source:* SANGYAN Official Problem Statement | SEBI Fake Trading App & Social Media Fraud Advisory (investor.sebi.gov.in)

---

## Slide 3: Who We Build For
### A FIRST-TIME INVESTOR SHOULD NOT NEED TO BE A CYBERSECURITY EXPERT
* **Primary Persona — Tier-2 / Tier-3 Retail Investors:** First generation navigating smartphone trading and Demat apps; receives unverified WhatsApp forwards; needs simple Hindi/English explanations without legal jargon.
* **Senior Citizens & Families:** Targeted by coercive digital arrest scams and account block threats; needs high-contrast readability and direct 1-click 1930 Helpline access.
* **Digital Banking Beginners:** Pressured by artificial urgency (e.g. 'KYC expires in 15 mins'); needs calm 5-step action guidance (Stop, Protect, Verify, Report, Recover).
* *Source:* SANGYAN Participant Charter — Investor Resilience & Tier-2/3 Financial Inclusion Criteria

---

## Slide 4: The ScamShield Response
### FROM SUSPICION TO EVIDENCE
* **Pre-Action Safety Layer:** ScamShield does not give stock ratings, price predictions, or buy/sell calls. It provides an institutional verification buffer that arms investors with official evidence before money leaves.
* **Structured Pipeline:**
  1. *Ingestion:* Untrusted Message, Screenshot, or URL link
  2. *Claim Extraction:* Isolates returns, deadlines & entity endorsements
  3. *Risk Engine:* 20 Deterministic signals in English & Devanagari
  4. *Official Evidence:* Cross-examined with SEBI, RBI, MCA & CERT-In
  5. *Uncertainty Check:* Explicit disclosure of unverified claims
  6. *Safe Next Steps:* Calm action protocol + 1930 Cyber Helpline
* *Source:* ScamShield Bharat Decision Pipeline Architecture | Verified Codebase (`src/lib/risk-engine.ts`)

---

## Slide 5: Real User Journey
### ONE MESSAGE. ONE SAFETY CHECK.
* **Step 1 — Receive Suspicious Tip:** User receives urgent forward or screenshot on WhatsApp/Telegram.
* **Step 2 — Submit to ScamShield:** Pastes text, uploads screenshot, or inputs suspicious link (no login required).
* **Step 3 — In-Memory PII Redaction:** Aadhaar, PAN, UPI IDs, and phone numbers are scrubbed locally.
* **Step 4 — Deterministic Scan:** Risk engine checks 20 calibrated patterns in English and Hindi.
* **Step 5 — Evidence Cross-Exam:** Claims matched against SEBI circulars and official registries.
* **Step 6 — Uncertainty Surfaced:** System explicitly states what could and could not be verified.
* **Step 7 — Calm Next Actions:** User receives 5 safe steps: Stop, Protect, Verify, Report (1930), Recover.
* *Source:* Actual ScamShield Product Flow | Verified Deployment at https://scamshield-bharat-kappa.vercel.app/

---

## Slide 6: What ScamShield Detects
### RISK SIGNALS THAT MATTER BEFORE ACTION
* **[CRITICAL] Guaranteed / Fixed Returns:** Claims of assured 300% monthly profits or 'zero-risk' market investments.
* **[HIGH] Urgency & Artificial Pressure:** Countdown deadlines ('expires in 15 mins', 'only 2 seats remaining').
* **[CRITICAL] Regulatory Impersonation:** Fraudulent use of SEBI, RBI, MCA, or NSE/BSE logos, licenses, and names.
* **[CRITICAL] Third-Party / Mule UPI Accounts:** Directing funds to personal UPI handles or savings accounts instead of brokers.
* **[HIGH] Telegram & WhatsApp Funnels:** Diverting public users into private unmonitored VIP groups for trading tips.
* **[CRITICAL] Malicious APK & Screen Sharing:** Urging installation of sideloaded apps, AnyDesk, or QuickSupport tools.
* **[CRITICAL] Fake KYC & Digital Arrest:** Coercive claims of account freeze, narcotics packages, or police warrants.
* **[CRITICAL] Credential & OTP Demands:** Direct requests for trading PINs, netbanking passwords, or SMS OTPs.
* *Source:* Deterministic Detection Engine Rules (`src/lib/risk-engine.ts`) | SEBI Prohibited Schemes Framework

---

## Slide 7: Evidence-First Differentiation
### NOT “AI SAYS SCAM.” SHOW THE EVIDENCE.
* **Evidence Trail Concept:** Matrix structure connecting every user claim to a trusted regulatory citation, plain-language explanation, and risk state.
* **Epistemic Honesty:** Explicitly surfaces *What Could Not Be Verified* instead of hallucinating binary true/false classifications.
* **Official Source Grounding:** Direct clickable references to `sebi.gov.in`, `scores.gov.in`, `sachet.rbi.org.in`, and `cybercrime.gov.in` for independent user verification.
* *Source:* Verified Evidence Trail Engine (`src/components/EvidenceTrail.tsx`) | Official SEBI Circulars

---

## Slide 8: Three Realistic Scenarios
### THREE COMMON ATTACK PATHS IN BHARAT
* **Scenario A (Guaranteed Return + VIP Group):** “Invest ₹10,000 in VIP Trading group, get ₹50,000 guaranteed weekly.” → Flags Guaranteed Return & Telegram Funnel → SEBI Guaranteed Return Circular (EVID-SEBI-GUARANTEED-RETURNS).
* **Scenario B (Fake KYC + Phishing Link):** “Urgent: Your Trading Demat Account will be suspended tonight. Update KYC: bit.ly/kyc” → Flags Threat & Shortener → RBI Sachet Advisory on Phishing SMS (EVID-RBI-SACHET-UNREGISTERED).
* **Scenario C (Remote APK Sideloading):** “Bank support officer: Download Fast-KYC-Support.apk to unblock failed UPI.” → Flags APK Installation & Impersonation → CERT-In Advisory on Android Trojans (EVID-CERTIN-MALICIOUS-APKS).
* *Source:* Verified Demo Scenarios (`src/lib/demo-scenarios.ts`) | Tested in Test Suite (`tests/e2e-flow.test.ts`)

---

## Slide 9: Technology & Decision Engine
### HYBRID ANALYSIS — DETERMINISTIC WHERE IT MATTERS
* **Hybrid Decision Pipeline:** Deterministic heuristics anchor ground truth and risk scoring locally; Google Gemini 1.5 Flash provides plain-language bilingual explanations.
* **Verified Production Tech Stack:**
  - *Framework:* Next.js 14 (App Router) + React 18 + Node.js 22
  - *Type Safety:* TypeScript (Strict Mode) + Zod v3 Runtime Validation
  - *Styling:* Tailwind CSS + Institutional Fintech Palette
  - *Generative AI:* Google Gemini 1.5 Flash (via REST API)
  - *Voice Synthesis:* Web Speech API (Native Speech Synthesis)
  - *Hosting:* Vercel Serverless Platform (Global Edge CDN)
  - *Testing:* Vitest v3.2 (79/79 Automated Tests)
* *Source:* Actual Codebase & Dependencies (`package.json`, `src/app/api/analyze/route.ts`)

---

## Slide 10: Bharat-First Design
### DESIGNED FOR BHARAT, NOT JUST FOR EXPERT USERS
* **Bilingual English & Hindi:** Full localized user experience. Instant language toggle between English and natural Devanagari Hindi (स्कैमशील्ड भारत) across all analysis stages.
* **Audio Briefing Reader:** Integrated Web Speech API voice synthesis reads safety headlines and next steps aloud in clear Hindi or English.
* **Low Cognitive Load:** Eliminates dense legal jargon. Uses clear color-coded statuses (High Concern, Needs Verification, Low Concern) with calm next steps.
* **Direct Action Rail (1930):** Connects victims directly to the National Cybercrime Helpline 1930 and cybercrime.gov.in.
* *Source:* SANGYAN Usability & Inclusivity Guidelines | Web Speech API & Translations (`src/lib/translations.ts`)

---

## Slide 11: Security & Privacy
### SAFETY IS PART OF THE PRODUCT
* **Implemented Controls:** In-memory processing only (0 disk writes), client/server PII scrubbing, SSRF protection (loopback, RFC 1918, hex/decimal, metadata blocks), 5MB upload limit with magic-byte check, 50KB JSON ceiling with Zod validation, bounded sliding-window rate limiting (30 req/min/IP).
* **Engineering Security Validation:**
  - *Automated Test Suite:* 79 / 79 PASS (`npm test`)
  - *Localhost Red-Team Suite:* 54 / 54 PASS (`:3000`)
  - *Production Red-Team Suite:* 54 / 54 PASS (`Vercel`)
  - *Secret Leakage Audit:* 0 Found (Deep regex scan across all files & Git)
* *Security Disclaimer:* Results reflect tested vectors and controls; no software is guaranteed immune to unknown vulnerabilities.
* *Source:* Red-Team Audit Report (`docs/FINAL-RED-TEAM-REPORT.md`) | Security Policy (`SECURITY.md`)

---

## Slide 12: Trust & Guardrails
### A SAFETY TOOL — NOT AN INVESTMENT ADVISOR
* **Strictly Prohibited (Non-Advisory):** NO stock tips, buy/sell/hold calls, price targets, automated portfolio management, broker promotion, or guaranteed returns.
* **Permitted & Delivered (Safety Buffer):** YES objective risk signal identification, cross-examination with SEBI/RBI circulars, explicit uncertainty disclosures, educational plain-language explanations, safe next action steps, and direct links to SCORES and 1930 helplines.
* *Source:* SANGYAN Guardrail Mandate | SEBI (Investment Advisers) Regulations, 2013

---

## Slide 13: Impact & Scalability
### FROM ONE SUSPICIOUS MESSAGE TO A SCALABLE SAFETY LAYER
* **Current Verified Capabilities (Live Now):** Public web console on Vercel Edge; multimodal ingestion (text, screenshot, link); bilingual English/Hindi; evidence matrix; tested security controls.
* **Potential Future Roadmap (Planned):**
  - *Expanded Languages:* Add Tamil, Telugu, Bengali, Marathi, and Gujarati voice models.
  - *Direct Registry APIs:* Live querying of SEBI intermediary registration databases.
  - *WhatsApp/Telegram Tipline Bot:* Direct message forwarding to verified ScamShield bot.
  - *Centralized Rate Limiting:* Redis/Upstash backing for horizontal enterprise scale.
  - *Offline PWA Support:* Local browser caching of top 100 scam patterns.
* *Source:* SANGYAN Scalability Criteria | Clear Separation of Live Built Prototype vs Planned Roadmap

---

## Slide 14: Live Demo + Proof
### SEE IT WORK — LIVE PRODUCTION DEPLOYMENT
* **Public Demo URL:** [https://scamshield-bharat-kappa.vercel.app/](https://scamshield-bharat-kappa.vercel.app/)
* **Recommended Judging Demo Sequence:**
  1. Load Demo Scenario: Guaranteed Return (VIP Telegram Channel).
  2. Observe Evidence Trail: View cross-examination with official SEBI rules.
  3. Switch Language: Toggle to Hindi (स्कैमशील्ड भारत) for Devanagari view.
  4. Test Audio Reader: Click 'Listen Briefing' for speech synthesis.
  5. Test Custom Input: Paste fresh suspicious text or upload screenshot.
  6. Review Action Rail: Check 5 safe steps and direct 1930 Helpline link.
* *Source:* Live Deployment Verified on Vercel Edge | Tested on Desktop & Mobile Viewports

---

## Slide 15: Why ScamShield Fits SANGYAN
### BUILT AROUND INVESTOR RESILIENCE
* **Resilience & Safety Impact:** Provides a pre-action verification buffer preventing capital loss at the critical moment before money leaves.
* **Bharat-First Usability:** Bilingual Hindi/English, voice briefing, low cognitive load, and mobile responsiveness for Tier-2/3 users.
* **Trust & Guardrails:** Strict non-advisory boundary; explicit uncertainty; in-memory PII scrubbing; zero secret leakage.
* **Technical Execution:** Hybrid deterministic + AI architecture; 79/79 test suite; 54/54 red-team vectors; live Vercel deployment.
* **Transparent Limitations:** Automated analysis has defined uncertainty; "could not verify" is not proof of falsity; rate limiting is instance-local.
* **Closing:** SCAMSHIELD BHARAT — “Check the claim before you act.” | Public Demo: https://scamshield-bharat-kappa.vercel.app/
* *Source:* SANGYAN Official Hackathon Evaluation Framework (sangyan.sntciitbhu.co.in)
