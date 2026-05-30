import { apiGet, apiPost, apiPut, apiDelete } from "../utils/http";
import { API_SCOPE } from "../constants/enum";
import EndPoints from "../constants/endPoints";

const scope = (isAdmin) => (isAdmin ? API_SCOPE.ADMIN : API_SCOPE.USER);

export const getAdminTrips = () => apiGet(API_SCOPE.ADMIN, EndPoints.TRIPS);
export const getUserTrips = () => apiGet(API_SCOPE.USER, EndPoints.TRIPS);
export const createTrip = (data) => apiPost(API_SCOPE.ADMIN, EndPoints.TRIPS, data);
export const updateTrip = (id, data) => apiPut(API_SCOPE.ADMIN, EndPoints.TRIP(id), data);
export const deleteTrip = (id) => apiDelete(API_SCOPE.ADMIN, EndPoints.TRIP(id));
export const getTripHub = (id) => apiGet(API_SCOPE.ADMIN, EndPoints.TRIP_HUB(id));

export const getExpenses = (tripId, isAdmin = true) =>
  apiGet(scope(isAdmin), EndPoints.TRIP_EXPENSES(tripId));
export const addExpense = (tripId, data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.TRIP_EXPENSES(tripId), data);
export const updateExpense = (tripId, id, data) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.TRIP_EXPENSE(tripId, id), data);
export const updateTripBudget = (tripId, data) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.TRIP_BUDGET(tripId), data);

export const getTasks = (tripId, isAdmin = true) =>
  apiGet(scope(isAdmin), EndPoints.TRIP_TASKS(tripId));
export const addTask = (tripId, data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.TRIP_TASKS(tripId), data);
export const updateTask = (tripId, id, data) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.TRIP_TASK(tripId, id), data);
export const deleteTask = (tripId, id) =>
  apiDelete(API_SCOPE.ADMIN, EndPoints.TRIP_TASK(tripId, id));
export const acknowledgeTask = (tripId, id, data) =>
  apiPost(API_SCOPE.USER, EndPoints.TRIP_TASK_ACKNOWLEDGE(tripId, id), data);
export const getUserPendingTasks = () =>
  apiGet(API_SCOPE.USER, EndPoints.USER_PENDING_TASKS);

export const getVehicles = (tripId) =>
  apiGet(API_SCOPE.ADMIN, EndPoints.TRIP_VEHICLES(tripId));
export const addVehicle = (tripId, data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.TRIP_VEHICLES(tripId), data);
export const updateVehicle = (tripId, id, data) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.TRIP_VEHICLE(tripId, id), data);
export const getUserVehicles = (tripId) =>
  apiGet(API_SCOPE.USER, EndPoints.TRIP_VEHICLES(tripId));

export const getAttendance = (tripId, params) =>
  apiGet(API_SCOPE.ADMIN, EndPoints.TRIP_ATTENDANCE(tripId), params ? { params } : undefined);
export const getAttendanceCheckpoints = (tripId) =>
  apiGet(API_SCOPE.ADMIN, EndPoints.TRIP_ATTENDANCE_CHECKPOINTS(tripId));
export const getUserAttendance = (tripId) =>
  apiGet(API_SCOPE.USER, EndPoints.TRIP_ATTENDANCE(tripId));
export const upsertAttendance = (tripId, data, isAdmin = true) =>
  apiPost(scope(isAdmin), EndPoints.TRIP_ATTENDANCE(tripId), data);
export const updateAttendanceRecord = (tripId, recordId, data) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.TRIP_ATTENDANCE_RECORD(tripId, recordId), data);

export const getMedia = (tripId, params, isAdmin = true) =>
  apiGet(scope(isAdmin), EndPoints.TRIP_MEDIA(tripId), { params });
export const getMediaItem = (tripId, id, isAdmin = true) =>
  apiGet(scope(isAdmin), EndPoints.TRIP_MEDIA_ITEM(tripId, id));
export const addMedia = (tripId, data, isAdmin = true) =>
  apiPost(scope(isAdmin), EndPoints.TRIP_MEDIA(tripId), data);
export const deleteMedia = (tripId, id) =>
  apiDelete(API_SCOPE.ADMIN, EndPoints.TRIP_MEDIA_ITEM(tripId, id));

export const getPolls = (tripId, isAdmin = true) =>
  apiGet(scope(isAdmin), EndPoints.TRIP_POLLS(tripId));
export const addPoll = (tripId, data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.TRIP_POLLS(tripId), data);
export const votePoll = (tripId, pollId, optionIndex, isAdmin = false) =>
  apiPost(scope(isAdmin), EndPoints.TRIP_POLL_VOTE(tripId, pollId), { optionIndex });

export const getTripMembers = (tripId, isAdmin = true) =>
  apiGet(scope(isAdmin), EndPoints.TRIP_MEMBERS(tripId));

export const getChecklists = (tripId, isAdmin = true) =>
  apiGet(scope(isAdmin), EndPoints.TRIP_CHECKLISTS(tripId));
export const getChecklistItem = (tripId, id, isAdmin = true) =>
  apiGet(scope(isAdmin), EndPoints.TRIP_CHECKLIST_ITEM(tripId, id));
export const addChecklist = (tripId, data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.TRIP_CHECKLISTS(tripId), data);
export const updateChecklist = (tripId, id, data) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.TRIP_CHECKLIST_ITEM(tripId, id), data);
export const deleteChecklist = (tripId, id) =>
  apiDelete(API_SCOPE.ADMIN, EndPoints.TRIP_CHECKLIST_ITEM(tripId, id));
export const toggleChecklist = (tripId, id, isAdmin = false) =>
  apiPut(scope(isAdmin), EndPoints.TRIP_CHECKLIST_TOGGLE(tripId, id));

export const getSchedules = (tripId, isAdmin = true) =>
  apiGet(scope(isAdmin), EndPoints.TRIP_SCHEDULES(tripId));
export const addSchedule = (tripId, data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.TRIP_SCHEDULES(tripId), data);

export const getSyncStatus = (tripId) =>
  apiGet(API_SCOPE.ADMIN, EndPoints.TRIP_SYNC(tripId));
