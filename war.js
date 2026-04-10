// war.js — 거시모니터
async function runWarMonitor() {
  const btn = document.getElementById("btnWar");
  const icon = document.getElementById("warBtnIcon");
  btn.disabled = true;
  icon.innerHTML = '<span class="spinner"></span>';

  document.getElementById("warEmpty").style.display = "none";
  document.getElementById("warResult").style.display = "block";

  // 현재 전략 상태 수집
  const el = elapsed();
  const rem = Math.max(0, splitDays() - el);
  const isB2 = el >= splitDays() && el < CFG.PLANB3_DAYS;
  const dailyBase = isB2
    ? Math.round(S.monthlyBudget / 30)
    : (rem > 0 ? Math.round((S.totalBullet + S.monthlyBudget * 12) / rem) : 0);

  const qldPrice = MD ? MD.qld : null;
  const ssoPrice = MD ? MD.sso : null;
  const usdkrw   = MD ? MD.usdkrw : 1380;

  try {
    // GAS가 stockhub.kr fetch + 키워드 분석 후 결과 반환
    const res = await fetch(GAS_URL + "?action=war", {
      method: "GET",
      mode: "cors",
      redirect: "follow"
    });
    if (!res.ok) throw new Error("GAS 응답 오류: " + res.status);
    const result = await res.json();

    // judgment / checkpoints 가 없으면 등급 기반으로 자동 생성
    if (!result.judgment) {
      const judgeMap = {
        RED:    "인프라 공격 발생. 에너지 위기 심화 가능성 높음. 매수량 50% 축소 권장. 탄약 보존 최우선.",
        ORANGE: "전선 확대 및 에스컬레이션 진행 중. 불확실성 유지로 매수량 30% 축소 권장.",
        YELLOW: "데드라인 연장 / 협상 교착 패턴. 정상 매수 유지. 4차례 연장 전례상 추가 연장 가능성 높음.",
        GREEN:  "휴전/종전 합의 신호. 불확실성 해소로 기술주 반등 기대. 매수량 30% 확대 권장.",
        GRAY:   "이란 관련 주요 뉴스 없음. 정상 매수 유지."
      };
      result.judgment = judgeMap[result.grade] || judgeMap.GRAY;
    }
    if (!result.checkpoints || result.checkpoints.length === 0) {
      result.checkpoints = [
        "호르무즈 해협 선박 통행 여부",
        "WTI $120 돌파 여부 (고유가 임계점)",
        "트럼프 발언 / 데드라인 변동",
        "파키스탄·이집트 중재 결과"
      ];
    }

    renderWarResult(result, dailyBase, qldPrice, ssoPrice, usdkrw);

  } catch(e) {
    console.error(e);
    renderWarResult({
      grade: "GRAY",
      oil_price: "조회 실패",
      hormuz: "—",
      nego_status: "—",
      facts: ["GAS 분석 실패: " + e.message, "GAS 재배포 후 다시 시도해주세요"],
      judgment: "분석 실패 — 정상 매수 유지",
      checkpoints: ["GAS Apps Script 재배포 확인"]
    }, dailyBase, qldPrice, ssoPrice, usdkrw);
  }

  btn.disabled = false;
  icon.textContent = "⚡";
}

function renderWarResult(r, dailyBase, qldPrice, ssoPrice, usdkrw) {
  const grade = WAR_GRADES[r.grade] || WAR_GRADES.GRAY;
  const c = grade.color;

  // 등급 배지
  const badge = document.getElementById("warBadge");
  badge.textContent = grade.label;
  badge.className = `war-badge ${c}`;

  // 등급 설명
  document.getElementById("warGradeDesc").textContent = grade.adjNote;

  // KPI — 거시 테마
  document.getElementById("wk-main-theme").textContent = r.main_theme || r.oil_price || "—";
  document.getElementById("wk-sub-theme").textContent = r.sub_theme || r.nego_status || "—";
  document.getElementById("wk-market-signal").textContent = r.market_signal || r.hormuz || "—";

  // 팩트
  const factsEl = document.getElementById("warFacts");
  factsEl.innerHTML = (r.facts || []).map(f =>
    `<li class="war-fact"><span class="war-fact-dot">▸</span><span>${f}</span></li>`
  ).join("");

  // AI 판단
  document.getElementById("aiJudgment").textContent = r.judgment || "";

  // 매수 조율 카드
  const adjCard = document.getElementById("adjCard");
  adjCard.className = `adj-card ${c}`;
  document.getElementById("adjTitle").className = `adj-title ${c}`;
  document.getElementById("adjTitle").textContent = "📊 거시 리스크 기반 매수 조율 — " + grade.label;

  const adjMultiplier = grade.adjMult;
  const adjDaily = Math.round(dailyBase * adjMultiplier);
  const changeText = adjMultiplier === 1.0 ? "변동 없음" :
    adjMultiplier > 1.0 ? `+${Math.round((adjMultiplier-1)*100)}% 확대` :
    `-${Math.round((1-adjMultiplier)*100)}% 축소`;

  document.getElementById("adjRows").innerHTML = `
    <div class="adj-row"><span class="adj-key">기본 일일 투입금</span><span class="adj-val" style="color:#94a3b8;">약 ${Math.round(dailyBase/10000)}만원</span></div>
    <div class="adj-row"><span class="adj-key">전쟁 조율 계수</span><span class="adj-val" style="color:${adjMultiplier>=1?"#4ade80":adjMultiplier>=0.7?"#fbbf24":"#f87171"};">×${adjMultiplier.toFixed(1)} (${changeText})</span></div>
    <div class="adj-row"><span class="adj-key">조율된 오늘 투입금</span><span class="adj-val" style="color:#60a5fa;font-size:14px;">약 ${Math.round(adjDaily/10000)}만원</span></div>
    <div class="adj-row"><span class="adj-key">근거</span><span class="adj-val" style="color:#64748b;font-size:10px;text-align:right;max-width:60%;">${grade.adjNote}</span></div>`;

  // 조율된 LOC 가이드
  const warn = document.getElementById("warLocWarn");
  if (adjMultiplier !== 1.0) {
    warn.style.display = "block";
    warn.textContent = adjMultiplier < 1.0
      ? `⚠ 전쟁 상황으로 매수량 ${Math.round((1-adjMultiplier)*100)}% 축소 적용 중`
      : `✦ 휴전 합의로 매수량 ${Math.round((adjMultiplier-1)*100)}% 확대 적용 중`;
  } else {
    warn.style.display = "none";
  }

  // 조율된 LOC 렌더링 — 홀드모드면 SPYM, 매수모드면 QLD+SSO
  const warLocBody = document.getElementById("warLocBody");
  const curPhaseWar = MD ? determineMode(MD).phase : null;
  const isHoldModeWar = curPhaseWar === "hold" || curPhaseWar === "sell1" || curPhaseWar === "sell2" || curPhaseWar === "sell3";

  if (isHoldModeWar && MD && MD.spym) {
    // 대기모드 → SPYM LOC 표시 (거시 리스크 adj_mult 미적용)
    const locAdjCard = document.querySelector(".loc-adj-card");
    if(locAdjCard) locAdjCard.style.borderColor = "rgba(99,102,241,0.4)";
    document.getElementById("warLocWarn").style.display = "block";
    document.getElementById("warLocWarn").textContent = "ℹ SPYM은 거시 리스크 등급에 관계없이 매수량 고정 (레버리지 아님)";
    document.getElementById("warLocWarn").style.color = "#818cf8";
    document.getElementById("warLocWarn").style.borderColor = "rgba(99,102,241,0.3)";
    document.getElementById("warLocWarn").style.background = "rgba(99,102,241,0.08)";
    renderSPYMLOC(MD.spym, MD.usdkrw, "warLocBody");
  } else if (!qldPrice || !ssoPrice || !usdkrw) {
    warLocBody.innerHTML = '<div class="loc-na">대시보드에서 새로고침 후 재분석하세요</div>';
  } else {
    const daily = Math.round(dailyBase * adjMultiplier);
    const qldTotal = Math.floor(daily * 0.7 / (qldPrice * usdkrw));
    const ssoTotal = Math.floor(daily * 0.3 / (ssoPrice * usdkrw));
    const qldA = Math.round(qldTotal * 0.6), qldB = qldTotal - qldA;
    const ssoA = Math.round(ssoTotal * 0.6), ssoB = ssoTotal - ssoA;
    const f2 = n => n.toFixed(2);
    warLocBody.innerHTML = `
      <div class="loc-ticker">QLD <span style="color:#475569;font-weight:400;">종가 $${f2(qldPrice)} → 오늘 매수 ${qldTotal}주</span></div>
      <div class="loc-row type-a"><div class="loc-row-label"><span class="tag a">A</span>확실체결 LOC</div><div class="loc-row-right"><div class="loc-price a">$${f2(qldPrice*1.025)}</div><div class="loc-shares">${qldA}주 &nbsp;·&nbsp; ×1.025</div></div></div>
      <div class="loc-row type-b"><div class="loc-row-label"><span class="tag b">B</span>유리한가격 LOC</div><div class="loc-row-right"><div class="loc-price b">$${f2(qldPrice*0.990)}</div><div class="loc-shares">${qldB}주 &nbsp;·&nbsp; ×0.990</div></div></div>
      <hr class="loc-divider">
      <div class="loc-ticker">SSO <span style="color:#475569;font-weight:400;">종가 $${f2(ssoPrice)} → 오늘 매수 ${ssoTotal}주</span></div>
      <div class="loc-row type-a"><div class="loc-row-label"><span class="tag a">A</span>확실체결 LOC</div><div class="loc-row-right"><div class="loc-price a">$${f2(ssoPrice*1.025)}</div><div class="loc-shares">${ssoA}주 &nbsp;·&nbsp; ×1.025</div></div></div>
      <div class="loc-row type-b"><div class="loc-row-label"><span class="tag b">B</span>유리한가격 LOC</div><div class="loc-row-right"><div class="loc-price b">$${f2(ssoPrice*0.990)}</div><div class="loc-shares">${ssoB}주 &nbsp;·&nbsp; ×0.990</div></div></div>
      <div class="loc-base">A:B = 6:4 &nbsp;|&nbsp; 전쟁 조율 계수 ×${adjMultiplier.toFixed(1)} 적용됨</div>`;
  }

  // 체크포인트
  const cpEl = document.getElementById("warCheckpoints");
  cpEl.innerHTML = (r.checkpoints || []).map(cp =>
    `<li class="war-fact"><span class="war-fact-dot">→</span><span>${cp}</span></li>`
  ).join("");

  // 분할일수 조언
  const splitCard = document.getElementById("splitAdviceCard");
  const adv = r.split_days_advice;
  if (adv && adv.recommended && adv.recommended !== adv.current) {
    const cur = adv.current || S.splitDays || 75;
    const rec = adv.recommended;
    document.getElementById("splitAdviceText").textContent =
      `현재 ${cur}일 → ${rec}일로 연장 권장`;
    document.getElementById("splitAdviceReason").textContent = adv.reason || "";
    document.getElementById("splitAdviceBtn").dataset.days = rec;
    splitCard.style.display = "block";
  } else {
    splitCard.style.display = "none";
  }

  // 업데이트 시각
  document.getElementById("warUpdated").textContent =
    new Date().toLocaleTimeString("ko-KR") + " 분석 완료";
}

// 분할일수 적용 버튼
function applySplitAdvice() {
  const btn = document.getElementById("splitAdviceBtn");
  const days = parseInt(btn.dataset.days);
  if (!days) return;
  S.splitDays = days;
  localStorage.setItem("qld_s10", JSON.stringify(S));
  const el = document.getElementById("s-splitDays");
  if (el) el.value = days;
  renderStatic(MD);
  renderRules();
  btn.textContent = "적용됨 ✓";
  btn.style.background = "#166534";
  btn.disabled = true;
}
