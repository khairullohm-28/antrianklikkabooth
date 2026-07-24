/**
 * Audio synthesis helper for queue announcements & chimes.
 * Uses Web Audio API for chime bells and Web Speech API for Indonesian voice call.
 */

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

export function announceQueueVoice(ticketNumber: string, boothName: string) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !window.speechSynthesis) {
      return;
    }

    // Play initial chime
    playChimeSound();

    // Format text for speech e.g. "Nomor antrian V I N 0 0 1, silakan menuju Vintage Booth"
    const formattedTicket = ticketNumber
      .split('')
      .map((char) => (isNaN(Number(char)) ? char : ` ${char}`))
      .join('');

    const speechText = `Nomor antrian ${formattedTicket}, silakan menuju ${boothName}.`;

    setTimeout(() => {
      try {
        if (!('speechSynthesis' in window) || !window.speechSynthesis) return;

        window.speechSynthesis.cancel(); // Stop prior speech

        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = 'id-ID';
        utterance.rate = 0.9; // slightly slower for clear broadcast
        utterance.pitch = 1.0;

        utterance.onerror = (e) => {
          console.warn('Speech synthesis utterance warning:', e);
        };

        // Find Indonesian voice if available
        try {
          const voices = window.speechSynthesis.getVoices();
          if (Array.isArray(voices) && voices.length > 0) {
            const idVoice = voices.find((v) => v.lang && (v.lang.startsWith('id') || v.lang.includes('ID')));
            if (idVoice) {
              utterance.voice = idVoice;
            }
          }
        } catch {
          // ignore voice selection failure
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis inner error:', err);
      }
    }, 400);
  } catch (err) {
    console.warn('announceQueueVoice error:', err);
  }
}

