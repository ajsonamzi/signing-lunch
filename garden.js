/* ================================================================
   The garden every page sits in.

   One file, so every page moves the same way. The invitation's opening
   card is the standard: nothing a guest reaches from it should feel
   stiller than the card they started on. Every page gets all of this:

     the garden    out-of-focus stems behind the card, drifting with scroll
     the vines     down each margin, drawn in as you scroll — or grown in
                   once, on a page too short to scroll
     the sprigs    baby's breath at two corners of the card, drawn stem by
                   stem, the buds opening after, then a slow sway
     the blossoms  a fall on arrival that thickens towards the end of the
                   page, or trickles on a page with nowhere to scroll
     the reveal    each part rises into place as it is reached; mark it
                   with data-reveal (a number there is an extra delay in ms)

   Load it in <head>, before the page's own scripts. That keeps anything
   marked data-reveal hidden from the very first paint, instead of showing
   it, hiding it and bringing it back. It is decoration: if this file never
   loads, nothing is hidden and every page still reads exactly the same.

   The invitation holds the vines and the fall with data-garden="hold" on
   <body> until the card is opened, then calls Garden.release().
   A page that should keep celebrating sets data-fall="celebrate".

   With reduced motion asked for, everything is shown whole and still.
   ================================================================ */
(function (global) {
  "use strict";

  var doc = global.document, root = doc.documentElement;
  if (global.Garden) return;

  var reduced = !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var canObserve = "IntersectionObserver" in global;
  var moving = !reduced && canObserve;
  var SVG = "http://www.w3.org/2000/svg";

  /* ---------- the look ---------- */
  var css = [
    ".garden{position:fixed; inset:0; pointer-events:none; z-index:0; opacity:.28; filter:blur(1.5px);",
    "  will-change:transform; animation:garden-in 1.4s ease backwards;}",
    "@keyframes garden-in{from{opacity:0;}}",
    /* width in vh so the art keeps its 40:1000 ratio and fits the gutter at
       any viewport, instead of being cropped — which is what kept it off phones */
    ".vine{position:fixed; top:0; height:100vh; width:4vh; pointer-events:none; z-index:0; opacity:.6;",
    "  animation:garden-in 1.4s ease backwards;}",
    ".vine--left{left:0;} .vine--right{right:0; transform:scaleX(-1);}",
    ".vine__bud{opacity:0; transform:scale(.2); transform-box:fill-box; transform-origin:center;",
    "  transition:opacity .55s ease, transform .55s cubic-bezier(.2,.9,.3,1.2);}",
    /* the vine needs a gutter to live in; on a tall screen 4vh outgrows the
       usual one, so the gutter grows with it instead of the vine going under the card */
    "body{padding-left:max(clamp(38px,4vw,56px),4vh); padding-right:max(clamp(38px,4vw,56px),4vh);}",
    ".card{z-index:1;}",

    ".sprig{position:absolute; pointer-events:none;}",
    ".sprig--tl{top:-6px; left:-10px; width:var(--sprig-tl,min(230px,42%)); animation:sway-tl 9s ease-in-out 1.6s infinite;}",
    ".sprig--br{bottom:-14px; right:-16px; width:var(--sprig-br,min(260px,46%)); transform:rotate(180deg);",
    "  animation:sway-br 11s ease-in-out 2.2s infinite;}",
    /* the two keyframe sets differ only in carrying each sprig's resting rotation */
    "@keyframes sway-tl{0%,100%{transform:rotate(0deg) translate3d(0,0,0);} 50%{transform:rotate(1.1deg) translate3d(0,-5px,0);}}",
    "@keyframes sway-br{0%,100%{transform:rotate(180deg) translate3d(0,0,0);} 50%{transform:rotate(181.1deg) translate3d(0,-5px,0);}}",
    "@media (max-width:520px){ .sprig--tl{width:var(--sprig-tl-phone,44%);} .sprig--br{width:var(--sprig-br-phone,48%);} }",

    ".blossoms{position:fixed; inset:0; pointer-events:none; z-index:3; overflow:hidden;}",
    ".blossom{position:absolute; top:-4vh; border-radius:50%; background:#FFFFFF; opacity:0;",
    "  box-shadow:0 0 6px rgba(255,255,255,.55); animation:drift linear forwards;}",
    "@keyframes drift{0%{opacity:0; transform:translate3d(0,0,0) scale(.7);}",
    "  12%{opacity:.9;} 100%{opacity:0; transform:translate3d(var(--dx),108vh,0) scale(1);}}",

    /* hidden only while this file is running and motion is wanted; the
       attribute is taken off once each part has arrived, so the page's own
       transitions (a button's hover, a crossed-off gift) are left untouched */
    "html.garden-moving [data-reveal]{transition:opacity 1s cubic-bezier(.22,.9,.28,1), transform 1s cubic-bezier(.22,.9,.28,1);}",
    "html.garden-moving [data-reveal]:not(.is-in){opacity:0; transform:translateY(20px);}",

    "@media (prefers-reduced-motion:reduce){ .blossoms{display:none;} .vine__bud{opacity:1; transform:none;} }"
  ].join("\n");

  var style = doc.createElement("style");
  style.id = "garden-style";
  style.textContent = css;
  (doc.head || root).appendChild(style);
  if (moving) root.classList.add("garden-moving");

  /* ---------- the art ---------- */
  var GARDEN_ART =
    '<g fill="none" stroke="#7FA55C" stroke-width="1.2" stroke-linecap="round">' +
    '<path d="M90 800 C 120 620, 60 520, 130 380 C 170 300, 140 240, 175 160"/>' +
    '<path d="M175 160 C 210 210, 245 205, 268 170"/>' +
    '<path d="M130 380 C 180 400, 230 380, 250 340"/>' +
    '<path d="M1110 800 C 1080 640, 1140 540, 1070 400 C 1030 320, 1060 250, 1025 175"/>' +
    '<path d="M1025 175 C 990 225, 955 220, 932 185"/>' +
    '<path d="M1070 400 C 1020 420, 970 400, 950 360"/>' +
    '<path d="M600 800 C 620 700, 580 640, 615 560"/>' +
    '</g><g fill="#FFFFFF" opacity=".85">' +
    '<circle cx="268" cy="170" r="5"/><circle cx="250" cy="340" r="4"/><circle cx="175" cy="160" r="4"/>' +
    '<circle cx="932" cy="185" r="5"/><circle cx="950" cy="360" r="4"/><circle cx="1025" cy="175" r="4"/>' +
    '<circle cx="615" cy="560" r="4"/></g>';

  var VINE_BUDS = [
    [".10", 4, 97, 2.4], [".11", 2, 104, 1.4], [".12", 8, 103, 1.3],
    [".23", 37, 225, 2.5], [".24", 34, 232, 1.5], [".25", 39, 232, 1.2],
    [".41", 2, 404, 2.4], [".42", 6, 398, 1.4], [".43", 5, 411, 1.2],
    [".58", 36, 565, 2.5], [".59", 33, 573, 1.5], [".60", 38, 572, 1.2],
    [".78", 3, 770, 2.4], [".79", 7, 764, 1.4], [".80", 6, 777, 1.2]
  ];
  var VINE_ART =
    '<g fill="none" stroke="#7FA55C" stroke-width="2" stroke-linecap="round">' +
    '<path class="vine__stem" d="M22 -10 C 7 110, 33 205, 15 325 C 3 430, 31 535, 13 660 C 2 770, 28 870, 20 1010"/>' +
    '<path d="M14 118 C 10 104, 7 98, 4 97"/>' +
    '<path d="M27 245 C 31 231, 34 226, 37 225"/>' +
    '<path d="M9 425 C 6 411, 4 405, 2 404"/>' +
    '<path d="M26 585 C 30 571, 33 566, 36 565"/>' +
    '<path d="M11 790 C 8 777, 5 771, 3 770"/>' +
    '</g><g fill="#FFFFFF" stroke="#C3D3B6" stroke-width=".8">' +
    VINE_BUDS.map(function (b) {
      return '<circle class="vine__bud" data-at="' + b[0] + '" cx="' + b[1] + '" cy="' + b[2] + '" r="' + b[3] + '"/>';
    }).join("") +
    '</g>';

  var SPRIG_ART =
    '<g class="stems" fill="none" stroke="#3C6444" stroke-width="1.3" stroke-linecap="round" opacity=".75">' +
    '<path d="M8 6 C 60 40, 90 70, 120 120"/>' +
    '<path d="M60 40 C 78 32, 96 34, 112 46"/>' +
    '<path d="M90 70 C 104 92, 108 112, 104 134"/>' +
    '<path d="M120 120 C 148 132, 172 130, 196 116"/>' +
    '<path d="M30 20 C 34 44, 30 62, 18 78"/>' +
    '<path d="M120 120 C 130 148, 128 172, 114 192"/>' +
    '</g><g class="buds" fill="#FFFFFF" stroke="#C3D3B6" stroke-width=".6">' +
    '<circle cx="112" cy="46" r="6"/><circle cx="124" cy="38" r="4"/><circle cx="104" cy="34" r="3.4"/>' +
    '<circle cx="104" cy="134" r="6.4"/><circle cx="96" cy="146" r="4"/><circle cx="112" cy="146" r="3.4"/>' +
    '<circle cx="196" cy="116" r="7"/><circle cx="208" cy="106" r="4.4"/><circle cx="204" cy="126" r="3.6"/>' +
    '<circle cx="18" cy="78" r="6"/><circle cx="10" cy="90" r="3.6"/><circle cx="26" cy="90" r="3.2"/>' +
    '<circle cx="114" cy="192" r="6.6"/><circle cx="104" cy="202" r="4"/><circle cx="124" cy="202" r="3.4"/>' +
    '</g>';

  function draw(cls, viewBox, aspect, markup) {
    var s = doc.createElementNS(SVG, "svg");
    s.setAttribute("class", cls);
    s.setAttribute("viewBox", viewBox);
    if (aspect) s.setAttribute("preserveAspectRatio", aspect);
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    s.innerHTML = markup;
    return s;
  }

  function scrollMax() { return root.scrollHeight - global.innerHeight; }
  var raf = global.requestAnimationFrame ? global.requestAnimationFrame.bind(global) : function (f) { return global.setTimeout(function () { f(Date.now()); }, 16); };

  /* ================================================================
     THE BLOSSOMS
     ================================================================ */
  var stage = null;
  function ensureStage() {
    if (stage && stage.isConnected) return stage;
    stage = doc.querySelector(".blossoms");
    if (!stage && doc.body) {
      stage = doc.createElement("div");
      stage.className = "blossoms";
      stage.setAttribute("aria-hidden", "true");
      doc.body.appendChild(stage);
    }
    return stage;
  }

  function fall(n) {
    if (reduced) return;
    var s = ensureStage();
    if (!s) return;
    for (var i = 0; i < n; i++) {
      var b = doc.createElement("span");
      var size = 3 + Math.random() * 5;
      b.className = "blossom";
      b.style.width = b.style.height = size + "px";
      b.style.left = Math.random() * 100 + "vw";
      b.style.setProperty("--dx", (Math.random() * 90 - 45) + "px");
      b.style.animationDuration = (9 + Math.random() * 7) + "s";
      b.style.animationDelay = (Math.random() * 6) + "s";
      b.addEventListener("animationend", function () { this.remove(); });
      s.appendChild(b);
    }
  }

  /* ================================================================
     THE REVEAL
     Each part rises into place as it is reached. If a part is seen, every
     part above it is brought in too: a jump straight down the page — a
     restored scroll position, an anchor, the End key — never reports the
     parts it skipped, and they would otherwise sit invisible.
     ================================================================ */
  var parts = [];          /* { el, delay, stagger, done, arrived, then: [] } */
  var io = null, delivered = false, netSet = false;

  function recordFor(el) {
    for (var i = 0; i < parts.length; i++) if (parts[i].el === el) return parts[i];
    return null;
  }

  function arrive(rec, delay) {
    if (rec.done) return;
    rec.done = true;
    if (io) io.unobserve(rec.el);
    global.setTimeout(function () {
      rec.el.classList.add("is-in");
      rec.arrived = true;
      var then = rec.then; rec.then = [];
      then.forEach(function (fn) { try { fn(rec.el); } catch (e) {} });
      /* once it has arrived, hand the element back to the page's own styles */
      global.setTimeout(function () {
        rec.el.removeAttribute("data-reveal");
        rec.el.classList.remove("is-in");
      }, 1100);
    }, delay);
  }

  function onSeen(entries) {
    delivered = true;
    var vh = global.innerHeight;
    var hits = [];
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      /* a tall part (a long list) may never be 18% on screen, so a quarter
         of the screen's height counts as seen too */
      if (e.intersectionRatio < 0.18 && e.intersectionRect.height < vh * 0.25) return;
      var rec = recordFor(e.target);
      if (rec && !rec.done) hits.push(rec);
    });
    if (!hits.length) return;
    hits.sort(function (a, b) {
      return a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1;   /* 4: b follows a */
    });
    var last = hits[hits.length - 1].el;
    parts = parts.filter(function (r) {
      if (r.el.isConnected) return true;
      if (io) io.unobserve(r.el);   /* a list drawn again leaves its old rows behind */
      return false;
    });
    parts.forEach(function (r) {
      if (!r.done && hits.indexOf(r) === -1 && r.el.isConnected && (r.el.compareDocumentPosition(last) & 4)) arrive(r, 0);
    });
    var step = 0;
    hits.forEach(function (rec) {
      var d = rec.delay + (rec.stagger ? Math.min(step++, 10) * rec.stagger : 0);
      arrive(rec, d);
    });
  }

  function showEverything() {
    parts.forEach(function (r) { arrive(r, 0); });
  }

  function reveal(list, opts) {
    var els = [].slice.call(list && list.length !== undefined ? list : [list]).filter(Boolean);
    var stagger = (opts && opts.stagger) || 0;
    els.forEach(function (el) {
      if (recordFor(el)) return;
      var d = Number(el.getAttribute("data-reveal"));
      var rec = { el: el, delay: isFinite(d) ? d : 0, stagger: stagger, done: false, arrived: false, then: [] };
      if (!moving) { rec.done = rec.arrived = true; el.removeAttribute("data-reveal"); parts.push(rec); return; }
      if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", "");
      parts.push(rec);
      if (!io) {
        io = new IntersectionObserver(onSeen, { threshold: [0, 0.02, 0.05, 0.1, 0.18, 0.3, 0.5], rootMargin: "0px 0px -6% 0px" });
      }
      io.observe(el);
    });
    /* safety net: if the observer never reports back, show everything rather
       than leave the page invisible */
    if (moving && !netSet) {
      netSet = true;
      global.setTimeout(function () { if (!delivered) showEverything(); }, 2000);
    }
  }

  /* Run fn when el has arrived — straight away if it already has, or if it
     was never waiting. The countdown uses this to count from the moment it
     is first seen. */
  function whenRevealed(el, fn) {
    if (!el) return;
    var rec = recordFor(el);
    /* asked before the page has finished loading: take it on now */
    if (!rec && el.hasAttribute("data-reveal")) { reveal(el); rec = recordFor(el); }
    if (rec && !rec.arrived) rec.then.push(fn);
    else fn(el);
  }

  /* ================================================================
     THE LAYERS — built once the page is there
     ================================================================ */
  var held = null;         /* null until the page has said, one way or the other */
  var floor = 0;           /* how far the vine has grown on its own */
  var growing = false;
  var rigs = [];
  var shown = -1;
  var fallBudget = 30, lastPetal = 0;

  function paintVine(p) {
    if (Math.abs(p - shown) < 0.0005) return;
    shown = p;
    rigs.forEach(function (rig) {
      rig.stem.style.strokeDashoffset = rig.len * (1 - p);
      rig.buds.forEach(function (b) {
        var open = p >= Number(b.getAttribute("data-at"));
        b.style.opacity = open ? "1" : "0";
        b.style.transform = open ? "scale(1)" : "scale(.2)";
      });
    });
  }

  function vineTarget() {
    if (held) return 0;
    var max = scrollMax();
    var s = max > 8 ? Math.min(1, Math.max(0, global.scrollY / max)) : 0;
    return Math.max(floor, s);
  }

  var queued = false;
  function queue() {
    if (queued || reduced) return;
    queued = true;
    raf(function () { queued = false; paintVine(vineTarget()); });
  }

  /* a page too short to scroll has nothing to draw the vine in with, so it
     grows in once by itself, and stays grown if the page later gets longer */
  function growIfStill() {
    if (reduced || held || growing || floor >= 1) return;
    global.setTimeout(function () {
      if (held || growing || floor >= 1 || scrollMax() > 8) return;
      growing = true;
      var t0 = null;
      raf(function step(ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / 1800);
        floor = 1 - Math.pow(1 - k, 3);
        paintVine(vineTarget());
        if (k < 1) raf(step); else growing = false;
      });
    }, 350);
  }

  function arrival() {
    if (doc.body.getAttribute("data-fall") === "celebrate") {
      fall(14);
      var budget = 200;
      var t = global.setInterval(function () {
        if (budget <= 0) return global.clearInterval(t);
        if (doc.hidden) return;
        budget -= 1;
        fall(1);
      }, 2600);
      return;
    }
    fall(16);
    /* on a page with nowhere to scroll, a slow trickle stands in for the
       fall that would otherwise thicken towards the end */
    var trickle = 24;
    var t2 = global.setInterval(function () {
      if (trickle <= 0) return global.clearInterval(t2);
      if (doc.hidden || held || scrollMax() > 8) return;
      trickle -= 1;
      fall(1);
    }, 6000);
  }

  function build() {
    var body = doc.body;
    if (!body || body.getAttribute("data-garden-built")) return;
    body.setAttribute("data-garden-built", "1");
    if (held === null) held = body.getAttribute("data-garden") === "hold";

    var garden = draw("garden", "0 0 1200 800", "xMidYMid slice", GARDEN_ART);
    body.insertBefore(garden, body.firstChild);

    var left = draw("vine vine--left", "0 0 40 1000", "xMinYMid slice", VINE_ART);
    var right = draw("vine vine--right", "0 0 40 1000", "xMinYMid slice", VINE_ART);
    garden.after(left);
    left.after(right);
    ensureStage();

    /* baby's breath at two corners of the card */
    var card = doc.querySelector(".card");
    if (card && !card.querySelector(".sprig")) {
      var br = draw("sprig sprig--br", "0 0 260 220", null, SPRIG_ART);
      var tl = draw("sprig sprig--tl", "0 0 260 220", null, SPRIG_ART);
      card.insertBefore(br, card.firstChild);
      card.insertBefore(tl, card.firstChild);
    }

    /* anything marked in the page's own markup */
    reveal(doc.querySelectorAll("[data-reveal]"));

    if (reduced) return;   /* everything below is movement */

    /* ---------- the sprigs draw themselves: stems first, then the buds open ---------- */
    [].slice.call(doc.querySelectorAll(".sprig")).forEach(function (sprig, s) {
      [].slice.call(sprig.querySelectorAll(".stems path")).forEach(function (p, i) {
        var len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        if (!p.animate) { p.style.strokeDashoffset = 0; return; }
        p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
          duration: 1100, delay: 200 + s * 160 + i * 110, fill: "forwards",
          easing: "cubic-bezier(.35,.9,.35,1)"
        });
      });
      [].slice.call(sprig.querySelectorAll(".buds circle")).forEach(function (c, i) {
        if (!c.animate) return;
        c.style.transformOrigin = c.getAttribute("cx") + "px " + c.getAttribute("cy") + "px";
        c.style.opacity = 0;
        c.animate([{ opacity: 0, transform: "scale(.2)" }, { opacity: 1, transform: "scale(1)" }], {
          duration: 620, delay: 900 + s * 160 + i * 55, fill: "forwards",
          easing: "cubic-bezier(.2,.9,.3,1.2)"
        });
      });
    });

    /* ---------- the vines ---------- */
    rigs = [left, right].map(function (svg) {
      var stem = svg.querySelector(".vine__stem");
      var len = stem.getTotalLength();
      stem.style.strokeDasharray = len;
      stem.style.strokeDashoffset = len;
      return { stem: stem, len: len, buds: [].slice.call(svg.querySelectorAll(".vine__bud")) };
    });
    paintVine(vineTarget());

    /* ---------- one scroll listener for everything that follows the scroll ---------- */
    var ticking = false;
    global.addEventListener("scroll", function () {
      queue();
      if (!ticking) {
        ticking = true;
        raf(function () {
          garden.style.transform = "translate3d(0," + (global.scrollY * 0.10).toFixed(1) + "px,0)";
          ticking = false;
        });
      }
      /* the fall thickens towards the end of the page */
      if (held || fallBudget <= 0) return;
      var max = scrollMax();
      if (max <= 8) return;
      var p = global.scrollY / max;
      if (p < 0.6) return;
      var now = Date.now();
      if (now - lastPetal < 420 - (p - 0.6) * 700) return;
      lastPetal = now;
      fallBudget -= 1;
      fall(1);
    }, { passive: true });
    global.addEventListener("resize", function () { queue(); growIfStill(); }, { passive: true });
    global.addEventListener("load", growIfStill);

    if (!held) { arrival(); growIfStill(); }
  }

  /* ================================================================
     WHAT A PAGE CAN ASK FOR
     ================================================================ */
  global.Garden = {
    reduced: reduced,
    reveal: reveal,
    whenRevealed: whenRevealed,
    fall: fall,
    /* the invitation's card has been opened: let the garden go */
    release: function () {
      var was = held;
      held = false;
      if (!doc.body || !doc.body.getAttribute("data-garden-built")) return;   /* build() will see held === false */
      if (was !== false) { arrival(); }
      queue();
      growIfStill();
    }
  };

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", build);
  else build();
})(window);
