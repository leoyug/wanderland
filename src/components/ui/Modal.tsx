import type { ComponentProps } from "react";
import {
  Dialog as AriaDialog,
  Heading as AriaHeading,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from "react-aria-components";

// Intent UI modal anatomy, adapted to Wanderland's existing class-based tokens.
// https://intentui.com/docs/components/overlays/modal
export function ModalOverlay(props: ComponentProps<typeof AriaModalOverlay>) {
  return <AriaModalOverlay data-slot="modal-overlay" {...props} />;
}

export function Modal(props: ComponentProps<typeof AriaModal>) {
  return <AriaModal data-slot="modal" {...props} />;
}

export function Dialog(props: ComponentProps<typeof AriaDialog>) {
  return <AriaDialog data-slot="dialog" {...props} />;
}

export function DialogTitle(props: ComponentProps<typeof AriaHeading>) {
  return <AriaHeading data-slot="dialog-title" slot="title" {...props} />;
}
