// Sign up, in 4 steps:
//   1  mobile number -> code (WhatsApp or SMS)
//   2  what work do you do?
//   3  which areas, and your usual starting price
//   4  your name, man/woman, photo (optional) -> a 4-number PIN
// "Someone is helping me" adds a first screen for the helper (a shop, friend or family);
// the code still goes to the worker's own phone, and the helper is saved on the account.
import { useState } from 'react';
import { View, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, TopBar, L, P, Say, Btn, Chip, Choice, Field, Input, PhoneInput, ErrorBox, Card, Note, row } from '../ui/kit';
import { PhoneStep, ChannelStep, CodeStep, PinStep, MismatchPanel, StepTag } from '../ui/authSteps';
import { Ico, Tap } from '../ui/motion';
import { CATEGORIES } from '../ui/icons';
import { Storefront, Handshake, Heart, GenderMale, GenderFemale, Camera, Images, UsersThree, Coins } from '../ui/icons';
import { api } from '../lib/api';
import { pickPhoto, uploadPhoto } from '../lib/photos';
import { useAuth } from '../lib/auth';
import { useLang, AREA_KEYS } from '../lib/i18n';
import { C, R } from '../ui/theme';

const STEP_NUMBER = { helper: 0, phone: 1, hasAccount: 1, wrongApp: 1, channel: 1, code: 1, work: 2, areas: 3, about: 4, pin: 4, confirm: 4 };

export default function Signup() {
  const params = useLocalSearchParams();
  const helped = params.helped === '1';
  const l = useLang();
  const { t, u, cat, catU, areaName, areaU, lang } = l;
  const { signIn } = useAuth();

  const [history, setHistory] = useState([helped ? 'helper' : 'phone']);
  const step = history[history.length - 1];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [helper, setHelper] = useState({ name: '', phone: '', relation: null });
  const [phone, setPhone] = useState(params.phone || '');
  const [channel, setChannel] = useState(null);
  const [sent, setSent] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [skills, setSkills] = useState([]);
  const [areas, setAreas] = useState([]);
  const [price, setPrice] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [pin, setPin] = useState(null);

  const go = (s) => { setError(null); setHistory((h) => [...h, s]); };
  const replace = (s) => { setError(null); setHistory((h) => [...h.slice(0, -1), s]); };
  const back = () => {
    setError(null);
    if (history.length > 1) setHistory((h) => h.slice(0, -1));
    else if (router.canGoBack()) router.back();
    else router.replace('/welcome');
  };
  const run = async (fn) => {
    setBusy(true); setError(null);
    try { await fn(); } catch (err) { setError(err); } finally { setBusy(false); }
  };
  const toggle = (list, set, key) => set(list.includes(key) ? list.filter((x) => x !== key) : [...list, key]);

  const checkPhone = () => run(async () => {
    try {
      const res = await api('/auth/phone', { method: 'POST', body: { phone, app: 'worker' } });
      setPhone(res.phone);
      go(res.registered ? 'hasAccount' : 'channel');
    } catch (err) {
      if (err.code === 'wrong_app') go('wrongApp');
      else throw err;
    }
  });

  const sendCode = (ch) => run(async () => {
    setChannel(ch);
    const res = await api('/auth/otp/request', { method: 'POST', body: { phone, channel: ch, purpose: 'signup', app: 'worker' } });
    setSent(res);
    if (step === 'code') setSent({ ...res }); else go('code');
  });

  const verify = (code) => run(async () => {
    const res = await api('/auth/otp/verify', { method: 'POST', body: { phone, code, purpose: 'signup' } });
    setTicket(res.ticket);
    replace('work'); // going back from "work" returns to the number, not the used code
  });

  const choosePhoto = (from) => run(async () => {
    const picked = await pickPhoto(from);
    if (picked) setPhoto(picked);
  });

  const register = (confirmPin) => run(async () => {
    if (confirmPin !== pin) { setPin(null); replace('pin'); setError(t('pinMismatch')); return; }
    const res = await api('/auth/register', {
      method: 'POST',
      body: {
        role: 'worker', ticket, name: name.trim(), pin, language: lang,
        workerProfile: { skills, areasServed: areas, priceMin: price ? Number(price) : undefined, gender: gender || undefined },
        assistedBy: helped ? { name: helper.name.trim(), phone: helper.phone || undefined, relation: helper.relation || 'other' } : undefined,
      },
    });
    await signIn(res);
    // The photo needs a login to upload, so it goes up right after the account exists.
    if (photo) {
      try {
        const url = await uploadPhoto(photo);
        await api('/workers/me', { method: 'PATCH', body: { photoUrl: url } });
      } catch { /* they can add it later from My profile */ }
    }
    router.replace('/home');
  });

  const n = STEP_NUMBER[step];
  const title = helped && step === 'helper' ? t('doorHelped') : t('signupTitle');
  const titleU = helped && step === 'helper' ? u('doorHelped') : u('signupTitle');

  return (
    <Screen
      top={<TopBar title={title} ur={titleU} onBack={back} />}
      bottom={['work', 'areas', 'about'].includes(step) ? (
        <Btn
          k="next"
          kind="henna"
          disabled={(step === 'work' && !skills.length) || (step === 'areas' && !areas.length) || (step === 'about' && !name.trim())}
          onPress={() => go(step === 'work' ? 'areas' : step === 'areas' ? 'about' : 'pin')}
        />
      ) : undefined}
    >
      {n > 0 && <StepTag n={n} />}

      {step === 'helper' && (
        <View style={{ gap: 16 }}>
          <View style={row.center}>
            <Ico icon={UsersThree} tone="plumber" size={30} box={54} motion="roll" play />
            <L k="helperTitle" size={24} weight="heavy" style={{ flex: 1 }} />
          </View>
          <P>{t('helperNote')}</P>
          <Field label={t('helperName')} ur={u('helperName')}>
            <Input value={helper.name} onChangeText={(v) => setHelper({ ...helper, name: v })} autoCapitalize="words" maxLength={80} />
          </Field>
          <Field label={t('helperPhone')} ur={u('helperPhone')} hint={t('canSkip')}>
            <PhoneInput value={helper.phone} onChange={(v) => setHelper({ ...helper, phone: v })} />
          </Field>
          <Field label={t('helperRelation')} ur={u('helperRelation')}>
            <View style={row.wrap}>
              {[['shop', Storefront, 'saffron'], ['friend', Handshake, 'leaf'], ['family', Heart, 'henna']].map(([key, icon, tone]) => (
                <Chip key={key} icon={icon} tone={tone} main={t(`rel${key[0].toUpperCase()}${key.slice(1)}`)} ur={u(`rel${key[0].toUpperCase()}${key.slice(1)}`)} selected={helper.relation === key} onPress={() => setHelper({ ...helper, relation: key })} />
              ))}
            </View>
          </Field>
          <Btn k="next" kind="henna" disabled={!helper.name.trim()} onPress={() => go('phone')} />
        </View>
      )}

      {step === 'phone' && (
        <PhoneStep titleK={helped ? 'workerPhoneQ' : 'signupTitle'} labelK={helped ? 'workerPhoneQ' : 'mobileNumber'} phone={phone} setPhone={setPhone} onNext={checkPhone} busy={busy} error={error} />
      )}
      {step === 'hasAccount' && (
        <MismatchPanel kind="hasAccount" phone={phone} onPrimary={() => router.replace({ pathname: '/login', params: { phone } })} onOther={() => { setPhone(''); back(); }} />
      )}
      {step === 'wrongApp' && <MismatchPanel kind="wrongApp" phone={phone} onOther={() => { setPhone(''); back(); }} />}
      {step === 'channel' && <ChannelStep onPick={sendCode} busy={busy} chosen={channel} error={error} />}
      {step === 'code' && (
        <CodeStep phone={phone} sent={sent} onCode={verify} onResend={() => sendCode(channel)} onOtherWay={back} error={error} busy={busy} />
      )}

      {step === 'work' && (
        <View style={{ gap: 14 }}>
          <L k="workQ" size={24} weight="heavy" />
          <P>{t('workNote')}</P>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {CATEGORIES.map((c, i) => {
              const on = skills.includes(c.key);
              return (
                <Tap key={c.key} onPress={() => toggle(skills, setSkills, c.key)} selected={on} face={on ? C.hennaTint : C.card} edge={on ? C.henna : C.line} border={on ? C.henna : C.line} radius={R.lg} style={{ width: '47%', flexGrow: 1 }}>
                  <View style={{ padding: 14, gap: 8, minHeight: 122 }}>
                    <Ico icon={c.icon} tone={c.key} motion={c.motion} size={32} box={54} play i={i} />
                    <Say main={cat(c.key)} ur={catU(c.key)} size={18} weight="heavy" />
                  </View>
                </Tap>
              );
            })}
          </View>
          <P size={14} color={C.ink3}>{t('nextUp2')}</P>
        </View>
      )}

      {step === 'areas' && (
        <View style={{ gap: 14 }}>
          <L k="areasQ" size={24} weight="heavy" />
          <P>{t('areasNote')}</P>
          <View style={row.wrap}>
            {AREA_KEYS.map((a) => <Chip key={a} main={areaName(a)} ur={areaU(a)} selected={areas.includes(a)} onPress={() => toggle(areas, setAreas, a)} />)}
          </View>
          <Card>
            <View style={{ gap: 10 }}>
              <View style={row.center}>
                <Ico icon={Coins} tone="saffron" size={26} box={44} motion="roll" />
                <L k="priceQ" size={18} weight="heavy" style={{ flex: 1 }} />
              </View>
              <View style={row.center}>
                <Say main="Rs" size={22} weight="heavy" color={C.ink3} />
                <Input value={price} onChangeText={(v) => setPrice(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" inputMode="numeric" placeholder="800" big style={{ flex: 1 }} />
              </View>
              <P size={14} color={C.ink3}>{t('priceNote')} {t('canSkip')}.</P>
            </View>
          </Card>
        </View>
      )}

      {step === 'about' && (
        <View style={{ gap: 18 }}>
          <L k="aboutQ" size={24} weight="heavy" />
          <Field label={t('nameQ')} ur={u('nameQ')} hint={t('nameNote')}>
            <Input value={name} onChangeText={setName} autoCapitalize="words" maxLength={60} autoFocus />
          </Field>
          <Field label={t('genderQ')} ur={u('genderQ')} hint={t('genderNote')}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Choice icon={GenderMale} tone="plumber" main={t('man')} ur={u('man')} selected={gender === 'male'} onPress={() => setGender('male')} />
              <Choice icon={GenderFemale} tone="painter" main={t('woman')} ur={u('woman')} selected={gender === 'female'} onPress={() => setGender('female')} />
            </View>
          </Field>
          <Field label={t('photoQ')} ur={u('photoQ')} hint={t('photoNote')}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              {photo && <Image source={{ uri: photo.uri }} style={{ width: 84, height: 84, borderRadius: 42 }} />}
              <View style={{ flex: 1, gap: 10 }}>
                <Btn k={photo ? 'retake' : 'takePhoto'} kind="ghost" small icon={Camera} onPress={() => choosePhoto('camera')} busy={busy} />
                <Btn k="choosePhoto" kind="ghost" small icon={Images} onPress={() => choosePhoto('gallery')} busy={busy} />
              </View>
            </View>
          </Field>
          <ErrorBox error={error} />
          <P size={14} color={C.ink3}>{t('nextUp4')}</P>
        </View>
      )}

      {step === 'pin' && <PinStep titleK="makePin" noteK="makePinNote" onComplete={(p) => { setPin(p); go('confirm'); }} error={error} busy={busy} />}
      {step === 'confirm' && <PinStep titleK="repeatPin" onComplete={register} error={error} busy={busy} resetKey="confirm" />}
    </Screen>
  );
}
