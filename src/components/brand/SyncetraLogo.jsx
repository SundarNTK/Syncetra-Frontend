/** Collapsed sidebar / favicon */
export const LOGO_ICON = "/logo.png";
/** Expanded sidebar / login */
export const LOGO_FULL = "/Full_logo.png";

export function SyncetraBrand({ variant = "full", size = "md", centered = false }) {
  const src = variant === "icon" ? LOGO_ICON : LOGO_FULL;
  const sizes = {
    sm: variant === "icon" ? "max-h-10" : "max-h-14",
    md: variant === "icon" ? "max-h-12" : "max-h-20",
    lg: variant === "icon" ? "max-h-16" : "max-h-32",
  };

  return (
    <div className={centered ? "flex justify-center w-full" : ""}>
      <img
        src={src}
        alt="Syncetra"
        className={`w-auto object-contain ${sizes[size] || sizes.md}`}
      />
    </div>
  );
}

export default SyncetraBrand;
