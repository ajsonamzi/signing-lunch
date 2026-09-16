/* ================================================================
   THE DAY ITSELF — EVERYTHING YOU'LL WANT TO CHANGE LIVES HERE.

   Every page reads these: the invitation, the gift list and the thank
   you. Change a value once and all of them follow, so no page can ever
   quietly disagree with another about the date, the time or the place.

   The gift list itself lives in gifts.html, and the photographs in
   gallery.html, because only those pages use them.
   ================================================================ */
(function (global) {
  "use strict";

  var EVENT = {
    nameA: "Nande",
    nameB: "Ayanda",

    blurb: "By November, spring will be down to its last few days — so we're borrowing one. We'll make it official first, quickly and quietly, and then comes the good part: a long table, a longer lunch, and nobody in any particular hurry to leave.",

    dateLabel: "Sunday, 8 November 2026",
    timeLabel: "Arrive from 12:00",

    venue: "GROUND The Venue",
    address: "Plot 19 Driefontein Rd, Muldersdrift, 1747",

    dress: "Garden formal",
    dressNote: "Wear the thing you've been saving.",

    rsvpBy: "Thursday, 1 October 2026",

    // Replies and gift claims both land in one Google Sheet, via this script.
    endpoint: "https://script.google.com/macros/s/AKfycbyqA6ntOEJCfEBOg4Fm3seZvpJfefh2aakY4POFkBT6B9Z3ZM26iVfQprwYlv1iv8k/exec",

    // The Claimed tab of the same Sheet, published as CSV. Gift names only.
    claimedCsv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJLsqgbaJ-p6YSP1NT2x8k80PNz1dyVOERGwjk47gupBo2oqxIBAIQdbS1py_C1HiZItMmsHm27y2j/pub?gid=1198330541&single=true&output=csv",

    // WhatsApp number, here for questions rather than replies.
    whatsapp: "27607415890",

    // Used for the countdown and the calendar file. +02:00 is South African time.
    startsAt: "2026-11-08T12:00:00+02:00",
    endsAt:   "2026-11-08T17:00:00+02:00"
  };

  /* ================================================================
     Nothing below here needs changing for a new date or place.
     ================================================================ */

  var reduced = !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);

  EVENT.whatsappUrl = function (text) {
    return "https://wa.me/" + EVENT.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  };

  /* A "search" link works everywhere: opens the Google Maps app on iOS/Android
     if it's installed, and the Google Maps site in any browser if it isn't. */
  EVENT.mapsUrl = function () {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(EVENT.venue + ", " + EVENT.address);
  };

  /* ---------- days to go ----------
     Midnight in Johannesburg for a given moment, as a plain day number.
     Counting between calendar days rather than between instants is what makes
     the number tick over at midnight instead of at the hour the lunch starts,
     and makes it read the same for a guest in another timezone — and the same
     on every page, which it did not when each page did its own sums. */
  function jhbDay(d) {
    var ymd;
    try { ymd = d.toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" }); }
    catch (e) { ymd = ""; }
    if (!/^\d{4}-\d{2}-\d{2}/.test(ymd)) {   /* a browser without timezone data */
      var j = new Date(d.getTime() + 2 * 3600000);
      return Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate());
    }
    return Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10));
  }

  EVENT.daysToGo = function (now) {
    return Math.round((jhbDay(new Date(EVENT.startsAt)) - jhbDay(now || new Date())) / 86400000);
  };

  /* Writes the countdown into el. The number counts itself up, so call this
     at the moment the countdown is first seen rather than on page load. */
  EVENT.countdown = function (el) {
    if (!el || el.dataset.counted) return;
    el.dataset.counted = "1";
    var days = EVENT.daysToGo();
    if (days < 0) { el.textContent = ""; return; }
    if (days === 0) { el.innerHTML = "<strong>Today.</strong> See you at the table."; return; }
    if (days === 1) { el.innerHTML = "<strong>Tomorrow.</strong> Very nearly time."; return; }
    el.innerHTML = "<strong></strong> until the long lunch.";
    var strong = el.firstChild;
    var write = function (v) { strong.textContent = v + " days"; };
    if (reduced || !global.requestAnimationFrame) { write(days); return; }
    var from = Math.max(0, days - 45), t0 = null;
    write(from);
    var step = function (ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / 1100);
      write(Math.round(from + (days - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) global.requestAnimationFrame(step);
    };
    global.requestAnimationFrame(step);
  };

  /* ---------- the calendar file ----------
     Text is escaped the way the calendar format requires: an unescaped comma
     in the address is read by some calendars as the end of the location.
     The UID is fixed, so adding the day twice updates one event instead of
     making two, and long lines are folded as the format asks. */
  function icsText(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  }
  function icsStamp(d) {
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }
  function icsFold(line) {
    var out = "", octets = 0;
    for (var i = 0; i < line.length; i++) {
      var c = line.charAt(i), code = line.charCodeAt(i);
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < line.length) { c += line.charAt(++i); }
      var n = unescape(encodeURIComponent(c)).length;
      if (octets + n > 75) { out += "\r\n "; octets = 1; }
      out += c; octets += n;
    }
    return out;
  }

  EVENT.calendarFile = function () {
    var start = icsStamp(new Date(EVENT.startsAt));
    return [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//signing lunch//EN",
      "BEGIN:VEVENT",
      "UID:signing-lunch-" + start + "@ajsonamzi.github.io",
      "DTSTAMP:" + icsStamp(new Date()),
      "DTSTART:" + start,
      "DTEND:" + icsStamp(new Date(EVENT.endsAt)),
      "SUMMARY:" + icsText(EVENT.nameA + " & " + EVENT.nameB + " — signing lunch"),
      "LOCATION:" + icsText(EVENT.venue + ", " + EVENT.address),
      "DESCRIPTION:" + icsText(EVENT.timeLabel + ". " + EVENT.dress + "."),
      "END:VEVENT", "END:VCALENDAR"
    ].map(icsFold).join("\r\n") + "\r\n";
  };

  /* The link is kept alive for a minute: revoking it in the same tick as the
     click cancels the download in some browsers before it has started. */
  EVENT.downloadCalendar = function () {
    var url = URL.createObjectURL(new Blob([EVENT.calendarFile()], { type: "text/calendar;charset=utf-8" }));
    var a = document.createElement("a");
    a.href = url;
    a.download = "signing-lunch.ics";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    global.setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  };

  /* ---------- the guest's own name ----------
     Typed once, on whichever page comes first, and offered back on the
     others so nobody has to type it twice. It stays in this browser. */
  var GUEST_KEY = "signing-lunch:guest";
  EVENT.guest = {
    get: function () {
      try { return (global.localStorage.getItem(GUEST_KEY) || "").slice(0, 120); } catch (e) { return ""; }
    },
    set: function (name) {
      try { if (name) global.localStorage.setItem(GUEST_KEY, String(name).slice(0, 120)); } catch (e) {}
    }
  };

  global.EVENT = EVENT;
})(window);
