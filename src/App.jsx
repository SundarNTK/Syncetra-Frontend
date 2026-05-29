import AppRouter from "./router";
import AlarmListener from "./components/alarm-listener/AlarmListener";
import FcmBootstrap from "./components/fcm-bootstrap/FcmBootstrap";
import { TripProvider } from "./context/TripContext";

export default function App() {
  return (
    <TripProvider>
      <AlarmListener>
        <FcmBootstrap />
        <AppRouter />
      </AlarmListener>
    </TripProvider>
  );
}
