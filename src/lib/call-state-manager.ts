// Singleton call state manager to prevent multiple useCall hook instances
interface CallState {
  activeCall: any | null;
  incomingCall: any | null;
  isProcessing: boolean;
}

class CallStateManager {
  private state: CallState = {
    activeCall: null,
    incomingCall: null,
    isProcessing: false
  };
  
  private listeners: Set<(state: CallState) => void> = new Set();

  getState(): CallState {
    return { ...this.state };
  }

  setState(updates: Partial<CallState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  subscribe(listener: (state: CallState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  // Prevent duplicate call initiations
  canInitiateCall(): boolean {
    return !this.state.isProcessing && !this.state.activeCall;
  }

  setProcessing(processing: boolean) {
    this.setState({ isProcessing: processing });
  }
}

export const callStateManager = new CallStateManager();