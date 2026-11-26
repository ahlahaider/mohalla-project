// English / Roman Urdu for the worker app. Kept short on purpose: workers
// should be able to use the app from icons, colours and numbers alone, with
// words as a backup. Have the workers you interview check the Roman Urdu.
export const STRINGS = {
  login: ['Log in', 'Log in karein'],
  logout: ['Log out', 'Log out'],
  signup: ['New here? Sign up', 'Naye hain? Account banayein'],
  createAccount: ['Create account', 'Account banayein'],
  haveAccount: ['Have an account? Log in', 'Account hai? Log in karein'],
  phone: ['Mobile number', 'Mobile number'],
  password: ['Password', 'Password'],
  name: ['Name or shop name', 'Naam ya dukaan ka naam'],
  skills: ['What work do you do?', 'Aap kya kaam karte hain?'],
  areas: ['Which areas do you go to?', 'Kin ilaqon mein jaate hain?'],
  priceFrom: ['Price from (Rs)', 'Qeemat se (Rs)'],
  priceTo: ['Price up to (Rs)', 'Qeemat tak (Rs)'],
  gender: ['Gender (optional)', 'Jins (marzi se)'],
  female: ['Female', 'Khatoon'],
  male: ['Male', 'Mard'],
  available: ['Available today', 'Aaj available'],
  notAvailable: ['Not available today', 'Aaj available nahi'],
  tabNew: ['New', 'Naye'],
  tabActive: ['Active', 'Jaari'],
  tabDone: ['Done', 'Mukammal'],
  tabOpen: ['Quote', 'Quote dein'],
  nothing: ['Nothing here right now', 'Abhi yahan kuch nahi'],
  accept: ['Accept', 'Qubool'],
  decline: ['Decline', 'Inkaar'],
  back: ['Back', 'Wapas'],
  customer: ['Customer', 'Customer'],
  paidOnRecord: ['paid on record', 'payment record par'],
  call: ['Call', 'Call'],
  agreement: ['Agreement', 'Muahida'],
  total: ['Total', 'Kul'],
  propose: ['Send to customer', 'Customer ko bhejein'],
  amount: ['Amount (Rs)', 'Raqam (Rs)'],
  scope: ['What it covers', 'Kis kaam ke liye'],
  billUrl: ['Bill photo link', 'Bill ki photo ka link'],
  waiting: ['Waiting for customer', 'Customer ka intezar'],
  paidQ: ['How much cash did you receive?', 'Kitna cash mila?'],
  confirm: ['Confirm', 'Confirm'],
  rateCustomer: ['Rate the customer', 'Customer ko rating dein'],
  rated: ['Rating sent', 'Rating bhej di'],
  dispute: ['Problem? Open a dispute', 'Masla? Shikayat karein'],
  explain: ['What happened?', 'Kya hua?'],
  send: ['Send', 'Bhejein'],
  quoteAmount: ['Your price (Rs)', 'Aap ki qeemat (Rs)'],
  note: ['Note (optional)', 'Note (marzi se)'],
  sendQuote: ['Send quote', 'Quote bhejein'],
  quoted: ['Quote sent', 'Quote bhej diya'],
  addressAfter: ['Address shows after you accept', 'Qubool karne ke baad pata dikhega'],
  matched: ['Both sides confirmed the same amount', 'Dono ne same raqam confirm ki'],
  mismatch: ['Amounts don’t match', 'Raqam match nahi karti'],
};

export const ENTRY = {
  visit: ['🚪', 'Visit charge', 'Visit charges'],
  quote: ['📋', 'Full quote', 'Poora quote'],
  amendment: ['✏️', 'Change', 'Tabdeeli'],
  part: ['🔩', 'Parts', 'Parts'],
};

export const CATEGORY = {
  plumber: ['🔧', 'Plumber', 'Plumber'],
  electrician: ['💡', 'Electrician', 'Bijli wala'],
  cleaner: ['🧹', 'Cleaner', 'Safai'],
  carpenter: ['🪚', 'Carpenter', 'Barhai'],
  mechanic: ['🚗', 'Mechanic', 'Mistri'],
  fumigator: ['🪳', 'Fumigation', 'Spray wala'],
  painter: ['🎨', 'Painter', 'Rang saaz'],
  'ac-technician': ['❄️', 'AC technician', 'AC wala'],
};

export const STATUS = {
  open: ['⏳', 'Open for quotes', 'Quotes khule'],
  requested: ['🔔', 'New request', 'Nayi request'],
  accepted: ['🤝', 'Accepted', 'Qubool'],
  agreed: ['✅', 'Price agreed', 'Qeemat tay'],
  completed: ['🏁', 'Completed', 'Mukammal'],
  declined: ['✕', 'Declined', 'Inkaar'],
  expired: ['⌛', 'Expired', 'Waqt khatam'],
  cancelled: ['✕', 'Cancelled', 'Mansookh'],
  proposed: ['⏳', 'Waiting', 'Intezar'],
  rejected: ['✕', 'Rejected', 'Na-manzoor'],
};

export const DISPUTE = {
  'no-show': 'Customer not there / Customer nahi mila',
  'non-payment': 'Not paid / Payment nahi hui',
  scope: 'Work or price disagreement / Ikhtilaf',
  misconduct: 'Misconduct or safety / Hifazat',
};

// Builds the helper functions for one language. i = 0 English, 1 Roman Urdu.
export function makeT(lang) {
  const i = lang === 'en' ? 0 : 1;
  return {
    t: (k) => STRINGS[k]?.[i] ?? k,
    cat: (k) => CATEGORY[k]?.[i + 1] ?? k,
    catIcon: (k) => CATEGORY[k]?.[0] ?? '🛠️',
    entry: (k) => ENTRY[k]?.[i + 1] ?? k,
    entryIcon: (k) => ENTRY[k]?.[0] ?? '•',
    status: (k) => `${STATUS[k]?.[0] ?? ''} ${STATUS[k]?.[i + 1] ?? k}`,
    areaName: (slug = '') => slug.split('-').map((w) => (w.length > 1 ? w[0].toUpperCase() + w.slice(1) : w)).join('-').replace('Dha', 'DHA').replace('Pechs', 'PECHS'),
  };
}
