/**
 * TERAZAWA WEBSITE STUDIO - Properties Panel Controller
 * Module: assets/js/studio-props.js
 * Version: 3.2.0 (Zero-Fail / Real-Time Property Binding Edition)
 */
(function (global) {
  'use strict';

  function createField(label, inputEl) {
    const group = document.createElement('div');
    group.className = 'props-group';
    const lbl = document.createElement('label');
    lbl.className = 'props-label';
    lbl.textContent = label;
    group.appendChild(lbl);
    group.appendChild(inputEl);
    return group;
  }

  function createTextInput(value, onInput) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'props-input';
    input.value = value || '';
    input.addEventListener('input', function () { onInput(input.value); });
    return input;
  }

  function createTextArea(value, onInput) {
    const area = document.createElement('textarea');
    area.className = 'props-textarea';
    area.value = value || '';
    area.addEventListener('input', function () { onInput(area.value); });
    return area;
  }

  function createToggle(value, onChange) {
    const wrap = document.createElement('label');
    wrap.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = value !== false;
    chk.addEventListener('change', function () { onChange(chk.checked); });
    const span = document.createElement('span');
    span.textContent = 'このセクションを公開ページに表示する';
    wrap.appendChild(chk);
    wrap.appendChild(span);
    return wrap;
  }

  function renderProps(blockId, pageData) {
    const panel = document.getElementById('studioPropsBody');
    const titleEl = document.getElementById('studioPropsTitle');
    if (!panel || !pageData || !Array.isArray(pageData.blocks)) return;

    panel.innerHTML = '';
    const block = pageData.blocks.find(function (b) { return b.id === blockId; });
    if (!block) {
      clearProps();
      return;
    }

    if (titleEl) {
      titleEl.textContent = 'プロパティ: ' + (block.heading || block.title || block.id);
    }

    // 1. セクション固有ID（読み取り専用）
    const idInput = createTextInput(block.id, function () {});
    idInput.disabled = true;
    idInput.style.background = '#f5f7fa';
    panel.appendChild(createField('セクションID (システム識別子)', idInput));

    // 2. 表示・非表示トグル
    panel.appendChild(createField('公開表示設定', createToggle(block.visible, function (val) {
      block.visible = val;
      global.StudioCore.pushState(block.id + ' の表示状態変更');
      global.StudioCore.syncToCanvas();
      global.StudioCore.renderSidebarLayers();
    })));

    // 3. バッジ文言（存在する場合）
    if (block.badge !== undefined) {
      panel.appendChild(createField('バッジ文言', createTextInput(block.badge, function (val) {
        block.badge = val;
        notifyChange(block.id, 'バッジ変更');
      })));
    }

    // 4. メイン見出し / タイトル
    if (block.heading !== undefined) {
      panel.appendChild(createField('セクション見出し', createTextInput(block.heading, function (val) {
        block.heading = val;
        notifyChange(block.id, '見出し変更');
        global.StudioCore.renderSidebarLayers();
      })));
    } else if (block.title !== undefined) {
      panel.appendChild(createField('キャッチコピー主見出し', createTextInput(block.title, function (val) {
        block.title = val;
        notifyChange(block.id, '見出し変更');
        global.StudioCore.renderSidebarLayers();
      })));
    }

    // 5. 英語サブ見出し
    if (block.subheading !== undefined) {
      panel.appendChild(createField('英語サブタイトル', createTextInput(block.subheading, function (val) {
        block.subheading = val;
        notifyChange(block.id, 'サブ見出し変更');
      })));
    }

    // 6. 説明リード文章
    if (block.subtitle !== undefined) {
      panel.appendChild(createField('説明リード文章', createTextArea(block.subtitle, function (val) {
        block.subtitle = val;
        notifyChange(block.id, '説明文変更');
      })));
    } else if (block.lead !== undefined) {
      panel.appendChild(createField('説明リード文章', createTextArea(block.lead, function (val) {
        block.lead = val;
        notifyChange(block.id, 'リード文変更');
      })));
    }

    // 7. ボタンリンク設定
    if (block.primaryBtnText !== undefined) {
      panel.appendChild(createField('主ボタン文言', createTextInput(block.primaryBtnText, function (val) {
        block.primaryBtnText = val;
        notifyChange(block.id, 'ボタン文言変更');
      })));
      panel.appendChild(createField('主ボタンリンク先URL', createTextInput(block.primaryBtnUrl, function (val) {
        block.primaryBtnUrl = val;
        notifyChange(block.id, 'ボタンリンク先変更');
      })));
    }

    if (block.buttonText !== undefined) {
      panel.appendChild(createField('ボタン文言', createTextInput(block.buttonText, function (val) {
        block.buttonText = val;
        notifyChange(block.id, 'ボタン文言変更');
      })));
      panel.appendChild(createField('ボタンリンク先URL', createTextInput(block.buttonUrl, function (val) {
        block.buttonUrl = val;
        notifyChange(block.id, 'ボタンリンク先変更');
      })));
    }

    // 8. 電話番号案内
    if (block.tel !== undefined) {
      panel.appendChild(createField('代表電話番号', createTextInput(block.tel, function (val) {
        block.tel = val;
        notifyChange(block.id, '電話番号変更');
      })));
    }
  }

  let debounceTimer = null;
  function notifyChange(blockId, actionName) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      global.StudioCore.pushState(blockId + ' の' + actionName);
      global.StudioCore.syncToCanvas();
    }, 250);
  }

  function clearProps() {
    const panel = document.getElementById('studioPropsBody');
    const titleEl = document.getElementById('studioPropsTitle');
    if (titleEl) titleEl.textContent = 'プロパティ詳細設定';
    if (panel) {
      panel.innerHTML = '<p style="font-size: 12px; color: #909399; text-align: center; margin-top: 40px;">キャンバス内の文字やセクションをクリックすると、ここに詳細編集設定が表示されます。</p>';
    }
  }

  global.StudioProps = {
    renderProps: renderProps,
    clearProps: clearProps
  };

})(typeof window !== 'undefined' ? window : this);
