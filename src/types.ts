export type ItemCategory =
  | "Groceries & Mains"
  | "Appetizers & Snacks"
  | "Drinks & Bar"
  | "Desserts & Sweets"
  | "Tableware & Disposables"
  | "Decor & Balloons"
  | "Ice & Coolers"
  | "Party Favors & Games"
  | "Miscellaneous";

export interface ShoppingItem {
  id: string;
  name: string;
  category: ItemCategory | string;
  quantity: string;
  estimatedPrice: number;
  actualPrice?: number;
  isChecked: boolean;
  isOwned?: boolean; // Already have at home
  recommendedStore: string;
  cymbalAisle?: string; // e.g. "Aisle 4 (Condiments)", "Bakery Dept", "Aisle 12 (Partyware)"
  brandType?: "Cymbal Choice" | "National Brand" | "Fresh Market" | "Bakery Crafted";
  rollbackSavings?: number;
  priority: "must-have" | "nice-to-have";
  dietaryFlags?: string[];
  shoppingNotes?: string;
  substituteOption?: string;
}

export interface ThemeDetails {
  tagline: string;
  colorPalette: string[];
  vibeDescription: string;
  signatureDrinkName: string;
  signatureDrinkDescription?: string;
  playlistMood?: string;
}

export interface PortionGuide {
  totalDrinkServings: number;
  iceLbsNeeded: number;
  appetizerPieces?: number;
  mainProteinLbs?: number;
  notes: string;
}

export interface TimelineItem {
  id: string;
  timeframe: string;
  task: string;
  category: "Shopping" | "Prep" | "Decor" | "Bar" | string;
  isCompleted: boolean;
}

export interface BudgetSummary {
  totalEstimatedCost: number;
  costPerGuest: number;
  topSavingsTip: string;
  splurgeRecommendation?: string;
  cymbalRollbackSavings?: number;
}

export interface CymbalFulfillment {
  method: "pickup" | "delivery" | "in-store";
  storeLocation: string;
  timeSlot: string;
  isConfirmed: boolean;
  confirmationNumber?: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  finalizedAt?: string;
}

export interface PartyPlan {
  id: string;
  title: string;
  eventType: string;
  theme: string;
  guestCount: number;
  adultCount: number;
  kidCount: number;
  durationHours: number;
  timeOfDay: "Morning / Brunch" | "Afternoon" | "Evening / Dinner" | "Late Night";
  budget: number;
  dietaryRestrictions: string[];
  venue: string;
  notes?: string;
  themeDetails: ThemeDetails;
  portionGuide: PortionGuide;
  items: ShoppingItem[];
  timeline: TimelineItem[];
  budgetSummary: BudgetSummary;
  fulfillment?: CymbalFulfillment;
  cujStep?: "define" | "review" | "checkout";
  createdAt: string;
  updatedAt: string;
}

export interface ProposedAction {
  actionType: "ADD_ITEM" | "REMOVE_ITEM" | "UPDATE_ITEM";
  description: string;
  item?: Partial<ShoppingItem>;
  targetItemName?: string;
}

export interface AgentMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  suggestedQuickReplies?: string[];
  proposedActions?: ProposedAction[];
  isError?: boolean;
}

export interface BudgetSwap {
  originalItem: string;
  replacementSuggestion: string;
  savingsEstimate: number;
  rationale: string;
}

export interface BudgetTrimItem {
  itemName: string;
  cost: number;
  impactLevel: string;
  reason: string;
}

export interface BudgetOptimizationResult {
  potentialSavings: number;
  optimizedTotal: number;
  summary: string;
  recommendedSwaps: BudgetSwap[];
  itemsToTrim: BudgetTrimItem[];
  bulkBuyTips?: string[];
}

