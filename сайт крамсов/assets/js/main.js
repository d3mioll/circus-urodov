/* ==========================================================
   CIRK_URDOV.SYS — логика интерфейса
   ========================================================== */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

  /* ────────────────────────────────────────────────
     2. ЗАГРУЗКА
     ──────────────────────────────────────────────── */
  var boot = $('#boot'), bootLog = $('#bootLog'), bootBar = $('#bootBar'), bootPct = $('#bootPct');
  function killBoot() {
    if (!boot || boot.classList.contains('out')) return;
    boot.classList.add('out');
    setTimeout(function () { if (boot.parentNode) boot.parentNode.removeChild(boot); }, 1000);
  }
  if (boot) {
    var blines = [
      '> монтирование разделов ... <b>ok</b>',
      '> связь с узлами ... <b>5 online</b>',
      '> синхронизация открытых источников ... <b>ok</b>',
      '> загрузка реестра ... <u>7 записей</u>',
      '> система готова'
    ];
    var p = 0, li = 0;
    if (reduced) {
      bootLog.innerHTML = blines.join('\n').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      bootBar.style.width = '100%'; bootPct.textContent = '100%';
      setTimeout(killBoot, 260);
    } else {
      var step = setInterval(function () {
        p = Math.min(p + Math.random() * 16 + 6, 100);
        bootBar.style.width = p + '%';
        bootPct.textContent = (p < 10 ? '0' : '') + Math.floor(p) + '%';
        var want = Math.min(blines.length, Math.ceil(p / 22));
        while (li < want) { bootLog.innerHTML += (li ? '\n' : '') + blines[li++]; }
        if (p >= 100) {
          clearInterval(step);
          while (li < blines.length) { bootLog.innerHTML += '\n' + blines[li++]; }
          setTimeout(killBoot, 420);
        }
      }, 110);
    }
    addEventListener('load', function () { setTimeout(killBoot, 1200); });
  }

  /* ────────────────────────────────────────────────
     4. ЭКРАН: глитч-заголовок + печать команды
     ──────────────────────────────────────────────── */
  var log = $('#log');
  if (log && !reduced) {
    var lines = [
      '> подключение к узлам сети ... <b>ok</b>',
      '> загрузка открытых источников: <u>' + new Date().getFullYear() + '</u> ... <b>ok</b>',
      '> инициализация реестра услуг ... <b>7 записей</b>',
      '> готов к работе'
    ];
    var i = 0;
    (function next() {
      if (i >= lines.length) return;
      log.innerHTML += (i ? '\n' : '') + lines[i++];
      setTimeout(next, 260 + Math.random() * 200);
    })();
  }

  /* глитч: текст собирается из символов при появлении */
  var GLYPHS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ01#$%&@/\\|<>{}[]';
  $$('[data-glitch]').forEach(function (el) {
    var final = el.getAttribute('data-text') || el.textContent;
    if (reduced) { el.textContent = final; return; }
    var n = 0, total = final.length;
    el.textContent = final;
    var iv = setInterval(function () {
      var out = '';
      for (var k = 0; k < total; k++) {
        out += (k < n) ? final[k] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      n += 0.9;
      if (n >= total) { clearInterval(iv); el.textContent = final; jolt(el); }
    }, 42);
  });

  function jolt(el) {
    el.classList.remove('jolt');
    void el.offsetWidth;
    el.classList.add('jolt');
    setTimeout(function () { el.classList.remove('jolt'); }, 1000);
  }

  /* печать команды в строке терминала */
  var cmd = $('#cmd');
  if (cmd && !reduced) {
    var seq = 'ls -la ./services', c = 0;
    (function type() {
      if (c > seq.length) { setTimeout(function () { cmd.textContent = ''; c = 0; setTimeout(type, 2600); }, 2000); return; }
      cmd.textContent = seq.slice(0, ++c);
      setTimeout(type, 55);
    })();
  }

  /* ────────────────────────────────────────────────
     4. РЕЙЛ: активный раздел + бургер
     ──────────────────────────────────────────────── */
  var rail = $('#rail'), burger = $('#burger');
  var railLinks = $$('.rail__i');

  if ('IntersectionObserver' in window) {
    var secs = railLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        railLinks.forEach(function (a) {
          a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { if (s) sio.observe(s); });
  }

  if (burger) {
    burger.addEventListener('click', function () {
      var open = rail.classList.toggle('open');
      burger.classList.toggle('x', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    railLinks.forEach(function (a) {
      a.addEventListener('click', function () {
        rail.classList.remove('open');
        burger.classList.remove('x');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && rail.classList.contains('open')) burger.click();
    });
  }

  /* ────────────────────────────────────────────────
     5. РЕЕСТР: фильтры + раскрытие строк
     ──────────────────────────────────────────────── */
  var tabs = $$('.tab'), ents = $$('.ent'), none = $('#regNone');
  var subs = $$('#reg .sub');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-selected', 'false'); x.tabIndex = -1; });
      t.classList.add('is-on');
      t.setAttribute('aria-selected', 'true');
      t.tabIndex = 0;
      var f = t.getAttribute('data-filter'), shown = 0;
      ents.forEach(function (e) {
        var ok = f === 'all' || e.getAttribute('data-kind') === f;
        e.classList.toggle('hide', !ok);
        if (ok) shown++;
      });
      // пустые подразделы прячем
      subs.forEach(function (s) {
        var alive = $$('.ent', s).some(function (e) { return !e.classList.contains('hide'); });
        s.classList.toggle('is-empty', !alive);
      });
      if (none) none.hidden = shown > 0;
    });
  });

  // стрелки переключают фильтр (roving tabindex)
  if (tabs.length) {
    var tablist = tabs[0].parentNode;
    tablist.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
            : e.key === 'ArrowLeft'  || e.key === 'ArrowUp'   ? -1 : 0;
      if (!d && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      var n = e.key === 'Home' ? 0
            : e.key === 'End'  ? tabs.length - 1
            : (i + d + tabs.length) % tabs.length;
      tabs.forEach(function (x, k) { x.tabIndex = k === n ? 0 : -1; });
      tabs[n].focus();
      tabs[n].click();
    });
  }

  $$('.ent__more').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var ent = b.closest('.ent');
      var open = ent.classList.toggle('open');
      b.setAttribute('aria-expanded', String(open));
    });
  });
  $$('.ent').forEach(function (ent) {
    ent.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      var b = $('.ent__more', ent);
      if (b) b.click();
    });
  });

  /* ────────────────────────────────────────────────
     6. СЧЁТЧИКИ
     ──────────────────────────────────────────────── */
  function run(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    var dec = (String(target).split('.')[1] || '').length;
    var t0 = performance.now(), dur = 1000;
    function step(now) {
      var p = Math.min((now - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(dec);
    }
    requestAnimationFrame(step);
  }
  var nums = $$('[data-count]');
  if ('IntersectionObserver' in window && !reduced) {
    var nio = new IntersectionObserver(function (e, o) {
      e.forEach(function (en) { if (en.isIntersecting) { run(en.target); o.unobserve(en.target); } });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { nio.observe(n); });
  }

  /* ────────────────────────────────────────────────
     7. FAQ: аккордеон
     ──────────────────────────────────────────────── */
  var qas = $$('.qa');
  qas.forEach(function (qa) {
    qa.addEventListener('toggle', function () {
      if (!qa.open) return;
      qas.forEach(function (o) { if (o !== qa) o.open = false; });
    });
  });

  /* ────────────────────────────────────────────────
     8. КОПИРОВАНИЕ ССЫЛКИ (ПКМ)
     ──────────────────────────────────────────────── */
  $$('.nd__r').forEach(function (r) {
    r.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(r.getAttribute('href'));
        var g = $('.nd__go', r);
        if (g) { g.textContent = '✓'; setTimeout(function () { g.textContent = '→'; }, 1100); }
      }
    });
  });

  /* ────────────────────────────────────────────────
     9. ПОЯВЛЕНИЕ ПРИ СКРОЛЛЕ
     ──────────────────────────────────────────────── */
  var rev = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (e, o) {
      e.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); o.unobserve(en.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    rev.forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 0.06 + 's'; io.observe(el); });
  } else {
    rev.forEach(function (el) { el.classList.add('in'); });
  }

  /* ────────────────────────────────────────────────
     10. ВВЕРХ
     ──────────────────────────────────────────────── */
  var up = $('#toTop');
  addEventListener('scroll', function () {
    if (up) up.classList.toggle('show', window.scrollY > 700);
  }, { passive: true });
  if (up) up.addEventListener('click', function () { scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });

  /* ────────────────────────────────────────────────
     11. ГОД
     ──────────────────────────────────────────────── */
  var y = $('#year');
  if (y) y.textContent = new Date().getFullYear();

  /* ────────────────────────────────────────────────
     13. МАГНИТНЫЕ КНОПКИ
     ──────────────────────────────────────────────── */
  if (fine && !reduced) {
    $$('.kbtn').forEach(function (b) {
      b.classList.add('mag');
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.28;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.34;
        b.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ────────────────────────────────────────────────
     14. СТУПЕНЧАТОЕ ПОЯВЛЕНИЕ СПИСКОВ
     ──────────────────────────────────────────────── */
  $$('#reg .ent, .flow > .fl, .pay > .pay__c, .nd > .nd__r').forEach(function (k) {
    k.classList.add('stg');
  });
  if ('IntersectionObserver' in window && !reduced) {
    var gio = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        $$('.stg', en.target).forEach(function (k, i) {
          setTimeout(function () { k.classList.add('in'); }, i * 70);
        });
        obs.unobserve(en.target);
      });
    }, { threshold: 0.12 });
    $$('#reg, .flow, .pay, .nd').forEach(function (g) { gio.observe(g); });
  } else {
    $$('#reg, .flow, .pay, .nd').forEach(function (g) {
      $$('.stg', g).forEach(function (k) { k.classList.add('in'); });
    });
  }

  /* ────────────────────────────────────────────────
     15. СЧЁТЧИК ПОЗИЦИЙ В СТРОКЕ СОСТОЯНИЯ
     ──────────────────────────────────────────────── */
  var scrMeta = $('.scr__l');
  if (scrMeta) scrMeta.classList.add('count');

  /* ────────────────────────────────────────────────
     16. ВОЛНА ПРИ КЛИКЕ ПО СТРОКАМ
     ──────────────────────────────────────────────── */
  $$('.nd__r, .ent, .fl').forEach(function (row) {
    row.addEventListener('click', function (e) {
      if (e.target.closest('a,button,.ent__more,summary')) return;
      var r = row.getBoundingClientRect();
      var s = document.createElement('span');
      s.style.cssText = 'position:absolute;border-radius:50%;pointer-events:none;' +
        'width:10px;height:10px;left:' + (e.clientX - r.left - 5) + 'px;top:' + (e.clientY - r.top - 5) + 'px;' +
        'background:rgba(237,237,234,.18);transform:scale(1);z-index:0';
      row.appendChild(s);
      var max = Math.max(r.width, r.height) * 2.2;
      s.animate(
        [{ transform: 'scale(1)', opacity: .8 }, { transform: 'scale(' + (max / 10) + ')', opacity: 0 }],
        { duration: 620, easing: 'cubic-bezier(.22,1,.36,1)' }
      ).onfinish = function () { s.remove(); };
    });
  });

  /* ────────────────────────────────────────────────
     17. ГЛИТЧ-ТОЛЧОК РЕЙЛА ПРИ НАВЕДЕНИИ
     ──────────────────────────────────────────────── */
  $$('.rail__i').forEach(function (a) {
    a.addEventListener('mouseenter', function () {
      a.classList.add('on');
      var s = a.querySelector('span');
      if (s && !reduced) {
        s.animate(
          [{ opacity: 0, transform: 'translateX(-4px)' }, { opacity: 1, transform: 'none' }],
          { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' }
        );
      }
    });
  });

  /* ────────────────────────────────────────────────
     18. БЕСШОВНАЯ ЛЕНТА
     Группа копируется до двойной ширины экрана,
     затем сдвигается ровно на одну группу — паузы нет.
     Скорость постоянная (px/сек), не зависит от ширины.
     ──────────────────────────────────────────────── */
  var marq = $('[data-marq]');
  var strip = marq && marq.closest('.scr__strip');
  if (marq && strip) {
    var base = $('.scr__gr', marq);
    var SPEED = 46;          // px в секунду
    var anim = null;

    function build() {
      if (anim) { anim.cancel(); anim = null; }
      strip.removeEventListener('mouseenter', onOver);
      strip.removeEventListener('mouseleave', onOut);
      marq.innerHTML = base.outerHTML;
      var one = $('.scr__gr', marq).offsetWidth;
      if (!one) return;
      var need = Math.ceil((innerWidth * 2) / one) + 1;
      for (var i = 1; i < need; i++) marq.insertAdjacentHTML('beforeend', base.outerHTML);
      if (reduced) return;
      anim = marq.animate(
        [{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(' + (-one) + 'px,0,0)' }],
        { duration: (one / SPEED) * 1000, iterations: Infinity, easing: 'linear' }
      );
      strip.addEventListener('mouseenter', onOver);
      strip.addEventListener('mouseleave', onOut);
    }
    function onOver() { if (anim) anim.playbackRate = 3; }
    function onOut()  { if (anim) anim.playbackRate = 1; }

    build();
    var rt;
    addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 180); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  }

})();
