// ════════════════════════════════════════
// 댓글 기능
// ════════════════════════════════════════
const GRADE_COLOR = { RED:"#f87171", ORANGE:"#fb923c", YELLOW:"#fbbf24", GREEN:"#4ade80", GRAY:"#4a5a78" };

async function loadComments() {
  const list = document.getElementById("cmtList");
  if (!list) return;
  list.innerHTML = '<div style="font-size:12px;color:var(--text3);text-align:center;padding:16px 0;">불러오는 중...</div>';
  try {
    const res = await fetch(GAS_URL + "?action=read_comments", {
      method: "GET",
      mode: "cors",
      redirect: "follow"
    });
    const data = await res.json();
    if (!data.ok || !data.comments || data.comments.length === 0) {
      list.innerHTML = '<div style="font-size:12px;color:var(--text3);text-align:center;padding:16px 0;">아직 댓글이 없어요. 첫 코멘트를 남겨보세요!</div>';
      return;
    }
    list.innerHTML = data.comments.map(c => {
      const gradeTag = c.grade
        ? `<span style="font-size:9px;font-weight:700;color:${GRADE_COLOR[c.grade]||'#4a5a78'};margin-left:6px;">${c.grade}</span>`
        : "";
      return `<div style="padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="font-size:12px;font-weight:700;color:var(--text1);">${c.nick||'익명'}</span>
          ${gradeTag}
          <span style="font-size:10px;color:var(--text3);margin-left:auto;">${c.time}</span>
        </div>
        <div style="font-size:13px;color:var(--text2);line-height:1.6;">${c.text}</div>
      </div>`;
    }).join("") + '<div style="height:4px;"></div>';
  } catch(e) {
    list.innerHTML = `<div style="font-size:12px;color:#f87171;text-align:center;padding:12px 0;">로드 실패: ${e.message}</div>`;
  }
}

async function submitComment() {
  const nick = (document.getElementById("cmtNick").value || "").trim();
  const text = (document.getElementById("cmtText").value || "").trim();
  const errEl = document.getElementById("cmtErr");
  errEl.style.display = "none";

  if (!nick) { errEl.textContent = "닉네임을 입력해주세요"; errEl.style.display = "block"; return; }
  if (!text) { errEl.textContent = "코멘트를 입력해주세요"; errEl.style.display = "block"; return; }

  // 현재 거시모니터 등급 (있으면 태그)
  const badgeEl = document.getElementById("warBadge");
  const grade = badgeEl ? (badgeEl.textContent.match(/RED|ORANGE|YELLOW|GREEN|GRAY/) || [""])[0] : "";

  try {
    const params = new URLSearchParams({ action: "write_comment", nick, text, grade });
    const res = await fetch(GAS_URL + "?" + params.toString(), {
      method: "GET",
      mode: "cors",
      redirect: "follow"
    });
    const data = await res.json();
    if (data.ok) {
      document.getElementById("cmtText").value = "";
      await loadComments();
    } else {
      errEl.textContent = "전송 실패: " + (data.error || "알 수 없는 오류");
      errEl.style.display = "block";
    }
  } catch(e) {
    errEl.textContent = "전송 실패: " + e.message;
    errEl.style.display = "block";
  }
}

// 거시모니터 탭 전환 시 댓글 자동 로드
const _origSwitchTab = switchTab;

// ── 비밀번호 체크 ──
const PW_HASH = "a7cfd7fc948e80c0045c4dbc9c1320d97caa98d6e5b76a6a6a740c18b334a30e";
async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
window.checkPW = async function() {
  const val = document.getElementById("pwInput").value;
  const hash = await sha256(val);
  const stored = localStorage.getItem("qld_pw_hash") || PW_HASH;
  if (hash === stored) {
    sessionStorage.setItem("qld_auth","1");
    document.getElementById("pwModal").style.display="none";
    document.getElementById("appWrap").style.display="block";
    fetchAll();
  } else {
    document.getElementById("pwErr").style.display="block";
    document.getElementById("pwInput").value="";
    document.getElementById("pwInput").focus();
  }
};

loadSettings(); renderStatic(null); renderRules();

(async () => {
  const session = sessionStorage.getItem("qld_auth");
  if (session === "1") {
    document.getElementById("pwModal").style.display="none";
    document.getElementById("appWrap").style.display="block";
    window.addEventListener("load", fetchAll);
  } else {
    document.getElementById("pwInput").focus();
  }
})();
document.getElementById("pwInput").addEventListener("focus",()=>{document.getElementById("pwErr").style.display="none";});
