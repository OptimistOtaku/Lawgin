export class TTSService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static isSpeaking = false;
  private static listeners: Set<(speaking: boolean, text: string) => void> = new Set();

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static subscribe(callback: (speaking: boolean, text: string) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private static notify(speaking: boolean, text = ''): void {
    this.isSpeaking = speaking;
    this.listeners.forEach(fn => fn(speaking, text));
  }

  public static speak(text: string, rate = 1.0, pitch = 1.0): void {
    if (!this.isSupported() || !this.synth) return;

    this.stop();

    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.max(0.7, Math.min(1.4, rate));
    utterance.pitch = pitch;

    // Pick a natural English voice if available
    const voices = this.synth.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Siri') || v.name.includes('Samantha')));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      this.notify(true, text);
    };

    utterance.onend = () => {
      this.notify(false, '');
    };

    utterance.onerror = (e) => {
      console.warn('TTS Speech error:', e);
      this.notify(false, '');
    };

    this.synth.speak(utterance);
  }

  public static stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.notify(false, '');
    }
  }

  public static pause(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public static resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public static getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }
}
