// ════════════════════════════════════════
// 수익률 시뮬레이터
// ════════════════════════════════════════
function showSimulator() {
  const modal = document.getElementById("simModal");
  // 현재 데이터 자동입력
  if (MD) {
    const qldEl = document.getElementById("sim-qld");
    const avgEl = document.getElementById("sim-avg");
    const heldEl = document.getElementById("sim-held");
    const fxEl = document.getElementById("sim-fx");
    if (qldEl && MD.qld) qldEl.value = MD.qld.toFixed(2);
    if (avgEl && S.qldAvg) avgEl.value = S.qldAvg;
    if (heldEl && S.qldHeld) heldEl.value = S.qldHeld;
    if (fxEl && MD.usdkrw) fxEl.value = Math.round(MD.usdkrw);
  }
  document.getElementById("simResult").innerHTML = "";
  modal.style.display = "block";
}

function runSimulator() {
  const qld  = parseFloat(document.getElementById("sim-qld").value);
  const avg  = parseFloat(document.getElementById("sim-avg").value);
  const held = parseFloat(document.getElementById("sim-held").value) || 0;
  const fx   = parseFloat(document.getElementById("sim-fx").value) || 1400;

  if (!qld || !avg) {
    document.getElementById("simResult").innerHTML =
      '<div style="color:#f87171;font-size:12px;text-align:center;padding:12px;">QLD 현재가와 평단가를 입력해주세요</div>';
    return;
  }

  const curPnl = (qld - avg) / avg * 100;
  const curKrw = Math.round(held * qld * fx);
  const costKrw = Math.round(held * avg * fx);

  // 시나리오 정의
  const scenarios = [
    { label:"익절 1단계", tag:"+25%", mult: 1.25, color:"#fbbf24", desc:"보수적 목표 — 포지션 8% 실현" },
    { label:"익절 2단계", tag:"+45%", mult: 1.45, color:"#fb923c", desc:"중간 목표 — 추가 8% 실현" },
    { label:"익절 3단계", tag:"+65%", mult: 1.65, color:"#4ade80", desc:"공격적 목표 — 추가 9% 실현" },
    { label:"2배 달성",   tag:"+100%", mult: 2.00, color:"#60a5fa", desc:"매수가 대비 2배 — 장기 목표" },
    { label:"3배 달성",   tag:"+200%", mult: 3.00, color:"#a78bfa", desc:"10년 복리 기준 현실적 목표" },
  ];

  let html = `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:12px;">
      <div style="font-size:10px;font-weight:700;color:var(--text3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;">현재 상태</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
        <div><span style="color:var(--text3);">평단</span> <b style="color:var(--text1);">$${avg.toFixed(2)}</b></div>
        <div><span style="color:var(--text3);">현재가</span> <b style="color:var(--text1);">$${qld.toFixed(2)}</b></div>
        <div><span style="color:var(--text3);">현재 수익률</span> <b style="color:${curPnl>=0?"#4ade80":"#f87171"};">${curPnl>=0?"+":""}${curPnl.toFixed(1)}%</b></div>
        <div><span style="color:var(--text3);">평가금액</span> <b style="color:var(--text1);">${Math.round(curKrw/10000).toLocaleString()}만</b></div>
      </div>
    </div>
    <div style="font-size:10px;font-weight:700;color:var(--text3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;padding:0 2px;">시나리오별 예상 수익</div>`;

  scenarios.forEach(sc => {
    const targetPrice = avg * sc.mult;
    const gainPct = (targetPrice - qld) / qld * 100; // 현재가 대비 추가 상승 필요
    const targetKrw = Math.round(held * targetPrice * fx);
    const profitKrw = targetKrw - costKrw;
    const alreadyDone = qld >= targetPrice;

    html += `
      <div style="background:var(--bg2);border:1px solid ${alreadyDone ? sc.color+"44" : "var(--border)"};border-radius:12px;padding:14px;margin-bottom:8px;${alreadyDone?"opacity:0.6":""}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div>
            <span style="font-size:12px;font-weight:700;color:${sc.color};">${sc.label}</span>
            <span style="font-size:10px;color:var(--text3);margin-left:6px;">${sc.desc}</span>
          </div>
          <span style="font-size:11px;font-weight:700;background:${sc.color}22;color:${sc.color};padding:3px 8px;border-radius:6px;">${sc.tag}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:12px;">
          <div>
            <div style="font-size:9px;color:var(--text3);margin-bottom:2px;">목표가</div>
            <div style="font-weight:700;color:var(--text1);">$${targetPrice.toFixed(2)}</div>
          </div>
          <div>
            <div style="font-size:9px;color:var(--text3);margin-bottom:2px;">${alreadyDone ? "✅ 달성" : "추가 상승 필요"}</div>
            <div style="font-weight:700;color:${alreadyDone?"#4ade80":sc.color};">${alreadyDone ? "완료" : "+" + gainPct.toFixed(1)+"%"}</div>
          </div>
          <div>
            <div style="font-size:9px;color:var(--text3);margin-bottom:2px;">예상 수익</div>
            <div style="font-weight:700;color:${profitKrw>=0?"#4ade80":"#f87171"};">${Math.round(profitKrw/10000).toLocaleString()}만</div>
          </div>
        </div>
      </div>`;
  });

  // 손익분기 계산
  html += `
    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:14px;margin-bottom:12px;">
      <div style="font-size:11px;font-weight:700;color:#f87171;margin-bottom:8px;">⚠ 리스크 시나리오</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
        <div>
          <div style="font-size:9px;color:var(--text3);margin-bottom:2px;">-30% 하락 시</div>
          <div style="font-weight:700;color:#f87171;">${Math.round(held * qld * 0.7 * fx / 10000).toLocaleString()}만</div>
        </div>
        <div>
          <div style="font-size:9px;color:var(--text3);margin-bottom:2px;">-50% 하락 시</div>
          <div style="font-weight:700;color:#f87171;">${Math.round(held * qld * 0.5 * fx / 10000).toLocaleString()}만</div>
        </div>
        <div>
          <div style="font-size:9px;color:var(--text3);margin-bottom:2px;">손익분기 (평단회복)</div>
          <div style="font-weight:700;color:${qld>=avg?"#4ade80":"#fbbf24"};">${qld>=avg ? "✅ 수익구간" : "$"+avg.toFixed(2)+" (현재 -"+((avg-qld)/avg*100).toFixed(1)+"%)"}</div>
        </div>
        <div>
          <div style="font-size:9px;color:var(--text3);margin-bottom:2px;">-70% MDD 시 (최악)</div>
          <div style="font-weight:700;color:#f87171;">${Math.round(held * qld * 0.3 * fx / 10000).toLocaleString()}만</div>
        </div>
      </div>
    </div>`;

  document.getElementById("simResult").innerHTML = html;
}
