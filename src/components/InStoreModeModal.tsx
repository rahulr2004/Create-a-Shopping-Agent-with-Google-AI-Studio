import React, { useState, useMemo } from "react";
import { X, Check, ShoppingBag, Store, CheckCircle2, DollarSign, Sparkles, Volume2, ArrowLeft, Mic, Navigation } from "lucide-react";
import { PartyPlan, ShoppingItem } from "../types";
import { voiceSpeaker, soundFX } from "../services/voiceService";
import confetti from "canvas-confetti";

interface InStoreModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PartyPlan;
  onUpdatePlan: (updated: PartyPlan) => void;
  onOpenVoiceHUD?: () => void;
}

export const InStoreModeModal: React.FC<InStoreModeModalProps> = ({
  isOpen,
  onClose,
  plan,
  onUpdatePlan,
  onOpenVoiceHUD,
}) => {
  const [activeStoreTab, setActiveStoreTab] = useState<string>("all");
  const [speakingItemId, setSpeakingItemId] = useState<string | null>(null);

  const stores = useMemo(() => {
    const list = new Set<string>();
    plan.items.forEach((i) => {
      if (i.recommendedStore) list.add(i.recommendedStore);
    });
    return Array.from(list);
  }, [plan.items]);

  const filteredItems = useMemo(() => {
    return plan.items.filter((item) => {
      if (activeStoreTab !== "all" && item.recommendedStore !== activeStoreTab) return false;
      return true;
    });
  }, [plan.items, activeStoreTab]);

  const storeItemsCount = filteredItems.length;
  const storeCheckedCount = filteredItems.filter((i) => i.isChecked).length;
  const storePercent = storeItemsCount > 0 ? Math.round((storeCheckedCount / storeItemsCount) * 100) : 0;

  const nextUncheckedItem = useMemo(() => {
    return filteredItems.find((i) => !i.isChecked);
  }, [filteredItems]);

  const totalStoreEstCost = filteredItems.reduce(
    (acc, i) => (i.isOwned ? acc : acc + (i.estimatedPrice || 0)),
    0
  );

  const handleSpeakItem = (item: ShoppingItem) => {
    setSpeakingItemId(item.id);
    const text = `${item.name}. Quantity: ${item.quantity}. Located in ${item.cymbalAisle || item.category}. Estimated price: $${item.estimatedPrice}.`;
    voiceSpeaker.speak(text, () => {
      setSpeakingItemId(null);
    });
  };

  const handleSpeakNextItem = () => {
    if (!nextUncheckedItem) {
      voiceSpeaker.speak("Congratulations! All items in this store run have been crossed off.");
      return;
    }
    const text = `Next item is ${nextUncheckedItem.name}. Head to ${nextUncheckedItem.cymbalAisle || nextUncheckedItem.category}. Grab ${nextUncheckedItem.quantity}.`;
    voiceSpeaker.speak(text);
  };

  const handleToggleItem = (itemId: string) => {
    const updatedItems = plan.items.map((item) => {
      if (item.id === itemId) {
        const nextState = !item.isChecked;
        if (nextState) {
          soundFX.playSuccess();
          // Check if this completes store run or whole party!
          const remainingInStore = filteredItems.filter((i) => i.id !== itemId && !i.isChecked).length;
          if (remainingInStore === 0) {
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.5 },
            });
            voiceSpeaker.speak("Store run complete! Great job.");
          }
        }
        return { ...item, isChecked: nextState };
      }
      return item;
    });

    onUpdatePlan({
      ...plan,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/95 flex flex-col animate-in fade-in">
      {/* Top Header Bar */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-3 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            id="exit-store-mode-btn"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Planner</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                LIVE IN-STORE MODE
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-xs font-['Outfit']">
                {plan.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Live spend, voice guide and progress */}
        <div className="flex items-center gap-2 sm:gap-3">
          {nextUncheckedItem && (
            <button
              id="store-speak-next-item-btn"
              onClick={handleSpeakNextItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all animate-pulse"
              title="Speak next item and aisle location aloud"
            >
              <Volume2 className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Next Aisle:</span>
              <span className="truncate max-w-[120px] font-mono">{nextUncheckedItem.name}</span>
            </button>
          )}

          {onOpenVoiceHUD && (
            <button
              onClick={onOpenVoiceHUD}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700 text-xs font-bold flex items-center gap-1"
              title="Open Hands-Free Voice Control"
            >
              <Mic className="w-4 h-4" />
              <span className="hidden md:inline">Voice Control</span>
            </button>
          )}

          <div className="text-right font-mono hidden xs:block">
            <div className="text-[10px] text-stone-400">Store Est. Subtotal</div>
            <div className="text-sm sm:text-base font-bold text-emerald-400">${totalStoreEstCost}</div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Store Run Selector Ribbon */}
      <div className="bg-stone-900/60 border-b border-stone-800/80 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
        <button
          id="store-tab-all"
          onClick={() => setActiveStoreTab("all")}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeStoreTab === "all"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-stone-800 text-stone-300 hover:bg-stone-700"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>All Stores ({plan.items.length})</span>
        </button>

        {stores.map((store) => {
          const storeItems = plan.items.filter((i) => i.recommendedStore === store);
          const storeDone = storeItems.filter((i) => i.isChecked).length;
          const isSelected = activeStoreTab === store;
          const isComplete = storeItems.length > 0 && storeDone === storeItems.length;

          return (
            <button
              key={store}
              id={`store-tab-${store.replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => setActiveStoreTab(store)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                isSelected
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                  : isComplete
                  ? "bg-stone-850 text-emerald-400 border-emerald-900/60"
                  : "bg-stone-850 text-stone-300 border-stone-800 hover:border-stone-700"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>{store}</span>
              <span
                className={`text-[11px] px-1.5 rounded-full font-mono ${
                  isSelected ? "bg-emerald-800 text-emerald-100" : "bg-stone-800 text-stone-400"
                }`}
              >
                {storeDone}/{storeItems.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-900 h-1.5 shrink-0 overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-300"
          style={{ width: `${storePercent}%` }}
        />
      </div>

      {/* Store Run Checklist Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-3">
        {storePercent === 100 && storeItemsCount > 0 && (
          <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-center space-y-2 animate-in zoom-in-95">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white font-['Outfit']">
              {activeStoreTab === "all" ? "Whole Party Shopping Complete! 🎉" : `${activeStoreTab} Run Complete!`}
            </h3>
            <p className="text-xs text-emerald-200">
              Every item has been crossed off. You are ready to move to prep and party time!
            </p>
          </div>
        )}

        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            return (
              <div
                key={item.id}
                onClick={() => handleToggleItem(item.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                  item.isChecked
                    ? "bg-stone-900/60 border-stone-800/80 text-stone-500"
                    : "bg-stone-900 border-stone-800 text-stone-100 hover:border-emerald-500/60 hover:bg-stone-850 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Giant Touch Target Checkbox */}
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                      item.isChecked
                        ? "bg-emerald-600 border-emerald-500 text-white"
                        : "border-stone-600 bg-stone-800"
                    }`}
                  >
                    {item.isChecked && <Check className="w-5 h-5 stroke-[2.5]" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-base font-bold tracking-tight ${
                          item.isChecked ? "line-through text-stone-500" : "text-stone-100"
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-amber-300 font-mono font-medium">
                        {item.quantity}
                      </span>
                    </div>

                    {item.shoppingNotes && (
                      <p className="text-xs text-stone-400 mt-0.5 truncate max-w-sm sm:max-w-md">
                        📍 {item.shoppingNotes}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-400 flex-wrap">
                      {item.cymbalAisle && (
                        <span className="px-1.5 py-0.5 rounded bg-stone-800 text-amber-300 font-medium">
                          📍 {item.cymbalAisle}
                        </span>
                      )}
                      {item.brandType && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 font-bold border border-blue-500/30">
                          {item.brandType}
                        </span>
                      )}
                      <span>{item.recommendedStore}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeakItem(item);
                    }}
                    className={`p-2 rounded-lg border transition-colors ${
                      speakingItemId === item.id
                        ? "bg-blue-600 text-white border-blue-400 animate-pulse"
                        : "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700 hover:text-white"
                    }`}
                    title="Speak item details and aisle location aloud"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <div className="text-right font-mono">
                    <div
                      className={`text-base font-bold ${
                        item.isChecked ? "text-stone-500 line-through" : "text-emerald-400"
                      }`}
                    >
                      ${item.estimatedPrice}
                    </div>
                    <span className="text-[10px] text-stone-500 block">Tap to cross off</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
