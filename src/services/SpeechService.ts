class SpeechService {
  utterance: SpeechSynthesisUtterance | null = null;
  apiKey: string = 'AIzaSyDvJ23IolKwjdxAnTv7l8DwLuwGRZ_tIR8';
  
  speak(text: string, onStart: () => void, onEnd: () => void): void {
    this.stop();
    
    this.utterance = new SpeechSynthesisUtterance(text);
    
    // Configure for Wavenet-E voice
    const voices = window.speechSynthesis.getVoices();
    const wavenetVoice = voices.find(voice => voice.name.includes('Wavenet-E'));
    
    if (wavenetVoice) {
      this.utterance.voice = wavenetVoice;
    }
    
    this.utterance.rate = 1.0;
    this.utterance.pitch = 1.0;
    this.utterance.lang = 'pt-BR';
    
    this.utterance.onstart = onStart;
    this.utterance.onend = onEnd;
    this.utterance.onerror = () => {
      console.error('Erro na narração');
      onEnd();
    };
    
    window.speechSynthesis.speak(this.utterance);
  }
  
  pause(): void {
    window.speechSynthesis.pause();
  }
  
  resume(): void {
    window.speechSynthesis.resume();
  }
  
  stop(): void {
    window.speechSynthesis.cancel();
    this.utterance = null;
  }

  loadVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      let voices = window.speechSynthesis.getVoices();
      
      if (voices.length > 0) {
        return resolve(voices);
      }
      
      // Se as vozes não estiverem disponíveis imediatamente, aguardar o evento
      const voicesChangedHandler = () => {
        voices = window.speechSynthesis.getVoices();
        resolve(voices);
        window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
      };
      
      window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);
    });
  }
}

export const speechService = new SpeechService();
export default speechService;
