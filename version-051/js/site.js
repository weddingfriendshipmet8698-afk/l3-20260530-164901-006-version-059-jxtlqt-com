(() => {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const onReady = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  const debounce = (fn, wait = 120) => {
    let t = 0;
    return (...args) => {
      window.clearTimeout(t);
      t = window.setTimeout(() => fn(...args), wait);
    };
  };

  const normalize = (value) =>
    String(value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

  const setupHeader = () => {
    const header = qs('.site-header');
    if (!header) return;

    const toggle = qs('[data-nav-toggle]', header);
    const navPanel = qs('.nav-panel', header);

    const closeNav = () => {
      header.classList.remove('nav-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    };

    if (toggle && navPanel) {
      toggle.addEventListener('click', () => {
        const open = header.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', String(open));
      });

      qsa('a', navPanel).forEach((link) => {
        link.addEventListener('click', () => {
          if (window.matchMedia('(max-width: 960px)').matches) closeNav();
        });
      });
    }

    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      if (!window.matchMedia('(max-width: 960px)').matches) closeNav();
    });
  };

  const setupFadeIns = () => {
    const items = qsa('.fade-up');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    items.forEach((item) => observer.observe(item));
  };

  const applySearchFilter = (scope) => {
    const input = qs('[data-filter-input]', scope);
    const cards = qsa('[data-filter-card]', scope);
    if (!input || !cards.length) return;

    const update = () => {
      const q = normalize(input.value);
      let shown = 0;

      cards.forEach((card) => {
        const hay = normalize(card.dataset.search || card.textContent);
        const hit = !q || hay.includes(q);
        card.classList.toggle('hidden', !hit);
        if (hit) shown += 1;
      });

      const counter = qs('[data-filter-count]', scope);
      if (counter) counter.textContent = String(shown);
    };

    input.addEventListener('input', debounce(update, 80));
    update();
  };

  const sortCards = (scope) => {
    const select = qs('[data-sort-select]', scope);
    const grid = qs('[data-sort-target]', scope);
    if (!select || !grid) return;

    const getScore = (card, mode) => {
      const title = normalize(card.dataset.title);
      const year = Number(card.dataset.year || 0);
      const genre = normalize(card.dataset.genre);
      const region = normalize(card.dataset.region);
      switch (mode) {
        case 'title-asc':
          return title;
        case 'title-desc':
          return title.split('').reverse().join('');
        case 'year-asc':
          return year;
        case 'region':
          return `${region} ${title}`;
        case 'genre':
          return `${genre} ${title}`;
        case 'year-desc':
        default:
          return -year;
      }
    };

    const sortNow = () => {
      const cards = qsa('[data-sort-card]', grid);
      const mode = select.value || 'year-desc';
      const sorted = cards.slice().sort((a, b) => {
        const sa = getScore(a, mode);
        const sb = getScore(b, mode);
        if (typeof sa === 'number' && typeof sb === 'number') return sa - sb;
        return String(sa).localeCompare(String(sb), 'zh-Hans-CN-u-co-pinyin');
      });
      sorted.forEach((card) => grid.appendChild(card));
    };

    select.addEventListener('change', sortNow);
    sortNow();
  };

  const setupHeroCarousel = () => {
    const hero = qs('[data-hero-carousel]');
    if (!hero) return;

    const slides = qsa('[data-slide]', hero);
    const dots = qsa('[data-dot]', hero);
    const prev = qs('[data-prev]', hero);
    const next = qs('[data-next]', hero);

    if (!slides.length) return;

    let index = 0;
    let timer = null;

    const show = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
      dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    };

    const restart = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => show(index + 1), 5200);
    };

    if (prev) prev.addEventListener('click', () => { show(index - 1); restart(); });
    if (next) next.addEventListener('click', () => { show(index + 1); restart(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); restart(); }));

    hero.addEventListener('mouseenter', () => window.clearInterval(timer));
    hero.addEventListener('mouseleave', restart);

    show(0);
    restart();
  };

  const setupBackToTop = () => {
    const btn = qs('[data-back-to-top]');
    if (!btn) return;

    const onScroll = () => {
      btn.classList.toggle('is-visible', window.scrollY > 500);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const setupPlayer = () => {
    qsa('[data-player]').forEach((player) => {
      const video = qs('video', player);
      const overlay = qs('[data-player-overlay]', player);
      const button = qs('[data-player-toggle]', player);

      if (!video) return;

      const mp4 = video.dataset.mp4;
      const m3u8 = video.dataset.m3u8;

      const attachHls = () => {
        if (!m3u8) return false;

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          if (video.src !== m3u8) video.src = m3u8;
          return true;
        }

        if (window.Hls && window.Hls.isSupported()) {
          if (video.dataset.hlsBound === '1') return true;
          const hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false
          });
          hls.loadSource(m3u8);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            video.dataset.hlsBound = '1';
          });
          video._hlsInstance = hls;
          return true;
        }

        return false;
      };

      const setSource = () => {
        if (!attachHls() && mp4) {
          if (video.src !== mp4) video.src = mp4;
        }
      };

      const hideOverlay = () => overlay && overlay.classList.add('is-hidden');
      const showOverlay = () => overlay && overlay.classList.remove('is-hidden');

      if (button) {
        button.addEventListener('click', async (ev) => {
          ev.preventDefault();
          setSource();
          try {
            await video.play();
            hideOverlay();
          } catch (err) {
            // keep overlay visible if autoplay/play is blocked
          }
        });
      }

      video.addEventListener('play', hideOverlay);
      video.addEventListener('pause', showOverlay);
      video.addEventListener('ended', showOverlay);
      video.addEventListener('click', () => {
        if (video.paused) {
          setSource();
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });

      setSource();
    });
  };

  const setupGlobalSearchPage = () => {
    const app = qs('[data-global-search]');
    if (!app || !Array.isArray(window.MOVIE_INDEX)) return;

    const input = qs('[data-global-input]', app);
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q');
    const resultCount = qs('[data-global-count]', app);
    const grid = qs('[data-global-results]', app);
    const sort = qs('[data-global-sort]', app);
    const chips = qsa('[data-global-chip]', app);

    if (!input || !grid) return;

    if (initialQuery) {
      input.value = initialQuery;
    }

    const render = (items) => {
      grid.innerHTML = items.map((movie, idx) => `
        <article class="movie-card fade-up is-visible" data-sort-card data-filter-card
          data-title="${String(movie.title).replace(/"/g, '&quot;')}"
          data-year="${movie.year}"
          data-region="${String(movie.region).replace(/"/g, '&quot;')}"
          data-genre="${String(movie.genre).replace(/"/g, '&quot;')}"
          data-tags="${String(movie.tags).replace(/"/g, '&quot;')}"
          data-search="${normalize([movie.title, movie.year, movie.region, movie.genre, movie.tags, movie.one_line].join(' '))}">
          <a class="movie-link" href="${movie.url}">
            <div class="movie-poster">
              <img src="${movie.poster}" alt="${movie.title}">
              <span class="poster-badge">${movie.year} · ${movie.region}</span>
            </div>
            <div class="movie-meta">
              <div class="movie-info">
                <span class="pill accent">${movie.type}</span>
                <span class="pill">${movie.genre}</span>
              </div>
              <h3>${movie.title}</h3>
              <p>${movie.one_line}</p>
            </div>
          </a>
        </article>
      `).join('');
      setupFadeIns();
    };

    const filter = () => {
      const q = normalize(input.value);
      const typeFilter = sort ? sort.value : 'all';
      const activeChip = chips.find((c) => c.classList.contains('is-active'));

      let items = window.MOVIE_INDEX.slice();

      if (typeFilter !== 'all') {
        if (typeFilter === 'latest') {
          items.sort((a, b) => Number(b.year) - Number(a.year) || String(a.title).localeCompare(String(b.title), 'zh-Hans-CN-u-co-pinyin'));
        } else if (typeFilter === 'region') {
          items.sort((a, b) => String(a.region).localeCompare(String(b.region), 'zh-Hans-CN-u-co-pinyin') || Number(b.year) - Number(a.year));
        } else if (typeFilter === 'genre') {
          items.sort((a, b) => String(a.genre).localeCompare(String(b.genre), 'zh-Hans-CN-u-co-pinyin') || Number(b.year) - Number(a.year));
        }
      }

      if (activeChip) {
        const key = normalize(activeChip.dataset.value);
        items = items.filter((movie) => normalize([movie.title, movie.genre, movie.region, movie.tags, movie.one_line].join(' ')).includes(key));
      }

      if (q) {
        items = items.filter((movie) => normalize([movie.title, movie.genre, movie.region, movie.tags, movie.one_line, movie.summary, movie.review].join(' ')).includes(q));
      }

      if (resultCount) resultCount.textContent = String(items.length);
      render(items.slice(0, 180));
    };

    input.addEventListener('input', debounce(filter, 90));
    if (sort) sort.addEventListener('change', filter);
    chips.forEach((chip) => chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      filter();
    }));

    filter();
  };

  onReady(() => {
    setupHeader();
    setupFadeIns();
    setupHeroCarousel();
    setupBackToTop();
    setupPlayer();
    setupGlobalSearchPage();

    qsa('[data-filter-scope]').forEach((scope) => {
      applySearchFilter(scope);
      sortCards(scope);
    });

    qsa('[data-auto-copy]').forEach((node) => {
      const text = node.textContent;
      node.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(text);
          node.classList.add('copied');
          window.setTimeout(() => node.classList.remove('copied'), 800);
        } catch (err) {}
      });
    });
  });
})();
