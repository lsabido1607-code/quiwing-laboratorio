/* comun.js — Lo que comparten todas las demos y que después pasaría tal cual a las microapps.
   1. Sonido: opcional y apagado al entrar (nunca suena solo). Respuestas físicas, no de videojuego:
      snap, clic, roce, aire, cierre y respiración, todo sintetizado.
   2. Gramática de movimiento: ABRIR, REDUCIR, ENCAJAR, GUARDAR y RESPIRAR. Cada una significa algo.
   3. Arrastrar con el dedo (con alternativa de tocar, para quien no puede arrastrar). */
(function () {
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ================================================================== sonido
  let AC = null, encendido = false, forzado = false;
  try { encendido = localStorage.getItem('qw-sonido') === 'si'; } catch (e) {}
  const contexto = () => {
    if (!encendido && !forzado) return null;
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  };
  function tono(f, dur, vol, tipo = 'sine', cuando = 0, fFinal) {
    const a = contexto(); if (!a) return;
    const t = a.currentTime + cuando, o = a.createOscillator(), g = a.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t); if (fFinal) o.frequency.exponentialRampToValueAtTime(fFinal, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
  }
  // ruido filtrado con subida y bajada: sirve para roces, aire y respiración
  function ruido(dur, f1, f2, vol, { cuando = 0, subida = .005 } = {}) {
    const a = contexto(); if (!a) return;
    const n = Math.max(1, Math.floor(a.sampleRate * dur)), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + cuando;
    s.buffer = b; bp.type = 'bandpass'; bp.frequency.value = Math.sqrt(f1 * f2); bp.Q.value = Math.sqrt(f1 * f2) / (f2 - f1);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + subida); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(bp).connect(g).connect(a.destination); s.start(t); s.stop(t + dur + .05);
  }
  const Sonido = {
    get encendido() { return encendido; },
    poner(v) { encendido = v; try { localStorage.setItem('qw-sonido', v ? 'si' : 'no'); } catch (e) {} if (v) Sonido.clic(); },
    snap() { ruido(.03, 1600, 6000, .3); tono(150, .16, .16, 'sine', 0, 90); },          // encaja: clic seco + golpecito grave
    clic() { ruido(.014, 2600, 7600, .25); },
    roce() { ruido(.4, 500, 2600, .09, { subida: .12 }); },                              // abre: papel que se desliza
    aire() { ruido(.75, 160, 900, .07, { subida: .2 }); },                               // reduce: algo se aleja
    cierre() { tono(660, .55, .07); tono(495, .8, .06, 'sine', .14); },                   // guarda: dos tonos que bajan
    respira() { ruido(2.6, 180, 650, .045, { subida: 1.1 }); },                           // respirar: aire lento
    tic() { tono(1900, .03, .03, 'triangle'); },
    // para la muestra de sonidos: suena porque la persona lo pidió, aunque el sonido general esté apagado
    probar(nombre) { forzado = true; try { Sonido[nombre](); } finally { forzado = false; } }
  };

  // ================================================================== gramática de movimiento
  const DUR = { abrir: 700, reducir: 900, encajar: 560, guardar: 800, respirar: 5000 };
  const CURVA = { abrir: 'cubic-bezier(.2,.8,.2,1)', reducir: 'cubic-bezier(.65,0,.35,1)', guardar: 'cubic-bezier(.5,0,.75,0)', respirar: 'cubic-bezier(.45,0,.55,1)' };
  const anima = (el, cuadros, op) => el.animate(cuadros, reducido ? { ...op, duration: 1, iterations: 1 } : op);
  // un resorte calculado (sube, se pasa poquito y se asienta): para ENCAJAR
  function resorte(n = 32, rigidez = 220, amort = 16) {
    let x = 0, v = 0; const pasos = []; const dt = 1 / 120;
    for (let i = 0; i < 120 * 1.2; i++) { const a = rigidez * (1 - x) - amort * v; v += a * dt; x += v * dt; pasos.push(x); }
    return Array.from({ length: n }, (_, i) => pasos[Math.round(i / (n - 1) * (pasos.length - 1))]);
  }
  const RESORTE = resorte();

  const Mov = {
    DUR, CURVA, reducido,
    // ABRIR — algo se hace visible, se despliega con calma: "puedo entrar"
    abrir(el, { sonido = true, retraso = 0 } = {}) {
      if (sonido) setTimeout(Sonido.roce, retraso);
      return anima(el, [{ opacity: 0, translate: '0 12px', scale: '.96', filter: 'blur(6px)' }, { opacity: 1, translate: '0 0', scale: '1', filter: 'blur(0px)' }],
        { duration: DUR.abrir, delay: retraso, easing: CURVA.abrir, fill: 'both' }).finished;
    },
    // REDUCIR — lo que sobra se aleja y desaparece: "no necesito resolver todo"
    reducir(elementos, centro, { sonido = true } = {}) {
      if (sonido) Sonido.aire();
      return Promise.all(elementos.map((el, i) => {
        const r = el.getBoundingClientRect(); let dx = r.left + r.width / 2 - centro.x, dy = r.top + r.height / 2 - centro.y;
        const d = Math.hypot(dx, dy) || 1, lejos = 70 + (i % 3) * 30;
        return anima(el, [{ opacity: 1, translate: '0 0', scale: '1', filter: 'blur(0px)' }, { opacity: 0, translate: `${dx / d * lejos}px ${dy / d * lejos}px`, scale: '.7', filter: 'blur(8px)' }],
          { duration: DUR.reducir, delay: i * 70, easing: CURVA.reducir, fill: 'forwards' }).finished;
      }));
    },
    // ENCAJAR — cae en su lugar con un snap: "esto queda aquí". Se mueve el elemento a su nuevo lugar y se anima desde donde estaba.
    encajar(el, ponerEnSuLugar, { sonido = true } = {}) {
      const antes = el.getBoundingClientRect(); ponerEnSuLugar(); const despues = el.getBoundingClientRect();
      const dx = antes.left - despues.left, dy = antes.top - despues.top;
      if (sonido) setTimeout(Sonido.snap, reducido ? 0 : DUR.encajar * .42);
      return anima(el, RESORTE.map((x, i) => ({ translate: `${dx * (1 - x)}px ${dy * (1 - x)}px`, scale: String(1 + Math.max(0, x - 1) * .5) })),
        { duration: DUR.encajar, easing: 'linear', fill: 'none' }).finished;
    },
    // GUARDAR — se recoge hacia su lugar y descansa: "puedo cerrar"
    guardar(el, destino, { sonido = true } = {}) {
      const r = el.getBoundingClientRect(), d = destino.getBoundingClientRect();
      const dx = d.left + d.width / 2 - (r.left + r.width / 2), dy = d.top + d.height / 2 - (r.top + r.height / 2);
      if (sonido) setTimeout(Sonido.cierre, reducido ? 0 : DUR.guardar * .8);
      return anima(el, [{ translate: '0 0', scale: '1', opacity: 1 }, { translate: `${dx * .6}px ${dy * .6 - 20}px`, scale: '.75', opacity: 1, offset: .45 }, { translate: `${dx}px ${dy}px`, scale: '.25', opacity: 0 }],
        { duration: DUR.guardar, easing: CURVA.guardar, fill: 'forwards' }).finished;
    },
    // RESPIRAR — se expande y se contrae despacio: "bajo intensidad"
    respirar(el, { escala = 1.06, duracion = DUR.respirar } = {}) {
      if (reducido) return null;
      return el.animate([{ scale: '1' }, { scale: String(escala) }], { duration: duracion, direction: 'alternate', iterations: Infinity, easing: CURVA.respirar });
    }
  };

  // ================================================================== arrastrar (con alternativa de tocar)
  // Arrastrar(el, { alMover(x,y), alSoltar(x,y) -> true si se quedó }) — mueve con la propiedad translate
  function arrastrable(el, { alEmpezar, alMover, alSoltar } = {}) {
    let ini = null;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      ini = { x: e.clientX, y: e.clientY, movido: false, id: e.pointerId };
      el.setPointerCapture(e.pointerId); el.classList.add('agarrado'); alEmpezar && alEmpezar(e);
    });
    el.addEventListener('pointermove', (e) => {
      if (!ini || e.pointerId !== ini.id) return;
      const dx = e.clientX - ini.x, dy = e.clientY - ini.y;
      if (Math.hypot(dx, dy) > 6) ini.movido = true;
      el.style.translate = `${dx}px ${dy}px`; alMover && alMover(e.clientX, e.clientY);
    });
    const fin = (e) => {
      if (!ini || e.pointerId !== ini.id) return;
      const movido = ini.movido; ini = null; el.classList.remove('agarrado');
      const quedo = movido && alSoltar ? alSoltar(e.clientX, e.clientY) : false;
      if (!quedo) {
        const t = el.style.translate || '0px 0px'; el.style.translate = '';
        if (movido) anima(el, [{ translate: t }, { translate: '0px 0px' }], { duration: 420, easing: CURVA.abrir });
        else el.dispatchEvent(new CustomEvent('toque', { bubbles: true }));
      }
    };
    el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin);
  }

  // ================================================================== avisos para lectores de pantalla
  let aviso = null;
  function anunciar(texto) {
    if (!aviso) { aviso = document.createElement('div'); aviso.className = 'aviso-vivo'; aviso.setAttribute('aria-live', 'polite'); document.body.append(aviso); }
    aviso.textContent = ''; setTimeout(() => { aviso.textContent = texto; }, 30);
  }

  // ================================================================== cada demo vive en un "teléfono" y se puede reiniciar
  const demos = new Map();
  function demo(nombre, montar) { demos.set(nombre, montar); }
  function montar(tel) {
    const nombre = tel.dataset.demo, f = demos.get(nombre); if (!f) return;
    if (tel._parar) tel._parar();
    const vivo = tel.querySelector('.vivo'); vivo.replaceChildren();
    let activo = true; const ciclos = [];
    const ctx = {
      raiz: vivo, tel, activo: () => activo,
      // un ciclo por cuadro; si el teléfono no se ve, no hace trabajo (ahorra pila en el celular)
      cuadro(fn) { const c = { id: 0 }; let ult = performance.now(); const paso = (t) => { if (!activo) return; const dt = Math.min(.05, (t - ult) / 1000); ult = t; if (tel._visible !== false) fn(dt, t / 1000); c.id = requestAnimationFrame(paso); }; c.id = requestAnimationFrame(paso); ciclos.push(c); },
      el(tag, clase, html) { const e = document.createElement(tag); if (clase) e.className = clase; if (html != null) e.innerHTML = html; return e; }
    };
    tel._parar = () => { activo = false; ciclos.forEach(c => cancelAnimationFrame(c.id)); };
    f(ctx);
  }

  window.QW = { Sonido, Mov, arrastrable, anunciar, demo, montar };
})();
