/*
 * Constellation — fundo animado em canvas (JavaScript puro).
 * Pontos flutuam devagar e se ligam por linhas quando ficam perto, formando
 * uma rede. O mouse atrai os pontos e traça linhas até eles; um clique
 * lança uma onda que empurra a rede para longe e ela se recompõe sozinha.
 *
 * Uso: adicione data-constellation ao elemento e, se quiser, configure:
 *   data-constellation-dot="#5EEAD4"  data-constellation-accent="#F2A65A"
 */
(function () {
  function hexToRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }

  function mount(host, opts) {
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'bg-canvas';
    // Estilo inline de propósito: se o CSS mudar, o canvas continua fora do fluxo
    // e nunca passa a empurrar (ou aumentar) a seção que o contém.
    canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0';
    host.insertBefore(canvas, host.firstChild);
    var ctx = canvas.getContext('2d');
    if (!ctx) { canvas.remove(); return; }

    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarse = !matchMedia('(hover: hover) and (pointer: fine)').matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var dot = hexToRgb(opts.dot);
    var accent = hexToRgb(opts.accent);

    var W = 0, H = 0, link = 130, pull = 170;
    var nodes = [];
    var pulses = [];                       // ondas de clique
    var ptr = { x: 0, y: 0, on: false };
    var raf = 0, visible = true, last = 0;

    function rand(a, b) { return a + Math.random() * (b - a); }

    function makeNode() {
      var a = Math.random() * Math.PI * 2, sp = rand(0.04, 0.16);
      var bx = Math.cos(a) * sp, by = Math.sin(a) * sp;
      return {
        x: rand(0, W), y: rand(0, H),
        bx: bx, by: by, vx: bx, vy: by,
        r: rand(1, 2.2),
        hot: Math.random() < 0.08          // poucos pontos em destaque (âmbar)
      };
    }

    function resize() {
      var w = host.clientWidth, h = host.clientHeight;
      if (w === W && h === H) return;
      var sx = W ? w / W : 1, sy = H ? h / H : 1;
      W = w; H = h;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      link = Math.max(90, Math.min(140, W / 7));
      var target = Math.round(Math.max(26, Math.min(85, (W * H) / 15000)));
      for (var i = 0; i < nodes.length; i++) { nodes[i].x *= sx; nodes[i].y *= sy; }
      while (nodes.length < target) nodes.push(makeNode());
      if (nodes.length > target) nodes.length = target;
    }

    function step(dt) {
      var i, n;
      for (i = pulses.length - 1; i >= 0; i--) {
        pulses[i].age += dt;
        if (pulses[i].age > 1.6) pulses.splice(i, 1);
      }
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        // volta devagar à deriva própria
        n.vx += (n.bx - n.vx) * 0.02;
        n.vy += (n.by - n.vy) * 0.02;
        // o mouse atrai os pontos próximos
        if (ptr.on) {
          var dx = ptr.x - n.x, dy = ptr.y - n.y, d = Math.hypot(dx, dy);
          if (d < pull && d > 1) {
            var k = (1 - d / pull) * 0.05;
            n.vx += (dx / d) * k;
            n.vy += (dy / d) * k;
          }
        }
        // ondas de clique empurram para fora
        for (var p = 0; p < pulses.length; p++) {
          var pu = pulses[p];
          var ex = n.x - pu.x, ey = n.y - pu.y, ed = Math.hypot(ex, ey) || 1;
          var front = pu.age * 380;
          var diff = ed - front;
          if (diff > -30 && diff < 30) {
            var push = (1 - Math.abs(diff) / 30) * (1 - pu.age / 1.6) * 1.4;
            n.vx += (ex / ed) * push;
            n.vy += (ey / ed) * push;
          }
        }
        // limita a velocidade e anda
        var sp = Math.hypot(n.vx, n.vy);
        if (sp > 2.4) { n.vx = (n.vx / sp) * 2.4; n.vy = (n.vy / sp) * 2.4; }
        n.x += n.vx * dt * 60;
        n.y += n.vy * dt * 60;
        // reaparece do lado oposto ao sair do quadro
        if (n.x < -10) n.x = W + 10; else if (n.x > W + 10) n.x = -10;
        if (n.y < -10) n.y = H + 10; else if (n.y > H + 10) n.y = -10;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, d, al;
      ctx.lineWidth = 1;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          var dx = a.x - b.x;
          if (dx > link || dx < -link) continue;
          var dy = a.y - b.y;
          if (dy > link || dy < -link) continue;
          d = Math.hypot(dx, dy);
          if (d >= link) continue;
          al = (1 - d / link) * 0.32;
          ctx.strokeStyle = 'rgba(' + dot + ',' + al.toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        // linhas do mouse até os pontos próximos
        if (ptr.on) {
          d = Math.hypot(a.x - ptr.x, a.y - ptr.y);
          if (d < pull) {
            al = (1 - d / pull) * 0.7;
            ctx.strokeStyle = 'rgba(' + accent + ',' + al.toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(ptr.x, ptr.y); ctx.stroke();
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        ctx.fillStyle = 'rgba(' + (a.hot ? accent : dot) + ',' + (a.hot ? 0.95 : 0.8) + ')';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.hot ? a.r + 0.6 : a.r, 0, Math.PI * 2); ctx.fill();
      }
      // anel da onda de clique
      for (i = 0; i < pulses.length; i++) {
        var pu = pulses[i];
        ctx.strokeStyle = 'rgba(' + dot + ',' + ((1 - pu.age / 1.6) * 0.35).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(pu.x, pu.y, pu.age * 380, 0, Math.PI * 2); ctx.stroke();
      }
    }

    function loop(ms) {
      if (!visible || document.hidden) { raf = 0; last = 0; return; }
      raf = requestAnimationFrame(loop);
      if (coarse && ms - last < 30) return;       // ~30fps em telas touch
      var dt = last ? Math.min((ms - last) / 1000, 0.05) : 1 / 60;
      last = ms;
      resize();
      step(dt);
      draw();
    }
    function wake() {
      if (!reduced && !raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    }

    function local(e) {
      var r = host.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return null;
      return { x: x, y: y };
    }
    function onMove(e) {
      var p = local(e);
      ptr.on = !!p;
      if (p) { ptr.x = p.x; ptr.y = p.y; }
    }
    function onDown(e) {
      var p = local(e);
      if (p) pulses.push({ x: p.x, y: p.y, age: 0 });
    }

    resize();
    draw();                                         // quadro estático já na primeira pintura

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        wake();
      }).observe(host);
    }
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () {
        if (reduced) { resize(); draw(); }
      }).observe(host);
    }
    document.addEventListener('visibilitychange', wake);
    if (!reduced) {
      wake();
      if (!coarse) window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
    }
  }

  document.querySelectorAll('[data-constellation]').forEach(function (host) {
    mount(host, {
      dot: host.getAttribute('data-constellation-dot') || '#5EEAD4',
      accent: host.getAttribute('data-constellation-accent') || '#F2A65A'
    });
  });
})();
