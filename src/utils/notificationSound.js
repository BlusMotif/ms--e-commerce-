// Notification Sound Utility
// Generates a pleasant notification sound using Web Audio API

class NotificationSound {
  constructor() {
    this.audioContext = null;
    this.isEnabled = true;
  }

  // Initialize audio context (must be done after user interaction)
  initAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.error('Web Audio API not supported', e);
      }
    }
    return this.audioContext;
  }

  // Play a pleasant notification sound (two-tone chime)
  playNotification() {
    if (!this.isEnabled) return;

    const context = this.initAudioContext();
    if (!context) return;

    const now = context.currentTime;

    // Create oscillator for first tone (higher pitch)
    const oscillator1 = context.createOscillator();
    const gainNode1 = context.createGain();
    
    oscillator1.connect(gainNode1);
    gainNode1.connect(context.destination);
    
    // First tone: E6 (1318.51 Hz)
    oscillator1.frequency.setValueAtTime(1318.51, now);
    oscillator1.type = 'sine';
    
    // Envelope for first tone (VERY HIGH VOLUME)
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.8, now + 0.01);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator1.start(now);
    oscillator1.stop(now + 0.3);

    // Create oscillator for second tone (lower pitch)
    const oscillator2 = context.createOscillator();
    const gainNode2 = context.createGain();
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(context.destination);
    
    // Second tone: C6 (1046.50 Hz)
    oscillator2.frequency.setValueAtTime(1046.50, now + 0.15);
    oscillator2.type = 'sine';
    
    // Envelope for second tone (VERY HIGH VOLUME)
    gainNode2.gain.setValueAtTime(0, now + 0.15);
    gainNode2.gain.linearRampToValueAtTime(0.8, now + 0.16);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    oscillator2.start(now + 0.15);
    oscillator2.stop(now + 0.5);
  }

  // Play alert sound for urgent notifications (three beeps)
  playAlert() {
    if (!this.isEnabled) return;

    const context = this.initAudioContext();
    if (!context) return;

    const now = context.currentTime;
    const beepFrequency = 880; // A5 note

    // Create three beeps
    for (let i = 0; i < 3; i++) {
      const startTime = now + (i * 0.25);
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.setValueAtTime(beepFrequency, startTime);
      oscillator.type = 'square';
      
      // VERY HIGH VOLUME for alert beeps
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.7, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    }
  }

  // Play order notification (pleasant ascending notes)
  playOrderNotification() {
    if (!this.isEnabled) return;

    const context = this.initAudioContext();
    if (!context) return;

    const now = context.currentTime;
    // C major chord progression
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

    frequencies.forEach((freq, index) => {
      const startTime = now + (index * 0.1);
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.setValueAtTime(freq, startTime);
      oscillator.type = 'sine';
      
      // VERY HIGH VOLUME for order notifications
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.8, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    });
  }

  // Enable/disable sounds
  setEnabled(enabled) {
    this.isEnabled = enabled;
    localStorage.setItem('notificationSoundsEnabled', enabled);
  }

  // Get enabled state
  getEnabled() {
    const stored = localStorage.getItem('notificationSoundsEnabled');
    return stored === null ? true : stored === 'true';
  }
}

// Create singleton instance
const notificationSound = new NotificationSound();

// Initialize enabled state from localStorage
notificationSound.isEnabled = notificationSound.getEnabled();

export default notificationSound;
