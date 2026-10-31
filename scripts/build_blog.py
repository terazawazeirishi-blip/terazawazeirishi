#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
寺沢景子税理士事務所 コラム自動運搬・変換ビルドスクリプト
ファイルパス: scripts/build_blog.py
仕様: content/blog または contest/blog の記事を検知し、blog/index.html へ自動陳列
"""

import os
import re
import html
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BLOG_OUTPUT_DIR = ROOT_DIR / "blog"

# content/blog と contest/blog の両方を探す（どちらにあっても確実に拾う）
POSSIBLE_DIRS = [
    ROOT_DIR / "content" / "blog",
    ROOT_DIR / "contest" / "blog"
]

def parse_markdown(filepath):
    """Markdownから記事情報を抽出"""
    content = filepath.read_text(encoding="utf-8")
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
    metadata = {}
    body = content
    
    if match:
        yaml_text, body = match.groups()
        for line in yaml_text.splitlines():
            if ":" in line:
                key, val = line.split(":", 1)
                metadata[key.strip()] = val.strip().strip('"').strip("'")
                
    paragraphs = [p.strip() for p in body.strip().split("\n\n") if p.strip()]
    html_body = "".join(f"<p>{html.escape(p).replace(chr(10), '<br>')}</p>" for p in paragraphs)
    
    return {
        "title": metadata.get("title", filepath.stem),
        "date": metadata.get("date", "2026-10-31"),
        "category": metadata.get("category", "税務コラム"),
        "description": metadata.get("description", ""),
        "body_html": html_body,
        "filename": filepath.stem + ".html"
    }

def build():
    print("=== コラム自動運搬・陳列処理開始 ===")
    
    md_files = []
    for d in POSSIBLE_DIRS:
        if d.exists():
            found = list(d.glob("*.md"))
            print(f"フォルダ検知 [{d.name}]: {len(found)} 件の記事を発見")
            md_files.extend(found)
            
    if not md_files:
        print("記事ファイル（.md）が見つかりませんでした。")
        return

    articles = [parse_markdown(f) for f in md_files]
    articles.sort(key=lambda x: str(x["date"]), reverse=True)

    # 共通ヘッダー
    header_html = """
  <header class="site-header" id="siteHeader">
    <div class="container header-container">
      <a href="../index.html" class="brand-logo" aria-label="寺沢景子税理士事務所 ホーム">
        <svg class="brand-logo-img" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="22" cy="22" r="21" stroke="#A08C4A" stroke-width="1.5" stroke-dasharray="3 3"/>
          <path d="M22 6C14 14 12 24 22 36C32 24 30 14 22 6Z" fill="#1B2A4A" opacity="0.9"/>
          <path d="M16 20C18 26 22 30 22 36C22 30 26 26 28 20" stroke="#A08C4A" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <div class="brand-text">
          <span class="brand-name">寺沢景子税理士事務所</span>
          <span class="brand-en">TERAZAWA TAX &amp; CONSULTING</span>
        </div>
      </a>
      <nav class="header-nav" id="headerNav">
        <ul class="nav-list">
          <li><a href="../index.html" class="nav-link">ホーム</a></li>
          <li><a href="../services.html" class="nav-link">サービス案内</a></li>
          <li><a href="../pricing.html" class="nav-link">料金案内</a></li>
          <li><a href="../profile.html" class="nav-link">税理士紹介・概要</a></li>
          <li><a href="../faq.html" class="nav-link">よくある質問</a></li>
          <li><a href="./index.html" class="nav-link is-active">税務コラム</a></li>
        </ul>
        <a href="../contact.html" class="header-cta-btn">無料相談を予約</a>
      </nav>
    </div>
  </header>
"""

    # 共通フッター
    footer_html = """
  <footer class="site-footer">
    <div class="container">
      <div class="footer-top" style="display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 3rem; margin-bottom: 3.5rem;">
        <div>
          <div class="footer-brand-name" style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; color: #FFFFFF; letter-spacing: 0.08em; margin-bottom: 0.8rem;">
            寺沢景子税理士事務所
          </div>
          <p style="font-size: 0.72rem; letter-spacing: 0.16em; color: var(--color-accent-light); margin-bottom: 1.2rem; text-transform: uppercase;">
            TERAZAWA TAX &amp; CONSULTING
          </p>
          <address class="footer-address" style="font-style: normal; font-size: 0.88rem; line-height: 1.85; color: rgba(255, 255, 255, 0.75);">
            〒863-0023 熊本県天草市南町5-22<br>
            TEL: 0969-22-1166 / FAX: 0969-22-1167<br>
            南九州税理士会熊本県連 所属（第154978号）
          </address>
        </div>
        <div>
          <h4 class="footer-nav-title" style="font-family: var(--font-serif); font-size: 1rem; color: var(--color-accent-light); margin-bottom: 1.2rem;">サービス案内</h4>
          <ul class="footer-nav-list" style="display: flex; flex-direction: column; gap: 0.7rem; font-size: 0.88rem;">
            <li><a href="../services.html#corporate" class="footer-nav-link">・ 法人税務顧問・決算申告</a></li>
            <li><a href="../services.html#audit" class="footer-nav-link">・ 税務調査対策</a></li>
            <li><a href="../services.html#startup" class="footer-nav-link">・ 会社設立・創業支援</a></li>
            <li><a href="../services.html#cloud" class="footer-nav-link">・ クラウド会計導入DX</a></li>
            <li><a href="../services.html#inheritance" class="footer-nav-link">・ 相続税申告・事業承継</a></li>
          </ul>
        </div>
        <div>
          <h4 class="footer-nav-title" style="font-family: var(--font-serif); font-size: 1rem; color: var(--color-accent-light); margin-bottom: 1.2rem;">事務所案内</h4>
          <ul class="footer-nav-list" style="display: flex; flex-direction: column; gap: 0.7rem; font-size: 0.88rem;">
            <li><a href="../index.html" class="footer-nav-link">・ ホーム</a></li>
            <li><a href="../profile.html" class="footer-nav-link">・ 税理士紹介・事務所概要</a></li>
            <li><a href="../pricing.html" class="footer-nav-link">・ 料金案内</a></li>
            <li><a href="../faq.html" class="footer-nav-link">・ よくある質問</a></li>
            <li><a href="./index.html" class="footer-nav-link">・ 税務・経営コラム</a></li>
            <li><a href="../contact.html" class="footer-nav-link" style="color: var(--color-accent-light); font-weight: 600;">・ 無料相談・お問い合わせ</a></li>
          </ul>
        </div>
        <div>
          <h4 class="footer-nav-title" style="font-family: var(--font-serif); font-size: 1rem; color: var(--color-accent-light); margin-bottom: 1.2rem;">サイトマップ</h4>
          <ul class="footer-nav-list" style="display: flex; flex-direction: column; gap: 0.7rem; font-size: 0.88rem;">
            <li><a href="../sitemap.html" class="footer-nav-link">・ サイトマップ（全体一覧）</a></li>
            <li><a href="../privacy.html" class="footer-nav-link">・ 個人情報保護方針</a></li>
            <li><a href="../sitemap.xml" target="_blank" class="footer-nav-link" style="color: rgba(255,255,255,0.5);">・ XMLサイトマップ</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom" style="text-align: center; padding-top: 2rem; border-top: 1px solid rgba(255, 255, 255, 0.12); color: rgba(255, 255, 255, 0.5); font-size: 0.82rem;">
        <p>&copy; 2026 TERAZAWA TAX &amp; CONSULTING. All Rights Reserved.</p>
      </div>
    </div>
  </footer>
  <script src="../assets/js/main.js" defer></script>
"""

    # 1. 各記事の詳細ページHTMLを blog/ フォルダへ書き出し
    for art in articles:
        detail_html = f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(art['title'])} | 寺沢景子税理士事務所</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
  {header_html}
  <main class="container-narrow" style="padding-top: calc(var(--header-height) + 3.5rem); padding-bottom: 7rem;">
    <article>
      <div style="margin-bottom: 2rem;">
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-accent);">{html.escape(art['category'])}</span>
        <h1 style="font-family: var(--font-serif); font-size: 2rem; color: var(--color-primary); margin: 0.8rem 0 1rem; line-height: 1.4;">{html.escape(art['title'])}</h1>
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
  {footer_html}
</body>
</html>
"""
        (BLOG_OUTPUT_DIR / art["filename"]).write_text(detail_html, encoding="utf-8")
        print(f"  ✅ 記事生成: blog/{art['filename']}")

    # 2. 一覧ページ blog/index.html へ全記事カードを陳列
    cards_html = ""
    for art in articles:
        cards_html += f"""
      <article style="background: var(--color-bg-card); border-radius: var(--radius-lg); border: 1px solid var(--color-border); overflow: hidden; box-shadow: var(--shadow-sm); display: flex; flex-direction: column;">
        <div style="aspect-ratio: 16/9; background: var(--color-bg-subtle); display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--color-border);">
          <span style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--color-accent); font-weight: 600; letter-spacing: 0.1em;">{html.escape(art['category'])}</span>
        </div>
        <div style="padding: 1.8rem; display: flex; flex-direction: column; flex-grow: 1;">
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--color-accent); letter-spacing: 0.08em; margin-bottom: 0.4rem;">{html.escape(art['category'])}</span>
          <h2 style="font-size: 1.2rem; color: var(--color-primary); margin: 0 0 1rem; line-height: 1.5;">
            <a href="./{art['filename']}" style="color: inherit;">{html.escape(art['title'])}</a>
          </h2>
          <p style="font-size: 0.88rem; color: var(--color-text-sub); line-height: 1.7; margin-bottom: 1.2rem; flex-grow: 1;">
            {html.escape(art['description'][:95] + '...' if len(art['description']) > 95 else art['description'])}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
            <span style="font-size: 0.8rem; color: var(--color-text-muted);">{html.escape(str(art['date']))}</span>
            <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-accent);">読む &rarr;</span>
          </div>
        </div>
      </article>
"""

    index_html = f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>税務・経営コラム | 寺沢景子税理士事務所</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
  {header_html}
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
  {footer_html}
</body>
</html>
"""
    (BLOG_OUTPUT_DIR / "index.html").write_text(index_html, encoding="utf-8")
    print("  ✅ blog/index.html への陳列が完了しました！")

if __name__ == "__main__":
    build()
