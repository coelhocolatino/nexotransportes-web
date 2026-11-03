/* NEXO Transportes · web pública: escenas del viaje, acceso, formulario. */
(function () {
  'use strict';
  // Acceso real de la app NEXO (GitHub Pages). Cuando exista app.nexotransportes.com, cambiar aquí.
  var APP_LOGIN = 'https://coelhocolatino.github.io/nexo-tickets/login.html';
  // Apps Script «NEXO · Web contacto» (URL /exec de su implementación): formulario (POST) y «Vigo, ahora» (GET ?accion=ahora).
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
  var escenario = document.querySelector('.escenario');
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
    escenario.classList.toggle('e0', i === 0);
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


  // ════════════════════════════════════════════════════════════
  // VIGO, AHORA: día/noche, tiempo real y tráfico (datos del Apps Script)
  // ════════════════════════════════════════════════════════════
  var VIGO = { lat: 42.2406, lon: -8.7207 };

  // Salida y puesta de sol (algoritmo NOAA simplificado, precisión de minutos)
  function horasSol(fecha, lat, lon) {
    var rad = Math.PI / 180, dia = Math.floor((fecha - new Date(fecha.getFullYear(), 0, 0)) / 864e5);
    var g = 2 * Math.PI / 365 * (dia - 1);
    var eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    var ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(dec)) - Math.tan(lat * rad) * Math.tan(dec)) / rad;
    var base = Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate());
    return { salida: new Date(base + (720 - 4 * (lon + ha) - eq) * 6e4), puesta: new Date(base + (720 - 4 * (lon - ha) - eq) * 6e4) };
  }
  function esDeNoche() { var a = new Date(), s = horasSol(a, VIGO.lat, VIGO.lon); return a < s.salida || a > s.puesta; }

  // Códigos de cielo de MeteoGalicia (los de noche suman 100)
  function tipoCielo(ceo) {
    var c = ceo > 200 ? ceo - 100 : ceo;
    if ([107, 108, 110, 111, 117, 118].indexOf(c) >= 0) return 'lluvia';
    if ([113, 119].indexOf(c) >= 0) return 'tormenta';
    if ([109, 112, 120, 121].indexOf(c) >= 0) return 'nieve';
    if ([106, 114, 115].indexOf(c) >= 0) return 'niebla';
    if ([104, 105].indexOf(c) >= 0) return 'cubierto';
    if ([103, 116].indexOf(c) >= 0) return 'nubes';
    if ([101, 102].indexOf(c) >= 0) return 'despejado';
    return '';
  }
  var TXT_CIELO = { despejado: 'Despejado', nubes: 'Nubes y claros', cubierto: 'Cubierto', niebla: 'Niebla', lluvia: 'Lluvia', tormenta: 'Tormenta', nieve: 'Nieve' };
  function rotuloRia(tipo, noche) {
    var t = {
      despejado: noche ? 'Noche despejada en la ría' : 'Sol en la ría',
      nubes: noche ? 'Noche con nubes en la ría' : 'Nubes y claros en la ría',
      cubierto: noche ? 'Noche cubierta en la ría' : 'Día gris en la ría',
      niebla: 'Niebla en la ría', lluvia: 'Llueve en la ría', tormenta: 'Tormenta en la ría', nieve: 'Nieve en la ría'
    }[tipo];
    return t || (noche ? 'Noche en la ría' : 'Día en la ría');
  }
  var ICONOS = {
    sol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
    luna: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
    nube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 11 3.5 3.5 0 0 0 7 18z"/></svg>',
    claros: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3.5v1.5M4.5 9H3M5.3 5.3l1 1M13.7 5.3l-1 1"/><path d="M6.6 11.5A3.5 3.5 0 0 1 12.4 8"/><path d="M9 20h8a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 8.2 14 3 3 0 0 0 9 20z"/></svg>',
    lluvia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 8 3.5 3.5 0 0 0 7 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/></svg>',
    niebla: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9h16M2 13h20M5 17h14"/></svg>',
    rayo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 14h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 7 3.5 3.5 0 0 0 7 14z"/><path d="M12 15l-2 4h4l-2 4"/></svg>'
  };
  function icono(tipo, noche) {
    if (tipo === 'despejado' || !tipo) return noche ? ICONOS.luna : ICONOS.sol;
    if (tipo === 'nubes') return noche ? ICONOS.nube : ICONOS.claros;
    if (tipo === 'lluvia' || tipo === 'nieve') return ICONOS.lluvia;
    if (tipo === 'tormenta') return ICONOS.rayo;
    if (tipo === 'niebla') return ICONOS.niebla;
    return ICONOS.nube;
  }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function grados(n) { return (Math.round(n * 10) / 10).toLocaleString('es-ES') + ' °C'; }

  // Portada: foto de día o de noche y rótulo de la primera escena
  function aplicarCielo(t) {
    var noche = esDeNoche();
    var tipo = t && t.lluvia10min > 0 ? 'lluvia' : (t ? tipoCielo(t.ceo) : '');
    var fig = document.getElementById('fondoInicio');
    var dia = !noche;
    fig.querySelector('source').srcset = dia ? 'img/esc-ria-m.jpg' : 'img/esc-limens-m.jpg';
    fig.querySelector('img').src = dia ? 'img/esc-ria.jpg' : 'img/esc-limens.jpg';
    escenario.classList.toggle('cielo-gris', dia && ['cubierto', 'lluvia', 'tormenta', 'niebla', 'nieve'].indexOf(tipo) >= 0);
    escenario.classList.toggle('lluvia', tipo === 'lluvia' || tipo === 'tormenta');
    escenario.classList.toggle('niebla', tipo === 'niebla');
    NOMBRES[0] = rotuloRia(tipo, noche);
    if (actual === 0) railNombre.textContent = NOMBRES[0];
    window.NEXO_AHORA = { noche: noche, tipo: tipo };
    window.dispatchEvent(new CustomEvent('nexo:ahora', { detail: window.NEXO_AHORA }));
    if (t && t.temp != null) {
      var chip = document.getElementById('ahoraChip');
      chip.innerHTML = icono(tipo, noche) + '<b>' + grados(t.temp) + '</b> en Vigo · ' + esc(TXT_CIELO[tipo] || (noche ? 'Noche' : 'Ahora'));
      chip.hidden = false;
    }
  }
  aplicarCielo(null);

  // Sección «Vigo, ahora»
  var COLORES = ['#2FB36B', '#8ED16F', '#FFC72C', '#FF8A3D', '#E5484D', 'rgba(255,255,255,.14)'];
  var VEL_FLUJO = [1.1, 1.6, 2.6, 4.5, 7, 0];
  function pintarMapa(v) {
    var svg = document.getElementById('mapaVigo');
    if (!v || !v.tramos || !v.tramos.length) return;
    var k = Math.cos(42.23 * Math.PI / 180), minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    v.tramos.forEach(function (t) { for (var i = 0; i < t[3].length; i += 2) {
      var x = t[3][i] * k, y = -t[3][i + 1];
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; } });
    var W = 600, esc_ = (W - 20) / (maxX - minX), H = Math.round((maxY - minY) * esc_ + 20);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var orden = v.tramos.slice().sort(function (a, b) { return (a[0] === 5 ? -1 : a[0]) - (b[0] === 5 ? -1 : b[0]); });
    var html = '';
    orden.forEach(function (t) {
      var d = '';
      for (var i = 0; i < t[3].length; i += 2) d += (i ? 'L' : 'M') + ((t[3][i] * k - minX) * esc_ + 10).toFixed(1) + ' ' + ((-t[3][i + 1] - minY) * esc_ + 10).toFixed(1);
      var e = t[0], ancho = e === 5 ? 2 : (e >= 3 ? 4.5 : 3);
      var tit = '<title>' + esc(t[1]) + ' · ' + ['Muy fluido', 'Fluido', 'Normal', 'Lento', 'Muy lento', 'Sin datos'][e] + (t[2] ? ' · ' + t[2] + ' km/h' : '') + '</title>';
      html += '<path class="tramo' + (e === 3 || e === 4 ? ' tramo-lento' : '') + '" d="' + d + '" stroke="' + COLORES[e] + '" stroke-width="' + ancho + '">' + tit + '</path>';
      if (e < 5) html += '<path class="tramo-flujo" d="' + d + '" style="animation-duration:' + VEL_FLUJO[e] + 's" aria-hidden="true"/>';
    });
    svg.innerHTML = html;
  }
  function pintarDirecto(a) {
    var sec = document.getElementById('directo');
    if (!a || !a.ok) { sec.classList.add('sin-datos'); document.getElementById('vigoAct').textContent = 'Datos no disponibles ahora mismo.'; return; }
    var v = a.vigo;
    if (v && v.km) {
      pintarMapa(v);
      var medidos = v.km[0] + v.km[1] + v.km[2] + v.km[3] + v.km[4];
      var pct = medidos ? Math.round((v.km[0] + v.km[1]) / medidos * 100) : 0;
      document.getElementById('pctFluido').textContent = pct + ' %';
      document.getElementById('barraEstados').innerHTML = [0, 1, 2, 3, 4].map(function (i) {
        return '<i style="width:' + (medidos ? v.km[i] / medidos * 100 : 0) + '%;background:' + COLORES[i] + '"></i>'; }).join('');
      document.getElementById('vigoAct').textContent = v.actualizado ? 'Concello de Vigo · ' + v.actualizado.slice(0, 16) : '';
      document.getElementById('listaLentos').innerHTML = (v.lentos || []).slice(0, 4).map(function (l) {
        return '<li><span>' + esc(l.tramo) + '</span><small>' + esc(l.tiempo.replace(' seg.', ' s').replace(' min.', ' min')) + '</small></li>'; }).join('');
    } else { document.getElementById('tarjRed').hidden = true; document.getElementById('tarjLentos').hidden = true; }
    var t = a.tiempo;
    if (t && t.temp != null) {
      var noche = esDeNoche(), tipo = t.lluvia10min > 0 ? 'lluvia' : tipoCielo(t.ceo);
      document.getElementById('tiempoAhora').innerHTML = icono(tipo, noche) + '<div><b>' + grados(t.temp) + '</b><span>' + esc(TXT_CIELO[tipo] || '') +
        (t.tMax != null ? ' · máx. ' + t.tMax + '° / mín. ' + t.tMin + '°' : '') + (t.ventoKmh != null ? '<br>Viento ' + t.ventoKmh + ' km/h' : '') + '</span></div>';
      var NOM = { manha: 'Mañana', tarde: 'Tarde', noite: 'Noche' };
      document.getElementById('franjas').innerHTML = (t.hoy || []).map(function (f) {
        var tp = tipoCielo(f.ceo);
        return '<li' + (f.franja === t.franja ? ' class="actual"' : '') + '>' + NOM[f.franja] + icono(tp, f.franja === 'noite') +
          '<b>' + (f.tmax > -100 ? f.tmax + '°' : '—') + '</b>' + (f.pchoiva > -1 ? 'Lluvia ' + f.pchoiva + ' %' : '') + '</li>'; }).join('');
    } else document.getElementById('tarjTiempo').hidden = true;
    var g = a.dgt;
    if (g) {
      var lis = (g.cerca || []).map(function (x) {
        return '<li><span class="via' + (x.grave ? ' grave' : '') + '">' + esc(x.via || '—') + '</span><strong>' + esc(x.texto) + '</strong><span>' +
          esc(x.concello) + (x.pk !== '' && !isNaN(x.pk) ? ' · km ' + Number(x.pk).toLocaleString('es-ES', { maximumFractionDigits: 1 }) : '') + '</span></li>'; }).join('');
      document.getElementById('listaIncid').innerHTML = lis || '<li class="vacio">Sin incidencias en las carreteras cercanas ahora mismo.</li>';
      document.getElementById('notaDgt').textContent = g.galicia + ' incidencias activas en toda Galicia según la DGT' +
        (g.totalCerca > (g.cerca || []).length ? ' · se muestran las ' + g.cerca.length + ' más relevantes de ' + g.totalCerca + ' cercanas.' : '.');
    } else document.getElementById('tarjDgt').hidden = true;
  }

  function cargarAhora() {
    if (!CONTACTO_URL || !window.fetch) { pintarDirecto(null); return; }
    fetch(CONTACTO_URL + '?accion=ahora')
      .then(function (r) { return r.json(); })
      .then(function (a) { aplicarCielo(a.tiempo); pintarDirecto(a); })
      .catch(function () { pintarDirecto(null); });
  }
  cargarAhora();
  setInterval(cargarAhora, 10 * 60 * 1000);

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
