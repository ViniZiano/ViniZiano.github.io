(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // localStorage pode falhar (aba anônima, bloqueio); nunca deve quebrar o site
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  document.addEventListener('DOMContentLoaded', function () {

    /* ============ 1. Idioma PT / EN ============
       O texto em português é o que está no HTML; o inglês vem deste dicionário.
       Para traduzir mais um trecho: coloque data-i18n="chave" no elemento e
       adicione a chave aqui. */
    var EN = {
      'nav.home': 'Home', 'nav.about': 'About', 'nav.skills': 'Skills',
      'nav.projects': 'Projects', 'nav.contact': 'Contact',
      'hero.status': 'Available for a junior role · Java &amp; Front-end',
      'hero.role': 'Back-end &amp; Web Developer',
      'hero.lede': 'Building robust APIs in Java &amp; Spring Boot and modern web interfaces.',
      'btn.projects': 'View projects', 'btn.cv': 'Résumé',
      'btn.code': 'View code', 'btn.view': 'View project',
      'btn.testapi': 'Test REST API', 'btn.copy': 'Copy',
      'skills.title': 'Technologies I use',
      'skills.sub': 'The tools I study with and build my projects with.',
      'skills.web': 'Web development',
      'projects.title': 'My projects',
      'projects.sub': 'Personal and academic projects, with open code on GitHub.',
      'filter.all': 'All', 'ps.problem': 'Problem', 'ps.solution': 'Solution',
      'contact.title': "Let's talk?",
      'contact.sub': 'Looking for my first junior Java developer role, and open to front-end opportunities. Reach me on WhatsApp or LinkedIn.',
      'about.title': 'About me', 'about.sub': 'The person behind the code.',
      'about.edu': 'Education', 'about.skills': 'Skills',
      'about.cta': "Want to see what I've built?"
    };

    var langToggle = $('#langToggle');
    var i18nEls = $$('[data-i18n]');
    var lang = 'pt';
    i18nEls.forEach(function (el) { el.setAttribute('data-pt', el.innerHTML); });

    function textFor(el, l) {
      var key = el.getAttribute('data-i18n');
      return l === 'en' && EN[key] != null ? EN[key] : el.getAttribute('data-pt');
    }
    function applyLang(l) {
      lang = l;
      i18nEls.forEach(function (el) { el.innerHTML = textFor(el, l); });
      document.documentElement.lang = l === 'en' ? 'en' : 'pt-BR';
      if (langToggle) {
        langToggle.textContent = l === 'en' ? 'PT' : 'EN';
        langToggle.setAttribute('aria-label', l === 'en' ? 'Mudar para português' : 'Switch to English');
      }
      store.set('lang', l);
    }
    if (langToggle) {
      langToggle.addEventListener('click', function () { applyLang(lang === 'pt' ? 'en' : 'pt'); });
    }
    if (store.get('lang') === 'en') applyLang('en');

    /* ============ 2. Cabeçalho: sombra ao rolar e menu mobile ============ */
    var header = $('#siteHeader');
    var navToggle = $('#navToggle');
    var navLinks = $('#navLinks');

    function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function closeMenu() {
      if (!navLinks || !navToggle) return;
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
    if (navToggle && navLinks) {
      navToggle.addEventListener('click', function () {
        var open = navLinks.classList.toggle('open');
        navToggle.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      navLinks.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
      document.addEventListener('click', function (e) {
        if (navLinks.classList.contains('open') && !e.target.closest('.site-header')) closeMenu();
      });
    }

    /* ============ 3. Animação de entrada ao rolar ============ */
    var reveals = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var order = new Map();
      reveals.forEach(function (el) {
        var p = el.parentElement;
        var i = order.get(p) || 0;
        order.set(p, i + 1);
        el.style.setProperty('--d', Math.min(i, 5) * 90 + 'ms');   // escalonado entre irmãos
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          io.unobserve(el);
          el.classList.add('is-visible');
          // depois de animar, devolve o elemento ao estado normal (para o hover dos cards voltar ao normal)
          setTimeout(function () {
            el.classList.remove('reveal', 'is-visible');
            el.style.removeProperty('--d');
          }, 1300);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    }

    /* ============ 4. Brilho que segue o mouse (.spotlight) ============ */
    document.addEventListener('pointermove', function (e) {
      var el = e.target.closest && e.target.closest('.spotlight');
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });

    /* ============ 5. Copiar e-mail ============ */
    $$('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        var done = function () {
          btn.textContent = lang === 'en' ? 'Copied!' : 'Copiado!';
          setTimeout(function () { btn.innerHTML = textFor(btn, lang); }, 1800);
        };
        var fallback = function () {
          var ta = document.createElement('textarea');
          ta.value = text; ta.setAttribute('readonly', '');
          ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); done(); } catch (e) {}
          document.body.removeChild(ta);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else { fallback(); }
      });
    });

    /* ============ 6. Filtro de projetos por stack ============ */
    var filterBtns = $$('.filter-btn');
    var projectCards = $$('.cards article');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        var filter = btn.getAttribute('data-filter');
        projectCards.forEach(function (card) {
          var tags = $$('.tag', card).map(function (t) { return t.textContent; });
          card.style.display = (filter === 'all' || tags.indexOf(filter) !== -1) ? '' : 'none';
        });
      });
    });

    /* ============ 7. Simulador de API REST ============ */
    var modalOverlay = $('#apiModalOverlay');
    var closeModalBtn = $('#modalClose');
    var sendBtn = $('#sendRequestBtn');
    var endpointSelect = $('#endpointSelect');
    var requestPayload = $('#requestPayload');
    var responseBody = $('#responseBody');
    var responseStatus = $('#responseStatus');
    var lastOpener = null;

    var PAYLOADS = {
      GET_HEALTH: 'GET /api/v1/health HTTP/1.1',
      POST_PIX: '{\n  "chaveDestino": "viniciusziano@email.com",\n  "valor": 150.00,\n  "origemConta": "ACC-8821"\n}',
      GET_TASKS: 'GET /api/v1/tasks HTTP/1.1\nAuthorization: Bearer eyJhbGciOi...'
    };
    function responseFor(key) {
      if (key === 'GET_HEALTH') return '{\n  "status": "UP",\n  "database": "MySQL Connected",\n  "uptime": "4h 22m"\n}';
      if (key === 'POST_PIX') return '{\n  "transactionId": "tx_9928173641",\n  "status": "CONCLUIDO",\n  "timestamp": "' + new Date().toISOString() + '"\n}';
      return '[\n  { "id": 1, "titulo": "Estudar Spring Security", "concluida": true },\n  { "id": 2, "titulo": "Refatorar arquitetura front", "concluida": false }\n]';
    }
    function resetResponse() {
      responseStatus.textContent = 'Status: Aguardando...';
      responseStatus.style.color = '';
      responseBody.textContent = '// Resposta da API aparecerá aqui...';
    }
    function setEndpoint(key) {
      endpointSelect.value = key;
      requestPayload.textContent = PAYLOADS[key];
      resetResponse();
    }
    function openModal(opener) {
      lastOpener = opener || null;
      // cada projeto abre já no endpoint mais representativo dele
      var project = opener && opener.getAttribute('data-project');
      setEndpoint(project === 'devtasks' ? 'GET_TASKS' : project === 'banco' ? 'POST_PIX' : 'GET_HEALTH');
      modalOverlay.classList.add('active');
      modalOverlay.setAttribute('aria-hidden', 'false');
      if (closeModalBtn) closeModalBtn.focus();
    }
    function closeModal() {
      modalOverlay.classList.remove('active');
      modalOverlay.setAttribute('aria-hidden', 'true');
      if (lastOpener) lastOpener.focus();
    }

    if (modalOverlay) {
      $$('.open-api-modal').forEach(function (btn) {
        btn.addEventListener('click', function () { openModal(btn); });
      });
      if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
      modalOverlay.addEventListener('click', function (e) { if (e.target === modalOverlay) closeModal(); });
      if (endpointSelect) {
        endpointSelect.addEventListener('change', function (e) { setEndpoint(e.target.value); });
      }
      if (sendBtn) {
        sendBtn.addEventListener('click', function () {
          responseStatus.textContent = 'Status: Processando...';
          responseStatus.style.color = '#B7C6D6';
          responseBody.textContent = 'Conectando ao container Spring Boot...';
          setTimeout(function () {
            responseStatus.textContent = 'Status: 200 OK (simulado)';
            responseStatus.style.color = '#5EEAD4';
            responseBody.textContent = responseFor(endpointSelect.value);
          }, 400);
        });
      }
    }

    /* ============ 8. Terminal interativo ============ */
    var terminalTrigger = $('#terminalTrigger');
    var terminalOverlay = $('#terminalOverlay');
    var terminalClose = $('#terminalClose');
    var terminalInput = $('#terminalInput');
    var terminalBody = $('#terminalBody');

    function openTerminal() {
      terminalOverlay.classList.add('active');
      terminalOverlay.setAttribute('aria-hidden', 'false');
      terminalInput.focus();
    }
    function closeTerminal() {
      terminalOverlay.classList.remove('active');
      terminalOverlay.setAttribute('aria-hidden', 'true');
      if (terminalTrigger) terminalTrigger.focus();
    }
    function addLine(html) {            // só para textos fixos escritos aqui
      var p = document.createElement('p');
      p.innerHTML = html;
      terminalBody.appendChild(p);
      return p;
    }

    if (terminalOverlay && terminalInput && terminalBody) {
      if (terminalTrigger) terminalTrigger.addEventListener('click', openTerminal);
      if (terminalClose) terminalClose.addEventListener('click', closeTerminal);
      terminalOverlay.addEventListener('click', function (e) { if (e.target === terminalOverlay) closeTerminal(); });

      terminalInput.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var cmd = terminalInput.value.trim().toLowerCase();
        terminalInput.value = '';

        // o que o visitante digitou entra como texto, nunca como HTML
        var echo = document.createElement('p');
        var prompt = document.createElement('span');
        prompt.style.color = '#5EEAD4';
        prompt.textContent = '$';
        echo.appendChild(prompt);
        echo.appendChild(document.createTextNode(' ' + cmd));
        terminalBody.appendChild(echo);

        if (cmd === 'help') {
          addLine('Comandos disponíveis: <b>stack</b>, <b>projetos</b>, <b>contato</b>, <b>cv</b>, <b>clear</b>');
        } else if (cmd === 'stack') {
          addLine('Java 17+, Spring Boot, Spring Security, JWT, MySQL, HTML5, CSS3, JavaScript, React');
        } else if (cmd === 'projetos') {
          addLine('1. Sistema Bancário Java<br>2. DevTasks (Spring Boot + JWT)<br>3. Anjos do Poço (ONG)');
        } else if (cmd === 'contato') {
          addLine('Email: viniciusziano2267@gmail.com | WhatsApp: (81) 98369-7754');
        } else if (cmd === 'cv') {
          addLine('Abrindo currículo... <a href="assets/curriculo-vinicius-ziano.pdf" target="_blank" rel="noopener" style="color:#5EEAD4">clique aqui se não abrir</a>');
          window.open('assets/curriculo-vinicius-ziano.pdf', '_blank', 'noopener');
        } else if (cmd === 'clear') {
          terminalBody.innerHTML = '';
          return;
        } else if (cmd !== '') {
          var p = document.createElement('p');
          p.appendChild(document.createTextNode('Comando não reconhecido: "' + cmd + '". Digite '));
          var b = document.createElement('b');
          b.textContent = 'help';
          p.appendChild(b);
          p.appendChild(document.createTextNode('.'));
          terminalBody.appendChild(p);
        }
        terminalBody.scrollTop = terminalBody.scrollHeight;
      });
    }

    /* ============ 9. Esc fecha menu, modal e terminal ============ */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeMenu();
      if (modalOverlay && modalOverlay.classList.contains('active')) closeModal();
      if (terminalOverlay && terminalOverlay.classList.contains('active')) closeTerminal();
    });
  });
})();
