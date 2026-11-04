#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TERAZAWA WEBSITE STUDIO - Deterministic Blog Synchronizer
File: scripts/build_blog.py
Version: 3.5.0 (Clean Auto-Purge & Athena Standard Complete)
"""

import os
import re
import html

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG_DIR = os.path.join(ROOT_DIR, "blog")

COMMON_HEAD = """<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} | 寺澤景子税理士事務所</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="https://terazawazeirishi-blip.github.io/terazawazeirishi/blog/{slug}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Noto+Serif+JP:wght@300;400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a href="../index.html" class="site-logo">
        <span class="logo-main">寺澤景子税理士事務所</span>
        <span class="logo-sub">TERAZAWA TAX & CONSULTING</span>
      </a>
      <nav class="site-nav">
        <ul class="nav-list">
          <li><a href="../index.html">ホーム</a></li>
          <li><a href="../services.html">サービス案内</a></li>
          <li><a href="../pricing.html">料金案内</a></li>
          <li><a href="../profile.html">税理士紹介・概要</a></li>
          <li><a href="../faq.html">よくある質問</a></li>
          <li><a href="./index.html" class="is-current">税務コラム</a></li>
        </ul>
        <a href="../contact.html" class="btn btn-gold nav-cta-btn">無料相談を予約</a>
      </nav>
    </div>
  </header>
  <main class="site-main">
"""

COMMON_FOOTER = """  </main>
  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-col footer-info">
        <div class="footer-logo">
          <span class="logo-main">寺澤景子税理士事務所</span>
          <span class="logo-sub">TERAZAWA TAX & CONSULTING</span>
        </div>
        <p class="footer-address">〒863-0023 熊本県天草市南町5-22</p>
        <p class="footer-tel">TEL: 0969-22-1166</p>
      </div>
      <div class="footer-col">
        <h4 class="footer-col-title">メニュー</h4>
        <ul class="footer-links">
          <li><a href="../index.html">ホーム</a></li>
          <li><a href="../services.html">サービス一覧</a></li>
          <li><a href="../pricing.html">料金案内</a></li>
          <li><a href="./index.html">税務・経営コラム</a></li>
          <li><a href="https://terazawa-sr.jbcsite.com/" target="_blank" rel="noopener noreferrer">提携：ザワテラス社労士 →</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom text-center">
      <p class="copyright">© TERAZAWA KEIKO TAX ACCOUNTING OFFICE. All Rights Reserved.</p>
    </div>
  </footer>
</body>
</html>
"""


def parse_frontmatter(content):
    meta = {}
    body = content
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            fm_text = parts[1]
            body = parts[2].strip()
            for line in fm_text.splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    meta[k.strip()] = v.strip().strip('"').strip("'")
    return meta, body


def markdown_to_html(md_text):
    # 簡易Markdown変換（見出し・段落・リスト）
    lines = md_text.splitlines()
    html_lines = []
    in_list = False
    for line in lines:
        line_s = line.strip()
        if line_s.startswith("### "):
            if in_list: html_lines.append("</ul>"); in_list = False
            html_lines.append(f"<h3>{html.escape(line_s[4:])}</h3>")
        elif line_s.startswith("## "):
            if in_list: html_lines.append("</ul>"); in_list = False
            html_lines.append(f"<h2>{html.escape(line_s[3:])}</h2>")
        elif line_s.startswith("- "):
            if not in_list: html_lines.append("<ul>"); in_list = True
            html_lines.append(f"<li>{html.escape(line_s[2:])}</li>")
        elif line_s:
            if in_list: html_lines.append("</ul>"); in_list = False
            html_lines.append(f"<p>{html.escape(line_s)}</p>")
        else:
            if in_list: html_lines.append("</ul>"); in_list = False
    if in_list:
        html_lines.append("</ul>")
    return "\n".join(html_lines)


def build():
    if not os.path.exists(BLOG_DIR):
        return

    # 1. 存在する .md ファイルの収集
    md_files = [f for f in os.listdir(BLOG_DIR) if f.endswith(".md")]
    active_slugs = set()
    posts = []

    for mf in md_files:
        slug = os.path.splitext(mf)[0]
        active_slugs.add(slug)
        file_path = os.path.join(BLOG_DIR, mf)
        with open(file_path, "r", encoding="utf-8") as f:
            meta, body = parse_frontmatter(f.read())

        post = {
            "slug": slug,
            "title": meta.get("title", slug),
            "date": meta.get("date", "2026-11-04"),
            "category": meta.get("category", "税務コラム"),
            "thumbnail": meta.get("thumbnail", "assets/images/uploads/about_01.webp"),
            "body": body
        }
        posts.append(post)

        # 詳細記事HTMLの生成
        article_html = markdown_to_html(body)
        thumb_url = "../" + post["thumbnail"].lstrip("./")
        head = COMMON_HEAD.format(title=post["title"], description=post["title"], slug=slug)
        content_block = f"""
    <section class="section-padding">
      <div class="container" style="max-width: 800px; margin: 0 auto;">
        <span class="news-bar-label">{post["category"]}</span>
        <span style="font-size: 13px; color: #909399; margin-left: 10px;">{post["date"]}</span>
        <h1 style="font-size: 26px; color: #1b2a4a; margin: 16px 0 24px;">{post["title"]}</h1>
        <div style="margin-bottom: 30px;"><img src="{thumb_url}" alt="{post["title"]}" style="width: 100%; border-radius: 8px;"></div>
        <div class="blog-body" style="font-size: 15px; line-height: 1.8; color: #2c3e50;">{article_html}</div>
        <div style="margin-top: 40px; text-align: center;"><a href="./index.html" class="btn btn-outline">← コラム一覧へ戻る</a></div>
      </div>
    </section>
"""
        with open(os.path.join(BLOG_DIR, f"{slug}.html"), "w", encoding="utf-8") as f:
            f.write(head + content_block + COMMON_FOOTER)

    # 2. 【最重要】存在しない .md に対応する過去の不要な .html を物理削除
    for hf in os.listdir(BLOG_DIR):
        if hf.endswith(".html") and hf != "index.html":
            h_slug = os.path.splitext(hf)[0]
            if h_slug not in active_slugs:
                os.remove(os.path.join(BLOG_DIR, hf))
                print(f"[PURGE] Deleted obsolete article: {hf}")

    # 3. コラム一覧（blog/index.html）の完全再生成
    posts.sort(key=lambda x: x["date"], reverse=True)
    cards_html = []
    for p in posts:
        thumb_url = "../" + p["thumbnail"].lstrip("./")
        cards_html.append(f"""
          <article class="service-card-item" style="background: #fff; border: 1px solid #ebeef5; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <div style="height: 180px; overflow: hidden;"><img src="{thumb_url}" alt="{p["title"]}" style="width: 100%; height: 100%; object-fit: cover;"></div>
            <div style="padding: 16px;">
              <span style="font-size: 11px; color: #a08c4a; font-weight: 700;">{p["category"]}</span>
              <span style="font-size: 11px; color: #909399; margin-left: 8px;">{p["date"]}</span>
              <h3 style="font-size: 16px; margin: 8px 0; color: #1b2a4a;"><a href="./{p["slug"]}.html" style="text-decoration: none; color: inherit;">{p["title"]}</a></h3>
              <a href="./{p["slug"]}.html" class="btn btn-outline" style="font-size: 12px; padding: 4px 10px; margin-top: 10px; display: inline-block;">記事を読む →</a>
            </div>
          </article>
""")

    grid_content = "\n".join(cards_html) if cards_html else '<p style="text-align: center; color: #909399; padding: 40px;">現在公開中のコラムはありません。</p>'
    index_head = COMMON_HEAD.format(title="税務・経営コラム一覧", description="寺澤景子税理士事務所の税務コラム一覧", slug="index")
    index_body = f"""
    <section class="section-padding">
      <div class="container">
        <div class="section-header text-center">
          <span class="section-sub">COLUMN & INSIGHTS</span>
          <h2 class="section-title">税務・経営コラム</h2>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-top: 30px;">
          {grid_content}
        </div>
      </div>
    </section>
"""
    with open(os.path.join(BLOG_DIR, "index.html"), "w", encoding="utf-8") as f:
        f.write(index_head + index_body + COMMON_FOOTER)
    print("[OK] Blog index and active articles regenerated successfully.")


if __name__ == "__main__":
    build()
