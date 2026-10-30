/**
 * ==============================================================================
 * 寺沢景子税理士事務所 Google Apps Script 問い合わせ自動管理システム
 * ファイルパス: gas/Code.gs
 * 仕様: APIキー完全不使用 / Google標準権限のみで動作
 * ==============================================================================
 */

// 管理者通知先メールアドレス（寺沢代表のGmailまたは事務所アドレス）
const ADMIN_EMAIL = "info@terazawa-tax.jp"; // ※設定時に代表のGoogleアカウントメールに変更
const OFFICE_NAME = "寺沢景子税理士事務所";
const OFFICE_TEL  = "0969-22-1166";
const OFFICE_URL  = "https://terazawazeirishi-blip.github.io/terazawazeirishi/index.html";

/**
 * フォーム送信時トリガー関数
 * Googleフォームから回答が送信された瞬間に自動実行されます。
 */
function onFormSubmit(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    // 送信データの取得（e.values がある場合はそれを使用、ない場合は最終行から抽出）
    const rowValues = e ? e.values : sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const timestamp    = rowValues[0] || new Date();
    const customerName = rowValues[1] || "お客様";
    const customerEmail= rowValues[2] || "";
    const customerTel  = rowValues[3] || "未入力";
    const inquiryType  = rowValues[4] || "一般税務相談";
    const inquiryBody  = rowValues[5] || "内容なし";

    // スプレッドシート管理列の自動補完（ステータス・担当者・更新日）
    // カラム構成: [タイムスタンプ, お名前, メール, 電話番号, 相談区分, 相談内容, ステータス, 担当者, 次回対応日, メモ]
    sheet.getRange(lastRow, 7).setValue("未対応");
    sheet.getRange(lastRow, 8).setValue("代表税理士 寺沢景子");
    sheet.getRange(lastRow, 9).setValue(new Date());

    // 1. 代表税理士への通知メール送信
    sendAdminNotification(timestamp, customerName, customerEmail, customerTel, inquiryType, inquiryBody);

    // 2. お客様への自動受付確認メール送信（メールアドレスが入力されている場合）
    if (customerEmail && customerEmail.includes("@")) {
      sendCustomerReceipt(customerName, customerEmail, inquiryType);
    }

  } catch (error) {
    Logger.log("onFormSubmit Error: " + error.toString());
  }
}

/**
 * 代表税理士宛て 通知メール
 */
function sendAdminNotification(timestamp, name, email, tel, type, body) {
  const subject = `【無料相談受付】${name}様よりお問い合わせ（${type}）`;
  const message = `
寺沢景子 代表

Webサイトより新しい無料相談の予約・お問い合わせを受け付けました。
スプレッドシートのステータスを「対応中」に更新し、原則1営業日以内にご連絡をお願いいたします。

--------------------------------------------------
■ 受付日時: ${timestamp}
■ お名前: ${name} 様
■ メールアドレス: ${email}
■ お電話番号: ${tel}
■ 相談区分: ${type}
■ 相談内容:
${body}
--------------------------------------------------
▼ 管理台帳スプレッドシート:
https://docs.google.com/spreadsheets/d/1nLjOUqxcLWqfCTc5YnwDlyEUwBXSoFJ7nfLa9D1qZ_Y/edit
  `.trim();

  GmailApp.sendEmail(ADMIN_EMAIL, subject, message);
}

/**
 * お客様宛て 受付完了メール（自動返信）
 */
function sendCustomerReceipt(name, email, type) {
  const subject = `【${OFFICE_NAME}】無料相談のお申し込みを受け付けました`;
  const message = `
${name} 様

この度は、${OFFICE_NAME}へお問い合わせいただき誠にありがとうございます。
代表税理士の寺沢景子（てらざわ けいこ）でございます。

以下の内容でお問い合わせ・無料相談の予約を受け付けいたしました。

--------------------------------------------------
■ 相談区分: ${type}
--------------------------------------------------

内容を確認のうえ、原則として1営業日以内に、
お電話（${OFFICE_TEL}）または本メールへの返信にて面談日程のご案内を差し上げます。

※お急ぎの場合や、税務署からの調査通知等で至急のご相談の場合は、
　恐れ入りますがお電話（${OFFICE_TEL}）にて直接ご連絡いただけますと幸いです。

==================================================
寺沢景子税理士事務所（TERASAWA TAX & CONSULTING）
代表税理士　寺沢 景子
南九州税理士会熊本県連 所属（第154978号）
〒863-0023 熊本県天草市南町5-22
TEL: 0969-22-1166 / FAX: 0969-22-1167
提携士業: ザワテラス社労士 (https://terazawa-sr.jbcsite.com/)
公式HP: ${OFFICE_URL}
==================================================
  `.trim();

  GmailApp.sendEmail(email, subject, message, {
    name: OFFICE_NAME
  });
}