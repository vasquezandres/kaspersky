/* =============================================================
   Configurador de precios Kaspersky · Solutech Panamá
   - Lee /data/products.json (segmentos: home, smalloffice, business)
   - Consulta precios en vivo desde Google Sheets (gviz/tq) por SKU
   - Columnas esperadas: SKU | PrecioUSD | Producto
   - Si no hay precio o falla el Sheet: muestra "Consultar" (no USD 0.00)
   - Bilingüe (es/en) y genera CTA/WhatsApp/cotización por idioma
   Config vía data-attrs en el contenedor [data-pricing]:
     data-segment="home|smalloffice|business"
     data-lang="es|en"  data-sheet-id="..."  data-quote="/cotizar/"
   ============================================================= */
(function () {
  const WA = '50768886778';

  const mounts = document.querySelectorAll('[data-pricing]');
  if (!mounts.length) return;

  // i18n mínimo del configurador
  const T = {
    es: {
      devices: (n) => `${n} dispositivo${n > 1 ? 's' : ''}`,
      years: (y) => `${y} año${y > 1 ? 's' : ''}`,
      buy: 'Cotizar',
      wa: 'WhatsApp',
      consult: 'Consultar',
      itbms: '+ ITBMS si aplica',
      equip: 'Equipos',
      pack: 'Pack',
      tranche: 'Tramo',
      nodes: 'nodos',
      serversIncl: 'Servidores incluidos',
      perDevice: '/equipo',
      total: 'Total',
      waText: (name, detail) => `Hola, quiero cotizar ${name}. ${detail}`,
      locale: 'es-PA',
    },
    en: {
      devices: (n) => `${n} device${n > 1 ? 's' : ''}`,
      years: (y) => `${y} year${y > 1 ? 's' : ''}`,
      buy: 'Get a quote',
      wa: 'WhatsApp',
      consult: 'Ask us',
      itbms: '+ tax if applicable',
      equip: 'Devices',
      pack: 'Pack',
      tranche: 'Range',
      nodes: 'nodes',
      serversIncl: 'Servers included',
      perDevice: '/device',
      total: 'Total',
      waText: (name, detail) => `Hi, I'd like a quote for ${name}. ${detail}`,
      locale: 'en-US',
    },
  };

  function fmt(n, locale) {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(+n || 0);
  }

  async function fetchPrices(sheetId, sheet) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheet)}`;
      const raw = await fetch(url).then((r) => r.text());
      const json = JSON.parse(raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
      const cols = json.table.cols.map((c) => c.label);
      const rows = json.table.rows.map((r) => r.c.map((c) => (c ? c.v : '')));
      const data = rows.map((r) => Object.fromEntries(r.map((v, i) => [cols[i], v])));
      return new Map(
        data
          .filter((r) => r.SKU)
          .map((r) => [
            String(r.SKU).trim(),
            { price: +String(r.PrecioUSD || '0').replace(/[^0-9.]/g, ''), name: r.Producto || '' },
          ])
      );
    } catch (e) {
      return new Map(); // tolerante a fallos: tabla seguirá mostrando "Consultar"
    }
  }

  // ---------- helpers de UI ----------
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function select(opts) {
    const s = el('select', 'variant');
    opts.forEach((o) => {
      const op = el('option');
      op.value = o.value;
      op.textContent = o.label;
      s.appendChild(op);
    });
    return s;
  }
  function slider(min, max, val, label) {
    const wrap = el('div', 'inline-controls');
    const num = el('input', 'variant');
    num.type = 'number'; num.min = min; num.max = max; num.value = val;
    const rng = el('input', 'slider');
    rng.type = 'range'; rng.min = min; rng.max = max; rng.value = val;
    rng.setAttribute('aria-label', label);
    function sync(v) {
      v = Math.max(+min, Math.min(+max, +v || val));
      num.value = v; rng.value = v;
      wrap.dispatchEvent(new CustomEvent('changeValue', { detail: v }));
    }
    num.addEventListener('input', () => sync(num.value));
    rng.addEventListener('input', () => sync(rng.value));
    wrap.append(num, rng);
    return { wrap, get: () => +num.value, set: (v) => { num.value = v; rng.value = v; } };
  }

  // ---------- selección por rangos / packs ----------
  function findRangeLabel(vars, count) {
    const entries = Object.keys(vars)
      .map((k) => { const [a, b] = k.split('-').map(Number); return { k, a, b }; })
      .sort((x, y) => x.a - y.a);
    const hit = entries.find((e) => count >= e.a && count <= e.b);
    return hit ? hit.k : entries[entries.length - 1].k;
  }
  function rangeSku(vars, count, years) {
    return (vars[findRangeLabel(vars, count)] || {})[String(years)] || '';
  }
  function ceilKey(keys, count) {
    const nums = keys.map(Number).sort((a, b) => a - b);
    for (const n of nums) if (count <= n) return String(n);
    return String(nums[nums.length - 1]);
  }
  function snapToPack(value, packs) {
    let best = packs[0], diff = Math.abs(value - packs[0]);
    for (const pk of packs) { const d = Math.abs(value - pk); if (d < diff) { best = pk; diff = d; } }
    return best;
  }

  function setPrice(card, sku, priceMap, locale, consultTxt, itbmsTxt) {
    card.dataset.sku = sku || '';
    const p = sku ? priceMap.get(String(sku).trim()) : null;
    const elP = card.querySelector('[data-price]');
    if (!elP) return;
    if (p && p.price > 0) {
      elP.textContent = fmt(p.price, locale);
      elP.removeAttribute('data-state');
      const small = card.querySelector('[data-itbms]');
      if (small) small.textContent = itbmsTxt;
    } else {
      elP.textContent = consultTxt;
      elP.setAttribute('data-state', 'consult');
      const small = card.querySelector('[data-itbms]');
      if (small) small.textContent = '';
    }
  }

  // Render genérico de precio total (con sublínea opcional)
  function renderPrice(card, totalNum, subText, locale, consultTxt) {
    card.dataset.total = totalNum > 0 ? String(totalNum) : '';
    const elP = card.querySelector('[data-price]');
    const small = card.querySelector('[data-itbms]');
    if (!elP) return;
    if (totalNum > 0) {
      elP.textContent = fmt(totalNum, locale);
      elP.removeAttribute('data-state');
      if (small) small.innerHTML = subText || '';
    } else {
      elP.textContent = consultTxt;
      elP.setAttribute('data-state', 'consult');
      if (small) small.textContent = '';
    }
  }

  function baseCard(p, t, opts) {
    const c = el('article', 'card hover plan-card');
    if (opts && opts.featured) {
      c.classList.add('featured');
      c.append(el('span', 'ribbon', opts.featuredLabel));
    }
    c.append(el('div', 'title', p.name));
    if (p.desc) c.append(el('p', 'desc', p.desc));
    if (p.tags && p.tags.length) {
      const tags = el('div', 'tags');
      p.tags.forEach((tg) => tags.append(el('span', 'tag', tg)));
      c.append(tags);
    }
    c.append(el('div', 'price', `<span data-price>${t.consult}</span> <small data-itbms></small>`));
    return c;
  }

  function quoteLink(quoteBase, params) {
    const u = new URL(location.origin + quoteBase);
    Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') u.searchParams.set(k, String(v)); });
    return u.toString();
  }

  // ---------- render principal ----------
  async function render(mount) {
    const segment = mount.dataset.segment || 'home';
    const lang = mount.dataset.lang === 'en' ? 'en' : 'es';
    const sheetId = mount.dataset.sheetId;
    const sheet = mount.dataset.sheet || 'kaspersky';
    const quoteBase = mount.dataset.quote || (lang === 'en' ? '/en/quote/' : '/cotizar/');
    const t = T[lang];

    const [priceMap, products] = await Promise.all([
      fetchPrices(sheetId, sheet),
      fetch('/data/products.json').then((r) => r.json()).catch(() => ({})),
    ]);

    let list = products[segment] || [];
    const only = mount.dataset.only;          // lista exacta separada por comas
    const match = mount.dataset.match;          // nombre exacto (con respaldo a substring)
    if (only) {
      const names = only.split(',').map((s) => s.trim().toLowerCase());
      list = names.map((n) => list.find((p) => (p.name || '').toLowerCase() === n)).filter(Boolean);
    } else if (match) {
      const needle = match.trim().toLowerCase();
      const exact = list.filter((p) => (p.name || '').toLowerCase() === needle);
      list = exact.length ? exact : list.filter((p) => (p.name || '').toLowerCase().includes(needle));
    }
    mount.innerHTML = '';

    list.forEach((p) => {
      const isFeatured = segment === 'home' && /plus/i.test(p.name || '') && list.length > 1;
      const card = baseCard(p, t, { featured: isFeatured, featuredLabel: lang === 'en' ? 'Most chosen' : 'Más elegido' });
      const sp = (sku, params) => quoteLink(quoteBase, Object.assign({ product: p.name, sku }, params));
      const getUnit = (sku) => { const r = sku ? priceMap.get(String(sku).trim()) : null; return r && r.price > 0 ? r.price : 0; };
      const itbmsNote = t.itbms;

      if (p.type === 'devices') {
        const variants = p.variants || {};
        const devKeys = Object.keys(variants);
        const selDev = select(devKeys.map((k) => ({ value: k, label: t.devices(+k) })));
        const yearKeys = Array.from(new Set(devKeys.flatMap((k) => Object.keys(variants[k])))).sort((a, b) => +a - +b);
        const selYear = select(yearKeys.map((y) => ({ value: y, label: t.years(+y) })));

        const buy = el('a', 'btn primary', t.buy);
        const refresh = () => {
          const sku = (variants[selDev.value] || {})[selYear.value] || '';
          card.dataset.sku = sku;
          const total = getUnit(sku);
          renderPrice(card, total, itbmsNote, t.locale, t.consult);
          buy.href = sp(sku, { devices: selDev.value, years: selYear.value, total: total || '' });
        };
        selDev.addEventListener('change', refresh);
        selYear.addEventListener('change', refresh);

        const row = el('div', 'btn-row mt-2');
        row.append(selDev, selYear, buy);
        card.append(row);
        refresh();
      } else if (p.type === 'range') {
        const selYear = select([{ value: '1', label: t.years(1) }, { value: '2', label: t.years(2) }, { value: '3', label: t.years(3) }]);
        const min = (p.range && +p.range.min) || 5;
        const max = (p.range && +p.range.max) || 99;
        const start = Math.min(Math.max(min, 10), max);
        const sl = slider(min, max, start, t.equip);
        const tip = el('div', 'slider-tip');
        const buy = el('a', 'btn primary', t.buy);

        const refresh = () => {
          const raw = sl.get();
          const y = selYear.value || '1';
          if (Array.isArray(p.packSizes) && p.packSizes.length) {
            const pk = snapToPack(raw, p.packSizes);
            const sku = (p.variants[String(pk)] || {})[y] || '';
            let servers = p.serversByPack ? (p.serversByPack[String(pk)] ?? p.serversByPack[pk]) : null;
            if (servers == null) servers = pk >= 50 ? 5 : pk >= 25 ? 3 : pk >= 15 ? 2 : 1;
            sl.set(pk);
            card.dataset.sku = sku;
            const total = getUnit(sku); // el precio del pack es el total
            tip.innerHTML = `<strong>${t.pack}:</strong> ${pk} ${t.equip.toLowerCase()} &nbsp;•&nbsp; <strong>${t.serversIncl}:</strong> ${servers}`;
            renderPrice(card, total, `${pk} ${t.equip.toLowerCase()} · ${itbmsNote}`, t.locale, t.consult);
            buy.href = sp(sku, { pack: pk, years: y, devices: pk, total: total || '' });
            return;
          }
          // por nodos: el precio es POR EQUIPO -> total = unitario × nodos
          const tramo = findRangeLabel(p.variants, raw);
          const sku = rangeSku(p.variants, raw, y);
          card.dataset.sku = sku;
          const unit = getUnit(sku);
          const total = unit > 0 ? Math.round(unit * raw * 100) / 100 : 0;
          tip.innerHTML = `<strong>${raw}</strong> ${t.nodes} · <strong>${t.tranche}:</strong> ${tramo}`;
          const sub = unit > 0 ? `${fmt(unit, t.locale)}${t.perDevice} × ${raw} · ${itbmsNote}` : '';
          renderPrice(card, total, sub, t.locale, t.consult);
          buy.href = sp(sku, { nodes: raw, range: tramo, years: y, unit: unit || '', total: total || '' });
        };
        sl.wrap.addEventListener('changeValue', refresh);
        selYear.addEventListener('change', refresh);

        const row = el('div', 'btn-row mt-2');
        row.append(selYear, buy);
        card.append(sl.wrap, tip, row);
        refresh();
      } else if (p.type === 'fixed') {
        const selYear = select([{ value: '1', label: t.years(1) }, { value: '2', label: t.years(2) }, { value: '3', label: t.years(3) }]);
        const keys = Object.keys(p.variants || {});
        const sl = slider(5, 50, 10, t.equip);
        const tip = el('div', 'slider-tip');
        const buy = el('a', 'btn primary', t.buy);
        const refresh = () => {
          const n = sl.get();
          const pack = ceilKey(keys, n);
          const y = selYear.value || '1';
          const sku = (p.variants[pack] || {})[y] || '';
          card.dataset.sku = sku;
          const total = getUnit(sku);
          tip.innerHTML = `<strong>${t.pack}:</strong> ${pack} ${t.equip.toLowerCase()}`;
          renderPrice(card, total, `${pack} ${t.equip.toLowerCase()} · ${itbmsNote}`, t.locale, t.consult);
          buy.href = sp(sku, { pack, years: y, devices: n, total: total || '' });
        };
        sl.wrap.addEventListener('changeValue', refresh);
        selYear.addEventListener('change', refresh);
        const row = el('div', 'btn-row mt-2');
        row.append(selYear, buy);
        card.append(sl.wrap, tip, row);
        refresh();
      }

      // WhatsApp por producto
      const wa = el('a', 'btn wa', t.wa);
      wa.target = '_blank'; wa.rel = 'noopener';
      const updWa = () => {
        const sku = card.dataset.sku || '';
        const total = card.dataset.total || '';
        let detail = sku ? `SKU ${sku}.` : '';
        if (total) detail += ` ${t.total}: ${fmt(+total, t.locale)} (${itbmsNote}).`;
        wa.href = `https://wa.me/${WA}?text=` + encodeURIComponent(t.waText(p.name, detail));
      };
      const rows = card.querySelector('.btn-row');
      if (rows) rows.append(wa);
      // recalcular href de WhatsApp tras cada cambio
      card.addEventListener('changeValue', updWa, true);
      mount.querySelectorAll('select.variant, .slider, input.variant');
      updWa();

      mount.appendChild(card);
    });
  }

  mounts.forEach(render);
})();
