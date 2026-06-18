(function () {
  var nav = document.querySelector('[data-nav]');
  var toggle = document.querySelector('[data-nav-toggle]');
  var links = document.querySelector('[data-nav-links]');

  function syncNav() {
    if (!nav) {
      return;
    }
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  syncNav();
  window.addEventListener('scroll', syncNav, { passive: true });

  if (toggle && nav && links) {
    toggle.addEventListener('click', function () {
      var opened = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var index = 0;

    function showHero(next) {
      if (!slides.length) {
        return;
      }
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showHero(parseInt(dot.getAttribute('data-hero-dot') || '0', 10));
      });
    });

    if (slides.length > 1) {
      setInterval(function () {
        showHero(index + 1);
      }, 5200);
    }
  }

  var searchInput = document.querySelector('[data-search-input]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search-card]'));
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-filter-button]'));
  var clearButton = document.querySelector('[data-search-clear]');
  var activeFilter = 'all';

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
  }

  function cardText(card) {
    return [
      card.getAttribute('data-title'),
      card.getAttribute('data-filter'),
      card.getAttribute('data-region'),
      card.getAttribute('data-genre'),
      card.getAttribute('data-year'),
      card.textContent
    ].join(' ').toLowerCase();
  }

  function applyFilter() {
    if (!cards.length) {
      return;
    }
    var keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
    cards.forEach(function (card) {
      var matchText = !keyword || cardText(card).indexOf(keyword) !== -1;
      var matchFilter = activeFilter === 'all' || card.getAttribute('data-filter') === activeFilter;
      card.classList.toggle('hidden-by-filter', !(matchText && matchFilter));
    });
  }

  if (searchInput) {
    var q = getQueryParam('q');
    if (q) {
      searchInput.value = q;
    }
    searchInput.addEventListener('input', applyFilter);
    applyFilter();
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.getAttribute('data-filter-button') || 'all';
      buttons.forEach(function (item) {
        item.classList.toggle('active', item === button);
      });
      applyFilter();
    });
  });

  if (clearButton && searchInput) {
    clearButton.addEventListener('click', function () {
      searchInput.value = '';
      applyFilter();
      searchInput.focus();
    });
  }

  var hlsPromise = null;

  function ensureHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }
    if (hlsPromise) {
      return hlsPromise;
    }
    hlsPromise = new Promise(function (resolve) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js';
      script.onload = function () {
        resolve(window.Hls || null);
      };
      script.onerror = function () {
        resolve(null);
      };
      document.head.appendChild(script);
    });
    return hlsPromise;
  }

  function setupVideo(shell) {
    var video = shell.querySelector('video[data-stream]');
    var button = shell.querySelector('[data-play-button]');
    if (!video || !button) {
      return;
    }
    var stream = video.getAttribute('data-stream');
    var ready = false;
    var hls = null;

    function attachStream() {
      if (ready) {
        return Promise.resolve();
      }
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
        ready = true;
        return Promise.resolve();
      }
      return ensureHls().then(function (Hls) {
        if (Hls && Hls.isSupported()) {
          hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(stream);
          hls.attachMedia(video);
          ready = true;
        } else {
          video.src = stream;
          ready = true;
        }
      });
    }

    function playVideo() {
      attachStream().then(function () {
        video.setAttribute('controls', 'controls');
        var promise = video.play();
        if (promise && promise.catch) {
          promise.catch(function () {});
        }
      });
    }

    button.addEventListener('click', playVideo);
    video.addEventListener('click', function () {
      if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    });
    video.addEventListener('play', function () {
      shell.classList.add('playing');
    });
    video.addEventListener('pause', function () {
      shell.classList.remove('playing');
    });
    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-video-shell]')).forEach(setupVideo);
})();
