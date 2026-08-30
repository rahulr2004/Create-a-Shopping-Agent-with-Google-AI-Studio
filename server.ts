import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK with server-side API Key
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// 1. Generate full structured Party & Shopping Plan
app.post("/api/plan-party", async (req, res) => {
  try {
    const {
      title,
      eventType,
      theme,
      guestCount,
      adultCount,
      kidCount,
      durationHours,
      timeOfDay,
      budget,
      dietaryRestrictions,
      venue,
      notes,
    } = req.body;

    const ai = getGenAI();

    const prompt = `You are an elite Party Planner & CymbalMart Master Shopping Logistics Agent. Create a comprehensive, realistic, and budget-conscious party plan and itemized CymbalMart shopping list for the following event:

Event Title: ${title || "Celebration Party"}
Event Type: ${eventType || "Birthday Party"}
Theme / Vibe: ${theme || "Festive & Fun"}
Total Guests: ${guestCount || 20} (Adults: ${adultCount || 20}, Kids: ${kidCount || 0})
Duration: ${durationHours || 4} hours
Time of Day: ${timeOfDay || "Evening"}
Target Budget: $${budget || 300}
Dietary Restrictions / Preferences: ${dietaryRestrictions?.join(", ") || "None"}
Venue: ${venue || "Indoor / Home"}
Additional Notes & Special Requests: ${notes || "None"}

Please calculate exact food and drink quantities using party math (e.g. 2 drinks/person in hour 1, 1 drink/person/hour after; 6-8 appetizer pieces/person or proper protein/side portions; 1.5 lbs ice per person). Assign realistic CymbalMart grocery/supply prices.

For every item:
- Name the exact product with brand tier (e.g. "Cymbal Choice", "National Brand", "Fresh Market", or "Bakery Crafted").
- Assign a specific CymbalMart aisle (e.g. "Aisle 3 (Pantry & Sauces)", "Aisle 7 (Beverages & Mixers)", "Bakery Dept", "Meat & Seafood Counter", "Aisle 14 (Partyware & Decor)").
- Mark must-have vs nice-to-have.
- Note any Cymbal Rollback savings ($).
- Provide prep timeline milestones, budget optimization tips, and theme inspiration.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            themeDetails: {
              type: Type.OBJECT,
              properties: {
                tagline: { type: Type.STRING },
                colorPalette: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                vibeDescription: { type: Type.STRING },
                signatureDrinkName: { type: Type.STRING },
                signatureDrinkDescription: { type: Type.STRING },
                playlistMood: { type: Type.STRING },
              },
              required: ["tagline", "colorPalette", "vibeDescription", "signatureDrinkName"],
            },
            portionGuide: {
              type: Type.OBJECT,
              properties: {
                totalDrinkServings: { type: Type.NUMBER },
                iceLbsNeeded: { type: Type.NUMBER },
                appetizerPieces: { type: Type.NUMBER },
                mainProteinLbs: { type: Type.NUMBER },
                notes: { type: Type.STRING },
              },
              required: ["totalDrinkServings", "iceLbsNeeded", "notes"],
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    description: "One of: Groceries & Mains, Appetizers & Snacks, Drinks & Bar, Desserts & Sweets, Tableware & Disposables, Decor & Balloons, Ice & Coolers, Party Favors & Games, Miscellaneous",
                  },
                  quantity: { type: Type.STRING, description: "e.g. 3 packs (24 count), 2 gallons, 15 lbs" },
                  estimatedPrice: { type: Type.NUMBER, description: "Total estimated USD price" },
                  recommendedStore: {
                    type: Type.STRING,
                    description: "e.g. CymbalMart Supercenter, CymbalMart Fresh Market, CymbalMart Bakery, CymbalMart Party Aisle, Wholesale Club",
                  },
                  cymbalAisle: {
                    type: Type.STRING,
                    description: "e.g. Aisle 4 (Condiments), Bakery Counter, Aisle 12 (Party Supplies)",
                  },
                  brandType: {
                    type: Type.STRING,
                    description: "Cymbal Choice, National Brand, Fresh Market, or Bakery Crafted",
                  },
                  rollbackSavings: {
                    type: Type.NUMBER,
                    description: "Estimated dollars saved with Cymbal Rollback / Member price",
                  },
                  priority: {
                    type: Type.STRING,
                    description: "must-have or nice-to-have",
                  },
                  dietaryFlags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "e.g. Vegan, Gluten-Free, Nut-Free, Dairy-Free, Kid-Friendly, Non-Alcoholic",
                  },
                  shoppingNotes: { type: Type.STRING, description: "Tips on brand, flavor, or aisle" },
                  substituteOption: { type: Type.STRING, description: "Cheaper or dietary alternative" },
                },
                required: ["name", "category", "quantity", "estimatedPrice", "recommendedStore", "priority"],
              },
            },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeframe: { type: Type.STRING, description: "e.g. 3 Days Before, 1 Day Before, Morning of Party, 2 Hours Before, Party Kickoff" },
                  task: { type: Type.STRING },
                  category: { type: Type.STRING, description: "Shopping, Prep, Decor, or Bar" },
                },
                required: ["timeframe", "task", "category"],
              },
            },
            budgetSummary: {
              type: Type.OBJECT,
              properties: {
                totalEstimatedCost: { type: Type.NUMBER },
                costPerGuest: { type: Type.NUMBER },
                topSavingsTip: { type: Type.STRING },
                splurgeRecommendation: { type: Type.STRING },
                cymbalRollbackSavings: { type: Type.NUMBER },
              },
              required: ["totalEstimatedCost", "costPerGuest", "topSavingsTip"],
            },
          },
          required: ["themeDetails", "portionGuide", "items", "timeline", "budgetSummary"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error generating party plan:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate party plan" });
  }
});

// 2. Interactive CymbalMart Assistant Chatbot Endpoint
app.post("/api/agent-chat", async (req, res) => {
  try {
    const { message, currentPlan, chatHistory } = req.body;
    const ai = getGenAI();

    const systemPrompt = `You are "CymbalMart Assistant", the friendly, knowledgeable, and proactive AI retail customer concierge and party planning assistant for CymbalMart.

Your primary mission is to interact with CymbalMart customers to provide stellar customer service, party planning logistics, budget optimization, grocery/retail advice, aisle directions, and live shopping list updates.

Customer & Party Context (if available):
- Active Event Title: ${currentPlan?.title || "Customer Inquiry / Party Planning"}
- Guests: ${currentPlan?.guestCount || "Not specified"} (Adults: ${currentPlan?.adultCount || "N/A"}, Kids: ${currentPlan?.kidCount || "N/A"})
- Budget: $${currentPlan?.budget || "N/A"}
- Current Total Estimated Cost: $${currentPlan?.budgetSummary?.totalEstimatedCost || 0}
- Dietary restrictions: ${currentPlan?.dietaryRestrictions?.join(", ") || "None"}
- Items in cart/checklist: ${currentPlan?.items?.length || 0}
- Sample items: ${currentPlan?.items?.slice(0, 8).map((i: any) => `${i.name} ($${i.estimatedPrice})`).join(", ") || "None yet"}

CymbalMart Store Knowledge & Capabilities:
1. **Customer Service & Store FAQs**:
   - Curbside Pickup: Free for orders over $35. Ready in as little as 2 hours at the designated blue pickup bays.
   - Delivery: Same-day express 2-hour delivery available or scheduled delivery slots.
   - Return Policy: 90-day hassle-free returns with digital receipt or order confirmation number.
   - Brands: "Cymbal Choice" (top-tier quality at rollback value prices, saving 20-35%), "Fresh Market" (premium organic produce & meats), "Bakery Crafted" (freshly baked breads, customized party sheet cakes, pastries), and National Brands.
   - Aisle directory: Produce & Deli (Aisles 1-2), Pantry & Sauces (Aisles 3-4), Snacks & Candy (Aisles 5-6), Beverages & Mixers (Aisles 7-8), Dairy & Frozen (Aisles 9-11), Partyware, Balloons & Disposables (Aisles 12-14), Bakery Counter & Meat Counter (Perimeter).

2. **Party & Catering Advice**:
   - Calculate exact food/drink formulas (e.g. 2 drinks/person in 1st hour, 1/hr after; 1.5 lbs ice per person; 6-8 appetizer portions per guest).
   - Provide big-batch cocktail and mocktail recipes with exact CymbalMart ingredient measurements.
   - Suggest dietary substitutions (gluten-free, nut-free, vegan, kosher, dairy-free).
   - Recommend smart budget rollbacks and bulk quantity savings.

3. **Live Checklist Modification**:
   - When the customer asks to add, remove, substitute, or trim items (e.g. "Add vegan dip", "Swap soda for sparkling water", "Cut $25 from my list"), return structured proposedActions (actionType: "ADD_ITEM", "REMOVE_ITEM", "UPDATE_ITEM").

Tone & Style:
- Professional, welcoming, helpful, concise, and upbeat.
- Use clear markdown with bold text and bullet points.
- Respond in JSON format with replyText, suggestedQuickReplies, and optional proposedActions.`;

    const contents: any[] = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const msg of chatHistory.slice(-6)) {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: `User request: ${message}\n\nPlease respond with advice and any list action recommendations.` }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyText: { type: Type.STRING },
            suggestedQuickReplies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            proposedActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  actionType: { type: Type.STRING, description: "ADD_ITEM, REMOVE_ITEM, or UPDATE_ITEM" },
                  description: { type: Type.STRING, description: "User readable explanation of change" },
                  item: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      category: { type: Type.STRING },
                      quantity: { type: Type.STRING },
                      estimatedPrice: { type: Type.NUMBER },
                      recommendedStore: { type: Type.STRING },
                      priority: { type: Type.STRING },
                      dietaryFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
                      shoppingNotes: { type: Type.STRING },
                    },
                  },
                  targetItemName: { type: Type.STRING, description: "If removing or updating, the name of the existing item" },
                },
                required: ["actionType", "description"],
              },
            },
          },
          required: ["replyText", "suggestedQuickReplies"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error in agent chat:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to chat with agent" });
  }
});

// 3. AI Budget Optimization & Trade-off engine
app.post("/api/optimize-budget", async (req, res) => {
  try {
    const { items, targetBudget, currentTotal } = req.body;
    const ai = getGenAI();

    const prompt = `Analyze this party shopping list and provide concrete, specific budget optimizations to hit or stay comfortably under a target budget of $${targetBudget} (Current total: $${currentTotal}).

Items:
${JSON.stringify(items, null, 2)}

Provide:
1. 3-4 High-impact swaps (cheaper store alternatives, bulk buying hacks, DIY vs store-bought).
2. Nice-to-have items that can be safely eliminated without hurting guest experience.
3. Estimated total savings if recommendations are followed.
4. Summary recommendation.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            potentialSavings: { type: Type.NUMBER },
            optimizedTotal: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            recommendedSwaps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalItem: { type: Type.STRING },
                  replacementSuggestion: { type: Type.STRING },
                  savingsEstimate: { type: Type.NUMBER },
                  rationale: { type: Type.STRING },
                },
                required: ["originalItem", "replacementSuggestion", "savingsEstimate", "rationale"],
              },
            },
            itemsToTrim: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemName: { type: Type.STRING },
                  cost: { type: Type.NUMBER },
                  impactLevel: { type: Type.STRING, description: "Low impact, Medium impact" },
                  reason: { type: Type.STRING },
                },
                required: ["itemName", "cost", "impactLevel", "reason"],
              },
            },
            bulkBuyTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["potentialSavings", "optimizedTotal", "summary", "recommendedSwaps", "itemsToTrim"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error optimizing budget:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to optimize budget" });
  }
});

// Vite Middleware for development vs static serve for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Party Planner Shopping Agent running on http://localhost:${PORT}`);
  });
}

startServer();
