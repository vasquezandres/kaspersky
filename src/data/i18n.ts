// =============================================================
//  i18n: helpers de idioma, equivalencias de rutas y navegación
// =============================================================

export type Lang = 'es' | 'en';

export const langs: Lang[] = ['es', 'en'];

export const localeTag: Record<Lang, string> = {
  es: 'es-PA',
  en: 'en',
};

export const ogLocale: Record<Lang, string> = {
  es: 'es_PA',
  en: 'en_US',
};

/**
 * Mapa de equivalencias ES <-> EN.
 * Clave = ruta canónica ES (con / inicial y final).
 * Valor = ruta EN equivalente.
 * Se usa para el selector de idioma y para los hreflang.
 */
export const routePairs: Array<{ es: string; en: string }> = [
  { es: '/', en: '/en/' },
  { es: '/kaspersky-hogar-panama/', en: '/en/kaspersky-home-panama/' },
  { es: '/renovar-kaspersky-panama/', en: '/en/renew-kaspersky-panama/' },
  { es: '/soporte-kaspersky-panama/', en: '/en/kaspersky-support-panama/' },
  { es: '/kaspersky-standard-panama/', en: '/en/kaspersky-standard-panama/' },
  { es: '/kaspersky-plus-panama/', en: '/en/kaspersky-plus-panama/' },
  { es: '/kaspersky-premium-panama/', en: '/en/kaspersky-premium-panama/' },
  { es: '/kaspersky-small-office-security-panama/', en: '/en/kaspersky-small-office-security-panama/' },
  { es: '/kaspersky-endpoint-security-cloud-panama/', en: '/en/kaspersky-endpoint-security-cloud-panama/' },
  { es: '/pagos/', en: '/en/payment-methods/' },
  { es: '/cotizar/', en: '/en/quote/' },
  { es: '/gracias/', en: '/en/thank-you/' },
  { es: '/aviso-legal/', en: '/en/legal-notice/' },
  { es: '/politica-de-privacidad/', en: '/en/privacy-policy/' },
];

/** Dada una ruta ES devuelve su equivalente EN (o /en/ si no existe). */
export function toEn(esPath: string): string {
  return routePairs.find((p) => p.es === esPath)?.en ?? '/en/';
}

/** Dada una ruta EN devuelve su equivalente ES (o / si no existe). */
export function toEs(enPath: string): string {
  return routePairs.find((p) => p.en === enPath)?.es ?? '/';
}

/** Navegación principal del header por idioma. */
export const nav: Record<Lang, Array<{ href: string; label: string }>> = {
  es: [
    { href: '/', label: 'Inicio' },
    { href: '/kaspersky-hogar-panama/', label: 'Hogar' },
    { href: '/kaspersky-small-office-security-panama/', label: 'Small Office' },
    { href: '/kaspersky-endpoint-security-cloud-panama/', label: 'Empresas' },
    { href: '/renovar-kaspersky-panama/', label: 'Renovar' },
    { href: '/soporte-kaspersky-panama/', label: 'Soporte' },
    { href: '/pagos/', label: 'Pagos' },
    { href: '/#faq', label: 'FAQ' },
  ],
  en: [
    { href: '/en/', label: 'Home' },
    { href: '/en/kaspersky-home-panama/', label: 'Home users' },
    { href: '/en/kaspersky-small-office-security-panama/', label: 'Small Office' },
    { href: '/en/kaspersky-endpoint-security-cloud-panama/', label: 'Business' },
    { href: '/en/renew-kaspersky-panama/', label: 'Renew' },
    { href: '/en/kaspersky-support-panama/', label: 'Support' },
    { href: '/en/payment-methods/', label: 'Payments' },
    { href: '/en/#faq', label: 'FAQ' },
  ],
};

/** Strings compartidos de UI. */
export const ui = {
  es: {
    quoteWhatsApp: 'Cotizar por WhatsApp',
    viewPlans: 'Ver planes disponibles',
    quote: 'Cotizar',
    renew: 'Renovar',
    payments: 'Métodos de pago',
    support: 'Soporte e instalación',
    legalNotice: 'Aviso legal',
    privacy: 'Política de privacidad',
    skipToContent: 'Saltar al contenido',
    menu: 'Menú',
    closeMenu: 'Cerrar menú',
    language: 'Idioma',
    consult: 'Consultar',
    priceNote: 'Precios sujetos a disponibilidad, promociones, cambios del proveedor e ITBMS cuando aplique.',
    rights: 'Todos los derechos reservados.',
  },
  en: {
    quoteWhatsApp: 'Request a quote on WhatsApp',
    viewPlans: 'View available plans',
    quote: 'Request a quote',
    renew: 'Renew',
    payments: 'Payment methods',
    support: 'Support & installation',
    legalNotice: 'Legal notice',
    privacy: 'Privacy policy',
    skipToContent: 'Skip to content',
    menu: 'Menu',
    closeMenu: 'Close menu',
    language: 'Language',
    consult: 'Ask us',
    priceNote: 'Prices are subject to availability, promotions, provider changes and applicable taxes.',
    rights: 'All rights reserved.',
  },
} as const;

export const disclaimer = {
  es: 'Solutech Panamá es un proveedor/revendedor independiente de soluciones Kaspersky en Panamá. Este sitio no es el sitio oficial de Kaspersky ni representa directamente a AO Kaspersky Lab. Las marcas, nombres y logotipos de Kaspersky pertenecen a sus respectivos propietarios.',
  en: 'Solutech Panamá is an independent reseller/provider of Kaspersky solutions in Panama. This website is not the official Kaspersky website and does not directly represent AO Kaspersky Lab. Kaspersky trademarks, names and logos belong to their respective owners.',
} as const;

export const footerBrandNote = {
  es: 'Kaspersky es una marca de sus respectivos propietarios. Solutech Panamá comercializa, cotiza y brinda soporte sobre licencias Kaspersky de forma independiente.',
  en: 'Kaspersky is a trademark of its respective owners. Solutech Panamá independently sells, quotes and supports Kaspersky licenses.',
} as const;
