class SpeechService {
  private apiKey = 'AIzaSyDvJ23IolKwjdxAnTv7l8DwLuwGRZ_tIR8';
  private audio: HTMLAudioElement | null = null;

  async speak(
    text: string,
    onStart: () => void,
    onEnd: () => void
  ): Promise<void> {
    // Parar qualquer áudio anterior
    this.stop();

    // Dispara callback de início
    onStart();

    try {
      const body = {
        input: { text },
        voice: {
          languageCode: 'pt-BR',
          name: 'pt-BR-Wavenet-E',       // Wavenet‑E em pt‑BR
          ssmlGender: 'NEUTRAL'
        },
        audioConfig: {
          audioEncoding: 'MP3',          // ou 'LINEAR16' se preferir WAV
          speakingRate: 1.0,
          pitch: 0.0
        }
      };

      const res = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
      );

      if (!res.ok) {
        throw new Error(`TTS API error: ${res.statusText}`);
      }

      const json = await res.json() as { audioContent: string };
      const audioData = atob(json.audioContent);
      const buffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }

      const blob = new Blob([view], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      this.audio = new Audio(url);

      this.audio.onended = () => {
        onEnd();
        URL.revokeObjectURL(url);
      };
      this.audio.onerror = (e) => {
        console.error('Erro na reprodução:', e);
        onEnd();
        URL.revokeObjectURL(url);
      };

      this.audio.play();
    } catch (err) {
      console.error('Erro ao chamar a API TTS:', err);
      onEnd();
    }
  }

  pause(): void {
    this.audio?.pause();
  }

  resume(): void {
    this.audio?.play();
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
  }
}

export const speechService = new SpeechService();
export default speechService;
