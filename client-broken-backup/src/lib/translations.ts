// Translation system for multilingual support

export type LanguageCode = 'en' | 'nl' | 'es' | 'fr';

// Translation keys for the entire application
export type TranslationKey = 
  // Navigation
  | 'nav.buildlist'
  | 'nav.completed'
  | 'nav.stock'
  | 'nav.settings'
  
  // Common terms
  | 'common.order'
  | 'common.orders'
  | 'common.date'
  | 'common.status'
  | 'common.customer'
  | 'common.type'
  | 'common.tuning'
  | 'common.pitch'
  | 'common.color'
  | 'common.notes'
  | 'common.save'
  | 'common.cancel'
  | 'common.delete'
  | 'common.edit'
  | 'common.search'
  | 'common.filter'
  
  // Worksheet
  | 'worksheet.title'
  | 'worksheet.waiting'
  | 'worksheet.days'
  | 'worksheet.parts'
  | 'worksheet.prepared'
  | 'worksheet.build'
  | 'worksheet.buildDate'
  | 'worksheet.dry'
  | 'worksheet.testing'
  | 'worksheet.firing'
  | 'worksheet.smoothing'
  | 'worksheet.tuning1'
  | 'worksheet.waxing'
  | 'worksheet.tuning2'
  | 'worksheet.bag'
  | 'worksheet.box'
  | 'worksheet.bagging'
  | 'worksheet.boxing'
  | 'worksheet.labeling'
  | 'worksheet.shipping'
  | 'worksheet.delivered'
  
  // Settings
  | 'settings.title'
  | 'settings.shopify'
  | 'settings.serialNumbers'
  | 'settings.interface'
  | 'settings.materials'
  | 'settings.materialAssignments'
  | 'settings.innatoFlutes'
  | 'settings.nateyFlutes'
  | 'settings.zenFlutes'
  | 'settings.doubleFlutes'
  | 'settings.ovaFlutes'
  | 'settings.cards'
  
  // Other terms as needed
  | 'customer.name'
  | 'customer.email'
  | 'customer.phone'
  | 'customer.address';

// English translations (default)
const en: Record<TranslationKey, string> = {
  // Navigation
  'nav.buildlist': 'Buildlist',
  'nav.completed': 'Completed',
  'nav.stock': 'Stock',
  'nav.settings': 'Settings',
  
  // Common terms
  'common.order': 'Order',
  'common.orders': 'Orders',
  'common.date': 'Date',
  'common.status': 'Status',
  'common.customer': 'Customer',
  'common.type': 'Type',
  'common.tuning': 'Tuning',
  'common.pitch': 'Pitch',
  'common.color': 'Color',
  'common.notes': 'Notes',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.search': 'Search',
  'common.filter': 'Filter',
  
  // Worksheet
  'worksheet.title': 'Buildlist',
  'worksheet.waiting': 'Waiting',
  'worksheet.days': 'Days',
  'worksheet.parts': 'Parts',
  'worksheet.prepared': 'Prepared',
  'worksheet.build': 'BUILD',
  'worksheet.buildDate': 'Build Date',
  'worksheet.dry': 'DRY',
  'worksheet.testing': 'TS R',
  'worksheet.firing': '🔥',
  'worksheet.smoothing': 'SM',
  'worksheet.tuning1': 'T1',
  'worksheet.waxing': 'WAX',
  'worksheet.tuning2': 'T2',
  'worksheet.bag': 'BAG',
  'worksheet.box': 'BOX',
  'worksheet.bagging': 'BAG ✓',
  'worksheet.boxing': 'BOX ✓',
  'worksheet.labeling': 'LAB',
  'worksheet.shipping': '📩',
  'worksheet.delivered': '➡️',
  
  // Settings
  'settings.title': 'Settings',
  'settings.shopify': 'Shopify Integration',
  'settings.serialNumbers': 'Serial Numbers',
  'settings.interface': 'Interface',
  'settings.materials': 'Materials',
  'settings.materialAssignments': 'Material Assignments',
  'settings.innatoFlutes': 'INNATO Flutes',
  'settings.nateyFlutes': 'NATEY Flutes',
  'settings.zenFlutes': 'ZEN Flutes',
  'settings.doubleFlutes': 'DOUBLE Flutes',
  'settings.ovaFlutes': 'OvA Flutes',
  'settings.cards': 'CARDS',
  
  // Customer details
  'customer.name': 'Name',
  'customer.email': 'Email',
  'customer.phone': 'Phone',
  'customer.address': 'Address',
};

// Dutch translations
const nl: Record<TranslationKey, string> = {
  // Navigation
  'nav.buildlist': 'Bouwlijst',
  'nav.completed': 'Voltooid',
  'nav.stock': 'Voorraad',
  'nav.settings': 'Instellingen',
  
  // Common terms
  'common.order': 'Bestelling',
  'common.orders': 'Bestellingen',
  'common.date': 'Datum',
  'common.status': 'Status',
  'common.customer': 'Klant',
  'common.type': 'Type',
  'common.tuning': 'Stemming',
  'common.pitch': 'Toonhoogte',
  'common.color': 'Kleur',
  'common.notes': 'Notities',
  'common.save': 'Opslaan',
  'common.cancel': 'Annuleren',
  'common.delete': 'Verwijderen',
  'common.edit': 'Bewerken',
  'common.search': 'Zoeken',
  'common.filter': 'Filteren',
  
  // Worksheet
  'worksheet.title': 'Bouwlijst',
  'worksheet.waiting': 'Wachttijd',
  'worksheet.days': 'Dagen',
  'worksheet.parts': 'Onderdelen',
  'worksheet.prepared': 'Voorbereid',
  'worksheet.build': 'BOUWEN',
  'worksheet.buildDate': 'Bouwdatum',
  'worksheet.dry': 'DROGEN',
  'worksheet.testing': 'TS R',
  'worksheet.firing': '🔥',
  'worksheet.smoothing': 'SM',
  'worksheet.tuning1': 'T1',
  'worksheet.waxing': 'WAS',
  'worksheet.tuning2': 'T2',
  'worksheet.bag': 'TAS',
  'worksheet.box': 'DOOS',
  'worksheet.bagging': 'TAS ✓',
  'worksheet.boxing': 'DOOS ✓',
  'worksheet.labeling': 'LABEL',
  'worksheet.shipping': '📩',
  'worksheet.delivered': '➡️',
  
  // Settings
  'settings.title': 'Instellingen',
  'settings.shopify': 'Shopify Integratie',
  'settings.serialNumbers': 'Serienummers',
  'settings.interface': 'Interface',
  'settings.materials': 'Materialen',
  'settings.materialAssignments': 'Materiaal Toewijzingen',
  'settings.innatoFlutes': 'INNATO Fluiten',
  'settings.nateyFlutes': 'NATEY Fluiten',
  'settings.zenFlutes': 'ZEN Fluiten',
  'settings.doubleFlutes': 'DOUBLE Fluiten',
  'settings.ovaFlutes': 'OvA Fluiten',
  'settings.cards': 'KAARTEN',
  
  // Customer details
  'customer.name': 'Naam',
  'customer.email': 'E-mail',
  'customer.phone': 'Telefoon',
  'customer.address': 'Adres',
};

// Spanish translations (minimal placeholder)
const es: Record<TranslationKey, string> = {
  ...en, // Default to English for now, replace as needed
};

// French translations (minimal placeholder)
const fr: Record<TranslationKey, string> = {
  ...en, // Default to English for now, replace as needed
};

// All available translations
const translations: Record<LanguageCode, Record<TranslationKey, string>> = {
  en,
  nl,
  es,
  fr
};

// Context to manage current language
export function getTranslation(key: TranslationKey, lang: LanguageCode = 'en'): string {
  return translations[lang][key] || translations['en'][key] || key;
}

// Hook for accessing translations
export function useTranslation(lang: LanguageCode = 'en') {
  return {
    t: (key: TranslationKey) => getTranslation(key, lang),
    language: lang
  };
}