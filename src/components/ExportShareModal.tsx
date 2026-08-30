import React, { useState } from "react";
import {
  X,
  Printer,
  Copy,
  Download,
  Check,
  Share2,
  FileText,
  MessageSquare,
} from "lucide-react";
import { PartyPlan } from "../types";

interface ExportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PartyPlan;
}

export const ExportShareModal: React.FC<ExportShareModalProps> = ({
  isOpen,
  onClose,
  plan,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate Group Chat Friendly Text
  const generateChatText = () => {
    let text = `🎉 *${plan.title}* 🎉\n`;
    text += `📅 Guests: ${plan.guestCount} (${plan.adultCount} adults, ${plan.kidCount} kids) • Duration: ${plan.durationHours}h (${plan.timeOfDay})\n`;
    text += `📍 Venue: ${plan.venue}\n`;
    text += `🍸 Signature Drink: ${plan.themeDetails.signatureDrinkName}\n\n`;

    text += `🛒 *PARTY SHOPPING LIST:*\n`;

    // Group by store
    const stores: Record<string, string[]> = {};
    plan.items.forEach((item) => {
      const store = item.recommendedStore || "CymbalMart Supercenter";
      if (!stores[store]) stores[store] = [];
      const aisleTag = item.cymbalAisle ? ` [${item.cymbalAisle}]` : "";
      const brandTag = item.brandType ? ` (${item.brandType})` : "";
      stores[store].push(`- [ ] ${item.name}${brandTag} - ${item.quantity}${aisleTag}${item.isOwned ? " [Already Owned]" : ` ~$${item.estimatedPrice}`}`);
    });

    Object.entries(stores).forEach(([store, items]) => {
      text += `\n*${store}:*\n${items.join("\n")}\n`;
    });

    if (plan.fulfillment?.isConfirmed) {
      text += `\n📦 *CYMBALMART ORDER CONFIRMED:*\n`;
      text += `• Confirmation: ${plan.fulfillment.confirmationNumber}\n`;
      text += `• Method: ${plan.fulfillment.method.toUpperCase()} (${plan.fulfillment.timeSlot})\n`;
      text += `• Location: ${plan.fulfillment.storeLocation}\n`;
    }

    text += `\n💰 Total Est. Budget: $${plan.budgetSummary.totalEstimatedCost} / $${plan.budget}\n`;
    text += `✨ *CymbalMart Party Planner Shopping Agent*`;
    return text;
  };

  const handleCopyChatText = () => {
    navigator.clipboard.writeText(generateChatText());
    setCopiedType("chat");
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadCSV = () => {
    const headers = ["Item Name", "Category", "Store", "Aisle Location", "Brand", "Quantity", "Estimated Price ($)", "Priority", "Status", "Notes"];
    const rows = plan.items.map((item) => [
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.recommendedStore}"`,
      `"${item.cymbalAisle || ""}"`,
      `"${item.brandType || ""}"`,
      `"${item.quantity}"`,
      item.estimatedPrice,
      `"${item.priority}"`,
      item.isChecked ? "Purchased" : item.isOwned ? "Owned at Home" : "Need to Buy",
      `"${(item.shoppingNotes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${plan.title.replace(/\s+/g, "_")}_Shopping_List.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-stone-950 font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit']">
                Export & Share Shopping Plan
              </h2>
              <p className="text-xs text-stone-400">
                Share with co-hosts, export spreadsheets, or print for store trips.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-200">
          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              id="copy-chat-text-btn"
              onClick={handleCopyChatText}
              className="p-4 rounded-xl bg-stone-850 border border-stone-800 hover:border-amber-500/50 transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <MessageSquare className="w-5 h-5 text-amber-400 mb-2" />
                <h3 className="font-bold text-sm text-white group-hover:text-amber-300">
                  Copy for Chat
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Formatted checklist for WhatsApp, iMessage, or Slack.
                </p>
              </div>
              <div className="mt-3 text-xs font-semibold text-amber-400 flex items-center gap-1">
                {copiedType === "chat" ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </div>
            </button>

            <button
              id="download-csv-btn"
              onClick={handleDownloadCSV}
              className="p-4 rounded-xl bg-stone-850 border border-stone-800 hover:border-emerald-500/50 transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <Download className="w-5 h-5 text-emerald-400 mb-2" />
                <h3 className="font-bold text-sm text-white group-hover:text-emerald-300">
                  Download CSV
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Excel / Google Sheets spreadsheet with store columns.
                </p>
              </div>
              <div className="mt-3 text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                <span>Export .CSV</span>
              </div>
            </button>

            <button
              id="print-sheet-btn"
              onClick={handlePrint}
              className="p-4 rounded-xl bg-stone-850 border border-stone-800 hover:border-cyan-500/50 transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <Printer className="w-5 h-5 text-cyan-400 mb-2" />
                <h3 className="font-bold text-sm text-white group-hover:text-cyan-300">
                  Print Checklist
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Clean printer-friendly shopping sheet with checkboxes.
                </p>
              </div>
              <div className="mt-3 text-xs font-semibold text-cyan-400 flex items-center gap-1">
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </div>
            </button>
          </div>

          {/* Live Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-400 font-semibold uppercase tracking-wider">
              <span>Text Preview (Formatted for Group Chats)</span>
            </div>
            <pre className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-300 max-h-56 overflow-y-auto whitespace-pre-wrap">
              {generateChatText()}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
