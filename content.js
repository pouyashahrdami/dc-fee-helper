const api = (path) =>
  new Promise((resolve, reject) =>
    chrome.runtime.sendMessage({ path }, (res) =>
      !res || res.error ? reject(new Error(res?.error ?? "no response")) : resolve(res.data)
    )
  );

const money = (n) => (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (s, k) => Number(s[k] || 0);
const total = (s) => ["TUITION", "DC_ANCILLARY", "DCSI_ANCILLARY", "PROGRAM_FEE", "COOP_FEE"].reduce((a, k) => a + num(s, k), 0);

const LINES = [
  ["Tuition", "TUITION"],
  ["Ancillary fees", "DC_ANCILLARY"],
  ["Student association", "DCSI_ANCILLARY"],
  ["Program fee", "PROGRAM_FEE"],
  ["Co-op fee", "COOP_FEE"],
];

// Account Summary is an Angular SPA: wait until the balance text exists.
function readBalance() {
  const m = document.body.innerText.match(/Account Balance\s*(\(?)(-?)\$(-?)([\d,]+\.\d\d)/);
  return m ? (m[1] || m[2] || m[3] ? -1 : 1) * Number(m[4].replace(/,/g, "")) : null;
}

const CSS = `
:host { all: initial; }
* { box-sizing: border-box; }
/* THEME: change these colors to re-theme the whole panel */
.card { --brand: #00573f; --accent: #0a7a58; --tint: #eaf6f1; --track: #eef3f0; --track-hover: #e0ebe5;
  position: fixed; top: 72px; right: 20px; z-index: 2147483647; width: 320px;
  font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; color: #1c2b25;
  background: #fff; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,40,28,.22), 0 0 0 1px rgba(0,87,63,.12); max-height: calc(100vh - 16px); overflow: auto; }
.head { display: flex; align-items: center; gap: 8px; cursor: grab; user-select: none; touch-action: none; padding: 10px 14px;
  background: linear-gradient(135deg, var(--brand), var(--accent)); color: #fff; font-weight: 600; letter-spacing: .2px; }
.head img { width: 22px; height: 22px; border-radius: 6px; }
.head span { flex: 1; }
.head button { all: unset; cursor: pointer; width: 22px; height: 22px; text-align: center; border-radius: 6px; font-size: 16px; line-height: 22px; }
.head button:hover { background: rgba(255,255,255,.2); }
.body { padding: 14px; }
.card.min .body, .card.min .foot { display: none; }
.field { margin-bottom: 12px; }
.label { display: block; margin: 0 0 5px 2px; color: #6b7d75; font-size: 10.5px; font-weight: 600; letter-spacing: .7px; text-transform: uppercase; }
.seg { display: flex; padding: 3px; gap: 2px; background: var(--track); border-radius: 10px; }
.seg button, .chips button { all: unset; box-sizing: border-box; cursor: pointer; text-align: center; color: #4d5f57; font-weight: 500;
  transition: background .12s, color .12s, box-shadow .12s; }
.seg button { flex: 1; padding: 6px 4px; border-radius: 7px; }
.seg button:hover:not(.on) { color: var(--brand); }
.seg button.on { background: #fff; color: var(--brand); font-weight: 600; box-shadow: 0 1px 3px rgba(0,40,28,.18); }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chips button { min-width: 34px; padding: 5px 10px; border-radius: 999px; background: var(--track); }
.chips button:hover:not(.on) { background: var(--track-hover); color: var(--brand); }
.chips button.on { background: var(--brand); color: #fff; font-weight: 600; }
.seg button:focus-visible, .chips button:focus-visible, .opt:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.hint { margin-top: 6px; color: #6b7d75; font-size: 11.5px; }
.combo input { width: 100%; padding: 9px 12px; border: 1px solid #d5dfda; border-radius: 10px; background: #f7faf9 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='%236b7d75' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='6' cy='6' r='4.5'/%3E%3Cpath d='M9.5 9.5L13 13'/%3E%3C/svg%3E") no-repeat 11px 50%;
  padding-left: 32px; font: inherit; color: inherit; text-overflow: ellipsis; transition: border-color .12s, box-shadow .12s; }
.combo input::placeholder { color: #8a9a93; }
.combo input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(10,122,88,.15); background-color: #fff; }
.list { margin-top: 6px; max-height: 190px; overflow: auto; border: 1px solid #e1e9e5; border-radius: 10px; background: #fff; padding: 4px; }
.opt { all: unset; box-sizing: border-box; display: block; width: 100%; padding: 7px 9px; border-radius: 7px; cursor: pointer; color: #1c2b25; }
.opt.act { background: var(--tint); color: var(--brand); }
.opt mark { background: none; color: var(--brand); font-weight: 700; }
.empty { padding: 10px; color: #6b7d75; text-align: center; }
.lines { margin: 4px 0 10px; border-top: 1px solid #e8eeeb; padding-top: 8px; }
.line { display: flex; justify-content: space-between; padding: 2px 0; color: #4d5f57; }
.line.sum { color: #1c2b25; font-weight: 600; border-top: 1px dashed #d5dfda; margin-top: 4px; padding-top: 6px; }
.credit { color: var(--accent); font-weight: 600; }
.due { margin-top: 10px; padding: 12px; border-radius: 10px; background: var(--tint); text-align: center; }
.due small { display: block; color: #4d5f57; text-transform: uppercase; letter-spacing: .6px; font-size: 10.5px; }
.due strong { display: block; font-size: 26px; color: var(--brand); margin-top: 2px; }
.due.paid strong { color: var(--accent); }
.msg { color: #8a4b00; }
.link { display: block; margin-top: 10px; text-align: center; color: var(--brand); font-weight: 600; text-decoration: none; padding: 8px; border-radius: 8px; border: 1px solid #d5e5dd; transition: background .12s; }
.link:hover { background: #eef6f2; }
.link:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.foot { padding: 0 14px 12px; color: #8a9a93; font-size: 10.5px; }
`;

function el(tag, props = {}, ...kids) {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids);
  return e;
}

// Button group; `cls` is "seg" (2-3 options, equal width) or "chips" (many small options).
function choice(cls, options, value, onchange) {
  const g = el("div", { className: cls, role: "radiogroup" });
  for (const [v, label] of options)
    g.append(el("button", { type: "button", role: "radio", textContent: label, className: v === value ? "on" : "", ariaChecked: String(v === value), onclick: () => onchange(v) }));
  return g;
}

// Searchable program picker: ~200 programs are unusable in a native dropdown.
function combobox(programs, value, onpick) {
  const current = programs.find(([c]) => c.toLowerCase() === value)?.[1] ?? "";
  const input = el("input", { type: "text", placeholder: "Search your program…", value: current, autocomplete: "off", spellcheck: false });
  const list = el("div", { className: "list", hidden: true });
  let shown = [], act = 0;
  const hi = (name, q) => {
    const i = q ? name.toLowerCase().indexOf(q) : -1;
    return i < 0 ? [name] : [name.slice(0, i), el("mark", { textContent: name.slice(i, i + q.length) }), name.slice(i + q.length)];
  };
  const fill = (raw) => {
    const q = raw.trim().toLowerCase();
    shown = programs.filter(([, n]) => n.toLowerCase().includes(q))
      .sort((a, b) => b[1].toLowerCase().startsWith(q) - a[1].toLowerCase().startsWith(q)) // prefix matches first; sort is stable
      .slice(0, 80);
    act = 0;
    list.replaceChildren(...(shown.length
      ? shown.map(([c, n], i) => {
          const b = el("button", { type: "button", className: "opt" + (i === 0 ? " act" : ""), onmousedown: (e) => { e.preventDefault(); onpick(c.toLowerCase()); } });
          b.append(...hi(n, q));
          return b;
        })
      : [el("div", { className: "empty", textContent: "No program matches" })]));
  };
  const move = (d) => {
    const opts = list.querySelectorAll(".opt");
    if (!opts.length) return;
    opts[act].classList.remove("act");
    act = (act + d + opts.length) % opts.length;
    opts[act].classList.add("act");
    opts[act].scrollIntoView({ block: "nearest" });
  };
  input.addEventListener("focus", () => { input.select(); fill(""); list.hidden = false; });
  input.addEventListener("input", () => fill(input.value));
  input.addEventListener("blur", () => { list.hidden = true; input.value = current; });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter" && shown[act]) { e.preventDefault(); onpick(shown[act][0].toLowerCase()); }
    else if (e.key === "Escape") input.blur();
  });
  return el("div", { className: "combo" }, input, list);
}

const field = (label, ...kids) => el("div", { className: "field" }, el("span", { className: "label", textContent: label }), ...kids);

const row = (label, value, cls = "") => el("div", { className: "line " + cls }, el("span", { textContent: label }), el("span", { textContent: value }));

async function mount(initial) {
  let balance = initial;
  const state = await chrome.storage.local.get({ program: "", residence: "domestic", start: "fall", sem: "", min: false, x: null, y: null });
  const host = el("div", { id: "dc-fee-helper" });
  const root = host.attachShadow({ mode: "open" });
  const card = el("div", { className: "card" });
  const collapse = el("button", { title: "Collapse", onclick: () => { state.min = !state.min; collapse.textContent = state.min ? "+" : "–"; card.classList.toggle("min", state.min); reclamp(); chrome.storage.local.set({ min: state.min }); } });
  const controls = el("div");
  const result = el("div");
  card.classList.toggle("min", state.min);
  collapse.textContent = state.min ? "+" : "–";
  const head = el("div", { className: "head" }, el("img", { src: chrome.runtime.getURL("icons/icon48.png"), alt: "" }), el("span", { textContent: "DC Fee Helper" }), collapse);
  card.append(
    head,
    el("div", { className: "body" }, controls, result),
    el("div", { className: "foot", textContent: "Unofficial. Estimates only: your account is always correct." })
  );
  root.append(el("style", { textContent: CSS }), card);
  document.body.append(host);

  // Drag by the header; keep the card inside the viewport and remember where it was left.
  const place = (x, y) => {
    state.x = Math.min(Math.max(0, x), window.innerWidth - card.offsetWidth);
    state.y = Math.min(Math.max(0, y), window.innerHeight - card.offsetHeight);
    Object.assign(card.style, { left: state.x + "px", top: state.y + "px", right: "auto" });
  };
  if (state.x !== null) place(state.x, state.y);
  const reclamp = () => state.x !== null && place(state.x, state.y);
  window.addEventListener("resize", reclamp);
  head.addEventListener("pointerdown", (e) => {
    if (e.target === collapse || e.button !== 0) return;
    const dx = e.clientX - card.offsetLeft, dy = e.clientY - card.offsetTop;
    head.setPointerCapture(e.pointerId);
    head.style.cursor = "grabbing";
    const move = (m) => place(m.clientX - dx, m.clientY - dy);
    const up = () => {
      head.removeEventListener("pointermove", move);
      head.removeEventListener("lostpointercapture", up);
      head.style.cursor = "";
      chrome.storage.local.set({ x: state.x, y: state.y });
    };
    head.addEventListener("pointermove", move);
    head.addEventListener("lostpointercapture", up);
  });

  let programs;
  try {
    programs = Object.entries(await api("programs")).sort((a, b) => a[1].localeCompare(b[1]));
  } catch (e) {
    result.append(el("div", { className: "msg", textContent: "Could not load programs: " + e.message + ". Refresh the page to retry." }));
    return;
  }
  if (!programs.some(([c]) => c.toLowerCase() === state.program)) state.program = "";
  const save = () => { chrome.storage.local.set(state); render(); };

  let renderId = 0;
  async function render() {
    const my = ++renderId;
    controls.replaceChildren(
      field("Program", combobox(programs, state.program, (v) => { state.program = v; state.sem = ""; save(); })),
      field("Tuition", choice("seg", [["domestic", "Domestic"], ["international", "International"]], state.residence, (v) => { state.residence = v; save(); })),
      field("Year of study starts in", choice("seg", [["fall", "Fall"], ["winter", "Winter"], ["spring", "Spring"]], state.start, (v) => { state.start = v; save(); }))
    );
    result.replaceChildren();
    if (!state.program) return;
    let years;
    try {
      years = await api(`program/${state.program}/${state.start}/${state.residence}`);
    } catch (e) {
      if (my !== renderId) return;
      result.append(el("div", { className: "msg", textContent: "Could not load fees: " + e.message }));
      return;
    }
    if (my !== renderId) return; // a newer render started while we were fetching
    const sems = Object.values(years).flat(); // API order is already correct; labels can be "5i", "w", "c"
    if (!sems.length) {
      const others = ["fall", "winter", "spring"].filter((t) => t !== state.start);
      const found = await Promise.all(others.map((t) => api(`program/${state.program}/${t}/${state.residence}`).then((y) => (Object.values(y).flat().length ? t : null)).catch(() => null)));
      if (my !== renderId) return;
      const ok = found.filter(Boolean).map((t) => t[0].toUpperCase() + t.slice(1));
      result.append(el("div", { className: "msg", textContent: `Not offered with a ${state.start} start.` + (ok.length ? ` Try: ${ok.join(" or ")}.` : " Try the other tuition type.") }));
      return;
    }
    if (!sems.some((s) => s.SEMESTER === state.sem)) state.sem = sems[0].SEMESTER;
    const sem = sems.find((s) => s.SEMESTER === state.sem);
    const due = Math.max(0, total(sem) + balance); // negative balance = credit, so adding it reduces what's owed
    result.append(
      field("Semester",
        choice("chips", sems.map((s) => [s.SEMESTER, s.SEMESTER]), state.sem, (v) => { state.sem = v; save(); }),
        el("div", { className: "hint", textContent: sem.DUE_DATE })),
      el("div", { className: "lines" },
        ...LINES.filter(([, k]) => num(sem, k) > 0).map(([label, k]) => row(label, money(num(sem, k)))),
        row("Semester total", money(total(sem)), "sum"),
        row(balance < 0 ? "Credit in your account" : "Already owing", money(Math.abs(balance)), balance < 0 ? "credit" : "")
      ),
      el("div", { className: "due" + (due === 0 ? " paid" : "") },
        el("small", { textContent: due === 0 ? "Covered by your credit" : "Still to pay" }),
        el("strong", { textContent: money(due) })
      ),
      // Estimator deep link; last segment is the semester number, 0 = overview ("5i"-style labels fall back to overview).
      el("a", { className: "link", target: "_blank", rel: "noopener", textContent: "Open in official estimator ↗",
        href: `https://durhamcollege.ca/program-fee-estimator/program/${state.program}/${state.residence}/${state.start}/${/^\d+$/.test(sem.SEMESTER) ? sem.SEMESTER : 0}` })
    );
  }
  render();
  return (b) => { if (b !== balance) { balance = b; render(); } };
}

// The SPA can repaint the balance (placeholder first, new value after a payment), so keep reading it.
let update = null, lastRead = null, mounting = false;
setInterval(() => {
  const onSummary = location.href.includes("accountSummary");
  document.getElementById("dc-fee-helper")?.style.setProperty("display", onSummary ? "" : "none");
  if (!onSummary) return;
  const b = readBalance();
  if (b === null) return;
  if (update) return update(b);
  if (b !== lastRead) { lastRead = b; return; } // wait for two equal reads so a placeholder $0.00 isn't used
  if (mounting) return;
  mounting = true;
  mount(b).then((u) => { update = u; }).catch((e) => { mounting = false; console.error("DC Fee Helper:", e); });
}, 1000);
