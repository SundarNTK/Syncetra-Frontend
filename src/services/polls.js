import { apiGet, apiPost, apiPut, apiDelete } from "../utils/http";
import { API_SCOPE } from "../constants/enum";
import EndPoints from "../constants/endPoints";

export const getPolls = (params) =>
  apiGet(API_SCOPE.ADMIN, EndPoints.POLLS, { params });

export const getPoll = (id) =>
  apiGet(API_SCOPE.ADMIN, EndPoints.POLL(id));

export const getUserPolls = (params) =>
  apiGet(API_SCOPE.USER, EndPoints.POLLS, { params });

export const getPollAnalytics = (id) =>
  apiGet(API_SCOPE.ADMIN, EndPoints.POLL_ANALYTICS(id));

export const createPoll = (data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.POLLS, data);

export const updatePoll = (id, data) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.POLL(id), data);

export const deletePoll = (id) =>
  apiDelete(API_SCOPE.ADMIN, EndPoints.POLL(id));

export const votePoll = (id, optionIndex) =>
  apiPost(API_SCOPE.USER, EndPoints.POLL_VOTE(id), { optionIndex });
