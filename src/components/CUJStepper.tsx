import React from "react";
import { Check, Edit3, ShoppingBag, Sliders, CheckCircle2, DollarSign, Calendar, Users, Store } from "lucide-react";
import { PartyPlan } from "../types";

interface CUJStepperProps {
  currentPlan: PartyPlan | null;
  activeStage: "define" | "review" | "refine_checkout";
  onSelectStage: (stage: "define" | "review" | "refine_checkout") => void;
  onOpenEditEventModal: () => void;
}

export const CUJStepper: React.FC<CUJStepperProps> = ({
  currentPlan,
  activeStage,
  onSelectStage,
  onOpenEditEventModal,
}) => {
  if (!currentPlan) return null;

  const totalEstimated = currentPlan.items.reduce(
    (sum, i) => (i.isOwned ? sum : sum + (i.estimatedPrice || 0)),
    0
  );
  const isWithinBudget = totalEstimated <= currentPlan.budget;
  const isOrderFinalized = currentPlan.fulfillment?.isConfirmed;

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-lg mb-6">
      {/* CUJ Stage Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Step 1: Define Event */}
        <div
          onClick={onOpenEditEventModal}
          className={`flex-1 p-3.5 rounded-xl border transition-all cursor-pointer group ${
            activeStage === "define"
              ? "bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30"
              : "bg-stone-850 border-stone-800 hover:border-stone-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400">
              Task 1 • Define Event
            </span>
            <span className="text-xs text-stone-400 group-hover:text-amber-300 flex items-center gap-1">
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </span>
          </div>
          <div className="mt-1 font-bold text-white text-sm sm:text-base font-['Outfit'] truncate">
            {currentPlan.title}
          </div>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs text-stone-300">
            <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700">
              {currentPlan.eventType}
            </span>
            <span className="flex items-center gap-1 text-stone-400">
              <Users className="w-3 h-3 text-stone-400" />
              <span>{currentPlan.guestCount} guests</span>
            </span>
            <span className="text-stone-400">• Budget: <strong className="text-white">${currentPlan.budget}</strong></span>
          </div>
        </div>

        {/* Step 2: Review List */}
        <div
          onClick={() => onSelectStage("review")}
          className={`flex-1 p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeStage === "review"
              ? "bg-blue-900/20 border-blue-500/50 ring-1 ring-blue-500/30"
              : "bg-stone-850 border-stone-800 hover:border-stone-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-blue-400">
              Task 2 • Review List & Budget
            </span>
            <span className={`text-xs font-semibold px-1.5 py-0.2 rounded ${
              isWithinBudget ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
            }`}>
              {isWithinBudget ? "On Budget" : "Over Budget"}
            </span>
          </div>
          <div className="mt-1 font-bold text-white text-sm sm:text-base font-['Outfit'] flex items-center justify-between">
            <span>{currentPlan.items.length} Curated Items</span>
            <span className={isWithinBudget ? "text-emerald-400 font-mono" : "text-rose-400 font-mono"}>
              ${totalEstimated}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-stone-400">
            <span>CymbalMart Aisles mapped</span>
            <span>•</span>
            <span>${(totalEstimated / (currentPlan.guestCount || 1)).toFixed(1)}/guest</span>
          </div>
        </div>

        {/* Step 3: Refine & Checkout */}
        <div
          onClick={() => onSelectStage("refine_checkout")}
          className={`flex-1 p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeStage === "refine_checkout"
              ? "bg-emerald-900/20 border-emerald-500/50 ring-1 ring-emerald-500/30"
              : "bg-stone-850 border-stone-800 hover:border-stone-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400">
              Task 3 • Refine & Checkout
            </span>
            {isOrderFinalized ? (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Finalized</span>
              </span>
            ) : (
              <span className="text-xs text-stone-400">
                Ready to Finalize
              </span>
            )}
          </div>
          <div className="mt-1 font-bold text-white text-sm sm:text-base font-['Outfit'] flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <span>CymbalMart Fulfillment</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-stone-400">
            <span>Dietary & pantry filters</span>
            <span>•</span>
            <span>1-Click Order</span>
          </div>
        </div>
      </div>
    </div>
  );
};
