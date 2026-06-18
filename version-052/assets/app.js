(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function setupNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".site-nav");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
    if (!slides.length || !dots.length) {
      return;
    }
    var index = 0;
    var timer = null;
    function show(next) {
      slides[index].classList.remove("active");
      dots[index].classList.remove("active");
      index = next;
      slides[index].classList.add("active");
      dots[index].classList.add("active");
    }
    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show((index + 1) % slides.length);
      }, 5200);
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });
    restart();
  }

  function setupFilters() {
    Array.prototype.slice.call(document.querySelectorAll("[data-filter-box]")).forEach(function (box) {
      var section = box.parentElement;
      var cards = Array.prototype.slice.call(section.querySelectorAll(".filter-grid .movie-card"));
      var input = box.querySelector(".js-filter-keyword");
      var year = box.querySelector(".js-filter-year");
      var region = box.querySelector(".js-filter-region");
      var type = box.querySelector(".js-filter-type");
      var category = box.querySelector(".js-filter-category");
      var empty = section.querySelector(".empty-state");
      var params = new URLSearchParams(window.location.search);
      var q = params.get("q");
      if (q && input) {
        input.value = q;
      }
      function value(el) {
        return el ? el.value.trim().toLowerCase() : "";
      }
      function apply() {
        var keyword = value(input);
        var y = value(year);
        var r = value(region);
        var t = value(type);
        var c = value(category);
        var visible = 0;
        cards.forEach(function (card) {
          var text = (card.getAttribute("data-search") || "").toLowerCase();
          var ok = true;
          if (keyword && text.indexOf(keyword) === -1) {
            ok = false;
          }
          if (y && (card.getAttribute("data-year") || "").toLowerCase() !== y) {
            ok = false;
          }
          if (r && (card.getAttribute("data-region") || "").toLowerCase() !== r) {
            ok = false;
          }
          if (t && (card.getAttribute("data-type") || "").toLowerCase() !== t) {
            ok = false;
          }
          if (c && (card.getAttribute("data-category") || "").toLowerCase() !== c) {
            ok = false;
          }
          card.classList.toggle("is-hidden", !ok);
          if (ok) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("visible", visible === 0);
        }
      }
      [input, year, region, type, category].forEach(function (el) {
        if (el) {
          el.addEventListener("input", apply);
          el.addEventListener("change", apply);
        }
      });
      apply();
    });
  }

  window.initVideoPlayer = function (boxId, videoUrl) {
    var box = document.getElementById(boxId);
    if (!box) {
      return;
    }
    var video = box.querySelector("video");
    var cover = box.querySelector(".player-cover");
    var started = false;
    var hlsInstance = null;
    function bindAndPlay() {
      if (!video) {
        return;
      }
      if (!started) {
        started = true;
        if (cover) {
          cover.classList.add("is-hidden");
        }
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = videoUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({ enableWorker: true });
          hlsInstance.loadSource(videoUrl);
          hlsInstance.attachMedia(video);
        } else {
          video.src = videoUrl;
        }
      }
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    }
    if (cover) {
      cover.addEventListener("click", bindAndPlay);
    }
    if (video) {
      video.addEventListener("click", function () {
        if (!started) {
          bindAndPlay();
        }
      });
    }
    window.addEventListener("pagehide", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
    });
  };

  ready(function () {
    setupNav();
    setupHero();
    setupFilters();
  });
})();
