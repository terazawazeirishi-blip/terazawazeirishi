#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
決定論的コンテンツバリデーター (Deterministic Content & Security Validator)
APIキー完全不使用・ルールベース検証スクリプト
"""

import os
import re
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

REQUIRED_PAGES = [
    "index.html",
    "services.html",
    "pricing.html",
    "profile.html",
    "faq.html",
    "contact.html",
    "privacy.html",
    "blog/index.html",
    "404.html"
]

def check_for_leaks():
    print("[1/4] APIキー・シークレット混入チェックを実行中...")
    patterns = [
        re.compile("api[-_]?key", re.I),
        re.compile("secret[-_]?token", re.I),
        re.compile(r"AIza[0-9A-Za-z-_]{35}"),
        re.compile(r"sk-[a-zA-Z0-9]{32,}")
    ]
    leaks = []
    for root, _, files in os.walk(BASE_DIR):
        if ".git" in root or "scripts" in root:
            continue
        for f in files:
            if f.endswith((".html", ".css", ".js", ".yml", ".json", ".md")):
                path = os.path.join(root, f)
                try:
                    with open(path, "r", encoding="utf-8", errors="ignore") as fp:
                        content = fp.read()
                        clean_content = content.replace("API-Key-Free", "").replace("APIキー不要", "").replace("APIキー完全不使用", "").replace("APIキー", "")
                        for pattern in patterns:
                            match = pattern.search(clean_content)
                            if match:
                                leaks.append((path, match.group(0)))
                except Exception as e:
                    print(f"Warning reading {path}: {e}")
    if leaks:
        print("  [ERROR] APIキーまたはシークレットの混入疑惑が検出されました:")
        for path, pat in leaks:
            print(f"    - {os.path.relpath(path, BASE_DIR)}: match '{pat}'")
        return False
    print("  [PASS] APIキー・シークレットは一切検出されませんでした（APIキー完全不使用遵守）。")
    return True

def check_pages_and_meta():
    print("[2/4] 必須HTMLファイルおよびメタタグの検証中...")
    missing_pages = []
    meta_errors = []
    for page in REQUIRED_PAGES:
        full_path = os.path.join(BASE_DIR, page)
        if not os.path.isfile(full_path):
            missing_pages.append(page)
            continue
        with open(full_path, "r", encoding="utf-8", errors="ignore") as fp:
            html = fp.read()
            if "<title>" not in html or "</title>" not in html:
                meta_errors.append(f"{page}: <title> タグがありません")
            if page != "404.html" and 'name="description"' not in html:
                meta_errors.append(f"{page}: description メタタグがありません")

    if missing_pages or meta_errors:
        for p in missing_pages:
            print(f"  [ERROR] 不足ページ: {p}")
        for m in meta_errors:
            print(f"  [ERROR] メタ情報欠落: {m}")
        return False
    print(f"  [PASS] 全 {len(REQUIRED_PAGES)} ページの存在および必須メタタグを確認しました。")
    return True

def check_links():
    print("[3/4] 内部リンク（href）の静的整合性チェック中...")
    q = chr(34)
    sq = chr(39)
    link_pattern = re.compile('href=[' + q + sq + ']([^' + q + sq + r'\s]+)[' + q + sq + ']')
    broken_links = []
    
    for page in REQUIRED_PAGES:
        file_path = os.path.join(BASE_DIR, page)
        dir_path = os.path.dirname(file_path)
        with open(file_path, "r", encoding="utf-8", errors="ignore") as fp:
            links = link_pattern.findall(fp.read())
            for link in links:
                if link.startswith(("http://", "https://", "#", "mailto:", "tel:", "javascript:")):
                    continue
                clean_link = link.split("#")[0].split("?")[0]
                if not clean_link:
                    continue
                target_path = os.path.normpath(os.path.join(dir_path, clean_link))
                if not os.path.exists(target_path):
                    broken_links.append((page, link, target_path))

    if broken_links:
        print("  [ERROR] 壊れた内部リンクが検出されました:")
        for src, href, tgt in broken_links:
            print(f"    - {src} -> '{href}' (解決先: {os.path.relpath(tgt, BASE_DIR)})")
        return False
    print("  [PASS] すべての内部リンクの参照先が存在することを確認しました。")
    return True

def check_placeholders():
    print("[4/4] 仮設定項目（要入力項目）の検出レポート...")
    placeholder_pattern = re.compile(r"【[^】]*?(?:仮設定|要入力|氏名要入力|要設定)[^】]*?】")
    findings = {}
    for page in REQUIRED_PAGES:
        file_path = os.path.join(BASE_DIR, page)
        with open(file_path, "r", encoding="utf-8", errors="ignore") as fp:
            matches = placeholder_pattern.findall(fp.read())
            if matches:
                findings[page] = set(matches)
    
    print(f"  [INFO] 正式運用前に更新が必要なプレースホルダー項目: {sum(len(v) for v in findings.values())} 箇所")
    for page, items in findings.items():
        print(f"    * {page}: {', '.join(items)}")
    return True

def main():
    print("=== 女性税理士事務所Webサイト 決定論的品質検証開始 ===")
    ok1 = check_for_leaks()
    ok2 = check_pages_and_meta()
    ok3 = check_links()
    ok4 = check_placeholders()

    if ok1 and ok2 and ok3 and ok4:
        print("\n>>> [SUCCESS] すべての決定論的検証に合格しました。ビルドおよびデプロイ可能です。")
        sys.exit(0)
    else:
        print("\n>>> [FAILURE] 一部の検証でエラーが検出されました。公開前に修正してください。")
        sys.exit(1)

if __name__ == "__main__":
    main()