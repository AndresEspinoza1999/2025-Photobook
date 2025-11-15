(function () {
  const MAX_FILE_BYTES = 62914560; // 60 MB
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

  onReady(() => {
    const form = document.querySelector('.upload-form');
    if (!form) return;

    const monthSelect = form.querySelector('select[name="month"]');
    const fileInput = form.querySelector('input[type="file"][name="files"]');
    const statusEl = form.querySelector('[data-upload-status]');
    const listEl = form.querySelector('[data-upload-file-list]');
    const submitButton = form.querySelector('button[type="submit"]');

    const endpoint =
      getMetaContent('sc9-upload-endpoint') ||
      form.getAttribute('data-upload-endpoint') ||
      '';

    const resolveAuthToken = () =>
      getMetaContent('sc9-upload-token') ||
      form.getAttribute('data-upload-token') ||
      (typeof window !== 'undefined' && window.SC9_UPLOAD_TOKEN ? window.SC9_UPLOAD_TOKEN : '');

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

    const renderFileList = () => {
      if (!listEl || !fileInput) return;
      listEl.innerHTML = '';
      const files = Array.from(fileInput.files || []);
      files.forEach((file) => {
        const item = document.createElement('li');
        item.className = 'upload-file';
        item.innerHTML = `
          <span class="upload-file__name">${file.name}</span>
          <span class="upload-file__meta">${file.type || 'unknown'} · ${formatBytes(file.size)}</span>
        `;
        listEl.appendChild(item);
      });
    };

    fileInput?.addEventListener('change', () => {
      renderFileList();
      resetStatus();
    });

    if (!endpoint) {
      setStatus('Upload endpoint is not configured. Add the meta tag to continue.', 'error');
      return;
    }

    const requestPresign = async (month, file) => {
      const headers = { 'Content-Type': 'application/json' };
      const authToken = resolveAuthToken();
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const body = {
        month,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `Presign request failed (${response.status}). ${errorText || 'Check API Gateway logs for details.'}`
        );
      }

      const result = await response.json();
      const { uploadUrl, fields, fileUrl } = result || {};

      if (!uploadUrl || !fields) {
        throw new Error('Presign response missing uploadUrl or fields.');
      }

      return { uploadUrl, fields, fileUrl, raw: result };
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
        throw new Error(`S3 upload failed (${response.status}). ${errorText || 'No response body returned.'}`);
      }
    };

    const updateResultsList = (successes, failures) => {
      if (!listEl) return;
      listEl.innerHTML = '';

      successes.forEach(({ file, fileUrl, position }) => {
        const item = document.createElement('li');
        item.className = 'upload-file upload-file--success';
        const link = fileUrl
          ? `<a href="${fileUrl}" target="_blank" rel="noopener">Open file</a>`
          : '';
        item.innerHTML = `
          <span class="upload-file__name">${file.name}</span>
          <span class="upload-file__meta">Uploaded (${position}) ${link}</span>
        `;
        listEl.appendChild(item);
      });

      failures.forEach(({ file, error }) => {
        const item = document.createElement('li');
        item.className = 'upload-file upload-file--error';
        item.innerHTML = `
          <span class="upload-file__name">${file.name}</span>
          <span class="upload-file__meta">${error.message || 'Upload failed'}</span>
        `;
        listEl.appendChild(item);
      });
    };

    const handleUpload = async (event) => {
      event.preventDefault();
      resetStatus();

      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        setStatus('Select at least one photo to upload.', 'error');
        fileInput?.focus();
        return;
      }

      if (!monthSelect || !monthSelect.value) {
        setStatus('Choose a month so we know where to store these memories.', 'error');
        monthSelect?.focus();
        return;
      }

      const files = Array.from(fileInput.files).slice(0, 20);

      const tooLarge = files.find((file) => file.size > MAX_FILE_BYTES);
      if (tooLarge) {
        alert('File too large. Please upload photos/videos under 1 minute (max 60MB).');
        setStatus(`${tooLarge.name} exceeds the 60MB upload limit.`, 'error');
        return;
      }
      setStatus(`Preparing uploads for ${files.length} file${files.length === 1 ? '' : 's'}…`);
      toggleUploadingState(true);

      const successes = [];
      const failures = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        try {
          setStatus(`Uploading ${file.name} (${index + 1} of ${files.length})…`);
          const presign = await requestPresign(monthSelect.value, file);
          await uploadToS3(presign.uploadUrl, presign.fields, file);
          if (presign.fileUrl) {
            console.info('[Upload] File available at', presign.fileUrl);
          }
          successes.push({
            file,
            fileUrl: presign.fileUrl || null,
            position: `${index + 1}/${files.length}`,
          });
        } catch (error) {
          console.error('[Upload] Failed to process file', file.name, error);
          failures.push({ file, error: error instanceof Error ? error : new Error(String(error)) });
        }
      }

      toggleUploadingState(false);
      updateResultsList(successes, failures);

      if (failures.length) {
        const failureSummary = failures
          .map(({ file, error }) => `${file.name}: ${error.message}`)
          .join('\n');
        setStatus(`Some uploads failed.\n${failureSummary}`, 'error');
      } else {
        setStatus('Upload complete. All files are ready for review.', 'success');
        form.reset();
        renderFileList();
      }
    };

    form.addEventListener('submit', handleUpload);
    renderFileList();
  });
})();
