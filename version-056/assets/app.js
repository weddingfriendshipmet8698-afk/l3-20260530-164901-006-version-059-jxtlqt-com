(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function setupNavigation() {
    var button = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-main-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var panelTitle = hero.querySelector("[data-hero-title]");
    var panelText = hero.querySelector("[data-hero-text]");
    var panelImage = hero.querySelector("[data-hero-image]");
    var panelLink = hero.querySelector("[data-hero-link]");
    var index = 0;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
      var active = slides[index];
      if (panelTitle) {
        panelTitle.textContent = active.getAttribute("data-title") || "";
      }
      if (panelText) {
        panelText.textContent = active.getAttribute("data-text") || "";
      }
      if (panelImage) {
        panelImage.setAttribute("src", active.getAttribute("data-cover") || "");
        panelImage.setAttribute("alt", active.getAttribute("data-title") || "");
      }
      if (panelLink) {
        panelLink.setAttribute("href", active.getAttribute("data-link") || "./index.html");
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
      });
    });

    show(0);
    if (slides.length > 1) {
      window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }
  }

  function normalize(text) {
    return String(text || "").toLowerCase().trim();
  }

  function setupLocalFilters() {
    var panel = document.querySelector("[data-filter-panel]");
    if (!panel) {
      return;
    }
    var input = panel.querySelector("[data-filter-input]");
    var buttons = Array.prototype.slice.call(panel.querySelectorAll("[data-filter-value]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll(".searchable-card"));
    var empty = document.querySelector("[data-empty-state]");
    var active = "all";
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    if (input && initial) {
      input.value = initial;
    }

    function apply() {
      var q = normalize(input ? input.value : "");
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = normalize(card.getAttribute("data-search"));
        var passText = !q || haystack.indexOf(q) !== -1;
        var passFilter = active === "all" || haystack.indexOf(normalize(active)) !== -1;
        var pass = passText && passFilter;
        card.style.display = pass ? "" : "none";
        if (pass) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        active = button.getAttribute("data-filter-value") || "all";
        buttons.forEach(function (item) {
          item.classList.toggle("is-active", item === button);
        });
        apply();
      });
    });

    if (input) {
      input.addEventListener("input", apply);
    }
    apply();
  }

  function setupSearchForms() {
    var forms = Array.prototype.slice.call(document.querySelectorAll(".site-search-form"));
    forms.forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        if (!input || !input.value.trim()) {
          event.preventDefault();
          window.location.href = "./search.html";
        }
      });
    });
  }

  ready(function () {
    setupNavigation();
    setupHero();
    setupLocalFilters();
    setupSearchForms();
  });
})();

function initMoviePlayer(url) {
  var shell = document.querySelector(".player-shell");
  if (!shell) {
    return;
  }
  var video = shell.querySelector("video");
  var layer = shell.querySelector(".play-layer");
  var loaded = false;
  var hls = null;

  function playVideo() {
    if (!video) {
      return;
    }
    if (layer) {
      layer.classList.add("is-hidden");
    }
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      if (!video.getAttribute("src")) {
        video.setAttribute("src", url);
      }
      loaded = true;
      video.play().catch(function () {});
      return;
    }
    if (window.Hls && window.Hls.isSupported()) {
      if (!loaded) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {});
        });
        loaded = true;
      } else {
        video.play().catch(function () {});
      }
      return;
    }
    if (!video.getAttribute("src")) {
      video.setAttribute("src", url);
    }
    loaded = true;
    video.play().catch(function () {});
  }

  if (layer) {
    layer.addEventListener("click", playVideo);
  }
  if (video) {
    video.addEventListener("click", function () {
      if (!loaded) {
        playVideo();
      }
    });
  }
  window.addEventListener("pagehide", function () {
    if (hls) {
      hls.destroy();
    }
  });
}
