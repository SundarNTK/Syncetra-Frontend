import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SyncetraBrand } from "../../components/brand/SyncetraLogo";

export default function CopyLink() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const url = searchParams.get("url") || "";

  // "idle" | "copying" | "copied" | "error" | "missing"
  const [state, setState] = useState("idle");

  useEffect(() => {
    if (!url) { setState("missing"); return; }

    setState("copying");
    navigator.clipboard
      .writeText(decodeURIComponent(url))
      .then(() => {
        setState("copied");
        setTimeout(() => { window.location.href = decodeURIComponent(url); }, 1500);
      })
      .catch(() => setState("error"));
  }, [url]);

  const decodedUrl = url ? decodeURIComponent(url) : "";

  const handleManualCopy = () => {
    navigator.clipboard.writeText(decodedUrl).then(() => setState("copied"));
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <SyncetraBrand variant="full" size="lg" centered />
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/80 shadow-2xl p-6 text-center space-y-5">

          {/* Copying spinner */}
          {state === "copying" && (
            <div className="py-4 space-y-3">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-400 text-sm">Copying link…</p>
            </div>
          )}

          {/* Success */}
          {state === "copied" && (
            <>
              <div className="text-5xl">✅</div>
              <h2 className="text-lg font-bold text-white">Link Copied!</h2>
              <p className="text-slate-400 text-sm">
                The setup link has been copied to your clipboard. You can now paste it in a browser.
              </p>
              <a
                href={decodedUrl}
                className="inline-block w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90 transition-opacity text-sm"
              >
                Open Link Now
              </a>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="block w-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Back to Sign In
              </button>
            </>
          )}

          {/* Clipboard API not available — show manual copy */}
          {state === "error" && (
            <>
              <div className="text-4xl">📋</div>
              <h2 className="text-base font-bold text-white">Copy the link below</h2>
              <p className="text-slate-400 text-sm">
                Auto-copy was blocked by your browser. Tap the link or the button below to copy it manually.
              </p>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-left">
                <p className="text-xs text-slate-500 mb-2">Setup URL:</p>
                <p className="text-xs text-cyan-400 break-all leading-relaxed">{decodedUrl}</p>
              </div>
              <button
                type="button"
                onClick={handleManualCopy}
                className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90 transition-opacity text-sm"
              >
                Copy to Clipboard
              </button>
              <a
                href={decodedUrl}
                className="block text-sm text-orange-400 hover:underline"
              >
                Or open link directly →
              </a>
            </>
          )}

          {/* No URL param */}
          {state === "missing" && (
            <>
              <div className="text-4xl">⚠️</div>
              <p className="text-red-400 font-semibold text-sm">No link found in the URL.</p>
              <p className="text-slate-500 text-xs">Please use the "Copy Setup Link" button from your email.</p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-orange-400 text-sm font-semibold hover:underline"
              >
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
