/**
 * CymbalMart Voice Control & Speech Assistant Service
 * Provides Speech Recognition (Web Speech API), Speech Synthesis (TTS),
 * Web Audio sound effects, and intelligent Hands-Free command parsing.
 */

export interface VoiceCommandResult {
  intent:
    | "CHECK_ITEM"
    | "UNCHECK_ITEM"
    | "CHECK_ALL"
    | "UNCHECK_ALL"
    | "ADD_ITEM"
    | "REMOVE_ITEM"
    | "ADJUST_QUANTITY"
    | "TOGGLE_OWNED"
    | "TOGGLE_BRAND"
    | "SCALE_GUESTS"
    | "NAVIGATE_TAB"
    | "OPEN_IN_STORE_MODE"
    | "CLOSE_IN_STORE_MODE"
    | "FIND_ITEM_AISLE"
    | "QUERY_BUDGET"
    | "QUERY_PORTIONS"
    | "OPTIMIZE_BUDGET"
    | "CHOOSE_FULFILLMENT"
    | "PLACE_ORDER"
    | "OPEN_PARTY_CREATOR"
    | "SWITCH_PLAN"
    | "SEARCH_FILTER"
    | "CLEAR_FILTER"
    | "HELP"
    | "AI_QUERY"
    | "UNKNOWN";
  rawText: string;
  spokenFeedback: string;
  parameters?: Record<string, any>;
}

// Check browser SpeechRecognition support
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
  );
};

// Check browser SpeechSynthesis support
export const isSpeechSynthesisSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return Boolean(window.speechSynthesis);
};

// Web Audio API Chime Synthesizer for audio feedback
class SoundFX {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Pleasant chime when mic opens
  playWake() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  // Double chime when an action completes successfully
  playSuccess() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc2.frequency.setValueAtTime(783.99, now + 0.1); // G5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.1);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {}
  }

  // Soft warning chime
  playPrompt() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(349.23, now + 0.1);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }
}

export const soundFX = new SoundFX();

// Speech Synthesis Manager (TTS)
export class VoiceSpeaker {
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("cymbal_voice_muted");
        if (saved !== null) {
          this.isMuted = JSON.parse(saved);
        }
      } catch (e) {}
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem("cymbal_voice_muted", JSON.stringify(muted));
    } catch (e) {}
    if (muted && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  speak(text: string, onEnd?: () => void): void {
    if (this.isMuted || !isSpeechSynthesisSupported()) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop prior utterance

      const cleanText = text.replace(/[*_#`~[\]]/g, "").trim();
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05; // Slightly faster for responsive retail feel
      utterance.pitch = 1.0;

      // Select high quality English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel") ||
            v.name.includes("Karen") ||
            v.name.includes("Jenny")) &&
          v.lang.startsWith("en")
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
      if (onEnd) onEnd();
    }
  }

  stop(): void {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceSpeaker = new VoiceSpeaker();

/**
 * Fast Local Voice Command Parser
 * Identifies direct hands-free actions with high accuracy and speed.
 */
export function parseVoiceCommandLocally(
  rawTranscript: string,
  context: {
    items?: Array<{ id: string; name: string; cymbalAisle?: string; estimatedPrice?: number }>;
    currentTab?: string;
    totalCost?: number;
    budget?: number;
    guestCount?: number;
    iceLbsNeeded?: number;
    totalDrinks?: number;
    plans?: Array<{ id: string; title: string }>;
  } = {}
): VoiceCommandResult {
  const text = rawTranscript.trim().toLowerCase();

  // Strip wake words or conversational prefixes
  const cleaned = text
    .replace(/^(hey|hi|hello|ok|okay)?\s*(cymbal|cymbalmart|assistant|shopping assistant)[,\s]*/i, "")
    .replace(/^(please|can you|could you|would you|i want to|i'd like to|let's|lets)\s+/i, "")
    .trim();

  // 1. HELP / COMMAND LIST
  if (
    cleaned.match(/^(what can i say|help|voice commands|list commands|show help|what can you do)/i)
  ) {
    return {
      intent: "HELP",
      rawText: rawTranscript,
      spokenFeedback:
        "You can say things like 'Check off ice', 'Add guacamole for 5 dollars', 'Where is salsa?', 'Start in-store shopping', 'What is my total cost?', or 'Place order'.",
    };
  }

  // 2. IN-STORE SHOPPING MODE
  if (
    cleaned.match(/^(start|open|enter|launch|begin|go to)\s+(in-store|store|shopping)\s*(mode)?$/i) ||
    cleaned === "start shopping" ||
    cleaned === "in store mode"
  ) {
    return {
      intent: "OPEN_IN_STORE_MODE",
      rawText: rawTranscript,
      spokenFeedback: "Opening live In-Store Shopping Mode. I will guide your walk path through the aisles.",
    };
  }

  if (
    cleaned.match(/^(close|exit|leave|stop|done with|back from)\s+(in-store|store|shopping)\s*(mode)?$/i) ||
    cleaned === "exit store mode" ||
    cleaned === "back to planner"
  ) {
    return {
      intent: "CLOSE_IN_STORE_MODE",
      rawText: rawTranscript,
      spokenFeedback: "Exiting in-store mode and returning to the party planner.",
    };
  }

  // 3. CHECK / UNCHECK ALL
  if (cleaned.match(/^(check off all|check all|mark all (as )?bought|select all)/i)) {
    return {
      intent: "CHECK_ALL",
      rawText: rawTranscript,
      spokenFeedback: "All shopping list items have been marked as purchased.",
    };
  }

  if (cleaned.match(/^(uncheck all|reset all|clear all checks)/i)) {
    return {
      intent: "UNCHECK_ALL",
      rawText: rawTranscript,
      spokenFeedback: "All item checkboxes have been reset.",
    };
  }

  // 4. AISLE FINDER / WHERE IS ITEM
  const aisleMatch = cleaned.match(
    /^(where is|what aisle is|which aisle for|locate|find|where can i find|where are)\s+(the\s+)?(.+)$/i
  );
  if (aisleMatch) {
    const targetQuery = aisleMatch[3].trim().toLowerCase();
    const matchedItem = context.items?.find((i) =>
      i.name.toLowerCase().includes(targetQuery) ||
      targetQuery.includes(i.name.toLowerCase())
    );

    if (matchedItem) {
      const aisle = matchedItem.cymbalAisle || "Aisle 3 (Pantry)";
      return {
        intent: "FIND_ITEM_AISLE",
        rawText: rawTranscript,
        spokenFeedback: `${matchedItem.name} is located in ${aisle}.`,
        parameters: { itemId: matchedItem.id, itemName: matchedItem.name, aisle },
      };
    }
  }

  // 5. CHECK OFF SPECIFIC ITEM
  const checkMatch = cleaned.match(
    /^(check off|check|mark|cross off|bought|got|purchased|done with)\s+(the\s+)?(.+)$/i
  );
  if (checkMatch) {
    const targetQuery = checkMatch[3].trim().toLowerCase();
    // Exclude generic queries
    if (!targetQuery.includes("all") && !targetQuery.includes("mode") && !targetQuery.includes("tab")) {
      const matchedItem = context.items?.find((i) =>
        i.name.toLowerCase().includes(targetQuery) ||
        targetQuery.includes(i.name.toLowerCase())
      );
      if (matchedItem) {
        return {
          intent: "CHECK_ITEM",
          rawText: rawTranscript,
          spokenFeedback: `Checked off ${matchedItem.name}.`,
          parameters: { itemId: matchedItem.id, itemName: matchedItem.name, targetState: true },
        };
      }
    }
  }

  // 6. UNCHECK SPECIFIC ITEM
  const uncheckMatch = cleaned.match(
    /^(uncheck|unmark|remove check from|need|still need|haven't got)\s+(the\s+)?(.+)$/i
  );
  if (uncheckMatch) {
    const targetQuery = uncheckMatch[3].trim().toLowerCase();
    const matchedItem = context.items?.find((i) =>
      i.name.toLowerCase().includes(targetQuery) ||
      targetQuery.includes(i.name.toLowerCase())
    );
    if (matchedItem) {
      return {
        intent: "UNCHECK_ITEM",
        rawText: rawTranscript,
        spokenFeedback: `Unchecked ${matchedItem.name}.`,
        parameters: { itemId: matchedItem.id, itemName: matchedItem.name, targetState: false },
      };
    }
  }

  // 7. REMOVE / DELETE ITEM
  const removeMatch = cleaned.match(
    /^(remove|delete|trash|drop|get rid of)\s+(the\s+)?(.+)$/i
  );
  if (removeMatch) {
    const targetQuery = removeMatch[3].trim().toLowerCase();
    const matchedItem = context.items?.find((i) =>
      i.name.toLowerCase().includes(targetQuery) ||
      targetQuery.includes(i.name.toLowerCase())
    );
    if (matchedItem) {
      return {
        intent: "REMOVE_ITEM",
        rawText: rawTranscript,
        spokenFeedback: `Removed ${matchedItem.name} from the shopping list. Budget recalculated.`,
        parameters: { itemId: matchedItem.id, itemName: matchedItem.name },
      };
    }
  }

  // 8. ADD NEW ITEM (e.g. "Add 2 packs of tortilla chips for 6 dollars")
  const addMatch = cleaned.match(
    /^(add|include|put)\s+(.+)$/i
  );
  if (addMatch) {
    const fullContent = addMatch[2].trim();
    // Parse price if mentioned: "for 8 dollars" or "for $8" or "$8"
    let price = 8;
    const priceMatch = fullContent.match(/for\s+\$?(\d+(?:\.\d+)?)\s*(dollars)?|\$?(\d+(?:\.\d+)?)\s*dollars/i);
    if (priceMatch) {
      price = parseFloat(priceMatch[1] || priceMatch[3]);
    }

    // Clean price string from name
    const itemWithoutPrice = fullContent
      .replace(/for\s+\$?(\d+(?:\.\d+)?)\s*(dollars)?/i, "")
      .replace(/\$?(\d+(?:\.\d+)?)\s*dollars/i, "")
      .trim();

    // Parse quantity if mentioned: e.g. "2 packs of chips", "3 bags of ice"
    let qty = "1 pack";
    let itemName = itemWithoutPrice;
    const qtyMatch = itemWithoutPrice.match(/^(\d+)\s*(packs?|bags?|bottles?|gallons?|cases?|boxes?|cans?|lbs?|pieces?)(\s+of)?\s+(.+)$/i);
    if (qtyMatch) {
      qty = `${qtyMatch[1]} ${qtyMatch[2]}`;
      itemName = qtyMatch[4].trim();
    } else {
      const numMatch = itemWithoutPrice.match(/^(\d+)\s+(.+)$/i);
      if (numMatch) {
        qty = `${numMatch[1]} units`;
        itemName = numMatch[2].trim();
      }
    }

    if (itemName.length > 1) {
      // Capitalize first letter
      const formattedName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
      return {
        intent: "ADD_ITEM",
        rawText: rawTranscript,
        spokenFeedback: `Added ${formattedName}, quantity ${qty} for $${price.toFixed(2)} to your list. Budget updated.`,
        parameters: {
          name: formattedName,
          quantity: qty,
          estimatedPrice: price,
        },
      };
    }
  }

  // 9. PANTRY / ALREADY OWNED AT HOME
  const ownedMatch = cleaned.match(
    /^(i have|we have|mark as owned|already have|in my pantry|pantry check)\s+(the\s+)?(.+)$/i
  );
  if (ownedMatch) {
    const targetQuery = ownedMatch[3].replace(/at home|in pantry/i, "").trim().toLowerCase();
    const matchedItem = context.items?.find((i) =>
      i.name.toLowerCase().includes(targetQuery) ||
      targetQuery.includes(i.name.toLowerCase())
    );
    if (matchedItem) {
      return {
        intent: "TOGGLE_OWNED",
        rawText: rawTranscript,
        spokenFeedback: `Marked ${matchedItem.name} as already owned at home. Deducted $${matchedItem.estimatedPrice || 0} from your shopping total.`,
        parameters: { itemId: matchedItem.id, itemName: matchedItem.name, isOwned: true },
      };
    }
  }

  // 10. ADJUST GUEST COUNT / SCALE
  const guestMatch = cleaned.match(
    /^(change|set|scale|update|make)\s+guests?\s*(to|count to)?\s*(\d+)$/i
  ) || cleaned.match(/^(\d+)\s*guests?$/i);
  if (guestMatch) {
    const newCount = parseInt(guestMatch[3] || guestMatch[1], 10);
    if (newCount > 0 && newCount < 500) {
      return {
        intent: "SCALE_GUESTS",
        rawText: rawTranscript,
        spokenFeedback: `Scaled party plan to ${newCount} guests. Food quantities and budget totals have been recalculated.`,
        parameters: { guestCount: newCount },
      };
    }
  }

  // 11. TAB / VIEW NAVIGATION
  if (cleaned.match(/(go to|show|open|view)\s+(shopping list|review list|items|list view)/i)) {
    return {
      intent: "NAVIGATE_TAB",
      rawText: rawTranscript,
      spokenFeedback: "Navigating to the shopping list review.",
      parameters: { tab: "shopping" },
    };
  }

  if (cleaned.match(/(go to|show|open|view)\s+(checkout|refine|fulfillment|order)/i)) {
    return {
      intent: "NAVIGATE_TAB",
      rawText: rawTranscript,
      spokenFeedback: "Navigating to refine and checkout view.",
      parameters: { tab: "refine_checkout" },
    };
  }

  if (cleaned.match(/(go to|show|open|view)\s+(budget|budget alignment|analytics|savings)/i)) {
    return {
      intent: "NAVIGATE_TAB",
      rawText: rawTranscript,
      spokenFeedback: "Navigating to the budget alignment dashboard.",
      parameters: { tab: "budget" },
    };
  }

  if (cleaned.match(/(go to|show|open|view)\s+(calculator|party math|portions|drinks calculator)/i)) {
    return {
      intent: "NAVIGATE_TAB",
      rawText: rawTranscript,
      spokenFeedback: "Opening the party portion and beverage calculator.",
      parameters: { tab: "calculator" },
    };
  }

  if (cleaned.match(/(go to|show|open|view)\s+(timeline|prep schedule|schedule|prep tasks)/i)) {
    return {
      intent: "NAVIGATE_TAB",
      rawText: rawTranscript,
      spokenFeedback: "Opening the event prep timeline schedule.",
      parameters: { tab: "timeline" },
    };
  }

  // 12. BUDGET & PORTION INQUIRIES
  if (
    cleaned.match(/(what is my total|how much is (the )?total|current total|total cost|how much will this cost)/i)
  ) {
    const total = context.totalCost !== undefined ? `$${context.totalCost.toFixed(2)}` : "your list total";
    const budget = context.budget !== undefined ? `$${context.budget}` : "";
    const perGuest = context.totalCost && context.guestCount ? `That comes to $${(context.totalCost / context.guestCount).toFixed(2)} per guest.` : "";
    return {
      intent: "QUERY_BUDGET",
      rawText: rawTranscript,
      spokenFeedback: `Your current estimated shopping total is ${total} against your target budget of ${budget}. ${perGuest}`,
    };
  }

  if (cleaned.match(/(how much ice|ice needed|ice requirements|how many bags of ice)/i)) {
    const iceLbs = context.iceLbsNeeded || Math.ceil((context.guestCount || 20) * 1.5);
    return {
      intent: "QUERY_PORTIONS",
      rawText: rawTranscript,
      spokenFeedback: `Based on ${context.guestCount || 20} guests, you will need approximately ${iceLbs} pounds of ice (around ${Math.ceil(iceLbs / 10)} ten-pound bags) for chilling drinks and serving.`,
    };
  }

  if (cleaned.match(/(how many drinks|drink count|total drinks|beverage formula)/i)) {
    const drinks = context.totalDrinks || (context.guestCount || 20) * 4;
    return {
      intent: "QUERY_PORTIONS",
      rawText: rawTranscript,
      spokenFeedback: `For ${context.guestCount || 20} guests over 4 hours, we calculate a total of ${drinks} beverage servings needed.`,
    };
  }

  // 13. FULFILLMENT & CHECKOUT
  if (cleaned.match(/(choose|select|set to|switch to)\s+(curbside|pickup)/i)) {
    return {
      intent: "CHOOSE_FULFILLMENT",
      rawText: rawTranscript,
      spokenFeedback: "Selected Free Curbside Pickup at CymbalMart Supercenter.",
      parameters: { method: "pickup" },
    };
  }

  if (cleaned.match(/(choose|select|set to|switch to)\s+(delivery|doorstep delivery)/i)) {
    return {
      intent: "CHOOSE_FULFILLMENT",
      rawText: rawTranscript,
      spokenFeedback: "Selected CymbalMart Same-Day Express Delivery.",
      parameters: { method: "delivery" },
    };
  }

  if (cleaned.match(/^(place order|confirm order|finalize order|checkout now|submit order)$/i)) {
    return {
      intent: "PLACE_ORDER",
      rawText: rawTranscript,
      spokenFeedback: "Order confirmed! Your CymbalMart party fulfillment is locked and scheduled. Time to celebrate!",
    };
  }

  // 14. CREATE NEW PARTY
  if (cleaned.match(/(create|start|plan)\s+(a\s+)?(new\s+)?party/i)) {
    return {
      intent: "OPEN_PARTY_CREATOR",
      rawText: rawTranscript,
      spokenFeedback: "Opening the AI Party Definition and Planner wizard.",
    };
  }

  // 15. SWITCH ACTIVE PARTY PLAN
  const switchMatch = cleaned.match(/(switch to|select|load|open)\s+(party|plan)?\s*(.+)$/i);
  if (switchMatch && context.plans) {
    const targetTitle = switchMatch[3].trim().toLowerCase();
    const matchedPlan = context.plans.find((p) =>
      p.title.toLowerCase().includes(targetTitle)
    );
    if (matchedPlan) {
      return {
        intent: "SWITCH_PLAN",
        rawText: rawTranscript,
        spokenFeedback: `Switched active party plan to ${matchedPlan.title}.`,
        parameters: { planId: matchedPlan.id, planTitle: matchedPlan.title },
      };
    }
  }

  // 16. SEARCH / FILTER
  const filterMatch = cleaned.match(/(filter by|show only|search for)\s+(.+)$/i);
  if (filterMatch) {
    const query = filterMatch[2].trim();
    return {
      intent: "SEARCH_FILTER",
      rawText: rawTranscript,
      spokenFeedback: `Filtering shopping list for ${query}.`,
      parameters: { query },
    };
  }

  if (cleaned.match(/(clear filter|clear search|show all items|reset filters)/i)) {
    return {
      intent: "CLEAR_FILTER",
      rawText: rawTranscript,
      spokenFeedback: "Showing all items on the shopping list.",
    };
  }

  // 17. FALLBACK TO AI QUERY
  return {
    intent: "AI_QUERY",
    rawText: rawTranscript,
    spokenFeedback: "Processing your request with the CymbalMart AI Assistant...",
    parameters: { query: rawTranscript },
  };
}
