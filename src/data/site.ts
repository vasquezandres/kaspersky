// =============================================================
//  Datos centrales del sitio. Cambiar aquí afecta todo el sitio.
// =============================================================

export const site = {
  name: 'Solutech Panamá',
  domain: 'kasperskypanama.com',
  baseUrl: 'https://kasperskypanama.com',
  mainSiteUrl: 'https://solutechpanama.com',

  // Contacto
  whatsapp: '50768886778',            // sin "+" para wa.me
  whatsappDisplay: '+507 6888-6778',
  phoneAlt: '+507 395-8353',
  phoneAltTel: '+5073958353',
  email: 'soporte@solutechpanama.com',

  // Marca / color
  brandColor: '#ff1748',

  // Precios — Google Sheets (gviz/tq). Hoja por defecto: "kaspersky".
  // Columnas esperadas en la hoja: SKU | PrecioUSD | Producto
  sheetId: '1h5RBn4NrQATYn-zZVeDVuo8Ory8KPdGugBlEceivs30',
  defaultSheet: 'kaspersky',

  // Formularios
  formspreeId: 'xldaeanj',

  // Redes (Solutech)
  social: {
    instagram: 'https://www.instagram.com/solutechpanama',
    facebook: 'https://www.facebook.com/solutechpanama',
    tiktok: 'https://www.tiktok.com/@solutechpanama',
    youtube: 'https://www.youtube.com/@solutechpanama',
  },

  // Horario
  hours: {
    weekdays: 'Lun–Vie: 9:00–18:00',
    saturday: 'Sáb: 9:00–13:00',
  },

  // Plan destacado (tarjeta del hero). El precio se consulta en vivo por SKU.
  featured: {
    name: 'Kaspersky Plus',
    sku: 'KL1042DDCFS', // Plus · 3 dispositivos · 1 año
    devices: 3,
    years: 1,
  },
} as const;

/** Construye un enlace de WhatsApp con texto precargado. */
export function waLink(text: string): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}
