#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TERAZAWA WEBSITE STUDIO - Static HTML SEO & JSON-LD Synchronizer
File: scripts/build_seo.py
Version: 3.0.0 (Athena Standard / Zero-Fail Engine)
"""

import os
import re
import json

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT_DIR = os.path.join(ROOT_DIR, "content")


def load_json(filename):
    path = os.path.join(CONTENT_DIR, filename)
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[WARN] Failed to load {filename}: {e}")
        return {}


def build_head_tags(page_key, seo_data, office_data, faq_data):
    pages = seo_data.get("pages", {})
    p = pages.get(page_key, {})
    site_name = seo_data.get("site_name", "寺澤景子税理士事務所")
    base_url = seo_data.get("base_url", "https://terazawazeirishi-blip.github.io/terazawazeirishi/").rstrip("/") + "/"
    default_img = seo_data.get("default_og_image", "assets/images/uploads/hero-bg-photo.svg")

    title = p.get("title", f"{site_name} | 熊本・天草の税理士")
    desc = p.get("description", "")
    canonical_url = base_url + p.get("file", "index.html")
    og_img_url = base_url + default_img
    og_type = p.get("og_type", "website")

    # メタタグブロック生成
    tags = [
        '  <meta charset="UTF-8">',
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
        f'  <title>{title}</title>',
        f'  <meta name="description" content="{desc}">',
        f'  <link rel="canonical" href="{canonical_url}">',
        '  <!-- Open Graph Protocol -->',
        f'  <meta property="og:site_name" content="{site_name}">',
        f'  <meta property="og:title" content="{title}">',
        f'  <meta property="og:description" content="{desc}">',
        f'  <meta property="og:url" content="{canonical_url}">',
        f'  <meta property="og:image" content="{og_img_url}">',
        f'  <meta property="og:type" content="{og_type}">',
        '  <meta property="og:locale" content="ja_JP">',
        '  <!-- Twitter Card -->',
        '  <meta name="twitter:card" content="summary_large_image">',
        f'  <meta name="twitter:title" content="{title}">',
        f'  <meta name="twitter:description" content="{desc}">',
        f'  <meta name="twitter:image" content="{og_img_url}">'
    ]

    # 構造化データ（JSON-LD）生成
    json_ld_blocks = []

    # 1. index.html 専用 AccountingService
    if page_key == "home":
        acc_ld = {
            "@context": "https://schema.org",
            "@type": "AccountingService",
            "@id": f"{base_url}#organization",
            "name": site_name,
            "alternateName": "TERAZAWA TAX & CONSULTING",
            "url": canonical_url,
            "logo": f"{base_url}assets/images/logo-athena-wing.svg",
            "image": og_img_url,
            "telephone": office_data.get("tel", "0969-22-1166"),
            "faxNumber": office_data.get("fax", "0969-22-1167"),
            "priceRange": "¥¥",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "南町5-22",
                "addressLocality": "天草市",
                "addressRegion": "熊本県",
                "postalCode": "863-0023",
                "addressCountry": "JP"
            },
            "employee": [
                {
                    "@type": "Person",
                    "name": "寺澤 景子",
                    "jobTitle": "代表税理士 / 元法人課税部門統括官",
                    "description": "国税・税務署21年在職。南九州税理士会 登録第154978号"
                },
                {
                    "@type": "Person",
                    "name": "田河 定茂",
                    "jobTitle": "副代表・顧問税理士",
                    "description": "税理士実務歴35年"
                }
            ],
            "sameAs": [
                office_data.get("partner_sr_url", "https://terazawa-sr.jbcsite.com/")
            ]
        }
        json_ld_blocks.append(acc_ld)

    # 2. faq.html 専用 FAQPage
    if page_key == "faq":
        faq_list = faq_data.get("faq_list", [])
        if faq_list:
            faq_entities = []
            for item in faq_list:
                faq_entities.append({
                    "@type": "Question",
                    "name": item.get("question", ""),
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": item.get("answer", "")
                    }
                })
            json_ld_blocks.append({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faq_entities
            })

    # 3. 下層ページ用 BreadcrumbList
    if page_key != "home":
        page_name_map = {
            "services": "提供サービス案内",
            "pricing": "料金案内",
            "profile": "税理士紹介・事務所概要",
            "faq": "よくある質問",
            "contact": "無料相談・お問い合わせ",
            "privacy": "個人情報保護方針",
            "blog": "税務コラム"
        }
        current_name = page_name_map.get(page_key, title.split("|")[0].strip())
        bread_ld = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "ホーム",
                    "item": f"{base_url}index.html"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": current_name,
                    "item": canonical_url
                }
            ]
        }
        json_ld_blocks.append(bread_ld)

    # JSON-LDタグの組み立て
    for ld in json_ld_blocks:
        ld_str = json.dumps(ld, ensure_ascii=False, indent=2)
        tags.append(f'  <script type="application/ld+json">\n{ld_str}\n  </script>')

    return "\n".join(tags)


def sync_html_file(file_path, new_meta_tags):
    if not os.path.exists(file_path):
        return
    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()

    # 既存の <head>〜</head> 間にある title, meta, canonical, OGP, JSON-LD を安全に置換
    # link rel="stylesheet" や 外部フォント等は保護
    head_match = re.search(r"<head>(.*?)</head>", html, re.DOTALL | re.IGNORECASE)
    if not head_match:
        return

    old_head = head_match.group(1)

    # スタイルシートやフォントタグを抽出して保護
    css_and_fonts = re.findall(r"(<link[^>]+(?:stylesheet|fonts\.googleapis|preconnect)[^>]*>|<style.*?</style>)", old_head, re.DOTALL | re.IGNORECASE)
    preserved_assets = "\n  " + "\n  ".join(css_and_fonts) if css_and_fonts else ""

    # 新しい <head> を構築
    new_head = f"<head>\n{new_meta_tags}{preserved_assets}\n</head>"
    new_html = html[:head_match.start()] + new_head + html[head_match.end():]

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_html)
    print(f"[OK] Synced SEO metadata in {os.path.basename(file_path)}")


def main():
    print("=== TERAZAWA Static SEO Builder Starting ===")
    seo_data = load_json("seo_meta.json")
    office_data = load_json("office_info.json")
    faq_data = load_json("faq.json")

    file_mapping = {
        "home": "index.html",
        "services": "services.html",
        "pricing": "pricing.html",
        "profile": "profile.html",
        "faq": "faq.html",
        "contact": "contact.html",
        "privacy": "privacy.html",
        "sitemap": "sitemap.html",
        "blog": "blog/index.html"
    }

    for key, filename in file_mapping.items():
        file_path = os.path.join(ROOT_DIR, filename)
        new_meta = build_head_tags(key, seo_data, office_data, faq_data)
        sync_html_file(file_path, new_meta)

    print("=== TERAZAWA Static SEO Builder Completed ===")


if __name__ == "__main__":
    main()
