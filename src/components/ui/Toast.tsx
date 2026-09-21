import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { RiCheckLine, RiErrorWarningLine, RiInformationLine } from "@remixicon/react";
import { cn } from "@/src/lib/cn";

type ToastTone = "neutral" | "success" | "danger";

interface ToastOptions {
  tone?: ToastTone;
  duration?: number;
  action?: ToastAction;
}

export interface ToastAction {
  label: string;
  onPress: () => void | Promise<void>;
}

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
  isOpen: boolean;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_CLOSE_MS = 250;
const DEFAULT_TOAST_DURATION = 2800;

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === "success") return <RiCheckLine size={13} strokeWidth={3} />;
  if (tone === "danger") return <RiErrorWarningLine size={14} strokeWidth={2.5} />;
  return <RiInformationLine size={14} strokeWidth={2.5} />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextId = useRef(0);
  const closeTimer = useRef<number | undefined>(undefined);
  const removeTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    if (removeTimer.current) window.clearTimeout(removeTimer.current);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToast((current) => current?.id === id ? { ...current, isOpen: false } : current);
    if (removeTimer.current) window.clearTimeout(removeTimer.current);
    removeTimer.current = window.setTimeout(() => {
      setToast((current) => current?.id === id ? null : current);
    }, TOAST_CLOSE_MS);
  }, []);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const id = ++nextId.current;
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    if (removeTimer.current) window.clearTimeout(removeTimer.current);
    setToast({ id, message, tone: options.tone ?? "neutral", action: options.action, isOpen: true });
    closeTimer.current = window.setTimeout(() => dismiss(id), options.duration ?? DEFAULT_TOAST_DURATION);
  }, [dismiss]);

  const invokeAction = useCallback(async (id: number) => {
    const action = toast?.id === id ? toast.action : undefined;
    if (!action) return;
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    dismiss(id);
    try {
      await action.onPress();
    } catch {
      // Action handlers own their user-facing error feedback.
    }
  }, [dismiss, toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toast ? <div className={cn("t-toast", "toast-message", `toast-${toast.tone}`, toast.isOpen && "is-open")} role="status">
          <span className="toast-icon" aria-hidden="true"><ToastIcon tone={toast.tone} /></span>
          <span className="toast-copy">{toast.message}</span>
          {toast.action ? <button type="button" className="toast-action" onClick={() => void invokeAction(toast.id)}>{toast.action.label}</button> : null}
        </div> : null}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
