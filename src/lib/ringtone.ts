export class RingtoneManager {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;

  async initialize() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }

  async startRingtone() {
    if (this.isPlaying || !this.audioContext) return;

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isPlaying = true;
      this.playRingtone();
    } catch (error) {
      console.error('Error starting ringtone:', error);
    }
  }

  stopRingtone() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
    
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
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
  }
}

// Global instance
export const ringtoneManager = new RingtoneManager();