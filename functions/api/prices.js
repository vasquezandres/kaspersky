/* =============================================================
   Cloudflare Pages Function — /api/prices
   Lee la hoja de precios de Google Sheets (gviz/tq) en el edge,
   la parsea a JSON y la cachea ~5 min para que las páginas de
   producto no dependan de un fetch directo del cliente a Google
   en cada carga.
   El sheetId queda fijo en el servidor (no se acepta por query)
   para no convertir este endpoint en un proxy abierto hacia
   hojas de cálculo arbitrarias; solo el nombre de la pestaña
   ("sheet") es configurable, igual que hoy via ?sheet=.

   Solo se exponen las columnas públicas (SKU, Producto, PrecioUSD):
   la hoja también tiene columnas de costo y margen (Costo, Utilidad,
   % de ganancia global) que antes viajaban tal cual al navegador de
   cualquier visitante en cada carga de página — visibles en la
   pestaña Network de devtools. Filtrarlas aquí evita exponer
   márgenes de negocio en el cliente.
   ============================================================= */
const SHEET_ID = '1h5RBn4NrQATYn-zZVeDVuo8Ory8KPdGugBlEceivs30';
const DEFAULT_SHEET = 'kaspersky';
const CACHE_SECONDS = 300;

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const sheet = (url.searchParams.get('sheet') || DEFAULT_SHEET).slice(0, 64);

  const cache = caches.default;
  const cacheKey = new Request(`https://cache.internal/api/prices?sheet=${encodeURIComponent(sheet)}`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheet)}`;
    const raw = await fetch(sheetUrl).then((r) => r.text());
    const json = JSON.parse(raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    const cols = json.table.cols.map((c) => c.label);
    const rows = json.table.rows.map((r) => r.c.map((c) => (c ? c.v : '')));
    const data = rows
      .map((r) => Object.fromEntries(r.map((v, i) => [cols[i], v])))
      .filter((r) => r.SKU)
      .map((r) => ({ SKU: String(r.SKU).trim(), Producto: r.Producto || '', PrecioUSD: r.PrecioUSD || 0 }));

    const response = new Response(JSON.stringify({ rows: data }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=60, s-maxage=${CACHE_SECONDS}`,
      },
    });
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (e) {
    // Tolerante a fallos: el cliente (sheet.js) cae de vuelta al fetch directo a Google.
    return new Response(JSON.stringify({ rows: [], error: 'sheet_fetch_failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
}
