// ═══════════════════════════════════════════════════════════════════════
//  DRUNKEN STREET BOXING — Enhanced Edition
//  5 Floors · Shop/Customization · Settings · XP/Specials · Punching Bags
// ═══════════════════════════════════════════════════════════════════════

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 800, H = 500;
canvas.width = W; canvas.height = H;

// Polyfill for roundRect if not supported
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'number') r = [r, r, r, r];
        this.moveTo(x + r[0], y);
        this.lineTo(x + w - r[1], y);
        this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
        this.lineTo(x + w, y + h - r[2]);
        this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
        this.lineTo(x + r[3], y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
        this.lineTo(x, y + r[0]);
        this.quadraticCurveTo(x, y, x + r[0], y);
        this.closePath();
    };
}

// ─── Sound Effects (Web Audio API) ───────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function ensureAudio() { if (!audioCtx) audioCtx = new AudioCtx(); return audioCtx; }

function playTone(freq, duration, type, vol, ramp) {
    let ctx = ensureAudio();
    let osc = ctx.createOscillator();
    let gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (ramp) osc.frequency.exponentialRampToValueAtTime(ramp, ctx.currentTime + duration);
    gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, vol) {
    let ctx = ensureAudio();
    let bufSize = ctx.sampleRate * duration;
    let buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    let data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
    let src = ctx.createBufferSource(); src.buffer = buf;
    let gain = ctx.createGain();
    gain.gain.setValueAtTime(vol || 0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(gain); gain.connect(ctx.destination);
    src.start(); src.stop(ctx.currentTime + duration);
}

const SFX = {
    menuMove()    { playTone(600, 0.06, 'square', 0.08); },
    menuSelect()  { playTone(800, 0.08, 'square', 0.12); playTone(1200, 0.1, 'square', 0.1); },
    menuBack()    { playTone(400, 0.1, 'square', 0.1, 200); },
    jab()         { playNoise(0.08, 0.18); playTone(300, 0.06, 'sawtooth', 0.1); },
    cross()       { playNoise(0.1, 0.22); playTone(250, 0.08, 'sawtooth', 0.12); },
    hook()        { playNoise(0.14, 0.25); playTone(200, 0.12, 'sawtooth', 0.15, 100); },
    uppercut()    { playNoise(0.12, 0.2); playTone(350, 0.15, 'sawtooth', 0.15, 600); },
    special()     { playTone(200, 0.4, 'sawtooth', 0.2, 800); playNoise(0.3, 0.15); playTone(600, 0.3, 'square', 0.1, 1200); },
    block()       { playTone(150, 0.1, 'triangle', 0.12); playNoise(0.06, 0.08); },
    dodge()       { playTone(500, 0.12, 'sine', 0.08, 300); },
    miss()        { playTone(250, 0.15, 'sine', 0.06, 100); },
    playerHit()   { playNoise(0.15, 0.2); playTone(180, 0.15, 'sawtooth', 0.12, 80); },
    enemyHit()    { playNoise(0.1, 0.15); playTone(250, 0.08, 'square', 0.08); },
    ko()          { playTone(400, 0.3, 'sawtooth', 0.2, 80); playNoise(0.4, 0.15); setTimeout(() => playTone(200, 0.5, 'square', 0.12, 50), 200); },
    bottlePickup(){ playTone(800, 0.08, 'sine', 0.1); setTimeout(() => playTone(1200, 0.1, 'sine', 0.1), 80); },
    drink()       { playNoise(0.2, 0.08); playTone(300, 0.25, 'sine', 0.06, 500); },
    stairs()      { playTone(400, 0.1, 'sine', 0.1); setTimeout(() => playTone(500, 0.1, 'sine', 0.1), 100); setTimeout(() => playTone(600, 0.15, 'sine', 0.1), 200); },
    coinGain()    { playTone(1000, 0.08, 'square', 0.08); setTimeout(() => playTone(1500, 0.12, 'square', 0.08), 80); },
    shopBuy()     { playTone(600, 0.08, 'sine', 0.1); setTimeout(() => playTone(800, 0.08, 'sine', 0.1), 60); setTimeout(() => playTone(1100, 0.15, 'sine', 0.12), 120); },
    shopEquip()   { playTone(700, 0.1, 'triangle', 0.1); setTimeout(() => playTone(900, 0.1, 'triangle', 0.1), 80); },
    shopFail()    { playTone(200, 0.15, 'square', 0.1); setTimeout(() => playTone(150, 0.2, 'square', 0.1), 120); },
    gameOver()    { playTone(400, 0.3, 'sawtooth', 0.15, 100); setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.12, 80), 300); setTimeout(() => playTone(200, 0.5, 'sawtooth', 0.1, 50), 600); },
    win()         { playTone(600, 0.15, 'square', 0.12); setTimeout(() => playTone(800, 0.15, 'square', 0.12), 150); setTimeout(() => playTone(1000, 0.15, 'square', 0.12), 300); setTimeout(() => playTone(1200, 0.3, 'square', 0.15), 450); },
    fightIntro()  { playTone(300, 0.15, 'sawtooth', 0.15, 600); playNoise(0.1, 0.1); },
    cutsceneType(){ playTone(800 + Math.random() * 400, 0.03, 'square', 0.04); },
    cutsceneNext(){ playTone(500, 0.08, 'triangle', 0.08); },
    bagHit()      { playNoise(0.12, 0.12); playTone(120, 0.1, 'triangle', 0.08); },
    settingChange(){ playTone(700, 0.05, 'triangle', 0.07); },
    footstep()    { playNoise(0.04, 0.03); playTone(100 + Math.random() * 30, 0.04, 'triangle', 0.02); },
    comboHit()    { playTone(900 + Math.random() * 400, 0.06, 'square', 0.06); },
    critHit()     { playTone(200, 0.2, 'sawtooth', 0.2, 600); playNoise(0.15, 0.25); playTone(1000, 0.15, 'square', 0.08); },
    slowMo()      { playTone(120, 0.5, 'sine', 0.08, 60); },
};

// ─── Constants ───────────────────────────────────────────────────────
const FOV = Math.PI / 3;
const COMBO_WINDOW = 280;
const PLAYER_SPEED = 0.008;
const TURN_SPEED = 0.008;
const ENGAGE_DIST = 1.6;
const DODGE_DURATION = 300;
const DODGE_COOLDOWN = 600;
const SLIP_BACK_DURATION = 350;
const BOTTLE_PICKUP_DIST = 0.8;
const STAIR_DIST = 1.8;
const MAP_W = 20, MAP_H = 15;
const MAX_XP = 100;

// ─── Attack Definitions ─────────────────────────────────────────────
const ATTACKS = {
    jab:       { dmg: [5, 9],   anim: 160, cd: 320,  name: 'JAB!'        },
    cross:     { dmg: [8, 13],  anim: 200, cd: 480,  name: 'CROSS!'      },
    leftHook:  { dmg: [16, 24], anim: 300, cd: 700,  name: 'LEFT HOOK!'  },
    rightHook: { dmg: [16, 24], anim: 300, cd: 700,  name: 'RIGHT HOOK!' },
    uppercut:  { dmg: [20, 32], anim: 380, cd: 850,  name: 'UPPERCUT!'   },
};

// ─── Enemy Attack Types (Drunken/Weird) ──────────────────────────────
function getEnemyAttacks(en) {
    let vd = VILLAIN_DATA[en.name] || {};
    switch (vd.style || 'brawler') {
        case 'speedster': return [
            { name: 'SLAPPED!', type: 'slap' },
            { name: 'PALM STRIKE!', type: 'palm' },
            { name: 'PUNCHED!', type: 'punch' },
        ];
        case 'counter': return [
            { name: 'PUNCHED!', type: 'punch' },
            { name: 'ELBOWED!', type: 'elbow' },
            { name: 'KARATE CHOP!', type: 'chop' },
        ];
        case 'brawler': return [
            { name: 'HEADBUTT!', type: 'headbutt' },
            { name: 'PUNCHED!', type: 'punch' },
            { name: 'ELBOWED!', type: 'elbow' },
        ];
        case 'wild': return [
            { name: 'BIT YOU!', type: 'bite' },
            { name: 'SLAPPED!', type: 'slap' },
            { name: 'EAR CLAP!', type: 'earclap' },
            { name: 'HEADBUTT!', type: 'headbutt' },
            { name: 'LICKED YOU!', type: 'lick' },
        ];
        case 'boss': return [
            { name: 'PUNCHED!', type: 'punch' },
            { name: 'HEADBUTT!', type: 'headbutt' },
            { name: 'BIT YOU!', type: 'bite' },
            { name: 'ELBOWED!', type: 'elbow' },
            { name: 'SLAPPED!', type: 'slap' },
        ];
        default: return [{ name: 'HIT!', type: 'punch' }];
    }
}

// ─── Game States ─────────────────────────────────────────────────────
const ST = {
    MENU: 0, EXPLORE: 1, FIGHT_INTRO: 2, COMBAT: 3, KO: 4,
    GAMEOVER: 5, WIN: 6, CUTSCENE: 7, SETTINGS: 8, SHOP: 9, LEVEL_TRANS: 10
};
let state = ST.MENU;

// ─── Shop Items (Skins with Special Moves) ───────────────────────────
const SKINS = [
    { id: 'default', name: 'Default',      armColor: '#884433', highlight: '#995544', price: 0,
      special: { name: 'POWER PUNCH',  dmg: [35, 45], particleColor: '#ff4444', animType: 'double' } },
    { id: 'pale',    name: 'Pale Fighter', armColor: '#ccaa88', highlight: '#ddbb99', price: 100,
      special: { name: 'GHOST STRIKE', dmg: [30, 50], particleColor: '#ffffff', animType: 'rush'   } },
    { id: 'dark',    name: 'Dark Knight',  armColor: '#443322', highlight: '#554433', price: 150,
      special: { name: 'DARK VOID',    dmg: [38, 48], particleColor: '#6600aa', animType: 'upper'  } },
    { id: 'bronze',  name: 'Bronze',       armColor: '#aa7744', highlight: '#bb8855', price: 200,
      special: { name: 'THUNDER FIST', dmg: [32, 52], particleColor: '#ffcc00', animType: 'slam'   } },
    { id: 'ice',     name: 'Frost',        armColor: '#6688aa', highlight: '#88aacc', price: 400,
      special: { name: 'ICE BREAKER',  dmg: [36, 46], particleColor: '#88ddff', animType: 'hook'   } },
    { id: 'gold',    name: 'Gold Skin',    armColor: '#ccaa22', highlight: '#ddbb44', price: 600,
      special: { name: 'MIDAS TOUCH',  dmg: [40, 55], particleColor: '#ffdd00', animType: 'slam'   } },
    { id: 'chrome',  name: 'Chrome',       armColor: '#8899aa', highlight: '#99aabb', price: 700,
      special: { name: 'STEEL CRUSH',  dmg: [42, 50], particleColor: '#aabbcc', animType: 'double' } },
    { id: 'demon',   name: 'Demon',        armColor: '#661111', highlight: '#882222', price: 900,
      special: { name: 'HELLFIRE',     dmg: [45, 60], particleColor: '#ff4400', animType: 'rush'   } },
];
const GLOVES_SHOP = [
    { id: 'red',     name: 'Classic Red',   color: '#cc0000', outline: '#880000', price: 0 },
    { id: 'blue',    name: 'Blue Fury',     color: '#0044cc', outline: '#002288', price: 150 },
    { id: 'green',   name: 'Venom',         color: '#00cc44', outline: '#008822', price: 150 },
    { id: 'pink',    name: 'Bubblegum',     color: '#ff66aa', outline: '#cc4488', price: 200 },
    { id: 'gold',    name: 'Gold Rush',     color: '#ffcc00', outline: '#cc9900', price: 350 },
    { id: 'purple',  name: 'Royal',         color: '#8800cc', outline: '#550088', price: 400 },
    { id: 'fire',    name: 'Inferno',       color: '#ff4400', outline: '#cc2200', price: 500 },
    { id: 'shadow',  name: 'Shadow',        color: '#222222', outline: '#111111', price: 650 },
    { id: 'neon',    name: 'Neon Glow',     color: '#00ffaa', outline: '#00cc88', price: 750 },
    { id: 'diamond', name: 'Diamond',       color: '#aaddff', outline: '#7799bb', price: 1000 },
];

// ─── Save System ─────────────────────────────────────────────────────
function defaultSave() {
    return { coins: 0, ownedSkins: ['default'], ownedGloves: ['red'], equippedSkin: 'default', equippedGloves: 'red', highScore: 0 };
}
let saveData = loadSave();
function loadSave() {
    try { let d = JSON.parse(localStorage.getItem('y2k_save')); if (d && d.coins !== undefined) return d; } catch(e) {}
    return defaultSave();
}
function writeSave() { localStorage.setItem('y2k_save', JSON.stringify(saveData)); }
function getSkin() { return SKINS.find(s => s.id === saveData.equippedSkin) || SKINS[0]; }
function getGloves() { return GLOVES_SHOP.find(g => g.id === saveData.equippedGloves) || GLOVES_SHOP[0]; }

// ─── Settings ────────────────────────────────────────────────────────
let settings = { difficulty: 1, screenShake: true, showMinimap: true, sensitivity: 1.0, speed: 1.0 };
const DIFF_NAMES = ['EASY', 'NORMAL', 'HARD'];
const DIFF_MULT = [
    { pDmg: 0.7, eHp: 0.8, eDmg: 0.8 },
    { pDmg: 1.0, eHp: 1.0, eDmg: 1.0 },
    { pDmg: 1.3, eHp: 1.2, eDmg: 1.2 },
];
const SETTINGS_OPTS = ['Difficulty', 'Sensitivity', 'Speed', 'Screen Shake', 'Minimap', 'Back', 'Quit to Menu'];

// ─── Villain Data ────────────────────────────────────────────────────
const VILLAIN_DATA = {
    'Street Punk': {
        intro: ["Hey yo, fresh meat!", "You don't belong here, kid.", "I'ma put you down quick."],
        ko: "Lucky shot... that's all...",
        style: 'speedster',
        bodyColor: '#555544', skinColor: '#aa9977', gloveColor: '#888888',
        headSize: 22, bodyW: 55, bodyH: 65,
    },
    'Lil Ricky': {
        intro: ["Yo, you lost or somethin'?", "These streets belong to ME.", "Let me teach you a lesson, kid."],
        ko: "Aight... you got hands... I'll give you that.",
        style: 'speedster',
        bodyColor: '#664422', skinColor: '#bb8855', gloveColor: '#ffcc00',
        headSize: 22, bodyW: 60, bodyH: 70,
    },
    'Alley Cat': {
        intro: ["*hisss* Wrong alley, kid.", "Fast feet or fast fists?", "Let's find out."],
        ko: "Can't believe... got caught...",
        style: 'speedster',
        bodyColor: '#334433', skinColor: '#88aa88', gloveColor: '#44cc44',
        headSize: 24, bodyW: 58, bodyH: 68,
    },
    'Snake Eyes': {
        intro: ["*cracks knuckles*", "Another one thinking they tough...", "I ain't even warmed up yet."],
        ko: "No way... nobody drops Snake Eyes...",
        style: 'counter',
        bodyColor: '#223322', skinColor: '#557755', gloveColor: '#00ff44',
        headSize: 26, bodyW: 70, bodyH: 80,
    },
    'Iron Mike': {
        intro: ["You made it this far? Respect.", "But the Brawler don't lose. Ever.", "Say goodnight."],
        ko: "H-how... I never been knocked down before...",
        style: 'brawler',
        bodyColor: '#553333', skinColor: '#885555', gloveColor: '#cc2222',
        headSize: 30, bodyW: 90, bodyH: 95,
    },
    'Tank': {
        intro: ["*thuds fists together*", "Smaller than I expected.", "This won't take long."],
        ko: "Impossible... Tank... doesn't... fall...",
        style: 'brawler',
        bodyColor: '#444444', skinColor: '#777777', gloveColor: '#4488ff',
        headSize: 30, bodyW: 95, bodyH: 95,
    },
    'The Butcher': {
        intro: ["They call me The Butcher.", "Wanna know why?", "Because I carve up fools like YOU."],
        ko: "This... this can't be happening...",
        style: 'wild',
        bodyColor: '#442222', skinColor: '#994444', gloveColor: '#ff4400',
        headSize: 28, bodyW: 85, bodyH: 90,
    },
    'Shadow': {
        intro: ["Can't hit what you can't see.", "I've been watching you...", "Your openings are obvious."],
        ko: "You... adapted too quickly...",
        style: 'counter',
        bodyColor: '#111122', skinColor: '#445566', gloveColor: '#8844cc',
        headSize: 24, bodyW: 65, bodyH: 75,
    },
    'Red King': {
        intro: ["So you're the one causing trouble.", "I run this whole building.", "Nobody leaves standing. NOBODY.", "Come. Show me what you got."],
        ko: "Impossible... the Red King... dethroned...",
        style: 'boss',
        bodyColor: '#330000', skinColor: '#aa2222', gloveColor: '#ff0000',
        headSize: 32, bodyW: 100, bodyH: 100,
    }
};

// ─── Level Definitions (5 Floors) ────────────────────────────────────
// Tile: 0=floor, 1=wall, 2=stairs-up, 3=stairs-down
const LEVELS = [
    { // Floor 1: The Street
        name: 'THE STREET', floor: 1,
        wallTint: [1, 0.15, 0.1],
        floorC1: '#080000', floorC2: '#1a0000',
        map: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1],
            [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
            [1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        enemies: [
            { x: 6, y: 5, name: 'Street Punk', hp: 35, dmg: [3, 6], interval: 2000, coins: 50 },
            { x: 14, y: 8, name: 'Lil Ricky', hp: 45, dmg: [4, 8], interval: 1800, coins: 80 },
        ],
        bottles: [{ x: 2.5, y: 8.5 }, { x: 17.5, y: 2.5 }],
        playerStart: { x: 2.5, y: 2.5, angle: 0 },
        spawnFromAbove: { x: 15.5, y: 13.5, angle: Math.PI },
    },
    { // Floor 2: The Alley
        name: 'THE ALLEY', floor: 2,
        wallTint: [0.7, 0.35, 0.1],
        floorC1: '#080400', floorC2: '#1a0a00',
        map: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
            [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
            [1,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
            [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
            [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
            [1,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        enemies: [
            { x: 10, y: 4, name: 'Alley Cat', hp: 50, dmg: [5, 10], interval: 1700, coins: 100 },
            { x: 5, y: 8, name: 'Snake Eyes', hp: 60, dmg: [6, 12], interval: 2400, coins: 130 },
        ],
        bottles: [{ x: 17.5, y: 1.5 }, { x: 2.5, y: 6.5 }, { x: 14.5, y: 11.5 }],
        spawnFromBelow: { x: 2.5, y: 12.5, angle: 0 },
        spawnFromAbove: { x: 15.5, y: 13.5, angle: Math.PI },
    },
    { // Floor 3: The Warehouse
        name: 'THE WAREHOUSE', floor: 3,
        wallTint: [0.55, 0.55, 0.15],
        floorC1: '#040400', floorC2: '#0a0a00',
        map: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,1,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,1,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,1,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        enemies: [
            { x: 10, y: 5, name: 'Iron Mike', hp: 80, dmg: [10, 18], interval: 2600, coins: 200 },
            { x: 4, y: 9, name: 'Tank', hp: 95, dmg: [12, 20], interval: 2800, coins: 250 },
        ],
        bottles: [{ x: 15.5, y: 2.5 }, { x: 8.5, y: 7.5 }],
        spawnFromBelow: { x: 2.5, y: 12.5, angle: 0 },
        spawnFromAbove: { x: 15.5, y: 13.5, angle: Math.PI },
    },
    { // Floor 4: The Penthouse
        name: 'THE PENTHOUSE', floor: 4,
        wallTint: [0.45, 0.15, 0.65],
        floorC1: '#040008', floorC2: '#0a001a',
        map: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
            [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,0,0,1,1,1,0,0,0,0,1,1,1,0,0,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,0,0,1,1,1,0,0,0,0,1,1,1,0,0,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
            [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
            [1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        enemies: [
            { x: 3, y: 3, name: 'The Butcher', hp: 100, dmg: [8, 15], interval: 1400, coins: 300 },
            { x: 16, y: 7, name: 'Shadow', hp: 85, dmg: [10, 18], interval: 2200, coins: 350 },
        ],
        bottles: [{ x: 9.5, y: 7.5 }, { x: 16.5, y: 1.5 }, { x: 3.5, y: 11.5 }],
        spawnFromBelow: { x: 2.5, y: 12.5, angle: 0 },
        spawnFromAbove: { x: 15.5, y: 13.5, angle: Math.PI },
    },
    { // Floor 5: The Arena (Boss) — full of punching bags
        name: 'THE ARENA', floor: 5,
        wallTint: [1, 0.08, 0.08],
        floorC1: '#0a0000', floorC2: '#220000',
        map: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
            [1,1,1,3,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        enemies: [
            { x: 10, y: 3, name: 'Red King', hp: 150, dmg: [12, 24], interval: 1600, coins: 1000 },
        ],
        bags: [
            { x: 6,  y: 10, hp: 30 },
            { x: 10, y: 10, hp: 30 },
            { x: 14, y: 10, hp: 30 },
            { x: 8,  y: 7,  hp: 40 },
            { x: 12, y: 7,  hp: 40 },
            { x: 10, y: 5,  hp: 50 },
        ],
        bottles: [{ x: 5.5, y: 5.5 }, { x: 14.5, y: 9.5 }],
        spawnFromBelow: { x: 4.5, y: 12.5, angle: 0 },
    },
];

// ─── Game State Variables ────────────────────────────────────────────
let player = { x: 2.5, y: 2.5, angle: 0, health: 100, maxHealth: 100, score: 0 };
let currentLevel = 0;
let currentMap = LEVELS[0].map;
let enemies = [];
let bottles = [];
let inventory = { bottles: 0 };
let drinkCount = 0;
let drunkLevel = 0;
let drunkNotify = '';
let drunkNotifyTimer = 0;
let drunkBlurAmount = 0;
let armBob = 0;
let defeatedEnemies = new Set();
let pickedBottles = new Set();
let playerXp = 0;

// ─── Menu / Shop / Settings Navigation ───────────────────────────────
let menuCursor = 0;
const MENU_OPTIONS = ['FIGHT', 'SHOP', 'SETTINGS'];
let shopTab = 0;
let shopCursor = 0;
let settingsCursor = 0;
let settingsPrevState = null;

// ─── Level Transition ────────────────────────────────────────────────
let transAlpha = 0;
let transDir = 0;
let transCallback = null;
let transText = '';

// ─── Notifications ───────────────────────────────────────────────────
let notifications = [];
function addNotif(text, dur) { notifications.push({ text, timer: dur || 2000, max: dur || 2000 }); }

// ─── Particles ───────────────────────────────────────────────────────
let particles = [];
function spawnParticles(x, y, n, col) {
    for (let i = 0; i < n; i++) {
        particles.push({
            x, y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8 - 2,
            life: 350 + Math.random()*300, max: 650, color: col||'#ff0000', size: 2+Math.random()*3
        });
    }
}

// ─── Stair Prompt ────────────────────────────────────────────────────
let stairPrompt = '';

// ─── Damage Numbers (floating combat text) ───────────────────────────
let damageNumbers = [];
// Utility: darken a hex color
function darkenColor(hex, factor) {
    let r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
    r = Math.round(r * factor); g = Math.round(g * factor); b = Math.round(b * factor);
    return '#' + ((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
}

function spawnDmgNum(x, y, text, color, big) {
    damageNumbers.push({
        x, y, text: String(text), color: color || '#ff4444',
        vy: -2.5 - Math.random(), vx: (Math.random() - 0.5) * 2,
        life: 1200, max: 1200, scale: big ? 1.6 : 1.0,
        rot: (Math.random() - 0.5) * 0.3
    });
}

// ─── Combo System ────────────────────────────────────────────────────
let comboCount = 0;
let comboTimer = 0;
let comboDisplay = 0;
let comboBest = 0;
const COMBO_DECAY = 1800;

// ─── Smooth Health Bars ──────────────────────────────────────────────
let smoothPlayerHP = 100;
let smoothEnemyHP = 100;

// ─── Blood Screen Overlay ────────────────────────────────────────────
let bloodOverlay = 0;
let bloodDrips = [];

// ─── Speed Lines ─────────────────────────────────────────────────────
let speedLines = [];
function spawnSpeedLines(count, color) {
    for (let i = 0; i < count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let dist = 80 + Math.random() * 180;
        speedLines.push({
            x: W / 2 + Math.cos(angle) * dist,
            y: H / 2 + Math.sin(angle) * dist,
            angle, len: 30 + Math.random() * 60,
            life: 200 + Math.random() * 200, max: 400,
            color: color || '#ffffff', width: 1 + Math.random() * 2
        });
    }
}

// ─── Camera Tilt ─────────────────────────────────────────────────────
let cameraTilt = 0;
let cameraTiltTarget = 0;

// ─── Ambient Dust (explore mode) ─────────────────────────────────────
let dustParticles = [];
function initDust() {
    dustParticles = [];
    for (let i = 0; i < 30; i++) {
        dustParticles.push({
            x: Math.random() * W, y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.3, vy: Math.random() * 0.2 + 0.05,
            size: 0.5 + Math.random() * 1.5, alpha: 0.1 + Math.random() * 0.2
        });
    }
}
initDust();

// ─── Footstep Timer ──────────────────────────────────────────────────
let footstepTimer = 0;

// ─── Menu Background Particles ───────────────────────────────────────
let menuParticles = [];
for (let i = 0; i < 50; i++) {
    menuParticles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5, vy: -0.3 - Math.random() * 0.5,
        size: 1 + Math.random() * 3, alpha: 0.1 + Math.random() * 0.4,
        color: ['#ff0000', '#ff4400', '#ff6600', '#ffaa00'][Math.floor(Math.random() * 4)]
    });
}

// ─── Impact Ring Effect ──────────────────────────────────────────────
let impactRings = [];
function spawnImpactRing(x, y, color, maxR) {
    impactRings.push({ x, y, r: 5, maxR: maxR || 80, life: 400, max: 400, color: color || '#ff4444' });
}

// ─── Slow-motion Effect ──────────────────────────────────────────────
let slowMoTimer = 0;
let slowMoFactor = 1;

// ─── Screen Warp ─────────────────────────────────────────────────────
let screenWarp = 0;

// ─── Combat State ────────────────────────────────────────────────────
let combat = resetCombat();
function resetCombat() {
    return {
        enemy: null, attacking: false, attackType: null, attackTimer: 0, cooldown: 0,
        combo1: null, combo2: null, blocking: false,
        enemyNext: 0, enemyWindup: false, enemyWindupTimer: 0,
        enemyWindupHand: 'left', enemyComboCount: 0, enemyAttackInfo: null,
        hitFlash: 0, enemyHitFlash: 0, shake: 0,
        msg: '', msgTimer: 0, bob: 0, bobDir: 1,
        introTimer: 0, koTimer: 0,
        dodging: false, dodgeDir: 0, dodgeTimer: 0, dodgeCooldown: 0,
        lastSlipDir: 0, uppercutHand: 'right',
        cutsceneLines: [], cutsceneIdx: 0, cutsceneCharIdx: 0,
        cutsceneTyped: '', cutsceneDelay: 0, cutsceneKO: false,
    };
}

// ─── Input ───────────────────────────────────────────────────────────
let keys = {};
document.addEventListener('keydown', e => {
    let k = e.key.toLowerCase();
    keys[k] = true;

    if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();

    switch (state) {
        case ST.MENU:
            if (k === 'arrowup' || k === 'w') { menuCursor = (menuCursor - 1 + MENU_OPTIONS.length) % MENU_OPTIONS.length; SFX.menuMove(); }
            if (k === 'arrowdown' || k === 's') { menuCursor = (menuCursor + 1) % MENU_OPTIONS.length; SFX.menuMove(); }
            if (e.key === 'Enter') { SFX.menuSelect(); selectMenuOption(); }
            break;
        case ST.SHOP:
            handleShopInput(e);
            break;
        case ST.SETTINGS:
            handleSettingsInput(e);
            break;
        case ST.EXPLORE:
            if (k === 'e') useStairs();
            if (e.key === 'Shift') drinkBottle();
            if (e.key === 'Escape') { SFX.menuBack(); settingsPrevState = ST.EXPLORE; state = ST.SETTINGS; settingsCursor = 0; }
            break;
        case ST.COMBAT:
            handleCombatKey(e.key, k);
            if (e.key === 'Shift') drinkBottle();
            if (e.key === 'Escape') { SFX.menuBack(); settingsPrevState = ST.COMBAT; state = ST.SETTINGS; settingsCursor = 0; }
            break;
        case ST.CUTSCENE:
            if (e.key === 'Enter' || e.key === ' ') { SFX.cutsceneNext(); advanceCutscene(); }
            break;
        case ST.GAMEOVER:
        case ST.WIN:
            if (e.key === 'Enter') { SFX.menuSelect(); state = ST.MENU; menuCursor = 0; }
            break;
    }
});
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// ─── Mouse / Click Input ─────────────────────────────────────────────
let mouseX = W / 2, mouseY = H / 2;  // Track mouse position on canvas
let mouseOnCanvas = false;

function getCanvasCoords(e) {
    let rect = canvas.getBoundingClientRect();
    let scaleX = W / rect.width;
    let scaleY = H / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

canvas.addEventListener('mouseenter', () => { mouseOnCanvas = true; });
canvas.addEventListener('mouseleave', () => { mouseOnCanvas = false; });

canvas.addEventListener('mousemove', e => {
    let { x, y } = getCanvasCoords(e);
    mouseX = x; mouseY = y;
    switch (state) {
        case ST.MENU: {
            let startY = H * 0.46;
            for (let i = 0; i < MENU_OPTIONS.length; i++) {
                let iy = startY + i * 42;
                if (y >= iy - 18 && y <= iy + 18 && x >= W * 0.15 && x <= W * 0.85) {
                    if (menuCursor !== i) { menuCursor = i; SFX.menuMove(); }
                    break;
                }
            }
            break;
        }
        case ST.SHOP: {
            let items = shopTab === 0 ? SKINS : GLOVES_SHOP;
            let visibleItems = Math.min(items.length, 8);
            let scrollOffset = Math.max(0, shopCursor - visibleItems + 3);
            scrollOffset = Math.min(scrollOffset, Math.max(0, items.length - visibleItems));
            let shopStartY = 130;
            for (let vi = 0; vi < visibleItems; vi++) {
                let i = vi + scrollOffset;
                if (i >= items.length) break;
                let iy = shopStartY + vi * 38;
                if (y >= iy - 14 && y <= iy + 20 && x >= 20 && x <= W * 0.46) {
                    if (shopCursor !== i) { shopCursor = i; SFX.menuMove(); }
                    break;
                }
            }
            break;
        }
        case ST.SETTINGS: {
            let setStartY = 120;
            for (let i = 0; i < SETTINGS_OPTS.length; i++) {
                let iy = setStartY + i * 48;
                if (y >= iy - 18 && y <= iy + 18 && x >= W * 0.15 && x <= W * 0.85) {
                    if (settingsCursor !== i) { settingsCursor = i; SFX.menuMove(); }
                    break;
                }
            }
            break;
        }
    }
});

// Prevent right-click context menu on canvas
canvas.addEventListener('contextmenu', e => { e.preventDefault(); });

canvas.addEventListener('click', e => {
    let { x, y } = getCanvasCoords(e);
    ensureAudio(); // Resume audio context on first click
    handleCanvasClick(x, y, 'left');
});

canvas.addEventListener('contextmenu', e => { e.preventDefault(); });
canvas.addEventListener('mousedown', e => {
    if (e.button === 2) {
        e.preventDefault();
        let { x, y } = getCanvasCoords(e);
        ensureAudio();
        handleCanvasClick(x, y, 'right');
    }
});

function getCombatBtnLayout(en) {
    let btnH = 40, btnW = 90, gap = 10;
    let allBtns = en && en.isBag
        ? [{l:'JAB',k:'1'},{l:'CROSS',k:'2'},{l:'UPPER',k:'3'}]
        : [{l:'JAB',k:'1'},{l:'CROSS',k:'2'},{l:'UPPER',k:'3'},{l:'SPECIAL',k:'Q'},{l:'BLOCK',k:' '},{l:'DRINK',k:'Shift'}];
    let row1 = allBtns.slice(0, en && en.isBag ? 3 : 4);
    let row2 = allBtns.slice(en && en.isBag ? 3 : 4);
    return { row1, row2, btnH, btnW, gap };
}

function handleCanvasClick(x, y, button) {
    switch (state) {
        case ST.MENU: {
            let startY = H * 0.46;
            for (let i = 0; i < MENU_OPTIONS.length; i++) {
                let iy = startY + i * 42;
                if (y >= iy - 18 && y <= iy + 18 && x >= W * 0.15 && x <= W * 0.85) {
                    menuCursor = i;
                    SFX.menuSelect();
                    selectMenuOption();
                    return;
                }
            }
            break;
        }
        case ST.SHOP: {
            // Tab buttons
            if (x >= W * 0.05 && x <= W * 0.35) {
                if (y >= 58 && y <= 82) { shopTab = 0; shopCursor = 0; SFX.menuMove(); return; }
                if (y >= 80 && y <= 104) { shopTab = 1; shopCursor = 0; SFX.menuMove(); return; }
            }
            let items = shopTab === 0 ? SKINS : GLOVES_SHOP;
            let visibleItems = Math.min(items.length, 8);
            let scrollOffset = Math.max(0, shopCursor - visibleItems + 3);
            scrollOffset = Math.min(scrollOffset, Math.max(0, items.length - visibleItems));
            let shopStartY = 130;
            for (let vi = 0; vi < visibleItems; vi++) {
                let idx = vi + scrollOffset;
                if (idx >= items.length) break;
                let iy = shopStartY + vi * 38;
                if (y >= iy - 14 && y <= iy + 20 && x >= 20 && x <= W * 0.46) {
                    if (shopCursor === idx) shopAction();
                    else { shopCursor = idx; SFX.menuMove(); }
                    return;
                }
            }
            break;
        }
        case ST.SETTINGS: {
            let setStartY = 120;
            for (let i = 0; i < SETTINGS_OPTS.length; i++) {
                let iy = setStartY + i * 48;
                if (y >= iy - 18 && y <= iy + 18 && x >= W * 0.15 && x <= W * 0.85) {
                    settingsCursor = i;
                    if (i <= 2) {
                        let dir = x < W * 0.5 ? -1 : 1;
                        switch (i) {
                            case 0: settings.difficulty = Math.max(0, Math.min(2, settings.difficulty + dir)); break;
                            case 1: settings.sensitivity = Math.round(Math.max(0.3, Math.min(3.0, settings.sensitivity + dir * 0.1)) * 10) / 10; break;
                            case 2: settings.speed = Math.round(Math.max(0.3, Math.min(3.0, settings.speed + dir * 0.1)) * 10) / 10; break;
                        }
                        SFX.settingChange();
                    } else if (i === 3) { settings.screenShake = !settings.screenShake; SFX.settingChange(); }
                    else if (i === 4) { settings.showMinimap = !settings.showMinimap; SFX.settingChange(); }
                    else if (i === 5) { SFX.menuSelect(); exitSettings(); }
                    else if (i === 6) { SFX.menuSelect(); settingsPrevState = null; state = ST.MENU; menuCursor = 0; }
                    return;
                }
            }
            break;
        }
        case ST.COMBAT: {
            let en = combat.enemy;
            // Left click anywhere in combat area = Jab (key 1); Right click = Cross (key 2)
            // But first check if they clicked a specific button
            let layout = getCombatBtnLayout(en);
            let { row1, row2, btnH, btnW, gap } = layout;
            let r1Y = H - btnH - 6 - (row2.length > 0 ? btnH + 6 : 0);
            let r1Total = row1.length * (btnW + gap) - gap;
            let r1X = (W - r1Total) / 2;
            for (let bi = 0; bi < row1.length; bi++) {
                let bx = r1X + bi * (btnW + gap);
                if (x >= bx && x <= bx + btnW && y >= r1Y && y <= r1Y + btnH) {
                    handleCombatKey(row1[bi].k, row1[bi].k.toLowerCase());
                    return;
                }
            }
            if (row2.length > 0) {
                let r2Y = H - btnH - 6;
                let r2Total = row2.length * (btnW + gap) - gap;
                let r2X = (W - r2Total) / 2;
                for (let bi = 0; bi < row2.length; bi++) {
                    let bx = r2X + bi * (btnW + gap);
                    if (x >= bx && x <= bx + btnW && y >= r2Y && y <= r2Y + btnH) {
                        if (row2[bi].k === ' ') { keys[' '] = true; setTimeout(() => { keys[' '] = false; }, 300); }
                        else if (row2[bi].k === 'Shift') drinkBottle();
                        else handleCombatKey(row2[bi].k, row2[bi].k.toLowerCase());
                        return;
                    }
                }
            }
            // Dodge zones
            if (y >= H * 0.2 && y <= H * 0.65) {
                if (x < W * 0.12) { handleCombatKey('a', 'a'); return; }
                if (x > W * 0.88) { handleCombatKey('d', 'd'); return; }
            }
            // Default: left click = jab, right click = cross (if not on a button)
            if (button === 'left') handleCombatKey('1', '1');
            else if (button === 'right') handleCombatKey('2', '2');
            break;
        }
        case ST.EXPLORE: {
            // Stats button toggle (top-left)
            if (x >= 10 && x <= 90 && y >= 10 && y <= 38) {
                statsOpen = !statsOpen;
                SFX.menuMove();
                return;
            }
            // Click stair prompt area
            if (stairPrompt && y >= H / 2 + 30 && y <= H / 2 + 68) {
                useStairs();
                return;
            }
            // Click drink button inside stats panel (when open)
            if (statsOpen) {
                let alive = enemies.filter(e => e.alive && !e.isBag).length;
                let bags = enemies.filter(e => e.alive && e.isBag).length;
                let drBtnY = 44 + 18 + 18 + 18 + (bags > 0 ? 18 : 0) - 2;
                if (x >= 16 && x <= 184 && y >= drBtnY && y <= drBtnY + 22) {
                    drinkBottle();
                    return;
                }
            }
            break;
        }
        case ST.CUTSCENE:
            SFX.cutsceneNext(); advanceCutscene();
            break;
        case ST.GAMEOVER:
        case ST.WIN:
            SFX.menuSelect(); state = ST.MENU; menuCursor = 0;
            break;
        case ST.FIGHT_INTRO:
            break;
    }
}

function selectMenuOption() {
    switch (menuCursor) {
        case 0: startGame(); break;
        case 1: state = ST.SHOP; shopCursor = 0; shopTab = 0; break;
        case 2: settingsPrevState = null; state = ST.SETTINGS; settingsCursor = 0; break;
    }
}

// ─── Shop Input ──────────────────────────────────────────────────────
function handleShopInput(e) {
    let k = e.key.toLowerCase();
    let items = shopTab === 0 ? SKINS : GLOVES_SHOP;
    if (k === 'arrowup' || k === 'w') { shopCursor = (shopCursor - 1 + items.length) % items.length; SFX.menuMove(); }
    if (k === 'arrowdown' || k === 's') { shopCursor = (shopCursor + 1) % items.length; SFX.menuMove(); }
    if (k === 'arrowleft' || k === 'arrowright' || k === 'tab') {
        e.preventDefault();
        shopTab = 1 - shopTab;
        shopCursor = 0;
        SFX.menuMove();
    }
    if (e.key === 'Enter') shopAction();
    if (e.key === 'Escape' || e.key === 'Backspace') { SFX.menuBack(); state = ST.MENU; menuCursor = 0; }
}

function shopAction() {
    if (shopTab === 0) {
        let item = SKINS[shopCursor];
        if (saveData.ownedSkins.includes(item.id)) {
            saveData.equippedSkin = item.id;
            addNotif('Equipped: ' + item.name, 1500);
            SFX.shopEquip();
        } else if (saveData.coins >= item.price) {
            saveData.coins -= item.price;
            saveData.ownedSkins.push(item.id);
            saveData.equippedSkin = item.id;
            addNotif('Purchased & Equipped: ' + item.name, 2000);
            SFX.shopBuy();
        } else {
            addNotif('Not enough coins!', 1500);
            SFX.shopFail();
        }
    } else {
        let item = GLOVES_SHOP[shopCursor];
        if (saveData.ownedGloves.includes(item.id)) {
            saveData.equippedGloves = item.id;
            addNotif('Equipped: ' + item.name, 1500);
            SFX.shopEquip();
        } else if (saveData.coins >= item.price) {
            saveData.coins -= item.price;
            saveData.ownedGloves.push(item.id);
            saveData.equippedGloves = item.id;
            addNotif('Purchased & Equipped: ' + item.name, 2000);
            SFX.shopBuy();
        } else {
            addNotif('Not enough coins!', 1500);
            SFX.shopFail();
        }
    }
    writeSave();
}

// ─── Settings Input ──────────────────────────────────────────────────
function handleSettingsInput(e) {
    let k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') { settingsCursor = (settingsCursor - 1 + SETTINGS_OPTS.length) % SETTINGS_OPTS.length; SFX.menuMove(); }
    if (k === 'arrowdown' || k === 's') { settingsCursor = (settingsCursor + 1) % SETTINGS_OPTS.length; SFX.menuMove(); }
    if (k === 'arrowleft' || k === 'arrowright' || e.key === 'Enter') {
        let dir = k === 'arrowleft' ? -1 : 1;
        switch (settingsCursor) {
            case 0: settings.difficulty = Math.max(0, Math.min(2, settings.difficulty + dir)); SFX.settingChange(); break;
            case 1: settings.sensitivity = Math.round(Math.max(0.3, Math.min(3.0, settings.sensitivity + dir * 0.1)) * 10) / 10; SFX.settingChange(); break;
            case 2: settings.speed = Math.round(Math.max(0.3, Math.min(3.0, settings.speed + dir * 0.1)) * 10) / 10; SFX.settingChange(); break;
            case 3: settings.screenShake = !settings.screenShake; SFX.settingChange(); break;
            case 4: settings.showMinimap = !settings.showMinimap; SFX.settingChange(); break;
            case 5:
                if (e.key === 'Enter') { SFX.menuSelect(); exitSettings(); }
                break;
            case 6:
                if (e.key === 'Enter') { SFX.menuSelect(); settingsPrevState = null; state = ST.MENU; menuCursor = 0; }
                break;
        }
    }
    if (e.key === 'Escape' || e.key === 'Backspace') { SFX.menuBack(); exitSettings(); }
}

function exitSettings() {
    if (settingsPrevState !== null) {
        state = settingsPrevState;
        settingsPrevState = null;
    } else {
        state = ST.MENU;
        menuCursor = 0;
    }
}

// ─── Drink Bottle ────────────────────────────────────────────────────
function drinkBottle() {
    if (inventory.bottles <= 0) return;
    inventory.bottles--;
    drinkCount++;
    player.health = player.maxHealth;
    SFX.drink();
    if (drinkCount === 1) { drunkLevel = 1; drunkNotify = 'TIPSY'; drunkNotifyTimer = 2500; drunkBlurAmount = 2; }
    else if (drinkCount >= 2) { drunkLevel = 2; drunkNotify = 'DRUNK'; drunkNotifyTimer = 3500; drunkBlurAmount = 5; }
}

// ─── Combat Key Handling ─────────────────────────────────────────────
function handleCombatKey(key, kLower) {
    // Dodge / Slip — also support arrow keys
    if ((key === 'a' || key === 'A' || kLower === 'arrowleft') && combat.dodgeCooldown <= 0 && !combat.dodging) {
        combat.dodging = true; combat.dodgeDir = -1;
        combat.dodgeTimer = DODGE_DURATION; combat.dodgeCooldown = DODGE_COOLDOWN;
        combat.lastSlipDir = -1;
        combat.msg = 'SLIP LEFT!'; combat.msgTimer = 300; SFX.dodge(); return;
    }
    if ((key === 'd' || key === 'D' || kLower === 'arrowright') && combat.dodgeCooldown <= 0 && !combat.dodging) {
        combat.dodging = true; combat.dodgeDir = 1;
        combat.dodgeTimer = DODGE_DURATION; combat.dodgeCooldown = DODGE_COOLDOWN;
        combat.lastSlipDir = 1;
        combat.msg = 'SLIP RIGHT!'; combat.msgTimer = 300; SFX.dodge(); return;
    }
    if ((key === 's' || key === 'S' || kLower === 'arrowdown') && combat.dodgeCooldown <= 0 && !combat.dodging) {
        combat.dodging = true; combat.dodgeDir = 0;
        combat.dodgeTimer = SLIP_BACK_DURATION; combat.dodgeCooldown = DODGE_COOLDOWN;
        combat.msg = 'SLIP BACK!'; combat.msgTimer = 300; SFX.dodge(); return;
    }
    if (combat.cooldown > 0 || combat.attacking) return;

    // Jab / Left Hook (key 1)
    if (key === '1') {
        if (combat.combo1) { clearTimeout(combat.combo1); combat.combo1 = null; executeAttack('leftHook'); }
        else { combat.combo1 = setTimeout(() => { combat.combo1 = null; executeAttack('jab'); }, COMBO_WINDOW); }
    }
    // Cross / Right Hook (key 2)
    if (key === '2') {
        if (combat.combo2) { clearTimeout(combat.combo2); combat.combo2 = null; executeAttack('rightHook'); }
        else { combat.combo2 = setTimeout(() => { combat.combo2 = null; executeAttack('cross'); }, COMBO_WINDOW); }
    }
    // Uppercut (key 3) — hand depends on last slip direction
    if (key === '3') {
        combat.uppercutHand = combat.lastSlipDir === -1 ? 'left' : 'right';
        executeAttack('uppercut');
    }
    // Special Move (key Q) — requires full XP
    if (key === 'q' || key === 'Q') {
        if (playerXp >= MAX_XP) {
            executeSpecial();
        }
    }
}

function executeAttack(type) {
    if (combat.cooldown > 0 || combat.attacking) return;
    combat.attacking = true;
    combat.attackType = type;
    combat.attackTimer = ATTACKS[type].anim;
}

function executeSpecial() {
    if (combat.cooldown > 0 || combat.attacking) return;
    combat.attacking = true;
    combat.attackType = 'special';
    combat.attackTimer = 500;
    playerXp = 0;
}

// ─── Stair Detection ─────────────────────────────────────────────────
function getNearbyStair() {
    let px = Math.floor(player.x), py = Math.floor(player.y);
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            let mx = px + dx, my = py + dy;
            if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) continue;
            let tile = currentMap[my][mx];
            if (tile === 2 || tile === 3) {
                let dist = Math.hypot((mx + 0.5) - player.x, (my + 0.5) - player.y);
                if (dist < STAIR_DIST) return tile === 2 ? 'up' : 'down';
            }
        }
    }
    return null;
}

function useStairs() {
    let dir = getNearbyStair();
    if (!dir) return;
    SFX.stairs();
    if (dir === 'up' && currentLevel < LEVELS.length - 1) {
        let next = currentLevel + 1;
        startTransition('FLOOR ' + LEVELS[next].floor + ': ' + LEVELS[next].name, () => loadLevel(next, 'up'));
    } else if (dir === 'down' && currentLevel > 0) {
        let next = currentLevel - 1;
        startTransition('FLOOR ' + LEVELS[next].floor + ': ' + LEVELS[next].name, () => loadLevel(next, 'down'));
    }
}

// ─── Level Loading ───────────────────────────────────────────────────
function loadLevel(idx, fromDir) {
    currentLevel = idx;
    let lvl = LEVELS[idx];
    currentMap = lvl.map;
    let dm = DIFF_MULT[settings.difficulty];

    enemies = [];
    lvl.enemies.forEach((e, i) => {
        if (defeatedEnemies.has(idx + '_' + i)) return;
        enemies.push({
            x: e.x, y: e.y, name: e.name, origIdx: i,
            health: Math.floor(e.hp * dm.eHp), maxHealth: Math.floor(e.hp * dm.eHp),
            dmg: [e.dmg[0] * dm.eDmg, e.dmg[1] * dm.eDmg],
            interval: e.interval, coins: e.coins, alive: true, isBag: false,
            color: (VILLAIN_DATA[e.name] || {}).gloveColor || '#cc0000',
        });
    });

    // Load punching bags
    if (lvl.bags) {
        lvl.bags.forEach((b, i) => {
            if (defeatedEnemies.has(idx + '_bag' + i)) return;
            enemies.push({
                x: b.x, y: b.y, name: 'Punching Bag', origIdx: 'bag' + i,
                health: b.hp, maxHealth: b.hp,
                dmg: [0, 0], interval: 99999, coins: 15, alive: true, isBag: true,
                color: '#886644',
            });
        });
    }

    bottles = lvl.bottles.map((b, i) => ({
        x: b.x, y: b.y, picked: pickedBottles.has(idx + '_b' + i), key: idx + '_b' + i
    }));

    if (fromDir === 'up' && lvl.spawnFromBelow) {
        let sp = lvl.spawnFromBelow;
        player.x = sp.x; player.y = sp.y; player.angle = sp.angle;
    } else if (fromDir === 'down' && lvl.spawnFromAbove) {
        let sp = lvl.spawnFromAbove;
        player.x = sp.x; player.y = sp.y; player.angle = sp.angle;
    } else if (lvl.playerStart) {
        let sp = lvl.playerStart;
        player.x = sp.x; player.y = sp.y; player.angle = sp.angle;
    }
}

// ─── Level Transition ────────────────────────────────────────────────
function startTransition(text, callback) {
    transAlpha = 0; transDir = 1; transText = text; transCallback = callback;
    state = ST.LEVEL_TRANS;
}

function updateTransition(dt) {
    if (transDir === 1) {
        transAlpha += dt * 0.003;
        if (transAlpha >= 1) {
            transAlpha = 1;
            if (transCallback) { transCallback(); transCallback = null; }
            transDir = -1;
        }
    } else {
        transAlpha -= dt * 0.003;
        if (transAlpha <= 0) { transAlpha = 0; state = ST.EXPLORE; }
    }
}

function renderTransition() {
    renderExplore();
    ctx.fillStyle = 'rgba(0,0,0,' + transAlpha + ')';
    ctx.fillRect(0, 0, W, H);
    if (transAlpha > 0.4) {
        let ta = Math.min(1, (transAlpha - 0.4) * 2.5);
        let t = Date.now() * 0.001;

        // Animated text with scale
        let textScale = 0.8 + ta * 0.2;
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(textScale, textScale);

        ctx.fillStyle = 'rgba(255,0,0,' + ta + ')';
        ctx.font = 'bold 32px Courier New';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 20 + Math.sin(t * 5) * 5;
        ctx.fillText(transText, 0, 0);

        // Decorative lines
        let lineW = ctx.measureText(transText).width * 0.6;
        ctx.strokeStyle = 'rgba(255,100,100,' + (ta * 0.5) + ')'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-lineW, 24); ctx.lineTo(lineW, 24); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-lineW, -24); ctx.lineTo(lineW, -24); ctx.stroke();

        ctx.font = '16px Courier New';
        ctx.fillStyle = 'rgba(255,100,100,' + ta + ')';
        ctx.fillText('Entering...', 0, 44);
        ctx.shadowBlur = 0;
        ctx.restore();
        ctx.textBaseline = 'alphabetic';
    }
}

// ─── All Enemies Defeated Check ──────────────────────────────────────
function allEnemiesDefeated() {
    for (let i = 0; i < LEVELS.length; i++)
        for (let j = 0; j < LEVELS[i].enemies.length; j++)
            if (!defeatedEnemies.has(i + '_' + j)) return false;
    return true;
}

// ─── Floor/Ceiling Rendering ─────────────────────────────────────────
function renderFloorCeiling() {
    let lvl = LEVELS[currentLevel];
    let c1 = lvl.floorC1, c2 = lvl.floorC2;
    // Parse floor colors for checkerboard
    let fc1r = parseInt(c1.substr(1,2),16), fc1g = parseInt(c1.substr(3,2),16), fc1b = parseInt(c1.substr(5,2),16);
    let fc2r = parseInt(c2.substr(1,2),16), fc2g = parseInt(c2.substr(3,2),16), fc2b = parseInt(c2.substr(5,2),16);

    for (let y = Math.floor(H / 2) + 1; y < H; y++) {
        let rowDist = (H * 0.5) / (y - H / 2);
        let shade = Math.min(1, 1.5 / (rowDist * 0.4 + 1));

        let floorStepX = (Math.cos(player.angle + FOV/2) - Math.cos(player.angle - FOV/2)) * rowDist / W;
        let floorStepY = (Math.sin(player.angle + FOV/2) - Math.sin(player.angle - FOV/2)) * rowDist / W;
        let floorX = player.x + Math.cos(player.angle - FOV/2) * rowDist;
        let floorY = player.y + Math.sin(player.angle - FOV/2) * rowDist;

        // Draw floor in strips of 4 pixels for performance
        for (let x = 0; x < W; x += 4) {
            let cellX = Math.floor(floorX);
            let cellY = Math.floor(floorY);
            let checker = ((cellX + cellY) & 1) === 0;
            let r, g, b;
            if (checker) { r = fc2r; g = fc2g; b = fc2b; }
            else { r = fc1r * 2; g = fc1g * 2; b = fc1b * 2; }
            r = Math.floor(r * shade); g = Math.floor(g * shade); b = Math.floor(b * shade);
            ctx.fillStyle = 'rgb(' + Math.min(255,r) + ',' + Math.min(255,g) + ',' + Math.min(255,b) + ')';
            ctx.fillRect(x, y, 4, 1);
            // Ceiling (darker, mirrored)
            let cr = Math.floor(r * 0.4), cg = Math.floor(g * 0.4), cb = Math.floor(b * 0.4);
            ctx.fillStyle = 'rgb(' + cr + ',' + cg + ',' + cb + ')';
            ctx.fillRect(x, H - y, 4, 1);

            floorX += floorStepX * 4;
            floorY += floorStepY * 4;
        }
    }
}

// ─── Raycasting ──────────────────────────────────────────────────────
function castRays() {
    let lvl = LEVELS[currentLevel];
    let tint = lvl.wallTint;
    const zBuf = new Float64Array(W);

    // Render floor/ceiling first
    renderFloorCeiling();

    for (let col = 0; col < W; col++) {
        let rayAngle = player.angle - FOV / 2 + (col / W) * FOV;
        let dirX = Math.cos(rayAngle), dirY = Math.sin(rayAngle);
        let mapX = Math.floor(player.x), mapY = Math.floor(player.y);
        let ddx = Math.abs(1 / dirX), ddy = Math.abs(1 / dirY);
        let stepX, stepY, sideX, sideY;
        if (dirX < 0) { stepX = -1; sideX = (player.x - mapX) * ddx; }
        else { stepX = 1; sideX = (mapX + 1 - player.x) * ddx; }
        if (dirY < 0) { stepY = -1; sideY = (player.y - mapY) * ddy; }
        else { stepY = 1; sideY = (mapY + 1 - player.y) * ddy; }
        let hit = false, side = 0, hitTile = 1;
        while (!hit) {
            if (sideX < sideY) { sideX += ddx; mapX += stepX; side = 0; }
            else { sideY += ddy; mapY += stepY; side = 1; }
            if (mapX < 0 || mapX >= MAP_W || mapY < 0 || mapY >= MAP_H) { hit = true; hitTile = 1; }
            else if (currentMap[mapY][mapX] > 0) { hit = true; hitTile = currentMap[mapY][mapX]; }
        }
        let dist;
        if (side === 0) dist = (mapX - player.x + (1 - stepX) / 2) / dirX;
        else dist = (mapY - player.y + (1 - stepY) / 2) / dirY;
        let corrected = dist * Math.cos(rayAngle - player.angle);
        if (corrected < 0.01) corrected = 0.01;
        zBuf[col] = corrected;
        let wallH = H / corrected;
        let top = (H - wallH) / 2;
        let shade = Math.min(220, Math.floor(200 / (corrected * 0.35 + 1)));
        let r, g, b;
        if (hitTile === 2) { r = Math.floor(shade * 0.2); g = Math.floor(shade * 0.9); b = Math.floor(shade * 0.3); }
        else if (hitTile === 3) { r = Math.floor(shade * 0.2); g = Math.floor(shade * 0.3); b = Math.floor(shade * 0.9); }
        else { r = Math.floor(shade * tint[0]); g = Math.floor(shade * tint[1]); b = Math.floor(shade * tint[2]); }
        if (side === 1) { r = Math.floor(r * 0.65); g = Math.floor(g * 0.65); b = Math.floor(b * 0.65); }

        // Wall gradient for depth — brighter at top, darker at bottom
        let wallGrad = ctx.createLinearGradient(0, top, 0, top + wallH);
        let topR = Math.min(255, r + 20), topG = Math.min(255, g + 10), topB = Math.min(255, b + 10);
        let botR = Math.floor(r * 0.6), botG = Math.floor(g * 0.6), botB = Math.floor(b * 0.6);
        wallGrad.addColorStop(0, 'rgb(' + topR + ',' + topG + ',' + topB + ')');
        wallGrad.addColorStop(0.5, 'rgb(' + r + ',' + g + ',' + b + ')');
        wallGrad.addColorStop(1, 'rgb(' + botR + ',' + botG + ',' + botB + ')');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(col, top, 1, wallH);

        // Stair glow effect
        if (hitTile === 2 || hitTile === 3) {
            let glowA = Math.max(0, 0.2 - corrected * 0.03);
            ctx.fillStyle = hitTile === 2 ? 'rgba(0,255,100,' + glowA + ')' : 'rgba(100,100,255,' + glowA + ')';
            ctx.fillRect(col, top, 1, wallH);
        }
    }
    return zBuf;
}

// ─── Sprite Rendering (enemies + bags + bottles in 3D) ───────────────
function renderSprites(zBuf) {
    let list = [];
    for (let e of enemies) {
        if (!e.alive) continue;
        let dx = e.x - player.x, dy = e.y - player.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx) - player.angle;
        while (angle < -Math.PI) angle += Math.PI * 2;
        while (angle > Math.PI) angle -= Math.PI * 2;
        if (Math.abs(angle) < FOV / 2 + 0.25 && dist > 0.3)
            list.push({ type: e.isBag ? 'bag' : 'enemy', dist, angle, data: e });
    }
    for (let b of bottles) {
        if (b.picked) continue;
        let dx = b.x - player.x, dy = b.y - player.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx) - player.angle;
        while (angle < -Math.PI) angle += Math.PI * 2;
        while (angle > Math.PI) angle -= Math.PI * 2;
        if (Math.abs(angle) < FOV / 2 + 0.25 && dist > 0.3)
            list.push({ type: 'bottle', dist, angle, data: b });
    }
    list.sort((a, b) => b.dist - a.dist);

    for (let item of list) {
        let screenX = W / 2 + (item.angle / (FOV / 2)) * (W / 2);
        let centerCol = Math.max(0, Math.min(W - 1, Math.floor(screenX)));
        if (item.dist >= zBuf[centerCol]) continue;

        if (item.type === 'enemy') {
            let e = item.data;
            let size = Math.min(H * 0.9, (1 / item.dist) * 260);
            let sh = Math.min(220, Math.floor(180 / (item.dist * 0.3 + 1)));
            let vd = VILLAIN_DATA[e.name];
            let rc = sh, gc = Math.floor(sh * 0.15), bc = Math.floor(sh * 0.1);
            if (vd) {
                let hex = vd.bodyColor;
                let cr = parseInt(hex.substr(1, 2), 16) / 255;
                let cg = parseInt(hex.substr(3, 2), 16) / 255;
                let cb = parseInt(hex.substr(5, 2), 16) / 255;
                rc = Math.floor(sh * cr * 1.5); gc = Math.floor(sh * cg * 1.5); bc = Math.floor(sh * cb * 1.5);
            }

            // Ground shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(screenX, H / 2 + size * 0.38, size * 0.2, size * 0.04, 0, 0, Math.PI * 2);
            ctx.fill();

            // Idle sway for enemy sprite
            let spriteSway = Math.sin(Date.now() * 0.003 + e.x * 10) * 2;

            let bodyCol = 'rgb(' + Math.min(255, rc) + ',' + Math.min(255, gc) + ',' + Math.min(255, bc) + ')';
            ctx.fillStyle = bodyCol;
            // Head
            ctx.beginPath(); ctx.arc(screenX + spriteSway * 0.5, H / 2 - size * 0.35, size * 0.1, 0, Math.PI * 2); ctx.fill();
            // Eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(screenX - size * 0.05 + spriteSway * 0.5, H / 2 - size * 0.37, size * 0.03, size * 0.02);
            ctx.fillRect(screenX + size * 0.02 + spriteSway * 0.5, H / 2 - size * 0.37, size * 0.03, size * 0.02);
            // Body
            ctx.fillStyle = bodyCol;
            ctx.fillRect(screenX - size * 0.12, H / 2 - size * 0.25, size * 0.24, size * 0.35);
            // Body shading
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(screenX + size * 0.04, H / 2 - size * 0.25, size * 0.08, size * 0.35);
            // Arms
            ctx.fillStyle = bodyCol;
            ctx.fillRect(screenX - size * 0.22, H / 2 - size * 0.18, size * 0.08, size * 0.25);
            ctx.fillRect(screenX + size * 0.14, H / 2 - size * 0.18, size * 0.08, size * 0.25);
            // Legs
            ctx.fillRect(screenX - size * 0.09, H / 2 + size * 0.1, size * 0.07, size * 0.28);
            ctx.fillRect(screenX + size * 0.02, H / 2 + size * 0.1, size * 0.07, size * 0.28);
            // Shoes
            ctx.fillStyle = '#222';
            ctx.fillRect(screenX - size * 0.1, H / 2 + size * 0.36, size * 0.09, size * 0.04);
            ctx.fillRect(screenX + size * 0.01, H / 2 + size * 0.36, size * 0.09, size * 0.04);
            // Gloves
            ctx.fillStyle = vd ? vd.gloveColor : '#cc0000';
            ctx.beginPath(); ctx.arc(screenX - size * 0.18 + spriteSway, H / 2 + size * 0.07, size * 0.05, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(screenX + size * 0.18 - spriteSway, H / 2 + size * 0.07, size * 0.05, 0, Math.PI * 2); ctx.fill();
            // Health bar with gradient
            let bw = size * 0.4, bh = 4;
            let bx = screenX - bw / 2, by = H / 2 - size * 0.45;
            let pct = Math.max(0, e.health / e.maxHealth);
            ctx.fillStyle = '#220000'; ctx.fillRect(bx, by, bw, bh);
            let hpGrad = ctx.createLinearGradient(bx, by, bx + bw * pct, by);
            hpGrad.addColorStop(0, pct > 0.5 ? '#ff2200' : '#ff6600');
            hpGrad.addColorStop(1, pct > 0.5 ? '#cc0000' : '#ff4400');
            ctx.fillStyle = hpGrad; ctx.fillRect(bx, by, bw * pct, bh);
            ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
            // Name label
            if (item.dist < 5) {
                ctx.fillStyle = 'rgba(255,0,0,0.8)'; ctx.font = 'bold ' + Math.max(8, Math.floor(12 / item.dist * 2)) + 'px Courier New';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(e.name, screenX, by - 6);
            }
        } else if (item.type === 'bag') {
            // Punching bag sprite in 3D with swinging
            let e = item.data;
            let size = Math.min(H * 0.7, (1 / item.dist) * 200);
            let sh = Math.min(200, Math.floor(160 / (item.dist * 0.3 + 1)));
            let bagR = Math.floor(sh * 0.5), bagG = Math.floor(sh * 0.35), bagB = Math.floor(sh * 0.2);

            // Subtle swing
            let swing = Math.sin(Date.now() * 0.002 + e.x * 5) * size * 0.01;

            // Ground shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(screenX, H / 2 + size * 0.15, size * 0.12, size * 0.025, 0, 0, Math.PI * 2);
            ctx.fill();

            // Chain with links
            ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(screenX, H / 2 - size * 0.5); ctx.lineTo(screenX + swing, H / 2 - size * 0.3); ctx.stroke();
            // Chain links
            for (let cl = 0; cl < 3; cl++) {
                let clY = H / 2 - size * 0.5 + cl * size * 0.07;
                ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.ellipse(screenX + swing * cl / 3, clY, 3, 4, 0, 0, Math.PI * 2); ctx.stroke();
            }

            // Bag body with gradient
            let bagW = size * 0.18, bagH = size * 0.4;
            let bagX = screenX - bagW / 2 + swing, bagY = H / 2 - size * 0.3;
            let bagGrad = ctx.createLinearGradient(bagX, bagY, bagX + bagW, bagY);
            bagGrad.addColorStop(0, 'rgb(' + Math.min(255, bagR + 30) + ',' + Math.min(255, bagG + 20) + ',' + Math.min(255, bagB + 10) + ')');
            bagGrad.addColorStop(0.6, 'rgb(' + Math.min(255, bagR) + ',' + Math.min(255, bagG) + ',' + Math.min(255, bagB) + ')');
            bagGrad.addColorStop(1, 'rgb(' + Math.floor(bagR * 0.5) + ',' + Math.floor(bagG * 0.5) + ',' + Math.floor(bagB * 0.5) + ')');
            ctx.fillStyle = bagGrad;
            ctx.fillRect(bagX, bagY, bagW, bagH);
            ctx.beginPath(); ctx.ellipse(screenX + swing, bagY, bagW / 2, bagW * 0.3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(screenX + swing, bagY + bagH, bagW / 2, bagW * 0.3, 0, 0, Math.PI * 2); ctx.fill();
            // Tape stripe
            ctx.fillStyle = 'rgb(' + Math.min(255, Math.floor(sh * 0.6)) + ',' + Math.min(255, Math.floor(sh * 0.45)) + ',' + Math.min(255, Math.floor(sh * 0.3)) + ')';
            ctx.fillRect(bagX + 2, bagY + bagH * 0.3, bagW - 4, bagH * 0.15);
            // Brand circle
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(screenX + swing, bagY + bagH * 0.5, bagW * 0.3, 0, Math.PI * 2); ctx.stroke();
            // Specular highlight
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(bagX + 2, bagY + 2, bagW * 0.25, bagH - 4);
            // Health bar
            let hbw = size * 0.3, hbh = 3;
            let hbx = screenX - hbw / 2, hby = H / 2 - size * 0.55;
            let hpct = Math.max(0, e.health / e.maxHealth);
            ctx.fillStyle = '#332200'; ctx.fillRect(hbx, hby, hbw, hbh);
            let bagHpGrad = ctx.createLinearGradient(hbx, hby, hbx + hbw * hpct, hby);
            bagHpGrad.addColorStop(0, '#ffaa00');
            bagHpGrad.addColorStop(1, '#cc8800');
            ctx.fillStyle = bagHpGrad; ctx.fillRect(hbx, hby, hbw * hpct, hbh);
            ctx.strokeStyle = '#886644'; ctx.lineWidth = 1; ctx.strokeRect(hbx, hby, hbw, hbh);
        } else {
            // Bottle with bobbing glow
            let size = Math.min(H * 0.4, (1 / item.dist) * 80);
            let bx = screenX, by = H / 2 + size * 0.1;
            let bobble = Math.sin(Date.now() * 0.004 + bx * 0.1) * size * 0.05;
            by += bobble;

            // Glow aura
            ctx.fillStyle = 'rgba(68,255,68,0.08)';
            ctx.beginPath(); ctx.arc(bx, by - size * 0.25, size * 0.5, 0, Math.PI * 2); ctx.fill();

            // Bottle body
            ctx.fillStyle = '#117711';
            ctx.fillRect(bx - size * 0.08, by - size * 0.5, size * 0.16, size * 0.5);
            // Neck
            ctx.fillStyle = '#0a5a0a';
            ctx.fillRect(bx - size * 0.04, by - size * 0.7, size * 0.08, size * 0.22);
            // Cap
            ctx.fillStyle = '#888888';
            ctx.fillRect(bx - size * 0.035, by - size * 0.72, size * 0.07, size * 0.04);
            // Label
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(bx - size * 0.07, by - size * 0.35, size * 0.14, size * 0.12);
            // Label text line
            ctx.fillStyle = '#886600';
            ctx.fillRect(bx - size * 0.05, by - size * 0.3, size * 0.1, size * 0.02);
            // Outline glow
            ctx.strokeStyle = '#44ff44'; ctx.lineWidth = 1;
            ctx.shadowColor = '#44ff44'; ctx.shadowBlur = 8 + Math.sin(Date.now() * 0.005) * 4;
            ctx.strokeRect(bx - size * 0.09, by - size * 0.72, size * 0.18, size * 0.74);
            ctx.shadowBlur = 0;
            // Specular highlight
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(bx - size * 0.02, by - size * 0.5, size * 0.03, size * 0.4);
        }
    }
}

// ─── Explore Arms (uses equipped skin/gloves) ────────────────────────
function renderExploreArms() {
    let skin = getSkin(), glove = getGloves();
    let bobY = Math.sin(armBob) * 8;
    // Weapon sway based on mouse movement (subtle)
    let swayX = Math.sin(Date.now() * 0.001) * 3;
    let lx = 40 + swayX, ly = H - 60 + bobY;

    // Left arm
    ctx.fillStyle = skin.armColor;
    ctx.beginPath(); ctx.ellipse(lx + 20, ly - 30, 28, 18, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(lx + 10, ly + 10, 24, 16, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skin.highlight;
    ctx.beginPath(); ctx.ellipse(lx + 24, ly - 20, 14, 10, -0.3, 0, Math.PI * 2); ctx.fill();
    // Glove with shine
    ctx.fillStyle = glove.color;
    ctx.beginPath(); ctx.arc(lx, ly + 32, 22, 0, Math.PI * 2); ctx.fill();
    let gShineL = ctx.createRadialGradient(lx - 5, ly + 26, 2, lx, ly + 32, 22);
    gShineL.addColorStop(0, 'rgba(255,255,255,0.3)');
    gShineL.addColorStop(1, 'rgba(0,0,0,0.05)');
    ctx.fillStyle = gShineL;
    ctx.beginPath(); ctx.arc(lx, ly + 32, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = glove.outline; ctx.lineWidth = 2; ctx.stroke();

    // Right arm
    let rx = W - 40 - swayX, ry = H - 60 - bobY;
    ctx.fillStyle = skin.armColor;
    ctx.beginPath(); ctx.ellipse(rx - 20, ry - 30, 28, 18, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(rx - 10, ry + 10, 24, 16, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skin.highlight;
    ctx.beginPath(); ctx.ellipse(rx - 24, ry - 20, 14, 10, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = glove.color;
    ctx.beginPath(); ctx.arc(rx, ry + 32, 22, 0, Math.PI * 2); ctx.fill();
    let gShineR = ctx.createRadialGradient(rx - 5, ry + 26, 2, rx, ry + 32, 22);
    gShineR.addColorStop(0, 'rgba(255,255,255,0.3)');
    gShineR.addColorStop(1, 'rgba(0,0,0,0.05)');
    ctx.fillStyle = gShineR;
    ctx.beginPath(); ctx.arc(rx, ry + 32, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = glove.outline; ctx.lineWidth = 2; ctx.stroke();
}

// ─── Minimap ─────────────────────────────────────────────────────────
function renderMinimap() {
    if (!settings.showMinimap) return;
    let sc = 5;
    let mw = MAP_W * sc, mh = MAP_H * sc;
    let mx = W - mw - 10, my = 10;
    ctx.globalAlpha = 0.55;

    // Minimap border with glow
    ctx.fillStyle = '#000'; ctx.fillRect(mx - 2, my - 2, mw + 4, mh + 4);
    ctx.strokeStyle = 'rgba(255,0,0,0.4)'; ctx.lineWidth = 1;
    ctx.strokeRect(mx - 2, my - 2, mw + 4, mh + 4);

    for (let r = 0; r < MAP_H; r++)
        for (let c = 0; c < MAP_W; c++) {
            let t = currentMap[r][c];
            ctx.fillStyle = t === 0 ? '#110000' : t === 2 ? '#003300' : t === 3 ? '#000033' : '#440000';
            ctx.fillRect(mx + c * sc, my + r * sc, sc, sc);
        }

    // Enemies with pulsing
    let pulse = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
    ctx.fillStyle = 'rgba(255,0,0,' + pulse + ')';
    for (let e of enemies) { if (e.alive && !e.isBag) ctx.fillRect(mx + e.x * sc - 2, my + e.y * sc - 2, 4, 4); }
    ctx.fillStyle = '#cc8800';
    for (let e of enemies) { if (e.alive && e.isBag) ctx.fillRect(mx + e.x * sc - 2, my + e.y * sc - 2, 4, 4); }
    ctx.fillStyle = '#44ff44';
    for (let b of bottles) if (!b.picked) ctx.fillRect(mx + b.x * sc - 1, my + b.y * sc - 1, 3, 3);

    // Player with glow
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 4;
    ctx.fillRect(mx + player.x * sc - 2, my + player.y * sc - 2, 4, 4);
    ctx.shadowBlur = 0;

    // FOV cone
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx + player.x * sc, my + player.y * sc);
    ctx.lineTo(mx + (player.x + Math.cos(player.angle - FOV / 4) * 2.5) * sc, my + (player.y + Math.sin(player.angle - FOV / 4) * 2.5) * sc);
    ctx.moveTo(mx + player.x * sc, my + player.y * sc);
    ctx.lineTo(mx + (player.x + Math.cos(player.angle + FOV / 4) * 2.5) * sc, my + (player.y + Math.sin(player.angle + FOV / 4) * 2.5) * sc);
    ctx.stroke();

    // Direction line
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx + player.x * sc, my + player.y * sc);
    ctx.lineTo(mx + (player.x + Math.cos(player.angle) * 1.8) * sc, my + (player.y + Math.sin(player.angle) * 1.8) * sc);
    ctx.stroke();
    ctx.globalAlpha = 1;
}

// ─── Health Bar (smooth animated) ──────────────────────────────────────────────
function drawBar(x, y, w, h, val, max, label, smoothVal) {
    let pct = Math.max(0, val / max);
    let smoothPct = smoothVal !== undefined ? Math.max(0, smoothVal / max) : pct;

    // Background
    ctx.fillStyle = '#220000'; ctx.fillRect(x, y, w, h);

    // Delayed damage indicator (white bar that shrinks slower)
    if (smoothPct > pct) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x, y, w * smoothPct, h);
    }

    // Main health bar with gradient
    let barGrad = ctx.createLinearGradient(x, y, x, y + h);
    if (pct > 0.5) {
        barGrad.addColorStop(0, '#ff2222');
        barGrad.addColorStop(0.5, '#cc0000');
        barGrad.addColorStop(1, '#880000');
    } else if (pct > 0.25) {
        barGrad.addColorStop(0, '#ff6622');
        barGrad.addColorStop(0.5, '#ff4400');
        barGrad.addColorStop(1, '#aa2200');
    } else {
        barGrad.addColorStop(0, '#ff4444');
        barGrad.addColorStop(0.5, '#ff0000');
        barGrad.addColorStop(1, '#aa0000');
    }
    ctx.fillStyle = barGrad;
    ctx.fillRect(x, y, w * pct, h);

    // Shine on top
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x, y, w * pct, h * 0.4);

    // Low health pulse
    if (pct < 0.25 && pct > 0) {
        let pulse = 0.1 + Math.sin(Date.now() * 0.008) * 0.1;
        ctx.fillStyle = 'rgba(255,0,0,' + pulse + ')';
        ctx.fillRect(x, y, w * pct, h);
    }

    ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);

    // Tick marks
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let t = 0.25; t < 1; t += 0.25) {
        ctx.fillRect(x + w * t - 0.5, y, 1, h);
    }

    ctx.fillStyle = '#ffffff'; ctx.font = '13px Courier New'; ctx.textAlign = 'left';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
    ctx.fillText(label + ': ' + Math.ceil(Math.max(0, val)) + '/' + max, x, y - 4);
    ctx.shadowBlur = 0;
}

// ─── XP Bar ──────────────────────────────────────────────────────────
function drawXPBar(x, y, w, h) {
    let pct = Math.min(1, Math.max(0, playerXp / MAX_XP));
    let full = playerXp >= MAX_XP;
    ctx.fillStyle = '#111122'; ctx.fillRect(x, y, w, h);
    // Pulsing glow when full
    if (full) {
        let pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.006);
        ctx.fillStyle = 'rgba(255,200,0,' + pulse + ')';
    } else {
        ctx.fillStyle = '#cc8800';
    }
    ctx.fillRect(x, y, w * pct, h);
    ctx.strokeStyle = full ? '#ffcc00' : '#886600'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = full ? '#ffdd00' : '#ffffff'; ctx.font = '11px Courier New'; ctx.textAlign = 'left';
    let label = full ? 'XP: READY! [Q]' : 'XP: ' + Math.floor(playerXp) + '/' + MAX_XP;
    ctx.fillText(label, x, y - 3);
}

// ─── Explore HUD ─────────────────────────────────────────────────────
let statsOpen = false;
function renderExploreHUD() {
    // Health bar at bottom-left (always visible, with smooth animation)
    drawBar(10, H - 30, 200, 18, player.health, player.maxHealth, 'HP');

    // XP bar below health
    drawXPBar(10, H - 50, 200, 8);

    // Floor title at top-center with decorative style
    let lvl = LEVELS[currentLevel];
    let t = Date.now() * 0.001;
    ctx.fillStyle = '#ff4444'; ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'center';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 6;
    ctx.fillText('FLOOR ' + lvl.floor + ': ' + lvl.name, W / 2, 20);
    ctx.shadowBlur = 0;

    // Decorative line under title
    let titleW = ctx.measureText('FLOOR ' + lvl.floor + ': ' + lvl.name).width;
    ctx.strokeStyle = 'rgba(255,0,0,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2 - titleW/2, 26); ctx.lineTo(W/2 + titleW/2, 26); ctx.stroke();

    // ─── Stats toggle button (top-left) ───
    let sbW = 80, sbH = 28, sbX = 10, sbY = 10;
    ctx.fillStyle = statsOpen ? 'rgba(180,0,0,0.5)' : 'rgba(80,0,0,0.45)';
    ctx.fillRect(sbX, sbY, sbW, sbH);
    ctx.strokeStyle = statsOpen ? '#ff4444' : '#aa3333'; ctx.lineWidth = 2;
    ctx.strokeRect(sbX, sbY, sbW, sbH);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('STATS', sbX + sbW / 2, sbY + sbH / 2);
    ctx.textBaseline = 'alphabetic';

    // ─── Stats panel (shown when open) ───
    if (statsOpen) {
        let px = 10, py = 44, pw = 180, ph = 150;
        let alive = enemies.filter(e => e.alive && !e.isBag).length;
        let bags = enemies.filter(e => e.alive && e.isBag).length;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = '#882222'; ctx.lineWidth = 1;
        ctx.strokeRect(px, py, pw, ph);
        ctx.textAlign = 'left'; ctx.font = '13px Courier New';
        let ly = py + 18;
        ctx.fillStyle = '#ff4444'; ctx.fillText('Score: ' + player.score, px + 8, ly); ly += 18;
        ctx.fillStyle = '#ff4444'; ctx.fillText('Fighters: ' + alive, px + 8, ly); ly += 18;
        if (bags > 0) { ctx.fillStyle = '#cc8800'; ctx.fillText('Bags: ' + bags, px + 8, ly); ly += 18; }
        ctx.fillStyle = '#ffcc00'; ctx.fillText('Coins: ' + saveData.coins, px + 8, ly); ly += 18;
        // Drink button inside panel
        let drBtnY = ly - 2;
        ctx.fillStyle = 'rgba(0,80,0,0.35)'; ctx.fillRect(px + 6, drBtnY, pw - 12, 22);
        ctx.strokeStyle = '#44ff44'; ctx.lineWidth = 1; ctx.strokeRect(px + 6, drBtnY, pw - 12, 22);
        ctx.fillStyle = '#44ff44'; ctx.fillText('Bottles: ' + inventory.bottles + '  [SHIFT]', px + 12, drBtnY + 15);
        ly += 24;
        if (drunkLevel === 1) { ctx.fillStyle = '#ffaa00'; ctx.fillText('Status: TIPSY', px + 8, ly); }
        else if (drunkLevel >= 2) { ctx.fillStyle = '#ff4400'; ctx.fillText('Status: DRUNK', px + 8, ly); }
    }

    // Stair prompt
    if (stairPrompt) {
        let stTxt = stairPrompt === 'up' ? 'GO UPSTAIRS [E]' : 'GO DOWNSTAIRS [E]';
        let stBW = 240, stBH = 36;
        let stBX = W / 2 - stBW / 2, stBY = H / 2 + 32;
        ctx.fillStyle = 'rgba(0,180,80,0.3)';
        ctx.fillRect(stBX, stBY, stBW, stBH);
        ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 2;
        ctx.strokeRect(stBX, stBY, stBW, stBH);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'center';
        ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 10;
        ctx.fillText(stTxt, W / 2, stBY + stBH / 2 + 1);
        ctx.shadowBlur = 0;
    }
}

// ─── Drunk Effects ───────────────────────────────────────────────────
function applyDrunkEffects() {
    if (drunkLevel <= 0) return;
    if (drunkLevel >= 2) {
        ctx.globalAlpha = 0.15;
        let ox = Math.sin(Date.now() * 0.002) * drunkBlurAmount;
        let oy = Math.cos(Date.now() * 0.003) * drunkBlurAmount;
        ctx.drawImage(canvas, ox, oy); ctx.drawImage(canvas, -ox, -oy);
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0,60,0,0.06)'; ctx.fillRect(0, 0, W, H);
    } else {
        ctx.globalAlpha = 0.08;
        ctx.drawImage(canvas, Math.sin(Date.now() * 0.0015) * 2, 0);
        ctx.globalAlpha = 1;
    }
    if (drunkNotifyTimer > 0) {
        let a = Math.min(1, drunkNotifyTimer / 500);
        ctx.fillStyle = drunkLevel >= 2 ? 'rgba(255,68,0,' + (a * 0.9) + ')' : 'rgba(255,170,0,' + (a * 0.9) + ')';
        ctx.font = 'bold 48px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = drunkLevel >= 2 ? '#ff0000' : '#ffaa00'; ctx.shadowBlur = 20;
        ctx.fillText(drunkNotify, W / 2, H * 0.35);
        ctx.shadowBlur = 0; ctx.textBaseline = 'alphabetic';
    }
}

// ─── Proximity Warning ──────────────────────────────────────────────
function renderProximity() {
    let minD = Infinity;
    let nearestEnemy = null;
    for (let e of enemies) {
        if (!e.alive) continue;
        let d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < minD) { minD = d; nearestEnemy = e; }
    }
    if (minD < 5) {
        // Pulsing red edge warning
        let intensity = Math.max(0, 1 - minD / 5);
        let pulse = intensity * (0.12 + Math.sin(Date.now() * 0.006) * 0.06);
        let warnGrad = ctx.createRadialGradient(W/2, H/2, H*0.25, W/2, H/2, W*0.55);
        warnGrad.addColorStop(0, 'rgba(255,0,0,0)');
        warnGrad.addColorStop(1, 'rgba(255,0,0,' + pulse + ')');
        ctx.fillStyle = warnGrad; ctx.fillRect(0, 0, W, H);
    }
    if (minD < 3 && nearestEnemy) {
        let nearBag = nearestEnemy.isBag;
        let warnColor = nearBag ? '#cc8800' : '#ff0000';
        let warnText = nearBag ? '! PUNCHING BAG !' : '! ' + nearestEnemy.name.toUpperCase() + ' NEARBY !';

        // Warning box
        let boxW = ctx.measureText(warnText).width + 40;
        ctx.font = 'bold 18px Courier New';
        boxW = ctx.measureText(warnText).width + 40;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(W/2 - boxW/2, H - 36, boxW, 28);
        ctx.strokeStyle = warnColor; ctx.lineWidth = 1;
        ctx.strokeRect(W/2 - boxW/2, H - 36, boxW, 28);

        ctx.fillStyle = warnColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = warnColor; ctx.shadowBlur = 8;
        ctx.fillText(warnText, W / 2, H - 22);
        ctx.shadowBlur = 0;
        ctx.textBaseline = 'alphabetic';
    }
}

// ─── Combat Scene Rendering ──────────────────────────────────────────
function renderCombatScene() {
    let grd = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W);
    grd.addColorStop(0, '#1a0000'); grd.addColorStop(1, '#000000');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

    // Animated rope lines with subtle movement
    let t = Date.now() * 0.001;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
        let ry = 40 + i * 30;
        let wave = Math.sin(t * 0.5 + i) * 2;
        ctx.strokeStyle = i === 0 ? '#880000' : '#660000';
        ctx.beginPath();
        ctx.moveTo(0, ry + wave);
        for (let x = 0; x <= W; x += 20) {
            ctx.lineTo(x, ry + Math.sin(t + x * 0.01 + i) * 1.5 + wave);
        }
        ctx.stroke();
    }

    // Bottom ropes
    ctx.strokeStyle = '#440000';
    for (let i = 0; i < 3; i++) { let ry = H - 40 - i * 20; ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(W, ry); ctx.stroke(); }

    // Ring floor with subtle pattern
    let floorGrad = ctx.createLinearGradient(0, H * 0.6, 0, H);
    floorGrad.addColorStop(0, '#110000');
    floorGrad.addColorStop(0.5, '#0a0000');
    floorGrad.addColorStop(1, '#050000');
    ctx.fillStyle = floorGrad; ctx.fillRect(0, H * 0.6, W, H * 0.4);
    // Floor grid lines
    ctx.strokeStyle = 'rgba(255,0,0,0.03)'; ctx.lineWidth = 1;
    for (let fx = 0; fx < W; fx += 40) {
        ctx.beginPath(); ctx.moveTo(fx, H * 0.6); ctx.lineTo(fx, H); ctx.stroke();
    }
    for (let fy = H * 0.6; fy < H; fy += 20) {
        ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(W, fy); ctx.stroke();
    }

    // Camera tilt for dodges
    ctx.save();
    if (cameraTilt !== 0) {
        ctx.translate(W / 2, H / 2);
        ctx.rotate(cameraTilt * 0.02);
        ctx.translate(-W / 2, -H / 2);
    }

    if (combat.shake > 0 && settings.screenShake) {
        ctx.translate((Math.random() - 0.5) * combat.shake, (Math.random() - 0.5) * combat.shake);
    }

    // Screen warp effect on big hits
    if (screenWarp > 0) {
        let warpAmount = screenWarp * 0.003;
        ctx.save();
        ctx.translate(W/2, H/2);
        ctx.scale(1 + warpAmount, 1 + warpAmount);
        ctx.translate(-W/2, -H/2);
    }

    drawOpponent();

    if (screenWarp > 0) ctx.restore();

    ctx.restore();
    drawPlayerFists();

    let en = combat.enemy;
    // Enemy/Bag health bar (smooth animated)
    if (en.isBag) {
        drawBar(W / 2 + 40, 12, 250, 16, en.health, en.maxHealth, 'PUNCHING BAG', smoothEnemyHP);
    } else {
        drawBar(W / 2 + 40, 12, 250, 16, en.health, en.maxHealth, en.name, smoothEnemyHP);
    }
    drawBar(W / 2 - 290, 12, 250, 16, player.health, player.maxHealth, 'YOU', smoothPlayerHP);

    // XP Bar
    drawXPBar(W / 2 - 100, 36, 200, 10);

    // Combo counter display
    if (comboCount >= 2) {
        let comboAlpha = Math.min(1, comboTimer / 400);
        let comboScale = 1 + Math.sin(Date.now() * 0.01) * 0.05;
        let comboSize = Math.min(48, 24 + comboCount * 4);
        ctx.save();
        ctx.translate(W - 90, 80);
        ctx.scale(comboScale, comboScale);
        ctx.fillStyle = 'rgba(255,200,0,' + comboAlpha + ')';
        ctx.font = 'bold ' + comboSize + 'px Courier New';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 15;
        ctx.fillText(comboCount + 'x', 0, 0);
        ctx.font = 'bold 14px Courier New';
        ctx.fillStyle = 'rgba(255,150,0,' + comboAlpha + ')';
        ctx.fillText('COMBO', 0, 22);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // Top-right info
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px Courier New'; ctx.textAlign = 'right';
    ctx.fillText('Score: ' + player.score + '  |  Coins: ' + saveData.coins, W - 10, H - 4);
    if (!en.isBag) {
        ctx.fillStyle = '#88ff88'; ctx.textAlign = 'left';
        ctx.fillText('Bottles: ' + inventory.bottles, 10, H - 4);
    }
    ctx.fillStyle = '#ff6666'; ctx.font = '12px Courier New'; ctx.textAlign = 'center';
    ctx.fillText('Floor ' + LEVELS[currentLevel].floor, W / 2, 58);

    // Hit flash (improved with color grading)
    if (combat.hitFlash > 0) {
        let flashAlpha = combat.hitFlash / 300;
        ctx.fillStyle = 'rgba(255,0,0,' + (flashAlpha * 0.4) + ')';
        ctx.fillRect(0, 0, W, H);
        // Edge vignette flash
        let edgeGrad = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, W*0.6);
        edgeGrad.addColorStop(0, 'rgba(255,0,0,0)');
        edgeGrad.addColorStop(1, 'rgba(200,0,0,' + (flashAlpha * 0.5) + ')');
        ctx.fillStyle = edgeGrad; ctx.fillRect(0, 0, W, H);
    }

    // Blood overlay (persists briefly after taking damage)
    if (bloodOverlay > 0) {
        let bAlpha = Math.min(0.3, bloodOverlay * 0.001);
        // Blood drip streaks from top
        for (let drip of bloodDrips) {
            ctx.fillStyle = 'rgba(160,0,0,' + (bAlpha * drip.alpha) + ')';
            ctx.fillRect(drip.x, 0, drip.w, drip.y);
            // Drip tip
            ctx.beginPath();
            ctx.arc(drip.x + drip.w / 2, drip.y, drip.w * 0.8, 0, Math.PI); ctx.fill();
        }
    }

    // Combat message with improved styling
    if (combat.msgTimer > 0) {
        let msgAlpha = Math.min(1, combat.msgTimer / 200);
        let msgScale = 1 + (1 - Math.min(1, combat.msgTimer / 300)) * 0.3;
        ctx.save();
        ctx.translate(W / 2, H * 0.68);
        ctx.scale(msgScale, msgScale);
        ctx.fillStyle = 'rgba(255,255,255,' + msgAlpha + ')';
        ctx.font = 'bold 32px Courier New';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 15;
        ctx.fillText(combat.msg, 0, 0);
        // Outline
        ctx.strokeStyle = 'rgba(200,0,0,' + (msgAlpha * 0.6) + ')';
        ctx.lineWidth = 2;
        ctx.strokeText(combat.msg, 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    if (combat.blocking && !en.isBag) {
        // Shield effect
        ctx.fillStyle = 'rgba(100,150,255,0.08)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#6688ff'; ctx.font = 'bold 20px Courier New'; ctx.textAlign = 'center';
        ctx.shadowColor = '#4466ff'; ctx.shadowBlur = 10;
        ctx.fillText('\u2588 BLOCKING \u2588', W / 2, H - 42);
        ctx.shadowBlur = 0;
    }
    if (combat.dodging && !en.isBag) {
        ctx.fillStyle = '#ff8800'; ctx.font = 'bold 18px Courier New'; ctx.textAlign = 'center';
        ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 8;
        ctx.fillText(combat.dodgeDir === -1 ? '\u25C0\u25C0\u25C0 DODGE' : combat.dodgeDir === 1 ? 'DODGE \u25B6\u25B6\u25B6' : 'SLIP BACK', W / 2, H - 60);
        ctx.shadowBlur = 0;
    }

    // Speed lines
    renderSpeedLines();

    // Impact rings
    renderImpactRings();

    // Damage numbers
    renderDamageNumbers();

    renderParticles();
    applyDrunkEffects();

    // Slow-mo effect overlay
    if (slowMoTimer > 0) {
        ctx.fillStyle = 'rgba(0,0,30,' + Math.min(0.15, slowMoTimer * 0.0003) + ')';
        ctx.fillRect(0, 0, W, H);
    }

    // ─── Clickable Combat Buttons ───────────────────────────────────
    let layout = getCombatBtnLayout(en);
    let { row1, row2, btnH: bH, btnW: bW, gap: bGap } = layout;
    // Row 1 (attacks)
    let r1Y = H - bH - 6 - (row2.length > 0 ? bH + 6 : 0);
    let r1Total = row1.length * (bW + bGap) - bGap;
    let r1X = (W - r1Total) / 2;
    for (let bi = 0; bi < row1.length; bi++) {
        let bx = r1X + bi * (bW + bGap);
        let isSpec = row1[bi].k === 'Q';
        let canSpec = isSpec && playerXp >= MAX_XP;
        let bg = isSpec ? (canSpec ? 'rgba(255,200,0,0.35)' : 'rgba(60,50,0,0.3)') : 'rgba(180,0,0,0.35)';
        let border = isSpec ? (canSpec ? '#ffcc00' : '#554400') : '#cc3333';
        let txt = isSpec ? (canSpec ? '#ffee44' : '#776633') : '#ffffff';
        drawUIButton(bx, r1Y, bW, bH, row1[bi].l, bg, border, txt);
    }
    // Row 2 (block, drink) — only for non-bag fights
    if (row2.length > 0) {
        let r2Y = H - bH - 6;
        let r2Total = row2.length * (bW + bGap) - bGap;
        let r2X = (W - r2Total) / 2;
        for (let bi = 0; bi < row2.length; bi++) {
            let bx = r2X + bi * (bW + bGap);
            let isBlock = row2[bi].k === ' ';
            let bg = isBlock ? (combat.blocking ? 'rgba(100,140,255,0.4)' : 'rgba(40,60,120,0.3)') : 'rgba(30,100,30,0.35)';
            let border = isBlock ? '#6688ff' : '#44cc44';
            let txt = '#ffffff';
            drawUIButton(bx, r2Y, bW, bH, row2[bi].l, bg, border, txt);
        }
    }
    // Dodge zone indicators (side panels)
    ctx.globalAlpha = 0.25;
    // Left dodge zone
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(0, H * 0.2, W * 0.08, H * 0.45);
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('\u25C0', W * 0.04, H * 0.42);
    ctx.font = '9px Courier New'; ctx.fillText('DODGE', W * 0.04, H * 0.48);
    // Right dodge zone
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(W * 0.92, H * 0.2, W * 0.08, H * 0.45);
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px Courier New';
    ctx.fillText('\u25B6', W * 0.96, H * 0.42);
    ctx.font = '9px Courier New'; ctx.fillText('DODGE', W * 0.96, H * 0.48);
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
}

// ─── UI Button Helper ────────────────────────────────────────────────
function drawUIButton(x, y, w, h, label, bgColor, borderColor, textColor) {
    // Background with rounded look
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = borderColor; ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    // Highlight top edge
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x + 1, y + 1, w - 2, h * 0.35);
    // Inner shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(x + 1, y + h * 0.7, w - 2, h * 0.3 - 1);
    // Label
    ctx.fillStyle = textColor; ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 2;
    ctx.fillText(label, x + w / 2, y + h / 2);
    ctx.shadowBlur = 0;
}

// ─── Render Damage Numbers ───────────────────────────────────────────
function renderDamageNumbers() {
    for (let dn of damageNumbers) {
        let a = Math.min(1, dn.life / 300);
        let progress = 1 - dn.life / dn.max;
        ctx.save();
        ctx.translate(dn.x, dn.y);
        ctx.rotate(dn.rot * progress);
        ctx.scale(dn.scale, dn.scale);
        ctx.globalAlpha = a;
        ctx.font = 'bold 22px Courier New';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillText(dn.text, 2, 2);
        // Main text
        ctx.fillStyle = dn.color;
        ctx.shadowColor = dn.color; ctx.shadowBlur = 8;
        ctx.fillText(dn.text, 0, 0);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

// ─── Render Speed Lines ──────────────────────────────────────────────
function renderSpeedLines() {
    for (let sl of speedLines) {
        let a = Math.min(1, sl.life / 100);
        ctx.globalAlpha = a * 0.6;
        ctx.strokeStyle = sl.color;
        ctx.lineWidth = sl.width;
        ctx.beginPath();
        ctx.moveTo(sl.x, sl.y);
        ctx.lineTo(sl.x + Math.cos(sl.angle) * sl.len, sl.y + Math.sin(sl.angle) * sl.len);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

// ─── Render Impact Rings ────────────────────────────────────────────
function renderImpactRings() {
    for (let ring of impactRings) {
        let a = ring.life / ring.max;
        let progress = 1 - a;
        ctx.globalAlpha = a * 0.6;
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 3 * a;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r + progress * ring.maxR, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

// ─── Render Ambient Dust ────────────────────────────────────────────
function renderDust() {
    for (let d of dustParticles) {
        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = '#aa8866';
        ctx.beginPath(); ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// ─── Draw Opponent ───────────────────────────────────────────────────
function drawOpponent() {
    let en = combat.enemy;
    if (en.isBag) { drawBagOpponent(); return; }

    let bob = combat.bob;
    let flash = combat.enemyHitFlash > 0;
    let vd = VILLAIN_DATA[en.name] || {};
    let cx = W / 2, cy = H * 0.3 + bob;
    let bodyC = flash ? '#ffffff' : (vd.bodyColor || '#552222');
    let skinC = flash ? '#ffaaaa' : (vd.skinColor || '#884444');
    let gloveC = flash ? '#ffffff' : (vd.gloveColor || en.color);
    let headR = vd.headSize || 28;
    let bw = vd.bodyW || 80, bh = vd.bodyH || 85;

    // Idle breathing sway
    let breathe = Math.sin(Date.now() * 0.003) * 2;
    cy += breathe;
    let sway = Math.sin(Date.now() * 0.0015) * 3;
    cx += sway;

    // Stagger animation when hit
    if (flash) {
        let stagger = combat.enemyHitFlash / 220;
        cx += Math.sin(Date.now() * 0.05) * stagger * 15;
        cy += stagger * 5;
    }

    // Shadow (dynamic with sway)
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx, H * 0.58, bw * 0.9 + breathe, 12, 0, 0, Math.PI * 2); ctx.fill();

    // Legs with subtle animation
    ctx.fillStyle = bodyC;
    let legSpread = bw * 0.2;
    let legBob = Math.sin(Date.now() * 0.004) * 1.5;
    ctx.fillRect(cx - legSpread - 10, cy + bh + legBob, 22, 60);
    ctx.fillRect(cx + legSpread - 10, cy + bh - legBob, 22, 60);
    // Shoes
    ctx.fillStyle = '#111111';
    ctx.fillRect(cx - legSpread - 14, cy + bh + 55 + legBob, 30, 8);
    ctx.fillRect(cx + legSpread - 14, cy + bh + 55 - legBob, 30, 8);
    // Body
    ctx.fillRect(cx - bw / 2, cy + 5, bw, bh);
    // Head — may lunge forward for bite/headbutt
    let headCy = cy;
    if (combat.enemyWindup && combat.enemyAttackInfo) {
        let p = 1 - combat.enemyWindupTimer / 500;
        let aType = combat.enemyAttackInfo.type;
        if (aType === 'bite') headCy += p * 45;
        else if (aType === 'headbutt') { headCy += p * 65; cx += (Math.random() - 0.5) * p * 8; }
        else if (aType === 'lick') headCy += p * 35;
    }
    ctx.fillStyle = skinC;
    ctx.beginPath(); ctx.arc(cx, headCy - headR + 10, headR, 0, Math.PI * 2); ctx.fill();
    // Eyes
    ctx.fillStyle = flash ? '#ff0000' : '#000';
    if (vd.style === 'speedster') { ctx.fillRect(cx - 8, headCy - headR + 5, 4, 4); ctx.fillRect(cx + 4, headCy - headR + 5, 4, 4); }
    else if (vd.style === 'counter') { ctx.fillRect(cx - 10, headCy - headR + 6, 7, 3); ctx.fillRect(cx + 3, headCy - headR + 6, 7, 3); }
    else if (vd.style === 'brawler') { ctx.fillRect(cx - 12, headCy - headR + 3, 8, 6); ctx.fillRect(cx + 4, headCy - headR + 3, 8, 6); }
    else if (vd.style === 'wild') { ctx.fillRect(cx - 10, headCy - headR + 4, 6, 5); ctx.fillRect(cx + 5, headCy - headR + 6, 5, 4); }
    else {
        ctx.fillStyle = flash ? '#ffffff' : '#ff0000';
        ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 8;
        ctx.fillRect(cx - 10, headCy - headR + 4, 6, 5); ctx.fillRect(cx + 4, headCy - headR + 4, 6, 5);
        ctx.shadowBlur = 0;
    }
    // Mouth — open for bite/lick
    ctx.strokeStyle = flash ? '#ff0000' : '#000'; ctx.lineWidth = 2; ctx.beginPath();
    let mouthOpen = combat.enemyWindup && combat.enemyAttackInfo && (combat.enemyAttackInfo.type === 'bite' || combat.enemyAttackInfo.type === 'lick');
    if (mouthOpen) {
        let p = 1 - (combat.enemyWindupTimer || 0) / 500;
        ctx.fillStyle = '#330000';
        ctx.beginPath(); ctx.ellipse(cx, headCy + 2, 10 * p + 4, 6 * p + 2, 0, 0, Math.PI * 2); ctx.fill();
        // Teeth for bite
        if (combat.enemyAttackInfo.type === 'bite') {
            ctx.fillStyle = '#ffffff';
            for (let i = -2; i <= 2; i++) { ctx.fillRect(cx + i * 4 - 1, headCy - 1, 3, 3); }
        }
    } else if (vd.style === 'wild') { ctx.moveTo(cx - 10, headCy); ctx.lineTo(cx - 4, headCy - 3); ctx.lineTo(cx + 4, headCy); ctx.lineTo(cx + 10, headCy - 3); ctx.stroke(); }
    else if (vd.style === 'boss') { ctx.moveTo(cx - 10, headCy - 2); ctx.quadraticCurveTo(cx, headCy + 5, cx + 10, headCy - 2); ctx.stroke(); }
    else { ctx.moveTo(cx - 8, headCy); ctx.lineTo(cx + 8, headCy); ctx.stroke(); }

    // Body extras
    if (vd.style === 'brawler') { ctx.strokeStyle = '#660000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 15, cy + 20); ctx.lineTo(cx + 15, cy + 45); ctx.stroke(); }
    if (vd.style === 'boss') {
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(cx - headR, headCy - headR * 2 + 10, headR * 2, 6);
        ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(cx, headCy - headR * 2 + 13, 4, 0, Math.PI * 2); ctx.fill();
    }
    if (vd.style === 'wild') { ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - bw / 2 - 15, cy + 20); ctx.lineTo(cx - bw / 2 - 5, cy + 35); ctx.stroke(); }

    // Arms
    ctx.fillStyle = skinC;
    let armW = bw * 0.22;
    ctx.fillRect(cx - bw / 2 - armW, cy + 10, armW, bh * 0.7);
    ctx.fillRect(cx + bw / 2, cy + 10, armW, bh * 0.7);

    // Gloves + windup animation (varies by attack type)
    let gloveR = bw * 0.14;
    let lgX = cx - bw / 2 - armW / 2 - 5, lgY = cy + 10 + bh * 0.5;
    let rgX = cx + bw / 2 + armW / 2 + 5, rgY = cy + 10 + bh * 0.5;
    if (combat.enemyWindup && combat.enemyAttackInfo) {
        let p = 1 - combat.enemyWindupTimer / 500;
        let aType = combat.enemyAttackInfo.type;
        switch (aType) {
            case 'punch': case 'palm':
                if (combat.enemyWindupHand === 'left') { lgX += p * 60; lgY += p * 70; }
                else { rgX -= p * 60; rgY += p * 70; }
                break;
            case 'slap': case 'earclap':
                if (aType === 'earclap') {
                    lgX += p * 70; lgY += p * 50;
                    rgX -= p * 70; rgY += p * 50;
                } else {
                    if (combat.enemyWindupHand === 'left') { lgX += p * 90; lgY += p * 40; }
                    else { rgX -= p * 90; rgY += p * 40; }
                }
                break;
            case 'elbow': case 'chop':
                if (combat.enemyWindupHand === 'left') { lgX += p * 30; lgY += p * 90; }
                else { rgX -= p * 30; rgY += p * 90; }
                break;
            case 'bite': case 'headbutt': case 'lick':
                // Arms don't move much, head already moved
                break;
            default:
                if (combat.enemyWindupHand === 'left') { lgX += p * 60; lgY += p * 70; }
                else { rgX -= p * 60; rgY += p * 70; }
        }
    }
    // Draw open hand for slap
    let isSlap = combat.enemyWindup && combat.enemyAttackInfo && (combat.enemyAttackInfo.type === 'slap' || combat.enemyAttackInfo.type === 'earclap');
    if (isSlap) {
        ctx.fillStyle = skinC;
        ctx.beginPath(); ctx.arc(lgX, lgY, gloveR * 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rgX, rgY, gloveR * 1.2, 0, Math.PI * 2); ctx.fill();
        // Finger lines
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath(); ctx.moveTo(lgX + i * 4, lgY - gloveR); ctx.lineTo(lgX + i * 4, lgY - gloveR - 6); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(rgX + i * 4, rgY - gloveR); ctx.lineTo(rgX + i * 4, rgY - gloveR - 6); ctx.stroke();
        }
    } else {
        ctx.fillStyle = gloveC;
        ctx.beginPath(); ctx.arc(lgX, lgY, gloveR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rgX, rgY, gloveR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(lgX, lgY, gloveR, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(rgX, rgY, gloveR, 0, Math.PI * 2); ctx.stroke();
    }
}

// ─── Draw Punching Bag (in combat view) ──────────────────────────────
function drawBagOpponent() {
    let bob = combat.bob;
    let flash = combat.enemyHitFlash > 0;
    let cx = W / 2, cy = H * 0.15 + bob;

    // Chain from ceiling
    ctx.strokeStyle = '#888888'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, cy + 10); ctx.stroke();
    // Mounting bracket
    ctx.fillStyle = '#666666';
    ctx.fillRect(cx - 15, cy + 5, 30, 10);

    // Bag body
    let bagW = 55, bagH = 140;
    ctx.fillStyle = flash ? '#ffffff' : '#886644';
    // Top ellipse
    ctx.beginPath(); ctx.ellipse(cx, cy + 20, bagW, 18, 0, 0, Math.PI * 2); ctx.fill();
    // Main body
    ctx.fillRect(cx - bagW, cy + 20, bagW * 2, bagH);
    // Bottom ellipse
    ctx.beginPath(); ctx.ellipse(cx, cy + 20 + bagH, bagW, 18, 0, 0, Math.PI * 2); ctx.fill();

    // Tape/stripe decorations
    ctx.fillStyle = flash ? '#ffccaa' : '#aa8866';
    ctx.fillRect(cx - bagW + 5, cy + 60, bagW * 2 - 10, 20);
    ctx.fillRect(cx - bagW + 5, cy + 110, bagW * 2 - 10, 20);

    // Logo circle
    ctx.fillStyle = flash ? '#ff8888' : '#664422';
    ctx.beginPath(); ctx.arc(cx, cy + 90, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = flash ? '#ffffff' : '#553311'; ctx.lineWidth = 2; ctx.stroke();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx, H * 0.58, 60, 14, 0, 0, Math.PI * 2); ctx.fill();

    // Flash overlay
    if (flash) {
        ctx.fillStyle = 'rgba(255,200,100,0.15)';
        ctx.fillRect(cx - bagW - 5, cy + 15, bagW * 2 + 10, bagH + 15);
    }
}

// ─── Player Fists (combat, uses equipped skin/gloves) ────────────────
function drawPlayerFists() {
    let skin = getSkin(), glove = getGloves();
    let lx = W * 0.15, ly = H - 50;
    let rx = W * 0.85, ry = H - 50;

    let dodgeOffset = 0;
    if (combat.dodging) {
        let dur = combat.dodgeDir === 0 ? SLIP_BACK_DURATION : DODGE_DURATION;
        let p = Math.sin((1 - combat.dodgeTimer / dur) * Math.PI);
        if (combat.dodgeDir === -1) dodgeOffset = -p * 120;
        else if (combat.dodgeDir === 1) dodgeOffset = p * 120;
        else { ly += p * 60; ry += p * 60; }
    }
    lx += dodgeOffset; rx += dodgeOffset;

    if (combat.blocking && !combat.attacking) {
        lx = W * 0.35; ly = H * 0.38; rx = W * 0.65; ry = H * 0.38;
    } else if (combat.attacking) {
        if (combat.attackType === 'special') {
            // Special move animation per skin
            let special = skin.special;
            let t = 1 - combat.attackTimer / 500;
            let s = Math.sin(t * Math.PI);
            switch (special.animType) {
                case 'double':
                    lx += s * (W * 0.25); ly -= s * (H * 0.55);
                    rx -= s * (W * 0.25); ry -= s * (H * 0.55);
                    break;
                case 'upper':
                    lx += s * (W * 0.15); ly -= s * (H * 0.72);
                    rx -= s * (W * 0.15); ry -= s * (H * 0.72);
                    break;
                case 'slam':
                    lx = W * 0.3 + s * (W * 0.05); ly -= s * (H * 0.8) * (t < 0.5 ? 1 : (1 - (t - 0.5) * 3));
                    rx = W * 0.7 - s * (W * 0.05); ry -= s * (H * 0.8) * (t < 0.5 ? 1 : (1 - (t - 0.5) * 3));
                    break;
                case 'rush': {
                    let phase = (t * 4) % 1;
                    if (phase < 0.5) { lx += s * (W * 0.35); ly -= s * (H * 0.5); }
                    else { rx -= s * (W * 0.35); ry -= s * (H * 0.5); }
                    break;
                }
                case 'hook':
                    lx = W * 0.02 + s * (W * 0.52); ly -= s * (H * 0.48);
                    rx = W * 0.98 - s * (W * 0.1); ry -= s * (H * 0.2);
                    break;
            }
            // Special glow effect
            ctx.shadowColor = special.particleColor; ctx.shadowBlur = 25 * s;
        } else {
            let a = ATTACKS[combat.attackType];
            let t = 1 - combat.attackTimer / a.anim;
            let s = Math.sin(t * Math.PI);
            switch (combat.attackType) {
                case 'jab': lx += s * (W * 0.28); ly -= s * (H * 0.55); break;
                case 'cross': rx -= s * (W * 0.28); ry -= s * (H * 0.55); break;
                case 'leftHook': lx = W * 0.02 + s * (W * 0.45); ly -= s * (H * 0.44); break;
                case 'rightHook': rx = W * 0.98 - s * (W * 0.45); ry -= s * (H * 0.44); break;
                case 'uppercut':
                    if (combat.uppercutHand === 'left') {
                        lx += s * (W * 0.2); ly -= s * (H * 0.72);
                    } else {
                        rx -= s * (W * 0.2); ry -= s * (H * 0.72);
                    }
                    break;
            }
        }
    }

    // Idle breathing bob
    if (!combat.attacking && !combat.blocking && !combat.dodging) {
        let breathL = Math.sin(Date.now() * 0.0025) * 4;
        let breathR = Math.sin(Date.now() * 0.0025 + 0.6) * 4;
        ly += breathL; ry += breathR;
        lx += Math.sin(Date.now() * 0.002) * 1.5;
        rx += Math.sin(Date.now() * 0.002 + 1) * 1.5;
    }

    // Motion blur trail on attack
    if (combat.attacking) {
        ctx.globalAlpha = 0.12;
        for (let t = 1; t <= 3; t++) {
            let trailOff = t * 8;
            ctx.fillStyle = glove.color;
            ctx.beginPath(); ctx.arc(lx - trailOff * 0.3, ly + trailOff, 30, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(rx + trailOff * 0.3, ry + trailOff, 30, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // Left arm
    ctx.fillStyle = skin.armColor;
    ctx.beginPath(); ctx.ellipse(lx + 8, ly - 20, 32, 20, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skin.highlight;
    ctx.beginPath(); ctx.ellipse(lx + 14, ly - 24, 16, 10, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skin.armColor;
    ctx.fillRect(lx - 18, ly, 36, H - ly + 10);
    // Glove with shine
    ctx.fillStyle = glove.color;
    ctx.beginPath(); ctx.arc(lx, ly, 36, 0, Math.PI * 2); ctx.fill();
    // Glove specular highlight
    let gloveGrad = ctx.createRadialGradient(lx - 8, ly - 12, 2, lx, ly, 36);
    gloveGrad.addColorStop(0, 'rgba(255,255,255,0.35)');
    gloveGrad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    gloveGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = gloveGrad;
    ctx.beginPath(); ctx.arc(lx, ly, 36, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = glove.outline; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = glove.outline;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(lx + i * 10, ly - 14, 5, 0, Math.PI * 2); ctx.fill(); }
    // Glove stitching
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(lx - 12, ly + 8); ctx.lineTo(lx + 12, ly + 8); ctx.stroke();

    // Right arm
    ctx.fillStyle = skin.armColor;
    ctx.beginPath(); ctx.ellipse(rx - 8, ry - 20, 32, 20, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skin.highlight;
    ctx.beginPath(); ctx.ellipse(rx - 14, ry - 24, 16, 10, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skin.armColor;
    ctx.fillRect(rx - 18, ry, 36, H - ry + 10);
    // Glove with shine
    ctx.fillStyle = glove.color;
    ctx.beginPath(); ctx.arc(rx, ry, 36, 0, Math.PI * 2); ctx.fill();
    let gloveGrad2 = ctx.createRadialGradient(rx - 8, ry - 12, 2, rx, ry, 36);
    gloveGrad2.addColorStop(0, 'rgba(255,255,255,0.35)');
    gloveGrad2.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    gloveGrad2.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = gloveGrad2;
    ctx.beginPath(); ctx.arc(rx, ry, 36, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = glove.outline; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = glove.outline;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(rx + i * 10, ry - 14, 5, 0, Math.PI * 2); ctx.fill(); }
    // Glove stitching
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(rx - 12, ry + 8); ctx.lineTo(rx + 12, ry + 8); ctx.stroke();

    ctx.shadowBlur = 0;
}

// ─── Cutscene System ─────────────────────────────────────────────────
function startCutscene(enemy, isKO) {
    let data = VILLAIN_DATA[enemy.name];
    if (!data) { state = isKO ? ST.EXPLORE : ST.COMBAT; return; }
    combat.cutsceneLines = isKO ? [data.ko] : data.intro;
    combat.cutsceneIdx = 0; combat.cutsceneCharIdx = 0;
    combat.cutsceneTyped = ''; combat.cutsceneDelay = 0;
    combat.cutsceneKO = isKO; state = ST.CUTSCENE;
}

function advanceCutscene() {
    if (combat.cutsceneCharIdx < combat.cutsceneLines[combat.cutsceneIdx].length) {
        combat.cutsceneTyped = combat.cutsceneLines[combat.cutsceneIdx];
        combat.cutsceneCharIdx = combat.cutsceneLines[combat.cutsceneIdx].length;
        return;
    }
    combat.cutsceneIdx++;
    if (combat.cutsceneIdx >= combat.cutsceneLines.length) {
        if (combat.cutsceneKO) {
            if (allEnemiesDefeated()) state = ST.WIN;
            else state = ST.EXPLORE;
        } else {
            combat.introTimer = 1200; state = ST.FIGHT_INTRO;
        }
        return;
    }
    combat.cutsceneCharIdx = 0; combat.cutsceneTyped = ''; combat.cutsceneDelay = 0;
}

function updateCutscene(dt) {
    if (combat.cutsceneIdx >= combat.cutsceneLines.length) return;
    let line = combat.cutsceneLines[combat.cutsceneIdx];
    if (combat.cutsceneCharIdx < line.length) {
        combat.cutsceneDelay += dt;
        while (combat.cutsceneDelay >= 35 && combat.cutsceneCharIdx < line.length) {
            combat.cutsceneDelay -= 35; combat.cutsceneCharIdx++;
            combat.cutsceneTyped = line.substring(0, combat.cutsceneCharIdx);
            SFX.cutsceneType();
        }
    }
}

function renderCutscene() {
    // Dark background with subtle animated noise
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    let t = Date.now() * 0.001;

    // Subtle red fog at bottom
    let fogGrad = ctx.createLinearGradient(0, H * 0.5, 0, H);
    fogGrad.addColorStop(0, 'rgba(80,0,0,0)');
    fogGrad.addColorStop(1, 'rgba(40,0,0,0.3)');
    ctx.fillStyle = fogGrad; ctx.fillRect(0, 0, W, H);

    // Spotlight on villain
    let spotGrad = ctx.createRadialGradient(W/2, H*0.3, 20, W/2, H*0.3, 200);
    spotGrad.addColorStop(0, 'rgba(120,20,20,0.15)');
    spotGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spotGrad; ctx.fillRect(0, 0, W, H);

    let en = combat.enemy;
    let vd = VILLAIN_DATA[en.name] || {};
    let cx = W / 2, cy = H * 0.28;
    let headR = (vd.headSize || 28) * 1.4;
    let bw = (vd.bodyW || 80) * 1.1, bh = (vd.bodyH || 85);

    // Idle sway
    let sway = Math.sin(t * 1.5) * 3;
    cx += sway;

    // Body with gradient
    let bodyGrad = ctx.createLinearGradient(cx - bw/2, cy + 15, cx + bw/2, cy + 15 + bh);
    bodyGrad.addColorStop(0, vd.bodyColor || '#552222');
    bodyGrad.addColorStop(1, vd.bodyColor ? darkenColor(vd.bodyColor, 0.6) : '#331111');
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(cx - bw / 2, cy + 15, bw, bh);
    // Body outline
    ctx.strokeStyle = 'rgba(255,0,0,0.15)'; ctx.lineWidth = 1;
    ctx.strokeRect(cx - bw / 2, cy + 15, bw, bh);

    // Head with subtle gradient
    ctx.fillStyle = vd.skinColor || '#884444';
    ctx.beginPath(); ctx.arc(cx, cy - headR + 20, headR, 0, Math.PI * 2); ctx.fill();
    // Head outline glow
    ctx.strokeStyle = 'rgba(255,60,60,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy - headR + 20, headR, 0, Math.PI * 2); ctx.stroke();

    // Eyes with glow
    ctx.fillStyle = '#000';
    ctx.fillRect(cx - headR * 0.35, cy - headR + 14, headR * 0.2, headR * 0.15);
    ctx.fillRect(cx + headR * 0.15, cy - headR + 14, headR * 0.2, headR * 0.15);
    // Eye glint
    ctx.fillStyle = 'rgba(255,50,50,0.5)';
    ctx.fillRect(cx - headR * 0.3, cy - headR + 15, headR * 0.06, headR * 0.06);
    ctx.fillRect(cx + headR * 0.2, cy - headR + 15, headR * 0.06, headR * 0.06);

    if (vd.style === 'boss') {
        // Crown with sparkle
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(cx - headR, cy - headR * 2 + 20, headR * 2, 8);
        ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(cx, cy - headR * 2 + 24, 5, 0, Math.PI * 2); ctx.fill();
        // Crown sparkle
        let sparkle = Math.sin(t * 6) * 0.5 + 0.5;
        ctx.fillStyle = 'rgba(255,255,200,' + sparkle * 0.6 + ')';
        ctx.beginPath(); ctx.arc(cx - headR * 0.5, cy - headR * 2 + 22, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + headR * 0.5, cy - headR * 2 + 22, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (vd.style === 'wild') { ctx.strokeStyle = '#ccc'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - bw / 2 - 8, cy + 30); ctx.lineTo(cx - bw / 2 + 8, cy + 50); ctx.stroke(); }
    if (vd.style === 'brawler') { ctx.strokeStyle = '#660000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 20, cy + 25); ctx.lineTo(cx + 20, cy + 55); ctx.stroke(); }

    // Gloves with glow
    ctx.fillStyle = vd.gloveColor || '#cc0000';
    ctx.shadowColor = vd.gloveColor || '#cc0000'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(cx - bw / 2 - 15 + Math.sin(t * 2) * 3, cy + bh * 0.5, 16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + bw / 2 + 15 + Math.sin(t * 2 + 1) * 3, cy + bh * 0.5, 16, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Name with dramatic reveal
    ctx.fillStyle = '#ff0000'; ctx.font = 'bold 28px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 15;
    ctx.fillText(en.name, cx, cy + bh + 40);
    // Name underline
    let nameW = ctx.measureText(en.name).width;
    ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - nameW/2, cy + bh + 52); ctx.lineTo(cx + nameW/2, cy + bh + 52); ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#cc6600'; ctx.font = '14px Courier New';
    let labels = { speedster: 'SPEED FIGHTER', counter: 'COUNTER SPECIALIST', brawler: 'HEAVY HITTER', wild: 'WILD BRAWLER', boss: 'THE FINAL BOSS' };
    ctx.fillText(labels[vd.style] || '', cx, cy + bh + 66);
    ctx.fillStyle = '#884444'; ctx.font = '12px Courier New';
    ctx.fillText('Floor ' + LEVELS[currentLevel].floor, cx, cy + bh + 82);

    // Stats display
    ctx.fillStyle = '#885555'; ctx.font = '11px Courier New';
    ctx.fillText('HP: ' + en.maxHealth + '  |  STR: ' + Math.round(en.damage * 10), cx, cy + bh + 96);

    // Dialogue box with better styling
    let bx2 = 60, by2 = H - 130, bww = W - 120, bhh = 100;
    // Box gradient background
    let boxGrad = ctx.createLinearGradient(bx2, by2, bx2, by2 + bhh);
    boxGrad.addColorStop(0, 'rgba(40,0,0,0.95)');
    boxGrad.addColorStop(1, 'rgba(20,0,0,0.98)');
    ctx.fillStyle = boxGrad;
    ctx.fillRect(bx2, by2, bww, bhh);
    // Box border with glow
    ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2;
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 8;
    ctx.strokeRect(bx2, by2, bww, bhh);
    ctx.shadowBlur = 0;
    // Inner border
    ctx.strokeStyle = 'rgba(255,0,0,0.2)'; ctx.lineWidth = 1;
    ctx.strokeRect(bx2 + 4, by2 + 4, bww - 8, bhh - 8);
    // Speaker indicator
    ctx.fillStyle = '#ff4444'; ctx.font = 'bold 11px Courier New';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(en.name + ':', bx2 + 12, by2 + 6);

    ctx.fillStyle = '#ffffff'; ctx.font = '18px Courier New';
    ctx.fillText(combat.cutsceneTyped, bx2 + 16, by2 + 24);
    if (combat.cutsceneCharIdx >= (combat.cutsceneLines[combat.cutsceneIdx] || '').length) {
        if (Math.floor(Date.now() / 400) % 2) {
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px Courier New'; ctx.textAlign = 'right';
            ctx.fillText('[CLICK / ENTER / SPACE]', bx2 + bww - 12, by2 + bhh - 22);
        }
    }

    // Scanlines overlay
    renderScanlines();
    ctx.textBaseline = 'alphabetic';
}

// ─── Fight Intro & KO ────────────────────────────────────────────────
function renderFightIntro() {
    renderCombatScene();
    let a = Math.min(1, combat.introTimer / 400);
    let t = 1 - combat.introTimer / 1200;

    // Radial flash
    ctx.fillStyle = 'rgba(255,0,0,' + (a * 0.3) + ')'; ctx.fillRect(0, 0, W, H);

    // Zoom-in text effect
    let scale = 0.5 + t * 1.5;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ff0000'; ctx.font = 'bold 72px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 30 + t * 20;
    ctx.fillText('FIGHT!', 0, 0);
    // Outline
    ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 3;
    ctx.strokeText('FIGHT!', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Burst lines
    for (let i = 0; i < 12; i++) {
        let angle = (Math.PI * 2 / 12) * i + t * 0.5;
        let len = 40 + t * 200;
        ctx.strokeStyle = 'rgba(255,100,0,' + (a * 0.4) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W/2 + Math.cos(angle) * 60, H/2 + Math.sin(angle) * 60);
        ctx.lineTo(W/2 + Math.cos(angle) * len, H/2 + Math.sin(angle) * len);
        ctx.stroke();
    }
}

function renderKO() {
    renderCombatScene();

    // Dramatic overlay
    let koProgress = 1 - combat.koTimer / 2200;
    ctx.fillStyle = 'rgba(0,0,0,' + Math.min(0.6, koProgress * 0.8) + ')'; ctx.fillRect(0, 0, W, H);

    // K.O. text with slam effect
    let textScale = koProgress < 0.15 ? (koProgress / 0.15) * 2 : 1 + Math.sin(koProgress * 3) * 0.05;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(textScale, textScale);
    ctx.fillStyle = '#ff0000'; ctx.font = 'bold 80px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 40 + Math.sin(Date.now() * 0.01) * 10;
    ctx.fillText('K.O.!', 0, 0);
    ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 3;
    ctx.strokeText('K.O.!', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Score popup
    if (koProgress > 0.3) {
        let sa = Math.min(1, (koProgress - 0.3) * 3);
        ctx.fillStyle = 'rgba(255,200,0,' + sa + ')';
        ctx.font = 'bold 24px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('+' + (combat.enemy.maxHealth * 10) + ' PTS', W / 2, H / 2 + 60);
        ctx.fillStyle = 'rgba(255,204,0,' + sa + ')';
        ctx.font = '18px Courier New';
        ctx.fillText('+' + combat.enemy.coins + ' COINS', W / 2, H / 2 + 85);
    }
    ctx.textBaseline = 'alphabetic';
}

// ─── Menu ────────────────────────────────────────────────────────────
function renderMenu() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

    // Animated background particles
    let t = Date.now() * 0.001;
    for (let mp of menuParticles) {
        mp.x += mp.vx;
        mp.y += mp.vy;
        if (mp.y < -5) { mp.y = H + 5; mp.x = Math.random() * W; }
        if (mp.x < -5) mp.x = W + 5;
        if (mp.x > W + 5) mp.x = -5;
        ctx.globalAlpha = mp.alpha * (0.5 + Math.sin(t + mp.x * 0.01) * 0.5);
        ctx.fillStyle = mp.color;
        ctx.beginPath(); ctx.arc(mp.x, mp.y, mp.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Animated glow border
    let glowPhase = Math.sin(t * 2) * 0.3 + 0.7;
    ctx.strokeStyle = 'rgba(255,0,0,' + glowPhase + ')'; ctx.lineWidth = 4;
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 20 + Math.sin(t * 3) * 10;
    ctx.strokeRect(20, 20, W - 40, H - 40); ctx.shadowBlur = 0;

    // Corner decorations
    let cornerSize = 20;
    ctx.strokeStyle = '#ff4400'; ctx.lineWidth = 2;
    // Top-left
    ctx.beginPath(); ctx.moveTo(20, 20 + cornerSize); ctx.lineTo(20, 20); ctx.lineTo(20 + cornerSize, 20); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(W-20 - cornerSize, 20); ctx.lineTo(W-20, 20); ctx.lineTo(W-20, 20 + cornerSize); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(20, H-20 - cornerSize); ctx.lineTo(20, H-20); ctx.lineTo(20 + cornerSize, H-20); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(W-20 - cornerSize, H-20); ctx.lineTo(W-20, H-20); ctx.lineTo(W-20, H-20 - cornerSize); ctx.stroke();

    // Title with glow pulse
    ctx.fillStyle = '#ff0000'; ctx.font = 'bold 46px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 25 + Math.sin(t * 2) * 8;
    ctx.fillText('DRUNKEN STREET', W / 2, H * 0.14);
    ctx.fillText('BOXING', W / 2, H * 0.26);
    ctx.shadowBlur = 0;

    // Subtitle with typewriter shimmer
    ctx.fillStyle = '#cc4444'; ctx.font = '14px Courier New';
    let subtitle = '5 FLOORS \u2022 9 FIGHTERS \u2022 CLIMB TO THE TOP';
    for (let i = 0; i < subtitle.length; i++) {
        let charAlpha = 0.5 + Math.sin(t * 4 + i * 0.3) * 0.3;
        ctx.fillStyle = 'rgba(204,68,68,' + charAlpha + ')';
        let charX = W/2 - ctx.measureText(subtitle).width / 2 + ctx.measureText(subtitle.substring(0, i)).width;
        ctx.textAlign = 'left';
        ctx.fillText(subtitle[i], charX, H * 0.35);
    }
    ctx.textAlign = 'center';

    let y = H * 0.46;
    for (let i = 0; i < MENU_OPTIONS.length; i++) {
        let sel = i === menuCursor;
        let bw = 220, bh = 38;
        let bx = W / 2 - bw / 2, by = y - bh / 2;

        if (sel) {
            // Animated selection background
            let selGlow = 0.15 + Math.sin(t * 5) * 0.05;
            ctx.fillStyle = 'rgba(255,0,0,' + selGlow + ')';
            ctx.fillRect(bx, by, bw, bh);
            // Animated border
            ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2;
            ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 8;
            ctx.strokeRect(bx, by, bw, bh);
            ctx.shadowBlur = 0;
            // Selection arrows
            ctx.fillStyle = '#ff4444'; ctx.font = 'bold 20px Courier New';
            ctx.fillText('\u25B8', bx - 18, y);
            ctx.fillText('\u25C2', bx + bw + 18, y);
        }
        ctx.fillStyle = sel ? '#ffffff' : '#884444';
        ctx.font = (sel ? 'bold ' : '') + '28px Courier New';
        ctx.fillText(MENU_OPTIONS[i], W / 2, y);
        if (sel) {
            ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 12;
            ctx.fillText(MENU_OPTIONS[i], W / 2, y);
            ctx.shadowBlur = 0;
        }
        y += 42;
    }

    // Coins with icon
    ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 16px Courier New';
    ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 5;
    ctx.fillText('\u2B50 Coins: ' + saveData.coins, W / 2, H * 0.82);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('\u2588 High Score: ' + saveData.highScore, W / 2, H * 0.88);

    ctx.fillStyle = '#ffffff'; ctx.font = '13px Courier New';
    let blink = Math.floor(Date.now() / 600) % 2;
    if (blink) ctx.fillText('WASD / Arrows to navigate \u2022 ENTER or CLICK to select', W / 2, H * 0.94);

    // Scanlines on menu
    renderScanlines();
    ctx.textBaseline = 'alphabetic';
}

// ─── Shop Screen ─────────────────────────────────────────────────────
function renderShop() {
    // Background with subtle gradient
    let shopBg = ctx.createLinearGradient(0, 0, 0, H);
    shopBg.addColorStop(0, '#0a0000');
    shopBg.addColorStop(1, '#000000');
    ctx.fillStyle = shopBg; ctx.fillRect(0, 0, W, H);

    // Animated border with glow
    let t = Date.now() * 0.001;
    ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 3;
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10 + Math.sin(t * 2) * 5;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.shadowBlur = 0;

    // Corner gems
    let gemPos = [[15,15],[W-15,15],[15,H-15],[W-15,H-15]];
    for (let gp of gemPos) {
        ctx.fillStyle = '#ff2200'; ctx.beginPath();
        ctx.arc(gp[0], gp[1], 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,100,0,' + (0.3 + Math.sin(t * 3) * 0.2) + ')';
        ctx.beginPath(); ctx.arc(gp[0], gp[1], 8, 0, Math.PI * 2); ctx.fill();
    }

    // Title
    ctx.fillStyle = '#ff0000'; ctx.font = 'bold 32px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 15;
    ctx.fillText('SHOP & CUSTOMIZATION', W / 2, 38);
    ctx.shadowBlur = 0;
    // Title underline
    ctx.strokeStyle = 'rgba(255,0,0,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W * 0.2, 54); ctx.lineTo(W * 0.8, 54); ctx.stroke();

    ctx.fillStyle = '#ffcc00'; ctx.font = '16px Courier New';
    ctx.textAlign = 'right'; ctx.fillText('Coins: ' + saveData.coins, W - 30, 38);
    ctx.textAlign = 'center'; ctx.font = 'bold 18px Courier New';
    ctx.fillStyle = shopTab === 0 ? '#ff0000' : '#553333';
    ctx.fillText('[ SKINS ]', W * 0.2, 70);
    ctx.fillStyle = shopTab === 1 ? '#ff0000' : '#553333';
    ctx.fillText('[ GLOVES ]', W * 0.2, 92);
    ctx.fillStyle = '#ffffff'; ctx.font = '12px Courier New';
    ctx.fillText('TAB / \u2190\u2192 to switch', W * 0.2, 112);
    let items = shopTab === 0 ? SKINS : GLOVES_SHOP;
    let ownedList = shopTab === 0 ? saveData.ownedSkins : saveData.ownedGloves;
    let equippedId = shopTab === 0 ? saveData.equippedSkin : saveData.equippedGloves;
    let startY = 130;
    let visibleItems = Math.min(items.length, 8);
    let scrollOffset = Math.max(0, shopCursor - visibleItems + 3);
    scrollOffset = Math.min(scrollOffset, Math.max(0, items.length - visibleItems));

    for (let vi = 0; vi < visibleItems; vi++) {
        let i = vi + scrollOffset;
        if (i >= items.length) break;
        let item = items[i];
        let sel = i === shopCursor;
        let owned = ownedList.includes(item.id);
        let equipped = item.id === equippedId;
        let y = startY + vi * 38;
        if (sel) { ctx.fillStyle = 'rgba(255,0,0,0.12)'; ctx.fillRect(20, y - 14, W * 0.42, 34); }
        let swatchColor = shopTab === 0 ? item.armColor : item.color;
        ctx.fillStyle = swatchColor;
        ctx.fillRect(30, y - 8, 20, 20);
        ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 1; ctx.strokeRect(30, y - 8, 20, 20);
        ctx.fillStyle = sel ? '#ffffff' : '#cc8888';
        ctx.font = (sel ? 'bold ' : '') + '14px Courier New';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(item.name, 58, y + 2);
        if (equipped) { ctx.fillStyle = '#00ff88'; ctx.fillText('[EQUIPPED]', 200, y + 2); }
        else if (owned) { ctx.fillStyle = '#888888'; ctx.fillText('[OWNED]', 200, y + 2); }
        else { ctx.fillStyle = '#ffcc00'; ctx.fillText(item.price + ' coins', 200, y + 2); }
    }
    if (items.length > visibleItems) {
        ctx.fillStyle = '#553333'; ctx.font = '12px Courier New'; ctx.textAlign = 'center';
        if (scrollOffset > 0) ctx.fillText('\u25B2', W * 0.22, startY - 16);
        if (scrollOffset + visibleItems < items.length) ctx.fillText('\u25BC', W * 0.22, startY + visibleItems * 38);
    }
    ctx.strokeStyle = '#440000'; ctx.lineWidth = 2;
    ctx.strokeRect(W * 0.48, 120, W * 0.48, H - 150);
    ctx.fillStyle = '#0a0000'; ctx.fillRect(W * 0.48, 120, W * 0.48, H - 150);
    ctx.fillStyle = '#cc4444'; ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('PREVIEW', W * 0.72, 128);
    let previewSkin = shopTab === 0 ? SKINS[shopCursor] : getSkin();
    let previewGlove = shopTab === 1 ? GLOVES_SHOP[shopCursor] : getGloves();
    drawShopPreview(previewSkin, previewGlove);

    // Show special move info for skins tab
    if (shopTab === 0) {
        let skinItem = SKINS[shopCursor];
        ctx.fillStyle = '#ffaa00'; ctx.font = '12px Courier New';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Special: ' + skinItem.special.name, W * 0.72, H - 60);
        ctx.fillStyle = '#886644'; ctx.font = '11px Courier New';
        ctx.fillText('Dmg: ' + skinItem.special.dmg[0] + '-' + skinItem.special.dmg[1], W * 0.72, H - 45);
    }

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('CLICK or ENTER = Buy/Equip  |  ESC = Back', W / 2, H - 18);
    ctx.textBaseline = 'alphabetic';
    renderNotifications();
}

function drawShopPreview(skinItem, gloveItem) {
    let pcx = W * 0.72, pcy = H * 0.48;
    let t = Date.now() * 0.001;
    // Idle breathing
    let breathL = Math.sin(t * 2.5) * 3;
    let breathR = Math.sin(t * 2.5 + 0.6) * 3;

    // Left arm
    ctx.fillStyle = skinItem.armColor;
    ctx.beginPath(); ctx.ellipse(pcx - 55, pcy - 10 + breathL, 26, 16, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skinItem.highlight;
    ctx.beginPath(); ctx.ellipse(pcx - 50, pcy - 16 + breathL, 12, 8, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skinItem.armColor;
    ctx.fillRect(pcx - 72, pcy + 10, 30, 50);
    ctx.fillStyle = gloveItem.color;
    ctx.beginPath(); ctx.arc(pcx - 58, pcy + 15 + breathL, 28, 0, Math.PI * 2); ctx.fill();
    // Glove shine
    let gShine = ctx.createRadialGradient(pcx - 64, pcy + 8 + breathL, 2, pcx - 58, pcy + 15 + breathL, 28);
    gShine.addColorStop(0, 'rgba(255,255,255,0.3)');
    gShine.addColorStop(1, 'rgba(0,0,0,0.05)');
    ctx.fillStyle = gShine;
    ctx.beginPath(); ctx.arc(pcx - 58, pcy + 15 + breathL, 28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = gloveItem.outline; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = gloveItem.outline;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(pcx - 58 + i * 9, pcy + 2 + breathL, 4, 0, Math.PI * 2); ctx.fill(); }

    // Right arm
    ctx.fillStyle = skinItem.armColor;
    ctx.beginPath(); ctx.ellipse(pcx + 55, pcy - 10 + breathR, 26, 16, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skinItem.highlight;
    ctx.beginPath(); ctx.ellipse(pcx + 50, pcy - 16 + breathR, 12, 8, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skinItem.armColor;
    ctx.fillRect(pcx + 42, pcy + 10, 30, 50);
    ctx.fillStyle = gloveItem.color;
    ctx.beginPath(); ctx.arc(pcx + 58, pcy + 15 + breathR, 28, 0, Math.PI * 2); ctx.fill();
    let gShine2 = ctx.createRadialGradient(pcx + 52, pcy + 8 + breathR, 2, pcx + 58, pcy + 15 + breathR, 28);
    gShine2.addColorStop(0, 'rgba(255,255,255,0.3)');
    gShine2.addColorStop(1, 'rgba(0,0,0,0.05)');
    ctx.fillStyle = gShine2;
    ctx.beginPath(); ctx.arc(pcx + 58, pcy + 15 + breathR, 28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = gloveItem.outline; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = gloveItem.outline;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(pcx + 58 + i * 9, pcy + 2 + breathR, 4, 0, Math.PI * 2); ctx.fill(); }

    let item = shopTab === 0 ? SKINS[shopCursor] : GLOVES_SHOP[shopCursor];
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff4444'; ctx.shadowBlur = 6;
    ctx.fillText(item.name, pcx, pcy + 90);
    ctx.shadowBlur = 0;
}

// ─── Settings Screen ─────────────────────────────────────────────────
function renderSettings() {
    // Background gradient
    let setBg = ctx.createLinearGradient(0, 0, 0, H);
    setBg.addColorStop(0, '#080000');
    setBg.addColorStop(1, '#000');
    ctx.fillStyle = setBg; ctx.fillRect(0, 0, W, H);
    let t = Date.now() * 0.001;

    // Animated border
    ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 3;
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 8 + Math.sin(t * 2) * 4;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.shadowBlur = 0;

    // Gear icon decoration
    ctx.fillStyle = 'rgba(255,0,0,0.06)';
    ctx.save(); ctx.translate(W * 0.85, H * 0.15);
    ctx.rotate(t * 0.3);
    for (let i = 0; i < 8; i++) {
        ctx.fillRect(-8, -40, 16, 80);
        ctx.rotate(Math.PI / 4);
    }
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ff0000'; ctx.font = 'bold 36px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 15;
    ctx.fillText('SETTINGS', W / 2, 50); ctx.shadowBlur = 0;
    // Underline
    ctx.strokeStyle = 'rgba(255,0,0,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W * 0.3, 68); ctx.lineTo(W * 0.7, 68); ctx.stroke();

    let y = 120;
    for (let i = 0; i < SETTINGS_OPTS.length; i++) {
        let sel = i === settingsCursor;
        let prefix = sel ? '\u25B8 ' : '  ';
        ctx.fillStyle = sel ? '#ff0000' : '#664444';
        ctx.font = (sel ? 'bold ' : '') + '22px Courier New';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        let label = prefix + SETTINGS_OPTS[i];
        // Show "Resume" instead of "Back" when accessed from gameplay
        if (i === 5 && settingsPrevState !== null) label = prefix + 'Resume';
        if (i === 6) { ctx.fillStyle = sel ? '#ff4444' : '#663333'; }
        ctx.fillText(label, W * 0.2, y);
        ctx.textAlign = 'right';
        ctx.fillStyle = sel ? '#ffffff' : '#aa8888';
        switch (i) {
            case 0: ctx.fillText('\u25C0 ' + DIFF_NAMES[settings.difficulty] + ' \u25B6', W * 0.8, y); break;
            case 1: ctx.fillText('\u25C0 ' + settings.sensitivity.toFixed(1) + ' \u25B6', W * 0.8, y); break;
            case 2: ctx.fillText('\u25C0 ' + settings.speed.toFixed(1) + ' \u25B6', W * 0.8, y); break;
            case 3: ctx.fillText(settings.screenShake ? 'ON' : 'OFF', W * 0.8, y); break;
            case 4: ctx.fillText(settings.showMinimap ? 'ON' : 'OFF', W * 0.8, y); break;
            case 5: break;
            case 6: break;
        }
        if (sel) {
            ctx.fillStyle = 'rgba(255,0,0,0.08)';
            ctx.fillRect(W * 0.15, y - 18, W * 0.7, 36);
        }
        y += 48;
    }
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('CLICK / \u2190\u2192 to change  |  ESC = ' + (settingsPrevState !== null ? 'Resume' : 'Back'), W / 2, H - 20);
    ctx.textBaseline = 'alphabetic';
}

// ─── Game Over & Win ─────────────────────────────────────────────────
function renderGameOver() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    let t = Date.now() * 0.001;

    // Rain-like falling particles
    ctx.strokeStyle = 'rgba(255,0,0,0.15)'; ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
        let rx = (i * 27 + t * 30) % W;
        let ry = (i * 67 + t * 80) % H;
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 2, ry + 12); ctx.stroke();
    }

    // Pulsing vignette
    let vigPulse = 0.4 + Math.sin(t * 2) * 0.1;
    let vigGrad = ctx.createRadialGradient(W/2, H/2, 50, W/2, H/2, W*0.6);
    vigGrad.addColorStop(0, 'rgba(80,0,0,0)');
    vigGrad.addColorStop(1, 'rgba(80,0,0,' + vigPulse + ')');
    ctx.fillStyle = vigGrad; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ff0000'; ctx.font = 'bold 64px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 30 + Math.sin(t * 3) * 10;
    ctx.fillText('GAME OVER', W / 2, H * 0.3); ctx.shadowBlur = 0;

    // Separator line
    ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W * 0.25, H * 0.38); ctx.lineTo(W * 0.75, H * 0.38); ctx.stroke();

    ctx.font = '22px Courier New';
    ctx.fillStyle = '#ff4444';
    ctx.fillText('Final Score: ' + player.score, W / 2, H * 0.48);
    ctx.fillStyle = '#ffcc00'; ctx.fillText('Coins Earned: ' + saveData.coins, W / 2, H * 0.56);
    ctx.fillStyle = '#888888'; ctx.font = '16px Courier New';
    ctx.fillText('Reached Floor ' + LEVELS[currentLevel].floor + ': ' + LEVELS[currentLevel].name, W / 2, H * 0.65);

    // Stats summary
    if (comboBest > 0) {
        ctx.fillStyle = '#ff8800'; ctx.font = '14px Courier New';
        ctx.fillText('Best Combo: ' + comboBest + 'x', W / 2, H * 0.72);
    }

    if (Math.floor(Date.now() / 500) % 2) {
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px Courier New';
        ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 8;
        ctx.fillText('[ CLICK or PRESS ENTER ]', W / 2, H * 0.85);
        ctx.shadowBlur = 0;
    }
    renderScanlines();
    ctx.textBaseline = 'alphabetic';
}

function renderWin() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    let t = Date.now() * 0.001;

    // Firework particles (more elaborate)
    for (let i = 0; i < 40; i++) {
        let px = (Math.sin(t * 0.7 + i * 1.3) * 0.5 + 0.5) * W;
        let py = (Math.cos(t * 0.5 + i * 0.9) * 0.5 + 0.5) * H;
        let colors = ['#ff0000', '#ffcc00', '#ff4400', '#ff8800', '#ffffff', '#ff66aa', '#00ff88'];
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.3 + Math.sin(t * 2 + i) * 0.3;
        let size = 2 + Math.sin(t * 3 + i * 0.7) * 2;
        ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2); ctx.fill();
        // Trailing glow
        ctx.globalAlpha *= 0.3;
        ctx.beginPath(); ctx.arc(px, py, size * 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Spotlight effect
    let spotGrad = ctx.createRadialGradient(W/2, H*0.2, 10, W/2, H*0.2, 200);
    spotGrad.addColorStop(0, 'rgba(255,200,0,0.1)');
    spotGrad.addColorStop(1, 'rgba(255,200,0,0)');
    ctx.fillStyle = spotGrad; ctx.fillRect(0, 0, W, H);

    // Crown icon
    ctx.fillStyle = '#ffcc00';
    ctx.font = '40px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 15;
    ctx.fillText('\u265A', W / 2, H * 0.1);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ff0000'; ctx.font = 'bold 58px Courier New';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 30;
    ctx.fillText('CHAMPION!', W / 2, H * 0.22); ctx.shadowBlur = 0;

    // Decorative lines
    ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W * 0.2, H * 0.3); ctx.lineTo(W * 0.8, H * 0.3); ctx.stroke();

    ctx.font = '20px Courier New';
    ctx.fillStyle = '#ff4444';
    ctx.fillText('You conquered all 5 floors!', W / 2, H * 0.38);
    ctx.fillText('All 9 fighters knocked out.', W / 2, H * 0.46);

    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 5;
    ctx.fillText('Final Score: ' + player.score, W / 2, H * 0.56);
    ctx.fillText('Coins: ' + saveData.coins, W / 2, H * 0.64);
    ctx.shadowBlur = 0;

    if (comboBest > 0) {
        ctx.fillStyle = '#ff8800'; ctx.font = '16px Courier New';
        ctx.fillText('Best Combo: ' + comboBest + 'x', W / 2, H * 0.70);
    }

    if (drunkLevel >= 2) {
        ctx.fillStyle = '#ffaa00'; ctx.font = '20px Courier New';
        ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 8;
        ctx.fillText('...and you did it drunk. Legend.', W / 2, H * 0.76);
        ctx.shadowBlur = 0;
    }

    if (Math.floor(Date.now() / 500) % 2) {
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px Courier New';
        ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 8;
        ctx.fillText('[ CLICK or PRESS ENTER ]', W / 2, H * 0.88);
        ctx.shadowBlur = 0;
    }
    renderScanlines();
    ctx.textBaseline = 'alphabetic';
}

// ─── Explore Rendering ──────────────────────────────────────────────
function renderExplore() {
    let lvl = LEVELS[currentLevel];
    // Ceiling and floor handled by castRays -> renderFloorCeiling
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

    // Head bob effect when moving
    let isMoving = keys['w'] || keys['arrowup'] || keys['s'] || keys['arrowdown'];
    if (isMoving) {
        let bobAmt = Math.sin(Date.now() * 0.008) * 3;
        ctx.save();
        ctx.translate(0, bobAmt);
    }

    let zBuf = castRays();
    renderSprites(zBuf);

    if (isMoving) ctx.restore();

    renderProximity();

    // Ambient dust particles
    renderDust();

    renderExploreArms();
    renderMinimap();
    renderExploreHUD();
    renderScanlines();
    renderVignette();

    // Low health warning overlay
    if (player.health < player.maxHealth * 0.3 && player.health > 0) {
        let pulse = 0.05 + Math.sin(Date.now() * 0.005) * 0.04;
        let dangerGrad = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, W*0.6);
        dangerGrad.addColorStop(0, 'rgba(255,0,0,0)');
        dangerGrad.addColorStop(1, 'rgba(200,0,0,' + pulse + ')');
        ctx.fillStyle = dangerGrad; ctx.fillRect(0, 0, W, H);
    }

    applyDrunkEffects();
    renderNotifications();

    // Mouse turn indicator: small arrow showing turn direction
    if (mouseOnCanvas) {
        let offset = mouseX - W / 2;
        let deadZone = W * 0.08;
        if (Math.abs(offset) > deadZone) {
            let sign = offset > 0 ? 1 : -1;
            let mag = Math.min(1, (Math.abs(offset) - deadZone) / (W / 2 - deadZone));
            ctx.globalAlpha = 0.2 + mag * 0.3;
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px Courier New';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(sign > 0 ? '\u25B6' : '\u25C0', W / 2 + sign * 60, H / 2);
            ctx.globalAlpha = 1;
            ctx.textBaseline = 'alphabetic';
        }
    }

    // Enhanced crosshair with targeting reticle
    let nearEnemy = false;
    for (let e of enemies) {
        if (!e.alive || e.isBag) continue;
        let dx = e.x - player.x, dy = e.y - player.y;
        if (Math.sqrt(dx*dx + dy*dy) < 3) { nearEnemy = true; break; }
    }
    let crossColor = nearEnemy ? '#ff2222' : '#ff4444';
    let crossSize = nearEnemy ? 10 : 8;
    let crossAlpha = nearEnemy ? 0.6 : 0.3;
    ctx.globalAlpha = crossAlpha;
    ctx.strokeStyle = crossColor; ctx.lineWidth = nearEnemy ? 2 : 1;
    // Horizontal
    ctx.beginPath(); ctx.moveTo(W/2 - crossSize, H/2); ctx.lineTo(W/2 - 3, H/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W/2 + 3, H/2); ctx.lineTo(W/2 + crossSize, H/2); ctx.stroke();
    // Vertical
    ctx.beginPath(); ctx.moveTo(W/2, H/2 - crossSize); ctx.lineTo(W/2, H/2 - 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W/2, H/2 + 3); ctx.lineTo(W/2, H/2 + crossSize); ctx.stroke();
    // Center dot
    if (nearEnemy) {
        ctx.fillStyle = crossColor;
        ctx.beginPath(); ctx.arc(W/2, H/2, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// ─── Visual Effects ──────────────────────────────────────────────────
function renderScanlines() {
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    // CRT curvature effect (subtle edge darkening)
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(0, 0, 3, H);
    ctx.fillRect(W - 3, 0, 3, H);
    ctx.fillRect(0, 0, W, 2);
    ctx.fillRect(0, H - 2, W, 2);
    // Subtle static noise (occasional)
    if (Math.random() < 0.03) {
        let noiseY = Math.random() * H;
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(0, noiseY, W, 1 + Math.random() * 3);
    }
}

function renderVignette() {
    let grd = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.72);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(0.7, 'rgba(0,0,0,0.15)');
    grd.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
}

// ─── Particles ───────────────────────────────────────────────────────
function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * dt * 0.06;
        p.y += p.vy * dt * 0.06;
        p.vy += dt * 0.01;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function renderParticles() {
    for (let p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// ─── Notifications ───────────────────────────────────────────────────
function updateNotifications(dt) {
    for (let i = notifications.length - 1; i >= 0; i--) {
        notifications[i].timer -= dt;
        if (notifications[i].timer <= 0) notifications.splice(i, 1);
    }
}

function renderNotifications() {
    let y = H * 0.2;
    for (let n of notifications) {
        let a = Math.min(1, n.timer / 400);
        let slideX = (1 - a) * 30;

        // Background pill
        let tw = ctx.measureText(n.text).width || 200;
        ctx.fillStyle = 'rgba(40,20,0,' + a * 0.6 + ')';
        ctx.beginPath();
        ctx.roundRect(W / 2 - tw / 2 - 16 + slideX, y - 14, tw + 32, 28, 14);
        ctx.fill();

        // Text with glow
        ctx.fillStyle = 'rgba(255,200,0,' + a + ')';
        ctx.font = 'bold 20px Courier New';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 12;
        ctx.fillText(n.text, W / 2 + slideX, y);
        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = 'rgba(255,200,0,' + a * 0.3 + ')'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(W / 2 - tw / 2 - 16 + slideX, y - 14, tw + 32, 28, 14);
        ctx.stroke();

        y += 36;
    }
    ctx.textBaseline = 'alphabetic';
}

// ─── Update: Explore ─────────────────────────────────────────────────
function updateExplore(dt) {
    let moveSpeed = PLAYER_SPEED * settings.speed;
    let turnSpeed = TURN_SPEED * settings.sensitivity;
    let moveX = 0, moveY = 0;
    let isMoving = false;
    if (keys['w'] || keys['arrowup']) { moveX += Math.cos(player.angle) * moveSpeed * dt; moveY += Math.sin(player.angle) * moveSpeed * dt; isMoving = true; }
    if ((keys['s'] || keys['arrowdown']) && state === ST.EXPLORE) { moveX -= Math.cos(player.angle) * moveSpeed * dt; moveY -= Math.sin(player.angle) * moveSpeed * dt; isMoving = true; }
    if ((keys['a'] || keys['arrowleft']) && state === ST.EXPLORE) player.angle -= turnSpeed * dt;
    if ((keys['d'] || keys['arrowright']) && state === ST.EXPLORE) player.angle += turnSpeed * dt;

    // Mouse-based turning
    if (mouseOnCanvas) {
        let deadZone = W * 0.08;
        let offset = mouseX - W / 2;
        if (Math.abs(offset) > deadZone) {
            let sign = offset > 0 ? 1 : -1;
            let magnitude = (Math.abs(offset) - deadZone) / (W / 2 - deadZone);
            player.angle += sign * magnitude * turnSpeed * 1.2 * dt;
        }
    }

    if (drunkLevel >= 2) player.angle += Math.sin(Date.now() * 0.001) * 0.0008 * dt;
    player.angle = ((player.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    let buf = 0.25;
    let nx = player.x + moveX, ny = player.y + moveY;
    if (currentMap[Math.floor(player.y)][Math.floor(nx + (moveX > 0 ? buf : -buf))] === 0) player.x = nx;
    if (currentMap[Math.floor(ny + (moveY > 0 ? buf : -buf))][Math.floor(player.x)] === 0) player.y = ny;

    if (isMoving) {
        armBob += dt * 0.008;
        // Footstep sound
        footstepTimer -= dt;
        if (footstepTimer <= 0) {
            SFX.footstep();
            footstepTimer = 350 / settings.speed;
        }
    }

    // Update dust particles
    for (let d of dustParticles) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.y > H) { d.y = -2; d.x = Math.random() * W; }
        if (d.x < 0) d.x = W;
        if (d.x > W) d.x = 0;
        d.alpha = 0.1 + Math.sin(Date.now() * 0.001 + d.x) * 0.08;
    }

    // Bottle pickup
    for (let b of bottles) {
        if (b.picked) continue;
        if (Math.hypot(b.x - player.x, b.y - player.y) < BOTTLE_PICKUP_DIST) {
            b.picked = true;
            pickedBottles.add(b.key);
            inventory.bottles++;
            addNotif('+1 BOTTLE', 1200);
            SFX.bottlePickup();
        }
    }

    if (drunkNotifyTimer > 0) drunkNotifyTimer -= dt;

    // Stair prompt
    let stair = getNearbyStair();
    if (stair === 'up' && currentLevel < LEVELS.length - 1) stairPrompt = 'up';
    else if (stair === 'down' && currentLevel > 0) stairPrompt = 'down';
    else stairPrompt = '';

    // Enemy/bag proximity
    for (let e of enemies) {
        if (!e.alive) continue;
        if (Math.hypot(e.x - player.x, e.y - player.y) < ENGAGE_DIST) {
            // Reset smooth HP bars for new fight
            smoothPlayerHP = player.health;
            smoothEnemyHP = e.health;
            damageNumbers = [];
            speedLines = [];
            impactRings = [];
            comboCount = 0;
            comboTimer = 0;
            bloodOverlay = 0;
            cameraTilt = 0;
            cameraTiltTarget = 0;
            screenWarp = 0;
            slowMoTimer = 0;
            startCombat(e); return;
        }
    }

    // Check if current floor cleared
    if (enemies.length > 0 && enemies.every(e => !e.alive)) {
        if (allEnemiesDefeated()) { state = ST.WIN; return; }
    }
}

// ─── Start Combat ────────────────────────────────────────────────────
function startCombat(enemy) {
    combat = resetCombat();
    combat.enemy = enemy;
    combat.enemyNext = enemy.isBag ? 99999 : enemy.interval + Math.random() * 600;
    if (enemy.isBag) {
        // Skip cutscene for bags, short intro
        combat.introTimer = 600;
        state = ST.FIGHT_INTRO;
        SFX.fightIntro();
    } else {
        startCutscene(enemy, false);
    }
}

// ─── Enemy AI ────────────────────────────────────────────────────────
function getEnemyAI(en) {
    let vd = VILLAIN_DATA[en.name] || {};
    switch (vd.style || 'brawler') {
        case 'speedster': return { windupTime: 300, comboChance: 0.6, maxCombo: 3 };
        case 'counter':   return { windupTime: 650, comboChance: 0.3, maxCombo: 2 };
        case 'brawler':   return { windupTime: 550, comboChance: 0.2, maxCombo: 1 };
        case 'wild':      return { windupTime: 350, comboChance: 0.7, maxCombo: 4 };
        case 'boss':      return { windupTime: 400, comboChance: 0.5, maxCombo: 3 };
        default:          return { windupTime: 500, comboChance: 0.2, maxCombo: 1 };
    }
}

// ─── Update: Combat ──────────────────────────────────────────────────
function updateCombat(dt) {
    let en = combat.enemy;
    let dm = DIFF_MULT[settings.difficulty];

    // Apply slow-motion
    let effectiveDt = dt;
    if (slowMoTimer > 0) {
        slowMoTimer -= dt;
        slowMoFactor = 0.3;
        effectiveDt = dt * slowMoFactor;
        if (slowMoTimer <= 0) slowMoFactor = 1;
    }

    combat.bob += combat.bobDir * effectiveDt * 0.02;
    if (Math.abs(combat.bob) > 4) combat.bobDir *= -1;
    if (combat.hitFlash > 0) combat.hitFlash -= dt;
    if (combat.enemyHitFlash > 0) combat.enemyHitFlash -= dt;
    if (combat.shake > 0) combat.shake -= dt * 0.04;
    if (combat.msgTimer > 0) combat.msgTimer -= dt;
    if (combat.cooldown > 0) combat.cooldown -= effectiveDt;
    if (combat.dodgeCooldown > 0) combat.dodgeCooldown -= effectiveDt;
    if (drunkNotifyTimer > 0) drunkNotifyTimer -= dt;

    // Camera tilt smooth interpolation
    cameraTilt += (cameraTiltTarget - cameraTilt) * 0.1;
    if (Math.abs(cameraTilt) < 0.01) cameraTilt = 0;
    cameraTiltTarget *= 0.95;

    // Smooth health bars
    smoothPlayerHP += (player.health - smoothPlayerHP) * 0.05;
    smoothEnemyHP += (en.health - smoothEnemyHP) * 0.05;

    // Screen warp decay
    if (screenWarp > 0) screenWarp -= dt;

    // Blood overlay decay
    if (bloodOverlay > 0) {
        bloodOverlay -= dt * 0.5;
        for (let drip of bloodDrips) {
            drip.y += drip.speed * dt * 0.01;
        }
    }

    // Combo timer decay
    if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) {
            if (comboCount > comboBest) comboBest = comboCount;
            comboCount = 0;
        }
    }

    // Update damage numbers
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        let dn = damageNumbers[i];
        dn.x += dn.vx;
        dn.y += dn.vy;
        dn.vy += 0.03;
        dn.life -= dt;
        if (dn.life <= 0) damageNumbers.splice(i, 1);
    }

    // Update speed lines
    for (let i = speedLines.length - 1; i >= 0; i--) {
        speedLines[i].life -= dt;
        if (speedLines[i].life <= 0) speedLines.splice(i, 1);
    }

    // Update impact rings
    for (let i = impactRings.length - 1; i >= 0; i--) {
        impactRings[i].life -= dt;
        if (impactRings[i].life <= 0) impactRings.splice(i, 1);
    }

    if (combat.dodging) {
        combat.dodgeTimer -= effectiveDt;
        if (combat.dodgeTimer <= 0) combat.dodging = false;
        // Camera tilt during dodge
        if (combat.dodgeDir === -1) cameraTiltTarget = -3;
        else if (combat.dodgeDir === 1) cameraTiltTarget = 3;
    }
    combat.blocking = !!keys[' '];

    // Player attack resolution
    if (combat.attacking) {
        combat.attackTimer -= effectiveDt;
        if (combat.attackTimer <= 0) {
            if (combat.attackType === 'special') {
                // Special move
                let special = getSkin().special;
                let dmg = special.dmg[0] + Math.random() * (special.dmg[1] - special.dmg[0]);
                if (drunkLevel >= 2 && Math.random() < 0.1) {
                    combat.msg = 'MISSED! (drunk)'; combat.msgTimer = 500;
                    combat.attacking = false; combat.cooldown = 800; SFX.miss(); return;
                }
                en.health -= dmg;
                playerXp = 0;
                combat.enemyHitFlash = 350;
                combat.shake = 22;
                screenWarp = 500;
                combat.msg = special.name + '!'; combat.msgTimer = 800;
                combat.attacking = false; combat.cooldown = 800;
                SFX.special(); SFX.critHit();

                // Massive particle burst
                spawnParticles(W / 2, H * 0.35, 35, special.particleColor);
                spawnParticles(W / 2 - 50, H * 0.4, 15, special.particleColor);
                spawnParticles(W / 2 + 50, H * 0.4, 15, special.particleColor);
                spawnSpeedLines(20, special.particleColor);
                spawnImpactRing(W / 2, H * 0.35, special.particleColor, 120);

                // Damage number
                spawnDmgNum(W/2, H * 0.3, Math.floor(dmg), special.particleColor, true);

                // Combo
                comboCount++;
                comboTimer = COMBO_DECAY;
                if (comboCount >= 3) SFX.comboHit();

                // Slow-mo on special
                slowMoTimer = 400;
                SFX.slowMo();
            } else {
                // Normal attack
                let a = ATTACKS[combat.attackType];
                let dmg = a.dmg[0] + Math.random() * (a.dmg[1] - a.dmg[0]);

                // Combo damage bonus
                if (comboCount >= 3) dmg *= 1.1;
                if (comboCount >= 5) dmg *= 1.2;
                if (comboCount >= 8) dmg *= 1.3;

                if (drunkLevel >= 2 && Math.random() < 0.15) {
                    combat.msg = 'MISSED! (drunk)'; combat.msgTimer = 500;
                    combat.attacking = false; combat.cooldown = a.cd; SFX.miss();
                    // Reset combo on miss
                    if (comboCount > comboBest) comboBest = comboCount;
                    comboCount = 0; comboTimer = 0;
                    return;
                }
                en.health -= dmg;
                // XP gain from dealing damage
                playerXp = Math.min(MAX_XP, playerXp + Math.floor(dmg));
                if (playerXp >= MAX_XP) addNotif('SPECIAL READY! [Q]', 1800);
                combat.enemyHitFlash = 220;
                combat.shake = a.dmg[1] > 14 ? 14 : 5;
                combat.msg = a.name; combat.msgTimer = 500;
                combat.attacking = false; combat.cooldown = a.cd;

                // Speed lines on hooks & uppercuts
                if (combat.attackType === 'leftHook' || combat.attackType === 'rightHook') {
                    spawnSpeedLines(8, '#ff6644');
                    spawnImpactRing(W / 2, H * 0.35, '#ff4444', 60);
                    screenWarp = 200;
                }
                if (combat.attackType === 'uppercut') {
                    spawnSpeedLines(12, '#ff8844');
                    spawnImpactRing(W / 2, H * 0.3, '#ffaa44', 80);
                    screenWarp = 300;
                    slowMoTimer = 150;
                }

                // Play punch SFX
                if (en.isBag) { SFX.bagHit(); }
                else if (combat.attackType === 'jab') SFX.jab();
                else if (combat.attackType === 'cross') SFX.cross();
                else if (combat.attackType === 'leftHook' || combat.attackType === 'rightHook') SFX.hook();
                else if (combat.attackType === 'uppercut') SFX.uppercut();

                spawnParticles(W / 2, H * 0.35, 8, '#ff4444');
                spawnImpactRing(W / 2, H * 0.35, '#ff4444');

                // Damage number
                let dnColor = comboCount >= 5 ? '#ffcc00' : comboCount >= 3 ? '#ff8844' : '#ff4444';
                spawnDmgNum(W/2 + (Math.random()-0.5)*60, H * 0.3, Math.floor(dmg), dnColor, a.dmg[1] > 14);

                // Combo tracking
                comboCount++;
                comboTimer = COMBO_DECAY;
                if (comboCount >= 3) SFX.comboHit();
                if (comboCount >= 5) addNotif(comboCount + 'x COMBO!', 1200);
            }

            if (en.health <= 0) {
                en.health = 0; en.alive = false;
                if (en.isBag) {
                    defeatedEnemies.add(currentLevel + '_' + en.origIdx);
                    addNotif('BAG DESTROYED! +' + en.coins + ' coins', 1800);
                    saveData.coins += en.coins;
                    writeSave();
                    SFX.coinGain();
                    state = ST.EXPLORE;
                    // Reset combat visuals
                    damageNumbers = []; speedLines = []; impactRings = [];
                    return;
                }
                let scoreGain = en.maxHealth * 10;
                player.score += scoreGain;
                saveData.coins += en.coins;
                defeatedEnemies.add(currentLevel + '_' + en.origIdx);
                if (player.score > saveData.highScore) saveData.highScore = player.score;
                writeSave();
                addNotif('+' + en.coins + ' COINS!', 2500);
                SFX.ko(); SFX.coinGain();

                // KO slow-mo and big effects
                slowMoTimer = 800;
                screenWarp = 600;
                spawnSpeedLines(25, '#ff0000');
                spawnImpactRing(W/2, H*0.35, '#ff0000', 150);
                spawnParticles(W/2, H*0.35, 40, '#ff4444');
                spawnDmgNum(W/2, H*0.25, 'K.O.!', '#ff0000', true);

                combat.koTimer = 2200; state = ST.KO; return;
            }
        }
    }

    // Enemy AI (skip for bags)
    if (en.isBag) return;

    let ai = getEnemyAI(en);

    if (!combat.enemyWindup) {
        combat.enemyNext -= effectiveDt;
        if (combat.enemyNext <= 0) {
            combat.enemyWindup = true;
            combat.enemyWindupTimer = ai.windupTime;
            combat.enemyWindupHand = Math.random() < 0.5 ? 'left' : 'right';
            let atkTypes = getEnemyAttacks(en);
            combat.enemyAttackInfo = atkTypes[Math.floor(Math.random() * atkTypes.length)];
            combat.enemyComboCount = 0;
        }
    } else {
        combat.enemyWindupTimer -= effectiveDt;
        if (combat.enemyWindupTimer <= 0) {
            if (combat.dodging) {
                combat.msg = 'DODGED!'; combat.msgTimer = 400;
                SFX.dodge();
                spawnDmgNum(W/2, H*0.5, 'DODGE!', '#88ff88', false);
            } else {
                let dmg = en.dmg[0] + Math.random() * (en.dmg[1] - en.dmg[0]);
                dmg *= dm.pDmg;
                if (combat.blocking) dmg *= 0.2;
                player.health -= dmg;
                // XP gain from taking damage
                playerXp = Math.min(MAX_XP, playerXp + Math.floor(dmg * 0.5));
                if (playerXp >= MAX_XP) addNotif('SPECIAL READY! [Q]', 1800);
                if (!combat.blocking) {
                    combat.hitFlash = 250; combat.shake = 12;
                    combat.msg = combat.enemyAttackInfo ? combat.enemyAttackInfo.name : 'HIT!';
                    spawnParticles(W / 2, H * 0.8, 6, '#ff0000');
                    SFX.playerHit();

                    // Blood overlay
                    bloodOverlay = 800;
                    bloodDrips = [];
                    for (let bi = 0; bi < 3 + Math.floor(Math.random() * 4); bi++) {
                        bloodDrips.push({
                            x: Math.random() * W, y: Math.random() * H * 0.3,
                            w: 2 + Math.random() * 4, speed: 0.5 + Math.random() * 1.5,
                            alpha: 0.4 + Math.random() * 0.6
                        });
                    }

                    // Damage number for enemy hit
                    spawnDmgNum(W/2 + (Math.random()-0.5)*80, H*0.6, '-' + Math.floor(dmg), '#ff2222', dmg > 15);

                    // Camera shake direction
                    cameraTiltTarget = (Math.random() - 0.5) * 4;

                    // Reset combo on getting hit
                    if (comboCount > comboBest) comboBest = comboCount;
                    comboCount = 0; comboTimer = 0;
                } else {
                    let atkName = combat.enemyAttackInfo ? combat.enemyAttackInfo.name.replace('!', '') : 'HIT';
                    combat.msg = atkName + ' BLOCKED!';
                    SFX.block();
                    spawnDmgNum(W/2, H*0.5, 'BLOCKED!', '#6688ff', false);
                    spawnParticles(W/2, H*0.4, 4, '#6688ff');
                }
            }
            combat.msgTimer = 400;
            combat.enemyComboCount++;
            if (combat.enemyComboCount < ai.maxCombo && Math.random() < ai.comboChance) {
                combat.enemyWindupTimer = ai.windupTime * 0.5;
                combat.enemyWindupHand = combat.enemyWindupHand === 'left' ? 'right' : 'left';
                let atkTypes = getEnemyAttacks(en);
                combat.enemyAttackInfo = atkTypes[Math.floor(Math.random() * atkTypes.length)];
            } else {
                combat.enemyWindup = false;
                combat.enemyAttackInfo = null;
                combat.enemyNext = en.interval + Math.random() * 600;
            }
            if (player.health <= 0) {
                player.health = 0;
                if (player.score > saveData.highScore) saveData.highScore = player.score;
                writeSave();
                SFX.gameOver();
                slowMoTimer = 600;
                state = ST.GAMEOVER;
            }
        }
    }
}

// ─── Game Initialization ─────────────────────────────────────────────
function startGame() {
    player = { x: 2.5, y: 2.5, angle: 0, health: 100, maxHealth: 100, score: 0 };
    currentLevel = 0;
    defeatedEnemies = new Set();
    pickedBottles = new Set();
    combat = resetCombat();
    inventory = { bottles: 0 };
    drinkCount = 0; drunkLevel = 0; drunkNotify = ''; drunkNotifyTimer = 0; drunkBlurAmount = 0; armBob = 0;
    particles = []; notifications = [];
    playerXp = 0;
    // Reset new animation state
    damageNumbers = []; speedLines = []; impactRings = [];
    comboCount = 0; comboTimer = 0; comboDisplay = 0; comboBest = 0;
    smoothPlayerHP = 100; smoothEnemyHP = 100;
    bloodOverlay = 0; bloodDrips = [];
    cameraTilt = 0; cameraTiltTarget = 0;
    slowMoTimer = 0; slowMoFactor = 1;
    screenWarp = 0; footstepTimer = 0;
    initDust();
    loadLevel(0, 'start');
    startTransition('FLOOR 1: ' + LEVELS[0].name, () => {});
}

// ─── Main Loop ───────────────────────────────────────────────────────
let lastTime = 0;
function loop(time) {
    let dt = time - lastTime; lastTime = time;
    if (dt > 100) dt = 100;

    updateParticles(dt);
    updateNotifications(dt);

    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

    switch (state) {
        case ST.MENU:
            renderMenu(); break;
        case ST.SHOP:
            renderShop(); break;
        case ST.SETTINGS:
            renderSettings(); break;
        case ST.EXPLORE:
            updateExplore(dt);
            if (state === ST.EXPLORE) renderExplore();
            else if (state === ST.FIGHT_INTRO) renderFightIntro();
            break;
        case ST.FIGHT_INTRO:
            combat.introTimer -= dt;
            if (combat.introTimer <= 0) { state = ST.COMBAT; SFX.fightIntro(); }
            renderFightIntro(); break;
        case ST.COMBAT:
            updateCombat(dt);
            if (state === ST.COMBAT) renderCombatScene();
            else if (state === ST.KO) renderKO();
            else if (state === ST.GAMEOVER) renderGameOver();
            break;
        case ST.CUTSCENE:
            updateCutscene(dt);
            renderCutscene(); break;
        case ST.KO:
            combat.koTimer -= dt;
            renderKO();
            if (combat.koTimer <= 0) startCutscene(combat.enemy, true);
            break;
        case ST.GAMEOVER:
            renderGameOver(); break;
        case ST.WIN:
            if (!combat._winSfxPlayed) { SFX.win(); combat._winSfxPlayed = true; }
            renderWin(); break;
        case ST.LEVEL_TRANS:
            updateTransition(dt);
            renderTransition(); break;
    }

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
