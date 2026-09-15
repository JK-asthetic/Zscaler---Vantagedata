// Presentational badge indicating verification and audit status in the Xtron OLED theme.
import React from "react";
import { CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

interface VerifiedBadgeProps {
  verified: boolean;
  requiresHumanReview?: boolean;
  isClarification?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  verified,
  requiresHumanReview,
  isClarification,
}) => {
  if (isClarification) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-purple-950/70 text-purple-300 border border-purple-800/60 shadow-sm">
        <HelpCircle className="w-3 h-3 text-purple-400" />
        Clarification Needed
      </span>
    );
  }

  if (verified && !requiresHumanReview) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 shadow-sm">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        Verified Grounded
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-950/70 text-amber-300 border border-amber-800/60 shadow-sm">
      <AlertTriangle className="w-3 h-3 text-amber-400" />
      Review Required
    </span>
  );
};
