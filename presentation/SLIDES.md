# 🛡️ ScamShield Bharat — Presentation Slide Deck (15 Slides)

**Project:** ScamShield Bharat (स्कैमशील्ड भारत)  
**Subtitle:** Evidence-First Financial Scam Resilience & Verification Assistant  
**Event:** SANGYAN IIT BHU Hackathon  
**Live Deck URL:** Open `presentation/index.html` in any web browser  

---

## Slide 1: Title & Vision
### ScamShield Bharat (स्कैमशील्ड भारत)
> **“Before you trust a financial message, check it.”**

* **Public Live URL:** [https://scamshield-bharat-kappa.vercel.app](https://scamshield-bharat-kappa.vercel.app)
* **Core Mission:** An evidence-first financial verification assistant that helps Indian retail investors, senior citizens, and Tier-2/3 Bharat users safely evaluate suspicious messages, screenshots, and links against official regulatory records.
* **Organizer Reference:** [SANGYAN Official Portal](https://sangyan.sntciitbhu.co.in/) | [Official Discord](https://discord.gg/Q69UG3cWq)
* **Status:** 🟢 **GREEN — Passed public deployment and submission gate.**

> **Speaker Note:** Welcome judges. ScamShield Bharat is built on a simple premise: Indian retail investors are inundated with fraudulent WhatsApp stock tips, fake KYC SMS, and clone APKs. ScamShield is not a generic chatbot or a stock picker—it is an evidence-first safety console.

---

## Slide 2: The Problem & Ground Reality in Bharat
### The Anatomy of Financial Cyber Fraud
1. **Fake Guaranteed Returns:** Telegram & WhatsApp groups lure first-time investors with "30% monthly profit" or "100% sure-shot IPO tips" using fake regulatory claims.
2. **Urgency & Account Panics:** SMS messages threaten imminent account suspension ("KYC expired tonight, trading account blocked") with lookalike phishing links.
3. **Malicious APK Sideloads:** Fraudsters pose as customer support and ask victims to download custom APKs or screen-sharing tools (AnyDesk/QuickSupport) to drain bank accounts.

> **Speaker Note:** Highlight the 3 primary attack vectors: Guaranteed return promises, artificial fear/urgency, and remote software installs. These vectors exploit emotion rather than technical flaws.

---

## Slide 3: Who Are We Protecting?
### User Personas & Vulnerability Profiles
* **Primary Persona — Tier-2 / Tier-3 First-Time Investors:** Retail users who trade on mobile and receive unverified WhatsApp/Telegram forwards promising high returns. *Solution: Simple conversational Hindi briefing + speech audio voice reader.*
* **Senior Citizens & Families:** Vulnerable to impersonation calls from fake bank managers or police/CBI extortion notices. *Solution: Clear fake-threat detection and 1-click Cybercrime Helpline 1930 action.*
* **First-Time Stock Market Entrants:** Enticed by unverified "SEBI Approved" claims in private channels. *Solution: Direct correlation to official SEBI prohibited schemes circulars.*
* **Privacy-Conscious Individuals:** Concerned about PII leaks. *Solution: Automatic in-memory PII redaction and zero-data retention.*

> **Speaker Note:** Our primary persona is the Tier-2/3 first-time investor receiving a suspicious message. We design specifically for the Bharat user who needs calm clarity without technical jargon.

---

## Slide 4: Product Principles
### Evidence Over Confidence
1. **Safety First (Non-Advisory):** ScamShield NEVER offers stock tips, price targets, buy/sell calls, or broker recommendations. It is strictly an investor safety console.
2. **Evidence Over Labels:** We never output unsupported claims like "97% scam". We present clear explainable categories: High Concern, Needs Verification, Low Concern.
3. **Epistemic Honesty:** The system clearly distinguishes between *Verified Information*, *User Claim*, and *What Could Not Be Verified*.

> **Speaker Note:** Emphasize our strict adherence to non-advisory principles and explainable safety ratings.

---

## Slide 5: The 5-Stage Verification Journey
### From Untrusted Input to Actionable Safety
1. **Stage 1 — Untrusted Input & PII Redaction:** Accepts text, screenshot, or URL. Automatically masks phone, PAN, Aadhaar, email, and OTPs.
2. **Stage 2 — Claim Extraction:** Isolates explicit financial promises (guaranteed yields, urgency deadlines, regulatory endorsements).
3. **Stage 3 — Risk Signal Detection:** Correlates against 20 calibrated fraud patterns in English and Devanagari Hindi.
4. **Stage 4 — Regulatory Evidence Grounding:** Connects claims to verified advisories from SEBI, RBI, and CERT-In.
5. **Stage 5 — Action Rail:** Provides 5 calm, actionable next steps: STOP, PROTECT, VERIFY, REPORT (1930), and RECOVER.

> **Speaker Note:** Walk the judges through the 5 steps of the verification pipeline.

---

## Slide 6: Deterministic 20-Signal Risk Engine
### High-Precision Heuristics Anchored in Truth
* **20 Domain-Specific Detectors:** Guaranteed returns, astronomical yields, artificial urgency, legal threats, remote software (AnyDesk), sideloaded APKs, fake KYC, and mule UPI handles.
* **Native Devanagari & Hindi Matching:** Optimized regex patterns detect Unicode Devanagari threats (e.g. *गारंटीड मुनाफा*, *खाता सस्पेंड*, *ओटीपी दर्ज करें*) without reliance on external servers.
* **Prompt-Injection Immune:** Deterministic rules execute locally in-memory. Adversarial prompts cannot trick the engine into returning unsafe verdicts.
* **Millisecond Speed & Offline Reliability:** Zero external API bottleneck; evaluation completes instantly even under intermittent network conditions.

> **Speaker Note:** Point out that the deterministic engine provides an unshakeable ground truth that runs offline and is completely prompt-injection resistant.

---

## Slide 7: Official Regulatory Evidence Model
### Grounding Conclusions in Verified Sources
* **SEBI Recognised Intermediaries:** [SEBI Recognised Intermediaries Registry](https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognised=yes) — Intermediary registration & license verification.
* **SEBI Spot a Scam Guide:** [SEBI Investor Guidance](https://investor.sebi.gov.in/spot-any-scam.html) — Official guidance on spotting fraudulent return promises & tips.
* **SEBI Fake Trading App Advisory:** [SEBI Fake Trading App Advisory](https://investor.sebi.gov.in/pdf/Fake%20trading%20app%20scam%20Landscape.pdf) — Advisory on fake trading apps, social media tipping, and APKs.
* **SEBI SCORES 2.0:** [SEBI SCORES](https://scores.sebi.gov.in/scores-home) — Official investor grievance redressal portal.

> **Speaker Note:** Every single URL in our evidence database is official, verified live, and accurately mapped to its specific purpose.

---

## Slide 8: Cybercrime & RBI Verification Sources
### Immediate Relief & National Advisory Network
* **National Cyber Crime Reporting Portal:** [Cyber Crime Portal](https://www.cybercrime.gov.in/) — Official portal for cyber financial fraud complaints.
* **Cybercrime Helpline 1930:** **Direct Helpline: 1930** — 24x7 immediate hotline to freeze stolen funds within the Golden Hour.
* **CERT-In Advisories:** [CERT-In](https://www.cert-in.org.in/) — National cybersecurity advisories on malicious APKs and trojans.
* **RBI Sachet Portal:** [RBI Sachet](https://sachet.rbi.org.in/) — Reporting & verification channel for unauthorized deposit collection schemes.

> **Speaker Note:** We distinguish SCORES (grievance) from Intermediaries (registration) and Helpline 1930 (immediate financial freeze).

---

## Slide 9: Epistemic Honesty & Uncertainty
### “Could Not Verify” is Separate From “False”
* **Why Uncertainty Matters:** Many systems make false binary claims. If an entity name is not found in an offline database, saying "it is definitely fake" could be inaccurate. ScamShield marks these as **Could Not Verify Independently**.
* **Empowering Independent Action:** For every unverified item, ScamShield explains:
  1. Why it could not be verified automatically.
  2. How the user can check safely (e.g. logging into official banking apps directly).

> **Speaker Note:** Epistemic honesty is our core differentiator. We do not hallucinate certainty.

---

## Slide 10: Bharat-First Regional Accessibility
### Natural Hindi & Speech Synthesis Audio
* **Instant EN | हिंदी Toggle:** One-click switch updates headlines, claim summaries, evidence notes, and action checklists into simple conversational Hindi.
* **Speech Audio Reader:** Integrated Web Speech API reads aloud the risk briefing in clear Hindi or Indian English for senior citizens or visually impaired users.
* **Responsive on Any Device:** Zero horizontal scroll; tested across 375px mobile screens up to 4K monitors with large touch-friendly action buttons.

> **Speaker Note:** We support Hindi natively with Devanagari script and audio speech synthesis.

---

## Slide 11: 3 Deterministic Demo Scenarios
### Instant 1-Click Walkthrough for Judges (3–5 Min Submission Format)
1. **Guaranteed Return + Telegram:** *“SEBI approved opportunity. 30% monthly profit. Join VIP Telegram. Deposit ₹50,000.”* $\to$ **HIGH CONCERN**
2. **Fake KYC Urgency Threat:** *“Your KYC will expire tonight. Account blocked. Verify immediately at kyc-update-portal.xyz.”* $\to$ **HIGH CONCERN**
3. **Remote Access APK Scam:** *“Your account needs verification. Install this remote support APK to claim rewards.”* $\to$ **HIGH CONCERN**

> **Speaker Note:** Show judges that they can trigger any of the 3 real-world scenarios with a single click in a 3 to 5 minute walkthrough.

---

## Slide 12: Calm 5-Step Safe Action Rail
### Immediate Protection & Financial Recovery
* **STOP:** Pause before transferring funds or clicking links. Take 15 minutes.
* **PROTECT:** Never share OTP, UPI PIN, passwords, or remote screen access.
* **VERIFY:** Check official SEBI / RBI registries independently.
* **REPORT:** 1-click call to 1930 / cybercrime.gov.in.
* **RECOVER:** Block cards via banking app & change netbanking passwords.

> **Speaker Note:** The action checklist transforms panic into structured, calm steps that save money.

---

## Slide 13: Security & Privacy Architecture
### Security-by-Design Guarantees
* **Untrusted Data Isolation:** Strict prompt injection containment. User input cannot override system instructions or modify classifications.
* **SSRF & URL Security:** Disallows localhost, IPv6 loopbacks, private subnets, wildcard DNS (nip.io), and non-web schemes (file:, gopher:).
* **In-Memory PII Redaction:** Masks phone numbers, emails, bank accounts, card numbers, OTPs, PAN, and Aadhaar before any processing.

> **Speaker Note:** Highlight that user data is treated as untrusted and processed ephemerally with zero credential collection.

---

## Slide 14: Testing & Audit Verification
### Technically Defensible & Verified
* **Automated Vitest Suite (69 Tests):** 100% passing across 6 suites covering Zod schemas, security vectors, e2e journeys, guardrails, and 40 adversarial prompt-injection & SSRF test cases.
* **Live HTTP Smoke Test Suite (39 Tests):** Evaluated against production server on port 3000 verifying CSP headers, rate limiting (30 req/min/IP), PII masking, and file bounds.
* **Status Statement:** *Passed current pre-demo security, guardrail, and real-world regression test gate.*

> **Speaker Note:** We use accurate, technically defensible wording: "Passed current security and regression test suite with 69 automated tests".

---

## Slide 15: Roadmap & Conclusion
### Empowering Bharat Investors
* **Post-Hackathon Roadmap:**
  - Dynamic scrapers for SEBI Debarred Entities & RBI Sachet listings.
  - Expanded regional languages (Tamil, Telugu, Bengali, Marathi, Gujarati).
  - On-device WebAssembly OCR for offline screenshot inspection.
* **Summary for Judges:** ScamShield Bharat delivers a complete, evidence-first, Bharat-ready financial safety console that bridges the gap between complex regulatory advisories and everyday investors.
* **Status:** 🟢 **GREEN — Submission Ready**

> **Speaker Note:** Conclude by emphasizing the public-good impact: helping Indian citizens stop, verify, and protect their hard-earned money. Thank the judges!
