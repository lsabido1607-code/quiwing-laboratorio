/* heroes.js — Tres direcciones para el hero, radicalmente distintas (brief, punto 30·B).
   1 · Objetos sobre la mesa: aire, tipografía protagonista y tres objetos que se tocan (mymind + Headspace).
   2 · Un objeto vivo: una sola forma que cambia de estado según tu momento (Endel, en claro).
   3 · La frase es el objeto: las palabras mismas se mueven y se reducen (tipografía editorial).
   Las tres usan las mismas tres entradas: ENTRA, BAJA EL RUIDO y SAL DEL FOCO. */
(function () {
  const { Sonido, Mov, anunciar, demo } = window.QW;
  const C = { orienta: '#8082AD', reduce: '#E6B456', activa: '#C65252', cierra: '#879E6E', violeta: '#8D6A9E' };
  const centroDe = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  // ================================================================== 1 · OBJETOS SOBRE LA MESA
  demo('hero-objetos', (c) => {
    const r = c.el('div', 'h1');
    r.innerHTML = `
      <header class="h1-cab"><b class="h1-marca">Quiwing.</b></header>
      <p class="h1-lema">Pasos claros.<br>Más libertad.</p>
      <p class="h1-pregunta"><i></i>¿Dónde hay fricción ahora?</p>
      <div class="h1-filas">
        <button class="h1-fila" type="button" data-k="entra" style="--c:${C.activa}">
          <span class="h1-obj"><span class="caja"><span class="caja-papel">1 paso</span><span class="caja-cuerpo objeto"></span><span class="caja-tapa objeto"></span></span></span>
          <span class="h1-txt"><span class="h1-frase">Sé qué hacer, pero no empiezo.</span><span class="h1-nombre">Entra</span></span></button>
        <button class="h1-fila" type="button" data-k="ruido" style="--c:${C.reduce}">
          <span class="h1-obj"><span class="canicas"></span></span>
          <span class="h1-txt"><span class="h1-frase">Todo me está hablando al mismo tiempo.</span><span class="h1-nombre">Baja el ruido</span></span></button>
        <button class="h1-fila" type="button" data-k="foco" style="--c:${C.cierra}">
          <span class="h1-obj"><svg class="bucle" viewBox="0 0 80 80"><circle class="aro" cx="40" cy="40" r="26"/><circle class="punto" cx="66" cy="40" r="6"/></svg></span>
          <span class="h1-txt"><span class="h1-frase">Me metí en algo y no logro salir.</span><span class="h1-nombre">Sal del foco</span></span></button>
      </div>
      <p class="h1-pie instruccion">Toca lo que te pasa.</p>`;
    c.raiz.append(r);
    // canicas: siete bolitas que no se quedan quietas (ruido)
    const can = r.querySelector('.canicas'), bolas = [];
    for (let i = 0; i < 7; i++) { const b = c.el('span', 'objeto bola'); b.style.setProperty('--c', i % 2 ? '#E6B456' : '#EBC57A'); can.append(b); bolas.push({ el: b, a: i / 7 * Math.PI * 2, r: 12 + (i % 3) * 5, f: 1.3 + i * .37 }); }
    let ruidoCalmo = false, focoVel = 5.5, focoAng = 0, focoAbierto = false;
    const punto = r.querySelector('.punto'), aro = r.querySelector('.aro');
    c.cuadro((dt, t) => {
      if (!ruidoCalmo) bolas.forEach((b, i) => { const x = Math.cos(b.a + t * b.f * .6) * b.r + Math.sin(t * b.f * 2.3 + i) * 3, y = Math.sin(b.a + t * b.f * .6) * b.r * .8 + Math.cos(t * b.f * 1.9) * 3; b.el.style.transform = `translate(${x}px, ${y}px)`; });
      focoAng += focoVel * dt * (Mov.reducido ? 0 : 1);
      if (focoAbierto) focoVel += (0.35 - focoVel) * Math.min(1, dt * 1.6);
      const R = 26; punto.setAttribute('cx', 40 + Math.cos(focoAng) * R); punto.setAttribute('cy', 40 + Math.sin(focoAng) * R);
    });
    const hecho = new Set();
    r.querySelectorAll('.h1-fila').forEach(f => f.addEventListener('click', async () => {
      const k = f.dataset.k; if (hecho.has(k)) return; hecho.add(k); f.classList.add('hecha');
      const frase = f.querySelector('.h1-frase');
      if (k === 'entra') {
        Sonido.roce(); f.querySelector('.caja').classList.add('abierta');
        cambiarFrase(frase, 'Un paso. Nada más.');
      }
      if (k === 'ruido') {
        ruidoCalmo = true; const quedan = bolas.slice(1).map(b => b.el);
        await Mov.reducir(quedan, centroDe(can));
        Mov.encajar(bolas[0].el, () => { bolas[0].el.style.transform = 'translate(0px,0px) scale(1.5)'; });
        cambiarFrase(frase, 'Solo una cosa.');
      }
      if (k === 'foco') {
        focoAbierto = true; Sonido.respira(); aro.classList.add('abierto');
        cambiarFrase(frase, 'Ya es suficiente por ahora.');
      }
      anunciar(frase.textContent);
    }));
    function cambiarFrase(el, texto) { el.animate([{ opacity: 1 }, { opacity: 0, filter: 'blur(4px)' }], { duration: 260, fill: 'forwards' }).finished.then(() => { el.textContent = texto; Mov.abrir(el, { sonido: false }); }); }
  });

  // ================================================================== 2 · UN OBJETO VIVO
  demo('hero-estado', (c) => {
    const r = c.el('div', 'h2');
    r.innerHTML = `
      <header class="h2-cab"><b class="h2-marca">Quiwing.</b><span class="h2-lema">Pasos claros. Más libertad.</span></header>
      <p class="h2-pregunta" aria-live="polite">¿Dónde hay fricción ahora?</p>
      <div class="h2-escena"><canvas class="h2-lienzo" aria-label="Una forma que cambia según tu momento. Tócala."></canvas></div>
      <p class="h2-instr instruccion" aria-live="polite">Escoge tu momento.</p>
      <div class="h2-momentos" role="group" aria-label="Tu momento">
        <button type="button" data-k="entra" style="--c:${C.activa}"><i></i>Sé qué hacer, pero no empiezo.</button>
        <button type="button" data-k="ruido" style="--c:${C.reduce}"><i></i>Todo me está hablando al mismo tiempo.</button>
        <button type="button" data-k="foco" style="--c:${C.cierra}"><i></i>Me metí en algo y no logro salir.</button>
      </div>`;
    c.raiz.append(r);
    const cv = r.querySelector('canvas'), g = cv.getContext('2d'), escena = r.querySelector('.h2-escena');
    const N = 13, P = Array.from({ length: N }, (_, i) => ({ x: 0, y: 0, vx: 0, vy: 0, r: 0, tr: 0, a: 1, ta: 1, col: [141, 106, 158], tcol: [141, 106, 158], fase: i * 1.7 }));
    const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    let modo = 'base', resuelto = false, giro = 0, vel = 0, W = 0, H = 0, dpr = 1;
    const medir = () => { dpr = Math.min(2, devicePixelRatio || 1); W = escena.clientWidth; H = escena.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; };
    medir(); new ResizeObserver(medir).observe(escena);
    P.forEach((p, i) => { const a = i / N * Math.PI * 2; p.x = W / 2 + Math.cos(a) * 20; p.y = H / 2 + Math.sin(a) * 20; });
    function metas(t) {
      const cx = W / 2, cy = H / 2, S = Math.min(W, H);
      P.forEach((p, i) => {
        const a = i / N * Math.PI * 2;
        if (modo === 'base') { const rr = S * .1 * (1 + .12 * Math.sin(t * .8 + p.fase)); p.tx = cx + Math.cos(a + t * .15) * rr; p.ty = cy + Math.sin(a + t * .15) * rr; p.tr = S * .085; p.ta = 1; p.tcol = hex(C.violeta); }
        if (modo === 'entra') {
          p.tcol = hex(C.activa);
          if (!resuelto) { p.tx = cx + Math.cos(a) * S * .035; p.ty = cy + Math.sin(a) * S * .035; p.tr = S * .055; }
          else if (i === 0) { p.tx = cx + S * .3; p.ty = cy - S * .05 + Math.sin(t * 2) * 4; p.tr = S * .06; }
          else { p.tx = cx + Math.cos(a + .3) * S * .17; p.ty = cy + Math.sin(a + .3) * S * .17; p.tr = S * .045; }
          p.ta = 1;
        }
        if (modo === 'ruido') {
          p.tcol = hex(C.reduce);
          if (!resuelto) { p.tx = cx + Math.sin(t * (1.3 + i * .21) + p.fase) * S * .32; p.ty = cy + Math.cos(t * (1.1 + i * .17) + p.fase * 1.3) * S * .3; p.tr = S * .045; p.ta = 1; }
          else if (i === 0) { p.tx = cx; p.ty = cy; p.tr = S * .13; p.ta = 1; }
          else { p.tx = cx + Math.cos(a) * S * .9; p.ty = cy + Math.sin(a) * S * .9; p.tr = S * .03; p.ta = 0; }
        }
        if (modo === 'foco') {
          p.tcol = hex(C.cierra);
          if (!resuelto) { const aa = a + giro; p.tx = cx + Math.cos(aa) * S * .24; p.ty = cy + Math.sin(aa) * S * .24; p.tr = S * .04; }
          else { const k = i / (N - 1); p.tx = cx - S * .32 + k * S * .64; p.ty = cy + Math.sin(k * Math.PI) * -S * .08; p.tr = S * .032; }
          p.ta = 1;
        }
      });
    }
    c.cuadro((dt, t) => {
      giro += vel * dt; if (modo === 'foco') vel += ((resuelto ? .05 : 6) - vel) * Math.min(1, dt * (resuelto ? 1.2 : 3));
      metas(Mov.reducido ? 0 : t);
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      P.forEach(p => {
        const k = Mov.reducido ? 1 : 1 - Math.exp(-dt * 6);
        p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; p.r += (p.tr - p.r) * k; p.a += (p.ta - p.a) * k;
        p.col = p.col.map((v, j) => v + (p.tcol[j] - v) * k);
        if (p.a < .02) return;
        const [cr, cg, cb] = p.col.map(Math.round), gr = g.createRadialGradient(p.x - p.r * .35, p.y - p.r * .4, p.r * .1, p.x, p.y, p.r);
        gr.addColorStop(0, `rgba(${Math.min(255, cr + 60)},${Math.min(255, cg + 60)},${Math.min(255, cb + 60)},${p.a})`); gr.addColorStop(1, `rgba(${cr},${cg},${cb},${p.a})`);
        g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, Math.max(.5, p.r), 0, Math.PI * 2); g.fill();
      });
    });
    const TEXTOS = {
      entra: ['Está cerrado. Tócalo.', 'Un paso. Nada más.'],
      ruido: ['Todo se mueve. Tócalo.', 'Solo una cosa.'],
      foco: ['No para de girar. Tócalo.', 'Ya es suficiente por ahora.']
    };
    const instr = r.querySelector('.h2-instr'), preg = r.querySelector('.h2-pregunta');
    r.querySelectorAll('.h2-momentos button').forEach(b => b.addEventListener('click', () => {
      modo = b.dataset.k; resuelto = false; vel = 6;
      r.querySelectorAll('.h2-momentos button').forEach(x => x.setAttribute('aria-pressed', x === b));
      instr.textContent = TEXTOS[modo][0]; preg.textContent = '¿Dónde hay fricción ahora?'; Sonido.clic(); escena.classList.add('tocable');
    }));
    escena.addEventListener('click', () => {
      if (modo === 'base' || resuelto) return;
      resuelto = true; escena.classList.remove('tocable');
      ({ entra: Sonido.roce, ruido: Sonido.aire, foco: Sonido.respira })[modo]();
      setTimeout(() => modo === 'ruido' ? Sonido.snap() : modo === 'entra' ? Sonido.snap() : Sonido.cierre(), 700);
      preg.textContent = TEXTOS[modo][1]; Mov.abrir(preg, { sonido: false });
      instr.textContent = 'Toca otro momento para probarlo.'; anunciar(TEXTOS[modo][1]);
    });
  });

  // ================================================================== 3 · LA FRASE ES EL OBJETO
  demo('hero-frase', (c) => {
    const r = c.el('div', 'h3');
    r.innerHTML = `
      <header class="h3-cab"><b class="h3-marca">Quiwing.</b><span class="h3-lema">Pasos claros. Más libertad.</span></header>
      <div class="h3-escena"><div class="h3-ruido" aria-hidden="true"></div><p class="h3-frase frase-grande" aria-live="polite"></p></div>
      <p class="h3-instr instruccion"></p>
      <nav class="h3-nav" aria-label="Momentos"><button type="button" class="h3-ant" aria-label="Momento anterior">←</button><span class="h3-puntos"><i></i><i></i><i></i></span><button type="button" class="h3-sig" aria-label="Momento siguiente">→</button></nav>`;
    c.raiz.append(r);
    const escena = r.querySelector('.h3-escena'), frase = r.querySelector('.h3-frase'), ruido = r.querySelector('.h3-ruido'), instr = r.querySelector('.h3-instr');
    const MOM = [
      { k: 'entra', c: C.activa, frase: 'Sé qué hacer, pero no empiezo.', clave: [5], instr: 'Toca «empiezo».', fin: ['Empiezo.', 'Con algo pequeño.'] },
      { k: 'ruido', c: C.reduce, frase: 'Todo me está hablando al mismo tiempo.', clave: [], instr: 'Toca la frase.', fin: ['Solo una cosa.', 'Lo demás puede esperar.'] },
      { k: 'foco', c: C.cierra, frase: 'Me metí en algo y no logro salir.', clave: [], instr: 'Toca el círculo.', fin: ['Ya es suficiente', 'por ahora.'] }
    ];
    const RUIDO = ['correo', 'pendiente', 'mensaje', 'pagar', 'llamar', 'ropa', 'junta', 'tarea', 'aviso', 'cita', 'recibo', 'súper', 'contestar', 'mañana', 'urgente', 'grupo'];
    let i = 0, resuelto = false, anillo = null, giro = 0, vel = 0;
    function pintar() {
      const m = MOM[i]; resuelto = false; anillo = null; frase.style.cssText = ''; frase.classList.remove('anillo');
      r.style.setProperty('--c', m.c); ruido.replaceChildren();
      r.querySelectorAll('.h3-puntos i').forEach((p, j) => p.classList.toggle('on', j === i));
      instr.textContent = m.instr;
      const palabras = m.frase.split(' ');
      frase.replaceChildren(...palabras.map((p, j) => { const s = document.createElement('span'); s.className = 'pal' + (m.clave.includes(j) ? ' clave' : ''); s.textContent = p; return s; }).flatMap((s, j, a) => j < a.length - 1 ? [s, document.createTextNode(' ')] : [s]));
      if (m.k === 'ruido') for (let k = 0; k < 18; k++) { const s = document.createElement('span'); s.textContent = RUIDO[k % RUIDO.length]; s.style.left = (Math.random() * 84) + '%'; s.style.top = (Math.random() * 88) + '%'; s.style.fontSize = (14 + Math.random() * 22) + 'px'; s.dataset.f = 1 + Math.random() * 2; ruido.append(s); }
      if (m.k === 'foco') hacerAnillo();
      Mov.abrir(frase, { sonido: false });
    }
    function hacerAnillo() {
      frase.classList.add('anillo'); const pals = [...frase.querySelectorAll('.pal')];
      anillo = pals.map((p, j) => ({ el: p, a: j / pals.length * Math.PI * 2 })); vel = 2.4;
    }
    c.cuadro((dt, t) => {
      if (MOM[i].k === 'ruido' && !resuelto) [...ruido.children].forEach((s, k) => { s.style.transform = `translate(${Math.sin(t * s.dataset.f + k) * 8}px, ${Math.cos(t * s.dataset.f * 1.3 + k) * 6}px)`; });
      if (anillo) {
        giro += vel * dt; if (resuelto) vel += (0 - vel) * Math.min(1, dt * 1.4);
        const R = Math.min(escena.clientWidth, escena.clientHeight) * .36;
        anillo.forEach(w => { const a = w.a + giro; w.el.style.transform = `translate(${Math.cos(a) * R}px, ${Math.sin(a) * R}px) translate(-50%, -50%) rotate(${a + Math.PI / 2}rad)`; });
      }
    });
    async function resolver() {
      if (resuelto) return; resuelto = true; const m = MOM[i];
      if (m.k === 'entra') {
        const pals = [...frase.querySelectorAll('.pal')], queda = pals[m.clave[0]];
        await Mov.reducir(pals.filter(p => p !== queda), centroDe(frase));
        Mov.encajar(queda, () => { frase.replaceChildren(queda); queda.textContent = m.fin[0]; queda.classList.remove('clave'); });
      }
      if (m.k === 'ruido') {
        await Mov.reducir([...ruido.children], centroDe(escena));
        await Mov.reducir([...frase.querySelectorAll('.pal')], centroDe(frase), { sonido: false });
        frase.textContent = m.fin[0]; Mov.abrir(frase, { sonido: false }); Sonido.snap();
      }
      if (m.k === 'foco') {
        Sonido.respira(); await new Promise(res => setTimeout(res, Mov.reducido ? 0 : 1500));
        anillo = null; await Mov.reducir([...frase.querySelectorAll('.pal')], centroDe(frase), { sonido: false });
        frase.classList.remove('anillo'); frase.textContent = m.fin.join(' '); Mov.abrir(frase, { sonido: false }); Sonido.cierre();
      }
      const sub = document.createElement('span'); sub.className = 'h3-sub'; sub.textContent = m.k === 'foco' ? 'Tú decides, no la tarea.' : m.fin[1];
      setTimeout(() => { frase.after(sub); Mov.abrir(sub, { sonido: false }); }, 650);
      instr.textContent = 'Desliza o toca → para otro momento.'; anunciar(frase.textContent);
    }
    let deslizo = false;
    escena.addEventListener('click', () => { if (deslizo) { deslizo = false; return; } resolver(); });
    escena.setAttribute('tabindex', '0'); escena.setAttribute('role', 'button'); escena.setAttribute('aria-label', 'Tocar la frase');
    escena.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); resolver(); } });
    const ir = (d) => { i = (i + d + MOM.length) % MOM.length; r.querySelectorAll('.h3-sub').forEach(s => s.remove()); Sonido.tic(); pintar(); };
    r.querySelector('.h3-sig').addEventListener('click', () => ir(1)); r.querySelector('.h3-ant').addEventListener('click', () => ir(-1));
    let x0 = null; escena.addEventListener('pointerdown', e => { x0 = e.clientX; }); escena.addEventListener('pointerup', e => { if (x0 != null && Math.abs(e.clientX - x0) > 60) { deslizo = true; ir(e.clientX < x0 ? 1 : -1); } x0 = null; });
    pintar();
  });
})();
