import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ZoomableImage({
  src,
  alt = "",
  className = "",
  zoomClassName = "max-w-[95vw] max-h-[95vh] object-contain",
  disabled = false,
  ...props
}) {
  const [zoomed, setZoomed] = useState(false);

  const openZoom = useCallback(
    (e) => {
      if (disabled || !src) return;
      e.preventDefault();
      e.stopPropagation();
      setZoomed(true);
    },
    [disabled, src]
  );

  const closeZoom = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setZoomed(false);
  }, []);

  useEffect(() => {
    if (!zoomed) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeZoom();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed, closeZoom]);

  if (!src) return null;

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`${className}${disabled ? "" : " cursor-zoom-in"}`}
        onDoubleClick={disabled ? undefined : openZoom}
        draggable={false}
        {...props}
      />
      {zoomed &&
        createPortal(
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/92 backdrop-blur-sm p-4"
            onClick={closeZoom}
            role="dialog"
            aria-modal="true"
            aria-label={alt || "Zoomed image"}
          >
            <button
              type="button"
              onClick={closeZoom}
              className="absolute top-4 right-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
              aria-label="Close zoom"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={src}
              alt={alt}
              className={`${zoomClassName} cursor-zoom-out`}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={closeZoom}
              draggable={false}
            />
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/60 pointer-events-none">
              Double-click or tap outside to zoom out
            </p>
          </div>,
          document.body
        )}
    </>
  );
}
