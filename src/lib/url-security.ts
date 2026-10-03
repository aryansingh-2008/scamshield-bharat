export interface UrlValidationResult {
  isValid: boolean;
  isSafeToProcess: boolean;
  hostname: string;
  protocol: string;
  error?: string;
  suspiciousSignals: string[];
  isShortener: boolean;
  isOfficialDomain: boolean;
}

// Known official Indian financial institutions and regulators
const OFFICIAL_TRUSTED_DOMAINS = [
  'sebi.gov.in',
  'investor.sebi.gov.in',
  'scores.gov.in',
  'rbi.org.in',
  'sachet.rbi.org.in',
  'cybercrime.gov.in',
  'cert-in.org.in',
  'nseindia.com',
  'bseindia.com',
  'mha.gov.in',
  'incometax.gov.in',
  'uidai.gov.in',
];

// High-risk TLDs frequently used in phishing campaigns
const SUSPICIOUS_TLDS = [
  '.xyz',
  '.top',
  '.work',
  '.icu',
  '.click',
  '.fit',
  '.buzz',
  '.tk',
  '.ml',
  '.ga',
  '.cf',
  '.gq',
  '.vip',
  '.cc',
  '.ru',
];

// Known URL shorteners used to conceal destination domains
const KNOWN_SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  't.me',
  'wa.me',
  'is.gd',
  'cutt.ly',
  'rb.gy',
  'ow.ly',
  'buff.ly',
  'shorturl.at',
];

// Wildcard DNS domains often used to bypass hostname checks for loopback (127.0.0.1)
const WILDCARD_LOOPBACK_DOMAINS = [
  'nip.io',
  'sslip.io',
  'localtest.me',
  'vcap.me',
  'lvh.me',
  '127.0.0.1.traefik.me',
];

export function validateAndParseUrl(urlString: string): UrlValidationResult {
  const cleanInput = urlString.trim();

  // 1. Pre-check for forbidden non-web URI schemes
  const schemeMatch = cleanInput.match(/^([a-zA-Z0-9+.-]+):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== 'http' && scheme !== 'https') {
      return {
        isValid: false,
        isSafeToProcess: false,
        hostname: '',
        protocol: `${scheme}:`,
        error: `Scheme "${scheme}:" is prohibited. Only HTTP and HTTPS web links are supported.`,
        suspiciousSignals: ['UNSAFE_PROTOCOL'],
        isShortener: false,
        isOfficialDomain: false,
      };
    }
  }

  try {
    const normalizedUrl = /^https?:\/\//i.test(cleanInput)
      ? cleanInput
      : `https://${cleanInput}`;

    const parsed = new URL(normalizedUrl);
    const hostname = parsed.hostname.toLowerCase();
    const protocol = parsed.protocol.toLowerCase();

    if (protocol !== 'http:' && protocol !== 'https:') {
      return {
        isValid: false,
        isSafeToProcess: false,
        hostname,
        protocol,
        error: 'Only HTTP and HTTPS web links are supported.',
        suspiciousSignals: ['UNSAFE_PROTOCOL'],
        isShortener: false,
        isOfficialDomain: false,
      };
    }

    // 2. Disallow Localhost, loopbacks, octal, hex, decimal encoded representations, and direct private IP addresses
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '0' ||
      hostname === '::1' ||
      hostname === '[::1]' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal');

    const isWildcardLoopback = WILDCARD_LOOPBACK_DOMAINS.some(
      (w) => hostname === w || hostname.endsWith(`.${w}`)
    );

    // Private IPv4 ranges (RFC 1918 + loopback variations like 127.0.0.1, 127.1)
    const isPrivateIP =
      /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|127\.)/.test(hostname) ||
      /^fc00:|^fe80:|^::ffff:/i.test(hostname);

    const isCloudMetadata =
      hostname === '169.254.169.254' ||
      hostname === 'metadata.google.internal' ||
      hostname === '100.100.100.200';

    // Disallow decimal/hex/octal/shortened integer IP representations (e.g. 2130706433 or 0x7f000001 or 017700000001)
    const isEncodedIP =
      /^\d{1,11}$/.test(hostname) ||
      /^0x[0-9a-fA-F]+/i.test(hostname) ||
      /^0\d+/.test(hostname);

    if (isLocalhost || isWildcardLoopback || isPrivateIP || isCloudMetadata || isEncodedIP) {
      return {
        isValid: false,
        isSafeToProcess: false,
        hostname,
        protocol,
        error: 'Private internal, loopback, or metadata addresses cannot be analyzed.',
        suspiciousSignals: ['INTERNAL_NETWORK_TARGET'],
        isShortener: false,
        isOfficialDomain: false,
      };
    }

    // 3. Port restrictions (only standard web ports)
    if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
      return {
        isValid: true,
        isSafeToProcess: true,
        hostname,
        protocol,
        suspiciousSignals: ['NON_STANDARD_PORT'],
        isShortener: false,
        isOfficialDomain: false,
      };
    }

    // 4. Analyze domain risks
    const suspiciousSignals: string[] = [];

    if (parsed.username || parsed.password) {
      suspiciousSignals.push('CREDENTIALS_IN_URL_PHISHING');
    }

    const isOfficialDomain = OFFICIAL_TRUSTED_DOMAINS.some(
      (dom) => hostname === dom || hostname.endsWith(`.${dom}`)
    );

    const isShortener = KNOWN_SHORTENERS.some(
      (short) => hostname === short || hostname.endsWith(`.${short}`)
    );

    if (isShortener) {
      suspiciousSignals.push('URL_SHORTENER_MASKING');
    }

    if (SUSPICIOUS_TLDS.some((tld) => hostname.endsWith(tld))) {
      suspiciousSignals.push('SUSPICIOUS_TLD');
    }

    const financialKeywords = ['sebi', 'rbi', 'sbi', 'hdfc', 'icici', 'zerodha', 'groww', 'angelone', 'upstox', 'kyc', 'trading', 'profit', 'bonus'];
    const hasFinancialKeyword = financialKeywords.some((kw) => hostname.includes(kw));

    if (hasFinancialKeyword && !isOfficialDomain && !hostname.endsWith('.gov.in') && !hostname.endsWith('.bank')) {
      suspiciousSignals.push('POSSIBLE_BRAND_IMPERSONATION_DOMAIN');
    }

    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      suspiciousSignals.push('RAW_IP_ADDRESS_HOST');
    }

    return {
      isValid: true,
      isSafeToProcess: true,
      hostname,
      protocol,
      suspiciousSignals,
      isShortener,
      isOfficialDomain,
    };
  } catch {
    return {
      isValid: false,
      isSafeToProcess: false,
      hostname: '',
      protocol: '',
      error: 'Invalid URL format provided. Please check the web address.',
      suspiciousSignals: ['MALFORMED_URL'],
      isShortener: false,
      isOfficialDomain: false,
    };
  }
}
