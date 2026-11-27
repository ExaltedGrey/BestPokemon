import { EMBERVALE_MAP } from '@data/maps/embervale';
import {
  EMBERVALE_ELDER_MAP,
  EMBERVALE_MART_MAP,
  EMBERVALE_TAVERN_MAP,
} from '@data/maps/embervale_interiors';
import { EMERALD_SHRINE_MAP } from '@data/maps/emerald_shrine';
import { GARRISON_MAP } from '@data/maps/garrison';
import { VERDANT_WILDS_MAP } from '@data/maps/verdant_wilds';
import type { MapDef } from '@engine/types';

/**
 * Modular Map Registry.
 * Add Chapter 2+ maps here without changing engine code!
 */
export const MAPS: Record<string, MapDef> = {
  garrison: GARRISON_MAP,
  embervale: EMBERVALE_MAP,
  embervale_tavern: EMBERVALE_TAVERN_MAP,
  embervale_mart: EMBERVALE_MART_MAP,
  embervale_elder_house: EMBERVALE_ELDER_MAP,
  verdant_wilds: VERDANT_WILDS_MAP,
  emerald_shrine: EMERALD_SHRINE_MAP,
};
