import React, { useState, useMemo } from "react";
import {
  PartyPlan,
  ShoppingItem,
  CymbalFulfillment,
} from "../types";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Store,
  Truck,
  ShoppingBag,
  Sliders,
  Check,
  RotateCcw,
  ArrowRight,
  Printer,
  Share2,
  CalendarCheck,
  Download,
  DollarSign,
  Tag,
  Clock,
  MapPin,
  ChevronRight,
  Info,
} from "lucide-react";
import confetti from "canvas-confetti";

interface RefineCheckoutViewProps {
  plan: PartyPlan;
  onUpdatePlan: (updated: PartyPlan) => void;
  onOpenShoppingMode: () => void;
  onOpenExportModal: () => void;
  onTriggerAgentPrompt: (promptText: string) => void;
}

const CYMBAL_STORES = [
  "CymbalMart Supercenter #1042 (Metro North)",
  "CymbalMart Fresh Market #208 (Westside Plaza)",
  "CymbalMart Express #512 (Downtown Central)",
  "CymbalMart Supercenter #318 (Oakridge Blvd)",
];

const TIME_SLOTS = [
  "Today • 12:00 PM – 2:00 PM (Express)",
  "Today • 3:00 PM – 5:00 PM",
  "Today • 6:00 PM – 8:00 PM",
  "Tomorrow • 9:00 AM – 11:00 AM",
  "Tomorrow • 2:00 PM – 4:00 PM",
];

export const RefineCheckoutView: React.FC<RefineCheckoutViewProps> = ({
  plan,
  onUpdatePlan,
  onOpenShoppingMode,
  onOpenExportModal,
  onTriggerAgentPrompt,
}) => {
  // Fulfillment options
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"pickup" | "delivery" | "in-store">(
    plan.fulfillment?.method || "pickup"
  );
  const [selectedStore, setSelectedStore] = useState<string>(
    plan.fulfillment?.storeLocation || CYMBAL_STORES[0]
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(
    plan.fulfillment?.timeSlot || TIME_SLOTS[1]
  );
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    plan.fulfillment?.deliveryAddress || plan.venue || "1248 Evergreen Terrace"
  );
  const [specialInstructions, setSpecialInstructions] = useState<string>(
    plan.fulfillment?.specialInstructions || "Please ring bell and leave chilled bags in shade."
  );

  // Portion Scaling slider (1.0 = standard, 0.85 = light, 1.2 = heavy)
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);

  // Active Constraint Filter Tab
  const [activeConstraintTab, setActiveConstraintTab] = useState<"dietary" | "pantry" | "portions">("dietary");

  // Order Confirmation State
  const [isOrderPlaced, setIsOrderPlaced] = useState<boolean>(
    Boolean(plan.fulfillment?.isConfirmed)
  );

  // Calculations
  const pantryItems = plan.items.filter((i) => i.isOwned);
  const storeItemsToBuy = plan.items.filter((i) => !i.isOwned);

  const rawSubtotal = storeItemsToBuy.reduce(
    (sum, i) => sum + (i.estimatedPrice || 0) * portionMultiplier,
    0
  );

  const rollbackSavingsTotal = storeItemsToBuy.reduce(
    (sum, i) => sum + (i.rollbackSavings || (i.brandType === "Cymbal Choice" ? 2.5 : 0)),
    0
  );

  const pantrySavingsTotal = pantryItems.reduce(
    (sum, i) => sum + (i.estimatedPrice || 0),
    0
  );

  const estimatedTax = rawSubtotal * 0.075;
  const deliveryFee = fulfillmentMethod === "delivery" ? (rawSubtotal > 35 ? 0 : 5.99) : 0;
  const grandTotal = Math.max(0, rawSubtotal + estimatedTax + deliveryFee);

  // Toggle "I already have this in pantry"
  const handleTogglePantryOwned = (itemId: string) => {
    const updatedItems = plan.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, isOwned: !item.isOwned };
      }
      return item;
    });

    onUpdatePlan({
      ...plan,
      items: updatedItems,
      budgetSummary: {
        ...plan.budgetSummary,
        totalEstimatedCost: updatedItems.reduce((acc, i) => (i.isOwned ? acc : acc + i.estimatedPrice), 0),
      },
      updatedAt: new Date().toISOString(),
    });
  };

  // 1-Click Dietary Swap
  const handleApplyDietarySwap = (itemId: string, newName: string, notes: string) => {
    const updatedItems = plan.items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          name: newName,
          shoppingNotes: notes,
          dietaryFlags: [...(item.dietaryFlags || []), "Dietary-Swapped"],
        };
      }
      return item;
    });

    onUpdatePlan({
      ...plan,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Finalize & Place CymbalMart Order
  const handlePlaceOrder = () => {
    const confirmationNum = `CYMBAL-PARTY-${Math.floor(100000 + Math.random() * 900000)}`;
    const fulfillmentData: CymbalFulfillment = {
      method: fulfillmentMethod,
      storeLocation: selectedStore,
      timeSlot: selectedTimeSlot,
      isConfirmed: true,
      confirmationNumber: confirmationNum,
      deliveryAddress: fulfillmentMethod === "delivery" ? deliveryAddress : undefined,
      specialInstructions,
      finalizedAt: new Date().toISOString(),
    };

    onUpdatePlan({
      ...plan,
      fulfillment: fulfillmentData,
      cujStep: "checkout",
      updatedAt: new Date().toISOString(),
    });

    setIsOrderPlaced(true);
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="space-y-6">
      {/* CUJ Task 3 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              Task 3: Refine & Checkout
            </span>
            <span className="text-xs text-stone-400">
              Finalize event constraints and CymbalMart order
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] mt-1">
            {isOrderPlaced ? "🎉 Event Plan Finalized & Order Confirmed!" : "Refine Plan & CymbalMart Checkout"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
            Check off pantry items you own, customize dietary preferences, and schedule your CymbalMart store run.
          </p>
        </div>

        {isOrderPlaced && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenExportModal}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 border border-stone-700"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Event Pack</span>
            </button>
            <button
              onClick={onOpenShoppingMode}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>In-Store Walk Path</span>
            </button>
          </div>
        )}
      </div>

      {/* Order Confirmed Banner (If finalized) */}
      {isOrderPlaced && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 shadow-xl animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-500 text-stone-950 font-black shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    {plan.fulfillment?.confirmationNumber || "CYMBAL-PARTY-849201"}
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">
                    Order Ready For {fulfillmentMethod === "pickup" ? "Curbside Pickup" : fulfillmentMethod === "delivery" ? "Doorstep Delivery" : "In-Store Run"}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  CymbalMart Shopping Order is Locked & Scheduled
                </h3>
                <p className="text-xs text-stone-300 mt-1">
                  <strong>{selectedStore}</strong> • Scheduled slot: <strong>{selectedTimeSlot}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsOrderPlaced(false)}
                className="text-xs text-stone-400 hover:text-stone-200 px-3 py-1.5 rounded-lg border border-stone-800 bg-stone-900"
              >
                Modify Order Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Constraint Adjusters (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sub-nav for constraints */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-2 flex items-center gap-1 shadow-sm">
            <button
              onClick={() => setActiveConstraintTab("dietary")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeConstraintTab === "dietary"
                  ? "bg-amber-500 text-stone-950 shadow-sm"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Dietary & Allergies</span>
            </button>

            <button
              onClick={() => setActiveConstraintTab("pantry")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeConstraintTab === "pantry"
                  ? "bg-amber-500 text-stone-950 shadow-sm"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Pantry / Have at Home ({pantryItems.length})</span>
            </button>

            <button
              onClick={() => setActiveConstraintTab("portions")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeConstraintTab === "portions"
                  ? "bg-amber-500 text-stone-950 shadow-sm"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Portion Buffers</span>
            </button>
          </div>

          {/* TAB 1: Dietary & Allergy Safeguards */}
          {activeConstraintTab === "dietary" && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base font-['Outfit']">
                    Dietary & Allergy Alignment
                  </h3>
                  <p className="text-xs text-stone-400">
                    Active restrictions for {plan.title}: {plan.dietaryRestrictions?.length > 0 ? plan.dietaryRestrictions.join(", ") : "None specified"}
                  </p>
                </div>
                <button
                  onClick={() => onTriggerAgentPrompt("Review all items on our list and recommend allergen-safe and gluten-free swaps.")}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold border border-amber-500/30 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Dietary Audit</span>
                </button>
              </div>

              {/* Dietary Tags list */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {["Vegetarian Friendly", "Gluten-Free Available", "Nut-Free Safe", "Kid-Friendly Items", "Non-Alcoholic Options"].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-850 text-stone-300 border border-stone-700 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>

              {/* Items with substitute options */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Recommended Constraint Swaps:
                </div>
                {plan.items.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-stone-850 border border-stone-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-stone-400 mt-0.5">
                        {item.substituteOption || "Cymbal Choice Organic & Gluten-Free Alternative available in Aisle"}
                      </div>
                    </div>

                    <button
                      onClick={() => handleApplyDietarySwap(item.id, `Cymbal Choice ${item.name} (Dietary-Safe)`, "Swapped for guest dietary preferences")}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 hover:text-amber-300 font-semibold shrink-0 border border-stone-700"
                    >
                      Apply Swap
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Pantry & Already Owned Items */}
          {activeConstraintTab === "pantry" && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base font-['Outfit']">
                    Pantry & "Have at Home" Check
                  </h3>
                  <p className="text-xs text-stone-400">
                    Check off staples you already have in stock to deduct them from your store bill.
                  </p>
                </div>
                {pantrySavingsTotal > 0 && (
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Saved ${pantrySavingsTotal.toFixed(2)} from cart
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {plan.items.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                      item.isOwned
                        ? "bg-emerald-950/20 border-emerald-500/40 text-stone-300"
                        : "bg-stone-850 border-stone-800 hover:border-stone-700 text-stone-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(item.isOwned)}
                        onChange={() => handleTogglePantryOwned(item.id)}
                        className="w-4 h-4 rounded text-amber-500 bg-stone-800 border-stone-700 focus:ring-0"
                      />
                      <div>
                        <div className={`font-semibold ${item.isOwned ? "line-through text-stone-400" : "text-white"}`}>
                          {item.name}
                        </div>
                        <div className="text-[11px] text-stone-400">
                          {item.quantity} • {item.cymbalAisle || item.category}
                        </div>
                      </div>
                    </div>

                    <div className="font-mono text-right">
                      <span className={item.isOwned ? "text-stone-500 line-through" : "text-amber-400 font-bold"}>
                        ${item.estimatedPrice}
                      </span>
                      {item.isOwned && (
                        <div className="text-[10px] text-emerald-400 font-bold">Already Owned</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Portion Buffers */}
          {activeConstraintTab === "portions" && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-lg">
              <div>
                <h3 className="font-bold text-white text-base font-['Outfit']">
                  Crowd Appetite & Buffer Scaling
                </h3>
                <p className="text-xs text-stone-400">
                  Dynamically adjust portion sizing for big eaters or light grazing parties.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-850 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-300">Portion Multiplier:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {portionMultiplier === 1.0 ? "Standard (100%)" : `${Math.round(portionMultiplier * 100)}%`}
                  </span>
                </div>

                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={portionMultiplier}
                  onChange={(e) => setPortionMultiplier(parseFloat(e.target.value))}
                  className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />

                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>Light Grazing (80%)</span>
                  <span>Recommended (100%)</span>
                  <span>Extra Hungry Crowd (+30%)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-850 border border-stone-800">
                  <div className="text-stone-400">Estimated Drink Servings</div>
                  <div className="text-lg font-bold text-white mt-1 font-mono">
                    {Math.round((plan.portionGuide?.totalDrinkServings || 50) * portionMultiplier)} drinks
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-stone-850 border border-stone-800">
                  <div className="text-stone-400">Ice Requirements</div>
                  <div className="text-lg font-bold text-white mt-1 font-mono">
                    {Math.round((plan.portionGuide?.iceLbsNeeded || 25) * portionMultiplier)} lbs
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: CymbalMart Fulfillment & Final Checkout (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                  🛍️
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-['Outfit']">
                    CymbalMart Fulfillment
                  </h3>
                  <div className="text-[11px] text-blue-400 font-medium">
                    Fast & Fresh Party Prep
                  </div>
                </div>
              </div>
            </div>

            {/* Fulfillment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Choose Fulfillment Method:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillmentMethod("pickup")}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    fulfillmentMethod === "pickup"
                      ? "bg-blue-600/20 border-blue-500 text-white shadow-sm"
                      : "bg-stone-850 border-stone-800 text-stone-400 hover:text-stone-200"
                  }`}
                >
                  <Store className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                  <div className="text-xs font-bold">Curbside</div>
                  <div className="text-[10px] text-stone-400">Free</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentMethod("delivery")}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    fulfillmentMethod === "delivery"
                      ? "bg-blue-600/20 border-blue-500 text-white shadow-sm"
                      : "bg-stone-850 border-stone-800 text-stone-400 hover:text-stone-200"
                  }`}
                >
                  <Truck className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <div className="text-xs font-bold">2-Hr Delivery</div>
                  <div className="text-[10px] text-stone-400">Free &gt;$35</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentMethod("in-store")}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    fulfillmentMethod === "in-store"
                      ? "bg-blue-600/20 border-blue-500 text-white shadow-sm"
                      : "bg-stone-850 border-stone-800 text-stone-400 hover:text-stone-200"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <div className="text-xs font-bold">Store Run</div>
                  <div className="text-[10px] text-stone-400">Self-Shop</div>
                </button>
              </div>
            </div>

            {/* Store & Slot Selection */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 font-medium mb-1">
                  Local CymbalMart Store:
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full bg-stone-850 text-white rounded-xl px-3 py-2 border border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  {CYMBAL_STORES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-400 font-medium mb-1">
                  Fulfillment Window:
                </label>
                <select
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="w-full bg-stone-850 text-white rounded-xl px-3 py-2 border border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {fulfillmentMethod === "delivery" && (
                <div>
                  <label className="block text-stone-400 font-medium mb-1">
                    Delivery Address:
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-stone-850 text-white rounded-xl px-3 py-2 border border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    placeholder="Enter delivery address..."
                  />
                </div>
              )}
            </div>

            {/* Price & Savings Breakdown */}
            <div className="p-4 rounded-xl bg-stone-850 border border-stone-800 space-y-2 text-xs">
              <div className="flex justify-between text-stone-300">
                <span>CymbalMart Items ({storeItemsToBuy.length}):</span>
                <span className="font-mono font-semibold">${rawSubtotal.toFixed(2)}</span>
              </div>

              {rollbackSavingsTotal > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Cymbal Rollback Savings:</span>
                  </span>
                  <span className="font-mono">-${rollbackSavingsTotal.toFixed(2)}</span>
                </div>
              )}

              {pantrySavingsTotal > 0 && (
                <div className="flex justify-between text-blue-400">
                  <span>Pantry Items Deducted:</span>
                  <span className="font-mono">-${pantrySavingsTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-400">
                <span>Est. Local Tax:</span>
                <span className="font-mono">${estimatedTax.toFixed(2)}</span>
              </div>

              {fulfillmentMethod === "delivery" && (
                <div className="flex justify-between text-stone-400">
                  <span>Delivery Fee:</span>
                  <span className="font-mono">{deliveryFee === 0 ? "FREE" : `$${deliveryFee.toFixed(2)}`}</span>
                </div>
              )}

              <div className="pt-2 border-t border-stone-700 flex justify-between items-baseline">
                <div>
                  <div className="font-bold text-white text-sm">Estimated Total:</div>
                  <div className="text-[11px] text-stone-400">
                    Target Budget: ${plan.budget}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold font-mono ${grandTotal <= plan.budget ? "text-emerald-400" : "text-amber-400"}`}>
                    ${grandTotal.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    ${(grandTotal / (plan.guestCount || 1)).toFixed(1)}/guest
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              id="finalize-party-plan-btn"
              onClick={handlePlaceOrder}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-stone-950 font-bold text-sm sm:text-base transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isOrderPlaced ? "Update CymbalMart Order" : "1-Click Finalize & Place Order"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
