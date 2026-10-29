/**
 * リュミエール税理士事務所 - クライアント側スクリプト
 * 仕様: APIキー完全不使用・Vanilla JS（外部依存ライブラリなし）
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. モバイルナビゲーション（ハンバーガーメニュー開閉）
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const mainNav = document.querySelector('.main-nav');

  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', isOpen);
      
      const spans = menuBtn.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });

    mainNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 2. FAQ アコーディオン開閉
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(other => other.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // 3. ページ内スムーススクロール
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // 4. お問い合わせフォーム 送信前バリデーション（必須漏れ防止）
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      const requiredInputs = contactForm.querySelectorAll('[required]');
      let hasError = false;
      
      requiredInputs.forEach(input => {
        if (!input.value.trim()) {
          hasError = true;
          input.style.borderColor = '#DC2626';
        } else {
          input.style.borderColor = '';
        }
      });

      if (hasError) {
        e.preventDefault();
        alert('必須項目をすべて入力してください。');
      }
    });
  }
});
