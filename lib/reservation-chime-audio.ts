/** Timbre "tin tin tin tin" (~4 s) como WAV en memoria — mas fiable que Web Audio suelto. */

const SAMPLE_RATE = 44100;
const CHIME_NOTES = [
  { freq: 784, start: 0 },
  { freq: 988, start: 1.05 },
  { freq: 1175, start: 2.1 },
  { freq: 1568, start: 3.15 },
] as const;
const NOTE_LEN_S = 0.65;
const TOTAL_S = 4.05;

function buildChimeSamples(): Float32Array {
  const n = Math.floor(SAMPLE_RATE * TOTAL_S);
  const buf = new Float32Array(n);
  for (const { freq, start } of CHIME_NOTES) {
    const i0 = Math.floor(start * SAMPLE_RATE);
    const i1 = Math.floor((start + NOTE_LEN_S) * SAMPLE_RATE);
    for (let i = i0; i < i1 && i < n; i++) {
      const t = (i - i0) / SAMPLE_RATE;
      const attack = Math.min(1, t / 0.012);
      const decay = Math.exp(-t * 3);
      buf[i] += Math.sin(2 * Math.PI * freq * t) * attack * decay * 0.45;
    }
  }
  return buf;
}

function encodeWavDataUrl(samples: Float32Array): string {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

let audioEl: HTMLAudioElement | null = null;
let unlocked = false;
let playWhenUnlocked = false;

function getAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio(encodeWavDataUrl(buildChimeSamples()));
    audioEl.preload = "auto";
  }
  return audioEl;
}

export async function unlockReservationChime(): Promise<boolean> {
  const audio = getAudio();
  try {
    audio.volume = 0.001;
    audio.currentTime = 0;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
    unlocked = true;
    if (playWhenUnlocked) {
      playWhenUnlocked = false;
      await playReservationChime();
    }
    return true;
  } catch {
    return false;
  }
}

export async function playReservationChime(): Promise<void> {
  const audio = getAudio();
  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
    await audio.play();
    unlocked = true;
    playWhenUnlocked = false;
  } catch {
    if (!unlocked) playWhenUnlocked = true;
  }
}

export function attachReservationChimeUnlock(): () => void {
  const unlock = () => {
    void unlockReservationChime();
  };
  document.addEventListener("pointerdown", unlock, { capture: true });
  document.addEventListener("keydown", unlock, { capture: true });
  return () => {
    document.removeEventListener("pointerdown", unlock, { capture: true });
    document.removeEventListener("keydown", unlock, { capture: true });
  };
}
