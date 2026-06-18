(function () {
  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initHeader() {
    var header = document.querySelector('[data-site-header]');
    var menuButton = document.querySelector('[data-menu-button]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    function updateHeader() {
      if (!header) {
        return;
      }
      header.classList.toggle('scrolled', window.scrollY > 20);
    }

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    if (menuButton && mobileNav) {
      menuButton.addEventListener('click', function () {
        mobileNav.classList.toggle('open');
      });
    }
  }

  function initHeroSlider() {
    var slider = document.querySelector('[data-hero-slider]');
    if (!slider) {
      return;
    }

    var slides = all('[data-hero-slide]', slider);
    var dots = all('[data-hero-dot]', slider);
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      if (timer || slides.length < 2) {
        return;
      }
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        stop();
        start();
      });
    });

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function initFilters() {
    all('[data-filter-scope]').forEach(function (scope) {
      var cards = all('[data-card]', scope);
      var search = scope.querySelector('[data-card-search]');
      var buttons = all('[data-filter-button]', scope);
      var empty = scope.querySelector('[data-empty-state]');
      var activeFilter = 'all';

      function apply() {
        var query = normalize(search ? search.value : '');
        var visibleCount = 0;

        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-category'),
            card.getAttribute('data-tags')
          ].join(' '));
          var cardCategory = card.getAttribute('data-category') || '';
          var filterMatched = activeFilter === 'all' || cardCategory === activeFilter;
          var searchMatched = !query || haystack.indexOf(query) !== -1;
          var visible = filterMatched && searchMatched;
          card.classList.toggle('is-hidden', !visible);
          if (visible) {
            visibleCount += 1;
          }
        });

        if (empty) {
          empty.classList.toggle('visible', visibleCount === 0);
        }
      }

      if (search) {
        search.addEventListener('input', apply);
      }

      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          activeFilter = button.getAttribute('data-filter') || 'all';
          buttons.forEach(function (item) {
            item.classList.toggle('active', item === button);
          });
          apply();
        });
      });

      apply();
    });
  }

  function setupPlayer(source) {
    var video = document.querySelector('[data-player-video]');
    var overlay = document.querySelector('[data-player-overlay]');
    var started = false;
    var hls = null;

    if (!video || !source) {
      return;
    }

    function attach() {
      if (started) {
        return;
      }
      started = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          maxBufferLength: 30,
          enableWorker: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
    }

    function play() {
      attach();
      if (overlay) {
        overlay.hidden = true;
      }
      video.controls = true;
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {});
      }
    }

    if (overlay) {
      overlay.addEventListener('click', play);
    }

    video.addEventListener('click', function () {
      if (!started) {
        play();
      }
    });

    window.addEventListener('pagehide', function () {
      if (hls && typeof hls.destroy === 'function') {
        hls.destroy();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initHeroSlider();
    initFilters();
  });

  window.MovieSite = {
    setupPlayer: setupPlayer
  };
}());
