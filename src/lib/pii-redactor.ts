export interface RedactionResult {
  redactedText: string;
  piiDetected: boolean;
  detectedTypes: string[];
  redactedCount: number;
}

export function redactPII(input: string): RedactionResult {
  if (!input || typeof input !== 'string') {
    return {
      redactedText: '',
      piiDetected: false,
      detectedTypes: [],
      redactedCount: 0,
    };
  }

  let text = input;
  const detectedTypes: Set<string> = new Set();
  let count = 0;

  // 1. Credit / Debit Card Numbers (16 digits or 4x4)
  const cardRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
  text = text.replace(cardRegex, () => {
    detectedTypes.add('CREDIT/DEBIT CARD');
    count++;
    return '[CARD NUMBER REDACTED]';
  });

  // 2. Email Addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b/g;
  text = text.replace(emailRegex, () => {
    detectedTypes.add('EMAIL');
    count++;
    return '[EMAIL REDACTED]';
  });

  // 3. Indian Mobile Numbers (+91, 0, or 10-digit formats with dashes/spaces/dots)
  const phoneRegex = /(?:\+91[-\s.]?|91[-\s.]?|0)?[6-9]\d{2}[-\s.]?\d{3}[-\s.]?\d{4}\b/g;
  text = text.replace(phoneRegex, () => {
    detectedTypes.add('PHONE NUMBER');
    count++;
    return '[PHONE NUMBER REDACTED]';
  });

  // 4. UPI Handles (e.g. user@oksbi, payment@paytm, name@ybl, xyz@upi, etc.)
  const upiRegex = /\b[a-zA-Z0-9.\-_]{2,256}@(oksbi|okhdfcbank|okicici|okaxis|paytm|ybl|ibl|axl|upi|sbi|hdfcbank|icici|barodampay|postbank|apl|ikwik|axisbank)\b/gi;
  text = text.replace(upiRegex, () => {
    detectedTypes.add('UPI ID');
    count++;
    return '[UPI ID REDACTED]';
  });

  // 5. OTP / Verification Code Patterns (in English and Hindi: e.g. "OTP is 489201", "ओटीपी 892019")
  const otpPatternRegex = /(?:otp|one[\s-]time\s*password|verification\s*code|security\s*code|ओटीपी|सत्यापन\s*कोड|पासवर्ड)(?:\s+(?:is|code|number|#|है))?\s*[:=]?\s*([0-9]{4,8})\b/gi;
  text = text.replace(otpPatternRegex, (match, digits) => {
    detectedTypes.add('OTP/CODE');
    count++;
    return match.replace(digits, '[OTP REDACTED]');
  });

  // 6. Indian PAN Numbers (5 letters, 4 digits, 1 letter: case-insensitive e.g. ABCDE1234F or abcde1234f)
  const panRegex = /\b[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}\b/g;
  text = text.replace(panRegex, () => {
    detectedTypes.add('PAN CARD NUMBER');
    count++;
    return '[PAN REDACTED]';
  });

  // 7. Indian Aadhaar Number format (12 digits: formatted as 4-4-4 or prefixed with Aadhaar)
  const aadhaarRegex = /\b[2-9]\d{3}[-\s]\d{4}[-\s]\d{4}\b|(?:\baadhaar\b[\s:#]*)([2-9]\d{11})\b/gi;
  text = text.replace(aadhaarRegex, (match, unspacedDigits) => {
    detectedTypes.add('AADHAAR NUMBER');
    count++;
    if (unspacedDigits) {
      return match.replace(unspacedDigits, '[AADHAAR REDACTED]');
    }
    return '[AADHAAR REDACTED]';
  });

  // 8. Bank Account Numbers (9 to 18 digits preceded by A/C, Account, Acct, A/C no, etc.)
  const bankAccRegex = /(?:a\/c|acct|account)(?:\s*(?:no|number|num|#))?[\s:#.]*(\d{9,18})\b/gi;
  text = text.replace(bankAccRegex, (match, digits) => {
    detectedTypes.add('BANK ACCOUNT NUMBER');
    count++;
    return match.replace(digits, '[ACCOUNT NUMBER REDACTED]');
  });

  return {
    redactedText: text,
    piiDetected: detectedTypes.size > 0,
    detectedTypes: Array.from(detectedTypes),
    redactedCount: count,
  };
}
