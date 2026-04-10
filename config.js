// ════════════════════════════════════════
// config.js — 전략 설정값 & 상수
// ════════════════════════════════════════

const CFG = {
  // ── 매수 구조 ──
  SPLIT_DAYS: 75,
  PLANB3_DAYS: 120,
  QLD_RATIO: 0.70,
  SSO_RATIO: 0.30,

  // ── 익절 트리거 ──
  SELL_GAP: [0.25, 0.45, 0.65],
  SELL_PCT: [0.08, 0.08, 0.09],

  // ── 재투입 트리거 ──
  REBUY_DD:  [0.20, 0.35, 0.50],
  REBUY_FG:  [45,   30,   20],
  REBUY_VIX: [20,   25,   30],
  REBUY_PCT: [0.30, 0.35, 0.35],

  // ── 휩소 방지 ──
  RESUME_FG: 35,
  WS_RESUME: 2,
  WS_REBUY:  2,
  FORCE_REBUY_MONTHS: 18,
};

const WAR_GRADES = {
  RED:    { label:"🔴 RED — 시스템 리스크",     color:"red",    adjMult: 0.5,  adjNote:"매수량 50% 축소 (금융위기·패닉·시장붕괴 신호)" },
  ORANGE: { label:"🟠 ORANGE — 고위험 불확실성", color:"amber",  adjMult: 0.7,  adjNote:"매수량 30% 축소 (전쟁확대·버블붕괴·정책쇼크)" },
  YELLOW: { label:"🟡 YELLOW — 불확실성 유지",   color:"yellow", adjMult: 1.0,  adjNote:"매수량 정상 유지 (리스크 존재하나 현상 유지)" },
  GREEN:  { label:"🟢 GREEN — 리스크 완화",      color:"green",  adjMult: 1.3,  adjNote:"매수량 30% 확대 (협상타결·우려해소·긍정신호)" },
  GRAY:   { label:"⚪ GRAY — 특이사항 없음",     color:"gray",   adjMult: 1.0,  adjNote:"매수량 정상 유지" },
};

const GAS_URL = "https://script.google.com/macros/s/AKfycbzO71kzixBo23y0XHssgjtSBczblBrOwR26ZS_Oj8NQ-rM8HvC06Gi8RkpJ8IxGvaFGbA/exec";

// 유틸 함수
const f      = (n,d=1) => (n!=null&&!isNaN(n)) ? parseFloat(n).toFixed(d) : "N/A";
const fKRW   = n => n ? `₩${Math.round(n/10000).toLocaleString()}만` : "₩0";
const fgLbl  = v => v<=20?"극단공포":v<=40?"공포":v<=60?"중립":v<=80?"탐욕":"극단탐욕";
const vixLbl = v => !v?"N/A":v>=40?"극단공포":v>=30?"높은공포":v>=20?"주의":"안정";
const fgClr  = v => v<=25?"#f87171":v<=45?"#fbbf24":v<=60?"#94a3b8":"#4ade80";
const vixClr = v => v>=30?"#f87171":v>=20?"#fbbf24":"#4ade80";
const elapsed  = () => !S.entryDate ? 0 : Math.max(0, Math.floor((new Date()-new Date(S.entryDate))/86400000));
const splitDays = () => S.splitDays || 75;
const setText  = (id,text,color) => { const el=document.getElementById(id); if(!el)return; el.textContent=text; if(color)el.style.color=color; };

const GRADE_COLOR = { RED:"#f87171", ORANGE:"#fb923c", YELLOW:"#fbbf24", GREEN:"#4ade80", GRAY:"#4a5a78" };
