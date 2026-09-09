import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Dialog, DialogTitle, Modal, ModalOverlay } from "@/src/components/ui/Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "删除",
  cancelLabel = "取消",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!isOpen) setIsPending(false);
  }, [isOpen]);

  const confirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <ModalOverlay
      className="confirm-overlay"
      isOpen={isOpen}
      isDismissable={!isPending}
      onOpenChange={(open) => !open && !isPending && onClose()}
    >
      <Modal className="confirm-modal">
        <Dialog className="confirm-dialog" role="alertdialog">
          <div className="confirm-copy">
            <DialogTitle>{title}</DialogTitle>
            <p>{description}</p>
          </div>
          <div className="confirm-actions">
            <Button variant="ghost" autoFocus isDisabled={isPending} onPress={onClose}>{cancelLabel}</Button>
            <Button variant="danger" isDisabled={isPending} onPress={() => void confirm()}>{isPending ? "删除中…" : confirmLabel}</Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
