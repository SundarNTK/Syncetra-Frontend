import { apiGet, apiPost, apiPut, apiDelete } from "../utils/http";
import { API_SCOPE } from "../constants/enum";
import EndPoints from "../constants/endPoints";

export const getAdminGroups = () => apiGet(API_SCOPE.ADMIN, EndPoints.GROUPS);
export const getUserGroups = () => apiGet(API_SCOPE.USER, EndPoints.GROUPS);
export const getGroupById = (id) => apiGet(API_SCOPE.ADMIN, `${EndPoints.GROUPS}/${id}`);
export const createGroup = (data) => apiPost(API_SCOPE.ADMIN, EndPoints.GROUPS, data);
export const updateGroup = (id, data) => apiPut(API_SCOPE.ADMIN, `${EndPoints.GROUPS}/${id}`, data);
export const deleteGroup = (id) => apiDelete(API_SCOPE.ADMIN, `${EndPoints.GROUPS}/${id}`);
export const addGroupMember = (id, data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.GROUP_MEMBERS(id), data);

export const updateGroupMember = (groupId, memberId, data) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.GROUP_MEMBER(groupId, memberId), data);

export const removeGroupMember = (groupId, memberId) =>
  apiDelete(API_SCOPE.ADMIN, EndPoints.GROUP_MEMBER(groupId, memberId));
