export class RingtoneManager {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private fallbackAudio: HTMLAudioElement | null = null;

  async initialize() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    
    // Create fallback HTML audio element
    if (!this.fallbackAudio) {
      this.fallbackAudio = new Audio();
      this.fallbackAudio.loop = true;
      this.fallbackAudio.preload = 'auto';
      // Create a simple beep data URL as fallback
      this.fallbackAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmHMeSkFJHnI8N2QQAoUXrPo66hWFAlFnt9zr2ENEzuR2O/JeToFA2K66ePJRzkDaJzc8e8+IAhPo+3PfzsFAl+16N/HQjcCYJnX7e82HwdKmsPoA3Q7Bgl2tO/AYTYGAHm679c8IQZLn9HofUICBYCy8tGDQgsGP4rW4D9MrEEJaKzA47Y5FgthvuPwyEo6AmOq6eOrJBAARrHox1MNBxxbpNzxwywFCDuB0eHKXhYLQYXL3TdPCgxbm9rczh4QCzuVt8Bgr3AKbKLg6xVgHQFgrNrp1BgWCxU/wt2VL2AUfmrN9s+KLlQZUUBK3bJWnQ0VhJXSyP7E=';
    }
  }

  async startRingtone() {
    if (this.isPlaying) return;

    console.log('🔔 Starting ringtone...');
    this.isPlaying = true;

    try {
      // Try Web Audio API first
      await this.startWebAudioRingtone();
    } catch (error) {
      console.warn('⚠️ Web Audio API failed, using fallback:', error);
      try {
        // Fallback to HTML5 Audio
        await this.startFallbackAudio();
      } catch (fallbackError) {
        console.error('❌ Both audio methods failed:', fallbackError);
      }
    }
  }

  private async startWebAudioRingtone() {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('📱 Resumed AudioContext');
    }

    // Double check the state
    if (this.audioContext.state !== 'running') {
      throw new Error('AudioContext not running after resume attempt');
    }

    this.playRingtone();
  }

  private async startFallbackAudio() {
    if (!this.fallbackAudio) {
      throw new Error('Fallback audio not initialized');
    }

    try {
      await this.fallbackAudio.play();
      console.log('📢 Playing fallback audio');
    } catch (error) {
      throw new Error('Fallback audio play failed: ' + error);
    }
  }

  stopRingtone() {
    if (!this.isPlaying) return;

    console.log('🔕 Stopping ringtone...');
    this.isPlaying = false;
    
    // Stop Web Audio API components
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (error) {
        console.warn('Warning stopping oscillator:', error);
      }
      this.oscillator = null;
    }
    
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (error) {
        console.warn('Warning disconnecting gain node:', error);
      }
      this.gainNode = null;
    }

    // Stop fallback audio
    if (this.fallbackAudio) {
      this.fallbackAudio.pause();
      this.fallbackAudio.currentTime = 0;
    }
  }

  private playRingtone() {
    if (!this.audioContext || !this.isPlaying) return;

    // Create a more realistic dual-tone ringtone
    this.createDualToneRing();
  }

  private createDualToneRing() {
    if (!this.audioContext || !this.isPlaying) return;

    // Create two oscillators for dual-tone effect
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();

    // Connect nodes
    osc1.connect(this.gainNode);
    osc2.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    // Set frequencies for realistic phone ring (440Hz and 480Hz)
    osc1.frequency.setValueAtTime(440, this.audioContext.currentTime);
    osc2.frequency.setValueAtTime(480, this.audioContext.currentTime);

    // Create tremolo effect by modulating volume
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.1);
    this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.4);
    this.gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.5);
    this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.8);

    // Set waveform to sine for smoother sound
    osc1.type = 'sine';
    osc2.type = 'sine';

    // Start oscillators
    osc1.start();
    osc2.start();

    // Stop after ring duration
    const ringDuration = 1.0;
    osc1.stop(this.audioContext.currentTime + ringDuration);
    osc2.stop(this.audioContext.currentTime + ringDuration);

    // Store reference for cleanup
    this.oscillator = osc1; // Store primary oscillator for cleanup

    // Schedule next ring with pause
    osc1.onended = () => {
      if (this.isPlaying) {
        setTimeout(() => this.playRingtone(), 1000); // 1 second pause between rings
      }
    };
  }

  cleanup() {
    this.stopRingtone();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.fallbackAudio) {
      this.fallbackAudio.pause();
      this.fallbackAudio = null;
    }
  }
}

// Global instance
export const ringtoneManager = new RingtoneManager();