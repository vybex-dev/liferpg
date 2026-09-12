"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, X } from "lucide-react";

type ErrorToastProps = {
  message: string | null;
  onDismiss: () => void;
};

/**
 * Fired whenever an optimistic update (task completion, a
 * purchase) gets rolled back because the server call actually
 * failed — see DashboardShell and ShopGrid. Says exactly what
 * happened, in the interface's voice, matching the tone of the
 * inline auth errors from Phase 2.
 */
export function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="glass fixed inset-x-4 bottom-5 z-50 mx-auto flex max-w-sm items-start gap-2.5 rounded-bento-sm border border-attr-strength/30 px-4 py-3 text-sm text-zinc-200 shadow-glass sm:inset-x-auto sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-attr-strength"
            strokeWidth={2}
          />
          <span className="flex-1">{message}</span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="shrink-0 text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
