// The people in the demo data, in one place, so `npm run seed` and the printed
// list of demo accounts (`npm run demo:accounts`) always agree. No database here.
//
// Every service has workers in every area (each worker covers 3–4 areas; search also
// shows the areas next door), at every experience level: from 80 jobs done to brand new.
// Everyone logs in with PIN 1234.
import { AREAS, CATEGORIES } from './lib/rules.js';

export const PIN = '1234';
export const ADMIN = { name: 'Mohalla Admin', phone: '03000000000', password: 'password123' };
export const AREA_KEYS = Object.keys(AREAS);

// The first part of each job description must match the customer website's problem
// chips (web/src/i18n.jsx PROBLEMS), so both apps show it in the reader's language.
export const SERVICE = {
  plumber: {
    label: 'Plumber', price: 800,
    problems: ['Tap leaking', 'Pipe leaking', 'Drain blocked', 'Tank or motor'],
    details: ['The kitchen tap drips all night.', 'Water comes out under the sink.', 'The bathroom drain is full of water.', 'The water motor makes noise but no water comes.'],
    bio: 'Leaks, drains, motors and tanks. I bring my own tools.',
    quoteScope: 'Fix the leak and change the washer', part: 'New tap',
  },
  electrician: {
    label: 'Electrician', price: 700,
    problems: ['Fan not working', 'Light or switch', 'Wiring', 'Power keeps going'],
    details: ['The ceiling fan in the bedroom makes noise and stops.', 'Two lights in the kitchen do not turn on.', 'Sparks from the board in the lounge.', 'The main switch trips every evening.'],
    bio: 'Fans, wiring, DB boards and UPS. Safe, neat work.',
    quoteScope: 'Change regulator and fix wiring', part: 'Fan capacitor',
  },
  cleaner: {
    label: 'Cleaner', price: 1500,
    problems: ['Full house', 'Kitchen', 'Bathroom', 'Sofa or carpet'],
    details: ['Deep clean before guests come.', 'Oily kitchen walls and stove.', 'Two bathrooms need a proper scrub.', 'Three-seater sofa has stains.'],
    bio: 'Home deep cleaning. Women team available.',
    quoteScope: '3 rooms, kitchen and 2 bathrooms', part: 'Cleaning liquid',
  },
  carpenter: {
    label: 'Carpenter', price: 1200,
    problems: ['Door or lock', 'Cupboard', 'Bed or chair repair', 'New furniture'],
    details: ['The main door does not close properly.', 'Cupboard door hinge is broken.', 'Bed leg is loose.', 'Need a small shoe rack made.'],
    bio: 'Doors, locks, cupboards and new furniture to order.',
    quoteScope: 'Fix hinges and plane the door', part: 'Door hinges',
  },
  mechanic: {
    label: 'Mechanic', price: 600,
    problems: ["Car won't start", 'Bike repair', 'Oil change', 'Battery'],
    details: ['Car makes a clicking sound and does not start.', 'Bike chain keeps coming off.', 'Car is due for an oil change.', 'Battery dies overnight.'],
    bio: 'Cars and bikes, at your door. Battery and oil change.',
    quoteScope: 'Check starter and battery terminals', part: 'Battery terminal',
  },
  fumigator: {
    label: 'Pest control', price: 2500,
    problems: ['Cockroaches', 'Termites', 'Mosquitoes', 'Bed bugs'],
    details: ['Cockroaches in the kitchen cabinets.', 'Termites in the wooden door frame.', 'Mosquitoes every evening in the lawn.', 'Bed bugs in two rooms.'],
    bio: 'Safe sprays for homes with children. Free re-visit in 15 days.',
    quoteScope: 'Full house spray, kitchen gel', part: 'Gel bait',
  },
  painter: {
    label: 'Painter', price: 3000,
    problems: ['One room', 'Full house', 'Damp walls', 'Doors and grills'],
    details: ['Bedroom walls, light colour.', 'Whole house before Eid.', 'Damp patch on the lounge wall.', 'Main gate and window grills.'],
    bio: 'Walls, damp treatment, doors and grills. Clean finish.',
    quoteScope: 'Putty, primer and 2 coats', part: 'Paint (1 gallon)',
  },
  'ac-technician': {
    label: 'AC repair', price: 1500,
    problems: ['AC not cooling', 'AC service', 'Gas refill', 'Water dripping'],
    details: ['Split AC runs but the air is not cold.', 'Two ACs need a service before summer.', 'AC needs a gas refill.', 'Water drips from the indoor unit.'],
    bio: 'Split and window AC: service, gas, repair and fitting.',
    quoteScope: 'Full service and gas top-up', part: 'Capacitor',
  },
};

// The original demo workers (kept so the phone numbers in the README still work).
const CLASSIC = [
  { name: 'Rashid Electric Works', phone: '03111111111', skills: ['electrician'], areas: ['pechs', 'bahadurabad'], gender: 'male', level: 0, founding: true },
  { name: 'Imran Plumbing Services', phone: '03112222222', skills: ['plumber'], areas: ['gulshan-e-iqbal', 'gulistan-e-jauhar'], gender: 'male', level: 1, founding: true },
  { name: 'Shabana Bibi', phone: '03113333333', skills: ['cleaner'], areas: ['gulshan-e-iqbal', 'pechs'], gender: 'female', level: 2 },
  { name: 'Kausar Home Cleaning', phone: '03114444444', skills: ['cleaner'], areas: ['dha', 'clifton'], gender: 'female', level: 1, founding: true },
  { name: 'Asif Carpenter', phone: '03115555555', skills: ['carpenter'], areas: ['north-nazimabad', 'nazimabad'], gender: 'male', level: 4 },
  { name: 'Zeeshan AC Repair', phone: '03116666666', skills: ['ac-technician', 'electrician'], areas: ['dha', 'korangi'], gender: 'male', level: 2 },
  { name: 'Pak Fumigation Co.', phone: '03117777777', skills: ['fumigator'], areas: ['saddar', 'clifton', 'pechs'], gender: 'unspecified', level: 0, founding: true },
  { name: 'Naveed Auto Mechanic', phone: '03118888888', skills: ['mechanic'], areas: ['malir', 'korangi'], gender: 'male', level: 5 },
];

// Six more workers per service. The first in each list always works in DHA.
const NAMES = {
  plumber: [['Javed Plumber', 'male'], ['Naeem Sanitary Works', 'male'], ['Farhan Khan', 'male'], ['Waseem Pipe Fitter', 'male'], ['Sajid Mehmood', 'male'], ['Tariq Plumbing', 'male']],
  electrician: [['Bilal Electric', 'male'], ['Usman Wiring Works', 'male'], ['Kamran Ali', 'male'], ['Adnan Electrician', 'male'], ['Saima Electric', 'female'], ['Shahid Hussain', 'male']],
  cleaner: [['Nasreen Bibi', 'female'], ['Sparkle Home Services', 'unspecified'], ['Rubina Cleaning', 'female'], ['Parveen Akhtar', 'female'], ['Zubaida Khatoon', 'female'], ['Gulshan Cleaners', 'unspecified']],
  carpenter: [['Ahmed Carpenter', 'male'], ['Yousuf Furniture Works', 'male'], ['Hanif Mistri', 'male'], ['Shakeel Wood Works', 'male'], ['Liaquat Ali', 'male'], ['Abdul Ghafoor', 'male']],
  mechanic: [['Rafiq Auto Works', 'male'], ['Khalid Motors', 'male'], ['Salman Bike Mechanic', 'male'], ['Irfan Mechanic', 'male'], ['Nadeem Auto Electric', 'male'], ['Jamil Garage', 'male']],
  fumigator: [['Safe Home Pest Control', 'unspecified'], ['Termite Masters', 'unspecified'], ['Akbar Spray Services', 'male'], ['Riaz Fumigation', 'male'], ['Clean Shield Pest Control', 'unspecified'], ['Hamid Spray', 'male']],
  painter: [['Ahmed Painter', 'male'], ['Colour Craft Painters', 'unspecified'], ['Sadiq Paint Works', 'male'], ['Mumtaz Painter', 'male'], ['Fozia Home Painting', 'female'], ['Arif Rang Saaz', 'male']],
  'ac-technician': [['Faisal AC Repair', 'male'], ['Cool Breeze AC Services', 'unspecified'], ['Junaid Cooling', 'male'], ['Saleem AC Mechanic', 'male'], ['Ali Air Con', 'male'], ['Polar AC Works', 'unspecified']],
};

// level 0 = 60+ jobs (verified, often a founding shop) … level 5 = brand new (0 jobs)
export const LEVELS = [
  { completed: 72, label: '70+ jobs' },
  { completed: 38, label: '~40 jobs' },
  { completed: 16, label: '~15 jobs' },
  { completed: 7, label: '~7 jobs' },
  { completed: 3, label: 'new (3 jobs)' },
  { completed: 0, label: 'brand new' },
];

export function workers() {
  const list = CLASSIC.map((w) => ({ ...w }));
  CATEGORIES.forEach((cat, c) => {
    NAMES[cat].forEach(([name, gender], j) => {
      // 3 neighbouring areas each; together the 6 workers cover all 11 areas.
      const areas = [0, 1, 2].map((k) => AREA_KEYS[(c + j * 2 + k) % AREA_KEYS.length]);
      if (j === 0 && !areas.includes('dha')) areas.unshift('dha');
      list.push({
        name, gender, skills: [cat], areas, level: j,
        // e.g. painters are 0326…, worker 1 = 03261111111, worker 2 = 03262222222
        phone: `03${20 + c}${String(j + 1).repeat(7)}`,
        founding: j === 1 && /Works|Services|Co\.|Masters|Craft|Garage|Motors/.test(name),
      });
    });
  });
  return list;
}

export const CUSTOMERS = [
  { name: 'Sana Qureshi', phone: '03001111111', area: 'gulshan-e-iqbal' },
  { name: 'Bilal Ahmed', phone: '03002222222', area: 'dha', language: 'roman-ur' },
  { name: 'Khadija Khan', phone: '03003333333', area: 'pechs' },
  { name: 'Ayesha Siddiqui', phone: '03004444444', area: 'clifton' },
  { name: 'Hassan Raza', phone: '03005555555', area: 'saddar' },
  { name: 'Fatima Noor', phone: '03006666666', area: 'bahadurabad' },
  { name: 'Omar Farooq', phone: '03007777777', area: 'gulistan-e-jauhar' },
  { name: 'Zainab Ali', phone: '03008888888', area: 'north-nazimabad' },
  { name: 'Mariam Khan', phone: '03009999999', area: 'nazimabad' },
  { name: 'Danish Iqbal', phone: '03011111111', area: 'korangi' },
  { name: 'Hina Baig', phone: '03012222222', area: 'malir' },
  { name: 'Saad Qureshi', phone: '03013333333', area: 'dha' },
  { name: 'Amna Tariq', phone: '03014444444', area: 'clifton', language: 'roman-ur' },
  { name: 'Usman Sheikh', phone: '03015555555', area: 'pechs' },
  { name: 'Rabia Hameed', phone: '03016666666', area: 'gulshan-e-iqbal' },
];

export const ADDRESS = {
  dha: 'House 23, Street 7, Phase 5',
  clifton: 'Flat 304, Sea View Apartments, Block 2',
  saddar: 'Flat 12, upstairs, Zaibunnisa Street',
  pechs: 'House 88, Block 2',
  bahadurabad: 'House 41, near Bahadurabad Chowrangi',
  'gulshan-e-iqbal': 'House 12, Block 5, near the green mosque',
  'gulistan-e-jauhar': 'Flat B-7, Block 15',
  'north-nazimabad': 'House R-221, Block H',
  nazimabad: 'House 3/12, Nazimabad No. 3',
  korangi: 'House 560, Sector 33-A',
  malir: 'House 19, Model Colony',
};

export const PRAISE = [
  'Came on time and explained everything before starting.',
  'Clean work, showed the bill for parts.',
  'Very polite. Fixed it in one visit.',
  'Good work, a little late but called first.',
  'Fair price, agreed in the app. Would call again.',
  'Did the job properly and cleaned up after.',
];
export const COMPLAINTS = ['Work was OK but came 1 hour late.', 'Had to call twice to remind.'];
export const ABOUT_CUSTOMER = ['Paid on time, clear instructions', 'Polite family, easy to find the house', 'Paid in full, offered tea'];
