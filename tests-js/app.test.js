// Run with:  node tests-js/app.test.js      (Node 18+)
const assert = require("assert");
const { statusLabel, formatAmount, countByStatus, changedIds, createPoller } = require("../frontend/app.js");

// labels + amounts
assert.strictEqual(statusLabel("under_review"), "Under review");
assert.strictEqual(statusLabel("weird"), "weird");
assert.strictEqual(formatAmount(50000), "50,000.00");
assert.strictEqual(formatAmount("75000.5"), "75,000.50");
assert.strictEqual(formatAmount("abc"), "-");

// summary counts
const sample = [
  { id: 1, status: "pending" }, { id: 2, status: "approved" },
  { id: 3, status: "approved" }, { id: 4, status: "rejected" }
];
const c = countByStatus(sample);
assert.deepStrictEqual(c, { pending: 1, under_review: 0, approved: 2, disbursed: 0, rejected: 1 });

// change detection: first load highlights nothing, later loads highlight changes
assert.deepStrictEqual(changedIds([], sample), []);
const after = [{ id: 1, status: "approved" }, { id: 2, status: "approved" }, { id: 3, status: "approved" }, { id: 4, status: "rejected" }, { id: 5, status: "pending" }];
assert.deepStrictEqual(changedIds(sample, after), [1, 5]);

// poller: fake timers
(async function () {
  let calls = 0, data = 0, errors = 0, tickFn = null, interval = null, cleared = false;
  const poller = createPoller({
    intervalMs: 10000,
    fetchOrders: async function () { calls++; if (calls === 3) throw new Error("boom"); return [{ id: calls }]; },
    onData: function () { data++; },
    onError: function () { errors++; },
    setIntervalFn: function (fn, ms) { tickFn = fn; interval = ms; return 1; },
    clearIntervalFn: function () { cleared = true; }
  });

  poller.start();                       // immediate first fetch
  await new Promise(function (r) { setImmediate(r); });
  assert.strictEqual(interval, 10000);  // repeats every 10 seconds
  assert.strictEqual(calls, 1);

  await tickFn(); await tickFn();       // two more polls: 2nd ok, 3rd fails
  assert.strictEqual(calls, 3);
  assert.strictEqual(data, 2);
  assert.strictEqual(errors, 1);        // an error does not stop the polling

  // no overlap: a slow request blocks the next tick
  let release; let slowCalls = 0;
  const slow = createPoller({
    intervalMs: 10000,
    fetchOrders: function () { slowCalls++; return new Promise(function (r) { release = r; }); },
    onData: function () {}, onError: function () {},
    setIntervalFn: function (fn) { tickFn = fn; return 2; }, clearIntervalFn: function () {}
  });
  slow.start();
  tickFn(); tickFn();                   // ticks while first request still running
  assert.strictEqual(slowCalls, 1);
  release([]);

  poller.stop();
  assert.ok(cleared);
  console.log("All front-end tests passed");
})().catch(function (e) { console.error(e); process.exit(1); });
