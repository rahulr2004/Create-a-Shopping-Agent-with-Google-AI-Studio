import React from "react";
import { Sparkles, ShoppingBag, Share2, Plus, Calculator, CalendarClock, Bot, CheckCircle2, Store, SlidersHorizontal, CheckCheck, Mic } from "lucide-react";
import { PartyPlan } from "../types";

interface HeaderProps {
  currentPlan: PartyPlan | null;
  savedPlans: PartyPlan[];
  onSelectPlan: (plan: PartyPlan) => void;
  onOpenNewPartyModal: () => void;
  onOpenShoppingMode: () => void;
  onOpenExportModal: () => void;
  activeTab: "shopping" | "refine_checkout" | "budget" | "calculator" | "timeline";
  setActiveTab: (tab: "shopping" | "refine_checkout" | "budget" | "calculator" | "timeline") => void;
  isAgentOpen: boolean;
  setIsAgentOpen: (open: boolean) => void;
  isVoiceOpen?: boolean;
  setIsVoiceOpen?: (open: boolean) => void;
  unreadAgentSuggestions?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPlan,
  savedPlans,
  onSelectPlan,
  onOpenNewPartyModal,
  onOpenShoppingMode,
  onOpenExportModal,
  activeTab,
  setActiveTab,
  isAgentOpen,
  setIsAgentOpen,
  isVoiceOpen,
  setIsVoiceOpen,
}) => {
  const totalItems = currentPlan?.items.length || 0;
  const checkedItems = currentPlan?.items.filter((i) => i.isChecked).length || 0;
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  const isOrderFinalized = currentPlan?.fulfillment?.isConfirmed;

  return (
    <header className="sticky top-0 z-30 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top brand & actions row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo & Active Party Selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md border border-blue-400/30">
                🛒
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-base sm:text-lg text-white font-['Outfit']">
                    CymbalMart
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                    Shopping Agent
                  </span>
                </div>
                <div className="text-[11px] text-stone-400">
                  Party Planner & Budget Logistics
                </div>
              </div>
            </div>

            {/* Party Selector Dropdown */}
            {savedPlans.length > 0 && (
              <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
                <select
                  id="party-selector-dropdown"
                  value={currentPlan?.id || ""}
                  onChange={(e) => {
                    const selected = savedPlans.find((p) => p.id === e.target.value);
                    if (selected) onSelectPlan(selected);
                  }}
                  className="bg-stone-800/90 text-stone-200 text-xs sm:text-sm font-medium rounded-lg px-2.5 py-1.5 border border-stone-700 hover:border-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-400 max-w-[200px] sm:max-w-[260px] truncate"
                >
                  {savedPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.title} ({plan.guestCount} guests)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="header-voice-control-btn"
              onClick={() => setIsVoiceOpen && setIsVoiceOpen(!isVoiceOpen)}
              className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg border transition-all shadow-sm ${
                isVoiceOpen
                  ? "bg-red-500/20 text-red-300 border-red-500/50 font-bold"
                  : "bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700 hover:border-amber-400/50"
              }`}
              title="Toggle Hands-Free Voice Control"
            >
              <Mic className={`w-4 h-4 ${isVoiceOpen ? "text-red-400 animate-pulse" : "text-amber-400"}`} />
              <span>Voice Control</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                Hands-Free
              </span>
            </button>

            <button
              id="header-open-agent-btn"
              onClick={() => setIsAgentOpen(!isAgentOpen)}
              className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg border transition-all shadow-sm ${
                isAgentOpen
                  ? "bg-amber-400 text-stone-950 border-amber-300 font-bold"
                  : "bg-blue-900/40 hover:bg-blue-900/60 text-blue-200 border-blue-500/40 hover:border-blue-400"
              }`}
              title="Chat with CymbalMart Assistant for customer service, aisle guide, and party advice"
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span>CymbalMart Assistant</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              id="header-store-mode-btn"
              onClick={onOpenShoppingMode}
              disabled={!currentPlan || totalItems === 0}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white transition-all shadow-sm"
              title="Enter distraction-free in-store shopping mode"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>In-Store Mode</span>
              {totalItems > 0 && (
                <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-100 font-mono">
                  {checkedItems}/{totalItems}
                </span>
              )}
            </button>

            <button
              id="header-share-btn"
              onClick={onOpenExportModal}
              disabled={!currentPlan}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Export & Share</span>
            </button>

            <button
              id="header-new-party-btn"
              onClick={onOpenNewPartyModal}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Party Plan</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Quick Progress */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-1 pb-2 border-t border-stone-800/80 gap-2">
          <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            <button
              id="nav-tab-shopping"
              onClick={() => setActiveTab("shopping")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === "shopping"
                  ? "bg-stone-800 text-amber-300 font-semibold shadow-inner"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Review List</span>
              <span className="text-[11px] px-1.5 rounded-full bg-stone-700/80 text-stone-300">
                {totalItems}
              </span>
            </button>

            <button
              id="nav-tab-refine-checkout"
              onClick={() => setActiveTab("refine_checkout")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === "refine_checkout"
                  ? "bg-emerald-900/40 text-emerald-300 border border-emerald-500/40 font-semibold shadow-inner"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Refine & Checkout</span>
              {isOrderFinalized && (
                <span className="text-[11px] px-1.5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center gap-0.5">
                  <CheckCheck className="w-3 h-3" />
                </span>
              )}
            </button>

            <button
              id="nav-tab-budget"
              onClick={() => setActiveTab("budget")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === "budget"
                  ? "bg-stone-800 text-amber-300 font-semibold shadow-inner"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Budget Alignment</span>
              {currentPlan && (
                <span className="text-[11px] px-1.5 rounded-full bg-stone-700/80 text-stone-300">
                  ${currentPlan.budgetSummary.totalEstimatedCost} / ${currentPlan.budget}
                </span>
              )}
            </button>

            <button
              id="nav-tab-calculator"
              onClick={() => setActiveTab("calculator")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === "calculator"
                  ? "bg-stone-800 text-amber-300 font-semibold shadow-inner"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Party Math & Portions</span>
            </button>

            <button
              id="nav-tab-timeline"
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === "timeline"
                  ? "bg-stone-800 text-amber-300 font-semibold shadow-inner"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Prep Schedule</span>
              {currentPlan?.timeline && (
                <span className="text-[11px] px-1.5 rounded-full bg-stone-700/80 text-stone-300">
                  {currentPlan.timeline.filter((t) => t.isCompleted).length}/{currentPlan.timeline.length}
                </span>
              )}
            </button>
          </nav>

          {/* Quick checklist mini progress */}
          {currentPlan && totalItems > 0 && (
            <div className="flex items-center gap-2 text-xs text-stone-400 shrink-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${progressPercent === 100 ? "text-emerald-400" : "text-amber-400"}`} />
                <span>{progressPercent}% Purchased</span>
              </div>
              <div className="w-20 bg-stone-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
