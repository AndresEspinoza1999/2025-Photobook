const DATA_URL = '../data/sample-data.json';

async function loadData() {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to load data: ${response.status}`);
  }
  return response.json();
}

function renderOptions(select, items, getLabel) {
  for (const value of items) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = getLabel ? getLabel(value) : value;
    select.appendChild(option);
  }
}

function createMediaPreview(media) {
  if (media.type === 'video') {
    const video = document.createElement('video');
    video.src = media.src;
    video.controls = false;
    video.muted = true;
    video.loop = true;
    video.setAttribute('playsinline', '');
    video.dataset.fullSrc = media.src;
    video.addEventListener('mouseenter', () => video.play());
    video.addEventListener('mouseleave', () => video.pause());
    const fallback = document.createElement('div');
    fallback.className = 'video-fallback';
    return video;
  }

  const img = document.createElement('img');
  img.src = media.src;
  img.alt = media.alt || media.title;
  img.dataset.fullSrc = media.src;
  return img;
}

function openModal(media, participantsMap) {
  const modal = document.getElementById('mediaModal');
  const body = document.getElementById('modalBody');
  body.innerHTML = '';

  const title = document.createElement('h2');
  title.id = 'modalTitle';
  title.textContent = media.title;
  body.appendChild(title);

  let mediaElement;
  if (media.type === 'video') {
    mediaElement = document.createElement('video');
    mediaElement.src = media.src;
    mediaElement.controls = true;
  } else if (media.type === 'audio') {
    mediaElement = document.createElement('audio');
    mediaElement.src = media.src;
    mediaElement.controls = true;
  } else {
    mediaElement = document.createElement('img');
    mediaElement.src = media.src;
    mediaElement.alt = media.alt || media.title;
  }
  body.appendChild(mediaElement);

  if (media.description) {
    const description = document.createElement('p');
    description.textContent = media.description;
    body.appendChild(description);
  }

  const details = document.createElement('div');
  details.className = 'meta';
  const credit = media.credit ? `Credit: ${media.credit}` : '';
  const captured = media.capturedAt ? `Captured: ${new Date(media.capturedAt).toLocaleString()}` : '';
  details.textContent = [credit, captured].filter(Boolean).join(' • ');
  if (details.textContent) {
    body.appendChild(details);
  }

  if (media.participants?.length) {
    const participantSection = document.createElement('div');
    participantSection.className = 'participant-list';
    for (const participantId of media.participants) {
      const participant = participantsMap.get(participantId);
      if (!participant) continue;
      const pill = document.createElement('span');
      pill.className = 'participant-pill';
      pill.textContent = participant.name;
      participantSection.appendChild(pill);
    }
    body.appendChild(participantSection);
  }

  modal.hidden = false;
}

function closeModal() {
  const modal = document.getElementById('mediaModal');
  modal.hidden = true;
  const body = document.getElementById('modalBody');
  body.innerHTML = '';
}

document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('mediaModal').addEventListener('click', (event) => {
  if (event.target.id === 'mediaModal') {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});

function buildLookup(items) {
  return new Map(items.map((item) => [item.id, item]));
}

function render(events, mediaMap, participantsMap, filters) {
  const list = document.getElementById('eventList');
  list.innerHTML = '';

  const filteredEvents = events.filter((event) => {
    const themeMatch = !filters.theme || event.themes?.includes(filters.theme);
    const participantMatch =
      !filters.participant || event.participants?.includes(filters.participant) ||
      event.media?.some((mediaId) => mediaMap.get(mediaId)?.participants?.includes(filters.participant));
    return themeMatch && participantMatch;
  });

  for (const event of filteredEvents) {
    const card = document.createElement('article');
    card.className = 'event-card';

    const heroMedia = mediaMap.get(event.heroMediaId) || mediaMap.get(event.media?.[0]);
    if (heroMedia) {
      const preview = createMediaPreview(heroMedia);
      preview.addEventListener('click', () => openModal(heroMedia, participantsMap));
      card.appendChild(preview);
    }

    const content = document.createElement('div');
    content.className = 'event-content';

    const title = document.createElement('h2');
    title.className = 'event-title';
    title.textContent = event.title;
    content.appendChild(title);

    if (event.summary) {
      const summary = document.createElement('p');
      summary.textContent = event.summary;
      content.appendChild(summary);
    }

    const meta = document.createElement('p');
    meta.className = 'meta';
    const dateRange = event.endDate && event.endDate !== event.startDate
      ? `${event.startDate} – ${event.endDate}`
      : event.startDate;
    const locationBits = [event.location?.venue, event.location?.city, event.location?.country]
      .filter(Boolean)
      .join(', ');
    meta.textContent = [dateRange, locationBits].filter(Boolean).join(' • ');
    content.appendChild(meta);

    if (event.participants?.length) {
      const participantList = document.createElement('div');
      participantList.className = 'participant-list';
      for (const participantId of event.participants) {
        const participant = participantsMap.get(participantId);
        if (!participant) continue;
        const pill = document.createElement('span');
        pill.className = 'participant-pill';
        pill.textContent = participant.name;
        participantList.appendChild(pill);
      }
      content.appendChild(participantList);
    }

    if (event.themes?.length) {
      const badges = document.createElement('div');
      badges.className = 'badges';
      for (const theme of event.themes) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = theme;
        badges.appendChild(badge);
      }
      content.appendChild(badges);
    }

    const viewBtn = document.createElement('button');
    viewBtn.className = 'button-link';
    viewBtn.type = 'button';
    viewBtn.textContent = 'View Media';
    viewBtn.addEventListener('click', () => {
      if (!event.media?.length) return;
      const mediaItems = event.media.map((id) => mediaMap.get(id)).filter(Boolean);
      if (mediaItems.length) {
        openModal(mediaItems[0], participantsMap);
      }
    });
    content.appendChild(viewBtn);

    card.appendChild(content);
    list.appendChild(card);
  }
}

function initFilters(events, participants) {
  const themeSelect = document.getElementById('themeFilter');
  const participantSelect = document.getElementById('participantFilter');

  const uniqueThemes = new Set();
  for (const event of events) {
    for (const theme of event.themes || []) {
      uniqueThemes.add(theme);
    }
  }
  renderOptions(themeSelect, [...uniqueThemes].sort());
  renderOptions(participantSelect, participants.map((p) => p.id), (id) => participants.find((p) => p.id === id)?.name ?? id);
}

async function main() {
  try {
    const data = await loadData();
    const mediaMap = buildLookup(data.media);
    const participantsMap = buildLookup(data.participants);

    initFilters(data.events, data.participants);

    const filters = { theme: '', participant: '' };
    const themeSelect = document.getElementById('themeFilter');
    const participantSelect = document.getElementById('participantFilter');

    const rerender = () => render(data.events, mediaMap, participantsMap, filters);

    themeSelect.addEventListener('change', (event) => {
      filters.theme = event.target.value;
      rerender();
    });
    participantSelect.addEventListener('change', (event) => {
      filters.participant = event.target.value;
      rerender();
    });

    rerender();
  } catch (error) {
    const list = document.getElementById('eventList');
    list.innerHTML = `<p role="alert">${error.message}</p>`;
    console.error(error);
  }
}

main();
