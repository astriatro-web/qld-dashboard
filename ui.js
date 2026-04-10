// ui.js — UI 렌더링
function renderDashboard(d){
  const mode=determineMode(d); const pc=mode.pc;
  const mc=document.getElementById("modeCard"); mc.style.background=pc.bg; mc.style.borderColor=pc.bd;
  setText("modeName",mode.name,pc.tx);
  const al=document.getElementById("actionList"), ac=document.getElementById("actionCard");
  al.innerHTML=mode.actions.map(a=>`<li class="action-item" style="color:${pc.tx}">${a}</li>`).join("");
  ac.style.display="block"; ac.style.borderColor=pc.bd+"40";
  const maClr=d.ma120?(d.qld<d.ma120?"#4ade80":"#fbbf24"):"#94a3b8";
  setText("v-qld",`$${f(d.qld,2)}`,maClr); setText("v-ma120",`MA120 ${d.ma120?"$"+f(d.ma120,2):"계산 중"}`);
  const gap=d.ma120?(d.qld-d.ma120)/d.ma120:null;
  setText("v-gap",gap!=null?`${gap>=0?"+":""}${f(gap*100)}%`:"N/A",gap==null?"#94a3b8":gap<0?"#4ade80":gap>0.25?"#fbbf24":"#94a3b8");
  // DD: 평단 입력 시 평단 기준, 없으면 52주 고가 기준
  const ddBase = (S.qldAvg && S.qldAvg > 0) ? S.qldAvg : d.qldHigh;
  const ddBaseLabel = (S.qldAvg && S.qldAvg > 0) ? "평단" : "52주고가";
  const dd = ddBase ? Math.max(0, (ddBase - d.qld) / ddBase) : 0;
  setText("v-dd",`DD -${f(dd*100)}% (${ddBaseLabel}기준)`);
  setText("v-sso",`$${f(d.sso,2)}`); setText("v-spy",`SPY $${f(d.spy,2)}`);
  setText("v-sgov",`$${f(d.sgov,2)}`); setText("v-usdkrw",`${d.usdkrw?Math.round(d.usdkrw).toLocaleString():"—"}원/USD`);
  if(d.fg!=null){setText("v-fg",""+d.fg,fgClr(d.fg));setText("v-fglabel",fgLbl(d.fg));}
  else{setText("v-fg","N/A");setText("v-fglabel","조회 실패");}
  setText("v-vix",f(d.vix),vixClr(d.vix)); setText("v-vixlabel",vixLbl(d.vix));
  const gc=d.ma20&&d.ma60?d.ma20>d.ma60:null;
  const gcEl=document.getElementById("v-gc");
  gcEl.textContent=gc===true?"20 > 60  골든크로스 ✓":gc===false?"20 < 60  데드크로스 ✗":"데이터 수집 중 (20일 후 자동)";
  gcEl.style.color=gc===true?"#4ade80":gc===false?"#f87171":"#94a3b8";
  document.getElementById("v-ma2060").textContent=`${d.ma20?"$"+f(d.ma20,1):"—"} / ${d.ma60?"$"+f(d.ma60,1):"—"}`;
  renderStatic(d); renderHoldings(d.qld,d.sso,d.usdkrw,d.spym);
  // 홀드/익절 모드면 LOC 대신 대기모드 안내 표시
  const locMode = mode.phase;
  if(locMode==="hold"||locMode==="sell1"||locMode==="sell2"||locMode==="sell3"){
    const spyAbove200 = d.spy && d.ma200spy ? d.spy > d.ma200spy : false;
    if (spyAbove200 && d.spym) {
      // SPYM LOC 표시
      renderSPYMLOC(d.spym, d.usdkrw);
    } else {
      const spymTxt = spyAbove200
        ? `SGOV ${Math.round(S.monthlyBudget*0.7/10000)}만 + SPYM ${Math.round(S.monthlyBudget*0.3/10000)}만 (SPYM 시세 없음)`
        : `SGOV 100% ${Math.round(S.monthlyBudget/10000)}만 (SPY 200일선 아래 — SPYM 매수 불가)`;
      document.getElementById("loc-body").innerHTML =
        `<div style="font-size:12px;color:var(--text3);padding:8px 0;line-height:1.9;">
          📋 <b style="color:var(--text2);">대기모드</b><br>
          ${spymTxt}<br>
          <span style="font-size:10px;color:var(--text3);">120일선 하회 시 QLD+SSO 매수 재개</span>
        </div>`;
      const locCard = document.querySelector(".loc-card");
      if(locCard) locCard.style.borderColor = "var(--border)";
    }
  } else {
    renderLOC(d.qld,d.sso,d.usdkrw,1.0);
  }
  // 재투입 조건 — 120일선 위(홀드/익절)일 때만 의미 있음
  const rebuyContainer = document.getElementById("rebuyRows");
  const rebuyCard = rebuyContainer ? rebuyContainer.closest(".card") : null;
  if(mode.phase==="hold"||mode.phase==="sell1"||mode.phase==="sell2"||mode.phase==="sell3"){
    const ddBasisTxt = (S.qldAvg && S.qldAvg > 0) ? "평단기준" : "52주고가기준";
    rebuyContainer.innerHTML=
      `<div style="font-size:9px;color:#475569;margin-bottom:4px;">DD ${ddBasisTxt} · 3중 AND 조건 · ${S.rebuyCount || 0}일 연속 충족</div>` +
      CFG.REBUY_DD.map((tdd,i)=>{
        const ddOk=dd2>=tdd,fgOk=d.fg!=null&&d.fg<=CFG.REBUY_FG[i],vixOk=d.vix!=null&&d.vix>=CFG.REBUY_VIX[i];
        const allOk = ddOk&&fgOk&&vixOk;
        const dc=c=>`<div class="dot ${c}"></div>`;
        return`<div class="rebuy-row" style="${allOk?"border-left:2px solid #16a34a;padding-left:6px;":""}"><span>${i+1}차 -${tdd*100}%&nbsp;&nbsp;F&G≤${CFG.REBUY_FG[i]}&nbsp;&nbsp;VIX≥${CFG.REBUY_VIX[i]}</span><div class="dots">${dc(ddOk?"on":"off")}${dc(fgOk?"on":"off")}${dc(vixOk?"on":"off")}</div></div>`;
      }).join("");
    if(rebuyCard) rebuyCard.style.display="block";
  } else {
    if(rebuyCard) rebuyCard.style.display="none";
  }
}

function renderStatic(d){
  const el=elapsed(), rem=Math.max(0,splitDays()-el);
  const isB2=el>=splitDays()&&el<CFG.PLANB3_DAYS;
  const daily=isB2?Math.round(S.monthlyBudget/30):(rem>0?Math.round((S.totalBullet+S.monthlyBudget*12)/rem):0);
  const pct=Math.min(100,el/splitDays()*100);
  setText("v-elapsed",`${el}일차`); setText("v-remain",`잔여 ${rem}일`);
  document.getElementById("v-progress").style.width=pct+"%";
  setText("v-daily",`약 ${Math.round(daily/10000)}만원`);
  setText("v-total",`${Math.round(S.totalBullet/10000)}만원`);
  setText("v-profit",fKRW(S.profitCash));
  if(d&&d.qld&&d.sso&&d.usdkrw){
    // 홀드/익절/B-3 모드면 매수 주수 대신 대기 표시
    const curPhase = determineMode(d).phase;
    if(curPhase==="hold"||curPhase==="sell1"||curPhase==="sell2"||curPhase==="sell3"){
      setText("v-shares","대기중 — 매수 없음","#475569");
    } else if(curPhase==="planb3"){
      setText("v-shares","동결 — B-3 생존모드","#f87171");
    } else {
      const qS=Math.floor(daily*0.7/(d.qld*d.usdkrw)),sS=Math.floor(daily*0.3/(d.sso*d.usdkrw));
      setText("v-shares",`QLD ${qS}주 + SSO ${sS}주`);
    }
  }
}

function renderRules(){
  const guideBox = document.getElementById("guideBox");
  if (guideBox) guideBox.style.display = localStorage.getItem("guideHidden") === "1" ? "none" : "block";
  const rulesHtml = getRULES().map(sec=>`
    <div class="rules-section">
      <div class="rules-header" style="background:${sec.color}">${sec.title}</div>
      ${sec.items.map(([l,d])=>`<div class="rules-row" style="border-left-color:${sec.color}"><div class="rl">${l}</div><div class="rd">${d}</div></div>`).join("")}
    </div>`).join("");
  let rulesContainer = document.getElementById("rules-content");
  if (!rulesContainer) {
    rulesContainer = document.createElement("div");
    rulesContainer.id = "rules-content";
    document.getElementById("panel-rules").appendChild(rulesContainer);
  }
  rulesContainer.innerHTML = rulesHtml;
}

// ════════════════════════════════════════
// 전쟁모니터 — AI 분석 핵심 함수
// ════════════════════════════════════════
