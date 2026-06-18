(function () {
  var header = document.querySelector('[data-header]');
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-mobile-menu]');

  function onScroll() {
    if (!header) {
      return;
    }
    header.classList.toggle('is-scrolled', window.scrollY > 20);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
  var activeSlide = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle('is-active', i === activeSlide);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === activeSlide);
    });
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      showSlide(i);
    });
  });

  if (slides.length) {
    showSlide(0);
    window.setInterval(function () {
      showSlide(activeSlide + 1);
    }, 5200);
  }

  var filterRoot = document.querySelector('[data-filter-root]');
  if (filterRoot) {
    var searchInput = filterRoot.querySelector('[data-filter-search]');
    var regionSelect = filterRoot.querySelector('[data-filter-region]');
    var yearSelect = filterRoot.querySelector('[data-filter-year]');
    var typeSelect = filterRoot.querySelector('[data-filter-type]');
    var cards = Array.prototype.slice.call(filterRoot.querySelectorAll('[data-movie-card]'));
    var empty = filterRoot.querySelector('[data-empty-state]');

    function matchValue(value, query) {
      return value.toLowerCase().indexOf(query.toLowerCase()) !== -1;
    }

    function applyFilter() {
      var q = searchInput ? searchInput.value.trim() : '';
      var region = regionSelect ? regionSelect.value : '';
      var year = yearSelect ? yearSelect.value : '';
      var type = typeSelect ? typeSelect.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = [
          card.dataset.title || '',
          card.dataset.region || '',
          card.dataset.year || '',
          card.dataset.genre || '',
          card.dataset.type || ''
        ].join(' ');
        var ok = true;
        if (q && !matchValue(haystack, q)) {
          ok = false;
        }
        if (region && card.dataset.region !== region) {
          ok = false;
        }
        if (year && card.dataset.year !== year) {
          ok = false;
        }
        if (type && card.dataset.type !== type) {
          ok = false;
        }
        card.style.display = ok ? '' : 'none';
        if (ok) {
          visible += 1;
        }
      });

      if (empty) {
        empty.style.display = visible ? 'none' : 'block';
      }
    }


    if (searchInput && window.location.search) {
      var params = new URLSearchParams(window.location.search);
      var keyword = params.get('q');
      if (keyword) {
        searchInput.value = keyword;
      }
    }

    [searchInput, regionSelect, yearSelect, typeSelect].forEach(function (node) {
      if (node) {
        node.addEventListener('input', applyFilter);
        node.addEventListener('change', applyFilter);
      }
    });
    applyFilter();
  }
})();
