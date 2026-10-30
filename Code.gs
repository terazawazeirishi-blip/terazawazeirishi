/**
 * 寺沢恵子税理士事務所 - 相談受付自動通知スクリプト
 * 
 * 【設定方法（初心者向け手順）】
 * 1. Googleフォームを作成し、回答の保存先をスプレッドシートに設定します。
 * 2. そのスプレッドシートのメニューから「拡張機能」>「Apps Script」を開きます。
 * 3. 本コードを貼り付けて保存します。
 * 4. 左メニューの「トリガー（時計アイコン）」>「トリガーを追加」を選択。
 *    - 実行する関数: sendNotification
 *    - イベントの種類: フォーム送信時
 *    に設定して保存するだけで完了です（APIキー不要）。
 */

function sendNotification(e) {
  // 通知先メールアドレス（寺沢恵子税理士事務所）
  const NOTIFY_EMAIL = "info@terazawa-tax.jp"; // ※実際の事務所アドレスに変更
  const SENDER_NAME = "寺沢恵子税理士事務所 Webサイト";

  try {
    const responses = e.namedValues;
    const timestamp = responses["タイムスタンプ"] ? responses["タイムスタンプ"][0] : Utilities.formatDate(new Date(), "JST", "yyyy/MM/dd HH:mm:ss");
    const name = responses["お名前"] ? responses["お名前"][0] : "未入力";
    const email = responses["メールアドレス"] ? responses["メールアドレス"][0] : "未入力";
    const phone = responses["お電話番号"] ? responses["お電話番号"][0] : "未入力";
    const inquiryType = responses["ご相談内容の種別"] ? responses["ご相談内容の種別"][0] : "未指定";
    const message = responses["ご相談詳細"] ? responses["ご相談詳細"][0] : "未入力";

    const subject = "【Web問い合わせ】" + name + "様より無料相談のお申し込み";

    const body = 
      "寺沢恵子税理士事務所\n" +
      "担当者様\n\n" +
      "公式ホームページより新しい無料相談のお問い合わせがありました。\n\n" +
      "--------------------------------------------------\n" +
      "【受付日時】: " + timestamp + "\n" +
      "【お名前】: " + name + " 様\n" +
      "【メールアドレス】: " + email + "\n" +
      "【電話番号】: " + phone + "\n" +
      "【相談種別】: " + inquiryType + "\n" +
      "--------------------------------------------------\n" +
      "【相談内容】:\n" + message + "\n" +
      "--------------------------------------------------\n\n" +
      "※本メールはGoogleフォームの自動連携システムより送信されています。\n" +
      "※スプレッドシートの管理台帳より対応ステータス（未対応/対応中/完了）を更新してください。";

    // Google標準機能による送信（APIキー不要）
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: subject,
      body: body,
      name: SENDER_NAME
    });

  } catch (error) {
    Logger.log("通知送信エラー: " + error.toString());
  }
}