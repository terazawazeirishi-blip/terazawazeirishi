/**
 * TERAZAWA WEBSITE STUDIO - Block Rendering Engine
 * Module: assets/js/block-renderer.js
 * Version: 3.1.0 (Athena Standard / Dynamic Section Reordering)
 */
(function (global) {
  'use strict';

  const pathname = window.location.pathname;
  const isHome = pathname.endsWith('index.html') || pathname.endsWith('/terazawazeirishi/') || pathname.endsWith('/');
  if (!isHome) return; // トップページ以外では待機

  function resolveUrl(rawPath) {
    if (!rawPath || typeof rawPath !== 'string') return '';
    const trimmed = rawPath.trim();
    if (/^(https?:|mailto:|tel:|#)/i.test(trimmed)) return trimmed;
    const clean = trimmed.replace(/^(\.\/|\/)+/, '');
    return './' + clean.replace(/^terazawazeirishi\//, '');
  }

  async function fetchBlockData() {
    try {
      const res = await fetch('./content/pages/home_blocks.json?v=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('[TERAZAWA BlockRenderer] Fallback to static HTML sections:', e.message);
      return null;
    }
  }

  async function fetchImages() {
    try {
      const res = await fetch('./content/site_images.json?v=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return {};
      return await res.json();
    } catch (e) {
      return {};
    }
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = String(text);
    return el;
  }

  // ブロック個別ビルダー群 (アテナ税理士法人完全準拠)
  const BlockBuilders = {
    hero: function (b, images) {
      const sec = createEl('section', 'athena-hero');
      sec.id = b.id || 'section-hero';

      const bgText = createEl('div', 'athena-hero-bg-text', b.bgWatermark || 'TERAZAWA');
      sec.appendChild(bgText);

      const container = createEl('div', 'container athena-hero-inner');
      const content = createEl('div', 'athena-hero-content');

      if (b.badge) {
        content.appendChild(createEl('span', 'athena-hero-badge', b.badge));
      }
      content.appendChild(createEl('h1', 'athena-hero-title', b.title || '数字を、経営の最強の武器に。'));
      if (b.subtitle) {
        content.appendChild(createEl('p', 'athena-hero-lead', b.subtitle));
      }

      const btnWrap = createEl('div', 'athena-hero-actions');
      if (b.primaryBtnText && b.primaryBtnUrl) {
        const pBtn = createEl('a', 'btn btn-primary', b.primaryBtnText);
        pBtn.href = resolveUrl(b.primaryBtnUrl);
        btnWrap.appendChild(pBtn);
      }
      if (b.secondaryBtnText && b.secondaryBtnUrl) {
        const sBtn = createEl('a', 'btn btn-outline', b.secondaryBtnText);
        sBtn.href = resolveUrl(b.secondaryBtnUrl);
        btnWrap.appendChild(sBtn);
      }
      content.appendChild(btnWrap);
      container.appendChild(content);

      // ヒーロー象徴アート（下部グラデーションマスク適用）
      const rawImg = images[b.illustrationKey || 'hero_illustration'] || 'assets/images/uploads/hero-bg-photo.svg';
      const artWrap = createEl('div', 'hero-bg-artwork-wrap athena-hero-art');
      const img = createEl('img');
      img.src = resolveUrl(rawImg);
      img.alt = 'TERAZAWA Brand Emblem';
      artWrap.appendChild(img);
      container.appendChild(artWrap);

      sec.appendChild(container);
      return sec;
    },

    'news-banner': function (b) {
      const sec = createEl('section', 'news-bar-section');
      sec.id = b.id || 'section-news';
      const container = createEl('div', 'container news-bar-inner');
      const label = createEl('span', 'news-bar-label', 'NEWS');
      const text = createEl('a', 'news-bar-text', (b.date ? b.date + ' ' : '') + (b.title || ''));
      text.href = resolveUrl(b.url || './blog/index.html');
      container.appendChild(label);
      container.appendChild(text);
      sec.appendChild(container);
      return sec;
    },

    'features-zigzag': function (b, images) {
      const sec = createEl('section', 'features-section section-padding');
      sec.id = b.id || 'section-features';
      const container = createEl('div', 'container');

      const header = createEl('div', 'section-header text-center');
      if (b.subheading) header.appendChild(createEl('span', 'section-sub', b.subheading));
      header.appendChild(createEl('h2', 'section-title', b.heading || '選ばれる理由'));
      container.appendChild(header);

      if (Array.isArray(b.items)) {
        const list = createEl('div', 'features-zigzag-list');
        b.items.forEach(function (item, idx) {
          const rowClass = 'feature-row' + (idx % 2 === 1 ? ' is-reverse' : '');
          const row = createEl('div', rowClass);

          const textCol = createEl('div', 'feature-text-col');
          textCol.appendChild(createEl('span', 'feature-num', item.num || ('0' + (idx + 1))));
          textCol.appendChild(createEl('h3', 'feature-item-title', item.title || ''));
          textCol.appendChild(createEl('p', 'feature-item-desc', item.text || ''));

          const imgCol = createEl('div', 'feature-img-col');
          const rawImg = images[item.imageKey] || 'assets/images/uploads/about_' + ('0' + (idx + 1)) + '.webp';
          const img = createEl('img', 'feature-img');
          img.src = resolveUrl(rawImg);
          img.alt = item.title || '選ばれる理由';
          img.loading = 'lazy';
          imgCol.appendChild(img);

          row.appendChild(textCol);
          row.appendChild(imgCol);
          list.appendChild(row);
        });
        container.appendChild(list);
      }
      sec.appendChild(container);
      return sec;
    },

    'services-sticky': function (b) {
      const sec = createEl('section', 'services-sticky-section section-padding bg-light');
      sec.id = b.id || 'section-services';
      const container = createEl('div', 'container athena-service-layout');

      const leftCol = createEl('div', 'athena-service-sticky-col');
      if (b.subheading) leftCol.appendChild(createEl('span', 'section-sub', b.subheading));
      leftCol.appendChild(createEl('h2', 'section-title', b.heading || '提供サービス案内'));
      const link = createEl('a', 'btn btn-outline service-all-btn', '全サービス一覧を見る →');
      link.href = resolveUrl('./services.html');
      leftCol.appendChild(link);

      const rightCol = createEl('div', 'athena-service-cards-col');
      const cardsGrid = createEl('div', 'athena-service-cards');
      cardsGrid.setAttribute('data-cms-service-list', 'true');
      rightCol.appendChild(cardsGrid);

      container.appendChild(leftCol);
      container.appendChild(rightCol);
      sec.appendChild(container);
      return sec;
    },

    'profile-double': function (b, images) {
      const sec = createEl('section', 'profile-double-section section-padding');
      sec.id = b.id || 'section-profile';
      const container = createEl('div', 'container');

      const header = createEl('div', 'section-header text-center');
      if (b.subheading) header.appendChild(createEl('span', 'section-sub', b.subheading));
      header.appendChild(createEl('h2', 'section-title', b.heading || '税理士紹介'));
      container.appendChild(header);

      const grid = createEl('div', 'representatives-grid');
      ['repKeiko', 'repSenior'].forEach(function (k) {
        const rep = b[k];
        if (!rep) return;
        const card = createEl('div', 'representative-card');
        const frame = createEl('div', 'representative-photo-frame');
        const rawPhoto = images[rep.photoKey] || '';
        const img = createEl('img');
        img.src = resolveUrl(rawPhoto);
        img.alt = rep.name || '税理士写真';
        frame.appendChild(img);
        card.appendChild(frame);

        card.appendChild(createEl('span', 'representative-title', rep.title || ''));
        card.appendChild(createEl('h3', 'representative-name', rep.name || ''));
        card.appendChild(createEl('p', 'representative-desc', rep.desc || ''));
        grid.appendChild(card);
      });

      container.appendChild(grid);
      sec.appendChild(container);
      return sec;
    },

    'cta-banner': function (b) {
      const sec = createEl('section', 'cta-banner-section');
      sec.id = b.id || 'section-cta';
      const container = createEl('div', 'container cta-banner-inner text-center');

      sec.appendChild(createEl('div', 'cta-banner-bg-overlay'));
      container.appendChild(createEl('h2', 'cta-heading', b.heading || '無料相談受付中'));
      if (b.lead) container.appendChild(createEl('p', 'cta-lead', b.lead));

      const contactBox = createEl('div', 'cta-contact-box');
      if (b.tel) {
        const telLink = createEl('a', 'cta-tel-link', 'TEL: ' + b.tel);
        telLink.href = 'tel:' + b.tel.replace(/[^\d+]/g, '');
        contactBox.appendChild(telLink);
      }
      if (b.hours) contactBox.appendChild(createEl('span', 'cta-hours', b.hours));
      container.appendChild(contactBox);

      if (b.buttonText && b.buttonUrl) {
        const btn = createEl('a', 'btn btn-gold btn-large cta-btn', b.buttonText);
        btn.href = resolveUrl(b.buttonUrl);
        container.appendChild(btn);
      }

      sec.appendChild(container);
      return sec;
    }
  };

  async function renderBlocks() {
    const data = await fetchBlockData();
    if (!data || !Array.isArray(data.blocks) || data.blocks.length === 0) {
      return; // データ未配備・通信不良時は静的HTMLフォールバックを維持
    }

    const mainContainer = document.querySelector('main.site-main, main');
    if (!mainContainer) return;

    const images = await fetchImages();
    const fragment = document.createDocumentFragment();

    data.blocks.forEach(function (block) {
      if (block.visible === false) return; // 非表示フラグ尊重
      const builder = BlockBuilders[block.type];
      if (typeof builder === 'function') {
        const secEl = builder(block, images);
        if (secEl) fragment.appendChild(secEl);
      }
    });

    if (fragment.childNodes.length > 0) {
      mainContainer.textContent = ''; // 既存の静的要素を最新ブロック順で置換
      mainContainer.appendChild(fragment);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBlocks);
  } else {
    renderBlocks();
  }

  global.BlockRenderer = {
    renderBlocks: renderBlocks
  };
})(typeof window !== 'undefined' ? window : this);
