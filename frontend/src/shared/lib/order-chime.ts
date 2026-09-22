let ctx: AudioContext | null = null;

function audioContext() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

export function unlockOrderChime() {
  const audio = audioContext();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();
}

function tone(audio: AudioContext, frequency: number, start: number, duration: number) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

export function playOrderChime() {
  try {
    unlockOrderChime();
    const audio = audioContext();
    if (!audio || audio.state !== "running") return;
    const t = audio.currentTime;
    tone(audio, 880, t, 0.16);
    tone(audio, 1175, t + 0.14, 0.22);
    navigator.vibrate?.([180, 70, 180]);
  } catch {
    // Browser may still block audio.
  }
}
