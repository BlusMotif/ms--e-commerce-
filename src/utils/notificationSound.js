// Notification Sound Utility
// Generates a pleasant notification sound using Web Audio API

class NotificationSound {
  constructor() {
    this.audioContext = null;
    this.isEnabled = true;
    this.loopInterval = null;
    this.isLooping = false;
    this.isUnlocked = false; // Track if audio is unlocked on mobile
    this.initializeAudioUnlock();
  }

  // Initialize audio unlock for mobile devices
  initializeAudioUnlock() {
    // Add event listeners for user interactions to unlock audio
    const unlockAudio = () => {
      if (this.isUnlocked) return;
      
      const context = this.initAudioContext();
      if (!context) return;

      // Resume audio context if suspended (common on mobile)
      if (context.state === 'suspended') {
        context.resume().then(() => {
          console.log('Audio context resumed');
          this.isUnlocked = true;
          // Play a silent sound to unlock audio on iOS
          this.playSilent();
        }).catch(err => {
          console.error('Failed to resume audio context:', err);
        });
      } else {
        this.isUnlocked = true;
        // Play a silent sound to unlock audio on iOS
        this.playSilent();
      }
    };

    // Listen for various user interaction events
    const events = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
    events.forEach(event => {
      document.addEventListener(event, unlockAudio, { once: true, passive: true });
    });
  }

  // Play silent sound to unlock audio on iOS
  playSilent() {
    const context = this.audioContext;
    if (!context) return;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    gainNode.gain.setValueAtTime(0.0001, context.currentTime); // Nearly silent
    oscillator.frequency.setValueAtTime(440, context.currentTime);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.01);
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

  // Resume audio context if suspended (important for mobile)
  async ensureAudioContext() {
    const context = this.initAudioContext();
    if (!context) return null;

    if (context.state === 'suspended') {
      try {
        await context.resume();
      } catch (err) {
        console.error('Failed to resume audio context:', err);
      }
    }
    return context;
  }

  // Play a pleasant notification sound (two-tone chime)
  async playNotification() {
    if (!this.isEnabled) return;

    const context = await this.ensureAudioContext();
    if (!context || context.state !== 'running') {
      console.warn('Audio context not ready. User interaction may be required.');
      return;
    }

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
  async playAlert() {
    if (!this.isEnabled) return;

    const context = await this.ensureAudioContext();
    if (!context || context.state !== 'running') {
      console.warn('Audio context not ready. User interaction may be required.');
      return;
    }

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
  async playOrderNotification() {
    if (!this.isEnabled) return;

    const context = await this.ensureAudioContext();
    if (!context || context.state !== 'running') {
      console.warn('Audio context not ready. User interaction may be required.');
      return;
    }

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

  // Vibrate device (mobile support)
  vibrate(pattern = [200, 100, 200]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
        return true;
      } catch (err) {
        console.error('Vibration failed:', err);
        return false;
      }
    }
    return false;
  }

  // Show browser notification (requires permission)
  async showNotification(title, options = {}) {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return false;
    }

    // Request permission if not granted
    if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('Notification permission denied');
          return false;
        }
      } catch (err) {
        console.error('Failed to request notification permission:', err);
        return false;
      }
    }

    // Show notification if permission granted
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          vibrate: [200, 100, 200],
          requireInteraction: true, // Keep notification until user interacts
          tag: 'order-notification', // Prevent duplicate notifications
          renotify: true, // Alert again even if notification exists
          ...options
        });

        // Play sound when notification is shown
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return true;
      } catch (err) {
        console.error('Failed to show notification:', err);
        return false;
      }
    }

    return false;
  }

  // Start looping the order notification sound until stopped
  async startLoop() {
    if (this.isLooping) return; // Already looping
    
    this.isLooping = true;
    
    // Try to play sound
    await this.playOrderNotification();
    
    // Vibrate on mobile
    this.vibrate([200, 100, 200, 100, 200]);
    
    // Show browser notification
    await this.showNotification('New Order Received!', {
      body: 'You have a new order. Tap to view details.',
      icon: '/favicon.svg',
      tag: 'new-order'
    });
    
    // Play again every 5 seconds
    this.loopInterval = setInterval(async () => {
      if (this.isLooping) {
        // Check if page is visible
        if (!document.hidden) {
          // Page is visible - play sound
          await this.playOrderNotification();
        } else {
          // Page is hidden - use vibration and notification
          this.vibrate([200, 100, 200]);
          await this.showNotification('Order Notification', {
            body: 'You still have pending orders to review.',
            tag: 'order-reminder',
            requireInteraction: false
          });
        }
      }
    }, 5000);
  }

  // Stop the looping sound
  stopLoop() {
    this.isLooping = false;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    
    // Stop vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      return 'denied';
    }
  }

  // Check if notifications are available
  notificationsAvailable() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  // Check if vibration is available
  vibrationAvailable() {
    return 'vibrate' in navigator;
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
