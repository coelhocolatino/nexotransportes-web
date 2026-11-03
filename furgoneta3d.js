/* NEXO Transportes · furgoneta 3D del viaje.
   Geometría propia (sin modelos externos): perfil de furgoneta extruido,
   rotulación NEXO en una textura de canvas, ruedas y luces. Gira y se
   recoloca en cada escena según window.NEXO_VIAJE (site.js). */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const lienzo = document.getElementById('lienzo3d');
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

try { arrancar(); } catch (e) { console.warn('[NEXO 3D] sin WebGL', e); document.body.classList.add('sin-3d'); }

function arrancar() {
  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const escena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camara = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camara.position.set(0, 3.4, 15);

  const cielo = new THREE.HemisphereLight(0xdfe9ff, 0x0b2447, 0.6);
  escena.add(cielo);
  const sol = new THREE.DirectionalLight(0xffffff, 2.2);
  sol.position.set(5, 9, 6);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 });
  escena.add(sol);
  const contra = new THREE.DirectionalLight(0xffc72c, 0.9);   // luz amarilla de contorno
  contra.position.set(-6, 4, -6);
  escena.add(contra);

  const furgo = new THREE.Group();
  escena.add(furgo);
  const vehiculo = new THREE.Group();   // se balancea (suspensión) dentro de furgo
  furgo.add(vehiculo);

  // ── Carrocería: perfil lateral extruido ──
  const p = new THREE.Shape();
  p.moveTo(-2.7, 0.38);
  p.lineTo(-2.7, 2.45);
  p.quadraticCurveTo(-2.7, 2.6, -2.55, 2.6);
  p.lineTo(1.2, 2.6);
  p.quadraticCurveTo(1.45, 2.6, 1.6, 2.35);
  p.lineTo(2.25, 1.45);
  p.quadraticCurveTo(2.35, 1.3, 2.55, 1.25);
  p.lineTo(2.7, 1.2);
  p.quadraticCurveTo(2.85, 1.15, 2.85, 0.95);
  p.lineTo(2.85, 0.38);
  p.lineTo(2.27, 0.38);
  p.absarc(1.75, 0.38, 0.52, 0, Math.PI, false);
  p.lineTo(-1.18, 0.38);
  p.absarc(-1.7, 0.38, 0.52, 0, Math.PI, false);
  p.lineTo(-2.7, 0.38);
  const geoCuerpo = new THREE.ExtrudeGeometry(p, { depth: 2.0, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 4, curveSegments: 24 });
  geoCuerpo.translate(0, 0, -1.0);
  const pintura = new THREE.MeshPhysicalMaterial({ color: 0xf4f6f9, roughness: 0.32, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.12 });
  const cuerpo = new THREE.Mesh(geoCuerpo, pintura);
  cuerpo.castShadow = true;
  vehiculo.add(cuerpo);

  // ── Rotulación NEXO (textura de canvas en los dos costados) ──
  const RX0 = -2.6, RX1 = 1.12, RY0 = 0.96, RY1 = 2.52;
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = Math.round(1024 * (RY1 - RY0) / (RX1 - RX0));
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  function rotular(logo) {
    const c = cv.getContext('2d'), W = cv.width, H = cv.height;
    c.clearRect(0, 0, W, H);
    // franja azul inferior con corte diagonal
    c.fillStyle = '#0B2447';
    c.beginPath(); c.moveTo(0, H * 0.70); c.lineTo(W * 0.62, H * 0.70); c.lineTo(W * 0.80, H * 0.30); c.lineTo(W, H * 0.30); c.lineTo(W, H); c.lineTo(0, H); c.fill();
    // trazo amarillo (la «carretera» del logo)
    c.fillStyle = '#FFC72C';
    c.beginPath(); c.moveTo(0, H * 0.62); c.lineTo(W * 0.60, H * 0.62); c.lineTo(W * 0.77, H * 0.22); c.lineTo(W, H * 0.22); c.lineTo(W, H * 0.27); c.lineTo(W * 0.79, H * 0.27); c.lineTo(W * 0.615, H * 0.67); c.lineTo(0, H * 0.67); c.fill();
    if (logo) { const lw = W * 0.5, lh = lw * logo.height / logo.width; c.drawImage(logo, W * 0.06, H * 0.06, lw, lh); }
    c.fillStyle = '#FFFFFF';
    c.font = '700 34px "Hanken Grotesk", system-ui, sans-serif';
    c.fillText('nexotransportes.com', W * 0.06, H * 0.88);
    c.fillStyle = '#FFC72C';
    c.font = '800 30px "Hanken Grotesk", system-ui, sans-serif';
    c.textAlign = 'right';
    c.fillText('VIGO · O PORRIÑO', W * 0.95, H * 0.88);
    c.textAlign = 'left';
    tex.needsUpdate = true;
  }
  rotular(null);
  const imgLogo = new Image();
  imgLogo.onload = () => (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => rotular(imgLogo));
  imgLogo.src = 'img/logo-nexo-azul.png';
  const matRotulo = new THREE.MeshPhysicalMaterial({ map: tex, transparent: true, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, polygonOffset: true, polygonOffsetFactor: -2 });
  const geoRotulo = new THREE.PlaneGeometry(RX1 - RX0, RY1 - RY0);
  [1, -1].forEach(lado => {
    const m = new THREE.Mesh(geoRotulo, matRotulo);
    m.position.set((RX0 + RX1) / 2, (RY0 + RY1) / 2, lado * 1.072);
    if (lado < 0) m.rotation.y = Math.PI;
    vehiculo.add(m);
  });

  // ── Cristales ──
  const cristal = new THREE.MeshPhysicalMaterial({ color: 0x0a1424, roughness: 0.05, metalness: 0.7, clearcoat: 1, side: THREE.DoubleSide });
  const parabrisas = new THREE.Group();
  const ang = Math.atan2(0.65, 0.9);
  const pb = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 1.0), cristal);
  pb.rotation.y = Math.PI / 2;
  parabrisas.add(pb);
  parabrisas.position.set(1.925 + Math.cos(ang) * 0.075, 1.9 + Math.sin(ang) * 0.075, 0);
  parabrisas.rotation.z = ang;
  vehiculo.add(parabrisas);
  const ventana = new THREE.Shape();
  ventana.moveTo(1.0, 1.52); ventana.lineTo(2.17, 1.52); ventana.lineTo(1.6, 2.3); ventana.lineTo(1.0, 2.3); ventana.closePath();
  const geoVentana = new THREE.ShapeGeometry(ventana);
  [1.073, -1.073].forEach(z => { const v = new THREE.Mesh(geoVentana, cristal); v.position.z = z; vehiculo.add(v); });

  // ── Detalles: faros, pilotos, calandra, paragolpes ──
  const negro = new THREE.MeshStandardMaterial({ color: 0x111822, roughness: 0.6 });
  const caja = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); vehiculo.add(m); return m; };
  const faro = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d6, emissiveIntensity: 2.2 });
  const piloto = new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xff1a1a, emissiveIntensity: 1.6 });
  caja(0.08, 0.16, 0.5, faro, 2.9, 1.0, 0.66);
  caja(0.08, 0.16, 0.5, faro, 2.9, 1.0, -0.66);
  caja(0.06, 0.34, 1.0, negro, 2.9, 0.72, 0);
  caja(0.22, 0.2, 2.16, negro, 2.84, 0.42, 0);
  caja(0.2, 0.2, 2.16, negro, -2.72, 0.42, 0);
  caja(0.06, 0.7, 0.14, piloto, -2.79, 1.55, 0.94);
  caja(0.06, 0.7, 0.14, piloto, -2.79, 1.55, -0.94);
  caja(0.02, 2.0, 0.02, negro, -2.785, 1.48, 0);                 // junta de puertas traseras
  caja(0.04, 0.1, 0.34, new THREE.MeshStandardMaterial({ color: 0xffc72c, emissive: 0xffc72c, emissiveIntensity: 0.6 }), 0.2, 2.7, 0); // rotativo

  // Luz según la hora real (site.js avisa con «nexo:ahora»)
  function luzSegunHora(a) {
    const noche = !!(a && a.noche);
    sol.intensity = noche ? 0.9 : 2.6;
    cielo.intensity = noche ? 0.35 : 0.8;
    contra.intensity = noche ? 1.3 : 0.7;
    faro.emissiveIntensity = noche ? 4 : 1.6;
    renderer.toneMappingExposure = noche ? 0.95 : 1.1;
  }
  luzSegunHora(window.NEXO_AHORA);
  addEventListener('nexo:ahora', e => luzSegunHora(e.detail));

  // ── Ruedas ──
  const goma = new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.9 });
  const llanta = new THREE.MeshStandardMaterial({ color: 0xc9d1dc, roughness: 0.25, metalness: 0.9 });
  const ruedas = [];
  [[1.75, 0.86], [1.75, -0.86], [-1.7, 0.86], [-1.7, -0.86]].forEach(([x, z]) => {
    const r = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.34, 36), goma); t.rotation.x = Math.PI / 2; t.castShadow = true;
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.36, 6), llanta); l.rotation.x = Math.PI / 2;
    r.add(t, l);
    r.position.set(x, 0.44, z);
    furgo.add(r);
    ruedas.push(r);
  });

  // ── Asfalto con líneas discontinuas que corren bajo la furgoneta ──
  const cvR = document.createElement('canvas'); cvR.width = 1024; cvR.height = 256;
  const cr = cvR.getContext('2d');
  const gx = cr.createLinearGradient(0, 0, 1024, 0);
  gx.addColorStop(0, 'rgba(6,22,49,0)'); gx.addColorStop(0.25, 'rgba(6,22,49,.55)'); gx.addColorStop(0.75, 'rgba(6,22,49,.55)'); gx.addColorStop(1, 'rgba(6,22,49,0)');
  cr.fillStyle = gx; cr.fillRect(0, 0, 1024, 256);
  cr.globalCompositeOperation = 'destination-in';
  const gy = cr.createLinearGradient(0, 0, 0, 256);
  gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.3, 'rgba(0,0,0,1)'); gy.addColorStop(0.7, 'rgba(0,0,0,1)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
  cr.fillStyle = gy; cr.fillRect(0, 0, 1024, 256);
  cr.globalCompositeOperation = 'source-over';
  const texAsfalto = new THREE.CanvasTexture(cvR); texAsfalto.colorSpace = THREE.SRGBColorSpace;
  const asfalto = new THREE.Mesh(new THREE.PlaneGeometry(22, 5.5), new THREE.MeshBasicMaterial({ map: texAsfalto, transparent: true, depthWrite: false }));
  asfalto.rotation.x = -Math.PI / 2; asfalto.position.y = 0.005;
  furgo.add(asfalto);

  const cvL = document.createElement('canvas'); cvL.width = 256; cvL.height = 16;
  const cl = cvL.getContext('2d'); cl.fillStyle = '#FFC72C'; cl.fillRect(0, 4, 150, 8);
  const texLinea = new THREE.CanvasTexture(cvL); texLinea.wrapS = THREE.RepeatWrapping; texLinea.repeat.set(9, 1); texLinea.colorSpace = THREE.SRGBColorSpace;
  const matLinea = new THREE.MeshBasicMaterial({ map: texLinea, transparent: true, depthWrite: false });
  [1.75, -1.75].forEach(z => {
    const linea = new THREE.Mesh(new THREE.PlaneGeometry(20, 0.07), matLinea);
    linea.rotation.x = -Math.PI / 2; linea.position.set(0, 0.012, z);
    furgo.add(linea);
  });

  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.ShadowMaterial({ opacity: 0.45 }));
  sombra.rotation.x = -Math.PI / 2; sombra.receiveShadow = true;
  furgo.add(sombra);
  sol.target = furgo;

  // ── Posición de la furgoneta en cada escena (rotación, x, y, escala) ──
  const ESC_ANCHO = [
    { r: -0.62, x: 1.0,  y: -3.0, s: 0.8 },
    { r: 0.0,   x: 3.1,  y: -1.9, s: 0.86 },
    { r: -0.95, x: 3.3,  y: -1.9, s: 0.9 },
    { r: 0.55,  x: 3.2,  y: -1.8, s: 0.9 },
    { r: -1.35, x: 3.1,  y: -2.0, s: 0.95 },
  ];
  const ESC_MOVIL = [
    { r: -0.62, x: 0, y: -0.9, s: 0.5 },
    { r: 0.0,   x: 0, y: -1.6, s: 0.56 },
    { r: -0.95, x: 0, y: -1.6, s: 0.56 },
    { r: 0.55,  x: 0, y: -1.6, s: 0.56 },
    { r: -1.35, x: 0, y: -1.7, s: 0.6 },
  ];
  let movil = false;
  const actual = {};

  function medir() {
    const w = lienzo.clientWidth, h = lienzo.clientHeight;
    movil = w < 900;
    renderer.setPixelRatio(Math.min(devicePixelRatio, movil ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.fov = movil ? 40 : 28;
    camara.updateProjectionMatrix();
  }
  addEventListener('resize', medir);
  medir();
  Object.assign(actual, (movil ? ESC_MOVIL : ESC_ANCHO)[0]);

  let ratonX = 0, ratonY = 0;
  addEventListener('pointermove', e => { ratonX = e.clientX / innerWidth - 0.5; ratonY = e.clientY / innerHeight - 0.5; }, { passive: true });

  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(document.querySelector('.viaje'));

  let pAnterior = 0, giro = 0, vel = 0;
  const reloj = new THREE.Clock();
  function cuadro() {
    requestAnimationFrame(cuadro);
    if (!visible) return;
    const dt = Math.min(reloj.getDelta(), 0.05), t = reloj.elapsedTime;
    const v = window.NEXO_VIAJE || { p: 0, escena: 0 };
    const obj = (movil ? ESC_MOVIL : ESC_ANCHO)[v.escena];
    const k = quieto ? 1 : 1 - Math.pow(0.0015, dt);
    for (const c in obj) actual[c] += (obj[c] - actual[c]) * k;

    // velocidad: el scroll empuja y, en reposo, rueda despacio
    const dp = v.p - pAnterior; pAnterior = v.p;
    vel += ((quieto ? 0 : 0.6) + Math.abs(dp) * 900 - vel) * 0.08;
    giro += vel * dt;
    ruedas.forEach(r => { r.rotation.z = -giro * 2.3; });
    texLinea.offset.x = giro * 0.45;

    furgo.rotation.y = actual.r + (quieto ? 0 : ratonX * 0.25);
    furgo.position.set(actual.x, actual.y, 0);
    furgo.scale.setScalar(actual.s);
    vehiculo.position.y = quieto ? 0 : Math.sin(t * 9) * 0.008 * Math.min(vel, 3);
    vehiculo.rotation.z = quieto ? 0 : Math.sin(t * 1.7) * 0.004 - Math.min(Math.abs(dp) * 40, 0.03);

    camara.position.x = quieto ? 0 : ratonX * 0.8;
    camara.position.y = 3.4 - (quieto ? 0 : ratonY * 0.6);
    camara.lookAt(0, 0.2, 0);
    renderer.render(escena, camara);
  }
  cuadro();
}
