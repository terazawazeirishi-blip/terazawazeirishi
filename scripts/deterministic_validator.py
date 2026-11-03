#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TERAZAWA WEBSITE STUDIO - Deterministic Quality & Security Validator
File: scripts/deterministic_validator.py
Version: 3.4.0 (Zero-Fail / Automated CI Quality Guard Edition)
"""

import os
import sys
import re
import json

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT_DIR = os.path.join(ROOT_DIR, "content")
ERRORS = []
WARNINGS = []


def log_error(category, filename, message):
    ERRORS.append(f"[{category}] {filename}: {message}")


def log_warn(category, filename, message):
    WARNINGS.append(f"[{category}] {filename}: {message}")


# 1. JSON構文および必須キー検査
def validate_json_files():
    print("--- [1/5] Validating JSON Schemas & Data Integrity ---")
    required_json = [
        "site_images.json", "office_info.json", "home_texts.json",
        "profile_texts.json", "services.json", "pricing.json",
        "faq.json", "legal_texts.json", "seo_meta.json"
    ]
    for rj in required_json:
        path = os.path.join(CONTENT_DIR, rj)
        if not os.path.exists(path):
            log_error("JSON_MISSING", rj, "Required JSON file does not exist.")
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if not isinstance(data, (dict, list)):
                log_error("JSON_FORMAT", rj, "Root must be an object or list.")
        except Exception as e:
            log_error("JSON_SYNTAX", rj, f"Invalid JSON syntax: {e}")

    # home_blocks.json の検証
    hb_path = os.path.join(CONTENT_DIR, "pages", "home_blocks.json")
    if os.path.exists(hb_path):
        try:
            with open(hb_path, "r", encoding="utf-8") as f:
                hb_data = json.load(f)
            if "blocks" not in hb_data or not isinstance(hb_data["blocks"], list):
                log_error("BLOCKS_SCHEMA", "home_blocks.json", "Missing 'blocks' array.")
        except Exception as e:
            log_error("JSON_SYNTAX", "home_blocks.json", f"Syntax error: {e}")


# 2. 全HTMLのリンク切れ（デッドリンク）検査
def validate_html_links():
    print("--- [2/5] Validating HTML Internal Links & Partner URLs ---")
    html_files = [f for f in os.listdir(ROOT_DIR) if f.endswith(".html")]

    for hf in html_files:
        path = os.path.join(ROOT_DIR, hf)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        # href 属性の抽出
        links = re.findall(r'href=["\'](.*?)["\']', content, re.IGNORECASE)
        for link in links:
            raw = link.strip()
            if not raw or raw.startswith("#") or raw.startswith("tel:") or raw.startswith("mailto:"):
                continue
            if raw.startswith("http://") or raw.startswith("https://"):
                continue

            # 相対パスの存在検証
            clean_link = raw.split("?")[0].split("#")[0].lstrip("./")
            target_path = os.path.join(ROOT_DIR, clean_link)
            if not os.path.exists(target_path):
                log_error("DEAD_LINK", hf, f"Broken link target: '{raw}' -> '{clean_link}' not found")

        # 提携先「ザワテラス社労士」リンクの維持検証
        if hf in ["index.html", "services.html", "profile.html", "privacy.html"]:
            if "terazawa-sr.jbcsite.com" not in content:
                log_warn("PARTNER_LINK", hf, "Partner link 'terazawa-sr.jbcsite.com' might be missing.")


# 3. 画像アセットの存在検査
def validate_image_assets():
    print("--- [3/5] Validating Image Assets & Uploads ---")
    img_json_path = os.path.join(CONTENT_DIR, "site_images.json")
    if os.path.exists(img_json_path):
        try:
            with open(img_json_path, "r", encoding="utf-8") as f:
                imgs = json.load(f)
            for key, raw_path in imgs.items():
                if not raw_path or not isinstance(raw_path, str):
                    continue
                clean = raw_path.strip().lstrip("./").replace("terazawazeirishi/", "")
                real_file = os.path.join(ROOT_DIR, clean)
                # SVGインラインや外部URLでない場合の実体存在確認
                if not raw_path.startswith("data:") and not raw_path.startswith("http"):
                    if not os.path.exists(real_file):
                        log_warn("IMAGE_MISSING", key, f"Referenced image file not found on disk: {clean}")
        except Exception as e:
            log_error("IMG_CHECK_FAIL", "site_images.json", str(e))


# 4. セキュリティ・XSS検査
def validate_security():
    print("--- [4/5] Auditing Security & Dangerous Script Injections ---")
    for root, dirs, files in os.walk(CONTENT_DIR):
        for f in files:
            if f.endswith(".json"):
                fpath = os.path.join(root, f)
                with open(fpath, "r", encoding="utf-8") as jf:
                    text = jf.read()
                # 危険なスクリプトタグやjavascript:スキームの検出
                if re.search(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', text, re.IGNORECASE):
                    log_error("XSS_ALERT", f, "Detected forbidden <script> tag in content JSON!")
                if re.search(r'href\s*=\s*["\']javascript:', text, re.IGNORECASE):
                    log_error("XSS_ALERT", f, "Detected forbidden 'javascript:' URI in content JSON!")


# 5. SEOメタタグおよび構造化データ検査
def validate_seo_compliance():
    print("--- [5/5] Auditing SEO Meta Tags & Schema.org JSON-LD ---")
    index_path = os.path.join(ROOT_DIR, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            idx_html = f.read()
        if '<link rel="canonical"' not in idx_html:
            log_error("SEO_MISSING", "index.html", "Missing canonical URL link tag.")
        if 'property="og:title"' not in idx_html:
            log_error("SEO_MISSING", "index.html", "Missing OGP title meta tag.")
        if '"@type": "AccountingService"' not in idx_html and '"@type":"AccountingService"' not in idx_html:
            log_error("JSONLD_MISSING", "index.html", "Missing Schema.org AccountingService JSON-LD.")

    faq_path = os.path.join(ROOT_DIR, "faq.html")
    if os.path.exists(faq_path):
        with open(faq_path, "r", encoding="utf-8") as f:
            faq_html = f.read()
        if '"@type": "FAQPage"' not in faq_html and '"@type":"FAQPage"' not in faq_html:
            log_warn("JSONLD_MISSING", "faq.html", "Missing Schema.org FAQPage JSON-LD.")


def main():
    print("==================================================")
    print(" TERAZAWA STUDIO - Deterministic Quality Validator")
    print("==================================================")
    validate_json_files()
    validate_html_links()
    validate_image_assets()
    validate_security()
    validate_seo_compliance()

    print("\n=== Validation Results ===")
    if WARNINGS:
        print(f"[!] {len(WARNINGS)} Warning(s) detected:")
        for w in WARNINGS:
            print("   " + w)

    if ERRORS:
        print(f"\n[X] CRITICAL FAIL: {len(ERRORS)} Error(s) detected!")
        for e in ERRORS:
            print("   " + e)
        print("\nDeployment aborted to protect production stability. Please fix above errors.")
        sys.exit(1)
    else:
        print("\n[OK] ALL INTEGRITY CHECKS PASSED. Clean to deploy!")
        sys.exit(0)


if __name__ == "__main__":
    main()
