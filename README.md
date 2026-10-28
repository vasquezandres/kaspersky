# Kaspersky Panamá — Solutech (Astro)

Landing comercial **bilingüe (ES/EN)**, rápida y orientada a conversión para vender,
cotizar y renovar **licencias Kaspersky en Panamá** con soporte local de **Solutech Panamá**.

> **Marca:** Solutech Panamá es la marca principal. Kaspersky aparece solo como
> producto que revendemos. El sitio se presenta siempre como **proveedor/revendedor
> independiente** (no es el sitio oficial de Kaspersky).

---

## 1. Stack

- **Astro 5** (salida estática, ideal para Cloudflare Pages)
- **i18n nativo** de Astro: ES en la raíz, EN bajo `/en/`
- **@astrojs/sitemap** con alternantes hreflang
- **Sin frameworks pesados ni Font Awesome** (íconos SVG inline propios)
- Precios **en vivo** desde Google Sheets (lado cliente, sin rebuild)
- Fuente: Plus Jakarta Sans (titulares y texto), autohospedada en `public/fonts/`
  (`src/styles/fonts.css`), sin dependencia de Google Fonts en runtime

## 2. Correr en local

```bash
npm install
npm run dev      # http://localhost:4321
```

Build de producción y previsualización:

```bash
npm run build    # genera /dist
npm run preview
```

## 3. Desplegar en Cloudflare Pages

1. Sube el repositorio a GitHub.
2. En Cloudflare Pages → **Create project** → conecta el repo.
3. Configuración de build:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Deploy. El dominio `kasperskypanama.com` apunta al proyecto de Pages.

> `public/_redirects` ya incluye las redirecciones 301 desde las rutas viejas (`.html`)
> y se copia automáticamente a `dist/` en cada build. `public/_headers` trae cabeceras
> de seguridad (CSP, X-Frame-Options, etc.) y cache-control para assets.

> El directorio `functions/` (Cloudflare Pages Functions, ver sección 4) se despliega
> automáticamente junto al sitio — no requiere configuración extra en Cloudflare Pages.

## 4. Precios desde Google Sheets

El configurador lee precios **en tiempo real** (no en build), por lo que **puedes
actualizar precios en la hoja sin volver a desplegar**.

- **Sheet ID:** `1h5RBn4NrQATYn-zZVeDVuo8Ory8KPdGugBlEceivs30`
- **Hoja por defecto:** `kaspersky`
- **Columnas requeridas:** `SKU` · `PrecioUSD` · `Producto`
- La hoja debe estar **publicada/compartida como lectura** (el endpoint usado es
  `gviz/tq?tqx=out:json`).
- Si un SKU no tiene precio o la hoja falla, se muestra **“Consultar” / “Ask us”**
  (nunca `USD 0.00`).
- Puedes forzar otra hoja con `?sheet=NOMBRE` en la URL (se recuerda en el navegador).

El catálogo de productos vive en `public/data/products.json`
(segmentos `home`, `smalloffice`, `business`; tipos `devices`, `range`, `fixed`).
El motor está en `public/scripts/pricing.js`, que lee la hoja a través de
`public/scripts/sheet.js`.

#### Caché en el edge (`functions/api/prices.js`)

El navegador **no llama a Google directamente**: primero pide `/api/prices`, una
**Cloudflare Pages Function** que:

- Cachea la hoja ~5 min en el edge (`Cache-Control: s-maxage=300`), así páginas con
  mucho tráfico no disparan un fetch a Google en cada carga.
- Solo expone las columnas públicas (`SKU`, `Producto`, `PrecioUSD`) — la hoja también
  tiene columnas de costo/margen (`Costo`, `Utilidad`, `% de ganancia global`) que
  **nunca** llegan al navegador.
- El `sheetId` está fijo en el servidor (no se acepta por query), solo el nombre de
  la pestaña (`?sheet=`) es configurable.

Si `/api/prices` no responde (p. ej. en `astro dev` local, donde no corren Pages
Functions), el cliente cae automáticamente al fetch directo a Google Sheets —
ese camino sí trae todas las columnas, por eso solo debería activarse en desarrollo.

Para probar las Functions localmente con el runtime real de Cloudflare:

```bash
npm run preview:cf   # build + wrangler pages dev (sirve /api/prices de verdad)
```

### Cambiar datos del negocio
Todo está centralizado en `src/data/site.ts` (WhatsApp, teléfono, correo,
Formspree, Sheet ID, redes, color de marca). Las rutas/idiomas en `src/data/i18n.ts`.

## 5. Formularios

- Contacto y cotización usan **Formspree** (`f/xldaeanj`).
- Tras enviar correctamente, redirige a `/gracias/` (ES) o `/en/thank-you/` (EN).
- Correo de contacto centralizado: **soporte@solutechpanama.com**.

## 6. SEO

- `title`, `description`, `canonical`, Open Graph y Twitter por página.
- **hreflang** `es-PA`, `en` y `x-default` en todas las páginas, con pares ES↔EN.
- **JSON-LD**: `WebSite` + `LocalBusiness` (Solutech como negocio, **no** como
  fabricante), `BreadcrumbList`, `Service` y `FAQPage` donde aplica.
- `sitemap-index.xml` generado con alternantes de idioma.
- `robots.txt` permite todo y apunta al sitemap.
- Páginas de cotización/gracias marcadas `noindex`.

### Keywords objetivo (orientación)
`licencias Kaspersky Panamá`, `comprar Kaspersky Panamá`, `renovar Kaspersky Panamá`,
`Kaspersky Small Office Security Panamá`, `Kaspersky empresas Panamá`,
`soporte/instalación antivirus Panamá`.

## 7. Redirecciones 301 (`public/_redirects`)

| Ruta vieja | Nueva |
|---|---|
| `/index.html` | `/` |
| `/hogar.html`, `/hogar/` | `/kaspersky-standard-panama/` |
| `/smalloffice.html`, `/smalloffice/` | `/kaspersky-small-office-security-panama/` |
| `/empresas.html`, `/empresas/` | `/kaspersky-endpoint-security-cloud-panama/` |
| `/servicios.html`, `/servicios/` | `/soporte-kaspersky-panama/` |
| `/pagos.html` | `/pagos/` |
| `/cotizar.html`, `/cotizacion.html` | `/cotizar/` |
| `/gracias.html` | `/gracias/` |

## 8. Estructura

```
src/
  data/         site.ts (negocio) · i18n.ts (idiomas/rutas/copys)
  styles/       global.css (design system Solutech #0f766e, claro/oscuro)
  components/   Icon, SEO, Header, Footer, Hero, FAQ, TrustSection,
                DisclaimerBanner, WhatsAppFab, *JsonLd
  layouts/      BaseLayout, ProductLayout
  pages/        13 páginas ES  + en/ (13 páginas EN)
public/
  data/products.json     scripts/pricing.js
  assets/img/{payments,tools,og}   favicon.svg   robots.txt   _redirects
```

## 9. Páginas (ES → EN)

| ES | EN |
|---|---|
| `/` | `/en/` |
| `/kaspersky-standard-panama/` | `/en/kaspersky-standard-panama/` |
| `/kaspersky-plus-panama/` | `/en/kaspersky-plus-panama/` |
| `/kaspersky-premium-panama/` | `/en/kaspersky-premium-panama/` |
| `/kaspersky-small-office-security-panama/` | `/en/kaspersky-small-office-security-panama/` |
| `/kaspersky-endpoint-security-cloud-panama/` | `/en/kaspersky-endpoint-security-cloud-panama/` |
| `/renovar-kaspersky-panama/` | `/en/renew-kaspersky-panama/` |
| `/soporte-kaspersky-panama/` | `/en/kaspersky-support-panama/` |
| `/pagos/` | `/en/payment-methods/` |
| `/cotizar/` | `/en/quote/` |
| `/gracias/` | `/en/thank-you/` |
| `/aviso-legal/` | `/en/legal-notice/` |
| `/politica-de-privacidad/` | `/en/privacy-policy/` |

## 10. Checklist de marca (anti-phishing)

- [x] Marca principal = Solutech Panamá (logo “S”, no logo verde de Kaspersky).
- [x] Sin “sitio oficial”, “distribuidor autorizado” ni “representante oficial”.
- [x] Disclaimer de independencia visible en home y páginas clave + en el footer.
- [x] Aviso legal y política de privacidad (Ley 81/2019) con titularidad de marcas.
- [x] Nunca se piden contraseñas ni datos bancarios; acceso remoto autorizado por el cliente.
