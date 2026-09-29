// app/utils/apiEndpoints.ts

import { LICENSE_TOKEN } from "@/lib/config";

/**
 * PowerAPI puts the license/tenant token in the path of every route, so each
 * builder takes it explicitly and defaults to the configured one.
 * See AccountController.cs — `api/Login/{token}`, `api/Refresh/{token}`, etc.
 */
const t = (token?: string) => token ?? LICENSE_TOKEN;

export const authEndpoints = {
  /** GET — license/subscription check. */
  verify: (token?: string) => `/Auth/${t(token)}`,
  /** POST — body: LoginDto { username, password }. */
  login: (token?: string) => `/Login/${t(token)}`,
  /** POST — body: RefreshTokenDto { accessToken, refreshToken }. */
  refresh: (token?: string) => `/Refresh/${t(token)}`,
  /** DELETE — revokes the current refresh session. */
  logout: (token?: string) => `/Logout/${t(token)}`,
  /** GET — locations this user may operate in. */
  locations: (token?: string) => `/account/location/${t(token)}`,
  /** POST — switch active location, returns a re-issued JWT. */
  switchLocation: (token?: string) => `/account/location/switch/${t(token)}`,
  /** POST — persist the user's home location. */
  homeLocation: (token?: string) => `/account/location/home/${t(token)}`,
};

export interface CrudEndpoints {
  list: (token?: string) => string;
  byId: (token?: string) => string;
  create: (token?: string) => string;
  update: (token?: string) => string;
  remove: (token?: string) => string;
}

/**
 * Builds the five standard routes for a school module.
 *
 * The backend controllers follow one naming rule — `Get{Plural}`,
 * `Get{Singular}ById`, `Add{Singular}`, `Update{Singular}`,
 * `Delete{Singular}` — so the URLs are derived rather than listed out twelve
 * times. `plural` is passed separately because it is not always
 * `singular + "s"` (Attendance is its own plural).
 */
const crud = (singular: string, plural = `${singular}s`): CrudEndpoints => ({
  list: (token?: string) => `/Get${plural}/${t(token)}`,
  byId: (token?: string) => `/Get${singular}ById/${t(token)}`,
  create: (token?: string) => `/Add${singular}/${t(token)}`,
  update: (token?: string) => `/Update${singular}/${t(token)}`,
  remove: (token?: string) => `/Delete${singular}/${t(token)}`,
});

export const studentEndpoints = crud("Student");
export const teacherEndpoints = crud("Teacher");
export const parentEndpoints = crud("Parent");
export const classEndpoints = crud("Class", "Classes");
export const subjectEndpoints = crud("Subject");
export const lessonEndpoints = crud("Lesson");
export const examEndpoints = crud("Exam");
export const assignmentEndpoints = crud("Assignment");
export const resultEndpoints = crud("Result");
export const eventEndpoints = crud("Event");
export const announcementEndpoints = crud("Announcement");
// "Attendance" routes belong to the HR/payroll controller; school ones are prefixed.
export const attendanceEndpoints = crud("StudentAttendance", "StudentAttendance");

export const feeItemEndpoints = crud("FeeItem");

/**
 * Bills are generated from fee items rather than created one by one, and
 * payments are reversed rather than edited, so neither fits `crud()`.
 */
export const feeEndpoints = {
  bills: (token?: string) => `/GetFeeBills/${t(token)}`,
  billById: (token?: string) => `/GetFeeBillById/${t(token)}`,
  generateBills: (token?: string) => `/GenerateFeeBills/${t(token)}`,
  updateBill: (token?: string) => `/UpdateFeeBill/${t(token)}`,
  deleteBill: (token?: string) => `/DeleteFeeBill/${t(token)}`,
  payments: (token?: string) => `/GetFeePayments/${t(token)}`,
  addPayment: (token?: string) => `/AddFeePayment/${t(token)}`,
  addFamilyPayment: (token?: string) => `/AddFamilyPayment/${t(token)}`,
  /** DELETE — reverses the payment and restores the bill balance. */
  deletePayment: (token?: string) => `/DeleteFeePayment/${t(token)}`,
  family: (token?: string) => `/GetFamilyFees/${t(token)}`,
  summary: (token?: string) => `/GetFeeSummary/${t(token)}`,
  /** GET ?studentIds=a,b,c (at most 200) — each student's balance across all bills. */
  studentStatus: (token?: string) => `/GetStudentFeeStatus/${t(token)}`,
};

/** Messages have no update route — a sent message is immutable. */
export const messageEndpoints = {
  list: (token?: string) => `/GetMessages/${t(token)}`,
  byId: (token?: string) => `/GetMessageById/${t(token)}`,
  send: (token?: string) => `/SendMessage/${t(token)}`,
  remove: (token?: string) => `/DeleteMessage/${t(token)}`,
};

/**
 * Bulk import, shared by every module. Both take `module` (a ModuleName) as
 * a query parameter; the template also takes `format` ("csv" or "xlsx").
 */
export const importEndpoints = {
  template: (token?: string) => `/GetSchoolImportTemplate/${t(token)}`,
  /** POST multipart/form-data with a `File` field. */
  upload: (token?: string) => `/ImportSchoolRecords/${t(token)}`,
};

/** Id/name sources for select inputs. */
export const lookupEndpoints = {
  subjects: (token?: string) => `/GetSubjectList/${t(token)}`,
  classes: (token?: string) => `/GetClassList/${t(token)}`,
  grades: (token?: string) => `/GetGradeList/${t(token)}`,
  teachers: (token?: string) => `/GetTeacherList/${t(token)}`,
  parents: (token?: string) => `/GetParentList/${t(token)}`,
};

/** Aggregates behind the admin dashboard. */
export const dashboardEndpoints = {
  summary: (token?: string) => `/GetDashboardSummary/${t(token)}`,
  genderCount: (token?: string) => `/GetStudentGenderCount/${t(token)}`,
  weeklyAttendance: (token?: string) => `/GetWeeklyAttendance/${t(token)}`,
  schedule: (token?: string) => `/GetSchedule/${t(token)}`,
  performance: (token?: string) => `/GetPerformance/${t(token)}`,
  calendarEvents: (token?: string) => `/GetCalendarEvents/${t(token)}`,
  latestAnnouncements: (token?: string) => `/GetLatestAnnouncements/${t(token)}`,
};

export const endpoints = {
  ...authEndpoints,

  students: studentEndpoints,
  teachers: teacherEndpoints,
  parents: parentEndpoints,
  classes: classEndpoints,
  subjects: subjectEndpoints,
  lessons: lessonEndpoints,
  exams: examEndpoints,
  assignments: assignmentEndpoints,
  results: resultEndpoints,
  events: eventEndpoints,
  announcements: announcementEndpoints,
  attendance: attendanceEndpoints,
  messages: messageEndpoints,
  imports: importEndpoints,
  feeItems: feeItemEndpoints,
  fees: feeEndpoints,

  lookups: lookupEndpoints,
  dashboard: dashboardEndpoints,
};

// Generic pattern for PowerAPI list endpoints (FilterRequest query binding).
export const paginated = (url: string, page = 1, size = 10) =>
  `${url}?Pagination.Page=${page}&Pagination.ItemsPerPage=${size}`;
