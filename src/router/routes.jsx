import { useEffect } from "react";
import { useRoutes, Navigate, useNavigate } from "react-router-dom";
import { useAppSelector } from "../hooks";
import PrivateRoute from "../components/private-route";
import SidebarLayout from "../components/layout/SidebarLayout";
import Login from "../views/login";
import LoginIntro from "../views/login-intro";
import IntroStylePreview from "../views/login-intro/styles";
import CreatePassword from "../views/create-password";
import CopyLink from "../views/copy-link";
import SampleTestPage from "../views/test-alarm/SampleTestPage";
import AdminDashboard from "../views/admin/dashboard";
import AdminTrips from "../views/admin/trips";
import AdminGroups from "../views/admin/groups";
import CreateGroup from "../views/admin/groups/CreateGroup";
import GroupDetail from "../views/admin/groups/GroupDetail";
import ScheduleAlarm from "../views/admin/alarms/ScheduleAlarm";
import ActiveAlarms from "../views/admin/alarms/ActiveAlarms";
import AlarmList from "../views/admin/alarms/AlarmList";
import AdminExpenses from "../views/admin/expenses";
import AdminVehicles from "../views/admin/vehicles";
import AdminAttendance from "../views/admin/attendance";
import AdminTasks from "../views/admin/tasks";
import AdminGallery from "../views/admin/gallery";
import AdminChecklist from "../views/admin/checklist";
import AdminPolls from "../views/admin/polls";
// import AdminItinerary from "../views/admin/itinerary";
import AdminMembers from "../views/admin/members";
import AdminAdmins from "../views/admin/admins";
import UserDashboard from "../views/user/dashboard";
import UserTrips from "../views/user/trips";
import UserGroups from "../views/user/groups";
import UserAttendance from "../views/user/attendance";
import UserTasks from "../views/user/tasks";
import UserExpenses from "../views/user/expenses";
import UserGallery from "../views/user/gallery";
import UserChecklist from "../views/user/checklist";
import UserPolls from "../views/user/polls";
import UserAlarmHistory from "../views/user/history";
import UserVehicles from "../views/user/vehicles";
import { ROLES } from "../constants/enum";
import UserProfile from "../views/profile";

const BASE_ADMIN_MENU = [
  { path: "/dashboard",     label: "Dashboard",     icon: "📊" },
  { path: "/admins",        label: "Admins",        icon: "🛡️" },
  { path: "/members",       label: "Members",       icon: "👤" },
  { path: "/trips",         label: "Trips",         icon: "🗺️" },
  { path: "/groups",        label: "Groups",        icon: "👥" },
  { path: "/alarms",        label: "Alarms",        icon: "⏰" },
  { path: "/alarms/active", label: "Active Alarms", icon: "🚨" },
  { path: "/vehicles",      label: "Vehicles",      icon: "🚌" },
  { path: "/attendance",    label: "Attendance",    icon: "✅" },
  { path: "/tasks",         label: "Tasks",         icon: "📋" },
  // { path: "/itinerary",     label: "Itinerary",     icon: "📅" },
  { path: "/expenses",      label: "Expenses",      icon: "💰" },
  { path: "/gallery",       label: "Gallery",       icon: "📷" },
  { path: "/checklist",     label: "Checklist",     icon: "🎒" },
  { path: "/polls",         label: "Polls",         icon: "🗳️" },
];

const userMenu = [
  { path: "/dashboard",  label: "Dashboard",     icon: "📊" },
  { path: "/trips",      label: "My Trips",      icon: "🗺️" },
  { path: "/groups",     label: "Groups",        icon: "👥" },
  { path: "/attendance", label: "Attendance",    icon: "✅" },
  { path: "/tasks",      label: "Tasks",         icon: "📋" },
  // { path: "/itinerary",  label: "Itinerary",     icon: "📅" },
  { path: "/vehicles",   label: "Vehicles",      icon: "🚌" },
  { path: "/expenses",   label: "Expenses",      icon: "💰" },
  { path: "/gallery",    label: "Gallery",       icon: "📷" },
  { path: "/checklist",  label: "Checklist",     icon: "🎒" },
  { path: "/polls",      label: "Polls",         icon: "🗳️" },
  { path: "/history",    label: "Alarm History", icon: "⏰" },
];

const privateRoute = (element, role) => (
  <PrivateRoute requiredRole={role}>{element}</PrivateRoute>
);

// Shows the cinematic intro before login. If already logged in, goes straight to dashboard.
function SplashRedirect() {
  const navigate = useNavigate();
  const { isLogin, userInfo } = useAppSelector((s) => s.user);

  useEffect(() => {
    if (isLogin && userInfo?.user?.name) {
      const dest =
        userInfo.user.role === ROLES.ADMIN || userInfo.user.role === ROLES.SUPER_ADMIN
          ? "/admin/dashboard"
          : "/user/dashboard";
      navigate(dest, { replace: true });
    } else {
      navigate("/intro-styles/cinematic", {
        replace: true,
        state: { introFlow: true, destination: "/login" },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function AppRoutes() {
  const adminMenu = BASE_ADMIN_MENU;

  return useRoutes([
    { path: "/login",           element: <Login /> },
    { path: "/intro",           element: <LoginIntro /> },
    { path: "/intro-styles",    element: <Navigate to="/intro-styles/cinematic" replace /> },
    { path: "/intro-styles/:styleId", element: <IntroStylePreview /> },
    { path: "/create-password", element: <CreatePassword /> },
    { path: "/copy-link",       element: <CopyLink /> },
    { path: "/test-alarm",      element: <SampleTestPage /> },
    {
      path: "/admin",
      element: privateRoute(
        <SidebarLayout menuItems={adminMenu} title="Syncetra Admin" />,
        ROLES.ADMIN
      ),
      children: [
        { index: true, element: <Navigate to="dashboard" replace /> },
        { path: "dashboard",       element: <AdminDashboard /> },
        { path: "trips",           element: <AdminTrips /> },
        { path: "groups",          element: <AdminGroups /> },
        { path: "groups/create",   element: <CreateGroup /> },
        { path: "groups/:id",      element: <GroupDetail /> },
        { path: "alarms",          element: <AlarmList /> },
        { path: "alarms/schedule", element: <ScheduleAlarm /> },
        { path: "alarms/active",   element: <ActiveAlarms /> },
        { path: "vehicles",        element: <AdminVehicles /> },
        { path: "attendance",      element: <AdminAttendance /> },
        { path: "tasks",           element: <AdminTasks /> },
        // { path: "itinerary",       element: <AdminItinerary /> },
        { path: "expenses",        element: <AdminExpenses /> },
        { path: "gallery",         element: <AdminGallery /> },
        { path: "checklist",       element: <AdminChecklist /> },
        { path: "polls",           element: <AdminPolls /> },
        { path: "admins",          element: <AdminAdmins /> },
        { path: "members",         element: <AdminMembers /> },
        { path: "profile",         element: <UserProfile /> },
      ],
    },
    {
      path: "/user",
      element: privateRoute(
        <SidebarLayout menuItems={userMenu} title="Syncetra" />,
        ROLES.USER
      ),
      children: [
        { index: true, element: <Navigate to="dashboard" replace /> },
        { path: "dashboard",  element: <UserDashboard /> },
        { path: "trips",      element: <UserTrips /> },
        { path: "groups",     element: <UserGroups /> },
        { path: "attendance", element: <UserAttendance /> },
        { path: "tasks",      element: <UserTasks /> },
        { path: "vehicles",   element: <UserVehicles /> },
        { path: "expenses",   element: <UserExpenses /> },
        { path: "gallery",    element: <UserGallery /> },
        { path: "checklist",  element: <UserChecklist /> },
        { path: "polls",      element: <UserPolls /> },
        { path: "history",    element: <UserAlarmHistory /> },
        { path: "profile",    element: <UserProfile /> },
      ],
    },
    { path: "/", element: <SplashRedirect /> },
    { path: "*", element: <Navigate to="/login" replace /> },
  ]);
}
