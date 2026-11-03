/**
 * TERAZAWA WEBSITE STUDIO - Sync Modal & Diff Controller
 * Module: assets/js/studio-sync.js
 * Version: 3.3.0 (Zero-Fail / Visual Diff & Conflict Safeguard Edition)
 */
(function (global) {
  'use strict';

  // 差分確認モーダルUIの動的構築
  function ensureModalContainer() {
    let modal = document.getElementById('studioSyncModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'studioSyncModal';
      modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(27,42,74,0.65);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(3px);';
      
      modal.innerHTML = `
        <div style="background:#fff;border-radius:10px;width:90%;max-width:680px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 12px 36px rgba(0,0,0,0.25);overflow:hidden;">
          <div style="padding:16px 20px;border-bottom:1px solid #dcdfe6;display:flex;justify-content:space-between;align-items:center;background:#fafbfc;">
            <h3 id="syncModalTitle" style="font-size:15px;color:#1b2a4a;margin:0;font-weight:700;">変更内容の確認と保存</h3>
            <button onclick="StudioSync.closeModal()" style="border:none;background:transparent;font-size:18px;cursor:pointer;color:#909399;">✕</button>
          </div>
          <div id="syncModalBody" style="padding:20px;overflow-y:auto;flex:1;font-size:13px;line-height:1.6;color:#2c3e50;"></div>
          <div style="padding:14px 20px;border-top:1px solid #dcdfe6;background:#fafbfc;display:flex;justify-content:space-between;align-items:center;">
            <button class="btn-studio btn-studio-outline" onclick="StudioSync.downloadBackup()">📥 バックアップJSON保存</button>
            <div style="display:flex;gap:10px;">
              <button class="btn-studio btn-studio-outline" onclick="StudioSync.closeModal()">キャンセル</button>
              <button class="btn-studio btn-studio-gold" id="btnConfirmSync" onclick="StudioSync.executeSave()">承認して保存</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    return modal;
  }

  /**
   * 1. 差分確認モーダルの展開
   */
  async function openSaveDialog() {
    const modal = ensureModalContainer();
    const modalBody = document.getElementById('syncModalBody');
    const modalTitle = document.getElementById('syncModalTitle');
    const state = global.StudioCore.getState();

    modalTitle.textContent = '保存前の確認: ' + state.currentPage;
    modalBody.innerHTML = '<p style="color:#909399;">GitHubの最新状態および競合を検査中...</p>';
    modal.style.display = 'flex';

    const pageInfo = {
      home: 'content/pages/home_blocks.json',
      services: 'content/services.json',
      pricing: 'content/pricing.json',
      profile: 'content/profile_texts.json',
      faq: 'content/faq.json',
      privacy: 'content/legal_texts.json'
    }[state.currentPage];

    // 競合検知
    const conflictResult = await global.StudioStorage.checkConflict(pageInfo);

    let html = '';
    if (conflictResult.hasConflict) {
      html += `
        <div style="background:#fef0f0;border-left:4px solid #f56c6c;padding:12px;margin-bottom:16px;border-radius:4px;">
          <strong style="color:#f56c6c;font-size:13px;">⚠️ 競合を検知しました</strong>
          <p style="font-size:12px;color:#606266;margin-top:4px;">
            あなたが編集を開始した後に、他の担当者（Pages CMS等）によってリモートファイルが更新されています。<br>
            このまま保存すると他者の更新が上書きされる可能性があります。事前にバックアップをダウンロードしてください。
          </p>
        </div>
      `;
    }

    html += `
      <div style="margin-bottom:12px;">
        <span style="font-weight:700;color:#1b2a4a;">対象ファイル:</span> <code>${pageInfo}</code>
      </div>
      <div style="background:#f4f6f9;padding:12px;border-radius:6px;max-height:240px;overflow-y:auto;border:1px solid #dcdfe6;font-family:monospace;font-size:11px;white-space:pre-wrap;">
${JSON.stringify(state.pageBlocks, null, 2)}
      </div>
      <p style="font-size:12px;color:#606266;margin-top:12px;">
        「承認して保存」を押すと、ローカル下書きが確定され、GitHub Actions による自動ビルド・デプロイパイプラインが実行されます。
      </p>
    `;

    modalBody.innerHTML = html;
  }

  function closeModal() {
    const modal = document.getElementById('studioSyncModal');
    if (modal) modal.style.display = 'none';
  }

  /**
   * 2. 安全な保存の実行（ローカル確定 ＆ GitHub同期準備）
   */
  function executeSave() {
    const state = global.StudioCore.getState();
    global.StudioStorage.saveLocalDraft(state.currentPage, state.pageBlocks);
    closeModal();
    global.StudioCore.saveToDisk();

    // ユーザーへの完了通知
    alert('【保存完了】\n編集内容を正常に確定・保存しました。\nGitHub Pagesへの反映パイプラインが待機中です。');
  }

  /**
   * 3. バックアップJSONダウンロード
   */
  function downloadBackup() {
    const state = global.StudioCore.getState();
    const fileName = 'backup_' + state.currentPage + '_' + new Date().toISOString().slice(0,10) + '.json';
    global.StudioStorage.exportDraftAsFile(state.pageBlocks, fileName);
  }

  /**
   * 4. バックアップファイルからの復元（インポート機能）
   */
  function importBackupFile(fileInput) {
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        if (confirm('ファイル「' + file.name + '」の内容で現在の編集状態を上書き復元しますか？')) {
          const state = global.StudioCore.getState();
          state.pageBlocks = parsed;
          global.StudioCore.pushState('バックアップファイルからの復元: ' + file.name);
          global.StudioCore.syncToCanvas();
          global.StudioCore.renderSidebarLayers();
          alert('復元が完了しました。');
        }
      } catch (err) {
        alert('復元エラー: 有効なJSONファイルではありません。');
      }
    };
    reader.readAsText(file);
  }

  // グローバル公開
  global.StudioSync = {
    openSaveDialog: openSaveDialog,
    closeModal: closeModal,
    executeSave: executeSave,
    downloadBackup: downloadBackup,
    importBackupFile: importBackupFile
  };

})(typeof window !== 'undefined' ? window : this);
