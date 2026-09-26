export interface SampleContract {
  id: string;
  title: string;
  type: 'lease' | 'freelance_msa' | 'terms_of_service' | 'employment';
  description: string;
  defaultPersona: 'tenant' | 'freelancer' | 'consumer' | 'business';
  text: string;
  suggestedQuestions: string[];
  suggestedScenarios: string[];
  counterpartName: string;
  // For comparison mode
  comparisonBaselineName?: string;
  comparisonBaselineText?: string;
}

export const SAMPLE_CONTRACTS: SampleContract[] = [
  {
    id: 'lease-residential',
    title: 'Standard Residential Apartment Lease Agreement',
    type: 'lease',
    description: 'A 12-month urban apartment lease containing hidden entry traps, auto-renewal penalties, and security deposit deductions.',
    defaultPersona: 'tenant',
    counterpartName: 'Apex Metropolitan Properties LLC',
    suggestedQuestions: [
      'Can the landlord enter my apartment without giving advance notice?',
      'What happens if I need to move out 2 months early?',
      'How long does the landlord have to return my security deposit?',
      'Does this lease automatically renew if I forget to notify them?'
    ],
    suggestedScenarios: [
      'What if I get a job transfer and need to terminate after 6 months?',
      'What if my water heater breaks and the landlord takes 2 weeks to fix it?',
      'What if I pay my rent on the 6th of the month instead of the 1st?'
    ],
    text: `RESIDENTIAL APARTMENT LEASE AGREEMENT

SECTION 1. PARTIES AND PREMISES
This Residential Lease Agreement ("Lease") is entered into by and between Apex Metropolitan Properties LLC ("Landlord") and John Doe ("Tenant"), for the real property located at 742 Evergreen Terrace, Unit 4B, Springfield, IL 62704 ("Premises").

SECTION 2. TERM AND AUTOMATIC RENEWAL
The initial term of this Lease shall commence on October 1, 2026 and expire on September 30, 2027 ("Initial Term"). Unless Tenant provides written notice of non-renewal via certified mail exactly sixty (60) days prior to the expiration date, this Lease shall automatically renew for successive twelve (12) month terms at a monthly rental rate increased by fifteen percent (15%). If Tenant vacates without giving timely 60-day notice, Tenant shall forfeit the full security deposit and remain liable for the remainder of the renewal term.

SECTION 3. RENT, DUE DATES, AND ACCELERATION
Tenant agrees to pay monthly rent in the amount of $2,150.00, strictly due on the first (1st) day of each calendar month. If rent is not received by 11:59 PM on the 2nd day of the month, a late penalty of ten percent (10%) ($215.00) shall immediately accrue, plus an additional $20.00 per day thereafter. In the event of non-payment of rent by the 10th of the month, Landlord reserves the absolute right to accelerate all remaining monthly payments under the term, which shall become immediately due and payable in full.

SECTION 4. SECURITY DEPOSIT AND CLEANING DEDUCTIONS
Tenant shall deposit with Landlord the sum of $4,300.00 (two months' rent) as a Security Deposit. A mandatory, non-refundable administrative and carpet sanitization fee of $500.00 shall be deducted from the Security Deposit upon move-out regardless of physical condition. Landlord shall have ninety (90) days following surrender of possession to inspect premises and mail any remaining balance.

SECTION 5. LANDLORD RIGHT OF ENTRY AND INSPECTIONS
Landlord and its authorized agents, contractors, and inspectors shall have the right to enter the Premises at any time, with or without prior notice or consent of Tenant, for the purposes of inspection, maintenance, showing to prospective tenants, or any other commercial purpose deemed appropriate by Landlord.

SECTION 6. REPAIRS AND MAINTENANCE SURRENDER
Tenant accepts the Premises in "AS-IS" condition. Tenant shall be solely responsible for all interior repairs under $350.00, including plumbing clogs, appliance maintenance, and HVAC filter replacements. Landlord shall not be liable for any interruption in water, heating, electricity, or air conditioning services lasting fewer than thirty (30) consecutive days.

SECTION 7. INDEMNIFICATION AND LEGAL FEES
Tenant agrees to defend, indemnify, and hold harmless Landlord and its property managers against any and all claims, liabilities, lawsuits, losses, or legal costs arising from any injury, damage, or occurrence on the Premises. In any litigation or dispute arising under this Lease, Tenant shall reimburse Landlord for all legal and attorney fees incurred by Landlord, regardless of which party prevails.

SECTION 8. DISPUTE RESOLUTION AND JURY WAIVER
Tenant hereby expressly waives any right to a trial by jury in any action or proceeding brought by either party. All disputes shall be resolved by confidential binding arbitration administered by an arbitrator chosen exclusively by Landlord, with all arbitral fees paid upfront by Tenant.`,
    comparisonBaselineName: 'Standard Fair Tenant Model Lease (Balanced)',
    comparisonBaselineText: `STANDARD FAIR RESIDENTIAL LEASE AGREEMENT (TENANT FRIENDLY)

SECTION 1. PARTIES AND PREMISES
This Lease is entered into between Landlord and Tenant for the Premises.

SECTION 2. TERM AND RENEWAL
The initial term shall run for 12 months. Upon expiration, the Lease shall convert automatically to a month-to-month tenancy unless either party provides thirty (30) days advance written notice. Rent increases shall be capped at prevailing CPI inflation.

SECTION 3. RENT AND GRACE PERIOD
Rent is due on the 1st of the month, with a mandatory 5-day grace period. Late fees are capped at $50 or 5%, whichever is lower. No acceleration of future rent is permitted without formal judicial eviction proceedings.

SECTION 4. SECURITY DEPOSIT
Deposit equals one (1) month rent, held in an interest-bearing escrow account. No non-refundable fees. Full deposit minus itemized actual damages must be returned within twenty-one (21) days of move-out with repair receipts.

SECTION 5. LANDLORD ENTRY
Landlord may enter only during reasonable business hours and MUST provide at least twenty-four (24) hours advance written notice, except in cases of immediate active emergency (such as fire or flooding).

SECTION 6. REPAIRS AND HABITABILITY
Landlord maintains the duty of habitability and shall repair all plumbing, heating, electrical, and structural systems within 48 to 72 hours of written notification at Landlord's sole expense.

SECTION 7. MUTUAL INDEMNITY & PREVAILING PARTY LEGAL FEES
Each party indemnifies the other solely for direct gross negligence. In any legal action arising from this agreement, the prevailing party shall be entitled to recover reasonable attorney fees from the non-prevailing party.

SECTION 8. DISPUTE RESOLUTION
Parties retain all constitutional rights to bring claims in local housing or small claims court.`
  },
  {
    id: 'freelance-msa',
    title: 'Freelance Independent Contractor Agreement (MSA)',
    type: 'freelance_msa',
    description: 'A Master Services Agreement for software engineers and designers with aggressive IP grab, net-90 pay-when-paid, and non-compete covenants.',
    defaultPersona: 'freelancer',
    counterpartName: 'OmniCorp Technologies Inc.',
    suggestedQuestions: [
      'Do I own my pre-existing code and portfolio designs?',
      'Can I work for other clients in the same industry?',
      'When do I actually get paid for completed milestones?',
      'Am I personally liable if the client gets sued by a third party?'
    ],
    suggestedScenarios: [
      'What if OmniCorp delays paying my invoice for 90 days?',
      'What if I want to launch an open-source tool on weekends?',
      'What if the client demands unlimited revisions outside the SOW?'
    ],
    text: `INDEPENDENT CONTRACTOR MASTER SERVICES AGREEMENT

This Agreement is entered into between OmniCorp Technologies Inc. ("Client") and Jane Smith ("Contractor").

SECTION 1. SERVICES AND DELIVERABLES
Contractor agrees to perform design, engineering, and consulting services as outlined in Statement of Work (SOW). Contractor shall devote undivided attention to Client requirements and achieve milestones to Client's subjective satisfaction.

SECTION 2. PAYMENT TERMS AND PAY-WHEN-PAID
Client shall pay Contractor agreed hourly or project milestone fees within ninety (90) days ("Net 90") following Client's written approval of Deliverables. Client's obligation to remit payment is expressly contingent upon Client receiving payment from its ultimate end-client ("Pay-When-Paid"). Contractor shall have no right to invoice late interest or suspend work during payment delays.

SECTION 3. INTELLECTUAL PROPERTY SURRENDER & PRE-EXISTING WORKS
Contractor agrees that all Deliverables, code, inventions, discoveries, designs, documentation, and work product conceived, created, or developed by Contractor during the term of this Agreement—whether on Client equipment or personal devices, and whether during or outside business hours—shall be the sole and exclusive property of Client worldwide in perpetuity. Contractor hereby assigns all rights, title, copyright, and patent interests. Contractor warrants that it waives all moral rights and will not display any work in Contractor's public portfolio without prior written consent.

SECTION 4. UNLIMITED INDEMNIFICATION
Contractor shall defend, indemnify, and hold harmless Client, its officers, directors, clients, and affiliates from and against any and all claims, damages, liabilities, losses, and legal costs (including full attorney fees) arising from any alleged breach of warranty, third-party intellectual property infringement, or performance defect, without any financial cap or limitation of liability.

SECTION 5. NON-COMPETE AND RESTRICTIVE COVENANTS
During the term of this Agreement and for a period of twenty-four (24) months following termination for any reason, Contractor shall not directly or indirectly provide consulting, engineering, or advisory services to any business or entity operating in the same industry as Client within the United States or globally.

SECTION 6. TERMINATION
Client may terminate this Agreement at any time for convenience upon twenty-four (24) hours email notice without paying any cancellation penalty. Contractor may only terminate upon sixty (60) days advance written notice for material breach following a thirty (30) day cure period.`,
    comparisonBaselineName: 'Standard Freelancer Union Fair MSA',
    comparisonBaselineText: `FAIR INDEPENDENT CONTRACTOR MASTER SERVICES AGREEMENT

SECTION 1. SERVICES & MILESTONES
Contractor performs agreed scope. Revisions exceeding agreed scope shall be billed at standard hourly rate.

SECTION 2. PAYMENT TERMS
Invoices are payable within Net 30 days. No pay-when-paid conditions permitted. Late payments accrue 1.5% interest per month. Contractor may suspend services if payment is overdue by 15 days.

SECTION 3. INTELLECTUAL PROPERTY & PORTFOLIO
IP in specific final Deliverables transfers to Client ONLY upon receipt of full payment. Contractor retains ownership of pre-existing background code, frameworks, and reusable libraries, granting Client a non-exclusive license. Contractor retains right to showcase work in personal portfolio.

SECTION 4. MUTUAL LIMITATION OF LIABILITY
Each party's total cumulative liability under this Agreement shall be capped at the total amount of fees paid to Contractor in the preceding six (6) months. Neither party is liable for indirect or consequential damages.

SECTION 5. FREEDOM OF WORK (NO NON-COMPETE)
Contractor is an independent business and retains the right to perform services for any other clients or competitors, provided Client's confidential information is not disclosed.

SECTION 6. MUTUAL TERMINATION
Either party may terminate for convenience upon fourteen (14) days written notice, with Client paying Contractor for all work completed up to the date of termination.`
  },
  {
    id: 'saas-tos',
    title: 'CloudSync Enterprise SaaS Terms of Service & Privacy Policy',
    type: 'terms_of_service',
    description: 'Commercial Terms of Service featuring unilateral modification, AI training rights on customer data, and mandatory class action waivers.',
    defaultPersona: 'consumer',
    counterpartName: 'CloudSync Global Corp',
    suggestedQuestions: [
      'Can CloudSync use my uploaded data to train artificial intelligence models?',
      'Can they change prices or features without asking me?',
      'If CloudSync loses my files or suffers a breach, do they pay damages?',
      'Can I join a class-action lawsuit if millions of users are affected?'
    ],
    suggestedScenarios: [
      'What if my subscription renews before I can cancel?',
      'What if they delete my account with 10 years of business data?'
    ],
    text: `CLOUDSYNC SERVICE TERMS & PRIVACY POLICY

SECTION 1. ACCEPTANCE AND UNILATERAL MODIFICATION
By accessing CloudSync services, you agree to these Terms. CloudSync reserves the right, in its sole and unfettered discretion, to modify, replace, or update these terms and fee schedules at any time without advance individual notice. Continued use following posted changes constitutes full acceptance.

SECTION 2. USER CONTENT LICENSE & AI MODEL TRAINING
You retain ownership of files uploaded. However, by uploading content, you grant CloudSync a perpetual, worldwide, irrevocable, royalty-free license to use, host, analyze, reproduce, and create derivative works from your content, including utilizing your documents and telemetry for training machine learning and artificial intelligence models.

SECTION 3. DISCLAIMER OF ALL WARRANTIES AND TOTAL LIABILITY CAP
THE SERVICES ARE PROVIDED ENTIRELY "AS IS" AND "AS AVAILABLE". TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLOUDSYNC DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED. UNDER NO CIRCUMSTANCES SHALL CLOUDSYNC'S AGGREGATE LIABILITY EXCEED THE GREATER OF FIFTY DOLLARS ($50.00) OR THE AMOUNT YOU PAID IN THE PREVIOUS ONE MONTH.

SECTION 4. MANDATORY ARBITRATION AND CLASS ACTION WAIVER
YOU AGREE THAT ALL DISPUTES SHALL BE RESOLVED EXCLUSIVELY VIA BINDING INDIVIDUAL ARBITRATION IN WILMINGTON, DELAWARE. YOU EXPLICITLY WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT, PRIVATE ATTORNEY GENERAL ACTION, OR REPRESENTATIVE PROCEEDING AGAINST CLOUDSYNC.`
  },
  {
    id: 'employment-noncompete',
    title: 'Executive Employment Offer & Restrictive Covenants',
    type: 'employment',
    description: 'An employment agreement containing clawback provisions, 2-year non-solicitation, and $50k liquidated damages for early departure.',
    defaultPersona: 'business',
    counterpartName: 'Stratos Dynamics Group',
    suggestedQuestions: [
      'Can the company take back my bonus if I leave?',
      'What happens if I quit before working for two years?',
      'Can I hire former colleagues at my next company?'
    ],
    suggestedScenarios: [
      'What if I receive a 50% higher offer from another firm after 9 months?',
      'What if I am terminated without cause?'
    ],
    text: `EXECUTIVE EMPLOYMENT AGREEMENT & RESTRICTIVE COVENANTS

SECTION 1. AT-WILL APPOINTMENT AND COMPENSATION
Company employs Executive at-will at an annual base salary of $135,000, payable bi-weekly. An annual discretionary incentive bonus may be awarded subject to company EBITDA targets.

SECTION 2. BONUS CLAWBACK AND LIQUIDATED DAMAGES
If Executive voluntarily resigns within twenty-four (24) months of employment, Executive must immediately repay one hundred percent (100%) of any signing bonus, relocation reimbursement, and bonus distributions received. Furthermore, Executive agrees that early departure creates substantial disruption and agrees to pay $50,000.00 as agreed liquidated damages.

SECTION 3. NON-SOLICITATION AND NON-DISPARAGEMENT
For twenty-four (24) months following separation, Executive shall not solicit, recruit, or hire any employee or contractor of Company. Executive shall never make any critical, adverse, or disparaging comment regarding Company, its founders, products, or management in any forum or social media.`
  }
];
