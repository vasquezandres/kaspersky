import { formatPrice, getActiveSheetName, goToQuote } from '/assets/js/app.js';

// =========================
// Config: Google Sheets
// =========================
const SHEET_ID = "1h5RBn4NrQATYn-zZVeDVuo8Ory8KPdGugBlEceivs30";

async function fetchLivePrices () {
  const SHEET = getActiveSheetName();
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET)}`;
    const raw = await fetch(url).then(r => r.text());
    const json = JSON.parse(raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    const cols = json.table.cols.map(c => c.label);
    const rows = json.table.rows.map(r => r.c.map(c => c ? c.v : ""));
    const data = rows.map(r => Object.fromEntries(r.map((v, i) => [cols[i], v])));
    return new Map(
      data.map(r => [
        String(r.SKU).trim(),
        {
          price: +String(r.PrecioUSD || '0').replace(/[^0-9.]/g, ''),
          name: r.Producto || ''
        }
      ])
    );
  } catch (e) {
    return new Map();
  }
}

// =========================
// Helpers de UI
// =========================
function el (t, c, h) {
  const n = document.createElement(t);
  if (c) n.className = c;
  if (h != null) n.innerHTML = h;
  return n;
}
function select (opts) {
  const s = el('select', 'variant');
  opts.forEach(o => {
    const op = el('option');
    op.value = o.value;
    op.textContent = o.label;
    s.appendChild(op);
  });
  return s;
}
function buildSlider (min, max, val) {
  const wrap = el('div', 'inline-controls');
  const n = el('input', 'variant');
  n.type = 'number'; n.min = min; n.max = max; n.value = val;

  const r = el('input', 'slider');
  r.type = 'range'; r.min = min; r.max = max; r.value = val;

  const tip = el('span', 'slider-tip', `Equipos: ${val}`);

  function sync (v) {
    v = Math.max(+min, Math.min(+max, +v || val));
    n.value = v; r.value = v;
    tip.textContent = `Equipos: ${v}`;
    wrap.dispatchEvent(new CustomEvent('changeValue', { detail: v }));
  }

  n.addEventListener('input', () => sync(n.value));
  r.addEventListener('input', () => sync(r.value));
  wrap.append(n, r, tip);
  return { wrap, get: () => +n.value };
}

function priceInto (card, sku, priceMap) {
  card.dataset.sku = sku || '';
  const p = priceMap.get((sku || '').trim());
  const elP = card.querySelector('[data-price]');
  if (elP) elP.textContent = formatPrice(p ? p.price : 0);
}

function cardCommon (p) {
  const c = el('article', 'card');
  c.append(el('div', 'title', p.name), el('div', 'desc', p.desc));
  const tags = el('div', 'tags');
  (p.tags || []).forEach(t => tags.append(el('span', 'tag', t)));
  if (p.note) tags.append(el('span', 'tag', p.note));
  c.append(tags);
  c.append(el('div', 'price', `<span data-price>USD 0.00</span> <small> + ITBMS si aplica</small>`));
  return c;
}

// =========================
// Lógica de selección
// =========================

// RANGOS (KSOS por nodos 5-99) Y BUSINESS
function findRangeLabel (vars, count) {
  const entries = Object.keys(vars).map(k => {
    const [a, b] = k.split('-').map(Number);
    return { k, a, b };
  }).sort((x, y) => x.a - y.a);

  const hit = entries.find(e => count >= e.a && count <= e.b);
  return hit ? hit.k : entries[entries.length - 1].k; // último tramo si te pasas
}

function rangeSku (vars, count, years) {
  const r = findRangeLabel(vars, count);
  return (vars[r] || {})[String(years)] || '';
}

// PACKS FIJOS (5,10,15,20,25,50) -> CEIL
function ceilKey (keys, count) {
  const nums = keys.map(Number).sort((a, b) => a - b);
  for (const n of nums) {
    if (count <= n) return String(n); // primera que lo cubre (ceil)
  }
  return String(nums[nums.length - 1]); // máximo
}

// (se mantiene para otros usos donde sí se quiera "más cercano")
function nearestKey (keys, count) {
  const nums = keys.map(Number).sort((a, b) => a - b);
  let best = nums[0], diff = Math.abs(count - nums[0]);
  for (const n of nums) {
    const d = Math.abs(count - n);
    if (d < diff || (d === diff && n > best)) { best = n; diff = d; }
  }
  return String(best);
}

// ===============================
// Servidores incluidos por selección
// ===============================

// KSOS por PACKS FIJOS
function serversForFixedPack(pack) {
  const map = { 5: 1, 10: 1, 15: 2, 20: 2, 25: 3, 50: 5 };
  return map[Number(pack)] ?? 0;
}

// KSOS por TRAMOS (RANGOS) -> devuelve texto (porque el SKU ya viene con rango)
function serversForRangeLabel(rangeLabel) {
  const map = {
    '5-9': '1',
    '10-14': '1',
    '15-19': '2',
    '20-24': '2',
    '25-49': '3–5',
    '50-99': '6–10'
  };
  return map[rangeLabel] ?? '—';
}



// =========================
// Render de productos
// =========================
async function renderProducts (segment, mountSel) {
  const priceMap = await fetchLivePrices();
  const data = await fetch('/assets/data/products.json').then(r => r.json());
  const list = data[segment] || [];
  const mount = document.querySelector(mountSel);
  if (!mount) return;
  mount.innerHTML = '';

  list.forEach(p => {
    const card = cardCommon(p);

    // -----------------------
    // Productos con variantes por #dispositivos y años (B2C)
    // -----------------------
    if (p.type === 'devices') {
      const variants = p.variants || {};
      const keys = Object.keys(variants);

      const selDev = select(keys.map(k => ({ value: k, label: `${k} dispositivos` })));
      const years = Array.from(new Set(keys.flatMap(k => Object.keys(variants[k])))).sort((a, b) => +a - +b);
      const selYears = select(years.map(y => ({ value: y, label: `${y} año${+y > 1 ? 's' : ''}` })));

      const buy = el('a', 'btn primary', '<i class="fa-solid fa-cart-shopping"></i> Comprar');
      const dl = el('a', 'btn', '<i class="fa-solid fa-download"></i> '); dl.href = p.download || '#';
      const wa = el('a', 'btn', '<i class="fa-brands fa-whatsapp"></i> WhatsApp');
      wa.target = "_blank"; wa.rel = "noopener";
      wa.href = "https://wa.me/50768886778?text=" + encodeURIComponent(`Consulta: ${p.name}`);

      function refresh () {
        const sku = (variants[selDev.value] || {})[selYears.value] || "";
        priceInto(card, sku, priceMap);
      }

      buy.addEventListener('click', e => {
        e.preventDefault();
        const sku = (variants[selDev.value] || {})[selYears.value] || "";
        goToQuote({ product: p.name, sku, devices: selDev.value, years: selYears.value });
      });

      const row = el('div', 'btn-row');
      row.append(selDev, selYears, buy, dl, wa);
      card.append(row);

      priceInto(card, (variants[keys[0]] || {})[years[0]] || "", priceMap);
      selDev.addEventListener('change', refresh);
      selYears.addEventListener('change', refresh);
    }

    // -----------------------
    // KSOS por tramos 5-99 (nodos) – usa tablas de rangos (5-9, 10-14, etc.)
    // -----------------------
    else if (p.type === 'range') {
      const years = select([{ value: '1', label: '1 año' }, { value: '2', label: '2 años' }, { value: '3', label: '3 años' }]);
      const min = (p.range && +p.range.min) || 5;
      const max = (p.range && +p.range.max) || 99;
      const start = Math.min(Math.max(min, 10), max); // 10 por defecto dentro del rango
      const slider = buildSlider(min, max, start);
      const tip = el('div', 'slider-tip');

      const buy = el('a', 'btn primary', '<i class="fa-solid fa-cart-shopping"></i> Cotizar');
      const dl = el('a', 'btn', '<i class="fa-solid fa-download"></i> '); dl.href = p.download || '#';
      const wa = el('a', 'btn', '<i class="fa-brands fa-whatsapp"></i> ');
      wa.target = "_blank"; wa.rel = "noopener";
      wa.href = "https://wa.me/50768886778?text=" + encodeURIComponent(`Consulta: ${p.name}`);

      function snapToPack (value, packs) {
        // devuelve el pack permitido más cercano (5,10,15,20,25,50)
        let best = packs[0], bestDiff = Math.abs(value - packs[0]);
        for (const pk of packs) {
          const d = Math.abs(value - pk);
          if (d < bestDiff) { best = pk; bestDiff = d; }
        }
        return best;
      }

      function refresh () {
        const raw = slider.get();
        const y = years.value || '1';

        // Caso KSOS por EQUIPOS FIJOS (5/10/15/20/25/50)
        if (Array.isArray(p.packSizes) && p.packSizes.length) {
          const pk = snapToPack(raw, p.packSizes); // 5,10,15,20,25,50
          const sku = (p.variants[String(pk)] || {})[y] || null;

          // --- Servidores incluidos (acepta keys string o number y tiene fallback)
          let servers = null;
          if (p.serversByPack) {
            servers = p.serversByPack[String(pk)];
            if (servers == null) servers = p.serversByPack[pk]; // por si están como number
          }
          // Fallback por reglas conocidas si no hubiera mapping:
          if (servers == null) {
            servers = (pk >= 50) ? 5 :
                      (pk >= 25) ? 3 :
                      (pk >= 15) ? 2 : 1;
          }

          // 💡 Tip con pack + servidores
          tip.innerHTML = `💡 <strong>Pack:</strong> ${pk} equipos &nbsp;•&nbsp; <strong>Servidores incluidos:</strong> ${servers}`;

          // Refleja el pack “snap” en el input numérico si existe
          const qtyInput = card.querySelector('input[type="number"]');
          if (qtyInput) qtyInput.value = pk;

          priceInto(card, sku, priceMap);
          return;
        }

        // ---- resto del refresh para TRAMOS (nodos/Cloud) se queda igual ----
        const n = raw;
        const tramo = findRangeLabel(p.variants, n);
        const sku = rangeSku(p.variants, n, y);

        const isSmallOffice = /Small\s*Office/i.test(p.name);
        const isCloudB2B   = /Cloud/i.test(p.name);

        if (isSmallOffice) {
          const serversTxt = serversForRangeLabel ? serversForRangeLabel(tramo) : '—';
          tip.innerHTML = `💡 <strong>Tramo:</strong> ${tramo} nodos &nbsp;•&nbsp; <strong>Servidores incluidos:</strong> ${serversTxt}`;
        } else if (isCloudB2B) {
          const [a, b] = tramo.split('-').map(Number);
          const mov = (!isNaN(a) && !isNaN(b)) ? `${a*2}–${b*2}` : '—';
          tip.innerHTML = `💡 <strong>Tramo:</strong> ${tramo} nodos &nbsp;•&nbsp; <i class="fa-solid fa-mobile-screen"></i> ${mov}`;
        } else {
          tip.innerHTML = `💡 <strong>Tramo:</strong> ${tramo} nodos`;
        }

        priceInto(card, sku, priceMap);
      }




      buy.addEventListener('click', e => {
        e.preventDefault();
        const n = slider.get(), y = years.value || '1';
        const tramo = findRangeLabel(p.variants, n);
        const sku = rangeSku(p.variants, n, y);
        goToQuote({ product: p.name, sku, nodes: n, range: tramo, years: y });
      });

      const row = el('div', 'btn-row');
      row.append(years, buy, dl, wa);
      card.append(slider.wrap, tip, row);
      slider.wrap.addEventListener('changeValue', refresh);
      years.addEventListener('change', refresh);
      refresh();
    }

    // -----------------------
    // KSOS por packs fijos (5,10,15,20,25,50) – CEIL pack
    // -----------------------
    else if (p.type === 'fixed') {
      const years = select([{ value: '1', label: '1 año' }, { value: '2', label: '2 años' }, { value: '3', label: '3 años' }]);
      const slider = buildSlider(5, 50, 10);
      const tip = el('div', 'slider-tip');
      const keys = Object.keys(p.variants || {});

      const buy = el('a', 'btn primary', '<i class="fa-solid fa-cart-shopping"></i> Cotizar');
      const dl = el('a', 'btn', '<i class="fa-solid fa-download"></i> '); dl.href = p.download || '#';
      const wa = el('a', 'btn', '<i class="fa-brands fa-whatsapp"></i> WhatsApp');
      wa.target = "_blank"; wa.rel = "noopener";
      wa.href = "https://wa.me/50768886778?text=" + encodeURIComponent(`Consulta: ${p.name}`);

      function refresh () {
        const n = slider.get();
        const pack = ceilKey(keys, n);        // <-- CEIL aquí
        const y = years.value || '1';
        tip.textContent = `💡 Pack: ${pack} equipos`;
        const sku = (p.variants[pack] || {})[y] || "";
        priceInto(card, sku, priceMap);
      }

      buy.addEventListener('click', e => {
        e.preventDefault();
        const n = slider.get();
        const pack = ceilKey(keys, n);        // <-- CEIL aquí también
        const y = years.value || '1';
        const sku = (p.variants[pack] || {})[y] || "";
        goToQuote({ product: p.name, sku, pack, years: y, devices: n });
      });

      const row = el('div', 'btn-row');
      row.append(years, buy, dl, wa);
      card.append(slider.wrap, tip, row);
      slider.wrap.addEventListener('changeValue', refresh);
      years.addEventListener('change', refresh);
      refresh();
    }

    mount.appendChild(card);
  });
}

export async function renderSegment (segment, mount) {
  renderProducts(segment, mount);
}

