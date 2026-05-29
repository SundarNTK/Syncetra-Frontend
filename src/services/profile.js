import { apiGet, apiPut } from "../utils/http";
import { API_SCOPE } from "../constants/enum";
import EndPoints from "../constants/endPoints";

export const getMyProfile = (isAdmin) =>
  apiGet(isAdmin ? API_SCOPE.ADMIN : API_SCOPE.USER, EndPoints.PROFILE);

export const updateMyProfile = (isAdmin, data) =>
  apiPut(isAdmin ? API_SCOPE.ADMIN : API_SCOPE.USER, EndPoints.PROFILE, data);
