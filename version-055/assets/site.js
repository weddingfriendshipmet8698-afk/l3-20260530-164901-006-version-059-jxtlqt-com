
(() => {
  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  function bindMenuToggle() {
    const toggle = document.querySelector('[data-menu-toggle]');
    const nav = document.querySelector('.site-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  function bindCoverFallbacks() {
    document.querySelectorAll('.cover-image').forEach((img) => {
      img.addEventListener(
        'error',
        () => {
          img.hidden = true;
          const fallback = img.parentElement?.querySelector('.cover-fallback');
          if (fallback) fallback.hidden = false;
        },
        { once: true }
      );
    });
  }

  function updateFilterScope(scope) {
    if (!scope) return;

    const cards = Array.from(scope.querySelectorAll('[data-filter-item]'));
    const emptyState = scope.querySelector('[data-empty-state]');
    const counter = scope.querySelector('[data-filter-count]');

    let visible = 0;
    cards.forEach((card) => {
      const controls = scope.__controls || [];
      let ok = true;
      const text = String(card.dataset.searchText || '').toLowerCase();
      const type = String(card.dataset.type || '').toLowerCase();
      const year = String(card.dataset.year || '').toLowerCase();
      const region = String(card.dataset.region || '').toLowerCase();
      const genre = String(card.dataset.genre || '').toLowerCase();

      for (const ctrl of controls) {
        const key = ctrl.dataset.filterKey || 'q';
        const value = String(ctrl.value || '').trim().toLowerCase();

        if (key === 'q' && value && !text.includes(value)) {
          ok = false;
          break;
        }
        if (key === 'type' && value !== 'all' && value && !type.includes(value)) {
          ok = false;
          break;
        }
        if (key === 'year' && value !== 'all' && value && year !== value) {
          ok = false;
          break;
        }
        if (key === 'region' && value !== 'all' && value && !region.includes(value)) {
          ok = false;
          break;
        }
        if (key === 'genre' && value !== 'all' && value && !genre.includes(value)) {
          ok = false;
          break;
        }
      }

      card.hidden = !ok;
      if (ok) visible += 1;
    });

    if (counter) counter.textContent = String(visible);
    if (emptyState) emptyState.hidden = visible > 0;
  }

  function bindFilters() {
    const controls = Array.from(document.querySelectorAll('[data-filter-control]'));
    const scopes = new Map();

    function getScope(ctrl) {
      const sel = ctrl.dataset.filterScope || '';
      let scope = null;
      if (sel) {
        scope = document.querySelector(sel);
      }
      if (!scope) {
        scope = ctrl.closest('[data-filter-scope]') || null;
      }
      return scope;
    }

    controls.forEach((ctrl) => {
      const scope = getScope(ctrl);
      if (!scope) return;
      if (!scopes.has(scope)) {
        scopes.set(scope, []);
      }
      scopes.get(scope).push(ctrl);
      scope.__controls = scopes.get(scope);
    });

    scopes.forEach((_controls, scope) => {
      const apply = () => updateFilterScope(scope);
      _controls.forEach((ctrl) => {
        ctrl.addEventListener('input', apply);
        ctrl.addEventListener('change', apply);
      });
      apply();
    });
  }

  function bindCarousels() {
    document.querySelectorAll('[data-carousel]').forEach((wrap) => {
      const rail = wrap.querySelector('[data-carousel-rail]');
      const left = wrap.querySelector('[data-carousel-left]');
      const right = wrap.querySelector('[data-carousel-right]');
      if (!rail) return;

      const step = () => Math.max(rail.clientWidth * 0.8, 240);

      const move = (dir) => {
        rail.scrollBy({ left: dir * step(), behavior: 'smooth' });
      };

      if (left) left.addEventListener('click', () => move(-1));
      if (right) right.addEventListener('click', () => move(1));
    });
  }

  function bindPlayer() {
    const video = document.querySelector('[data-player-video]');
    if (!video) return;
    const label = document.querySelector('[data-player-label]');
    const note = document.querySelector('[data-player-note]');
    const buttons = Array.from(document.querySelectorAll('[data-play-source]'));
    const fallbackMp4 = video.dataset.fallbackMp4 || '';
    const defaultSrc = video.dataset.defaultSrc || fallbackMp4;

    function setActive(button) {
      buttons.forEach((btn) => btn.classList.toggle('active', btn === button));
    }

    function loadMp4(src) {
      video.pause();
      video.removeAttribute('src');
      video.src = src;
      video.load();
      video.play().catch(() => {});
      if (label) label.textContent = '当前线路：本地流畅线';
      if (note) note.textContent = '播放器已切换到本地视频资源，点击即可播放。';
    }

    function loadHls(src) {
      video.pause();
      video.removeAttribute('src');
      const canNative = video.canPlayType('application/vnd.apple.mpegurl') || video.canPlayType('application/x-mpegURL');
      if (canNative) {
        video.src = src;
        video.load();
        video.play().catch(() => {});
        if (label) label.textContent = '当前线路：HLS 线路';
        if (note) note.textContent = '当前浏览器支持原生 HLS，已直接绑定 m3u8 资源。';
        return;
      }
      if (note) note.textContent = '当前浏览器不支持原生 HLS，已自动切回本地流畅线。';
      loadMp4(fallbackMp4 || defaultSrc);
    }

    function loadSource(src, button) {
      if (!src) return;
      setActive(button);
      const isHls = /\.m3u8(\?|#|$)/i.test(src);
      if (isHls) {
        loadHls(src);
      } else {
        loadMp4(src);
      }
    }

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        loadSource(button.dataset.playSource || defaultSrc, button);
      });
    });

    if (buttons[0]) {
      loadSource(buttons[0].dataset.playSource || defaultSrc, buttons[0]);
    } else if (defaultSrc) {
      loadMp4(defaultSrc);
    }
  }

  function bindQuickScroll() {
    document.querySelectorAll('[data-scroll-to]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = document.querySelector(btn.dataset.scrollTo);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  ready(() => {
    bindMenuToggle();
    bindCoverFallbacks();
    bindCarousels();
    bindQuickScroll();
    bindFilters();
    bindPlayer();
  });
})();
