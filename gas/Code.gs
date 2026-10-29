function onFormSubmit(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const responses = e.namedValues;
    const timestamp = e.values[0] || new Date();
    const clientType = responses['ご相談者の区分'] ? responses['ご相談者の区分'][0] : '未指定';
    const companyName = responses['法人名・屋号'] ? responses['法人名・屋号'][0] : 'なし';
    const clientName = responses['お名前'] ? responses['お名前'][0] : '未入力';
    const clientEmail = responses['メールアドレス'] ? responses['メールアドレス'][0] : '';
    const clientTel = responses['お電話番号'] ? responses['お電話番号'][0] : '未入力';
    const serviceInterest = responses['ご興味のあるサービス'] ? responses['ご興味のあるサービス'][0] : '未指定';
    const preferredContact = responses['希望のご連絡・面談方法'] ? responses['希望のご連絡・面談方法'][0] : '指定なし';
    const consultationDetail = responses['ご相談内容・現状の課題'] ? responses['ご相談内容・現状の課題'][0] : '';

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 10).setValue('未対応');
    sheet.getRange(lastRow, 11).setValue('代表税理士');
    sheet.getRange(lastRow, 12).setValue(new Date());

    const adminEmail = Session.getEffectiveUser().getEmail();
    const adminSubject = `【新規お問い合わせ】${clientName}様よりご相談（${serviceInterest}）`;
    const adminBody = `
寺澤景子税理士事務所 受付システムです。
Webサイトのフォームより新規のお問い合わせを受付いたしました。

■ 受信日時: ${timestamp}
■ 相談区分: ${clientType}
■ 法人名/屋号: ${companyName}
■ お名前: ${clientName} 様
■ メールアドレス: ${clientEmail}
■ お電話番号: ${clientTel}
■ ご興味のあるサービス: ${serviceInterest}
■ 希望連絡方法: ${preferredContact}
■ ご相談内容:
${consultationDetail}

管理スプレッドシートURL:
${SpreadsheetApp.getActiveSpreadsheet().getUrl()}
`;
    GmailApp.sendEmail(adminEmail, adminSubject, adminBody);

    if (clientEmail && clientEmail.includes('@')) {
      const customerSubject = '【寺澤景子税理士事務所】無料相談・お問い合わせを受け付けいたしました';
      const customerBody = `
${clientName} 様

この度は、寺澤景子税理士事務所のWebサイトよりお問い合わせいただき、誠にありがとうございます。
代表税理士の寺澤景子でございます。

以下の内容でお問い合わせを正常に受け付けいたしました。
内容を確認の上、原則1営業日以内に代表税理士よりご連絡を差し上げます。

■ 受信日時: ${timestamp}
■ 区分: ${clientType}
■ お名前: ${clientName} 様
■ ご興味のあるサービス: ${serviceInterest}
■ ご希望の連絡方法: ${preferredContact}
■ ご相談内容:
${consultationDetail}

━━━━━━━━━━━━━━━━━━━━━━━━━━
寺澤景子税理士事務所
代表税理士：寺澤景子
所在地：〒863-0023　熊本県天草市南町5-22
公式サイト：https://terazawazeirishi-blip.github.io/terazawazeirishi/index.html
━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
      GmailApp.sendEmail(clientEmail, customerSubject, customerBody);
    }
  } catch (error) {
    Logger.log('Error: ' + error.toString());
  }
}
