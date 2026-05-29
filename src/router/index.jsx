import { HashRouter } from "react-router-dom";
import AppRoutes from "./routes";

export default function AppRouter() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
