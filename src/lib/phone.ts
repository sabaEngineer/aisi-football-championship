/**
 * Georgian phone number validation and formatting.
 * Format: +995 5XX XXX XXX (mobile) or +995 79X XXX XXXX
 * National number: 9 digits, mobile typically starts with 5 or 79
 */

/** Extract digits only from phone string */
export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Validate Georgian phone number.
 * Accepts: +995 555 123 456, +995555123456, 995555123456, 555123456
 * Georgian mobile: 9 digits starting with 5,6,7,8,9. Rejects 1,2,3,4 and wrong length.
 */
export function isValidGeorgianPhone(phone: string): boolean {
  const digits = digitsOnly(phone);
  // Exactly 12 digits: 995 + 9 national
  if (digits.length === 12) {
    return digits.startsWith("995") && /^995[5-9]\d{8}$/.test(digits);
  }
  // Exactly 9 digits: national only, must start with 5-9
  if (digits.length === 9) {
    return /^[5-9]\d{8}$/.test(digits);
  }
  return false;
}

/**
 * Normalize to E.164-like format for storage: +995XXXXXXXXX
 */
export function normalizeGeorgianPhone(phone: string): string {
  const digits = digitsOnly(phone);
  if (digits.length === 9 && /^[5-9]/.test(digits)) {
    return `+995${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("995")) {
    return `+${digits}`;
  }
  return phone.trim();
}

/** Variants for DB lookup (handles legacy formats like "591195233" or "+995555000001") */
export function getPhoneLookupVariants(phone: string): string[] {
  const normalized = normalizeGeorgianPhone(phone);
  const digits = digitsOnly(phone);
  const variants = new Set<string>([normalized]);
  if (digits.length === 12 && digits.startsWith("995")) {
    variants.add(digits.slice(3)); // 9-digit local
  }
  if (digits.length === 9) {
    variants.add(digits);
    variants.add(`+995${digits}`);
  }
  return Array.from(variants);
}

/**
 * Format for display: +995 555 123 456
 */
export function formatGeorgianPhone(phone: string): string {
  const normalized = normalizeGeorgianPhone(phone);
  const digits = digitsOnly(normalized);
  if (digits.length >= 12 && digits.startsWith("995")) {
    const national = digits.slice(3);
    return `+995 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
  }
  return normalized;
}

/** Format input as user types: +995 XXX XXX XXX */
export function formatPhoneInput(value: string): string {
  const digits = digitsOnly(value);
  if (digits.length === 0) return "";
  // Auto-add +995 if user starts with 5, 7, 8, 9
  let d = digits;
  if (digits.length <= 9 && /^[5-9]/.test(digits)) {
    d = "995" + digits;
  } else if (digits.length <= 3 && digits.startsWith("995")) {
    d = digits;
  } else if (digits.length > 3 && !digits.startsWith("995")) {
    d = "995" + digits.slice(0, 9);
  }
  d = d.slice(0, 12);
  if (d.length <= 3) return d ? `+${d}` : "";
  const national = d.slice(3);
  return `+995 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6, 9)}`.trim();
}
