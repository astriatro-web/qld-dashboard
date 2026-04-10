// strategy.js — 설정 관리 & 모드 판단
let S = {};
function loadSettings() {
  try { S = JSON.parse(localStorage.getItem("qld_s10")||"{}"); } catch { S={}; }
  S.entryDate     = S.entryDate     || "2026-03-01";
  S.totalBullet   = S.totalBullet   || 100000000;
  S.monthlyBudget = S.monthlyBudget || 10000000;
  S.profitCash    = S.profitCash    || 0;
  S.fg            = S.fg            || null;
  S.gcCount       = S.gcCount       || 0;
  S.rebuyCount    = S.rebuyCount    || 0;
  S.planb3Active  = S.planb3Active  || false;
  S.splitDays     = S.splitDays     || 75;
  S.qldHeld       = S.qldHeld       != null ? S.qldHeld : 0;
  S.ssoHeld       = S.ssoHeld       != null ? S.ssoHeld : 0;
  S.spymHeld      = S.spymHeld      != null ? S.spymHeld : 0;
  S.qldAvg        = S.qldAvg        || null;
  S.ssoAvg        = S.ssoAvg        || null;
  S.spymAvg       = S.spymAvg       || null;
  document.getElementById("s-entryDate").value     = S.entryDate;
  document.getElementById("s-totalBullet").value   = S.totalBullet;
  document.getElementById("s-monthlyBudget").value = S.monthlyBudget;
  document.getElementById("s-profitCash").value    = S.profitCash;
  document.getElementById("s-fg").value            = S.fg || "";
  document.getElementById("s-gcCount").value       = S.gcCount;
  document.getElementById("s-rebuyCount").value    = S.rebuyCount;
  const _sd = document.getElementById("s-splitDays"); if(_sd) _sd.value = S.splitDays;
  const _qh = document.getElementById("s-qldHeld"); if(_qh) _qh.value = S.qldHeld;
  const _sh = document.getElementById("s-ssoHeld"); if(_sh) _sh.value = S.ssoHeld;
  const _qa = document.getElementById("s-qldAvg"); if(_qa) _qa.value = S.qldAvg || "";
  const _sa = document.getElementById("s-ssoAvg"); if(_sa) _sa.value = S.ssoAvg || "";
  const _spa = document.getElementById("s-spymAvg"); if(_spa) _spa.value = S.spymAvg || "";
  const _sph = document.getElementById("s-spymHeld"); if(_sph) _sph.value = S.spymHeld || 0;
  updatePlanb3Btn();
}
function saveSettings() {
  S.entryDate     = document.getElementById("s-entryDate").value.trim();
  S.totalBullet   = parseFloat(document.getElementById("s-totalBullet").value)||149100000;
  S.monthlyBudget = parseFloat(document.getElementById("s-monthlyBudget").value)||10000000;
  S.profitCash    = parseFloat(document.getElementById("s-profitCash").value)||0;
  const fgInput   = document.getElementById("s-fg").value;
  S.fg            = fgInput !== "" ? parseInt(fgInput) : null;
  S.gcCount       = parseInt(document.getElementById("s-gcCount").value)||0;
  S.rebuyCount    = parseInt(document.getElementById("s-rebuyCount").value)||0;
  const _sd = document.getElementById("s-splitDays"); S.splitDays = _sd ? parseInt(_sd.value)||75 : (S.splitDays||75);
  const _qh = document.getElementById("s-qldHeld"); S.qldHeld = _qh ? parseInt(_qh.value)||0 : (S.qldHeld||0);
  const _sh = document.getElementById("s-ssoHeld"); S.ssoHeld = _sh ? parseInt(_sh.value)||7  : (S.ssoHeld||7);
  const _qa2 = document.getElementById("s-qldAvg"); S.qldAvg = _qa2 && _qa2.value ? parseFloat(_qa2.value) : null;
  const _sa2 = document.getElementById("s-ssoAvg"); S.ssoAvg = _sa2 && _sa2.value ? parseFloat(_sa2.value) : null;
  const _spa2 = document.getElementById("s-spymAvg"); S.spymAvg = _spa2 && _spa2.value ? parseFloat(_spa2.value) : null;
  const _sph2 = document.getElementById("s-spymHeld"); S.spymHeld = _sph2 ? parseInt(_sph2.value)||0 : (S.spymHeld||0);
  localStorage.setItem("qld_s10", JSON.stringify(S));
  renderStatic(null);
}
function togglePlanb3() { S.planb3Active=!S.planb3Active; localStorage.setItem("qld_s10",JSON.stringify(S)); updatePlanb3Btn(); }
function updatePlanb3Btn() {
  const btn=document.getElementById("btnPlanb3");
  btn.className=S.planb3Active?"btn-toggle on":"btn-toggle off";
  btn.textContent=S.planb3Active?"🔴 B-3 활성 (탭하여 해제)":"⚪ B-3 비활성";
}
function switchTab(id) {
  document.querySelectorAll(".tab").forEach((t,i)=>t.classList.toggle("active",["dashboard","rules","war","settings"][i]===id));
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
  document.getElementById("panel-"+id).classList.add("active");
  if (id === "war") loadComments();
}

const f=(n,d=1)=>(n!=null&&!isNaN(n))?parseFloat(n).toFixed(d):"N/A";
const fKRW=n=>n?`₩${Math.round(n/10000).toLocaleString()}만`:"₩0";
const fgLbl=v=>v<=20?"극단공포":v<=40?"공포":v<=60?"중립":v<=80?"탐욕":"극단탐욕";
const vixLbl=v=>!v?"N/A":v>=40?"극단공포":v>=30?"높은공포":v>=20?"주의":"안정";
const fgClr=v=>v<=25?"#f87171":v<=45?"#fbbf24":v<=60?"#94a3b8":"#4ade80";
const vixClr=v=>v>=30?"#f87171":v>=20?"#fbbf24":"#4ade80";
const elapsed=()=>!S.entryDate?0:Math.max(0,Math.floor((new Date()-new Date(S.entryDate))/86400000));
const splitDays=()=>S.splitDays||75;
function setText(id,text,color){const el=document.getElementById(id);if(!el)return;el.textContent=text;if(color)el.style.color=color;}

// 보유 평가액
function renderHoldings(qldPrice, ssoPrice, usdkrw, spymPrice) {
  const container = document.getElementById("holdingRows");
  const qh = S.qldHeld || 0;
  const sh = S.ssoHeld || 0;
  const sph = S.spymHeld || 0;
  if (!qh && !sh && !sph) { container.innerHTML='<div style="font-size:12px;color:var(--text3);">설정탭에서 보유 주수를 입력하세요</div>'; return; }
  if (!qldPrice || !ssoPrice || !usdkrw) { container.innerHTML='<div style="font-size:12px;color:var(--text3);">시세 조회 후 표시됩니다</div>'; return; }

  // 수익률 계산 헬퍼
  const pnlTxt = (price, avg) => {
    if (!avg || !price) return "";
    const pct = ((price - avg) / avg * 100);
    const c = pct >= 0 ? "#4ade80" : "#f87171";
    return `<span style="font-size:10px;color:${c};margin-left:4px;">${pct>=0?"+":""}${pct.toFixed(1)}%</span>`;
  };

  const qldUsd = qh * qldPrice;
  const ssoUsd = sh * ssoPrice;
  const spymUsd = sph * (spymPrice || 0);
  const totalUsd = qldUsd + ssoUsd + spymUsd;
  const fw = n => Math.round(n/10000).toLocaleString();

  let rows = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:10px;font-weight:600;color:var(--text3);letter-spacing:0.06em;margin-bottom:6px;">
      <div></div><div style="text-align:right;">USD</div><div style="text-align:right;">원화</div>
    </div>`;

  if (qh > 0) rows += `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:13px;padding:6px 0;border-bottom:1px solid var(--border);">
      <div style="color:var(--text2);">QLD <span style="color:var(--text3);font-size:11px;">${qh}주</span>${pnlTxt(qldPrice, S.qldAvg)}</div>
      <div style="color:var(--text1);text-align:right;font-weight:600;">$${Math.round(qldUsd).toLocaleString()}</div>
      <div style="color:var(--text1);text-align:right;font-weight:600;">${fw(Math.round(qldUsd*usdkrw))}만</div>
    </div>`;

  if (sh > 0) rows += `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:13px;padding:6px 0;border-bottom:1px solid var(--border);">
      <div style="color:var(--text2);">SSO <span style="color:var(--text3);font-size:11px;">${sh}주</span>${pnlTxt(ssoPrice, S.ssoAvg)}</div>
      <div style="color:var(--text1);text-align:right;font-weight:600;">$${Math.round(ssoUsd).toLocaleString()}</div>
      <div style="color:var(--text1);text-align:right;font-weight:600;">${fw(Math.round(ssoUsd*usdkrw))}만</div>
    </div>`;

  if (sph > 0 && spymPrice) rows += `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:13px;padding:6px 0;border-bottom:1px solid var(--border);">
      <div style="color:var(--text2);">SPYM <span style="color:var(--text3);font-size:11px;">${sph}주</span>${pnlTxt(spymPrice, S.spymAvg)}</div>
      <div style="color:var(--text1);text-align:right;font-weight:600;">$${Math.round(spymUsd).toLocaleString()}</div>
      <div style="color:var(--text1);text-align:right;font-weight:600;">${fw(Math.round(spymUsd*usdkrw))}만</div>
    </div>`;

  rows += `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:14px;font-weight:800;padding:8px 0;">
      <div style="color:var(--blue);">합계</div>
      <div style="color:var(--blue);text-align:right;">$${Math.round(totalUsd).toLocaleString()}</div>
      <div style="color:var(--blue);text-align:right;">${fw(Math.round(totalUsd*usdkrw))}만</div>
    </div>`;

  container.innerHTML = rows;
}

// LOC 계산기 (기본)
function renderLOC(qldPrice, ssoPrice, usdkrw, mult) {
  const container = document.getElementById("loc-body");
  if (!qldPrice || !ssoPrice || !usdkrw) { container.innerHTML='<div class="loc-na">시세 조회 후 표시됩니다</div>'; return; }
  const m = mult || 1.0;
  const el2=elapsed(), isB2=el2>=splitDays()&&el2<CFG.PLANB3_DAYS;
  const dailyBase = isB2 ? Math.round(S.monthlyBudget/30) : Math.round((S.totalBullet+S.monthlyBudget*12)/Math.max(1,splitDays()-el2));
  const daily = Math.round(dailyBase * m);
  const qldTotal=Math.floor(daily*0.7/(qldPrice*usdkrw)), ssoTotal=Math.floor(daily*0.3/(ssoPrice*usdkrw));
  const qldA=Math.round(qldTotal*0.6), qldB=qldTotal-qldA;
  const ssoA=Math.round(ssoTotal*0.6), ssoB=ssoTotal-ssoA;
  const f2=n=>n.toFixed(2);
  container.innerHTML=`
    <div class="loc-ticker">QLD <span style="color:#475569;font-weight:400;">종가 $${f2(qldPrice)} → 오늘 매수 ${qldTotal}주</span></div>
    <div class="loc-row type-a"><div class="loc-row-label"><span class="tag a">A</span>확실체결 LOC</div><div class="loc-row-right"><div class="loc-price a">$${f2(qldPrice*1.025)}</div><div class="loc-shares">${qldA}주 &nbsp;·&nbsp; ×1.025</div></div></div>
    <div class="loc-row type-b"><div class="loc-row-label"><span class="tag b">B</span>유리한가격 LOC</div><div class="loc-row-right"><div class="loc-price b">$${f2(qldPrice*0.990)}</div><div class="loc-shares">${qldB}주 &nbsp;·&nbsp; ×0.990</div></div></div>
    <hr class="loc-divider">
    <div class="loc-ticker">SSO <span style="color:#475569;font-weight:400;">종가 $${f2(ssoPrice)} → 오늘 매수 ${ssoTotal}주</span></div>
    <div class="loc-row type-a"><div class="loc-row-label"><span class="tag a">A</span>확실체결 LOC</div><div class="loc-row-right"><div class="loc-price a">$${f2(ssoPrice*1.025)}</div><div class="loc-shares">${ssoA}주 &nbsp;·&nbsp; ×1.025</div></div></div>
    <div class="loc-row type-b"><div class="loc-row-label"><span class="tag b">B</span>유리한가격 LOC</div><div class="loc-row-right"><div class="loc-price b">$${f2(ssoPrice*0.990)}</div><div class="loc-shares">${ssoB}주 &nbsp;·&nbsp; ×0.990</div></div></div>
    <div class="loc-base">A:B = 6:4 &nbsp;|&nbsp; A ×1.025 거의 무조건 체결 &nbsp;|&nbsp; B ×0.990 눌릴 때 유리</div>`;
}

// ── SPYM LOC 계산기 (대기모드 전용) ──
function renderSPYMLOC(spymPrice, usdkrw, containerId) {
  const cid = containerId || "loc-body";
  const container = document.getElementById(cid);
  if (!container) return;
  if (!spymPrice || !usdkrw) {
    container.innerHTML = '<div class="loc-na">SPYM 시세 없음 — 스프레드시트 B9에 =GOOGLEFINANCE("SPYM") 입력 필요</div>';
    return;
  }
  // 일일 SPYM 매수금 = 월투자금 × 12 × 0.3 ÷ 252 (연간영업일)
  const dailySpym = Math.round(S.monthlyBudget * 12 * 0.3 / 252);
  const spymTotal = Math.floor(dailySpym / (spymPrice * usdkrw));
  const spymA = Math.round(spymTotal * 0.6);
  const spymB = spymTotal - spymA;
  const f2 = n => n.toFixed(2);
  const locCard = document.querySelector(".loc-card");
  if(locCard) locCard.style.borderColor = "rgba(99,102,241,0.4)";
  container.innerHTML = `
    <div style="font-size:10px;color:#818cf8;letter-spacing:0.08em;font-weight:700;margin-bottom:8px;">
      📋 SPYM LOC 가이드 (대기모드 · 매일 적립)
    </div>
    <div style="font-size:10px;color:var(--text3);margin-bottom:8px;line-height:1.6;">
      일일 SPYM 매수금: <b style="color:var(--text2);">약 ${Math.round(dailySpym/10000)}만원</b>
      <span style="color:var(--text3);"> = 월투자금×12×30% ÷ 252일</span><br>
      <span style="color:#818cf8;font-size:9px;">※ SPYM은 거시 리스크 등급에 관계없이 매수량 고정</span>
    </div>
    <div class="loc-ticker">SPYM <span style="color:var(--text3);font-weight:400;">종가 $${f2(spymPrice)} → 오늘 매수 ${spymTotal}주</span></div>
    <div class="loc-row type-a">
      <div class="loc-row-label"><span class="tag a">A</span>확실체결 LOC</div>
      <div class="loc-row-right"><div class="loc-price a">$${f2(spymPrice*1.025)}</div><div class="loc-shares">${spymA}주 &nbsp;·&nbsp; ×1.025</div></div>
    </div>
    <div class="loc-row type-b">
      <div class="loc-row-label"><span class="tag b">B</span>유리한가격 LOC</div>
      <div class="loc-row-right"><div class="loc-price b">$${f2(spymPrice*0.990)}</div><div class="loc-shares">${spymB}주 &nbsp;·&nbsp; ×0.990</div></div>
    </div>
    <div class="loc-base">A:B = 6:4 &nbsp;|&nbsp; SGOV 70% 별도 적립 병행</div>`;
}

const GAS_URL = "https://script.google.com/macros/s/AKfycbzO71kzixBo23y0XHssgjtSBczblBrOwR26ZS_Oj8NQ-rM8HvC06Gi8RkpJ8IxGvaFGbA/exec";
let MD = null;

async function fetchAll() {
  const btn=document.getElementById("btnRefresh"), icon=document.getElementById("btnIcon");
  btn.disabled=true; icon.innerHTML='<span class="spinner"></span>';
  document.getElementById("errBox").style.display="none";
  try {
    const res=await fetch(GAS_URL,{method:"GET",mode:"cors",redirect:"follow"});
    if(!res.ok) throw new Error("서버 응답 오류: "+res.status);
    const d=await res.json();
    if(!d.qld||d.qld===0) throw new Error("QLD 데이터 없음 — 스프레드시트 B1 수식을 확인해주세요");
    MD={qld:d.qld,qldHigh:d.high52||d.qld,sso:d.sso,spy:d.spy,sgov:d.sgov,vix:d.vix,usdkrw:d.usdkrw||1350,fg:d.fg||S.fg||null,ma20:d.ma20,ma60:d.ma60,ma120:d.ma120,ma200spy:d.ma200spy,spym:d.spym||null};
    renderDashboard(MD);
    document.getElementById("lastUpdated").textContent=new Date().toLocaleTimeString("ko-KR")+" 업데이트";
  autoCountStreak(MD);
  } catch(e) {
    console.error(e);
    const eb=document.getElementById("errBox"); eb.style.display="block"; eb.textContent="조회 실패: "+e.message+"\n\n구글 스프레드시트 웹앱 URL을 확인해주세요.";
  }
  btn.disabled=false; icon.textContent="↻";
}

// ── 연속일 자동 카운팅 ──
function autoCountStreak(d) {
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let streak;
  try { streak = JSON.parse(localStorage.getItem("qld_streak") || "{}"); } catch { streak = {}; }

  // 오늘 이미 카운팅했으면 스킵
  if (streak.date === todayStr) return;

  const gc = d.ma20 && d.ma60 ? d.ma20 > d.ma60 : false;

  // 골든크로스 연속일
  const prevGC = streak.gcCount || 0;
  const newGC = gc ? Math.min(prevGC + 1, 5) : 0;

  // 재투입 조건 연속일 (DD + F&G + VIX 3중 AND)
  const ddBase = (S.qldAvg && S.qldAvg > 0) ? S.qldAvg : d.qldHigh;
  const dd = ddBase ? Math.max(0, (ddBase - d.qld) / ddBase) : 0;
  const fg = d.fg;
  const vix = d.vix;

  // 재투입 조건 중 하나라도 충족되는지 체크 (가장 낮은 단계부터)
  let rebuyMet = false;
  for (let i = 0; i < CFG.REBUY_DD.length; i++) {
    if (dd >= CFG.REBUY_DD[i] && fg != null && fg <= CFG.REBUY_FG[i] && vix != null && vix >= CFG.REBUY_VIX[i]) {
      rebuyMet = true;
      break;
    }
  }
  const prevRebuy = streak.rebuyCount || 0;
  const newRebuy = rebuyMet ? Math.min(prevRebuy + 1, 5) : 0;

  // 저장
  streak = { date: todayStr, gcCount: newGC, rebuyCount: newRebuy };
  localStorage.setItem("qld_streak", JSON.stringify(streak));

  // S에 반영 (설정탭 수동값보다 자동값 우선)
  S.gcCount = newGC;
  S.rebuyCount = newRebuy;

  // UI 업데이트
  const gcEl = document.getElementById("s-gcCount");
  if (gcEl) gcEl.value = newGC;
  const rbEl = document.getElementById("s-rebuyCount");
  if (rbEl) rbEl.value = newRebuy;

  // 상태 메시지
  console.log(`[연속일 자동갱신] 골든크로스: ${newGC}일, 재투입: ${newRebuy}일 (${todayStr})`);
}

function determineMode(d){
  const belowMA=d.ma120?d.qld<d.ma120:null;
  const gap=d.ma120?(d.qld-d.ma120)/d.ma120:null;
  const gc=d.ma20&&d.ma60?d.ma20>d.ma60:null;
  // DD: 평단 입력 시 평단 기준, 없으면 52주 고가 기준
  const ddBase = (S.qldAvg && S.qldAvg > 0) ? S.qldAvg : d.qldHigh;
  const ddBaseLabel = (S.qldAvg && S.qldAvg > 0) ? "평단" : "52주고가";
  const dd = ddBase ? Math.max(0, (ddBase - d.qld) / ddBase) : 0;
  const el=elapsed(); const rem=Math.max(0,splitDays()-el);
  const dw=rem>0?Math.round((S.totalBullet+S.monthlyBudget*12)/rem/10000):0;
  const mw=Math.round(S.monthlyBudget/10000);
  const PC={buy:{bg:"#052e16",bd:"#16a34a",tx:"#4ade80"},planb2:{bg:"#431407",bd:"#ea580c",tx:"#fb923c"},planb3:{bg:"#450a0a",bd:"#dc2626",tx:"#f87171"},resume:{bg:"#052e16",bd:"#16a34a",tx:"#4ade80"},hold:{bg:"#0f172a",bd:"#475569",tx:"#94a3b8"},sell1:{bg:"#422006",bd:"#d97706",tx:"#fbbf24"},sell2:{bg:"#422006",bd:"#d97706",tx:"#fbbf24"},sell3:{bg:"#422006",bd:"#d97706",tx:"#fbbf24"},loading:{bg:"#0f172a",bd:"#475569",tx:"#94a3b8"}};

  // ── 익절 트리거: 평단가 입력 시 평단 기준, 없으면 52주 고가 대비 이격률 ──
  // QLD 기준으로 판단 (주력 포지션)
  let sellGap = null;
  let sellBasis = "";
  if (S.qldAvg && S.qldAvg > 0 && d.qld) {
    // 평단 대비 수익률
    sellGap = (d.qld - S.qldAvg) / S.qldAvg;
    const ssoGap = (S.ssoAvg && S.ssoAvg > 0 && d.sso) ? (d.sso - S.ssoAvg) / S.ssoAvg : null;
    const ssoTxt = ssoGap != null ? `  SSO ${ssoGap>=0?"+":""}${(ssoGap*100).toFixed(1)}%` : "";
    sellBasis = `평단 대비 QLD ${sellGap>=0?"+":""}${(sellGap*100).toFixed(1)}%${ssoTxt}`;
  } else {
    // 평단 미입력 → 익절 트리거 비활성화, 경고만 표시
    sellGap = null;
    sellBasis = "⚠ 평단가 미입력 — 설정탭에서 QLD/SSO 평단가를 입력하세요";
  }

  let name,phase,actions=[];
  if(S.planb3Active||el>=CFG.PLANB3_DAYS){
    const canResume=gc&&S.gcCount>=CFG.WS_RESUME&&d.fg>=CFG.RESUME_FG;
    if(canResume){
      name="B-3 해제 — 재개";phase="resume";
      const spyAbove200resume = d.spy && d.ma200spy ? d.spy > d.ma200spy : false;
      const spymResumeTxt = spyAbove200resume
        ? "월 적립: SGOV 70% + SPYM 30% 재개 (SPY 200일선 위 ✓)"
        : "월 적립: SGOV 100% (SPY 200일선 아래 — SPYM 아직 매수 불가)";
      actions=[
        `골든크로스 ${S.gcCount}일 연속 ✓  F&G ${d.fg} ≥ 35 ✓`,
        "QLD:SSO 5:5 → 7:3 원복",
        spymResumeTxt,
        "설정: B-3 플래그 OFF / 진입일 리셋"
      ];
    }
    else{name="B-3 생존모드";phase="planb3";const miss=[];if(!gc)miss.push("골든크로스 미발생");else if(S.gcCount<CFG.WS_RESUME)miss.push(`골든크로스 ${S.gcCount}일 (2일 필요)`);if(d.fg!=null&&d.fg<CFG.RESUME_FG)miss.push(`F&G ${d.fg} < 35`);actions=["매수 완전 동결","QLD:SSO = 5:5 유지","월 적립 → SGOV 100%",...miss.map(m=>"미충족: "+m)];}
  }else if(belowMA===false){
    if(sellGap!=null&&sellGap>=CFG.SELL_GAP[2]){
      name="익절 3단계";phase="sell3";
      actions=[`${sellBasis}  →  포지션 9% 매도 (QLD 우선)`,
        "익절현금 → SGOV 별도 보관",
        "누적 익절: 최대 25%까지 / 나머지 75% 절대 유지"];
    }
    else if(sellGap!=null&&sellGap>=CFG.SELL_GAP[1]){
      name="익절 2단계";phase="sell2";
      actions=[`${sellBasis}  →  포지션 8% 매도 (QLD 우선)`,
        "익절현금 → SGOV 별도 보관",
        `다음 트리거: +${CFG.SELL_GAP[2]*100}% (3단계 9% 매도)`];
    }
    else if(sellGap!=null&&sellGap>=CFG.SELL_GAP[0]){
      name="익절 1단계";phase="sell1";
      actions=[`${sellBasis}  →  포지션 8% 매도 (QLD 우선)`,
        "익절현금 → SGOV 별도 보관",
        `다음 트리거: +${CFG.SELL_GAP[1]*100}% (2단계 8% 매도)`];
    }
    else{
      name="홀드";phase="hold";
      // SPY 200일선 체크 → SPYM 조건 판단
      const spyAbove200 = d.spy && d.ma200spy ? d.spy > d.ma200spy : false;
      const standbyDesc = spyAbove200
        ? `월 적립: SGOV ${Math.round(S.monthlyBudget*0.7/10000)}만 + SPYM ${Math.round(S.monthlyBudget*0.3/10000)}만 (SPY 200일선 위 ✓)`
        : `월 적립: SGOV 100% ${Math.round(S.monthlyBudget/10000)}만 (SPY 200일선 아래 — SPYM 매수 중단)`;
      const sellTriggerTxt = S.qldAvg && S.qldAvg > 0
        ? `${sellBasis}  →  홀드 (익절 트리거: 평단 +25%/+45%/+65%)`
        : `⚠ 평단가 미입력 — 익절 자동판단 불가. 설정탭에서 입력하세요`;
      actions=[
        sellTriggerTxt,
        standbyDesc,
        `매수 재개 조건: QLD < MA120($${d.ma120 ? f(d.ma120,1) : "—"}) 하회 시 자동 전환`
      ];
    }
    if(S.profitCash>0&&S.rebuyCount>=CFG.WS_REBUY){for(let i=CFG.REBUY_DD.length-1;i>=0;i--){if(dd>=CFG.REBUY_DD[i]&&d.fg<=CFG.REBUY_FG[i]&&d.vix>=CFG.REBUY_VIX[i]){actions.push(`재투입 ${i+1}차: 익절현금풀 ${CFG.REBUY_PCT[i]*100}% → QLD 매수`);break;}}}
  }else if(belowMA===true){
    if(el>=splitDays()&&el<CFG.PLANB3_DAYS){
      const mwDaily=Math.round(S.monthlyBudget/30/10000);
      name="B-2 매수연장";phase="planb2";
      const daysToB3 = CFG.PLANB3_DAYS - el;
      const ma120b2txt = d.ma120 ? `MA120 $${f(d.ma120,1)} 하회 중 ✓` : "MA120 계산 중";
      actions=[
        `월 ${mw}만원 투입 (QLD 70% + SSO 30%)`,
        `일일 투입: 약 ${mwDaily}만원  /  B-3 전환까지 ${daysToB3}일`,
        ma120b2txt,
        daysToB3 <= 7 ? `⚠ B-3 전환 ${daysToB3}일 전 — 생존모드 준비` : ""
      ].filter(Boolean);
    }
    else{
      name="매수 진행 중";phase="buy";
      const ma120txt = d.ma120 ? `MA120 $${f(d.ma120,1)} 하회 중 ✓` : "MA120 계산 중";
      actions=[
        `QLD 70% + SSO 30%  /  ${el+1}일차 / ${splitDays()}일`,
        `일일 투입: 약 ${Math.round((S.totalBullet+S.monthlyBudget*12)/Math.max(1,splitDays()-el)/10000)}만원  /  잔여 ${rem}일`,
        ma120txt
      ];
    }
  }else{name="데이터 조회 중";phase="loading";actions=["새로고침을 눌러주세요"];}
  return{name,phase,actions,pc:PC[phase]||PC.loading,gap,sellGap,dd,elapsed:el,remain:rem};
}
