/* ================================================================
   What other guests have already spoken for.

   There are two ways to read it and they are not equal. The published
   sheet is a plain CSV served off Google's static infrastructure and
   comes back in a few hundred milliseconds. The script endpoint is the
   authority, but it has to wake up first — measured at anywhere between
   two and sixteen seconds, and sometimes not at all. So we ask the CSV
   first and keep the script as the fallback.

   Whatever comes back is kept in this browser, so the next page, or the
   next visit, can draw the list straight away instead of showing nothing
   while it waits. The invitation quietly refreshes it while you read, so
   by the time you reach the gift list it is usually already current.

   Claims themselves never come through here. Those are posted to the
   script, which remains the one place that decides what is taken. The
   worst a stale list can do is let someone tap a gift that has just gone,
   and be told so.
   ================================================================ */
(function (global) {
  "use strict";

  var KEY      = "signing-lunch:claimed:v1";
  var MAX_ROWS = 400;   /* ceilings, so a wrong URL or a mangled answer */
  var MAX_LEN  = 120;   /* cannot fill the page or the cache with junk  */

  var csvUrl  = "";
  var execUrl = "";

  function configure(o) {
    csvUrl  = (o && o.csv)  || "";
    execUrl = (o && o.exec) || "";
  }

  /* Private browsing, blocked storage and a full quota all throw here, and
     none of them are worth breaking the page over. */
  function cached() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      if (!c || !Array.isArray(c.names) || typeof c.at !== "number") return null;
      return { names: clean(c.names), at: c.at };
    } catch (e) { return null; }
  }

  function save(names) {
    try {
      global.localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), names: clean(names) }));
    } catch (e) { /* nothing here is worth an error */ }
  }

  function clean(names) {
    var out = [], seen = {};
    for (var i = 0; i < names.length && out.length < MAX_ROWS; i++) {
      var s = String(names[i] == null ? "" : names[i]).trim();
      if (!s || s.length > MAX_LEN || seen[s]) continue;
      seen[s] = 1;
      out.push(s);
    }
    return out;
  }

  /* Enough of RFC 4180 to survive a gift called Knives, forks and spoons. */
  function parseCsv(text) {
    var rows = [], row = [], field = "", quoted = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text.charAt(i);
      if (quoted) {
        if (c !== '"') { field += c; }
        else if (text.charAt(i + 1) === '"') { field += '"'; i++; }
        else { quoted = false; }
      } else if (c === '"') { quoted = true; }
      else if (c === ",")  { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c !== "\r") { field += c; }
    }
    row.push(field);
    rows.push(row);
    return rows;
  }

  function withTimeout(url, ms, asJson) {
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var bail = global.setTimeout(function () { if (ctrl) ctrl.abort(); }, ms);
    var opts = ctrl ? { signal: ctrl.signal } : {};
    return global.fetch(url, opts)
      .then(function (r) {
        if (!r.ok) throw new Error("http " + r.status);
        return asJson ? r.json() : r.text();   /* json() throws on Google's own error page */
      })
      .then(function (v) { global.clearTimeout(bail); return v; })
      .catch(function (e) { global.clearTimeout(bail); throw e; });
  }

  function fromCsv() {
    if (!csvUrl) return Promise.reject(new Error("no csv"));
    return withTimeout(csvUrl, 8000, false).then(function (text) {
      if (/^\s*</.test(text)) throw new Error("not csv");   /* a sign-in page, say */
      var names = parseCsv(text).map(function (r) { return (r[0] || "").trim(); });
      return clean(names);
    });
  }

  function fromScript() {
    if (!execUrl) return Promise.reject(new Error("no endpoint"));
    return withTimeout(execUrl, 15000, true).then(function (rows) {
      if (!Array.isArray(rows)) throw new Error("unexpected answer");
      return clean(rows.map(function (r) { return r && r.gift; }));
    });
  }

  /* The CSV first, the script if it will not answer. Either way the result
     is saved, so a later failure still has something honest to fall back on. */
  function refresh() {
    return fromCsv()
      .catch(function () { return fromScript(); })
      .then(function (names) { save(names); return names; });
  }

  global.Claimed = {
    configure: configure,
    cached: cached,
    save: save,
    refresh: refresh,
    parseCsv: parseCsv,
    KEY: KEY
  };
})(window);
