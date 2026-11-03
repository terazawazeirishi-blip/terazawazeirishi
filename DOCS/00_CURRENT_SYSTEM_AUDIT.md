# 00. 現行システム詳細監査書 (Current System Audit)

## 1. 調査対象と基本環境
- リポジトリ: terazawazeirishi-blip/terazawazeirishi (mainブランチ)
- 公開URL: https://terazawazeirishi-blip.github.io/terazawazeirishi/index.html
- 管理画面: Pages CMS (https://app.pagescms.org/)
- ホスティング環境: GitHub Pages (Project Site / ベースパス: `/terazawazeirishi/`)

## 2. 実際に確認したファイル構成
### A. ルート直下
- `index.html` (メインページ / アテナ準拠デザイン)
- `services.html` (サービス案内)
- `pricing.html` (料金案内)
- `profile.html` (税理士紹介・事務所概要)
- `faq.html` (よくある質問)
- `contact.html` (お問い合わせ)
- `privacy.html` (プライバシーポリシー)
- `sitemap.html` (HTMLサイトマップ)
- `sitemap.xml` / `robots.txt`
- `404.html`
- `.nojekyll` (1行コメント `# Disable Jekyll` 含有)
- `.pages.yml` (Pages CMSスキーマ定義)

### B. ディレクトリ構成
- `.github/workflows/deploy.yml`: GitHub Actions 自動ビルド＆Pagesデプロイ
- `admin/`: Sveltia CMS環境 (`config.yml`, `index.html`)
- `assets/css/`: `style.css` (:root先頭定義、アテナ準拠デザイントークン)
- `assets/images/`: `uploads/`, `hero-bg-photo.svg`, `logo-athena-wing.svg`, `watermark-crest.svg`
- `assets/js/`: `main.js` (repoBaseパス解決、8大同期関数)
- `blog/`: `index.html`, `sample.md`, `sample-post.html` (コラム単一収束先)
- `content/`: `site_images.json`, `news/sample.md` (※他JSONはmain.js内で参照)
- `gas/`: `Code.gs` (2人体制通知・即時返信・スプレッドシート連携)
- `scripts/`: `build_blog.py` (Markdown->HTML変換), `deterministic_validator.py`
- `terazawazeirishi-main(2)/`: 【異常検出】入れ子の展開残骸ディレクトリ

## 3. Pages CMS 10管理領域の定義状況
1. `site_images`: `content/site_images.json` (17スロット画像管理)
2. `home_texts`: `content/home_texts.json`
3. `office_info_manager`: `content/office_info.json`
4. `profile_texts`: `content/profile_texts.json`
5. `services_manager`: `content/services.json`
6. `pricing_manager`: `content/pricing.json`
7. `faq_manager`: `content/faq.json`
8. `legal_texts`: `content/legal_texts.json`
9. `blog`: `blog/*.md`
10. `news`: `content/news/*.md`

## 4. 検出された既知の問題と修正候補
- **問題A (サービス)**: `syncServicesTexts()` が既存HTMLカード数に依存。カード動的生成エンジンへ改修が必要。
- **問題B (料金)**: `syncPricingTexts()` で `plans` / `spot_fees` のテーブル動的レンダリングが未実装。
- **問題C (FAQ)**: `syncFaqTexts()` で `faq_list` 配列からアコーディオンを動的生成する処理が不足。
- **問題D (セキュリティ)**: `setOrHide()` 等における `innerHTML` 直接挿入を廃止し、サニタイズされたDOM生成（`textContent` 優先）へ置換。
- **問題E (エラー処理)**: `catch (e) {}` の無言無視を廃止。コンソールログ・管理者診断通知を導入。
- **問題F (CMS重複)**: `admin/` (Sveltia) と `.pages.yml` (Pages CMS) の併存。Pages CMSを主として保護し、`content/blog/` の残骸有無を確認。
- **問題G (残骸フォルダ)**: `terazawazeirishi-main(2)/` の隔離と削除準備。
