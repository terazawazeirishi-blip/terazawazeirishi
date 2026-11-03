# 02. データ所有権マトリクス (Data Ownership Matrix)

| ID | 管理データ名 | 正本ファイル（Single Source of Truth） | Pages CMS画面 | ビジュアルエディタ | 公開反映スクリプト / 関数 |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **01** | 全画像スロット (17箇所) | `content/site_images.json` | ○ | ○ | `main.js: syncCmsImages()` |
| **02** | ホームテキスト | `content/home_texts.json` | ○ | ○ | `main.js: syncHomeTexts()` |
| **03** | 事務所基本情報 | `content/office_info.json` | ○ | △ (一部保護) | `main.js: syncOfficeInfo()` |
| **04** | 税理士プロフィール | `content/profile_texts.json` | ○ | ○ | `main.js: syncProfileTexts()` |
| **05** | 7大サービス内容 | `content/services.json` | ○ | ○ | `main.js: renderServicesDynamic()` |
| **06** | 料金体系・プラン | `content/pricing.json` | ○ | △ (保護) | `main.js: renderPricingDynamic()` |
| **07** | よくある質問 (FAQ) | `content/faq.json` | ○ | ○ | `main.js: renderFaqDynamic()` |
| **08** | 法的表記・ポリシー | `content/legal_texts.json` | ○ | × (保護) | `main.js: syncLegalTexts()` |
| **09** | 税務コラム記事 | `blog/*.md` | ○ | ○ | `build_blog.py -> deploy.yml` |
| **10** | お知らせ (News) | `content/news/*.md` | ○ | ○ | `main.js: renderNewsDynamic()` |

### 整合性保護ルール
- **事務所基本情報・料金・法的表記**: 事務所の信頼性・法的責任に直結するため、ビジュアルエディタでの偶発的なドラッグ削除をロックし、Pages CMSまたは専用プロパティパネルからのみ編集可能とする。
- **データマージ保護**: Pages CMS保存時にスキーマ外のキーが消失しないよう、`.pages.yml` の定義とJSONスキーマを完全一致させる。
