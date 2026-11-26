// English / Roman Urdu toggle. Every piece of UI text is looked up by a key,
// so adding a language later means adding one more column here.
// The Roman Urdu is a first draft: have the team (and the workers you
// interview) correct anything that sounds off.
import { createContext, useContext, useState } from 'react';

const STRINGS = {
  findHelp: ['Find help', 'Madad dhoondein'],
  myJobs: ['My jobs', 'Meray kaam'],
  postJob: ['Post a job for quotes', 'Kaam post karein, quotes lein'],
  admin: ['Admin', 'Admin'],
  login: ['Log in', 'Log in karein'],
  logout: ['Log out', 'Log out'],
  signup: ['Sign up', 'Account banayein'],
  tagline: ['Your neighbours already know a good plumber.', 'Aap ke parosi pehle se acha plumber jaante hain.'],
  allCategories: ['All services', 'Tamam services'],
  anyArea: ['Any area', 'Koi bhi ilaqa'],
  area: ['Area', 'Ilaqa'],
  maxPrice: ['Max starting price (Rs)', 'Zyada se zyada shuruati qeemat (Rs)'],
  availableToday: ['Available today', 'Aaj available'],
  femaleWorker: ['Female worker', 'Khatoon worker'],
  noWorkers: ['No workers match yet. Try a nearby area or fewer filters.', 'Abhi koi worker nahi mila. Qareebi ilaqa ya kam filters try karein.'],
  newWorker: ['New', 'Naya'],
  jobsDone: ['jobs completed', 'kaam mukammal'],
  onTime: ['on time', 'waqt par'],
  verified: ['Verified', 'Tasdeeq shuda'],
  founding: ['Founding', 'Bunyadi member'],
  vouchedBy: ['Vouched for by', 'Sifarish:'],
  reviews: ['Reviews', 'Reviews'],
  noReviews: ['No reviews yet', 'Abhi koi review nahi'],
  requestWorker: ['Request this worker', 'Is worker ko bulayein'],
  service: ['Service', 'Service'],
  describe: ['Describe the problem', 'Masla batayein'],
  address: ['Address', 'Pata'],
  addressNote: ['Only shown to the worker after they accept.', 'Worker ko sirf qubool karne ke baad dikhega.'],
  preferredTime: ['Preferred time', 'Pasandida waqt'],
  sendRequest: ['Send request', 'Request bhejein'],
  postForQuotes: ['Post for quotes', 'Quotes ke liye post karein'],
  loginToRequest: ['Log in to request this worker', 'Request ke liye log in karein'],
  phone: ['Mobile number', 'Mobile number'],
  password: ['Password', 'Password'],
  name: ['Your name', 'Aap ka naam'],
  workersUseApp: ['Workers: sign up in the Mohalla worker app.', 'Workers: Mohalla worker app mein account banayein.'],
  agreement: ['Job agreement', 'Kaam ka muahida'],
  agreementNote: ['Every price and change is confirmed here, so there is a record.', 'Har qeemat aur tabdeeli yahan confirm hoti hai, taake record rahe.'],
  noEntries: ['Nothing proposed yet. The worker proposes the visit charge or quote.', 'Abhi kuch tajweez nahi hua. Worker visit charges ya quote bhejega.'],
  total: ['Agreed total', 'Tay shuda kul raqam'],
  accept: ['Accept', 'Manzoor'],
  reject: ['Reject', 'Na-manzoor'],
  markComplete: ['Mark the job complete', 'Kaam mukammal karein'],
  onTimeQ: ['Did they arrive on time?', 'Kya woh waqt par aaye?'],
  yes: ['Yes', 'Haan'],
  no: ['No', 'Nahi'],
  confirmPayment: ['Confirm the cash amount you paid', 'Jo cash diya woh confirm karein'],
  confirm: ['Confirm', 'Confirm'],
  paymentMismatch: ['The amounts don’t match. Check with the worker, or open a dispute.', 'Raqam match nahi karti. Worker se baat karein ya shikayat darj karein.'],
  paymentMatched: ['Both sides confirmed the same amount.', 'Dono taraf se same raqam confirm hui.'],
  rate: ['Rate the worker', 'Worker ko rating dein'],
  ratingHidden: ['Ratings stay hidden until both sides rate, or 7 days pass.', 'Ratings tab tak chupi rehti hain jab tak dono rating na dein, ya 7 din na guzar jayein.'],
  comment: ['Comment (optional)', 'Comment (marzi se)'],
  submit: ['Submit', 'Bhejein'],
  rated: ['You rated this job.', 'Aap rating de chuke hain.'],
  openDispute: ['Something went wrong? Open a dispute', 'Masla hua? Shikayat darj karein'],
  disputeType: ['What happened', 'Kya hua'],
  disputeText: ['Explain what happened', 'Tafseel batayein'],
  disputeOpen: ['Dispute', 'Shikayat'],
  cancelJob: ['Cancel job', 'Kaam mansookh karein'],
  call: ['Call', 'Call karein'],
  quotes: ['Quotes received', 'Aaye hue quotes'],
  noQuotes: ['No quotes yet. Workers in your area will see this job.', 'Abhi koi quote nahi. Aap ke ilaqe ke workers yeh kaam dekhein ge.'],
  pick: ['Pick', 'Chunein'],
  reportSafety: ['Report a safety problem', 'Hifazat ka masla report karein'],
  expiresAt: ['Expires if not answered by', 'Jawab na aaya to khatam:'],
  noJobs: ['No jobs yet. Find a worker to get started.', 'Abhi koi kaam nahi. Worker dhoond kar shuru karein.'],
  needsYou: ['Needs your answer', 'Aap ka jawab chahiye'],
};

const CATEGORY = {
  plumber: ['Plumber', 'Plumber', '🔧'],
  electrician: ['Electrician', 'Bijli wala', '💡'],
  cleaner: ['Cleaner', 'Safai', '🧹'],
  carpenter: ['Carpenter', 'Barhai', '🪚'],
  mechanic: ['Mechanic', 'Mistri', '🚗'],
  fumigator: ['Fumigation', 'Spray wala', '🪳'],
  painter: ['Painter', 'Rang saaz', '🎨'],
  'ac-technician': ['AC technician', 'AC wala', '❄️'],
};

const STATUS = {
  open: ['Waiting for quotes', 'Quotes ka intezar'],
  requested: ['Waiting for worker', 'Worker ka intezar'],
  accepted: ['Accepted', 'Qubool'],
  agreed: ['Price agreed', 'Qeemat tay'],
  completed: ['Completed', 'Mukammal'],
  declined: ['Declined', 'Inkaar'],
  expired: ['Expired', 'Waqt khatam'],
  cancelled: ['Cancelled', 'Mansookh'],
  proposed: ['Proposed', 'Tajweez'],
  rejected: ['Rejected', 'Na-manzoor'],
  upheld: ['Upheld', 'Faisla ho gaya'],
  unresolved: ['Unresolved', 'Ghair wazeh'],
  settled: ['Settled', 'Tay pa gaya'],
};

const ENTRY = {
  visit: ['Visit charge', 'Visit charges'],
  quote: ['Full quote', 'Poora quote'],
  amendment: ['Change', 'Tabdeeli'],
  part: ['Parts', 'Parts'],
};

const DISPUTE = {
  'no-show': ['Didn’t show up', 'Nahi aaye'],
  'non-payment': ['Not paid', 'Payment nahi hui'],
  scope: ['Work or price disagreement', 'Kaam ya qeemat par ikhtilaf'],
  misconduct: ['Misconduct or safety', 'Badtameezi ya hifazat'],
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const i = lang === 'en' ? 0 : 1;
  const pick = (table, key) => table[key]?.[i] ?? key;

  const value = {
    lang,
    toggle: () => {
      const next = lang === 'en' ? 'roman-ur' : 'en';
      localStorage.setItem('lang', next);
      setLang(next);
    },
    t: (key) => pick(STRINGS, key),
    cat: (key) => pick(CATEGORY, key),
    icon: (key) => CATEGORY[key]?.[2] ?? '🛠️',
    status: (key) => pick(STATUS, key),
    entry: (key) => pick(ENTRY, key),
    dispute: (key) => pick(DISPUTE, key),
    // "gulshan-e-iqbal" -> "Gulshan-e-Iqbal"
    areaName: (slug = '') => slug.split('-').map((w) => (w.length > 1 ? w[0].toUpperCase() + w.slice(1) : w)).join('-').replace('Dha', 'DHA').replace('Pechs', 'PECHS'),
    disputeTypes: Object.keys(DISPUTE),
  };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
