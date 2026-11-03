# 03. PHASE 1 具体的一装計画書 (Phase 1 Implementation Plan)

## 1. 目的
Pages CMSの既存10管理領域のデータ整合性を確立し、保存・公開・ブラウザ表示が一切のデータ欠落なく正常に連動する状態を完成させる。

## 2. 実施手順
- STEP 1: `content/` 配下の既存JSONファイル群の現状取得とスキーマ定義の確定。
  - 実在しないJSONファイルがあれば、既存HTMLの初期値を抽出して正本JSONを新規配備。
- STEP 2: `.pages.yml` のフィールド定義と各JSONのキー完全一致検証。
  - `options.values` 等のYAML文法再チェック。
- STEP 3: `assets/js/main.js` 内の同期処理（`syncHomeTexts`, `syncServicesTexts` 等）におけるXSSサニタイズ（textContent優先）とフォールバック保護。
- STEP 4: 表記ゆれ（寺澤/寺沢、ベテラン税理士の正式名）の整合統一（ユーザー確認に基づく）。
- STEP 5: 不要フォルダ（`terazawazeirishi-main(2)/`）の安全隔離・削除検証。

## 3. 合格条件
- Pages CMS上で10管理領域すべてを開き、エラーなく保存できること。
- 保存したデータがGitHub mainブランチに反映され、Actions経由で公開ページに狂いなく表示されること。
- デッドリンク・コンソールエラーが0件であること。
