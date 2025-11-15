document.addEventListener('DOMContentLoaded', () => {
  const galleries = document.querySelectorAll('[data-gallery]');
  if (!galleries.length) return;

  const loadImage = (img) => {
    const dataSrc = img.getAttribute('data-src');
    if (!dataSrc) return;
    img.src = dataSrc;
    img.removeAttribute('data-src');
  };

  const observer =
    'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage(entry.target);
              observer.unobserve(entry.target);
            }
          });
        }, { rootMargin: '0px 0px 240px 0px', threshold: 0.1 })
      : null;

  galleries.forEach((gallery) => {
    const images = gallery.querySelectorAll('img[data-src]');
    images.forEach((img) => {
      img.loading = 'lazy';
      if (observer) {
        observer.observe(img);
      } else {
        loadImage(img);
      }
    });
  });

  const lightbox = createLightbox(loadImage);

  galleries.forEach((gallery) => {
    const thumbnails = Array.from(gallery.querySelectorAll('img'));

    thumbnails.forEach((img, index) => {
      img.tabIndex = 0;
      img.dataset.galleryIndex = String(index);
    });

    const openFromThumbnail = (target) => {
      const index = Number.parseInt(target.dataset.galleryIndex || '0', 10);
      lightbox.open({ trigger: target, items: thumbnails, index });
    };

    gallery.addEventListener('click', (event) => {
      const target = event.target.closest('img');
      if (!target || !gallery.contains(target)) return;
      event.preventDefault();
      openFromThumbnail(target);
    });

    gallery.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target.closest('img');
      if (!target || !gallery.contains(target)) return;
      event.preventDefault();
      openFromThumbnail(target);
    });
  });
});

function createLightbox(loadImage) {
  const template = document.createElement('div');
  template.className = 'lightbox';
  template.setAttribute('role', 'dialog');
  template.setAttribute('aria-modal', 'true');
  template.innerHTML = `
    <div class="lightbox__inner">
      <button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="Previous image">&#10094;</button>
      <button type="button" class="lightbox__close" aria-label="Close lightbox">&times;</button>
      <img class="lightbox__image" alt="Expanded gallery item" />
      <p class="lightbox__caption"></p>
      <div class="lightbox__meta">
        <span class="lightbox__counter" aria-live="polite"></span>
        <div class="lightbox__actions">
          <button type="button" class="lightbox__share" data-share="copy" aria-label="Copy photo link">Copy link</button>
          <button type="button" class="lightbox__share" data-share="share" aria-label="Share this photo">Share</button>
        </div>
      </div>
      <button type="button" class="lightbox__nav lightbox__nav--next" aria-label="Next image">&#10095;</button>
    </div>
  `;

  const lightboxImage = template.querySelector('.lightbox__image');
  const lightboxCaption = template.querySelector('.lightbox__caption');
  const closeButton = template.querySelector('.lightbox__close');
  const prevButton = template.querySelector('.lightbox__nav--prev');
  const nextButton = template.querySelector('.lightbox__nav--next');
  const counter = template.querySelector('.lightbox__counter');
  const shareButtons = Array.from(template.querySelectorAll('.lightbox__share'));

  let activeItems = [];
  let activeIndex = -1;
  let previouslyFocused = null;
  let currentShareUrl = '';
  let focusableControls = [];
  let touchStartX = null;
  let touchStartY = null;

  const updateLightbox = () => {
    if (!activeItems.length || activeIndex < 0) return;
    const target = activeItems[activeIndex];
    if (!target) return;

    if (target.hasAttribute('data-src') && !target.getAttribute('src')) {
      loadImage(target);
    }

    const activeSrc = target.getAttribute('src') || target.getAttribute('data-src') || '';
    if (!activeSrc) return;

    lightboxImage.src = activeSrc;
    lightboxImage.alt = target.alt || 'Expanded gallery item';
    lightboxCaption.textContent = target.getAttribute('data-caption') || target.alt || '';
    if (counter) {
      counter.textContent = `${activeIndex + 1} / ${activeItems.length}`;
    }
    currentShareUrl = `${window.location.href.split('#')[0]}#slide-${activeIndex + 1}`;
  };

  const close = () => {
    template.classList.remove('is-active');
    document.body.removeAttribute('data-lightbox-open');
    document.removeEventListener('keydown', onKeyDown);
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
    previouslyFocused = null;
    activeItems = [];
    activeIndex = -1;
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      navigate(1);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navigate(-1);
      return;
    }

    if (event.key === 'Tab') {
      trapFocus(event);
    }
  };

  closeButton.addEventListener('click', close);
  template.addEventListener('click', (event) => {
    if (event.target === template) {
      close();
    }
  });

  const trapFocus = (event) => {
    const focusable = focusableControls.filter((el) => el && !el.hasAttribute('disabled'));
    if (!focusable.length) return;

    let currentIndex = focusable.indexOf(document.activeElement);
    if (currentIndex === -1) {
      currentIndex = event.shiftKey ? 0 : focusable.length - 1;
    }
    let nextIndex = currentIndex;

    if (event.shiftKey) {
      nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex === focusable.length - 1 ? 0 : currentIndex + 1;
    }

    event.preventDefault();
    focusable[nextIndex].focus();
  };

  const navigate = (step) => {
    if (!activeItems.length) return;
    activeIndex = (activeIndex + step + activeItems.length) % activeItems.length;
    updateLightbox();
  };

  prevButton.addEventListener('click', () => navigate(-1));
  nextButton.addEventListener('click', () => navigate(1));

  const handleShare = async (button) => {
    if (!button) return;
    const action = button.getAttribute('data-share');
    const shareUrl = currentShareUrl || window.location.href;

    if (action === 'copy' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        button.setAttribute('data-share-state', 'copied');
      } catch (error) {
        console.warn('Copy failed', error);
      }
      return;
    }

    if (action === 'share' && navigator.share) {
      try {
        await navigator.share({ url: shareUrl, title: document.title });
      } catch (error) {
        console.warn('Share cancelled or failed', error);
      }
      return;
    }

    // Fallback: open share URL in a new tab as a stub interaction.
    window.open(shareUrl, '_blank', 'noopener');
  };

  shareButtons.forEach((button) => {
    button.addEventListener('click', () => handleShare(button));
  });

  template.addEventListener('touchstart', (event) => {
    if (!event.touches || event.touches.length !== 1) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  });

  template.addEventListener('touchend', (event) => {
    if (touchStartX === null || touchStartY === null) return;
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    navigate(deltaX > 0 ? -1 : 1);
  });

  const open = ({ trigger, items, index }) => {
    if (!items || !items.length) return;

    activeItems = items;
    activeIndex = Number.isInteger(index) ? index : 0;
    previouslyFocused = trigger || document.activeElement;
    focusableControls = [prevButton, ...shareButtons, closeButton, nextButton];
    shareButtons.forEach((button) => button.removeAttribute('data-share-state'));

    updateLightbox();

    template.classList.add('is-active');
    document.body.setAttribute('data-lightbox-open', 'true');
    document.addEventListener('keydown', onKeyDown);

    const initialFocus = focusableControls.find((el) => el && el.offsetParent !== null) || closeButton;
    if (initialFocus) {
      initialFocus.focus();
    }
  };

  document.body.appendChild(template);

  return { open, close };
}
