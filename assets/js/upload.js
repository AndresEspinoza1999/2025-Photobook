(function () {
  const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
  const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
  const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100MB for Firebase Storage prep
  const MAX_FILES = 20;

  const onReady = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes)) return '0 B';
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
    const el = document.querySelector(`meta[name="${name}"]`);
    return el && typeof el.content === 'string' ? el.content.trim() : '';
  };

  const createObjectURL = (file) => {
    if (!('URL' in window) || typeof URL.createObjectURL !== 'function') {
      return '';
    }
    return URL.createObjectURL(file);
  };

  const revokeObjectURL = (url) => {
    if (!url) return;
    if ('URL' in window && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(url);
    }
  };

  onReady(() => {
    const form = document.querySelector('.upload-form');
    if (!form) return;

    const monthSelect = form.querySelector('select[name="month"]');
    const photographerInput = form.querySelector('input[name="photographer"]');
    const notesInput = form.querySelector('textarea[name="notes"]');
    const fileInput = form.querySelector('input[type="file"][name="files"]');
    const statusEl = form.querySelector('[data-upload-status]');
    const listEl = form.querySelector('[data-upload-file-list]');
    const submitButton = form.querySelector('button[type="submit"]');

    const firebaseConfig = {
      createEndpoint: getMetaContent('sc9-firebase-create-upload'),
      confirmEndpoint: getMetaContent('sc9-firebase-confirm-upload'),
    };

    const queue = [];

    const setGlobalStatus = (message, variant = 'info') => {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.classList.remove('is-error', 'is-success');
      if (variant === 'error') statusEl.classList.add('is-error');
      if (variant === 'success') statusEl.classList.add('is-success');
    };

    const createListItem = (file) => {
      const item = document.createElement('li');
      item.className = 'upload-file';

      const previewWrapper = document.createElement('div');
      previewWrapper.className = 'upload-file__preview';

      const details = document.createElement('div');
      details.className = 'upload-file__details';

      const nameEl = document.createElement('p');
      nameEl.className = 'upload-file__name';
      nameEl.textContent = file.name;

      const metaEl = document.createElement('p');
      metaEl.className = 'upload-file__meta';
      metaEl.textContent = `${file.type || 'unknown'} · ${formatBytes(file.size)}`;

      const statusText = document.createElement('p');
      statusText.className = 'upload-file__status text-sm text-muted';
      statusText.textContent = 'Ready for Firebase deployment';

      details.append(nameEl, metaEl, statusText);

      const previewUrl = createObjectURL(file);
      let previewEl;
      if (previewUrl && ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        previewEl = document.createElement('img');
        previewEl.src = previewUrl;
        previewEl.alt = `Preview of ${file.name}`;
      } else if (previewUrl && ACCEPTED_VIDEO_TYPES.includes(file.type)) {
        previewEl = document.createElement('video');
        previewEl.src = previewUrl;
        previewEl.controls = true;
        previewEl.muted = true;
        previewEl.playsInline = true;
      } else {
        previewEl = document.createElement('div');
        previewEl.textContent = 'Preview unavailable';
        previewEl.className = 'upload-file__preview--placeholder';
      }

      previewWrapper.appendChild(previewEl);
      item.append(previewWrapper, details);
      return { item, statusText, previewUrl };
    };

    const clearQueue = () => {
      queue.forEach((entry) => revokeObjectURL(entry.previewUrl));
      queue.splice(0, queue.length);
      if (listEl) {
        listEl.innerHTML = '';
      }
    };

    const addFilesToQueue = (files) => {
      clearQueue();
      const fileArray = Array.from(files || []).slice(0, MAX_FILES);
      fileArray.forEach((file) => {
        const { item, statusText, previewUrl } = createListItem(file);
        if (previewUrl) {
          item.setAttribute('data-preview-url', previewUrl);
        }
        listEl?.appendChild(item);
        queue.push({ file, statusText, element: item, previewUrl });
      });
    };

    const validateFile = (file) => {
      const allowed = ACCEPTED_IMAGE_TYPES.concat(ACCEPTED_VIDEO_TYPES);
      if (!allowed.includes(file.type)) {
        return { valid: false, message: 'Unsupported file type for the new Firebase workflow.' };
      }
      if (file.size > MAX_FILE_BYTES) {
        return { valid: false, message: 'File too large. Keep uploads under 100MB.' };
      }
      return { valid: true };
    };

    const setFileStatus = (entry, message, variant = 'info') => {
      if (!entry || !entry.statusText) return;
      entry.statusText.textContent = message;
      entry.statusText.classList.remove('is-error', 'is-success');
      if (variant === 'error') {
        entry.statusText.classList.add('is-error');
      } else if (variant === 'success') {
        entry.statusText.classList.add('is-success');
      }
    };

    const requestUploadTicket = async ({ file, month, photographer, notes }) => {
      if (!firebaseConfig.createEndpoint) {
        throw new Error('Configure the `sc9-firebase-create-upload` meta tag to enable uploads.');
      }

      const response = await fetch(firebaseConfig.createEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
          month,
          photographer: photographer || '',
          notes: notes || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Firebase upload endpoint returned an error while requesting a ticket.');
      }

      return response.json();
    };

    const uploadToStorage = async () => {
      throw new Error('Firebase Storage upload is not wired up yet. Implement uploadToStorage once the backend is ready.');
    };

    const confirmUpload = async (ticketPayload, meta) => {
      if (!firebaseConfig.confirmEndpoint) return;
      try {
        await fetch(firebaseConfig.confirmEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket: ticketPayload, meta }),
        });
      } catch (error) {
        console.warn('Upload confirmation failed:', error);
      }
    };

    const processEntry = async (entry, meta) => {
      const { file } = entry;
      const validation = validateFile(file);
      if (!validation.valid) {
        setFileStatus(entry, validation.message, 'error');
        return;
      }

      if (!firebaseConfig.createEndpoint) {
        setFileStatus(entry, 'Waiting for Firebase endpoints. Update meta tags to enable uploads.', 'error');
        return;
      }

      setFileStatus(entry, 'Requesting Firebase upload ticket…');
      const ticket = await requestUploadTicket({ file, ...meta });

      setFileStatus(entry, 'Uploading to Firebase Storage…');
      await uploadToStorage(ticket, file);

      setFileStatus(entry, 'Confirming upload…');
      await confirmUpload(ticket, meta);

      setFileStatus(entry, 'Upload complete', 'success');
    };

    const handleSubmit = async (event) => {
      event.preventDefault();
      if (!queue.length) {
        setGlobalStatus('Select at least one photo or video to upload.', 'error');
        return;
      }
      if (!monthSelect?.value) {
        setGlobalStatus('Choose a month so we know where to file these memories.', 'error');
        return;
      }

      const meta = {
        month: monthSelect.value,
        photographer: photographerInput?.value?.trim() || '',
        notes: notesInput?.value?.trim() || '',
      };

      setGlobalStatus('Validating files…');
      submitButton?.setAttribute('disabled', 'true');

      for (const entry of queue) {
        try {
          await processEntry(entry, meta);
        } catch (error) {
          setFileStatus(entry, error.message || 'Upload failed', 'error');
        }
      }

      submitButton?.removeAttribute('disabled');
      setGlobalStatus('Uploads will activate automatically once Firebase Functions are live.', 'info');
    };

    fileInput?.addEventListener('change', () => {
      addFilesToQueue(fileInput.files);
      setGlobalStatus('Files staged. Submit once Firebase endpoints are configured.');
    });

    form.addEventListener('submit', handleSubmit);
  });
})();
