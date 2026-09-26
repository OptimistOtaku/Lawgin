import { PIIShieldDetection } from '../types/legal';

export interface RedactionResult {
  sanitizedText: string;
  detections: PIIShieldDetection[];
  counts: Record<string, number>;
  totalRedacted: number;
}

export class PIIShieldService {
  /**
   * Scans text and replaces sensitive PII with anonymized tokens
   */
  public static redact(text: string): RedactionResult {
    if (!text) {
      return { sanitizedText: '', detections: [], counts: {}, totalRedacted: 0 };
    }

    let sanitized = text;
    const detections: PIIShieldDetection[] = [];
    const counts: Record<string, number> = {
      SSN: 0,
      EMAIL: 0,
      PHONE: 0,
      FINANCIAL: 0,
      ADDRESS: 0,
      NAME: 0
    };

    // 1. SSN / Tax ID pattern: XXX-XX-XXXX or XXX XX XXXX
    const ssnRegex = /\b\d{3}[- ]\d{2}[- ]\d{4}\b/g;
    sanitized = sanitized.replace(ssnRegex, (match) => {
      counts.SSN++;
      const placeholder = `[REDACTED_SSN_${counts.SSN}]`;
      detections.push({ original: match, placeholder, type: 'SSN' });
      return placeholder;
    });

    // 2. Email Addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
    sanitized = sanitized.replace(emailRegex, (match) => {
      counts.EMAIL++;
      const placeholder = `[REDACTED_EMAIL_${counts.EMAIL}]`;
      detections.push({ original: match, placeholder, type: 'EMAIL' });
      return placeholder;
    });

    // 3. Phone Numbers: (123) 456-7890, 123-456-7890, +1 123 456 7890
    const phoneRegex = /(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]+([0-9]{3})[-. ]+([0-9]{4})\b/g;
    sanitized = sanitized.replace(phoneRegex, (match) => {
      counts.PHONE++;
      const placeholder = `[REDACTED_PHONE_${counts.PHONE}]`;
      detections.push({ original: match, placeholder, type: 'PHONE' });
      return placeholder;
    });

    // 4. Financial / Bank Account / Card pattern (16 digits or IBAN)
    const cardRegex = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
    sanitized = sanitized.replace(cardRegex, (match) => {
      counts.FINANCIAL++;
      const placeholder = `[REDACTED_CARD_${counts.FINANCIAL}]`;
      detections.push({ original: match, placeholder, type: 'FINANCIAL' });
      return placeholder;
    });

    // 5. Street addresses with zip: e.g. "123 Main Street, Suite 400, New York, NY 10001"
    const addressRegex = /\b\d{1,5}\s+[A-Za-z0-9\.\s]{3,35}\s+(?:Avenue|Ave|Street|St|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Suite|Ste)\b(?:\s*,?\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5})?/gi;
    sanitized = sanitized.replace(addressRegex, (match) => {
      counts.ADDRESS++;
      const placeholder = `[REDACTED_ADDRESS_${counts.ADDRESS}]`;
      detections.push({ original: match, placeholder, type: 'ADDRESS' });
      return placeholder;
    });

    // 6. Signatory / party names in standard contract headers: "by and between John Doe ("Tenant")" or "Mr./Ms. John Doe"
    const namePatternRegex = /(?:between|party:\s*|Employee:\s*|Tenant:\s*|Contractor:\s*|Client:\s*|signed by\s+|Mr\.\s+|Ms\.\s+|Dr\.\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g;
    sanitized = sanitized.replace(namePatternRegex, (match, p1) => {
      counts.NAME++;
      const placeholder = `[REDACTED_NAME_${counts.NAME}]`;
      detections.push({ original: p1, placeholder, type: 'NAME' });
      return match.replace(p1, placeholder);
    });

    const totalRedacted = Object.values(counts).reduce((a, b) => a + b, 0);

    return {
      sanitizedText: sanitized,
      detections,
      counts,
      totalRedacted
    };
  }

  /**
   * Restores redacted tokens back to their original text for client-side display
   */
  public static restore(redactedText: string, detections: PIIShieldDetection[]): string {
    let restored = redactedText;
    for (const item of detections) {
      restored = restored.split(item.placeholder).join(item.original);
    }
    return restored;
  }
}
