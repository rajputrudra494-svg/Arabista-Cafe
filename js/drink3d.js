// Arabista — real-time 3D signature drink.
// A tapered glass tumbler (physical transmission) holding a layered liquid
// shader, ice, garnish, straw, orbiting coffee beans and string-light bokeh.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// ---------- glass dimensions ----------
const BASE = 0.22; // thickness of the glass floor
const TOP = 2.4; // rim height
const R_IN_BOTTOM = 0.74;
const R_IN_TOP = 0.9;
const SLOPE = (R_IN_TOP - R_IN_BOTTOM) / (TOP - BASE);
const FILL_H = 1.82; // liquid height when full
const innerR = (y) => R_IN_BOTTOM + SLOPE * (y - BASE);

// ---------- helpers ----------
function canvasTex(size, draw, srgb = true) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function bgTexture([inner, outer], cx = 0.5, cy = 0.45) {
  return canvasTex(512, (g, s) => {
    const grd = g.createRadialGradient(s * cx, s * cy, 0, s * cx, s * cy, s * 0.75);
    grd.addColorStop(0, inner);
    grd.addColorStop(1, outer);
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
  });
}

function fruitWheelTex(kind) {
  return canvasTex(256, (g, s) => {
    const c = s / 2;
    const pal =
      kind === "strawberry"
        ? { rind: "#b3122e", pith: "#f2b8c0", flesh: "#e2394f", seg: "#ffd6dc" }
        : kind === "lime"
          ? { rind: "#3d7a1c", pith: "#e8f2c8", flesh: "#9cc94a", seg: "#e6f5be" }
          : { rind: "#e1701a", pith: "#fde8c6", flesh: "#f79a2c", seg: "#ffd59a" };
    g.fillStyle = pal.rind;
    g.beginPath();
    g.arc(c, c, c, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = pal.pith;
    g.beginPath();
    g.arc(c, c, c * 0.9, 0, Math.PI * 2);
    g.fill();
    if (kind === "strawberry") {
      const grd = g.createRadialGradient(c, c, 0, c, c, c * 0.86);
      grd.addColorStop(0, "#ffd3d9");
      grd.addColorStop(0.45, "#f0697c");
      grd.addColorStop(1, pal.flesh);
      g.fillStyle = grd;
      g.beginPath();
      g.arc(c, c, c * 0.86, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#fff3c4";
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = c * (0.62 + Math.random() * 0.2);
        g.beginPath();
        g.ellipse(c + Math.cos(a) * r, c + Math.sin(a) * r, 3, 1.8, a, 0, Math.PI * 2);
        g.fill();
      }
      return;
    }
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 + 0.04;
      const a1 = ((i + 1) / n) * Math.PI * 2 - 0.04;
      const grd = g.createRadialGradient(c, c, c * 0.08, c, c, c * 0.84);
      grd.addColorStop(0, pal.seg);
      grd.addColorStop(1, pal.flesh);
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(c, c);
      g.arc(c, c, c * 0.84, a0, a1);
      g.closePath();
      g.fill();
    }
    g.fillStyle = pal.pith;
    g.beginPath();
    g.arc(c, c, c * 0.08, 0, Math.PI * 2);
    g.fill();
  });
}

function woodTex() {
  return canvasTex(512, (g, s) => {
    const c = s / 2;
    g.fillStyle = "#6b4528";
    g.fillRect(0, 0, s, s);
    for (let r = 4; r < c; r += 3 + Math.random() * 7) {
      g.strokeStyle = `rgba(${40 + Math.random() * 30},${22 + Math.random() * 14},${10},${0.18 + Math.random() * 0.25})`;
      g.lineWidth = 1 + Math.random() * 2.5;
      g.beginPath();
      g.ellipse(c + Math.random() * 3, c + Math.random() * 3, r, r * (0.97 + Math.random() * 0.05), 0, 0, Math.PI * 2);
      g.stroke();
    }
    // gold-foil brand ring
    g.strokeStyle = "rgba(214,178,116,0.85)";
    g.lineWidth = 5;
    g.beginPath();
    g.arc(c, c, c * 0.93, 0, Math.PI * 2);
    g.stroke();
  });
}

function bokehSprite() {
  return canvasTex(128, (g, s) => {
    const c = s / 2;
    const grd = g.createRadialGradient(c, c, 0, c, c, c);
    grd.addColorStop(0, "rgba(255,240,205,1)");
    grd.addColorStop(0.35, "rgba(255,214,150,0.55)");
    grd.addColorStop(1, "rgba(255,200,120,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
  });
}

function shadowTex() {
  return canvasTex(256, (g, s) => {
    const c = s / 2;
    const grd = g.createRadialGradient(c, c, 0, c, c, c);
    grd.addColorStop(0, "rgba(0,0,0,0.55)");
    grd.addColorStop(0.55, "rgba(0,0,0,0.25)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
  }, false);
}

function beanGeometry() {
  const geo = new THREE.SphereGeometry(0.15, 32, 20);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    v.x *= 1.0;
    v.y *= 0.68;
    v.z *= 1.38;
    if (v.y > 0) {
      v.y *= 0.75; // flat side
      const s = Math.sin(v.z * 14) * 0.012; // S-shaped centre cut
      v.y -= 0.045 * Math.exp(-Math.pow((v.x - s) / 0.026, 2));
    }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// ---------- liquid shader ----------
const liquidVert = /* glsl */ `
  uniform float uFill;
  uniform float uTime;
  varying float vH;
  varying float vAng;
  varying float vCap;
  varying float vRad;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec3 p = position;
    float y = ${BASE.toFixed(3)} + 0.005 + p.y * uFill * ${FILL_H.toFixed(3)};
    float r = ${R_IN_BOTTOM.toFixed(3)} + ${SLOPE.toFixed(5)} * (y - ${BASE.toFixed(3)}) - 0.012;
    vCap = step(0.5, normal.y) * step(0.999, p.y);
    vRad = length(p.xz);
    // gentle slosh on the surface
    if (vCap > 0.5) y += 0.018 * sin(p.x * 3.0 + uTime * 1.6) * vRad;
    vec3 np = vec3(p.x * r, y, p.z * r);
    vH = p.y;
    vAng = atan(p.z, p.x);
    vec4 wp = modelMatrix * vec4(np, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const liquidFrag = /* glsl */ `
  uniform vec3 uC0;
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uCrema;
  uniform float uS1;
  uniform float uS2;
  uniform float uTime;
  uniform float uBubbles;
  varying float vH;
  varying float vAng;
  varying float vCap;
  varying float vRad;
  varying vec3 vN;
  varying vec3 vV;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    float w = 0.022 * sin(vAng * 3.0 + uTime * 1.3) + 0.012 * sin(vAng * 7.0 - uTime * 2.0);
    float b1 = smoothstep(uS1 - 0.07 + w, uS1 + 0.07 + w, vH);
    float b2 = smoothstep(uS2 - 0.05 + w, uS2 + 0.05 + w, vH);
    vec3 col = mix(uC0, uC1, b1);
    col = mix(col, uC2, b2);
    col *= 0.8 + 0.2 * vH;

    vec3 N = normalize(vN);
    vec3 V = normalize(vV);
    vec3 L = normalize(vec3(0.5, 0.9, 0.6));
    float diff = 0.6 + 0.4 * max(dot(N, L), 0.0);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.2);
    col *= diff;
    col += col * 0.3 * (1.0 - fres);            // light passing through
    col += fres * 0.14 * vec3(1.0, 0.95, 0.85); // rim

    if (vCap > 0.5) {
      float n = hash(floor(vec2(vAng * 40.0, vRad * 40.0)));
      col = mix(uCrema * 1.15, uCrema * 0.75, smoothstep(0.2, 1.0, vRad));
      col *= 0.92 + 0.12 * n;
    } else if (uBubbles > 0.001) {
      vec2 g = vec2(vAng * 7.0, vH * 16.0 - uTime * 0.85);
      vec2 id = floor(g);
      vec2 f = fract(g) - 0.5;
      float rnd = hash(id);
      vec2 off = vec2(hash(id + 3.1) - 0.5, hash(id + 7.7) - 0.5) * 0.45;
      float d = length(f - off);
      float rad = 0.05 + 0.07 * rnd;
      float ring = smoothstep(rad, rad - 0.025, d);
      float bub = ring * step(0.6, rnd) * (1.0 - b2);
      col = mix(col, vec3(1.0, 0.97, 0.9), bub * 0.6 * uBubbles);
    }
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// ---------- main factory ----------
export function createDrinkScene(canvas, opts = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch (e) {
    canvas.parentElement?.classList.add("no-webgl");
    return null;
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = bgTexture(opts.bg || ["#1f5654", "#071d1e"], opts.bgCenter?.[0], opts.bgCenter?.[1]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environmentIntensity = 0.85;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, 2.2, 8.6);
  const lookAt = new THREE.Vector3(0, 1.15, 0);

  const key = new THREE.DirectionalLight(0xffd8a6, 2.4);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7fd1c6, 1.6);
  rim.position.set(-4, 3, -3);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xfff1dc, 0.25));

  const root = new THREE.Group(); // positioned by layout
  const spin = new THREE.Group(); // rotated by drag / scroll
  root.add(spin);
  scene.add(root);

  // coaster + shadow
  const wood = woodTex();
  const coaster = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.38, 0.08, 72),
    [
      new THREE.MeshStandardMaterial({ color: 0x4a2f1b, roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ map: wood, roughness: 0.55 }),
      new THREE.MeshStandardMaterial({ color: 0x2b1a0f }),
    ],
  );
  coaster.position.y = -0.04;
  spin.add(coaster);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 2.4),
    new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  spin.add(shadow);

  // glass
  const prof = [
    [0, 0], [0.7, 0], [0.76, 0.015], [0.79, 0.06],
    [R_IN_TOP + 0.05, TOP], [R_IN_TOP + 0.035, TOP + 0.02], [R_IN_TOP + 0.01, TOP + 0.015],
    [R_IN_TOP, TOP], [R_IN_BOTTOM, BASE + 0.02], [R_IN_BOTTOM - 0.03, BASE], [0, BASE],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.03,
    transmission: 1,
    thickness: 0.35,
    ior: 1.46,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    specularIntensity: 1,
    envMapIntensity: 1.2,
    attenuationColor: new THREE.Color(0xe9fff8),
    attenuationDistance: 3,
  });
  const glass = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), glassMat);
  glass.renderOrder = 2;
  spin.add(glass);

  // liquid
  const U = {
    uFill: { value: 1 },
    uTime: { value: 0 },
    uC0: { value: new THREE.Color() },
    uC1: { value: new THREE.Color() },
    uC2: { value: new THREE.Color() },
    uCrema: { value: new THREE.Color() },
    uS1: { value: 0.4 },
    uS2: { value: 0.7 },
    uBubbles: { value: 0 },
  };
  const liqGeo = new THREE.CylinderGeometry(1, 1, 1, 96, 48, false);
  liqGeo.translate(0, 0.5, 0);
  const liquid = new THREE.Mesh(
    liqGeo,
    new THREE.ShaderMaterial({ uniforms: U, vertexShader: liquidVert, fragmentShader: liquidFrag }),
  );
  spin.add(liquid);

  // ice
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xf2fbff,
    roughness: 0.12,
    metalness: 0,
    transparent: true,
    opacity: 0.55,
    clearcoat: 1,
    envMapIntensity: 1.6,
    depthWrite: false,
  });
  const ice = [];
  const iceGeo = new RoundedBoxGeometry(0.44, 0.4, 0.44, 4, 0.07);
  [
    [0.28, 0.1, 0.18, 0.4],
    [-0.3, 0.02, -0.12, 1.1],
    [0.02, 0.06, -0.38, 2.3],
    [-0.12, 0.12, 0.34, 0.2],
  ].forEach(([x, dy, z, r], i) => {
    const m = new THREE.Mesh(iceGeo, iceMat);
    m.position.set(x, 0, z);
    m.rotation.set(r, r * 1.7, r * 0.6);
    m.userData = { dy, phase: i * 1.7 };
    m.renderOrder = 3;
    spin.add(m);
    ice.push(m);
  });

  // straw — Arabista teal with a gold band
  const straw = new THREE.Group();
  const strawMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 3.1, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x0f3a39, roughness: 0.35, side: THREE.DoubleSide }),
  );
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.052, 0.12, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xd6b274, metalness: 0.8, roughness: 0.25 }),
  );
  band.position.y = 1.15;
  straw.add(strawMesh, band);
  straw.position.set(-0.32, 1.85, 0.12);
  straw.rotation.set(0.12, 0, 0.24);
  spin.add(straw);

  // garnishes
  const wheelGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.07, 64);
  const makeWheel = (kind) => {
    const rindCol = kind === "strawberry" ? 0xb3122e : kind === "lime" ? 0x3d7a1c : 0xe1701a;
    const face = new THREE.MeshStandardMaterial({ map: fruitWheelTex(kind), roughness: 0.45 });
    const m = new THREE.Mesh(wheelGeo, [new THREE.MeshStandardMaterial({ color: rindCol, roughness: 0.5 }), face, face]);
    m.rotation.set(Math.PI / 2, 0, 0.12);
    m.position.set(0.88, TOP - 0.05, 0.1);
    return m;
  };
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.12, 0.12, 0, 0.32);
  leafShape.quadraticCurveTo(-0.12, 0.12, 0, 0);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f8f3a, roughness: 0.5, side: THREE.DoubleSide });
  const mint = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const l = new THREE.Mesh(new THREE.ShapeGeometry(leafShape, 8), leafMat);
    l.rotation.set(-0.9 + Math.random() * 0.4, (i / 6) * Math.PI * 2, 0.3);
    l.position.set(Math.cos(i) * 0.08, 0.02 * i, Math.sin(i) * 0.08);
    mint.add(l);
  }
  mint.position.set(0.25, TOP - 0.25, 0.1);
  const garnishes = {
    orange: makeWheel("orange"),
    strawberry: makeWheel("strawberry"),
    lime: makeWheel("lime"),
    mint,
  };
  garnishes.mint.add(makeWheel("lime"));
  garnishes.mint.children.at(-1).position.set(0.62, 0.2, 0);
  Object.values(garnishes).forEach((g) => {
    g.scale.setScalar(0.0001);
    g.userData.s = 0;
    spin.add(g);
  });

  // coffee beans — some resting on the coaster, others orbiting
  const beanGeo = beanGeometry();
  const beanMat = new THREE.MeshPhysicalMaterial({ color: 0x3a2014, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.3 });
  const resting = [
    [1.05, 0.08, 0.55, 0.2], [0.95, 0.08, 0.86, 1.4], [-1.02, 0.08, 0.62, 2.7],
  ];
  resting.forEach(([x, y, z, r]) => {
    const b = new THREE.Mesh(beanGeo, beanMat);
    b.position.set(x, y, z);
    b.rotation.set(0, r, 0);
    spin.add(b);
  });
  const ORBIT = opts.beans ?? 18;
  const beans = new THREE.InstancedMesh(beanGeo, beanMat, ORBIT);
  const beanData = Array.from({ length: ORBIT }, (_, i) => ({
    r: 1.5 + Math.random() * 0.8,
    a: (i / ORBIT) * Math.PI * 2 + Math.random() * 0.4,
    y: 0.3 + Math.random() * 2.5,
    s: 0.55 + Math.random() * 0.55,
    sp: 0.08 + Math.random() * 0.12,
    rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
    rs: 0.3 + Math.random() * 0.6,
  }));
  root.add(beans);

  // string-light bokeh, a nod to the café's outdoor fairy lights
  const BOKEH = opts.bokeh ?? 70;
  const bPos = new Float32Array(BOKEH * 3);
  const bPhase = [];
  for (let i = 0; i < BOKEH; i++) {
    const t = i / BOKEH;
    // two drooping strands
    const strand = i % 2;
    const x = -9 + t * 18;
    bPos[i * 3] = x + (Math.random() - 0.5) * 0.6;
    bPos[i * 3 + 1] = (strand ? 4.4 : 3.2) - 0.035 * (x * x) * -0.6 + (Math.random() - 0.5) * 0.4 - 1;
    bPos[i * 3 + 2] = -6 - strand * 3 - Math.random() * 2;
    bPhase.push(Math.random() * Math.PI * 2);
  }
  const bokehGeo = new THREE.BufferGeometry();
  bokehGeo.setAttribute("position", new THREE.BufferAttribute(bPos, 3));
  const bokehMat = new THREE.PointsMaterial({
    map: bokehSprite(),
    size: 0.9,
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.75,
    color: 0xffd9a0,
  });
  const bokeh = new THREE.Points(bokehGeo, bokehMat);
  scene.add(bokeh);

  // ---------- state ----------
  const target = {
    c0: new THREE.Color(), c1: new THREE.Color(), c2: new THREE.Color(), crema: new THREE.Color(),
    s1: 0.4, s2: 0.7, bubbles: 0, fill: 1, garnish: "none", ice: true,
  };
  let current = null;
  let drainUntil = 0;
  let pending = null;

  function apply(sig, instant) {
    target.c0.set(sig.layers[0]);
    target.c1.set(sig.layers[1]);
    target.c2.set(sig.layers[2]);
    target.crema.set(sig.crema);
    target.s1 = sig.splits[0];
    target.s2 = sig.splits[1];
    target.bubbles = sig.bubbles ? 1 : 0;
    target.garnish = sig.garnish;
    target.ice = sig.ice;
    if (instant) {
      U.uC0.value.copy(target.c0);
      U.uC1.value.copy(target.c1);
      U.uC2.value.copy(target.c2);
      U.uCrema.value.copy(target.crema);
      U.uS1.value = target.s1;
      U.uS2.value = target.s2;
      U.uBubbles.value = target.bubbles;
    }
  }

  function setDrink(sig, { instant = false } = {}) {
    if (!current || instant || reduced) {
      current = sig;
      apply(sig, true);
      target.fill = 1;
      return;
    }
    if (sig === current) return;
    current = sig;
    // drain → swap → pour
    pending = sig;
    target.fill = 0.02;
    target.garnish = "none";
    drainUntil = performance.now() + 520;
  }

  // ---------- interaction ----------
  let dragging = false, lastX = 0, velocity = 0, userRot = 0;
  const mouse = new THREE.Vector2();
  const smoothMouse = new THREE.Vector2();
  if (opts.interactive !== false) {
    canvas.style.touchAction = "pan-y";
    canvas.addEventListener("pointerdown", (e) => {
      dragging = true;
      lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add("grabbing");
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      velocity = dx * 0.008;
      userRot += velocity;
    });
    const end = () => { dragging = false; canvas.classList.remove("grabbing"); };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
  }
  window.addEventListener("pointermove", (e) => {
    mouse.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
  }, { passive: true });

  let scrollP = 0;
  const setScroll = (p) => { scrollP = p; };

  // ---------- layout ----------
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (opts.layout) opts.layout({ w, h, aspect: w / h, root, camera, lookAt });
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // ---------- loop ----------
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "100px" });
  io.observe(canvas);

  const clock = new THREE.Clock();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  let raf;
  function tick() {
    raf = requestAnimationFrame(tick);
    if (!visible || document.hidden) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    U.uTime.value = t;

    if (pending && performance.now() > drainUntil) {
      apply(pending, true);
      pending = null;
      target.fill = 1;
    }

    const k = 1 - Math.pow(0.0015, dt); // frame-rate independent easing
    U.uFill.value += (target.fill - U.uFill.value) * (target.fill < U.uFill.value ? k * 1.4 : k * 0.7);
    U.uC0.value.lerp(target.c0, k);
    U.uC1.value.lerp(target.c1, k);
    U.uC2.value.lerp(target.c2, k);
    U.uCrema.value.lerp(target.crema, k);
    U.uS1.value += (target.s1 - U.uS1.value) * k;
    U.uS2.value += (target.s2 - U.uS2.value) * k;
    U.uBubbles.value += (target.bubbles - U.uBubbles.value) * k;

    // ice floats on the surface
    const surface = BASE + U.uFill.value * FILL_H;
    ice.forEach((m) => {
      const want = target.ice && U.uFill.value > 0.35 ? 1 : 0.0001;
      m.scale.setScalar(m.scale.x + (want - m.scale.x) * k);
      m.position.y = surface - 0.16 + m.userData.dy + Math.sin(t * 1.2 + m.userData.phase) * 0.025;
      m.rotation.y += dt * 0.05;
    });

    // garnish pop
    for (const [name, g] of Object.entries(garnishes)) {
      const want = target.garnish === name ? 1 : 0.0001;
      g.userData.s += (want - g.userData.s) * k * 0.9;
      g.scale.setScalar(Math.max(g.userData.s, 0.0001));
    }
    garnishes.mint.position.y = surface - 0.02;

    // rotation: idle spin + drag inertia + scroll
    if (!dragging) {
      velocity *= 0.94;
      userRot += velocity;
    }
    const idle = reduced ? 0 : t * 0.18;
    spin.rotation.y = idle + userRot + scrollP * Math.PI * 1.2;
    smoothMouse.lerp(mouse, k * 0.6);
    root.rotation.x = 0.05 + smoothMouse.y * 0.06;
    root.rotation.z = -smoothMouse.x * 0.03;

    // beans orbit
    beanData.forEach((b, i) => {
      const a = b.a + t * b.sp * (reduced ? 0 : 1);
      v3.set(Math.cos(a) * b.r, b.y + Math.sin(t * 0.7 + i) * 0.12 - scrollP * 0.6, Math.sin(a) * b.r);
      b.rot.x += dt * b.rs * 0.6;
      b.rot.y += dt * b.rs;
      q.setFromEuler(b.rot);
      s3.setScalar(b.s);
      m4.compose(v3, q, s3);
      beans.setMatrixAt(i, m4);
    });
    beans.instanceMatrix.needsUpdate = true;

    // twinkle
    bokehMat.opacity = 0.62 + Math.sin(t * 1.3) * 0.08;
    bokeh.position.x = smoothMouse.x * -0.4;

    camera.lookAt(lookAt);
    renderer.render(scene, camera);
  }
  tick();

  return {
    setDrink,
    setScroll,
    get current() { return current; },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      renderer.dispose();
    },
  };
}
