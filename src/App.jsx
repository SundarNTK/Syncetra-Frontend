import AppRouter from "./router";
import AlarmListener from "./components/alarm-listener/AlarmListener";
import FcmBootstrap from "./components/fcm-bootstrap/FcmBootstrap";
import OfflineBanner from "./components/offline/OfflineBanner";
import { TripProvider } from "./context/TripContext";
import { usePrefetchOnLogin } from "./hooks/usePrefetchOnLogin";

function AppInner() {
  usePrefetchOnLogin();
  return (
    <>
      <FcmBootstrap />
      <OfflineBanner />
      <AppRouter />
    </>
  );
}

export default function App() {
  return (
    <TripProvider>
      <AlarmListener>
        <AppInner />
      </AlarmListener>
    </TripProvider>
  );
}
