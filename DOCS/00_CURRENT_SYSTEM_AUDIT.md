# 00. 現行システム詳細監査書 (Current System Audit)

## 1. システム全体概要
- 公開URL: https://terazawazeirishi-blip.github.io/terazawazeirishi/
- リポジトリ: terazawazeirishi-blip/terazawazeirishi (mainブランチ)
- ホスティング: GitHub Pages (サブディレクトリ運用: /terazawazeirishi/)
- CMS: Pages CMS (app.pagescms.org) 主体 + Sveltia CMS (/admin) 保管
- 問い合わせ・バックエンド: Googleフォーム + スプレッドシート + Google Apps Script (Zero-API-Key)

## 2. 実在が確認されたファイル構成
terazawazeirishi/
├── .github/workflows/deploy.yml   # 自動ビルド＆デプロイ
├── admin/                         # Sveltia CMSホスト環境
├── assets/
│   ├── css/style.css              # アテナ準拠メインスタイル
│   ├── images/ (uploads/, svg等)  # サイト全画像
│   └── js/main.js                 # パス自動補正・CMSデータ同期
├── blog/ (index.html, *.md, *.html) # コラム管理（単一収束済み）
├── content/
│   ├── site_images.json           # 全17画像スロット正本
│   └── news/                      # お知らせMarkdown
├── gas/Code.gs                    # メール自動返信・2人体制通知
├── scripts/
│   ├── build_blog.py              # コラムMarkdown->HTML自動生成
│   └── deterministic_validator.py # 整合性検証
├── .nojekyll                      # Jekyll無効化フラグ
├── .pages.yml                     # Pages CMS定義ファイル
├── 404.html, contact.html, faq.html, index.html, pricing.html,
│   privacy.html, profile.html, services.html, sitemap.html,
│   robots.txt, sitemap.xml
└── terazawazeirishi-main(2)/      # 【要整理】ZIP解凍の残骸ディレクトリ

## 3. 確定済み仕様と遵守ルール
- API-Key完全不使用（Zero-Fail原則）
- 提携先「ザワテラス社労士（https://terazawa-sr.jbcsite.com/）」リンクの維持
- 英語表記「TERAZAWA TAX & CONSULTING」の統一
- サブディレクトリ相対パス解決（repoBase）の維持

## 4. 検出された課題・既知の問題
1. ルート直下の「terazawazeirishi-main(2)」ディレクトリの混入（リポジトリの肥大化）。
2. 代表税理士の苗字表記ゆれ（「寺澤」と「寺沢」）。
3. ベテラン税理士の氏名（「田河 定茂」氏の記述と空欄箇所の混在）。
4. Pages CMS管理領域と公開側JSの同期範囲（10管理領域のうち、JSONファイルが存在しない領域の特定が必要）。
