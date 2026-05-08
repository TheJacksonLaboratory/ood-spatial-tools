/**
 * form.js — DIANNE JupyterLab OOD form enhancement
 *
 * Strategy: find OOD's auto-generated inputs by their id, hide them,
 * inject richer widgets, and sync values back into the originals so
 * OOD's submit pipeline works unchanged.
 *
 * Layout:
 *   Row 1 — Partition | QOS | Memory  (segmented buttons, one line)
 *   Row 2 — Cores slider | Hours slider  (side by side)
 *   Email notification toggle
 *   Notebook directory file browser
 */

(function () {
  "use strict";

  /* ── 1. IDs OOD generates from your form.yml attribute names ── */
  const ID = {
    notebookDir: "batch_connect_session_context_custom_notebook_dir",
    numCores:    "batch_connect_session_context_num_cores",
    numHours:    "batch_connect_session_context_bc_num_hours",
    memtask:     "batch_connect_session_context_memtask",
    partition:   "batch_connect_session_context_partition",
    qos:         "batch_connect_session_context_custom_qos",
    email:       "batch_connect_session_context_bc_email_on_started",
  };

  /* ── 2. Inject stylesheet ── */
  const style = document.createElement("style");
  const mcolor = "#3975ae";  /* main accent color for active states and highlights */
  const gcolor = "#d1d5db";  /* grey accent color for active states and highlights */
  const wcolor = "#fff";      /* white color for active states and highlights */

  
  style.textContent = `
    /* ── two-column row (cores + hours) ── */
    .df-row   { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 16px; }
    .df-row   > .df-col { flex: 1; min-width: 0; }

    /* ── three-column row (partition + qos + memory) ── */
    .df-row-3 { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 16px; }
    .df-row-3 > .df-col { flex: 1; min-width: 100px; }

    /* ── shared label ── */
    .df-label { font-size: 13px; font-weight: 600; color: ${gcolor}; margin-bottom: 4px; display: block; }

    /* ── slider enhancement ── */
    .df-slider-wrap { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
    .df-slider-wrap input[type=range] { flex: 1; accent-color: ${mcolor}; }
    .df-slider-num {
      font-size: 13px; font-weight: 500; color: ${mcolor};
      min-width: 48px; text-align: right;
      background: #eff6ff; border-radius: 4px; padding: 2px 6px;
    }

    /* ── segmented control ── */
    .df-seg { display: flex; border: 1px solid ${gcolor}; border-radius: 6px; overflow: hidden; margin-top: 4px; }
    .df-seg-btn {
      flex: 1; padding: 6px 4px; border: none; background: ${wcolor};
      font-size: 13px; cursor: pointer; color: ${gcolor};
      transition: background .12s, color .12s; white-space: nowrap;
    }
    .df-seg-btn + .df-seg-btn { border-left: 1px solid ${gcolor}; }
    .df-seg-btn.active { background: ${mcolor}; color: ${wcolor}; }

    /* ── styled select (fallback for many options) ── */
    .df-select {
      width: 100%; height: 34px; padding: 0 10px; margin-top: 4px;
      border: 1px solid ${gcolor}; border-radius: 6px;
      font-size: 13px; background: ${wcolor}; color: ${gcolor}; cursor: pointer;
    }
    .df-select:focus { outline: none; border-color: ${mcolor}; }

    /* ── email toggle switch ── */
    .df-toggle-wrap { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
    .df-toggle { position: relative; display: inline-block; width: 42px; height: 24px; flex-shrink: 0; }
    .df-toggle input { opacity: 0; width: 0; height: 0; }
    .df-toggle-track {
      position: absolute; inset: 0; background: ${gcolor};
      border-radius: 12px; cursor: pointer; transition: background .2s;
    }
    .df-toggle-track::after {
      content: ''; position: absolute; width: 18px; height: 18px;
      left: 3px; top: 3px; background: ${wcolor}; border-radius: 50%;
      transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2);
    }
    .df-toggle input:checked + .df-toggle-track { background: ${mcolor}; }
    .df-toggle input:checked + .df-toggle-track::after { transform: translateX(18px); }
    .df-toggle-lbl { font-size: 13px; color: ${gcolor}; flex: 1; }
    .df-toggle-lbl.on { color: ${mcolor}; font-weight: 500; }

    /* ── launch button ── */
    .df-launch-btn {
      padding: 7px 22px; background: ${mcolor}; color: ${wcolor};
      border: none; border-radius: 6px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: background .15s, box-shadow .15s;
      white-space: nowrap; box-shadow: 0 1px 4px rgba(95,165,230,.35);
    }
    .df-launch-btn:hover { background: ${mcolor}; box-shadow: 0 2px 8px rgba(95,165,230,.45); }
    .df-launch-btn:active { background: ${mcolor}; }

    /* ── file browser ── */
    #df-file-browser {
      border: 1px solid ${gcolor}; border-radius: 8px; overflow: hidden;
      margin-top: 6px; font-size: 13px;
    }
    #df-fb-path {
      display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
      padding: 6px 12px; background: ${wcolor}; border-bottom: 1px solid ${gcolor};
      font-family: monospace; font-size: 11px; color: ${gcolor};
    }
    #df-fb-path .df-crumb { color: ${mcolor}; cursor: pointer; }
    #df-fb-path .df-crumb:hover { text-decoration: underline; }
    #df-fb-path .df-sep { color: ${gcolor}; }
    #df-fb-toolbar {
      display: flex; gap: 8px; padding: 7px 10px;
      background: ${wcolor}; border-bottom: 1px solid ${gcolor}; align-items: center;
    }
    #df-fb-toolbar input {
      flex: 1; height: 28px; padding: 0 8px; font-size: 12px;
      border: 1px solid ${gcolor}; border-radius: 5px;
    }
    #df-fb-toolbar input:focus { outline: none; border-color: ${mcolor}; }
    #df-fb-toolbar select {
      height: 28px; padding: 0 6px; font-size: 12px;
      border: 1px solid ${gcolor}; border-radius: 5px; background: ${wcolor}; color: ${gcolor}; cursor: pointer;
    }
    #df-fb-toolbar select:focus { outline: none; border-color: ${mcolor};
    }
    #df-fb-list { max-height: 220px; overflow-y: auto; }
    .df-fb-empty { padding: 20px; text-align: center; color: ${gcolor}; font-size: 12px; }
    .df-fb-item {
      display: flex; align-items: center; gap: 9px;
      padding: 7px 12px; cursor: pointer;
      border-bottom: 1px solid ${gcolor}; transition: background .1s;
    }
    .df-fb-item:last-child { border-bottom: none; }
    .df-fb-item:hover { background: ${wcolor}; }
    .df-fb-item.df-selected { background: ${mcolor}; }
    .df-fb-item .df-ico { font-size: 15px; flex-shrink: 0; }
    .df-fb-item .df-name { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .df-fb-item.df-selected .df-name { color: ${mcolor}; font-weight: 500; }
    .df-fb-item .df-meta { font-size: 11px; color: ${gcolor}; white-space: nowrap; }
    #df-sel-bar {
      display: none; align-items: center; justify-content: space-between;
      padding: 7px 12px; background: ${mcolor}; border-top: 1px solid ${gcolor};
      font-size: 12px; color: ${mcolor}; margin-top: 8px; border-radius: 0 0 8px 8px;
    }
    #df-sel-bar button {
      background: none; border: none; cursor: pointer; font-size: 11px;
      color: ${gcolor}; padding: 2px 6px; border-radius: 4px;
    }
    #df-sel-bar button:hover { background: ${wcolor}; color: ${mcolor}; }
    #df-manual-toggle {
      font-size: 12px; color: ${mcolor}; cursor: pointer;
      display: inline-block; margin-top: 8px;
    }
    #df-manual-toggle:hover { text-decoration: underline; }
    #df-manual-area { display: none; margin-top: 8px; }
    #df-manual-area input {
      width: 100%; height: 34px; padding: 0 10px;
      border: 1px solid ${gcolor}; border-radius: 6px;
      font-family: monospace; font-size: 13px;
    }
    #df-manual-area input:focus { outline: none; border-color: ${mcolor}; }
    .df-hint { font-size: 12px; color: ${gcolor}; margin-top: 6px; line-height: 1.5; }
  `;
  document.head.appendChild(style);

  /* ── 3. Wait for OOD to finish rendering the form ── */
  document.addEventListener("DOMContentLoaded", function () {
    layoutPartitionQosMem();   /* row: Partition | QOS | Memory */
    layoutCoresHours();        /* row: Cores slider | Hours slider */
    enhanceEmail();            /* toggle switch for bc_email_on_started */
    enhanceNotebookDir();      /* file browser */

    /* Hide OOD's own submit button — our Launch button triggers it instead */
    const oodSubmit = document.querySelector(
      "#new_batch_connect_session_context [type=submit], " +
      "form.new_batch_connect_session_context [type=submit], " +
      ".session-context-form [type=submit], " +
      ".batch-connect-session-form [type=submit]"
    );
    if (oodSubmit) {
      oodSubmit.style.display = "none";
      /* Keep a reference so our Launch button can trigger form submission */
      window._dfOodSubmit = oodSubmit;
    }
  });

  /* ── helpers ── */
  function hideFG(el) {
    const fg = el.closest(".form-group") || el.parentNode;
    fg.style.display = "none";
    return fg;
  }

  /* ═══════════════════════════════════════════════════════════════
     ROW: PARTITION | QOS | MEMORY — all in one line
  ═══════════════════════════════════════════════════════════════ */
  function layoutPartitionQosMem() {
    const partEl = document.getElementById(ID.partition);
    const qosEl  = document.getElementById(ID.qos);
    const memEl  = document.getElementById(ID.memtask);
    if (!partEl || !qosEl || !memEl) return;

    const partFG = hideFG(partEl);
    hideFG(qosEl);
    hideFG(memEl);

    const row = document.createElement("div");
    row.className = "df-row-3";

    /* Partition column */
    const partCol = document.createElement("div");
    partCol.className = "df-col";
    partCol.appendChild(buildSelectWidget(partEl, "Partition", "df-part-seg"));

    /* QOS column */
    const qosCol = document.createElement("div");
    qosCol.className = "df-col";
    qosCol.appendChild(buildSelectWidget(qosEl, "QOS", "df-qos-seg"));

    /* Memory column */
    const memCol = document.createElement("div");
    memCol.className = "df-col";
    memCol.appendChild(buildMemWidget(memEl));

    row.appendChild(partCol);
    row.appendChild(qosCol);
    row.appendChild(memCol);

    partFG.parentNode.insertBefore(row, partFG);
  }

  /* Build a segmented-button or styled-select widget from a <select> element */
  function buildSelectWidget(original, labelText, segId) {
    original.style.display = "none";
    const wrapper = document.createElement("div");

    const lbl = document.createElement("label");
    lbl.className = "df-label";
    lbl.textContent = labelText;
    wrapper.appendChild(lbl);

    const opts = Array.from(original.options).map(o => ({ val: o.value, text: o.text }));

    if (opts.length <= 5) {
      /* segmented pill buttons */
      const seg = document.createElement("div");
      seg.className = "df-seg";
      seg.id = segId;

      opts.forEach(function (opt) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "df-seg-btn" + (original.value === opt.val ? " active" : "");
        btn.textContent = opt.text;
        btn.dataset.val = opt.val;
        btn.addEventListener("click", function () {
          seg.querySelectorAll(".df-seg-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          original.value = opt.val;
          original.dispatchEvent(new Event("change", { bubbles: true }));
        });
        seg.appendChild(btn);
      });

      /* ensure one button is active by default */
      if (!seg.querySelector(".active") && opts.length) {
        seg.querySelector(".df-seg-btn").classList.add("active");
        original.value = opts[0].val;
      }

      wrapper.appendChild(seg);
    } else {
      /* styled <select> fallback for many options */
      const sel = document.createElement("select");
      sel.className = "df-select";
      opts.forEach(function (opt) {
        const o = document.createElement("option");
        o.value = opt.val;
        o.textContent = opt.text;
        if (original.value === opt.val) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener("change", function () {
        original.value = this.value;
        original.dispatchEvent(new Event("change", { bubbles: true }));
      });
      wrapper.appendChild(sel);
    }

    return wrapper;
  }

  /* Memory segmented control (fixed options) */
  function buildMemWidget(original) {
    original.style.display = "none";
    const wrapper = document.createElement("div");

    const lbl = document.createElement("label");
    lbl.className = "df-label";
    lbl.textContent = "Memory";
    wrapper.appendChild(lbl);

    const options = ["32GB", "48GB", "64GB", "96GB"];
    const seg = document.createElement("div");
    seg.className = "df-seg";
    seg.id = "df-mem-seg";

    options.forEach(function (val) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "df-seg-btn" + (original.value === val ? " active" : "");
      btn.textContent = val.replace("GB", " GB");
      btn.dataset.val = val;
      btn.addEventListener("click", function () {
        seg.querySelectorAll(".df-seg-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        original.value = val;
        original.dispatchEvent(new Event("change", { bubbles: true }));
      });
      seg.appendChild(btn);
    });

    if (!seg.querySelector(".active")) {
      seg.querySelector(".df-seg-btn").classList.add("active");
      original.value = options[0];
    }

    wrapper.appendChild(seg);
    return wrapper;
  }

  /* ═══════════════════════════════════════════════════════════════
     ROW: CORES slider | HOURS slider — side by side
  ═══════════════════════════════════════════════════════════════ */
  function layoutCoresHours() {
    const coresEl = document.getElementById(ID.numCores);
    const hoursEl = document.getElementById(ID.numHours);
    if (!coresEl || !hoursEl) return;

    const coresFG = hideFG(coresEl);
    hideFG(hoursEl);

    const row = document.createElement("div");
    row.className = "df-row";

    const coresCol = document.createElement("div");
    coresCol.className = "df-col";
    const coresLbl = document.createElement("label");
    coresLbl.className = "df-label";
    coresLbl.textContent = "Number of cores";
    coresCol.appendChild(coresLbl);
    coresCol.appendChild(buildSlider(coresEl, "cores-display", 2, 64, 1, v => v));

    const hoursCol = document.createElement("div");
    hoursCol.className = "df-col";
    const hoursLbl = document.createElement("label");
    hoursLbl.className = "df-label";
    hoursLbl.textContent = "Number of hours";
    hoursCol.appendChild(hoursLbl);
    hoursCol.appendChild(buildSlider(hoursEl, "hours-display", 1, 8, 1, v => v + " h"));

    row.appendChild(coresCol);
    row.appendChild(hoursCol);

    coresFG.parentNode.insertBefore(row, coresFG);
  }

  function buildSlider(original, displayId, min, max, step, fmt) {
    original.style.display = "none";
    const wrap = document.createElement("div");
    wrap.className = "df-slider-wrap";
    wrap.innerHTML = `
      <input type="range" min="${min}" max="${max}" step="${step}"
             value="${original.value || min}" id="${displayId}">
      <span class="df-slider-num" id="${displayId}-num">${fmt(original.value || min)}</span>
    `;
    const slider = wrap.querySelector("input[type=range]");
    const numEl  = wrap.querySelector(".df-slider-num");
    slider.addEventListener("input", function () {
      numEl.textContent = fmt(this.value);
      original.value    = this.value;
      original.dispatchEvent(new Event("change", { bubbles: true }));
    });
    return wrap;
  }

  /* ═══════════════════════════════════════════════════════════════
     EMAIL NOTIFICATION TOGGLE
     Replaces OOD's checkbox with a styled toggle switch
  ═══════════════════════════════════════════════════════════════ */
  function enhanceEmail() {
    const original = document.getElementById(ID.email);
    if (!original) return;

    const fg = hideFG(original);

    const wrap = document.createElement("div");
    wrap.style.marginBottom = "16px";
    const isChecked = original.checked || original.value === "1";
    wrap.innerHTML = `
      <label class="df-label">Email notification</label>
      <div class="df-toggle-wrap">
        <label class="df-toggle">
          <input type="checkbox" id="df-email-chk"${isChecked ? " checked" : ""}>
          <span class="df-toggle-track"></span>
        </label>
        <span class="df-toggle-lbl${isChecked ? " on" : ""}" id="df-email-lbl">
          ${isChecked ? "Notify me when the job starts" : "No notification"}
        </span>
        <button type="button" id="df-launch-btn" class="df-launch-btn">&#9654; Launch</button>
      </div>
    `;
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
      const submitBtn = window._dfOodSubmit ||
        document.querySelector(
          "#new_batch_connect_session_context [type=submit], " +
          "form.new_batch_connect_session_context [type=submit], " +
          "form [type=submit]"
        );
      if (submitBtn) submitBtn.click();
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     NOTEBOOK DIRECTORY FILE BROWSER
     Hides OOD's text_field, injects a navigable file browser
     that writes selected paths back into the original input
  ═══════════════════════════════════════════════════════════════ */
  function enhanceNotebookDir() {
    const original = document.getElementById(ID.notebookDir);
    if (!original) return;

    original.style.display = "none";

    /* ── live filesystem via OOD Files API ────────────────────────
       OOD v2 Files API: /pun/sys/dashboard/files/api/v1/fs<abs_path>
       Always built from window.location.origin to guarantee HTTPS.
       $HOME is resolved by reading the username from the OOD navbar.
       Results are cached in TREE so each directory is only fetched once.
    ─────────────────────────────────────────────────────────────── */
    const FILES_BASE = window.location.origin + "/pun/sys/dashboard/files/api/v1/fs";

    /* Expand $HOME / ~ → /home/<username>.
       Tries multiple OOD-specific strategies to find the logged-in username,
       falls back to /home so the user can navigate manually. */
    function resolveHome(path) {
      if (!path || !/^(\$HOME|~)([\/]|$)/.test(path)) return path || "/home";

      let username = "";

      /* 1. body[data-username] or any element with data-username */
      username = document.body.dataset.username ||
        document.body.dataset.oodUsername || "";

      /* 2. <meta name="username"> or similar */
      if (!username) {
        const m = document.querySelector(
          'meta[name="username"], meta[name="current-user"], meta[name="ood-user"]'
        );
        if (m) username = m.getAttribute("content") || "";
      }

      /* 3. OOD navbar user-dropdown toggle: clone it, strip icon elements,
             the remaining text is the username */
      if (!username) {
        const toggle = document.querySelector(
          ".navbar-nav .dropdown-toggle, " +
          "[id$='user-menu'], #user-menu, " +
          ".nav-user .nav-link"
        );
        if (toggle) {
          const cl = toggle.cloneNode(true);
          cl.querySelectorAll("i, svg, img, .sr-only, .visually-hidden").forEach(function (e) {
            e.remove();
          });
          const words = cl.textContent.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
          /* Username is typically the last word and matches \w[\w.-]* */
          for (let i = words.length - 1; i >= 0; i--) {
            if (/^[\w][\w.-]{0,30}$/.test(words[i])) { username = words[i]; break; }
          }
        }
      }

      /* 4. Any navbar <a> whose visible text looks like a plain username */
      if (!username) {
        document.querySelectorAll(".navbar-nav a, .navbar a").forEach(function (a) {
          if (username) return;
          const cl = a.cloneNode(true);
          cl.querySelectorAll("i, svg, img, span").forEach(function (e) { e.remove(); });
          const t = cl.textContent.trim();
          if (
            t &&
            /^[\w][\w.-]{1,30}$/.test(t) &&
            !/^(home|files|jobs|apps|help|about|logout|login|support|shell)$/i.test(t)
          ) {
            username = t;
          }
        });
      }

      return username
        ? path.replace(/^\$HOME|^~/, "/home/" + username)
        : "/home";   /* fallback: open /home so user can navigate */
    }

    const rawDefault = (original.value || "$HOME/dianne-codebase/ondemand")
      .replace(/^~\//, "$HOME/").replace(/^~$/, "$HOME");
    const DEFAULT_ROOT = resolveHome(rawDefault);
    console.debug("[form.js] file-browser DEFAULT_ROOT =", DEFAULT_ROOT);

    const TREE = {};   /* path → entry[] cache */

    async function loadDir(virtPath) {
      if (TREE[virtPath]) return;          /* already cached */

      showLoading();
      try {
        const res = await fetch(FILES_BASE + virtPath, {
          headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();

        const parent = virtPath !== DEFAULT_ROOT ? [{ name: "..", type: "up" }] : [];
        TREE[virtPath] = parent.concat(
          data.files
            .filter(f => f.name !== "." && f.name !== "..")
            .map(function (f) {
              return {
                name:     f.name,
                type:     f.directory              ? "folder"
                        : f.name.endsWith(".ipynb") ? "nb"
                        : f.name.endsWith(".py")    ? "py"
                        :                            "other",
                size:     f.size ? (f.size / 1024).toFixed(1) + " KB" : "",
                modified: f.modified_at
                          ? new Date(f.modified_at * 1000).toLocaleDateString()
                          : "",
              };
            })
        );
      } catch (err) {
        TREE[virtPath] = virtPath !== DEFAULT_ROOT ? [{ name: "..", type: "up" }] : [];
        showError("Could not load directory: " + err.message);
      }
      renderList();
    }

    function showLoading() {
      document.getElementById("df-fb-list").innerHTML =
        '<div class="df-fb-empty">Loading…</div>';
    }

    function showError(msg) {
      document.getElementById("df-fb-list").innerHTML =
        '<div class="df-fb-empty" style="color:#b91c1c;">' + msg + '</div>';
    }

    let currentPath = DEFAULT_ROOT;
    let selectedPath = "";
    let manualOpen = false;

    /* DOM */
    const container = document.createElement("div");
    container.innerHTML = `
      <div id="df-file-browser">
        <div id="df-fb-path"></div>
        <div id="df-fb-toolbar">
          <input type="text" id="df-fb-filter" placeholder="Filter folders &amp; notebooks…">
          <select id="df-fb-type">
            <option value="">All types</option>
            <option value="folder">Folders only</option>
            <option value="nb">Notebooks (.ipynb)</option>
            <option value="py">.py files</option>
          </select>
        </div>
        <div id="df-fb-list"></div>
        <div id="df-sel-bar">
          <span>&#10003; <span id="df-sel-label" style="font-family:monospace;font-size:11px;"></span></span>
          <button id="df-clear-btn">&#x2715; Clear</button>
        </div>
      </div>
      <span id="df-manual-toggle">&#x21B3; Enter path manually instead</span>
      <div id="df-manual-area">
        <input type="text" id="df-manual-input" placeholder="/home/you/your-notebooks">
        <div class="df-hint">Press Enter or click elsewhere to apply.</div>
      </div>
      <div class="df-hint">Select a folder (JupyterLab root) or a notebook file. Use the manual field for paths outside the tree.</div>
    `;
    original.parentNode.insertBefore(container, original.nextSibling);

    /* wire events */
    document.getElementById("df-fb-filter").addEventListener("input", renderList);
    document.getElementById("df-fb-type").addEventListener("change", renderList);
    document.getElementById("df-clear-btn").addEventListener("click", clearSel);
    document.getElementById("df-manual-toggle").addEventListener("click", toggleManual);
    document.getElementById("df-manual-input").addEventListener("change", function () {
      applyManual(this.value.trim());
    });

    navTo(currentPath);  /* initial load */

    /* ── render breadcrumb path bar ── */
    function renderPath() {
      const bar = document.getElementById("df-fb-path");
      const parts = currentPath.split("/");
      let built = "";
      bar.innerHTML = parts.map(function (p, i) {
        built = i === 0 ? p : built + "/" + p;
        const snap = built;
        return `<span class="df-crumb" data-path="${snap}">${p}</span>`;
      }).join('<span class="df-sep"> / </span>');

      bar.querySelectorAll(".df-crumb").forEach(function (el) {
        el.addEventListener("click", function () { navTo(el.dataset.path); });
      });
    }

    /* ── render file list ── */
    function renderList() {
      const listEl = document.getElementById("df-fb-list");
      const q      = document.getElementById("df-fb-filter").value.toLowerCase();
      const tf     = document.getElementById("df-fb-type").value;
      const items  = TREE[currentPath] || [];

      const filtered = items.filter(function (f) {
        if (f.type === "up") return true;
        if (q && !f.name.toLowerCase().includes(q)) return false;
        if (tf && f.type !== tf) return false;
        return true;
      });

      if (!filtered.length) {
        listEl.innerHTML = '<div class="df-fb-empty">No items match your filter</div>';
        return;
      }

      listEl.innerHTML = "";
      filtered.forEach(function (f) {
        const row = document.createElement("div");
        row.className = "df-fb-item" + (selectedPath === currentPath + "/" + f.name ? " df-selected" : "");

        if (f.type === "up") {
          row.innerHTML = `<span class="df-ico">&#8593;</span><span class="df-name" style="color:#9ca3af;">.. parent folder</span>`;
          row.addEventListener("click", function () {
            navTo(currentPath.split("/").slice(0, -1).join("/"));
          });
        } else {
          const ico = { folder: "📁", nb: "📓", py: "🐍", other: "📄" }[f.type] || "📄";
          const meta = [f.size, f.modified].filter(Boolean).join(" · ");
          row.innerHTML = `<span class="df-ico">${ico}</span><span class="df-name">${f.name}</span><span class="df-meta">${meta}</span>`;
          row.addEventListener("click", function () {
            if (f.type === "folder") {
              navTo(currentPath + "/" + f.name);
            } else {
              pickItem(currentPath + "/" + f.name);
            }
          });
        }
        listEl.appendChild(row);
      });
    }

    async function navTo(path) {
      currentPath = path;
      document.getElementById("df-fb-filter").value = "";
      renderPath();
      await loadDir(path);  /* fetch if not cached, then renderList() */
    }

    function pickItem(path) {
      selectedPath = path;
      setOutput(path);
      document.getElementById("df-sel-label").textContent = path;
      document.getElementById("df-sel-bar").style.display = "flex";
      renderList();
    }

    function clearSel() {
      selectedPath = "";
      setOutput("");
      document.getElementById("df-sel-bar").style.display = "none";
      renderList();
    }

    function setOutput(val) {
      original.value = val;
      original.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function toggleManual() {
      manualOpen = !manualOpen;
      document.getElementById("df-manual-area").style.display = manualOpen ? "block" : "none";
      document.getElementById("df-manual-toggle").textContent = manualOpen
        ? "↳ Use file browser instead"
        : "↳ Enter path manually instead";
    }

    function applyManual(val) {
      if (!val) return;
      selectedPath = val;
      setOutput(val);
      document.getElementById("df-sel-label").textContent = val;
      document.getElementById("df-sel-bar").style.display = "flex";
    }
  }

})();