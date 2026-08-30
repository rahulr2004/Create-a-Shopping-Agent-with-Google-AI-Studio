import { PartyPlan, ShoppingItem, BudgetSummary } from "../types";

/**
 * Calculates updated budget summary metrics from a list of shopping items
 */
export function calculateBudgetSummary(
  items: ShoppingItem[],
  budget: number,
  guestCount: number,
  existingSummary?: Partial<BudgetSummary>
): BudgetSummary {
  const storeItems = items.filter((i) => !i.isOwned);
  
  // Total cost of all items that need to be purchased
  const totalEstimatedCost = Number(
    storeItems.reduce((sum, item) => sum + (Number(item.estimatedPrice) || 0), 0).toFixed(2)
  );

  // Cost per guest
  const validGuestCount = Math.max(1, guestCount || 1);
  const costPerGuest = Number((totalEstimatedCost / validGuestCount).toFixed(2));

  // Calculated Cymbal Choice Rollback Savings
  const cymbalRollbackSavings = Number(
    storeItems.reduce((sum, item) => {
      if (item.rollbackSavings && item.rollbackSavings > 0) {
        return sum + item.rollbackSavings;
      }
      if (item.brandType === "Cymbal Choice") {
        return sum + Number(((item.estimatedPrice || 0) * 0.25).toFixed(2));
      }
      return sum;
    }, 0).toFixed(2)
  );

  let topSavingsTip = existingSummary?.topSavingsTip || "Swap national brands for Cymbal Choice for up to 30% savings.";
  if (totalEstimatedCost > budget) {
    const overage = (totalEstimatedCost - budget).toFixed(2);
    topSavingsTip = `Currently $${overage} over budget. Consider switching items to Cymbal Choice or marking pantry items.`;
  } else {
    const savings = (budget - totalEstimatedCost).toFixed(2);
    topSavingsTip = `Under budget by $${savings}! Perfect time for a signature dessert or specialty cocktail.`;
  }

  return {
    totalEstimatedCost,
    costPerGuest,
    topSavingsTip,
    splurgeRecommendation: existingSummary?.splurgeRecommendation,
    cymbalRollbackSavings,
  };
}

/**
 * Recalculates an entire party plan when items change
 */
export function recalculatePartyPlan(plan: PartyPlan, updatedItems: ShoppingItem[]): PartyPlan {
  const newBudgetSummary = calculateBudgetSummary(
    updatedItems,
    plan.budget,
    plan.guestCount,
    plan.budgetSummary
  );

  return {
    ...plan,
    items: updatedItems,
    budgetSummary: newBudgetSummary,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Helper to update a single item in a plan with auto budget recalculation
 */
export function updateShoppingItem(
  plan: PartyPlan,
  itemId: string,
  updates: Partial<ShoppingItem>
): PartyPlan {
  const updatedItems = plan.items.map((item) => {
    if (item.id === itemId) {
      return { ...item, ...updates };
    }
    return item;
  });

  return recalculatePartyPlan(plan, updatedItems);
}

/**
 * Helper to add a new shopping item with auto budget recalculation
 */
export function addShoppingItem(plan: PartyPlan, newItem: ShoppingItem): PartyPlan {
  const updatedItems = [...plan.items, newItem];
  return recalculatePartyPlan(plan, updatedItems);
}

/**
 * Helper to remove a shopping item with auto budget recalculation
 */
export function removeShoppingItem(plan: PartyPlan, itemId: string): PartyPlan {
  const updatedItems = plan.items.filter((item) => item.id !== itemId);
  return recalculatePartyPlan(plan, updatedItems);
}

/**
 * Helper to scale item quantities and prices when guest count or portion scaling changes
 */
export function scaleShoppingListQuantities(
  plan: PartyPlan,
  scaleFactor: number
): PartyPlan {
  if (scaleFactor <= 0) return plan;

  const updatedItems = plan.items.map((item) => {
    // If it's a fixed supply or tableware, scale lightly
    const newPrice = Number((item.estimatedPrice * scaleFactor).toFixed(2));
    
    // Parse quantity numbers if present
    const qtyMatch = item.quantity.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    let newQty = item.quantity;
    if (qtyMatch) {
      const num = parseFloat(qtyMatch[1]);
      const unit = qtyMatch[2];
      const scaledNum = Math.ceil(num * scaleFactor);
      newQty = `${scaledNum} ${unit}`.trim();
    }

    return {
      ...item,
      estimatedPrice: newPrice,
      quantity: newQty,
    };
  });

  return recalculatePartyPlan(plan, updatedItems);
}
