// The worker app's look, kept identical to the customer website (web/src/ui/app.css):
// henna (brand), saffron (waiting / call), leaf green (yes / go), chilli red (no / stop),
// on warm paper. Change a colour here and it changes everywhere in the app.
export const C = {
  paper: '#fbf4ea',
  paperDeep: '#f3e6d3',
  card: '#fffdf9',
  ink: '#2b1d17',
  ink2: '#5e463a',
  ink3: '#8a7062',
  line: '#e8d8c3',

  henna: '#b5432a',
  hennaDeep: '#8c2f1b',
  hennaTint: '#f8e0d5',
  saffron: '#f2a531',
  saffronDeep: '#b87309',
  saffronTint: '#fdebc8',
  leaf: '#2e7a4e',
  leafDeep: '#1d5536',
  leafTint: '#ddf0e2',
  chilli: '#c42b36',
  chilliDeep: '#8f1c25',
  chilliTint: '#fbe0e2',
  wa: '#1da851',
  waDeep: '#137a3a',
  cream: '#fff8ee',
  creamUr: '#ffd9a3',
};

// Custom fonts in React Native pick their weight by name, not by fontWeight.
export const F = {
  regular: 'Baloo2_500Medium',
  semi: 'Baloo2_600SemiBold',
  bold: 'Baloo2_700Bold',
  heavy: 'Baloo2_800ExtraBold',
  urdu: 'NotoNaskhArabic_500Medium',
  urduBold: 'NotoNaskhArabic_600SemiBold',
};

export const R = { lg: 22, md: 16, sm: 12, pill: 999 };

// Two-tone icon colours: [background, soft fill, ink]. Same values as the tone-* classes on the website.
export const TONES = {
  ink: ['#f3e6d3', '#e9cfae', '#2b1d17'],
  henna: ['#f8e0d5', '#f0a58c', '#8c2f1b'],
  saffron: ['#fdebc8', '#f7c25c', '#7a4b00'],
  leaf: ['#ddf0e2', '#8fd0a5', '#1d5536'],
  chilli: ['#fbe0e2', '#f19aa1', '#8f1c25'],
  cream: ['rgba(255,255,255,0.14)', '#f7c25c', '#fff6e8'],
  wa: ['transparent', '#8ff0b2', '#ffffff'],
  bare: ['transparent', '#e9cfae', '#2b1d17'],
  // one colour family per service, so people learn them by colour too
  plumber: ['#dcedf6', '#84c3e6', '#134a68'],
  electrician: ['#fdeec4', '#f9c437', '#7a4a00'],
  cleaner: ['#def1e3', '#93d3a6', '#1d5536'],
  carpenter: ['#f1e1cc', '#d9a86c', '#6b3f12'],
  'ac-technician': ['#dfeaf8', '#9cc0ee', '#23497a'],
  painter: ['#f8dcdc', '#ee8f97', '#8f1c3a'],
  mechanic: ['#e3e3ea', '#a9adc2', '#353a50'],
  fumigator: ['#e9eed2', '#bccb6a', '#4b5410'],
};
