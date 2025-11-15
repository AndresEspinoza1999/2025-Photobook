(function () {
  const onReady = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  const disableControls = (form) => {
    form.querySelectorAll('input, select, textarea, button').forEach((el) => {
      el.setAttribute('disabled', 'true');
    });
  };

  onReady(() => {
    const form = document.querySelector('.upload-form');
    if (!form) return;

    const statusEl = form.querySelector('[data-upload-status]');
    const message =
      'Uploads are temporarily paused while we rebuild the workflow on Firebase Storage. Check back soon or share assets via the shared drive.';

    if (statusEl) {
      statusEl.textContent = message;
      statusEl.classList.add('is-error');
    }

    disableControls(form);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (statusEl) {
        statusEl.textContent = message;
      }
    });
  });
})();
