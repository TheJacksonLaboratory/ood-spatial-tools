/**
 * form.js — DIANNE JupyterLab OOD form enhancement
 *
 * Layout:
 *   Row 1 — Partition | QOS | Memory
 *   Row 2 — Cores slider | Hours slider
 *   Row 3 — Email toggle + Launch button
 *   Row 4 — Notebook preset buttons (Histology / Xenium / Visium)
 */
(function () {
  "use strict";

  const ID = {
    notebookDir: "batch_connect_session_context_custom_notebook_dir",
    numCores:    "batch_connect_session_context_num_cores",
    numHours:    "batch_connect_session_context_bc_num_hours",
    memtask:     "batch_connect_session_context_memtask",
    partition:   "batch_connect_session_context_partition",
    qos:         "batch_connect_session_context_custom_qos",
    email:       "batch_connect_session_context_bc_email_on_started",
  };

  const MC = "#3975ae", GC = "#383b40", WC = "#fff";

  const style = document.createElement("style");
  style.textContent = `
    .df-row   { display:flex; gap:20px; align-items:flex-start; margin-bottom:16px; }
    .df-row > .df-col { flex:1; min-width:0; }
    .df-row-3 { display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap; margin-bottom:16px; }
    .df-row-3 > .df-col { flex:1; min-width:100px; }
    .df-label { font-size:13px; font-weight:600; color:${GC}; margin-bottom:4px; display:block; }
    .df-slider-wrap { display:flex; align-items:center; gap:10px; margin-top:4px; }
    .df-slider-wrap input[type=range] { flex:1; accent-color:${MC}; }
    .df-slider-num { font-size:13px; font-weight:500; color:${MC}; min-width:48px; text-align:right; background:#eff6ff; border-radius:4px; padding:2px 6px; }
    .df-seg { display:flex; border:1px solid ${GC}; border-radius:6px; overflow:hidden; margin-top:4px; }
    .df-seg-btn { flex:1; padding:6px 4px; border:none; background:${WC}; font-size:13px; cursor:pointer; color:${GC}; transition:background .12s,color .12s; white-space:nowrap; }
    .df-seg-btn + .df-seg-btn { border-left:1px solid ${GC}; }
    .df-seg-btn.active { background:${MC}; color:${WC}; }
    .df-select { width:100%; height:34px; padding:0 10px; margin-top:4px; border:1px solid ${GC}; border-radius:6px; font-size:13px; background:${WC}; color:${GC}; cursor:pointer; }
    .df-select:focus { outline:none; border-color:${MC}; }
    .df-toggle-wrap { display:flex; align-items:center; gap:10px; margin-top:4px; }
    .df-toggle { position:relative; display:inline-block; width:42px; height:24px; flex-shrink:0; }
    .df-toggle input { opacity:0; width:0; height:0; }
    .df-toggle-track { position:absolute; inset:0; background:${GC}; border-radius:12px; cursor:pointer; transition:background .2s; }
    .df-toggle-track::after { content:''; position:absolute; width:18px; height:18px; left:3px; top:3px; background:${WC}; border-radius:50%; transition:transform .2s; box-shadow:0 1px 3px rgba(0,0,0,.2); }
    .df-toggle input:checked + .df-toggle-track { background:${MC}; }
    .df-toggle input:checked + .df-toggle-track::after { transform:translateX(18px); }
    .df-toggle-lbl { font-size:13px; color:${GC}; flex:1; }
    .df-toggle-lbl.on { color:${MC}; font-weight:500; }
    .df-launch-btn { padding:7px 22px; background:${MC}; color:${WC}; border:none; border-radius:6px; font-size:14px; font-weight:600; cursor:pointer; white-space:nowrap; box-shadow:0 1px 4px rgba(57,117,174,.35); transition:background .15s; }
    .df-launch-btn:hover { background:#2e5e8e; }
    .df-nb-presets { display:flex; gap:10px; margin-top:4px; flex-wrap:wrap; }
    .df-nb-btn { padding:8px 20px; border:2px solid ${MC}; border-radius:6px; background:${WC}; color:${MC}; font-size:13px; font-weight:600; cursor:pointer; transition:background .12s,color .12s; }
    .df-nb-btn:hover,.df-nb-btn.active { background:${MC}; color:${WC}; }
  `;
  document.head.appendChild(style);

  document.addEventListener("DOMContentLoaded", function () {
    layoutPartitionQosMem();
    layoutCoresHours();
    enhanceEmail();
    addNotebookPresets();

    /* Hide OOD's own submit button — Launch button triggers it instead */
    const oodSubmit = document.querySelector(
      "#new_batch_connect_session_context [type=submit]," +
      "form.new_batch_connect_session_context [type=submit]," +
      ".session-context-form [type=submit]," +
      ".batch-connect-session-form [type=submit]"
    );
    if (oodSubmit) { oodSubmit.style.display = "none"; window._dfOodSubmit = oodSubmit; }
  });

  /* ── helpers ── */

  function hideFG(el) {
    const fg = el.closest(".form-group") || el.parentNode;
    fg.style.display = "none";
    return fg;
  }

  function sync(original, val) {
    original.value = val;
    original.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function makeLabel(text) {
    const lbl = document.createElement("label");
    lbl.className = "df-label";
    lbl.textContent = text;
    return lbl;
  }

  function wrapCol(content) {
    const col = document.createElement("div");
    col.className = "df-col";
    col.appendChild(content);
    return col;
  }

  /* ── Partition | QOS | Memory ── */
  function layoutPartitionQosMem() {
    const partEl = document.getElementById(ID.partition);
    const qosEl  = document.getElementById(ID.qos);
    const memEl  = document.getElementById(ID.memtask);
    if (!partEl || !qosEl || !memEl) return;

    const anchor = hideFG(partEl);
    hideFG(qosEl);
    hideFG(memEl);

    const row = document.createElement("div");
    row.className = "df-row-3";
    [[partEl, "Partition", "df-part-seg"], [qosEl, "QOS", "df-qos-seg"]]
      .forEach(([el, lbl, id]) => row.appendChild(wrapCol(buildSeg(el, lbl, id))));
    row.appendChild(wrapCol(buildMemSeg(memEl)));
    anchor.parentNode.insertBefore(row, anchor);
  }

  /* ── Cores | Hours ── */
  function layoutCoresHours() {
    const coresEl = document.getElementById(ID.numCores);
    const hoursEl = document.getElementById(ID.numHours);
    if (!coresEl || !hoursEl) return;

    const anchor = hideFG(coresEl);
    hideFG(hoursEl);

    const row = document.createElement("div");
    row.className = "df-row";
    row.appendChild(wrapCol(buildSliderField(coresEl, "Number of cores", 2, 64, 1, v => v)));
    row.appendChild(wrapCol(buildSliderField(hoursEl, "Number of hours",  1,  8, 1, v => v + " h")));
    anchor.parentNode.insertBefore(row, anchor);
  }

  /* ── Email toggle + Launch ── */
  function enhanceEmail() {
    const original = document.getElementById(ID.email);
    if (!original) return;
    const fg = hideFG(original);
    const isOn = original.checked || original.value === "1";

    const wrap = document.createElement("div");
    wrap.style.marginBottom = "16px";
    wrap.innerHTML = `
      <label class="df-label">Email notification</label>
      <div class="df-toggle-wrap">
        <label class="df-toggle">
          <input type="checkbox" id="df-email-chk"${isOn ? " checked" : ""}>
          <span class="df-toggle-track"></span>
        </label>
        <span class="df-toggle-lbl${isOn ? " on" : ""}" id="df-email-lbl">${isOn ? "Notify me when the job starts" : "No notification"}</span>
        <button type="button" id="df-launch-btn" class="df-launch-btn">&#9654; Launch</button>
      </div>`;
    fg.parentNode.insertBefore(wrap, fg);

    const chk = document.getElementById("df-email-chk");
    const lbl = document.getElementById("df-email-lbl");
    chk.addEventListener("change", function () {
      original.checked = this.checked;
      lbl.textContent  = this.checked ? "Notify me when the job starts" : "No notification";
      lbl.className    = "df-toggle-lbl" + (this.checked ? " on" : "");
      original.dispatchEvent(new Event("change", { bubbles: true }));
    });
    document.getElementById("df-launch-btn").addEventListener("click", function () {
      (window._dfOodSubmit || document.querySelector("form [type=submit]"))?.click();
    });
  }

  /* ── Notebook preset buttons ── */
  function addNotebookPresets() {
    const original = document.getElementById(ID.notebookDir);
    if (!original) return;
    const fg = hideFG(original);

    /* TODO: update paths to real notebook directories when ready */
    const PRESETS = [
      { label: "Histology", path: "$HOME/dianne-codebase/histology" },
      { label: "Xenium",    path: "$HOME/dianne-codebase/xenium"    },
      { label: "Visium",    path: "$HOME/dianne-codebase/visium"    },
    ];

    const wrap = document.createElement("div");
    wrap.style.marginBottom = "16px";
    wrap.appendChild(makeLabel("Notebook preset"));

    const row = document.createElement("div");
    row.className = "df-nb-presets";
    PRESETS.forEach(function (p) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "df-nb-btn";
      btn.textContent = p.label;
      btn.addEventListener("click", function () {
        row.querySelectorAll(".df-nb-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        sync(original, p.path);
      });
      row.appendChild(btn);
    });

    wrap.appendChild(row);
    fg.parentNode.insertBefore(wrap, fg);
  }

  /* ── widget builders ── */

  function buildSeg(original, labelText, segId) {
    original.style.display = "none";
    const wrapper = document.createElement("div");
    wrapper.appendChild(makeLabel(labelText));

    const opts = Array.from(original.options).map(o => ({ val: o.value, text: o.text }));
    if (opts.length <= 5) {
      const seg = document.createElement("div");
      seg.className = "df-seg"; seg.id = segId;
      opts.forEach(function (opt) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "df-seg-btn" + (original.value === opt.val ? " active" : "");
        btn.textContent = opt.text;
        btn.addEventListener("click", function () {
          seg.querySelectorAll(".df-seg-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          sync(original, opt.val);
        });
        seg.appendChild(btn);
      });
      if (!seg.querySelector(".active") && opts.length) {
        seg.querySelector(".df-seg-btn").classList.add("active");
        original.value = opts[0].val;
      }
      wrapper.appendChild(seg);
    } else {
      const sel = document.createElement("select");
      sel.className = "df-select";
      opts.forEach(opt => sel.appendChild(new Option(opt.text, opt.val, false, original.value === opt.val)));
      sel.addEventListener("change", function () { sync(original, this.value); });
      wrapper.appendChild(sel);
    }
    return wrapper;
  }

  function buildMemSeg(original) {
    original.style.display = "none";
    const wrapper = document.createElement("div");
    wrapper.appendChild(makeLabel("Memory"));
    const opts = ["32GB", "48GB", "64GB", "96GB"];
    const seg = document.createElement("div");
    seg.className = "df-seg"; seg.id = "df-mem-seg";
    opts.forEach(function (val) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "df-seg-btn" + (original.value === val ? " active" : "");
      btn.textContent = val.replace("GB", " GB");
      btn.addEventListener("click", function () {
        seg.querySelectorAll(".df-seg-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        sync(original, val);
      });
      seg.appendChild(btn);
    });
    if (!seg.querySelector(".active")) {
      seg.querySelector(".df-seg-btn").classList.add("active");
      original.value = opts[0];
    }
    wrapper.appendChild(seg);
    return wrapper;
  }

  function buildSliderField(original, labelText, min, max, step, fmt) {
    original.style.display = "none";
    const wrapper = document.createElement("div");
    wrapper.appendChild(makeLabel(labelText));
    const wrap = document.createElement("div");
    wrap.className = "df-slider-wrap";
    wrap.innerHTML = `<input type="range" min="${min}" max="${max}" step="${step}" value="${original.value || min}">
      <span class="df-slider-num">${fmt(original.value || min)}</span>`;
    const slider = wrap.querySelector("input");
    const numEl  = wrap.querySelector(".df-slider-num");
    slider.addEventListener("input", function () {
      numEl.textContent = fmt(this.value);
      sync(original, this.value);
    });
    wrapper.appendChild(wrap);
    return wrapper;
  }

})();
