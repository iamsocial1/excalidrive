/**
 * Input sanitization utilities to prevent injection attacks
 */

/**
 * Sanitize string input by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize HTML to prevent XSS attacks
 * Escapes HTML special characters
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  const htmlEscapeMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Remove script tags and event handlers from HTML
 */
export function stripScripts(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove script tags
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  return sanitized;
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }

  // Convert to lowercase and trim
  return email.toLowerCase().trim();
}

/**
 * Sanitize object by recursively sanitizing all string values
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validate and sanitize UUID
 */
export function sanitizeUUID(uuid: string): string | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (typeof uuid !== 'string' || !uuidRegex.test(uuid)) {
    return null;
  }

  return uuid.toLowerCase();
}

/**
 * Sanitize integer input
 */
export function sanitizeInteger(value: any, defaultValue: number = 0): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Sanitize boolean input
 */
export function sanitizeBoolean(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return Boolean(value);
}
