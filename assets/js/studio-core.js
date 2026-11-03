/**
 * TERAZAWA WEBSITE STUDIO - Core Visual Editor Engine
 * Module: assets/js/studio-core.js
 * Version: 3.2.0 (Zero-Fail / Undo-Redo & PostMessage Sync Edition)
 */
(function (global) {
  'use strict';

  // 内部状態（State）
  const state = {
    currentPage: 'home',
    currentDevice: 'pc',
    selectedBlockId: null,
    historyStack: [],
    historyIndex: -1,
    maxHistory: 30,
    pageBlocks: null,
    imagesData: null
  };

  const PAGE_MAP = {
    home: { file: 'index.html', json: 'content/pages/home_blocks.json', label: 'トップページ' },
    services: { file: 'services.html', json: 'content/services.json', label: 'サービス案内' },
    pricing: { file: 'pricing.html', json: 'content/pricing.json', label: '料金案内' },
    profile: { file: 'profile.html', json: 'content/profile_texts.json', label: '税理士紹介・事務所概要' },
    faq: { file: 'faq.html', json: 'content/faq.json', label: 'よくある質問' },
    privacy: { file: 'privacy.html', json: 'content/legal_texts.json', label: '個人情報保護方針' }
  };

  /* ==========================================================================
   * 1. 履歴管理 (Undo / Redo スタック)
   * ========================================================================== */
  function pushState(actionLabel) {
    if (!state.pageBlocks) return;
    // 現在位置より先の履歴を破棄
    if (state.historyIndex < state.historyStack.length - 1) {
      state.historyStack = state.historyStack.slice(0, state.historyIndex + 1);
    }
    // ディープコピーをスタックへ格納
    const snapshot = JSON.parse(JSON.stringify(state.pageBlocks));
    state.historyStack.push({ snapshot: snapshot, label: actionLabel, page: state.currentPage });
    if (state.historyStack.length > state.maxHistory) {
      state.historyStack.shift();
    } else {
      state.historyIndex++;
    }
    updateHistoryButtons();
  }

  function undo() {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      const prev = state.historyStack[state.historyIndex];
      state.pageBlocks = JSON.parse(JSON.stringify(prev.snapshot));
      updateHistoryButtons();
      syncToCanvas();
      renderSidebarLayers();
      if (global.StudioProps) global.StudioProps.renderProps(state.selectedBlockId, state.pageBlocks);
      setStatus('元に戻しました: ' + prev.label);
    }
  }

  function redo() {
    if (state.historyIndex < state.historyStack.length - 1) {
      state.historyIndex++;
      const next = state.historyStack[state.historyIndex];
      state.pageBlocks = JSON.parse(JSON.stringify(next.snapshot));
      updateHistoryButtons();
      syncToCanvas();
      renderSidebarLayers();
      if (global.StudioProps) global.StudioProps.renderProps(state.selectedBlockId, state.pageBlocks);
      setStatus('やり直しました: ' + next.label);
    }
  }

  function updateHistoryButtons() {
    const btnUndo = document.getElementById('btnUndo');
    const btnRedo = document.getElementById('btnRedo');
    if (btnUndo) btnUndo.disabled = state.historyIndex <= 0;
    if (btnRedo) btnRedo.disabled = state.historyIndex >= state.historyStack.length - 1;
  }

  /* ==========================================================================
   * 2. ページ切替・デバイス切替
   * ========================================================================== */
  async function switchPage(pageKey) {
    if (!PAGE_MAP[pageKey]) return;
    state.currentPage = pageKey;
    state.selectedBlockId = null;
    state.historyStack = [];
    state.historyIndex = -1;

    const pageInfo = PAGE_MAP[pageKey];
    const iframe = document.getElementById('studioCanvasFrame');
    if (iframe) {
      iframe.src = '../' + pageInfo.file + '?studio_mode=1&t=' + Date.now();
    }

    const targetEl = document.getElementById('studioSyncTarget');
    if (targetEl) targetEl.textContent = '正本: ' + pageInfo.json;

    await loadPageData(pageInfo.json);
    renderSidebarLayers();
    if (global.StudioProps) global.StudioProps.clearProps();
    setStatus(pageInfo.label + ' を読み込みました');
  }

  function setDevice(deviceKey) {
    state.currentDevice = deviceKey;
    const viewport = document.getElementById('studioViewport');
    const btnPc = document.getElementById('btnDevicePc');
    const btnTab = document.getElementById('btnDeviceTab');
    const btnMob = document.getElementById('btnDeviceMob');

    [btnPc, btnTab, btnMob].forEach(function (btn) {
      if (btn) btn.classList.remove('is-active');
    });

    if (deviceKey === 'pc') {
      if (viewport) viewport.style.maxWidth = '1200px';
      if (btnPc) btnPc.classList.add('is-active');
    } else if (deviceKey === 'tablet') {
      if (viewport) viewport.style.maxWidth = '768px';
      if (btnTab) btnTab.classList.add('is-active');
    } else if (deviceKey === 'mobile') {
      if (viewport) viewport.style.maxWidth = '390px';
      if (btnMob) btnMob.classList.add('is-active');
    }
    setStatus('表示幅を変更: ' + deviceKey);
  }

  /* ==========================================================================
   * 3. データ取得とキャンバス間セキュア通信 (postMessage)
   * ========================================================================== */
  async function loadPageData(jsonPath) {
    try {
      const res = await fetch('../' + jsonPath + '?v=' + Date.now());
      if (res.ok) {
        state.pageBlocks = await res.json();
      } else {
        state.pageBlocks = { blocks: [] };
      }
    } catch (e) {
      state.pageBlocks = { blocks: [] };
    }
    pushState('初期読み込み');
  }

  function syncToCanvas() {
    const iframe = document.getElementById('studioCanvasFrame');
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage({
      type: 'TERAZAWA_STUDIO_UPDATE',
      page: state.currentPage,
      data: state.pageBlocks
    }, '*');
  }

  // キャンバスからの編集・選択メッセージ受信
  window.addEventListener('message', function (e) {
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.type === 'TERAZAWA_CANVAS_SELECT') {
      state.selectedBlockId = e.data.blockId;
      highlightSelectedLayer(e.data.blockId);
      if (global.StudioProps) global.StudioProps.renderProps(e.data.blockId, state.pageBlocks);
    } else if (e.data.type === 'TERAZAWA_CANVAS_TEXT_CHANGE') {
      applyCanvasTextChange(e.data.blockId, e.data.field, e.data.value);
    }
  });

  function applyCanvasTextChange(blockId, field, value) {
    if (!state.pageBlocks || !Array.isArray(state.pageBlocks.blocks)) return;
    const block = state.pageBlocks.blocks.find(function (b) { return b.id === blockId; });
    if (block) {
      block[field] = value;
      pushState(blockId + ' のテキスト編集');
      if (global.StudioProps) global.StudioProps.renderProps(blockId, state.pageBlocks);
      setStatus('テキストを更新しました');
    }
  }

  /* ==========================================================================
   * 4. 左側サイドバー（階層レイヤー描画と順序入替）
   * ========================================================================== */
  function renderSidebarLayers() {
    const container = document.getElementById('studioSidebarContent');
    if (!container) return;
    container.innerHTML = '';

    if (!state.pageBlocks || !Array.isArray(state.pageBlocks.blocks)) {
      container.innerHTML = '<p style="font-size:12px;color:#909399;padding:12px;">ブロックデータがありません</p>';
      return;
    }

    state.pageBlocks.blocks.forEach(function (b, idx) {
      const card = document.createElement('div');
      card.className = 'layer-card' + (b.id === state.selectedBlockId ? ' is-active' : '');
      card.setAttribute('data-layer-id', b.id);

      const info = document.createElement('div');
      info.className = 'layer-info';
      info.innerHTML = '<div class="layer-name">' + (b.heading || b.title || b.id) + '</div>' +
                       '<div class="layer-type">' + b.type + (b.visible === false ? ' (非表示)' : '') + '</div>';

      const controls = document.createElement('div');
      controls.className = 'layer-controls';

      // 上へ移動ボタン
      const upBtn = document.createElement('button');
      upBtn.className = 'layer-btn';
      upBtn.textContent = '↑';
      upBtn.disabled = idx === 0;
      upBtn.onclick = function (ev) { ev.stopPropagation(); moveBlock(idx, -1); };

      // 下へ移動ボタン
      const downBtn = document.createElement('button');
      downBtn.className = 'layer-btn';
      downBtn.textContent = '↓';
      downBtn.disabled = idx === state.pageBlocks.blocks.length - 1;
      downBtn.onclick = function (ev) { ev.stopPropagation(); moveBlock(idx, 1); };

      controls.appendChild(upBtn);
      controls.appendChild(downBtn);

      card.appendChild(info);
      card.appendChild(controls);

      card.onclick = function () {
        state.selectedBlockId = b.id;
        highlightSelectedLayer(b.id);
        if (global.StudioProps) global.StudioProps.renderProps(b.id, state.pageBlocks);
        // キャンバス側へスクロール指示
        const iframe = document.getElementById('studioCanvasFrame');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'TERAZAWA_SCROLL_TO', blockId: b.id }, '*');
        }
      };

      container.appendChild(card);
    });
  }

  function moveBlock(idx, dir) {
    const blocks = state.pageBlocks.blocks;
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const temp = blocks[idx];
    blocks[idx] = blocks[targetIdx];
    blocks[targetIdx] = temp;
    pushState('セクション順序の入れ替え');
    renderSidebarLayers();
    syncToCanvas();
    setStatus('セクションを移動しました');
  }

  function highlightSelectedLayer(blockId) {
    document.querySelectorAll('.layer-card').forEach(function (el) {
      if (el.getAttribute('data-layer-id') === blockId) {
        el.classList.add('is-active');
      } else {
        el.classList.remove('is-active');
      }
    });
  }

  /* ==========================================================================
   * 5. 保存・プレビュー・ステータス
   * ========================================================================== */
  function saveToDisk() {
    const key = 'terazawa_studio_draft_' + state.currentPage;
    localStorage.setItem(key, JSON.stringify(state.pageBlocks, null, 2));
    setStatus('下書きを保存しました (' + new Date().toLocaleTimeString() + ')');
    console.log('[TERAZAWA Studio] Draft Saved:', state.pageBlocks);
  }

  function previewSite() {
    const pageInfo = PAGE_MAP[state.currentPage];
    if (pageInfo) window.open('../' + pageInfo.file, '_blank');
  }

  function setStatus(text) {
    const el = document.getElementById('studioStatusText');
    if (el) el.textContent = text;
  }

  // キーボードショートカット (Ctrl+Z, Ctrl+Y)
  window.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      redo();
    }
  });

  // 初期起動
  document.addEventListener('DOMContentLoaded', function () {
    switchPage('home');
  });

  global.StudioCore = {
    switchPage: switchPage,
    setDevice: setDevice,
    undo: undo,
    redo: redo,
    pushState: pushState,
    saveToDisk: saveToDisk,
    previewSite: previewSite,
    renderSidebarLayers: renderSidebarLayers,
    syncToCanvas: syncToCanvas,
    getState: function () { return state; }
  };

})(typeof window !== 'undefined' ? window : this);
