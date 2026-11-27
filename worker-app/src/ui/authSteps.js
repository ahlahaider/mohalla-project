// The steps log in and sign up share: phone number, "where should we send the code?",
// entering the code, and the PIN keypad. Same wording and order as the customer website.
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { C, F, R } from './theme';
import { Ico } from './motion';
import { WhatsappLogo, ChatText, Lock, Warning, UserPlus, Key } from './icons';
import { L, Say, P, Btn, LinkBtn, Choice, Box, PinBoxes, Keypad, PhoneInput, ErrorBox, Card } from './kit';
import { useLang } from '../lib/i18n';
import { prettyPhone } from '../lib/api';

export function PhoneStep({ titleK, labelK = 'mobileNumber', phone, setPhone, onNext, busy, error, children }) {
  return (
    <View style={{ gap: 16 }}>
      <L k={titleK} size={24} weight="heavy" />
      <L k="phoneOnly" size={16} weight="semi" color={C.ink2} />
      <View style={{ gap: 8 }}>
        <L k={labelK} size={17} weight="heavy" />
        <PhoneInput value={phone} onChange={setPhone} onSubmit={onNext} autoFocus />
      </View>
      <ErrorBox error={error} />
      <Btn k="continue" kind="henna" onPress={onNext} busy={busy} disabled={phone.replace(/\D/g, '').length < 10} />
      {children}
    </View>
  );
}

export function ChannelStep({ noteK = 'channelNote', onPick, busy, chosen, error }) {
  const { t, u } = useLang();
  return (
    <View style={{ gap: 16 }}>
      <L k="channelQ" size={24} weight="heavy" />
      <P>{t(noteK)}</P>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Choice icon={WhatsappLogo} tone="leaf" motion="ring" main={t('viaWhatsapp')} ur={u('viaWhatsapp')} hint={t('viaWhatsappHint')} selected={busy && chosen === 'whatsapp'} disabled={busy} onPress={() => onPick('whatsapp')} />
        <Choice icon={ChatText} tone="saffron" motion="wiggle" main={t('viaSms')} ur={u('viaSms')} hint={t('viaSmsHint')} selected={busy && chosen === 'sms'} disabled={busy} onPress={() => onPick('sms')} />
      </View>
      <ErrorBox error={error} />
    </View>
  );
}

// Enter the 4-number code. Shows the demo code when the API is in demo mode,
// a countdown before "send again", and a way back to choose the other channel.
export function CodeStep({ phone, sent, onCode, onResend, onOtherWay, error, busy }) {
  const { t } = useLang();
  const [code, setCode] = useState('');
  const [wait, setWait] = useState(sent?.resendSeconds ?? 30);

  useEffect(() => { setWait(sent?.resendSeconds ?? 30); setCode(''); }, [sent]);
  useEffect(() => {
    if (wait <= 0) return undefined;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);
  useEffect(() => { if (error) setCode(''); }, [error]);

  const type = (k) => {
    if (busy || code.length >= 4) return;
    const next = code + k;
    setCode(next);
    if (next.length === 4) onCode(next);
  };

  return (
    <View style={{ gap: 16 }}>
      <L k="enterCode" size={24} weight="heavy" />
      <P>{t(sent?.channel === 'whatsapp' ? 'codeSentWa' : 'codeSentSms', { phone: prettyPhone(phone) })}</P>
      {sent?.demoCode && (
        <Box tone="saffron" dashed>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <P size={14} weight="semi" color={C.ink} style={{ flex: 1 }}>{t('demoCode')}</P>
            <Text style={{ fontFamily: F.heavy, fontSize: 26, letterSpacing: 6, color: C.ink }}>{sent.demoCode}</Text>
          </View>
        </Box>
      )}
      <PinBoxes value={code} hidden={false} />
      <ErrorBox error={error} />
      <Keypad onKey={type} onDelete={() => setCode((c) => c.slice(0, -1))} disabled={busy} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        {wait > 0
          ? <P size={15} color={C.ink3} style={{ paddingVertical: 12 }}>{t('sendAgainIn', { n: wait })}</P>
          : <LinkBtn k="sendAgain" onPress={onResend} />}
        <LinkBtn k="otherWay" onPress={onOtherWay} />
      </View>
    </View>
  );
}

// 4-number PIN with big keys; calls onComplete when 4 numbers are in.
export function PinStep({ titleK, noteK, onComplete, error, busy, resetKey, children }) {
  const { t } = useLang();
  const [pin, setPin] = useState('');
  useEffect(() => { setPin(''); }, [error, resetKey]);
  const type = (k) => {
    if (busy || pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) setTimeout(() => onComplete(next), 120);
  };
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ico icon={Lock} tone="henna" size={26} box={44} motion="wiggle" play />
        <L k={titleK} size={22} weight="heavy" style={{ flex: 1 }} />
      </View>
      {noteK && <P>{t(noteK)}</P>}
      <PinBoxes value={pin} />
      <ErrorBox error={error} />
      <Keypad onKey={type} onDelete={() => setPin((p) => p.slice(0, -1))} disabled={busy} />
      {children}
    </View>
  );
}

// "No account with this number" / "This number already has an account" / "This is a customer number".
export function MismatchPanel({ kind, phone, onPrimary, onOther }) {
  const { t, u } = useLang();
  const conf = {
    noAccount: { icon: UserPlus, tone: 'saffron', title: 'noAccount', hint: 'noAccountHint', btn: 'signupWithThis', btnKind: 'henna' },
    hasAccount: { icon: Key, tone: 'leaf', title: 'hasAccount', hint: 'hasAccountHint', btn: 'loginInstead', btnKind: 'leaf' },
    wrongApp: { icon: Warning, tone: 'chilli', title: 'wrongAppTitle', hint: 'wrongAppHint' },
  }[kind];
  return (
    <View style={{ gap: 16 }}>
      <Card>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Ico icon={conf.icon} tone={conf.tone} size={36} box={64} motion="wiggle" play />
          <Text style={{ fontFamily: F.heavy, fontSize: 24, color: C.ink, letterSpacing: 1 }}>{prettyPhone(phone)}</Text>
          <Say main={t(conf.title)} ur={u(conf.title)} size={19} weight="heavy" align="center" />
          <P align="center">{t(conf.hint)}</P>
        </View>
      </Card>
      {conf.btn && <Btn k={conf.btn} kind={conf.btnKind} onPress={onPrimary} />}
      <Btn k="orTryAnother" kind="ghost" onPress={onOther} />
    </View>
  );
}

// "Step 2 of 4" pill.
export function StepTag({ n }) {
  const { t } = useLang();
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: C.saffronTint, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 3 }}>
      <Text style={{ fontFamily: F.heavy, fontSize: 14, color: '#6b4300' }}>{t('stepOf', { n })}</Text>
    </View>
  );
}
