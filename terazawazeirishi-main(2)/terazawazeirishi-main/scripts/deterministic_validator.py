#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
寺沢景子税理士事務所 決定論的品質・整合性検証スクリプト
ファイルパス: scripts/deterministic_validator.py
仕様: APIキー完全不使用の強制検証 / 完全決定論的処理
"""

import sys
import os
import re
from pathlib import Path

# ルートディレクトリ
ROOT_DIR = Path(__file__).resolve().parent.parent

# 1. 必須存在ファイル
REQUIRED_FILES = [
    "index.html",
    "services.html",
    "pricing.html",
    "profile.html",
    "contact.html",
    "privacy.html",
    "faq.html",
    "404.html",
    "blog/index.html",
    "blog/sample-post.html",
    "assets/css/style.css",
    "assets/js/main.js",
    ".pages.yml",
    "admin/config.yml",
    "gas/Code.gs",
    "robots.txt",
    "sitemap.xml"
]

# 2. 確定事務所情報の必須キーワード
MANDATORY_KEYWORDS = [
    "寺沢景子税理士事務所",
    "0969-22-1166",
    "天草市南町5-22",
    "154978",
    "ザワテラス社労士"
]

# 3. 禁止パターン（APIキー・秘密鍵の漏洩スキャン）
PROHIBITED_PATTERNS = [
    r'AIzaSy[0-9A-Za-z-_]{33}',        # Google API Key
    r'sk-[a-zA-Z0-9]{20,}',            # OpenAI / Claude API Key
    r'ghp_[a-zA-Z0-9]{36}',            # GitHub Personal Access Token
    r'BEGIN PRIVATE KEY',              # RSA Private Key
]

def run_tests():
    print("=" * 60)
    print("寺沢景子税理士事務所 決定論的品質・整合性自動検証開始")
    print("=" * 60)

    has_error = False

    # テスト 1: 必須ファイルの存在確認
    print("\n[TEST 1] 必須ファイルの存在確認...")
    for rel_path in REQUIRED_FILES:
        target = ROOT_DIR / rel_path
        if not target.exists():
            print(f"  ❌ 欠落ファイル検出: {rel_path}")
            has_error = True
        else:
            print(f"  ✅ 確認完了: {rel_path}")

    # テスト 2: 確定事務所情報の包含確認 (index.html)
    print("\n[TEST 2] 確定事務所情報の整合性確認 (index.html)...")
    index_content = (ROOT_DIR / "index.html").read_text(encoding="utf-8")
    for kw in MANDATORY_KEYWORDS:
        if kw not in index_content:
            print(f"  ❌ 必須キーワード欠落: '{kw}' が index.html に存在しません")
            has_error = True
        else:
            print(f"  ✅ 必須キーワード検出: '{kw}'")

    # テスト 3: APIキー・シークレットトークンの混入スキャン
    print("\n[TEST 3] ソースコード内 APIキー混入ゼロスキャン...")
    scanned_count = 0
    for root, dirs, files in os.walk(ROOT_DIR):
        if ".git" in dirs:
            dirs.remove(".git")
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in [".html", ".css", ".js", ".yml", ".py", ".gs", ".md", ".txt"]:
                filepath = Path(root) / f
                content = filepath.read_text(encoding="utf-8", errors="ignore")
                scanned_count += 1
                for pat in PROHIBITED_PATTERNS:
                    if re.search(pat, content):
                        print(f"  ❌ 【重大セキュリティ違反】APIキーの混入を検知: {filepath.relative_to(ROOT_DIR)}")
                        has_error = True

    print(f"  ✅ スキャン完了: 計 {scanned_count} ファイル（危険なAPIキーは0件です）")

    # 結果集計
    print("\n" + "=" * 60)
    if has_error:
        print("❌ 品質検証エラーが発生しました。デプロイを中断します。")
        sys.exit(1)
    else:
        print("🎉 全検査項目に合格しました（Deterministic Integrity Passed）。")
        print("=" * 60)
        sys.exit(0)

if __name__ == "__main__":
    run_tests()