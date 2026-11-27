// Prints the demo accounts as a Markdown list (used to write DEMO-DATA.md).
// Run with: npm run demo:accounts
import { AREAS, CATEGORIES } from './lib/rules.js';
import { PIN, ADMIN, SERVICE, LEVELS, CUSTOMERS, workers } from './demoData.js';

const pretty = (p) => `${p.slice(0, 4)} ${p.slice(4)}`;
const NAMES = {
  dha: 'DHA', clifton: 'Clifton', saddar: 'Saddar', pechs: 'PECHS', bahadurabad: 'Bahadurabad', 'gulshan-e-iqbal': 'Gulshan-e-Iqbal',
  'gulistan-e-jauhar': 'Gulistan-e-Jauhar', 'north-nazimabad': 'North Nazimabad', nazimabad: 'Nazimabad', korangi: 'Korangi', malir: 'Malir',
};
const area = (a) => NAMES[a] || a;
const out = [];
out.push(`Everyone logs in with **PIN ${PIN}**. Admin: \`${ADMIN.phone}\` with password \`${ADMIN.password}\` at /admin/login.`, '');
out.push('### Customers (website)', '', '| Name | Number | Lives in |', '| --- | --- | --- |');
for (const c of CUSTOMERS) out.push(`| ${c.name} | \`${pretty(c.phone)}\` | ${area(c.area)} |`);
out.push('', '### Workers (worker app), by service', '');
const roster = workers();
for (const cat of CATEGORIES) {
  out.push(`**${SERVICE[cat].label}**`, '', '| Name | Number | Works in | Experience |', '| --- | --- | --- | --- |');
  for (const w of roster.filter((x) => x.skills[0] === cat)) {
    out.push(`| ${w.name}${w.skills.length > 1 ? ` (also ${w.skills.slice(1).map((s) => SERVICE[s].label).join(', ')})` : ''} | \`${pretty(w.phone)}\` | ${w.areas.map(area).join(', ')} | ${LEVELS[w.level].label} |`);
  }
  out.push('');
}
out.push(`Areas next to each other (search shows these too): ${Object.entries(AREAS).map(([a, n]) => `${area(a)} → ${n.map(area).join(', ')}`).join('; ')}.`);
console.log(out.join('\n'));
