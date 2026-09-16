/* ================================================================
   The garden the invitation sits in.

   The invitation carries its own copy of this, grown into its opening
   sequence, so this file steps aside when it finds one already there.
   Everywhere else — the gift list, the photographs, the thank you — it
   paints the same three layers, so the pages feel like one place rather
   than four:

     the garden   out-of-focus stems behind the card
     the vines    down each margin, drawn in as you scroll
     the blossoms a slow, sparse fall

   All of it is decoration. If this file never loads, every page still
   reads exactly the same.
   ================================================================ */
(function () {
  "use strict";

  if (document.querySelector(".garden")) return;   /* the invitation brings its own */

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- the look ---------- */
  var css = [
    ".garden{position:fixed; inset:0; pointer-events:none; z-index:0; opacity:.28; filter:blur(1.5px);}",
    /* width in vh so the art keeps its 40:1000 ratio and fits the gutter at
       any viewport, instead of being cropped — which is what kept it off phones */
    ".vine{position:fixed; top:0; height:100vh; width:4vh; pointer-events:none; z-index:0; opacity:.6;}",
    ".vine--left{left:0;} .vine--right{right:0; transform:scaleX(-1);}",
    ".vine__bud{opacity:0; transform:scale(.2); transform-box:fill-box; transform-origin:center;",
    "  transition:opacity .55s ease, transform .55s cubic-bezier(.2,.9,.3,1.2);}",
    ".blossoms{position:fixed; inset:0; pointer-events:none; z-index:3; overflow:hidden;}",
    ".blossom{position:absolute; top:-4vh; border-radius:50%; background:#FFFFFF; opacity:0;",
    "  box-shadow:0 0 6px rgba(255,255,255,.55); animation:drift linear forwards;}",
    "@keyframes drift{0%{opacity:0; transform:translate3d(0,0,0) scale(.7);}",
    "  12%{opacity:.9;} 100%{opacity:0; transform:translate3d(var(--dx),108vh,0) scale(1);}}",
    /* the vine needs a margin to live in, the same one the invitation keeps */
    "body{padding-left:clamp(38px,4vw,56px); padding-right:clamp(38px,4vw,56px);}",
    /* and the card gives that width back on the inside, so nothing feels pinched */
    "@media (max-width:520px){ .card{padding-left:20px; padding-right:20px;} }",
    "@media (prefers-reduced-motion:reduce){ .blossoms{display:none;} .vine__bud{opacity:1; transform:none;} }"
  ].join("\n");

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- the layers ---------- */
  var SVG = "http://www.w3.org/2000/svg";

  function draw(markup, cls) {
    var wrap = document.createElementNS(SVG, "svg");
    wrap.setAttribute("class", cls);
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = markup;
    return wrap;
  }

  var garden = draw(
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
    '<circle cx="615" cy="560" r="4"/></g>', "garden");
  garden.setAttribute("viewBox", "0 0 1200 800");
  garden.setAttribute("preserveAspectRatio", "xMidYMid slice");

  var buds = [
    [".10", 4, 97, 2.4], [".11", 2, 104, 1.4], [".12", 8, 103, 1.3],
    [".23", 37, 225, 2.5], [".24", 34, 232, 1.5], [".25", 39, 232, 1.2],
    [".41", 2, 404, 2.4], [".42", 6, 398, 1.4], [".43", 5, 411, 1.2],
    [".58", 35, 578, 2.5], [".59", 32, 585, 1.5], [".60", 38, 586, 1.2],
    [".76", 3, 752, 2.4], [".77", 7, 745, 1.4], [".78", 6, 759, 1.2],
    [".91", 33, 898, 2.4], [".92", 30, 905, 1.4], [".93", 36, 906, 1.2]
  ].map(function (b) {
    return '<circle class="vine__bud" data-at="' + b[0] + '" cx="' + b[1] + '" cy="' + b[2] + '" r="' + b[3] + '" fill="#FFFFFF" stroke="#C3D3B6" stroke-width=".5"/>';
  }).join("");

  var vine = draw(
    '<path class="vine__stem" fill="none" stroke="#7FA55C" stroke-width="1.4" stroke-linecap="round" ' +
    'd="M22 -10 C 7 110, 33 205, 15 325 C 3 430, 31 535, 13 660 C 2 770, 28 870, 20 1010"/>' + buds,
    "vine vine--left");
  vine.setAttribute("viewBox", "0 0 40 1000");
  vine.setAttribute("preserveAspectRatio", "xMinYMid slice");

  /* the thank-you page already keeps its own fall going; we only ever add
     a stage where there isn't one, and leave the falling to whoever owns it */
  var stage = document.querySelector(".blossoms");
  var ours = !stage;
  if (ours) {
    stage = document.createElement("div");
    stage.className = "blossoms";
    stage.setAttribute("aria-hidden", "true");
  }

  document.body.insertBefore(garden, document.body.firstChild);
  garden.after(vine);
  if (ours) document.body.appendChild(stage);

  if (reduced) return;   /* everything below is movement */

  var right = vine.cloneNode(true);
  right.setAttribute("class", "vine vine--right");
  vine.after(right);

  /* ---------- the garden drifts a little as you scroll ---------- */
  var ticking = false;
  addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      garden.style.transform = "translate3d(0," + (scrollY * 0.10).toFixed(1) + "px,0)";
      ticking = false;
    });
  }, { passive: true });

  /* ---------- the vines grow as you scroll ---------- */
  var rigs = [].slice.call(document.querySelectorAll(".vine")).map(function (svg) {
    var stem = svg.querySelector(".vine__stem");
    var len = stem.getTotalLength();
    stem.style.strokeDasharray = len;
    stem.style.strokeDashoffset = len;
    return { stem: stem, len: len, buds: [].slice.call(svg.querySelectorAll(".vine__bud")) };
  });

  var queued = false;
  function grow() {
    queued = false;
    var max = document.documentElement.scrollHeight - innerHeight;
    /* a short page has nothing to scroll, so the vine simply arrives whole */
    var p = max > 8 ? Math.min(1, Math.max(0, scrollY / max)) : 1;
    rigs.forEach(function (rig) {
      rig.stem.style.strokeDashoffset = rig.len * (1 - p);
      rig.buds.forEach(function (b) {
        var open = p >= Number(b.dataset.at);
        b.style.opacity = open ? "1" : "0";
        b.style.transform = open ? "scale(1)" : "scale(.2)";
      });
    });
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(grow); } }
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue, { passive: true });
  grow();

  /* ---------- a slow, sparse fall ---------- */
  function blossom(n) {
    for (var i = 0; i < n; i++) {
      var b = document.createElement("span");
      var size = 3 + Math.random() * 5;
      b.className = "blossom";
      b.style.width = b.style.height = size + "px";
      b.style.left = Math.random() * 100 + "vw";
      b.style.setProperty("--dx", (Math.random() * 90 - 45) + "px");
      b.style.animationDuration = (9 + Math.random() * 7) + "s";
      b.style.animationDelay = (Math.random() * 6) + "s";
      b.addEventListener("animationend", function () { this.remove(); });
      stage.appendChild(b);
    }
  }
  if (!ours) return;   /* the page was already dropping its own */
  blossom(8);
  var budget = 24;
  var timer = setInterval(function () {
    if (budget <= 0 || document.hidden) { if (budget <= 0) clearInterval(timer); return; }
    budget -= 1;
    blossom(1);
  }, 6000);
})();
