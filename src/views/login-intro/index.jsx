import { Navigate, useLocation } from "react-router-dom";

export default function LoginIntro() {
  const { state } = useLocation();
  const destination = state?.destination;
  if (!destination) return <Navigate to="/login" replace />;
  return (
    <Navigate
      to="/intro-styles/cinematic"
      replace
      state={{ introFlow: true, destination }}
    />
  );
}
