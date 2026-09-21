// Web Audio 8-bit retro synthetic sound effects
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playPixelBlip(pitch = 440) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Ignore audio autoplay restrictions safely
  }
}

export function playPixelSuccess() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [440, 554, 659, 880];
    notes.forEach((note, i) => {
      setTimeout(() => {
        playPixelBlip(note);
      }, i * 60);
    });
  } catch {
    // Ignore safely
  }
}

export function playPixelMintFanfare() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const delays = [0, 80, 160, 260, 420, 560];
    delays.forEach((delay, i) => {
      setTimeout(() => {
        playPixelBlip(fanfare[i]);
      }, delay);
    });
  } catch {
    // Ignore safely
  }
}

export function playPixelError() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    playPixelBlip(220);
    setTimeout(() => playPixelBlip(160), 90);
  } catch {
    // Ignore safely
  }
}
