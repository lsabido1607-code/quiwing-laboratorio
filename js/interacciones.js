/* interacciones.js — Tres conceptos de interacción, uno por momento (brief, punto 30·C), y la demostración
   del método con un solo objeto (punto 30·D). Cada uno recorre ORIENTA → REDUCE → ACTIVA → CIERRA
   y se entiende haciendo, no leyendo. Todo lo que se arrastra también se puede tocar (accesibilidad). */
(function () {
  const { Sonido, Mov, arrastrable, anunciar, demo } = window.QW;
  const C = { orienta: '#8082AD', reduce: '#E6B456', activa: '#C65252', cierra: '#879E6E', violeta: '#8D6A9E' };
  const centroDe = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const espera = (ms) => new Promise(r => setTimeout(r, Mov.reducido ? 0 : ms));
  const chips = () => `<div class="metodo-chips"><span style="--c:${C.orienta}"><i></i>Orienta</span><span style="--c:${C.reduce}"><i></i>Reduce</span><span style="--c:${C.activa}"><i></i>Activa</span><span style="--c:${C.cierra}"><i></i>Cierra</span></div>`;
  const fase = (raiz, n) => raiz.querySelectorAll('.metodo-chips span').forEach((s, i) => s.classList.toggle('on', i === n));
  function frase(el, texto) { return el.animate([{ opacity: 1 }, { opacity: 0, filter: 'blur(4px)' }], { duration: 240, fill: 'forwards' }).finished.then(() => { el.textContent = texto; el.getAnimations().forEach(a => a.cancel()); Mov.abrir(el, { sonido: false }); anunciar(texto); }); }

  // ================================================================== ENTRA · "Sé qué hacer, pero no empiezo"
  demo('entra', (c) => {
    const r = c.el('div', 'ix');
    r.innerHTML = `
      <header class="ix-cab"><span class="eti" style="color:${C.activa}">Entra</span>${chips()}</header>
      <p class="ix-frase frase-grande">Sé qué hacer, pero no empiezo.</p>
      <div class="ix-escena">
        <button class="caja grande" type="button" aria-label="La caja está cerrada. Tócala para abrirla."><span class="caja-cuerpo objeto" style="--c:${C.activa}"></span><span class="caja-tapa objeto" style="--c:${C.activa}"></span><span class="sombra-contacto"></span></button>
        <div class="pasitos" hidden></div>
        <div class="ahora" hidden><span class="eti">Ahora</span></div>
      </div>
      <p class="ix-instr instruccion">Toca la caja.</p>
      <div class="ix-acciones"></div>`;
    c.raiz.append(r);
    fase(r, 0);
    const caja = r.querySelector('.caja'), pasitos = r.querySelector('.pasitos'), ahora = r.querySelector('.ahora'), instr = r.querySelector('.ix-instr'), f = r.querySelector('.ix-frase'), acc = r.querySelector('.ix-acciones');
    const PASOS = ['Abre lo que necesitas. Nada más.', 'Déjalo a la vista.', 'Escribe una sola línea.'];
    caja.addEventListener('click', async () => {
      if (caja.classList.contains('abierta')) return;
      caja.classList.add('abierta'); Sonido.roce(); fase(r, 1);
      await espera(500);
      frase(f, 'Escoge uno.'); instr.textContent = 'El que sí puedes hacer ahorita.';
      pasitos.hidden = false;
      PASOS.forEach((t, i) => { const b = c.el('button', 'pasito', t); b.type = 'button'; pasitos.append(b); Mov.abrir(b, { sonido: false, retraso: i * 120 }); b.addEventListener('click', () => escoger(b)); });
    });
    async function escoger(b) {
      if (r.dataset.escogido) return; r.dataset.escogido = 1;
      const otros = [...pasitos.children].filter(x => x !== b);
      await Mov.reducir(otros, centroDe(pasitos));
      fase(r, 2); ahora.hidden = false; Mov.abrir(ahora, { sonido: false });
      await espera(250);
      await Mov.encajar(b, () => ahora.append(b));
      frase(f, 'Solo esto.'); instr.textContent = 'Hazlo de verdad. Cuando termines, avísale a la caja.';
      const hecho = c.el('button', 'pildora llena', 'Ya lo hice'); hecho.type = 'button'; acc.replaceChildren(hecho); Mov.abrir(hecho, { sonido: false });
      hecho.addEventListener('click', async () => {
        hecho.disabled = true; fase(r, 3);
        await Mov.guardar(b, caja); caja.classList.remove('abierta'); ahora.hidden = true;
        frase(f, 'Esto cuenta.'); instr.textContent = 'No necesitas terminar todo.';
        const ops = ['Continúo', 'Pauso', 'Termino'].map(t => { const o = c.el('button', 'pildora', t); o.type = 'button'; return o; });
        acc.replaceChildren(...ops); ops.forEach((o, i) => { Mov.abrir(o, { sonido: false, retraso: i * 90 }); o.addEventListener('click', () => { Sonido.clic(); frase(f, 'Tú decides, no la tarea.'); instr.textContent = o.textContent === 'Termino' ? 'Ya es suficiente por ahora.' : o.textContent === 'Pauso' ? 'Preparar también cuenta.' : 'Sigue a tu ritmo.'; acc.replaceChildren(); }); });
      });
    }
  });

  // ================================================================== BAJA EL RUIDO · "Todo me está hablando al mismo tiempo"
  demo('ruido', (c) => {
    const r = c.el('div', 'ix');
    r.innerHTML = `
      <header class="ix-cab"><span class="eti" style="color:#b07f1c">Baja el ruido</span>${chips()}</header>
      <p class="ix-frase frase-grande">Demasiadas cosas.</p>
      <div class="ix-escena flotan"></div>
      <div class="ahora zona" tabindex="0" role="button" aria-label="Zona AHORA. Lleva aquí una sola cosa."><span class="eti">Ahora</span></div>
      <p class="ix-instr instruccion">Arrastra una a <b>Ahora</b>. O tócala y luego toca Ahora.</p>
      <div class="ix-acciones"></div>`;
    c.raiz.append(r);
    fase(r, 0);
    const escena = r.querySelector('.ix-escena'), zona = r.querySelector('.zona'), instr = r.querySelector('.ix-instr'), f = r.querySelector('.ix-frase'), acc = r.querySelector('.ix-acciones');
    const COSAS = [['Correo del banco', 'Ábrelo. Solo léelo.'], ['Mensajes del grupo', 'Silencia el grupo una hora.'], ['Ropa en la silla', 'Cuelga tres prendas.'], ['Llamar al doctor', 'Busca el número y déjalo a la vista.'], ['Pagar la luz', 'Abre la app del banco.']];
    const items = COSAS.map(([t, chico], i) => { const b = c.el('button', 'cosa', t); b.type = 'button'; b.dataset.chico = chico; escena.append(b); return { el: b, fx: 1 + i * .23, fy: 1.3 + i * .17, ox: [.18, .62, .3, .7, .45][i], oy: [.12, .22, .5, .62, .84][i] }; });
    let elegido = null, seleccion = null, quietas = false;
    c.cuadro((dt, t) => {
      if (quietas) return;
      const W = escena.clientWidth, H = escena.clientHeight;
      items.forEach((it, i) => { if (it.el === elegido) return; const m = it.el.offsetWidth / 2 + 8, x = Math.max(m, Math.min(W - m, it.ox * W + Math.sin(t * it.fx + i) * 10)), y = Math.max(28, Math.min(H - 28, it.oy * H + Math.cos(t * it.fy + i * 2) * 8)); it.el.style.left = x + 'px'; it.el.style.top = y + 'px'; });
    });
    const dentro = (x, y) => { const z = zona.getBoundingClientRect(); return x > z.left - 20 && x < z.right + 20 && y > z.top - 30 && y < z.bottom + 20; };
    items.forEach(it => {
      arrastrable(it.el, {
        alEmpezar: () => { if (elegido) return; it.el.classList.add('levantada'); Sonido.tic(); },
        alMover: (x, y) => zona.classList.toggle('lista', dentro(x, y)),
        alSoltar: (x, y) => { it.el.classList.remove('levantada'); zona.classList.remove('lista'); if (elegido || !dentro(x, y)) return false; colocar(it.el); return true; }
      });
      it.el.addEventListener('toque', () => { if (elegido) return; items.forEach(o => o.el.classList.toggle('marcada', o === it)); seleccion = it.el; Sonido.tic(); instr.textContent = `Ahora toca «Ahora».`; });
    });
    const usarSeleccion = () => { if (seleccion && !elegido) colocar(seleccion); };
    zona.addEventListener('click', usarSeleccion); zona.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); usarSeleccion(); } });
    async function colocar(el) {
      elegido = el; quietas = true; el.classList.remove('marcada'); fase(r, 1);
      await Mov.encajar(el, () => { el.style.translate = ''; el.style.left = ''; el.style.top = ''; zona.append(el); el.classList.add('en-zona'); });
      await Mov.reducir(items.map(i => i.el).filter(x => x !== el), centroDe(escena));
      frase(f, 'Solo una cosa.'); instr.textContent = 'Lo demás puede esperar.';
      const chico = c.el('button', 'pildora', 'Hazlo más pequeño'); chico.type = 'button'; acc.replaceChildren(chico); Mov.abrir(chico, { sonido: false });
      chico.addEventListener('click', async () => {
        fase(r, 2); Sonido.snap(); el.classList.add('chica'); el.textContent = el.dataset.chico; Mov.abrir(el, { sonido: false });
        frase(f, 'Hazlo ahora.'); instr.textContent = 'Es pequeño a propósito.';
        const listo = c.el('button', 'pildora llena', 'Hecho'); listo.type = 'button'; acc.replaceChildren(listo); Mov.abrir(listo, { sonido: false });
        listo.addEventListener('click', async () => {
          fase(r, 3); await Mov.guardar(el, zona);
          frase(f, 'Esto cuenta.'); instr.textContent = 'Ya es suficiente por ahora.';
          const otra = c.el('button', 'pildora', 'Otra cosa'), paro = c.el('button', 'pildora', 'Paro aquí'); otra.type = paro.type = 'button';
          acc.replaceChildren(otra, paro); [otra, paro].forEach((b, i) => Mov.abrir(b, { sonido: false, retraso: i * 90 }));
          otra.addEventListener('click', () => { Sonido.clic(); window.QW.montar(c.tel); });
          paro.addEventListener('click', () => { Sonido.cierre(); frase(f, 'Tú decides, no la tarea.'); instr.textContent = ''; acc.replaceChildren(); });
        });
      });
    }
  });

  // ================================================================== SAL DEL FOCO · "Me metí en algo y no logro salir"
  demo('foco', (c) => {
    const r = c.el('div', 'ix');
    r.innerHTML = `
      <header class="ix-cab"><span class="eti" style="color:#5f7a4a">Sal del foco</span>${chips()}</header>
      <p class="ix-frase frase-grande">Me metí en algo y no logro salir.</p>
      <div class="ix-escena centro">
        <button class="bucle-grande" type="button" aria-label="Mantén presionado para bajar el ritmo">
          <svg viewBox="0 0 200 200" aria-hidden="true"><circle class="aro" cx="100" cy="100" r="74"/><circle class="estela" cx="100" cy="100" r="74"/><circle class="punto" cx="174" cy="100" r="11"/></svg>
          <span class="reloj"><b>1 h 52</b><small>min aquí</small></span>
        </button>
      </div>
      <p class="ix-instr instruccion">Mantén presionado el círculo.</p>
      <div class="ix-acciones"></div>`;
    c.raiz.append(r);
    fase(r, 0);
    const btn = r.querySelector('.bucle-grande'), punto = r.querySelector('.punto'), aro = r.querySelector('.aro'), estela = r.querySelector('.estela'), reloj = r.querySelector('.reloj b'), instr = r.querySelector('.ix-instr'), f = r.querySelector('.ix-frase'), acc = r.querySelector('.ix-acciones');
    let ang = 0, vel = 7, apretado = false, carga = 0, abierto = false, minutos = 112;
    c.cuadro((dt) => {
      if (!abierto) { vel += ((apretado ? .5 : 7) - vel) * Math.min(1, dt * (apretado ? 1.6 : .8)); if (!apretado) minutos += dt * .5; }
      else vel += (0 - vel) * Math.min(1, dt);
      ang += vel * dt * (Mov.reducido ? 0 : 1);
      punto.setAttribute('cx', 100 + Math.cos(ang) * 74); punto.setAttribute('cy', 100 + Math.sin(ang) * 74);
      estela.style.strokeDashoffset = String(70 - ang * 74);   // la estela termina justo en el punto
      estela.style.opacity = Math.min(1, vel / 7);
      reloj.textContent = `${Math.floor(minutos / 60)} h ${String(Math.floor(minutos % 60)).padStart(2, '0')}`;
      if (apretado && !abierto) { carga += dt / 1.8; btn.style.setProperty('--carga', carga); if (carga >= 1) abrir(); }
      else if (!abierto && carga > 0) { carga = Math.max(0, carga - dt); btn.style.setProperty('--carga', carga); }
    });
    const sube = () => { apretado = false; };
    btn.addEventListener('pointerdown', (e) => { if (abierto) return; apretado = true; btn.setPointerCapture(e.pointerId); Sonido.respira(); fase(r, 1); instr.textContent = 'Así. Más despacio.'; });
    btn.addEventListener('pointerup', sube); btn.addEventListener('pointercancel', sube);
    btn.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !abierto) { e.preventDefault(); abrir(); } });
    async function abrir() {
      if (abierto) return; abierto = true; apretado = false; aro.classList.add('abierto'); btn.classList.add('quieto');
      Sonido.cierre(); fase(r, 2);
      frase(f, 'Una sola decisión.'); instr.textContent = 'Nada de culpa. Solo escoge.';
      const OP = [['Continúo 15 min, con alarma', 'Continúas. Ya decidiste cuánto.'], ['Pauso y dejo una nota', 'Preparar también cuenta.'], ['Termino por hoy', 'Ya es suficiente por ahora.']];
      const ops = OP.map(([t, fin]) => { const o = c.el('button', 'pildora ancha', t); o.type = 'button'; o.dataset.fin = fin; return o; });
      acc.replaceChildren(...ops); ops.forEach((o, i) => { Mov.abrir(o, { sonido: false, retraso: i * 100 }); o.addEventListener('click', async () => {
        fase(r, 3); Sonido.clic(); await Mov.reducir(ops.filter(x => x !== o), centroDe(acc), { sonido: false });
        await Mov.guardar(o, btn); frase(f, o.dataset.fin); instr.textContent = 'Tú decides, no la tarea.'; Mov.respirar(btn, { escala: 1.04 });
      }); });
    }
  });

  // ================================================================== el método con un solo objeto (se ve, y después se explica)
  demo('metodo', (c) => {
    const r = c.el('div', 'mt');
    r.innerHTML = `
      <div class="mt-escena">
        <div class="mt-enredo"></div>
        <div class="mt-ranura" aria-hidden="true"></div>
        <div class="mt-caja" aria-hidden="true"><span class="caja-cuerpo objeto" style="--c:${C.cierra}"></span><span class="caja-tapa objeto" style="--c:${C.cierra}"></span></div>
      </div>
      <div class="mt-texto"><span class="eti mt-fase">Algo grande y confuso</span><p class="mt-dice">Así llega una tarea.</p></div>
      <div class="mt-controles"><button type="button" class="pildora llena mt-sig">Orienta</button><button type="button" class="pildora mt-otra" hidden>Ver de nuevo</button></div>`;
    c.raiz.append(r);
    const enredo = r.querySelector('.mt-enredo'), ranura = r.querySelector('.mt-ranura'), caja = r.querySelector('.mt-caja'), faseEl = r.querySelector('.mt-fase'), dice = r.querySelector('.mt-dice'), sig = r.querySelector('.mt-sig'), otra = r.querySelector('.mt-otra');
    const formas = Array.from({ length: 9 }, (_, i) => { const s = c.el('span', 'objeto mt-forma'); s.style.setProperty('--c', ['#b9bcc0', '#a9adb2', '#c4c6c9'][i % 3]); s.style.width = s.style.height = (26 + (i * 7) % 26) + 'px'; enredo.append(s); return { el: s, a: i * 2.1, f: .9 + i * .21 }; });
    const una = formas[4];
    let quieto = false;
    c.cuadro((dt, t) => { if (quieto) return; formas.forEach((o, i) => { o.el.style.left = `calc(50% + ${Math.cos(o.a + t * o.f) * 46 + Math.sin(t * 2.1 + i) * 6}px)`; o.el.style.top = `calc(50% + ${Math.sin(o.a * 1.3 + t * o.f) * 34}px)`; }); });
    const PASOS = [
      { n: 'Orienta', c: C.orienta, f: 'Orienta · algo se hace visible', d: 'De todo el enredo, se ve lo que importa ahora.', hacer: () => { formas.forEach(o => o.el.style.opacity = o === una ? 1 : .45); una.el.style.setProperty('--c', C.orienta); una.el.classList.add('marcada'); Sonido.clic(); } },
      { n: 'Reduce', c: C.reduce, f: 'Reduce · algo se simplifica', d: 'Lo demás se aleja. Queda una sola cosa.', hacer: async () => { quieto = true; await Mov.reducir(formas.filter(o => o !== una).map(o => o.el), centroDe(enredo)); una.el.style.setProperty('--c', C.reduce); } },
      { n: 'Activa', c: C.activa, f: 'Activa · algo avanza y encaja', d: 'Esa cosa se mueve a su lugar. Pasa algo de verdad.', hacer: async () => { una.el.style.setProperty('--c', C.activa); await Mov.encajar(una.el, () => { una.el.style.left = ''; una.el.style.top = ''; ranura.append(una.el); }); } },
      { n: 'Cierra', c: C.cierra, f: 'Cierra · algo se guarda y descansa', d: 'Se guarda. Ya cuenta. Tú decides si sigues.', hacer: async () => { una.el.style.setProperty('--c', C.cierra); caja.classList.add('abierta'); await espera(300); await Mov.guardar(una.el, caja); caja.classList.remove('abierta'); Mov.respirar(caja, { escala: 1.05 }); } }
    ];
    let paso = 0;
    sig.addEventListener('click', async () => {
      const p = PASOS[paso]; sig.disabled = true;
      r.style.setProperty('--fase', p.c); faseEl.textContent = p.f; faseEl.style.color = p.c; dice.textContent = p.d; Mov.abrir(dice, { sonido: false });
      await p.hacer(); paso++;
      if (paso < PASOS.length) { sig.textContent = PASOS[paso].n; sig.disabled = false; } else { sig.hidden = true; otra.hidden = false; anunciar('La tarea se orientó, se redujo, avanzó y se guardó.'); }
    });
    otra.addEventListener('click', () => window.QW.montar(c.tel));
  });
})();
