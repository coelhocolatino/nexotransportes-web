/* NEXO Transportes · web pública: escenas del viaje, acceso, formulario. */
(function () {
  'use strict';
  // Acceso real de la app NEXO (GitHub Pages). Cuando exista app.nexotransportes.com, cambiar aquí.
  var APP_LOGIN = 'https://coelhocolatino.github.io/nexo-tickets/login.html';
  // Apps Script «NEXO · Web contacto» (URL /exec de su implementación). Vacío = aún sin desplegar.
  var CONTACTO_URL = 'https://script.google.com/macros/s/AKfycbwbMdJ6JkmLjaj5DnMmc1U2Ht00fNvFUSbcdaHTNvf6BGt88Lgf39ym-ZK_gmvVl-7c/exec';
  var NOMBRES = ['Noche en la ría', 'Rande', 'Vigo', 'Galicia', 'Tu puerta'];

  var viaje = document.querySelector('.viaje');
  var figs = document.querySelectorAll('.fondos figure');
  var textos = document.querySelectorAll('.escena-txt');
  var barras = document.querySelectorAll('.rail li i');
  var railNum = document.getElementById('railNum');
  var railNombre = document.getElementById('railNombre');
  var acceso = document.getElementById('acceso');
  var cab = document.getElementById('cab');
  var actual = -1;

  // Estado compartido con furgoneta3d.js
  window.NEXO_VIAJE = { p: 0, escena: 0 };

  function ponerEscena(i) {
    if (i === actual) return;
    actual = i;
    figs.forEach(function (f, k) { f.classList.toggle('activa', k === i); });
    textos.forEach(function (t, k) {
      t.classList.toggle('activa', k === i);
      if (k === i) t.removeAttribute('aria-hidden'); else t.setAttribute('aria-hidden', 'true');
    });
    railNum.textContent = '0' + (i + 1);
    railNombre.textContent = NOMBRES[i];
    acceso.classList.toggle('fuera', i !== 0);
  }

  function alDesplazar() {
    var r = viaje.getBoundingClientRect();
    var recorrido = viaje.offsetHeight - window.innerHeight;
    var p = Math.min(1, Math.max(0, -r.top / recorrido));
    var n = figs.length;
    var esc = Math.min(n - 1, Math.floor(p * n));
    window.NEXO_VIAJE.p = p;
    window.NEXO_VIAJE.escena = esc;
    ponerEscena(esc);
    barras.forEach(function (b, k) {
      var local = Math.min(1, Math.max(0, p * n - k));
      b.style.width = (local * 100) + '%';
    });
    cab.classList.toggle('con-fondo', r.bottom < window.innerHeight + 10);
  }
  window.addEventListener('scroll', alDesplazar, { passive: true });
  window.addEventListener('resize', alDesplazar);
  alDesplazar();

  // ── Acceso: lleva al login real de la app; aquí no se procesan contraseñas ──
  document.querySelectorAll('.form-acceso').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var u = (f.querySelector('input').value || '').trim();
      window.location.href = APP_LOGIN + (u ? '#u=' + encodeURIComponent(u) : '');
    });
  });

  var modal = document.getElementById('modalAcceso');
  var btnArea = document.getElementById('btnArea');
  function abrirModal() {
    if (actual === 0 && window.scrollY < 50) { document.getElementById('accUsuario').focus(); return; }
    modal.hidden = false;
    document.getElementById('accUsuario2').focus();
  }
  function cerrarModal() { modal.hidden = true; btnArea.focus(); }
  btnArea.addEventListener('click', abrirModal);
  document.getElementById('cerrarModal').addEventListener('click', cerrarModal);
  modal.addEventListener('click', function (ev) { if (ev.target === modal) cerrarModal(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !modal.hidden) cerrarModal(); });

  // ── Aparición de bloques al entrar en pantalla ──
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    document.querySelectorAll('.sube').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.sube').forEach(function (el) { el.classList.add('visto'); });
  }

  // ── Móvil de la sección Tecnología: se inclina con el ratón ──
  var movil = document.getElementById('movil');
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (movil && !quieto && window.matchMedia('(pointer: fine)').matches) {
    movil.parentElement.addEventListener('pointermove', function (ev) {
      var b = movil.getBoundingClientRect();
      var x = (ev.clientX - (b.left + b.width / 2)) / b.width;
      var y = (ev.clientY - (b.top + b.height / 2)) / b.height;
      movil.style.transform = 'perspective(1200px) rotateY(' + (-16 + x * 14) + 'deg) rotateX(' + (6 - y * 10) + 'deg)';
    });
  }

  // ── Formulario de contacto: lo envía el Apps Script a nexo@nexotransportes.com ──
  var form = document.getElementById('formContacto');
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var aviso = document.getElementById('formAviso'), boton = form.querySelector('button[type="submit"]');
    aviso.className = 'form-aviso';
    if (!form.checkValidity()) { aviso.classList.add('error'); aviso.textContent = 'Revisa nombre, email, mensaje y la casilla de privacidad.'; return; }
    boton.disabled = true; aviso.textContent = 'Enviando…';
    var datos = {};
    new FormData(form).forEach(function (v, k) { datos[k] = v; });
    // text/plain: petición simple, sin preflight CORS (Apps Script no lo admite)
    (CONTACTO_URL ? fetch(CONTACTO_URL, { method: 'POST', body: JSON.stringify(datos), headers: { 'Content-Type': 'text/plain;charset=utf-8' } })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); }) : Promise.resolve({ ok: false }))
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || 'envío');
        aviso.classList.add('ok'); aviso.textContent = 'Mensaje enviado. Te responderemos lo antes posible.';
        form.reset();
      })
      .catch(function () {
        aviso.classList.add('error');
        aviso.innerHTML = 'No se pudo enviar. Escríbenos a <a href="mailto:nexo@nexotransportes.com">nexo@nexotransportes.com</a> o llama al <a href="tel:+34886036743">886 03 67 43</a>.';
      })
      .then(function () { boton.disabled = false; });
  });
})();
