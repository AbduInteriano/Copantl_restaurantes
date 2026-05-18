/**
 * Timbre al abrir el modal de nueva reserva: 3 repiques (~4 s), una vez por aviso.
 * Usa Web Audio (mas fiable tras un clic en el panel para desbloquear).
 */

const RING_COUNT = 3;
const RING_GAP_S = 1.35;
const RING_DURATION_S = 0.72;

const BELL_PARTIALS = [
  { ratio: 1, amp: 1 },
  { ratio: 2.4, amp: 0.45 },
  { ratio: 3.8, amp: 0.22 },
] as const;
const BASE_FREQ = 740;

let audioCtx: AudioContext | null = null;
let pendingChime = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new Ctx();
  }
  return audioCtx;
}

function scheduleBellRing(ctx: AudioContext, startTime: number) {
  const master = ctx.createGain();
  master.connect(ctx.destination);
  master.gain.setValueAtTime(0.0001, startTime);
  master.gain.linearRampToValueAtTime(0.38, startTime + 0.015);
  master.gain.exponentialRampToValueAtTime(0.0001, startTime + RING_DURATION_S);

  for (const p of BELL_PARTIALS) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = BASE_FREQ * p.ratio;
    const g = ctx.createGain();
    g.gain.value = p.amp / 1.65;
    osc.connect(g);
    g.connect(master);
    osc.start(startTime);
    osc.stop(startTime + RING_DURATION_S + 0.05);
  }
}

/** Desbloquea audio sin sonido audible (primer clic en el panel). */
export async function unlockAdminAudioSilently(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;
  try {
    if (ctx.state === "suspended") await ctx.resume();
    if (pendingChime) {
      pendingChime = false;
      return playNewReservationChime();
    }
    return ctx.state === "running";
  } catch {
    return false;
  }
}

/** 3 repiques (~4 s). Devuelve true si se reprodujo. */
export async function playNewReservationChime(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === "suspended") await ctx.resume();
    if (ctx.state !== "running") {
      pendingChime = true;
      return false;
    }

    const start = ctx.currentTime + 0.03;
    for (let ring = 0; ring < RING_COUNT; ring++) {
      scheduleBellRing(ctx, start + ring * RING_GAP_S);
    }
    pendingChime = false;
    return true;
  } catch {
    pendingChime = true;
    return false;
  }
}

/** Clic/tecla en el panel: desbloquea sin timbre (requerido por el navegador). */
export function setupAdminAudioUnlock(): () => void {
  const unlock = () => {
    void unlockAdminAudioSilently();
  };
  document.addEventListener("pointerdown", unlock, { capture: true });
  document.addEventListener("keydown", unlock, { capture: true });
  return () => {
    document.removeEventListener("pointerdown", unlock, { capture: true });
    document.removeEventListener("keydown", unlock, { capture: true });
  };
}
