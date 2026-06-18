(function () {
    function ready(callback) {
        if (document.readyState !== 'loading') {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback);
        }
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    ready(function () {
        var menuToggle = document.querySelector('[data-menu-toggle]');
        var mobileNav = document.querySelector('[data-mobile-nav]');
        if (menuToggle && mobileNav) {
            menuToggle.addEventListener('click', function () {
                mobileNav.classList.toggle('open');
            });
        }

        var backTop = document.querySelector('[data-back-top]');
        if (backTop) {
            window.addEventListener('scroll', function () {
                backTop.classList.toggle('show', window.scrollY > 420);
            });
            backTop.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        document.querySelectorAll('[data-hero-slider]').forEach(function (slider) {
            var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
            var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
            if (!slides.length) {
                return;
            }
            var index = 0;
            function setSlide(next) {
                index = next % slides.length;
                slides.forEach(function (slide, position) {
                    slide.classList.toggle('active', position === index);
                });
                dots.forEach(function (dot, position) {
                    dot.classList.toggle('active', position === index);
                });
            }
            dots.forEach(function (dot, position) {
                dot.addEventListener('click', function () {
                    setSlide(position);
                });
            });
            setInterval(function () {
                setSlide(index + 1);
            }, 5200);
            setSlide(0);
        });

        document.querySelectorAll('[data-filter-panel]').forEach(function (panel) {
            var scope = panel.closest('main') || document;
            var input = panel.querySelector('[data-filter-input]');
            var year = panel.querySelector('[data-filter-year]');
            var type = panel.querySelector('[data-filter-type]');
            var empty = panel.querySelector('[data-empty-result]');
            var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-movie-card], [data-rank-row]'));
            var params = new URLSearchParams(window.location.search);
            var initial = params.get('q');
            if (initial && input) {
                input.value = initial;
            }
            function applyFilter() {
                var query = normalize(input ? input.value : '');
                var selectedYear = normalize(year ? year.value : '');
                var selectedType = normalize(type ? type.value : '');
                var visible = 0;
                cards.forEach(function (card) {
                    var haystack = normalize([
                        card.dataset.title,
                        card.dataset.region,
                        card.dataset.type,
                        card.dataset.year,
                        card.dataset.genre,
                        card.dataset.tags
                    ].join(' '));
                    var matchQuery = !query || haystack.indexOf(query) !== -1;
                    var matchYear = !selectedYear || normalize(card.dataset.year) === selectedYear;
                    var matchType = !selectedType || normalize(card.dataset.type) === selectedType;
                    var show = matchQuery && matchYear && matchType;
                    card.classList.toggle('is-hidden', !show);
                    if (show) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle('show', visible === 0);
                }
            }
            [input, year, type].forEach(function (control) {
                if (control) {
                    control.addEventListener('input', applyFilter);
                    control.addEventListener('change', applyFilter);
                }
            });
            applyFilter();
        });

        document.querySelectorAll('[data-hero-search]').forEach(function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                var input = form.querySelector('input');
                var query = input ? input.value.trim() : '';
                var target = query ? 'search.html?q=' + encodeURIComponent(query) : 'search.html';
                window.location.href = target;
            });
        });
    });

    window.initPlayer = function (source) {
        var video = document.querySelector('[data-player]');
        var overlay = document.querySelector('[data-play-overlay]');
        var button = document.querySelector('[data-play-button]');
        var attached = false;
        var hlsInstance = null;

        if (!video || !source) {
            return;
        }

        function attachSource() {
            if (attached) {
                return;
            }
            attached = true;
            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls();
                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);
            } else {
                video.src = source;
            }
        }

        function startPlay() {
            attachSource();
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
            var promise = video.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {
                    if (overlay) {
                        overlay.classList.remove('is-hidden');
                    }
                });
            }
        }

        if (overlay) {
            overlay.addEventListener('click', startPlay);
        }
        if (button) {
            button.addEventListener('click', startPlay);
        }
        video.addEventListener('click', function () {
            if (video.paused) {
                startPlay();
            }
        });
        video.addEventListener('play', function () {
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
        });
        video.addEventListener('pause', function () {
            if (overlay && !video.ended) {
                overlay.classList.remove('is-hidden');
            }
        });
        window.addEventListener('pagehide', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    };
})();
