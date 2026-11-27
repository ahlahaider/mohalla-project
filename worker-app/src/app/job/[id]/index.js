// Screen 5: Worker job page. The same price record the customer sees, as 4 steps:
//   1 Visit charge (or skip)  2 Full work price  3 Do the work (parts, extra work)  4 Get paid
// Every price waits for the customer's OK; "said No" lets the worker send a new one.
// It refreshes every 15 seconds so the customer's answers show up by themselves.
import { useCallback, useEffect, useState } from 'react';
import { View, Image, Linking } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Screen, TopBar, Say, L, P, Btn, LinkBtn, Card, Box, Tag, Sheet, Input, Loading, ErrorBox, RiseIn, row } from '../../../ui/kit';
import { Ico, Tap } from '../../../ui/motion';
import {
  CATEGORY, Phone, WhatsappLogo, MapTrifold, MapPin, Check, Hourglass, X, PaperPlaneTilt, Camera,
  PlusCircle, Money, Warning, Star, ShieldWarning, CheckCircle, Receipt,
} from '../../../ui/icons';
import { api, rupees, photoUri } from '../../../lib/api';
import { useLang } from '../../../lib/i18n';
import { splitProblem, workerStatus } from '../../../lib/jobs';
import { clock } from '../../../lib/when';
import { C, F, R } from '../../../ui/theme';

const POLL_MS = 15000;
const CONTACT = ['accepted', 'agreed', 'completed'];

export default function JobPage() {
  const { id } = useLocalSearchParams();
  const l = useLang();
  const { t, u, areaName } = l;
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bill, setBill] = useState(null);

  const load = useCallback(() => api(`/jobs/${id}`).then((d) => { setJob(d.job); setError(null); }).catch(setError), [id]);
  useFocusEffect(useCallback(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]));
  useEffect(() => { if (job?.status === 'requested') router.replace(`/request/${job.id}`); }, [job]);

  if (!job) return <Screen top={<TopBar title="" />}>{error ? <ErrorBox error={error} onRetry={load} /> : <Loading />}</Screen>;

  const name = job.customer.name.split(' ')[0];
  const p = splitProblem(job, l);
  const view = { ...job, waitingForCustomer: job.agreement.some((e) => e.status === 'proposed'), cashConfirmed: job.payment?.workerAmount != null };
  const st = workerStatus(view);
  const ended = ['declined', 'expired', 'cancelled'].includes(job.status);
  const waitingTotal = job.agreement.filter((e) => e.status === 'proposed').reduce((s, e) => s + e.amount, 0);

  const cancel = async () => {
    setBusy(true);
    try { await api(`/jobs/${id}/cancel`, { method: 'POST' }); setCancelOpen(false); await load(); } catch (err) { setError(err); setCancelOpen(false); } finally { setBusy(false); }
  };
  const price = (kind) => router.push({ pathname: `/job/${id}/price`, params: { kind } });

  return (
    <Screen
      top={<TopBar title={`${name} · ${p.title}`} sub={<View style={{ marginTop: 3 }}><Tag tone={st.tone}>{t(st.k)}</Tag></View>} />}
      bottom={CONTACT.includes(job.status) && !(job.dispute?.status === 'open') ? (
        <View style={row.between}>
          <Btn kind="ghost" k="problemQ" icon={Warning} small onPress={() => router.push(`/job/${id}/problem`)} style={{ flex: 1 }} />
          {['accepted', 'agreed'].includes(job.status) && <LinkBtn k="cancelJob" color={C.chilliDeep} onPress={() => setCancelOpen(true)} />}
        </View>
      ) : undefined}
    >
      <ErrorBox error={error} onRetry={load} />

      {ended && (
        <Box tone="chilli">
          <P weight="bold" color={C.chilliDeep}>{t(job.status === 'cancelled' ? 'jobCancelled' : job.status === 'declined' ? 'jobDeclined' : 'requestExpired')}</P>
        </Box>
      )}

      {/* address and contact: only after saying yes */}
      {CONTACT.includes(job.status) && job.address && <ContactCard job={job} l={l} />}

      <ProblemCard job={job} p={p} l={l} />

      {CONTACT.includes(job.status) && (
        <>
          <View style={row.between}>
            <Say main={t('fourSteps')} ur={u('fourSteps')} size={18} weight="heavy" urColor={C.hennaDeep} />
            <View style={{ alignItems: 'flex-end' }}>
              <P size={15} weight="bold">{t('agreedLabel')}: <P size={18} weight="heavy" color={C.ink}>{rupees(job.total)}</P></P>
              {waitingTotal > 0 && <P size={13} weight="bold" color={C.saffronDeep}>{t('plusWaiting', { amount: rupees(waitingTotal) })}</P>}
            </View>
          </View>
          <Steps job={job} name={name} l={l} onPrice={price} onBill={setBill} />
        </>
      )}

      {job.dispute && <DisputeCard job={job} name={name} l={l} onSent={load} />}

      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)}>
        <L k="cancelQ" size={22} weight="heavy" />
        <P>{t('cancelNote', { name })}</P>
        <Btn kind="chilli" k="yesCancel" icon={X} onPress={cancel} busy={busy} />
        <Btn kind="ghost" k="keepJob" onPress={() => setCancelOpen(false)} />
      </Sheet>

      <Sheet open={Boolean(bill)} onClose={() => setBill(null)}>
        <L k="billTitle" size={20} weight="heavy" />
        {bill && <Image source={{ uri: photoUri(bill) }} style={{ width: '100%', aspectRatio: 0.75, borderRadius: R.md, backgroundColor: C.paperDeep }} resizeMode="contain" />}
        <Btn kind="ghost" k="close" onPress={() => setBill(null)} />
      </Sheet>
    </Screen>
  );
}

function ContactCard({ job, l }) {
  const { t, areaName } = l;
  const phone = job.customer.phone;
  const open = (url) => Linking.openURL(url).catch(() => {});
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${job.address}, ${areaName(job.area)}, Karachi`)}`;
  const Action = ({ icon, label, face, edge, ink, onPress, motion }) => (
    <Tap onPress={onPress} face={face} edge={edge} radius={R.md} style={{ flex: 1 }} accessibilityLabel={label}>
      <View style={{ alignItems: 'center', paddingVertical: 10, gap: 2 }}>
        <Ico icon={icon} motion={motion} size={24} box={34} colors={['transparent', face === C.card ? '#e9cfae' : 'rgba(255,255,255,0.35)', ink]} />
        <P size={15} weight="heavy" color={ink}>{label}</P>
      </View>
    </Tap>
  );
  return (
    <RiseIn>
      <View style={{ backgroundColor: C.ink, borderRadius: R.lg, padding: 16, gap: 14 }}>
        <View style={[row.center, { alignItems: 'flex-start' }]}>
          <MapPin size={24} weight="fill" color={C.saffron} />
          <View style={{ flex: 1 }}>
            <P size={17} weight="heavy" color="#fff">{job.address}</P>
            <P size={14} weight="semi" color="#e8d8c3">{areaName(job.area)}</P>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Action icon={Phone} label={t('call')} face={C.saffron} edge={C.saffronDeep} ink={C.ink} motion="ring" onPress={() => open(`tel:${phone}`)} />
          <Action icon={WhatsappLogo} label={t('whatsapp')} face={C.wa} edge={C.waDeep} ink="#fff" motion="wiggle" onPress={() => open(`https://wa.me/92${phone.slice(1)}`)} />
          <Action icon={MapTrifold} label={t('map')} face={C.card} edge={C.line} ink={C.ink} motion="roll" onPress={() => open(mapUrl)} />
        </View>
      </View>
    </RiseIn>
  );
}

function ProblemCard({ job, p, l }) {
  const { t, u } = l;
  const c = CATEGORY[job.category];
  return (
    <Card pad={14}>
      <View style={{ gap: 10 }}>
        <View style={row.center}>
          {c && <Ico icon={c.icon} tone={job.category} motion={c.motion} size={22} box={40} play />}
          <View style={{ flex: 1 }}>
            <P size={13} weight="heavy" color={C.ink3}>{t('theProblem').toUpperCase()}</P>
            <Say main={p.title} ur={p.titleU} size={17} weight="heavy" />
          </View>
        </View>
        {!!p.details && <P color={C.ink}>“{p.details}”</P>}
        {job.photos?.length > 0 && (
          <View style={row.wrap}>
            {job.photos.map((ph) => <Image key={ph} source={{ uri: photoUri(ph) }} style={{ width: 72, height: 72, borderRadius: R.sm, backgroundColor: C.paperDeep }} />)}
          </View>
        )}
      </View>
    </Card>
  );
}

// ---------- the 4 steps ----------
function Steps({ job, name, l, onPrice, onBill }) {
  const { t, u } = l;
  const ag = job.agreement;
  const of = (kind) => ag.filter((e) => e.kind === kind);
  const visits = of('visit');
  const quotes = of('quote');
  const extras = ag.filter((e) => e.kind === 'part' || e.kind === 'amendment');
  const lastVisit = visits[visits.length - 1];
  const lastQuote = quotes[quotes.length - 1];
  const quoteAgreed = quotes.some((e) => e.status === 'accepted');
  const pre = job.status === 'accepted';
  const cashConfirmed = job.payment?.workerAmount != null;

  // Step 1: visit charge
  let s1 = 'todo';
  if (lastVisit?.status === 'accepted') s1 = 'done';
  else if (!pre || (!lastVisit && quotes.length)) s1 = 'skipped';
  else s1 = 'current';
  // Step 2: full price
  let s2 = 'todo';
  if (quoteAgreed) s2 = 'done';
  else if (pre && s1 !== 'current') s2 = 'current';
  // Step 3: the work
  const s3 = job.status === 'agreed' ? 'current' : job.status === 'completed' ? 'done' : 'todo';
  // Step 4: cash
  const s4 = job.status === 'completed' ? (cashConfirmed && job.reviewedByMe ? 'done' : 'current') : 'todo';

  const entries = (list) => list.map((e) => <Entry key={e._id} e={e} name={name} l={l} onBill={onBill} />);
  const resend = (kind, last) => last?.status === 'rejected' && <Btn kind="henna" k="sendNew" icon={PaperPlaneTilt} motion="drive" small onPress={() => onPrice(kind)} />;

  return (
    <View>
      <Step n={1} state={s1} title={s1 === 'skipped' ? t('s1Skipped') : t('s1')} ur={s1 === 'skipped' ? u('s1Skipped') : u('s1')}>
        {s1 !== 'skipped' && entries(visits)}
        {s1 === 'current' && !lastVisit && (
          <>
            <P size={15}>{t('s1Sub')}</P>
            <Btn kind="henna" k="s1Send" icon={PaperPlaneTilt} motion="drive" small onPress={() => onPrice('visit')} />
          </>
        )}
        {s1 === 'current' && resend('visit', lastVisit)}
        {s1 === 'current' && lastVisit?.status !== 'proposed' && <LinkBtn k="s1Skip" onPress={() => onPrice('quote')} />}
      </Step>

      <Step n={2} state={s2} title={t('s2')} ur={u('s2')}>
        {entries(quotes)}
        {s2 === 'current' && !lastQuote && (
          <>
            <P size={15}>{t('s2Sub', { name })}</P>
            <Btn kind="henna" k="s2Send" icon={PaperPlaneTilt} motion="drive" onPress={() => onPrice('quote')} />
          </>
        )}
        {s2 === 'current' && resend('quote', lastQuote)}
      </Step>

      <Step n={3} state={s3} title={t('s3')} ur={u('s3')}>
        {(s3 !== 'todo' || extras.length > 0) && entries(extras)}
        {s3 === 'todo' && <P size={14} color={C.ink3}>{t('s3Sub')}</P>}
        {s3 === 'current' && (
          <>
            <P size={15}>{t('s3Sub')}</P>
            <Btn kind="ghost" k="addPart" icon={Camera} small onPress={() => router.push(`/job/${job.id}/part`)} />
            <Btn kind="ghost" k="addExtra" icon={PlusCircle} small onPress={() => onPrice('amendment')} />
          </>
        )}
      </Step>

      <Step n={4} state={s4} title={t('s4')} ur={u('s4')} last>
        {s4 === 'todo' && <P size={14} color={C.ink3}>{t('s4Sub', { name })}</P>}
        {job.status === 'completed' && (
          <>
            {!cashConfirmed ? (
              <>
                <P size={15} weight="bold" color={C.ink}>{t('s4Now', { name })}</P>
                <Btn kind="saffron" k="confirmCash" icon={Money} motion="roll" onPress={() => router.push(`/job/${job.id}/paid`)} />
              </>
            ) : (
              <View style={row.center}>
                <CheckCircle size={22} weight="fill" color={C.leaf} />
                <P weight="heavy" color={C.leafDeep}>{t('youGot', { amount: rupees(job.payment.workerAmount) })}</P>
              </View>
            )}
            {cashConfirmed && !job.reviewedByMe && <Btn kind="henna" k="rateName" vars={{ name }} icon={Star} motion="pop" small onPress={() => router.push({ pathname: `/job/${job.id}/paid`, params: { only: 'rate' } })} />}
            {cashConfirmed && job.reviewedByMe && <P size={14} color={C.ink3}>{t('youRated', { name })} · {t('jobFinished')}</P>}
          </>
        )}
      </Step>
    </View>
  );
}

function Step({ n, state, title, ur, children, last }) {
  const done = state === 'done' || state === 'skipped';
  const current = state === 'current';
  const circle = done ? [C.leaf, '#fff'] : current ? [C.henna, '#fff'] : [C.paperDeep, C.ink3];
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ alignItems: 'center', width: 40 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: circle[0], alignItems: 'center', justifyContent: 'center' }}>
          {done ? <Check size={22} weight="bold" color="#fff" /> : <Say main={String(n)} size={18} weight="heavy" color={circle[1]} align="center" />}
        </View>
        {!last && <View style={{ flex: 1, width: 4, backgroundColor: done ? C.leaf : C.line, marginVertical: 2, borderRadius: 2 }} />}
      </View>
      <View style={[
        { flex: 1, borderRadius: R.lg, padding: 14, gap: 10, marginBottom: 14 },
        current && { backgroundColor: C.saffronTint, borderWidth: 2, borderBottomWidth: 5, borderColor: C.saffron },
        done && { backgroundColor: C.card, borderWidth: 2, borderBottomWidth: 5, borderColor: C.line },
        state === 'todo' && { borderWidth: 2, borderStyle: 'dashed', borderColor: C.line },
      ]}
      >
        <Say main={title} ur={current ? ur : undefined} size={17} weight="heavy" color={state === 'todo' ? C.ink2 : C.ink} />
        {children}
      </View>
    </View>
  );
}

// One price in the record: amount, what it's for, and the customer's answer.
function Entry({ e, name, l, onBill }) {
  const { t } = l;
  const status = {
    accepted: { k: 'saidOk', color: C.leafDeep, icon: <CheckCircle size={18} weight="fill" color={C.leaf} /> },
    proposed: { k: 'waitingFor', color: C.saffronDeep, icon: <Ico icon={Hourglass} motion="hourglass" loop size={16} box={22} colors={['transparent', '#f7c25c', C.saffronDeep]} /> },
    rejected: { k: 'saidNo', color: C.chilliDeep, icon: <X size={18} weight="bold" color={C.chilli} /> },
  }[e.status];
  return (
    <View style={{ backgroundColor: e.status === 'rejected' ? C.chilliTint : C.card, borderRadius: R.md, borderWidth: 2, borderColor: e.status === 'proposed' ? C.saffron : C.line, padding: 12, gap: 6 }}>
      <View style={row.between}>
        <View style={{ flex: 1 }}>
          <P weight="heavy" color={C.ink} size={16} style={e.status === 'rejected' && { textDecorationLine: 'line-through' }}>{t(`e_${e.kind}`)}{e.scope ? ` · ${e.scope}` : ''}</P>
        </View>
        <P weight="heavy" size={18} color={C.ink} style={e.status === 'rejected' && { textDecorationLine: 'line-through' }}>{rupees(e.amount)}</P>
      </View>
      <View style={row.center}>
        {status.icon}
        <P size={14} weight="bold" color={status.color}>{t(status.k, { name })}</P>
        <P size={13} color={C.ink3}>· {clock(e.decidedAt || e.proposedAt)}</P>
      </View>
      {e.billPhotoUrl && (
        <Tap onPress={() => onBill(e.billPhotoUrl)} face={C.paperDeep} edge={C.line} radius={R.sm} depth={3} style={{ alignSelf: 'flex-start' }}>
          <View style={[row.center, { padding: 6, paddingRight: 12 }]}>
            <Image source={{ uri: photoUri(e.billPhotoUrl) }} style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: C.line }} />
            <Receipt size={18} color={C.ink2} />
            <P size={14} weight="bold">{t('billTitle')}</P>
          </View>
        </Tap>
      )}
    </View>
  );
}

// ---------- a reported problem: both sides' words, and room to answer ----------
function DisputeCard({ job, name, l, onSent }) {
  const { t, u } = l;
  const d = job.dispute;
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const theyOpened = !d.openedByMe;
  const iAnswered = d.statements.some((s) => s.mine);

  const send = async () => {
    setBusy(true); setError(null);
    try { await api(`/disputes/${d.id}/statements`, { method: 'POST', body: { text: text.trim() } }); setText(''); await onSent(); } catch (err) { setError(err); } finally { setBusy(false); }
  };

  return (
    <Card style={{ borderColor: d.status === 'open' ? C.chilli : C.line }}>
      <View style={{ gap: 12 }}>
        <View style={row.center}>
          <Ico icon={ShieldWarning} tone="chilli" size={24} box={42} motion="wiggle" play />
          <Say main={t(`${d.openedByMe ? 'd' : 'dt'}_${d.type}`, { name })} ur={u(`${d.openedByMe ? 'd' : 'dt'}_${d.type}`, { name })} size={17} weight="heavy" style={{ flex: 1 }} />
        </View>
        {d.status === 'open' ? (
          <P weight="bold" color={C.chilliDeep}>{theyOpened ? t('disputeTheirs', { name, time: d.respondBy ? new Date(d.respondBy).toLocaleString('en-GB', { weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true }) : '' }) : t('disputeMine')}</P>
        ) : (
          <Box tone="plain">
            <P weight="heavy" color={C.ink}>{t('disputeDecided')}</P>
            <P>{d.ruling?.againstMe ? t('rulingAgainst') : d.status === 'upheld' ? t('rulingFor') : t('rulingNone')}</P>
            {!!d.ruling?.note && <P color={C.ink3}>“{d.ruling.note}”</P>}
          </Box>
        )}
        {d.statements.map((s, i) => (
          <View key={i} style={{ alignSelf: s.mine ? 'flex-end' : 'flex-start', maxWidth: '88%', backgroundColor: s.mine ? C.leafTint : C.paperDeep, borderRadius: R.md, padding: 10, gap: 4 }}>
            <P size={13} weight="heavy" color={C.ink3}>{s.mine ? t('yourSide') : t('theirSide', { name })}</P>
            <P color={C.ink}>{s.text}</P>
            {s.evidenceUrls?.map((ph) => <Image key={ph} source={{ uri: photoUri(ph) }} style={{ width: 120, height: 120, borderRadius: R.sm }} />)}
          </View>
        ))}
        {d.status === 'open' && (
          <View style={{ gap: 10 }}>
            <Say main={t(iAnswered || !theyOpened ? 'addMore' : 'tellYourSide')} ur={u(iAnswered || !theyOpened ? 'addMore' : 'tellYourSide')} size={16} weight="heavy" />
            <Input value={text} onChangeText={setText} multiline maxLength={2000} />
            <ErrorBox error={error} />
            <Btn kind="henna" k="send" icon={PaperPlaneTilt} motion="drive" small disabled={!text.trim()} busy={busy} onPress={send} />
          </View>
        )}
      </View>
    </Card>
  );
}
