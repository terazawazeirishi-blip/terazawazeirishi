/**
 * TERAZAWA WEBSITE STUDIO - Public Rendering & CMS Sync Engine
 * Module: assets/js/main.js
 * Version: 7.0.0 (Bug-Free Photo Insertion & Complete 18-Slot Sync)
 */
(function () {
  'use strict';

  // サブディレクトリ対応パスヘルパー
  const pathParts = window.location.pathname.split('/');
  let repoBase = './';
  const repoIndex = pathParts.indexOf('terazawazeirishi');
  if (repoIndex !== -1) {
    repoBase = pathParts.slice(0, repoIndex + 1).join('/') + '/';
  } else if (window.location.pathname.includes('/blog/')) {
    repoBase = '../';
  }

  function resolveUrl(path) {
    if (!path || typeof path !== 'string') return '';
    const trimmed = path.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    let clean = trimmed.replace(/^(\.\/|\/)+/, '');
    if (clean.startsWith('terazawazeirishi/')) {
      clean = clean.replace('terazawazeirishi/', '');
    }
    return repoBase + clean + '?v=' + Date.now();
  }

  // Pages CMSの構造化データを、各ページの表示に安全に反映する
  function getCmsValue(data, path) {
    if (!data || typeof path !== 'string') return undefined;
    return path.split('.').reduce(function (value, key) {
      return value == null ? undefined : value[key];
    }, data);
  }

  function setCmsHref(element, value) {
    if (typeof value !== 'string' || !value.trim()) return;
    const nextValue = value.trim();
    const currentHref = element.getAttribute('href') || '';

    if (/^tel:/i.test(currentHref)) {
      const digits = nextValue.replace(/[^0-9+]/g, '');
      if (digits) element.setAttribute('href', 'tel:' + digits);
      return;
    }

    if (/^(https?:|mailto:|tel:)/i.test(nextValue) ||
        /^(\.\/|\.\.\/|\/|#)/.test(nextValue)) {
      element.setAttribute('href', nextValue);
    }
  }

  // 配列フィールドは template を複製して描画する。
  // JSONを読み込めなかった場合は、既存HTMLの表示をそのまま残す。
  function hydrateCmsScope(root, scope) {
    if (!root || !scope) return;

    const fieldSelector = '[data-cms-value], [data-cms-href], [data-cms-external]';
    const fieldElements = [];
    if (root.nodeType === 1 && root.matches(fieldSelector)) fieldElements.push(root);
    root.querySelectorAll(fieldSelector).forEach(function (element) {
      fieldElements.push(element);
    });

    fieldElements.forEach(function (element) {
      if (element.closest('[data-cms-list]')) return;

      const valuePath = element.getAttribute('data-cms-value');
      if (valuePath) {
        const value = getCmsValue(scope, valuePath);
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          element.textContent = String(value);
        }
      }

      const hrefPath = element.getAttribute('data-cms-href');
      if (hrefPath) setCmsHref(element, getCmsValue(scope, hrefPath));

      const externalPath = element.getAttribute('data-cms-external');
      if (externalPath) {
        if (getCmsValue(scope, externalPath) === true) {
          element.setAttribute('target', '_blank');
          element.setAttribute('rel', 'noopener noreferrer');
        } else {
          element.removeAttribute('target');
          element.removeAttribute('rel');
        }
      }
    });

    const lists = Array.from(root.querySelectorAll('[data-cms-list]')).filter(function (list) {
      return !list.parentElement.closest('[data-cms-list]');
    });

    lists.forEach(function (container) {
      const values = getCmsValue(scope, container.getAttribute('data-cms-list'));
      if (!Array.isArray(values)) return;

      const template = Array.from(container.children).find(function (child) {
        return child.tagName === 'TEMPLATE' && child.hasAttribute('data-cms-template');
      });
      if (!template || !template.content.firstElementChild) return;

      const blueprint = template.content.firstElementChild;
      const rendered = [];

      values.forEach(function (item) {
        const clone = blueprint.cloneNode(true);
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          hydrateCmsScope(clone, item);
        } else if (item !== null && item !== undefined) {
          clone.textContent = String(item);
        }
        rendered.push(clone);
      });

      container.replaceChildren(...rendered);
      container.hidden = rendered.length === 0;
    });
  }

  async function syncStructuredCmsContent() {
    const pageKey = document.body && document.body.getAttribute('data-cms-page');
    if (!pageKey) return;

    const sourceMap = {
      profile: [
        { path: 'content/profile_texts.json', key: 'profile' },
        { path: 'content/office_info.json', key: 'office' },
        { path: 'content/site_images.json', key: 'images' }
      ],
      privacy: [
        { path: 'content/legal_texts.json', key: 'legal' },
        { path: 'content/office_info.json', key: 'office' }
      ],
      sitemap: [
        { path: 'content/sitemap.json', key: 'sitemap' },
        { path: 'content/office_info.json', key: 'office' }
      ],
      contact: [
        { path: 'content/contact.json', key: 'contact' },
        { path: 'content/office_info.json', key: 'office' }
      ],
      services: [
        { path: 'content/services.json', key: 'services' },
        { path: 'content/office_info.json', key: 'office' }
      ],
      pricing: [
        { path: 'content/pricing.json', key: 'pricing' },
        { path: 'content/office_info.json', key: 'office' }
      ],
      faq: [
        { path: 'content/faq.json', key: 'faq' },
        { path: 'content/office_info.json', key: 'office' }
      ],
      home: [
        { path: 'content/home_texts.json', key: 'home' },
        { path: 'content/profile_texts.json', key: 'profile' },
        { path: 'content/services.json', key: 'services' },
        { path: 'content/pages/home_blocks.json', key: 'home_blocks' },
        { path: 'content/site_images.json', key: 'images' },
        { path: 'content/office_info.json', key: 'office' }
      ]
    };

    const sources = sourceMap[pageKey];
    if (!sources) return;

    const combined = {};
    await Promise.all(sources.map(async function (source) {
      try {
        const response = await fetch(repoBase + source.path + '?v=' + Date.now(), { cache: 'no-store' });
        if (!response.ok) return;
        combined[source.key] = await response.json();
      } catch (error) {
        console.warn('[TERAZAWA] CMS content load error (' + source.path + '):', error);
      }
    }));

    hydrateCmsScope(document, combined);

    // トップページのブロック表示／非表示をCMSの設定と連動
    if (Array.isArray(combined.home_blocks && combined.home_blocks.blocks)) {
      const blockElements = Array.from(document.querySelectorAll('[data-cms-block-id]'));
      combined.home_blocks.blocks.forEach(function (block) {
        if (!block || typeof block.id !== 'string' || typeof block.visible !== 'boolean') return;
        const target = blockElements.find(function (element) {
          return element.getAttribute('data-cms-block-id') === block.id;
        });
        if (target) target.hidden = !block.visible;
      });
    }

    // プロフィール写真は、画像データがある場合のみプレースホルダーと差し替える
    document.querySelectorAll('[data-cms-image]').forEach(function (frame) {
      const imagePath = getCmsValue(combined, frame.getAttribute('data-cms-image'));
      if (typeof imagePath !== 'string' || !imagePath.trim()) return;

      const existing = frame.querySelector('img, svg');
      if (!existing) return;

      const image = document.createElement('img');
      image.src = resolveUrl(imagePath);
      image.alt = getCmsValue(combined, frame.getAttribute('data-cms-alt')) || '税理士プロフィール写真';
      image.className = 'representative-photo-img';
      image.style.cssText = 'width:100%;height:auto;aspect-ratio:1/1;object-fit:cover;display:block;border-radius:8px;';
      existing.replaceWith(image);
    });
  }

  // ★【破壊根絶】親カードの文字や説明文を絶対に消さず、写真枠の中だけを安全に差し替える
  function insertPhotoDirect(frameElement, imgUrl, altText, maxW, isSquare) {
    if (!frameElement || !imgUrl) return;
    // 枠の中にある古いプレースホルダーSVGやテキストだけを消去
    frameElement.innerHTML = '';
    const img = document.createElement('img');
    img.src = imgUrl;
    img.alt = altText || '写真';
    img.className = 'representative-photo-img zigzag-visual-img';
    img.style.cssText = 'width:100%;' + (maxW ? 'max-width:' + maxW + 'px;' : '') + (isSquare ? 'height:' + maxW + 'px;aspect-ratio:1/1;' : 'height:auto;aspect-ratio:4/3;') + 'object-fit:cover;border-radius:8px;display:block;margin:0 auto;box-shadow:0 4px 16px rgba(27,42,74,0.08);';
    frameElement.appendChild(img);
  }

  // 幾何学的防護CSS（枠消去 ＆ 100%全幅展開の保証）
  function injectGeometryGuardCSS() {
    if (document.getElementById('terazawa-geometry-guard')) return;
    const style = document.createElement('style');
    style.id = 'terazawa-geometry-guard';
    style.textContent = `
      .athena-zigzag-item.has-no-image {
        display: block !important;
        direction: ltr !important;
        background: var(--color-bg-subtle);
        padding: 3rem 3.5rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-border);
        box-shadow: var(--shadow-sm);
      }
      .athena-zigzag-item.has-no-image .zigzag-visual-slot {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      .athena-zigzag-item.has-no-image .zigzag-content {
        width: 100% !important;
        max-width: 100% !important;
        direction: ltr !important;
        text-align: left !important;
      }
      .service-card-item.no-image {
        display: block !important;
        grid-template-columns: 1fr !important;
      }
      .service-card-item.no-image .service-card-img-slot {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      .service-card-item.no-image .service-card-body,
      .service-card-item.no-image .service-card-content {
        width: 100% !important;
        max-width: 100% !important;
        display: block !important;
      }
      @media (max-width: 768px) {
        .athena-zigzag-item.has-no-image { padding: 2rem 1.4rem; }
        .service-card-item { padding: 1.8rem 1.4rem; margin-bottom: 1.5rem; }
      }
    `;
    document.head.appendChild(style);
  }

  async function syncAllCmsData() {
    injectGeometryGuardCSS();

    try {
      const res = await fetch(repoBase + 'content/site_images.json?v=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;

      // ------------------------------------------------------------------------
      // 00. サービス案内を services.json から生成
      // JSONを取得できない場合は既存HTMLを残し、表示を壊さない
      // ------------------------------------------------------------------------
      const servicesContainer = document.getElementById('servicesContainer');
      if (servicesContainer) {
        try {
          const servicesRes = await fetch(repoBase + 'content/services.json?v=' + Date.now(), { cache: 'no-store' });
          if (servicesRes.ok) {
            const servicesData = await servicesRes.json();
            if (servicesData && Array.isArray(servicesData.services) && servicesData.services.length > 0) {
              const fragment = document.createDocumentFragment();

              servicesData.services.forEach((service, index) => {
                const article = document.createElement('article');
                const fallbackNumber = String(index + 1).padStart(2, '0');
                const number = String(service.num || fallbackNumber);
                article.id = service.id || ('service-' + number);
                article.className = 'service-card-item no-image';
                article.dataset.serviceKey = service.image_key || '';

                const imageSlot = document.createElement('div');
                imageSlot.className = 'service-card-img-slot';
                imageSlot.style.display = 'none';
                article.appendChild(imageSlot);

                const content = document.createElement('div');
                content.className = 'service-card-content';

                const tag = document.createElement('span');
                tag.className = 'zigzag-tag';
                tag.textContent = 'SERVICE ' + number;
                content.appendChild(tag);

                const heading = document.createElement('h2');
                heading.className = 'zigzag-heading';
                heading.style.marginBottom = '0.8rem';
                heading.textContent = service.title || '';
                content.appendChild(heading);

                const summary = document.createElement('p');
                summary.className = 'zigzag-text';
                summary.style.cssText = 'font-size:1.05rem;font-weight:500;color:var(--color-primary);margin-bottom:0.8rem;';
                summary.textContent = service.summary || '';
                content.appendChild(summary);

                const description = document.createElement('p');
                description.className = 'zigzag-text';
                description.style.marginBottom = '1.5rem';
                description.textContent = service.description || '';
                content.appendChild(description);

                if (typeof service.link === 'string' && service.link.trim()) {
                  const rawHref = service.link.trim();
                  const isAllowedHref =
                    /^(https?:|mailto:|tel:)/i.test(rawHref) ||
                    /^(\.\/|\.\.\/|\/|#)/.test(rawHref);

                  if (isAllowedHref) {
                    const link = document.createElement('a');
                    link.className = 'service-card-link';
                    link.href = rawHref;
                    const isExternal = /^https?:\/\//i.test(rawHref) &&
                      new URL(rawHref, window.location.href).origin !== window.location.origin;
                    if (isExternal) {
                      link.target = '_blank';
                      link.rel = 'noopener noreferrer';
                      link.textContent = (service.link_label || '提携先サイトを見る') + ' →';
                    } else {
                      link.textContent = (service.link_label || '詳細・料金を見る') + ' →';
                    }
                    content.appendChild(link);
                  }
                }

                article.appendChild(content);
                fragment.appendChild(article);
              });

              servicesContainer.replaceChildren(fragment);
            }
          }
        } catch (servicesError) {
          console.warn('[TERAZAWA] Services JSON sync error:', servicesError);
        }
      }

      // ------------------------------------------------------------------------
      // 01. ロゴ画像 (logo_img)
      // ------------------------------------------------------------------------
      if (data.logo_img) {
        const logoUrl = resolveUrl(data.logo_img);
        document.querySelectorAll('.brand-logo, .site-logo').forEach(brand => {
          let img = brand.querySelector('img.brand-logo-img');
          const svg = brand.querySelector('svg.brand-logo-img');
          if (!img) {
            img = document.createElement('img');
            img.className = 'brand-logo-img';
            img.alt = '寺澤景子税理士事務所 ロゴ';
            img.style.cssText = 'width:44px; height:44px; object-fit:contain; flex-shrink:0;';
            if (svg) {
              brand.replaceChild(img, svg);
            } else {
              brand.insertBefore(img, brand.firstChild);
            }
          }
          img.src = logoUrl;
        });
      }

      // ------------------------------------------------------------------------
      // 02. 代表税理士（寺澤代表 ＆ 田河副代表）写真
      // 親カードを消さず、写真枠 (.representative-photo-frame) の中だけを安全に差し替える
      // ------------------------------------------------------------------------
      const teamFrames = document.querySelectorAll('#team .representative-photo-frame');
      // 1人目：寺澤景子 代表税理士
      if (data.rep_keiko && teamFrames.length > 0) {
        insertPhotoDirect(teamFrames[0], resolveUrl(data.rep_keiko), '代表税理士 寺澤景子', 260, true);
      }
      // 2人目：田河定茂 副代表・ベテラン税理士
      if (data.rep_senior && teamFrames.length > 1) {
        insertPhotoDirect(teamFrames[1], resolveUrl(data.rep_senior), '副代表・ベテラン税理士 田河定茂', 260, true);
      }

      // ------------------------------------------------------------------------
      // 03. 透かし紋章 (watermark_crest)
      // ------------------------------------------------------------------------
      if (data.watermark_crest) {
        const crestUrl = resolveUrl(data.watermark_crest);
        const heroBgWrap = document.querySelector('.hero-bg-artwork-wrap, .athena-hero');
        if (heroBgWrap && !document.getElementById('cmsWatermarkCrest')) {
          const crestImg = document.createElement('img');
          crestImg.id = 'cmsWatermarkCrest';
          crestImg.alt = '寺澤景子税理士事務所 象徴紋章';
          crestImg.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width: clamp(320px, 45vw, 650px); opacity:0.045; pointer-events:none; z-index:1;';
          crestImg.src = crestUrl;
          heroBgWrap.insertBefore(crestImg, heroBgWrap.firstChild);
        }
      }

      // ------------------------------------------------------------------------
      // 04. ヒーロー象徴アート (hero_illustration)
      // ------------------------------------------------------------------------
      if (data.hero_illustration) {
        const heroArtUrl = resolveUrl(data.hero_illustration);
        document.querySelectorAll('.hero-illustration-img, .hero-bg-artwork-img').forEach(img => {
          img.src = heroArtUrl;
        });
      }

      // ------------------------------------------------------------------------
      // 05. 選ばれる理由01〜05 (about_01 〜 about_05)
      // ------------------------------------------------------------------------
      const aboutKeys = ['about_01', 'about_02', 'about_03', 'about_04', 'about_05'];
      const aboutItems = document.querySelectorAll('#about .athena-zigzag-item');
      let aboutCounter = 0;

      aboutItems.forEach((item, idx) => {
        const key = item.getAttribute('data-about-key') || aboutKeys[idx];
        const rawImg = data[key];
        const slot = item.querySelector('.zigzag-visual-slot');

        if (rawImg && slot) {
          const isReverse = (aboutCounter % 2 === 1);
          aboutCounter++;
          item.classList.remove('has-no-image');
          if (isReverse) {
            item.classList.add('is-reverse');
          } else {
            item.classList.remove('is-reverse');
          }
          slot.style.display = '';
          slot.textContent = '';
          const img = document.createElement('img');
          img.src = resolveUrl(rawImg);
          img.className = 'zigzag-visual-img';
          img.style.cssText = 'width:100%; height:100%; object-fit:cover; display:block;';
          slot.appendChild(img);
        } else if (slot) {
          item.classList.add('has-no-image');
          item.classList.remove('is-reverse');
          slot.style.display = 'none';
        }
      });

      // ------------------------------------------------------------------------
      // 06. 提供サービス (service_01 〜 service_07)
      // ------------------------------------------------------------------------
      const serviceKeys = ['service_01', 'service_02', 'service_03', 'service_04', 'service_05', 'service_06', 'service_07'];
      const serviceCards = document.querySelectorAll('#services .service-card-item, #servicesContainer .service-card-item');
      let serviceCounter = 0;

      serviceCards.forEach((card, idx) => {
        const key = card.getAttribute('data-service-key') || serviceKeys[idx];
        const rawImg = data[key];
        const slot = card.querySelector('.service-card-img-slot, .zigzag-visual-slot');

        if (rawImg && slot) {
          const isReverse = (serviceCounter % 2 === 1);
          serviceCounter++;
          card.classList.remove('no-image', 'has-no-image');
          card.classList.add('with-image');
          if (isReverse) {
            card.classList.add('is-reverse');
          } else {
            card.classList.remove('is-reverse');
          }
          slot.style.display = '';
          slot.textContent = '';
          const img = document.createElement('img');
          img.src = resolveUrl(rawImg);
          img.className = 'service-card-img';
          img.style.cssText = 'width:100%; height:100%; object-fit:cover; border-radius:var(--radius-md); display:block;';
          slot.appendChild(img);
        } else if (slot) {
          card.classList.add('no-image', 'has-no-image');
          card.classList.remove('with-image', 'is-reverse');
          slot.style.display = 'none';
        }
      });

    } catch (e) {
      console.warn('[TERAZAWA] Sync engine error:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      syncAllCmsData();
      syncStructuredCmsContent();
    });
  } else {
    syncAllCmsData();
    syncStructuredCmsContent();
  }
})();
