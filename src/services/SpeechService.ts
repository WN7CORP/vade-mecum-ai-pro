
class SpeechService {
  private speechSynthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isReading: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.loadVoices();
    
    // Listener para quando as vozes estiverem disponíveis (Chrome)
    if (this.speechSynthesis.onvoiceschanged !== undefined) {
      this.speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
    }
  }

  private loadVoices(): void {
    // Carrega todas as vozes disponíveis
    this.voices = this.speechSynthesis.getVoices();
    
    // Tenta selecionar uma voz em português
    let portugueseVoice = this.voices.find(voice => 
      voice.lang.includes('pt') || voice.lang.includes('PT'));
    
    // Se não encontrar em português, usa a voz padrão
    this.selectedVoice = portugueseVoice || (this.voices.length > 0 ? this.voices[0] : null);
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public setVoice(voice: SpeechSynthesisVoice): void {
    this.selectedVoice = voice;
  }

  public speak(text: string, onStart?: () => void, onEnd?: () => void): void {
    // Cancela qualquer narração em andamento
    this.stop();
    
    // Prepara o texto para narração
    const cleanText = this.prepareTextForSpeech(text);
    
    // Cria uma nova narração
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Configura a voz
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    
    // Configura a velocidade e tom
    utterance.rate = 1.0;  // normal
    utterance.pitch = 1.0; // normal
    
    // Configura eventos
    utterance.onstart = () => {
      this.isReading = true;
      if (onStart) onStart();
    };
    
    utterance.onend = () => {
      this.isReading = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };
    
    utterance.onerror = (event) => {
      console.error('Erro na narração:', event);
      this.isReading = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };
    
    // Inicia a narração
    this.currentUtterance = utterance;
    this.speechSynthesis.speak(utterance);
  }

  public stop(): void {
    if (this.isReading) {
      this.speechSynthesis.cancel();
      this.isReading = false;
      this.currentUtterance = null;
    }
  }

  public pause(): void {
    if (this.isReading) {
      this.speechSynthesis.pause();
    }
  }

  public resume(): void {
    if (this.speechSynthesis.paused) {
      this.speechSynthesis.resume();
    }
  }

  public isPlaying(): boolean {
    return this.isReading;
  }

  public isPaused(): boolean {
    return this.speechSynthesis.paused;
  }

  private prepareTextForSpeech(text: string): string {
    // Remove emojis
    text = text.replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|\u{1F900}-\u{1F9FF}|\u{1F1E0}-\u{1F1FF}|\u{1F200}-\u{1F2FF}|\u{1F700}-\u{1F77F}|\u{1F780}-\u{1F7FF}|\u{1F800}-\u{1F8FF}|\u{1F900}-\u{1F9FF}|\u{1FA00}-\u{1FA6F}|\u{1FA70}-\u{1FAFF}]/gu, '');
    
    // Substitui números romanos para melhor pronúncia
    const romanNumerals: Record<string, string> = {
      'I': 'primeiro',
      'II': 'segundo',
      'III': 'terceiro',
      'IV': 'quarto',
      'V': 'quinto',
      'VI': 'sexto',
      'VII': 'sétimo',
      'VIII': 'oitavo',
      'IX': 'nono',
      'X': 'décimo',
      'XI': 'décimo primeiro',
      'XII': 'décimo segundo',
      'XIII': 'décimo terceiro',
      'XIV': 'décimo quarto',
      'XV': 'décimo quinto',
      'XX': 'vigésimo',
      'XXX': 'trigésimo',
      'XL': 'quadragésimo',
      'L': 'quinquagésimo',
      'LX': 'sexagésimo',
      'LXX': 'septuagésimo',
      'LXXX': 'octogésimo',
      'XC': 'nonagésimo',
      'C': 'centésimo'
    };
    
    // Substitui números romanos por sua forma escrita
    for (const [roman, written] of Object.entries(romanNumerals)) {
      // Substituição só de palavras inteiras para evitar substituir partes de palavras
      const regex = new RegExp(`\\b${roman}\\b`, 'g');
      text = text.replace(regex, written);
    }
    
    // Substitui abreviações comuns
    const abbreviations: Record<string, string> = {
      'Arts.': 'Artigos',
      'art.': 'artigo',
      'inc.': 'inciso',
      'parágrafo único': 'parágrafo único',
      'n.º': 'número',
      'nº': 'número',
      'p/': 'para',
      'c/c': 'combinado com',
      'CF': 'Constituição Federal',
      'cf.': 'conforme',
      'CP': 'Código Penal',
      'CPC': 'Código de Processo Civil',
      'CPP': 'Código de Processo Penal',
      'STF': 'Supremo Tribunal Federal',
      'STJ': 'Superior Tribunal de Justiça'
    };
    
    // Substitui abreviações pela forma completa
    for (const [abbr, full] of Object.entries(abbreviations)) {
      // Substituição só de palavras inteiras para evitar substituir partes de palavras
      const regex = new RegExp(`\\b${abbr}\\b`, 'g');
      text = text.replace(regex, full);
    }
    
    return text;
  }
}

export const speechService = new SpeechService();
export default speechService;
