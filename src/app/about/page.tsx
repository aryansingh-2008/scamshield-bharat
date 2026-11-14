import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  Lock,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  HelpCircle,
  Users,
  Award,
  PhoneCall,
  Scale,
  Mail,
  Home,
  Info,
} from 'lucide-react';

export default function AboutPage() {
  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    mainEntity: {
      '@type': 'Organization',
      name: 'Scam Shield Bharat',
      alternateName: [
        'ScamShield Bharat',
        'ScamShield',
        'Scam Shield',
        'Scam Bharat',
        'ScamShield India',
        'Scam Shield India',
      ],
      url: 'https://scamshieldbharat.live',
      logo: 'https://scamshieldbharat.live/icon.svg',
      description:
        'Independent civic cybersecurity initiative providing AI-assisted scam detection and investor protection in India.',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'contact@scamshieldbharat.live',
        contactType: 'customer support',
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#F4F9FD] text-slate-800 flex flex-col font-sans selection:bg-[#004A87]/20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      {/* Statutory Top Banner */}
      <div className="w-full bg-[#07131F] text-slate-300 text-[11px] py-1.5 px-4 sm:px-8 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="truncate">
            Independent Civic Safety Platform • Not Affiliated with Govt of India or SEBI • National Helpline: 1930
          </span>
        </div>
        <Link
          href="/"
          className="text-amber-400 hover:text-amber-300 font-semibold underline text-[11px] shrink-0 ml-3"
        >
          Return to Scanner
        </Link>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#004A87] rounded-lg p-1"
            aria-label="Scam Shield Bharat Home"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#004A87] flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                  Scam Shield Bharat
                </span>
                <span className="px-1.5 py-0.5 text-[9.5px] font-mono font-bold bg-[#004A87] text-white rounded">
                  ABOUT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Evidence-First Financial Verification Assistant
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Safety Console</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#004A87] text-white hover:bg-[#003966] transition-colors shadow-xs"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {/* Intro Banner */}
        <section className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0EFFB] text-[#0F568C] text-xs font-extrabold tracking-wider uppercase border border-[#B9DCF7]">
            <Info className="w-3.5 h-3.5" />
            <span>Civic Mission & Brand Identity</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A1C2A] tracking-tight leading-tight">
            About <span className="text-[#004A87]">Scam Shield Bharat</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
            <strong>Scam Shield Bharat</strong> (often known as <strong>ScamShield Bharat</strong>, <strong>ScamShield</strong>, or <strong>ScamShield India</strong>) is an independent, evidence-first financial cyber safety assistant developed to protect Indian retail investors and citizens against the surging epidemic of digital fraud.
          </p>
        </section>

        {/* Brand Identity & Naming Clarification */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-[#004A87]">
            <Award className="w-5 h-5" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Brand Identity: Scam Shield Bharat & Its Variations
            </h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            The project operates under the official unified title <strong>Scam Shield Bharat</strong>. In common discourse, social platforms, and community discussions, citizens and technology communities refer to our initiative by multiple related names:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {[
              { name: 'Scam Shield Bharat', label: 'Primary Official Brand Name' },
              { name: 'ScamShield Bharat', label: 'Unified Compound Name' },
              { name: 'ScamShield', label: 'Short Core Brand' },
              { name: 'Scam Shield', label: 'Spaced Short Name' },
              { name: 'Scam Bharat', label: 'Civic Safety Alias' },
              { name: 'ScamShield India', label: 'Geographic Search Reference' },
            ].map((variant, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                <span className="font-bold text-sm text-[#004A87]">{variant.name}</span>
                <span className="text-[11px] text-slate-500 mt-0.5">{variant.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 italic pt-1">
            All the above variations refer directly to this single verified civic protection initiative hosted at <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">scamshieldbharat.live</code>.
          </p>
        </section>

        {/* The Problem We Address */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-[#E5484D]">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              The Fraud Epidemic in India
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Every day, thousands of Indian retail investors and citizens are targeted by sophisticated cyber fraud networks. Common vectors include:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <h3 className="font-bold text-sm text-slate-900">Fake Telegram & WhatsApp Stock Groups</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Impersonators pretend to be SEBI-registered analysts, fabricating fake screenshots of 300% trading profits and urging citizens to transfer funds into mule bank accounts.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <h3 className="font-bold text-sm text-slate-900">Deceptive Phishing Links & Lookalike Portals</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Spoofed URLs imitating government schemes, KYC verification portals, and IPO allotment check portals designed to siphon credentials and UPI PINs.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <h3 className="font-bold text-sm text-slate-900">Fraudulent Investment APKs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Malicious mobile applications distributed outside official app stores, promising institutional trading allocations while freezing user capital.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <h3 className="font-bold text-sm text-slate-900">Digital Arrest & Urgent Coercion Threats</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scammers posing as law enforcement or courier officials, demanding immediate verification deposits under fabricated legal intimidation.
              </p>
            </div>
          </div>
        </section>

        {/* How Scam Shield Bharat Protects You */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-700">
            <FileCheck className="w-5 h-5" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Our Safety Architecture & Detection Technology
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Scam Shield Bharat replaces panic with evidence. Our platform evaluates submissions through a four-stage verification pipeline:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-sm text-slate-900">Deterministic Pattern Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scans for guaranteed profit guarantees, urgent timers, unauthorized bank transfer requests, and known scam syntaxes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-sm text-slate-900">Official Regulatory Grounding</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cross-references entities against public databases of SEBI-recognized research analysts and RBI Sachet unauthorized entity repositories.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-sm text-slate-900">Phishing URL Checker</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Detects obfuscated redirects, lookalike domains, unverified URL shorteners, and suspicious TLDs before you click.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h3 className="font-bold text-sm text-slate-900">Bilingual Safe Next Steps</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Delivers immediate, actionable steps in plain Hindi and English to preserve capital and report to National Cybercrime Helpline 1930.
              </p>
            </div>
          </div>
        </section>

        {/* Zero-Trust Privacy Blueprint */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-[#004A87]">
            <Lock className="w-5 h-5" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Privacy-First & Zero-Trust by Design
            </h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            In compliance with the Digital Personal Data Protection (DPDP) Act 2023, <strong>Scam Shield Bharat operates on a zero-database retention philosophy</strong> for citizens&apos; submitted content:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 pt-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>We never ask for your password, PIN, or OTP.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>We never ask for bank account or trading credentials.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Uploaded screenshots and texts are processed in-memory and discarded.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero third-party advertising tracking or analytics sharing.</span>
            </li>
          </ul>
        </section>

        {/* Statutory Disclaimers & Helpline */}
        <section className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
            <Scale className="w-4 h-4" />
            <span>Statutory Non-Affiliation Notice</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-950/90 leading-relaxed">
            <strong>Scam Shield Bharat is an independent civic education and heuristic verification assistant.</strong> It is NOT a registered investment advisor (RIA), research analyst (RA), stockbroker, or regulatory entity under SEBI or RBI. It does not provide financial tips or advice. If you suspect an ongoing financial crime, immediately report it to the Ministry of Home Affairs National Cyber Crime Portal or call the national emergency helpline:
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href="tel:1930"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-colors shadow-xs"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Helpline 1930 (Toll-Free)</span>
            </a>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              <span>cybercrime.gov.in</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>
        </section>

        {/* Grievance & Official Contact */}
        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#004A87]" />
            <span>Contact & Grievance Redressal</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            For technical inquiries, civic partnerships, regulatory notifications, or false-positive corrections, contact the Scam Shield Bharat team at:
          </p>
          <p className="text-sm font-mono font-bold text-[#004A87]">
            <a href="mailto:contact@scamshieldbharat.live" className="hover:underline">
              contact@scamshieldbharat.live
            </a>
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-8 text-xs text-slate-500 text-center">
        <div className="max-w-[1100px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Scam Shield Bharat. Protecting Indian Citizens & Retail Investors.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-900 font-semibold">
              Safety Console
            </Link>
            <Link href="/about" className="text-[#004A87] font-semibold">
              About
            </Link>
            <Link href="/login" className="hover:text-slate-900 font-semibold">
              Citizen Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
