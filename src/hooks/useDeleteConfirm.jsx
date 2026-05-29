import { useCallback, useState } from "react";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal";

const DEFAULT_MESSAGE = "Shall we proceed to delete this record?";

/**
 * Opens a shared delete-confirmation modal before running destructive actions.
 *
 * @example
 * const { confirmDelete, deleteModal } = useDeleteConfirm();
 * confirmDelete({
 *   recordLabel: trip.tripName,
 *   onConfirm: async () => { await deleteTrip(trip._id); load(); },
 * });
 * return (<> ... {deleteModal} </>);
 */
export function useDeleteConfirm() {
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(false);

  const confirmDelete = useCallback((opts) => {
    setPending({
      title: opts.title ?? "Confirm deletion",
      message: opts.message ?? DEFAULT_MESSAGE,
      recordLabel: opts.recordLabel ?? "",
      confirmLabel: opts.confirmLabel ?? "Yes, proceed",
      cancelLabel: opts.cancelLabel ?? "Cancel",
      onConfirm: opts.onConfirm,
    });
  }, []);

  const close = useCallback(() => {
    if (!loading) setPending(null);
  }, [loading]);

  const handleConfirm = useCallback(async () => {
    if (!pending?.onConfirm) return;
    setLoading(true);
    try {
      await pending.onConfirm();
      setPending(null);
    } finally {
      setLoading(false);
    }
  }, [pending]);

  const deleteModal = (
    <DeleteConfirmModal
      open={Boolean(pending)}
      title={pending?.title}
      message={pending?.message}
      recordLabel={pending?.recordLabel}
      confirmLabel={pending?.confirmLabel}
      cancelLabel={pending?.cancelLabel}
      loading={loading}
      onCancel={close}
      onConfirm={handleConfirm}
    />
  );

  return { confirmDelete, deleteModal, closeDeleteConfirm: close };
}
