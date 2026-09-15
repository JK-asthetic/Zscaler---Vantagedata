// MessageBubble component rendering styled user messages and markdown assistant responses.
import React from "react";
import { User, HelpCircle } from "lucide-react";
import { DisplayMessage } from "@/types";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { EvidencePanel } from "@/components/EvidencePanel";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { InteractiveChart } from "@/components/InteractiveChart";

interface MessageBubbleProps {
  message: DisplayMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex items-start gap-2 max-w-[85%] flex-row-reverse">
          <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-zinc-300">
            <User className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="bg-zinc-800 text-zinc-100 rounded-xl rounded-tr-sm px-3.5 py-2.5 text-xs leading-relaxed border border-zinc-700 shadow-sm font-body">
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1 text-right font-mono">
              {message.timestamp}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-5">
      <div className="flex items-start gap-2.5 max-w-[98%] w-full">
        <div className="w-6 h-6 rounded-md bg-blue-600 border border-blue-500 flex items-center justify-center flex-shrink-0 text-white font-mono font-bold text-[10px] shadow-sm mt-0.5">
          VD
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold text-white">Vantage Assistant</span>
            <span className="text-[10px] text-zinc-500 font-mono">{message.timestamp}</span>
            {message.verified !== undefined && (
              <VerifiedBadge
                verified={message.verified}
                requiresHumanReview={message.requires_human_review}
                isClarification={message.is_clarification}
              />
            )}
          </div>

          <div
            className={`rounded-xl rounded-tl-sm px-4 py-3.5 border shadow-lg ${
              message.is_clarification
                ? "bg-purple-950/20 border-purple-800/50 text-purple-200"
                : "bg-zinc-950 border-zinc-800 text-zinc-200"
            }`}
          >
            {message.is_clarification && (
              <div className="flex items-center gap-1.5 text-purple-300 font-semibold mb-2 text-[11px] uppercase tracking-wider border-b border-purple-900/50 pb-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                Query Clarification Required
              </div>
            )}
            <MarkdownRenderer content={message.content} />
            {message.chart && !message.content.includes("```chart") && (
              <InteractiveChart spec={message.chart} />
            )}
          </div>

          {message.evidence && (
            <EvidencePanel
              evidence={message.evidence}
              notes={message.notes}
              verified={message.verified}
            />
          )}
        </div>
      </div>
    </div>
  );
};
