import { useCallback, useRef, useState } from "react";
import ActionPopup from "../components/ui/ActionPopup";

export function useActionPopup() {
  const [state, setState] = useState(null);
  const onDismissRef = useRef(null);

  const showSuccess = useCallback((message, options) => {
    const title = typeof options === "string" ? options : options?.title;
    onDismissRef.current = typeof options === "object" ? options?.onDismiss : null;
    setState({ message, type: "success", title });
  }, []);

  const showError = useCallback((message, options) => {
    const title = typeof options === "string" ? options : options?.title;
    onDismissRef.current = typeof options === "object" ? options?.onDismiss : null;
    setState({ message, type: "error", title });
  }, []);

  const close = useCallback(() => {
    setState(null);
    const cb = onDismissRef.current;
    onDismissRef.current = null;
    cb?.();
  }, []);

  const popup = (
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
