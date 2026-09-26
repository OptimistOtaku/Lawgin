import { Clause, DocumentAnalysis, PersonaType, RiskCategoryBreakdown, RiskLevel } from '../types/legal';

export class HeuristicsEngine {
  /**
   * Estimates Flesch-Kincaid Reading Grade Level
   */
  public static calculateReadability(text: string): { gradeLevel: string; score: number; readingTimeMin: number } {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (words.length === 0 || sentences.length === 0) {
      return { gradeLevel: 'Standard (8th Grade)', score: 65, readingTimeMin: 1 };
    }

    const wordCount = words.length;
    const sentenceCount = Math.max(1, sentences.length);
    
    // Rough syllable count
    let syllableCount = 0;
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, '');
      if (clean.length <= 3) {
        syllableCount += 1;
      } else {
        const matches = clean.match(/[aeiouy]{1,2}/g);
        syllableCount += matches ? matches.length : 1;
      }
    });

    // Flesch Reading Ease Formula
    const ease = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
    const readingTimeMin = Math.max(1, Math.round(wordCount / 200));

    let gradeLevel = 'Grade 8-9 (Conversational)';
    if (ease < 30) gradeLevel = 'Graduate / Advanced Law Degree (Extremely Complex)';
    else if (ease < 50) gradeLevel = 'College Level (Complex Legal Jargon)';
    else if (ease < 60) gradeLevel = 'High School Senior (Dense)';
    else if (ease < 70) gradeLevel = 'Plain English (8th-9th Grade)';
    else gradeLevel = 'Very Accessible (6th Grade Plain Language)';

    return {
      gradeLevel,
      score: Math.max(0, Math.min(100, Math.round(ease))),
      readingTimeMin
    };
  }

  /**
   * Splits legal document into identifiable clauses
   */
  public static segmentDocument(rawText: string): Clause[] {
    const lines = rawText.split('\n');
    const clauses: Clause[] = [];
    let currentClause: Partial<Clause> | null = null;
    let buffer: string[] = [];

    // Header pattern: e.g. "1. Term and Termination", "SECTION 3. INDEMNIFICATION", "Clause 4 - Payment"
    const headerRegex = /^(?:(?:SECTION|CLAUSE|ARTICLE)\s+)?([0-9]{1,2}(?:\.[0-9]{1,2})?|\b[IVXLCDM]+\b)[\.:\s\-]+([^\n\r]+)/i;

    const flushCurrent = () => {
      if (currentClause && currentClause.title) {
        const text = buffer.join('\n').trim();
        const analysis = HeuristicsEngine.analyzeClauseRisk(currentClause.title, text);
        clauses.push({
          id: `clause-${clauses.length + 1}`,
          number: currentClause.number || `${clauses.length + 1}`,
          title: currentClause.title.trim(),
          originalText: text,
          simplifiedText: HeuristicsEngine.generatePlainEnglish(text, 'layman'),
          riskLevel: analysis.riskLevel,
          riskExplanation: analysis.explanation,
          suggestedAlternative: analysis.alternative,
          category: analysis.category,
          isPredatory: analysis.isPredatory,
          predatoryReason: analysis.predatoryReason
        });
        buffer = [];
      }
    };

    for (const line of lines) {
      const match = line.trim().match(headerRegex);
      if (match && line.trim().length < 90 && !line.trim().endsWith('.')) {
        flushCurrent();
        currentClause = {
          number: match[1],
          title: match[2] || line.trim()
        };
      } else {
        if (!currentClause) {
          currentClause = {
            number: '1',
            title: 'Preamble & Recitals'
          };
        }
        buffer.push(line);
      }
    }
    flushCurrent();

    if (clauses.length === 0 && rawText.trim().length > 0) {
      // Fallback: split by double newlines into logical sections
      const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim().length > 20);
      paragraphs.forEach((p, idx) => {
        const titleMatch = p.slice(0, 50).split('.')[0];
        const analysis = HeuristicsEngine.analyzeClauseRisk(titleMatch, p);
        clauses.push({
          id: `clause-${idx + 1}`,
          number: `${idx + 1}`,
          title: titleMatch.trim() || `Section ${idx + 1}`,
          originalText: p.trim(),
          simplifiedText: HeuristicsEngine.generatePlainEnglish(p, 'layman'),
          riskLevel: analysis.riskLevel,
          riskExplanation: analysis.explanation,
          suggestedAlternative: analysis.alternative,
          category: analysis.category,
          isPredatory: analysis.isPredatory,
          predatoryReason: analysis.predatoryReason
        });
      });
    }

    return clauses;
  }

  /**
   * Evaluates legal risk and predatory markers for a specific clause
   */
  public static analyzeClauseRisk(title: string, text: string): {
    riskLevel: RiskLevel;
    category: Clause['category'];
    explanation: string;
    alternative: string;
    isPredatory: boolean;
    predatoryReason?: string;
  } {
    const lower = (title + ' ' + text).toLowerCase();

    // 1. Unlimited Indemnification / Defense trap
    if ((lower.includes('indemnif') || lower.includes('hold harmless') || lower.includes('defend')) && 
        (lower.includes('hold harmless') || lower.includes('defend') || lower.includes('indemnif')) && 
        (lower.includes('unlimited') || lower.includes('without limitation') || lower.includes('any and all') || !lower.includes('gross negligence'))) {
      return {
        riskLevel: 'critical',
        category: 'liability',
        isPredatory: true,
        predatoryReason: 'Uncapped unilateral indemnification obligation. Requires you to pay unlimited legal defense costs even for indirect or ordinary damages.',
        explanation: 'Requires you to financially absorb legal fees and lawsuits filed against the counterparty, potentially bankrupting you for third-party claims.',
        alternative: 'Limit indemnity strictly to direct damages caused exclusively by your material breach or intentional misconduct, with a financial liability cap.'
      };
    }

    // 2. Class Action Waiver & Forced Secret Arbitration
    if (lower.includes('arbitration') && (lower.includes('class action waiver') || lower.includes('waive the right') || lower.includes('solely in individual capacity'))) {
      return {
        riskLevel: 'high',
        category: 'dispute',
        isPredatory: true,
        predatoryReason: 'Forced mandatory arbitration with waiver of court trial and class action rights.',
        explanation: 'You surrender your constitutional right to sue in court or join with other affected parties. Arbitration costs are often high and proceedings are confidential.',
        alternative: 'Include right to bring claims in small claims court and mutual clause where losing party pays arbitral fees.'
      };
    }

    // 3. Perpetual IP Assignment / Moonlighting trap
    if ((lower.includes('intellectual property') || lower.includes('work product') || lower.includes('invention')) && 
        (lower.includes('assigns all rights') || lower.includes('perpetual') || lower.includes('worldwide') || lower.includes('any prior ideas') || lower.includes('outside working hours'))) {
      return {
        riskLevel: 'critical',
        category: 'ip',
        isPredatory: true,
        predatoryReason: 'Overly broad IP surrender claiming ownership over prior inventions or projects developed on personal time.',
        explanation: 'Counterparty claims full ownership of everything you design or invent, potentially encompassing tools, side projects, or pre-existing code.',
        alternative: 'Specify that IP assignment only applies strictly to paid Deliverables specified in the SOW, explicitly carving out pre-existing IP and personal projects.'
      };
    }

    // 4. Sneaky Auto-Renewal / Evergreen Lock-in
    if ((lower.includes('auto-renew') || lower.includes('automatically renew') || lower.includes('renew for successive')) && 
        (lower.includes('60 days') || lower.includes('90 days') || lower.includes('prior written notice'))) {
      return {
        riskLevel: 'high',
        category: 'termination',
        isPredatory: true,
        predatoryReason: 'Evergreen auto-renewal trap with narrow 60-90 day opt-out window.',
        explanation: 'If you fail to notify in writing within an exact window months before expiration, you are legally locked into paying for another full term.',
        alternative: 'Require counterparty to provide written reminder 30 days before renewal deadline, or allow month-to-month continuation thereafter.'
      };
    }

    // 5. Unilateral Changes to Terms
    if (lower.includes('modify these terms') || lower.includes('sole discretion') || lower.includes('without prior notice') || lower.includes('reserve the right to change')) {
      return {
        riskLevel: 'high',
        category: 'general',
        isPredatory: true,
        predatoryReason: 'Unilateral modification power without mutual consent.',
        explanation: 'The counterparty grants itself the sole right to alter pricing, terms, or obligations at any time without needing your agreement.',
        alternative: 'Material modifications require at least 30 days advance notice and give you the right to terminate without penalty.'
      };
    }

    // 6. Security Deposit & Unannounced Entry (Tenancy)
    if (lower.includes('landlord') && (lower.includes('enter the premises at any time') || lower.includes('non-refundable deposit') || lower.includes('forfeit deposit'))) {
      return {
        riskLevel: 'critical',
        category: 'general',
        isPredatory: true,
        predatoryReason: 'Landlord entry without 24hr notice / unlawful non-refundable deposit terms.',
        explanation: 'Violates basic quiet enjoyment rights and state statutory tenant protections regarding security deposit returns.',
        alternative: 'Require minimum 24-48 hours advance written notice for non-emergency entry, and define return of deposit within statutory 14-30 days.'
      };
    }

    // 7. Non-Compete & Restrictive Covenants
    if (lower.includes('non-compete') || lower.includes('covenant not to compete') || (lower.includes('shall not engage') && lower.includes('competitor'))) {
      const isExtreme = lower.includes('worldwide') || lower.includes('2 years') || lower.includes('any business');
      return {
        riskLevel: isExtreme ? 'critical' : 'high',
        category: 'termination',
        isPredatory: isExtreme,
        predatoryReason: isExtreme ? 'Excessively punitive geographic and temporal non-compete restriction.' : undefined,
        explanation: 'Restricts your livelihood and ability to earn a living in your industry after this contract ends.',
        alternative: 'Remove non-compete completely or narrow strictly to direct solicitation of existing active clients within a 15-mile radius for 6 months maximum.'
      };
    }

    // 8. Payment & Penalty traps
    if (lower.includes('net 90') || lower.includes('net 120') || lower.includes('late fee of 10%') || lower.includes('pay-when-paid')) {
      return {
        riskLevel: 'medium',
        category: 'payment',
        isPredatory: lower.includes('pay-when-paid'),
        predatoryReason: lower.includes('pay-when-paid') ? 'Pay-when-paid clause shifts counterparty client collection risk onto you.' : undefined,
        explanation: 'Excessively delayed payment terms or abusive penalties that hurt cash flow.',
        alternative: 'Standardize to Net 30 days, with 1.5% maximum monthly statutory late interest after 15-day grace period.'
      };
    }

    // Fallbacks
    let cat: Clause['category'] = 'general';
    if (lower.includes('pay') || lower.includes('fee') || lower.includes('price') || lower.includes('deposit')) cat = 'payment';
    else if (lower.includes('terminat') || lower.includes('renew') || lower.includes('cancellation')) cat = 'termination';
    else if (lower.includes('liabil') || lower.includes('damage') || lower.includes('warrant')) cat = 'liability';
    else if (lower.includes('dispute') || lower.includes('jurisdiction') || lower.includes('law')) cat = 'dispute';
    else if (lower.includes('confidential') || lower.includes('data') || lower.includes('privacy')) cat = 'privacy';

    return {
      riskLevel: 'low',
      category: cat,
      isPredatory: false,
      explanation: 'Standard operational terms with standard commercial balance.',
      alternative: 'Ensure dates, deliverables, and amounts align with mutual verbal expectations.'
    };
  }

  /**
   * Generates persona-tailored plain English translation
   */
  public static generatePlainEnglish(text: string, persona: PersonaType): string {
    const snippet = text.slice(0, 160).replace(/\s+/g, ' ');
    const lower = text.toLowerCase();

    if (persona === 'tenant') {
      if (lower.includes('rent') || lower.includes('due')) return 'Your rent is due on the 1st. If you pay late, penalties apply.';
      if (lower.includes('deposit')) return 'Explains how much deposit you pay and under what conditions the landlord can keep your money when moving out.';
      if (lower.includes('access') || lower.includes('entry')) return 'States when and how the landlord can enter your home.';
      return `What this means for you as a tenant: ${snippet}`;
    }

    if (persona === 'freelancer') {
      if (lower.includes('intellectual property') || lower.includes('work product')) return 'Addresses who owns the designs, code, or materials you build and whether you can show them in your portfolio.';
      if (lower.includes('payment') || lower.includes('invoice')) return 'Specifies when you get paid after submitting an invoice and whether you can charge late fees.';
      if (lower.includes('indemnif')) return 'Caution: States whether you must pay for the client\'s lawsuits or legal troubles.';
      return `What this means for your freelance business: ${snippet}`;
    }

    if (persona === 'consumer') {
      if (lower.includes('subscription') || lower.includes('renewal')) return 'Explains how they charge your card automatically and how tricky it is to cancel.';
      if (lower.includes('arbitrat') || lower.includes('class action')) return 'You give up your right to sue them in regular court if they overcharge or harm you.';
      return `Everyday consumer summary: ${snippet}`;
    }

    if (persona === 'business') {
      return `Commercial implication: Establishes operational boundaries, financial exposure, and risk allocation for this clause.`;
    }

    // Default layman / ELIF5
    return `In plain terms: This clause sets the ground rules. Be sure you agree with how responsibilities are divided between both sides.`;
  }

  /**
   * Calculates overall risk score (0-100) and structured analysis
   */
  public static performFullAnalysis(title: string, rawText: string, docType: DocumentAnalysis['documentType']): DocumentAnalysis {
    const clauses = HeuristicsEngine.segmentDocument(rawText);
    const readability = HeuristicsEngine.calculateReadability(rawText);

    let totalRiskWeight = 0;
    let predatoryCount = 0;

    const categoryMap: Record<string, { totalScore: number; count: number; maxLevel: RiskLevel; sampleTitle: string }> = {
      liability: { totalScore: 0, count: 0, maxLevel: 'low', sampleTitle: 'Liability & Indemnity' },
      dispute: { totalScore: 0, count: 0, maxLevel: 'low', sampleTitle: 'Dispute Resolution & Arbitration' },
      termination: { totalScore: 0, count: 0, maxLevel: 'low', sampleTitle: 'Termination & Auto-Renewal' },
      payment: { totalScore: 0, count: 0, maxLevel: 'low', sampleTitle: 'Payment & Financial Obligations' },
      ip: { totalScore: 0, count: 0, maxLevel: 'low', sampleTitle: 'Intellectual Property & Ownership' },
      general: { totalScore: 0, count: 0, maxLevel: 'low', sampleTitle: 'General Provisions' }
    };

    clauses.forEach(clause => {
      let weight = 5;
      if (clause.riskLevel === 'medium') weight = 25;
      else if (clause.riskLevel === 'high') weight = 60;
      else if (clause.riskLevel === 'critical') weight = 95;

      if (clause.isPredatory) {
        predatoryCount++;
        weight = Math.max(weight, 85);
      }

      totalRiskWeight += weight;

      const cat = categoryMap[clause.category] || categoryMap.general;
      cat.count++;
      cat.totalScore += weight;
      if (clause.riskLevel === 'critical' || (clause.riskLevel === 'high' && cat.maxLevel !== 'critical')) {
        cat.maxLevel = clause.riskLevel;
      }
    });

    const clauseCount = Math.max(1, clauses.length);
    const rawAverage = totalRiskWeight / clauseCount;
    // Boost score if predatory clauses exist
    const overallRiskScore = Math.min(100, Math.round(rawAverage + predatoryCount * 12));

    let overallRiskVerdict: DocumentAnalysis['overallRiskVerdict'] = 'Safe & Balanced';
    if (overallRiskScore > 75 || predatoryCount >= 2) overallRiskVerdict = 'Critical Red Flags';
    else if (overallRiskScore > 50 || predatoryCount === 1) overallRiskVerdict = 'High Risk / Unfavorable';
    else if (overallRiskScore > 25) overallRiskVerdict = 'Moderate Caution';

    const categoryBreakdown: RiskCategoryBreakdown[] = Object.entries(categoryMap)
      .filter(([_, data]) => data.count > 0)
      .map(([key, data]) => {
        const avg = Math.min(100, Math.round(data.totalScore / data.count));
        return {
          category: key.toUpperCase(),
          score: avg,
          riskLevel: data.maxLevel,
          clauseCount: data.count,
          highlight: `${data.count} clause(s) analyzed in ${data.sampleTitle}`
        };
      });

    return {
      id: `doc-${Date.now()}`,
      title: title || 'Analyzed Legal Document',
      documentType: docType,
      readingGradeLevel: readability.gradeLevel,
      readingTimeMinutes: readability.readingTimeMin,
      overallRiskScore,
      overallRiskVerdict,
      executiveSummary: `This ${docType.replace('_', ' ')} agreement contains ${clauses.length} distinct clauses. Lawgin identified ${predatoryCount} predatory trap(s) and calculated an overall risk exposure index of ${overallRiskScore}/100 (${overallRiskVerdict}).`,
      plainEnglishSummary: `Before signing, be aware of the critical obligations regarding termination notice, uncapped indemnification, and dispute resolution mechanisms.`,
      keyObligations: [
        'Comply with stated notice periods prior to cancellation or termination.',
        'Timely fulfillment of financial considerations and milestone schedules.',
        'Adherence to confidentiality covenants and restricted disclosure terms.'
      ],
      keyRights: [
        'Right to dispute unauthorized charges or erroneous invoices within 30 days.',
        'Right to quiet enjoyment or intellectual attribution as specified in scope.',
        'Right to cure alleged default within a statutory 15-day grace period.'
      ],
      clauses,
      categoryBreakdown,
      predatoryTrapsCount: predatoryCount
    };
  }
}
