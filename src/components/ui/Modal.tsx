import type { ComponentProps } from "react";
import {
  Dialog as AriaDialog,
  Heading as AriaHeading,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import { cn } from "@/src/lib/cn";

// Intent UI modal anatomy, adapted to Wanderland's existing class-based tokens.
// https://intentui.com/docs/components/overlays/modal
export function ModalOverlay(props: ComponentProps<typeof AriaModalOverlay>) {
  const { className, ...rest } = props;
  return <AriaModalOverlay data-slot="modal-overlay" className={typeof className === "function" ? (values) => cn("t-modal-overlay", className(values)) : cn("t-modal-overlay", className)} {...rest} />;
}

export function Modal(props: ComponentProps<typeof AriaModal>) {
  const { className, ...rest } = props;
  return <AriaModal data-slot="modal" className={typeof className === "function" ? (values) => cn("t-modal", className(values)) : cn("t-modal", className)} {...rest} />;
}

export function Dialog(props: ComponentProps<typeof AriaDialog>) {
  return <AriaDialog data-slot="dialog" {...props} />;
}

export function DialogTitle(props: ComponentProps<typeof AriaHeading>) {
  return <AriaHeading data-slot="dialog-title" slot="title" {...props} />;
}
