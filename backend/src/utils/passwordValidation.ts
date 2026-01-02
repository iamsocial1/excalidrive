/**
 * Password strength validation utilities
 */

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  errors: string[];
  suggestions: string[];
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score++;
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score++;
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score++;
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score++;
  }

  // Check for special characters (bonus)
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  } else {
    suggestions.push('Consider adding special characters for stronger security');
  }

  // Check for common patterns
  const commonPatterns = [
    /^123456/,
    /^password/i,
    /^qwerty/i,
    /^abc123/i,
    /^111111/,
    /^letmein/i,
    /^welcome/i,
    /^monkey/i,
    /^dragon/i,
    /^master/i
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns that are easy to guess');
      score = Math.max(0, score - 2);
      break;
    }
  }

  // Check for sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    suggestions.push('Avoid sequential characters for better security');
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    suggestions.push('Avoid repeating the same character multiple times');
  }

  // Check length bonus
  if (password.length >= 12) {
    score++;
  }

  if (password.length >= 16) {
    score++;
  }

  // Cap score at 4
  score = Math.min(4, score);

  const isValid = errors.length === 0 && score >= 2;

  return {
    isValid,
    score,
    errors,
    suggestions
  };
}

/**
 * Check if password meets minimum requirements
 */
export function meetsMinimumRequirements(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
      return 'Very Weak';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Strong';
    case 4:
      return 'Very Strong';
    default:
      return 'Unknown';
  }
}
