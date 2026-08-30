import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  X,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  Radio,
  Zap,
  ShoppingBag,
  Send,
} from "lucide-react";
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  soundFX,
  voiceSpeaker,
  parseVoiceCommandLocally,
  VoiceCommandResult,
} from "../services/voiceService";
import { PartyPlan, ShoppingItem } from "../types";
import {
  recalculatePartyPlan,
  scaleShoppingListQuantities,
  addShoppingItem,
  removeShoppingItem,
} from "../utils/budgetCalculations";
import confetti from "canvas-confetti";

interface VoiceAssistantHUDProps {
  currentPlan: PartyPlan | null;
  savedPlans: PartyPlan[];
  activeTab: string;
  setActiveTab: (tab: "shopping" | "refine_checkout" | "budget" | "calculator" | "timeline") => void;
  onUpdatePlan: (updated: PartyPlan) => void;
  onSelectPlan: (plan: PartyPlan) => void;
  onOpenNewPartyModal: () => void;
  onOpenShoppingMode: () => void;
  onCloseShoppingMode: () => void;
  isInStoreModeOpen: boolean;
  onTriggerAgentPrompt: (prompt: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const VoiceAssistantHUD: React.FC<VoiceAssistantHUDProps> = ({
  currentPlan,
  savedPlans,
  activeTab,
  setActiveTab,
  onUpdatePlan,
  onSelectPlan,
  onOpenNewPartyModal,
  onOpenShoppingMode,
  onCloseShoppingMode,
  isInStoreModeOpen,
  onTriggerAgentPrompt,
  isOpen,
  setIsOpen,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastSpokenResponse, setLastSpokenResponse] = useState<string>(
    "Say a command like 'Check off ice', 'Where is salsa?', 'What is my total cost?', or 'Start in-store shopping'."
  );
  const [lastActionBadge, setLastActionBadge] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(voiceSpeaker.getMuted());
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [simulatedCommand, setSimulatedCommand] = useState("");
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isContinuousRef = useRef(isContinuousMode);
  isContinuousRef.current = isContinuousMode;

  // Initialize SpeechRecognition instance
  useEffect(() => {
    if (!isSpeechRecognitionSupported()) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setMicPermissionError(null);
      soundFX.playWake();
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const activeText = (finalTranscript || interim).trim();
      setTranscript(activeText);

      if (finalTranscript.trim()) {
        handleExecuteVoiceCommand(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setMicPermissionError("Microphone access blocked. Click mic icon or use voice simulator below.");
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isContinuousRef.current) {
        // Auto restart for continuous hands-free shopping!
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, []);

  // Toggle Listening
  const toggleListening = () => {
    if (!isSpeechRecognitionSupported()) {
      setMicPermissionError("Web Speech API not supported in this browser. Try the voice simulator.");
      return;
    }

    if (isListening) {
      setIsContinuousMode(false);
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setMicPermissionError(null);
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
      }
    }
  };

  // Toggle Continuous Hands-Free Listening Mode
  const toggleContinuousMode = () => {
    const nextState = !isContinuousMode;
    setIsContinuousMode(nextState);
    if (nextState && !isListening) {
      try {
        recognitionRef.current?.start();
      } catch (e) {}
    }
  };

  // Toggle Audio Mute
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    voiceSpeaker.setMuted(next);
  };

  // Speak response and display on screen
  const speakFeedback = (text: string, badge?: string) => {
    setLastSpokenResponse(text);
    if (badge) setLastActionBadge(badge);
    voiceSpeaker.speak(text);
  };

  // Central Voice Command Dispatcher
  const handleExecuteVoiceCommand = (commandText: string) => {
    if (!currentPlan) return;

    const parsed: VoiceCommandResult = parseVoiceCommandLocally(commandText, {
      items: currentPlan.items,
      currentTab: activeTab,
      totalCost: currentPlan.budgetSummary?.totalEstimatedCost,
      budget: currentPlan.budget,
      guestCount: currentPlan.guestCount,
      iceLbsNeeded: currentPlan.portionGuide?.iceLbsNeeded,
      totalDrinks: currentPlan.portionGuide?.totalDrinkServings,
      plans: savedPlans,
    });

    switch (parsed.intent) {
      case "CHECK_ITEM": {
        const itemId = parsed.parameters?.itemId;
        if (itemId) {
          const updatedItems = currentPlan.items.map((i) =>
            i.id === itemId ? { ...i, isChecked: true } : i
          );
          onUpdatePlan(recalculatePartyPlan(currentPlan, updatedItems));
          soundFX.playSuccess();
          speakFeedback(parsed.spokenFeedback, `Checked: ${parsed.parameters?.itemName}`);
        }
        break;
      }

      case "UNCHECK_ITEM": {
        const itemId = parsed.parameters?.itemId;
        if (itemId) {
          const updatedItems = currentPlan.items.map((i) =>
            i.id === itemId ? { ...i, isChecked: false } : i
          );
          onUpdatePlan(recalculatePartyPlan(currentPlan, updatedItems));
          soundFX.playSuccess();
          speakFeedback(parsed.spokenFeedback, `Unchecked: ${parsed.parameters?.itemName}`);
        }
        break;
      }

      case "CHECK_ALL": {
        const updatedItems = currentPlan.items.map((i) => ({ ...i, isChecked: true }));
        onUpdatePlan(recalculatePartyPlan(currentPlan, updatedItems));
        soundFX.playSuccess();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        speakFeedback(parsed.spokenFeedback, "All Items Purchased");
        break;
      }

      case "UNCHECK_ALL": {
        const updatedItems = currentPlan.items.map((i) => ({ ...i, isChecked: false }));
        onUpdatePlan(recalculatePartyPlan(currentPlan, updatedItems));
        soundFX.playSuccess();
        speakFeedback(parsed.spokenFeedback, "All Checks Reset");
        break;
      }

      case "ADD_ITEM": {
        const newItem: ShoppingItem = {
          id: `item-${Date.now()}`,
          name: parsed.parameters?.name || "Party Item",
          category: "Groceries & Mains",
          quantity: parsed.parameters?.quantity || "1 pack",
          estimatedPrice: parsed.parameters?.estimatedPrice || 8,
          isChecked: false,
          isOwned: false,
          recommendedStore: "CymbalMart Supercenter",
          cymbalAisle: "Aisle 3 (Pantry & Sauces)",
          brandType: "Cymbal Choice",
          priority: "must-have",
          rollbackSavings: 2.0,
        };
        onUpdatePlan(addShoppingItem(currentPlan, newItem));
        soundFX.playSuccess();
        speakFeedback(parsed.spokenFeedback, `Added: ${newItem.name}`);
        break;
      }

      case "REMOVE_ITEM": {
        const itemId = parsed.parameters?.itemId;
        if (itemId) {
          onUpdatePlan(removeShoppingItem(currentPlan, itemId));
          soundFX.playSuccess();
          speakFeedback(parsed.spokenFeedback, `Removed: ${parsed.parameters?.itemName}`);
        }
        break;
      }

      case "TOGGLE_OWNED": {
        const itemId = parsed.parameters?.itemId;
        if (itemId) {
          const updatedItems = currentPlan.items.map((i) =>
            i.id === itemId ? { ...i, isOwned: true } : i
          );
          onUpdatePlan(recalculatePartyPlan(currentPlan, updatedItems));
          soundFX.playSuccess();
          speakFeedback(parsed.spokenFeedback, `Pantry Check: ${parsed.parameters?.itemName}`);
        }
        break;
      }

      case "SCALE_GUESTS": {
        const newCount = parsed.parameters?.guestCount;
        if (newCount) {
          const scaleFactor = newCount / (currentPlan.guestCount || 1);
          const scaledPlan = scaleShoppingListQuantities(
            { ...currentPlan, guestCount: newCount },
            scaleFactor
          );
          onUpdatePlan(scaledPlan);
          soundFX.playSuccess();
          speakFeedback(parsed.spokenFeedback, `Scaled to ${newCount} guests`);
        }
        break;
      }

      case "OPEN_IN_STORE_MODE": {
        onOpenShoppingMode();
        soundFX.playSuccess();
        speakFeedback(parsed.spokenFeedback, "In-Store Mode Active");
        break;
      }

      case "CLOSE_IN_STORE_MODE": {
        onCloseShoppingMode();
        soundFX.playSuccess();
        speakFeedback(parsed.spokenFeedback, "Back to Planner");
        break;
      }

      case "FIND_ITEM_AISLE": {
        soundFX.playSuccess();
        speakFeedback(parsed.spokenFeedback, `Aisle: ${parsed.parameters?.aisle}`);
        break;
      }

      case "NAVIGATE_TAB": {
        const tab = parsed.parameters?.tab;
        if (tab) {
          setActiveTab(tab as any);
          soundFX.playSuccess();
          speakFeedback(parsed.spokenFeedback, `Navigated to ${tab}`);
        }
        break;
      }

      case "QUERY_BUDGET":
      case "QUERY_PORTIONS":
      case "HELP": {
        soundFX.playPrompt();
        speakFeedback(parsed.spokenFeedback);
        break;
      }

      case "CHOOSE_FULFILLMENT": {
        const method = parsed.parameters?.method || "pickup";
        onUpdatePlan({
          ...currentPlan,
          fulfillment: {
            method,
            storeLocation: currentPlan.fulfillment?.storeLocation || "CymbalMart Supercenter #1042",
            timeSlot: currentPlan.fulfillment?.timeSlot || "Today • 3:00 PM – 5:00 PM",
            isConfirmed: Boolean(currentPlan.fulfillment?.isConfirmed),
          },
          updatedAt: new Date().toISOString(),
        });
        setActiveTab("refine_checkout");
        soundFX.playSuccess();
        speakFeedback(parsed.spokenFeedback, `Fulfillment: ${method}`);
        break;
      }

      case "PLACE_ORDER": {
        const confirmationNumber = `CYMBAL-VOICE-${Math.floor(100000 + Math.random() * 900000)}`;
        onUpdatePlan({
          ...currentPlan,
          fulfillment: {
            method: currentPlan.fulfillment?.method || "pickup",
            storeLocation: currentPlan.fulfillment?.storeLocation || "CymbalMart Supercenter #1042",
            timeSlot: currentPlan.fulfillment?.timeSlot || "Today • 3:00 PM – 5:00 PM",
            isConfirmed: true,
            confirmationNumber,
            finalizedAt: new Date().toISOString(),
          },
          cujStep: "checkout",
          updatedAt: new Date().toISOString(),
        });
        setActiveTab("refine_checkout");
        soundFX.playSuccess();
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
        speakFeedback(parsed.spokenFeedback, `Order Confirmed #${confirmationNumber}`);
        break;
      }

      case "OPEN_PARTY_CREATOR": {
        onOpenNewPartyModal();
        soundFX.playSuccess();
        speakFeedback(parsed.spokenFeedback, "Party Creator Opened");
        break;
      }

      case "SWITCH_PLAN": {
        const targetPlan = savedPlans.find((p) => p.id === parsed.parameters?.planId);
        if (targetPlan) {
          onSelectPlan(targetPlan);
          soundFX.playSuccess();
          speakFeedback(parsed.spokenFeedback, `Plan: ${targetPlan.title}`);
        }
        break;
      }

      case "SEARCH_FILTER": {
        soundFX.playSuccess();
        speakFeedback(parsed.spokenFeedback, `Filter: ${parsed.parameters?.query}`);
        break;
      }

      case "AI_QUERY":
      default: {
        // Route to AI Assistant for complex party inquiries
        soundFX.playPrompt();
        speakFeedback("Asking CymbalMart Assistant: " + commandText);
        onTriggerAgentPrompt(commandText);
        break;
      }
    }
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedCommand.trim()) return;
    setTranscript(simulatedCommand);
    handleExecuteVoiceCommand(simulatedCommand);
    setSimulatedCommand("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto bg-stone-900/95 backdrop-blur-xl border border-blue-500/40 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5">
        {/* Main Status & Control Bar */}
        <div className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Active Mic / Pulse Visualizer & Speech State */}
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Primary Mic Button */}
            <button
              id="voice-mic-main-toggle-btn"
              onClick={toggleListening}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-lg shrink-0 ${
                isListening
                  ? "bg-red-500 text-white animate-pulse ring-4 ring-red-500/30 scale-105"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
              title={isListening ? "Listening... Tap to stop" : "Start Voice Control (Hands-Free)"}
            >
              {isListening ? (
                <Mic className="w-6 h-6 animate-bounce" />
              ) : (
                <MicOff className="w-5 h-5 text-blue-100" />
              )}
            </button>

            {/* Status Information */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono flex items-center gap-1.5">
                  <Radio className={`w-3 h-3 ${isListening ? "text-red-400 animate-ping" : "text-stone-400"}`} />
                  <span>{isListening ? (isContinuousMode ? "Continuous Hands-Free Active" : "Listening...") : "Voice Control Ready"}</span>
                </span>

                {lastActionBadge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="truncate max-w-[180px]">{lastActionBadge}</span>
                  </span>
                )}
              </div>

              {/* Spoken Text / Transcript */}
              <div className="mt-1 text-sm text-stone-100 font-medium truncate max-w-lg sm:max-w-xl">
                {transcript ? (
                  <span className="text-amber-300 font-bold">🎙️ "{transcript}"</span>
                ) : (
                  <span className="text-stone-300 italic">{lastSpokenResponse}</span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto flex-wrap">
            {/* Continuous Hands-Free Mode Switch */}
            <button
              id="voice-continuous-mode-toggle"
              onClick={toggleContinuousMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                isContinuousMode
                  ? "bg-amber-500 text-stone-950 border-amber-400 shadow-md"
                  : "bg-stone-800 text-stone-300 border-stone-700 hover:border-stone-600"
              }`}
              title="Continuous listening allows hands-free walking through aisles"
            >
              <Zap className={`w-3.5 h-3.5 ${isContinuousMode ? "fill-stone-950" : "text-amber-400"}`} />
              <span>Always-Listening</span>
            </button>

            {/* Audio Mute/Unmute */}
            <button
              id="voice-audio-mute-toggle"
              onClick={toggleMute}
              className={`p-2 rounded-xl border text-xs transition-colors ${
                isMuted
                  ? "bg-stone-800 text-stone-500 border-stone-700"
                  : "bg-stone-800 text-stone-200 border-stone-700 hover:text-white"
              }`}
              title={isMuted ? "Audio Responses Muted" : "Audio Responses Active"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Voice Cheat Sheet */}
            <button
              id="voice-cheat-sheet-btn"
              onClick={() => setShowCheatSheet(!showCheatSheet)}
              className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-xs font-semibold flex items-center gap-1"
              title="View all supported voice commands"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Commands</span>
            </button>

            {/* Close HUD */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800"
              title="Hide Voice Control HUD"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Permission warning banner if microphone blocked */}
        {micPermissionError && (
          <div className="bg-amber-950/60 border-t border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
            <span>⚠️ {micPermissionError}</span>
          </div>
        )}

        {/* Quick Voice Command Chips Bar */}
        <div className="bg-stone-950/80 border-t border-stone-800/80 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[11px] text-stone-400 font-bold uppercase shrink-0">
            Try saying:
          </span>

          {[
            "Check off 20lb Party Ice Bag",
            "What aisle is salsa located in?",
            "Add 2 packs of guacamole for 8 dollars",
            "What is my total cost?",
            "Start in-store shopping",
            "How much ice do I need?",
            "Scale guests to 25",
            "Place order",
          ].map((promptText) => (
            <button
              key={promptText}
              onClick={() => {
                setTranscript(promptText);
                handleExecuteVoiceCommand(promptText);
              }}
              className="px-2.5 py-1 rounded-lg bg-stone-850 hover:bg-blue-900/40 text-stone-300 hover:text-blue-200 border border-stone-800 hover:border-blue-500/40 whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>"{promptText}"</span>
            </button>
          ))}
        </div>

        {/* Voice Command Reference Cheat-Sheet (Expandable) */}
        {showCheatSheet && (
          <div className="bg-stone-950 border-t border-stone-800 p-4 max-h-72 overflow-y-auto space-y-3 text-xs animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-1 border-b border-stone-800">
              <h4 className="font-bold text-white text-sm font-['Outfit'] flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-amber-400" />
                <span>Hands-Free Voice Command Directory</span>
              </h4>
              <button
                onClick={() => setShowCheatSheet(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Category 1: Checklist & Shopping */}
              <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                <div className="font-bold text-amber-300">🛒 Shopping & Checklist</div>
                <ul className="text-stone-300 space-y-1">
                  <li>• "Check off [item name]"</li>
                  <li>• "Uncheck [item name]"</li>
                  <li>• "Check off all items"</li>
                  <li>• "Add [qty] [item] for [$] dollars"</li>
                  <li>• "Remove [item name]"</li>
                  <li>• "I have [item] at home"</li>
                </ul>
              </div>

              {/* Category 2: In-Store Navigation */}
              <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                <div className="font-bold text-emerald-300">📍 In-Store Walking Path</div>
                <ul className="text-stone-300 space-y-1">
                  <li>• "Start in-store shopping"</li>
                  <li>• "What aisle is [item] in?"</li>
                  <li>• "Where is salsa located?"</li>
                  <li>• "Exit in-store mode"</li>
                  <li>• "Show only CymbalMart items"</li>
                </ul>
              </div>

              {/* Category 3: Budget & Checkout */}
              <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                <div className="font-bold text-blue-300">💳 Budget, Math & Checkout</div>
                <ul className="text-stone-300 space-y-1">
                  <li>• "What is my total cost?"</li>
                  <li>• "How much ice do I need?"</li>
                  <li>• "Scale guests to 30"</li>
                  <li>• "Choose curbside pickup"</li>
                  <li>• "Place order / finalize"</li>
                </ul>
              </div>
            </div>

            {/* Quick Text Command Simulator for testing */}
            <form onSubmit={handleSimulateSubmit} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={simulatedCommand}
                onChange={(e) => setSimulatedCommand(e.target.value)}
                placeholder="Type or test any voice command hands-free (e.g. 'Check off ice', 'Where is salsa?')..."
                className="flex-1 bg-stone-900 text-stone-100 text-xs rounded-xl px-3 py-2 border border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Test Command</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
