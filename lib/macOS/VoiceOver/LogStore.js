"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogStore = void 0;
const constants_1 = require("./constants");
const cleanSpokenPhrase_1 = require("./cleanSpokenPhrase");
const itemText_1 = require("./itemText");
const lastSpokenPhrase_1 = require("./lastSpokenPhrase");
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function countApproxWords(str) {
    return str.trim().split(/\s+/).length;
}
class LogStore {
    #activePromise = null;
    #capture;
    #itemTextLogStore = [];
    #spokenPhraseLogStore = [];
    #clearedLastSpokenPhrase = null;
    constructor(options) {
        this.#capture = options?.capture ?? true;
    }
    /**
     * Get the text of the item in the VoiceOver cursor.
     *
     * @returns {Promise<string>} The item's text.
     */
    async itemText() {
        return (await this.itemTextLog()).at(-1) ?? "";
    }
    /**
     * Get the last spoken phrase.
     *
     * @returns {Promise<string>} The last spoken phrase.
     */
    async lastSpokenPhrase() {
        return (await this.spokenPhraseLog()).at(-1) ?? "";
    }
    /**
     * Get the item text log.
     *
     * @returns {Promise<string[]>} The item text log.
     */
    async itemTextLog() {
        if (this.#activePromise) {
            await this.#activePromise;
        }
        return this.#itemTextLogStore;
    }
    /**
     * Clear the item text log.
     */
    async clearItemTextLog() {
        if (this.#activePromise) {
            await this.#activePromise;
        }
        this.#itemTextLogStore = [];
    }
    /**
     * Get the spoken phrase log.
     *
     * @returns {Promise<string[]>} The spoken phrase log.
     */
    async spokenPhraseLog() {
        if (this.#activePromise) {
            await this.#activePromise;
        }
        return this.#spokenPhraseLogStore;
    }
    /**
     * Clear the spoken phrase log.
     */
    async clearSpokenPhraseLog() {
        if (this.#activePromise) {
            await this.#activePromise;
        }
        // Keep a reference to the last spoken phrase so we can continue to use the
        // same change detection technique.
        this.#clearedLastSpokenPhrase = this.#spokenPhraseLogStore.at(-1) ?? null;
        this.#spokenPhraseLogStore = [];
    }
    /**
     * Waits for the provided promise to resolve and then captures the logs for
     * the performed action until they stabilize.
     *
     * @param {Promise<unknown>} promise Underlying action to capture logs for.
     * @param {object} options Additional options.
     * @returns {Promise<unknown>}
     */
    async tap(action, options) {
        if (this.#activePromise) {
            await this.#activePromise;
        }
        let activePromiseResolver;
        this.#activePromise = new Promise((resolve) => (activePromiseResolver = resolve));
        let result;
        try {
            result = await action();
            if (options?.capture ?? this.#capture) {
                const [itemText, lastSpokenPhrase] = await Promise.all([
                    this.#pollForItemText(),
                    this.#pollForSpokenPhrases(options),
                ]);
                this.#itemTextLogStore.push(itemText);
                this.#spokenPhraseLogStore.push(lastSpokenPhrase);
            }
        }
        finally {
            activePromiseResolver();
            this.#activePromise = null;
        }
        return result;
    }
    async #pollForItemText() {
        for (let i = 0; i < constants_1.ITEM_TEXT_RETRY_COUNT; i++) {
            let rawItemText = "";
            try {
                rawItemText = await (0, itemText_1.itemText)();
            }
            catch {
                // swallow
            }
            const itemText = (0, cleanSpokenPhrase_1.cleanSpokenPhrase)(rawItemText);
            if (itemText) {
                return itemText;
            }
            await delay(constants_1.ITEM_TEXT_POLL_INTERVAL);
        }
        return "";
    }
    async #pollForSpokenPhrases(options) {
        // Attempt to combat VO picking up previous spoken phrase even though we
        // should be confident the action has completed.
        await delay(constants_1.SPOKEN_PHRASES_POLL_INTERVAL);
        const previousSpokenPhrase = this.#spokenPhraseLogStore.at(-1) ?? this.#clearedLastSpokenPhrase ?? "";
        const phrases = [];
        let stableCount = 0;
        let pollCount = 0;
        const startTime = Date.now(); // Track total elapsed time
        while (pollCount < constants_1.MAX_SPOKEN_PHRASES_POLL_COUNT) {
            let rawLastSpokenPhrase = "";
            try {
                rawLastSpokenPhrase = await (0, lastSpokenPhrase_1.lastSpokenPhrase)();
            }
            catch {
                // swallow
            }
            const phrase = (0, cleanSpokenPhrase_1.cleanSpokenPhrase)(rawLastSpokenPhrase);
            let pollTimeout;
            if (!phrase) {
                // Error retrieving phrase
                pollTimeout = constants_1.SPOKEN_PHRASES_POLL_INTERVAL;
            }
            else if (pollCount < constants_1.SPOKEN_PHRASES_RETRY_COUNT / 2 &&
                phrase === previousSpokenPhrase) {
                // Cater for VO not picking up the new phrase immediately
                pollTimeout = constants_1.SPOKEN_PHRASES_POLL_INTERVAL;
            }
            else if (phrase === phrases.at(-1)) {
                stableCount++;
                pollTimeout = constants_1.SPOKEN_PHRASES_POLL_INTERVAL;
            }
            else {
                const approxWords = countApproxWords(phrase);
                stableCount = 0;
                // Reduced speech delay multiplier from 1000 to 500 (50% faster polling)
                // for AI agent use case where speed is critical
                pollTimeout =
                    (approxWords / constants_1.APPROX_WORDS_PER_SECOND) * 500 +
                        constants_1.SPOKEN_PHRASES_POLL_INTERVAL;
                phrases.push(phrase);
            }
            if (stableCount >= constants_1.SPOKEN_PHRASES_RETRY_COUNT ||
                (options?.capture ?? this.#capture) === "initial") {
                break;
            }
            await delay(pollTimeout);
            pollCount++;
        }
        // Logging: Track stabilization vs timeout performance
        const elapsedMs = Date.now() - startTime;
        const elapsedSec = (elapsedMs / 1000).toFixed(2);
        const hitTimeout = pollCount >= constants_1.MAX_SPOKEN_PHRASES_POLL_COUNT;
        const captureMode = options?.capture ?? this.#capture;
        if (hitTimeout) {
            console.warn(`[Guidepup] ⏱️  TIMEOUT after ${pollCount} polls (${elapsedSec}s) | phrases: ${phrases.length} | capture: ${captureMode}`);
        }
        else if (pollCount > 30) {
            console.warn(`[Guidepup] ⚠️  SLOW stabilization: ${pollCount} polls (${elapsedSec}s) | phrases: ${phrases.length}`);
        }
        else if (pollCount > 25) {
            console.log(`[Guidepup] 📊 Stabilized after ${pollCount} polls (${elapsedSec}s) | phrases: ${phrases.length}`);
        }
        // Skip logging for fast cases (pollCount <= 25) to reduce noise
        return phrases.filter(Boolean).join(". ");
    }
}
exports.LogStore = LogStore;
