/* Геоквест ХНУ: станції AR, селфі-режим і прогрес гри */
const STATIONS = {
  kamin:  { n: 1, file: "kamin",  title: "Граніт у темних окулярах", slogan: ["У інших — граніт науки,", "у нас — вапняк"],
            fact: "Граніт має твердість 6–7 за шкалою Мооса, вапняк — лише 3." },
  dino:   { n: 2, file: "dino",   title: "Скелет тиранозавра", slogan: ["66 мільйонів років", "чекав на селфі з тобою"],
            fact: "Тиранозаври жили 68–66 млн років тому, наприкінці крейдового періоду." },
  vyshka: { n: 3, file: "vyshka", title: "Бурова вишка", slogan: ["Буримо глибше", "за інших"],
            fact: "Газові свердловини в Україні сягають глибини понад 6 км." },
  amonit: { n: 4, file: "amonit", title: "Амоніт", slogan: ["Старший за динозаврів", "і досі в тренді"],
            fact: "Амоніти жили в морях 400–66 млн років тому й вимерли разом із динозаврами." },
  kvarts: { n: 5, file: "kvarts", title: "Кристали кварцу", slogan: ["7 за Моосом —", "тверде рішення"],
            fact: "Кварц дряпає скло. Фіолетовий кварц називають аметистом." }
};
const ORDER = ["kamin", "dino", "vyshka", "amonit", "kvarts"];
const PAGES = { kamin: "./", dino: "dino.html", vyshka: "vyshka.html", amonit: "amonit.html", kvarts: "kvarts.html" };
const SITE = "geology.univer.kharkov.ua";

/* ---------- progress ---------- */
const KEY = "geoquest-v1";
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  if (!s || typeof s !== "object") s = {};
  s.found = s.found || {};
  if (!s.id) s.id = Math.random().toString(36).slice(2, 8).toUpperCase();
  return s;
}
function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
function count(s) { return ORDER.filter(k => s.found[k]).length; }
function collect(slug) {
  const s = load();
  const fresh = !s.found[slug];
  if (fresh) { s.found[slug] = Date.now(); save(s); }
  renderDots(slug);
  showToast(fresh, count(s));
}
function renderDots(here) {
  const box = document.querySelector(".dots"); if (!box) return;
  const s = load();
  box.innerHTML = ORDER.map(k => `<i class="${s.found[k] ? "on" : ""} ${k === here ? "here" : ""}" title="${STATIONS[k].title}"></i>`).join("");
}
function showToast(fresh, n) {
  const t = document.getElementById("toast"); if (!t) return;
  t.hidden = false;
  t.innerHTML = n >= 5
    ? `<b>Усі 5 знахідок зібрано!</b> <a href="quest.html">Відкрий свій приз →</a>`
    : `<b>${fresh ? "Знахідку зараховано!" : "Ця знахідка вже є."}</b> Зібрано ${n} з 5. <a href="quest.html">Мій прогрес →</a>`;
}

/* ---------- station page ---------- */
function initStation() {
  const slug = document.body.dataset.station; if (!slug) return;
  const st = STATIONS[slug];
  document.getElementById("stn").textContent = `Станція ${st.n} з 5`;
  renderDots(slug);
  const s = load(); if (s.found[slug]) showToast(false, count(s));
  const mv = document.getElementById("mv");
  const arBtn = document.getElementById("arBtn");
  arBtn.addEventListener("click", () => {
    if (mv.canActivateAR) { mv.activateAR(); setTimeout(() => collect(slug), 600); }
    else document.getElementById("noAR").hidden = false;
  });
  document.getElementById("selfieBtn").addEventListener("click", () => openSelfie(slug));
}

/* ---------- selfie ---------- */
let stream = null, facing = "user";
async function startCam() {
  const v = document.getElementById("cam");
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
  v.srcObject = stream; v.classList.toggle("mirror", facing === "user");
  await v.play();
}
async function openSelfie(slug) {
  const st = STATIONS[slug];
  const ov = document.getElementById("selfie");
  ov.hidden = false;
  document.querySelector("main").hidden = true;
  const slot = document.getElementById("mvSlot");
  const old = document.getElementById("mvSelfie"); if (old) old.remove();
  const m = document.createElement("model-viewer");
  m.id = "mvSelfie"; m.src = slot.dataset.src; m.alt = slot.dataset.alt;
  m.setAttribute("camera-controls", ""); m.setAttribute("interaction-prompt", "none");
  m.setAttribute("camera-orbit", "-20deg 80deg auto"); m.setAttribute("exposure", "1.1");
  slot.after(m);
  document.getElementById("selfieSlogan").textContent = st.slogan.join(" ");
  const err = document.getElementById("camErr"); err.hidden = true;
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("nocam");
    await startCam();
  } catch (e) {
    err.hidden = false;
    err.textContent = "Камера недоступна. Дозвольте доступ до камери для цього сайту в налаштуваннях браузера і спробуйте ще раз.";
  }
}
function closeSelfie() {
  document.getElementById("selfie").hidden = true;
  document.querySelector("main").hidden = false;
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  const m = document.getElementById("mvSelfie"); if (m) m.remove();
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function shoot(slug) {
  const st = STATIONS[slug];
  const cnt = document.getElementById("count");
  for (const n of [3, 2, 1]) { cnt.textContent = n; await sleep(800); }
  cnt.textContent = "";
  const shot = document.querySelector(".shot");
  const v = document.getElementById("cam"), mv = document.getElementById("mvSelfie");
  const R = shot.getBoundingClientRect();
  const scale = Math.min(2.5, 1440 / R.width);
  const W = Math.round(R.width * scale), H = Math.round(R.height * scale);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#0e1411"; g.fillRect(0, 0, W, H);
  // camera, cover-fit, mirrored for the front camera
  if (v.videoWidth) {
    const k = Math.max(W / v.videoWidth, H / v.videoHeight);
    const dw = v.videoWidth * k, dh = v.videoHeight * k;
    g.save();
    if (facing === "user") { g.translate(W, 0); g.scale(-1, 1); }
    g.drawImage(v, (W - dw) / 2, (H - dh) / 2, dw, dh);
    g.restore();
  }
  // 3D model: copy exactly what is on screen from the viewer's own canvas
  try {
    const M = mv.getBoundingClientRect();
    const cv = mv.shadowRoot && (mv.shadowRoot.querySelector("canvas.show") || mv.shadowRoot.querySelector("canvas"));
    g.save();
    g.beginPath(); g.rect((M.left - R.left) * scale, (M.top - R.top) * scale, M.width * scale, M.height * scale); g.clip();
    if (cv && cv.width) {
      const C = cv.getBoundingClientRect();
      g.drawImage(cv, (C.left - R.left) * scale, (C.top - R.top) * scale, C.width * scale, C.height * scale);
    } else {
      const img = await createImageBitmap(await mv.toBlob({ mimeType: "image/png" }));
      g.drawImage(img, (M.left - R.left) * scale, (M.top - R.top) * scale, M.width * scale, M.height * scale);
    }
    g.restore();
  } catch (e) {}
  // frame
  await document.fonts.ready;
  const topH = 52 * scale;
  g.fillStyle = "rgba(14,20,17,.55)"; g.fillRect(0, 0, W, topH);
  g.font = `600 ${15 * scale}px Unbounded, sans-serif`; g.textBaseline = "middle";
  g.fillStyle = "#fff"; g.fillText("Геоквест", 16 * scale, topH / 2);
  const w1 = g.measureText("Геоквест ").width;
  g.fillStyle = "#b9f46b"; g.fillText("ХНУ", 16 * scale + w1, topH / 2);
  const bh = 84 * scale;
  g.fillStyle = "#5fe0e6"; g.fillRect(0, H - bh, W, bh);
  g.fillStyle = "#10201a";
  let fs = 17 * scale; const line = st.slogan.join(" ");
  g.font = `600 ${fs}px Unbounded, sans-serif`;
  while (g.measureText(line).width > W - 32 * scale && fs > 9 * scale) { fs -= scale; g.font = `600 ${fs}px Unbounded, sans-serif`; }
  g.textBaseline = "alphabetic";
  g.fillText(line, 16 * scale, H - bh + 36 * scale);
  g.font = `500 ${13 * scale}px "Golos Text", sans-serif`;
  g.fillText(`Кафедра фундаментальної та прикладної геології ХНУ · ${SITE}`, 16 * scale, H - bh + 62 * scale, W - 32 * scale);
  // show result
  const url = c.toDataURL("image/jpeg", 0.92);
  const out = document.getElementById("result");
  document.getElementById("resImg").src = url;
  out.hidden = false;
  out.dataset.url = url;
  collect(slug);
}
async function shareResult(slug) {
  const url = document.getElementById("result").dataset.url;
  const blob = await (await fetch(url)).blob();
  const file = new File([blob], `geoquest-${slug}.jpg`, { type: "image/jpeg" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "Геоквест ХНУ" }); return; } catch (e) { if (e.name === "AbortError") return; }
  }
  const a = document.createElement("a"); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
}
function initSelfie() {
  const slug = document.body.dataset.station; if (!slug) return;
  document.getElementById("closeSelfie").onclick = closeSelfie;
  document.getElementById("flip").onclick = async () => { facing = facing === "user" ? "environment" : "user"; try { await startCam(); } catch (e) {} };
  document.getElementById("shutter").onclick = () => shoot(slug);
  document.getElementById("again").onclick = () => { document.getElementById("result").hidden = true; };
  document.getElementById("done").onclick = () => { document.getElementById("result").hidden = true; closeSelfie(); };
  document.getElementById("save").onclick = () => shareResult(slug);
}

/* ---------- quest page ---------- */
function initQuest() {
  const list = document.getElementById("list"); if (!list) return;
  const s = load(), n = count(s);
  list.innerHTML = ORDER.map(k => {
    const st = STATIONS[k], on = !!s.found[k];
    return `<div class="item ${on ? "on" : ""}"><div class="n">${on ? "✓" : st.n}</div>
      <div><h3>${st.title}</h3><p>${on ? "Знайдено" : "Шукай QR-код і зроби фото"}</p></div>
      <span class="st">${on ? '<a href="' + PAGES[k] + '">відкрити</a>' : ""}</span></div>`;
  }).join("");
  document.getElementById("nfound").textContent = `${n} з 5`;
  document.querySelector(".meter i").style.width = (n / 5 * 100) + "%";
  if (n >= 5) {
    const p = document.getElementById("prize"); p.hidden = false;
    document.getElementById("code").textContent = "GEO-" + s.id;
    const tick = () => { document.getElementById("clock").textContent = new Date().toLocaleTimeString("uk-UA"); };
    tick(); setInterval(tick, 1000);
    const claimed = document.getElementById("claimed"), hold = document.getElementById("hold");
    const showClaimed = () => { hold.hidden = true; claimed.hidden = false;
      claimed.textContent = "Наліпку видано " + new Date(s.claimed).toLocaleString("uk-UA", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "long" }); };
    if (s.claimed) showClaimed();
    let t0 = 0, raf = 0;
    const bar = hold.querySelector("i");
    const step = () => { const k = Math.min(1, (performance.now() - t0) / 1500); bar.style.width = k * 100 + "%";
      if (k >= 1) { const ss = load(); ss.claimed = Date.now(); save(ss); s.claimed = ss.claimed; showClaimed(); return; } raf = requestAnimationFrame(step); };
    const down = e => { e.preventDefault(); t0 = performance.now(); raf = requestAnimationFrame(step); };
    const up = () => { cancelAnimationFrame(raf); bar.style.width = "0"; };
    hold.addEventListener("pointerdown", down); ["pointerup", "pointerleave", "pointercancel"].forEach(ev => hold.addEventListener(ev, up));
  }
}

document.addEventListener("DOMContentLoaded", () => { initStation(); initSelfie(); initQuest(); });
