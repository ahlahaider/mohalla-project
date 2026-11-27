// Screen 6: Send a price. One screen for the three kinds of price:
//   visit     - the visit charge (for coming and checking)
//   quote     - the full work price
//   amendment - extra work after the price was agreed (needs a few words: what is it?)
// Big keypad, quick amounts, and a preview of exactly what the customer will see.
import { useCallback, useState } from 'react';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Screen, TopBar, P, Btn, Box, AmountPad, Field, Input, ErrorBox, Loading } from '../../../ui/kit';
import { PaperPlaneTilt } from '../../../ui/icons';
import { api, rupees } from '../../../lib/api';
import { useLang } from '../../../lib/i18n';
import { splitProblem } from '../../../lib/jobs';
import { C } from '../../../ui/theme';

const QUICK = { visit: [300, 500, 800, 1000], quote: [1000, 1500, 2500, 3000], amendment: [300, 500, 1000, 2000] };
const TITLE = { visit: 'priceVisitTitle', quote: 'priceQuoteTitle', amendment: 'priceExtraTitle' };
const ENTRY = { visit: 'e_visit', quote: 'e_quote', amendment: 'e_amendment' };

export default function SendPrice() {
  const { id, kind: rawKind } = useLocalSearchParams();
  const kind = TITLE[rawKind] ? rawKind : 'quote';
  const l = useLang();
  const { t, u } = l;
  const [job, setJob] = useState(null);
  const [amount, setAmount] = useState('');
  const [scope, setScope] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useFocusEffect(useCallback(() => { api(`/jobs/${id}`).then((d) => setJob(d.job)).catch(setError); }, [id]));

  const name = job?.customer.name.split(' ')[0] || '';
  const p = job ? splitProblem(job, l) : null;
  const needsScope = kind === 'amendment';
  const ready = Number(amount) > 0 && (!needsScope || scope.trim());

  const send = async () => {
    setBusy(true); setError(null);
    try {
      await api(`/jobs/${id}/agreement`, {
        method: 'POST',
        body: { kind, amount: Number(amount), scope: needsScope ? scope.trim() : undefined },
      });
      router.back();
    } catch (err) { setError(err); } finally { setBusy(false); }
  };

  return (
    <Screen
      top={<TopBar title={t(TITLE[kind])} ur={u(TITLE[kind])} sub={p && kind !== 'amendment' ? t('forWhat', { what: p.title }) : undefined} />}
      bottom={job ? <Btn kind="henna" main={t('sendTo', { name })} ur={u('sendTo', { name })} icon={PaperPlaneTilt} motion="drive" disabled={!ready} busy={busy} onPress={send} /> : undefined}
    >
      {!job && !error && <Loading />}
      <ErrorBox error={error} />
      {job && (
        <>
          {needsScope && (
            <Field label={t('extraWhat')} ur={u('extraWhat')}>
              <Input value={scope} onChangeText={setScope} placeholder={t('extraExample')} maxLength={200} />
            </Field>
          )}
          <AmountPad value={amount} onChange={setAmount} quick={QUICK[kind]} />
          <Box tone="plain">
            <P size={15} color={C.ink}>{t('willSee', { name, what: t(ENTRY[kind]), amount: rupees(Number(amount) || 0) })}</P>
          </Box>
        </>
      )}
    </Screen>
  );
}
