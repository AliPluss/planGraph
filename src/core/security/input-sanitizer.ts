const INJECTION_PATTERNS = [
  /ignore\s+previous\s+instructions/gi,
  /ignore\s+all\s+instructions/gi,
  /system:/gi,
  /<\|im_start\|>/gi,
  /\[INST\]/gi,
  /forget\s+everything/gi,
  /تجاهل\s+التعليمات/g,
];

const SECRET_PATTERNS = [
  { pattern: /sk-ant-[A-Za-z0-9_-]+/g, replacement: "[REDACTED]" },
  { pattern: /sk-[A-Za-z0-9_-]+/g, replacement: "[REDACTED]" },
  { pattern: /AIza[A-Za-z0-9_-]+/g, replacement: "[REDACTED]" },
  { pattern: /Bearer\s+[A-Za-z0-9_.\-/+=]+/g, replacement: "Bearer [REDACTED]" },
];

export class InputSanitizer {
  sanitizeIdea(input: string): { clean: string; warnings: string[] } {
    const warnings: string[] = [];

    // Strip control characters
    let clean = input.replace(/[\x00-\x1F\x7F]/g, "");

    // Truncate
    if (clean.length > 5000) {
      clean = clean.slice(0, 5000);
      warnings.push("Input truncated to 5000 characters.");
    }

    // Detect and filter injection patterns
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(clean)) {
        warnings.push(`Potential prompt injection filtered: matched pattern ${pattern.source}`);
        clean = clean.replace(pattern, "[FILTERED]");
      }
    }

    return { clean, warnings };
  }

  sanitizeForLog(message: string): string {
    let result = message;
    for (const { pattern, replacement } of SECRET_PATTERNS) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }
}

export const inputSanitizer = new InputSanitizer();
