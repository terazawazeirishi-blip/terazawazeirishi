/**
 * ==============================================================================
 * 寺沢景子税理士事務所 公式Webサイト クライアントスクリプト（全データ完全同期版）
 * ファイルパス: assets/js/main.js
 * 仕様: トップページの税理士紹介枠（#team）への完全自動連動修復
 * ==============================================================================
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', initApp);

  function initApp() {
    initHeaderScroll();
    initMobileNav();
    initFaqAccordion();
    initSmoothScroll();
    syncCmsImages();
    syncOfficeInfo();
    syncHomeTexts();
    syncProfileTexts(); // ★ トップ＆プロフィールの税理士紹介を完全自動同期
    syncLegalTexts();
  }

  function initHeaderScroll() {
    const header = document.getElementById('siteHeader');
    if (!header) return;
    const handleScroll = () => {
      if (window.scrollY > 20) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  function initMobileNav() {
    const btn = document.getElementById('hamburgerBtn');
    const nav = document.getElementById('headerNav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    const navLinks = nav.querySelectorAll('.nav-link, .header-cta-btn');
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (nav.classList.contains('is-open')) {
          nav.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    });
  }

  function initFaqAccordion() {
    const accordions = document.querySelectorAll('.faq-accordion-item');
    accordions.forEach((item) => {
      const trigger = item.querySelector('.faq-question-btn');
      const content = item.querySelector('.faq-answer-pane');
      if (!trigger || !content) return;
      trigger.addEventListener('click', () => {
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', !isExpanded);
        content.hidden = isExpanded;
        item.classList.toggle('is-active', !isExpanded);
      });
    });
  }

  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    const headerHeight = 84;
    links.forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || targetId === '') return;
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  function getRepoBase() {
    const pathParts = window.location.pathname.split('/');
    let repoBase = '/';
    const repoIndex = pathParts.indexOf('terazawazeirishi');
    if (repoIndex !== -1) {
      repoBase = pathParts.slice(0, repoIndex + 1).join('/') + '/';
    }
    return repoBase;
  }

  function syncCmsImages() {
    const repoBase = getRepoBase();
    const jsonUrl = repoBase + 'content/site_images.json?v=' + Date.now();

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error('site_images.json HTTP ' + res.status);
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        const resolveImgUrl = (rawPath) => {
          if (!rawPath || typeof rawPath !== 'string') return '';
          const trimmed = rawPath.trim();
          if (!trimmed) return '';
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
          let clean = trimmed.replace(/^(\.\/|\/)/, '');
          if (clean.startsWith('terazawazeirishi/')) {
            clean = clean.replace('terazawazeirishi/', '');
          }
          return repoBase + clean;
        };

        const photoFrames = document.querySelectorAll('.representative-photo-frame');
        if (photoFrames.length >= 1 && data.rep_keiko) {
          const keikoUrl = resolveImgUrl(data.rep_keiko);
          if (keikoUrl) {
            photoFrames[0].innerHTML = `
              <img src="${keikoUrl}" alt="寺沢景子 代表税理士" class="representative-photo-img" style="width:100%; height:100%; object-fit:cover; display:block;">
              <span class="representative-overlay-text">Keiko Terazawa</span>
            `;
          }
        }
        if (photoFrames.length >= 2 && data.rep_senior) {
          const seniorUrl = resolveImgUrl(data.rep_senior);
          if (seniorUrl) {
            photoFrames[1].innerHTML = `
              <img src="${seniorUrl}" alt="ベテラン税理士" class="representative-photo-img" style="width:100%; height:100%; object-fit:cover; display:block;">
              <span class="representative-overlay-text">Senior Tax Advisor</span>
            `;
          }
        }

        if (data.hero_illustration) {
          const heroUrl = resolveImgUrl(data.hero_illustration);
          const heroSlot = document.querySelector('.hero-bg-artwork-slot');
          if (heroSlot && heroUrl) {
            heroSlot.innerHTML = `<img src="${heroUrl}" alt="寺沢景子税理士事務所 象徴アート" class="hero-bg-artwork-img" loading="eager">`;
          }
        }

        if (data.logo_img) {
          const logoUrl = resolveImgUrl(data.logo_img);
          if (logoUrl) {
            document.querySelectorAll('.brand-logo-img').forEach((el) => {
              el.outerHTML = `<img src="${logoUrl}" alt="寺沢景子税理士事務所 ロゴ" class="brand-logo-img" style="width:44px; height:44px; object-fit:contain;">`;
            });
          }
        }

        if (data.watermark_crest) {
          const crestUrl = resolveImgUrl(data.watermark_crest);
          const hero = document.getElementById('hero');
          if (hero && crestUrl) {
            hero.style.backgroundImage = `url('${crestUrl}'), linear-gradient(135deg, #FFFFFF 0%, var(--color-bg-subtle) 60%, var(--color-floral-bg) 100%)`;
            hero.style.backgroundRepeat = 'no-repeat';
            hero.style.backgroundPosition = 'center center';
            hero.style.backgroundSize = '700px auto, cover';
          }
        }

        const aboutKeys = ['about_01', 'about_02', 'about_03', 'about_04', 'about_05'];
        document.querySelectorAll('.athena-about-section .athena-zigzag-item .zigzag-visual-slot').forEach((slot, idx) => {
          const k = aboutKeys[idx];
          if (data[k]) {
            const u = resolveImgUrl(data[k]);
            if (u) {
              slot.innerHTML = `<img src="${u}" alt="About理由 ${idx + 1}" class="zigzag-visual-img" style="width:100%; height:100%; object-fit:cover;">`;
            }
          }
        });

        const serviceKeys = ['service_01', 'service_02', 'service_03', 'service_04', 'service_05', 'service_06', 'service_07'];
        document.querySelectorAll('.service-card-item .service-card-img-slot').forEach((slot, idx) => {
          const k = serviceKeys[idx];
          if (data[k]) {
            const imgUrl = resolveImgUrl(data[k]);
            if (imgUrl) {
              slot.innerHTML = `<img src="${imgUrl}" alt="サービス写真 ${idx + 1}" class="service-card-img" style="width:100%; height:100%; object-fit:cover;">`;
            }
          }
        });

        if (data.cta_banner_bg) {
          const ctaUrl = resolveImgUrl(data.cta_banner_bg);
          if (ctaUrl) {
            document.querySelectorAll('section[style*="linear-gradient"]').forEach((banner) => {
              banner.style.backgroundImage = `linear-gradient(rgba(15, 24, 41, 0.88), rgba(27, 42, 74, 0.92)), url('${ctaUrl}')`;
              banner.style.backgroundSize = 'cover';
              banner.style.backgroundPosition = 'center';
            });
          }
        }
      })
      .catch((err) => {
        console.warn('CMS Image Sync status:', err.message);
      });
  }

  function syncOfficeInfo() {
    const repoBase = getRepoBase();
    const jsonUrl = repoBase + 'content/office_info.json?v=' + Date.now();

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error('office_info.json HTTP ' + res.status);
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        if (data.tel) {
          document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
            a.setAttribute('href', 'tel:' + data.tel.replace(/-/g, ''));
            const span = a.querySelector('span');
            if (span && span.textContent.includes('0969')) {
              span.textContent = data.tel;
            } else if (!span && a.textContent.includes('0969')) {
              a.textContent = data.tel;
            }
          });
        }

        document.querySelectorAll('.office-table tr').forEach((tr) => {
          const th = tr.querySelector('th');
          const td = tr.querySelector('td');
          if (!th || !td) return;
          const thText = th.textContent.trim();

          if (thText.includes('所在地') && data.address) {
            td.textContent = (data.postal_code ? '〒' + data.postal_code + ' ' : '') + data.address;
          } else if (thText.includes('営業時間') && data.opening_hours) {
            td.textContent = data.opening_hours;
          } else if (thText.includes('対応エリア') && data.areas) {
            td.textContent = data.areas;
          } else if (thText.includes('FAX') && data.fax) {
            td.textContent = data.fax;
          }
        });
      })
      .catch((err) => {
        console.warn('Office Info Sync status:', err.message);
      });
  }

  function syncHomeTexts() {
    if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && !window.location.pathname.endsWith('/terazawazeirishi/')) {
      return;
    }

    const repoBase = getRepoBase();
    const jsonUrl = repoBase + 'content/home_texts.json?v=' + Date.now();

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error('home_texts.json HTTP ' + res.status);
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        if (data.hero_title) {
          const titleEl = document.querySelector('.hero-main-title');
          if (titleEl) titleEl.innerHTML = data.hero_title.replace(/\n/g, '<br>');
        }
        if (data.hero_lead) {
          const leadEl = document.querySelector('.hero-lead-text');
          if (leadEl) leadEl.innerHTML = data.hero_lead.replace(/\n/g, '<br>');
        }

        const badgeEls = document.querySelectorAll('.hero-badge-item span');
        if (badgeEls.length >= 3) {
          if (data.badge_1) badgeEls[0].textContent = data.badge_1;
          if (data.badge_2) badgeEls[1].textContent = data.badge_2;
          if (data.badge_3) badgeEls[2].textContent = data.badge_3;
        }

        if (data.hero_cta_btn) {
          const btnSpan = document.querySelector('.hero-cta-group .floating-cta-btn span');
          if (btnSpan) btnSpan.textContent = data.hero_cta_btn;
        }

        const zigzagItems = document.querySelectorAll('.athena-zigzag-item');
        zigzagItems.forEach((item, idx) => {
          const num = idx + 1;
          const titleKey = `about_0${num}_title`;
          const descKey = `about_0${num}_desc`;
          const headingEl = item.querySelector('.zigzag-heading');
          const textEl = item.querySelector('.zigzag-text');
          if (headingEl && data[titleKey]) headingEl.innerHTML = data[titleKey].replace(/\n/g, '<br>');
          if (textEl && data[descKey]) textEl.innerHTML = data[descKey].replace(/\n/g, '<br>');
        });

        const flowSteps = document.querySelectorAll('#flow > div > div:last-child > div');
        flowSteps.forEach((step, idx) => {
          const num = idx + 1;
          const titleKey = `flow_0${num}_title`;
          const descKey = `flow_0${num}_desc`;
          const titleEl = step.querySelector('h4');
          const descEl = step.querySelector('p');
          if (titleEl && data[titleKey]) titleEl.textContent = data[titleKey];
          if (descEl && data[descKey]) descEl.textContent = data[descKey];
        });

        const bannerSection = document.querySelector('section[style*="linear-gradient(135deg"]');
        if (bannerSection) {
          if (data.cta_banner_title) {
            const h2 = bannerSection.querySelector('h2');
            if (h2) h2.textContent = data.cta_banner_title;
          }
          if (data.cta_banner_desc) {
            const p = bannerSection.querySelector('p:nth-of-type(2)');
            if (p) p.innerHTML = data.cta_banner_desc.replace(/\n/g, '<br>');
          }
          if (data.cta_banner_btn) {
            const btnSpan = bannerSection.querySelector('.floating-cta-btn span');
            if (btnSpan) btnSpan.textContent = data.cta_banner_btn;
          }
        }
      })
      .catch((err) => {
        console.warn('Home Texts Sync status:', err.message);
      });
  }

  /* ★【完全修復】税理士紹介・代表挨拶文章自動同期（index.html ＆ profile.html 両対応） */
  function syncProfileTexts() {
    const isProfile = window.location.pathname.includes('profile.html');
    const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/terazawazeirishi/');

    if (!isProfile && !isHome) return;

    const repoBase = getRepoBase();
    const jsonUrl = repoBase + 'content/profile_texts.json?v=' + Date.now();

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error('profile_texts.json HTTP ' + res.status);
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        // --- A. トップページ (index.html の #team セクション) への完全自動反映 ---
        if (isHome) {
          const teamSection = document.getElementById('team');
          if (teamSection) {
            const memberCards = teamSection.querySelectorAll('.representative-photo-frame');
            
            // 寺沢代表カード
            if (memberCards.length >= 1) {
              const card1 = memberCards[0].closest('div');
              if (card1) {
                if (data.rep_keiko_name) {
                  const nameEl = card1.querySelector('h3');
                  if (nameEl) nameEl.textContent = data.rep_keiko_name;
                }
                if (data.rep_keiko_sub) {
                  const subEl = card1.querySelector('p:nth-of-type(1)');
                  if (subEl) subEl.innerHTML = data.rep_keiko_sub.replace(/\n/g, '<br>');
                }
                if (data.rep_keiko_desc) {
                  const descEl = card1.querySelector('p:nth-of-type(2)');
                  if (descEl) descEl.innerHTML = data.rep_keiko_desc.replace(/\n/g, '<br>');
                }
              }
            }

            // ベテラン税理士カード
            if (memberCards.length >= 2) {
              const card2 = memberCards[1].closest('div');
              if (card2) {
                if (data.rep_senior_name) {
                  const nameEl = card2.querySelector('h3');
                  if (nameEl) nameEl.textContent = data.rep_senior_name;
                }
                if (data.rep_senior_sub) {
                  const subEl = card2.querySelector('p:nth-of-type(1)');
                  if (subEl) subEl.innerHTML = data.rep_senior_sub.replace(/\n/g, '<br>');
                }
                if (data.rep_senior_desc) {
                  const descEl = card2.querySelector('p:nth-of-type(2)');
                  if (descEl) descEl.innerHTML = data.rep_senior_desc.replace(/\n/g, '<br>');
                }
              }
            }
          }
        }

        // --- B. プロフィールページ (profile.html) への反映 ---
        if (isProfile) {
          if (data.page_lead) {
            const leadEl = document.querySelector('.hero-lead-text');
            if (leadEl) leadEl.innerHTML = data.page_lead.replace(/\n/g, '<br>');
          }

          const members = document.querySelectorAll('.profile-member-grid');
          if (members.length >= 1) {
            const m1 = members[0];
            if (data.rep_keiko_name) {
              const h2 = m1.querySelector('h2');
              if (h2) h2.textContent = data.rep_keiko_name;
            }
            if (data.rep_keiko_sub) {
              const sub = m1.querySelector('.profile-sub-title');
              if (sub) sub.textContent = data.rep_keiko_sub;
            }
            if (data.rep_keiko_desc) {
              const descContainer = m1.querySelector('.profile-desc-col > div:nth-of-type(2)');
              if (descContainer) {
                const paras = data.rep_keiko_desc.split('\n\n').filter(p => p.trim());
                descContainer.innerHTML = paras.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
              }
            }
            if (data.rep_keiko_careers) {
              const ul = m1.querySelector('.profile-career-box ul');
              if (ul) {
                const lines = data.rep_keiko_careers.split('\n').filter(l => l.trim());
                ul.innerHTML = lines.map(l => `<li>${l}</li>`).join('');
              }
            }
          }

          if (members.length >= 2) {
            const m2 = members[1];
            if (data.rep_senior_name) {
              const h2 = m2.querySelector('h2');
              if (h2) h2.textContent = data.rep_senior_name;
            }
            if (data.rep_senior_sub) {
              const sub = m2.querySelector('.profile-sub-title');
              if (sub) sub.textContent = data.rep_senior_sub;
            }
            if (data.rep_senior_desc) {
              const descContainer = m2.querySelector('.profile-desc-col > div:nth-of-type(2)');
              if (descContainer) {
                const paras = data.rep_senior_desc.split('\n\n').filter(p => p.trim());
                descContainer.innerHTML = paras.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
              }
            }
            if (data.rep_senior_careers) {
              const ul = m2.querySelector('.profile-career-box ul');
              if (ul) {
                const lines = data.rep_senior_careers.split('\n').filter(l => l.trim());
                ul.innerHTML = lines.map(l => `<li>${l}</li>`).join('');
              }
            }
          }
        }
      })
      .catch((err) => {
        console.warn('Profile Texts Sync status:', err.message);
      });
  }

  function syncLegalTexts() {
    const isContact = window.location.pathname.includes('contact.html');
    const isPrivacy = window.location.pathname.includes('privacy.html');
    if (!isContact && !isPrivacy) return;

    const repoBase = getRepoBase();
    const jsonUrl = repoBase + 'content/legal_texts.json?v=' + Date.now();

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error('legal_texts.json HTTP ' + res.status);
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        if (isContact) {
          if (data.contact_lead) {
            const lead = document.querySelector('.hero-lead-text');
            if (lead) lead.innerHTML = data.contact_lead.replace(/\n/g, '<br>');
          }
          if (data.contact_notice) {
            const noticeP = document.querySelector('div[style*="background: #FFF8E7"] p, div[style*="background:#FFF8E7"] p');
            if (noticeP) noticeP.innerHTML = data.contact_notice.replace(/\n/g, '<br>');
          }
        }

        if (isPrivacy) {
          const sections = document.querySelectorAll('main section');
          if (sections.length >= 4) {
            if (data.privacy_sec1) {
              const p = sections[0].querySelector('p');
              if (p) p.innerHTML = data.privacy_sec1.replace(/\n/g, '<br>');
            }
            if (data.privacy_sec2) {
              const p = sections[1].querySelector('p');
              if (p) p.innerHTML = data.privacy_sec2.replace(/\n/g, '<br>');
            }
            if (data.privacy_sec3) {
              const p = sections[2].querySelector('p');
              if (p) p.innerHTML = data.privacy_sec3.replace(/\n/g, '<br>');
            }
            if (data.privacy_sec4) {
              const p = sections[3].querySelector('p');
              if (p) p.innerHTML = data.privacy_sec4.replace(/\n/g, '<br>');
            }
          }
        }
      })
      .catch((err) => {
        console.warn('Legal Texts Sync status:', err.message);
      });
  }
})();
