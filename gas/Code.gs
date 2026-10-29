/**
 * リュミエール税理士事務所 - 問い合わせ管理 & 自動通知スクリプト
 * 
 * 【技術仕様・APIキー完全不使用】
 * ・Googleフォーム送信時のトリガー (onFormSubmit) で実行
 * ・スプレッドシートへタイムスタンプ・受付ステータス（未対応）を整形記録
 * ・GmailApp (Google標準サービス) を使用して担当税理士宛てに即時通知メール送信
 * ・お客様宛てに自動受付確認メールを送信
 * ・外部AIや外部APIキーは一切呼び出しません。
 */

function onFormSubmit(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const responses = e.namedValues;
    
    // 1. 各項目の取得（Googleフォームの設問タイトルと一致させてください）
    const timestamp = e.values[0] || new Date();
    const clientType = responses['ご相談者の区分'] ? responses['ご相談者の区分'][0] : (responses['client_type'] ? responses['client_type'][0] : '未指定');
    const companyName = responses['法人名・屋号'] ? responses['法人名・屋号'][0] : (responses['company_name'] ? responses['company_name'][0] : 'なし');
    const clientName = responses['お名前'] ? responses['お名前'][0] : (responses['client_name'] ? responses['client_name'][0] : '未入力');
    const clientEmail = responses['メールアドレス'] ? responses['メールアドレス'][0] : (responses['client_email'] ? responses['client_email'][0] : '');
    const clientTel = responses['お電話番号'] ? responses['お電話番号'][0] : (responses['client_tel'] ? responses['client_tel'][0] : '未入力');
    const serviceInterest = responses['ご興味のあるサービス'] ? responses['ご興味のあるサービス'][0] : (responses['service_interest'] ? responses['service_interest'][0] : '未指定');
    const preferredContact = responses['希望のご連絡・面談方法'] ? responses['希望のご連絡・面談方法'][0] : (responses['preferred_contact'] ? responses['preferred_contact'][0] : '指定なし');
    const consultationDetail = responses['ご相談内容・現状の課題'] ? responses['ご相談内容・現状の課題'][0] : (responses['consultation_detail'] ? responses['consultation_detail'][0] : '');

    // 2. スプレッドシート最終行に管理ステータスを追記
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 10).setValue('未対応');
    sheet.getRange(lastRow, 11).setValue('代表税理士');
    sheet.getRange(lastRow, 12).setValue(new Date());

    // 3. 担当税理士宛ての通知メール作成・送信
    const adminEmail = Session.getEffectiveUser().getEmail();
    const adminSubject = `【新規お問い合わせ】${clientName}様よりご相談（${serviceInterest}）`;
    const adminBody = `
リュミエール税理士事務所 受付システムです。
Webサイトのフォームより新規のお問い合わせを受付いたしました。

--------------------------------------------------
■ 受信日時: ${timestamp}
■ 相談区分: ${clientType}
■ 法人名/屋号: ${companyName}
■ お名前: ${clientName} 様
■ メールアドレス: ${clientEmail}
■ お電話番号: ${clientTel}
■ ご興味のあるサービス: ${serviceInterest}
■ 希望連絡方法: ${preferredContact}
--------------------------------------------------
■ ご相談内容:
${consultationDetail}
--------------------------------------------------

速やかに内容を確認の上、1営業日以内にご対応をお願いいたします。
管理スプレッドシートURL:
${SpreadsheetApp.getActiveSpreadsheet().getUrl()}
`;

    GmailApp.sendEmail(adminEmail, adminSubject, adminBody);

    // 4. お客様宛ての自動返信メール送信
    if (clientEmail && clientEmail.includes('@')) {
      const customerSubject = '【リュミエール税理士事務所】無料相談・お問い合わせを受け付けいたしました';
      const customerBody = `
${clientName} 様

この度は、リュミエール税理士事務所のWebサイトよりお問い合わせいただき、誠にありがとうございます。
代表税理士の【氏名要入力】でございます。

以下の内容でお問い合わせを正常に受け付けいたしました。
内容を確認の上、原則1営業日以内に代表税理士よりご連絡を差し上げます。

--------------------------------------------------
■ 受信日時: ${timestamp}
■ 区分: ${clientType}
■ お名前: ${clientName} 様
■ ご興味のあるサービス: ${serviceInterest}
■ ご希望の連絡方法: ${preferredContact}
--------------------------------------------------
■ ご相談内容:
${consultationDetail}
--------------------------------------------------

※本メールは送信専用アドレスより自動配信されております。
万一、2営業日を過ぎても返信がない場合は、大変恐れ入りますがお電話または再度ご連絡いただけますようお願い申し上げます。

━━━━━━━━━━━━━━━━━━━━━━━━━━
リュミエール税理士事務所【仮設定】
代表税理士：【氏名要入力】
所在地：〒104-0061 東京都中央区銀座【仮設定・要入力】
公式サイト：https://example.com/
━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
      GmailApp.sendEmail(clientEmail, customerSubject, customerBody);
    }

  } catch (error) {
    Logger.log('Error in onFormSubmit: ' + error.toString());
  }
}
