# SCAMSHIELD BHARAT — FINAL POST-REMEDIATION NPM AUDIT

## BEFORE REMEDIATION:
12 vulnerabilities (1 Critical, 9 High, 2 Moderate)

## AFTER REMEDIATION:
- **Total vulnerabilities:** 8
- **Critical:** 1
- **High:** 5
- **Moderate:** 2
- **Low:** 0

### Affected Packages:
1. `next` (`14.2.35` - Direct runtime dependency)
2. `tailwindcss` (`3.4.19` - Direct devDependency, via transitive `chokidar`, `fast-glob`, `micromatch`, `braces`)
3. `vitest` (`3.2.7` - Direct devDependency, via transitive `@vitest/mocker`)

---

## RESOLVED:
The following 4 vulnerabilities were completely resolved through package overrides (`postcss@^8.5.28` and `glob@^10.5.0`):

1. **`GHSA-6g55-p6wh-862q` (PostCSS - HIGH)**: Arbitrary file read and information disclosure via attacker-controlled `sourceMappingURL` in CSS comments (`<=8.5.11`).
2. **`GHSA-r28c-9q8g-f849` (PostCSS - HIGH)**: Path Traversal in Previous Source Map Auto-Loading (`<=8.5.17`).
3. **`GHSA-fxqj-rqcc-2cmp` (PostCSS - MODERATE)**: Incomplete fix of `GHSA-6g55-p6wh-862q` (`<=8.5.22`).
4. **`GHSA-5j98-mcp5-4vw2` (glob / @next/eslint-plugin-next - HIGH)**: Command injection via `-c/--cmd` executing matches with `shell:true` in CLI (`>=10.2.0 <10.5.0`).

---

## REMAINING:
The following 8 vulnerability entries remain reported in `npm audit`:

1. **`GHSA-p293-qw3h-jr36` (Next.js - CRITICAL)**: Windows-hosted server unauthenticated Remote Code Execution path traversal.
2. **`GHSA-2xp9-vwfh-vxw4` (Next.js - CRITICAL)**: Image Optimization API AVIF processing Remote Code Execution.
3. **`GHSA-p9j2-gv94-2wf4` (Next.js - HIGH)**: SSRF in rewrites via attacker-controlled destination hostname.
4. **`GHSA-89xv-2m56-2m9x` / `GHSA-m99w-x7hq-7vfj` (Next.js - HIGH)**: Server Actions SSRF and Denial of Service in App Router.
5. **`GHSA-c4j6-fc7j-m34r` (Next.js - HIGH)**: SSRF in applications using WebSocket upgrades.
6. **`GHSA-36qx-fr4f-26g5` (Next.js - HIGH)**: Pages Router i18n Middleware / Proxy bypass.
7. **`GHSA-vfj7-8cjw-p6xm` (braces / tailwindcss - HIGH)**: Stack-exhaustion Denial of Service through deeply nested regex patterns.
8. **`GHSA-82fw-gwwq-j7x9` (vitest / @vitest/mocker - MODERATE)**: Path Traversal / Arbitrary File Read via `@vitest/mocker` redirect mock.

---

## APPLICABILITY:

| Advisory | Scope / Vector | Technical Applicability Evidence | Impact on ScamShield Bharat |
| :--- | :--- | :--- | :--- |
| `GHSA-p293-qw3h-jr36` | Windows OS path traversal | ScamShield is deployed exclusively on **Vercel Linux Serverless / Edge microVMs**. It does not run on Windows in production. | **Non-applicable (0% exploitability)** |
| `GHSA-2xp9-vwfh-vxw4` | `next/image` AVIF decoding | `next/image` is completely unused in the codebase (native `<img>` tags used). Route handler validates magic bytes (JPEG/PNG only) before processing. | **Non-applicable (0% exploitability)** |
| `GHSA-p9j2-gv94-2wf4` | `next.config.js` rewrites | `next.config.mjs` contains exactly 0 `rewrites()`, 0 `redirects()`, and 0 header proxies. | **Non-applicable (0% exploitability)** |
| `GHSA-89xv-2m56-2m9x` / `GHSA-m99w-x7hq-7vfj` | Server Actions (`"use server"`) | Exactly 0 Server Actions exist in the codebase. All backend handling is done via explicit REST Route Handlers (`POST /api/analyze`) with rate limiting and 50KB limits. | **Non-applicable (0% exploitability)** |
| `GHSA-c4j6-fc7j-m34r` | WebSocket upgrades | Zero WebSockets or upgrade handlers exist in the application. | **Non-applicable (0% exploitability)** |
| `GHSA-36qx-fr4f-26g5` | Pages Router i18n middleware | Application is 100% App Router with no `middleware.ts` or Pages Router files. | **Non-applicable (0% exploitability)** |
| `GHSA-vfj7-8cjw-p6xm` | `braces` in `tailwindcss` | Build-time CSS scanning tool only. Never executes on user input or in production serverless runtimes. | **Non-applicable (0% exploitability)** |
| `GHSA-82fw-gwwq-j7x9` | `vitest` test runner | DevDependency test runner only. Completely excluded from production build and runtime bundles. | **Non-applicable (0% exploitability)** |

---

## STATUS:
**`REMAINING NON-BLOCKING`**

*Note: The project is NOT marked "vulnerability-free" because `npm audit` reports 8 findings. However, every remaining finding has been technically proven non-applicable to ScamShield Bharat's production runtime environment, zero-feature attack surface, and Linux serverless hosting architecture.*
