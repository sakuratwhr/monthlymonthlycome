# Monthly Monthly Come

## 活動簽到與直播系統 V1

本專案提供活動開始前倒數、活動進行中工號簽到，以及後續串接 Google Apps Script / Google Sheets 的直播入口。

### 專案結構

- `index.html`：網站主畫面
- `css/style.css`：網站樣式與 RWD
- `js/config.js`：系統設定
- `js/api.js`：與 Google Apps Script API 溝通
- `js/event.js`：活動狀態與倒數邏輯
- `js/app.js`：前端主控制程式
- `gas/Code.gs`：Google Apps Script 後端（後續建立）

### 目前狀態

V1 前端已建立：

- 活動尚未開始畫面
- 倒數計時框架
- 活動進行中工號簽到畫面
- 活動結束畫面
- 直播播放器框架
- Google Apps Script API 串接框架

Google Apps Script URL 尚未設定時，網站會以測試模式顯示「活動尚未開始」。
