/**
 * Audio synthesis helper for queue announcements & chimes.
 * Uses Web Audio API for chime bells and Web Speech API for Indonesian voice call.
 */

// Global reference to prevent garbage collection of SpeechSynthesisUtterance while speaking
let activeUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

// Deduplication cache to prevent rapid double-announcements from multi-channel events (Firebase/BroadcastChannel/Local)
let lastAnnouncedKey = '';
let lastAnnouncedTime = 0;

// Initialize & cache voices when available
if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
  try {
    cachedVoices = window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      try {
        cachedVoices = window.speechSynthesis.getVoices();
      } catch {
        // ignore
      }
    };
  } catch {
    // ignore
  }
}

export function playChimeSound() {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // First tone (G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.8);

    // Second tone (E5) after 0.25s
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.25); // E5
    gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.25);
    osc2.stop(ctx.currentTime + 1.2);
  } catch (err) {
    console.warn('Audio chime playback warning:', err);
  }
}

export function playDoubleChimeSound() {
  playChimeSound();
  setTimeout(() => {
    playChimeSound();
  }, 500);
}

/**
 * Announces ticket number and booth name in Indonesian speech.
 * Sequence: Play chime first -> wait for chime tone decay -> speak Indonesian speech synthesis.
 * Uses deduplication to prevent rapid duplicate calls from interrupting ongoing speech.
 */
export function announceQueueVoice(ticketNumber: string, boothName: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const cleanTicket = ticketNumber.trim().toUpperCase();
      const cleanBooth = boothName.trim();
      const announceKey = `${cleanTicket}_${cleanBooth}`;
      const now = Date.now();

      // Deduplication: Ignore identical announcement triggered within 3.5 seconds
      if (announceKey === lastAnnouncedKey && now - lastAnnouncedTime < 3500) {
        resolve();
        return;
      }

      lastAnnouncedKey = announceKey;
      lastAnnouncedTime = now;

      // 1. Play initial chime sound
      playChimeSound();

      if (!('speechSynthesis' in window) || !window.speechSynthesis) {
        resolve();
        return;
      }

      // Ensure speech synthesis is active and unpaused
      if (window.speechSynthesis.paused) {
        try {
          window.speechSynthesis.resume();
        } catch {
          // ignore
        }
      }

      // Format ticket code e.g. "VIN001" -> "V I N, 0 0 1"
      const formattedTicket = cleanTicket
        .replace(/([A-Za-z]+)(\d+)/, '$1 $2')
        .split('')
        .map((char) => (isNaN(Number(char)) ? char : `${char} `))
        .join(' ');

      const speechText = `Nomor antrian ${formattedTicket}, silakan menuju ${cleanBooth}.`;

      // 2. Wait 650ms for chime bell to complete before starting voice
      setTimeout(() => {
        try {
          if (!('speechSynthesis' in window) || !window.speechSynthesis) {
            resolve();
            return;
          }

          // Safely resume if paused
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }

          // If speech synthesis is currently speaking an old message, cancel it before starting new
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          }

          // Create utterance and keep global reference to prevent GC from terminating speech mid-sentence
          activeUtterance = new SpeechSynthesisUtterance(speechText);
          activeUtterance.lang = 'id-ID';
          activeUtterance.rate = 0.88; // Clear natural Indonesian cadence
          activeUtterance.pitch = 1.0;

          activeUtterance.onend = () => {
            activeUtterance = null;
            resolve();
          };

          activeUtterance.onerror = (e) => {
            activeUtterance = null;
            if (e.error !== 'canceled' && e.error !== 'interrupted') {
              console.warn('Speech synthesis utterance info:', e.error || e);
            }
            resolve();
          };

          // Select Indonesian voice if available in cache or system
          try {
            const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
            if (Array.isArray(voices) && voices.length > 0) {
              const idVoice = voices.find((v) => v.lang && (v.lang.startsWith('id') || v.lang.includes('ID')));
              if (idVoice) {
                activeUtterance.voice = idVoice;
              }
            }
          } catch {
            // ignore voice selection failure
          }

          window.speechSynthesis.speak(activeUtterance);
        } catch (err) {
          console.warn('Speech synthesis inner error:', err);
          resolve();
        }
      }, 650);
    } catch (err) {
      console.warn('announceQueueVoice error:', err);
      resolve();
    }
  });
}



