/**
 * CSV / Spreadsheet Formula Injection Protection
 * Prepend single quote (') if string begins with =, +, -, @ to prevent formula execution in Excel/Calc.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);

  // Check if string starts with formula triggers
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Filter object fields strictly by allowlist to prevent PII over-sharing
 */
export function filterAllowlist<T extends Record<string, any>>(data: T, allowedFields: (keyof T)[]): Partial<T> {
  const result: Partial<T> = {};
  for (const key of allowedFields) {
    if (key in data && data[key] !== undefined) {
      result[key] = data[key];
    }
  }
  return result;
}

/**
 * Sanitize PII text strings (Phone numbers, Real names, exact addresses)
 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return 'Chưa có SĐT';
  if (phone.length <= 6) return '***-***';
  return `${phone.slice(0, 3)}***${phone.slice(-3)}`;
}

export function maskName(fullName?: string | null, isMinor: boolean = false, aliasName?: string | null): string {
  if (isMinor) {
    return aliasName || 'Trẻ em vị thành niên (Ẩn danh)';
  }
  if (aliasName) return aliasName;
  if (!fullName) return 'Người thụ hưởng ẩn danh';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return `${parts[0][0]}.***`;
  return `${parts[0]} *.*. ${parts[parts.length - 1]}`;
}

/**
 * Mask email address (e.g., n***n@example.com)
 */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `*@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Mask detailed address keeping only city/district level
 */
export function maskAddress(address?: string | null): string {
  if (!address) return 'Khu vực địa phương';
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return `[Khu vực che mờ], ${parts.slice(-2).join(', ')}`;
  }
  return '[Địa chỉ đã được che mờ bảo vệ riêng tư]';
}

/**
 * Mask National Citizen ID (CCCD/CMND) (e.g. 079***001)
 */
export function maskCitizenId(id?: string | null): string {
  if (!id) return '***';
  if (id.length <= 6) return '***';
  return `${id.slice(0, 3)}***${id.slice(-3)}`;
}

