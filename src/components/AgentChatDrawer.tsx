import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  Scissors,
  Coffee,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { PartyPlan, AgentMessage, ProposedAction, ShoppingItem } from "../types";
import { askAgentChatAPI } from "../services/api";

interface AgentChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PartyPlan;
  onUpdatePlan: (updated: PartyPlan) => void;
  externalPrompt?: string | null;
  onClearExternalPrompt?: () => void;
}

const CATEGORY_PROMPTS = {
  all: [
    "🛒 How does CymbalMart Curbside Pickup work?",
    "🏷️ Suggest 3 Cymbal Choice brand swaps to save $30",
    "📍 Show me aisle locations for all my party items",
    "🍹 Give me the exact big-batch signature drink recipe",
    "🥗 Add allergen-safe and gluten-free items to my list",
    "🧊 Is our ice calculation enough for our guest count?",
    "📦 What is CymbalMart's 90-day return policy?",
    "🎂 Can I order a custom sheet cake from the Bakery Counter?",
  ],
  party: [
    "🧊 Calculate exact drink and ice portions for our guest count",
    "🥗 Add 2 crowd-favorite finger foods & appetizers",
    "🍹 Big-batch mocktail and signature cocktail recipe with ingredients",
    "💡 What essential party items are missing from our checklist?",
  ],
  savings: [
    "🏷️ Suggest 3 Cymbal Choice brand swaps to save $30",
    "✂️ Cut $40 from our budget without hurting guest experience",
    "💰 Show me bulk buy discounts for drinks & partyware",
    "🔥 Compare Cymbal Choice vs National Brand pricing",
  ],
  store: [
    "🛒 How does CymbalMart Curbside Pickup work?",
    "📍 What aisle are paper plates, napkins, and balloons in?",
    "🚚 What are today's same-day delivery windows?",
    "📦 What is CymbalMart's return policy on unopened party supplies?",
  ],
  dietary: [
    "🥗 Suggest gluten-free and vegan snack alternatives",
    "🥜 Check our list for common nut and dairy allergens",
    "🥤 Add low-sugar and non-alcoholic drink options",
    "🥑 Recommend organic produce options from Fresh Market",
  ],
};

export const AgentChatDrawer: React.FC<AgentChatDrawerProps> = ({
  isOpen,
  onClose,
  plan,
  onUpdatePlan,
  externalPrompt,
  onClearExternalPrompt,
}) => {
  const [activeCategory, setActiveCategory] = useState<"all" | "party" | "savings" | "store" | "dietary">("all");
  const [messages, setMessages] = useState<AgentMessage[]>(() => [
    {
      id: "welcome-msg",
      sender: "agent",
      text: `Hello! I'm the **CymbalMart Assistant** 🛒✨\n\nI'm your 24/7 AI concierge here to help you plan **${plan?.title || "your event"}** (${plan?.guestCount || 10} guests, $${plan?.budget || 200} budget), answer any CymbalMart store questions, find aisle locations, calculate drink/food portions, or modify your shopping cart live.\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedQuickReplies: [
        "Curbside pickup info",
        "Cymbal Choice swaps",
        "Aisle locations",
        "Portion check",
      ],
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync greeting when active plan changes
  useEffect(() => {
    if (plan?.id) {
      setMessages([
        {
          id: `welcome-${plan.id}`,
          sender: "agent",
          text: `Hello! I'm the **CymbalMart Assistant** 🛒✨\n\nI'm currently assisting with your **${plan.title || "Event Plan"}** for **${plan.guestCount || 10} guests** ($${plan.budget || 200} budget). I can help you find Cymbal Choice rollback savings, calculate catering formulas, map store aisles, or answer any CymbalMart customer questions.\n\nWhat would you like to explore?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          suggestedQuickReplies: [
            "Curbside pickup info",
            "Cymbal Choice swaps",
            "Aisle locations",
            "Portion check",
          ],
        },
      ]);
    }
  }, [plan?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle incoming external prompts from other views
  useEffect(() => {
    if (externalPrompt && externalPrompt.trim()) {
      handleSendMessage(externalPrompt);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [externalPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await askAgentChatAPI(query, plan, messages);

      const agentMessage: AgentMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: response.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedQuickReplies: response.suggestedQuickReplies,
        proposedActions: response.proposedActions,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "agent",
          text: `⚠️ **Agent Notice**: ${err.message || "I encountered an issue generating a response. Please try asking again."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply Action to Party Plan Shopping List
  const handleApplyAction = (action: ProposedAction) => {
    let updatedItems = [...plan.items];

    if (action.actionType === "ADD_ITEM" && action.item) {
      const newItem: ShoppingItem = {
        id: `agent-add-${Date.now()}`,
        name: action.item.name || "New Item",
        category: action.item.category || "Miscellaneous",
        quantity: action.item.quantity || "1",
        estimatedPrice: action.item.estimatedPrice || 10,
        recommendedStore: action.item.recommendedStore || "Local Supermarket",
        priority: (action.item.priority as any) || "must-have",
        dietaryFlags: action.item.dietaryFlags || [],
        shoppingNotes: action.item.shoppingNotes || "Added by AI Shopping Agent",
        isChecked: false,
        isOwned: false,
      };
      updatedItems.push(newItem);
    } else if (action.actionType === "REMOVE_ITEM" && action.targetItemName) {
      updatedItems = updatedItems.filter(
        (i) => !i.name.toLowerCase().includes(action.targetItemName!.toLowerCase())
      );
    } else if (action.actionType === "UPDATE_ITEM" && action.targetItemName && action.item) {
      updatedItems = updatedItems.map((i) => {
        if (i.name.toLowerCase().includes(action.targetItemName!.toLowerCase())) {
          return {
            ...i,
            ...action.item,
          };
        }
        return i;
      });
    }

    onUpdatePlan({
      ...plan,
      items: updatedItems,
      budgetSummary: {
        ...plan.budgetSummary,
        totalEstimatedCost: updatedItems.reduce((acc, i) => (i.isOwned ? acc : acc + (i.estimatedPrice || 0)), 0),
      },
      updatedAt: new Date().toISOString(),
    });

    // Notify user in chat
    setMessages((prev) => [
      ...prev,
      {
        id: `action-applied-${Date.now()}`,
        sender: "agent",
        text: `✅ **Applied to Shopping List:** ${action.description}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[500px] bg-stone-900 border-l border-stone-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-stone-800 bg-stone-850 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md border border-blue-400/30">
            <Bot className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-white font-['Outfit'] flex items-center gap-1.5">
                <span>CymbalMart Assistant</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 font-bold border border-blue-500/30">
                  AI Concierge
                </span>
              </h3>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-stone-400 truncate max-w-[280px]">
              Assisting with: {plan?.title || "Customer Inquiry"} ({plan?.guestCount ? `${plan.guestCount} guests` : "Store Concierge"})
            </p>
          </div>
        </div>

        <button
          id="close-agent-drawer-btn"
          onClick={onClose}
          className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          title="Close CymbalMart Assistant"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Category Filter Pills Ribbon */}
      <div className="px-3 py-2 border-b border-stone-800/80 bg-stone-900/90 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0 text-xs">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
            activeCategory === "all"
              ? "bg-blue-600 text-white"
              : "bg-stone-800 text-stone-400 hover:text-stone-200"
          }`}
        >
          🌟 All FAQs
        </button>
        <button
          onClick={() => setActiveCategory("store")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
            activeCategory === "store"
              ? "bg-blue-600 text-white"
              : "bg-stone-800 text-stone-400 hover:text-stone-200"
          }`}
        >
          🛒 Store & Pickup
        </button>
        <button
          onClick={() => setActiveCategory("savings")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
            activeCategory === "savings"
              ? "bg-blue-600 text-white"
              : "bg-stone-800 text-stone-400 hover:text-stone-200"
          }`}
        >
          🏷️ Cymbal Rollbacks
        </button>
        <button
          onClick={() => setActiveCategory("party")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
            activeCategory === "party"
              ? "bg-blue-600 text-white"
              : "bg-stone-800 text-stone-400 hover:text-stone-200"
          }`}
        >
          🎉 Party Math
        </button>
        <button
          onClick={() => setActiveCategory("dietary")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
            activeCategory === "dietary"
              ? "bg-blue-600 text-white"
              : "bg-stone-800 text-stone-400 hover:text-stone-200"
          }`}
        >
          🥗 Dietary & Allergens
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-amber-300 flex items-center justify-center shrink-0 border border-blue-500/40">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 leading-relaxed ${
                  isUser
                    ? "bg-amber-400 text-stone-950 font-medium rounded-br-none"
                    : msg.isError
                    ? "bg-red-950/60 text-red-200 border border-red-800 rounded-bl-none"
                    : "bg-stone-800 text-stone-100 border border-stone-700/80 rounded-bl-none"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                  {msg.text}
                </div>

                {/* Proposed Actions (1-Click Apply to Shopping List) */}
                {msg.proposedActions && msg.proposedActions.length > 0 && (
                  <div className="pt-2 border-t border-stone-700/60 space-y-1.5">
                    <span className="text-[11px] font-semibold text-amber-300 block">
                      Proposed List Modifications:
                    </span>
                    {msg.proposedActions.map((action, aIdx) => (
                      <div
                        key={aIdx}
                        className="p-2 rounded-lg bg-stone-900/90 border border-stone-700 flex items-center justify-between gap-2"
                      >
                        <div className="text-[11px] text-stone-200 truncate">
                          <span className="font-semibold text-amber-400">[{action.actionType}]</span>{" "}
                          {action.description}
                        </div>
                        <button
                          id={`apply-action-btn-${aIdx}`}
                          onClick={() => handleApplyAction(action)}
                          className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[10px] shrink-0 shadow-xs flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Apply</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Quick Replies */}
                {msg.suggestedQuickReplies && msg.suggestedQuickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {msg.suggestedQuickReplies.map((reply, rIdx) => (
                      <button
                        key={rIdx}
                        onClick={() => handleSendMessage(reply)}
                        className="text-[11px] px-2 py-1 rounded-md bg-stone-900/80 hover:bg-stone-900 text-amber-300 border border-amber-500/30 transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[10px] ${
                    isUser ? "text-stone-800 text-right" : "text-stone-400"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-amber-300 flex items-center justify-center shrink-0 border border-blue-500/40">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-stone-800 border border-stone-700/80 rounded-2xl rounded-bl-none p-3 text-stone-300 text-xs flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
              <span>CymbalMart Assistant is checking the store inventory & formulas...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Chips Ribbon for Active Category */}
      <div className="p-2 border-t border-stone-800/80 bg-stone-900/80 overflow-x-auto scrollbar-none flex gap-1.5 shrink-0">
        {CATEGORY_PROMPTS[activeCategory].map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="text-[11px] px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 border border-stone-700 whitespace-nowrap transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-stone-800 bg-stone-850 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="agent-chat-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask CymbalMart Assistant: e.g. Curbside pickup, find Aisle 7, cut $30..."
            className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            id="agent-chat-send-btn"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-bold transition-all shadow-sm shrink-0"
            title="Send message to CymbalMart Assistant"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
