import { LOGO_ICON } from "../brand/SyncetraLogo";

const SIZE_MAP = {
  sm: { box: 56, logo: 24 },
  md: { box: 96, logo: 40 },
  lg: { box: 128, logo: 52 },
};

/** Centered favicon logo with spinning ring animation */
export default function SyncetraLoader({ size = "md", className = "" }) {
  const dims = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      <div
        className="syncetra-loader relative flex items-center justify-center"
        style={{ width: dims.box, height: dims.box }}
      >
        <span className="syncetra-loader__ring syncetra-loader__ring--1" aria-hidden />
        <span className="syncetra-loader__ring syncetra-loader__ring--2" aria-hidden />
        <span className="syncetra-loader__ring syncetra-loader__ring--3" aria-hidden />
        <img
          src={LOGO_ICON}
          alt=""
          className="relative z-10 object-contain drop-shadow-md"
          style={{ width: dims.logo, height: dims.logo }}
          draggable={false}
        />
      </div>
    </div>
  );
}
