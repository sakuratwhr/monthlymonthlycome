/**
 * 活動簽到與直播系統 V1
 *
 * 建議：從目標 Google 試算表開啟「擴充功能 > Apps Script」，
 * 將本檔案貼入 Code.gs。
 *
 * 必要工作表：
 * 1. 活動設定
 * 2. 員工名冊
 * 3. 簽到紀錄
 */

const SHEETS = {
  SETTINGS: "活動設定",
  EMPLOYEES: "員工名冊",
  ATTENDANCE: "簽到紀錄"
};

function doGet(e) {
  try {
    const config = getConfig_();
    const status = getEventStatus_(config);

    return json_({
      success: true,
      status: status,
      eventName: config["活動名稱"] || "活動簽到系統",
      startTime: toIso_(config["活動開始時間"]),
      endTime: toIso_(config["活動結束時間"])
    });
  } catch (error) {
    return json_({
      success: false,
      message: "讀取活動狀態失敗：" + error.message
    });
  }
}

function doPost(e) {
  try {
    const data = parseRequest_(e);
    const empId = String(data.empId || "").trim();

    if (!empId) {
      return json_({
        success: false,
        message: "請輸入有效工號。"
      });
    }

    const config = getConfig_();
    const status = getEventStatus_(config);

    // 真正的活動規則必須由後端再次驗證，
    // 不能只依賴前端畫面是否隱藏簽到按鈕。
    if (status === "READY") {
      return json_({
        success: false,
        message: "活動尚未開始，暫時無法簽到。"
      });
    }

    if (status === "ENDED") {
      return json_({
        success: false,
        message: "活動已結束，無法再進行簽到。"
      });
    }

    const employee = findEmployee_(empId);

    if (!employee) {
      return json_({
        success: false,
        message: "工號不存在，請重新確認。"
      });
    }

    if (!employee.enabled) {
      return json_({
        success: false,
        message: "此工號目前未啟用。"
      });
    }

    const duplicate = hasSignedInToday_(empId);

    appendAttendance_({
      timestamp: new Date(),
      empId: employee.empId,
      name: employee.name,
      department: employee.department,
      note: duplicate ? "重複進入" : "首次簽到",
      userAgent: String(data.userAgent || "")
    });

    return json_({
      success: true,
      message: duplicate ? "歡迎再次進入直播。" : "簽到成功！正在進入直播。",
      videoId: String(config["直播 Video ID"] || "").trim()
    });

  } catch (error) {
    return json_({
      success: false,
      message: "系統錯誤：" + error.message
    });
  }
}

/**
 * 第一次設定時可手動執行一次。
 * 會建立三張工作表與範例表頭／設定。
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ensureSheet_(ss, SHEETS.SETTINGS, [
    ["設定名稱", "設定值"],
    ["活動名稱", "年度內部大會"],
    ["活動開始時間", "2026-09-02 18:30:00"],
    ["活動結束時間", "2026-09-02 21:00:00"],
    ["活動狀態", "AUTO"],
    ["直播 Video ID", ""]
  ]);

  ensureSheet_(ss, SHEETS.EMPLOYEES, [
    ["工號", "姓名", "部門", "啟用"],
    ["TEST001", "測試人員", "測試部門", "TRUE"]
  ]);

  ensureSheet_(ss, SHEETS.ATTENDANCE, [
    ["簽到時間", "工號", "姓名", "部門", "備註", "裝置資訊"]
  ]);
}

function getConfig_() {
  const sheet = getSheet_(SHEETS.SETTINGS);
  const values = sheet.getDataRange().getValues();
  const config = {};

  for (let i = 1; i < values.length; i++) {
    const key = String(values[i][0] || "").trim();
    if (!key) continue;
    config[key] = values[i][1];
  }

  return config;
}

function getEventStatus_(config) {
  const manualStatus = String(config["活動狀態"] || "AUTO").trim().toUpperCase();

  if (["READY", "LIVE", "ENDED"].includes(manualStatus)) {
    return manualStatus;
  }

  const now = new Date();
  const start = parseDate_(config["活動開始時間"]);
  const end = parseDate_(config["活動結束時間"]);

  if (start && now < start) return "READY";
  if (end && now > end) return "ENDED";
  if (start && now >= start) return "LIVE";

  return "READY";
}

function findEmployee_(empId) {
  const sheet = getSheet_(SHEETS.EMPLOYEES);
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    const currentId = String(values[i][0] || "").trim();

    if (currentId === empId) {
      return {
        empId: currentId,
        name: String(values[i][1] || "").trim(),
        department: String(values[i][2] || "").trim(),
        enabled: isEnabled_(values[i][3])
      };
    }
  }

  return null;
}

function hasSignedInToday_(empId) {
  const sheet = getSheet_(SHEETS.ATTENDANCE);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return false;

  const today = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );

  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();

  return values.some(row => {
    const timestamp = row[0];
    const currentId = String(row[1] || "").trim();

    if (!(timestamp instanceof Date) || currentId !== empId) {
      return false;
    }

    const rowDate = Utilities.formatDate(
      timestamp,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );

    return rowDate === today;
  });
}

function appendAttendance_(record) {
  const sheet = getSheet_(SHEETS.ATTENDANCE);

  sheet.appendRow([
    record.timestamp,
    record.empId,
    record.name,
    record.department,
    record.note,
    record.userAgent
  ]);
}

function parseRequest_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }

  return JSON.parse(e.postData.contents);
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_(name) {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(name);

  if (!sheet) {
    throw new Error("找不到工作表：「" + name + "」。請先執行 setupSheets()。");
  }

  return sheet;
}

function ensureSheet_(ss, name, initialValues) {
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, initialValues.length, initialValues[0].length)
      .setValues(initialValues);
    sheet.setFrozenRows(1);
  }
}

function parseDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  if (!value) return null;

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function toIso_(value) {
  const date = parseDate_(value);
  return date ? date.toISOString() : null;
}

function isEnabled_(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return ["TRUE", "1", "YES", "Y", "啟用"].includes(normalized);
}
