#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
寺沢景子税理士事務所 コラム自動生成ビルドスクリプト
ファイルパス: scripts/build_blog.py
仕様: APIキー完全不使用 / Python標準ライブラリのみで動作
"""

import os
import re
import html
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BLOG_CONTENT_DIR = ROOT_DIR / "content" / "blog"
BLOG_OUTPUT_DIR = ROOT_DIR / "blog"

def parse_markdown(filepath):
    """MarkdownファイルのFrontmatterと本文を解析"""
    content = filepath.read_text(encoding="utf-8")
    
    # YAML Frontmatterの抽出
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
    metadata = {}
    body = content
    
    if match:
        yaml_text, body = match.groups()
        for line in yaml_text.splitlines():
            if ":" in line:
                key, val = line.split(":", 1)
                metadata[key.strip()] = val.strip().strip('"').strip("'")
                
    # 本文の改行を段落<p>へ変換
    paragraphs = [p.strip() for p in body.strip().split("\n\n") if p.strip()]
    html_body = "".join(f"<p>{html.escape(p).replace(chr(10), '<br>')}</p>" for p in paragraphs)
    
    return {
        "title": metadata.get("title", filepath.stem),
        "date": metadata.get("date", "2026-10-31"),
        "category": metadata.get("category", "税務コラム"),
        "description": metadata.get("description", ""),
        "thumbnail": metadata.get("thumbnail", ""),
        "body_html": html_body,
        "filename": filepath.stem + ".html"
    }

def build_blog():
    print("=== コラム自動生成ビルド開始 ===")
    
    if not BLOG_CONTENT_DIR.exists():
        print(f"ディレクトリが見つかりません: {BLOG_CONTENT_DIR}")
        return

    md_files = list(BLOG_CONTENT_DIR.glob("*.md"))
    print(f"検知した記事数: {len(md_files)} 件")
    
    articles = [parse_markdown(f) for f in md_files]
    # 日付の新しい順にソート
    articles.sort(key=lambda x: str(x["date"]), reverse=True)
    
    # --- 1. 個別記事HTMLの生成 ---
    for art in articles:
        article_html = f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(art['title'])} | 寺沢景子税理士事務所</title>
  <meta name="description" content="{html.escape(art['description'])}">
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
  <header class="site-header">
    <div class="container header-container">
      <a href="../index.html" class="brand-logo">
        <span class="brand-name">寺沢景子税理士事務所</span>
      </a>
      <nav class="header-nav">
        <ul class="nav-list">
          <li><a href="../index.html" class="nav-link">ホーム</a></li>
          <li><a href="../services.html" class="nav-link">サービス案内</a></li>
          <li><a href="./index.html" class="nav-link is-active">税務コラム</a></li>
        </ul>
        <a href="../contact.html" class="header-cta-btn">無料相談を予約</a>
      </nav>
    </div>
  </header>

  <main class="container-narrow" style="padding-top: calc(var(--header-height) + 3.5rem); padding-bottom: 7rem;">
    <article>
      <div style="margin-bottom: 2rem;">
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-accent);">{html.escape(art['category'])}</span>
        <h1 style="font-family: var(--font-serif); font-size: 2rem; color: var(--color-primary); margin: 0.8rem 0 1rem; line-height: 1.4;">
          {html.escape(art['title'])}
        </h1>
        <p style="font-size: 0.85rem; color: var(--color-text-muted);">公開日: {html.escape(str(art['date']))} | 執筆: 寺沢景子税理士事務所</p>
      </div>

      <div style="font-size: 1rem; line-height: 2.1; color: var(--color-text-main); display: flex; flex-direction: column; gap: 1.5rem;">
        {art['body_html']}
      </div>

      <div style="margin-top: 4rem; text-align: center; border-top: 1px solid var(--color-border); padding-top: 2rem;">
        <a href="./index.html" class="header-cta-btn" style="background: var(--color-primary);">コラム一覧に戻る</a>
      </div>
    </article>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-bottom">
        <p>&copy; 2026 TERAZAWA TAX &amp; CONSULTING. All Rights Reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>
"""
        out_path = BLOG_OUTPUT_DIR / art["filename"]
        out_path.write_text(article_html, encoding="utf-8")
        print(f"  ✅ 個別記事HTML生成: {art['filename']}")

    # --- 2. 一覧ページ (blog/index.html) の生成 ---
    cards_html = ""
    for art in articles:
        cards_html += f"""
      <article style="background: var(--color-bg-card); border-radius: var(--radius-lg); border: 1px solid var(--color-border); overflow: hidden; box-shadow: var(--shadow-sm); display: flex; flex-direction: column;">
        <div style="aspect-ratio: 16/9; background: var(--color-bg-subtle); display: flex; align-items: center; justify-content: center;">
          <span style="font-family: var(--font-serif); font-size: 1.2rem; color: var(--color-accent); font-weight: 600;">{html.escape(art['category'])}</span>
        </div>
        <div style="padding: 1.8rem; display: flex; flex-direction: column; flex-grow: 1;">
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--color-accent); letter-spacing: 0.08em;">{html.escape(art['category'])}</span>
          <h2 style="font-size: 1.2rem; color: var(--color-primary); margin: 0.6rem 0 1rem; line-height: 1.5;">
            <a href="./{art['filename']}" style="color: inherit;">{html.escape(art['title'])}</a>
          </h2>
          <p style="font-size: 0.88rem; color: var(--color-text-sub); line-height: 1.7; margin-bottom: 1.2rem; flex-grow: 1;">
            {html.escape(art['description'][:90] + '...' if len(art['description']) > 90 else art['description'])}
          </p>
          <span style="font-size: 0.8rem; color: var(--color-text-muted);">{html.escape(str(art['date']))}</span>
        </div>
      </article>
"""

    index_html = f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>税務・経営コラム | 寺沢景子税理士事務所</title>
  <meta name="description" content="国税21年在職・元法人課税部門統括官の寺沢景子とベテラン税理士が発信する税務コラム。">
  <link rel="canonical" href="https://terazawazeirishi-blip.github.io/terazawazeirishi/blog/index.html">
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
  <header class="site-header" id="siteHeader">
    <div class="container header-container">
      <a href="../index.html" class="brand-logo">
        <span class="brand-name">寺沢景子税理士事務所</span>
      </a>
      <nav class="header-nav">
        <ul class="nav-list">
          <li><a href="../index.html" class="nav-link">ホーム</a></li>
          <li><a href="../services.html" class="nav-link">サービス案内</a></li>
          <li><a href="../pricing.html" class="nav-link">料金案内</a></li>
          <li><a href="../profile.html" class="nav-link">税理士紹介・概要</a></li>
          <li><a href="./index.html" class="nav-link is-active">税務コラム</a></li>
        </ul>
        <a href="../contact.html" class="header-cta-btn">無料相談を予約</a>
      </nav>
    </div>
  </header>

  <section class="athena-hero" style="min-height: 44vh; padding-top: calc(var(--header-height) + 2rem); padding-bottom: 2.5rem;">
    <div class="athena-hero-bg-text" aria-hidden="true">COLUMN</div>
    <div class="container" style="position: relative; z-index: 2; text-align: center;">
      <p class="hero-sub-en">TAX &amp; MANAGEMENT INSIGHTS</p>
      <h1 class="hero-main-title" style="margin-bottom: 1rem;">税務・経営コラム</h1>
      <p class="hero-lead-text">実務の現場と税務署の視点から、経営に直結する生きた税務情報をお届けします。</p>
    </div>
  </section>

  <main class="container" style="padding-top: 4rem; padding-bottom: 7rem;">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2.5rem;">
      {cards_html}
    </div>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-bottom">
        <p>&copy; 2026 TERAZAWA TAX &amp; CONSULTING. All Rights Reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>
"""
    (BLOG_OUTPUT_DIR / "index.html").write_text(index_html, encoding="utf-8")
    print("  ✅ コラム一覧HTML (blog/index.html) を最新化しました")
    print("=== コラム自動生成ビルド完了 ===")

if __name__ == "__main__":
    build_blog()
