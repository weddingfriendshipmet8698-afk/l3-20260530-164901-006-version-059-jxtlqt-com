(function () {
  var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

  function loadHlsLibrary(callback) {
    if (window.Hls) {
      callback();
      return;
    }
    var existing = document.querySelector('script[data-hls-loader]');
    if (existing) {
      existing.addEventListener('load', callback, { once: true });
      return;
    }
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
    script.async = true;
    script.dataset.hlsLoader = 'true';
    script.addEventListener('load', callback, { once: true });
    document.head.appendChild(script);
  }

  function preparePlayer(root) {
    var video = root.querySelector('video');
    var overlay = root.querySelector('[data-player-overlay]');
    var button = root.querySelector('[data-player-button]');
    var source = root.dataset.source;
    var started = false;

    if (!video || !source) {
      return;
    }

    function attachAndPlay() {
      if (started) {
        video.play();
        return;
      }
      started = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.play();
        return;
      }

      loadHlsLibrary(function () {
        if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({ enableWorker: true });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play();
          });
        } else {
          video.src = source;
          video.play();
        }
      });
    }

    function hideOverlay() {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
    }

    function togglePlay() {
      if (video.paused) {
        attachAndPlay();
      } else {
        video.pause();
      }
    }

    if (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        togglePlay();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', togglePlay);
    }

    video.addEventListener('play', hideOverlay);
    video.addEventListener('pause', function () {
      if (overlay) {
        overlay.classList.remove('is-hidden');
      }
    });
  }

  players.forEach(preparePlayer);
})();
