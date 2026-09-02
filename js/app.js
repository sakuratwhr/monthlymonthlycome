const els = {
  eventName: document.getElementById("event-name"),
  statusPanel: document.getElementById("status-panel"),
  statusIcon: document.getElementById("status-icon"),
  statusTitle: document.getElementById("status-title"),
  statusText: document.getElementById("status-text"),
  countdown: document.getElementById("countdown"),
  signinSection: document.getElementById("signin-section"),
  liveSection: document.getElementById("live-section"),
  signinForm: document.getElementById("signin-form"),
  empId: document.getElementById("emp-id"),
  submitBtn: document.getElementById("submit-btn"),
  message: document.getElementById("message"),
  player: document.getElementById("player")
};

const countdownEls = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds")
};

let countdownTimer = null;

function showState(state, data = {}) {
  const eventName = data.eventName || APP_CONFIG.EVENT_NAME;
  els.eventName.textContent = eventName;

  els.signinSection.classList.add("hidden");
  els.liveSection.classList.add("hidden");
  els.countdown.classList.add("hidden");

  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  if (state === "LIVE") {
    els.statusIcon.textContent = "●";
    els.statusTitle.textContent = "活動進行中";
    els.statusText.textContent = "請輸入您的工號完成簽到。";
    els.signinSection.classList.remove("hidden");
    return;
  }

  if (state === "ENDED") {
    els.statusIcon.textContent = "✓";
    els.statusTitle.textContent = "活動已結束";
    els.statusText.textContent = "感謝您的參與，活動已經圓滿結束。";
    return;
  }

  els.statusIcon.textContent = "⏳";
  els.statusTitle.textContent = "活動尚未開始";
  els.statusText.textContent = data.startTime
    ? "活動即將開始，請稍候。"
    : "目前為開發測試畫面，後續連接 Google Apps Script 後會顯示正式倒數。";

  if (data.startTime) {
    els.countdown.classList.remove("hidden");
    countdownTimer = setInterval(async () => {
      const reached = updateCountdown(data.startTime, countdownEls);
      if (reached) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        await refreshStatus();
      }
    }, 1000);
    updateCountdown(data.startTime, countdownEls);
  }
}

function showLivePlayer(videoId) {
  if (!videoId) {
    els.message.textContent = "簽到成功，但尚未設定直播。";
    return;
  }

  els.signinSection.classList.add("hidden");
  els.statusPanel.classList.add("hidden");
  els.liveSection.classList.remove("hidden");
  els.player.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0"
      title="活動直播"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>
  `;
}

async function refreshStatus() {
  try {
    const data = await getEventStatus();
    const state = getEventState(data);
    showState(state, data);
  } catch (error) {
    console.error(error);
    els.statusIcon.textContent = "⚠";
    els.statusTitle.textContent = "系統連線中斷";
    els.statusText.textContent = "目前無法取得活動狀態，請稍後再試。";
  }
}

els.signinForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const empId = els.empId.value.trim();
  if (!empId) return;

  els.submitBtn.disabled = true;
  els.submitBtn.textContent = "驗證中...";
  els.message.textContent = "正在確認您的工號...";

  try {
    const result = await signIn(empId);

    if (result.success) {
      els.message.textContent = "簽到成功！";
      showLivePlayer(result.videoId);
    } else {
      els.message.textContent = result.message || "簽到失敗，請重新確認工號。";
    }
  } catch (error) {
    console.error(error);
    els.message.textContent = "目前無法連線至後端，請稍後再試。";
  } finally {
    els.submitBtn.disabled = false;
    els.submitBtn.textContent = "簽到並進入直播";
  }
});

refreshStatus();
setInterval(refreshStatus, APP_CONFIG.CHECK_INTERVAL_MS);
