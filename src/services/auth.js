import { apiPost, apiPut } from "../utils/http";
import { API_SCOPE } from "../constants/enum";
import EndPoints from "../constants/endPoints";

const authScope = API_SCOPE.USER;

export const register = (payload) =>
  apiPost(authScope, EndPoints.AUTH.REGISTER, payload);

export const login = (identifier, password) =>
  apiPost(authScope, EndPoints.AUTH.LOGIN, { identifier, password });

export const verifySetupToken = (token) =>
  apiPost(authScope, EndPoints.AUTH.VERIFY_SETUP_TOKEN, { token });

export const createPassword = (token, password, confirmPassword) =>
  apiPost(authScope, EndPoints.AUTH.CREATE_PASSWORD, { token, password, confirmPassword });

export const updateFcmToken = (fcmToken, authToken) =>
  apiPut(authScope, EndPoints.AUTH.FCM_TOKEN, { fcmToken }, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
  });

export const changePassword = (oldPassword, newPassword) =>
  apiPut(authScope, EndPoints.AUTH.CHANGE_PASSWORD, { oldPassword, newPassword });

export const forgotPassword = (email) =>
  apiPost(authScope, EndPoints.AUTH.FORGOT_PASSWORD, { email });

export const resetPassword = (email, otp, newPassword) =>
  apiPost(authScope, EndPoints.AUTH.RESET_PASSWORD, { email, otp, newPassword });
