(function () {
  const ready = (fn) => {
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

  ready(() => {
    const form = document.querySelector('.upload-form[data-upload-endpoint]');
    if (!form) return;

    const endpoint = form.getAttribute('data-upload-endpoint');
    const monthSelect = form.querySelector('select[name="month"]');
    const notesInput = form.querySelector('textarea[name="notes"]');
    const photographerInput = form.querySelector('input[name="photographer"]');
    const fileInput = form.querySelector('input[type="file"][name="files"]');
    const statusEl = form.querySelector('[data-upload-status]');
    const listEl = form.querySelector('[data-upload-file-list]');
    const submitButton = form.querySelector('button[type="submit"]');

    if (!endpoint) {
      if (statusEl) {
        statusEl.textContent =
          'Upload endpoint is not configured. Update data-upload-endpoint on the form to continue.';
      }
      return;
    }

    const resetStatus = () => {
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.classList.remove('is-error', 'is-success');
      }
    };

    const setStatus = (message, type = 'info') => {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.classList.remove('is-error', 'is-success');
      if (type === 'error') statusEl.classList.add('is-error');
      if (type === 'success') statusEl.classList.add('is-success');
    };

    const renderFileList = () => {
      if (!listEl) return;
      listEl.innerHTML = '';
      const files = fileInput?.files ? Array.from(fileInput.files) : [];
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

    const resolveAuthToken = () => {
      const datasetToken = form.getAttribute('data-upload-token');
      if (datasetToken) return datasetToken;
      const meta = document.querySelector('meta[name="sc9-upload-token"]');
      if (meta && meta.content) return meta.content;
      if (typeof window !== 'undefined' && window.SC9_UPLOAD_TOKEN) {
        return window.SC9_UPLOAD_TOKEN;
      }
      return '';
    };

    const createPayload = (file) => {
      return {
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        month: monthSelect?.value || '',
        notes: notesInput?.value || '',
        photographer: photographerInput?.value || '',
      };
    };

    const uploadViaPresignedPost = async ({ uploadUrl, fields }, file) => {
      const formData = new FormData();
      Object.entries(fields || {}).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', file);
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }
    };

    const uploadViaPut = async ({ uploadUrl }, file) => {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }
    };

    const performUpload = async (file, index, total) => {
      const payload = createPayload(file);
      if (!payload.month) {
        throw new Error('Choose a month before uploading.');
      }

      const headers = { 'Content-Type': 'application/json' };
      const authToken = resolveAuthToken();
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to create upload link (${response.status}): ${errorBody}`);
      }

      const result = await response.json();
      const { uploadUrl, fields, fileUrl } = result;
      if (!uploadUrl) {
        throw new Error('Upload endpoint did not return an uploadUrl.');
      }

      if (fields) {
        await uploadViaPresignedPost({ uploadUrl, fields }, file);
      } else {
        await uploadViaPut({ uploadUrl }, file);
      }

      return {
        fileUrl: fileUrl || result.publicUrl || null,
        index,
        total,
      };
    };

    const handleSubmit = async (event) => {
      event.preventDefault();
      resetStatus();

      if (!fileInput?.files || fileInput.files.length === 0) {
        setStatus('Select at least one image to upload.', 'error');
        fileInput?.focus();
        return;
      }

      if (!monthSelect?.value) {
        setStatus('Choose a month so we know where to file these memories.', 'error');
        monthSelect?.focus();
        return;
      }

      const files = Array.from(fileInput.files).slice(0, 20);
      setStatus(`Requesting upload link for ${files.length} file${files.length > 1 ? 's' : ''}…`);
      submitButton?.setAttribute('disabled', 'true');
      form.classList.add('is-uploading');

      const successes = [];
      const failures = [];

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        try {
          setStatus(`Uploading ${file.name} (${i + 1} of ${files.length})…`);
          const result = await performUpload(file, i + 1, files.length);
          successes.push({ file, result });
        } catch (error) {
          console.error('Upload failed', error);
          failures.push({ file, error });
        }
      }

      form.classList.remove('is-uploading');
      submitButton?.removeAttribute('disabled');

      if (listEl) {
        listEl.innerHTML = '';
        if (successes.length) {
          successes.forEach(({ file, result }) => {
            const item = document.createElement('li');
            item.className = 'upload-file upload-file--success';
            const link = result.fileUrl
              ? `<a href="${result.fileUrl}" target="_blank" rel="noopener">View uploaded file</a>`
              : '';
            item.innerHTML = `
              <span class="upload-file__name">${file.name}</span>
              <span class="upload-file__meta">Uploaded (${result.index}/${result.total}) ${link}</span>
            `;
            listEl.appendChild(item);
          });
        }
        if (failures.length) {
          failures.forEach(({ file, error }) => {
            const item = document.createElement('li');
            item.className = 'upload-file upload-file--error';
            item.innerHTML = `
              <span class="upload-file__name">${file.name}</span>
              <span class="upload-file__meta">${(error && error.message) || 'Upload failed'}</span>
            `;
            listEl.appendChild(item);
          });
        }
      }

      if (failures.length) {
        const message = failures
          .map(({ file, error }) => `${file.name}: ${(error && error.message) || 'Unknown error'}`)
          .join('\n');
        setStatus(`Some uploads failed:\n${message}`, 'error');
      } else {
        setStatus(`All uploads completed. ${successes.length} file${successes.length === 1 ? '' : 's'} ready for review.`, 'success');
        form.reset();
        renderFileList();
      }
    };

    form.addEventListener('submit', handleSubmit);
    renderFileList();
  });
})();
