import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { CUJStepper } from "./components/CUJStepper";
import { ShoppingListView } from "./components/ShoppingListView";
import { RefineCheckoutView } from "./components/RefineCheckoutView";
import { BudgetAnalyticsCard } from "./components/BudgetAnalyticsCard";
import { PartyCalculatorView } from "./components/PartyCalculatorView";
import { TimelinePrepView } from "./components/TimelinePrepView";
import { PartyCreatorModal } from "./components/PartyCreatorModal";
import { InStoreModeModal } from "./components/InStoreModeModal";
import { AgentChatDrawer } from "./components/AgentChatDrawer";
import { ExportShareModal } from "./components/ExportShareModal";
import { VoiceAssistantHUD } from "./components/VoiceAssistantHUD";
import { PartyPlan } from "./types";
import { SAMPLE_PARTY_TEMPLATES } from "./data/templates";
import { Bot, Sparkles, Plus, ShoppingBag, ArrowRight, Mic } from "lucide-react";

const STORAGE_KEY = "cymbalmart_party_planner_plans_v2";
const ACTIVE_ID_KEY = "cymbalmart_party_planner_active_id_v2";

export default function App() {
  const [savedPlans, setSavedPlans] = useState<PartyPlan[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse saved plans:", e);
    }
    return SAMPLE_PARTY_TEMPLATES;
  });

  const [currentPlanId, setCurrentPlanId] = useState<string>(() => {
    try {
      const storedId = localStorage.getItem(ACTIVE_ID_KEY);
      if (storedId) return storedId;
    } catch (e) {}
    return SAMPLE_PARTY_TEMPLATES[0].id;
  });

  const [activeTab, setActiveTab] = useState<"shopping" | "refine_checkout" | "budget" | "calculator" | "timeline">("shopping");
  const [isNewPartyModalOpen, setIsNewPartyModalOpen] = useState(false);
  const [isInStoreModeOpen, setIsInStoreModeOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isVoiceHUDOpen, setIsVoiceHUDOpen] = useState(true);
  const [externalAgentPrompt, setExternalAgentPrompt] = useState<string | null>(null);

  // Sync saved plans to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPlans));
    } catch (e) {
      console.error("Error persisting plans:", e);
    }
  }, [savedPlans]);

  // Sync active plan ID
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_ID_KEY, currentPlanId);
    } catch (e) {}
  }, [currentPlanId]);

  const currentPlan = savedPlans.find((p) => p.id === currentPlanId) || savedPlans[0] || null;

  const handleSelectPlan = (plan: PartyPlan) => {
    setCurrentPlanId(plan.id);
  };

  const handleUpdateCurrentPlan = (updated: PartyPlan) => {
    setSavedPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handlePlanCreated = (newPlan: PartyPlan) => {
    setSavedPlans((prev) => [newPlan, ...prev]);
    setCurrentPlanId(newPlan.id);
    setActiveTab("shopping");
  };

  const handleTriggerAgentPrompt = (promptText: string) => {
    setExternalAgentPrompt(promptText);
    setIsAgentOpen(true);
  };

  const cujStage: "define" | "review" | "refine_checkout" =
    activeTab === "refine_checkout" ? "refine_checkout" : "review";

  const handleSelectCUJStage = (stage: "define" | "review" | "refine_checkout") => {
    if (stage === "define") {
      setIsNewPartyModalOpen(true);
    } else if (stage === "review") {
      setActiveTab("shopping");
    } else if (stage === "refine_checkout") {
      setActiveTab("refine_checkout");
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] pb-24">
      {/* Top Application Header */}
      <Header
        currentPlan={currentPlan}
        savedPlans={savedPlans}
        onSelectPlan={handleSelectPlan}
        onOpenNewPartyModal={() => setIsNewPartyModalOpen(true)}
        onOpenShoppingMode={() => setIsInStoreModeOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAgentOpen={isAgentOpen}
        setIsAgentOpen={setIsAgentOpen}
        isVoiceOpen={isVoiceHUDOpen}
        setIsVoiceOpen={setIsVoiceHUDOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!currentPlan ? (
          <div className="text-center py-16 space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto text-2xl border border-blue-500/30">
              🛒
            </div>
            <h2 className="text-xl font-bold text-white font-['Outfit']">No Party Plans Yet</h2>
            <p className="text-sm text-stone-400 max-w-md mx-auto">
              Create your first AI-formulated CymbalMart party plan or load a sample event to get started.
            </p>
            <button
              onClick={() => setIsNewPartyModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Define Party & Create Plan</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in">
            {/* CUJ Stepper Tracker */}
            <CUJStepper
              currentPlan={currentPlan}
              activeStage={cujStage}
              onSelectStage={handleSelectCUJStage}
              onOpenEditEventModal={() => setIsNewPartyModalOpen(true)}
            />

            {/* Stage Views */}
            {activeTab === "shopping" && (
              <ShoppingListView
                plan={currentPlan}
                onUpdatePlan={handleUpdateCurrentPlan}
                onOpenShoppingMode={() => setIsInStoreModeOpen(true)}
                onTriggerAgentPrompt={handleTriggerAgentPrompt}
              />
            )}

            {activeTab === "refine_checkout" && (
              <RefineCheckoutView
                plan={currentPlan}
                onUpdatePlan={handleUpdateCurrentPlan}
                onOpenShoppingMode={() => setIsInStoreModeOpen(true)}
                onOpenExportModal={() => setIsExportModalOpen(true)}
                onTriggerAgentPrompt={handleTriggerAgentPrompt}
              />
            )}

            {activeTab === "budget" && (
              <BudgetAnalyticsCard
                plan={currentPlan}
                onUpdatePlan={handleUpdateCurrentPlan}
                onOpenAgentWithPrompt={handleTriggerAgentPrompt}
              />
            )}

            {activeTab === "calculator" && (
              <PartyCalculatorView
                plan={currentPlan}
                onUpdatePlan={handleUpdateCurrentPlan}
                onOpenAgentWithPrompt={handleTriggerAgentPrompt}
              />
            )}

            {activeTab === "timeline" && (
              <TimelinePrepView
                plan={currentPlan}
                onUpdatePlan={handleUpdateCurrentPlan}
                onOpenAgentWithPrompt={handleTriggerAgentPrompt}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Buttons: Voice Control Trigger (Left) & Assistant (Right) */}
      <div className="fixed bottom-5 left-5 z-40 flex items-center gap-2">
        {!isVoiceHUDOpen && (
          <button
            id="floating-voice-bubble-btn"
            onClick={() => setIsVoiceHUDOpen(true)}
            className="bg-stone-900/95 hover:bg-stone-850 text-stone-100 border border-red-500/40 hover:border-amber-400 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 transition-all hover:scale-105 group"
            title="Open Hands-Free Voice Control"
          >
            <div className="h-9 w-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-sm shadow-inner group-hover:scale-110 transition-transform border border-red-400/40">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-xs font-extrabold text-white flex items-center gap-1.5 font-['Outfit']">
                <span>Voice Control</span>
                <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
              </div>
              <div className="text-[10px] text-amber-300 font-medium">
                Hands-Free Shopping & Orders
              </div>
            </div>
          </button>
        )}
      </div>

      {!isAgentOpen && (
        <button
          id="floating-agent-bubble-btn"
          onClick={() => setIsAgentOpen(true)}
          className="fixed bottom-5 right-5 z-40 bg-stone-900/95 hover:bg-stone-850 text-stone-100 border border-blue-500/40 hover:border-amber-400 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 transition-all hover:scale-105 group"
          title="Chat with CymbalMart Assistant"
        >
          <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-inner group-hover:rotate-12 transition-transform border border-blue-400/40">
            <Bot className="w-5 h-5 text-amber-300" />
          </div>
          <div className="text-left">
            <div className="text-xs font-extrabold text-white flex items-center gap-1.5 font-['Outfit']">
              <span>CymbalMart Assistant</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-[10px] text-amber-300 font-medium">
              Customer service, store FAQs & live shopping updates
            </div>
          </div>
        </button>
      )}

      {/* Hands-Free Voice Control HUD (Bottom Overlay) */}
      <VoiceAssistantHUD
        currentPlan={currentPlan}
        savedPlans={savedPlans}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onUpdatePlan={handleUpdateCurrentPlan}
        onSelectPlan={handleSelectPlan}
        onOpenNewPartyModal={() => setIsNewPartyModalOpen(true)}
        onOpenShoppingMode={() => setIsInStoreModeOpen(true)}
        onCloseShoppingMode={() => setIsInStoreModeOpen(false)}
        isInStoreModeOpen={isInStoreModeOpen}
        onTriggerAgentPrompt={handleTriggerAgentPrompt}
        isOpen={isVoiceHUDOpen}
        setIsOpen={setIsVoiceHUDOpen}
      />

      {/* Modals & Drawers */}
      <PartyCreatorModal
        isOpen={isNewPartyModalOpen}
        onClose={() => setIsNewPartyModalOpen(false)}
        onPlanCreated={handlePlanCreated}
      />

      {currentPlan && (
        <>
          <InStoreModeModal
            isOpen={isInStoreModeOpen}
            onClose={() => setIsInStoreModeOpen(false)}
            plan={currentPlan}
            onUpdatePlan={handleUpdateCurrentPlan}
            onOpenVoiceHUD={() => setIsVoiceHUDOpen(true)}
          />

          <ExportShareModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            plan={currentPlan}
          />
        </>
      )}

      {/* CymbalMart Assistant Chat Drawer (Available anytime) */}
      <AgentChatDrawer
        isOpen={isAgentOpen}
        onClose={() => {
          setIsAgentOpen(false);
          setExternalAgentPrompt(null);
        }}
        plan={currentPlan || (savedPlans[0] || {
          id: "general-inquiry",
          title: "CymbalMart Customer Service",
          eventType: "Customer Inquiry",
          theme: "Shopping Assistant",
          guestCount: 0,
          adultCount: 0,
          kidCount: 0,
          durationHours: 0,
          timeOfDay: "Evening",
          budget: 0,
          dietaryRestrictions: [],
          venue: "CymbalMart Store",
          items: [],
          timeline: [],
          budgetSummary: {
            totalEstimatedCost: 0,
            costPerGuest: 0,
            topSavingsTip: "Shop Cymbal Choice private label for 25% savings.",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any)}
        onUpdatePlan={handleUpdateCurrentPlan}
        externalPrompt={externalAgentPrompt}
      />
    </div>
  );
}
