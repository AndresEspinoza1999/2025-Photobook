(function () {
  const MAX_FILE_BYTES = 104857600; // 100 MB
  const MAX_FILES = 20;
  const ACCEPTED_IMAGE_TYPES = new Set(
    ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp'].map((type) => type.toLowerCase())
  );
  const ACCEPTED_VIDEO_TYPES = new Set(
    ['video/mp4', 'video/quicktime', 'video/webm'].map((type) => type.toLowerCase())
  );
  const ACCEPTED_EXTENSIONS = new Set([
    '.jpeg',
    '.jpg',
    '.png',
    '.heic',
    '.heif',
    '.webp',
    '.mp4',
    '.mov',
    '.qt',
    '.webm',
  ]);
  const DEFAULT_PRESIGN_ENDPOINT = '/api/presign';
  const DEFAULT_CONFIRM_ENDPOINT = '/api/confirm-upload';

  const onReady = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes)) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  };

  const getMetaContent = (name) => {
    const meta = document.querySelector(`meta[name="${name}"]`);
    return meta && typeof meta.content === 'string' ? meta.content.trim() : '';
  };

  const getFileExtension = (fileName = '') => {
    const match = /\.([^.]+)$/.exec(fileName);
    return match ? `.${match[1].toLowerCase()}` : '';
  };

  const isVideoFile = (file) => {
    const type = (file.type || '').toLowerCase();
    if (type && ACCEPTED_VIDEO_TYPES.has(type)) return true;
    const ext = getFileExtension(file.name);
    return ACCEPTED_EXTENSIONS.has(ext) && ['.mp4', '.mov', '.qt', '.webm'].includes(ext);
  };

  const isAcceptedFileType = (file) => {
    const type = (file.type || '').toLowerCase();
    if (type && (ACCEPTED_IMAGE_TYPES.has(type) || ACCEPTED_VIDEO_TYPES.has(type))) {
      return true;
    }
    const ext = getFileExtension(file.name);
    return ACCEPTED_EXTENSIONS.has(ext);
  };

  const createUploadToken = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `sc9-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const revokeObjectUrl = (entry) => {
    if (entry.objectUrl) {
      URL.revokeObjectURL(entry.objectUrl);
      entry.objectUrl = null;
    }
  };

  const createEntryElement = (file, id) => {
    const li = document.createElement('li');
    li.className = 'upload-file';
    li.dataset.entryId = id;

    const preview = document.createElement('div');
    preview.className = 'upload-file__preview';
    preview.setAttribute('aria-hidden', 'true');

    const details = document.createElement('div');
    details.className = 'upload-file__details';

    const topRow = document.createElement('div');
    topRow.className = 'upload-file__top';

    const nameEl = document.createElement('span');
    nameEl.className = 'upload-file__name';
    nameEl.textContent = file.name;

    const metaEl = document.createElement('span');
    metaEl.className = 'upload-file__meta text-sm text-muted';
    metaEl.textContent = `${file.type || 'unknown'} · ${formatBytes(file.size)}`;

    const statusEl = document.createElement('div');
    statusEl.className = 'upload-file__status text-sm text-muted';
    statusEl.textContent = 'Ready to upload';

    const actions = document.createElement('div');
    actions.className = 'upload-file__actions';

    const linkEl = document.createElement('a');
    linkEl.className = 'upload-file__link text-sm';
    linkEl.textContent = 'View file';
    linkEl.target = '_blank';
    linkEl.rel = 'noopener';
    linkEl.hidden = true;

    const retryButton = document.createElement('button');
    retryButton.type = 'button';
    retryButton.className = 'upload-file__retry button button-ghost text-sm';
    retryButton.textContent = 'Retry';
    retryButton.hidden = true;

    topRow.append(nameEl, metaEl);
    actions.append(linkEl, retryButton);
    details.append(topRow, statusEl, actions);
    li.append(preview, details);

    return {
      id,
      file,
      element: li,
      previewEl: preview,
      statusEl,
      linkEl,
      retryButton,
      state: 'idle',
      isUploading: false,
      uploadToken: null,
      objectUrl: null,
    };
  };

  onReady(() => {
    const form = document.querySelector('.upload-form');
    if (!form) return;

    const monthSelect = form.querySelector('select[name="month"]');
    const fileInput = form.querySelector('input[type="file"][name="files"]');
    const statusEl = form.querySelector('[data-upload-status]');
    const listEl = form.querySelector('[data-upload-file-list]');
    const submitButton = form.querySelector('button[type="submit"]');

    const presignEndpoint =
      getMetaContent('sc9-upload-endpoint') || form.getAttribute('data-upload-endpoint') || DEFAULT_PRESIGN_ENDPOINT;
    const confirmEndpoint =
      getMetaContent('sc9-upload-confirm-endpoint') ||
      form.getAttribute('data-upload-confirm-endpoint') ||
      DEFAULT_CONFIRM_ENDPOINT;

    const resolveAuthToken = () =>
      getMetaContent('sc9-upload-token') ||
      form.getAttribute('data-upload-token') ||
      (typeof window !== 'undefined' && window.SC9_UPLOAD_TOKEN ? window.SC9_UPLOAD_TOKEN : '');

    const fileEntries = new Map();

    const resetStatus = () => {
      if (!statusEl) return;
      statusEl.textContent = '';
      statusEl.classList.remove('is-error', 'is-success');
    };

    const setStatus = (message, variant = 'info') => {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.classList.remove('is-error', 'is-success');
      if (variant === 'error') statusEl.classList.add('is-error');
      if (variant === 'success') statusEl.classList.add('is-success');
    };

    const toggleUploadingState = (isUploading) => {
      if (isUploading) {
        submitButton?.setAttribute('disabled', 'true');
        form.classList.add('is-uploading');
      } else {
        submitButton?.removeAttribute('disabled');
        form.classList.remove('is-uploading');
      }
    };

    const destroyEntries = () => {
      fileEntries.forEach((entry) => revokeObjectUrl(entry));
      fileEntries.clear();
      if (listEl) {
        listEl.innerHTML = '';
      }
    };

    const attachPreview = (entry) => {
      if (!entry.previewEl) return;
      revokeObjectUrl(entry);
      const objectUrl = URL.createObjectURL(entry.file);
      entry.objectUrl = objectUrl;

      entry.previewEl.innerHTML = '';
      if (isVideoFile(entry.file)) {
        const video = document.createElement('video');
        video.src = objectUrl;
        video.controls = true;
        video.preload = 'metadata';
        video.playsInline = true;
        video.muted = true;
        video.width = 180;
        entry.previewEl.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.src = objectUrl;
        img.alt = entry.file.name;
        img.loading = 'lazy';
        entry.previewEl.appendChild(img);
      }
    };

    const markEntryStatus = (entry, message, variant = 'info') => {
      if (!entry || !entry.statusEl) return;
      entry.statusEl.textContent = message;
      entry.element.classList.remove('upload-file--success', 'upload-file--error');
      if (variant === 'success') {
        entry.element.classList.add('upload-file--success');
      } else if (variant === 'error') {
        entry.element.classList.add('upload-file--error');
      }
    };

    const syncFileList = () => {
      destroyEntries();
      if (!fileInput || !fileInput.files) return;
      const files = Array.from(fileInput.files).slice(0, MAX_FILES);

      files.forEach((file, index) => {
        const id = `${Date.now()}-${index}-${file.name}`;
        const entry = createEntryElement(file, id);
        entry.retryButton.addEventListener('click', () => {
          if (!monthSelect || !monthSelect.value) {
            setStatus('Choose a month before retrying an upload.', 'error');
            return;
          }
          uploadEntry(entry, monthSelect.value, { resetStatus: false });
        });
        fileEntries.set(id, entry);
        listEl?.appendChild(entry.element);
      });

      if (!files.length) {
        setStatus('Select media to upload.', 'info');
      } else {
        setStatus(`${files.length} file${files.length === 1 ? '' : 's'} ready to upload.`);
      }
    };

    const requestPresign = async (month, file, uploadToken) => {
      const headers = { 'Content-Type': 'application/json' };
      const authToken = resolveAuthToken();
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const body = {
        month,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        uploadToken,
      };

      const response = await fetch(presignEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `Presign request failed (${response.status}). ${errorText || 'Check the upload service logs for more detail.'}`
        );
      }

      const result = await response.json();
      const { uploadUrl, fields, fileUrl, key } = result || {};

      if (!uploadUrl || !fields) {
        throw new Error('Presign response was missing the upload URL or required fields.');
      }

      return { uploadUrl, fields, fileUrl, key, raw: result };
    };

    const uploadToS3 = async (uploadUrl, fields, file) => {
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', file);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`S3 upload failed (${response.status}). ${errorText || 'The storage service returned an error.'}`);
      }
    };

    const confirmUpload = async ({ filename, key, contentType, size, month, uploadToken, fileUrl }) => {
      if (!confirmEndpoint) return;
      const headers = { 'Content-Type': 'application/json' };
      const authToken = resolveAuthToken();
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const body = {
        filename,
        key,
        contentType,
        size,
        month,
        uploadToken,
        fileUrl,
      };

      const response = await fetch(confirmEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `Upload confirmation failed (${response.status}). ${errorText || 'Metadata could not be saved.'}`
        );
      }
    };

    const uploadEntry = async (entry, month, { resetStatus = true } = {}) => {
      if (!entry || entry.isUploading) return false;
      if (resetStatus) {
        entry.retryButton.hidden = true;
      }

      if (entry.file.size > MAX_FILE_BYTES) {
        markEntryStatus(entry, 'File exceeds the 100MB limit.', 'error');
        entry.retryButton.hidden = true;
        return false;
      }

      if (!isAcceptedFileType(entry.file)) {
        markEntryStatus(entry, 'Unsupported file type. Please upload JPEG, PNG, HEIC, WEBP, MP4, MOV, or WEBM.', 'error');
        entry.retryButton.hidden = true;
        return false;
      }

      entry.isUploading = true;
      entry.element.classList.add('is-uploading');
      markEntryStatus(entry, 'Requesting upload slot…');

      try {
        const uploadToken = createUploadToken();
        entry.uploadToken = uploadToken;
        const presign = await requestPresign(month, entry.file, uploadToken);
        markEntryStatus(entry, 'Uploading to storage…');
        await uploadToS3(presign.uploadUrl, presign.fields, entry.file);

        const objectKey = presign.key || presign.fields?.key || '';
        markEntryStatus(entry, 'Finalizing upload…');
        await confirmUpload({
          filename: entry.file.name,
          key: objectKey,
          contentType: entry.file.type || 'application/octet-stream',
          size: entry.file.size,
          month,
          uploadToken,
          fileUrl: presign.fileUrl || '',
        });

        attachPreview(entry);
        if (presign.fileUrl) {
          entry.linkEl.hidden = false;
          entry.linkEl.href = presign.fileUrl;
        }
        markEntryStatus(entry, 'Upload complete', 'success');
        entry.retryButton.hidden = true;
        entry.state = 'success';
        console.info('[Upload] File available at', presign.fileUrl || '(URL pending propagation)');
        return true;
      } catch (error) {
        console.error('[Upload] Failed to process file', entry.file.name, error);
        markEntryStatus(entry, `Failed to upload: ${error.message || error}`, 'error');
        entry.retryButton.hidden = false;
        entry.state = 'error';
        return false;
      } finally {
        entry.isUploading = false;
        entry.element.classList.remove('is-uploading');
      }
    };

    const handleUpload = async (event) => {
      event.preventDefault();
      resetStatus();

      if (!fileEntries.size) {
        setStatus('Select at least one file to upload.', 'error');
        fileInput?.focus();
        return;
      }

      if (!monthSelect || !monthSelect.value) {
        setStatus('Choose a month so we know where to store these memories.', 'error');
        monthSelect?.focus();
        return;
      }

      toggleUploadingState(true);
      setStatus('Starting uploads…');

      let successCount = 0;
      let failureCount = 0;

      const entries = Array.from(fileEntries.values());
      for (const entry of entries) {
        if (entry.state === 'success') continue;
        const ok = await uploadEntry(entry, monthSelect.value, { resetStatus: true });
        if (ok) {
          successCount += 1;
        } else {
          failureCount += 1;
        }
      }

      toggleUploadingState(false);

      if (failureCount && successCount) {
        setStatus(`Uploads finished with ${successCount} success${successCount === 1 ? '' : 'es'} and ${failureCount} failure${failureCount === 1 ? '' : 's'}.`, 'error');
      } else if (failureCount) {
        setStatus('Uploads failed. Please review each item and retry.', 'error');
      } else {
        setStatus('Upload complete. All files are ready for review.', 'success');
        form.reset();
        syncFileList();
      }
    };

    fileInput?.addEventListener('change', () => {
      resetStatus();
      syncFileList();
    });

    form.addEventListener('submit', handleUpload);
    syncFileList();
  });
})();
