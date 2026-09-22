  (function() {
    var header = document.getElementById('siteHeader');
    var onScroll = function() {
      if (window.scrollY > 12) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    toggle.addEventListener('click', function() {
      var isOpen = links.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    var closeMenu = function() {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    document.querySelectorAll('[data-target]').forEach(function(el) {
      el.addEventListener('click', function() {
        var target = document.getElementById(el.getAttribute('data-target'));
        closeMenu();
        if (target) {
          var headerOffset = 84;
          var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  })();