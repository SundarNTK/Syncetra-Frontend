import { apiGet } from "../utils/http";
import { API_SCOPE } from "../constants/enum";

export const getAdminDashboard = () =>
  apiGet(API_SCOPE.ADMIN, "/dashboard");

export const getUserDashboard = () =>
  apiGet(API_SCOPE.USER, "/dashboard");
