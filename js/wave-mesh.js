/*
 * Wave Mesh — fundo animado em canvas (JavaScript puro).
 * Um campo de pontos que vai até o horizonte e ondula como um mar lento.
 * O ponteiro levanta uma pequena colina; ao clicar, ela lança um anel que
 * viaja pelo campo e some. Pontos distantes encolhem e esmaecem, dando
 * profundidade sem biblioteca 3D.
 *
 * Uso: adicione data-wave-mesh ao elemento e, se quiser, configure:
 *   data-wave-dot="#7fb3c8"  data-wave-accent="#5EEAD4"  data-wave-crests="true"
 */
(function () {
  var CAM = 0.62;          // altura da câmera acima do chão
  var NEAR = 0.35, FAR = 3.4;

  function hexToRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }

  function mount(host, opts) {
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'wave-canvas';
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
    var crests = opts.crests;

    var W = 0, H = 0, cols = 0, rows = 0, f = 0, hz = 0;
    var raf = 0, visible = true, last = 0;
    var t0 = performance.now();
    var ptr = { x: 0, z: 1.4, s: 0, tx: 0, tz: 1.4, ts: 0 };
    var rings = [];

    function resize() {
      var w = host.clientWidth, h = host.clientHeight;
      if (w === W && h === H) return;
      W = w; H = h;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      f = Math.max(W, H * 1.2) * 0.55;   // distância focal
      hz = H * 0.3;                      // horizonte
      cols = Math.round(Math.min(150, Math.max(56, W / 9)));
      rows = Math.round(Math.min(90, Math.max(48, H / 9.5)));
    }

    // Meia-largura do chão na borda distante, para o campo sempre preencher o quadro.
    function half() { return (W / 2 / f) * FAR * 1.05; }

    function height(x, z, t) {
      var y =
        0.085 * Math.sin(x * 2.2 + t * 0.7) +
        0.07 * Math.sin(z * 2.9 - t * 0.9 + x * 0.8) +
        0.03 * Math.sin((x + z) * 6.1 + t * 1.6);
      if (ptr.s > 0.01) {
        var d2 = (x - ptr.x) * (x - ptr.x) + (z - ptr.z) * (z - ptr.z);
        y += 0.24 * ptr.s * Math.exp(-d2 / 0.07);
      }
      for (var i = 0; i < rings.length; i++) {
        var r = rings[i];
        var age = t - r.t;
        var d = Math.hypot(x - r.x, z - r.z);
        var front = age * 1.15;
        y += 0.2 * Math.exp(-((d - front) * (d - front)) / 0.014) * Math.exp(-age * 0.75);
      }
      return y;
    }

    function frame(t) {
      ctx.clearRect(0, 0, W, H);
      ptr.x += (ptr.tx - ptr.x) * 0.1;
      ptr.z += (ptr.tz - ptr.z) * 0.1;
      ptr.s += (ptr.ts - ptr.s) * 0.06;
      while (rings.length && t - rings[0].t > 5) rings.shift();
      var hw = half();
      var hot = [];
      for (var j = 0; j < rows; j++) {
        // Linhas espaçadas geometricamente em profundidade: ficam quase uniformes na tela.
        var z = FAR * Math.pow(NEAR / FAR, j / (rows - 1));
        var fog = Math.pow(1 - (z - NEAR) / (FAR - NEAR), 1.25);
        var size = Math.max(0.8, Math.min(3.2, 2.3 / z));
        ctx.fillStyle = 'rgba(' + dot + ',' + (0.12 + fog * 0.85).toFixed(3) + ')';
        for (var i = 0; i < cols; i++) {
          var x = -hw + (i / (cols - 1)) * hw * 2;
          var y = height(x, z, t);
          var sx = W / 2 + (x / z) * f;
          if (sx < -4 || sx > W + 4) continue;
          var sy = hz + ((CAM - y) / z) * f;
          if (crests && y > 0.12) { hot.push(sx, sy, size, fog); continue; }
          ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
        }
      }
      for (var k = 0; k < hot.length; k += 4) {
        ctx.fillStyle = 'rgba(' + accent + ',' + (0.2 + hot[k + 3] * 0.8).toFixed(3) + ')';
        var s = hot[k + 2] * 1.15;
        ctx.fillRect(hot[k] - s / 2, hot[k + 1] - s / 2, s, s);
      }
    }

    function now() { return (performance.now() - t0) / 1000; }

    function loop(ms) {
      if (!visible || document.hidden) { raf = 0; return; }
      raf = requestAnimationFrame(loop);
      if (coarse && ms - last < 30) return;   // ~30fps em telas touch
      last = ms;
      resize();
      frame(now());
    }
    function wake() {
      if (!reduced && !raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    }

    // Em que ponto do chão cai um ponto da tela (ignorando as ondas).
    function ground(e) {
      var r = host.getBoundingClientRect();
      var sx = e.clientX - r.left, sy = e.clientY - r.top;
      if (sx < 0 || sy < 0 || sx > r.width || sy > r.height || sy <= hz + 4) return null;
      var z = Math.min(FAR, Math.max(NEAR, (CAM * f) / (sy - hz)));
      return { x: ((sx - W / 2) * z) / f, z: z };
    }
    function onMove(e) {
      var g = ground(e);
      if (g) {
        ptr.tx = g.x; ptr.tz = g.z;
        if (ptr.s < 0.05) { ptr.x = g.x; ptr.z = g.z; }
      }
      ptr.ts = g ? 1 : 0;
    }
    function onDown(e) {
      var g = ground(e);
      if (g) rings.push({ x: g.x, z: g.z, t: now() });
    }

    resize();
    frame(reduced ? 3 : 0);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        wake();
      }).observe(host);
    }
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () {
        if (reduced) { resize(); frame(3); }
      }).observe(host);
    }
    document.addEventListener('visibilitychange', wake);
    if (!reduced) {
      wake();
      if (!coarse) window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
    }
  }

  document.querySelectorAll('[data-wave-mesh]').forEach(function (host) {
    mount(host, {
      dot: host.getAttribute('data-wave-dot') || '#c9d6ea',
      accent: host.getAttribute('data-wave-accent') || '#f0b37a',
      crests: host.getAttribute('data-wave-crests') === 'true'
    });
  });
})();
