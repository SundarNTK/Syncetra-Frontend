import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppSelector } from "../../../hooks";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { ChecklistThumb } from "../../../components/trip/ChecklistThumb";
import ChecklistViewModal from "../../../components/checklist/ChecklistViewModal";
import MemberMultiSelect, {
  assigneesForApi,
  assignedIdsFromItem,
  formatChecklistAssignees,
} from "../../../components/ui/MemberMultiSelect";
import { ROLES } from "../../../constants/enum";
import {
  getChecklists,
  addChecklist,
  updateChecklist,
  deleteChecklist,
  getTripMembers,
  getChecklistItem,
} from "../../../services/trips";

const INPUT =
  "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 placeholder-slate-500";

const actionBtn = (cls) =>
  `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${cls}`;

const IconEye = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const IconEdit = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IconTrash = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconClose = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function readImageFileAsDataUrl(file, maxBytes = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image (JPG, PNG, WebP, GIF)."));
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error("Image must be under 2 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function ImagePreviewModal({ src, onClose }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 flex items-center justify-center max-h-[85vh]">
          <img src={src} alt="" className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-lg shadow-2xl" />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600/80 transition-colors"
        >
          ×
        </button>
      </div>
    </div>,
    document.body
  );
}

function ChecklistImageField({ value, onChange, onPreview, onPickFile }) {
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (onPickFile) {
      await onPickFile(file);
      return;
    }
    const dataUrl = await readImageFileAsDataUrl(file);
    onChange(dataUrl);
  };

  return (
    <div className="space-y-2 w-full">
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
          <button
            type="button"
            onClick={() => onPreview?.(value)}
            className="w-full flex items-center justify-center p-3 min-h-[120px] max-h-[260px] cursor-zoom-in hover:bg-slate-900/40 transition-colors"
            title="Click to view full size"
          >
            <img
              src={value}
              alt="Item preview"
              className="max-w-full max-h-[240px] w-auto h-auto object-contain rounded-md shadow-lg"
            />
          </button>
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-800 bg-slate-900/90">
            <span className="text-[10px] text-slate-500 truncate">Image attached</span>
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-[10px] px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer">
                Replace
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-[10px] px-2 py-1 rounded-md bg-red-950/50 border border-red-800/50 text-red-400 hover:bg-red-900/40 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-600 hover:border-emerald-600/60 text-slate-400 hover:text-emerald-400 text-xs transition-colors cursor-pointer">
          <span>📷 Choose image (optional)</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}

function ChecklistEditModal({ tripId, item, tripMembers, memberOptionIds, membersLoading, onClose, onSaved, onPreview }) {
  const [form, setForm] = useState({
    item: item?.item || "",
    description: item?.description || "",
    assignedTo: assignedIdsFromItem(item),
    imageUrl: item?.imageUrl || "",
  });
  const [imgError, setImgError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!tripId || !item?._id || item.imageUrl || !item.hasImage) return;
    getChecklistItem(tripId, item._id, true)
      .then((r) => {
        const d = r?.data;
        if (d?.imageUrl) setForm((p) => ({ ...p, imageUrl: d.imageUrl }));
      })
      .catch(() => {});
  }, [tripId, item]);

  const handleImagePick = async (file) => {
    setImgError("");
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setForm((p) => ({ ...p, imageUrl: dataUrl }));
    } catch (err) {
      setImgError(err.message || "Invalid image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setImgError("");
    try {
      await updateChecklist(tripId, item._id, {
        item: form.item.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        assignedTo: assigneesForApi(form.assignedTo, memberOptionIds),
      });
      onSaved();
      onClose();
    } catch (err) {
      setImgError(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
          <h2 className="font-semibold text-emerald-400">Edit checklist item</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400">
            <IconClose />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Item name</label>
              <input
                className={INPUT}
                value={form.item}
                onChange={(e) => setForm((p) => ({ ...p, item: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Assign to</label>
              <MemberMultiSelect
                options={tripMembers}
                value={form.assignedTo}
                onChange={(ids) => setForm((p) => ({ ...p, assignedTo: ids }))}
                disabled={membersLoading}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Description</label>
            <textarea
              className={`${INPUT} resize-none min-h-[72px]`}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Image</label>
            <ChecklistImageField
              value={form.imageUrl}
              onChange={(v) => setForm((p) => ({ ...p, imageUrl: v }))}
              onPreview={onPreview}
              onPickFile={handleImagePick}
            />
          </div>
          {imgError && <p className="text-sm text-red-400">{imgError}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-medium"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChecklistRowActions({ isAdminUser, isSuperAdmin, onView, onEdit, onDelete }) {
  if (!isAdminUser) return null;
  return (
    <div className="flex flex-col gap-1.5 shrink-0 sm:pl-3 sm:border-l sm:border-slate-700/50">
      <button
        type="button"
        onClick={onView}
        className={actionBtn("bg-slate-700 hover:bg-slate-600 text-slate-200")}
      >
        <IconEye /> View
      </button>
      {isSuperAdmin && (
        <>
          <button
            type="button"
            onClick={onEdit}
            className={actionBtn("bg-slate-700 hover:bg-slate-600 text-slate-200")}
          >
            <IconEdit /> Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={actionBtn("bg-red-900/40 hover:bg-red-900/60 text-red-400")}
          >
            <IconTrash /> Delete
          </button>
        </>
      )}
    </div>
  );
}

export default function AdminChecklist() {
  const { userInfo } = useAppSelector((s) => s.user);
  const { selectedTripId } = useTrip();
  const role = userInfo?.user?.role;
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const isAdminUser = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;

  const [items, setItems] = useState([]);
  const [tripMembers, setTripMembers] = useState([]);
  const [form, setForm] = useState({
    item: "",
    description: "",
    assignedTo: [],
    imageUrl: "",
  });
  const [imgError, setImgError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const { confirmDelete, deleteModal } = useDeleteConfirm();

  const memberOptionIds = tripMembers.map((m) => String(m.id || m._id));

  const reloadChecklists = useCallback(() => {
    if (!selectedTripId) return;
    setLoadError("");
    getChecklists(selectedTripId)
      .then((r) => setItems(r?.data || []))
      .catch((err) => {
        setItems([]);
        setLoadError(err.message || "Could not load checklist");
      });
  }, [selectedTripId]);

  useEffect(() => {
    if (!selectedTripId) {
      setItems([]);
      return undefined;
    }
    let ignore = false;
    setLoadError("");
    setLoading(true);
    getChecklists(selectedTripId)
      .then((r) => {
        if (!ignore) setItems(r?.data || []);
      })
      .catch((err) => {
        if (!ignore) {
          setItems([]);
          setLoadError(err.message || "Could not load checklist");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [selectedTripId]);

  useEffect(() => {
    if (!selectedTripId) {
      setTripMembers([]);
      return undefined;
    }
    let ignore = false;
    setMembersLoading(true);
    getTripMembers(selectedTripId)
      .then((r) => {
        if (!ignore) setTripMembers(r?.data || []);
      })
      .catch(() => {
        if (!ignore) setTripMembers([]);
      })
      .finally(() => {
        if (!ignore) setMembersLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [selectedTripId]);

  const handleImagePick = async (file) => {
    setImgError("");
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setForm((p) => ({ ...p, imageUrl: dataUrl }));
    } catch (err) {
      setImgError(err.message || "Invalid image");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedTripId) return;
    setSaving(true);
    setImgError("");
    try {
      const assignedTo = assigneesForApi(form.assignedTo, memberOptionIds);
      await addChecklist(selectedTripId, {
        item: form.item.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        assignedTo,
      });
      setForm({ item: "", description: "", assignedTo: [], imageUrl: "" });
      reloadChecklists();
    } catch (err) {
      setImgError(err.message || "Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    if (!selectedTripId) return;
    confirmDelete({
      recordLabel: item.item,
      onConfirm: async () => {
        try {
          await deleteChecklist(selectedTripId, item._id);
          reloadChecklists();
        } catch (err) {
          alert(err.message || "Could not delete item");
          throw err;
        }
      },
    });
  };

  return (
    <TripModuleShell title="Checklist" description="Packing items with image, notes, and optional assignee" loading={loading && !!selectedTripId}>
      {selectedTripId && (
        <>
          {isAdminUser && (
            <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 mb-4">
              <p className="text-xs text-slate-500">
                Use <strong className="text-slate-400">Select all</strong> or leave everyone checked so all trip
                members see the item. Uncheck members to limit who sees it in their app.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Item name</label>
                  <input
                    className={INPUT}
                    value={form.item}
                    onChange={(e) => setForm((p) => ({ ...p, item: e.target.value }))}
                    placeholder="e.g. First aid kit"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Assign to</label>
                  <MemberMultiSelect
                    options={tripMembers}
                    value={form.assignedTo}
                    onChange={(ids) => setForm((p) => ({ ...p, assignedTo: ids }))}
                    disabled={membersLoading}
                    placeholder="All members"
                    emptyHint="No members on this trip. Link a Group to this trip and add members there."
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Description</label>
                <textarea
                  className={`${INPUT} resize-none min-h-[72px]`}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional details (shown when member expands)"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Image</label>
                <ChecklistImageField
                  value={form.imageUrl}
                  onChange={(v) => setForm((p) => ({ ...p, imageUrl: v }))}
                  onPreview={setPreviewImage}
                  onPickFile={handleImagePick}
                />
              </div>
              {imgError && <p className="text-sm text-red-400">{imgError}</p>}
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Adding…" : "Add checklist item"}
              </button>
            </form>
          )}

          {loadError ? <p className="text-sm text-red-400 mb-3">{loadError}</p> : null}

          <ul className="space-y-2">
            {items.length === 0 && !loadError && (
              <p className="text-slate-500 text-sm">No checklist items yet.</p>
            )}
            {items.map((c) => {
              const assigneeLabel = formatChecklistAssignees(c, tripMembers);
              const packedNames = (c.packedBy || [])
                .map((p) => (p && typeof p === "object" ? p.name : null))
                .filter(Boolean);
              return (
                <li
                  key={c._id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex gap-3 items-start"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-950 flex items-center justify-center">
                    <ChecklistThumb tripId={selectedTripId} item={c} isAdmin />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-100">{c.item}</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-[11px]">
                      <span className="text-slate-500">
                        Assignee: <span className="text-slate-300">{assigneeLabel}</span>
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-500">
                        Packed:{" "}
                        <span className="text-slate-300">
                          {packedNames.length ? packedNames.join(", ") : "—"}
                        </span>
                      </span>
                    </div>
                    {c.description ? (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 whitespace-pre-wrap">{c.description}</p>
                    ) : null}
                  </div>
                  <ChecklistRowActions
                    isAdminUser={isAdminUser}
                    isSuperAdmin={isSuperAdmin}
                    onView={() => setViewItem(c)}
                    onEdit={() => setEditItem(c)}
                    onDelete={() => handleDelete(c)}
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}

      {viewItem && selectedTripId && (
        <ChecklistViewModal
          tripId={selectedTripId}
          item={viewItem}
          tripMembers={tripMembers}
          onClose={() => setViewItem(null)}
        />
      )}
      {editItem && selectedTripId && isSuperAdmin && (
        <ChecklistEditModal
          tripId={selectedTripId}
          item={editItem}
          tripMembers={tripMembers}
          memberOptionIds={memberOptionIds}
          membersLoading={membersLoading}
          onClose={() => setEditItem(null)}
          onSaved={reloadChecklists}
          onPreview={setPreviewImage}
        />
      )}
      {previewImage && (
        <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
      )}
      {deleteModal}
    </TripModuleShell>
  );
}
