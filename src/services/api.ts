import { PartyPlan, AgentMessage, BudgetOptimizationResult } from "../types";

export interface GeneratePartyParams {
  title: string;
  eventType: string;
  theme: string;
  guestCount: number;
  adultCount: number;
  kidCount: number;
  durationHours: number;
  timeOfDay: string;
  budget: number;
  dietaryRestrictions: string[];
  venue: string;
  notes?: string;
}

export async function generatePartyPlanAPI(params: GeneratePartyParams): Promise<PartyPlan> {
  const response = await fetch("/api/plan-party", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to generate party plan");
  }

  const generated = data.data;

  // Add IDs and isChecked to items if missing
  const items = (generated.items || []).map((item: any, idx: number) => ({
    id: `gen-item-${Date.now()}-${idx}`,
    name: item.name,
    category: item.category || "Miscellaneous",
    quantity: item.quantity || "1",
    estimatedPrice: Number(item.estimatedPrice) || 10,
    actualPrice: undefined,
    isChecked: false,
    isOwned: false,
    recommendedStore: item.recommendedStore || "CymbalMart Supercenter",
    cymbalAisle: item.cymbalAisle || (item.category?.includes("Groceries") ? "Aisle 3 (Pantry)" : item.category?.includes("Drinks") ? "Aisle 7 (Beverages)" : item.category?.includes("Decor") ? "Aisle 12 (Partyware)" : "Aisle 5"),
    brandType: item.brandType || "Cymbal Choice",
    rollbackSavings: Number(item.rollbackSavings) || 0,
    priority: item.priority === "nice-to-have" ? "nice-to-have" : "must-have",
    dietaryFlags: item.dietaryFlags || [],
    shoppingNotes: item.shoppingNotes || "",
    substituteOption: item.substituteOption || "",
  }));

  const timeline = (generated.timeline || []).map((t: any, idx: number) => ({
    id: `tl-${Date.now()}-${idx}`,
    timeframe: t.timeframe || "Day Before",
    task: t.task || "",
    category: t.category || "Prep",
    isCompleted: false,
  }));

  const plan: PartyPlan = {
    id: `party-${Date.now()}`,
    title: params.title,
    eventType: params.eventType,
    theme: params.theme,
    guestCount: params.guestCount,
    adultCount: params.adultCount,
    kidCount: params.kidCount,
    durationHours: params.durationHours,
    timeOfDay: params.timeOfDay as any,
    budget: params.budget,
    dietaryRestrictions: params.dietaryRestrictions,
    venue: params.venue,
    notes: params.notes,
    themeDetails: generated.themeDetails || {
      tagline: `${params.theme} Celebration`,
      colorPalette: ["#F97316", "#0EA5E9", "#10B981"],
      vibeDescription: "Festive and fun gathering for all guests.",
      signatureDrinkName: "House Party Spritzer",
    },
    portionGuide: generated.portionGuide || {
      totalDrinkServings: params.guestCount * params.durationHours,
      iceLbsNeeded: Math.ceil(params.guestCount * 1.5),
      notes: "Calculated with standard party portions.",
    },
    items,
    timeline,
    budgetSummary: generated.budgetSummary || {
      totalEstimatedCost: items.reduce((acc: number, i: any) => acc + i.estimatedPrice, 0),
      costPerGuest: params.guestCount > 0 ? items.reduce((acc: number, i: any) => acc + i.estimatedPrice, 0) / params.guestCount : 0,
      topSavingsTip: "Shop bulk wholesale for drinks, snacks, and disposables.",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return plan;
}

export async function askAgentChatAPI(
  message: string,
  currentPlan: PartyPlan,
  chatHistory: AgentMessage[]
): Promise<{
  replyText: string;
  suggestedQuickReplies: string[];
  proposedActions?: any[];
}> {
  const response = await fetch("/api/agent-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      currentPlan,
      chatHistory,
    }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to communicate with party shopping agent");
  }

  return data.data;
}

export async function optimizeBudgetAPI(
  items: any[],
  targetBudget: number,
  currentTotal: number
): Promise<BudgetOptimizationResult> {
  const response = await fetch("/api/optimize-budget", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items,
      targetBudget,
      currentTotal,
    }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to optimize budget");
  }

  return data.data;
}
