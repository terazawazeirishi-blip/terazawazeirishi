#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
寺沢景子税理士事務所 コラム自動生成ビルドスクリプト（モバイルメニュー完全対応・削除自動同期版）
ファイルパス: scripts/build_blog.py
仕様: コラムヘッダーにハンバーガーボタンを完全装備、記事削除時の自動クリーンアップ完全対応
"""

import os
import re
import html
import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BLOG_DIR = ROOT_DIR / "blog"
NEWS_DIR = ROOT_DIR / "content" / "news"
INDEX_HTML_PATH = ROOT_DIR / "index.html"
BLOG_SETTINGS_PATH = ROOT_DIR / "content" / "blog_settings.json"

def format_image_path(raw_path):
    if not raw_path:
        return ""
    p = raw_path.strip().strip('"').strip("'")
    if not p:
        return ""
    if p.startswith("http://") or p.startswith("https://") or p.startswith("../"):
        return p
    p = re.sub(r"^(\./|/)", "", p)
    return f"../{p}"

def parse_markdown(filepath):
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
                
    def replace_md_img(m):
        alt_text = html.escape(m.group(1))
        img_url = format_image_path(m.group(2))
        return f'<img src="{img_url}" alt="{alt_text}" style="max-width:100%; height:auto; border-radius:8px; margin: 1.2rem 0;">'

    paragraphs = [p.strip() for p in body.strip().split("\n\n") if p.strip()]
    html_paragraphs = []
    for p in paragraphs:
        escaped_p = html.escape(p)
        escaped_p = re.sub(r"!\[(.*?)\]\((.*?)\)", replace_md_img, escaped_p)
        escaped_p = escaped_p.replace("\n", "<br>")
        html_paragraphs.append(f"<p>{escaped_p}</p>")
        
    html_body = "".join(html_paragraphs)
    
    safe_slug = re.sub(r"[^\w\-]", "-", filepath.stem).strip("-")
    if not safe_slug:
        safe_slug = "article"
    
    return {
        "title": metadata.get("title", filepath.stem),
        "date": metadata.get("date", "2026-10-31"),
        "category": metadata.get("category", "税務コラム"),
        "description": metadata.get("description", ""),
        "thumbnail": format_image_path(metadata.get("thumbnail", "")),
        "body_html": html_body,
        "raw_body": body.strip(),
        "filename": safe_slug + ".html"
    }


def load_blog_settings():
    """Load editable copy for the generated blog index page."""
    try:
        data = json.loads(BLOG_SETTINGS_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        print("  ⚠️ コラム一覧設定を読み込めないため、既定の表示文を使用します。")
        return {}


def load_office_info():
    """Load shared office details used by generated blog pages."""
    try:
        data = json.loads((ROOT_DIR / "content" / "office_info.json").read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        print("  ⚠️ 事務所情報を読み込めないため、既定の表示を使用します。")
        return {}

def build_blog():
    print("=== コラム自動生成処理（ハンバーガーボタン完備・自動削除同期）開始 ===")
    if not BLOG_DIR.exists():
        return
    settings = load_blog_settings()
    page_title = str(settings.get("page_title") or "税務・経営コラム")
    page_subtitle = str(settings.get("page_subtitle") or "TAX & MANAGEMENT INSIGHTS")
    hero_description = str(settings.get("hero_description") or "実務の現場と税務署の視点から、経営に直結する生きた税務情報をお届けします。")
    empty_title = str(settings.get("empty_title") or "現在公開中のコラムはありません。")
    empty_description = str(settings.get("empty_description") or "新しい記事が投稿されるまでお待ちください。")
    office = load_office_info()
    office_name = html.escape(str(office.get("office_name") or "寺澤景子税理士事務所"))
    english_name = html.escape(str(office.get("english_name") or "TERAZAWA TAX & CONSULTING"))
    postal_code = html.escape(str(office.get("postal_code") or "〒863-0023"))
    address = html.escape(str(office.get("address") or "熊本県天草市南町5-22"))
    tel = str(office.get("tel") or "0969-22-1166")
    fax = html.escape(str(office.get("fax") or "0969-22-1167"))
    affiliation = html.escape(str(office.get("affiliation") or "南九州税理士会 熊本県連 所属 / 税理士登録番号：第154978号"))
    partner_name = html.escape(str(office.get("partner_sr_name") or "ザワテラス社労士"))
    partner_url_raw = str(office.get("partner_sr_url") or "https://terazawa-sr.jbcsite.com/").strip()
    partner_url = html.escape(partner_url_raw if partner_url_raw.startswith("https://") else "https://terazawa-sr.jbcsite.com/", quote=True)
    team_description = html.escape(str(office.get("team_description") or "税理士2名体制"))
    copyright_text = html.escape(str(office.get("copyright_text") or "© TERAZAWA KEIKO TAX ACCOUNTING OFFICE. All Rights Reserved."))
    md_files = list(BLOG_DIR.glob("*.md"))
    
    # 存在する .md ファイルから記事オブジェクトを生成
    articles = [parse_markdown(f) for f in md_files] if md_files else []
    articles.sort(key=lambda x: str(x["date"]), reverse=True)

    # 現在存在する記事のファイル名一覧
    active_html_files = {art["filename"] for art in articles}

    # ★【新設】削除された記事の古いHTMLファイルを自動検知して完全に消去（クリーンアップ）
    for old_file in BLOG_DIR.glob("*.html"):
        if old_file.name != "index.html" and old_file.name not in active_html_files:
            try:
                old_file.unlink()
                print(f"  🗑️ 削除された記事HTMLを自動消去: {old_file.name}")
            except Exception as e:
                print(f"  ⚠️ 古いHTMLの消去に失敗: {e}")

    # ★ ハンバーガーボタン（hamburger-btn）を確実に配備（原本100%維持）
    header_html = f"""
  <header class="site-header" id="siteHeader">
    <div class="container header-container">
      <a href="../index.html" class="brand-logo" aria-label="{office_name} ホーム">
        <svg class="brand-logo-img" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="22" cy="22" r="21" stroke="#A08C4A" stroke-width="1.5" stroke-dasharray="3 3"/>
          <path d="M22 6C14 14 12 24 22 36C32 24 30 14 22 6Z" fill="#1B2A4A" opacity="0.9"/>
          <path d="M16 20C18 26 22 30 22 36C22 30 26 26 28 20" stroke="#A08C4A" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <div class="brand-text">
          <span class="brand-name">{office_name}</span>
          <span class="brand-en">{english_name}</span>
        </div>
      </a>

      <!-- ★ スマホ用3本線ハンバーガーボタン完全配備 -->
      <button class="hamburger-btn" id="hamburgerBtn" aria-label="メニューを開閉する" aria-expanded="false">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>

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

    footer_html = f"""
  <footer class="site-footer">
    <div class="container">
      <div class="footer-top">
        <div>
          <div class="footer-brand-name" style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; color: #FFFFFF; letter-spacing: 0.08em; margin-bottom: 0.8rem;">
            {office_name}
          </div>
          <p style="font-size: 0.72rem; letter-spacing: 0.16em; color: var(--color-accent-light); margin-bottom: 1.2rem; text-transform: uppercase;">
            {english_name}
          </p>
          <address class="footer-address" style="font-style: normal; font-size: 0.88rem; line-height: 1.85; color: rgba(255, 255, 255, 0.75);">
            {postal_code} {address}<br>
            TEL: {html.escape(tel)} / FAX: {fax}<br>
            {affiliation}
          </address>
          <p style="font-size: 0.82rem; color: rgba(255, 255, 255, 0.65); margin-top: 0.8rem;">
            提携士業：<a href="{partner_url}" target="_blank" rel="noopener noreferrer" style="color: var(--color-accent-light); text-decoration: underline;">{partner_name}</a>
          </p>
          <p style="font-size: 0.78rem; color: rgba(255, 255, 255, 0.5); margin-top: 4px;">
            {team_description}
          </p>
        </div>
        <div>
          <h4 class="footer-nav-title" style="font-family: var(--font-serif); font-size: 1rem; color: var(--color-accent-light); margin-bottom: 1.2rem;">サービス案内</h4>
          <ul class="footer-nav-list">
            <li><a href="../services.html#service-01" class="footer-nav-link">・ 法人税務顧問・決算申告</a></li>
            <li><a href="../services.html#service-02" class="footer-nav-link">・ 税務調査対策</a></li>
            <li><a href="../services.html#service-03" class="footer-nav-link">・ 会社設立・創業支援</a></li>
            <li><a href="../services.html#service-05" class="footer-nav-link">・ クラウド会計導入DX</a></li>
            <li><a href="../services.html#service-06" class="footer-nav-link">・ 相続税申告・事業承継</a></li>
          </ul>
        </div>
        <div>
          <h4 class="footer-nav-title" style="font-family: var(--font-serif); font-size: 1rem; color: var(--color-accent-light); margin-bottom: 1.2rem;">事務所案内</h4>
          <ul class="footer-nav-list">
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
          <ul class="footer-nav-list">
            <li><a href="../sitemap.html" class="footer-nav-link">・ サイトマップ（全体一覧）</a></li>
            <li><a href="../privacy.html" class="footer-nav-link">・ 個人情報保護方針</a></li>
            <li><a href="../sitemap.xml" target="_blank" class="footer-nav-link" style="color: rgba(255,255,255,0.5);">・ XMLサイトマップ</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom" style="text-align: center; padding-top: 2rem; border-top: 1px solid rgba(255, 255, 255, 0.12); color: rgba(255, 255, 255, 0.5); font-size: 0.82rem;">
        <p>{copyright_text}</p>
      </div>
    </div>
  </footer>
  <script src="../assets/js/main.js" defer></script>
"""

    # 各記事詳細HTMLの書き出し
    for art in articles:
        detail_thumb_html = ""
        if art["thumbnail"]:
            detail_thumb_html = f"""
      <div style="margin-bottom: 2.5rem; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm);">
        <img src="{art['thumbnail']}" alt="{html.escape(art['title'])}" style="width: 100%; max-height: 460px; object-fit: cover; display: block;">
      </div>
"""
        detail_html = f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(art['title'])} | {office_name}</title>
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
        <p style="font-size: 0.85rem; color: var(--color-text-muted);">公開日: {html.escape(str(art['date']))} | 執筆: {office_name}</p>
      </div>
      {detail_thumb_html}
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
        (BLOG_DIR / art["filename"]).write_text(detail_html, encoding="utf-8")

    # 記事一覧カードHTMLの組み立て
    cards_html = ""
    if articles:
        for art in articles:
            if art["thumbnail"]:
                thumb_box = f"""
        <a href="./{art['filename']}" style="aspect-ratio: 16/9; overflow: hidden; display: block; border-bottom: 1px solid var(--color-border); background: var(--color-bg-subtle);">
          <img src="{art['thumbnail']}" alt="{html.escape(art['title'])}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;">
        </a>"""
            else:
                thumb_box = f"""
        <a href="./{art['filename']}" style="aspect-ratio: 16/9; background: var(--color-bg-subtle); display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--color-border);">
          <span style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--color-accent); font-weight: 600; letter-spacing: 0.1em;">{html.escape(art['category'])}</span>
        </a>"""

            cards_html += f"""
      <article style="background: var(--color-bg-card); border-radius: var(--radius-lg); border: 1px solid var(--color-border); overflow: hidden; box-shadow: var(--shadow-sm); display: flex; flex-direction: column;">
        {thumb_box}
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
            <a href="./{art['filename']}" style="font-size: 0.85rem; font-weight: 600; color: var(--color-accent);">読む &rarr;</a>
          </div>
        </div>
      </article>
"""
    else:
        # ★【新設】記事が0件のときに表示するクリーンな空表示
        cards_html = f"""
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--color-text-muted);">
        <p style="font-family: var(--font-serif); font-size: 1.15rem; margin-bottom: 0.8rem; color: var(--color-primary);">{html.escape(empty_title)}</p>
        <p style="font-size: 0.88rem;">{html.escape(empty_description)}</p>
      </div>
"""

    index_html = f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(page_title)} | 寺澤景子税理士事務所</title>
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
      <p class="hero-sub-en">{html.escape(page_subtitle)}</p>
      <h1 class="hero-main-title" style="margin-bottom: 1rem;">{html.escape(page_title)}</h1>
      <p class="hero-lead-text">{html.escape(hero_description)}</p>
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
    (BLOG_DIR / "index.html").write_text(index_html, encoding="utf-8")
    print("  ✅ blog/index.html (ハンバーガーボタン完備・自動削除同期) 出力完了")

def build_news():
    if not NEWS_DIR.exists() or not INDEX_HTML_PATH.exists():
        return
    md_files = list(NEWS_DIR.glob("*.md"))
    if not md_files:
        return
    news_items = [parse_markdown(f) for f in md_files]
    news_items.sort(key=lambda x: str(x["date"]), reverse=True)
    latest_news = news_items[:3]

    news_list_html = ""
    for idx, item in enumerate(latest_news):
        news_list_html += f"""
            <div class="news-item">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.4rem; flex-wrap: wrap;">
                <span style="font-size: 0.82rem; color: var(--color-text-muted);">{html.escape(str(item['date']))}</span>
                <span style="font-size: 0.72rem; font-weight: 700; color: var(--color-accent); background: var(--color-accent-soft); padding: 2px 8px; border-radius: var(--radius-sm);">お知らせ</span>
              </div>
              <div style="font-size: 1rem; font-weight: 600; color: var(--color-primary); line-height: 1.5; margin-bottom: 0.4rem;">
                {html.escape(item['title'])}
              </div>
              <div style="font-size: 0.88rem; color: var(--color-text-sub); line-height: 1.7;">
                {item['body_html']}
              </div>
            </div>
"""
    replacement = f"""<!-- NEWS_START -->
          <div class="news-items-wrapper">
            {news_list_html}
          </div>
          <!-- NEWS_END -->"""

    index_content = INDEX_HTML_PATH.read_text(encoding="utf-8")
    pattern = r"<!-- NEWS_START -->.*?<!-- NEWS_END -->"
    if re.search(pattern, index_content, re.DOTALL):
        updated_index = re.sub(pattern, replacement, index_content, flags=re.DOTALL)
        INDEX_HTML_PATH.write_text(updated_index, encoding="utf-8")
        print("  ✅ index.html のお知らせ枠を自動更新しました")

if __name__ == "__main__":
    build_blog()
    build_news()
