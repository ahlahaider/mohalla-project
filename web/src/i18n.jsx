// Every word in the app, in three forms: [English, Roman Urdu, Urdu script].
// - The toggle switches the MAIN text between English and Roman Urdu.
// - Key labels also show the Urdu script line underneath (see <Say> in ui/kit.jsx).
// {name}, {n}, {amount} ... are filled in when the text is used.
// The Urdu and Roman Urdu are a first draft: have native speakers check them.
import { createContext, useContext, useState } from 'react';

const S = {
  // ---- general ----
  loading: ['Loading…', 'Load ho raha hai…', 'لوڈ ہو رہا ہے…'],
  noInternet: ['No internet. Check your connection and try again.', 'Internet nahi hai. Connection check kar ke dobara koshish karein.', 'انٹرنیٹ نہیں ہے۔ کنکشن چیک کر کے دوبارہ کوشش کریں۔'],
  somethingWentWrong: ['Something went wrong. Try again.', 'Kuch ghalat ho gaya. Dobara koshish karein.', 'کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔'],
  tryAgain: ['Try again', 'Dobara koshish karein', 'دوبارہ کوشش کریں'],
  continue: ['Continue', 'Aage chalein', 'آگے چلیں'],
  change: ['Change', 'Badlein', 'بدلیں'],
  back: ['Back', 'Wapas', 'واپس'],
  close: ['Close', 'Band karein', 'بند کریں'],
  canSkip: ['you can skip this', 'chhor bhi sakte hain', 'چھوڑ بھی سکتے ہیں'],
  him: ['him', 'him', ''],
  her: ['her', 'her', ''],

  // ---- bottom navigation ----
  navHome: ['Home', 'Home', 'ہوم'],
  navJobs: ['My jobs', 'Meray kaam', 'میرے کام'],
  navHelp: ['Help', 'Madad', 'مدد'],
  navMe: ['Me', 'Main', 'میں'],

  // ---- home ----
  homeQ: ['What do you need help with?', 'Aap ko kis kaam ki zaroorat hai?', 'آپ کو کس کام کی ضرورت ہے؟'],
  pickArea: ['Choose your area', 'Apna ilaqa chunein', 'اپنا علاقہ چنیں'],
  howTitle: ['How Mohalla works', 'Mohalla kaise kaam karta hai', 'محلہ کیسے کام کرتا ہے'],
  how1: ['Pick a worker near you', 'Qareeb ka worker chunein', 'قریب کا کاریگر چنیں'],
  how2: ['Every price is agreed in the app', 'Har qeemat app mein tay hoti hai', 'ہر قیمت ایپ میں طے ہوتی ہے'],
  how3: ['Pay cash when the work is done', 'Kaam ke baad cash dein', 'کام کے بعد نقد ادائیگی کریں'],
  how4: ['Something wrong? Tell Mohalla within 48 hours', 'Koi masla? 48 ghante mein Mohalla ko batayein', 'کوئی مسئلہ؟ 48 گھنٹے میں محلہ کو بتائیں'],

  // ---- area picker ----
  areaQ: ['Where is your house?', 'Aap ka ghar kahan hai?', 'آپ کا گھر کہاں ہے؟'],
  areaNote: ['We show workers from your area and the areas next to it.', 'Hum aap ke aur qareeb ke ilaqon ke worker dikhate hain.', 'ہم آپ کے اور قریبی علاقوں کے کاریگر دکھاتے ہیں۔'],

  // ---- results ----
  nearArea: ['near {area}', '{area} ke qareeb', '{area} کے قریب'],
  allAreas: ['in all areas', 'tamam ilaqon mein', 'تمام علاقوں میں'],
  fFree: ['Free today', 'Aaj farigh', 'آج فارغ'],
  fWomen: ['Women workers', 'Khawateen', 'خواتین'],
  fCheap: ['Low price', 'Kam qeemat', 'کم قیمت'],
  fTop: ['Top rated', 'Behtareen rating', 'بہترین ریٹنگ'],
  found: ['{n} found', '{n} mil gaye', '{n} ملے'],
  noneFound: ['No one found here yet', 'Abhi yahan koi nahi mila', 'ابھی یہاں کوئی نہیں ملا'],
  noneHint: ['Try another area, or remove a filter.', 'Doosra ilaqa ya kam filter try karein.', 'دوسرا علاقہ آزمائیں یا فلٹر ہٹائیں۔'],
  clearFilters: ['Remove filters', 'Filter hatayein', 'فلٹر ہٹائیں'],
  bVerified: ['ID checked', 'ID check hua', 'شناخت چیک ہوئی'],
  bFounding: ['Old trusted shop', 'Purani bharosemand dukaan', 'پرانی بھروسہ مند دکان'],
  bTrusts: ['{name} trusts {him}', '{name} ko in par bharosa hai', '{name} کو ان پر بھروسہ ہے'],
  bNew: ['New on Mohalla', 'Mohalla par naya', 'محلہ پر نیا'],
  reviewsN: ['{n} reviews', '{n} reviews', '{n} ریویو'],
  review1: ['1 review', '1 review', '1 ریویو'],
  noReviewsYet: ['no reviews yet', 'abhi review nahi', 'ابھی ریویو نہیں'],
  jobsDone: ['jobs done', 'kaam kiye', 'کام کیے'],
  startsFrom: ['starts from', 'se shuru', 'سے شروع'],
  seeMore: ['See more', 'Aur dekhein', 'مزید دیکھیں'],

  // ---- worker profile ----
  peopleRated: ['{n} people rated', '{n} logon ki rating', '{n} لوگوں کی ریٹنگ'],
  person1Rated: ['1 person rated', '1 shakhs ki rating', '1 شخص کی ریٹنگ'],
  jobsFinished: ['jobs finished', 'kaam mukammal', 'کام مکمل'],
  cameOnTime: ['came on time', 'waqt par aaye', 'وقت پر آئے'],
  verifiedLong: ['Mohalla has seen {his} ID card.', 'Mohalla ne in ka ID card dekha hai.', 'محلہ نے ان کا شناختی کارڈ دیکھا ہے۔'],
  foundingLong: ['Our team visited the shop in person.', 'Hamari team ne dukaan khud ja kar dekhi.', 'ہماری ٹیم نے خود جا کر دکان دیکھی۔'],
  newLong: ['Fewer than 5 jobs on Mohalla so far.', 'Mohalla par abhi 5 se kam kaam.', 'محلہ پر ابھی 5 سے کم کام۔'],
  trustedBy: ['Trusted by', 'In par bharosa karte hain', 'ان پر بھروسہ کرتے ہیں'],
  trustedByLong: ['{name} puts {his} own name on this worker.', '{name} ne apne naam se in ki zamanat di hai.', '{name} نے اپنے نام سے ان کی ضمانت دی ہے۔'],
  his: ['his', 'his', ''],
  hers: ['her', 'her', ''],
  usualPrice: ['Usual price', 'Aam qeemat', 'عام قیمت'],
  priceHow: ['{name} checks the problem first, then sends you the full price in the app. You say yes or no.', '{name} pehle masla dekhein ge, phir app mein poori qeemat bhejein ge. Aap haan ya na karein.', '{name} پہلے مسئلہ دیکھیں گے، پھر ایپ میں پوری قیمت بھیجیں گے۔ آپ ہاں یا نہ کریں۔'],
  whatPeopleSaid: ['What people said', 'Logon ne kya kaha', 'لوگوں نے کیا کہا'],
  noReviews: ['No reviews yet.', 'Abhi koi review nahi.', 'ابھی کوئی ریویو نہیں۔'],
  askToCome: ['Ask {name} to come', '{name} ko bulayein', '{name} کو بلائیں'],
  workerNotFound: ['This worker could not be found.', 'Yeh worker nahi mila.', 'یہ کاریگر نہیں ملا۔'],
  customersOnly: ['Hiring is for customer accounts. You are logged in as {role}.', 'Bulane ke liye customer account chahiye. Aap {role} ke tor par log in hain.', 'بلانے کے لیے کسٹمر اکاؤنٹ چاہیے۔ آپ {role} کے طور پر لاگ ان ہیں۔'],

  // ---- log in / sign up ----
  loginFor: ['One small step before {name} comes', '{name} ke aane se pehle ek chhota sa qadam', '{name} کے آنے سے پہلے ایک چھوٹا سا قدم'],
  loginJobs: ['Log in to see your jobs', 'Apne kaam dekhne ke liye log in karein', 'اپنے کام دیکھنے کے لیے لاگ ان کریں'],
  phoneOnly: ['Just your mobile number. No email needed.', 'Sirf aap ka mobile number. Email ki zaroorat nahi.', 'صرف آپ کا موبائل نمبر۔ ای میل کی ضرورت نہیں۔'],
  mobileNumber: ['Mobile number', 'Mobile number', 'موبائل نمبر'],
  privacyNote: ['Workers only see your number after they say yes to your job.', 'Worker aap ka number sirf haan karne ke baad dekh sakte hain.', 'کاریگر آپ کا نمبر صرف ہاں کرنے کے بعد دیکھ سکتے ہیں۔'],
  startLogin: ['Log in', 'Log in karein', 'لاگ ان کریں'],
  startLoginHint: ['I already have an account', 'Mera account pehle se hai', 'میرا اکاؤنٹ پہلے سے ہے'],
  startSignup: ['Sign up', 'Naya account banayein', 'نیا اکاؤنٹ بنائیں'],
  startSignupHint: ['First time on Mohalla', 'Mohalla par pehli dafa', 'محلہ پر پہلی دفعہ'],
  loginTitle: ['Log in with your number', 'Apne number se log in karein', 'اپنے نمبر سے لاگ ان کریں'],
  signupTitle: ['Make your account', 'Apna account banayein', 'اپنا اکاؤنٹ بنائیں'],
  stepOf: ['Step {n} of 3', 'Qadam {n} / 3', 'قدم {n} از 3'],
  hasAccount: ['This number already has an account.', 'Is number ka account pehle se hai.', 'اس نمبر کا اکاؤنٹ پہلے سے ہے۔'],
  hasAccountHint: ['Log in with your PIN instead.', 'Apne PIN se log in karein.', 'اپنے پن سے لاگ ان کریں۔'],
  noAccount: ['No account with this number yet.', 'Is number ka abhi koi account nahi.', 'اس نمبر کا ابھی کوئی اکاؤنٹ نہیں۔'],
  noAccountHint: ['Make a new account with it? It takes 1 minute.', 'Is se naya account banayein? 1 minute lagega.', 'اس سے نیا اکاؤنٹ بنائیں؟ 1 منٹ لگے گا۔'],
  loginInstead: ['Log in instead', 'Log in karein', 'لاگ ان کریں'],
  signupWithThis: ['Sign up with this number', 'Is number se account banayein', 'اس نمبر سے اکاؤنٹ بنائیں'],
  orTryAnother: ['Use a different number', 'Doosra number likhein', 'دوسرا نمبر لکھیں'],
  welcomeBack: ['Welcome back!', 'Khush aamdeed!', 'خوش آمدید!'],
  enterPin: ['Enter your 4-number PIN', 'Apna 4 hindson wala PIN daalein', 'اپنا چار ہندسوں کا پن ڈالیں'],
  forgotPin: ['Forgot PIN?', 'PIN bhool gaye?', 'پن بھول گئے؟'],
  changeNumber: ['Change number', 'Number badlein', 'نمبر بدلیں'],
  channelQ: ['Where should we send your code?', 'Code kahan bhejein?', 'کوڈ کہاں بھیجیں؟'],
  channelNote: ['New here? We send a 4-number code to check this number is yours.', 'Naye hain? Hum 4 hindson ka code bhejte hain taake pata chale yeh number aap ka hai.', 'نئے ہیں؟ ہم چار ہندسوں کا کوڈ بھیجتے ہیں تاکہ پتہ چلے یہ نمبر آپ کا ہے۔'],
  resetNote: ['We send a code, then you make a new PIN.', 'Hum code bhejein ge, phir aap naya PIN banayein.', 'ہم کوڈ بھیجیں گے، پھر آپ نیا پن بنائیں۔'],
  viaWhatsapp: ['WhatsApp', 'WhatsApp', 'واٹس ایپ'],
  viaWhatsappHint: ['Message on WhatsApp', 'WhatsApp par message', 'واٹس ایپ پر میسج'],
  viaSms: ['SMS', 'SMS', 'ایس ایم ایس'],
  viaSmsHint: ['Normal text message', 'Aam text message', 'عام ٹیکسٹ میسج'],
  enterCode: ['Enter the code', 'Code daalein', 'کوڈ ڈالیں'],
  codeSentWa: ['We sent a code on WhatsApp to {phone}', 'Humne {phone} par WhatsApp se code bheja hai', 'ہم نے {phone} پر واٹس ایپ سے کوڈ بھیجا ہے'],
  codeSentSms: ['We sent a code by SMS to {phone}', 'Humne {phone} par SMS se code bheja hai', 'ہم نے {phone} پر ایس ایم ایس سے کوڈ بھیجا ہے'],
  demoCode: ['Demo: no message is really sent. Your code is', 'Demo: asal message nahi bheja gaya. Aap ka code hai', 'ڈیمو: اصل میسج نہیں بھیجا گیا۔ آپ کا کوڈ ہے'],
  sendAgain: ['Send the code again', 'Code dobara bhejein', 'کوڈ دوبارہ بھیجیں'],
  sendAgainIn: ['Send again in {n}', '{n} baad dobara bhejein', '{n} بعد دوبارہ بھیجیں'],
  otherWay: ['Get the code another way', 'Code kisi aur tareeqe se lein', 'کوڈ کسی اور طریقے سے لیں'],
  yourName: ['What is your name?', 'Aap ka naam kya hai?', 'آپ کا نام کیا ہے؟'],
  nameNote: ['Workers will see this name.', 'Worker yeh naam dekhein ge.', 'کاریگر یہ نام دیکھیں گے۔'],
  makePin: ['Make a 4-number PIN', '4 hindson ka PIN banayein', 'چار ہندسوں کا پن بنائیں'],
  makePinNote: ['Like your mobile wallet PIN. You will use it every time you log in.', 'Mobile wallet PIN ki tarah. Har dafa log in mein yahi chahiye hoga.', 'موبائل والیٹ پن کی طرح۔ ہر بار لاگ ان میں یہی چاہیے ہوگا۔'],
  newPin: ['Make a new 4-number PIN', 'Naya 4 hindson ka PIN banayein', 'نیا چار ہندسوں کا پن بنائیں'],
  repeatPin: ['Enter the same PIN again', 'Wohi PIN dobara daalein', 'وہی پن دوبارہ ڈالیں'],
  pinMismatch: ['The two PINs were different. Make it again.', 'Dono PIN alag the. Dobara banayein.', 'دونوں پن مختلف تھے۔ دوبارہ بنائیں۔'],
  deleteKey: ['Delete', 'Mitayein', 'مٹائیں'],

  // errors from the API (by code)
  err_bad_phone: ['Enter a mobile number like 0300 1234567', 'Mobile number aise likhein: 0300 1234567', 'موبائل نمبر ایسے لکھیں: 0300 1234567'],
  err_pin_wrong: ['Wrong PIN. {n} tries left.', 'Ghalat PIN. {n} koshishein baqi.', 'غلط پن۔ {n} کوششیں باقی۔'],
  err_pin_locked: ['Too many wrong PINs. Try again in {n} minutes, or tap "Forgot PIN?".', 'Bohat ghalat PIN. {n} minute baad koshish karein, ya "PIN bhool gaye?" dabayein.', 'بہت غلط پن۔ {n} منٹ بعد کوشش کریں، یا "پن بھول گئے؟" دبائیں۔'],
  err_otp_wrong: ['That code is not right. {n} tries left.', 'Code ghalat hai. {n} koshishein baqi.', 'کوڈ غلط ہے۔ {n} کوششیں باقی۔'],
  err_otp_expired: ['This code expired. Ask for a new one.', 'Code ki muddat khatam. Naya code mangwayein.', 'کوڈ کی مدت ختم۔ نیا کوڈ منگوائیں۔'],
  err_otp_too_many: ['Too many wrong codes. Ask for a new one.', 'Bohat ghalat code. Naya code mangwayein.', 'بہت غلط کوڈ۔ نیا کوڈ منگوائیں۔'],
  err_otp_wait: ['Wait {n} seconds before asking again.', '{n} second intezar karein.', '{n} سیکنڈ انتظار کریں۔'],
  err_otp_send_failed: ["We couldn't send the WhatsApp message. Try again, or choose SMS.", 'WhatsApp message nahi gaya. Dobara koshish karein ya SMS chunein.', 'واٹس ایپ میسج نہیں گیا۔ دوبارہ کوشش کریں یا ایس ایم ایس چنیں۔'],
  err_already_registered: ['This number already has an account. Enter your PIN.', 'Is number ka account pehle se hai. PIN daalein.', 'اس نمبر کا اکاؤنٹ پہلے سے ہے۔ پن ڈالیں۔'],
  err_not_registered: ['No account with this number yet.', 'Is number ka abhi koi account nahi.', 'اس نمبر کا ابھی کوئی اکاؤنٹ نہیں۔'],
  err_no_name: ['Enter your name', 'Apna naam likhein', 'اپنا نام لکھیں'],
  err_banned: ['This account is blocked.', 'Yeh account band hai.', 'یہ اکاؤنٹ بند ہے۔'],
  // ---- post a job: workers near you send prices ----
  postCardTitle: ["Don't want to choose?", 'Khud chunna nahi chahte?', 'خود چننا نہیں چاہتے؟'],
  postCardHint: ['Post your job. Workers near you send their price, and you pick one.', 'Apna kaam daalein. Qareeb ke worker apni qeemat bhejein ge, aap ek chunein.', 'اپنا کام ڈالیں۔ قریب کے کاریگر اپنی قیمت بھیجیں گے، آپ ایک چنیں۔'],
  postTitle: ['Post a job', 'Kaam daalein', 'کام ڈالیں'],
  postSub: ['Workers near you send their price', 'Qareeb ke worker qeemat bhejein ge', 'قریب کے کاریگر قیمت بھیجیں گے'],
  q2any: ['When should the worker come?', 'Worker kab aaye?', 'کاریگر کب آئے؟'],
  addressHiddenAny: ['Hidden until you pick a worker.', 'Worker chunne tak chhupa rahega.', 'کاریگر چننے تک چھپا رہے گا۔'],
  postSend: ['Post the job', 'Kaam daal dein', 'کام ڈال دیں'],
  postNote: ['Free. Workers near you can send prices for 24 hours. You pick one.', 'Muft. Qareeb ke worker 24 ghante tak qeemat bhej sakte hain. Aap ek chunein.', 'مفت۔ قریب کے کاریگر 24 گھنٹے تک قیمت بھیج سکتے ہیں۔ آپ ایک چنیں۔'],
  offersTitle: ['Prices from workers', 'Workers ki qeematein', 'کاریگروں کی قیمتیں'],
  offersNone: ['No prices yet. Workers near you can see your job.', 'Abhi koi qeemat nahi. Qareeb ke worker aap ka kaam dekh sakte hain.', 'ابھی کوئی قیمت نہیں۔ قریب کے کاریگر آپ کا کام دیکھ سکتے ہیں۔'],
  offersNoneHint: ['Prices show here as they come in.', 'Qeematein aate hi yahan nazar aayengi.', 'قیمتیں آتے ہی یہاں نظر آئیں گی۔'],
  closesAt: ['Open for prices until {time}', '{time} tak qeematein khuli hain', '{time} تک قیمتیں کھلی ہیں'],
  fullPrice: ['full price', 'poori qeemat', 'پوری قیمت'],
  pickWorker: ['Pick {name}', '{name} ko chunein', '{name} کو چنیں'],
  pickQ: ['Pick {name} for {amount}?', '{amount} mein {name} ko chunein?', '{amount} میں {name} کو چنیں؟'],
  pickNote: ['This becomes the agreed price. {name} can then see your address and call you. Anything extra still needs your OK.', 'Yeh tay shuda qeemat ban jayegi. Phir {name} aap ka pata dekh kar call kar sakein ge. Kuch izafi ho to aap ki haan chahiye.', 'یہ طے شدہ قیمت بن جائے گی۔ پھر {name} آپ کا پتہ دیکھ کر کال کر سکیں گے۔ کچھ اضافی ہو تو آپ کی ہاں چاہیے۔'],
  yesPick: ['Yes, pick {name}', 'Haan, {name} ko chunein', 'ہاں، {name} کو چنیں'],
  jobsDoneN: ['{n} jobs done', '{n} kaam mukammal', '{n} کام مکمل'],
  cancelPost: ['Take the job down', 'Kaam hata dein', 'کام ہٹا دیں'],
  postExpired: ['No worker was picked in 24 hours.', '24 ghante mein koi worker nahi chuna gaya.', '24 گھنٹے میں کوئی کاریگر نہیں چنا گیا۔'],
  postAgain: ['Post it again', 'Dobara daalein', 'دوبارہ ڈالیں'],
  price1: ['1 price', '1 qeemat', '1 قیمت'],
  youPicked: ['You picked {name}!', 'Aap ne {name} ko chuna!', 'آپ نے {name} کو چنا!'],
  tlPicked: ['You picked {name}', 'Aap ne {name} ko chuna', 'آپ نے {name} کو چنا'],
  pricesN: ['{n} prices', '{n} qeematein', '{n} قیمتیں'],

  // ---- me / settings ----
  meTitle: ['Me', 'Main', 'میں'],
  setDetails: ['My details', 'Meri maloomat', 'میری معلومات'],
  setDetailsHint: ['Name, home area, saved address', 'Naam, ghar ka ilaqa, mehfooz pata', 'نام، گھر کا علاقہ، محفوظ پتہ'],
  setPin: ['Change PIN', 'PIN badlein', 'پن بدلیں'],
  setPhone: ['Change mobile number', 'Mobile number badlein', 'موبائل نمبر بدلیں'],
  setClose: ['Close my account', 'Mera account band karein', 'میرا اکاؤنٹ بند کریں'],
  accountSection: ['Account', 'Account', 'اکاؤنٹ'],
  language: ['Language', 'Zabaan', 'زبان'],
  yourNameLabel: ['Your name', 'Aap ka naam', 'آپ کا نام'],
  homeArea: ['Home area', 'Ghar ka ilaqa', 'گھر کا علاقہ'],
  savedAddress: ['Saved address', 'Mehfooz pata', 'محفوظ پتہ'],
  savedAddressHint: ['Fills in the request form for you. Only the worker who comes sees it.', 'Request form khud bhar deta hai. Sirf aane wala worker dekhta hai.', 'درخواست فارم خود بھر دیتا ہے۔ صرف آنے والا کاریگر دیکھتا ہے۔'],
  saveChanges: ['Save changes', 'Tabdeeli save karein', 'تبدیلی محفوظ کریں'],
  savedOk: ['Saved', 'Save ho gaya', 'محفوظ ہو گیا'],
  currentPin: ['Enter your current PIN', 'Apna maujooda PIN daalein', 'اپنا موجودہ پن ڈالیں'],
  pinChanged: ['Your PIN is changed.', 'Aap ka PIN badal gaya.', 'آپ کا پن بدل گیا۔'],
  newNumberQ: ['Your new mobile number', 'Aap ka naya mobile number', 'آپ کا نیا موبائل نمبر'],
  newNumberNote: ['We send a code to the new number to check it is yours. Your PIN stays the same.', 'Hum naye number par code bhejein ge. Aap ka PIN wohi rahega.', 'ہم نئے نمبر پر کوڈ بھیجیں گے۔ آپ کا پن وہی رہے گا۔'],
  numberChanged: ['Your number is now {phone}.', 'Aap ka number ab {phone} hai.', 'آپ کا نمبر اب {phone} ہے۔'],
  closeTitle: ['Close your account?', 'Account band karein?', 'اکاؤنٹ بند کریں؟'],
  closeWhat1: ['You can no longer log in.', 'Aap log in nahi kar sakein ge.', 'آپ لاگ ان نہیں کر سکیں گے۔'],
  closeWhat2: ['Requests and posted jobs still waiting are cancelled.', 'Intezar wali darkhwastein aur daale gaye kaam mansookh ho jayenge.', 'انتظار والی درخواستیں اور ڈالے گئے کام منسوخ ہو جائیں گے۔'],
  closeWhat3: ['Your old jobs and ratings stay on the record, because problems are judged by it.', 'Purane kaam aur ratings record par rahengi, kyun ke masle isi se tay hote hain.', 'پرانے کام اور ریٹنگز ریکارڈ پر رہیں گی، کیونکہ مسئلے اسی سے طے ہوتے ہیں۔'],
  closeWhat4: ['To open it again, call Mohalla.', 'Dobara kholne ke liye Mohalla ko call karein.', 'دوبارہ کھولنے کے لیے محلہ کو کال کریں۔'],
  closeConfirmPin: ['Enter your PIN to close your account', 'Account band karne ke liye PIN daalein', 'اکاؤنٹ بند کرنے کے لیے پن ڈالیں'],
  keepAccount: ['Keep my account', 'Account rehne dein', 'اکاؤنٹ رہنے دیں'],
  yesClose: ['Yes, close it', 'Haan, band karein', 'ہاں، بند کریں'],
  err_active_jobs: ['Finish or cancel your jobs first.', 'Pehle apne kaam mukammal ya mansookh karein.', 'پہلے اپنے کام مکمل یا منسوخ کریں۔'],
  err_open_dispute: ['Wait until Mohalla decides your open problem report.', 'Mohalla ke faisle ka intezar karein.', 'محلہ کے فیصلے کا انتظار کریں۔'],
  err_account_closed: ['This account was closed. Call Mohalla to open it again.', 'Yeh account band hai. Dobara kholne ke liye Mohalla ko call karein.', 'یہ اکاؤنٹ بند ہے۔ دوبارہ کھولنے کے لیے محلہ کو کال کریں۔'],
  err_number_taken: ['This number already has an account.', 'Is number ka account pehle se hai.', 'اس نمبر کا اکاؤنٹ پہلے سے ہے۔'],
  err_post_closed: ['This job stopped taking prices.', 'Yeh kaam ab qeematein nahi le raha.', 'یہ کام اب قیمتیں نہیں لے رہا۔'],
  err_bad_pin: ['Choose 4 numbers for your PIN', 'PIN ke liye 4 hindse chunein', 'پن کے لیے چار ہندسے چنیں'],
  err_wrong_app: ['This number is a worker account. Workers use the Mohalla Worker app.', 'Yeh number worker account hai. Worker Mohalla Worker app use karte hain.', 'یہ نمبر کاریگر اکاؤنٹ ہے۔ کاریگر محلہ ورکر ایپ استعمال کرتے ہیں۔'],
  err_bad_photo: ["That photo didn't work. Try another.", 'Yeh tasveer nahi chali. Doosri try karein.', 'یہ تصویر نہیں چلی۔ دوسری کوشش کریں۔'],
  err_photo_too_big: ['That photo is too big. Try another.', 'Tasveer bohat bari hai. Doosri try karein.', 'تصویر بہت بڑی ہے۔ دوسری کوشش کریں۔'],
  wrongAppTitle: ['This number is a worker account', 'Yeh number worker account hai', 'یہ نمبر کاریگر اکاؤنٹ ہے'],
  wrongAppHint: ['Workers use the Mohalla Worker app. To hire someone, use a different number.', 'Worker Mohalla Worker app use karte hain. Kisi ko bulane ke liye doosra number likhein.', 'کاریگر محلہ ورکر ایپ استعمال کرتے ہیں۔ کسی کو بلانے کے لیے دوسرا نمبر لکھیں۔'],

  // photos
  addPhoto: ['Add a photo', 'Tasveer lagayein', 'تصویر لگائیں'],
  removePhoto: ['Remove photo', 'Tasveer hatayein', 'تصویر ہٹائیں'],
  uploading: ['Uploading photo…', 'Tasveer upload ho rahi hai…', 'تصویر اپ لوڈ ہو رہی ہے…'],
  photoProblem: ['A photo of the problem helps', 'Masle ki tasveer se madad milti hai', 'مسئلے کی تصویر سے مدد ملتی ہے'],
  addProof: ['Add a photo, if you have one', 'Tasveer ho to lagayein', 'تصویر ہو تو لگائیں'],

  // a reported problem, both sides
  disputeTheirs: ['{name} reported a problem. Tell your side before {time}.', '{name} ne masla bataya. {time} se pehle apni baat batayein.', '{name} نے مسئلہ بتایا۔ {time} سے پہلے اپنی بات بتائیں۔'],
  yourSide: ['You said', 'Aap ne kaha', 'آپ نے کہا'],
  theirSide: ['{name} said', '{name} ne kaha', '{name} نے کہا'],
  tellYourSide: ['Tell your side', 'Apni baat batayein', 'اپنی بات بتائیں'],
  addMore: ['Add more', 'Aur batayein', 'اور بتائیں'],
  sendSide: ['Send', 'Bhejein', 'بھیجیں'],
  rulingAgainst: ['The record went against you. This counts as a strike.', 'Record aap ke khilaf gaya. Yeh ek strike hai.', 'ریکارڈ آپ کے خلاف گیا۔ یہ ایک اسٹرائک ہے۔'],
  rulingFor: ['The record supports you.', 'Record aap ke haq mein hai.', 'ریکارڈ آپ کے حق میں ہے۔'],
  rulingNone: ['No one got a strike.', 'Kisi ko strike nahi mili.', 'کسی کو اسٹرائک نہیں ملی۔'],
  'dt_no-show': ['{name} says you were not there', '{name} kehte hain aap mojood nahi the', '{name} کہتے ہیں آپ موجود نہیں تھے'],
  'dt_non-payment': ['{name} says they were not paid in full', '{name} kehte hain poori payment nahi hui', '{name} کہتے ہیں پوری ادائیگی نہیں ہوئی'],
  dt_scope: ['{name} reported a price or work problem', '{name} ne qeemat ya kaam ka masla bataya', '{name} نے قیمت یا کام کا مسئلہ بتایا'],
  dt_misconduct: ['{name} reported bad behaviour', '{name} ne bad tameezi ki shikayat ki', '{name} نے بدتمیزی کی شکایت کی'],

  // ---- request form ----
  quickQs: ['3 quick questions', '3 aasaan sawal', 'تین آسان سوال'],
  q1: ['What is the problem?', 'Kya masla hai?', 'کیا مسئلہ ہے؟'],
  whichService: ['Which work?', 'Kaun sa kaam?', 'کون سا کام؟'],
  sayMore: ['Want to say more?', 'Aur kuch batana hai?', 'اور کچھ بتانا ہے؟'],
  q2: ['When should {name} come?', '{name} kab aayein?', '{name} کب آئیں؟'],
  today: ['Today', 'Aaj', 'آج'],
  tomorrow: ['Tomorrow', 'Kal', 'کل'],
  dayAfter: ['Day after', 'Parson', 'پرسوں'],
  morning: ['Morning', 'Subah', 'صبح'],
  afternoon: ['Afternoon', 'Dopehar', 'دوپہر'],
  evening: ['Evening', 'Shaam', 'شام'],
  slotPassed: ['time passed', 'waqt guzar gaya', 'وقت گزر گیا'],
  q3: ['Where is the house?', 'Ghar kahan hai?', 'گھر کہاں ہے؟'],
  addressHidden: ['Hidden until {name} says yes.', '{name} ke haan karne tak chhupa rahega.', '{name} کے ہاں کرنے تک چھپا رہے گا۔'],
  sendTo: ['Send to {name}', '{name} ko bhejein', '{name} کو بھیجیں'],
  sendNote: ['Free to send. {name} has 4 hours to say yes or no.', 'Bhejna muft hai. {name} ke paas haan ya na ke liye 4 ghante hain.', 'بھیجنا مفت ہے۔ {name} کے پاس ہاں یا نہ کے لیے 4 گھنٹے ہیں۔'],
  answerAll: ['Answer the 3 questions to send.', 'Bhejne ke liye teeno sawalon ka jawab dein.', 'بھیجنے کے لیے تینوں سوالوں کا جواب دیں۔'],
  probOther: ['Something else', 'Kuch aur', 'کچھ اور'],

  // ---- my jobs ----
  noJobs: ['No jobs yet', 'Abhi koi kaam nahi', 'ابھی کوئی کام نہیں'],
  noJobsHint: ['Find a worker and ask them to come.', 'Worker dhoondein aur bulayein.', 'کاریگر ڈھونڈیں اور بلائیں۔'],
  findWorker: ['Find a worker', 'Worker dhoondein', 'کاریگر ڈھونڈیں'],
  needsYou: ['Needs your OK', 'Aap ki haan chahiye', 'آپ کی ہاں چاہیے'],
  jobsNow: ['Now', 'Abhi', 'ابھی'],
  jobsBefore: ['Before', 'Pehle', 'پہلے'],
  loggedInAs: ['Logged in as {name}', '{name} ke naam se log in', '{name} کے نام سے لاگ ان'],
  logout: ['Log out', 'Log out', 'لاگ آؤٹ'],

  // ---- job statuses, as the customer sees them ----
  s_requested: ['Waiting for {name}', '{name} ka intezar', '{name} کا انتظار'],
  s_priceWait: ['Waiting for price', 'Qeemat ka intezar', 'قیمت کا انتظار'],
  s_agree: ['Agree price', 'Qeemat tay karein', 'قیمت طے کریں'],
  s_working: ['Work going on', 'Kaam jari hai', 'کام جاری ہے'],
  s_completed: ['Finished', 'Mukammal', 'مکمل'],
  s_declined: ['{name} said no', '{name} ne mana kiya', '{name} نے منع کیا'],
  s_expired: ['No answer', 'Jawab nahi aaya', 'جواب نہیں آیا'],
  s_cancelled: ['Cancelled', 'Mansookh', 'منسوخ'],
  s_open: ['Waiting for prices', 'Qeematon ka intezar', 'قیمتوں کا انتظار'],

  // ---- job page ----
  stepSent: ['Sent', 'Bheja', 'بھیجا'],
  stepYes: ['Said yes', 'Haan ki', 'ہاں کی'],
  stepPrice: ['Price agreed', 'Qeemat tay', 'قیمت طے'],
  stepDone: ['Done', 'Mukammal', 'مکمل'],
  saidYes: ['{name} said yes!', '{name} ne haan kar di!', '{name} نے ہاں کر دی!'],
  canSeeAddress: ['{name} can now see your address.', '{name} ab aap ka pata dekh sakte hain.', '{name} اب آپ کا پتہ دیکھ سکتے ہیں۔'],
  call: ['Call', 'Call karein', 'کال کریں'],
  whatsapp: ['WhatsApp', 'WhatsApp', 'واٹس ایپ'],
  banner: ['Every price shows up here. Nothing is added without your OK.', 'Har qeemat yahan nazar aati hai. Aap ki haan ke baghair kuch nahi judta.', 'ہر قیمت یہاں نظر آتی ہے۔ آپ کی ہاں کے بغیر کچھ نہیں جڑتا۔'],
  priceAgreement: ['Price agreement', 'Qeemat ka muahida', 'قیمت کا معاہدہ'],
  agreedSoFar: ['Agreed so far', 'Ab tak tay', 'اب تک طے'],
  waitingOk: ['Waiting for your OK', 'Aap ki haan ka intezar', 'آپ کی ہاں کا انتظار'],
  tlSent: ['You sent the request', 'Aap ne request bheji', 'آپ نے درخواست بھیجی'],
  tlYes: ['{name} said yes', '{name} ne haan ki', '{name} نے ہاں کی'],
  e_visit: ['Visit charge', 'Aane ka kharcha', 'آنے کا خرچہ'],
  e_visit_sub: ['For coming and checking the problem', 'Aa kar masla dekhne ke liye', 'آ کر مسئلہ دیکھنے کے لیے'],
  e_quote: ['Full work price', 'Poore kaam ki qeemat', 'پورے کام کی قیمت'],
  e_amendment: ['Extra change', 'Izafi tabdeeli', 'اضافی تبدیلی'],
  e_part: ['Extra part', 'Izafi purza', 'اضافی پرزہ'],
  seeBill: ['Tap the photo to see the shop bill.', 'Dukaan ka bill dekhne ke liye photo dabayein.', 'دکان کا بل دیکھنے کے لیے تصویر دبائیں۔'],
  billTitle: ['Shop bill', 'Dukaan ka bill', 'دکان کا بل'],
  okAgree: ['OK, agree', 'Theek hai, manzoor', 'ٹھیک ہے، منظور'],
  sayNo: ['No', 'Nahi', 'نہیں'],
  youAgreed: ['You agreed', 'Aap ne manzoor kiya', 'آپ نے منظور کیا'],
  youAgreedStart: ['You agreed · work can start', 'Aap ne manzoor kiya · kaam shuru ho sakta hai', 'آپ نے منظور کیا · کام شروع ہو سکتا ہے'],
  youSaidNo: ['You said no. {name} can send a new price.', 'Aap ne mana kiya. {name} nayi qeemat bhej sakte hain.', 'آپ نے منع کیا۔ {name} نئی قیمت بھیج سکتے ہیں۔'],
  confirmAgreeQ: ['Agree to {amount}?', '{amount} manzoor hai?', '{amount} منظور ہے؟'],
  confirmAgreeNote: ['This is added to the price. It stays on the record and cannot be changed later.', 'Yeh qeemat mein jud jayega aur record par rahega. Baad mein badla nahi ja sakta.', 'یہ قیمت میں جڑ جائے گا اور ریکارڈ پر رہے گا۔ بعد میں بدلا نہیں جا سکتا۔'],
  yesAgree: ['Yes, I agree', 'Haan, manzoor hai', 'ہاں، منظور ہے'],
  goBack: ['Go back', 'Wapas', 'واپس'],
  workFinished: ['Is the work finished?', 'Kya kaam mukammal ho gaya?', 'کیا کام مکمل ہو گیا؟'],
  next_requested: ['{name} will say yes or no by {time}. It will show here.', '{name} {time} tak haan ya na karein ge. Yahan nazar aayega.', '{name} {time} تک ہاں یا نہ کریں گے۔ یہاں نظر آئے گا۔'],
  next_visit: ['{name} will call you, then send the visit charge here.', '{name} aap ko call karein ge, phir yahan aane ka kharcha bhejein ge.', '{name} آپ کو کال کریں گے، پھر یہاں آنے کا خرچہ بھیجیں گے۔'],
  next_quote: ['After checking the problem, {name} will send the full price here.', 'Masla dekh kar {name} yahan poori qeemat bhejein ge.', 'مسئلہ دیکھ کر {name} یہاں پوری قیمت بھیجیں گے۔'],
  next_answer: ['Answer the new price above.', 'Upar nayi qeemat ka jawab dein.', 'اوپر نئی قیمت کا جواب دیں۔'],
  next_rate: ['Tell us how it went', 'Batayein kaisa raha', 'بتائیں کیسا رہا'],
  next_done: ['Job finished. Shukriya!', 'Kaam mukammal. Shukriya!', 'کام مکمل۔ شکریہ!'],
  next_declined: ['{name} cannot come this time. Ask someone else.', '{name} is dafa nahi aa sakte. Kisi aur ko bulayein.', '{name} اس دفعہ نہیں آ سکتے۔ کسی اور کو بلائیں۔'],
  next_expired: ['{name} did not answer in 4 hours. Ask someone else.', '{name} ne 4 ghante mein jawab nahi diya. Kisi aur ko bulayein.', '{name} نے 4 گھنٹے میں جواب نہیں دیا۔ کسی اور کو بلائیں۔'],
  next_cancelled: ['This job was cancelled.', 'Yeh kaam mansookh ho gaya.', 'یہ کام منسوخ ہو گیا۔'],
  askSomeoneElse: ['Ask someone else', 'Kisi aur ko bulayein', 'کسی اور کو بلائیں'],
  somethingWrong: ['Something wrong?', 'Koi masla hai?', 'کوئی مسئلہ ہے؟'],
  cancelJob: ['Cancel job', 'Kaam mansookh karein', 'کام منسوخ کریں'],
  cancelQ: ['Cancel this job?', 'Yeh kaam mansookh karein?', 'یہ کام منسوخ کریں؟'],
  cancelNote: ['{name} will see that you cancelled. This cannot be undone.', '{name} dekhein ge ke aap ne mansookh kiya. Yeh wapas nahi hoga.', '{name} دیکھیں گے کہ آپ نے منسوخ کیا۔ یہ واپس نہیں ہوگا۔'],
  yesCancel: ['Yes, cancel', 'Haan, mansookh karein', 'ہاں، منسوخ کریں'],
  keepJob: ['No, keep it', 'Nahi, rehne dein', 'نہیں، رہنے دیں'],
  priceWaiting: ['A new price is waiting for your OK', 'Nayi qeemat aap ki haan ka intezar kar rahi hai', 'نئی قیمت آپ کی ہاں کا انتظار کر رہی ہے'],
  seeIt: ['See it', 'Dekhein', 'دیکھیں'],
  reportOpen: ['You reported a problem. Mohalla is checking the record.', 'Aap ne masla bataya. Mohalla record check kar raha hai.', 'آپ نے مسئلہ بتایا۔ محلہ ریکارڈ چیک کر رہا ہے۔'],
  reportClosed: ['Mohalla has decided.', 'Mohalla ne faisla kar diya.', 'محلہ نے فیصلہ کر دیا۔'],
  payMismatch: ['You said {a}, {name} said {b}. If that is wrong, tap "Something wrong?".', 'Aap ne {a} kaha, {name} ne {b}. Ghalat ho to "Koi masla hai?" dabayein.', 'آپ نے {a} کہا، {name} نے {b}۔ غلط ہو تو "کوئی مسئلہ ہے؟" دبائیں۔'],
  youPaid: ['You paid {amount}', 'Aap ne {amount} diye', 'آپ نے {amount} دیے'],

  // ---- finish, pay, rate ----
  finishTitle: ['Work finished', 'Kaam mukammal', 'کام مکمل'],
  finishSub: ['3 taps and you are done', '3 tap aur bas', 'تین ٹیپ اور بس'],
  onTimeQ: ['Did {name} come on time?', 'Kya {name} waqt par aaye?', 'کیا {name} وقت پر آئے؟'],
  onTimeYes: ['Yes, on time', 'Haan, waqt par', 'ہاں، وقت پر'],
  onTimeNo: ['No, late', 'Nahi, der se', 'نہیں، دیر سے'],
  cashQ: ['How much cash did you give?', 'Aap ne kitna cash diya?', 'آپ نے کتنا نقد دیا؟'],
  agreedPrice: ['Agreed price', 'Tay shuda qeemat', 'طے شدہ قیمت'],
  yesAmount: ['Yes, {amount}', 'Haan, {amount}', 'ہاں، {amount}'],
  diffAmount: ['Different amount', 'Alag raqam', 'الگ رقم'],
  typeAmount: ['Type what you gave (Rs)', 'Jitna diya woh likhein (Rs)', 'جتنا دیا وہ لکھیں (روپے)'],
  rateQ: ['How was the work?', 'Kaam kaisa tha?', 'کام کیسا تھا؟'],
  star1: ['Very bad', 'Bohat bura', 'بہت برا'],
  star2: ['Not good', 'Acha nahi', 'اچھا نہیں'],
  star3: ['OK', 'Theek', 'ٹھیک'],
  star4: ['Good', 'Acha', 'اچھا'],
  star5: ['Very good!', 'Bohat acha!', 'بہت اچھا!'],
  anythingToSay: ['Anything to say?', 'Kuch kehna hai?', 'کچھ کہنا ہے؟'],
  ratingHidden: ['{name} sees your stars only after rating you too.', '{name} aap ke stars tab dekhein ge jab woh bhi aap ko rating dein.', '{name} آپ کے ستارے تب دیکھیں گے جب وہ بھی آپ کو ریٹنگ دیں۔'],
  done: ['Done', 'Ho gaya', 'ہو گیا'],
  thanks: ['Shukriya!', 'Shukriya!', 'شکریہ!'],
  thanksNote: ['The job is saved. You can ask {name} again any time from My jobs.', 'Kaam save ho gaya. Aap {name} ko kabhi bhi Meray kaam se dobara bula sakte hain.', 'کام محفوظ ہو گیا۔ آپ {name} کو کبھی بھی "میرے کام" سے دوبارہ بلا سکتے ہیں۔'],
  backHome: ['Back to home', 'Home par wapas', 'ہوم پر واپس'],
  seeJob: ['See the job', 'Kaam dekhein', 'کام دیکھیں'],
  askAgain: ['Ask {name} again', '{name} ko dobara bulayein', '{name} کو دوبارہ بلائیں'],

  // ---- report a problem (dispute) ----
  problemTitle: ['What went wrong?', 'Kya ghalat hua?', 'کیا غلط ہوا؟'],
  problemSub: ['Mohalla decides by checking the price record.', 'Mohalla price record dekh kar faisla karta hai.', 'محلہ قیمت کا ریکارڈ دیکھ کر فیصلہ کرتا ہے۔'],
  'd_no-show': ['{name} did not come', '{name} nahi aaye', '{name} نہیں آئے'],
  d_scope: ['Price or work problem', 'Qeemat ya kaam ka masla', 'قیمت یا کام کا مسئلہ'],
  'd_non-payment': ['Payment problem', 'Paison ka masla', 'پیسوں کا مسئلہ'],
  d_misconduct: ['Bad behaviour or unsafe', 'Bad tameezi ya khatra', 'بدتمیزی یا خطرہ'],
  tellWhat: ['Tell us what happened', 'Batayein kya hua', 'بتائیں کیا ہوا'],
  misconductNote: ["For your safety, {name}'s account is paused straight away while Mohalla checks. If you are in danger, call 15.", 'Aap ki hifazat ke liye {name} ka account foran rok diya jata hai. Khatra ho to 15 par call karein.', 'آپ کی حفاظت کے لیے {name} کا اکاؤنٹ فوراً روک دیا جاتا ہے۔ خطرہ ہو تو 15 پر کال کریں۔'],
  sendReport: ['Send to Mohalla', 'Mohalla ko bhejein', 'محلہ کو بھیجیں'],
  within48: ['You can report up to 48 hours after the job.', 'Kaam ke 48 ghante tak bata sakte hain.', 'کام کے 48 گھنٹے تک بتا سکتے ہیں۔'],

  // ---- help ----
  helpCall: ['Call Mohalla', 'Mohalla ko call karein', 'محلہ کو کال کریں'],
  helpNoPhone: ['Our help line number will be added here.', 'Hamara help line number yahan aayega.', 'ہمارا ہیلپ لائن نمبر یہاں آئے گا۔'],
};

// The 8 services. Keys must match CATEGORIES in api/src/lib/rules.js.
const CATEGORY = {
  plumber: ['Plumber', 'Plumber', 'پلمبر'],
  electrician: ['Electrician', 'Bijli wala', 'الیکٹریشن'],
  cleaner: ['Cleaner', 'Safai', 'صفائی'],
  carpenter: ['Carpenter', 'Barhai', 'بڑھئی'],
  'ac-technician': ['AC repair', 'AC wala', 'اے سی مرمت'],
  painter: ['Painter', 'Rang saaz', 'رنگ ساز'],
  mechanic: ['Mechanic', 'Mistri', 'مکینک'],
  fumigator: ['Pest control', 'Keeray maar spray', 'کیڑے مار اسپرے'],
};

// Quick problem chips on the request form, per service.
export const PROBLEMS = {
  plumber: [['Tap leaking', 'Nalka tapak raha hai', 'نلکا ٹپک رہا ہے'], ['Pipe leaking', 'Pipe leak', 'پائپ لیک'], ['Drain blocked', 'Nali band hai', 'نالی بند ہے'], ['Tank or motor', 'Tanki ya motor', 'ٹینکی یا موٹر']],
  electrician: [['Fan not working', 'Pankha nahi chal raha', 'پنکھا نہیں چل رہا'], ['Light or switch', 'Light ya switch', 'لائٹ یا سوئچ'], ['Wiring', 'Wiring', 'وائرنگ'], ['Power keeps going', 'Bijli baar baar jaati hai', 'بجلی بار بار جاتی ہے']],
  cleaner: [['Full house', 'Poora ghar', 'پورا گھر'], ['Kitchen', 'Kitchen', 'کچن'], ['Bathroom', 'Bathroom', 'باتھ روم'], ['Sofa or carpet', 'Sofa ya qaleen', 'صوفہ یا قالین']],
  carpenter: [['Door or lock', 'Darwaza ya taala', 'دروازہ یا تالا'], ['Cupboard', 'Almari', 'الماری'], ['Bed or chair repair', 'Bed ya kursi ki marammat', 'بیڈ یا کرسی کی مرمت'], ['New furniture', 'Naya furniture', 'نیا فرنیچر']],
  'ac-technician': [['AC not cooling', 'AC thanda nahi kar raha', 'اے سی ٹھنڈا نہیں کر رہا'], ['AC service', 'AC service', 'اے سی سروس'], ['Gas refill', 'Gas bharwani hai', 'گیس بھروانی ہے'], ['Water dripping', 'Paani tapak raha hai', 'پانی ٹپک رہا ہے']],
  painter: [['One room', 'Ek kamra', 'ایک کمرہ'], ['Full house', 'Poora ghar', 'پورا گھر'], ['Damp walls', 'Seelan', 'سیلن'], ['Doors and grills', 'Darwaze aur grill', 'دروازے اور گرل']],
  mechanic: [["Car won't start", 'Gaari start nahi ho rahi', 'گاڑی اسٹارٹ نہیں ہو رہی'], ['Bike repair', 'Bike ki marammat', 'بائیک کی مرمت'], ['Oil change', 'Oil change', 'آئل چینج'], ['Battery', 'Battery', 'بیٹری']],
  fumigator: [['Cockroaches', 'Lal baig', 'لال بیگ'], ['Termites', 'Deemak', 'دیمک'], ['Mosquitoes', 'Machar', 'مچھر'], ['Bed bugs', 'Khatmal', 'کھٹمل']],
};

// Karachi areas. Keys must match AREAS in api/src/lib/rules.js.
const AREA = {
  dha: ['DHA', 'DHA', 'ڈی ایچ اے'],
  clifton: ['Clifton', 'Clifton', 'کلفٹن'],
  saddar: ['Saddar', 'Saddar', 'صدر'],
  pechs: ['PECHS', 'PECHS', 'پی ای سی ایچ ایس'],
  bahadurabad: ['Bahadurabad', 'Bahadurabad', 'بہادر آباد'],
  'gulshan-e-iqbal': ['Gulshan-e-Iqbal', 'Gulshan-e-Iqbal', 'گلشنِ اقبال'],
  'gulistan-e-jauhar': ['Gulistan-e-Jauhar', 'Gulistan-e-Jauhar', 'گلستانِ جوہر'],
  'north-nazimabad': ['North Nazimabad', 'North Nazimabad', 'نارتھ ناظم آباد'],
  nazimabad: ['Nazimabad', 'Nazimabad', 'ناظم آباد'],
  korangi: ['Korangi', 'Korangi', 'کورنگی'],
  malir: ['Malir', 'Malir', 'ملیر'],
};
export const AREA_KEYS = Object.keys(AREA);

// Used by the admin screens (English / Roman Urdu only).
const STATUS = {
  open: ['Waiting for quotes', 'Quotes ka intezar'], requested: ['Waiting for worker', 'Worker ka intezar'],
  accepted: ['Accepted', 'Qubool'], agreed: ['Price agreed', 'Qeemat tay'], completed: ['Completed', 'Mukammal'],
  declined: ['Declined', 'Inkaar'], expired: ['Expired', 'Waqt khatam'], cancelled: ['Cancelled', 'Mansookh'],
  proposed: ['Proposed', 'Tajweez'], rejected: ['Rejected', 'Na-manzoor'], upheld: ['Upheld', 'Faisla ho gaya'],
  unresolved: ['Unresolved', 'Ghair wazeh'], settled: ['Settled', 'Tay pa gaya'],
};
const ENTRY = { visit: ['Visit charge', 'Visit charges'], quote: ['Full quote', 'Poora quote'], amendment: ['Change', 'Tabdeeli'], part: ['Parts', 'Parts'] };
const DISPUTE = { 'no-show': ['Didn’t show up', 'Nahi aaye'], 'non-payment': ['Not paid', 'Payment nahi hui'], scope: ['Work or price disagreement', 'Kaam ya qeemat par ikhtilaf'], misconduct: ['Misconduct or safety', 'Badtameezi ya hifazat'] };

const fill = (text, vars) => (vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : text);

function readLang() {
  try { return localStorage.getItem('lang') === 'roman-ur' ? 'roman-ur' : 'en'; } catch { return 'en'; }
}

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(readLang);
  const i = lang === 'en' ? 0 : 1;
  const main = (row, vars) => (row ? fill(row[i], vars) : '');
  const urdu = (row, vars) => (row?.[2] ? fill(row[2], vars) : '');

  const value = {
    lang,
    toggle: () => {
      const next = lang === 'en' ? 'roman-ur' : 'en';
      try { localStorage.setItem('lang', next); } catch { /* private mode: just don't remember */ }
      setLang(next);
    },
    t: (key, vars) => (S[key] ? main(S[key], vars) : key), // main line (English or Roman Urdu)
    u: (key, vars) => urdu(S[key], vars),                  // Urdu script line
    has: (key) => Boolean(S[key]),
    all: (key, vars) => (S[key] || []).map((x) => fill(x, vars)), // [English, Roman Urdu, Urdu] at once
    cat: (key) => main(CATEGORY[key]) || key,
    catU: (key) => urdu(CATEGORY[key]),
    areaName: (key) => main(AREA[key]) || key,
    areaU: (key) => urdu(AREA[key]),
    pick: (row) => main(row),  // for rows like PROBLEMS[x][n]
    pickU: (row) => urdu(row),
    // admin screens
    status: (key) => STATUS[key]?.[i] ?? key,
    entry: (key) => ENTRY[key]?.[i] ?? key,
    dispute: (key) => DISPUTE[key]?.[i] ?? key,
    disputeTypes: Object.keys(DISPUTE),
  };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
