import { useState } from "react";

export default function ProfileImageUpload({ value, onChange }) {
  const [imgError, setImgError] = useState("");

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!file.type.startsWith("image/")) {
      setImgError("Please select an image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImgError("Image must be under 10 MB.");
      return;
    }
    setImgError("");
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-3 py-2">

      {/* Avatar circle */}
      <div className="relative shrink-0">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-lg">
          {value ? (
            <img src={value} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-10 h-10 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          )}
        </div>
        {value && (
          <button type="button" onClick={() => onChange("")} aria-label="Remove photo"
            className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full bg-red-600 border-2 border-slate-900 text-white hover:bg-red-500 transition-colors shadow-md">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Upload button */}
      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-emerald-600/50 transition-colors text-sm text-slate-200 font-medium">
        <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
        {value ? "Change Photo" : "Choose Photo"}
        <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
      </label>

      {imgError && <p className="text-xs text-red-400 text-center">{imgError}</p>}
      <p className="text-[11px] text-slate-500">JPG, PNG or WebP · max 10 MB</p>
    </div>
  );
}
