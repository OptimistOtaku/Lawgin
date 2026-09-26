import { describe, it, expect } from 'vitest';
import { PIIShieldService } from '../services/piiRedactor';

describe('PIIShieldService - Security & Privacy Redactor', () => {
  it('should detect and mask Social Security Numbers', () => {
    const raw = 'The tenant with SSN 123-45-6789 agreed to terms.';
    const result = PIIShieldService.redact(raw);
    expect(result.counts.SSN).toBe(1);
    expect(result.sanitizedText).toContain('[REDACTED_SSN_1]');
    expect(result.sanitizedText).not.toContain('123-45-6789');
  });

  it('should detect and mask email addresses', () => {
    const raw = 'Send notice to legal.counsel@enterprise.com and billing@apex.org.';
    const result = PIIShieldService.redact(raw);
    expect(result.counts.EMAIL).toBe(2);
    expect(result.sanitizedText).toContain('[REDACTED_EMAIL_1]');
    expect(result.sanitizedText).toContain('[REDACTED_EMAIL_2]');
    expect(result.sanitizedText).not.toContain('legal.counsel@enterprise.com');
  });

  it('should detect and mask phone numbers', () => {
    const raw = 'Call (555) 234-5678 or 800-555-0199 for emergency maintenance.';
    const result = PIIShieldService.redact(raw);
    expect(result.counts.PHONE).toBeGreaterThanOrEqual(1);
    expect(result.sanitizedText).toContain('[REDACTED_PHONE_');
  });

  it('should detect and mask credit card numbers', () => {
    const raw = 'Auto-charge card 4111 2222 3333 4444 on the 1st of each month.';
    const result = PIIShieldService.redact(raw);
    expect(result.counts.FINANCIAL).toBe(1);
    expect(result.sanitizedText).toContain('[REDACTED_CARD_1]');
    expect(result.sanitizedText).not.toContain('4111 2222 3333 4444');
  });

  it('should restore sanitized text back to original values when needed', () => {
    const original = 'Contact john.doe@email.com with SSN 987-65-4321.';
    const { sanitizedText, detections } = PIIShieldService.redact(original);
    const restored = PIIShieldService.restore(sanitizedText, detections);
    expect(restored).toBe(original);
  });
});
