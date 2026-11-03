/**
 * TERAZAWA WEBSITE STUDIO - Secure Storage & Conflict Resolver
 * Module: assets/js/studio-storage.js
 * Version: 3.3.0 (Zero-Fail / SHA Verification & Conflict Detection)
 */
(function (global) {
  'use strict';

  const REPO_OWNER = 'terazawazeirishi-blip';
  const REPO_NAME = 'terazawazeirishi';
  const TARGET_BRANCH = 'main';

  // ファイルごとのベースSHA（編集開始時のハッシュ値）
  const baseShaCache = {};

  /**
   * 1. GitHub上の最新ファイルSHAを取得（競合検知用）
   */
  async function fetchLatestFileSha(filePath, optionalToken) {
    const apiUrl = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + filePath + '?ref=' + TARGET_BRANCH;
    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if (optionalToken) headers['Authorization'] = 'Bearer ' + optionalToken;

    try {
      const res = await fetch(apiUrl, { headers: headers, cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.sha || null;
    } catch (e) {
      console.warn('[TERAZAWA Storage] SHA fetch notice:', e.message);
      return null;
    }
  }

  /**
   * 2. 編集開始時のSHAを記録（初期ベースライン）
   */
  async function recordBaseSha(filePath, optionalToken) {
    const sha = await fetchLatestFileSha(filePath, optionalToken);
    if (sha) {
      baseShaCache[filePath] = sha;
      console.log('[TERAZAWA Storage] Base SHA cached for', filePath, ':', sha);
    }
  }

  /**
   * 3. 競合検知（Conflict Check）
   * @returns {Promise<{ hasConflict: boolean, currentSha: string, remoteSha: string }>}
   */
  async function checkConflict(filePath, optionalToken) {
    const remoteSha = await fetchLatestFileSha(filePath, optionalToken);
    const cachedSha = baseShaCache[filePath];

    if (!cachedSha || !remoteSha) {
      return { hasConflict: false, currentSha: cachedSha, remoteSha: remoteSha };
    }

    if (cachedSha !== remoteSha) {
      return { hasConflict: true, currentSha: cachedSha, remoteSha: remoteSha };
    }

    return { hasConflict: false, currentSha: cachedSha, remoteSha: remoteSha };
  }

  /**
   * 4. 安全なコミットペイロード生成
   */
  function createCommitPayload(contentObject, commitMessage, currentSha) {
    const jsonString = JSON.stringify(contentObject, null, 2);
    // UTF-8 文字列を Base64 エンコード
    const base64Content = btoa(unescape(encodeURIComponent(jsonString)));

    const payload = {
      message: commitMessage || 'feat(studio): update content via TERAZAWA STUDIO [skip ci]',
      content: base64Content,
      branch: TARGET_BRANCH
    };
    if (currentSha) {
      payload.sha = currentSha;
    }
    return payload;
  }

  /**
   * 5. 安全な下書きエクスポート（JSONファイルダウンロード）
   */
  function exportDraftAsFile(contentObject, defaultFileName) {
    try {
      const jsonStr = JSON.stringify(contentObject, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFileName || 'terazawa_studio_backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error('[TERAZAWA Storage] Export failed:', e);
      return false;
    }
  }

  /**
   * 6. ローカル下書き保存（localStorage 安全退避）
   */
  function saveLocalDraft(pageKey, contentObject) {
    const key = 'terazawa_draft_v3_' + pageKey;
    try {
      localStorage.setItem(key, JSON.stringify({
        updatedAt: new Date().toISOString(),
        data: contentObject
      }));
      return true;
    } catch (e) {
      console.error('[TERAZAWA Storage] LocalStorage save failed:', e);
      return false;
    }
  }

  function loadLocalDraft(pageKey) {
    const key = 'terazawa_draft_v3_' + pageKey;
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item);
    } catch (e) {
      return null;
    }
  }

  global.StudioStorage = {
    recordBaseSha: recordBaseSha,
    checkConflict: checkConflict,
    createCommitPayload: createCommitPayload,
    exportDraftAsFile: exportDraftAsFile,
    saveLocalDraft: saveLocalDraft,
    loadLocalDraft: loadLocalDraft
  };

})(typeof window !== 'undefined' ? window : this);
