import { RiCloseLine } from "@remixicon/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/src/lib/cn";

export type ToastTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface ToastAction {
  label: string;
  onPress: () => void | Promise<void>;
}

export interface ToastOptions {
  tone?: ToastTone;
  description?: ReactNode;
  duration?: number;
  action?: ToastAction;
  isLoading?: boolean;
  shortcut?: "undo";
}

export interface ToastUpdateOptions extends Omit<ToastOptions, "description" | "action"> {
  description?: ReactNode | null;
  action?: ToastAction | null;
}

interface ToastState {
  id: number;
  title: ReactNode;
  description?: ReactNode;
  tone: ToastTone;
  duration: number;
  action?: ToastAction;
  isLoading: boolean;
  shortcut?: "undo";
  isOpen: boolean;
  revision: number;
}

interface ToastContextValue {
  showToast: (title: ReactNode, options?: ToastOptions) => number;
  showUndoToast: (message: string, options: { subject?: string; onUndo: () => void | Promise<void> }) => number;
  updateToast: (id: number, title: ReactNode, options?: ToastUpdateOptions) => void;
  dismissToast: (id: number) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_CLOSE_MS = 250;
const DEFAULT_TOAST_DURATION = 4000;
const ACTION_TOAST_DURATION = 7000;
const MAX_VISIBLE_TOASTS = 2;

function toastDuration(options: ToastOptions) {
  if (options.duration !== undefined) return options.duration;
  if (options.isLoading) return 0;
  return options.action ? ACTION_TOAST_DURATION : DEFAULT_TOAST_DURATION;
}

function Toast({
  toast,
  onOpen,
  onDismiss,
}: {
  toast: ToastState;
  onOpen: (id: number) => void;
  onDismiss: (id: number) => void;
}) {
  const timerRef = useRef<number | undefined>(undefined);
  const actionInvokedRef = useRef(false);
  const startedAtRef = useRef(0);
  const remainingRef = useRef(toast.duration);
  const pauseReasonsRef = useRef(new Set<string>());
  const titleId = `toast-title-${toast.id}`;
  const descriptionId = `toast-description-${toast.id}`;

  const clearTimer = useCallback(() => {
    if (timerRef.current === undefined) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (!toast.isOpen || toast.duration <= 0 || pauseReasonsRef.current.size > 0) return;
    if (remainingRef.current <= 0) {
      onDismiss(toast.id);
      return;
    }
    startedAtRef.current = performance.now();
    timerRef.current = window.setTimeout(() => onDismiss(toast.id), remainingRef.current);
  }, [clearTimer, onDismiss, toast.duration, toast.id, toast.isOpen]);

  const pauseTimer = useCallback((reason: string) => {
    if (pauseReasonsRef.current.has(reason)) return;
    pauseReasonsRef.current.add(reason);
    if (timerRef.current === undefined) return;
    remainingRef.current = Math.max(0, remainingRef.current - (performance.now() - startedAtRef.current));
    clearTimer();
  }, [clearTimer]);

  const resumeTimer = useCallback((reason: string) => {
    pauseReasonsRef.current.delete(reason);
    if (pauseReasonsRef.current.size === 0) startTimer();
  }, [startTimer]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => onOpen(toast.id));
    return () => cancelAnimationFrame(frame);
  }, [onOpen, toast.id]);

  useEffect(() => {
    remainingRef.current = toast.duration;
    actionInvokedRef.current = false;
    if (document.hidden) pauseReasonsRef.current.add("visibility");
    else pauseReasonsRef.current.delete("visibility");
    startTimer();
    return clearTimer;
  }, [clearTimer, startTimer, toast.duration, toast.revision]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) pauseTimer("visibility");
      else resumeTimer("visibility");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [pauseTimer, resumeTimer]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    resumeTimer("focus");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    onDismiss(toast.id);
  };

  const invokeAction = async () => {
    if (!toast.action || actionInvokedRef.current) return;
    actionInvokedRef.current = true;
    onDismiss(toast.id);
    try {
      await toast.action.onPress();
    } catch {
      // Action handlers own their user-facing error feedback.
    }
  };

  const role = toast.action ? "alertdialog" : toast.tone === "danger" ? "alert" : "status";
  const showClose = toast.duration <= 0 && !toast.action;
  const isUndo = toast.shortcut === "undo";
  const isApplePlatform = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <div
      className={cn(
        "t-toast",
        "toast-message",
        `toast-${toast.tone}`,
        toast.action && "has-action",
        isUndo && "has-undo",
        toast.description && "has-description",
        showClose && "is-dismissible",
        toast.isLoading && "is-loading",
        toast.isOpen && "is-open",
      )}
      data-toast-id={toast.id}
      role={role}
      aria-labelledby={titleId}
      aria-describedby={toast.description ? descriptionId : undefined}
      aria-atomic="true"
      tabIndex={-1}
      onMouseEnter={() => pauseTimer("hover")}
      onMouseLeave={() => resumeTimer("hover")}
      onFocusCapture={() => pauseTimer("focus")}
      onBlurCapture={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <span className="toast-content">
        <span className="toast-title" id={titleId}>
          {toast.title}
        </span>
        {toast.description ? (
          <span className="toast-description" id={descriptionId}>
            {toast.description}
          </span>
        ) : null}
      </span>
      {toast.action || showClose ? (
        <span className="toast-controls">
          {toast.action ? (
            <button type="button" className="toast-action" aria-keyshortcuts={isUndo ? (isApplePlatform ? "Meta+Z" : "Control+Z") : undefined} onClick={() => void invokeAction()}>
              {toast.action.label}
              {isUndo ? <span className="toast-undo-shortcut" aria-hidden="true">{isApplePlatform ? "⌘Z" : "Ctrl+Z"}</span> : null}
            </button>
          ) : null}
          {showClose ? (
            <button type="button" className="toast-close" aria-label="关闭通知" onClick={() => onDismiss(toast.id)}>
              <RiCloseLine size={18} />
            </button>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const nextId = useRef(0);
  const removeTimers = useRef(new Map<number, number>());
  const toastsRef = useRef(toasts);
  const viewportRef = useRef<HTMLDivElement>(null);
  toastsRef.current = toasts;

  const removeToast = useCallback((id: number) => {
    const timer = removeTimers.current.get(id);
    if (timer !== undefined) window.clearTimeout(timer);
    removeTimers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.map((toast) => toast.id === id ? { ...toast, isOpen: false } : toast));
    const previousTimer = removeTimers.current.get(id);
    if (previousTimer !== undefined) window.clearTimeout(previousTimer);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    removeTimers.current.set(id, window.setTimeout(() => removeToast(id), reduceMotion ? 0 : TOAST_CLOSE_MS));
  }, [removeToast]);

  const openToast = useCallback((id: number) => {
    setToasts((current) => current.map((toast) => toast.id === id ? { ...toast, isOpen: true } : toast));
  }, []);

  const showToast = useCallback((title: ReactNode, options: ToastOptions = {}) => {
    const id = ++nextId.current;
    setToasts((current) => [...current, {
      id,
      title,
      description: options.description,
      tone: options.tone ?? "neutral",
      duration: toastDuration(options),
      action: options.action,
      isLoading: options.isLoading ?? false,
      shortcut: options.shortcut,
      isOpen: false,
      revision: 0,
    }]);
    return id;
  }, []);

  const showUndoToast = useCallback((message: string, options: { subject?: string; onUndo: () => void | Promise<void> }) => {
    const title = <>{message}{options.subject ? <> <strong className="toast-undo-subject">“{options.subject}”</strong></> : null}</>;
    return showToast(title, { shortcut: "undo", action: { label: "撤回", onPress: options.onUndo } });
  }, [showToast]);

  const updateToast = useCallback((id: number, title: ReactNode, options: ToastUpdateOptions = {}) => {
    setToasts((current) => current.map((toast) => {
      if (toast.id !== id) return toast;
      const action = options.action === null ? undefined : options.action ?? toast.action;
      const isLoading = options.isLoading ?? false;
      return {
        ...toast,
        title,
        description: options.description === null ? undefined : options.description ?? toast.description,
        tone: options.tone ?? toast.tone,
        duration: options.duration ?? (isLoading ? 0 : action ? ACTION_TOAST_DURATION : DEFAULT_TOAST_DURATION),
        action,
        isLoading,
        shortcut: options.shortcut ?? toast.shortcut,
        revision: toast.revision + 1,
      };
    }));
  }, []);

  const clearToasts = useCallback(() => {
    toastsRef.current.forEach((toast) => dismissToast(toast.id));
  }, [dismissToast]);

  useEffect(() => () => {
    removeTimers.current.forEach((timer) => window.clearTimeout(timer));
    removeTimers.current.clear();
  }, []);

  useEffect(() => {
    const handleHotkey = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.code === "KeyT") {
        const toast = viewportRef.current?.querySelector<HTMLElement>("[data-toast-id]");
        if (!toast) return;
        event.preventDefault();
        toast.focus({ preventScroll: true });
        return;
      }
      if (event.altKey || event.shiftKey || event.repeat || event.key.toLowerCase() !== "z" || event.metaKey === event.ctrlKey) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable], [role='textbox']")) return;
      const actions = viewportRef.current?.querySelectorAll<HTMLButtonElement>(".toast-message.has-undo.is-open .toast-action");
      const action = actions?.[actions.length - 1];
      if (!action) return;
      event.preventDefault();
      action.click();
    };
    document.addEventListener("keydown", handleHotkey);
    return () => document.removeEventListener("keydown", handleHotkey);
  }, []);

  const contextValue = useMemo(
    () => ({ showToast, showUndoToast, updateToast, dismissToast, clearToasts }),
    [clearToasts, dismissToast, showToast, showUndoToast, updateToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div ref={viewportRef} className="toast-viewport" role="region" aria-label="通知">
        {toasts.slice(0, MAX_VISIBLE_TOASTS).map((toast) => (
          <Toast key={toast.id} toast={toast} onOpen={openToast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
