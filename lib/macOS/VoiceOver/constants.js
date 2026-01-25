"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APPROX_WORDS_PER_SECOND = exports.ITEM_TEXT_RETRY_COUNT = exports.ITEM_TEXT_POLL_INTERVAL = exports.MAX_SPOKEN_PHRASES_POLL_COUNT = exports.SPOKEN_PHRASES_RETRY_COUNT = exports.SPOKEN_PHRASES_POLL_INTERVAL = void 0;
const configureSettings_1 = require("./configureSettings");
exports.SPOKEN_PHRASES_POLL_INTERVAL = 50;
// Reduced from 10 - phrase is stable immediately with muted/max-speed VoiceOver
// Testing showed newAt=0, stableAt=1 in 90%+ of cases
exports.SPOKEN_PHRASES_RETRY_COUNT = 3;
// Reduced from 50 - safety valve, rarely needed
exports.MAX_SPOKEN_PHRASES_POLL_COUNT = 25;
exports.ITEM_TEXT_POLL_INTERVAL = 50;
// Reduced from 10 - same reasoning as SPOKEN_PHRASES_RETRY_COUNT
exports.ITEM_TEXT_RETRY_COUNT = 3;
exports.APPROX_WORDS_PER_SECOND = configureSettings_1.DEFAULT_GUIDEPUP_VOICEOVER_SETTINGS.rateAsPercent / 12;
