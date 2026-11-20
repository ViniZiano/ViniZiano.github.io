document.addEventListener('DOMContentLoaded', () => {
  // 0. Garante que todos os elementos reveal fiquem visíveis caso o observer demore
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach(el => el.classList.add('is-visible'));

  // 1. Filtro de Projetos por Stack
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.cards article');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');

      cards.forEach(card => {
        const tags = Array.from(card.querySelectorAll('.tag')).map(t => t.textContent);
        if (filter === 'all' || tags.includes(filter)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 2. Integração API GitHub
  fetch('https://api.github.com/repos/ViniZiano/Sistema-Bancario-Java')
    .then(res => res.json())
    .then(data => {
      if(data.stargazers_count !== undefined) {
        console.log(`Repositório carregado com ${data.stargazers_count} estrelas.`);
      }
    }).catch(err => console.log('API GitHub offline ou limite excedido'));

  // 3. Modal de Simulação de API REST
  const modalOverlay = document.getElementById('apiModalOverlay');
  const openModalBtns = document.querySelectorAll('.open-api-modal');
  const closeModalBtn = document.getElementById('modalClose');
  const sendBtn = document.getElementById('sendRequestBtn');
  const endpointSelect = document.getElementById('endpointSelect');
  const requestPayload = document.getElementById('requestPayload');
  const responseBody = document.getElementById('responseBody');
  const responseStatus = document.getElementById('responseStatus');

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', () => modalOverlay.classList.add('active'));
  });
  
  if(closeModalBtn) {
    closeModalBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
  }

  if(modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if(e.target === modalOverlay) modalOverlay.classList.remove('active');
    });
  }

  if(endpointSelect) {
    endpointSelect.addEventListener('change', (e) => {
      if(e.target.value === 'GET_HEALTH') {
        requestPayload.textContent = 'GET /api/v1/health HTTP/1.1';
      } else if(e.target.value === 'POST_PIX') {
        requestPayload.textContent = '{\n  "chaveDestino": "viniciusziano@email.com",\n  "valor": 150.00,\n  "origemConta": "ACC-8821"\n}';
      } else {
        requestPayload.textContent = 'GET /api/v1/tasks HTTP/1.1\nAuthorization: Bearer eyJhbGciOi...';
      }
    });
  }

  if(sendBtn) {
    sendBtn.addEventListener('click', () => {
      responseStatus.textContent = 'Status: Processando... (200ms)';
      responseStatus.style.color = '#B7C6D6';
      responseBody.textContent = 'Conectando ao container Spring Boot...';
      setTimeout(() => {
        responseStatus.textContent = 'Status: 200 OK (Sucesso)';
        responseStatus.style.color = '#5EEAD4';
        if(endpointSelect.value === 'GET_HEALTH') {
          responseBody.textContent = '{\n  "status": "UP",\n  "database": "MySQL Connected",\n  "uptime": "4h 22m"\n}';
        } else if(endpointSelect.value === 'POST_PIX') {
          responseBody.textContent = '{\n  "transactionId": "tx_9928173641",\n  "status": "CONCLUIDO",\n  "timestamp": "2026-06-06T15:30:00Z"\n}';
        } else {
          responseBody.textContent = '[\n  { "id": 1, "titulo": "Estudar Spring Security", "concluida": true },\n  { "id": 2, "titulo": "Refatorar arquitetura front", "concluida": false }\n]';
        }
      }, 400);
    });
  }

  // 4. Terminal Interativo (Easter Egg)
  const terminalTrigger = document.getElementById('terminalTrigger');
  const terminalOverlay = document.getElementById('terminalOverlay');
  const terminalClose = document.getElementById('terminalClose');
  const terminalInput = document.getElementById('terminalInput');
  const terminalBody = document.getElementById('terminalBody');

  if(terminalTrigger) {
    terminalTrigger.addEventListener('click', () => {
      terminalOverlay.classList.add('active');
      terminalInput.focus();
    });
  }
  if(terminalClose) {
    terminalClose.addEventListener('click', () => terminalOverlay.classList.remove('active'));
  }

  if(terminalOverlay) {
    terminalOverlay.addEventListener('click', (e) => {
      if(e.target === terminalOverlay) terminalOverlay.classList.remove('active');
    });
  }

  if(terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
      if(e.key === 'Enter') {
        const cmd = terminalInput.value.trim().toLowerCase();
        const pUser = document.createElement('p');
        pUser.innerHTML = `<span style="color: #5EEAD4">$</span> ${cmd}`;
        terminalBody.appendChild(pUser);

        const pRes = document.createElement('p');
        if(cmd === 'help') {
          pRes.innerHTML = 'Comandos disponíveis: <b>stack</b>, <b>projetos</b>, <b>contato</b>, <b>cv</b>, <b>clear</b>';
        } else if(cmd === 'stack') {
          pRes.innerHTML = 'Java 17+, Spring Boot, Spring Security, MySQL, HTML5, CSS3, JavaScript';
        } else if(cmd === 'projetos') {
          pRes.innerHTML = '1. Sistema Bancário Java<br>2. DevTasks (Spring Boot + JWT)<br>3. Anjos do Poço (ONG)';
        } else if(cmd === 'contato') {
          pRes.innerHTML = 'Email: viniciusziano2267@gmail.com | WhatsApp: (81) 98369-7754';
        } else if(cmd === 'cv') {
          pRes.innerHTML = 'Baixando currículo... <a href="assets/curriculo-vinicius-ziano.pdf" target="_blank" style="color: #5EEAD4">Clique aqui se não baixar</a>';
          window.open('assets/curriculo-vinicius-ziano.pdf', '_blank');
        } else if(cmd === 'clear') {
          terminalBody.innerHTML = '';
          terminalInput.value = '';
          return;
        } else {
          pRes.innerHTML = `Comando não reconhecido: "${cmd}". Digite <b>help</b>.`;
        }
        terminalBody.appendChild(pRes);
        terminalInput.value = '';
        terminalBody.scrollTop = terminalBody.scrollHeight;
      }
    });
  }

  // 5. Tradução PT / EN
  const langToggle = document.getElementById('langToggle');
  let currentLang = 'pt';
  
  const translations = {
    en: {
      role: "Back-end & Web Developer",
      lede: "Building robust APIs in Java & Spring Boot and modern web interfaces."
    },
    pt: {
      role: "Desenvolvedor Back-end & Web",
      lede: "Construo APIs robustas em Java & Spring Boot e interfaces modernas."
    }
  };

  if(langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'pt' ? 'en' : 'pt';
      langToggle.textContent = currentLang === 'pt' ? 'EN' : 'PT';
      
      const roleEl = document.querySelector('.hero-role');
      const ledeEl = document.querySelector('.lede');
      if(roleEl) roleEl.innerHTML = translations[currentLang].role;
      if(ledeEl) ledeEl.textContent = translations[currentLang].lede;
    });
  }
});