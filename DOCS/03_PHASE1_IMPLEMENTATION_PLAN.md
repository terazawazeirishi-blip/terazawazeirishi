# 03. PHASE 1 具体的一括実装計画書 (Phase 1 Implementation Plan)

## 1. PHASE 1 の目的
既存のPages CMS 10管理領域を完全実用化し、CMSで編集・保存したデータ（追加・削除・並び替え含む）が、公開ホームページ上の表示へ100%忠実に反映される状態を確立する。

## 2. 重点改修対象
### (1) `content/` 配下の正本JSONスキーマの確立と初期データ配置
- 現在リポジトリ上に実体ファイルが存在しない、または不完全なJSON（`home_texts.json`, `office_info.json`, `profile_texts.json`, `services.json`, `pricing.json`, `faq.json`, `legal_texts.json`）について、現行HTMLの完成された文面・データを100%抽出して完全な正本JSONを作成・配置する。

### (2) `assets/js/main.js` の動的レンダリング改修
- **サービス動的生成 (`renderServicesDynamic`)**:
  - `content/services.json` の件数（例: 7件以上、または増減）に合わせて `.service-card-item` をテンプレートリテラルではなく安全なDOM生成関数で動的生成。
  - 画像パス解決（`repoBase` 自動補正）を統合。
- **料金動的生成 (`renderPricingDynamic`)**:
  - `plans` 配列から顧問料カードを生成。「おすすめ」バッジの表示制御。
  - `spot_fees` 配列からスポット報酬表をテーブル要素として安全に生成。
- **FAQ動的生成 (`renderFaqDynamic`)**:
  - `faq_list` 配列からアコーディオン（`<details><summary>` または独自開閉クラス）を安全に生成。既存の開閉イベントリスナーを再バインド。
- **XSS完全対策**:
  - `innerHTML` の直接代入を禁止し、テキストノード生成および安全なエスケープ処理を標準化。
- **エラー可視化**:
  - `catch` 節でエラーを握りつぶさず、開発・管理モードで画面上またはコンソールに明瞭なエラー情報を出力する診断関数を実装。

### (3) `.pages.yml` の整合性検査
- 各コレクションのフィールド名・型（`type: object`, `type: list`, `type: string` 等）が正本JSONのキーと1対1で完全一致していることを確認。
- 過去トラブル（Reactエラー#31、options.values書式等）のルールを厳格に保持。

## 3. 実装手順と納品単位
- **STEP 1**: 正本JSONファイル群（`content/*.json`）の完全版コード提示（各ファイル完全置き換え形式）。
- **STEP 2**: `assets/js/main.js` の完全版コード提示（動的レンダリング＋XSS対策＋診断機能統合）。
- **STEP 3**: `.pages.yml` のスキーマ照合と必要に応じた修正提示。
- **STEP 4**: 動作確認・テスト結果（0件/1件/複数件表示テスト）の報告。

## 4. PHASE 1 合格判定基準
1. Pages CMSで10管理領域のいずれかを編集・保存した際、エラーなくコミットされること。
2. サービス・料金・FAQの件数を増減させた場合、公開サイト側で過不足なく要素が増減して美しく表示されること。
3. 既存のアテナ準拠デザイン（配色・Sticky・フォント・余白）が一切崩れていないこと。
4. コンソールエラーが0件であること。
