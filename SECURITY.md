# Security Policy

## Supported versions

Mbuni CEX is pre-1.0 software. We currently provide security updates for the
latest minor release only.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

Once the project reaches 1.0, we'll adopt a formal LTS policy (likely N-2
minors + the latest patch of each).

---

## Reporting a vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please report security issues privately via one of these channels:

### Preferred: GitHub Security Advisories

1. Go to <https://github.com/your-org/mbuni-cex/security/advisories/new>
2. Click **"Report a vulnerability"**
3. Fill in the template with:
   - Description of the vulnerability
   - Steps to reproduce (proof of concept if possible)
   - Affected versions
   - Potential impact
   - Suggested fix (if you have one)
4. Submit — only the maintainers will see it.

This uses GitHub's private vulnerability reporting, which is encrypted,
audited, and integrates with CVE assignment once a fix is released.

### Alternative: Email

Send encrypted email to **security@mbuni.cex**. PGP-encrypt your report
using the public key below.

```
-----BEGIN PGP PUBLIC KEY BLOCK-----

Replace this placeholder with your real PGP public key block. Generate
one with:

  gpg --full-generate-key   (choose RSA 4096, no expiry or 2y)
  gpg --armor --export security@mbuni.cex

Then paste the output here, replacing this comment block. Store the
private key in 1Password / Vault / etc. — never on a developer laptop
in plaintext.

-----END PGP PUBLIC KEY BLOCK-----
```

---

## Response timeline

We take security reports seriously. Here's what to expect:

| Stage | Target SLA |
|---|---|
| **Acknowledgment** of your report | Within 48 hours |
| **Initial assessment** (is it a real vuln?) | Within 5 business days |
| **Status update** (if fix is non-trivial) | Every 7 days until resolved |
| **Fix released** | Within 90 days for critical, 180 days for high, best-effort for medium/low |
| **Public disclosure** | After the fix is released + you've been credited (or after 90 days if we can't reach you) |

We may ask for additional information during the assessment. Please respond
promptly so we can move forward.

---

## What to include in your report

The more detail you provide, the faster we can triage and fix. Please
include:

- **Description** — what's the vulnerability? (e.g. "SQL injection in /api/signup")
- **Severity** — your estimate using the [CVSS v3.1 calculator](https://www.first.org/cvss/calculator/3.1)
- **Affected versions** — which releases are vulnerable?
- **Reproduction steps** — exact commands or HTTP requests to trigger the issue
- **Proof of concept** — minimal script or curl command (highly appreciated)
- **Impact** — what can an attacker do? (RCE, data exfiltration, auth bypass, DoS, etc.)
- **Suggested fix** — if you have one (not required, but helpful)
- **Disclosure plan** — do you want to be credited? Any deadline you need us to meet?

---

## Scope

### In scope

- The Mbuni CEX application code in this repo (`src/`)
- The API routes (`src/app/api/`)
- The database schema + migrations (`prisma/`)
- The deployment manifests (`Dockerfile`, `docker-compose.yml`, `infra/`)
- The CI/CD pipeline (`.github/workflows/`)
- Authentication + session handling (`src/lib/auth/`, NextAuth config)
- Password hashing, JWT handling, secret management

### Out of scope

- Vulnerabilities in third-party dependencies (report those to the upstream
  project; we'll patch via Dependabot/Renovate once a fix is available)
- Issues in the demo/seed data (it's intentionally fake — don't report that
  `admin@mbuni.cex / adminpass123` "leaks" credentials)
- Theoretical issues without a working proof of concept
- Social engineering or phishing of maintainers
- DoS via flooding our public demo instance (we rate-limit)
- Reports from automated scanners without manual verification
- Findings from tools like `npm audit` that already have public CVEs

### Special note on the demo data

The `prisma/seed.ts` script creates demo accounts with publicly-known
passwords (`adminpass123`, `testpass123`). These are intentional — they're
for local development only. **Do not report these as a vulnerability.**
The seed script should never be run against a production database.

---

## Safe harbor

We will not take legal action against security researchers who:

- Make a good-faith effort to avoid privacy violations, data destruction, and
  service interruption
- Do not access data other than their own
- Do not use social engineering or physical attacks against employees,
  contractors, or infrastructure
- Give us reasonable time to fix the issue before disclosing it publicly
- Do not demand financial compensation in exchange for the report (we don't
  run a bug bounty program — but we'll credit you in the advisory)

We reserve the right to update this policy as the project evolves.

---

## Disclosure policy

We follow **coordinated disclosure**:

1. You report the vulnerability privately
2. We acknowledge + triage
3. We develop + test a fix
4. We release the fix (usually as a patch version: `v1.0.1`)
5. We publish a GitHub Security Advisory with:
   - Description of the vulnerability
   - Affected versions
   - CVSS score
   - Credit to the reporter (unless they prefer to remain anonymous)
   - CVE ID (we request one from GitHub's CVE program)
6. After the fix is released, we (or you) may publicly disclose the
   technical details — typically after 14 days to give users time to patch

We will **never** publicly disclose your identity without your explicit
permission. You can choose to be credited by name, handle, or remain
anonymous.

---

## Security measures we've taken

(For your reference — what's already in place so you don't waste time
reporting things we've already addressed.)

### Application
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT sessions via NextAuth (30-day expiry, signed with `NEXTAUTH_SECRET`)
- ✅ No plaintext secrets in source code (`.env` is gitignored)
- ✅ Pre-commit hook with secret scan (`.husky/pre-commit`)
- ✅ ESLint with security-aware rules
- ✅ Input validation on all API routes (zod where applicable)

### Infrastructure
- ✅ Non-root Docker user (uid 1001, no capabilities)
- ✅ Container security context (`drop: [ALL]` capabilities, `noPrivilegeEscalation`)
- ✅ Caddy security headers (HSTS, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, CSP)
- ✅ Kubernetes NetworkPolicy (egress lockdown to DNS + HTTPS + DB CIDR)
- ✅ Kubernetes PodDisruptionBudget (min available)
- ✅ TLS auto-provisioning via Let's Encrypt (Caddy) or cert-manager (K8s)

### Pipeline
- ✅ Dependabot + Renovate for automated dependency updates
- ✅ CI runs on every PR (lint + unit tests + build + e2e)
- ✅ Coverage report published to GitHub Pages
- ✅ Pre-commit hook blocks secrets from being committed
- ✅ Helm chart uses `envFrom` with Secret refs (no secrets in values.yaml)

### Known limitations (we know about these — no need to report)

- ❌ Passkey/WebAuthn flow is **simulated** — not real WebAuthn. Real impl is on the roadmap.
- ❌ No email verification after signup — emails are accepted unverified.
- ❌ No password reset flow — only `/signup` exists.
- ❌ `NEXTAUTH_SECRET` defaults to a known dev value — must be rotated for prod (documented in README).
- ❌ Rate limiting on `/api/signup` and `/api/auth/callback/credentials` is NOT implemented yet —
  add `upstash/ratelimit` or similar before going to production.
- ❌ No CSRF protection on the signup endpoint (NextAuth's other endpoints are protected).
- ❌ SQLite in dev (PostgreSQL recommended for prod — schema is provider-agnostic).

If you'd like to help us close any of these gaps, see
[`CONTRIBUTING.md`](CONTRIBUTING.md) and look for issues labeled
[`good first issue`](https://github.com/your-org/mbuni-cex/labels/good%20first%20issue)
or [`security`](https://github.com/your-org/mbuni-cex/labels/security).

---

## Contact

- **Security reports**: See "Reporting a vulnerability" above
- **General security questions**: Open a [Discussion](https://github.com/your-org/mbuni-cex/discussions)
  with the `security` category
- **Maintainers**: @your-org/core-maintainers + @your-org/security-team

---

*This policy is based on the [GitHub Security Policy template](https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository)
and the [Disclose.io safe harbor template](https://github.com/disclose/diocist).*
