/** Timbre corto: 3 repiques tipo campana, una sola reproduccion (~1.8 s). */

const SAMPLE_RATE = 44100;
const RING_COUNT = 3;
const RING_GAP_S = 0.52;
const RING_DURATION_S = 0.38;
const TOTAL_S = (RING_COUNT - 1) * RING_GAP_S + RING_DURATION_S + 0.08;

/** Parciales tipo campana (ding). */
const BELL_PARTIALS = [
  { ratio: 1, amp: 1 },
  { ratio: 2.4, amp: 0.45 },
  { ratio: 3.8, amp: 0.22 },
] as const;
const BASE_FREQ = 740;

function buildChimeSamples(): Float32Array {
  const n = Math.floor(SAMPLE_RATE * TOTAL_S);
  const buf = new Float32Array(n);

  for (let ring = 0; ring < RING_COUNT; ring++) {
    const startSec = ring * RING_GAP_S;
    const i0 = Math.floor(startSec * SAMPLE_RATE);
    const i1 = Math.floor((startSec + RING_DURATION_S) * SAMPLE_RATE);

    for (let i = i0; i < i1 && i < n; i++) {
      const t = (i - i0) / SAMPLE_RATE;
      let sample = 0;
      for (const p of BELL_PARTIALS) {
        sample += Math.sin(2 * Math.PI * BASE_FREQ * p.ratio * t) * p.amp;
      }
      const attack = Math.min(1, t / 0.004);
      const decay = Math.exp(-t * 11);
      buf[i] += (sample / 1.65) * attack * decay * 0.52;
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
let isPlaying = false;

function getAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio(encodeWavDataUrl(buildChimeSamples()));
    audioEl.preload = "auto";
    audioEl.loop = false;
    audioEl.addEventListener("ended", () => {
      isPlaying = false;
    });
  }
  return audioEl;
}

export async function unlockReservationChime(): Promise<boolean> {
  if (unlocked) return true;
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
  if (isPlaying) return;
  const audio = getAudio();
  try {
    isPlaying = true;
    audio.pause();
    audio.currentTime = 0;
    audio.loop = false;
    audio.volume = 1;
    await audio.play();
    unlocked = true;
    playWhenUnlocked = false;
  } catch {
    isPlaying = false;
    if (!unlocked) playWhenUnlocked = true;
  }
}

export function attachReservationChimeUnlock(): () => void {
  const unlock = () => {
    if (!unlocked) void unlockReservationChime();
  };
  document.addEventListener("pointerdown", unlock, { capture: true });
  document.addEventListener("keydown", unlock, { capture: true });
  return () => {
    document.removeEventListener("pointerdown", unlock, { capture: true });
    document.removeEventListener("keydown", unlock, { capture: true });
  };
}
