// Language menu shared by the Moon Arc Works sites (lang-menu.mjs says which files go together).
// Without scripts it is a <details> list of links. This adds: the search field (native name, English name, the
// page language's name and the code; accents and case don't matter), arrow keys across the grid, Tab kept inside
// while open, Escape and a click outside to close, and the phone sheet held to the bottom of the screen.
(() => {
  const fold = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
  const sheet = matchMedia('(max-width: 600px)');
  const fine = matchMedia('(pointer: fine)');
  let names = null;
  try { names = new Intl.DisplayNames([document.documentElement.lang || 'en'], { type: 'language' }); } catch { /* old browser */ }

  document.querySelectorAll('details[data-lm]').forEach((menu) => {
    const button = menu.querySelector('summary');
    const panel = menu.querySelector('.lm-panel');
    const top = menu.querySelector('.lm-top');
    const q = menu.querySelector('.lm-q');
    const count = menu.querySelector('.lm-count');
    const links = [...menu.querySelectorAll('.lm-list a')];
    const current = links.find((a) => a.hasAttribute('aria-current')) ?? links[0];
    for (const a of links) {
      let local = '';
      try { local = names?.of(a.hreflang) ?? ''; } catch { /* unknown code */ }
      a.dataset.q = fold(`${a.textContent} ${a.dataset.q ?? ''} ${local}`);
    }
    if (top) top.hidden = false;
    let byKey = false;

    const shown = () => links.filter((a) => !a.parentElement.hidden);
    const rtl = () => getComputedStyle(menu).direction === 'rtl';

    function filter() {
      const words = fold(q.value).split(/\s+/).filter(Boolean);
      for (const a of links) a.parentElement.hidden = !words.every((w) => a.dataset.q.includes(w));
      count.textContent = words.length ? `${shown().length} / ${links.length}` : '';
    }

    // Keeps the panel on screen; on phones, pinned to the bottom edge whatever box the bar puts it in.
    function place() {
      panel.style.translate = '';
      const r = panel.getBoundingClientRect();
      const width = document.documentElement.clientWidth;
      let dx = 0;
      let dy = 0;
      if (sheet.matches) {
        dx = -r.left;
        dy = innerHeight - r.bottom;
      } else if (r.left < 16) dx = 16 - r.left;
      else if (r.right > width - 16) dx = width - 16 - r.right;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) panel.style.translate = `${dx}px ${dy}px`;
    }

    function close(refocus) {
      menu.open = false;
      if (refocus) button.focus();
    }

    button.addEventListener('pointerdown', () => (byKey = false));
    button.addEventListener('keydown', (e) => (byKey = e.key === 'Enter' || e.key === ' '));
    q?.addEventListener('input', filter);

    function toggled() {
      if (!menu.open) {
        removeEventListener('resize', place);
        return;
      }
      document.querySelectorAll('details[data-lm][open]').forEach((m) => m !== menu && (m.open = false));
      if (q && q.value) {
        q.value = '';
        filter();
      }
      place();
      addEventListener('resize', place);
      current.scrollIntoView({ block: 'nearest' });
      // A mouse or the keyboard goes straight to the search; a finger only sees the list (no keyboard popping up).
      if (q && (byKey || (fine.matches && !sheet.matches))) q.focus({ preventScroll: true });
      else if (byKey) current.focus({ preventScroll: true });
    }
    menu.addEventListener('toggle', toggled);
    if (menu.open) toggled(); // opened before this script arrived

    menu.addEventListener('keydown', (e) => {
      if (!menu.open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close(true);
        return;
      }
      const list = shown();
      const at = list.indexOf(document.activeElement);
      if (e.key === 'Tab') {
        // Button, search, and one stop in the list (arrows move inside it).
        const stops = [button, q, at >= 0 ? list[at] : list.includes(current) ? current : list[0]].filter(Boolean);
        const i = stops.indexOf(document.activeElement);
        e.preventDefault();
        stops[(i + (e.shiftKey ? -1 : 1) + stops.length) % stops.length].focus();
        return;
      }
      if (e.target === q) {
        if (e.key === 'ArrowDown' && list.length) {
          e.preventDefault();
          list[0].focus();
        } else if (e.key === 'Enter' && list.length) {
          e.preventDefault();
          list[0].click();
        }
        return;
      }
      if (at < 0) return;
      const cols = list.filter((a) => a.offsetTop === list[0].offsetTop).length || 1;
      const step = { ArrowRight: rtl() ? -1 : 1, ArrowLeft: rtl() ? 1 : -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
      let to = null;
      if (step) to = at + step;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = list.length - 1;
      else if (q && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ') {
        q.focus(); // the letter lands in the search
        return;
      }
      if (to === null) return;
      e.preventDefault();
      if (to < 0 && e.key === 'ArrowUp' && q) q.focus();
      else list[Math.max(0, Math.min(list.length - 1, to))].focus();
    });

    // A click outside closes; on phones that tap only closes the sheet, it doesn't also press what was under it.
    document.addEventListener(
      'click',
      (e) => {
        if (!menu.open || menu.contains(e.target)) return;
        if (sheet.matches) {
          e.preventDefault();
          e.stopPropagation();
        }
        close(false);
      },
      true,
    );
  });
})();
