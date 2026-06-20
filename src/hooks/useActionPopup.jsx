import { useCallback, useRef, useState } from "react";
import ActionPopup from "../components/ui/ActionPopup";
import MasterActionPopup from "../components/ui/MasterActionPopup";

function detectAction(message = "") {
  const m = message.toLowerCase();
  if (m.includes("deleted") || m.includes("removed")) return "delete";
  if (m.includes("updated") || m.includes("changed")) return "edit";
  return "add";
}

export function useActionPopup(master) {
  const [state, setState] = useState(null);
  const onDismissRef = useRef(null);

  const showSuccess = useCallback((message, options) => {
    const title = typeof options === "string" ? options : options?.title;
    onDismissRef.current = typeof options === "object" ? options?.onDismiss : null;
    setState({ message, type: "success", title, action: detectAction(message) });
  }, []);

  const showError = useCallback((message, options) => {
    const title = typeof options === "string" ? options : options?.title;
    onDismissRef.current = typeof options === "object" ? options?.onDismiss : null;
    setState({ message, type: "error", title, action: "edit" });
  }, []);

  const close = useCallback(() => {
    setState(null);
    const cb = onDismissRef.current;
    onDismissRef.current = null;
    cb?.();
  }, []);

  const popup = master && state?.type === "success"
    ? (
      <MasterActionPopup
        master={master}
        action={state.action}
        open={!!state}
        onClose={close}
      />
    )
    : (
      <ActionPopup
        open={!!state}
        message={state?.message || ""}
        type={state?.type || "success"}
        title={state?.title}
        onClose={close}
      />
    );

  return { popup, showSuccess, showError, close, isOpen: !!state };
}
