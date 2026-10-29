#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, re, sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REQUIRED_PAGES = ["index.html", "services.html", "pricing.html", "profile.html", "faq.html", "contact.html", "privacy.html", "blog/index.html", "404.html"]

def check_for_leaks():
    print("[1/4] APIキー・シークレット混入チェック...")
    patterns = [re.compile("api[-_]?key", re.I), re.compile("secret[-_]?token", re.I), re.compile(r"AIza[0-9A-Za-z-_]{35}"), re.compile(r"sk-[a-zA-Z0-9]{32,}")]
    for root, _, files in os.walk(BASE_DIR):
        if ".git" in root or "scripts" in root: continue
        for f in files:
            if f.endswith((".html", ".css", ".js", ".yml", ".json", ".md")):
                path = os.path.join(root, f)
                with open(path, "r", encoding="utf-8", errors="ignore") as fp:
                    content = fp.read().replace("API-Key-Free", "").replace("APIキー不要", "").replace("APIキー完全不使用", "").replace("APIキー", "")
                    for pat in patterns:
                        if pat.search(content):
                            print(f"  [ERROR] {path}")
                            return False
    print("  [PASS] APIキー・シークレット検出ゼロ")
    return True

def check_pages_and_meta():
    print("[2/4] 必須HTMLおよびメタタグ検証...")
    for page in REQUIRED_PAGES:
        path = os.path.join(BASE_DIR, page)
        if not os.path.isfile(path): return False
        with open(path, "r", encoding="utf-8") as fp:
            c = fp.read()
            if "<title>" not in c or (page != "404.html" and 'name="description"' not in c): return False
    print(f"  [PASS] 全 {len(REQUIRED_PAGES)} ページ確認完了")
    return True

def check_links():
    print("[3/4] 内部リンク整合性チェック...")
    q, sq = chr(34), chr(39)
    pat = re.compile('href=[' + q + sq + ']([^' + q + sq + r'\s]+)[' + q + sq + ']')
    for page in REQUIRED_PAGES:
        fpath = os.path.join(BASE_DIR, page)
        dpath = os.path.dirname(fpath)
        with open(fpath, "r", encoding="utf-8") as fp:
            for link in pat.findall(fp.read()):
                if link.startswith(("http://", "https://", "#", "mailto:", "tel:", "javascript:")): continue
                clean = link.split("#")[0].split("?")[0]
                if not clean: continue
                target = os.path.normpath(os.path.join(dpath, clean))
                if not os.path.exists(target):
                    print(f"  [ERROR] Broken link: {page} -> {link}")
                    return False
    print("  [PASS] 壊れた内部リンクなし")
    return True

def check_placeholders():
    print("[4/4] 仮設定項目検出レポート...")
    pat = re.compile(r"【[^】]*?(?:仮設定|要入力|氏名要入力|要設定)[^】]*?】")
    count = 0
    for page in REQUIRED_PAGES:
        with open(os.path.join(BASE_DIR, page), "r", encoding="utf-8") as fp:
            m = pat.findall(fp.read())
            count += len(m)
    print(f"  [INFO] 要入力プレースホルダー: {count} 箇所検出")
    return True

if __name__ == "__main__":
    if check_for_leaks() and check_pages_and_meta() and check_links() and check_placeholders():
        print("\n>>> [SUCCESS] 全検証合格")
        sys.exit(0)
    else:
        sys.exit(1)
