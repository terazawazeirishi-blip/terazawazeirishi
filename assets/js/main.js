/**
 * TERAZAWA WEBSITE STUDIO - Public Rendering & CMS Sync Engine
 * Version: 3.0.0 (Phase 1 Complete - Zero-Fail & XSS-Safe Edition)
 */
(function () {
  'use strict';

  /* ==========================================================================
   * 1. パス解決エンジン (GitHub Pages サブディレクトリ /terazawazeirishi/ 対応)
   * ========================================================================== */
  const pathname = window.location.pathname;
  const isSubDirBlog = pathname.indexOf('/blog/') !== -1;
  const repoBase = isSubDirBlog ? '../' : './';

  function resolveUrl(rawPath) {
    if (!rawPath || typeof rawPath !== 'string') return '';
    const trimmed = rawPath.trim();
    if (/^(javascript|data|vbscript):/i.test(trimmed)) return '#';
    if (/^(https?:|mailto:|tel:|#)/i.test(trimmed)) return trimmed;
    const clean = trimmed.replace(/^(\.\/|\/)+/, '');
    if (clean.startsWith('terazawazeirishi/')) {
      return repoBase + clean.replace(/^terazawazeirishi\//, '');
    }
    return repoBase + clean;
  }

  function resolveImgUrl(rawPath) {
    return resolveUrl(rawPath);
  }

  /* ==========================================================================
   * 2. エラー診断・ロギング機構 (問題E解決: 無言catchの廃止)
   * ========================================================================== */
  const cmsDiagnostics = [];
  const isDebugMode = new URLSearchParams(window.location.search).get('cms_debug') === '1';

  function reportCmsIssue(source, errorType, detail) {
    const entry = {
      timestamp: new Date().toISOString(),
      source: source,
      errorType: errorType,
      detail: String(detail)
    };
    cmsDiagnostics.push(entry);
    console.warn('[TERAZAWA CMS Sync Notice]', entry);
    if (isDebugMode) renderDebugBanner();
  }

  function renderDebugBanner() {
    let banner = document.getElementById('terazawa-cms-debug-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'terazawa-cms-debug-banner';
      banner.style.cssText = 'position:fixed;bottom:10px;left:10px;z-index:9999;background:#1b2a4a;color:#fff;padding:12px 16px;border-radius:6px;font-size:12px;max-width:420px;box-shadow:0 4px 12px rgba(0,0,0,0.3);border-left:4px solid #a08c4a;';
      document.body.appendChild(banner);
    }
    banner.textContent = 'CMS診断モード: 検知イベント ' + cmsDiagnostics.length + '件 (詳細はConsoleを確認)';
  }

  async function fetchCmsJson(fileName) {
    const url = resolveUrl('content/' + fileName) + '?v=' + Date.now();
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        if (response.status !== 404) {
          reportCmsIssue(fileName, 'HTTP_ERROR', 'Status: ' + response.status);
        }
        return null;
      }
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (parseErr) {
        reportCmsIssue(fileName, 'JSON_PARSE_ERROR', parseErr.message);
        return null;
      }
    } catch (netErr) {
      reportCmsIssue(fileName, 'NETWORK_ERROR', netErr.message);
      return null;
    }
  }

  /* ==========================================================================
   * 3. XSS安全DOM操作ユーティリティ (問題D解決: innerHTML直接挿入の排除)
   * ========================================================================== */
  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = String(text);
    return el;
  }

  function setTextSafe(selectorOrEl, value) {
    if (value === undefined || value === null || value === '') return;
    const targets = typeof selectorOrEl === 'string'
      ? document.querySelectorAll(selectorOrEl)
      : [selectorOrEl];
    targets.forEach(function (el) {
      if (el) el.textContent = String(value);
    });
  }

  function setOrHide(selectorOrEl, value) {
    const targets = typeof selectorOrEl === 'string'
      ? document.querySelectorAll(selectorOrEl)
      : [selectorOrEl];
    targets.forEach(function (el) {
      if (!el) return;
      if (value === undefined || value === null || String(value).trim() === '') {
        el.style.display = 'none';
      } else {
        el.style.display = '';
        el.textContent = String(value);
      }
    });
  }

  /* ==========================================================================
   * 4. CMSデータ同期関数群 (既存8関数の完全互換＆動的拡張)
   * ========================================================================== */
  let cachedImages = null;

  // (1) 全17画像スロットの同期
  async function syncCmsImages() {
    const data = await fetchCmsJson('site_images.json');
    if (!data) return null;
    cachedImages = data;

    Object.keys(data).forEach(function (key) {
      const rawVal = data[key];
      if (!rawVal || typeof rawVal !== 'string') return;
      const imgUrl = resolveImgUrl(rawVal);

      // data-cms-img 属性を持つ要素の自動置換
      document.querySelectorAll('[data-cms-img="' + key + '"]').forEach(function (el) {
        if (el.tagName === 'IMG') {
          el.src = imgUrl;
        } else {
          el.style.backgroundImage = 'url("' + imgUrl + '")';
        }
      });
    });

    // 代表写真・象徴イラスト等の個別セレクタフォールバック反映
    const slotMap = {
      logo_img: '.site-logo img, .footer-logo img',
      hero_illustration: '.hero-bg-artwork-wrap img, .athena-hero-art img',
      rep_keiko: '[data-rep-photo="keiko"] img, .rep-photo-keiko img',
      rep_senior: '[data-rep-photo="senior"] img, .rep-photo-senior img',
      about_01: '[data-about-img="01"] img',
      about_02: '[data-about-img="02"] img',
      about_03: '[data-about-img="03"] img',
      about_04: '[data-about-img="04"] img',
      about_05: '[data-about-img="05"] img'
    };

    Object.keys(slotMap).forEach(function (k) {
      if (data[k]) {
        const resolved = resolveImgUrl(data[k]);
        document.querySelectorAll(slotMap[k]).forEach(function (img) {
          img.src = resolved;
        });
      }
    });

    // services.html 内のカード画像更新 (問題7.18恒久対策)
    for (let i = 1; i <= 12; i++) {
      const k = 'service_' + (i < 10 ? '0' + i : i);
      if (data[k]) {
        const imgUrl = resolveImgUrl(data[k]);
        document.querySelectorAll('[data-service-img="' + k + '"] img').forEach(function (img) {
          img.src = imgUrl;
        });
      }
    }
    return data;
  }

  // (2) 事務所基本情報の同期
  async function syncOfficeInfo() {
    const data = await fetchCmsJson('office_info.json');
    if (!data) return;

    setTextSafe('[data-cms="office_name"]', data.office_name);
    setTextSafe('[data-cms="english_name"]', data.english_name);
    setTextSafe('[data-cms="postal_code"]', data.postal_code);
    setTextSafe('[data-cms="address"]', data.address);
    setTextSafe('[data-cms="tel"]', data.tel);
    setTextSafe('[data-cms="fax"]', data.fax);
    setTextSafe('[data-cms="business_hours"]', data.business_hours);
    setTextSafe('[data-cms="target_area"]', data.target_area);
    setTextSafe('[data-cms="affiliation"]', data.affiliation);
    setTextSafe('[data-cms="copyright_text"]', data.copyright_text);

    if (data.tel) {
      const cleanTel = String(data.tel).replace(/[^\d+]/g, '');
      document.querySelectorAll('a[data-cms-tel]').forEach(function (a) {
        a.href = 'tel:' + cleanTel;
      });
    }
    if (data.partner_sr_url) {
      const safePartnerUrl = resolveUrl(data.partner_sr_url);
      document.querySelectorAll('a[data-cms-partner-link]').forEach(function (a) {
        a.href = safePartnerUrl;
        if (data.partner_sr_name) a.textContent = data.partner_sr_name;
      });
    }
  }

  // (3) トップページ文章の同期
  async function syncHomeTexts() {
    const data = await fetchCmsJson('home_texts.json');
    if (!data) return;

    const keys = [
      'hero_badge', 'hero_catch_main', 'hero_catch_sub',
      'news_title', 'features_title', 'features_subtitle',
      'feature_01_title', 'feature_01_text',
      'feature_02_title', 'feature_02_text',
      'feature_03_title', 'feature_03_text',
      'feature_04_title', 'feature_04_text',
      'feature_05_title', 'feature_05_text'
    ];
    keys.forEach(function (key) {
      if (data[key]) setTextSafe('[data-cms-home="' + key + '"]', data[key]);
    });
    if (data.news_url) {
      document.querySelectorAll('a[data-cms-home="news_url"]').forEach(function (a) {
        a.href = resolveUrl(data.news_url);
      });
    }
  }

  // (4) プロフィール情報の同期
  async function syncProfileTexts() {
    const data = await fetchCmsJson('profile_texts.json');
    if (!data) return;

    setTextSafe('[data-cms-profile="page_title"]', data.page_title);
    setTextSafe('[data-cms-profile="page_subtitle"]', data.page_subtitle);

    ['rep_keiko', 'rep_senior'].forEach(function (repKey) {
      const rep = data[repKey];
      if (!rep) return;
      setTextSafe('[data-cms-profile="' + repKey + '.name"]', rep.name);
      setTextSafe('[data-cms-profile="' + repKey + '.name_kana"]', rep.name_kana);
      setTextSafe('[data-cms-profile="' + repKey + '.title"]', rep.title);
      setTextSafe('[data-cms-profile="' + repKey + '.registration_number"]', rep.registration_number);
      setTextSafe('[data-cms-profile="' + repKey + '.message"]', rep.message);

      const bioContainer = document.querySelector('[data-cms-bio-list="' + repKey + '"]');
      if (bioContainer && Array.isArray(rep.biography)) {
        bioContainer.textContent = '';
        rep.biography.forEach(function (item) {
          const li = createEl('li', 'bio-timeline-item');
          const yearSpan = createEl('span', 'bio-year', item.year);
          const descSpan = createEl('span', 'bio-desc', item.desc);
          li.appendChild(yearSpan);
          li.appendChild(descSpan);
          bioContainer.appendChild(li);
        });
      }
    });
  }

  // (5) サービス一覧の動的生成・同期 (問題A解決: 配列件数に応じた完全動的生成)
  async function syncServicesTexts() {
    const data = await fetchCmsJson('services.json');
    if (!data) return;

    setTextSafe('[data-cms-services="section_title"]', data.section_title);
    setTextSafe('[data-cms-services="section_subtitle"]', data.section_subtitle);

    if (!Array.isArray(data.services)) return;

    const containers = document.querySelectorAll('[data-cms-service-list], .athena-service-cards, .service-cards-grid');
    if (containers.length === 0) return;

    containers.forEach(function (container) {
      if (data.services.length === 0) {
        container.style.display = 'none';
        return;
      }
      container.style.display = '';
      container.textContent = '';

      data.services.forEach(function (srv, idx) {
        const card = createEl('article', 'service-card-item athena-service-card');
        if (srv.id) card.id = srv.id;

        // 画像解決
        const imgKey = srv.image_key || ('service_' + (idx + 1 < 10 ? '0' + (idx + 1) : (idx + 1)));
        const rawImg = srv.image || (cachedImages && cachedImages[imgKey]);
        if (rawImg) {
          const imgWrap = createEl('div', 'service-card-img-wrap');
          const img = createEl('img', 'service-card-img');
          img.src = resolveImgUrl(rawImg);
          img.alt = srv.title || 'サービス画像';
          img.loading = 'lazy';
          imgWrap.appendChild(img);
          card.appendChild(imgWrap);
        }

        const body = createEl('div', 'service-card-body');
        const numText = srv.num || (idx + 1 < 10 ? '0' + (idx + 1) : String(idx + 1));
        const numBadge = createEl('span', 'service-card-num', numText);
        const titleEl = createEl('h3', 'service-card-title', srv.title || '');
        const summaryEl = createEl('p', 'service-card-summary', srv.summary || '');
        const descEl = createEl('p', 'service-card-desc', srv.description || '');

        body.appendChild(numBadge);
        body.appendChild(titleEl);
        if (srv.summary) body.appendChild(summaryEl);
        if (srv.description) body.appendChild(descEl);

        if (srv.link) {
          const linkEl = createEl('a', 'service-card-link', '詳しく見る →');
          linkEl.href = resolveUrl(srv.link);
          if (/^https?:\/\//i.test(srv.link)) {
            linkEl.target = '_blank';
            linkEl.rel = 'noopener noreferrer';
          }
          body.appendChild(linkEl);
        }

        card.appendChild(body);
        container.appendChild(card);
      });
    });
  }

  // (6) 料金プラン・スポット料金表の動的生成 (問題B解決)
  async function syncPricingTexts() {
    const data = await fetchCmsJson('pricing.json');
    if (!data) return;

    setTextSafe('[data-cms-pricing="page_title"]', data.page_title);
    setTextSafe('[data-cms-pricing="page_subtitle"]', data.page_subtitle);
    setOrHide('[data-cms-pricing="intro_text"]', data.intro_text);

    // 顧問プラン配列の動的生成
    const planContainer = document.querySelector('[data-cms-pricing-plans], .pricing-plans-grid');
    if (planContainer && Array.isArray(data.plans)) {
      if (data.plans.length === 0) {
        planContainer.style.display = 'none';
      } else {
        planContainer.style.display = '';
        planContainer.textContent = '';

        data.plans.forEach(function (plan) {
          const cardClass = 'pricing-card' + (plan.is_recommended ? ' is-recommended' : '');
          const card = createEl('div', cardClass);

          if (plan.is_recommended || plan.badge) {
            const badge = createEl('span', 'pricing-badge', plan.badge || 'おすすめ');
            card.appendChild(badge);
          }

          card.appendChild(createEl('h3', 'pricing-plan-name', plan.name));
          if (plan.target) {
            card.appendChild(createEl('p', 'pricing-plan-target', plan.target));
          }

          const priceBox = createEl('div', 'pricing-price-box');
          const monthlyRow = createEl('div', 'pricing-monthly');
          monthlyRow.appendChild(createEl('span', 'price-label', '月額顧問料'));
          monthlyRow.appendChild(createEl('strong', 'price-value', plan.monthly_fee || '要見積'));
          priceBox.appendChild(monthlyRow);

          if (plan.settlement_fee) {
            const settleRow = createEl('div', 'pricing-settlement');
            settleRow.appendChild(createEl('span', 'price-label', '決算申告料'));
            settleRow.appendChild(createEl('span', 'price-subvalue', plan.settlement_fee));
            priceBox.appendChild(settleRow);
          }
          card.appendChild(priceBox);

          if (Array.isArray(plan.features) && plan.features.length > 0) {
            const ul = createEl('ul', 'pricing-features-list');
            plan.features.forEach(function (feat) {
              ul.appendChild(createEl('li', 'pricing-feature-item', feat));
            });
            card.appendChild(ul);
          }
          planContainer.appendChild(card);
        });
      }
    }

    // スポット報酬テーブルの動的生成
    const spotTbody = document.querySelector('[data-cms-spot-fees] tbody, .spot-fees-table tbody');
    if (spotTbody && Array.isArray(data.spot_fees)) {
      spotTbody.textContent = '';
      data.spot_fees.forEach(function (item) {
        const tr = createEl('tr');
        tr.appendChild(createEl('th', 'spot-service-name', item.service_name || ''));
        tr.appendChild(createEl('td', 'spot-service-price', item.price || ''));
        tr.appendChild(createEl('td', 'spot-service-notes', item.notes || ''));
        spotTbody.appendChild(tr);
      });
    }
  }

  // (7) FAQアコーディオンの動的生成 (問題C解決)
  async function syncFaqTexts() {
    const data = await fetchCmsJson('faq.json');
    if (!data) return;

    setTextSafe('[data-cms-faq="page_title"]', data.page_title);
    setTextSafe('[data-cms-faq="page_subtitle"]', data.page_subtitle);

    const faqContainer = document.querySelector('[data-cms-faq-list], .faq-accordion-list');
    if (faqContainer && Array.isArray(data.faq_list)) {
      if (data.faq_list.length === 0) {
        faqContainer.style.display = 'none';
        return;
      }
      faqContainer.style.display = '';
      faqContainer.textContent = '';

      data.faq_list.forEach(function (item, idx) {
        const wrapper = createEl('div', 'faq-item');
        if (item.id) wrapper.id = item.id;

        const btn = createEl('button', 'faq-question-btn');
        btn.type = 'button';
        btn.setAttribute('aria-expanded', idx === 0 ? 'true' : 'false');

        const qPrefix = createEl('span', 'faq-q-mark', 'Q.');
        const qText = createEl('span', 'faq-q-text', item.question || '');
        const icon = createEl('span', 'faq-toggle-icon', idx === 0 ? '−' : '＋');
        btn.appendChild(qPrefix);
        btn.appendChild(qText);
        btn.appendChild(icon);

        const ansPanel = createEl('div', 'faq-answer-panel');
        if (idx !== 0) ansPanel.style.display = 'none';
        const ansInner = createEl('p', 'faq-a-text', item.answer || '');
        ansPanel.appendChild(ansInner);

        btn.addEventListener('click', function () {
          const expanded = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!expanded));
          icon.textContent = !expanded ? '−' : '＋';
          ansPanel.style.display = !expanded ? 'block' : 'none';
        });

        wrapper.appendChild(btn);
        wrapper.appendChild(ansPanel);
        faqContainer.appendChild(wrapper);
      });
    }
  }

  // (8) 法的表記・プライバシーポリシーの同期
  async function syncLegalTexts() {
    const data = await fetchCmsJson('legal_texts.json');
    if (!data) return;

    setTextSafe('[data-cms-legal="page_title"]', data.page_title);
    setTextSafe('[data-cms-legal="last_updated"]', data.last_updated);
    setTextSafe('[data-cms-legal="declaration"]', data.declaration);

    const secContainer = document.querySelector('[data-cms-legal-sections], .legal-sections-wrap');
    if (secContainer && Array.isArray(data.sections)) {
      secContainer.textContent = '';
      data.sections.forEach(function (sec) {
        const block = createEl('section', 'legal-policy-section');
        block.appendChild(createEl('h3', 'legal-section-heading', sec.heading || ''));
        block.appendChild(createEl('p', 'legal-section-body', sec.body || ''));
        secContainer.appendChild(block);
      });
    }
  }

  /* ==========================================================================
   * 5. UIインタラクション (ヘッダー・モバイルナビ・既存静的FAQ対応)
   * ========================================================================== */
  function initUiInteractions() {
    // スクロール時のヘッダー影付与
    const header = document.querySelector('.site-header, header');
    if (header) {
      window.addEventListener('scroll', function () {
        if (window.scrollY > 20) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
      }, { passive: true });
    }

    // モバイルハンバーガーメニュー
    const menuBtn = document.querySelector('.mobile-menu-toggle, .hamburger-btn');
    const navDrawer = document.querySelector('.site-nav, .mobile-drawer');
    if (menuBtn && navDrawer) {
      menuBtn.addEventListener('click', function () {
        const isOpen = navDrawer.classList.toggle('is-open');
        menuBtn.classList.toggle('is-active', isOpen);
        menuBtn.setAttribute('aria-expanded', String(isOpen));
      });
    }

    // 静的HTML側の既存FAQ開閉バインド（フォールバック用）
    document.querySelectorAll('.faq-question:not([data-bound])').forEach(function (qEl) {
      qEl.setAttribute('data-bound', 'true');
      qEl.addEventListener('click', function () {
        const parent = qEl.closest('.faq-item');
        if (parent) parent.classList.toggle('is-open');
      });
    });
  }

  /* ==========================================================================
   * 6. エントリーポイント (順序保証同期)
   * ========================================================================== */
  async function bootstrap() {
    initUiInteractions();
    await syncCmsImages();
    await Promise.all([
      syncOfficeInfo(),
      syncHomeTexts(),
      syncProfileTexts(),
      syncServicesTexts(),
      syncPricingTexts(),
      syncFaqTexts(),
      syncLegalTexts()
    ]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
