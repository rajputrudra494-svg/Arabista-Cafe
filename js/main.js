import { MENU, SIGNATURES } from "./menu-data.js";
import { createDrinkScene } from "./drink3d.js";

const WA_NUMBER = "917600577745";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const isMobile = () => innerWidth <= 860;
const rupee = (n) => "₹" + n.toLocaleString("en-IN");

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

if (!gsap) document.documentElement.classList.remove("js");
else gsap.registerPlugin(ScrollTrigger);

$("#year").textContent = new Date().getFullYear();
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
scrollTo(0, 0);

/* =========================================================
   Smooth scroll
   ========================================================= */
let lenis = null;
if (window.Lenis && !reduced) {
  lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95 });
  if (gsap) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  lenis.stop();
}
const scrollToEl = (el) => {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: el.id === "top" ? 0 : -60, duration: 1.4 });
  else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
};
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute("href");
  if (id.length < 2) return;
  const el = $(id);
  if (!el) return;
  e.preventDefault();
  closeMobileMenu();
  if (a.hasAttribute("data-event")) setBookingKind("event");
  scrollToEl(el);
});

/* =========================================================
   Split headings into masked words
   ========================================================= */
function splitWords(el) {
  const frag = document.createDocumentFragment();
  const push = (word, wrap) => {
    const w = document.createElement("span");
    w.className = "w";
    const inner = document.createElement("span");
    if (wrap) {
      const c = wrap.cloneNode(false);
      c.textContent = word;
      inner.appendChild(c);
    } else inner.textContent = word;
    w.appendChild(inner);
    frag.appendChild(w);
    frag.appendChild(document.createTextNode(" "));
  };
  el.childNodes.forEach((node) => {
    const words = node.textContent.split(/\s+/).filter(Boolean);
    words.forEach((word) => push(word, node.nodeType === 1 ? node : null));
  });
  el.textContent = "";
  el.appendChild(frag);
}
$$(".split").forEach(splitWords);

/* =========================================================
   Loader + hero intro
   ========================================================= */
const counter = $("#loaderCount");
const loaderState = { v: 0 };
const ready = Promise.race([
  Promise.all([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r)))]),
  new Promise((r) => setTimeout(r, 4500)),
]);

function introHero() {
  if (!gsap) return;
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.to(".hero__title .line > span", { y: 0, duration: 1.4, stagger: 0.12 })
    .to(".hero .reveal-up", { opacity: 1, y: 0, duration: 1.1, stagger: 0.09 }, "-=1.05")
    .fromTo(".nav", { opacity: 0 }, { opacity: 1, duration: 1, clearProps: "opacity" }, "-=1.1");
  countUp($$(".hero__meta [data-count]"));
}

if (gsap && !reduced) {
  gsap.set(".loader__fill", { attr: { y: 100 } });
  const word = gsap.to(".loader__word span", { y: 0, duration: 1, stagger: 0.06, ease: "expo.out", delay: 0.15 });
  const prog = gsap.to(loaderState, {
    v: 88, duration: 2.2, ease: "power2.out",
    onUpdate() {
      counter.textContent = Math.round(loaderState.v);
      gsap.set(".loader__fill", { attr: { y: 100 - loaderState.v * 0.66 } });
    },
  });
  ready.then(() => {
    prog.kill();
    gsap.timeline()
      .to(loaderState, {
        v: 100, duration: 0.6, ease: "power2.inOut",
        onUpdate() {
          counter.textContent = Math.round(loaderState.v);
          gsap.set(".loader__fill", { attr: { y: 100 - loaderState.v * 0.66 } });
        },
      })
      .add(() => word.progress(1))
      .to(".loader__word span", { y: "-110%", duration: 0.7, stagger: 0.04, ease: "expo.in" }, "+=0.15")
      .to([".loader__cup", ".loader__count"], { opacity: 0, y: -20, duration: 0.5 }, "<")
      .to(".loader__curtain", { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.25")
      .add(() => {
        $("#loader").remove();
        document.body.classList.remove("is-loading");
        lenis?.start();
        ScrollTrigger.refresh();
      }, "-=0.45")
      .add(introHero, "-=0.75");
  });
} else {
  ready.then(() => {
    $("#loader")?.remove();
    document.body.classList.remove("is-loading");
    lenis?.start();
    $$(".hero__title .line > span").forEach((s) => (s.style.transform = "none"));
    countUp($$(".hero__meta [data-count]"));
  });
}

function countUp(els) {
  els.forEach((el) => {
    const end = +el.dataset.count;
    if (!gsap || reduced) { el.textContent = end; return; }
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 2.2, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(o.v)) });
  });
}

/* =========================================================
   3D — hero glass
   ========================================================= */
const HALF_H = Math.tan((15 * Math.PI) / 180) * 8.9;
const heroScene = createDrinkScene($("#heroCanvas"), {
  bg: ["#21605c", "#071c1d"],
  bgCenter: [0.68, 0.48],
  layout({ w, h, aspect, root, lookAt }) {
    if (w <= 860) {
      // stacked: the glass gets the reserved square under the copy
      const reserve = Math.min(w * 0.96, 440);
      const pxPerUnit = h / (2 * HALF_H);
      const s = Math.min((0.62 * reserve) / (2.6 * pxPerUnit), 1);
      const py = h - reserve * 0.5;
      const worldY = 1.15 + HALF_H * (1 - (2 * py) / h);
      root.position.set(0, worldY - 1.25 * s, 0);
      root.scale.setScalar(s);
      lookAt.set(0, 1.15, 0);
    } else if (aspect > 1.05) {
      const halfW = HALF_H * aspect;
      root.position.set(Math.min(halfW * 0.46, 3.5), 0.05, 0);
      root.scale.setScalar(0.86);
      lookAt.set(0, 1.15, 0);
    } else {
      // portrait: glass sits in the lower half beneath the headline
      root.position.set(aspect < 0.6 ? 0.55 : 1.0, -1.25, 0);
      root.scale.setScalar(aspect < 0.6 ? 0.72 : 0.85);
      lookAt.set(0, 1.15, 0);
    }
  },
});
if (!heroScene) $(".hero").classList.add("no-webgl");
else heroScene.setDrink(SIGNATURES[0], { instant: true });

if (gsap && heroScene) {
  ScrollTrigger.create({
    trigger: ".hero", start: "top top", end: "bottom top", scrub: true,
    onUpdate: (s) => heroScene.setScroll(s.progress),
  });
}
if (gsap && !reduced) {
  gsap.to(".hero__content", {
    yPercent: -18, opacity: 0.1, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
}

/* =========================================================
   3D — signature configurator
   ========================================================= */
const LAYER_LABELS = {
  "espresso-tonic": ["Tonic", "Orange", "Espresso"],
  "strawberry-matcha": ["Strawberry", "Milk", "Matcha"],
  "passion-cold-brew": ["Passion fruit", "Sunset blend", "Cold brew"],
  "vietnamese-cold-brew": ["Condensed milk", "Swirl", "Cold brew"],
  "classic-matcha": ["Cold milk", "Blend", "Matcha"],
  "watermelon-brewjito": ["Watermelon", "Mint & lime", "Cold brew"],
};
const sigScene = createDrinkScene($("#sigCanvas"), {
  bg: ["#2a6b66", "#0a2223"],
  bgCenter: [0.5, 0.42],
  beans: 12,
  bokeh: 50,
  layout({ w, aspect, root, lookAt }) {
    const small = w < 620 || aspect > 0.97;
    root.position.set(0, small ? 0.02 : -0.2, 0);
    root.scale.setScalar(small ? 0.8 : 1);
    lookAt.set(0, 1.15, 0);
  },
});
if (!sigScene) $(".sig__stage").classList.add("no-webgl");

const chipsEl = $("#sigChips");
SIGNATURES.forEach((s, i) => {
  const b = document.createElement("button");
  b.className = "chip";
  b.setAttribute("role", "tab");
  b.setAttribute("aria-selected", i === 0 ? "true" : "false");
  b.innerHTML = `<i style="background:linear-gradient(135deg, ${s.layers[0]}, ${s.layers[2]})"></i>${s.name}`;
  b.addEventListener("click", () => selectSignature(i));
  chipsEl.appendChild(b);
});
let sigIndex = 0;
function renderSigCard(s) {
  $("#sigMood").textContent = s.mood;
  $("#sigName").textContent = s.name;
  $("#sigNote").textContent = s.note;
  $("#sigNotes").innerHTML = s.notes.map((n) => `<li>${n}</li>`).join("");
  $("#sigPrice").textContent = rupee(s.price);
  const labels = LAYER_LABELS[s.id];
  $("#sigLayers").innerHTML = [2, 1, 0].map((k) => `<li><i style="background:${s.layers[k]}"></i>${labels[k]}</li>`).join("");
}
function selectSignature(i) {
  if (i === sigIndex && sigScene?.current) return;
  sigIndex = i;
  const s = SIGNATURES[i];
  $$(".chip", chipsEl).forEach((c, k) => c.setAttribute("aria-selected", k === i ? "true" : "false"));
  sigScene?.setDrink(s);
  if (gsap && !reduced) {
    gsap.timeline()
      .to("#sigCard > *", { opacity: 0, y: -10, duration: 0.25, stagger: 0.03, ease: "power2.in" })
      .add(() => renderSigCard(s))
      .fromTo("#sigCard > *", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "expo.out" });
  } else renderSigCard(s);
}
renderSigCard(SIGNATURES[0]);
sigScene?.setDrink(SIGNATURES[0], { instant: true });
$("#sigAdd").addEventListener("click", (e) => {
  const s = SIGNATURES[sigIndex];
  addToTray(s.name, s.price, e.currentTarget);
});

/* =========================================================
   Menu
   ========================================================= */
const tabsEl = $("#menuTabs");
const listEl = $("#menuList");
const introEl = $("#menuIntro");
const searchEl = $("#menuSearch");
const sigOnlyEl = $("#sigOnly");
let activeCat = MENU[0].id;

MENU.forEach((cat) => {
  const b = document.createElement("button");
  b.className = "tab";
  b.setAttribute("role", "tab");
  b.dataset.id = cat.id;
  b.innerHTML = `${cat.title} <small>${cat.items.length}</small>`;
  b.addEventListener("click", () => {
    activeCat = cat.id;
    searchEl.value = "";
    renderMenu(true);
    b.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  });
  tabsEl.appendChild(b);
});

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const highlight = (text, q) => {
  const safe = esc(text);
  if (!q) return safe;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
  return safe.replace(re, "<mark>$1</mark>");
};

function renderMenu(animate) {
  const q = searchEl.value.trim().toLowerCase();
  const sigOnly = sigOnlyEl.checked;
  const global = q || sigOnly;
  let items = [];
  if (global) {
    MENU.forEach((c) => c.items.forEach((it) => items.push({ ...it, cat: c.title })));
    if (q) items = items.filter((it) => (it.n + " " + it.d + " " + it.cat).toLowerCase().includes(q));
    if (sigOnly) items = items.filter((it) => it.t?.includes("sig"));
  } else {
    items = MENU.find((c) => c.id === activeCat).items;
  }
  $$(".tab", tabsEl).forEach((t) => t.setAttribute("aria-selected", !global && t.dataset.id === activeCat ? "true" : "false"));

  const cat = MENU.find((c) => c.id === activeCat);
  introEl.innerHTML = global
    ? `<span class="count">${items.length} result${items.length === 1 ? "" : "s"}</span><h3>${q ? `“${esc(searchEl.value.trim())}”` : "House signatures"}</h3><p>${q ? "Across the whole menu." : "The drinks and plates we're proudest of."}</p>`
    : `<span class="count">${cat.items.length} items</span><h3>${cat.title}</h3><p>${cat.blurb}</p>`;

  listEl.innerHTML = items
    .map((it) => {
      const tags = [
        it.t?.includes("sig") ? '<span class="tag tag--sig">Signature</span>' : "",
        it.t?.includes("feed") ? '<span class="tag tag--feed">On our feed</span>' : "",
        global ? `<span class="tag tag--cat">${it.cat}</span>` : "",
      ].join("");
      return `<li class="dish">
        <div class="dish__top"><span class="dish__name">${highlight(it.n, q)}</span><span class="dish__lead"></span><span class="dish__price">${rupee(it.p)}</span></div>
        <p class="dish__desc">${highlight(it.d, q)}</p>
        ${tags ? `<div class="dish__tags">${tags}</div>` : ""}
        <button class="dish__add" data-n="${esc(it.n)}" data-p="${it.p}" aria-label="Add ${esc(it.n)} to tray">+</button>
      </li>`;
    })
    .join("");
  $("#menuEmpty").hidden = items.length > 0;

  if (animate && gsap && !reduced) {
    gsap.fromTo(introEl.children, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: "expo.out" });
    gsap.fromTo(listEl.children, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.025, ease: "expo.out", clearProps: "transform" });
  }
  ScrollTrigger?.refresh();
}
let searchT;
searchEl.addEventListener("input", () => { clearTimeout(searchT); searchT = setTimeout(() => renderMenu(true), 140); });
sigOnlyEl.addEventListener("change", () => renderMenu(true));
listEl.addEventListener("click", (e) => {
  const b = e.target.closest(".dish__add");
  if (!b) return;
  addToTray(b.dataset.n, +b.dataset.p, b);
});
renderMenu(false);

/* =========================================================
   Tray (WhatsApp order)
   ========================================================= */
let tray = store.get("arabista-tray", []);
const fab = $("#trayFab");
const trayEl = $("#tray");
const scrim = $("#scrim");

function saveTray() { store.set("arabista-tray", tray); renderTray(); }
function addToTray(n, p, btn) {
  const found = tray.find((x) => x.n === n);
  if (found) found.q++;
  else tray.push({ n, p, q: 1 });
  saveTray();
  toast(`Added ${n} to your tray`);
  if (btn?.classList.contains("dish__add")) {
    btn.classList.remove("pop");
    void btn.offsetWidth;
    btn.classList.add("pop");
  }
  fab.classList.remove("bump");
  void fab.offsetWidth;
  fab.classList.add("bump");
  flyToTray(btn);
}
function flyToTray(from) {
  if (!from || !gsap || reduced) return;
  const a = from.getBoundingClientRect();
  const b = fab.getBoundingClientRect();
  const dot = document.createElement("span");
  dot.style.cssText = `position:fixed;z-index:400;left:${a.left + a.width / 2 - 7}px;top:${a.top + a.height / 2 - 7}px;width:14px;height:14px;border-radius:50%;background:#d6b274;pointer-events:none;box-shadow:0 0 18px #d6b274`;
  document.body.appendChild(dot);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  gsap.timeline({ onComplete: () => dot.remove() })
    .to(dot, { x: dx, duration: 0.75, ease: "power1.inOut" })
    .to(dot, { y: dy, duration: 0.75, ease: "back.in(2.2)" }, 0)
    .to(dot, { scale: 0.3, opacity: 0.4, duration: 0.2 }, 0.55);
}
function renderTray() {
  const count = tray.reduce((s, x) => s + x.q, 0);
  const total = tray.reduce((s, x) => s + x.q * x.p, 0);
  $("#trayCount").textContent = count;
  fab.classList.toggle("is-visible", count > 0);
  $("#trayTotal").textContent = rupee(total);
  $("#trayEmpty").hidden = count > 0;
  $("#traySend").disabled = count === 0;
  $("#trayList").innerHTML = tray
    .map((x, i) => `<li class="tray__item">
      <div><b>${esc(x.n)}</b><br /><small>${rupee(x.p)} each</small></div>
      <div class="qty"><button data-i="${i}" data-d="-1" aria-label="Remove one ${esc(x.n)}">−</button><span>${x.q}</span><button data-i="${i}" data-d="1" aria-label="Add one ${esc(x.n)}">+</button></div>
    </li>`)
    .join("");
}
$("#trayList").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-i]");
  if (!b) return;
  const it = tray[+b.dataset.i];
  it.q += +b.dataset.d;
  if (it.q <= 0) tray.splice(+b.dataset.i, 1);
  saveTray();
});
function openTray() {
  trayEl.classList.add("is-open");
  trayEl.setAttribute("aria-hidden", "false");
  fab.setAttribute("aria-expanded", "true");
  scrim.classList.add("is-on");
  lenis?.stop();
  document.body.classList.add("lock");
  $("#trayClose").focus();
}
function closeTray() {
  trayEl.classList.remove("is-open");
  trayEl.setAttribute("aria-hidden", "true");
  fab.setAttribute("aria-expanded", "false");
  scrim.classList.remove("is-on");
  lenis?.start();
  document.body.classList.remove("lock");
}
fab.addEventListener("click", openTray);
$("#trayClose").addEventListener("click", closeTray);
scrim.addEventListener("click", () => { closeTray(); });
addEventListener("keydown", (e) => { if (e.key === "Escape") { closeTray(); closeMobileMenu(); } });
$("#traySend").addEventListener("click", () => {
  const type = $('input[name="otype"]:checked').value;
  const total = tray.reduce((s, x) => s + x.q * x.p, 0);
  const lines = tray.map((x) => `• ${x.q} × ${x.n} — ${rupee(x.q * x.p)}`).join("\n");
  const msg = `Hi Arabista! ☕ I'd like to place a ${type} order:\n\n${lines}\n\nEstimated total: ${rupee(total)}\n\n(Sent from arabista website)`;
  open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
});
renderTray();

let toastT;
function toast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.classList.add("is-on");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("is-on"), 2200);
}

/* =========================================================
   Feed
   ========================================================= */
const POSTS = [
  ["p01-flavors", "DfPSyKFuHlL", "reel", "Good food, great coffee and a little main-character moment."],
  ["p02-grind", "DfHqLwpjmbd", "p", "Brew like an Arabista — six steps to your perfect cup."],
  ["p03-matcha", "DfAObgRuEGl", "reel", "Matcha made us do it. Don't ask questions."],
  ["p04-neon", "De6qJb6jpzD", "p", "Serving Bollywood energy with an Arabista twist."],
  ["p05-dandiya", "DewfmMlz0Ff", "reel", "Masquerade Dandiya Night — a night to remember."],
  ["p06-nightlights", "DeoFHfAufJw", "reel", "A little mystery, a lot of dandiya."],
  ["p07-sipslay", "DejePUPuRT-", "reel", "Three drinks, three moods, one difficult decision."],
  ["p08-thisis", "DeeagVhOe-h", "reel", "Your kind of place, your kind of vibe."],
  ["p09-cappuccino", "DehBBTBE-yd", "p", "Because at Arabista, it's always about YOU."],
  ["p10-open3am", "Deb346To0Lu", "reel", "Garba can wait, but the cravings can't."],
  ["p11-coffeepick", "DeZUSelkyvX", "p", "Latte, Passion Brew or a sweet little Bombón?"],
  ["p12-latte", "DeMW-lnTko7", "p", "Slow down. Sip slowly. Stay a little longer."],
];
const playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="m10 8.5 5 3.5-5 3.5z" fill="#fff"/></svg>';
const igIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="#fff"/></svg>';
$("#feedGrid").innerHTML = POSTS.map(([img, code, kind, cap]) => `
  <a class="post" href="https://www.instagram.com/arabista_in/${kind}/${code}/" target="_blank" rel="noopener" aria-label="${esc(cap)} — open on Instagram">
    <img src="assets/ig/${img}.jpg" alt="" loading="lazy" />${kind === "reel" ? playIcon : igIcon}<span>${esc(cap)}</span>
  </a>`).join("");

/* =========================================================
   Letters — tap support
   ========================================================= */
$$(".letter").forEach((l) => {
  l.addEventListener("click", () => {
    if (finePointer) return;
    const on = l.classList.contains("is-on");
    $$(".letter").forEach((x) => x.classList.remove("is-on"));
    if (!on) l.classList.add("is-on");
  });
  l.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); l.classList.toggle("is-on"); } });
});

/* =========================================================
   Voices slider
   ========================================================= */
const voices = $$(".voice");
const dotsEl = $("#voiceDots");
let vIdx = 0, vTimer;
voices.forEach((_, i) => {
  const b = document.createElement("button");
  b.setAttribute("role", "tab");
  b.setAttribute("aria-label", `Review ${i + 1}`);
  b.addEventListener("click", () => showVoice(i));
  dotsEl.appendChild(b);
});
function showVoice(i) {
  vIdx = i;
  voices.forEach((v, k) => v.classList.toggle("is-active", k === i));
  $$("button", dotsEl).forEach((d, k) => {
    d.setAttribute("aria-selected", "false");
    if (k === i) { void d.offsetWidth; d.setAttribute("aria-selected", "true"); }
  });
  clearTimeout(vTimer);
  vTimer = setTimeout(() => showVoice((vIdx + 1) % voices.length), 5500);
}
showVoice(0);

/* =========================================================
   Open / closed (IST)
   ========================================================= */
function updateStatus() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const h = +parts.find((p) => p.type === "hour").value % 24;
  const m = +parts.find((p) => p.type === "minute").value;
  const mins = h * 60 + m;
  const open = mins >= 9 * 60 && mins < 23 * 60 + 30;
  const soon = open && mins >= 23 * 60;
  const text = open ? (soon ? "Closing soon" : "Open now · till 11:30 PM") : "Closed · opens 9 AM";
  ["#openStatus", "#openStatus2"].forEach((s) => {
    const el = $(s);
    el.classList.toggle("is-open", open);
    el.classList.toggle("is-closed", !open);
    $("b", el).textContent = s === "#openStatus2" ? (open ? "Open now" : "Closed now") : text;
  });
}
updateStatus();
setInterval(updateStatus, 60_000);

/* =========================================================
   Reservation (WhatsApp)
   ========================================================= */
const form = $("#reserveForm");
const timeSel = $("#rTime");
for (let t = 9 * 60; t <= 22 * 60 + 30; t += 30) {
  const h = Math.floor(t / 60), m = t % 60;
  const label = `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  timeSel.add(new Option(label, label, false, t === 19 * 60));
}
const todayIST = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
$("#rDate").min = todayIST;
$("#rDate").value = todayIST;
let guests = 2;
const guestsOut = $("#rGuests");
$$(".stepper button").forEach((b) => b.addEventListener("click", () => {
  const max = form.kind.value === "event" ? 150 : 20;
  guests = Math.min(max, Math.max(1, guests + +b.dataset.step));
  guestsOut.textContent = guests;
}));
function setBookingKind(kind) {
  const r = form.querySelector(`input[name="kind"][value="${kind}"]`);
  if (r) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); }
}
form.addEventListener("change", (e) => {
  if (e.target.name !== "kind") return;
  const ev = form.kind.value === "event";
  $("label[for=rNote]").textContent = ev ? "Tell us about the event" : "Occasion or notes (optional)";
  $("button[type=submit] span", form).textContent = ev ? "Send enquiry on WhatsApp" : "Confirm on WhatsApp";
  if (ev && guests < 10) { guests = 20; guestsOut.textContent = guests; }
  if (!ev && guests > 20) { guests = 20; guestsOut.textContent = guests; }
});
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("#reserveErr");
  err.textContent = "";
  $$(".field", form).forEach((f) => f.classList.remove("invalid"));
  const nameEl = form.elements.guestName;
  const name = nameEl.value.trim();
  const date = form.date.value;
  if (!name) { nameEl.parentElement.classList.add("invalid"); err.textContent = "Please tell us your name."; nameEl.focus(); return; }
  if (!date || date < todayIST) { form.date.parentElement.classList.add("invalid"); err.textContent = "Please pick today or a future date."; return; }
  const nice = new Date(date + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const ev = form.kind.value === "event";
  const msg = [
    `Hi Arabista! ☕ I'd like to ${ev ? "enquire about a private event" : "reserve a table"}.`,
    "",
    `Name: ${name}`,
    `Date: ${nice}`,
    `Time: ${form.time.value}`,
    `Guests: ${guests}`,
    `Seating: ${form.seat.value}`,
    form.note.value.trim() ? `Notes: ${form.note.value.trim()}` : "",
  ].filter((l) => l !== null).join("\n").trim();
  open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  toast("Opening WhatsApp with your booking…");
});

/* =========================================================
   Nav, mobile menu, progress, quickbar
   ========================================================= */
const nav = $("#nav");
const burger = $("#burger");
const mm = $("#mobileMenu");
function closeMobileMenu() {
  if (!mm.classList.contains("is-open")) return;
  mm.classList.remove("is-open");
  mm.setAttribute("aria-hidden", "true");
  burger.setAttribute("aria-expanded", "false");
  lenis?.start();
  document.body.classList.remove("lock");
}
burger.addEventListener("click", () => {
  const open = !mm.classList.contains("is-open");
  if (!open) return closeMobileMenu();
  mm.classList.add("is-open");
  mm.setAttribute("aria-hidden", "false");
  burger.setAttribute("aria-expanded", "true");
  lenis?.stop();
  document.body.classList.add("lock");
});

let lastY = 0;
const bar = $("#progressBar");
const quick = $(".quickbar");
function onScroll() {
  const y = scrollY;
  nav.classList.toggle("is-scrolled", y > 40);
  nav.classList.toggle("is-hidden", y > 400 && y > lastY && !mm.classList.contains("is-open"));
  lastY = y;
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  quick.classList.toggle("is-visible", y > innerHeight * 0.6);
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

const navLinks = $$(".nav__links a");
["signatures", "menu", "ambience", "events", "visit"].forEach((id) => {
  const sec = document.getElementById(id);
  if (!sec || !gsap) return;
  ScrollTrigger.create({
    trigger: sec, start: "top 50%", end: "bottom 50%",
    onToggle: (s) => navLinks.forEach((a) => a.classList.toggle("is-active", s.isActive && a.getAttribute("href") === "#" + id)),
  });
});

/* =========================================================
   Scroll animations
   ========================================================= */
if (gsap && !reduced) {
  $$(".split").forEach((el) => {
    gsap.from($$(".w > span", el), {
      yPercent: 110, rotate: 4, duration: 1.2, stagger: 0.045, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });
  ScrollTrigger.batch($$(".reveal-up").filter((el) => !el.closest(".hero")), {
    start: "top 88%",
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, ease: "expo.out" }),
  });
  $$(".parallax").forEach((el) => {
    const sp = parseFloat(el.dataset.speed || 0.1);
    gsap.fromTo(el, { yPercent: sp * -60 }, { yPercent: sp * 60, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    const img = $("img", el);
    if (img) gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
  });
  $$(".frame").forEach((f) => {
    gsap.fromTo(f, { clipPath: "inset(18% 12% 18% 12% round 22px)" }, {
      clipPath: "inset(0% 0% 0% 0% round 22px)", duration: 1.6, ease: "expo.out",
      scrollTrigger: { trigger: f, start: "top 85%" },
    });
  });
  gsap.from(".letter", {
    y: 80, opacity: 0, rotate: (i) => (i % 2 ? 4 : -4), duration: 1.2, stagger: 0.07, ease: "expo.out",
    scrollTrigger: { trigger: ".letters__grid", start: "top 85%" },
  });
  gsap.from(".sig__stage", {
    scale: 0.88, opacity: 0, duration: 1.4, ease: "expo.out",
    scrollTrigger: { trigger: ".sig", start: "top 70%" },
  });
  gsap.from(".chip", {
    y: 20, opacity: 0, duration: 0.8, stagger: 0.05, ease: "expo.out",
    scrollTrigger: { trigger: ".sig__chips", start: "top 90%" },
  });
  gsap.from(".ev", {
    y: 90, opacity: 0, duration: 1.3, stagger: 0.12, ease: "expo.out",
    scrollTrigger: { trigger: ".events__grid", start: "top 85%" },
  });
  gsap.from(".events__tags li", {
    y: 20, opacity: 0, duration: 0.8, stagger: 0.05, ease: "expo.out",
    scrollTrigger: { trigger: ".events__tags", start: "top 92%" },
  });
  gsap.from(".post", {
    y: 60, opacity: 0, scale: 0.94, duration: 1.1, stagger: { each: 0.05, from: "random" }, ease: "expo.out",
    scrollTrigger: { trigger: ".feed__grid", start: "top 85%" },
  });
  gsap.from(".visit__list > div", {
    x: -30, opacity: 0, duration: 1, stagger: 0.08, ease: "expo.out",
    scrollTrigger: { trigger: ".visit__list", start: "top 85%" },
  });
  gsap.from(".reserve", {
    y: 80, opacity: 0, duration: 1.3, ease: "expo.out",
    scrollTrigger: { trigger: ".reserve", start: "top 90%" },
  });
  gsap.from(".footer__word", {
    yPercent: 40, opacity: 0, duration: 1.6, ease: "expo.out",
    scrollTrigger: { trigger: ".footer__word", start: "top 95%" },
  });
  gsap.to(".marquee__track", {
    xPercent: -12, ease: "none",
    scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: true },
  });

  // Ambience: pinned horizontal scroll on larger screens
  const mm2 = gsap.matchMedia();
  mm2.add("(min-width: 861px)", () => {
    const track = $("#ambTrack");
    const dist = () => track.scrollWidth - innerWidth;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: ".amb", pin: ".amb__pin", start: "top top", end: () => "+=" + dist(), scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
    });
    $$(".amb__card img").forEach((img) => {
      gsap.fromTo(img, { xPercent: -8 }, {
        xPercent: 8, ease: "none",
        scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
      });
    });
  });
} else {
  $$(".reveal-up").forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; });
}

/* =========================================================
   Pointer niceties (desktop only)
   ========================================================= */
if (finePointer && !reduced) {
  document.body.classList.add("has-cursor");
  const cursor = $(".cursor");
  const dot = $(".cursor__dot");
  const ring = $(".cursor__ring");
  const label = $("em", ring);
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener("pointermove", (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
  }, { passive: true });
  (function loop() {
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener("pointerover", (e) => {
    const t = e.target;
    cursor.classList.remove("is-hover", "is-drag", "is-view");
    if (t.closest("canvas")) { cursor.classList.add("is-drag"); label.textContent = "Drag"; }
    else if (t.closest(".post, .amb__card")) { cursor.classList.add("is-view"); label.textContent = "View"; }
    else if (t.closest("a, button, .letter, label, select, input")) cursor.classList.add("is-hover");
  });
  document.addEventListener("pointerleave", () => cursor.style.opacity = 0);
  document.addEventListener("pointerenter", () => cursor.style.opacity = 1);

  $$(".magnetic").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });

  $$(".tilt").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
}

addEventListener("load", () => ScrollTrigger?.refresh());
