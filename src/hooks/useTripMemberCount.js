import { useEffect, useState } from "react";
import { getTripMembers } from "../services/trips";

export default function useTripMemberCount(tripId, fallbackCount = 0, isAdmin = true) {
  const [memberCount, setMemberCount] = useState(fallbackCount);

  useEffect(() => {
    if (!tripId) {
      setMemberCount(fallbackCount);
      return undefined;
    }
    let ignore = false;
    getTripMembers(tripId, isAdmin)
      .then((res) => {
        if (!ignore) setMemberCount((res?.data || []).length);
      })
      .catch(() => {
        if (!ignore) setMemberCount(fallbackCount);
      });
    return () => {
      ignore = true;
    };
  }, [tripId, fallbackCount, isAdmin]);

  return memberCount;
}
