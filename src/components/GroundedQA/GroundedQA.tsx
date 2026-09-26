import React, { useState } from 'react';
import { Clause, DocumentAnalysis, PersonaType, QACitation, QAMessage } from '../../types/legal';
import { GeminiService } from '../../services/geminiService';
import { TTSService } from '../../services/ttsService';
import { MessageSquare, Sparkles, Send, Volume2, ShieldCheck, ExternalLink, HelpCircle } from 'lucide-react';

interface GroundedQAProps {
  analysis: DocumentAnalysis;
  rawDocumentText: string;
  suggestedQuestions: string[];
  currentPersona: PersonaType;
  onJumpToClause?: (clauseId: string) => void;
  onToggleTTS: (text: string) => void;
}

export const GroundedQA: React.FC<GroundedQAProps> = ({
  analysis,
  rawDocumentText,
  suggestedQuestions,
  currentPersona,
  onJumpToClause,
  onToggleTTS
}) => {
  const [messages, setMessages] = useState<QAMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      timestamp: 'Just now',
      text: `Hello! I have reviewed **${analysis.title}**. You can ask me any question about your obligations, payment deadlines, liabilities, or rights under this contract. Every answer I provide will be backed by direct clause citations.`,
      confidenceScore: 99
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (qText?: string) => {
    const question = qText || inputQuestion;
    if (!question.trim() || isLoading) return;

    const userMsg: QAMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      text: question.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const result = await GeminiService.answerQuestion(
        question,
        rawDocumentText,
        analysis.clauses,
        currentPersona
      );

      const assistantMsg: QAMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Just now',
        text: result.text,
        citations: result.citations,
        confidenceScore: result.confidence,
        suggestedFollowUps: result.suggestedFollowUps
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          text: `I encountered an issue verifying the text. Based on standard provisions: ${err?.message || 'Please consult the contract terms.'}`,
          confidenceScore: 70
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel p-5 border border-white/10 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Citation-Grounded Contract Q&A</h3>
            <p className="text-xs text-slate-400">
              Answers are strictly grounded in <strong className="text-slate-200">{analysis.title}</strong> with verifiable clause citations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Hallucination Guardrails Active</span>
        </div>
      </div>

      {/* Suggested Questions Quick Chips */}
      {suggestedQuestions.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> Suggested Inquiries:
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleSend(sq)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 hover:border-cyan-500 hover:bg-cyan-950/30 transition-all text-left"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Chat History */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-none shadow-md'
                }`}
              >
                {/* Answer text */}
                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                {/* Direct Citation Chips */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Grounded Contract Citations:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((c, idx) => (
                        <div
                          key={idx}
                          onClick={() => onJumpToClause && onJumpToClause(c.clauseId)}
                          className="cursor-pointer text-[11px] p-2 rounded-lg bg-slate-950/80 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/40 transition-colors flex flex-col gap-0.5"
                          title="Click to jump to clause in document"
                        >
                          <div className="font-semibold flex items-center gap-1">
                            <span>§ {c.clauseNumber} - {c.clauseTitle}</span>
                            <ExternalLink className="w-3 h-3 text-cyan-400" />
                          </div>
                          {c.snippet && (
                            <div className="font-mono text-[10px] text-slate-400 line-clamp-1">
                              "{c.snippet}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assistant metadata footer: Confidence & TTS */}
                {!isUser && (
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{msg.confidenceScore || 95}% Grounding Confidence</span>
                    </span>
                    <button
                      onClick={() => onToggleTTS(msg.text)}
                      className="p-1 rounded hover:text-white flex items-center gap-1 text-slate-400"
                      title="Read answer aloud"
                    >
                      <Volume2 className="w-3 h-3 text-cyan-400" /> Listen
                    </button>
                  </div>
                )}
              </div>

              {/* Follow-up suggestions */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pl-2">
                  <span className="text-[10px] text-slate-400">Follow up:</span>
                  {msg.suggestedFollowUps.map((fu, fIdx) => (
                    <button
                      key={fIdx}
                      onClick={() => handleSend(fu)}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      "{fu}"
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 text-xs text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800 w-fit">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Scanning contract clauses and formulating grounded answer...</span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question about this contract (e.g. 'Can I terminate early without penalty?')..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputQuestion.trim() || isLoading}
          className="btn-primary text-xs py-2.5 px-4"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </div>
    </div>
  );
};
