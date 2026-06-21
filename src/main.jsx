import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import { store } from "./store";
import { setOnUnauthorized } from "./utils/http";
import { CLEAR_USER } from "./store/userSlice";
import "./index.css";

// Wire up the 401 → logout callback.  Interceptors now live inside http.js and
// are set up at module load time, so they survive Vite HMR without needing a
// separate setupHttpInterceptor call.
setOnUnauthorized(() => store.dispatch(CLEAR_USER()));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
