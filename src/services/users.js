import { apiGet, apiPost, apiPut } from "../utils/http";
import { API_SCOPE } from "../constants/enum";
import EndPoints from "../constants/endPoints";

export const getMembers = () =>
  apiGet(API_SCOPE.ADMIN, `${EndPoints.USERS}?role=user`);

export const getAdmins = () =>
  apiGet(API_SCOPE.ADMIN, `${EndPoints.USERS}?role=admin`);

export const createMember = (data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.USERS, data);

export const updateUser = (id, data) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.USER(id), data);
