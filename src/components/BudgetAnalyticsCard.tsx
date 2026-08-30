import React, { useState } from "react";
import {
  DollarSign,
  TrendingDown,
  Sparkles,
  PieChart,
  Store,
  Tag,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { PartyPlan, BudgetOptimizationResult, ShoppingItem } from "../types";
import { optimizeBudgetAPI } from "../services/api";

interface BudgetAnalyticsCardProps {
  plan: PartyPlan;
  onUpdatePlan: (updated: PartyPlan) => void;
  onOpenAgentWithPrompt: (promptText: string) => void;
}

export const BudgetAnalyticsCard: React.FC<BudgetAnalyticsCardProps> = ({
  plan,
  onUpdatePlan,
  onOpenAgentWithPrompt,
}) => {
  const [optimizationResult, setOptimizationResult] = useState<BudgetOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optError, setOptError] = useState<string | null>(null);

  // Calculations
  const totalEstimated = plan.items.reduce(
    (sum, i) => (i.isOwned ? sum : sum + (i.estimatedPrice || 0)),
    0
  );
  const mustHaveTotal = plan.items
    .filter((i) => i.priority === "must-have")
    .reduce((sum, i) => (i.isOwned ? sum : sum + (i.estimatedPrice || 0)), 0);
  const niceToHaveTotal = plan.items
    .filter((i) => i.priority === "nice-to-have")
    .reduce((sum, i) => (i.isOwned ? sum : sum + (i.estimatedPrice || 0)), 0);
  const checkedSpend = plan.items
    .filter((i) => i.isChecked)
    .reduce(
      (sum, i) =>
        i.isOwned ? sum : sum + (i.actualPrice !== undefined ? i.actualPrice : i.estimatedPrice || 0),
      0
    );

  const costPerGuest = plan.guestCount > 0 ? (totalEstimated / plan.guestCount).toFixed(1) : "0";
  const isOverBudget = totalEstimated > plan.budget;
  const budgetDelta = Math.abs(totalEstimated - plan.budget);

  // Store Breakdown
  const storeBreakdown: Record<string, number> = {};
  plan.items.forEach((item) => {
    if (item.isOwned) return;
    const store = item.recommendedStore || "Other";
    storeBreakdown[store] = (storeBreakdown[store] || 0) + (item.estimatedPrice || 0);
  });

  // Category Breakdown
  const categoryBreakdown: Record<string, number> = {};
  plan.items.forEach((item) => {
    if (item.isOwned) return;
    const cat = item.category || "Miscellaneous";
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (item.estimatedPrice || 0);
  });

  const handleRunOptimizer = async () => {
    setIsOptimizing(true);
    setOptError(null);
    try {
      const result = await optimizeBudgetAPI(plan.items, plan.budget, totalEstimated);
      setOptimizationResult(result);
    } catch (err: any) {
      console.error(err);
      setOptError(err.message || "Failed to run AI budget optimization.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplySwap = (originalName: string, replacementSuggestion: string, savingsEstimate: number) => {
    const updatedItems = plan.items.map((item) => {
      if (item.name.toLowerCase().includes(originalName.toLowerCase())) {
        return {
          ...item,
          name: `${replacementSuggestion} (Swapped for savings)`,
          estimatedPrice: Math.max(1, item.estimatedPrice - savingsEstimate),
          shoppingNotes: `AI Swapped: ${replacementSuggestion}. Saved est. $${savingsEstimate}`,
        };
      }
      return item;
    });

    onUpdatePlan({
      ...plan,
      items: updatedItems,
      budgetSummary: {
        ...plan.budgetSummary,
        totalEstimatedCost: updatedItems.reduce((acc, i) => (i.isOwned ? acc : acc + (i.estimatedPrice || 0)), 0),
      },
      updatedAt: new Date().toISOString(),
    });

    // Remove from active optimizer swaps
    if (optimizationResult) {
      setOptimizationResult({
        ...optimizationResult,
        recommendedSwaps: optimizationResult.recommendedSwaps.filter((s) => s.originalItem !== originalName),
      });
    }
  };

  const handleTrimItem = (itemName: string) => {
    const updatedItems = plan.items.filter((i) => !i.name.toLowerCase().includes(itemName.toLowerCase()));
    onUpdatePlan({
      ...plan,
      items: updatedItems,
      budgetSummary: {
        ...plan.budgetSummary,
        totalEstimatedCost: updatedItems.reduce((acc, i) => (i.isOwned ? acc : acc + (i.estimatedPrice || 0)), 0),
      },
      updatedAt: new Date().toISOString(),
    });

    if (optimizationResult) {
      setOptimizationResult({
        ...optimizationResult,
        itemsToTrim: optimizationResult.itemsToTrim.filter((t) => t.itemName !== itemName),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Budget Health Visualizer */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              BUDGET HEALTH & TARGET METRICS
            </span>
            <h2 className="text-xl font-bold text-white font-['Outfit'] mt-1">
              Event Financial Overview
            </h2>
          </div>

          <button
            id="run-ai-budget-optimizer-btn"
            onClick={handleRunOptimizer}
            disabled={isOptimizing}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md self-start sm:self-auto"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing Pricing & Swaps...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run AI Cost Audit & Optimizer</span>
              </>
            )}
          </button>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
          <div className="p-3.5 sm:p-4 rounded-xl bg-stone-850 border border-stone-800">
            <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
              Target Budget
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5">
              ${plan.budget}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Cap set by host
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-stone-850 border border-stone-800">
            <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
              Total Estimated
            </div>
            <div
              className={`text-xl sm:text-2xl font-bold font-mono mt-0.5 ${
                isOverBudget ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              ${totalEstimated}
            </div>
            <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
              {isOverBudget ? (
                <span className="text-amber-400 font-semibold">+${budgetDelta} over target</span>
              ) : (
                <span className="text-emerald-400 font-semibold">${budgetDelta} under target</span>
              )}
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-stone-850 border border-stone-800">
            <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
              Must-Haves Only
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-stone-200 mt-0.5">
              ${mustHaveTotal}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Nice-to-haves: ${niceToHaveTotal}
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-stone-850 border border-stone-800">
            <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
              Cost Per Guest
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-stone-200 mt-0.5">
              ${costPerGuest}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Across {plan.guestCount} guests
            </div>
          </div>
        </div>

        {/* Visual Budget Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs text-stone-300">
            <span>
              Must-Haves: <strong className="text-white">${mustHaveTotal}</strong>
            </span>
            <span>
              Target: <strong className="text-emerald-400">${plan.budget}</strong>
            </span>
          </div>
          <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (mustHaveTotal / plan.budget) * 100)}%`,
              }}
              title={`Must-Haves: $${mustHaveTotal}`}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{
                width: `${Math.min(100 - (mustHaveTotal / plan.budget) * 100, (niceToHaveTotal / plan.budget) * 100)}%`,
              }}
              title={`Nice-to-Haves: $${niceToHaveTotal}`}
            />
          </div>
        </div>
      </div>

      {/* AI Optimizer Results Section */}
      {optimizationResult && (
        <div className="bg-stone-900 border border-amber-500/40 rounded-2xl p-4 sm:p-6 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500 text-stone-950 font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                  AI Budget Optimization Plan
                </h3>
                <p className="text-xs text-stone-300">{optimizationResult.summary}</p>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
              Potential Savings: +${optimizationResult.potentialSavings}
            </div>
          </div>

          {/* Recommended Swaps Grid */}
          {optimizationResult.recommendedSwaps.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                ⚡ High-Impact Ingredient & Store Swaps (1-Click Apply)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {optimizationResult.recommendedSwaps.map((swap, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-stone-850 border border-stone-800 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-stone-400 line-through truncate max-w-[180px]">
                          {swap.originalItem}
                        </span>
                        <span className="text-emerald-400 font-bold font-mono">
                          Save ~${swap.savingsEstimate}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">
                        {swap.replacementSuggestion}
                      </div>
                      <p className="text-xs text-stone-400 mt-1">{swap.rationale}</p>
                    </div>

                    <button
                      id={`apply-swap-${idx}`}
                      onClick={() =>
                        handleApplySwap(
                          swap.originalItem,
                          swap.replacementSuggestion,
                          swap.savingsEstimate
                        )
                      }
                      className="mt-2 w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Apply Swap to Shopping List</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Items to Trim */}
          {optimizationResult.itemsToTrim.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-800">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                ✂️ Items Safe to Eliminate
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {optimizationResult.itemsToTrim.map((trim, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-stone-850 border border-stone-800 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-stone-200">{trim.itemName}</div>
                      <div className="text-[11px] text-stone-400 font-mono">${trim.cost}</div>
                    </div>
                    <button
                      id={`trim-item-${idx}`}
                      onClick={() => handleTrimItem(trim.itemName)}
                      className="px-2.5 py-1 rounded bg-stone-800 hover:bg-red-900/60 hover:text-red-300 text-stone-300 text-xs font-semibold border border-stone-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Buy Tips */}
          {optimizationResult.bulkBuyTips && optimizationResult.bulkBuyTips.length > 0 && (
            <div className="pt-2 border-t border-stone-800">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
                📦 Bulk Buying & Logistics Tips:
              </span>
              <ul className="list-disc list-inside space-y-1 text-xs text-stone-300">
                {optimizationResult.bulkBuyTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Spend Distribution Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Distribution */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <span>Store Spend Breakdown</span>
          </h3>

          <div className="space-y-2.5">
            {Object.entries(storeBreakdown).map(([store, cost]) => {
              const pct = totalEstimated > 0 ? Math.round((cost / totalEstimated) * 100) : 0;
              return (
                <div key={store} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-medium">{store}</span>
                    <span className="text-stone-200 font-mono font-bold">
                      ${cost} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400" />
            <span>Category Spend Breakdown</span>
          </h3>

          <div className="space-y-2.5">
            {Object.entries(categoryBreakdown).map(([cat, cost]) => {
              const pct = totalEstimated > 0 ? Math.round((cost / totalEstimated) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-medium">{cat}</span>
                    <span className="text-stone-200 font-mono font-bold">
                      ${cost} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
