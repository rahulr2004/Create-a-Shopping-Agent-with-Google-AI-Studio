import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Check,
  Store,
  Tag,
  DollarSign,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Home,
  CheckSquare,
  Square,
  Layers,
  ArrowUpDown,
  ShoppingBag,
  SlidersHorizontal,
  Minus,
  TrendingDown,
  Users,
  Percent,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { ShoppingItem, PartyPlan, ItemCategory } from "../types";
import confetti from "canvas-confetti";
import {
  recalculatePartyPlan,
  scaleShoppingListQuantities,
  addShoppingItem,
  removeShoppingItem,
} from "../utils/budgetCalculations";

interface ShoppingListViewProps {
  plan: PartyPlan;
  onUpdatePlan: (updated: PartyPlan) => void;
  onOpenShoppingMode: () => void;
  onTriggerAgentPrompt: (promptText: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Groceries & Mains": "bg-red-500/10 text-red-300 border-red-500/30",
  "Appetizers & Snacks": "bg-amber-500/10 text-amber-300 border-amber-500/30",
  "Drinks & Bar": "bg-purple-500/10 text-purple-300 border-purple-500/30",
  "Desserts & Sweets": "bg-pink-500/10 text-pink-300 border-pink-500/30",
  "Tableware & Disposables": "bg-blue-500/10 text-blue-300 border-blue-500/30",
  "Decor & Balloons": "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  "Ice & Coolers": "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  "Party Favors & Games": "bg-orange-500/10 text-orange-300 border-orange-500/30",
  "Miscellaneous": "bg-stone-500/10 text-stone-300 border-stone-500/30",
};

const DEFAULT_CATEGORIES: ItemCategory[] = [
  "Groceries & Mains",
  "Appetizers & Snacks",
  "Drinks & Bar",
  "Desserts & Sweets",
  "Tableware & Disposables",
  "Decor & Balloons",
  "Ice & Coolers",
  "Party Favors & Games",
  "Miscellaneous",
];

const STORE_LIST = [
  "CymbalMart Supercenter",
  "CymbalMart Express",
  "Costco / Wholesale",
  "Trader Joe's",
  "Target",
  "Local Supermarket",
  "Liquor Store",
  "Party City / Craft Store",
  "Bakery",
  "Online / Amazon",
  "Other",
];

const QUICK_ESSENTIALS = [
  { name: "20lb Party Ice Bag", category: "Ice & Coolers", qty: "2 bags", price: 6, aisle: "Aisle 1 (Freezers)", brand: "Cymbal Choice" as const },
  { name: "50-Pack Heavy-Duty Party Plates", category: "Tableware & Disposables", qty: "1 pack", price: 7.5, aisle: "Aisle 12 (Partyware)", brand: "Cymbal Choice" as const },
  { name: "100-Pack Luncheon Napkins", category: "Tableware & Disposables", qty: "1 pack", price: 3.5, aisle: "Aisle 12 (Partyware)", brand: "Cymbal Choice" as const },
  { name: "12-Pack Sparkling Mineral Water", category: "Drinks & Bar", qty: "2 packs", price: 9, aisle: "Aisle 8 (Beverages)", brand: "Cymbal Choice" as const },
  { name: "Party Size Tortilla Chips", category: "Appetizers & Snacks", qty: "2 bags", price: 6, aisle: "Aisle 5 (Snacks)", brand: "Cymbal Choice" as const },
  { name: "Fresh Mild Salsa Bowl (24oz)", category: "Appetizers & Snacks", qty: "1 tub", price: 4.5, aisle: "Aisle 2 (Deli & Produce)", brand: "Fresh Market" as const },
];

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  plan,
  onUpdatePlan,
  onOpenShoppingMode,
  onTriggerAgentPrompt,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "pending" | "bought">("all");
  const [groupBy, setGroupBy] = useState<"category" | "store" | "none">("category");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Quick Add Item Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<string>("Groceries & Mains");
  const [newItemQty, setNewItemQty] = useState("1 pack");
  const [newItemPrice, setNewItemPrice] = useState<number>(10);
  const [newItemStore, setNewItemStore] = useState<string>("CymbalMart Supercenter");
  const [newItemBrand, setNewItemBrand] = useState<"Cymbal Choice" | "National Brand" | "Fresh Market" | "Bakery Crafted">("Cymbal Choice");
  const [newItemAisle, setNewItemAisle] = useState("");
  const [newItemPriority, setNewItemPriority] = useState<"must-have" | "nice-to-have">("must-have");
  const [newItemNotes, setNewItemNotes] = useState("");

  // Editing modal state
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  // Live guest count adjustment state
  const [showGuestAdjuster, setShowGuestAdjuster] = useState(false);
  const [tempGuestCount, setTempGuestCount] = useState(plan.guestCount);

  // Derive unique store list from items
  const uniqueStores = useMemo(() => {
    const stores = new Set<string>();
    plan.items.forEach((item) => {
      if (item.recommendedStore) stores.add(item.recommendedStore);
    });
    return Array.from(stores);
  }, [plan.items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return plan.items.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesNotes = item.shoppingNotes?.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesStore = item.recommendedStore.toLowerCase().includes(q);
        const matchesAisle = item.cymbalAisle?.toLowerCase().includes(q);
        if (!matchesName && !matchesNotes && !matchesCategory && !matchesStore && !matchesAisle) return false;
      }
      // Store filter
      if (selectedStore !== "all" && item.recommendedStore !== selectedStore) return false;
      // Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      // Priority filter
      if (selectedPriority !== "all" && item.priority !== selectedPriority) return false;
      // Status filter
      if (selectedStatus === "pending" && item.isChecked) return false;
      if (selectedStatus === "bought" && !item.isChecked) return false;

      return true;
    });
  }, [plan.items, searchQuery, selectedStore, selectedCategory, selectedPriority, selectedStatus]);

  // Budget calculations
  const totalEstimatedCost = plan.budgetSummary?.totalEstimatedCost ?? plan.items.reduce(
    (sum, item) => (item.isOwned ? sum : sum + (item.estimatedPrice || 0)),
    0
  );
  const costPerGuest = plan.guestCount > 0 ? (totalEstimatedCost / plan.guestCount).toFixed(2) : "0.00";
  const budgetDelta = Math.abs(totalEstimatedCost - plan.budget).toFixed(2);
  const isOverBudget = totalEstimatedCost > plan.budget;
  const percentOfBudget = plan.budget > 0 ? Math.min(100, Math.round((totalEstimatedCost / plan.budget) * 100)) : 0;

  const totalCymbalSavings = useMemo(() => {
    return plan.items.reduce((sum, item) => {
      if (item.isOwned) return sum;
      if (item.rollbackSavings) return sum + item.rollbackSavings;
      if (item.brandType === "Cymbal Choice") return sum + Number((item.estimatedPrice * 0.25).toFixed(2));
      return sum;
    }, 0);
  }, [plan.items]);

  const totalPantrySavings = useMemo(() => {
    return plan.items.reduce((sum, item) => (item.isOwned ? sum + (item.estimatedPrice || 0) : sum), 0);
  }, [plan.items]);

  // Handlers with automatic recalculation
  const handleToggleCheck = (itemId: string) => {
    const updatedItems = plan.items.map((item) => {
      if (item.id === itemId) {
        const nextState = !item.isChecked;
        if (nextState) {
          const remainingUnchecked = plan.items.filter((i) => i.id !== itemId && !i.isChecked).length;
          if (remainingUnchecked === 0) {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        }
        return { ...item, isChecked: nextState };
      }
      return item;
    });

    onUpdatePlan(recalculatePartyPlan(plan, updatedItems));
  };

  const handleToggleOwned = (itemId: string) => {
    const updatedItems = plan.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, isOwned: !item.isOwned };
      }
      return item;
    });

    onUpdatePlan(recalculatePartyPlan(plan, updatedItems));
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdatePlan(removeShoppingItem(plan, itemId));
  };

  // Adjust quantity (+ / -) with automatic proportional price & budget recalculation
  const handleAdjustQuantity = (itemId: string, delta: number) => {
    const item = plan.items.find((i) => i.id === itemId);
    if (!item) return;

    // Parse leading number from quantity
    const match = item.quantity.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    let currentNum = match ? parseFloat(match[1]) : 1;
    let unit = match ? match[2] : "";

    const newNum = Math.max(1, currentNum + delta);
    if (newNum === currentNum) return;

    // Scale unit price
    const unitPrice = currentNum > 0 ? item.estimatedPrice / currentNum : item.estimatedPrice;
    const newPrice = Number((unitPrice * newNum).toFixed(2));
    const newQuantityStr = unit ? `${newNum} ${unit}`.trim() : `${newNum}`;

    const updatedItems = plan.items.map((i) =>
      i.id === itemId
        ? {
            ...i,
            quantity: newQuantityStr,
            estimatedPrice: newPrice,
          }
        : i
    );

    onUpdatePlan(recalculatePartyPlan(plan, updatedItems));
  };

  // Quick Brand Swap between Cymbal Choice (with rollback savings) and National Brand
  const handleToggleBrand = (itemId: string) => {
    const updatedItems = plan.items.map((item) => {
      if (item.id === itemId) {
        const isCymbal = item.brandType === "Cymbal Choice";
        if (isCymbal) {
          // Switch to national brand (+25% price)
          const newPrice = Number((item.estimatedPrice * 1.25).toFixed(2));
          return {
            ...item,
            brandType: "National Brand" as const,
            estimatedPrice: newPrice,
            rollbackSavings: 0,
            shoppingNotes: item.shoppingNotes?.replace(/Cymbal Choice.*?\.\s*/g, "") || "",
          };
        } else {
          // Switch to Cymbal Choice (-25% discount)
          const savings = Number((item.estimatedPrice * 0.25).toFixed(2));
          const newPrice = Math.max(1, Number((item.estimatedPrice - savings).toFixed(2)));
          return {
            ...item,
            brandType: "Cymbal Choice" as const,
            estimatedPrice: newPrice,
            rollbackSavings: savings,
            shoppingNotes: `Cymbal Choice Rollback Applied (Saved $${savings}). ${item.shoppingNotes || ""}`.trim(),
          };
        }
      }
      return item;
    });

    onUpdatePlan(recalculatePartyPlan(plan, updatedItems));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const rollback = newItemBrand === "Cymbal Choice" ? Number((newItemPrice * 0.25).toFixed(2)) : 0;
    const newItem: ShoppingItem = {
      id: `manual-item-${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: newItemQty.trim() || "1",
      estimatedPrice: Number(newItemPrice) || 0,
      recommendedStore: newItemStore,
      brandType: newItemBrand,
      cymbalAisle: newItemAisle.trim() || "Aisle 3 (General Grocery)",
      rollbackSavings: rollback,
      priority: newItemPriority,
      isChecked: false,
      isOwned: false,
      shoppingNotes: newItemNotes.trim(),
    };

    onUpdatePlan(addShoppingItem(plan, newItem));

    // Reset form
    setNewItemName("");
    setNewItemPrice(10);
    setNewItemNotes("");
    setNewItemAisle("");
    setShowAddForm(false);
  };

  const handleAddQuickEssential = (essential: (typeof QUICK_ESSENTIALS)[0]) => {
    const newItem: ShoppingItem = {
      id: `essential-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: essential.name,
      category: essential.category,
      quantity: essential.qty,
      estimatedPrice: essential.price,
      recommendedStore: "CymbalMart Supercenter",
      cymbalAisle: essential.aisle,
      brandType: essential.brand,
      rollbackSavings: Number((essential.price * 0.25).toFixed(2)),
      priority: "must-have",
      isChecked: false,
      isOwned: false,
      shoppingNotes: `Quick-added party essential. Located in ${essential.aisle}`,
    };

    onUpdatePlan(addShoppingItem(plan, newItem));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updatedItems = plan.items.map((i) => (i.id === editingItem.id ? editingItem : i));
    onUpdatePlan(recalculatePartyPlan(plan, updatedItems));
    setEditingItem(null);
  };

  const handleMarkAll = (checked: boolean) => {
    const updatedItems = plan.items.map((i) => ({ ...i, isChecked: checked }));
    onUpdatePlan(recalculatePartyPlan(plan, updatedItems));
    if (checked) {
      confetti({ particleCount: 70, spread: 60 });
    }
  };

  const handleApplyGuestCountChange = () => {
    if (tempGuestCount <= 0 || tempGuestCount === plan.guestCount) {
      setShowGuestAdjuster(false);
      return;
    }

    const scaleFactor = tempGuestCount / plan.guestCount;
    const scaledPlan = scaleShoppingListQuantities(
      {
        ...plan,
        guestCount: tempGuestCount,
        portionGuide: {
          ...plan.portionGuide,
          totalDrinkServings: Math.ceil(plan.portionGuide.totalDrinkServings * scaleFactor),
          iceLbsNeeded: Math.ceil(plan.portionGuide.iceLbsNeeded * scaleFactor),
        },
      },
      scaleFactor
    );

    onUpdatePlan(scaledPlan);
    setShowGuestAdjuster(false);
  };

  // Group items by category or store
  const groupedData = useMemo<Record<string, ShoppingItem[]>>(() => {
    if (groupBy === "none") {
      return { "All Items": filteredItems };
    }

    const groups: Record<string, ShoppingItem[]> = {};

    filteredItems.forEach((item) => {
      const key = groupBy === "category" ? item.category : item.recommendedStore;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }, [filteredItems, groupBy]);

  return (
    <div className="space-y-6">
      {/* Dynamic Live Budget Summary Header Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                {plan.eventType}
              </span>
              <span className="text-xs text-stone-400 font-medium">
                • {plan.guestCount} Guests ({plan.adultCount} adults, {plan.kidCount} kids) • {plan.durationHours}h ({plan.timeOfDay})
              </span>
              <button
                onClick={() => {
                  setTempGuestCount(plan.guestCount);
                  setShowGuestAdjuster(!showGuestAdjuster);
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium ml-1 flex items-center gap-1"
                title="Adjust guest count and scale shopping quantities"
              >
                <Users className="w-3 h-3" /> Adjust Guests & Scale Portions
              </button>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">
              {plan.title}
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
              {plan.themeDetails.tagline || plan.themeDetails.vibeDescription}
            </p>
          </div>

          {/* Real-time Budget Status Pill Box */}
          <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3.5 flex items-center gap-4 shrink-0 justify-between sm:justify-start">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                Live Cart Total
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white flex items-baseline gap-1">
                <span>${totalEstimatedCost.toFixed(2)}</span>
                <span className="text-xs text-stone-400 font-normal">/ ${plan.budget}</span>
              </div>
            </div>

            <div className="h-10 w-px bg-stone-800" />

            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                {isOverBudget ? "Over Target" : "Remaining"}
              </div>
              <div
                className={`text-sm font-bold font-mono px-2 py-0.5 rounded-md ${
                  isOverBudget
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {isOverBudget ? `+$${budgetDelta}` : `-$${budgetDelta}`}
              </div>
            </div>

            <div className="hidden sm:block h-10 w-px bg-stone-800" />

            <div className="hidden sm:block text-right">
              <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                Cost / Guest
              </div>
              <div className="text-sm font-bold font-mono text-amber-300">
                ${costPerGuest}
              </div>
            </div>
          </div>
        </div>

        {/* Guest Count & Portion Scaling Drawer */}
        {showGuestAdjuster && (
          <div className="mt-4 p-4 rounded-xl bg-stone-950 border border-amber-500/40 animate-in fade-in space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                <Users className="w-4 h-4" />
                <span>Scale Portions & Recalculate Budget</span>
              </div>
              <button
                onClick={() => setShowGuestAdjuster(false)}
                className="text-xs text-stone-400 hover:text-stone-200"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-stone-300">
              Changing your guest count automatically scales all grocery quantities, drinks, ice formula, and recalculates the budget total instantly.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-stone-900 border border-stone-700 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setTempGuestCount((c) => Math.max(2, c - 2))}
                  className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono font-bold text-base px-3 text-white">
                  {tempGuestCount} Guests
                </span>
                <button
                  type="button"
                  onClick={() => setTempGuestCount((c) => c + 2)}
                  className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleApplyGuestCountChange}
                  className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-sm transition-all"
                >
                  Apply & Recalculate List
                </button>
                <button
                  onClick={() => setShowGuestAdjuster(false)}
                  className="px-3 py-2 rounded-lg text-xs text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Visual Budget Progress Bar & Savings Badges */}
        <div className="mt-4 pt-4 border-t border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>
              Budget Utilization: <strong className="text-stone-200">{percentOfBudget}%</strong>
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              {totalCymbalSavings > 0 && (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  🏷️ Cymbal Choice Rollbacks: <strong>-${totalCymbalSavings.toFixed(2)}</strong>
                </span>
              )}
              {totalPantrySavings > 0 && (
                <span className="text-blue-300 font-semibold flex items-center gap-1">
                  🏠 Pantry Deductions: <strong>-${totalPantrySavings.toFixed(2)}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isOverBudget ? "bg-red-500" : percentOfBudget > 85 ? "bg-amber-400" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, percentOfBudget)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 1-Click Fast Add Party Essentials Shelf */}
      <div className="p-3.5 bg-stone-900/90 border border-stone-800 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>1-Click Popular Party Essentials:</span>
          </span>
          <span className="text-[11px] text-stone-400">Adds item & auto-recalculates budget</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_ESSENTIALS.map((item, i) => (
            <button
              key={i}
              onClick={() => handleAddQuickEssential(item)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700/80 hover:border-amber-400 transition-all shrink-0 group"
              title={`Add ${item.name} for $${item.price}`}
            >
              <Plus className="w-3.5 h-3.5 text-amber-400 group-hover:scale-125 transition-transform" />
              <span className="font-medium">{item.name}</span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">${item.price}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar: Search, Filters, Grouping, Add Item */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id="search-items-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items, categories, aisles or stores..."
              className="w-full bg-stone-800 border border-stone-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action Buttons: Add Item & In-Store Mode */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="add-item-toggle-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>

            <button
              id="start-instore-mode-btn"
              onClick={onOpenShoppingMode}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 font-bold text-xs transition-all shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">In-Store Mode</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1 border-t border-stone-800/80">
          {/* Store filter */}
          <div className="flex items-center gap-1.5 bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-700 shrink-0">
            <Store className="w-3.5 h-3.5 text-stone-400" />
            <select
              id="store-filter-select"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-transparent text-stone-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Stores</option>
              {uniqueStores.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-700 shrink-0">
            <Tag className="w-3.5 h-3.5 text-stone-400" />
            <select
              id="category-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-stone-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1.5 bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-700 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
            <select
              id="priority-filter-select"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent text-stone-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="must-have">Must-Haves Only</option>
              <option value="nice-to-have">Nice-to-Haves Only</option>
            </select>
          </div>

          {/* Mark All / Unmark Buttons */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button
              id="mark-all-done-btn"
              onClick={() => handleMarkAll(true)}
              className="text-[11px] text-stone-400 hover:text-emerald-400 transition-colors"
            >
              Check All
            </button>
            <span className="text-stone-600">•</span>
            <button
              id="unmark-all-btn"
              onClick={() => handleMarkAll(false)}
              className="text-[11px] text-stone-400 hover:text-amber-400 transition-colors"
            >
              Uncheck All
            </button>
          </div>
        </div>
      </div>

      {/* Inline Quick Add Item Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddItem}
          className="p-4 rounded-xl bg-stone-900 border border-amber-500/40 space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Add Custom Item & Auto-Recalculate</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-stone-400 hover:text-stone-200 text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-stone-400 mb-1">Item Name *</label>
              <input
                id="new-item-name-input"
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Sparkling Apple Cider, Extra Napkins"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-400 mb-1">Category</label>
              <select
                id="new-item-category-select"
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-stone-400 mb-1">Quantity / Count</label>
              <input
                id="new-item-qty-input"
                type="text"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                placeholder="e.g. 2 bags, 24 count"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-stone-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-stone-400 mb-1">Est. Price ($)</label>
              <input
                id="new-item-price-input"
                type="number"
                min="0"
                step="0.5"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-stone-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-400 mb-1">Brand Tier</label>
              <select
                value={newItemBrand}
                onChange={(e) => setNewItemBrand(e.target.value as any)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100"
              >
                <option value="Cymbal Choice">Cymbal Choice (-25% Rollback)</option>
                <option value="Fresh Market">Fresh Market (Organic)</option>
                <option value="Bakery Crafted">Bakery Crafted</option>
                <option value="National Brand">National Brand</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-stone-400 mb-1">CymbalMart Aisle</label>
              <input
                type="text"
                value={newItemAisle}
                onChange={(e) => setNewItemAisle(e.target.value)}
                placeholder="e.g. Aisle 4 (Sauces)"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-400 mb-1">Priority</label>
              <select
                id="new-item-priority-select"
                value={newItemPriority}
                onChange={(e) => setNewItemPriority(e.target.value as any)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100"
              >
                <option value="must-have">Must-Have</option>
                <option value="nice-to-have">Nice-to-Have</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-stone-400 mb-1">Aisle Notes or Brand Preference</label>
            <input
              id="new-item-notes-input"
              type="text"
              value={newItemNotes}
              onChange={(e) => setNewItemNotes(e.target.value)}
              placeholder="e.g. Check bakery section, prefer gluten-free"
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 placeholder-stone-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              id="save-new-item-submit-btn"
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-xs"
            >
              Add to List & Recalculate
            </button>
          </div>
        </form>
      )}

      {/* Shopping List Items Container */}
      <div className="space-y-6">
        {filteredItems.length === 0 ? (
          <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-800 flex items-center justify-center mx-auto text-stone-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No items found matching your filter</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Try adjusting your store, category, or search filters, or click "Add Item" above to create a new one.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedStore("all");
                setSelectedCategory("all");
                setSelectedPriority("all");
                setSelectedStatus("all");
              }}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          (Object.entries(groupedData) as [string, ShoppingItem[]][]).map(([groupTitle, items]) => {
            const groupEstimatedTotal = items.reduce(
              (acc, i) => (i.isOwned ? acc : acc + (i.estimatedPrice || 0)),
              0
            );
            const groupCheckedCount = items.filter((i) => i.isChecked).length;

            return (
              <div
                key={groupTitle}
                className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xs"
              >
                {/* Group Header */}
                <div className="px-4 sm:px-6 py-3 bg-stone-850 border-b border-stone-800/80 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-white font-['Outfit'] flex items-center gap-2">
                      {groupBy === "category" && <Tag className="w-4 h-4 text-amber-400" />}
                      {groupBy === "store" && <Store className="w-4 h-4 text-emerald-400" />}
                      {groupTitle}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700/60 font-mono">
                      {groupCheckedCount}/{items.length} bought
                    </span>
                  </div>

                  <div className="text-xs text-stone-400 font-mono">
                    Subtotal: <span className="font-bold text-emerald-400">${groupEstimatedTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Group Items */}
                <div className="divide-y divide-stone-800/60">
                  {items.map((item) => {
                    const isExpanded = expandedItemId === item.id;
                    const catClass = CATEGORY_COLORS[item.category] || CATEGORY_COLORS["Miscellaneous"];

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 sm:p-4 transition-colors hover:bg-stone-850/50 ${
                          item.isChecked ? "bg-stone-900/40 opacity-75" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Checkbox and main title */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              id={`toggle-item-${item.id}`}
                              onClick={() => handleToggleCheck(item.id)}
                              className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                                item.isChecked
                                  ? "bg-emerald-600 border-emerald-500 text-white"
                                  : "border-stone-600 bg-stone-800 hover:border-amber-400"
                              }`}
                            >
                              {item.isChecked && <Check className="w-3.5 h-3.5" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-sm font-semibold tracking-tight ${
                                    item.isChecked
                                      ? "line-through text-stone-400"
                                      : item.isOwned
                                      ? "text-stone-400"
                                      : "text-stone-100"
                                  }`}
                                >
                                  {item.name}
                                </span>

                                {/* Interactive Quantity Increment/Decrement Controller */}
                                <div className="flex items-center gap-1 bg-stone-800 border border-stone-700 rounded-md px-1.5 py-0.5">
                                  <button
                                    onClick={() => handleAdjustQuantity(item.id, -1)}
                                    className="p-0.5 text-stone-400 hover:text-amber-300 transition-colors"
                                    title="Decrease quantity & price"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-xs font-mono font-bold text-stone-200 px-1">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => handleAdjustQuantity(item.id, 1)}
                                    className="p-0.5 text-stone-400 hover:text-amber-300 transition-colors"
                                    title="Increase quantity & price"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                {item.isOwned && (
                                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium flex items-center gap-1">
                                    <Home className="w-3 h-3" /> Have at home ($0)
                                  </span>
                                )}

                                {item.priority === "nice-to-have" && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 font-medium">
                                    Optional
                                  </span>
                                )}
                              </div>

                              {/* Badges row */}
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-stone-400">
                                <span
                                  className={`text-[11px] px-2 py-0.5 rounded border font-medium ${catClass}`}
                                >
                                  {item.category}
                                </span>

                                {/* Clickable Brand Pill for Instant Rollback Switch */}
                                <button
                                  onClick={() => handleToggleBrand(item.id)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all border ${
                                    item.brandType === "Cymbal Choice"
                                      ? "bg-blue-900/50 text-blue-300 border-blue-500/40 hover:bg-blue-900"
                                      : "bg-stone-800 text-stone-300 border-stone-700 hover:border-amber-400"
                                  }`}
                                  title="Click to toggle Cymbal Choice brand savings"
                                >
                                  {item.brandType === "Cymbal Choice" ? "🏷️ Cymbal Choice" : item.brandType || "National Brand"}
                                </button>

                                {item.cymbalAisle && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-stone-800 text-amber-300/90 border border-stone-700">
                                    📍 {item.cymbalAisle}
                                  </span>
                                )}

                                {item.rollbackSavings && item.rollbackSavings > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                                    Saved -${item.rollbackSavings.toFixed(2)}
                                  </span>
                                )}

                                <span className="text-[11px] flex items-center gap-1 text-stone-400">
                                  <Store className="w-3 h-3 text-stone-400" />
                                  <span>{item.recommendedStore}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Price & Expand button */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right font-mono">
                              <button
                                onClick={() => setEditingItem(item)}
                                className={`text-sm font-black transition-colors hover:underline ${
                                  item.isOwned
                                    ? "text-stone-500 line-through"
                                    : item.isChecked
                                    ? "text-emerald-400"
                                    : "text-amber-300"
                                }`}
                                title="Click to edit price"
                              >
                                ${Number(item.estimatedPrice).toFixed(2)}
                              </button>
                            </div>

                            <button
                              id={`expand-item-${item.id}`}
                              onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                              title="Toggle details"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expanded detail box */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-stone-800/80 bg-stone-950/40 rounded-lg p-3 text-xs space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-300">
                              <div>
                                <span className="text-stone-400 font-semibold block mb-0.5">
                                  Shopping Notes & Aisle Tips:
                                </span>
                                <p className="text-stone-200">
                                  {item.shoppingNotes || "No specific brand/aisle notes."}
                                </p>
                              </div>
                              <div>
                                <span className="text-stone-400 font-semibold block mb-0.5">
                                  Budget / Dietary Substitution Option:
                                </span>
                                <p className="text-amber-300/90">
                                  {item.substituteOption || "Standard selection."}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-stone-800/60 flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  id={`toggle-owned-${item.id}`}
                                  onClick={() => handleToggleOwned(item.id)}
                                  className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1 transition-all ${
                                    item.isOwned
                                      ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                                      : "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700"
                                  }`}
                                >
                                  <Home className="w-3 h-3" />
                                  <span>{item.isOwned ? "Owned at Home ($0)" : "Mark as Owned at Home"}</span>
                                </button>

                                <button
                                  onClick={() => handleToggleBrand(item.id)}
                                  className="px-2.5 py-1 rounded text-xs font-medium bg-blue-900/40 hover:bg-blue-900/70 text-blue-200 border border-blue-500/40 flex items-center gap-1 transition-all"
                                >
                                  <Percent className="w-3 h-3 text-amber-300" />
                                  <span>{item.brandType === "Cymbal Choice" ? "Switch to National Brand" : "Apply Cymbal Choice (-25%)"}</span>
                                </button>

                                <button
                                  id={`ask-agent-item-${item.id}`}
                                  onClick={() =>
                                    onTriggerAgentPrompt(
                                      `What are cheaper substitutions or better brands for "${item.name}" at CymbalMart?`
                                    )
                                  }
                                  className="px-2.5 py-1 rounded text-xs font-medium bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-all"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Ask CymbalMart Assistant</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  id={`edit-item-${item.id}`}
                                  onClick={() => setEditingItem(item)}
                                  className="p-1.5 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
                                  title="Edit item"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  id={`delete-item-${item.id}`}
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1.5 rounded text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors"
                                  title="Delete item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleSaveEdit}
            className="bg-stone-900 border border-stone-800 rounded-xl p-5 w-full max-w-lg shadow-2xl space-y-4 text-stone-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-['Outfit']">Edit Shopping Item</h3>
              <span className="text-xs text-amber-400 font-mono">Auto-recalculates budget</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-stone-400 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-sm text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">Quantity</label>
                  <input
                    type="text"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: e.target.value })}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Est. Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editingItem.estimatedPrice}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        estimatedPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">Brand Tier</label>
                  <select
                    value={editingItem.brandType || "National Brand"}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        brandType: e.target.value as any,
                      })
                    }
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100"
                  >
                    <option value="Cymbal Choice">Cymbal Choice (Rollback)</option>
                    <option value="Fresh Market">Fresh Market (Organic)</option>
                    <option value="Bakery Crafted">Bakery Crafted</option>
                    <option value="National Brand">National Brand</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Aisle Location</label>
                  <input
                    type="text"
                    value={editingItem.cymbalAisle || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, cymbalAisle: e.target.value })
                    }
                    placeholder="e.g. Aisle 3 (Pantry)"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">Store</label>
                  <select
                    value={editingItem.recommendedStore}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, recommendedStore: e.target.value })
                    }
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100"
                  >
                    {STORE_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone-400 mb-1">Shopping Notes</label>
                <input
                  type="text"
                  value={editingItem.shoppingNotes || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, shoppingNotes: e.target.value })
                  }
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-stone-400 hover:text-stone-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-xs"
              >
                Save & Recalculate Budget
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
