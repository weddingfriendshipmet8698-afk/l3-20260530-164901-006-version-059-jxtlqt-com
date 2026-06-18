(function () {
    var mobileToggle = document.querySelector('[data-mobile-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    if (mobileToggle && mobileNav) {
        mobileToggle.addEventListener('click', function () {
            mobileNav.classList.toggle('open');
        });
    }

    function initializeHero() {
        var carousel = document.querySelector('[data-hero-carousel]');
        if (!carousel) {
            return;
        }

        var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
        var previous = carousel.querySelector('[data-hero-prev]');
        var next = carousel.querySelector('[data-hero-next]');
        var activeIndex = 0;
        var timer = null;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }

            activeIndex = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === activeIndex);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === activeIndex);
            });
        }

        function startTimer() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                showSlide(activeIndex + 1);
            }, 5200);
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
                startTimer();
            });
        });

        if (previous) {
            previous.addEventListener('click', function () {
                showSlide(activeIndex - 1);
                startTimer();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                showSlide(activeIndex + 1);
                startTimer();
            });
        }

        showSlide(0);
        startTimer();
    }

    function initializeFilters() {
        var panels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]'));

        panels.forEach(function (panel) {
            var section = panel.parentElement;
            var grid = section ? section.querySelector('[data-movie-grid]') : document.querySelector('[data-movie-grid]');
            if (!grid) {
                return;
            }

            var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-movie-card]'));
            var input = panel.querySelector('[data-search-input]');
            var yearSelect = panel.querySelector('[data-year-select]');
            var typeSelect = panel.querySelector('[data-type-select]');
            var categorySelect = panel.querySelector('[data-category-select]');
            var count = panel.querySelector('[data-filter-count]');

            function applyFilters() {
                var keyword = input ? input.value.trim().toLowerCase() : '';
                var year = yearSelect ? yearSelect.value : '';
                var type = typeSelect ? typeSelect.value : '';
                var category = categorySelect ? categorySelect.value : '';
                var visible = 0;

                cards.forEach(function (card) {
                    var searchText = (card.getAttribute('data-search') || '').toLowerCase();
                    var cardYear = card.getAttribute('data-year') || '';
                    var cardType = card.getAttribute('data-type') || '';
                    var cardCategory = card.getAttribute('data-category') || '';
                    var matchKeyword = !keyword || searchText.indexOf(keyword) !== -1;
                    var matchYear = !year || cardYear === year;
                    var matchType = !type || cardType === type;
                    var matchCategory = !category || cardCategory === category;
                    var visibleNow = matchKeyword && matchYear && matchType && matchCategory;

                    card.classList.toggle('is-filtered-out', !visibleNow);
                    if (visibleNow) {
                        visible += 1;
                    }
                });

                if (count) {
                    count.textContent = String(visible);
                }
            }

            [input, yearSelect, typeSelect, categorySelect].forEach(function (control) {
                if (control) {
                    control.addEventListener('input', applyFilters);
                    control.addEventListener('change', applyFilters);
                }
            });

            applyFilters();
        });
    }

    function initializePlayers() {
        var shells = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

        shells.forEach(function (shell) {
            var video = shell.querySelector('video');
            var button = shell.querySelector('[data-play-button]');
            var status = shell.parentElement ? shell.parentElement.querySelector('[data-player-status]') : null;
            var source = video ? video.getAttribute('data-src') : '';
            var initialized = false;
            var hlsInstance = null;

            if (!video || !source) {
                return;
            }

            function setStatus(message) {
                if (status) {
                    status.textContent = message;
                }
            }

            function hideOverlay() {
                if (button) {
                    button.classList.add('is-hidden');
                }
            }

            function playVideo() {
                var promise = video.play();
                hideOverlay();
                setStatus('正在播放');

                if (promise && typeof promise.catch === 'function') {
                    promise.catch(function () {
                        setStatus('点击视频控件继续播放');
                    });
                }
            }

            function attachSource() {
                if (initialized) {
                    playVideo();
                    return;
                }

                initialized = true;
                setStatus('正在加载播放源');

                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                    video.addEventListener('loadedmetadata', playVideo, { once: true });
                    video.load();
                    return;
                }

                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({ enableWorker: true });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
                    hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal) {
                            setStatus('播放源加载失败，请稍后重试');
                            if (hlsInstance) {
                                hlsInstance.destroy();
                                hlsInstance = null;
                            }
                            initialized = false;
                            if (button) {
                                button.classList.remove('is-hidden');
                            }
                        }
                    });
                    return;
                }

                video.src = source;
                video.load();
                playVideo();
            }

            if (button) {
                button.addEventListener('click', attachSource);
            }

            video.addEventListener('click', function () {
                if (!initialized) {
                    attachSource();
                }
            });
        });
    }

    function initializeBackTop() {
        var button = document.querySelector('[data-back-top]');
        if (!button) {
            return;
        }

        window.addEventListener('scroll', function () {
            button.classList.toggle('show', window.scrollY > 460);
        });

        button.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initializeHero();
        initializeFilters();
        initializePlayers();
        initializeBackTop();
    });
}());
