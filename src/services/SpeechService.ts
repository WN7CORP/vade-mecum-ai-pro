
class SpeechService {
  utterance: SpeechSynthesisUtterance | null = null;
  isMuted: boolean = false;
  
  // Função para converter o texto para fala
  speak(text: string, onStart: () => void, onEnd: () => void): void {
    if (this.isMuted) {
      onEnd(); // Se estiver mudo, apenas chama o callback de finalização
      return;
    }
    
    // Parar qualquer narração em andamento
    this.stop();
    
    // Criar nova utterance
    this.utterance = new SpeechSynthesisUtterance(text);
    
    // Configurar voz (Wavenet-E quando disponível)
    const voices = window.speechSynthesis.getVoices();
    const brVoice = voices.find(voice => 
      voice.name.includes('Wavenet-E') || 
      voice.lang === 'pt-BR' || 
      voice.lang === 'pt-PT' || 
      voice.lang.startsWith('pt')
    );
    
    if (brVoice) {
      this.utterance.voice = brVoice;
    }
    
    // Configurar outros parâmetros
    this.utterance.rate = 1.0;
    this.utterance.pitch = 1.0;
    this.utterance.lang = 'pt-BR';
    
    // Adicionar event listeners
    this.utterance.onstart = onStart;
    this.utterance.onend = onEnd;
    this.utterance.onerror = () => {
      console.error('Erro na narração');
      onEnd();
    };
    
    // Iniciar a narração
    window.speechSynthesis.speak(this.utterance);
  }
  
  // Pausar a narração
  pause(): void {
    window.speechSynthesis.pause();
  }
  
  // Retomar a narração
  resume(): void {
    window.speechSynthesis.resume();
  }
  
  // Parar a narração
  stop(): void {
    window.speechSynthesis.cancel();
    this.utterance = null;
  }

  // Alternar o modo mudo
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.utterance) {
      this.stop();
    }
    return this.isMuted;
  }

  // Verifica se está mudo
  isMutedStatus(): boolean {
    return this.isMuted;
  }

  // Carregar vozes disponíveis - útil para inicialização
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
