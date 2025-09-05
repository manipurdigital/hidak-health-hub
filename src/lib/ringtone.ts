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

    // Create oscillator for ringtone
    this.oscillator = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();

    // Connect nodes
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    // Set ringtone frequency (classic phone ring)
    this.oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    this.oscillator.frequency.setValueAtTime(554, this.audioContext.currentTime + 0.1);

    // Set volume
    this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

    // Start and schedule stop
    this.oscillator.start();
    this.oscillator.stop(this.audioContext.currentTime + 0.8);

    // Schedule next ring
    this.oscillator.onended = () => {
      if (this.isPlaying) {
        setTimeout(() => this.playRingtone(), 200);
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