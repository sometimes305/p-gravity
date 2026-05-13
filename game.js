"use strict";

const DESIGN_W = 470;
const DESIGN_H = 844;
const ASSET_VERSION = "html-port-20260513-17";
const SYMBOLS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const NORMAL = "NORMAL";
const RUSH = "RUSH";

const HEADER_HUD_LAYOUT = {
  // Manual tuning points for the title logo and header counters.
  logo: { x: 124, y: 13, w: 222, h: 82 },
  time: { x: 60, labelY: 37, valueY: 68 },
  point: { right: 60, labelY: 37, valueY: 68 },
};

const SOUND_TOGGLE_BOUNDS = { x: DESIGN_W - 154, y: 786, w: 132, h: 48 };
const RETRY_PANEL_BOUNDS = { x: 22, y: 786, w: 132, h: 48 };
const SOUND_STORAGE_KEY = "pachinko.soundEnabled";

if (typeof window !== "undefined") {
  window.__headerHudLayout = HEADER_HUD_LAYOUT;
}

const SETTINGS = {
  gameSeconds: 150,
  initialPoints: 200,
  cellH: 146,
  reelW: 132,
  symbolSize: 132,
  reelTop: 96,
  reelCenterY: 274,
  reelWindowX: 40,
  reelWindowW: 390,
  reelWindowY: 128,
  reelWindowH: 292,
  reelGap: -4,
  spinDurations: [760, 0, 0],
  stopStagger: 430,
  reachPause: 900,
  flipDuration: 400,
  resultHold: 980,
  loseReturnDelay: 260,
  winReturnDelay: 560,
  payoutEffectMs300: 1280,
  payoutEffectMs600: 1680,
  reachCutInMs: 1320,
  rushEntryEffectMs: 1560,
  rushExitEffectMs: 1880,
  rushExitAfterPayoutDelay: 1680,
  rushExitDimOpacity: 0.58,
  stripSourceCellH: 2400 / 9,
  spinDirection: -1,
  stripSpeedCellsPerSec: 14.8,
  stripStartRampMs: 150,
  stripStopLoops: [0, 1, 1],
  stripReachExtraLoops: 1,
  stripApproachMs: 0,
  stripBrakeMs: 220,
  stripSettleMs: 120,
  stripOvershootCells: 0.02,
  reelStopProfiles: [
    { visibleCells: 2.55, minDuration: 1400, settle: 80, shake: 0.18 },
    { visibleCells: 2.75, minDuration: 1520, settle: 90, shake: 0.2 },
    { visibleCells: 2.65, minDuration: 1460, settle: 85, shake: 0.18 },
  ],
  reelStartLift: 0,
  stopChainGap: 95,
  stopInitialJitterMs: 150,
  stopChainJitterMs: 130,
  stopDurationJitterMs: 180,
  rushStopStartScale: 0.82,
  rushStopDurationScale: 0.78,
  rushStopChainGapScale: 0.65,
  rushReachPauseScale: 0.72,
  rushReachSlowSpeedMultiplier: 1.12,
  rushReachMinCells: 4.8,
  rushReachExtraCells: 9,
  rushReachAddLapBelowMs: 2400,
  reachCenterDecelMs: 720,
  reachCenterSlowSpeed: 1.0535,
  reachCenterSettleMs: 124,
  reachCenterMinCells: 5.8,
  reachCenterExtraCells: 9,
  reachCenterAddLapBelowMs: 3000,
  oddInstantTripleStopChance: 0.2,
  instantTripleStopDelay: 620,
  instantTripleStopProfile: { visibleCells: 2.55, minDuration: 760, settle: 80, shake: 0.18 },
  normalHitChance: 1 / 6,
  rushHitChance: 1 / 1.5,
  rushOddWeight: 1.2,
  normalMissReachFreezeUpgradeChance: 0.05,
  rushOddFreezeUpgradeChance: 0.2,
  rushEvenFreezeUpgradeChance: 0.3,
  winTimeBonusSec: 5,
  sevenWinTimeBonusSec: 10,
  timeBonusEffectMs: 1180,
  freezeHoldBeforeMs: 1000,
  puchunFrameMs: 1234,
  puchunFrameFps: 30,
  promotionSevenBgFps: 30,
  puchunBlackoutMs: 2200,
  promotionSevenHoldMs: 1500,
  resultEndMs: 3000,
  resultDarkenMs: 1100,
  resultRowDelayMs: 1500,
  resultRestartDelayMs: 2500,
  normalCrowdHitShare: 0.4,
  normalCrowdReliability: 0.8,
  normalStrongReachHitShare: 0.4,
  normalStrongReachReliability: 0.7,
  normalWeakReachHitShare: 0.1,
  normalWeakReachReliability: 0.1,
  maxHolds: 4,
  ballCost: 1,
  plinkoTop: 506,
  plinkoBottom: 742,
  heSoX: DESIGN_W / 2,
  heSoY: 703,
  heSoRadius: 14,
  startPocketY: 699,
  startPocketW: 35,
  startPocketH: 26,
  startPocketMouthHalfW: 18,
  startPocketTriggerY: 716,
  startPocketTriggerHalfW: 11,
};

const canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");
const spinButton = document.getElementById("spinButton");
const puchunVideo = document.getElementById("puchunVideo");
const loading = document.getElementById("loading");

const state = {
  mode: NORMAL,
  points: SETTINGS.initialPoints,
  remainingMs: SETTINGS.gameSeconds * 1000,
  rushStreak: 0,
  status: "loading",
  reels: [],
  result: null,
  freezePromotion: null,
  toast: null,
  timeBonus: null,
  screenEffects: [],
  particles: [],
  balls: [],
  holds: 0,
  nextBallId: 1,
  crowdForecast: null,
  lastTime: performance.now(),
  resultShown: false,
  resultPresentation: null,
  scoreReported: false,
  debug: false,
  stopOrder: [],
  stopCursor: 0,
  nextStopAt: 0,
  reachLedActive: false,
};

const assets = {
  front: new Map(),
  back: new Map(),
  stripFront: null,
  stripBack: null,
  backgroundNormal: null,
  backgroundRush: null,
  crowdForecast: null,
  freezeVideo: null,
  promotionSevenBgVideo: null,
  puchunFrames: [],
  promotionSevenBgFrames: [],
  cabinetBack: null,
  cabinetFront: null,
  cabinetGlass: null,
  startPocket: null,
  titleLogo: null,
  headerPanelBackground: null,
  plinkoBackground: null,
  retry: null,
  effects: {},
};

const renderCache = {
  baseByMode: new Map(),
  boardStatic: null,
  chrome: null,
  dirty: true,
};

const PLINKO_PINS = [];
function addPlinkoPin(x, y, r = 4.2) {
  const pocketKeepOut = y > SETTINGS.startPocketY - 18
    && Math.abs(x - SETTINGS.heSoX) < SETTINGS.startPocketW * 0.48;
  if (!pocketKeepOut) PLINKO_PINS.push({ x, y, r });
}

const PIN_ROWS = [
  { y: SETTINGS.plinkoTop + 28, xs: [70, 114, 158, 202, 246, 290, 334, 378, 422] },
  { y: SETTINGS.plinkoTop + 56, xs: [92, 136, 180, 224, 268, 312, 356, 400] },
  { y: SETTINGS.plinkoTop + 84, xs: [74, 118, 162, 206, 250, 294, 338, 382, 426] },
  { y: SETTINGS.plinkoTop + 112, xs: [96, 140, 184, 228, 272, 316, 360, 404] },
  { y: SETTINGS.plinkoTop + 140, xs: [78, 124, 170, 216, 254, 300, 346, 392] },
  { y: SETTINGS.plinkoTop + 166, xs: [98, 144, 190, 280, 326, 372] },
  { y: SETTINGS.plinkoTop + 190, xs: [124, 168, 198, 272, 302, 346] },
];
for (const row of PIN_ROWS) {
  for (const x of row.xs) addPlinkoPin(x, row.y);
}

const audio = {
  ctx: null,
  unlocked: false,
  enabled: readSoundEnabled(),
  bgm: {},
  se: {},
  seBuffers: {},
  activeSe: new Set(),
  activeTones: new Set(),
  activeBgm: null,
  fadeTimer: null,
  defaultBgmVolume: 0.42,
  defaultSeVolume: 0.72,
  unlock() {
    if (!this.enabled || this.unlocked) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = this.ctx || new AudioContext();
    if (this.ctx.state === "suspended") this.ctx.resume();
    for (const track of Object.values(this.bgm)) {
      track.volume = this.defaultBgmVolume;
      track.loop = true;
    }
    this.unlocked = true;
  },
  setBgmTracks(tracks) {
    this.bgm = tracks;
  },
  setSeTracks(tracks) {
    this.se = tracks;
  },
  setSeBuffers(buffers) {
    this.seBuffers = buffers;
  },
  setEnabled(enabled) {
    this.enabled = enabled;
    writeSoundEnabled(enabled);
    if (!enabled) {
      this.stopAll();
      return;
    }
    this.unlock();
    this.updateBgm();
  },
  playSe(name, volume = this.defaultSeVolume) {
    if (!this.enabled || !this.unlocked) return false;
    const buffer = this.seBuffers[name];
    if (buffer && this.ctx) {
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      source.buffer = buffer;
      gain.gain.value = volume;
      source.connect(gain).connect(this.ctx.destination);
      this.activeTones.add(source);
      source.addEventListener("ended", () => {
        this.activeTones.delete(source);
        try {
          source.disconnect();
        } catch (_) {}
        try {
          gain.disconnect();
        } catch (_) {}
      }, { once: true });
      source.start();
      return true;
    }
    const source = this.se[name];
    if (!source) return false;
    const sound = source.cloneNode(true);
    sound.volume = volume;
    this.activeSe.add(sound);
    const cleanup = () => this.activeSe.delete(sound);
    sound.addEventListener("ended", cleanup, { once: true });
    sound.addEventListener("pause", cleanup, { once: true });
    sound.play().catch(() => {});
    return true;
  },
  playBgm(name) {
    if (!this.enabled || !this.unlocked) return;
    const next = this.bgm[name];
    if (!next || this.activeBgm === next) return;
    this.fadeOutActive(100);
    this.activeBgm = next;
    next.volume = this.defaultBgmVolume;
    next.currentTime = 0;
    next.play().catch(() => {});
  },
  updateBgm() {
    if (state.status === "result") {
      this.stopBgm();
      return;
    }
    if (state.mode === RUSH) {
      this.playBgm("rush");
    } else {
      this.playBgm("normal");
    }
  },
  playReachBgm() {
    if (state.mode === NORMAL) this.playBgm("normalReach");
  },
  fadeOutActive(ms = 100) {
    const track = this.activeBgm;
    if (!track) return;
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    const startVolume = track.volume;
    const startedAt = performance.now();
    this.fadeTimer = window.setInterval(() => {
      const t = clamp01((performance.now() - startedAt) / ms);
      track.volume = startVolume * (1 - t);
      if (t >= 1) {
        clearInterval(this.fadeTimer);
        this.fadeTimer = null;
        track.pause();
        track.volume = this.defaultBgmVolume;
        if (this.activeBgm === track) this.activeBgm = null;
      }
    }, 16);
  },
  stopBgm() {
    if (!this.activeBgm) return;
    this.fadeOutActive(100);
    this.activeBgm = null;
  },
  stopAll() {
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    for (const track of Object.values(this.bgm)) {
      if (!track) continue;
      track.pause();
      track.currentTime = 0;
    }
    this.activeBgm = null;
    for (const sound of Array.from(this.activeSe)) {
      sound.pause();
      sound.currentTime = 0;
    }
    this.activeSe.clear();
    for (const osc of Array.from(this.activeTones)) {
      try {
        osc.stop();
      } catch (_) {}
      try {
        osc.disconnect();
      } catch (_) {}
    }
    this.activeTones.clear();
  },
  tone(freq, duration, type = "sine", gain = 0.035, delay = 0) {
    if (!this.enabled || !this.ctx || !this.unlocked) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp).connect(this.ctx.destination);
    this.activeTones.add(osc);
    osc.addEventListener("ended", () => this.activeTones.delete(osc), { once: true });
    osc.start(now);
    osc.stop(now + duration + 0.02);
  },
  spin() {
    this.tone(160, 0.08, "sawtooth", 0.025);
    this.tone(220, 0.12, "triangle", 0.018, 0.05);
  },
  stop(index) {
    if (!this.playSe("reelStop", 0.66)) {
      this.tone(220 + index * 46, 0.075, "square", 0.025);
    }
  },
  flip() {
    this.tone(520, 0.055, "triangle", 0.018);
    this.tone(290, 0.08, "triangle", 0.014, 0.05);
  },
  button() {
    if (!this.playSe("button", 0.72)) this.tone(860, 0.045, "triangle", 0.018);
  },
  checker() {
    if (!this.playSe("checker", 0.74)) this.tone(1180, 0.06, "sine", 0.02);
  },
  reach() {
    this.playSe("reach", 0.78);
  },
  crowdForecast() {
    this.playSe("crowdForecast", 0.82);
  },
  puchun() {
    if (!this.playSe("puchun", 1)) this.tone(70, 0.18, "sawtooth", 0.04);
  },
  resultEnd() {
    if (!this.playSe("resultEnd", 0.9)) this.tone(110, 0.22, "sawtooth", 0.028);
  },
  resultReveal1() {
    if (!this.playSe("resultReveal1", 0.82)) {
      this.tone(620, 0.08, "triangle", 0.026);
      this.tone(880, 0.1, "triangle", 0.02, 0.05);
    }
  },
  resultReveal2() {
    if (!this.playSe("resultReveal2", 0.86)) {
      this.tone(460, 0.12, "triangle", 0.026);
      this.tone(720, 0.18, "triangle", 0.02, 0.1);
    }
  },
  win(seven) {
    if (!this.playSe(seven ? "sevenWin" : "normalWin", seven ? 0.86 : 0.8)) {
      const base = seven ? 660 : 520;
      this.tone(base, 0.12, "triangle", 0.035);
      this.tone(base * 1.25, 0.12, "triangle", 0.03, 0.1);
      this.tone(base * 1.5, 0.18, "triangle", 0.028, 0.2);
    }
  },
  lose() {
    this.tone(180, 0.16, "sine", 0.018);
  },
};

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function readSoundEnabled() {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== "0";
  } catch (_) {
    return true;
  }
}

function writeSoundEnabled(enabled) {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "1" : "0");
  } catch (_) {}
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInCubic(t) {
  return t * t * t;
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function weightedPick(entries) {
  const total = entries.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of entries) {
    roll -= item.weight;
    if (roll <= 0) return item.value;
  }
  return entries[entries.length - 1].value;
}

function pickSymbolForMode(mode) {
  if (mode === RUSH) {
    return weightedPick(SYMBOLS.map((n) => ({ value: n, weight: n % 2 ? SETTINGS.rushOddWeight : 1 })));
  }
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function makeLosingTriple(forceReach = false) {
  let left = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  let center = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  let right = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const reach = forceReach || Math.random() < 0.44;

  if (reach) {
    right = left;
    const candidates = [left - 1, left + 1].filter((n) => n >= 1 && n <= 9);
    center = candidates[Math.floor(Math.random() * candidates.length)];
  } else {
    while (left === right || (left === center && center === right)) {
      right = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    }
  }

  return [left, center, right];
}

function missEffectChance(hitShare, reliability, hitChance) {
  const missChance = 1 - hitChance;
  if (reliability <= 0 || missChance <= 0) return 0;
  return hitShare * hitChance * (1 - reliability) / (reliability * missChance);
}

function chooseNormalReachCutIn(win, required = false) {
  const hitChance = SETTINGS.normalHitChance;
  const strongChance = win
    ? SETTINGS.normalStrongReachHitShare
    : missEffectChance(SETTINGS.normalStrongReachHitShare, SETTINGS.normalStrongReachReliability, hitChance);
  const weakChance = win
    ? SETTINGS.normalWeakReachHitShare
    : missEffectChance(SETTINGS.normalWeakReachHitShare, SETTINGS.normalWeakReachReliability, hitChance);
  const roll = Math.random();
  if (roll < strongChance) return "reachStrong";
  if (roll < strongChance + weakChance) return "reachWeak";
  return required ? "reachWeak" : null;
}

function chooseNormalCrowdForecast(win) {
  const chance = win
    ? SETTINGS.normalCrowdHitShare
    : missEffectChance(SETTINGS.normalCrowdHitShare, SETTINGS.normalCrowdReliability, SETTINGS.normalHitChance);
  return Math.random() < chance;
}

function drawLot() {
  const hitChance = state.mode === RUSH ? SETTINGS.rushHitChance : SETTINGS.normalHitChance;
  const win = Math.random() < hitChance;
  const beforeMode = state.mode;

  if (!win) {
    let reachCutIn = null;
    let crowdForecast = false;
    if (beforeMode === NORMAL) {
      reachCutIn = chooseNormalReachCutIn(false);
      crowdForecast = chooseNormalCrowdForecast(false);
    }
    const [left, center, right] = makeLosingTriple(!!reachCutIn || crowdForecast);
    const reach = left === right;
    if (beforeMode === NORMAL && reach && !reachCutIn) reachCutIn = chooseNormalReachCutIn(false, true);
    if (beforeMode === RUSH && reach) reachCutIn = "rushReach";
    if (!reach) {
      reachCutIn = null;
      crowdForecast = false;
    }
    const freezePromotion = beforeMode === NORMAL && reach && Math.random() < SETTINGS.normalMissReachFreezeUpgradeChance;
    return {
      win: false,
      symbol: null,
      numbers: [left, center, right],
      beforeMode,
      afterMode: beforeMode,
      payout: 0,
      reach,
      reachCutIn,
      crowdForecast,
      freezePromotion,
    };
  }

  const symbol = pickSymbolForMode(state.mode);
  const odd = symbol % 2 === 1;
  const payout = symbol === 7 ? 600 : 300;
  const reachCutIn = beforeMode === RUSH ? "rushReach" : chooseNormalReachCutIn(true, true);
  const crowdForecast = beforeMode === NORMAL && chooseNormalCrowdForecast(true);
  const rushUpgradeChance = odd && symbol !== 7
    ? SETTINGS.rushOddFreezeUpgradeChance
    : !odd
      ? SETTINGS.rushEvenFreezeUpgradeChance
      : 0;
  const freezePromotion = beforeMode === RUSH && rushUpgradeChance > 0 && Math.random() < rushUpgradeChance;
  const instantTripleStop = beforeMode === RUSH && odd && Math.random() < SETTINGS.oddInstantTripleStopChance;
  return {
    win: true,
    symbol,
    numbers: [symbol, symbol, symbol],
    beforeMode,
    afterMode: odd ? RUSH : NORMAL,
    payout,
    reach: true,
    reachCutIn,
    crowdForecast,
    freezePromotion,
    instantTripleStop,
  };
}

function makeReel(index) {
  const x = DESIGN_W / 2 + (index - 1) * (SETTINGS.reelW + SETTINGS.reelGap);
  return {
    index,
    x,
    y: SETTINGS.reelCenterY,
    offset: symbolToStripIndex(index === 0 ? 1 : index === 1 ? 3 : 5),
    speed: 0,
    currentSpeed: 0,
    stopping: false,
    pendingStop: false,
    stopped: true,
    target: 1 + index,
    face: "front",
    flipT: 0,
    shake: 0,
    blur: 0,
    squash: 0,
    lift: 0,
  };
}

function initReels() {
  state.reels = [makeReel(0), makeReel(1), makeReel(2)];
  state.reels[0].target = 1;
  state.reels[1].target = 3;
  state.reels[2].target = 5;
}

function setAllFaces(face, animated = true) {
  if (animated) audio.flip();
  const startedAt = performance.now();
  for (const reel of state.reels) {
    reel.face = face;
    reel.flipStart = startedAt;
    reel.flipFrom = reel.flipT;
    reel.flipTo = face === "front" ? 0 : 1;
    if (!animated) {
      reel.flipT = reel.flipTo;
      reel.flipStart = 0;
    }
  }
  if (animated && face === "back" && state.status === "spinning" && state.result?.reach) {
    state.reachLedActive = true;
    audio.reach();
    if (state.mode === NORMAL) {
      window.setTimeout(() => {
        if (state.status === "spinning" && state.result?.reach) audio.playReachBgm();
      }, SETTINGS.flipDuration);
    }
  }
  if (animated && face === "back" && state.status === "spinning" && state.result?.reach && state.result.reachCutIn) {
    window.setTimeout(() => {
      if (state.status !== "spinning" || !state.result?.reach || state.result.reachCutInPlayed) return;
      state.result.reachCutInPlayed = true;
      startReachCutIn(state.result.reachCutIn);
    }, SETTINGS.flipDuration + 80);
  }
}

function showToast(text, color = "#fff", duration = 1100) {
  state.toast = { text, color, start: performance.now(), duration };
}

function showTimeBonus(seconds, seven = false) {
  state.timeBonus = {
    seconds,
    seven,
    start: performance.now(),
    duration: SETTINGS.timeBonusEffectMs,
  };
}

function resultCommentForScore(score) {
  if (score <= 0) return "\u0031\u0030\u0035\u0030\u5e74\u5730\u4e0b\u884c\u304d\u3063......\uff01";
  if (score <= 499) return "\u4eca\u65e5\u306e\u591c\u3054\u98ef\u306f\u3082\u3084\u3057\u304b\u306a......";
  if (score <= 1999) return "\u4eca\u65e5\u306f\u65e9\u3081\u306b\u5bdd\u3088\u3046\u3002";
  if (score <= 3999) return "\u4eca\u65e5\u306f\u3061\u3087\u3063\u3068\u30c4\u30a4\u3066\u308b\u3002";
  if (score <= 5999) return "\u6ce2\u304c\u6765\u3066\u3044\u308b\u3002";
  if (score <= 7999) return "\u304b\u306a\u308a\u3044\u3044\u611f\u3058\u3067\u3059\u3002";
  if (score <= 9999) return "\u4eca\u591c\u306f\u713c\u8089\u3060\uff01";
  if (score <= 14999) return "\u4f1d\u8aac\u306e\u59cb\u307e\u308a";
  return "\u661f\u304c\u304b\u3063\u3066\u307e\u3059\u306d\u3002";
}

function markReelsAsSeven() {
  for (const reel of state.reels) {
    reel.target = 7;
    reel.offset = symbolToStripIndex(7);
    reel.face = "front";
    reel.flipT = 0;
    reel.flipStart = 0;
    reel.stopping = false;
    reel.pendingStop = false;
    reel.stopped = true;
    reel.blur = 0;
    reel.squash = 0;
    reel.lift = 0;
    reel.shake = 0;
  }
}

function promoteResultToSeven(result) {
  result.win = true;
  result.symbol = 7;
  result.numbers = [7, 7, 7];
  result.afterMode = RUSH;
  result.payout = 600;
  result.reach = true;
  result.crowdForecast = false;
  result.freezePromotion = false;
  result.promotedToSeven = true;
  result.winSePlayed = true;
}

function startScreenEffect(effect) {
  state.screenEffects.push({
    ...effect,
    start: performance.now(),
  });
}

function startReachCutIn(kind) {
  if (!kind) return;
  const rush = kind === "rushReach";
  const strong = kind === "reachStrong";
  startScreenEffect({
    type: "slide",
    asset: kind,
    profile: rush ? "rush" : strong ? "strong" : "weak",
    duration: SETTINGS.reachCutInMs,
    y: SETTINGS.reelWindowY + SETTINGS.reelWindowH * 0.5,
    maxW: SETTINGS.reelWindowW * (rush ? 0.78 : 0.48),
    maxH: SETTINGS.reelWindowH * (rush ? 0.58 : 0.37),
  });
}

function startPayoutEffect(payout) {
  const seven = payout >= 600;
  startScreenEffect({
    type: "payout",
    asset: seven ? "plus600" : "plus300",
    duration: seven ? SETTINGS.payoutEffectMs600 : SETTINGS.payoutEffectMs300,
    y: SETTINGS.reelWindowY + SETTINGS.reelWindowH * 0.48,
    maxW: seven ? SETTINGS.reelWindowW * 1.04 : SETTINGS.reelWindowW * 0.86,
    maxH: seven ? SETTINGS.reelWindowH * 0.82 : SETTINGS.reelWindowH * 0.62,
    intensity: seven ? 1.4 : 1,
  });
}

function startModeTransitionEffect(profile) {
  const entry = profile === "entry";
  startScreenEffect({
    type: entry ? "slide" : "rushExitFade",
    asset: entry ? "rushEntry" : "rushExit",
    profile,
    duration: entry ? SETTINGS.rushEntryEffectMs : SETTINGS.rushExitEffectMs,
    y: SETTINGS.reelWindowY + SETTINGS.reelWindowH * (entry ? 0.52 : 0.57),
    maxW: SETTINGS.reelWindowW * (entry ? 1.08 : 0.98),
    maxH: SETTINGS.reelWindowH * (entry ? 0.86 : 0.72),
  });
}

function beginFreezePromotion(result) {
  const startedAt = performance.now();
  state.freezePromotion = {
    result,
    stage: "hold",
    start: startedAt,
    videoStart: 0,
    pulseStart: 0,
    videoFailed: false,
    done: false,
  };

  window.setTimeout(() => {
    if (!state.freezePromotion || state.freezePromotion.result !== result || state.freezePromotion.done) return;
    playFreezePromotionVideo(result);
  }, SETTINGS.freezeHoldBeforeMs);
}

function playFreezePromotionVideo(result) {
  const effect = state.freezePromotion;
  if (!effect || effect.result !== result) return;
  audio.stopAll();
  audio.puchun();
  hidePuchunVideo(true);
  effect.stage = "video";
  effect.videoStart = performance.now();
  effect.videoFailed = false;

  const finish = () => startPuchunBlackout(result);
  window.setTimeout(() => {
    if (state.freezePromotion === effect && effect.stage === "video" && !effect.done) finish();
  }, SETTINGS.puchunFrameMs);
}

function startPuchunBlackout(result) {
  const effect = state.freezePromotion;
  if (!effect || effect.result !== result || effect.done) return;
  if (assets.freezeVideo) assets.freezeVideo.pause();
  hidePuchunVideo(true);
  effect.stage = "black";
  effect.blackStart = performance.now();
  window.setTimeout(() => {
    if (state.freezePromotion !== effect || effect.stage !== "black" || effect.done) return;
    finishFreezePromotion(result);
  }, SETTINGS.puchunBlackoutMs);
}

function finishFreezePromotion(result) {
  const effect = state.freezePromotion;
  if (!effect || effect.result !== result || effect.done) return;
  effect.done = true;
  effect.stage = "seven";
  effect.pulseStart = performance.now();
  if (assets.freezeVideo) assets.freezeVideo.pause();
  hidePuchunVideo(true);

  promoteResultToSeven(result);
  markReelsAsSeven();
  audio.win(true);
  addBurst(DESIGN_W / 2, SETTINGS.reelCenterY, "#ffe780", 96);
  window.setTimeout(() => {
    if (state.freezePromotion !== effect) return;
    state.freezePromotion = null;
    processCompletedSpinResult(result);
  }, SETTINGS.promotionSevenHoldMs);
}

function addBurst(x, y, color, count = 34) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1.2 + Math.random() * 3.5;
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 1.2,
      life: 520 + Math.random() * 520,
      age: 0,
      color,
      size: 1.4 + Math.random() * 3.2,
    });
  }
}

function startCrowdForecast(now) {
  if (!assets.crowdForecast || state.crowdForecast) return;
  audio.crowdForecast();
  const members = [];
  for (let i = 0; i < 16; i++) {
    const lane = i % 4;
    const scale = randRange(0.09, 0.11);
    const startY = SETTINGS.reelWindowY + SETTINGS.reelWindowH + 34 + i * 22 + randRange(-8, 8);
    const endY = SETTINGS.reelWindowY - 48 - randRange(0, 32);
    members.push({
      x: SETTINGS.reelWindowX + 24 + lane * 104 + randRange(-18, 18),
      startY,
      endY,
      scale,
      sway: randRange(10, 26),
      phase: randRange(0, Math.PI * 2),
    });
  }
  state.crowdForecast = {
    start: now,
    duration: 5800,
    members,
  };
}

function pendingBallsAndHolds() {
  return state.holds + state.balls.length;
}

function refreshButtonState() {
  if (state.status === "loading") {
    spinButton.disabled = true;
    return;
  }
  if (state.status === "result") {
    spinButton.classList.remove("is-result-hidden", "is-result-ready");
    spinButton.textContent = "PUSH";
    spinButton.disabled = false;
    return;
  }
  spinButton.classList.remove("is-result-hidden", "is-result-ready");
  spinButton.textContent = "PUSH";
  spinButton.disabled = state.points < SETTINGS.ballCost;
}

function consumeHoldIfIdle() {
  if (state.status !== "idle") return;
  if (state.holds <= 0) {
    refreshButtonState();
    return;
  }
  state.holds--;
  startSpin();
  refreshButtonState();
}

function addHold() {
  if (state.holds >= SETTINGS.maxHolds) return false;
  state.holds++;
  window.setTimeout(consumeHoldIfIdle, 90);
  refreshButtonState();
  return true;
}

function fireBall() {
  audio.unlock();
  if (state.status === "result") {
    return;
  }
  if (state.status === "loading") return;
  if (state.points < SETTINGS.ballCost) return;

  state.points -= SETTINGS.ballCost;
  const id = state.nextBallId++;
  state.balls.push({
    id,
    x: SETTINGS.heSoX + randRange(-18, 18),
    y: SETTINGS.plinkoTop - 18,
    vx: randRange(-1.1, 1.1),
    vy: randRange(1.8, 2.4),
    r: 5.5,
    age: 0,
  });
  audio.button();
  refreshButtonState();
}

function eventToDesignPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * DESIGN_W / rect.width,
    y: (event.clientY - rect.top) * DESIGN_H / rect.height,
  };
}

function pointInRect(point, rect) {
  return point.x >= rect.x
    && point.x <= rect.x + rect.w
    && point.y >= rect.y
    && point.y <= rect.y + rect.h;
}

function toggleSound() {
  audio.setEnabled(!audio.enabled);
}

function reportFinalScore(score) {
  if (state.scoreReported) return;
  state.scoreReported = true;
  try {
    window.parent.postMessage({ action: "report_score", score }, "*");
  } catch (_) {}
}

function setSpinButtonPressing(pressing) {
  if (spinButton.disabled) {
    spinButton.classList.remove("is-pressing");
    return;
  }
  spinButton.classList.toggle("is-pressing", pressing);
}

function startSpin() {
  audio.unlock();
  if (state.status !== "idle") return;
  if (state.remainingMs <= 0) return;

  audio.spin();
  state.result = drawLot();
  state.crowdForecast = null;
  state.reachLedActive = false;
  state.status = "spinning";
  refreshButtonState();
  audio.updateBgm();

  const now = performance.now();
  const shouldFlipToUra = state.result.reach;
  const instantTripleStop = !!state.result.instantTripleStop;
  const rushTempo = state.result.beforeMode === RUSH;
  const stopOrder = instantTripleStop ? [0, 1, 2] : [0, 2, 1];

  for (const reel of state.reels) {
    reel.stopped = false;
    reel.stopping = false;
    reel.pendingStop = false;
    reel.speed = SETTINGS.stripSpeedCellsPerSec + reel.index * 0.18;
    reel.currentSpeed = reel.speed;
    reel.startAt = now;
    reel.spinPhase = "ramp";
    reel.target = state.result.numbers[reel.index];
    reel.shake = 0;
    reel.blur = 0.28;
    reel.squash = 0;
    reel.liftStart = now;
    reel.lift = SETTINGS.reelStartLift;
  }

  state.stopOrder = stopOrder;
  state.stopCursor = 0;
  const firstStopDelay = instantTripleStop
    ? SETTINGS.instantTripleStopDelay
    : SETTINGS.spinDurations[0] * (rushTempo ? SETTINGS.rushStopStartScale : 1);
  state.nextStopAt = now + firstStopDelay + randRange(-SETTINGS.stopInitialJitterMs, SETTINGS.stopInitialJitterMs);
  state.flipToBackPending = shouldFlipToUra && !instantTripleStop;
}

function stopReel(index, now = performance.now()) {
  const reel = state.reels[index];
  if (!reel || reel.stopped || reel.pendingStop || reel.stopping) return;

  reel.stopProfile = state.result?.instantTripleStop ? SETTINGS.instantTripleStopProfile : SETTINGS.reelStopProfiles[index];
  reel.stopTargetIndex = symbolToStripIndex(reel.target);
  const deltaToTarget = distanceToTarget(reel.offset, reel.stopTargetIndex);
  beginStop(reel, now, deltaToTarget);
}

function distanceToTarget(offset, targetIndex) {
  const current = modFloat(offset, SYMBOLS.length);
  let delta = SETTINGS.spinDirection > 0 ? targetIndex - current : current - targetIndex;
  while (delta <= 0) delta += SYMBOLS.length;
  return delta;
}

function beginStop(reel, now, deltaToTarget) {
  reel.pendingStop = false;
  reel.stopping = true;
  reel.stopStart = now;
  reel.stopVelocity = SETTINGS.spinDirection * Math.max(0.001, reel.currentSpeed / 1000);
  const instantTripleStop = !!state.result?.instantTripleStop;
  const rushTempo = state.result?.beforeMode === RUSH;
  reel.slowReachStop = !instantTripleStop && reel.index === 1 && state.result?.reach;

  let stopDistance = reel.slowReachStop ? deltaToTarget : reel.stopProfile.visibleCells;
  const reachMinCells = rushTempo ? SETTINGS.rushReachMinCells : SETTINGS.reachCenterMinCells;
  const reachExtraCells = rushTempo ? SETTINGS.rushReachExtraCells : SETTINGS.reachCenterExtraCells;
  const reachAddLapBelowMs = rushTempo ? SETTINGS.rushReachAddLapBelowMs : SETTINGS.reachCenterAddLapBelowMs;
  if (reel.slowReachStop && stopDistance < reachMinCells) {
    stopDistance += Math.ceil(reachExtraCells / SYMBOLS.length) * SYMBOLS.length;
  }

  reel.stopDistance = stopDistance;
  if (reel.slowReachStop) {
    reel.stopFrom = reel.offset;
    reel.stopTarget = reel.offset + SETTINGS.spinDirection * stopDistance;
  } else {
    reel.stopTarget = reel.stopTargetIndex;
    reel.stopFrom = reel.stopTarget - SETTINGS.spinDirection * stopDistance;
    reel.offset = reel.stopFrom;
  }

  if (reel.slowReachStop) {
    const slowSpeed = SETTINGS.reachCenterSlowSpeed * (rushTempo ? SETTINGS.rushReachSlowSpeedMultiplier : 1);
    const startSpeed = Math.max(slowSpeed, reel.currentSpeed);
    const decelSec = SETTINGS.reachCenterDecelMs / 1000;
    const settleSec = SETTINGS.reachCenterSettleMs / 1000;
    let decelDistance = ((startSpeed + slowSpeed) / 2) * decelSec;
    let settleDistance = (slowSpeed / 2) * settleSec;
    const reservedDistance = decelDistance + settleDistance;
    if (reservedDistance > stopDistance) {
      const scale = stopDistance / reservedDistance;
      decelDistance *= scale;
      settleDistance *= scale;
      reel.reachDecelMs = SETTINGS.reachCenterDecelMs * scale;
      reel.reachSettleMs = SETTINGS.reachCenterSettleMs * scale;
    } else {
      reel.reachDecelMs = SETTINGS.reachCenterDecelMs;
      reel.reachSettleMs = SETTINGS.reachCenterSettleMs;
    }
    let cruiseDistance = Math.max(0, stopDistance - decelDistance - settleDistance);
    let cruiseMs = cruiseDistance / slowSpeed * 1000;
    if (reel.reachDecelMs + cruiseMs + reel.reachSettleMs < reachAddLapBelowMs) {
      stopDistance += SYMBOLS.length;
      reel.stopDistance = stopDistance;
      reel.stopTarget = reel.stopFrom + SETTINGS.spinDirection * stopDistance;
      cruiseDistance = Math.max(0, stopDistance - decelDistance - settleDistance);
      cruiseMs = cruiseDistance / slowSpeed * 1000;
    }
    reel.reachStartSpeed = startSpeed;
    reel.reachSlowSpeed = slowSpeed;
    reel.reachDecelDistance = decelDistance;
    reel.reachCruiseDistance = cruiseDistance;
    reel.reachSettleDistance = settleDistance;
    reel.reachCruiseMs = cruiseMs;
    reel.stopDuration = reel.reachDecelMs + reel.reachCruiseMs + reel.reachSettleMs;
    reel.crowdForecastArmed = !!state.result?.crowdForecast;
    reel.crowdForecastPlayed = false;
  } else {
    const jitter = instantTripleStop ? 0 : randRange(-SETTINGS.stopDurationJitterMs, SETTINGS.stopDurationJitterMs);
    const tempoScale = rushTempo && !instantTripleStop ? SETTINGS.rushStopDurationScale : 1;
    reel.stopDuration = Math.max(220, (reel.stopProfile.minDuration + jitter) * tempoScale);
  }
}

function smoothStopOffset(from, to, velocityPerMs, duration, t) {
  const eased = 1 - Math.pow(1 - t, 2.8);
  return from + (to - from) * eased;
}

function monotonicStopOffset(from, distance, direction, t) {
  const eased = 1 - Math.pow(1 - t, 4);
  return from + direction * distance * eased;
}

function reachSlowStopOffset(reel, elapsed) {
  const direction = SETTINGS.spinDirection;
  const decelMs = reel.reachDecelMs;
  const cruiseMs = reel.reachCruiseMs;
  const settleMs = reel.reachSettleMs;

  if (elapsed < decelMs) {
    const t = clamp01(elapsed / decelMs);
    const distance = (reel.reachStartSpeed * t
      + (reel.reachSlowSpeed - reel.reachStartSpeed) * t * t * 0.5) * (decelMs / 1000);
    reel.currentSpeed = reel.reachStartSpeed + (reel.reachSlowSpeed - reel.reachStartSpeed) * t;
    return reel.stopFrom + direction * distance;
  }

  if (elapsed < decelMs + cruiseMs) {
    const cruiseElapsed = elapsed - decelMs;
    reel.currentSpeed = reel.reachSlowSpeed;
    return reel.stopFrom + direction * (reel.reachDecelDistance + reel.reachSlowSpeed * cruiseElapsed / 1000);
  }

  const settleElapsed = elapsed - decelMs - cruiseMs;
  const t = clamp01(settleElapsed / settleMs);
  reel.currentSpeed = reel.reachSlowSpeed * (1 - t);
  const settleDistance = reel.reachSlowSpeed * (settleMs / 1000) * (t - t * t * 0.5);
  return reel.stopFrom + direction * (reel.reachDecelDistance + reel.reachCruiseDistance + settleDistance);
}

function updateCrowdForecast(dt, now) {
  if (!state.crowdForecast) return;
  if (now - state.crowdForecast.start >= state.crowdForecast.duration) {
    state.crowdForecast = null;
  }
}

function resolveBallSegmentCollision(ball, ax, ay, bx, by, bounce = 0.62) {
  const vx = bx - ax;
  const vy = by - ay;
  const lenSq = vx * vx + vy * vy;
  if (lenSq <= 0) return false;
  const t = clamp01(((ball.x - ax) * vx + (ball.y - ay) * vy) / lenSq);
  const px = ax + vx * t;
  const py = ay + vy * t;
  const dx = ball.x - px;
  const dy = ball.y - py;
  const distSq = dx * dx + dy * dy;
  if (distSq <= 0 || distSq >= ball.r * ball.r) return false;

  const dist = Math.sqrt(distSq);
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = ball.r - dist;
  ball.x += nx * overlap;
  ball.y += ny * overlap;
  const dot = ball.vx * nx + ball.vy * ny;
  if (dot < 0) {
    ball.vx -= (1 + bounce) * dot * nx;
    ball.vy -= (1 + bounce) * dot * ny;
  }
  ball.vx *= 0.94;
  ball.vy *= 0.96;
  return true;
}

function resolveStartPocketCollision(ball) {
  const hx = SETTINGS.heSoX;
  const topY = SETTINGS.heSoY;
  const y = SETTINGS.startPocketY;
  const outerHalfW = SETTINGS.startPocketW * 0.55;
  const mouthHalfW = SETTINGS.startPocketMouthHalfW;
  const bottomY = y + SETTINGS.startPocketH - 2;
  const bottomHalfW = SETTINGS.startPocketW * 0.24;
  const nearPocket = ball.y + ball.r > topY - 8
    && ball.y - ball.r < bottomY + 10
    && Math.abs(ball.x - hx) < outerHalfW + ball.r + 8;
  if (!nearPocket) return false;

  let collided = false;
  const segments = [
    [hx - outerHalfW, topY + 3, hx - mouthHalfW, topY],
    [hx + mouthHalfW, topY, hx + outerHalfW, topY + 3],
    [hx - outerHalfW, topY + 3, hx - bottomHalfW, bottomY],
    [hx + outerHalfW, topY + 3, hx + bottomHalfW, bottomY],
    [hx - bottomHalfW, bottomY, hx + bottomHalfW, bottomY],
  ];
  for (const segment of segments) {
    collided = resolveBallSegmentCollision(ball, segment[0], segment[1], segment[2], segment[3], 0.54) || collided;
  }
  return collided;
}

function updateBalls(dt) {
  if (!state.balls.length) return;
  const step = Math.min(2.4, dt / 16.67);
  const heSo = {
    x: SETTINGS.heSoX,
    y: SETTINGS.heSoY,
    halfW: SETTINGS.startPocketMouthHalfW,
    triggerY: SETTINGS.startPocketTriggerY,
    triggerHalfW: SETTINGS.startPocketTriggerHalfW,
  };
  for (const ball of state.balls) {
    const prevX = ball.x;
    const prevY = ball.y;
    ball.age += dt;
    ball.vy += 0.115 * step;
    ball.x += ball.vx * step;
    ball.y += ball.vy * step;

    const leftWall = 34 + ball.r;
    const rightWall = DESIGN_W - 34 - ball.r;
    if (ball.x < leftWall) {
      ball.x = leftWall;
      ball.vx = Math.abs(ball.vx) * 0.72;
    } else if (ball.x > rightWall) {
      ball.x = rightWall;
      ball.vx = -Math.abs(ball.vx) * 0.72;
    }

    for (const pin of PLINKO_PINS) {
      const dx = ball.x - pin.x;
      const dy = ball.y - pin.y;
      const minDist = ball.r + pin.r;
      const distSq = dx * dx + dy * dy;
      if (distSq <= 0 || distSq > minDist * minDist) continue;
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;
      const dot = ball.vx * nx + ball.vy * ny;
      if (dot < 0) {
        ball.vx -= dot * nx * 1.35;
        ball.vy -= dot * ny * 1.35;
      }
      ball.vx += randRange(-0.22, 0.22);
      ball.vy *= 0.96;
    }

    const crossedPocketTop = prevY <= heSo.y && ball.y >= heSo.y;
    const mouthGrace = 4;
    const crossedNearCenter = Math.abs((prevX + ball.x) * 0.5 - heSo.x) <= heSo.halfW + mouthGrace;
    const enteredPocket = !ball.inStartPocket
      && ball.vy > 0
      && crossedPocketTop
      && crossedNearCenter
      && Math.abs(ball.x - heSo.x) <= heSo.halfW + mouthGrace
      && ball.y - ball.r < heSo.y + 16;
    if (enteredPocket) {
      ball.inStartPocket = true;
      ball.vx *= 0.62;
      ball.vy *= 0.82;
    }

    const touchedPocketSensor = ball.inStartPocket
      && ball.y >= heSo.triggerY
      && Math.abs(ball.x - heSo.x) <= heSo.triggerHalfW + ball.r * 0.25;
    if (touchedPocketSensor) {
      state.points += 1;
      addHold();
      ball.collected = true;
      addBurst(heSo.x, heSo.y, "#ff2a7f", 18);
      audio.checker();
    } else if (!ball.inStartPocket && crossedPocketTop && Math.abs(ball.x - heSo.x) <= heSo.halfW + ball.r) {
      ball.y = heSo.y - ball.r - 0.1;
      ball.vy = -Math.abs(ball.vy) * 0.44;
      ball.vx = (ball.vx || randRange(-0.8, 0.8)) * 0.78 + Math.sign(ball.x - heSo.x || randRange(-1, 1)) * 0.18;
      resolveStartPocketCollision(ball);
    } else if (resolveStartPocketCollision(ball)) {
      ball.vx += randRange(-0.08, 0.08);
    } else if (ball.y > SETTINGS.plinkoBottom + 36 || ball.age > 5200) {
      ball.collected = true;
    }
  }
  state.balls = state.balls.filter((ball) => !ball.collected);
  refreshButtonState();
}

function updateStopChain(now) {
  if (state.status !== "spinning") return;
  if (state.stopCursor >= state.stopOrder.length) return;
  if (now < state.nextStopAt) return;

  if (state.result?.instantTripleStop) {
    for (const index of state.stopOrder) stopReel(index, now);
    state.stopCursor = state.stopOrder.length;
    return;
  }

  const index = state.stopOrder[state.stopCursor];
  const reel = state.reels[index];
  if (!reel || reel.stopped || reel.pendingStop || reel.stopping) return;
  stopReel(index, now);
}

function advanceStopChainAfter(index, now) {
  if (state.result?.instantTripleStop) return;
  if (state.stopOrder[state.stopCursor] !== index) return;
  state.stopCursor++;
  if (state.flipToBackPending && index === 2) {
    state.flipToBackPending = false;
    setAllFaces("back", true);
  }
  if (state.stopCursor < state.stopOrder.length) {
    const nextIndex = state.stopOrder[state.stopCursor];
    const rushTempo = state.result?.beforeMode === RUSH;
    const gap = SETTINGS.stopChainGap * (rushTempo ? SETTINGS.rushStopChainGapScale : 1);
    const reachDelayBase = nextIndex === 1 && state.result?.reach ? SETTINGS.reachPause : 0;
    const reachDelay = reachDelayBase * (rushTempo ? SETTINGS.rushReachPauseScale : 1);
    const jitter = SETTINGS.stopChainJitterMs * (rushTempo ? SETTINGS.rushStopChainGapScale : 1);
    state.nextStopAt = now + gap + reachDelay + randRange(-jitter, jitter);
  }
}

function finishSpinIfReady() {
  if (state.status !== "spinning") return;
  if (!state.reels.every((r) => r.stopped)) return;

  state.status = "settling";
  const result = state.result;
  const now = performance.now();
  if (result.freezePromotion) {
    beginFreezePromotion(result);
    state.lastSettledAt = now;
    return;
  }

  processCompletedSpinResult(result);
  state.lastSettledAt = now;
}

function processCompletedSpinResult(result) {
  let settleDelay = SETTINGS.resultHold + (result.reach ? 420 : 0);

  if (result.win) {
    state.points += result.payout;
    const timeBonus = result.symbol === 7 ? SETTINGS.sevenWinTimeBonusSec : SETTINGS.winTimeBonusSec;
    state.remainingMs += timeBonus * 1000;
    showTimeBonus(timeBonus, result.symbol === 7);
    if (result.afterMode === RUSH) {
      state.rushStreak = result.beforeMode === RUSH ? Math.max(1, state.rushStreak + 1) : 1;
    }
    if (!result.winSePlayed) audio.win(result.symbol === 7);
    startPayoutEffect(result.payout);
    addBurst(DESIGN_W / 2, SETTINGS.reelCenterY, result.symbol === 7 ? "#ffd86b" : "#ff2a7f", result.symbol === 7 ? 72 : 42);

    if (result.afterMode !== result.beforeMode) {
      const enteringRush = result.afterMode === RUSH;
      const effectDelay = enteringRush
        ? result.symbol === 7 ? 720 : 620
        : SETTINGS.rushExitAfterPayoutDelay;
      const effectDuration = enteringRush ? SETTINGS.rushEntryEffectMs : SETTINGS.rushExitEffectMs;
      window.setTimeout(() => startModeTransitionEffect(enteringRush ? "entry" : "exit"), effectDelay);
      window.setTimeout(() => {
        state.mode = result.afterMode;
        if (enteringRush) {
          setAllFaces("back", true);
          addBurst(DESIGN_W / 2, SETTINGS.reelCenterY, "#ffe780", 64);
        } else {
          state.rushStreak = 0;
          setAllFaces("front", true);
          addBurst(DESIGN_W / 2, SETTINGS.reelCenterY + 28, "#9ac8ff", 26);
        }
        audio.updateBgm();
      }, effectDelay + effectDuration);
      settleDelay += effectDelay + effectDuration + 220;
    } else {
      state.mode = result.afterMode;
      if (result.afterMode === NORMAL) {
        state.rushStreak = 0;
        window.setTimeout(() => setAllFaces("front", true), SETTINGS.winReturnDelay);
      } else {
        window.setTimeout(() => setAllFaces("back", true), 240);
      }
    }
  } else if (result.reach) {
    audio.lose();
    window.setTimeout(() => setAllFaces("front", true), SETTINGS.loseReturnDelay);
  }

  window.setTimeout(() => {
    if (state.remainingMs <= 0) {
      showResult();
    } else {
      state.status = "idle";
      audio.updateBgm();
      consumeHoldIfIdle();
      refreshButtonState();
    }
  }, settleDelay);
}

function showResult() {
  state.status = "result";
  state.resultShown = true;
  reportFinalScore(state.points);
  state.resultPresentation = {
    start: performance.now(),
    comment: resultCommentForScore(state.points),
    rowSounds: [false, false, false],
    restartReady: false,
  };
  state.freezePromotion = null;
  if (assets.freezeVideo) assets.freezeVideo.pause();
  hidePuchunVideo(true);
  setAllFaces("front", true);
  audio.stopBgm();
  audio.resultEnd();
  refreshButtonState();
}

function updateResultPresentation(now) {
  const presentation = state.resultPresentation;
  if (state.status !== "result" || !presentation) return;
  const t = now - presentation.start;
  const firstRowAt = SETTINGS.resultEndMs + SETTINGS.resultDarkenMs;
  const secondRowAt = firstRowAt + SETTINGS.resultRowDelayMs;
  const thirdRowAt = secondRowAt + SETTINGS.resultRowDelayMs;
  const restartAt = thirdRowAt + SETTINGS.resultRestartDelayMs;

  if (t >= firstRowAt && !presentation.rowSounds[0]) {
    presentation.rowSounds[0] = true;
    audio.resultReveal1();
  }
  if (t >= secondRowAt && !presentation.rowSounds[1]) {
    presentation.rowSounds[1] = true;
    audio.resultReveal1();
  }
  if (t >= thirdRowAt && !presentation.rowSounds[2]) {
    presentation.rowSounds[2] = true;
    audio.resultReveal2();
  }
  if (t >= restartAt && !presentation.restartReady) {
    presentation.restartReady = true;
    refreshButtonState();
  }
}

function update(dt, now) {
  updateResultPresentation(now);
  if (state.status !== "loading" && state.status !== "result") {
    state.remainingMs = Math.max(0, state.remainingMs - dt);
    if (state.remainingMs <= 0 && state.status === "idle") {
      showResult();
    }
  }

  for (const reel of state.reels) {
    if (reel.flipStart) {
      const t = clamp01((now - reel.flipStart) / SETTINGS.flipDuration);
      reel.flipT = reel.flipFrom + (reel.flipTo - reel.flipFrom) * easeInOutCubic(t);
      if (t >= 1) reel.flipStart = 0;
    }

    if (reel.liftStart) {
      const liftT = clamp01((now - reel.liftStart) / 800);
      reel.lift = SETTINGS.reelStartLift * (1 - easeOutCubic(liftT));
      if (liftT >= 1) reel.liftStart = 0;
    }

    if (!reel.stopped && !reel.stopping) {
      const rampT = clamp01((now - reel.startAt) / SETTINGS.stripStartRampMs);
      const ramp = 0.2 + 0.8 * easeOutCubic(rampT);
      reel.currentSpeed = reel.speed * ramp;
      reel.offset += SETTINGS.spinDirection * reel.currentSpeed * dt / 1000;
      reel.blur = 0.58;
    } else if (reel.stopping) {
      const elapsed = now - reel.stopStart;
      const stopT = clamp01(elapsed / reel.stopDuration);
      if (reel.slowReachStop && reel.crowdForecastArmed && !reel.crowdForecastPlayed) {
        const cueAt = reel.reachDecelMs + Math.min(520, reel.reachCruiseMs * 0.35);
        if (elapsed >= cueAt) {
          reel.crowdForecastPlayed = true;
          startCrowdForecast(now);
        }
      }
      reel.offset = reel.slowReachStop
        ? reachSlowStopOffset(reel, elapsed)
        : smoothStopOffset(reel.stopFrom, reel.stopTarget, reel.stopVelocity, reel.stopDuration, stopT);
      if (!reel.slowReachStop) {
        reel.currentSpeed = Math.max(0, reel.currentSpeed * (1 - stopT * 0.08));
      }
      reel.blur = reel.slowReachStop ? 0 : 0.06 * (1 - easeOutCubic(stopT));
      reel.squash = Math.sin(stopT * Math.PI) * 0.004;
      const t = clamp01(elapsed / reel.stopDuration);
      if (t >= 1) {
        reel.offset = reel.stopTarget;
        reel.stopping = false;
        reel.stopped = true;
        reel.slowReachStop = false;
        reel.crowdForecastArmed = false;
        reel.shake = reel.stopProfile.shake;
        reel.blur = 0;
        reel.squash = 0;
        addBurst(reel.x, reel.y + 48, "#f6c95f", 10);
        audio.stop(reel.index);
        if (reel.index === 1 && state.result?.reach && state.mode === NORMAL) {
          audio.stopBgm();
        }
        advanceStopChainAfter(reel.index, now);
      }
    }

    if (reel.shake > 0) {
      reel.shake = Math.max(0, reel.shake - dt / 260);
    }
  }

  for (const p of state.particles) {
    p.age += dt;
    p.x += p.vx * dt / 16.67;
    p.y += p.vy * dt / 16.67;
    p.vy += 0.05 * dt / 16.67;
  }
  state.particles = state.particles.filter((p) => p.age < p.life);
  state.screenEffects = state.screenEffects.filter((effect) => now - effect.start < effect.duration);
  updateCrowdForecast(dt, now);
  updateBalls(dt);

  updateStopChain(now);
  finishSpinIfReady();
}

function drawBackground() {
  drawBackgroundForMode(state.mode);
}

function drawBackgroundForMode(_mode) {
  const g = ctx.createLinearGradient(0, 0, 0, DESIGN_H);
  g.addColorStop(0, "#070914");
  g.addColorStop(0.45, "#02040a");
  g.addColorStop(1, "#03050b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
}

function drawCabinetShell() {
  if (assets.cabinetBack) {
    ctx.drawImage(assets.cabinetBack, 0, 0, DESIGN_W, DESIGN_H);
    return;
  }
  ctx.save();
  const topX = 0;
  const topY = 82;
  const topW = DESIGN_W;
  const topH = 408;
  const bottomX = 0;
  const bottomY = 480;
  const bottomW = DESIGN_W;
  const bottomH = 318;
  const shell = ctx.createLinearGradient(0, topY, 0, bottomY + bottomH);
  shell.addColorStop(0, "#6f59d9");
  shell.addColorStop(0.22, "#cbb8ff");
  shell.addColorStop(0.48, "#654fc8");
  shell.addColorStop(0.72, "#bda8ff");
  shell.addColorStop(1, "#4932a3");

  ctx.shadowColor = "rgba(35,24,95,0.76)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = shell;
  roundRect(ctx, topX, topY, topW, topH, 30);
  ctx.fill();
  roundRect(ctx, bottomX, bottomY, bottomW, bottomH, 30);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "rgba(10,11,48,0.86)";
  roundRect(ctx, 18, 104, DESIGN_W - 36, 354, 22);
  ctx.fill();
  roundRect(ctx, 18, 500, DESIGN_W - 36, 260, 22);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  roundRect(ctx, 18, 92, DESIGN_W - 36, 14, 10);
  ctx.fill();
  roundRect(ctx, 18, 488, DESIGN_W - 36, 11, 10);
  ctx.fill();

  const hingeY = 478;
  const hinge = ctx.createLinearGradient(0, hingeY - 5, 0, hingeY + 16);
  hinge.addColorStop(0, "#c2b4ff");
  hinge.addColorStop(0.5, "#6754c8");
  hinge.addColorStop(1, "#2a225d");
  ctx.fillStyle = hinge;
  roundRect(ctx, 28, hingeY - 5, DESIGN_W - 56, 20, 8);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(58, hingeY + 1, DESIGN_W - 116, 1);
  ctx.fillStyle = "rgba(151,236,255,0.72)";
  roundRect(ctx, DESIGN_W / 2 - 36, hingeY - 2, 72, 4, 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.22)";
  for (let i = 0; i < 28; i++) {
    const x = (i * 53 + 18) % DESIGN_W;
    const y = 10 + ((i * 31) % 78);
    drawStar(x, y, 1.6 + (i % 3) * 0.6);
  }
  ctx.restore();
}

function drawCabinetChrome() {
  if (assets.cabinetFront) {
    ctx.save();
    ctx.drawImage(assets.cabinetFront, 0, 0, DESIGN_W, DESIGN_H);
    drawCabinetStateLeds(performance.now());
    if (assets.cabinetGlass) {
      ctx.drawImage(assets.cabinetGlass, 0, 0, DESIGN_W, DESIGN_H);
    }
    ctx.restore();
    return;
  }
  ctx.save();
  const reelScreenX = SETTINGS.reelWindowX;
  const reelScreenY = SETTINGS.reelWindowY;
  const reelScreenW = SETTINGS.reelWindowW;
  const reelScreenH = SETTINGS.reelWindowH;
  drawReelGoldFrame(reelScreenX, reelScreenY, reelScreenW, reelScreenH, 34);
  drawGoldFrame(4, 488, DESIGN_W - 8, 288, 16);
  drawSideLeds(reelScreenX - 22, reelScreenY + 34, reelScreenH - 68);
  drawSideLeds(reelScreenX + reelScreenW + 10, reelScreenY + 34, reelScreenH - 68);
  drawCrystalStar(reelScreenX - 34, reelScreenY - 24, 18);
  drawCrystalStar(reelScreenX + reelScreenW + 34, reelScreenY - 24, 18);
  drawCrystalStar(reelScreenX - 34, reelScreenY + reelScreenH + 24, 18);
  drawCrystalStar(reelScreenX + reelScreenW + 34, reelScreenY + reelScreenH + 24, 18);
  drawGem(24, 506, 8, "#29b7ff");
  drawGem(DESIGN_W - 24, 506, 8, "#29b7ff");
  drawGem(24, 762, 8, "#ffd85a");
  drawGem(DESIGN_W - 24, 762, 8, "#ffd85a");
  drawCrystalStar(24, 96, 16);
  drawCrystalStar(DESIGN_W - 24, 96, 16);
  drawCrystalStar(24, 790, 16);
  drawCrystalStar(DESIGN_W - 24, 790, 16);
  ctx.restore();
}

function getCabinetLedProfile() {
  const result = state.result;
  const freezeStage = state.freezePromotion?.stage;
  if (freezeStage === "video" || freezeStage === "black") {
    return { kind: "off" };
  }
  const sevenSettled = state.freezePromotion?.stage === "seven"
    || (state.status === "settling" && result?.win && result.symbol === 7);
  if (sevenSettled) {
    return {
      kind: "seven",
      colors: ["#ff3b7f", "#ffdf5e", "#75f6ff", "#8b6cff", "#ffffff"],
      speed: 0.021,
      glow: 23,
      radius: 6.6,
      alpha: 1,
    };
  }
  if (state.reachLedActive && result?.reach && (state.status === "spinning" || state.status === "settling")) {
    return {
      kind: "reach",
      colors: ["#ff2d72", "#ff4266", "#ff95df"],
      speed: 0.015,
      glow: 18,
      radius: 6.2,
      alpha: 0.95,
    };
  }
  if (state.mode === RUSH) {
    return {
      kind: "rush",
      colors: ["#ffe26b", "#ff8bdc", "#fff6b3"],
      speed: 0.011,
      glow: 19,
      radius: 6.2,
      alpha: 0.98,
    };
  }
  return {
    kind: "normal",
    colors: ["#89f4ff", "#9a83ff", "#cafbff"],
    speed: 0.007,
    glow: 13,
    radius: 5.7,
    alpha: 0.82,
  };
}

function drawCabinetStateLeds(now) {
  const profile = getCabinetLedProfile();
  drawStateLedStrip(24, 156, 400, profile, now, 0);
  drawStateLedStrip(446, 156, 400, profile, now, 5);
  drawStateLedStrip(26, 520, 742, profile, now, 2);
  drawStateLedStrip(444, 520, 742, profile, now, 7);
}

function drawStateLedStrip(x, y0, y1, profile, now, phaseOffset = 0) {
  const count = 13;
  const gap = (y1 - y0 - 22) / (count - 1);
  if (profile.kind === "off") {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0,0,8,0.74)";
    roundRect(ctx, x - 10, y0 + 1, 20, y1 - y0 - 2, 10);
    ctx.fill();
    for (let i = 0; i < count; i++) {
      const cy = y0 + 11 + i * gap;
      const off = ctx.createRadialGradient(x - 1, cy - 1, 0.5, x, cy, 6.2);
      off.addColorStop(0, "rgba(34,35,54,0.92)");
      off.addColorStop(0.5, "rgba(8,8,20,0.98)");
      off.addColorStop(1, "rgba(0,0,5,1)");
      ctx.fillStyle = off;
      ctx.beginPath();
      ctx.arc(x, cy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  const wave = now * profile.speed + phaseOffset;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < count; i++) {
    const cy = y0 + 11 + i * gap;
    const pulse = profile.kind === "seven"
      ? 0.76 + 0.24 * Math.sin(wave + i * 0.88)
      : profile.kind === "reach"
        ? 0.68 + 0.32 * Math.sin(wave + i * 0.62)
        : 0.78 + 0.22 * Math.sin(wave + i * 0.42);
    const color = profile.kind === "seven"
      ? `hsl(${Math.round((now * 0.22 + i * 31 + phaseOffset * 18) % 360)}, 100%, ${62 + Math.sin(wave + i) * 8}%)`
      : profile.colors[(i + Math.floor(wave * 0.55)) % profile.colors.length];
    const alpha = profile.alpha * pulse;

    ctx.globalAlpha = alpha * 0.52;
    ctx.shadowColor = color;
    ctx.shadowBlur = profile.glow;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, cy, profile.radius + 2.4, 0, Math.PI * 2);
    ctx.fill();

    const led = ctx.createRadialGradient(x - 1.2, cy - 1.4, 0.8, x, cy, profile.radius + 1.4);
    led.addColorStop(0, "#ffffff");
    led.addColorStop(0.34, color);
    led.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = alpha;
    ctx.fillStyle = led;
    ctx.beginPath();
    ctx.arc(x, cy, profile.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawReelGoldFrame(innerX, innerY, innerW, innerH, thickness) {
  const outerX = innerX - thickness;
  const outerY = innerY - thickness;
  const outerW = innerW + thickness * 2;
  const outerH = innerH + thickness * 2;
  const frame = ctx.createLinearGradient(outerX, outerY, outerX + outerW, outerY + outerH);
  frame.addColorStop(0, "#5a45b7");
  frame.addColorStop(0.16, "#d7c9ff");
  frame.addColorStop(0.34, "#8b73ff");
  frame.addColorStop(0.55, "#f2d5ff");
  frame.addColorStop(0.78, "#5d49c7");
  frame.addColorStop(1, "#c9b8ff");

  ctx.shadowColor = "rgba(48,30,120,0.68)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = frame;
  roundRect(ctx, outerX, outerY, outerW, thickness, 8);
  ctx.fill();
  roundRect(ctx, outerX, innerY + innerH, outerW, thickness, 8);
  ctx.fill();
  roundRect(ctx, outerX, innerY, thickness, innerH, 8);
  ctx.fill();
  roundRect(ctx, innerX + innerW, innerY, thickness, innerH, 8);
  ctx.fill();
  ctx.shadowColor = "transparent";

  const gloss = ctx.createLinearGradient(0, outerY, 0, outerY + thickness);
  gloss.addColorStop(0, "rgba(255,255,255,0.48)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  roundRect(ctx, outerX + 8, outerY + 6, outerW - 16, 7, 5);
  ctx.fill();
  roundRect(ctx, outerX + 8, innerY + innerH + 6, outerW - 16, 6, 5);
  ctx.fill();

  ctx.strokeStyle = "rgba(180,246,255,0.9)";
  ctx.lineWidth = 2.4;
  ctx.strokeRect(innerX - 1, innerY - 1, innerW + 2, innerH + 2);
  ctx.shadowColor = "rgba(148,108,255,0.65)";
  ctx.shadowBlur = 12;
  ctx.strokeStyle = "rgba(231,217,255,0.78)";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(outerX + 4, outerY + 4, outerW - 8, outerH - 8);
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "rgba(255,218,139,0.95)";
  drawStar(outerX + 18, outerY + outerH - 20, 7);
  drawStar(outerX + outerW - 18, outerY + 20, 7);

  ctx.save();
  ctx.beginPath();
  ctx.rect(innerX, innerY, innerW, innerH);
  ctx.clip();
  const glass = ctx.createLinearGradient(innerX, innerY, innerX + innerW, innerY + innerH);
  glass.addColorStop(0, "rgba(255,255,255,0.11)");
  glass.addColorStop(0.34, "rgba(255,255,255,0.045)");
  glass.addColorStop(0.36, "rgba(255,255,255,0)");
  glass.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glass;
  ctx.fillRect(innerX, innerY, innerW, innerH);
  ctx.restore();
}

function drawGoldFrame(x, y, w, h, r) {
  const frame = ctx.createLinearGradient(x, y, x + w, y + h);
  frame.addColorStop(0, "#4c37a8");
  frame.addColorStop(0.2, "#d5c8ff");
  frame.addColorStop(0.48, "#8f73ff");
  frame.addColorStop(0.76, "#f1d6ff");
  frame.addColorStop(1, "#5f4ac6");
  ctx.lineWidth = 7;
  ctx.strokeStyle = frame;
  roundRect(ctx, x + 3.5, y + 3.5, w - 7, h - 7, r);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(182,246,255,0.72)";
  roundRect(ctx, x + 11, y + 11, w - 22, h - 22, Math.max(4, r - 5));
  ctx.stroke();
  ctx.fillStyle = "rgba(255,221,142,0.9)";
  drawStar(x + 32, y + h - 28, 8);
  drawStar(x + w - 32, y + 28, 8);
}

function drawGem(x, y, r, color) {
  const gem = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, 1, x, y, r);
  gem.addColorStop(0, "#ffffff");
  gem.addColorStop(0.24, color);
  gem.addColorStop(1, "#07142d");
  ctx.fillStyle = gem;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 4;
    const rr = i % 2 === 0 ? r : r * 0.72;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,235,150,0.75)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function drawCrystalStar(x, y, r) {
  ctx.save();
  ctx.globalAlpha = 0.86;
  const crystal = ctx.createRadialGradient(x - r * 0.28, y - r * 0.35, 2, x, y, r);
  crystal.addColorStop(0, "#ffffff");
  crystal.addColorStop(0.32, "#c7f8ff");
  crystal.addColorStop(0.7, "#b9a4ff");
  crystal.addColorStop(1, "rgba(112,88,210,0.42)");
  ctx.fillStyle = crystal;
  ctx.shadowColor = "rgba(182,246,255,0.72)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 === 0 ? r : r * 0.46;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(255,255,255,0.74)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawStar(x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 === 0 ? r : r * 0.38;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function starPath(x, y, outerR, innerR = outerR * 0.42) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 === 0 ? outerR : innerR;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawHoldStar(x, y, active) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const frameGrad = ctx.createRadialGradient(x - 5, y - 8, 2, x, y, 22);
  frameGrad.addColorStop(0, active ? "#fff8d8" : "rgba(255,255,255,0.62)");
  frameGrad.addColorStop(0.42, active ? "#ffd947" : "rgba(196,180,255,0.56)");
  frameGrad.addColorStop(1, active ? "#d88912" : "rgba(75,58,160,0.7)");
  ctx.shadowColor = active ? "rgba(255,212,55,0.92)" : "rgba(148,119,255,0.45)";
  ctx.shadowBlur = active ? 14 : 5;
  ctx.fillStyle = frameGrad;
  starPath(x, y, 17.5, 8.6);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.lineWidth = active ? 5.2 : 4.5;
  ctx.strokeStyle = active ? "rgba(255,255,230,0.96)" : "rgba(229,218,255,0.78)";
  ctx.stroke();

  if (active) {
    const coreGrad = ctx.createRadialGradient(x - 3, y - 5, 1, x, y, 12);
    coreGrad.addColorStop(0, "#ffffff");
    coreGrad.addColorStop(0.34, "#fff27b");
    coreGrad.addColorStop(1, "#ffab12");
    ctx.fillStyle = coreGrad;
    ctx.shadowColor = "rgba(255,230,90,0.75)";
    ctx.shadowBlur = 8;
    starPath(x, y, 10.8, 5.4);
    ctx.fill();
  } else {
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = "rgba(13,11,45,0.74)";
    starPath(x, y, 9.5, 4.7);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlanet(x, y, r) {
  const body = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, 1, x, y, r);
  body.addColorStop(0, "#ffffff");
  body.addColorStop(0.32, "#8eeaff");
  body.addColorStop(1, "#5b66ff");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.35);
  ctx.strokeStyle = "rgba(229,220,255,0.92)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.9, r * 0.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawCloud(x, y, w, h) {
  ctx.save();
  const cloud = ctx.createLinearGradient(0, y - h, 0, y + h);
  cloud.addColorStop(0, "rgba(246,241,255,0.86)");
  cloud.addColorStop(1, "rgba(181,168,255,0.58)");
  ctx.fillStyle = cloud;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.18, y, w * 0.22, h * 0.8, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.42, y - h * 0.15, w * 0.28, h, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.7, y, w * 0.3, h * 0.82, 0, 0, Math.PI * 2);
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.restore();
}

function drawSideLeds(x, y, h) {
  const statusHot = state.result?.reach && state.status === "spinning";
  const colors = state.mode === RUSH
    ? ["#fff6a4", "#ffd76c", "#ff9bdf"]
    : statusHot
      ? ["#ff74ce", "#ff4f94", "#ffd76c"]
      : ["#aef7ff", "#8d79ff", "#ff9de8"];
  const rail = ctx.createLinearGradient(x - 2, y, x + 14, y);
  rail.addColorStop(0, "rgba(255,255,255,0.3)");
  rail.addColorStop(0.35, "rgba(255,255,255,0.58)");
  rail.addColorStop(1, "rgba(116,88,218,0.58)");
  ctx.fillStyle = rail;
  roundRect(ctx, x - 3, y - 8, 18, h + 16, 9);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.36)";
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const cy = y + 18 + i * ((h - 36) / 11);
    const color = colors[i % colors.length];
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    const led = ctx.createRadialGradient(x + 6, cy, 1, x + 6, cy, 7);
    led.addColorStop(0, "#fff");
    led.addColorStop(0.35, color);
    led.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = led;
    ctx.beginPath();
    ctx.arc(x + 6, cy, 5.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowColor = "transparent";
}

function drawImageCover(img, x, y, w, h) {
  if (!img) return;
  const sourceW = img.videoWidth || img.naturalWidth || img.width;
  const sourceH = img.videoHeight || img.naturalHeight || img.height;
  if (!sourceW || !sourceH) return;
  const scale = Math.max(w / sourceW, h / sourceH);
  const drawW = sourceW * scale;
  const drawH = sourceH * scale;
  ctx.drawImage(img, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH);
}

function drawImageContain(img, x, y, w, h) {
  if (!img) return;
  const sourceW = img.videoWidth || img.naturalWidth || img.width;
  const sourceH = img.videoHeight || img.naturalHeight || img.height;
  if (!sourceW || !sourceH) return;
  const scale = Math.min(w / sourceW, h / sourceH);
  const drawW = sourceW * scale;
  const drawH = sourceH * scale;
  ctx.drawImage(img, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH);
}

function positionPuchunVideo() {
  if (!puchunVideo) return;
  puchunVideo.style.left = `${(SETTINGS.reelWindowX / DESIGN_W) * 100}%`;
  puchunVideo.style.top = `${(SETTINGS.reelWindowY / DESIGN_H) * 100}%`;
  puchunVideo.style.width = `${(SETTINGS.reelWindowW / DESIGN_W) * 100}%`;
  puchunVideo.style.height = `${(SETTINGS.reelWindowH / DESIGN_H) * 100}%`;
}

function showPuchunVideo() {
  if (!puchunVideo) return;
  positionPuchunVideo();
  puchunVideo.classList.add("is-visible");
  puchunVideo.setAttribute("aria-hidden", "false");
}

function hidePuchunVideo(reset = false) {
  if (!puchunVideo) return;
  puchunVideo.classList.remove("is-visible");
  puchunVideo.setAttribute("aria-hidden", "true");
  if (reset) {
    puchunVideo.pause();
    try {
      puchunVideo.currentTime = 0;
    } catch (_) {}
  }
}

function effectImageSize(img, maxW, maxH, scale = 1) {
  const fit = Math.min(maxW / img.width, maxH / img.height) * scale;
  return { w: img.width * fit, h: img.height * fit };
}

function createRenderSurface() {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(DESIGN_W, DESIGN_H);
  }
  const surface = document.createElement("canvas");
  surface.width = DESIGN_W;
  surface.height = DESIGN_H;
  return surface;
}

function drawIntoSurface(surface, draw) {
  const previousCtx = ctx;
  const surfaceCtx = surface.getContext("2d");
  ctx = surfaceCtx;
  ctx.clearRect(0, 0, DESIGN_W, DESIGN_H);
  try {
    draw();
  } finally {
    ctx = previousCtx;
  }
}

function makeCachedSurface(draw) {
  const surface = createRenderSurface();
  drawIntoSurface(surface, draw);
  return surface;
}

function rebuildRenderCache() {
  renderCache.baseByMode.set(NORMAL, makeCachedSurface(() => {
    drawBackgroundForMode(NORMAL);
    drawCabinetShell();
    drawReelMaskForMode(NORMAL);
  }));
  renderCache.baseByMode.set(RUSH, makeCachedSurface(() => {
    drawBackgroundForMode(RUSH);
    drawCabinetShell();
    drawReelMaskForMode(RUSH);
  }));
  renderCache.boardStatic = makeCachedSurface(drawPachinkoBoardStatic);
  renderCache.chrome = makeCachedSurface(drawCabinetChrome);
  renderCache.dirty = false;
}

function ensureRenderCache() {
  if (renderCache.dirty) rebuildRenderCache();
}

function animationFrameAt(frames, startedAt, fps, loop = false) {
  if (!frames.length || !startedAt) return null;
  const elapsed = Math.max(0, performance.now() - startedAt);
  const rawIndex = Math.floor((elapsed / 1000) * fps);
  const index = loop ? rawIndex % frames.length : Math.min(frames.length - 1, rawIndex);
  return frames[index] || null;
}

function drawReelWindowBackground(frameX, frameY, frameW, frameH, mode = state.mode) {
  const bg = mode === RUSH ? assets.backgroundRush : assets.backgroundNormal;
  if (!bg) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(frameX, frameY, frameW, frameH);
  ctx.clip();
  drawImageCover(bg, frameX, frameY, frameW, frameH);
  ctx.restore();
}

function drawHud() {
  const seconds = Math.ceil(state.remainingMs / 1000);
  ctx.save();
  const panel = ctx.createLinearGradient(0, 0, 0, 92);
  panel.addColorStop(0, "#37248a");
  panel.addColorStop(0.3, "#111543");
  panel.addColorStop(0.7, "#15113d");
  panel.addColorStop(1, "#5f4ec7");
  ctx.fillStyle = panel;
  ctx.fillRect(0, 0, DESIGN_W, 92);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (let i = 0; i < 16; i++) {
    drawStar((i * 41 + 24) % DESIGN_W, 9 + ((i * 17) % 66), 1.8 + (i % 3) * 0.6);
  }

  ctx.strokeStyle = "rgba(196,178,255,0.78)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 90);
  ctx.lineTo(DESIGN_W, 90);
  ctx.stroke();

  ctx.font = "900 14px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(142,236,255,0.82)";
  ctx.shadowBlur = 8;
  const leftHudX = 40;
  const leftValueX = 96;
  ctx.fillText("TIME", leftHudX, 30);
  ctx.shadowColor = "rgba(255,121,218,0.86)";
  ctx.fillText("POINT", leftHudX, 63);
  ctx.shadowBlur = 0;

  ctx.font = "900 25px ui-monospace, SFMono-Regular, Consolas, monospace";
  ctx.fillStyle = "#d8f8ff";
  ctx.shadowColor = "rgba(139,236,255,0.9)";
  ctx.shadowBlur = 10;
  ctx.fillText(String(seconds).padStart(3, "0"), leftValueX, 32);
  ctx.fillStyle = "#ffd4ff";
  ctx.shadowColor = "rgba(255,91,205,0.9)";
  ctx.fillText(String(state.points), leftValueX, 66);

  ctx.shadowBlur = 0;
  ctx.textAlign = "center";
  ctx.globalAlpha = 0.82;
  drawPlanet(DESIGN_W / 2, 15, 30);
  ctx.globalAlpha = 1;
  ctx.font = "900 25px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(63,50,145,0.9)";
  ctx.lineWidth = 3;
  ctx.shadowColor = "rgba(177,171,255,0.9)";
  ctx.shadowBlur = 9;
  ctx.strokeText("GRAVITY", DESIGN_W / 2, 48);
  ctx.fillText("GRAVITY", DESIGN_W / 2, 48);
  ctx.shadowBlur = 0;
  ctx.font = "700 9px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("つながる想い、つながる宇宙。", DESIGN_W / 2, 64);

  ctx.textAlign = "right";
  const modeX = DESIGN_W - 150;
  const modeY = 18;
  const modeW = 112;
  const modeH = 31;
  const modeGrad = ctx.createLinearGradient(modeX, modeY, modeX + modeW, modeY + modeH);
  if (state.mode === RUSH) {
    modeGrad.addColorStop(0, "#6a3dd8");
    modeGrad.addColorStop(0.5, "#ffe89b");
    modeGrad.addColorStop(1, "#ff88d8");
  } else {
    modeGrad.addColorStop(0, "#261a78");
    modeGrad.addColorStop(0.5, "#5c7dff");
    modeGrad.addColorStop(1, "#7d4cff");
  }
  ctx.fillStyle = modeGrad;
  roundRect(ctx, modeX, modeY, modeW, modeH, 6);
  ctx.fill();
  ctx.strokeStyle = "#d9c8ff";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = "900 18px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = state.mode === RUSH ? "rgba(255,217,220,0.9)" : "rgba(150,233,255,0.9)";
  ctx.shadowBlur = 10;
  ctx.fillText(state.mode, modeX + modeW - 10, 40);
  ctx.shadowBlur = 0;

  const showRushStreak = state.mode === RUSH;
  if (showRushStreak) {
    const streakX = modeX + 8;
    const streakY = modeY + modeH + 5;
    const streakW = modeW - 16;
    const streakH = 17;
    const streakGrad = ctx.createLinearGradient(streakX, streakY, streakX + streakW, streakY + streakH);
    streakGrad.addColorStop(0, "rgba(255,236,132,0.95)");
    streakGrad.addColorStop(0.55, "rgba(255,105,210,0.88)");
    streakGrad.addColorStop(1, "rgba(119,226,255,0.9)");
    ctx.fillStyle = streakGrad;
    ctx.shadowColor = "rgba(255,106,221,0.65)";
    ctx.shadowBlur = 8;
    roundRect(ctx, streakX, streakY, streakW, streakH, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.font = "900 11px system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(31,14,95,0.9)";
    ctx.shadowBlur = 4;
    ctx.fillText(`RUSH ${Math.max(0, state.rushStreak)}\u9023`, streakX + streakW / 2, streakY + 12);
    ctx.shadowBlur = 0;
    ctx.textAlign = "right";
  }

  ctx.font = "800 11px system-ui, sans-serif";
  ctx.fillStyle = "rgba(235,226,255,0.82)";
  ctx.fillText("HTML PORT", modeX + modeW - 8, showRushStreak ? 86 : 70);
  ctx.restore();
}

function drawHeaderHud() {
  const seconds = Math.ceil(state.remainingMs / 1000);
  const hud = HEADER_HUD_LAYOUT;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, DESIGN_W, 92);
  ctx.clip();
  if (assets.headerPanelBackground) {
    ctx.globalAlpha = 1;
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.filter = "none";
    drawImageCover(assets.headerPanelBackground, 0, 0, DESIGN_W, 92);
  } else {
    const panel = ctx.createLinearGradient(0, 0, 0, 92);
    panel.addColorStop(0, "#37248a");
    panel.addColorStop(0.3, "#111543");
    panel.addColorStop(0.7, "#15113d");
    panel.addColorStop(1, "#5f4ec7");
    ctx.fillStyle = panel;
    ctx.fillRect(0, 0, DESIGN_W, 92);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    for (let i = 0; i < 16; i++) {
      drawStar((i * 41 + 24) % DESIGN_W, 9 + ((i * 17) % 66), 1.8 + (i % 3) * 0.6);
    }
  }

  ctx.strokeStyle = "rgba(196,178,255,0.78)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 90);
  ctx.lineTo(DESIGN_W, 90);
  ctx.stroke();

  if (assets.titleLogo) {
    ctx.save();
    ctx.shadowColor = "rgba(190,168,255,0.78)";
    ctx.shadowBlur = 12;
    drawImageContain(assets.titleLogo, hud.logo.x, hud.logo.y, hud.logo.w, hud.logo.h);
    ctx.restore();
  }

  ctx.textAlign = "left";
  ctx.font = "900 13px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(142,236,255,0.82)";
  ctx.shadowBlur = 8;
  ctx.fillText("TIME", hud.time.x, hud.time.labelY);
  ctx.shadowBlur = 0;
  ctx.font = "900 24px ui-monospace, SFMono-Regular, Consolas, monospace";
  ctx.fillStyle = "#d8f8ff";
  ctx.shadowColor = "rgba(139,236,255,0.9)";
  ctx.shadowBlur = 10;
  ctx.fillText(String(seconds).padStart(3, "0"), hud.time.x, hud.time.valueY);

  ctx.textAlign = "right";
  const pointX = DESIGN_W - hud.point.right;
  ctx.font = "900 13px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(255,121,218,0.86)";
  ctx.shadowBlur = 8;
  ctx.fillText("POINT", pointX, hud.point.labelY);
  ctx.shadowBlur = 0;
  ctx.font = "900 24px ui-monospace, SFMono-Regular, Consolas, monospace";
  ctx.fillStyle = "#ffd4ff";
  ctx.shadowColor = "rgba(255,91,205,0.9)";
  ctx.shadowBlur = 10;
  ctx.fillText(String(state.points), pointX, hud.point.valueY);
  ctx.restore();
}

function drawReelMask() {
  drawReelMaskForMode(state.mode);
}

function drawReelMaskForMode(mode) {
  ctx.save();
  const frameX = SETTINGS.reelWindowX;
  const frameY = SETTINGS.reelWindowY;
  const frameW = SETTINGS.reelWindowW;
  const frameH = SETTINGS.reelWindowH;
  const grad = ctx.createLinearGradient(0, frameY, 0, frameY + frameH);
  grad.addColorStop(0, "rgba(0,0,0,0.72)");
  grad.addColorStop(0.18, "rgba(255,255,255,0)");
  grad.addColorStop(0.76, "rgba(255,255,255,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.82)");
  ctx.fillStyle = "rgba(0,0,0,0.76)";
  ctx.fillRect(0, 92, DESIGN_W, frameY - 92);
  drawReelWindowBackground(frameX, frameY, frameW, frameH, mode);
  const glow = ctx.createRadialGradient(frameX + frameW / 2, frameY + frameH / 2, 10, frameX + frameW / 2, frameY + frameH / 2, frameW * 0.55);
  glow.addColorStop(0, "rgba(170,230,255,0.16)");
  glow.addColorStop(0.42, "rgba(139,96,255,0.08)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(frameX, frameY, frameW, frameH);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  for (let i = 0; i < 26; i++) {
    const x = frameX + ((i * 61 + 13) % frameW);
    const y = frameY + ((i * 37 + 21) % frameH);
    drawStar(x, y, 1.4 + (i % 3) * 0.5);
  }
  for (const gx of [frameX + frameW * 0.2, frameX + frameW * 0.5, frameX + frameW * 0.8]) {
    const aura = ctx.createRadialGradient(gx, frameY + frameH * 0.5, 20, gx, frameY + frameH * 0.5, 86);
    aura.addColorStop(0, "rgba(255,255,255,0.08)");
    aura.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = aura;
    ctx.fillRect(gx - 90, frameY, 180, frameH);
  }
  ctx.fillStyle = "rgba(1,3,8,0.06)";
  ctx.fillRect(frameX, frameY, frameW, frameH);
  ctx.fillStyle = grad;
  ctx.fillRect(frameX, frameY, frameW, frameH);
  ctx.fillStyle = "rgba(0,0,0,0.82)";
  ctx.fillRect(0, frameY + frameH, DESIGN_W, 132);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(frameX, frameY + frameH);
  ctx.lineTo(frameX + frameW, frameY + frameH);
  ctx.stroke();
  ctx.restore();
}

function clipPlayfield() {
  ctx.beginPath();
  ctx.rect(SETTINGS.reelWindowX, SETTINGS.reelWindowY, SETTINGS.reelWindowW, SETTINGS.reelWindowH);
  ctx.clip();
}

function drawPachinkoBoard() {
  drawPachinkoBoardStatic();
  drawPachinkoBoardDynamic();
}

function drawPachinkoBoardStatic() {
  ctx.save();
  const top = SETTINGS.plinkoTop;
  const bottom = SETTINGS.plinkoBottom;
  const boardY = top - 28;
  const boardH = bottom - top + 64;
  if (assets.plinkoBackground) {
    ctx.globalAlpha = 1;
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.filter = "none";
    drawImageCover(assets.plinkoBackground, 0, boardY, DESIGN_W, boardH);
  } else {
    const bg = ctx.createRadialGradient(DESIGN_W / 2, top + 52, 20, DESIGN_W / 2, top + 120, 260);
    bg.addColorStop(0, "rgba(57,48,132,0.95)");
    bg.addColorStop(0.45, "rgba(18,20,66,0.92)");
    bg.addColorStop(1, "rgba(8,8,40,0.96)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, boardY, DESIGN_W, boardH);

    ctx.fillStyle = "rgba(255,255,255,0.78)";
    for (let i = 0; i < 24; i++) {
      const x = (i * 67 + 23) % DESIGN_W;
      const y = top - 8 + ((i * 41) % 216);
      ctx.globalAlpha = 0.28 + (i % 4) * 0.12;
      drawStar(x, y, 2.2 + (i % 3));
    }
    ctx.globalAlpha = 1;
    drawPlanet(78, bottom - 42, 40);
    drawPlanet(DESIGN_W - 86, top + 38, 30);
    drawCloud(34, bottom - 10, 118, 28);
    drawCloud(DESIGN_W - 154, bottom - 8, 132, 30);

    ctx.strokeStyle = "rgba(200,185,255,0.28)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(34, top - 8);
    ctx.lineTo(34, bottom - 8);
    ctx.moveTo(DESIGN_W - 34, top - 8);
    ctx.lineTo(DESIGN_W - 34, bottom - 8);
    ctx.stroke();
  }

  for (const pin of PLINKO_PINS) {
    const shine = ctx.createRadialGradient(pin.x - 1.5, pin.y - 1.5, 0.8, pin.x, pin.y, 6);
    shine.addColorStop(0, "#fff8d6");
    shine.addColorStop(0.35, "#f6c95f");
    shine.addColorStop(1, "#7d4b18");
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.arc(pin.x, pin.y, pin.r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawStartPocketBack();
  ctx.restore();
}

function drawPachinkoBoardDynamic() {
  ctx.save();
  const holdY = 735;
  const holdGap = 30;
  const holdStartX = DESIGN_W - 146;
  for (let i = 0; i < SETTINGS.maxHolds; i++) {
    const x = holdStartX + i * holdGap;
    const active = i < state.holds;
    drawHoldStar(x, holdY, active);
  }

  for (const ball of state.balls) {
    const grad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.r + 2);
    grad.addColorStop(0, "#fffdf0");
    grad.addColorStop(0.38, "#f7d77a");
    grad.addColorStop(1, "#9a5f18");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawStartPocketFront();
  ctx.restore();
}

function drawStartPocketBack() {
  const hx = SETTINGS.heSoX;
  const y = SETTINGS.startPocketY;
  const w = SETTINGS.startPocketW;
  const h = SETTINGS.startPocketH;

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "900 8px system-ui, sans-serif";
  ctx.fillStyle = "#fff8dc";
  ctx.shadowColor = "rgba(255,213,96,0.82)";
  ctx.shadowBlur = 6;
  ctx.fillText("START", hx, y - 5);

  if (assets.startPocket) {
    ctx.shadowColor = "rgba(185,98,255,0.9)";
    ctx.shadowBlur = 15;
    ctx.drawImage(assets.startPocket, hx - w / 2, y, w, h);
  } else {
    const cup = ctx.createLinearGradient(hx - 18, y + 12, hx + 18, y + 40);
    cup.addColorStop(0, "#fff3ba");
    cup.addColorStop(0.42, "#ffb229");
    cup.addColorStop(1, "#5e230b");
    ctx.fillStyle = cup;
    roundRect(ctx, hx - 20, y + 16, 40, 24, 7);
    ctx.fill();
  }
  ctx.restore();
}

function drawStartPocketFront() {
  const hx = SETTINGS.heSoX;
  const y = SETTINGS.startPocketY;
  const w = SETTINGS.startPocketW;
  const h = SETTINGS.startPocketH;
  const x = hx - w / 2;

  ctx.save();
  if (assets.startPocket) {
    ctx.beginPath();
    ctx.rect(x - 4, y + h * 0.43, w + 8, h * 0.62);
    ctx.clip();
    ctx.shadowColor = "rgba(185,98,255,0.72)";
    ctx.shadowBlur = 10;
    ctx.drawImage(assets.startPocket, x, y, w, h);
  } else {
    const cover = ctx.createLinearGradient(hx - 18, y + h * 0.48, hx + 18, y + h);
    cover.addColorStop(0, "#cfa0ff");
    cover.addColorStop(1, "#7b35c8");
    ctx.fillStyle = cover;
    roundRect(ctx, hx - 18, y + h * 0.56, 36, h * 0.32, 6);
    ctx.fill();
  }
  ctx.restore();
}

function drawLowerPanels(now) {
  ctx.save();
  const retryReady = state.status === "result" && !!state.resultPresentation?.restartReady;
  const rushLabel = state.mode === RUSH ? `RUSH ×${Math.max(1, state.rushStreak)}` : "";
  drawLowerInfoPanel(
    RETRY_PANEL_BOUNDS.x,
    RETRY_PANEL_BOUNDS.y,
    RETRY_PANEL_BOUNDS.w,
    RETRY_PANEL_BOUNDS.h,
    retryReady ? "" : rushLabel,
    false,
  );
  if (retryReady) drawRetryPanelLabel(now);
  drawSoundTogglePanel();
  drawPushPedestal(DESIGN_W / 2, 824);
  ctx.restore();
}

function retryLabelStartedAt() {
  const presentation = state.resultPresentation;
  return presentation.start
    + SETTINGS.resultEndMs
    + SETTINGS.resultDarkenMs
    + SETTINGS.resultRowDelayMs * 2
    + SETTINGS.resultRestartDelayMs;
}

function drawRetryPanelLabel(now) {
  const startedAt = retryLabelStartedAt();
  if (assets.retry) {
    const localT = clamp01((now - startedAt) / 420);
    if (localT <= 0) return;
    const alpha = localT < 1 ? easeOutCubic(localT) : 1;
    const pop = 0.92 + alpha * 0.08;
    const { x, y, w, h } = RETRY_PANEL_BOUNDS;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + w / 2, y + h / 2 + 1);
    ctx.scale(pop, pop);
    drawImageContain(assets.retry, -w * 0.47, -h * 0.36, w * 0.94, h * 0.72);
    ctx.restore();
    return;
  }

  const retryFont = "800 22px '\u3042\u3093\u305a\u3082\u3058', 'AnzuMojI', 'AnzuMojI04', Meiryo, sans-serif";
  drawResultRow(
    "リトライ",
    RETRY_PANEL_BOUNDS.x + RETRY_PANEL_BOUNDS.w / 2,
    RETRY_PANEL_BOUNDS.y + RETRY_PANEL_BOUNDS.h / 2 + 1,
    retryFont,
    "#ffffff",
    startedAt,
    now,
  );
}

function drawSoundTogglePanel() {
  const { x, y, w, h } = SOUND_TOGGLE_BOUNDS;
  const enabled = audio.enabled;
  drawSoundPanelBase(x, y, w, h, enabled);
  drawSpeakerIcon(x + w / 2, y + h / 2, enabled);
}

function drawSpeakerIcon(x, y, enabled) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = enabled ? "#ffffff" : "rgba(125,142,168,0.62)";
  ctx.fillStyle = enabled ? "#ffffff" : "rgba(125,142,168,0.62)";
  ctx.shadowColor = enabled ? "rgba(165,242,255,0.95)" : "transparent";
  ctx.shadowBlur = enabled ? 18 : 0;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(x - 16, y - 7);
  ctx.lineTo(x - 8, y - 7);
  ctx.lineTo(x + 3, y - 16);
  ctx.lineTo(x + 3, y + 16);
  ctx.lineTo(x - 8, y + 7);
  ctx.lineTo(x - 16, y + 7);
  ctx.closePath();
  ctx.fill();

  if (enabled) {
    ctx.beginPath();
    ctx.arc(x + 7, y, 8, -0.72, 0.72);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 9, y, 14, -0.68, 0.68);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x + 9, y - 10);
    ctx.lineTo(x + 24, y + 10);
    ctx.moveTo(x + 24, y - 10);
    ctx.lineTo(x + 9, y + 10);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSoundPanelBase(x, y, w, h, enabled) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 20);
  ctx.clip();
  if (enabled && assets.headerPanelBackground) {
    drawImageCover(assets.headerPanelBackground, x, y, w, h);
    const lift = ctx.createLinearGradient(0, y, 0, y + h);
    lift.addColorStop(0, "rgba(238,226,255,0.68)");
    lift.addColorStop(0.5, "rgba(188,236,255,0.4)");
    lift.addColorStop(1, "rgba(255,255,255,0.34)");
    ctx.fillStyle = lift;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(185,224,255,0.18)";
    roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 16);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.fillRect(x + 8, y + 5, w - 16, 6);
  } else {
    const panel = ctx.createLinearGradient(0, y, 0, y + h);
    panel.addColorStop(0, "#101323");
    panel.addColorStop(1, "#050713");
    ctx.fillStyle = panel;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(12,18,34,0.62)";
    roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 16);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, 20);
  ctx.shadowColor = enabled ? "rgba(151,118,255,0.62)" : "transparent";
  ctx.shadowBlur = enabled ? 9 : 0;
  ctx.strokeStyle = enabled ? "rgba(189,169,255,0.86)" : "rgba(62,72,93,0.72)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawLowerInfoPanel(x, y, w, h, label, hot = false) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 20);
  ctx.clip();
  if (assets.headerPanelBackground) {
    ctx.globalAlpha = 1;
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.filter = "none";
    drawImageCover(assets.headerPanelBackground, x, y, w, h);
    const lift = ctx.createLinearGradient(0, y, 0, y + h);
    lift.addColorStop(0, hot ? "rgba(255,246,180,0.72)" : "rgba(238,226,255,0.68)");
    lift.addColorStop(0.5, hot ? "rgba(255,203,92,0.44)" : "rgba(188,236,255,0.4)");
    lift.addColorStop(1, "rgba(255,255,255,0.34)");
    ctx.fillStyle = lift;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = hot ? "rgba(255,245,164,0.18)" : "rgba(185,224,255,0.18)";
    roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 16);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.fillRect(x + 8, y + 5, w - 16, 6);
  } else {
    const panel = ctx.createLinearGradient(0, y, 0, y + h);
    panel.addColorStop(0, "#17164d");
    panel.addColorStop(1, "#090a2a");
    ctx.fillStyle = panel;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, 20);
  ctx.shadowColor = hot ? "rgba(255,207,91,0.72)" : "rgba(151,118,255,0.62)";
  ctx.shadowBlur = 9;
  ctx.strokeStyle = hot ? "rgba(255,232,136,0.9)" : "rgba(189,169,255,0.86)";
  ctx.lineWidth = 2;
  ctx.stroke();

  if (label) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = hot ? "900 21px system-ui, sans-serif" : "900 23px system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = hot ? "rgba(255,232,92,1)" : "rgba(165,242,255,1)";
    ctx.shadowBlur = 22;
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(38,16,92,0.9)";
    ctx.strokeText(label, x + w / 2, y + h / 2 + 1);
    ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  }
  ctx.restore();
}

function drawSpacePanel(x, y, w, h, type) {
  const panel = ctx.createLinearGradient(0, y, 0, y + h);
  panel.addColorStop(0, "#17164d");
  panel.addColorStop(1, "#090a2a");
  ctx.fillStyle = panel;
  roundRect(ctx, x, y, w, h, 20);
  ctx.fill();
  ctx.shadowColor = "rgba(151,118,255,0.7)";
  ctx.shadowBlur = 10;
  ctx.strokeStyle = "rgba(189,169,255,0.9)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  for (let i = 0; i < 9; i++) drawStar(x + 14 + ((i * 23) % (w - 28)), y + 12 + ((i * 19) % 36), 2.4);
  drawCloud(x + 8, y + h - 12, w * 0.58, 12);
  if (type === "planet") {
    drawPlanet(x + w * 0.48, y + h * 0.42, 15);
  } else {
    drawRocket(x + w * 0.48, y + h * 0.38, 0.72);
    ctx.strokeStyle = "rgba(118,225,255,0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 30, y + 22);
    ctx.lineTo(x + 70, y + 10);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const lx = x + 28 + i * 21;
    ctx.fillStyle = i % 2 ? "#ff8ce6" : "#bdf5ff";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    drawStar(lx, y + h - 12, 5);
  }
  ctx.shadowColor = "transparent";
}

function drawRocket(x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.55);
  ctx.scale(s, s);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.quadraticCurveTo(17, -6, 7, 20);
  ctx.lineTo(-7, 20);
  ctx.quadraticCurveTo(-17, -6, 0, -22);
  ctx.fill();
  ctx.fillStyle = "#ff6aaa";
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.quadraticCurveTo(8, -14, 9, -8);
  ctx.lineTo(-9, -8);
  ctx.quadraticCurveTo(-8, -14, 0, -22);
  ctx.fill();
  ctx.fillStyle = "#47bfff";
  ctx.beginPath();
  ctx.arc(0, -2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffcc6a";
  ctx.beginPath();
  ctx.moveTo(-5, 20);
  ctx.lineTo(0, 31);
  ctx.lineTo(5, 20);
  ctx.fill();
  ctx.restore();
}

function drawPushPedestal(x, y) {
  ctx.save();
  const base = ctx.createRadialGradient(x, y + 8, 16, x, y + 8, 116);
  base.addColorStop(0, "rgba(255,255,255,0.38)");
  base.addColorStop(0.44, "rgba(154,132,255,0.64)");
  base.addColorStop(1, "rgba(57,36,150,0)");
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.ellipse(x, y + 7, 120, 34, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "rgba(255,225,141,0.9)";
  for (let i = 0; i < 13; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    drawStar(x + Math.cos(a) * 95, y + 8 + Math.sin(a) * 28, 4 + (i % 3));
  }
  ctx.restore();
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawSymbol(img, x, y, size, flipT, alpha = 1) {
  if (!img) return;
  const phase = Math.sin(flipT * Math.PI);
  const scaleX = Math.abs(Math.cos(flipT * Math.PI));
  const lift = phase * 8;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y - lift);
  ctx.scale(Math.max(0.04, scaleX), 1);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawPromotionSeven(reel, x, y) {
  const img = assets.front.get(7);
  if (!img) return;
  const effect = state.freezePromotion;
  const age = effect?.pulseStart ? performance.now() - effect.pulseStart : 0;
  const pulse = 1 + Math.sin(age * 0.026) * 0.045 + Math.sin(age * 0.071) * 0.018;
  const shine = 0.65 + 0.35 * Math.sin(age * 0.032 + reel.index);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.35 + shine * 0.25;
  const glow = ctx.createRadialGradient(x, y, 16, x, y, SETTINGS.symbolSize * 0.78);
  glow.addColorStop(0, "rgba(255,245,140,0.42)");
  glow.addColorStop(0.48, "rgba(255,79,210,0.2)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, SETTINGS.symbolSize * 0.78, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.shadowColor = "rgba(255,231,112,0.95)";
  ctx.shadowBlur = 24 + shine * 16;
  drawSymbol(img, x, y, SETTINGS.symbolSize * pulse, 0, 1);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = shine * 0.72;
  ctx.fillStyle = "#fff6a4";
  for (let i = 0; i < 4; i++) {
    const a = age * 0.003 + i * Math.PI * 0.5 + reel.index * 0.4;
    drawStar(x + Math.cos(a) * SETTINGS.symbolSize * 0.43, y + Math.sin(a) * SETTINGS.symbolSize * 0.36, 3.5 + i % 2);
  }
  ctx.restore();
}

function drawReel(reel) {
  ctx.save();
  clipPlayfield();

  const shakeX = reel.shake ? Math.sin(performance.now() * 0.09) * 4 * easeOutBack(reel.shake) : 0;
  if (state.freezePromotion?.stage === "seven") {
    drawPromotionSeven(reel, reel.x + shakeX, reel.y + reel.lift);
    ctx.restore();
    return;
  }
  const faceFront = reel.flipT < 0.5;
  const strip = faceFront ? assets.stripFront : assets.stripBack;
  const alpha = !reel.stopped && !reel.stopping ? 0.18 : reel.stopping ? 1 : 1;
  drawStrip(strip, reel.x + shakeX, reel.y + reel.lift, reel.offset, reel.flipT, reel.blur, reel.squash, alpha);

  ctx.restore();
}

function mod(n, d) {
  return ((n % d) + d) % d;
}

function modFloat(n, d) {
  return ((n % d) + d) % d;
}

function symbolToStripIndex(symbol) {
  return 9 - symbol;
}

function easeOutElasticLite(t) {
  if (t === 0 || t === 1) return t;
  return 1 - Math.pow(2, -8 * t) * Math.cos(t * Math.PI * 3.4);
}

function easeOutBackLite(t) {
  const c1 = 1.15;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function drawStrip(strip, x, centerY, offsetCells, flipT, blur = 0, squash = 0, alpha = 1) {
  if (!strip) return;
  const scaleX = Math.max(0.04, Math.abs(Math.cos(flipT * Math.PI)));
  const displayW = SETTINGS.reelW;
  const displayCellH = SETTINGS.cellH;
  const displayStripH = displayCellH * SYMBOLS.length;
  const displayH = displayStripH;
  const top = centerY - (offsetCells + 0.5) * displayCellH;
  const normalizedTop = top + Math.floor((DESIGN_H - top) / displayStripH) * displayStripH;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, centerY);
  ctx.scale(scaleX * (1 + Math.abs(squash) * 0.65), 1 + squash);
  ctx.translate(0, -centerY);
  if (blur > 0.08) {
    ctx.globalAlpha = alpha * Math.min(0.36, blur * 1.15);
    for (const smear of [-0.34, -0.18, 0.18, 0.34]) {
      for (let y = normalizedTop - displayStripH + smear * displayCellH; y < DESIGN_H + displayStripH; y += displayStripH) {
        ctx.drawImage(strip, -displayW / 2, y, displayW, displayH);
      }
    }
    ctx.globalAlpha = alpha;
  }
  for (let y = normalizedTop - displayStripH; y < DESIGN_H + displayStripH; y += displayStripH) {
    ctx.drawImage(strip, -displayW / 2, y, displayW, displayH);
  }
  ctx.restore();
}

function drawParticles() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of state.particles) {
    const t = 1 - p.age / p.life;
    ctx.globalAlpha = clamp01(t);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCrowdForecast(now) {
  const forecast = state.crowdForecast;
  const img = assets.crowdForecast;
  if (!forecast || !img) return;

  const t = clamp01((now - forecast.start) / forecast.duration);
  const eased = easeOutCubic(t);
  const windowTop = SETTINGS.reelWindowY;
  const windowBottom = SETTINGS.reelWindowY + SETTINGS.reelWindowH;

  ctx.save();
  ctx.beginPath();
  ctx.rect(SETTINGS.reelWindowX, windowTop, SETTINGS.reelWindowW, SETTINGS.reelWindowH);
  ctx.clip();
  ctx.globalCompositeOperation = "source-over";
  for (const member of forecast.members) {
    const x = member.x + Math.sin(t * Math.PI * 5 + member.phase) * member.sway;
    const y = member.startY + (member.endY - member.startY) * eased;
    const fadeIn = clamp01((windowBottom + 18 - y) / 44);
    const fadeOut = clamp01((y - windowTop + 18) / 44);
    const alpha = Math.min(fadeIn, fadeOut);
    if (alpha <= 0) continue;
    const w = img.width * member.scale;
    const h = img.height * member.scale;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
  }
  ctx.restore();
}

function drawSlideEffect(effect, now) {
  const img = assets.effects[effect.asset];
  if (!img) return;
  const t = clamp01((now - effect.start) / effect.duration);
  const profile = effect.profile || "strong";
  const size = effectImageSize(img, effect.maxW, effect.maxH, profile === "entry" ? 1.08 : 1);
  const centerX = SETTINGS.reelWindowX + SETTINGS.reelWindowW / 2;
  let x;
  let y = effect.y;
  let alpha = 1;
  let rotation = 0;
  let scale = 1;

  if (t < 0.24) {
    const p = easeOutBackLite(t / 0.24);
    x = DESIGN_W + size.w / 2 - (DESIGN_W + size.w / 2 - centerX) * p;
    scale = 0.96 + 0.04 * p;
  } else if (t < 0.62) {
    const holdT = (t - 0.24) / 0.38;
    x = centerX + Math.sin(holdT * Math.PI * 8) * (profile === "exit" ? 2 : 4);
    scale = profile === "entry" ? 1.03 + Math.sin(holdT * Math.PI * 2) * 0.025 : 1;
  } else {
    const p = easeInCubic((t - 0.62) / 0.38);
    x = centerX - (centerX + size.w / 2 + 44) * p;
    alpha = 1 - p * 0.18;
  }

  if (profile === "exit") {
    y += 8 + Math.sin(t * Math.PI * 5) * 4 + Math.max(0, t - 0.36) * 18;
    rotation = Math.sin(t * Math.PI * 6) * 0.035;
    scale *= 0.94 - Math.max(0, t - 0.58) * 0.08;
    alpha *= 0.92;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(SETTINGS.reelWindowX, SETTINGS.reelWindowY, SETTINGS.reelWindowW, SETTINGS.reelWindowH);
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "source-over";
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.shadowColor = profile === "exit" ? "rgba(100,150,255,0.55)" : "rgba(255,120,232,0.85)";
  ctx.shadowBlur = profile === "weak" ? 14 : 24;
  ctx.drawImage(img, -size.w / 2, -size.h / 2, size.w, size.h);
  ctx.restore();

  if (t < 0.3 || t > 0.62) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(SETTINGS.reelWindowX, SETTINGS.reelWindowY, SETTINGS.reelWindowW, SETTINGS.reelWindowH);
    ctx.clip();
    ctx.globalAlpha = profile === "exit" ? 0.12 : 0.2;
    ctx.strokeStyle = profile === "entry" ? "#ffe780" : "#ffffff";
    ctx.lineWidth = profile === "weak" ? 2 : 4;
    for (let i = 0; i < 5; i++) {
      const yy = y - size.h * 0.34 + i * (size.h / 5);
      ctx.beginPath();
      ctx.moveTo(x + size.w * 0.15 + i * 16, yy);
      ctx.lineTo(DESIGN_W + 30, yy - 18);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawRushExitFadeEffect(effect, now) {
  const img = assets.effects[effect.asset];
  if (!img) return;
  const t = clamp01((now - effect.start) / effect.duration);
  const fadeIn = easeOutCubic(clamp01(t / 0.42));
  const fadeOut = 1 - easeInCubic(clamp01((t - 0.82) / 0.18));
  const alpha = fadeIn * fadeOut;
  const size = effectImageSize(img, effect.maxW * 0.9, effect.maxH * 0.82, 0.94);
  const centerX = SETTINGS.reelWindowX + SETTINGS.reelWindowW / 2;
  const centerY = SETTINGS.reelWindowY + SETTINGS.reelWindowH / 2;
  const sag = Math.sin(t * Math.PI * 5) * 1.4 * (1 - t);
  const scale = 0.9 + fadeIn * 0.08;

  ctx.save();
  ctx.beginPath();
  ctx.rect(SETTINGS.reelWindowX, SETTINGS.reelWindowY, SETTINGS.reelWindowW, SETTINGS.reelWindowH);
  ctx.clip();
  ctx.globalAlpha = SETTINGS.rushExitDimOpacity * fadeIn * fadeOut;
  ctx.fillStyle = "#02020a";
  ctx.fillRect(SETTINGS.reelWindowX, SETTINGS.reelWindowY, SETTINGS.reelWindowW, SETTINGS.reelWindowH);

  ctx.globalAlpha = alpha * 0.9;
  ctx.translate(centerX, centerY + sag);
  ctx.scale(scale, scale * 0.97);
  ctx.shadowColor = "rgba(90,120,255,0.5)";
  ctx.shadowBlur = 16;
  ctx.drawImage(img, -size.w / 2, -size.h / 2, size.w, size.h);
  ctx.restore();
}

function drawPayoutEffect(effect, now) {
  const img = assets.effects[effect.asset];
  if (!img) return;
  const t = clamp01((now - effect.start) / effect.duration);
  const intensity = effect.intensity || 1;
  const pop = easeOutElasticLite(clamp01(t / 0.32));
  const fade = clamp01(1 - Math.max(0, t - 0.78) / 0.22);
  const pulse = 1 + Math.sin(t * Math.PI * 8) * 0.025 * intensity;
  const scale = Math.max(0.2, pop) * pulse;
  const size = effectImageSize(img, effect.maxW, effect.maxH, scale);
  const cx = SETTINGS.reelWindowX + SETTINGS.reelWindowW / 2;
  const cy = effect.y - easeOutCubic(t) * 14;

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.globalCompositeOperation = "lighter";
  const ring = ctx.createRadialGradient(cx, cy, 12, cx, cy, 155 * intensity);
  ring.addColorStop(0, effect.asset === "plus600" ? "rgba(255,240,130,0.55)" : "rgba(255,79,180,0.34)");
  ring.addColorStop(0.5, "rgba(140,215,255,0.18)");
  ring.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = ring;
  ctx.fillRect(SETTINGS.reelWindowX, SETTINGS.reelWindowY, SETTINGS.reelWindowW, SETTINGS.reelWindowH);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.shadowColor = effect.asset === "plus600" ? "rgba(255,230,80,0.95)" : "rgba(255,70,190,0.8)";
  ctx.shadowBlur = effect.asset === "plus600" ? 34 : 22;
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(t * Math.PI * 5) * 0.025 * intensity);
  ctx.drawImage(img, -size.w / 2, -size.h / 2, size.w, size.h);
  ctx.restore();

  if (effect.asset === "plus600") {
    ctx.save();
    ctx.globalAlpha = fade * 0.9;
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 14; i++) {
      const a = t * Math.PI * 2.8 + i * 0.45;
      const r = 86 + Math.sin(t * Math.PI * 2 + i) * 22;
      ctx.fillStyle = i % 2 ? "#ff8de5" : "#ffe783";
      drawStar(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.55, 4 + (i % 3));
    }
    ctx.restore();
  }
}

function drawScreenEffects(now) {
  for (const effect of state.screenEffects) {
    if (effect.type === "payout") {
      drawPayoutEffect(effect, now);
    } else if (effect.type === "rushExitFade") {
      drawRushExitFadeEffect(effect, now);
    } else {
      drawSlideEffect(effect, now);
    }
  }
}

function drawFreezePromotionSevenBackground() {
  const effect = state.freezePromotion;
  if (effect?.stage !== "seven") return;
  const x = SETTINGS.reelWindowX;
  const y = SETTINGS.reelWindowY;
  const w = SETTINGS.reelWindowW;
  const h = SETTINGS.reelWindowH;
  const frame = animationFrameAt(assets.promotionSevenBgFrames, effect.pulseStart, SETTINGS.promotionSevenBgFps);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = "#000";
  ctx.fillRect(x, y, w, h);
  if (frame) ctx.drawImage(frame, x, y, w, h);
  ctx.restore();
}

function drawFreezePromotion(now) {
  const effect = state.freezePromotion;
  if (!effect) return;
  const x = SETTINGS.reelWindowX;
  const y = SETTINGS.reelWindowY;
  const w = SETTINGS.reelWindowW;
  const h = SETTINGS.reelWindowH;

  if (effect.stage === "video") {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = "#000";
    ctx.fillRect(x, y, w, h);
    const frame = animationFrameAt(assets.puchunFrames, effect.videoStart, SETTINGS.puchunFrameFps);
    if (frame) ctx.drawImage(frame, x, y, w, h);
    ctx.restore();
    return;
  }

  if (effect.stage === "black") {
    ctx.save();
    ctx.fillStyle = "#000";
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    return;
  }

  if (effect.stage === "seven") return;
}

function drawTimeBonus(now) {
  if (!state.timeBonus) return;
  const t = (now - state.timeBonus.start) / state.timeBonus.duration;
  if (t >= 1) {
    state.timeBonus = null;
    return;
  }

  const alpha = clamp01(1 - Math.max(0, t - 0.62) / 0.38);
  const pop = 1 + Math.sin(Math.min(1, t) * Math.PI) * (state.timeBonus.seven ? 0.22 : 0.14);
  const y = 31 - easeOutCubic(t) * 14;
  const x = 158;
  const label = `+${state.timeBonus.seconds} SEC`;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(pop, pop);
  ctx.textAlign = "left";
  ctx.font = "900 17px ui-monospace, SFMono-Regular, Consolas, monospace";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(19,9,57,0.95)";
  ctx.shadowColor = state.timeBonus.seven ? "rgba(255,225,80,0.9)" : "rgba(120,238,255,0.82)";
  ctx.shadowBlur = state.timeBonus.seven ? 14 : 10;
  ctx.strokeText(label, 0, 0);
  ctx.fillStyle = state.timeBonus.seven ? "#ffe572" : "#92f3ff";
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

function drawToast(now) {
  if (!state.toast) return;
  const t = (now - state.toast.start) / state.toast.duration;
  if (t >= 1) {
    state.toast = null;
    return;
  }
  ctx.save();
  ctx.globalAlpha = clamp01(1 - Math.max(0, t - 0.55) / 0.45);
  ctx.fillStyle = state.toast.color;
  ctx.font = "900 44px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 10;
  ctx.fillText(state.toast.text, DESIGN_W / 2, 154 - easeOutCubic(t) * 16);
  ctx.restore();
}

function drawResultRow(text, x, y, font, fill, startedAt, now) {
  const localT = clamp01((now - startedAt) / 420);
  if (localT <= 0) return;
  const alpha = localT < 1 ? easeOutCubic(localT) : 1;
  const pop = 0.92 + alpha * 0.08;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(pop, pop);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(0,0,0,0.82)";
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = fill;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawResult(now) {
  const presentation = state.resultPresentation;
  if (!presentation) return;
  const elapsed = now - presentation.start;
  const frameX = SETTINGS.reelWindowX;
  const frameY = SETTINGS.reelWindowY;
  const frameW = SETTINGS.reelWindowW;
  const frameH = SETTINGS.reelWindowH;
  const cx = frameX + frameW / 2;
  const darkenStart = SETTINGS.resultEndMs;
  const firstRowAt = darkenStart + SETTINGS.resultDarkenMs;
  const secondRowAt = firstRowAt + SETTINGS.resultRowDelayMs;
  const thirdRowAt = secondRowAt + SETTINGS.resultRowDelayMs;

  ctx.save();
  ctx.beginPath();
  ctx.rect(frameX, frameY, frameW, frameH);
  ctx.clip();
  const darkAlpha = 0.92 * easeOutCubic(clamp01((elapsed - darkenStart) / SETTINGS.resultDarkenMs));
  if (assets.headerPanelBackground) {
    ctx.save();
    ctx.globalAlpha = darkAlpha;
    drawImageCover(assets.headerPanelBackground, frameX, frameY, frameW, frameH);
    ctx.restore();
    ctx.fillStyle = `rgba(8,4,24,${0.42 * darkAlpha})`;
    ctx.fillRect(frameX, frameY, frameW, frameH);
  } else {
    ctx.fillStyle = `rgba(0,0,0,${darkAlpha})`;
    ctx.fillRect(frameX, frameY, frameW, frameH);
  }

  const endAlpha = clamp01(1 - Math.max(0, elapsed - SETTINGS.resultEndMs + 320) / 420);
  if (endAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = endAlpha;
    const img = assets.effects.resultEnd;
    if (img) {
      drawImageContain(img, frameX - 100, frameY - 2, frameW + 200, 264);
    } else {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 48px serif";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(17,6,38,0.92)";
      ctx.strokeText("終了", cx, frameY + frameH / 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("終了", cx, frameY + frameH / 2);
    }
    ctx.restore();
  }

  const resultFont = "800 22px '\u3042\u3093\u305a\u3082\u3058', 'AnzuMojI', 'AnzuMojI04', Meiryo, sans-serif";
  drawResultRow("リザルト", cx, frameY + 68, resultFont, "#ffffff", presentation.start + firstRowAt, now);
  drawResultRow(`スコア：${state.points}`, cx, frameY + 146, resultFont, "#ffffff", presentation.start + secondRowAt, now);
  drawResultRow(presentation.comment, cx, frameY + 222, resultFont, "#ffffff", presentation.start + thirdRowAt, now);
  ctx.restore();
}

function drawLegacyResult() {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "900 30px system-ui, sans-serif";
  ctx.fillText("RESULT", DESIGN_W / 2, 282);
  ctx.font = "900 54px system-ui, sans-serif";
  ctx.fillStyle = "#ffdf72";
  ctx.fillText(String(state.points), DESIGN_W / 2, 360);
  ctx.font = "700 14px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.76)";
  ctx.fillText("POINT", DESIGN_W / 2, 392);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  roundRect(ctx, 72, 442, 246, 54, 8);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "800 16px system-ui, sans-serif";
  ctx.fillText("TAP TO RESTART", DESIGN_W / 2, 476);
  ctx.restore();
}

function render(now) {
  ensureRenderCache();
  const base = renderCache.baseByMode.get(state.mode) || renderCache.baseByMode.get(NORMAL);
  if (base) {
    ctx.drawImage(base, 0, 0);
  } else {
    drawBackground();
    drawCabinetShell();
    drawReelMask();
  }
  drawHeaderHud();
  drawFreezePromotionSevenBackground();
  for (const reel of state.reels) drawReel(reel);
  drawCrowdForecast(now);
  drawFreezePromotion(now);
  if (renderCache.boardStatic) {
    ctx.drawImage(renderCache.boardStatic, 0, 0);
  } else {
    drawPachinkoBoardStatic();
  }
  drawPachinkoBoardDynamic();
  drawParticles();
  if (renderCache.chrome) {
    ctx.drawImage(renderCache.chrome, 0, 0);
  } else {
    drawCabinetChrome();
  }
  drawLowerPanels(now);
  drawScreenEffects(now);
  drawTimeBonus(now);
  drawToast(now);
  if (state.resultShown) drawResult(now);
}

function loop(now) {
  if (document.visibilityState === "hidden") {
    requestAnimationFrame(loop);
    return;
  }
  const dt = Math.min(50, now - state.lastTime);
  state.lastTime = now;
  update(dt, now);
  render(now);
  requestAnimationFrame(loop);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.decode) {
        img.decode().catch(() => {}).then(() => resolve(img));
      } else {
        resolve(img);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = `${src}?v=${ASSET_VERSION}`;
  });
}

function loadFrameSequence(path, prefix, count, ext = "jpg") {
  const frames = [];
  const jobs = [];
  for (let i = 1; i <= count; i++) {
    const name = `${prefix}_${String(i).padStart(3, "0")}.${ext}`;
    jobs.push(loadImage(`${path}/${name}`).then((img) => {
      frames[i - 1] = img;
    }));
  }
  return Promise.all(jobs).then(() => frames);
}

function loadVideo(src, target = null) {
  return new Promise((resolve) => {
    const video = target || document.createElement("video");
    video.src = `${src}?v=${ASSET_VERSION}`;
    video.preload = "auto";
    video.playsInline = true;
    video.muted = true;
    video.volume = 0;
    video.crossOrigin = "anonymous";
    video.addEventListener("loadeddata", () => resolve(video), { once: true });
    video.addEventListener("error", () => resolve(video), { once: true });
    video.load();
  });
}

function loadAudio(src) {
  const track = new Audio(`${src}?v=${ASSET_VERSION}`);
  track.preload = "auto";
  track.loop = true;
  track.volume = 0.42;
  track.load();
  return track;
}

function loadSe(src) {
  const track = new Audio(`${src}?v=${ASSET_VERSION}`);
  track.preload = "auto";
  track.loop = false;
  track.volume = audio.defaultSeVolume;
  track.load();
  return track;
}

async function loadSeBuffer(src) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  try {
    const context = audio.ctx || new AudioContext();
    audio.ctx = context;
    const response = await fetch(`${src}?v=${ASSET_VERSION}`);
    const data = await response.arrayBuffer();
    return await context.decodeAudioData(data);
  } catch (_) {
    return null;
  }
}

async function loadAssets() {
  const jobs = [];
  for (const n of SYMBOLS) {
    jobs.push(loadImage(`assets/symbols/${n}.png`).then((img) => assets.front.set(n, img)));
    jobs.push(loadImage(`assets/symbols_back/${n}.png`).then((img) => assets.back.set(n, img)));
  }
  jobs.push(loadImage("assets/strip_omote.png").then((img) => (assets.stripFront = img)));
  jobs.push(loadImage("assets/strip_ura.png").then((img) => (assets.stripBack = img)));
  jobs.push(loadImage("assets/optimized/background_normal.png").then((img) => (assets.backgroundNormal = img)));
  jobs.push(loadImage("assets/optimized/background_rush.png").then((img) => (assets.backgroundRush = img)));
  jobs.push(loadImage("assets/optimized/crowd_forecast.png").then((img) => (assets.crowdForecast = img)));
  jobs.push(loadImage("assets/cabinet/cabinet_back.png").then((img) => (assets.cabinetBack = img)));
  jobs.push(loadImage("assets/cabinet/cabinet_front.png").then((img) => (assets.cabinetFront = img)));
  jobs.push(loadImage("assets/cabinet/cabinet_glass.png").then((img) => (assets.cabinetGlass = img)));
  jobs.push(loadImage("assets/start_pocket.png").then((img) => (assets.startPocket = img)));
  jobs.push(loadImage("assets/title_logo.png").then((img) => (assets.titleLogo = img)));
  jobs.push(loadImage("assets/optimized/header_panel_bg.png").then((img) => (assets.headerPanelBackground = img)));
  jobs.push(loadImage("assets/optimized/plinko_area_bg.png").then((img) => (assets.plinkoBackground = img)));
  jobs.push(loadImage("assets/retry_trim.png").then((img) => (assets.retry = img)));
  jobs.push(loadImage("assets/optimized/reach_weak.png").then((img) => (assets.effects.reachWeak = img)));
  jobs.push(loadImage("assets/optimized/reach_strong.png").then((img) => (assets.effects.reachStrong = img)));
  jobs.push(loadImage("assets/optimized/rush_reach.png").then((img) => (assets.effects.rushReach = img)));
  jobs.push(loadImage("assets/optimized/rush_entry.png").then((img) => (assets.effects.rushEntry = img)));
  jobs.push(loadImage("assets/optimized/rush_exit.png").then((img) => (assets.effects.rushExit = img)));
  jobs.push(loadImage("assets/optimized/plus_300.png").then((img) => (assets.effects.plus300 = img)));
  jobs.push(loadImage("assets/optimized/plus_600.png").then((img) => (assets.effects.plus600 = img)));
  jobs.push(loadImage("assets/optimized/result_end.png").then((img) => (assets.effects.resultEnd = img)));
  jobs.push(loadFrameSequence("assets/effects/puchun_jpg", "puchun", 37).then((frames) => (assets.puchunFrames = frames)));
  jobs.push(loadFrameSequence("assets/effects/promotion_seven_bg_jpg", "bg", 45).then((frames) => (assets.promotionSevenBgFrames = frames)));
  audio.setBgmTracks({
    normal: loadAudio("assets/bgm/normal.mp3"),
    normalReach: loadAudio("assets/bgm/normal_reach.mp3"),
    rush: loadAudio("assets/bgm/rush.mp3"),
  });
  audio.setSeTracks({
    button: loadSe("assets/se/button.mp3"),
    reach: loadSe("assets/se/reach.mp3"),
    reelStop: loadSe("assets/se/reel_stop.mp3"),
    checker: loadSe("assets/se/checker.mp3"),
    crowdForecast: loadSe("assets/se/crowd_forecast.mp3"),
    puchun: loadSe("assets/se/puchun.mp3"),
    sevenWin: loadSe("assets/se/seven_win.mp3"),
    normalWin: loadSe("assets/se/normal_win.mp3"),
    resultEnd: loadSe("assets/se/result_end.mp3"),
    resultReveal1: loadSe("assets/se/result_reveal_1.mp3"),
    resultReveal2: loadSe("assets/se/result_reveal_2.mp3"),
  });
  jobs.push(Promise.all([
    loadSeBuffer("assets/se/button.mp3").then((buffer) => ["button", buffer]),
    loadSeBuffer("assets/se/reel_stop.mp3").then((buffer) => ["reelStop", buffer]),
    loadSeBuffer("assets/se/checker.mp3").then((buffer) => ["checker", buffer]),
    loadSeBuffer("assets/se/reach.mp3").then((buffer) => ["reach", buffer]),
    loadSeBuffer("assets/se/result_reveal_1.mp3").then((buffer) => ["resultReveal1", buffer]),
    loadSeBuffer("assets/se/result_reveal_2.mp3").then((buffer) => ["resultReveal2", buffer]),
  ]).then((entries) => {
    audio.setSeBuffers(Object.fromEntries(entries.filter((entry) => entry[1])));
  }));
  await Promise.all(jobs);
}

function restart() {
  state.mode = NORMAL;
  state.points = SETTINGS.initialPoints;
  state.remainingMs = SETTINGS.gameSeconds * 1000;
  state.rushStreak = 0;
  state.result = null;
  state.freezePromotion = null;
  state.resultShown = false;
  state.resultPresentation = null;
  state.scoreReported = false;
  state.stopOrder = [];
  state.stopCursor = 0;
  state.nextStopAt = 0;
  state.flipToBackPending = false;
  state.reachLedActive = false;
  state.status = "idle";
  state.particles = [];
  state.screenEffects = [];
  state.balls = [];
  state.holds = 0;
  state.crowdForecast = null;
  state.toast = null;
  state.timeBonus = null;
  spinButton.classList.remove("is-result-hidden", "is-result-ready");
  if (assets.freezeVideo) assets.freezeVideo.pause();
  hidePuchunVideo(true);
  initReels();
  setAllFaces("front", false);
  audio.updateBgm();
  refreshButtonState();
}

spinButton.addEventListener("click", fireBall);
spinButton.addEventListener("pointerdown", () => setSpinButtonPressing(true));
spinButton.addEventListener("pointerup", () => setSpinButtonPressing(false));
spinButton.addEventListener("pointercancel", () => setSpinButtonPressing(false));
spinButton.addEventListener("pointerleave", () => setSpinButtonPressing(false));
canvas.addEventListener("pointerup", (event) => {
  const point = eventToDesignPoint(event);
  if (pointInRect(point, SOUND_TOGGLE_BOUNDS)) {
    toggleSound();
    return;
  }
  if (
    state.status === "result"
    && state.resultPresentation?.restartReady
    && pointInRect(point, RETRY_PANEL_BOUNDS)
  ) {
    restart();
  }
});

loadAssets()
  .then(() => {
    positionPuchunVideo();
    initReels();
    setAllFaces("front", false);
    state.status = "idle";
    refreshButtonState();
    loading.hidden = true;
    state.lastTime = performance.now();
    requestAnimationFrame(loop);
    if (new URLSearchParams(location.search).has("autoplay")) {
      window.setTimeout(fireBall, 500);
    }
  })
  .catch((error) => {
    loading.textContent = error.message;
    console.error(error);
  });
