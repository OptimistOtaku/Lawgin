import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilitySettings, DocumentAnalysis, PersonaType } from './types/legal';
import { SAMPLE_CONTRACTS, SampleContract } from './data/sampleContracts';
import { GeminiService } from './services/geminiService';
import { HeuristicsEngine } from './services/heuristicsEngine';
import { PIIShieldService } from './services/piiRedactor';
import { TTSService } from './services/ttsService';

import { Header } from './components/Header';
import { ClassicalBackdrop } from './components/ClassicalBackdrop';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { ApiKeyModal } from './components/ApiKeyModal';
import { DocumentStudio } from './components/DocumentStudio/DocumentStudio';

import { FileText, Sparkles, ShieldAlert, GitCompare, MessageSquare, PlayCircle, CheckSquare, Briefcase } from 'lucide-react';

type TabId = 'studio' | 'simplifier' | 'risk' | 'comparator' | 'qa' | 'scenarios' | 'checklist' | 'lawyer';

// Feature modules are code-split so the initial bundle only ships the default tab.
const DocumentSimplifier = lazy(() =>
  import('./components/Simplifier/DocumentSimplifier').then(m => ({ default: m.DocumentSimplifier }))
);
const RiskRadar = lazy(() => import('./components/RiskRadar/RiskRadar').then(m => ({ default: m.RiskRadar })));
const ContractComparator = lazy(() =>
  import('./components/ContractComparator/ContractComparator').then(m => ({ default: m.ContractComparator }))
);
const GroundedQA = lazy(() => import('./components/GroundedQA/GroundedQA').then(m => ({ default: m.GroundedQA })));
const ScenarioSimulator = lazy(() =>
  import('./components/ScenarioSimulator/ScenarioSimulator').then(m => ({ default: m.ScenarioSimulator }))
);
const ActionChecklist = lazy(() =>
  import('./components/ActionChecklist/ActionChecklist').then(m => ({ default: m.ActionChecklist }))
);
const LawyerBrief = lazy(() =>
  import('./components/LawyerBrief/LawyerBrief').then(m => ({ default: m.LawyerBrief }))
);

const TabFallback: React.FC = () => (
  <div className="glass-panel p-10 flex flex-col items-center justify-center gap-3 text-slate-400" role="status" aria-live="polite">
    <Sparkles className="w-6 h-6 text-cyan-400 animate-spin" />
    <span className="text-xs font-mono">Loading module…</span>
  </div>
);

const NAV_TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: 'studio', label: '1. Document Studio', icon: FileText },
  { id: 'simplifier', label: '2. Plain English', icon: Sparkles },
  { id: 'risk', label: '3. Risk Radar', icon: ShieldAlert },
  { id: 'comparator', label: '4. Contract Diff', icon: GitCompare },
  { id: 'qa', label: '5. Grounded Q&A', icon: MessageSquare },
  { id: 'scenarios', label: '6. What-If Simulator', icon: PlayCircle },
  { id: 'checklist', label: '7. Actions & Counter', icon: CheckSquare },
  { id: 'lawyer', label: '8. Attorney Dossier', icon: Briefcase }
];

export const App: React.FC = () => {
  // Application State
  const [currentContract, setCurrentContract] = useState<SampleContract>(SAMPLE_CONTRACTS[0]);
  const [customText, setCustomText] = useState('');
  const [documentTitle, setDocumentTitle] = useState(SAMPLE_CONTRACTS[0].title);
  const [currentPersona, setCurrentPersona] = useState<PersonaType>(SAMPLE_CONTRACTS[0].defaultPersona);
  const [activeTab, setActiveTab] = useState<TabId>('studio');

  // Accessibility State
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    fontSize: 'normal',
    dyslexiaFont: false,
    highContrast: false,
    ttsEnabled: true,
    speechRate: 1.0
  });
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Security / Privacy State
  const [showPIIMaskedView, setShowPIIMaskedView] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [activeModel, setActiveModel] = useState(GeminiService.getActiveModel());

  // Audio TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakingText, setActiveSpeakingText] = useState('');

  // Analysis State
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // The raw document currently in focus (custom upload wins over the benchmark).
  const activeRawText = useMemo(
    () => (customText.trim().length > 0 ? customText : currentContract.text),
    [customText, currentContract.text]
  );

  // Expensive regex sweep — memoized so it runs only when the document changes.
  const piiResult = useMemo(() => PIIShieldService.redact(activeRawText), [activeRawText]);

  const runAnalysis = useCallback(
    async (title: string, text: string, docType: DocumentAnalysis['documentType'], persona: PersonaType) => {
      setIsAnalyzing(true);
      try {
        const res = await GeminiService.analyzeDocument(title, text, docType, persona);
        setAnalysis(res);
      } catch (e) {
        console.warn('Analysis fallback:', e);
        setAnalysis(HeuristicsEngine.performFullAnalysis(title, text, docType));
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  // Subscribe to TTS changes
  useEffect(() => {
    const unsubscribe = TTSService.subscribe((speaking, text) => {
      setIsSpeaking(speaking);
      setActiveSpeakingText(text);
    });
    return () => unsubscribe();
  }, []);

  // Mirror theme + accessibility classes onto <html> so the whole document
  // (body background, scrollbars, rem type scale) responds to the controls.
  useEffect(() => {
    const cls = [
      isDarkMode ? 'theme-dark' : 'theme-light',
      accessibility.highContrast ? 'theme-high-contrast' : '',
      accessibility.dyslexiaFont ? 'font-dyslexic' : '',
      `text-scale-${accessibility.fontSize}`
    ].filter(Boolean);
    document.documentElement.className = cls.join(' ');
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode, accessibility]);

  // Analyze the selected benchmark whenever the contract or persona lens changes.
  useEffect(() => {
    runAnalysis(currentContract.title, currentContract.text, currentContract.type, currentPersona);
  }, [currentContract.id, currentPersona, runAnalysis, currentContract.title, currentContract.text, currentContract.type]);

  const handleSelectContract = (contract: SampleContract) => {
    setCurrentContract(contract);
    setDocumentTitle(contract.title);
    setCurrentPersona(contract.defaultPersona);
    setCustomText('');
  };

  const handleTriggerAnalysis = () => {
    const textToAnalyze = customText.trim().length > 0 ? customText : currentContract.text;
    const titleToAnalyze = documentTitle || 'Legal Agreement';
    runAnalysis(titleToAnalyze, textToAnalyze, currentContract.type, currentPersona);
  };

  const handleToggleTTS = (text: string) => {
    if (isSpeaking && activeSpeakingText === text) {
      TTSService.stop();
    } else {
      TTSService.speak(text, accessibility.speechRate);
    }
  };

  const handleJumpToClause = (clauseId: string) => {
    setActiveTab('simplifier');
    setTimeout(() => {
      const el = document.getElementById(clauseId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-cyan-400');
        setTimeout(() => el.classList.remove('ring-2', 'ring-cyan-400'), 3000);
      }
    }, 150);
  };

  const statusMessage = isAnalyzing
    ? 'Analyzing document…'
    : analysis
    ? `Analysis complete. Risk score ${analysis.overallRiskScore} out of 100.`
    : '';

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Animated classical backdrop (colonnade, torch-light, dust, meander friezes) */}
      <ClassicalBackdrop isDark={isDarkMode} />

      {/* Non-UPL Ethical Legal Notice Banner */}
      <DisclaimerBanner />

      {/* Screen-reader status for async analysis */}
      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>

      {/* Sticky chrome: header + navigation stay pinned together */}
      <div className="sticky top-0 z-40 no-print">
        <Header
          currentPersona={currentPersona}
          onSelectPersona={setCurrentPersona}
          accessibility={accessibility}
          onUpdateAccessibility={(s) => setAccessibility(prev => ({ ...prev, ...s }))}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          piiRedactedCount={piiResult.totalRedacted}
          showPIIMaskedView={showPIIMaskedView}
          onTogglePIIView={() => setShowPIIMaskedView(!showPIIMaskedView)}
          isSpeaking={isSpeaking}
          onStopTTS={() => TTSService.stop()}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          activeModel={activeModel}
        />

        <nav aria-label="Main Navigation" className="border-b border-cyan-900/40 bg-slate-950/80 backdrop-blur-xl z-30 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count =
                tab.id === 'simplifier'
                  ? analysis?.clauses.length
                  : tab.id === 'risk'
                  ? analysis?.predatoryTrapsCount
                  : null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {count !== null && count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        tab.id === 'risk' && count > 0 ? 'bg-rose-500/30 text-rose-300' : 'bg-slate-800 text-cyan-300'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content Viewport */}
      <main
        id="main-content"
        key={activeTab}
        className="animate-rise flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-16 relative"
      >
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'studio' && (
            <DocumentStudio
              currentContract={currentContract}
              onSelectContract={handleSelectContract}
              customText={customText}
              onChangeCustomText={setCustomText}
              documentTitle={documentTitle}
              onChangeDocumentTitle={setDocumentTitle}
              analysis={analysis}
              isAnalyzing={isAnalyzing}
              onTriggerAnalysis={handleTriggerAnalysis}
              currentPersona={currentPersona}
              showPIIMaskedView={showPIIMaskedView}
            />
          )}

          {activeTab === 'simplifier' && analysis && (
            <DocumentSimplifier
              analysis={analysis}
              currentPersona={currentPersona}
              isSpeaking={isSpeaking}
              onToggleTTS={handleToggleTTS}
              activeSpeakingText={activeSpeakingText}
            />
          )}

          {activeTab === 'risk' && analysis && <RiskRadar analysis={analysis} onSelectClause={handleJumpToClause} />}

          {activeTab === 'comparator' && <ContractComparator currentContract={currentContract} />}

          {activeTab === 'qa' && analysis && (
            <GroundedQA
              analysis={analysis}
              rawDocumentText={activeRawText}
              suggestedQuestions={currentContract.suggestedQuestions}
              currentPersona={currentPersona}
              onJumpToClause={handleJumpToClause}
              onToggleTTS={handleToggleTTS}
            />
          )}

          {activeTab === 'scenarios' && (
            <ScenarioSimulator currentContract={currentContract} clauses={analysis?.clauses || []} />
          )}

          {activeTab === 'checklist' && analysis && (
            <ActionChecklist analysis={analysis} counterpartName={currentContract.counterpartName} />
          )}

          {activeTab === 'lawyer' && analysis && (
            <LawyerBrief analysis={analysis} userRole={`Prospective Signatory (${currentPersona.toUpperCase()})`} />
          )}
        </Suspense>
      </main>

      {/* API Key & Model Configuration Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onConfigSaved={(m) => setActiveModel(m)}
      />
    </div>
  );
};

export default App;
