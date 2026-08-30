import React, { useState } from "react";
import { X, Sparkles, Wand2, Users, DollarSign, Clock, MapPin, Check, AlertCircle, RefreshCw, BookmarkCheck } from "lucide-react";
import { generatePartyPlanAPI } from "../services/api";
import { PartyPlan } from "../types";
import { SAMPLE_PARTY_TEMPLATES } from "../data/templates";

interface PartyCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: (plan: PartyPlan) => void;
}

const INSPIRATION_CHIPS = [
  { label: "🌮 Taco Bar & Margaritas (20 guests)", title: "Cinco Fiesta Taco Bar", type: "Dinner Party", theme: "Mexican Cantina & DIY Street Tacos", guests: 20, adults: 16, kids: 4, budget: 250, hours: 4, time: "Evening / Dinner", venue: "Backyard Patio", dietary: ["Gluten-Free Friendly", "Vegetarian Options"] },
  { label: "🍷 Golden Hour Charcuterie (16 guests)", title: "Golden Hour Cocktail & Grazing Soirée", type: "Cocktail Party", theme: "Modern Chic Rooftop & Grazing Table", guests: 16, adults: 16, kids: 0, budget: 320, hours: 3, time: "Evening / Dinner", venue: "Indoor Living Room & Terrace", dietary: ["Nut-Free Options", "Vegetarian Board"] },
  { label: "🦸 Superhero Kids Birthday (22 guests)", title: "Superhero Academy Birthday Bash", type: "Kids Birthday Party", theme: "Comic Book Superhero Academy & Power Station", guests: 22, adults: 10, kids: 12, budget: 220, hours: 3, time: "Afternoon", venue: "Neighborhood Park Pavilion", dietary: ["Nut-Free (Strict)", "Kid-Friendly"] },
  { label: "🍕 Woodfired Pizza & Craft Beer (18 guests)", title: "Artisan Pizza & Brews Night", type: "Casual Gathering", theme: "DIY Gourmet Pizza Making & Craft Beer Flights", guests: 18, adults: 18, kids: 0, budget: 280, hours: 4, time: "Evening / Dinner", venue: "Backyard Kitchen", dietary: ["Vegetarian Options"] },
  { label: "🥐 Chic Garden Brunch & Mimosas (14 guests)", title: "Sunny Botanical Garden Brunch", type: "Brunch", theme: "Pastel Florals, Croissant Bar & Fresh Juice Spritzes", guests: 14, adults: 14, kids: 0, budget: 200, hours: 3, time: "Morning / Brunch", venue: "Sunroom & Garden", dietary: ["Vegetarian", "Dairy-Free Options"] },
  { label: "🎮 Retro Arcade Game Night (12 guests)", title: "8-Bit Retro Gaming & Snack Attack", type: "Game Night", theme: "Neon 80s/90s Arcade & Ultimate Finger Foods", guests: 12, adults: 12, kids: 0, budget: 180, hours: 5, time: "Late Night", venue: "Basement Lounge", dietary: ["Kid-Friendly"] },
];

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Nut-Free (Strict)",
  "Dairy-Free",
  "Halal",
  "Kosher",
  "Non-Alcoholic Focus",
  "Kid-Friendly",
];

const EVENT_TYPES = [
  "Birthday Party",
  "Dinner Party",
  "Cocktail Party",
  "BBQ / Cookout",
  "Kids Birthday",
  "Brunch Gathering",
  "Game Night / Watch Party",
  "Baby / Bridal Shower",
  "Housewarming",
  "Holiday / Seasonal Bash",
];

const TIME_OPTIONS = [
  "Morning / Brunch",
  "Afternoon",
  "Evening / Dinner",
  "Late Night",
];

export const PartyCreatorModal: React.FC<PartyCreatorModalProps> = ({
  isOpen,
  onClose,
  onPlanCreated,
}) => {
  const [activeTab, setActiveTab] = useState<"ai-wizard" | "templates">("ai-wizard");

  // Form State
  const [title, setTitle] = useState("Summer Twilight Backyard Soirée");
  const [eventType, setEventType] = useState("Dinner Party");
  const [theme, setTheme] = useState("Rustic Italian Al Fresco Pasta & Spritzes");
  const [adultCount, setAdultCount] = useState(16);
  const [kidCount, setKidCount] = useState(2);
  const [durationHours, setDurationHours] = useState(4);
  const [timeOfDay, setTimeOfDay] = useState("Evening / Dinner");
  const [budget, setBudget] = useState(300);
  const [venue, setVenue] = useState("Backyard Patio");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([
    "Vegetarian",
    "Gluten-Free",
  ]);
  const [notes, setNotes] = useState(
    "Looking for a relaxed vibe with fresh herbs, string lights, simple appetizers, and a signature spritz drink."
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState(0);

  if (!isOpen) return null;

  const totalGuests = adultCount + kidCount;

  const handleApplyInspiration = (chip: typeof INSPIRATION_CHIPS[0]) => {
    setTitle(chip.title);
    setEventType(chip.type);
    setTheme(chip.theme);
    setAdultCount(chip.adults);
    setKidCount(chip.kids);
    setBudget(chip.budget);
    setDurationHours(chip.hours);
    setTimeOfDay(chip.time);
    setVenue(chip.venue);
    setDietaryRestrictions(chip.dietary);
    setNotes(`Planning a memorable ${chip.theme.toLowerCase()} for ${chip.guests} people.`);
  };

  const handleToggleDietary = (flag: string) => {
    setDietaryRestrictions((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setLoadingPhase(0);

    const phaseTimer1 = setTimeout(() => setLoadingPhase(1), 1800);
    const phaseTimer2 = setTimeout(() => setLoadingPhase(2), 3800);
    const phaseTimer3 = setTimeout(() => setLoadingPhase(3), 5800);

    try {
      const plan = await generatePartyPlanAPI({
        title: title.trim() || `${theme} Party`,
        eventType,
        theme: theme.trim() || "Festive Celebration",
        guestCount: totalGuests,
        adultCount,
        kidCount,
        durationHours,
        timeOfDay,
        budget: Number(budget) || 250,
        dietaryRestrictions,
        venue: venue.trim() || "Home",
        notes: notes.trim(),
      });

      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      clearTimeout(phaseTimer3);
      onPlanCreated(plan);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate party plan with AI. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSampleTemplate = (template: PartyPlan) => {
    // Clone with fresh ID
    const cloned: PartyPlan = {
      ...template,
      id: `party-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onPlanCreated(cloned);
    onClose();
  };

  const phases = [
    "🧠 Calculating drink portions, ice formulas, and food quantities...",
    "🛒 Building categorized shopping checklist and assigning optimal stores...",
    "💰 Cross-referencing pricing against your target budget...",
    "✨ Curating signature cocktail, theme vibe notes, and prep schedule...",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        id="party-creator-modal-container"
        className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
                Task 1: Define Event Details
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 font-normal border border-amber-400/20">
                  CymbalMart AI Agent
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-400">
                Set party type, theme, budget, guest count, and special requests for a curated shopping plan.
              </p>
            </div>
          </div>

          <button
            id="close-party-creator-modal-btn"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: AI Wizard vs Sample Templates */}
        <div className="px-6 pt-3 pb-2 border-b border-stone-800/80 bg-stone-900/50 flex gap-2">
          <button
            id="tab-ai-wizard-btn"
            onClick={() => setActiveTab("ai-wizard")}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "ai-wizard"
                ? "bg-amber-500 text-stone-950 shadow-sm"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Custom AI Generation</span>
          </button>
          <button
            id="tab-templates-btn"
            onClick={() => setActiveTab("templates")}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "templates"
                ? "bg-amber-500 text-stone-950 shadow-sm"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Pre-Built Sample Parties</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-200">
          {activeTab === "templates" ? (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-stone-400">
                Choose a pre-calculated, professionally organized sample party to load immediately into your workspace:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SAMPLE_PARTY_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-4 rounded-xl border border-stone-800 bg-stone-850 hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between group"
                    onClick={() => handleSelectSampleTemplate(tmpl)}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {tmpl.eventType}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          ${tmpl.budgetSummary.totalEstimatedCost} est.
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-white group-hover:text-amber-300 transition-colors font-['Outfit']">
                        {tmpl.title}
                      </h3>
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                        {tmpl.themeDetails.vibeDescription}
                      </p>

                      <div className="flex flex-wrap gap-2 text-[11px] text-stone-400 mt-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-stone-400" /> {tmpl.guestCount} Guests
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" /> {tmpl.durationHours}h ({tmpl.timeOfDay})
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400" /> {tmpl.venue}
                        </span>
                      </div>
                    </div>

                    <button
                      id={`select-sample-${tmpl.id}`}
                      className="mt-4 w-full py-2 px-3 rounded-lg bg-stone-800 group-hover:bg-amber-500 group-hover:text-stone-950 text-stone-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Load This Party Plan</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleGeneratePlan} className="space-y-6">
              {/* Quick Inspiration Chips */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  ⚡ Quick Starter Inspirations (Tap to autofill)
                </label>
                <div className="flex flex-wrap gap-2">
                  {INSPIRATION_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyInspiration(chip)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 border border-stone-700/80 transition-colors text-left"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Event Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Event Title / Occasion *
                  </label>
                  <input
                    id="input-party-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Maya's 30th Birthday Soirée"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Event Category
                  </label>
                  <select
                    id="input-event-type"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Theme & Vibe */}
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Theme, Aesthetic or Food Concept *
                </label>
                <input
                  id="input-party-theme"
                  type="text"
                  required
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. Italian Al Fresco Pasta & Spritzes, Retro 80s Neon, Glow BBQ, Garden High Tea"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Headcounts & Portions Calculation inputs */}
              <div className="p-4 rounded-xl bg-stone-850 border border-stone-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                    <Users className="w-4 h-4" />
                    <span>Guests & Duration (Feeds Party Portion Math)</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono font-bold">
                    Total: {totalGuests} Guests
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">
                      Adults (18+)
                    </label>
                    <input
                      id="input-adult-count"
                      type="number"
                      min="1"
                      max="150"
                      value={adultCount}
                      onChange={(e) => setAdultCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-sm text-stone-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">
                      Kids / Teens
                    </label>
                    <input
                      id="input-kid-count"
                      type="number"
                      min="0"
                      max="100"
                      value={kidCount}
                      onChange={(e) => setKidCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-sm text-stone-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">
                      Duration (Hours)
                    </label>
                    <input
                      id="input-duration-hours"
                      type="number"
                      min="1"
                      max="12"
                      value={durationHours}
                      onChange={(e) => setDurationHours(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-sm text-stone-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">
                      Time of Day
                    </label>
                    <select
                      id="input-time-of-day"
                      value={timeOfDay}
                      onChange={(e) => setTimeOfDay(e.target.value)}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Budget & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      Target Shopping Budget ($ USD)
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ${budget} ({totalGuests > 0 ? `$${(budget / totalGuests).toFixed(1)}/guest` : ""})
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="input-party-budget"
                      type="number"
                      min="20"
                      max="5000"
                      step="10"
                      value={budget}
                      onChange={(e) => setBudget(Math.max(20, parseInt(e.target.value) || 50))}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    Venue / Setting
                  </label>
                  <input
                    id="input-party-venue"
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Backyard Patio, Living Room, Park Pavilion, Rented Hall"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Dietary Flags */}
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-2">
                  Dietary Preferences & Accommodations
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((flag) => {
                    const isSelected = dietaryRestrictions.includes(flag);
                    return (
                      <button
                        key={flag}
                        type="button"
                        onClick={() => handleToggleDietary(flag)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/50 font-medium"
                            : "bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-600"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                        <span>{flag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Additional Notes, Special Must-Haves, or Instructions
                </label>
                <textarea
                  id="input-party-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Want a signature mocktail, keep glass away from the pool, need 1 vegan main..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Planning Error:</span> {error}
                  </div>
                </div>
              )}

              {/* Loading State Animation */}
              {isLoading && (
                <div className="p-4 rounded-xl bg-stone-850 border border-amber-500/30 space-y-3 animate-pulse">
                  <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Shopping Agent is formulating your party plan...</span>
                  </div>
                  <p className="text-xs text-stone-300 transition-all font-mono">
                    {phases[loadingPhase % phases.length]}
                  </p>
                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full animate-progress" />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg text-sm text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="generate-party-plan-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-sm transition-all shadow-md flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Party Plan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Shopping Plan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
