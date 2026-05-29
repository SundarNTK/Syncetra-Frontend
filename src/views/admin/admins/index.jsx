import { useEffect, useState } from "react";
import { useAppSelector } from "../../../hooks";
import { getAdmins, updateUser } from "../../../services/users";
import { ROLES } from "../../../constants/enum";
import MasterPageShell from "../../../components/layout/MasterPageShell";

const INPUT_CLS =
  "w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-600 " +
  "focus:border-red-500 focus:ring-2 focus:ring-red-500/30 text-sm text-white placeholder-slate-500 outline-none transition-colors";
const LABEL_CLS = "text-xs font-medium text-slate-400 uppercase tracking-wide";

// ─── Profile image uploader (same as Members page) ───────────────────────────
function ProfileImageUpload({ value, onChange }) {
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
          if (w > h) { h = Math.round((h * MAX) / w); w = MAX; }
          else { w = Math.round((w * MAX) / h); h = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        onChange(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
        {value
          ? <img src={value} alt="Profile" className="w-full h-full object-cover" />
          : <span className="text-2xl text-slate-600">👤</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors text-sm text-slate-300">
          <span>📷</span>
          <span>Choose Image</span>
          <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="ml-2 text-xs text-red-400 hover:underline"
          >
            Remove
          </button>
        )}
        {imgError && <p className="text-xs text-red-400 mt-1">{imgError}</p>}
        <p className="text-xs text-slate-500 mt-1">JPG, PNG or WebP — max 2 MB.</p>
      </div>
    </div>
  );
}

// ─── Edit Admin Modal ─────────────────────────────────────────────────────────
function EditAdminModal({ admin, onSaved, onClose }) {
  const [form, setForm] = useState({
    name:         admin.name         || "",
    mobileNumber: admin.mobileNumber || "",
    profileImage: admin.profileImage || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (key) => (val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setError("");
  };

  const handleInput = (key) => (e) => set(key)(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await updateUser(admin.id, form);
      onSaved(res?.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-base">Edit Admin</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ProfileImageUpload value={form.profileImage} onChange={set("profileImage")} />

          <div>
            <label className={LABEL_CLS}>Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={handleInput("name")}
              className={INPUT_CLS}
              placeholder="Full name"
              required minLength={2}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>Mobile Number</label>
            <input
              type="tel"
              value={form.mobileNumber}
              onChange={(e) => set("mobileNumber")(e.target.value.replace(/\D/g, ""))}
              className={INPUT_CLS}
              placeholder="9876543210"
              required minLength={10} maxLength={15}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>Email</label>
            <input
              type="email"
              value={admin.email}
              readOnly
              className={`${INPUT_CLS} text-slate-500 cursor-not-allowed`}
            />
            <p className="text-xs text-slate-600 mt-1">Email cannot be changed.</p>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/50 border border-red-800/40 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 disabled:opacity-50 hover:opacity-90 transition-opacity text-sm"
            >
              {loading ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminAdmins() {
  const { userInfo } = useAppSelector((s) => s.user);
  const isSuperAdmin = userInfo?.user?.role === ROLES.SUPER_ADMIN;

  const [admins, setAdmins]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [editAdmin, setEditAdmin] = useState(null);

  const fetchAdmins = () => {
    setLoading(true);
    getAdmins()
      .then((res) => setAdmins(res?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleSaved = (updated) => {
    if (updated) {
      setAdmins((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
    }
    setEditAdmin(null);
  };

  const filtered = admins.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.username?.toLowerCase().includes(q)
    );
  });

  return (
    <MasterPageShell
      title="Admins"
      description="All admin accounts."
      action={
        <button
          type="button"
          onClick={fetchAdmins}
          disabled={loading}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          <span className={loading ? "animate-spin inline-block" : ""}>↻</span>
          Refresh
        </button>
      }
    >
      {editAdmin && (
        <EditAdminModal
          admin={editAdmin}
          onSaved={handleSaved}
          onClose={() => setEditAdmin(null)}
        />
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, email or username…"
        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 text-sm text-white placeholder-slate-500 outline-none transition-colors"
      />

      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500 text-sm">
          {search ? "No admins match your search." : "No admins found."}
        </p>
      ) : (
        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-xs text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Photo</th>
                  <th className="text-left px-4 py-3">Username</th>
                  <th className="text-left px-4 py-3">Full Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Mobile</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Password</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0">
                        {a.profileImage
                          ? <img src={a.profileImage} alt={a.name} className="w-full h-full object-cover" />
                          : <span className="text-base text-slate-500">👤</span>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300 text-xs">
                      {a.username || <span className="text-slate-600 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3 text-slate-400">{a.email}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{a.mobileNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        a.role === "super_admin"
                          ? "bg-purple-600/20 text-purple-400 border-purple-700"
                          : "bg-blue-600/20 text-blue-400 border-blue-700"
                      }`}>
                        {a.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.hasPassword
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 border border-green-700">Set</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-400 border border-amber-700">Pending</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => setEditAdmin(a)}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-600 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-slate-800">
            {filtered.map((a) => (
              <div key={a.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 border border-slate-600 shrink-0 flex items-center justify-center">
                      {a.profileImage
                        ? <img src={a.profileImage} alt={a.name} className="w-full h-full object-cover" />
                        : <span className="text-lg text-slate-500">👤</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{a.name}</p>
                      {a.username && <p className="text-xs font-mono text-slate-500">@{a.username}</p>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                    a.role === "super_admin"
                      ? "bg-purple-600/20 text-purple-400 border-purple-700"
                      : "bg-blue-600/20 text-blue-400 border-blue-700"
                  }`}>
                    {a.role === "super_admin" ? "Super Admin" : "Admin"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{a.email}</p>
                <p className="text-xs font-mono text-slate-500">{a.mobileNumber}</p>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setEditAdmin(a)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-600">{filtered.length} admin{filtered.length !== 1 ? "s" : ""} shown</p>
    </MasterPageShell>
  );
}
