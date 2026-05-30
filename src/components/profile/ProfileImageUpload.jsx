import { useState } from "react";

export default function ProfileImageUpload({ value, onChange }) {
  const [imgError, setImgError] = useState("");

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImgError("Please select an image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImgError("Image must be under 2 MB.");
      return;
    }
    setImgError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 400;
        let { width: w, height: h } = img;
        if (w > MAX || h > MAX) {
          if (w > h) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        onChange(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <div className="relative w-20 h-20 shrink-0">
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
          {value ? (
            <img src={value} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl text-slate-600">👤</span>
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove photo"
            className="absolute -top-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-900 bg-red-600 text-white shadow-lg transition-colors hover:bg-red-500"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div>
        <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-emerald-700/40 transition-colors text-sm text-slate-300">
          <span>📷</span>
          <span>Choose Photo</span>
          <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
        </label>
        {imgError && <p className="text-xs text-red-400 mt-1.5">{imgError}</p>}
        <p className="text-xs text-slate-500 mt-1.5">JPG, PNG or WebP — max 2 MB.</p>
      </div>
    </div>
  );
}
