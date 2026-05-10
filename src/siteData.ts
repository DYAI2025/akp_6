// Types
export type PageId = 
  | 'cover' 
  | 'index' 
  | 'buero' 
  | 'leistungen' 
  | 'projekte' 
  | 'wohnen' 
  | 'gesundheit' 
  | 'gewerbe' 
  | 'bestand' 
  | 'kompetenzen' 
  | 'geschichte' 
  | 'publikationen' 
  | 'netzwerk' 
  | 'kontakt' 
  | 'impressum';

export interface Project {
  id: string;
  title: string;
  location: string;
  typology: string;
  description: string;
  tags: string[];
  image?: string;
  category: string;
}

export interface Page {
  id: PageId;
  title: string;
  subtitle?: string;
}

// Projects data from SSOT
export const projects: Project[] = [
  {
    id: 'roelckestrasse',
    title: 'Wohnungsbau Roelckestraße',
    location: 'Berlin-Pankow',
    typology: 'Wohnungsbau',
    description: 'Neubau von Mehrfamilienhäusern im Kontext städtischer Nachverdichtung.',
    tags: ['Wohnen', 'Berlin', 'Neubau'],
    image: '/images/cover-building.jpg',
    category: 'wohnen'
  },
  {
    id: 'pestalozzistrasse',
    title: 'Pestalozzistraße 45–46',
    location: 'Berlin-Charlottenburg',
    typology: 'Wohn- und Geschäftsbebauung',
    description: 'Stadtreparatur mit rot-bunt geflammtem Kohlebrandklinker und ökologischer Ausstattung.',
    tags: ['Wohnen', 'Berlin', 'Sanierung', 'Stadtreparatur'],
    image: '/images/klinker-abend.jpg',
    category: 'wohnen'
  },
  {
    id: 'studinest',
    title: 'Wohnungsbau „Studinest"',
    location: 'Berlin',
    typology: 'Studentisches Wohnen',
    description: 'Preisgünstiger Wohnraum für Studierende mit kompakten Grundrissen.',
    tags: ['Wohnen', 'Berlin', 'Low-Cost', 'Studenten'],
    image: '/images/holz-fassade.jpg',
    category: 'wohnen'
  },
  {
    id: 'luetzufer',
    title: 'Wohn- und Bürogebäude Lützowufer',
    location: 'Berlin',
    typology: 'Mischnutzung',
    description: 'Gemischte Bebauung am Wasser mit Wohn- und Büroflächen.',
    tags: ['Wohnen', 'Büro', 'Berlin'],
    category: 'wohnen'
  },
  {
    id: 'hundekehlestrasse',
    title: 'Privatklinik Hundekehlestraße',
    location: 'Berlin',
    typology: 'Gesundheitsbau',
    description: 'Klinikbau mit besonderen Anforderungen an Funktionalität und Patientenorientierung.',
    tags: ['Gesundheit', 'Berlin', 'Neubau'],
    image: '/images/innenraum-atrium.jpg',
    category: 'gesundheit'
  },
  {
    id: 'regensburg',
    title: 'Erweiterung Forensische Kliniken',
    location: 'Regensburg',
    typology: 'Gesundheitsbau',
    description: 'Erweiterung bestehender Klinikstrukturen unter Berücksichtigung sicherheitstechnischer Anforderungen.',
    tags: ['Gesundheit', 'Bayern', 'Erweiterung'],
    category: 'gesundheit'
  },
  {
    id: 'rathaus-korbach',
    title: 'Rathaus Korbach',
    location: 'Korbach',
    typology: 'Verwaltungsbau',
    description: 'Öffentlicher Verwaltungsbau im städtebaulichen Kontext.',
    tags: ['Verwaltung', 'Hessen', 'Öffentlich'],
    category: 'gesundheit'
  },
  {
    id: 'genshagen',
    title: 'Ausstellungshalle und Verwaltungszentrum',
    location: 'Genshagen',
    typology: 'Gewerbe',
    description: 'Funktionaler Gewerbebau mit Ausstellungs- und Verwaltungsflächen.',
    tags: ['Gewerbe', 'Brandenburg', 'Neubau'],
    image: '/images/industrie-halle.jpg',
    category: 'gewerbe'
  },
  {
    id: 'schichauweg',
    title: 'Verwaltungs-, Labor- und Industriegebäude',
    location: 'Schichauweg, Berlin',
    typology: 'Industrie',
    description: 'Technische Gebäude mit Labor- und Produktionsflächen.',
    tags: ['Industrie', 'Berlin', 'Labor'],
    category: 'gewerbe'
  },
  {
    id: 'jugendhotel',
    title: 'Umbau Gewerbehaus zu Jugendhotel',
    location: 'Berlin',
    typology: 'Umnutzung',
    description: 'Konversion eines Gewerbegebäudes in eine Jugendherberge.',
    tags: ['Sanierung', 'Berlin', 'Umnutzung'],
    category: 'bestand'
  },
  {
    id: 'waldowstrasse',
    title: 'Altbaumodernisierung Waldowstraße',
    location: 'Berlin',
    typology: 'Sanierung',
    description: 'Modernisierung einer Altbauwohnanlage unter Berücksichtigung von Denkmalschutz.',
    tags: ['Sanierung', 'Berlin', 'Altbau'],
    image: '/images/sanierung-vorher.jpg',
    category: 'bestand'
  },
  {
    id: 'gaillard22',
    title: 'Modernisierung Gaillardstraße 22',
    location: 'Berlin',
    typology: 'Modernisierung',
    description: 'Energetische Sanierung und Grundrissoptimierung.',
    tags: ['Sanierung', 'Berlin', 'Energie'],
    category: 'bestand'
  }
];

// Pages configuration
export const pages: Page[] = [
  { id: 'cover', title: 'Deckblatt' },
  { id: 'index', title: 'Inhaltsverzeichnis', subtitle: 'Architektonischer Atlas' },
  { id: 'buero', title: 'Büro & Haltung' },
  { id: 'leistungen', title: 'Leistungen & Prozess' },
  { id: 'projekte', title: 'Projektarchiv' },
  { id: 'wohnen', title: 'Wohnen & Stadtreparatur' },
  { id: 'gesundheit', title: 'Gesundheit, Pflege & öffentliche Bauten' },
  { id: 'gewerbe', title: 'Gewerbe, Industrie & Logistik' },
  { id: 'bestand', title: 'Bestand, Sanierung & Modernisierung' },
  { id: 'kompetenzen', title: 'Kompetenzen' },
  { id: 'geschichte', title: 'Geschichte & Vita' },
  { id: 'publikationen', title: 'Veröffentlichungen' },
  { id: 'netzwerk', title: 'Netzwerk' },
  { id: 'kontakt', title: 'Kontakt' },
  { id: 'impressum', title: 'Impressum' }
];

// Index entries
export const indexEntries = [
  { id: 'buero', number: '01', title: 'Büro & Haltung', text: 'Erfahrenes Berliner Architekturbüro seit 1991.' },
  { id: 'leistungen', number: '02', title: 'Leistungen & Prozess', text: 'Von Entwurf bis Schlüsselübergabe.' },
  { id: 'projekte', number: '03', title: 'Projektarchiv', text: 'Ausgewählte Projekte nach Typologie.' },
  { id: 'wohnen', number: '04', title: 'Wohnen & Stadtreparatur', text: 'Stadtreparatur und Nachverdichtung.' },
  { id: 'gesundheit', number: '05', title: 'Gesundheit, Pflege & öffentliche Bauten', text: 'Funktionale Bauten für Gesellschaft.' },
  { id: 'gewerbe', number: '06', title: 'Gewerbe, Industrie & Logistik', text: 'Wirtschaftlichkeit und Corporate Architecture.' },
  { id: 'bestand', number: '07', title: 'Bestand, Sanierung & Modernisierung', text: 'Bestehende Stadt weiterbauen.' },
  { id: 'kompetenzen', number: '08', title: 'Kompetenzen', text: 'Typologische Breite und technische Tiefe.' },
  { id: 'geschichte', number: '09', title: 'Geschichte & Vita', text: 'Internationale Erfahrung seit 1991.' },
  { id: 'publikationen', number: '10', title: 'Veröffentlichungen', text: 'Fachpublikationen und Projektdokumentationen.' },
  { id: 'netzwerk', number: '11', title: 'Netzwerk', text: 'Partner für Tragwerk, Technik und Brandschutz.' },
  { id: 'kontakt', number: '12', title: 'Kontakt', text: 'Projekte besprechen und Anfragen stellen.' }
];

// Kompetenzen data
export const kompetenzen = [
  {
    title: 'Stadtreparatur und Bestand',
    text: 'Baulückenschließung, Nachverdichtung und kontextuelle Einbindung in bestehende Stadtstrukturen.',
    keywords: ['Stadtreparatur', 'Nachverdichtung', 'Kontext', 'Baulücke']
  },
  {
    title: 'Wirtschaftlichkeit',
    text: 'Kostenkontrolle als integraler Bestandteil des Entwurfsprozesses.',
    keywords: ['Kostenkontrolle', 'Budget', 'Realisierbarkeit', 'Wirtschaftlichkeit']
  },
  {
    title: 'Energie und Ökologie',
    text: 'Energieeffiziente Planung und ökologische Materiallogik.',
    keywords: ['Energieeffizienz', 'Ökologie', 'Nachhaltigkeit', 'Material']
  },
  {
    title: 'Digitale und technische Kompetenz',
    text: 'CAD-Systeme und elektronische Detailbibliothek seit den frühen 1990er Jahren.',
    keywords: ['CAD', 'BIM', 'Digitale Planung', 'Technik']
  },
  {
    title: 'Generalplanung und Netzwerk',
    text: 'Koordination aller Gewerke von Entwurf bis Schlüsselübergabe.',
    keywords: ['Generalplanung', 'Koordination', 'Netzwerk', 'Bauleitung']
  },
  {
    title: 'Typologische Breite',
    text: 'Wohnungsbau, Gesundheitsbau, Verwaltung, Gewerbe und Sanierung.',
    keywords: ['Wohnen', 'Gesundheit', 'Verwaltung', 'Gewerbe', 'Sanierung']
  }
];

// Leistungen data
export const leistungen = [
  { number: '01', title: 'Entwurf', desc: 'Konzeption und Gestaltung' },
  { number: '02', title: 'Genehmigungsplanung', desc: 'Behördliche Abstimmung' },
  { number: '03', title: 'Ausführungsplanung', desc: 'Detailplanung für die Ausführung' },
  { number: '04', title: 'Ausschreibung', desc: 'Vergabeunterlagen erstellen' },
  { number: '05', title: 'Vergabe', desc: 'Angebote prüfen und vergeben' },
  { number: '06', title: 'Bauleitung', desc: 'Überwachung der Ausführung' },
  { number: '07', title: 'Abrechnung', desc: 'Kostenkontrolle und Schlussrechnung' },
  { number: '08', title: 'Schlüsselübergabe', desc: 'Fertigstellung und Übergabe' }
];

export const zusatzleistungen = [
  'Grundstücksanalyse',
  'Kaufverhandlungen',
  'Finanzierung',
  'Investitionsförderung',
  'Arbeitsschutz- und Sicherheitstechnik',
  'Energieeffiziente Planung und Beratung',
  'Energieausweise',
  'Optimierung von Preis-Leistung und Baufirmenauswahl'
];

// Timeline data
export const timeline = [
  { year: '1991', title: 'Gründung', text: 'Gründung des Architekturbüros in Berlin.' },
  { year: '1990er', title: 'Internationale Erfahrung', text: 'Erfahrungen in den USA, Japan, Hong Kong, Singapur, Sydney, Auckland und Bangkok.' },
  { year: '2000er', title: 'Wachstum', text: 'Erweiterung des Leistungsspektrums und Generalplanung.' },
  { year: 'Heute', title: 'Gegenwart', text: '21 Wettbewerbe, 2 erste Preise, 1 Ankauf, DEUBAU-Preis-Nominierung.' }
];

// Publications
export const publikationen = [
  { group: 'Eigene Projekte', items: ['Mehrfamilienhaus Berlin-Pankow', 'Wohn- und Geschäftsbebauung Pestalozzistraße'] },
  { group: 'Digitale Planung', items: ['CAD-gestützte Planung im Wohnungsbau', 'Elektronische Detailbibliotheken'] },
  { group: 'Ökologie', items: ['Energieeffiziente Planungsansätze', 'Ökologische Materiallogik'] },
  { group: 'Internationale Architektur', items: ['Erfahrungen aus dem asiatischen Raum', 'Planungsmethoden in den USA'] }
];

// Netzwerk data
export const netzwerk = [
  { category: 'Wettbewerbspartner', names: ['Verschiedene Berliner Büros'] },
  { category: 'Bauleitung', names: ['Bauüberwachungspartner'] },
  { category: 'Tragwerksplanung', names: ['Statik- und Tragwerksbüros'] },
  { category: 'Technische Ausrüstung', names: ['TGA-Planungsbüros'] },
  { category: 'Brandschutz', names: ['Brandschutzgutachter'] },
  { category: 'Vermessung', names: ['Vermessungsbüros'] },
  { category: 'Garten- und Landschaftsplanung', names: ['Landschaftsarchitekten'] },
  { category: 'Energieberatung', names: ['Energieeffizienz-Experten'] }
];

