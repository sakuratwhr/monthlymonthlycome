async function getEventStatus() {
  if (!APP_CONFIG.GAS_API_URL) {
    return {
      success: true,
      status: "READY",
      eventName: APP_CONFIG.EVENT_NAME,
      startTime: null,
      endTime: null,
      demo: true
    };
  }

  const response = await fetch(APP_CONFIG.GAS_API_URL, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API HTTP ${response.status}`);
  }

  return response.json();
}

async function signIn(empId) {
  if (!APP_CONFIG.GAS_API_URL) {
    return {
      success: false,
      message: "後端尚未設定，請先完成 Google Apps Script 設定。"
    };
  }

  const response = await fetch(APP_CONFIG.GAS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      empId,
      userAgent: navigator.userAgent
    })
  });

  if (!response.ok) {
    throw new Error(`API HTTP ${response.status}`);
  }

  return response.json();
}
