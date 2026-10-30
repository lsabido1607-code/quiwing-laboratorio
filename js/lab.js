/* lab.js — Une el laboratorio: monta las demos en sus teléfonos (y las pausa cuando no se ven),
   pantalla completa, el botón de sonido, las muestras de principios, la biblioteca de comportamientos
   y la elección de dirección (se guarda para que Luis y Claude la lean). */
(function () {
  const { Sonido, Mov, montar } = window.QW;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- sonido: apagado al entrar; nunca suena solo
  const bSon = $('#sonido');
  const pintaSon = () => { bSon.setAttribute('aria-pressed', String(Sonido.encendido)); bSon.querySelector('span').textContent = Sonido.encendido ? 'Sonido sí' : 'Sonido no'; bSon.title = Sonido.encendido ? 'El sonido está encendido' : 'El sonido está apagado'; };
  bSon.addEventListener('click', () => { Sonido.poner(!Sonido.encendido); pintaSon(); });
  pintaSon();

  // ---------- teléfonos: montar, pausar fuera de vista, reiniciar y pantalla completa
  const tels = $$('[data-demo]');
  const io = new IntersectionObserver(es => es.forEach(e => { e.target._visible = e.isIntersecting; if (e.isIntersecting && !e.target._montado) { e.target._montado = true; montar(e.target); } }), { rootMargin: '200px' });
  tels.forEach(t => {
    t._visible = false; io.observe(t);
    const re = t.querySelector('.reiniciar'); re && re.addEventListener('click', () => { Sonido.tic(); montar(t); });
    const ce = t.querySelector('.cerrar-completo'); ce && ce.addEventListener('click', () => completo(t, false));
  });
  $$('[data-ampliar]').forEach(b => b.addEventListener('click', () => completo(document.getElementById(b.dataset.ampliar), true)));
  function completo(t, si) {
    t.classList.toggle('completo', si); document.body.style.overflow = si ? 'hidden' : '';
    t._visible = true; if (si) t.querySelector('.cerrar-completo').focus();
  }
  addEventListener('keydown', e => { if (e.key === 'Escape') $$('.telefono.completo').forEach(t => completo(t, false)); });

  // ---------- A · principios vivos
  const mov = $('#p-motion');
  if (mov) {
    const punto = $('.p-punto', mov), ranuras = $$('.p-ranura', mov); let lado = 0;
    mov.addEventListener('click', () => { lado = 1 - lado; Mov.encajar(punto, () => ranuras[lado].append(punto)); });
  }
  $$('[data-sonar]').forEach(b => b.addEventListener('click', () => { Sonido.probar(b.dataset.sonar); b.animate([{ scale: '1' }, { scale: '.94' }, { scale: '1' }], { duration: 260 }); }));

  // ---------- D · biblioteca de comportamientos (se repite al tocar)
  const COMP = {
    abrir(esc) { esc.innerHTML = '<span class="g-carta">Puedo entrar</span>'; Mov.abrir(esc.firstChild); },
    reducir(esc) {
      esc.innerHTML = Array.from({ length: 6 }, (_, i) => `<span class="objeto g-bola" style="--c:${i ? '#d9c08a' : '#E6B456'};left:${[50, 22, 78, 30, 70, 50][i]}%;top:${[50, 28, 30, 74, 72, 18][i]}%"></span>`).join('');
      const r = esc.getBoundingClientRect(); setTimeout(() => Mov.reducir($$('.g-bola', esc).slice(1), { x: r.left + r.width / 2, y: r.top + r.height / 2 }), 250);
    },
    encajar(esc) {
      esc.innerHTML = '<span class="g-ranura"></span><span class="objeto g-bola suelta" style="--c:#C65252"></span>';
      const b = $('.g-bola', esc); setTimeout(() => Mov.encajar(b, () => { b.classList.remove('suelta'); $('.g-ranura', esc).append(b); }), 250);
    },
    guardar(esc) {
      esc.innerHTML = '<span class="objeto g-bola" style="--c:#879E6E;left:30%;top:50%"></span><span class="caja g-caja abierta"><span class="caja-cuerpo objeto" style="--c:#879E6E"></span><span class="caja-tapa objeto" style="--c:#879E6E"></span></span>';
      const b = $('.g-bola', esc), c = $('.g-caja', esc); setTimeout(async () => { await Mov.guardar(b, c); c.classList.remove('abierta'); }, 250);
    },
    respirar(esc) { if (!esc.firstChild) { esc.innerHTML = '<span class="objeto g-respira" style="--c:#8082AD"></span>'; Mov.respirar(esc.firstChild, { escala: 1.12, duracion: 4000 }); } Sonido.respira(); }
  };
  $$('.comportamiento').forEach(b => { const esc = $('.escenario', b), k = b.dataset.comp; COMP[k](esc); b.addEventListener('click', () => COMP[k](esc)); b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); COMP[k](esc); } }); });

  // ---------- elección: la dirección que se siente Quiwing (se guarda en la página, para leerla después)
  const opciones = $$('.opcion'), notas = $('#notas'), estado = $('#estado-envio'), guardarB = $('#guardar');
  let eleccion = '';
  opciones.forEach(o => o.addEventListener('click', () => { eleccion = o.dataset.dir; opciones.forEach(x => x.setAttribute('aria-pressed', String(x === o))); Sonido.clic(); }));
  let ref = null;
  // fuera de Claude (el link público) no hay dónde guardar: la respuesta se manda por WhatsApp
  const enClaude = !!window.claude?.use;
  if (!enClaude) guardarB.textContent = 'Mandar mi respuesta por WhatsApp';
  async function mandar(datos) {
    const texto = 'Quiwing · mi elección\n' + (datos.direccion ? 'Dirección: ' + datos.direccion + '\n' : '') + (datos.notas ? 'Notas: ' + datos.notas : '');
    if (navigator.share) {
      try { await navigator.share({ text: texto }); estado.textContent = 'Listo. Gracias.'; return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank', 'noopener');
    estado.textContent = 'Se abrió WhatsApp. Escoge a Luis y manda el mensaje.';
  }
  (async () => {
    try {
      const [db, user] = await Promise.all([window.claude?.use?.('db'), window.claude?.use?.('user')]);
      const id = user ? await user.id() : null;
      if (!db || !id) return;
      ref = db.doc('elecciones/' + id);
      const s = await ref.get();
      if (s.exists) { const d = s.data(); eleccion = d.direccion || ''; notas.value = d.notas || ''; opciones.forEach(x => x.setAttribute('aria-pressed', String(x.dataset.dir === eleccion))); estado.textContent = 'Ya habías guardado una respuesta. Puedes cambiarla.'; }
    } catch (e) { ref = null; }
  })();
  guardarB.addEventListener('click', async () => {
    if (!eleccion && !notas.value.trim()) { estado.textContent = 'Escoge una dirección o escribe una nota.'; return; }
    const datos = { direccion: eleccion, notas: notas.value.trim().slice(0, 4000), fecha: new Date().toISOString() };
    try { localStorage.setItem('qw-eleccion', JSON.stringify(datos)); } catch (e) {}
    if (!enClaude) { Sonido.snap(); await mandar(datos); return; }
    if (!ref) { estado.textContent = 'Se guardó en este navegador. Para que nos llegue, abre la página desde tu cuenta de Claude o déjanos un comentario.'; return; }
    guardarB.disabled = true; estado.textContent = 'Guardando…';
    try { await ref.set(datos); Sonido.snap(); estado.textContent = 'Listo. Tu respuesta ya nos llegó.'; }
    catch (e) { estado.textContent = 'No se pudo guardar aquí (tu acceso a la página es de solo ver). Déjanos un comentario con tu elección.'; }
    guardarB.disabled = false;
  });
})();
