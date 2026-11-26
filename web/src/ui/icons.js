// Which icon (and which little movement) goes with each service.
// Icons come from Phosphor (phosphoricons.com), drawn in "duotone" and recoloured
// in app.css so each service has its own colour. `motion` names an animation in app.css.
import {
  Wrench, Lightning, Broom, Hammer, Snowflake, PaintRoller, Car, Bug,
} from '@phosphor-icons/react';

export const CATEGORIES = [
  { key: 'plumber', icon: Wrench, motion: 'wiggle' },
  { key: 'electrician', icon: Lightning, motion: 'flash' },
  { key: 'cleaner', icon: Broom, motion: 'sweep' },
  { key: 'carpenter', icon: Hammer, motion: 'knock' },
  { key: 'ac-technician', icon: Snowflake, motion: 'spin' },
  { key: 'painter', icon: PaintRoller, motion: 'roll' },
  { key: 'mechanic', icon: Car, motion: 'drive' },
  { key: 'fumigator', icon: Bug, motion: 'crawl' },
];

export const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
