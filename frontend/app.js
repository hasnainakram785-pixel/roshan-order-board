/* Live Order Status Board - vanilla JS, no build step.
   Polls GET {API_BASE_URL}/orders every POLL_INTERVAL_MS (10 s) and redraws the table.
   Staff can change a status with the dropdown (PATCH {API_BASE_URL}/orders/{id}). */

const STATUSES = {
  pending:      "Pending",
  under_review: "Under review",
  approved:     "Approved",
  disbursed:    "Disbursed",
  rejected:     "Rejected"
};

/* ---------- pure helpers (tested in test/app.test.js) ---------- */

function statusLabel(status) {
  return STATUSES[status] || String(status);
}

function formatAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function countByStatus(orders) {
  const counts = {};
  Object.keys(STATUSES).forEach(function (k) { counts[k] = 0; });
  orders.forEach(function (o) { if (counts[o.status] !== undefined) counts[o.status] += 1; });
  return counts;
}

/* ids of orders that are new or whose status changed since the previous poll */
function changedIds(previous, current) {
  const before = {};
  previous.forEach(function (o) { before[o.id] = o.status; });
  return current
    .filter(function (o) { return before[o.id] === undefined ? previous.length > 0 : before[o.id] !== o.status; })
    .map(function (o) { return o.id; });
}

/* Polling loop. Runs fetchOrders() now and then every intervalMs.
   A new request never starts while the previous one is still running. */
function createPoller(opts) {
  const setIv = opts.setIntervalFn || setInterval;
  const clearIv = opts.clearIntervalFn || clearInterval;
  let busy = false;
  let timer = null;

  async function tick() {
    if (busy) return;
    busy = true;
    try {
      const data = await opts.fetchOrders();
      opts.onData(data);
    } catch (err) {
      opts.onError(err);
    } finally {
      busy = false;
    }
  }

  return {
    start: function () { tick(); timer = setIv(tick, opts.intervalMs); },
    stop: function () { if (timer !== null) { clearIv(timer); timer = null; } },
    refreshNow: tick
  };
}

/* ---------- browser code ---------- */

if (typeof document !== "undefined") {
  (function () {
    const cfg = window.APP_CONFIG || {};
    const API = String(cfg.API_BASE_URL || "/api").replace(/\/+$/, "");
    const INTERVAL = Number(cfg.POLL_INTERVAL_MS) || 10000;

    const $rows = document.getElementById("rows");
    const $summary = document.getElementById("summary");
    const $updated = document.getElementById("updated");
    const $countdown = document.getElementById("countdown");
    const $banner = document.getElementById("banner");
    const $dot = document.getElementById("dot");
    const $liveText = document.getElementById("liveText");
    const $refresh = document.getElementById("refreshBtn");

    let current = [];
    let nextAt = Date.now() + INTERVAL;

    function el(tag, className, text) {
      const e = document.createElement(tag);
      if (className) e.className = className;
      if (text !== undefined) e.textContent = text;
      return e;
    }

    function showBanner(msg, ok) {
      if (!msg) { $banner.hidden = true; return; }
      $banner.textContent = msg;
      $banner.className = "banner" + (ok ? " ok" : "");
      $banner.hidden = false;
    }

    function setLive(state, text) {
      $dot.className = "dot " + (state === "ok" ? "dot-ok" : state === "err" ? "dot-err" : "dot-wait");
      $liveText.textContent = text;
    }

    async function fetchOrders() {
      const ctrl = new AbortController();
      const t = setTimeout(function () { ctrl.abort(); }, 8000);
      try {
        const res = await fetch(API + "/orders", { headers: { "Accept": "application/json" }, signal: ctrl.signal });
        if (!res.ok) throw new Error("The API answered with status " + res.status);
        const type = res.headers.get("content-type") || "";
        if (type.indexOf("json") === -1) {
          throw new Error("The API did not return JSON (the host may be blocking API requests).");
        }
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Unexpected response: a list of orders was expected.");
        return data;
      } finally {
        clearTimeout(t);
      }
    }

    function renderSummary(orders) {
      const counts = countByStatus(orders);
      $summary.textContent = "";
      Object.keys(STATUSES).forEach(function (key) {
        const chip = el("div", "chip");
        chip.appendChild(el("b", "", String(counts[key])));
        const label = el("span", "", STATUSES[key]);
        chip.appendChild(label);
        $summary.appendChild(chip);
      });
    }

    function renderRows(orders, changed) {
      $rows.textContent = "";
      if (orders.length === 0) {
        const tr = el("tr");
        const td = el("td", "empty", "No loan applications yet.");
        td.colSpan = 6;
        tr.appendChild(td);
        $rows.appendChild(tr);
        return;
      }
      orders.forEach(function (o) {
        const tr = el("tr", "row-s-" + o.status + (changed.indexOf(o.id) !== -1 ? " changed" : ""));
        tr.appendChild(el("td", "", "#" + o.id));
        tr.appendChild(el("td", "", o.customer_name));
        tr.appendChild(el("td", "num", formatAmount(o.amount)));

        const tdStatus = el("td");
        tdStatus.appendChild(el("span", "badge s-" + o.status, statusLabel(o.status)));
        tr.appendChild(tdStatus);

        tr.appendChild(el("td", "", o.updated_at ? new Date(o.updated_at).toLocaleString() : "-"));

        const tdAct = el("td");
        const sel = el("select");
        sel.setAttribute("aria-label", "Change status of order " + o.id);
        Object.keys(STATUSES).forEach(function (key) {
          const opt = el("option", "", STATUSES[key]);
          opt.value = key;
          if (key === o.status) opt.selected = true;
          sel.appendChild(opt);
        });
        sel.addEventListener("change", function () { updateStatus(o, sel); });
        tdAct.appendChild(sel);
        tr.appendChild(tdAct);

        $rows.appendChild(tr);
      });
    }

    async function updateStatus(order, select) {
      const wanted = select.value;
      select.disabled = true;
      try {
        const res = await fetch(API + "/orders/" + order.id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ status: wanted })
        });
        if (!res.ok) throw new Error("Could not update order #" + order.id + " (status " + res.status + ").");
        showBanner("Order #" + order.id + " is now " + statusLabel(wanted) + ".", true);
        poller.refreshNow();
      } catch (err) {
        select.value = order.status;
        showBanner(err.message, false);
      } finally {
        select.disabled = false;
      }
    }

    function onData(orders) {
      const changed = changedIds(current, orders);
      current = orders;
      renderSummary(orders);
      renderRows(orders, changed);
      $updated.textContent = "Last updated: " + new Date().toLocaleTimeString();
      setLive("ok", "Live - refreshes every " + Math.round(INTERVAL / 1000) + " s");
      if (!$banner.hidden && !$banner.classList.contains("ok")) showBanner("");
      nextAt = Date.now() + INTERVAL;
    }

    function onError(err) {
      setLive("err", "Offline - showing last data");
      const msg = err && err.name === "AbortError" ? "The API took too long to answer." : (err && err.message) || "Could not reach the API.";
      showBanner(msg + " Retrying automatically.", false);
      nextAt = Date.now() + INTERVAL;
    }

    const poller = createPoller({ fetchOrders: fetchOrders, onData: onData, onError: onError, intervalMs: INTERVAL });

    $refresh.addEventListener("click", function () { poller.refreshNow(); });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) poller.refreshNow(); });
    setInterval(function () {
      const s = Math.max(0, Math.ceil((nextAt - Date.now()) / 1000));
      $countdown.textContent = "Next refresh in " + s + " s";
    }, 1000);

    poller.start();
  })();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { STATUSES, statusLabel, formatAmount, countByStatus, changedIds, createPoller };
}
