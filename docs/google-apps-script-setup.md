# Google Sheets + Apps Script 設定

## 這一步要做什麼？

GitHub Pages 是使用者看到的網站；Google Apps Script 負責驗證工號、判斷活動狀態與記錄簽到；Google Sheets 保存資料。

## 1. 建立 Google 試算表

建立一份新的 Google 試算表，例如：

`活動簽到後台`

## 2. 開啟 Apps Script

在試算表上方選：

`擴充功能 > Apps Script`

把 Repository 裡的 `gas/Code.gs` 完整內容貼到 `Code.gs`。

## 3. 第一次建立資料表

在 Apps Script 上方函式下拉選單選：

`setupSheets`

按「執行」。

第一次執行 Google 會要求授權，依畫面完成授權。

完成後，試算表會建立：

- 活動設定
- 員工名冊
- 簽到紀錄

## 4. 修改活動設定

「活動設定」工作表：

| 設定名稱 | 說明 |
| --- | --- |
| 活動名稱 | 網站顯示的活動名稱 |
| 活動開始時間 | AUTO 模式判斷開始時間 |
| 活動結束時間 | AUTO 模式判斷結束時間 |
| 活動狀態 | AUTO / READY / LIVE / ENDED |
| 直播 Video ID | YouTube 影片 ID |

## 5. 部署為 Web App

Apps Script 右上角：

`部署 > 新建部署 > 網頁應用程式`

正式使用時應建立版本化部署。Google 官方文件說明，Web App 必須包含 `doGet` 或 `doPost`，並透過部署取得 Web App URL。

建議：

- 執行身分：我
- 存取權：依你的公司帳號與活動需求選擇

若網站要讓未登入 Google 的外部瀏覽器直接呼叫，需選擇允許匿名存取的設定；這會降低入口的存取限制，因此正式活動前應先確認公司資訊安全政策。

## 6. 把 Web App URL 填回 GitHub

複製部署後的 `/exec` 網址，填入：

`js/config.js`

```javascript
GAS_API_URL: "你的 Web App /exec 網址"
```

## 測試帳號

第一次執行 `setupSheets()` 後，員工名冊會建立：

`TEST001`

可用它測試簽到流程。

## 注意

目前 V1 會在成功驗證後將 YouTube Video ID 回傳給前端，因此它只能降低「未驗證者直接看到直播資訊」的機率，不能把 YouTube 連結視為 DRM 等級的防外流機制。
