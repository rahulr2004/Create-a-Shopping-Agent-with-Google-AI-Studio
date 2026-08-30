import React, { useState } from "react";
import {
  Calculator,
  Wine,
  Beef,
  Sparkles,
  CupSoda,
  Utensils,
  RefreshCw,
  Plus,
  Zap,
} from "lucide-react";
import { PartyPlan, ShoppingItem } from "../types";

interface PartyCalculatorViewProps {
  plan: PartyPlan;
  onUpdatePlan: (updated: PartyPlan) => void;
  onOpenAgentWithPrompt: (promptText: string) => void;
}

export const PartyCalculatorView: React.FC<PartyCalculatorViewProps> = ({
  plan,
  onUpdatePlan,
  onOpenAgentWithPrompt,
}) => {
  const [calcGuests, setCalcGuests] = useState(plan.guestCount || 20);
  const [calcHours, setCalcHours] = useState(plan.durationHours || 4);
  const [drinkIntensity, setDrinkIntensity] = useState<"light" | "standard" | "festive">("standard");
  const [beerPct, setBeerPct] = useState(40);
  const [winePct, setWinePct] = useState(30);
  const [cocktailPct, setCocktailPct] = useState(30);
  const [isOutdoorSummer, setIsOutdoorSummer] = useState(false);
  const [mealStyle, setMealStyle] = useState<"heavy-dinner" | "cocktail-bites" | "bbq-cookout" | "brunch">("heavy-dinner");

  // Party Math Formulas
  // Drinks: hour 1 = 2 drinks/person, subsequent hours = 1 drink/person
  const drinkMultiplier = drinkIntensity === "light" ? 0.75 : drinkIntensity === "festive" ? 1.3 : 1.0;
  const totalDrinksNeeded = Math.round(
    calcGuests * (2 + Math.max(0, calcHours - 1) * 1) * drinkMultiplier
  );

  // Split calculations
  const beerServings = Math.round((totalDrinksNeeded * beerPct) / 100);
  const beerCases = Math.ceil(beerServings / 24); // 24-pack

  const wineGlasses = Math.round((totalDrinksNeeded * winePct) / 100);
  const wineBottles = Math.ceil(wineGlasses / 5); // 5 glasses per 750ml bottle

  const cocktailServings = Math.round((totalDrinksNeeded * cocktailPct) / 100);
  const liquorBottles750ml = Math.ceil(cocktailServings / 16); // 16 cocktails per 750ml
  const mixerLiters = Math.ceil((cocktailServings * 4) / 33.8); // ~4 oz mixer per drink

  // Ice math: 1.5 lbs/person indoors, 2.5 lbs/person outdoors
  const iceLbs = Math.round(calcGuests * (isOutdoorSummer ? 2.5 : 1.5));
  const iceBags10lb = Math.ceil(iceLbs / 10);

  // Food math based on meal style
  const proteinLbs =
    mealStyle === "heavy-dinner"
      ? (calcGuests * 0.5).toFixed(1)
      : mealStyle === "bbq-cookout"
      ? (calcGuests * 0.65).toFixed(1)
      : mealStyle === "cocktail-bites"
      ? (calcGuests * 0.25).toFixed(1)
      : (calcGuests * 0.35).toFixed(1);

  const appetizerBites =
    mealStyle === "cocktail-bites"
      ? calcGuests * 10
      : calcGuests * 4;

  const platesNeeded = Math.ceil(calcGuests * 2);
  const cupsNeeded = Math.ceil(calcGuests * 1.5);
  const napkinsNeeded = Math.ceil(calcGuests * 3);

  const handleApplyToPlan = () => {
    // Add or update ice item
    let updatedItems = [...plan.items];
    const existingIceIndex = updatedItems.findIndex((i) => i.category === "Ice & Coolers");

    if (existingIceIndex >= 0) {
      updatedItems[existingIceIndex] = {
        ...updatedItems[existingIceIndex],
        quantity: `${iceBags10lb} bags (${iceLbs} lbs)`,
        estimatedPrice: iceBags10lb * 3.5,
      };
    } else {
      updatedItems.push({
        id: `calc-ice-${Date.now()}`,
        name: "Party Ice Bags",
        category: "Ice & Coolers",
        quantity: `${iceBags10lb} 10-lb bags (${iceLbs} lbs total)`,
        estimatedPrice: iceBags10lb * 3.5,
        recommendedStore: "Local Supermarket",
        priority: "must-have",
        isChecked: false,
        isOwned: false,
        shoppingNotes: "Calculated via Party Math Sandbox.",
      });
    }

    onUpdatePlan({
      ...plan,
      guestCount: calcGuests,
      durationHours: calcHours,
      portionGuide: {
        totalDrinkServings: totalDrinksNeeded,
        iceLbsNeeded: iceLbs,
        appetizerPieces: appetizerBites,
        mainProteinLbs: parseFloat(proteinLbs),
        notes: `Calculated for ${calcGuests} guests over ${calcHours} hours (${mealStyle}).`,
      },
      items: updatedItems,
      budgetSummary: {
        ...plan.budgetSummary,
        totalEstimatedCost: updatedItems.reduce((acc, i) => (i.isOwned ? acc : acc + (i.estimatedPrice || 0)), 0),
      },
      updatedAt: new Date().toISOString(),
    });

    alert("✅ Party portions and Ice calculations synced to your shopping list!");
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              ALGORITHM & QUANTITY FORMULAS
            </span>
            <h2 className="text-xl font-bold text-white font-['Outfit'] mt-1">
              Party Portions & Drinks Math Sandbox
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
              Tweak parameters to eliminate the guesswork of running out of ice, drinks, or main courses.
            </p>
          </div>

          <button
            id="sync-portions-to-list-btn"
            onClick={handleApplyToPlan}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md self-start sm:self-auto"
          >
            <Zap className="w-4 h-4" />
            <span>Sync Quantities to List</span>
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1 flex justify-between">
              <span>Total Guests</span>
              <span className="text-amber-400 font-mono">{calcGuests} People</span>
            </label>
            <input
              type="range"
              min="4"
              max="100"
              value={calcGuests}
              onChange={(e) => setCalcGuests(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1 flex justify-between">
              <span>Duration</span>
              <span className="text-amber-400 font-mono">{calcHours} Hours</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={calcHours}
              onChange={(e) => setCalcHours(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Drinking Pace / Intensity
            </label>
            <select
              value={drinkIntensity}
              onChange={(e) => setDrinkIntensity(e.target.value as any)}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200"
            >
              <option value="light">Light (0.75x - Chill family / tea party)</option>
              <option value="standard">Standard (1.0x - Social dinner & cocktail)</option>
              <option value="festive">Festive (1.3x - Big celebration / late night)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drink Breakdown Cards */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Wine className="w-5 h-5 text-amber-400" />
            <span>Beverage & Bar Breakdown (~{totalDrinksNeeded} Total Servings)</span>
          </h3>

          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-400 flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isOutdoorSummer}
                onChange={(e) => setIsOutdoorSummer(e.target.checked)}
                className="accent-amber-500"
              />
              <span>☀️ Outdoor / Warm Weather (+60% Ice)</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Beer & Seltzers */}
          <div className="p-4 rounded-xl bg-stone-850 border border-stone-800 space-y-1">
            <div className="text-xs font-semibold text-amber-300">Beer / Seltzers ({beerPct}%)</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">
              {beerServings} Cans
            </div>
            <div className="text-xs text-stone-400 font-mono">
              ≈ {beerCases} × 24-packs (or {Math.ceil(beerServings / 12)} 12-packs)
            </div>
          </div>

          {/* Wine */}
          <div className="p-4 rounded-xl bg-stone-850 border border-stone-800 space-y-1">
            <div className="text-xs font-semibold text-purple-300">Wine / Champagne ({winePct}%)</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">
              {wineBottles} Bottles
            </div>
            <div className="text-xs text-stone-400 font-mono">
              ≈ {wineGlasses} standard 5oz glasses
            </div>
          </div>

          {/* Spirits & Cocktails */}
          <div className="p-4 rounded-xl bg-stone-850 border border-stone-800 space-y-1">
            <div className="text-xs font-semibold text-cyan-300">Spirits & Cocktails ({cocktailPct}%)</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">
              {liquorBottles750ml} Bottles
            </div>
            <div className="text-xs text-stone-400 font-mono">
              + {mixerLiters}L mixers (sodas, tonic, juice)
            </div>
          </div>

          {/* Ice Calculation */}
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-1">
            <div className="text-xs font-semibold text-cyan-300">Party Ice Needed</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-200">
              {iceLbs} lbs Ice
            </div>
            <div className="text-xs text-cyan-300/80 font-mono">
              ≈ {iceBags10lb} × 10-lb bags (1 glass, {iceBags10lb - 1} cooler)
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            onOpenAgentWithPrompt(
              `Can you write a step-by-step batch recipe for ${totalDrinksNeeded} total drinks for our ${plan.themeDetails.signatureDrinkName}?`
            )
          }
          className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1 mt-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask Agent for Big-Batch Signature Cocktail Recipe & Pitcher Ratios</span>
        </button>
      </div>

      {/* Food & Tableware Formulas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Food Portion Guide */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Beef className="w-5 h-5 text-amber-400" />
              <span>Food & Protein Math</span>
            </h3>
            <select
              value={mealStyle}
              onChange={(e) => setMealStyle(e.target.value as any)}
              className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-lg px-2 py-1"
            >
              <option value="heavy-dinner">Full Dinner Buffet</option>
              <option value="bbq-cookout">BBQ / Cookout Meats</option>
              <option value="cocktail-bites">Heavy Appetizers / Tapas</option>
              <option value="brunch">Brunch Spread</option>
            </select>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-stone-850 border border-stone-800">
              <span className="text-stone-300">Raw Meat / Protein Weight:</span>
              <span className="font-bold text-white font-mono">{proteinLbs} lbs total</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-stone-850 border border-stone-800">
              <span className="text-stone-300">Appetizer / Finger Food Bites:</span>
              <span className="font-bold text-white font-mono">{appetizerBites} pieces</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-stone-850 border border-stone-800">
              <span className="text-stone-300">Salad / Side Dishes:</span>
              <span className="font-bold text-white font-mono">
                {Math.ceil(calcGuests * 0.35)} lbs cooked grains/greens
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-stone-850 border border-stone-800">
              <span className="text-stone-300">Dessert Portions:</span>
              <span className="font-bold text-white font-mono">
                {Math.ceil(calcGuests * 1.2)} sweet units/cupcakes
              </span>
            </div>
          </div>
        </div>

        {/* Tableware & Disposables Guide */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Utensils className="w-5 h-5 text-amber-400" />
            <span>Tableware Multipliers</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-stone-850 border border-stone-800">
              <span className="text-stone-300">Disposable Dinner & Dessert Plates:</span>
              <span className="font-bold text-white font-mono">{platesNeeded} plates (pack of {Math.ceil(platesNeeded / 25) * 25})</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-stone-850 border border-stone-800">
              <span className="text-stone-300">Drink Glasses / Cups:</span>
              <span className="font-bold text-white font-mono">{cupsNeeded} cups (pack of {Math.ceil(cupsNeeded / 20) * 20})</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-stone-850 border border-stone-800">
              <span className="text-stone-300">Cocktail & Dinner Napkins:</span>
              <span className="font-bold text-white font-mono">{napkinsNeeded} napkins</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-stone-850 border border-stone-800">
              <span className="text-stone-300">Cutlery Sets (Forks, Knives, Spoons):</span>
              <span className="font-bold text-white font-mono">{Math.ceil(calcGuests * 1.5)} sets</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
