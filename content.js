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
  const m = document.body.innerText.match(/Account Balance\s*(-?)\$([\d,]+\.\d\d)/);
  return m ? (m[1] ? -1 : 1) * Number(m[2].replace(/,/g, "")) : null;
}

const CSS = `
:host { all: initial; }
* { box-sizing: border-box; }
.card { position: fixed; top: 72px; right: 20px; z-index: 2147483647; width: 320px;
  font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; color: #1c2b25;
  background: #fff; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,40,28,.22), 0 0 0 1px rgba(0,87,63,.12); overflow: hidden; }
.head { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px;
  background: linear-gradient(135deg, #00573f, #0a7a58); color: #fff; font-weight: 600; letter-spacing: .2px; }
.head button { all: unset; cursor: pointer; width: 22px; height: 22px; text-align: center; border-radius: 6px; font-size: 16px; line-height: 22px; }
.head button:hover { background: rgba(255,255,255,.2); }
.body { padding: 14px; }
.card.min .body { display: none; }
.row { display: flex; gap: 8px; margin-bottom: 8px; }
select { flex: 1; min-width: 0; width: 100%; padding: 8px 10px; border: 1px solid #d5dfda; border-radius: 8px; background: #f7faf9;
  font: inherit; color: inherit; margin-bottom: 8px; }
.row select { margin-bottom: 0; }
select:focus { outline: 2px solid #0a7a58; outline-offset: 1px; }
.lines { margin: 4px 0 10px; border-top: 1px solid #e8eeeb; padding-top: 8px; }
.line { display: flex; justify-content: space-between; padding: 2px 0; color: #4d5f57; }
.line.sum { color: #1c2b25; font-weight: 600; border-top: 1px dashed #d5dfda; margin-top: 4px; padding-top: 6px; }
.credit { color: #0a7a58; font-weight: 600; }
.due { margin-top: 10px; padding: 12px; border-radius: 10px; background: #eaf6f1; text-align: center; }
.due small { display: block; color: #4d5f57; text-transform: uppercase; letter-spacing: .6px; font-size: 10.5px; }
.due strong { display: block; font-size: 26px; color: #00573f; margin-top: 2px; }
.due.paid strong { color: #0a7a58; }
.msg { color: #8a4b00; }
.foot { padding: 0 14px 12px; color: #8a9a93; font-size: 10.5px; }
`;

function el(tag, props = {}, ...kids) {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids);
  return e;
}

function select(options, value, onchange) {
  const s = el("select", { onchange: () => onchange(s.value) });
  for (const [v, label] of options) s.append(el("option", { value: v, textContent: label, selected: v === value }));
  return s;
}

const row = (label, value, cls = "") => el("div", { className: "line " + cls }, el("span", { textContent: label }), el("span", { textContent: value }));

async function mount(balance) {
  const state = await chrome.storage.local.get({ program: "", residence: "domestic", start: "fall", sem: "", min: false });
  const host = el("div");
  const root = host.attachShadow({ mode: "open" });
  const card = el("div", { className: "card" });
  const collapse = el("button", { title: "Collapse", onclick: () => { state.min = !state.min; collapse.textContent = state.min ? "+" : "–"; card.classList.toggle("min", state.min); chrome.storage.local.set({ min: state.min }); } });
  const controls = el("div");
  const result = el("div");
  card.classList.toggle("min", state.min);
  collapse.textContent = state.min ? "+" : "–";
  card.append(
    el("div", { className: "head" }, el("span", { textContent: "DC Fee Helper" }), collapse),
    el("div", { className: "body" }, controls, result),
    el("div", { className: "foot", textContent: "Unofficial. Estimates only: your account is always correct." })
  );
  root.append(el("style", { textContent: CSS }), card);
  document.body.append(host);

  const programs = Object.entries(await api("programs")).sort((a, b) => a[1].localeCompare(b[1]));
  const save = () => { chrome.storage.local.set(state); render(); };

  async function render() {
    controls.replaceChildren(
      select([["", "Pick your program…"], ...programs.map(([c, n]) => [c.toLowerCase(), n])], state.program, (v) => { state.program = v; state.sem = ""; save(); }),
      el("div", { className: "row" },
        select([["domestic", "Domestic"], ["international", "International"]], state.residence, (v) => { state.residence = v; save(); }),
        select([["fall", "Year starts Fall"], ["winter", "Year starts Winter"], ["spring", "Year starts Spring"]], state.start, (v) => { state.start = v; save(); })
      )
    );
    result.replaceChildren();
    if (!state.program) return;
    let years;
    try {
      years = await api(`program/${state.program}/${state.start}/${state.residence}`);
    } catch (e) {
      result.append(el("div", { className: "msg", textContent: "Could not load fees: " + e.message }));
      return;
    }
    const sems = Object.values(years).flat().sort((a, b) => a.SEMESTER - b.SEMESTER);
    if (!sems.length) { result.append(el("div", { className: "msg", textContent: "No fees for that combination." })); return; }
    if (!sems.some((s) => s.SEMESTER === state.sem)) state.sem = sems[0].SEMESTER;
    const sem = sems.find((s) => s.SEMESTER === state.sem);
    const due = Math.max(0, total(sem) + balance); // negative balance = credit, so adding it reduces what's owed
    result.append(
      select(sems.map((s) => [s.SEMESTER, `Semester ${s.SEMESTER} · ${s.DUE_DATE}`]), state.sem, (v) => { state.sem = v; save(); }),
      el("div", { className: "lines" },
        ...LINES.filter(([, k]) => num(sem, k) > 0).map(([label, k]) => row(label, money(num(sem, k)))),
        row("Semester total", money(total(sem)), "sum"),
        row(balance < 0 ? "Credit in your account" : "Already owing", money(Math.abs(balance)), balance < 0 ? "credit" : "")
      ),
      el("div", { className: "due" + (due === 0 ? " paid" : "") },
        el("small", { textContent: due === 0 ? "Covered by your credit" : "Still to pay" }),
        el("strong", { textContent: money(due) })
      )
    );
  }
  render();
}

const timer = setInterval(() => {
  const balance = readBalance();
  if (balance === null) return;
  clearInterval(timer);
  mount(balance).catch((e) => console.error("DC Fee Helper:", e));
}, 500);
