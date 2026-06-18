(function () {
  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function setupMenu() {
    var toggle = qs("[data-menu-toggle]");
    var nav = qs("[data-mobile-nav]");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  function setupSearchForms() {
    qsa("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = qs("input[name='q']", form);
        var query = input ? input.value.trim() : "";
        var root = document.body.getAttribute("data-root") || ".";
        var target = root + "/search.html";
        if (query) {
          target += "?q=" + encodeURIComponent(query);
        }
        window.location.href = target;
      });
    });
  }

  function filterCards() {
    var input = qs("[data-search-input]");
    var yearSelect = qs("[data-year-select]");
    var cards = qsa("[data-movie-card]");
    if (!cards.length) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var queryFromUrl = params.get("q") || "";
    if (input && queryFromUrl && !input.value) {
      input.value = queryFromUrl;
    }
    function apply() {
      var query = input ? normalize(input.value) : "";
      var year = yearSelect ? yearSelect.value : "";
      cards.forEach(function (card) {
        var text = normalize(card.getAttribute("data-search"));
        var cardYear = card.getAttribute("data-year") || "";
        var matchedQuery = !query || text.indexOf(query) !== -1;
        var matchedYear = !year || cardYear === year;
        card.classList.toggle("is-hidden", !(matchedQuery && matchedYear));
      });
    }
    if (input) {
      input.addEventListener("input", apply);
    }
    if (yearSelect) {
      yearSelect.addEventListener("change", apply);
    }
    apply();
  }

  function setupHero() {
    var hero = qs("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = qsa("[data-hero-slide]", hero);
    var dots = qsa("[data-hero-dot]", hero);
    if (slides.length < 2) {
      return;
    }
    var index = 0;
    var timer = null;
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }
    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }
    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        start();
      });
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    start();
  }

  window.initMoviePlayer = function (source) {
    var video = qs("#movie-video");
    var layer = qs("#play-layer");
    if (!video || !source) {
      return;
    }
    var loaded = false;
    function bindSource() {
      if (loaded) {
        return;
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({ enableWorker: true });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
    }
    function play() {
      bindSource();
      if (layer) {
        layer.classList.add("hidden");
      }
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {});
      }
    }
    if (layer) {
      layer.addEventListener("click", play);
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener("play", function () {
      if (layer) {
        layer.classList.add("hidden");
      }
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    setupMenu();
    setupSearchForms();
    filterCards();
    setupHero();
  });
})();
