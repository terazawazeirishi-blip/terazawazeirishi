# 02. データ所有権・管理領域マトリクス (Data Ownership Matrix)

| 領域番号 | 管理対象データ | 正本ファイル | 編集インターフェース | 公開側反映処理 | 状態 / 課題 |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **01** | 全画像スロット (17種) | `content/site_images.json` | Pages CMS / Studio | `main.js (syncCmsImages)` | 稼働中（正常） |
| **02** | ホームテキスト (見出し等) | `content/home_texts.json` | Pages CMS / Studio | `main.js (syncHomeTexts)` | 要スキーマ確認 |
| **03** | 事務所基本情報 | `content/office_info.json` | Pages CMS / Studio | `main.js (syncOfficeInfo)` | 表記ゆれ統一が必要 |
| **04** | 税理士プロフィール | `content/profile_texts.json` | Pages CMS / Studio | `main.js (syncProfileTexts)`| ベテラン税理士名確認 |
| **05** | 7大サービス内容 | `content/services.json` | Pages CMS / Studio | `main.js (syncServicesTexts)`| 配列件数同期の検証 |
| **06** | 料金プラン・規定 | `content/pricing.json` | Pages CMS / Studio | `main.js (syncPricingTexts)` | テーブル生成ロジック |
| **07** | よくある質問 (FAQ) | `content/faq.json` | Pages CMS / Studio | `main.js (syncFaqTexts)` | アコーディオン同期 |
| **08** | 法的表記・ポリシー | `content/legal_texts.json` | Pages CMS / Studio | `main.js (syncLegalTexts)` | プライバシー文面 |
| **09** | 税務コラム記事 | `blog/*.md` | Pages CMS / Studio | `build_blog.py -> deploy.yml`| 稼働中（正常） |
| **10** | お知らせ (News) | `content/news/*.md` | Pages CMS / Studio | `main.js / build処理` | 表示パイプライン検証 |
