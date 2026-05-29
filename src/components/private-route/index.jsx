import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../hooks";
import { ROLES } from "../../constants/enum";

const isAdminSide = (role) =>
  role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;

export default function PrivateRoute({ children, requiredRole }) {
  const { isLogin, userInfo } = useAppSelector((s) => s.user);
  const role = userInfo?.user?.role;

  if (!isLogin) return <Navigate to="/login" replace />;

  // super_admin can access all admin-required routes
  if (requiredRole === ROLES.ADMIN && isAdminSide(role)) return children;

  if (requiredRole && role !== requiredRole) {
    const redirect = isAdminSide(role) ? "/admin/dashboard" : "/user/dashboard";
    return <Navigate to={redirect} replace />;
  }

  return children;
}

// Guard for pages that require super_admin specifically
export function SuperAdminRoute({ children }) {
  const { isLogin, userInfo } = useAppSelector((s) => s.user);
  if (!isLogin) return <Navigate to="/login" replace />;
  if (userInfo?.user?.role !== ROLES.SUPER_ADMIN)
    return <Navigate to="/admin/dashboard" replace />;
  return children;
}
