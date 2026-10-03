export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  errorHi?: string;
  mimeType?: string;
  sizeBytes?: number;
  sanitizedFilename?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export function validateImageUpload(
  file: { name: string; size: number; type: string; buffer?: ArrayBuffer }
): FileValidationResult {
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided.',
      errorHi: 'कोई फ़ाइल अपलोड नहीं की गई।',
    };
  }

  // 1. File Size Check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      sizeBytes: file.size,
      error: 'Screenshot exceeds the 5MB size limit. Please upload a smaller image.',
      errorHi: 'स्क्रीनशॉट 5MB से बड़ा है। कृपया छोटी फ़ाइल चुनें।',
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      sizeBytes: 0,
      error: 'The uploaded file is empty.',
      errorHi: 'अपलोड की गई फ़ाइल खाली है।',
    };
  }

  // 2. Extension Check
  const lowerName = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

  // Disallow suspicious extensions immediately
  const dangerousExts = ['.exe', '.apk', '.bat', '.cmd', '.sh', '.js', '.vbs', '.scr', '.ps1', '.html', '.php'];
  if (dangerousExts.some((ext) => lowerName.endsWith(ext))) {
    return {
      isValid: false,
      error: 'Executable and script files (.apk, .exe, etc.) cannot be uploaded for safety.',
      errorHi: 'सुरक्षा कारणों से APK या अन्य निष्पादन योग्य फ़ाइलें अपलोड नहीं की जा सकतीं।',
    };
  }

  if (!hasValidExt) {
    return {
      isValid: false,
      error: 'Supported formats are JPG, PNG, and WebP images only.',
      errorHi: 'केवल JPG, PNG और WebP स्क्रीनशॉट ही समर्थित हैं।',
    };
  }

  // 3. MIME Type Check
  const cleanMime = file.type.toLowerCase().trim();
  if (!ALLOWED_MIME_TYPES.includes(cleanMime)) {
    return {
      isValid: false,
      mimeType: file.type,
      error: 'Invalid file MIME type. Only PNG, JPG, and WebP are allowed.',
      errorHi: 'फ़ाइल का प्रकार अमान्य है। केवल इमेज स्क्रीनशॉट स्वीकार्य हैं।',
    };
  }

  // 4. Magic Byte Verification (if buffer provided)
  if (file.buffer && file.buffer.byteLength >= 4) {
    const bytes = new Uint8Array(file.buffer.slice(0, 12));
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isWebp =
      bytes.byteLength >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 && // 'RIFF'
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50; // 'WEBP'

    if (!isPng && !isJpg && !isWebp) {
      return {
        isValid: false,
        error: 'File signature does not match a valid image format.',
        errorHi: 'फ़ाइल सिग्नेचर मान्य इमेज फॉर्मेट से मेल नहीं खाता।',
      };
    }
  }

  // Safe sanitized temporary filename
  const extension = lowerName.substring(lowerName.lastIndexOf('.'));
  const safeBase = `scamshield_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const sanitizedFilename = `${safeBase}${extension}`;

  return {
    isValid: true,
    mimeType: cleanMime,
    sizeBytes: file.size,
    sanitizedFilename,
  };
}
