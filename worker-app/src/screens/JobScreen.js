// One job from the worker's side. What appears depends on the job's status:
//   open      -> send a quote
//   requested -> accept / decline
//   accepted  -> propose visit charge or full quote
//   agreed    -> propose changes or parts (with bill photo)
//   completed -> confirm cash received, rate the customer, open a dispute
import { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { api, rupees } from '../api';
import { Btn, Card, Chip, ErrorText, Field, H, Muted, s, C, T } from '../ui';
import { DISPUTE } from '../strings';

export default function JobScreen({ nav, i18n, jobId }) {
  const { t, cat, catIcon, areaName, status, entry, entryIcon } = i18n;
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(() => api(`/jobs/${jobId}`).then((d) => setJob(d.job)).catch((e) => setError(e.message)), [jobId]);
  useEffect(() => { load(); }, [load]);

  // Every button goes through this: call the API, show errors, reload.
  const act = async (path, body, message) => {
    setError('');
    setNotice('');
    try {
      await api(`/jobs/${jobId}${path}`, { method: 'POST', body });
      if (message) setNotice(message);
      await load();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };

  if (!job) return <View style={[s.screen, s.pad]}><Btn title={`← ${t('back')}`} onPress={nav.back} /><ErrorText>{error}</ErrorText></View>;
  const c = job.customer;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      <Btn title={`← ${t('back')}`} onPress={nav.back} style={{ alignSelf: 'flex-start', marginBottom: 12 }} />

      <Card>
        <View style={[s.row, { flexWrap: 'nowrap', alignItems: 'flex-start' }]}>
          <T style={s.big}>{catIcon(job.category)}</T>
          <View style={{ flex: 1 }}>
            <H>{cat(job.category)}</H>
            <T style={{ fontWeight: '700' }}>{status(job.status)}</T>
          </View>
        </View>
        <T style={{ marginTop: 8 }}>{job.description}</T>
        <Muted>📍 {areaName(job.area)}{job.address ? ` · ${job.address}` : ''}</Muted>
        {!job.address && <Muted>🔒 {t('addressAfter')}</Muted>}
        {job.preferredTime && <Muted>🕒 {new Date(job.preferredTime).toLocaleString()}</Muted>}
      </Card>

      <Card>
        <T style={s.label}>👤 {t('customer')}: {c.name}</T>
        <Muted>
          {c.rating ? `★ ${c.rating.avg} (${c.rating.count}) · ` : ''}
          {c.paidOnRecord ?? 0}/{c.jobsCompleted ?? 0} {t('paidOnRecord')}
        </Muted>
        {c.phone && (
          <View style={[s.row, { marginTop: 10, flexWrap: 'nowrap' }]}>
            <Btn kind="go" icon="📞" title={t('call')} style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${c.phone}`)} />
            <Btn icon="💬" title="WhatsApp" style={{ flex: 1 }} onPress={() => Linking.openURL(`https://wa.me/92${c.phone.slice(1)}`)} />
          </View>
        )}
      </Card>

      <ErrorText>{error}</ErrorText>
      {notice ? <T style={{ color: C.green, fontWeight: '700', marginBottom: 8 }}>{notice}</T> : null}

      {job.status === 'open' && <QuoteForm t={t} act={act} />}

      {job.status === 'requested' && (
        <View style={[s.row, { flexWrap: 'nowrap', marginBottom: 12 }]}>
          <Btn kind="go" icon="✓" title={t('accept')} style={{ flex: 1 }} onPress={() => act('/accept')} />
          <Btn kind="stop" icon="✕" title={t('decline')} style={{ flex: 1 }} onPress={() => act('/decline').then(nav.back)} />
        </View>
      )}

      {['accepted', 'agreed', 'completed'].includes(job.status) && (
        <Card>
          <H>📄 {t('agreement')}</H>
          {job.agreement.map((e) => (
            <View key={e._id} style={{ borderTopWidth: 1, borderColor: C.line, borderStyle: 'dashed', paddingVertical: 8, opacity: e.status === 'rejected' ? 0.5 : 1 }}>
              <View style={[s.row, { justifyContent: 'space-between' }]}>
                <T style={{ fontWeight: '700' }}>{entryIcon(e.kind)} {entry(e.kind)}</T>
                <T style={{ fontWeight: '700' }}>{rupees(e.amount)}</T>
              </View>
              {e.scope ? <Muted>{e.scope}</Muted> : null}
              <Muted>{status(e.status)}</Muted>
            </View>
          ))}
          <View style={[s.row, { justifyContent: 'space-between', borderTopWidth: 2, borderColor: C.line, paddingTop: 8 }]}>
            <T style={{ fontWeight: '800', fontSize: 18 }}>{t('total')}</T>
            <T style={{ fontWeight: '800', fontSize: 18 }}>{rupees(job.total)}</T>
          </View>
        </Card>
      )}

      {['accepted', 'agreed'].includes(job.status) && <ProposeForm job={job} i18n={i18n} act={act} />}
      {job.status === 'completed' && <AfterJob job={job} t={t} act={act} />}
      {['accepted', 'agreed', 'completed'].includes(job.status) && !job.dispute && <DisputeForm t={t} act={act} completed={job.status === 'completed'} />}
      {job.dispute && <Card><T>⚠ {DISPUTE[job.dispute.type]} · {job.dispute.status}</T></Card>}
    </ScrollView>
  );
}

// Pick what to propose by icon, type the amount, send.
function ProposeForm({ job, i18n, act }) {
  const { t, entry, entryIcon } = i18n;
  // Before the quote is agreed: visit charge or full quote. After: changes and parts.
  const kinds = job.status === 'accepted' ? ['visit', 'quote'] : ['amendment', 'part'];
  const [kind, setKind] = useState(null);
  const [amount, setAmount] = useState('');
  const [scope, setScope] = useState('');
  const [bill, setBill] = useState('');
  const waiting = job.agreement.some((e) => e.status === 'proposed');

  async function send() {
    const ok = await act('/agreement', { kind, amount: Number(amount), scope, billPhotoUrl: bill || undefined }, `✓ ${t('waiting')}`);
    if (ok) { setKind(null); setAmount(''); setScope(''); setBill(''); }
  }

  return (
    <Card>
      {waiting && <Muted style={{ marginBottom: 8 }}>⏳ {t('waiting')}</Muted>}
      <View style={[s.row, { flexWrap: 'nowrap' }]}>
        {kinds.map((k) => (
          <Btn key={k} icon={entryIcon(k)} title={entry(k)} kind={kind === k ? 'primary' : 'plain'} style={{ flex: 1 }} onPress={() => setKind(k)} />
        ))}
      </View>
      {kind && (
        <View style={{ marginTop: 12 }}>
          <Field label={t('amount')} value={amount} onChangeText={setAmount} keyboardType="number-pad" style={[s.input, { fontSize: 26, fontWeight: '700' }]} />
          <Field label={t('scope')} value={scope} onChangeText={setScope} />
          {/* TODO (should-have): replace this with a camera button using
              expo-image-picker, uploading to Cloudinary. */}
          {kind === 'part' && <Field label={`🧾 ${t('billUrl')}`} value={bill} onChangeText={setBill} autoCapitalize="none" />}
          <Btn kind="primary" icon="➜" title={t('propose')} onPress={send} disabled={!amount} />
        </View>
      )}
    </Card>
  );
}

function AfterJob({ job, t, act }) {
  const [amount, setAmount] = useState(String(job.payment?.workerAmount ?? job.total ?? ''));
  const [stars, setStars] = useState(0);
  const both = job.payment?.workerAmount != null && job.payment?.customerAmount != null;

  return (
    <>
      <Card>
        <T style={s.label}>💵 {t('paidQ')}</T>
        <View style={[s.row, { flexWrap: 'nowrap' }]}>
          <View style={{ flex: 1 }}><Field label="" value={amount} onChangeText={setAmount} keyboardType="number-pad" /></View>
          <Btn kind="go" icon="✓" title={t('confirm')} onPress={() => act('/payment', { amount: Number(amount) })} />
        </View>
        {both && <T style={{ color: job.payment.matched ? C.green : C.red, fontWeight: '700' }}>{job.payment.matched ? `✓ ${t('matched')}` : `⚠ ${t('mismatch')}`}</T>}
      </Card>
      <Card>
        <T style={s.label}>{t('rateCustomer')}</T>
        {job.reviewedByMe ? <Muted>✓ {t('rated')}</Muted> : (
          <>
            <View style={[s.row, { flexWrap: 'nowrap' }]}>
              {[1, 2, 3, 4, 5].map((n) => (
                <T key={n} onPress={() => setStars(n)} style={{ fontSize: 40, color: n <= stars ? C.marigold : C.line }}>★</T>
              ))}
            </View>
            <Btn kind="primary" title={t('send')} disabled={!stars} onPress={() => act('/review', { stars })} />
          </>
        )}
      </Card>
    </>
  );
}

function DisputeForm({ t, act, completed }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(completed ? 'non-payment' : 'no-show');
  const [text, setText] = useState('');
  if (!open) return <Btn icon="⚠" title={t('dispute')} onPress={() => setOpen(true)} />;
  return (
    <Card>
      <View style={s.row}>
        {Object.keys(DISPUTE).map((k) => <Chip key={k} label={DISPUTE[k]} on={type === k} onPress={() => setType(k)} />)}
      </View>
      <View style={{ height: 12 }} />
      <Field label={t('explain')} value={text} onChangeText={setText} multiline />
      <Btn kind="primary" title={t('send')} onPress={() => act('/disputes', { type, text })} />
    </Card>
  );
}

function QuoteForm({ t, act }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  return (
    <Card>
      <Field label={t('quoteAmount')} value={amount} onChangeText={setAmount} keyboardType="number-pad" style={[s.input, { fontSize: 26, fontWeight: '700' }]} />
      <Field label={t('note')} value={note} onChangeText={setNote} />
      <Btn kind="primary" icon="➜" title={t('sendQuote')} disabled={!amount} onPress={() => act('/quotes', { amount: Number(amount), note }, `✓ ${t('quoted')}`)} />
    </Card>
  );
}
