import { DEFAULT_GUIDEPUP_VOICEOVER_SETTINGS } from "./configureSettings";

export const SPOKEN_PHRASES_POLL_INTERVAL = 50;
// Reduced from 10 - phrase is stable immediately with muted/max-speed VoiceOver
// Testing showed newAt=0, stableAt=1 in 90%+ of cases
export const SPOKEN_PHRASES_RETRY_COUNT = 3;
// Reduced from 50 - safety valve, rarely needed
export const MAX_SPOKEN_PHRASES_POLL_COUNT = 25;

export const ITEM_TEXT_POLL_INTERVAL = 50;
// Reduced from 10 - same reasoning as SPOKEN_PHRASES_RETRY_COUNT
export const ITEM_TEXT_RETRY_COUNT = 3;

export const APPROX_WORDS_PER_SECOND =
  DEFAULT_GUIDEPUP_VOICEOVER_SETTINGS.rateAsPercent / 12;
