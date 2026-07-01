import { useCallback, useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { MasterList, MasterListItem } from "../../../components/layout/MasterPageShell";
import { getUserHotels } from "../../../services/trips";
import { useOnlineReload } from "../../../hooks/useOnlineReload";
import ZoomableImage from "../../../components/ui/ZoomableImage";
import HotelDetailModal, {
  fmt,
  PAYMENT_STATUS,
  getPaymentStatusKey,
  PaymentStatusBadge,
  GlowStat,
  nightsBetween,
} from "../../../components/hotels/HotelDetailModal";

/* ─── HotelListItem ───────────────────────────────────────────────────────────── */
function HotelListItem({ hotel, onView }) {
  const cover = hotel.images?.[0];
  const nights = nightsBetween(hotel.checkInAt, hotel.checkOutAt);
  const totalCost = (Number(hotel.perDayCost) || 0) * nights;
  const statusStyle = PAYMENT_STATUS[getPaymentStatusKey(hotel)];

  return (
    <MasterListItem className="flex-col sm:flex-row">
      {/* Cover column */}
      <div className="relative shrink-0 w-full h-44 sm:h-auto sm:w-52 md:w-60 sm:min-h-[9.5rem] sm:self-stretch bg-slate-950 border-b sm:border-b-0 sm:border-r border-slate-800/60 p-1.5">
        <div className="relative h-full w-full rounded-lg overflow-hidden border"
          style={{ borderColor: `rgba(${statusStyle.rgb},0.4)`, boxShadow: `0 0 18px rgba(${statusStyle.rgb},0.16)` }}>
          {cover ? (
            <ZoomableImage src={cover} alt={hotel.hotelName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-3xl">🏨</div>
          )}
        </div>
      </div>

      {/* Info + action */}
      <div className="flex-1 flex flex-col sm:flex-row min-w-0 w-full">
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-base sm:text-lg truncate">{hotel.hotelName}</h3>
            <PaymentStatusBadge hotel={hotel} />
          </div>
          {hotel.locationName && <p className="text-xs text-slate-500 mt-0.5 truncate">📍 {hotel.locationName}</p>}

          <div className="flex flex-wrap gap-2 mt-3">
            <GlowStat icon="🌙" label="Nights" value={nights || "—"} color="6,182,212" />
            <GlowStat icon="🛏️" label="Rooms" value={hotel.roomsCount || 1} color="59,130,246" />
            <GlowStat icon="💰" label="Total" value={fmt(totalCost)} color="16,185,129" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-col gap-1.5 p-4 pt-0 sm:p-4 sm:pt-4 sm:pl-2 sm:shrink-0 sm:self-center border-t sm:border-t-0 sm:border-l border-slate-700/40">
          <button
            type="button"
            onClick={onView}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors w-full sm:w-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            View
          </button>
        </div>
      </div>
    </MasterListItem>
  );
}

/* ─── UserHotels ──────────────────────────────────────────────────────────────── */
export default function UserHotels() {
  const { selectedTripId } = useTrip();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewHotel, setViewHotel] = useState(null);

  const load = useCallback(() => {
    if (!selectedTripId) { setItems([]); return; }
    setLoading(true);
    getUserHotels(selectedTripId)
      .then((r) => { if (r !== null) setItems(r?.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedTripId]);

  useEffect(() => { load(); }, [load]);
  useOnlineReload(load);

  return (
    <TripModuleShell title="Hotels" description="Trip hotel & stay details" loading={loading && !!selectedTripId}>
      {viewHotel && <HotelDetailModal hotel={viewHotel} onClose={() => setViewHotel(null)} />}

      {selectedTripId && (
        items.length === 0 ? (
          <div className="text-center py-14 text-slate-500">
            <p className="text-4xl mb-3">🏨</p>
            <p className="text-sm">No hotels booked for this trip yet.</p>
          </div>
        ) : (
          <MasterList>
            {items.map((h) => (
              <HotelListItem key={h._id} hotel={h} onView={() => setViewHotel(h)} />
            ))}
          </MasterList>
        )
      )}
    </TripModuleShell>
  );
}
