/* =============================================================
   Lectura compartida de precios desde Google Sheets (gviz/tq).
   Usado por pricing.js, cotizar.astro, quote.astro e index.astro.
   Columnas esperadas: SKU | PrecioUSD | Producto

   Primero intenta /api/prices (Cloudflare Pages Function que cachea
   la hoja ~5 min en el edge y expone solo SKU/Producto/PrecioUSD,
   ver functions/api/prices.js). Si esa ruta no responde (p.ej.
   `astro dev` local sin Pages Functions, o la función falla) cae al
   fetch directo a Google Sheets — ese fallback sí trae todas las
   columnas de la hoja (incluye costo/margen), por lo que solo debería
   activarse en desarrollo local; en producción /api/prices responde
   siempre que el deploy esté corriendo en Cloudflare Pages.
   ============================================================= */

async function fetchViaEdgeCache(sheet) {
  try {
    const res = await fetch(`/api/prices?sheet=${encodeURIComponent(sheet)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.rows) ? data.rows : null;
  } catch (e) {
    return null;
  }
}

async function fetchDirectFromGoogle(sheetId, sheet) {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheet)}`;
    const raw = await fetch(url).then((r) => r.text());
    const json = JSON.parse(raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    const cols = json.table.cols.map((c) => c.label);
    const rows = json.table.rows.map((r) => r.c.map((c) => (c ? c.v : '')));
    return rows.map((r) => Object.fromEntries(r.map((v, i) => [cols[i], v])));
  } catch (e) {
    return []; // tolerante a fallos: el llamador mostrará "Consultar"
  }
}

/** Descarga y parsea la hoja a una lista de filas { SKU, PrecioUSD, Producto, ... }. */
export async function fetchSheetRows(sheetId, sheet) {
  const cached = await fetchViaEdgeCache(sheet);
  if (cached) return cached;
  return fetchDirectFromGoogle(sheetId, sheet);
}

/** Mapa SKU -> { price, name } para el configurador de precios. */
export async function fetchPriceMap(sheetId, sheet) {
  const rows = await fetchSheetRows(sheetId, sheet);
  return new Map(
    rows
      .filter((r) => r.SKU)
      .map((r) => [
        String(r.SKU).trim(),
        { price: +String(r.PrecioUSD || '0').replace(/[^0-9.]/g, ''), name: r.Producto || '' },
      ])
  );
}

/** Precio (número) para un SKU puntual, o 0 si no se encuentra. */
export async function fetchPriceBySKU(sheetId, sheet, sku) {
  if (!sku) return 0;
  const map = await fetchPriceMap(sheetId, sheet);
  const row = map.get(String(sku).trim());
  return row && row.price > 0 ? row.price : 0;
}
