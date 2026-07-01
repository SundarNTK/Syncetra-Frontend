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
export const deleteExpense = (tripId, id) =>
  apiDelete(API_SCOPE.ADMIN, EndPoints.TRIP_EXPENSE(tripId, id));
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
export const deleteVehicle = (tripId, id) =>
  apiDelete(API_SCOPE.ADMIN, EndPoints.TRIP_VEHICLE(tripId, id));
export const getUserVehicles = (tripId) =>
  apiGet(API_SCOPE.USER, EndPoints.TRIP_VEHICLES(tripId));

export const getHotels = (tripId) =>
  apiGet(API_SCOPE.ADMIN, EndPoints.TRIP_HOTELS(tripId));
export const addHotel = (tripId, data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.TRIP_HOTELS(tripId), data);
export const updateHotel = (tripId, id, data) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.TRIP_HOTEL(tripId, id), data);
export const deleteHotel = (tripId, id) =>
  apiDelete(API_SCOPE.ADMIN, EndPoints.TRIP_HOTEL(tripId, id));
export const getUserHotels = (tripId) =>
  apiGet(API_SCOPE.USER, EndPoints.TRIP_HOTELS(tripId));
export const resolveMapLink = (url) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.RESOLVE_MAP_LINK, { url });

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
export const signMediaUpload = (tripId, isAdmin = true) =>
  apiPost(scope(isAdmin), EndPoints.TRIP_MEDIA_SIGN(tripId));
export const addMedia = (tripId, data, isAdmin = true) =>
  apiPost(scope(isAdmin), EndPoints.TRIP_MEDIA(tripId), data);
export const deleteMedia = (tripId, id, isAdmin = true) =>
  apiDelete(scope(isAdmin), EndPoints.TRIP_MEDIA_ITEM(tripId, id));

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

export const getItinerary = (tripId, isAdmin = true) =>
  apiGet(scope(isAdmin), EndPoints.TRIP_ITINERARY(tripId));
export const addItinerary = (tripId, data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.TRIP_ITINERARY(tripId), data);
export const updateItinerary = (tripId, id, data) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.TRIP_ITINERARY_ITEM(tripId, id), data);
export const deleteItinerary = (tripId, id) =>
  apiDelete(API_SCOPE.ADMIN, EndPoints.TRIP_ITINERARY_ITEM(tripId, id));
export const reorderItinerary = (tripId, order) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.TRIP_ITINERARY_REORDER(tripId), { order });

export const getShareCollections = (tripId) =>
  apiGet(API_SCOPE.ADMIN, EndPoints.TRIP_SHARE_COLLECTIONS(tripId));
export const addShareCollection = (tripId, data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.TRIP_SHARE_COLLECTIONS(tripId), data);
export const updateShareCollection = (tripId, id, data) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.TRIP_SHARE_COLLECTION(tripId, id), data);
export const deleteShareCollection = (tripId, id) =>
  apiDelete(API_SCOPE.ADMIN, EndPoints.TRIP_SHARE_COLLECTION(tripId, id));
export const addSharePayment = (tripId, id, data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.TRIP_SHARE_COLLECTION_PAYMENT(tripId, id), data);
export const updateSharePayment = (tripId, id, paymentId, data) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.TRIP_SHARE_COLLECTION_PAYMENT_DEL(tripId, id, paymentId), data);
export const deleteSharePayment = (tripId, id, paymentId) =>
  apiDelete(API_SCOPE.ADMIN, EndPoints.TRIP_SHARE_COLLECTION_PAYMENT_DEL(tripId, id, paymentId));
export const getMyShareCollection = (tripId) =>
  apiGet(API_SCOPE.USER, EndPoints.TRIP_SHARE_COLLECTION_ME(tripId));

export const getSponsors = (tripId, isAdmin = true) =>
  apiGet(scope(isAdmin), EndPoints.TRIP_SPONSORS(tripId));
export const addSponsor = (tripId, data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.TRIP_SPONSORS(tripId), data);
export const updateSponsor = (tripId, id, data) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.TRIP_SPONSOR(tripId, id), data);
export const deleteSponsor = (tripId, id) =>
  apiDelete(API_SCOPE.ADMIN, EndPoints.TRIP_SPONSOR(tripId, id));
