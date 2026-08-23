// One typed CRUD service per school module, plus the lookup and dashboard calls.
//
// `moduleServices` at the bottom lets generic UI (the delete confirmation in
// FormModal) act on any module by name without a switch statement.

import {
  deleteOne,
  getList,
  getOne,
  postOne,
  type ListQuery,
} from "@/lib/apiClient";
import {
  announcementEndpoints,
  assignmentEndpoints,
  attendanceEndpoints,
  classEndpoints,
  dashboardEndpoints,
  eventEndpoints,
  examEndpoints,
  lessonEndpoints,
  lookupEndpoints,
  messageEndpoints,
  parentEndpoints,
  resultEndpoints,
  studentEndpoints,
  subjectEndpoints,
  teacherEndpoints,
} from "@/utils/apiEndPoints";
import { createCrudService, type CrudService } from "./crud";
import type {
  Announcement,
  AnnouncementCreateInput,
  AnnouncementUpdateInput,
  Assignment,
  AssignmentCreateInput,
  AssignmentUpdateInput,
  Attendance,
  AttendanceCreateInput,
  AttendanceUpdateInput,
  ClassCreateInput,
  ClassUpdateInput,
  DashboardSummary,
  Exam,
  ExamCreateInput,
  ExamUpdateInput,
  GenderCount,
  Lesson,
  LessonCreateInput,
  LessonUpdateInput,
  Lookup,
  Message,
  MessageCreateInput,
  Parent,
  ParentCreateInput,
  ParentUpdateInput,
  Performance,
  Result,
  ResultCreateInput,
  ResultUpdateInput,
  ScheduleEntry,
  SchoolClass,
  SchoolEvent,
  Student,
  StudentCreateInput,
  StudentUpdateInput,
  Subject,
  SubjectCreateInput,
  SubjectUpdateInput,
  Teacher,
  TeacherCreateInput,
  TeacherUpdateInput,
  EventCreateInput,
  EventUpdateInput,
  WeeklyAttendance,
} from "@/types/school";

// -------------------------------------------------------------- CRUD services

export const studentService = createCrudService<
  Student,
  StudentCreateInput,
  StudentUpdateInput
>({ endpoints: studentEndpoints, label: "student", idParam: "studentId" });

export const teacherService = createCrudService<
  Teacher,
  TeacherCreateInput,
  TeacherUpdateInput
>({ endpoints: teacherEndpoints, label: "teacher", idParam: "teacherId" });

export const parentService = createCrudService<
  Parent,
  ParentCreateInput,
  ParentUpdateInput
>({ endpoints: parentEndpoints, label: "parent", idParam: "parentId" });

export const classService = createCrudService<
  SchoolClass,
  ClassCreateInput,
  ClassUpdateInput
>({ endpoints: classEndpoints, label: "class", idParam: "classId" });

export const subjectService = createCrudService<
  Subject,
  SubjectCreateInput,
  SubjectUpdateInput
>({ endpoints: subjectEndpoints, label: "subject", idParam: "subjectId" });

export const lessonService = createCrudService<
  Lesson,
  LessonCreateInput,
  LessonUpdateInput
>({ endpoints: lessonEndpoints, label: "lesson", idParam: "lessonId" });

export const examService = createCrudService<Exam, ExamCreateInput, ExamUpdateInput>({
  endpoints: examEndpoints,
  label: "exam",
  idParam: "examId",
});

export const assignmentService = createCrudService<
  Assignment,
  AssignmentCreateInput,
  AssignmentUpdateInput
>({ endpoints: assignmentEndpoints, label: "assignment", idParam: "assignmentId" });

export const resultService = createCrudService<
  Result,
  ResultCreateInput,
  ResultUpdateInput
>({ endpoints: resultEndpoints, label: "result", idParam: "resultId" });

export const eventService = createCrudService<
  SchoolEvent,
  EventCreateInput,
  EventUpdateInput
>({ endpoints: eventEndpoints, label: "event", idParam: "eventId" });

export const announcementService = createCrudService<
  Announcement,
  AnnouncementCreateInput,
  AnnouncementUpdateInput
>({
  endpoints: announcementEndpoints,
  label: "announcement",
  idParam: "announcementId",
});

export const attendanceService = createCrudService<
  Attendance,
  AttendanceCreateInput,
  AttendanceUpdateInput
>({ endpoints: attendanceEndpoints, label: "attendance record", idParam: "attendanceId" });

// -------------------------------------------------------------------- messages

/**
 * Messages are not full CRUD — there is no update route, and the create route
 * is `SendMessage` rather than `AddMessage`.
 */
export const messageService = {
  list: (query: ListQuery = {}) =>
    getList<Message>(messageEndpoints.list(), query, "Failed to load messages."),

  /** Reading a received message marks it read server-side. */
  byId: (messageId: string) =>
    getOne<Message>(
      messageEndpoints.byId(),
      { messageId },
      "Failed to load message."
    ),

  send: (payload: MessageCreateInput) =>
    postOne<Message>(messageEndpoints.send(), payload, "Failed to send message."),

  remove: (messageId: string) =>
    deleteOne<null>(
      messageEndpoints.remove(),
      { messageId },
      "Failed to delete message."
    ),
};

// --------------------------------------------------------------------- lookups

const fetchLookup = (url: string, label: string) =>
  getOne<Lookup[]>(url, {}, `Failed to load ${label}.`).then((rows) => rows ?? []);

export const lookupService = {
  subjects: () => fetchLookup(lookupEndpoints.subjects(), "subjects"),
  classes: () => fetchLookup(lookupEndpoints.classes(), "classes"),
  grades: () => fetchLookup(lookupEndpoints.grades(), "grades"),
  teachers: () => fetchLookup(lookupEndpoints.teachers(), "teachers"),
  parents: () => fetchLookup(lookupEndpoints.parents(), "parents"),
};

/** Names match the `useLookup` hook's `source` argument. */
export type LookupSource = keyof typeof lookupService;

// ------------------------------------------------------------------- dashboard

export const dashboardService = {
  summary: () =>
    getOne<DashboardSummary>(
      dashboardEndpoints.summary(),
      {},
      "Failed to load dashboard totals."
    ),

  genderCount: () =>
    getOne<GenderCount>(
      dashboardEndpoints.genderCount(),
      {},
      "Failed to load student gender split."
    ),

  weeklyAttendance: (weekOf?: string) =>
    getOne<WeeklyAttendance[]>(
      dashboardEndpoints.weeklyAttendance(),
      { weekOf },
      "Failed to load weekly attendance."
    ).then((rows) => rows ?? []),

  schedule: (filters: {
    classId?: string;
    teacherId?: string;
    studentId?: string;
    weekOf?: string;
  }) =>
    getOne<ScheduleEntry[]>(
      dashboardEndpoints.schedule(),
      filters,
      "Failed to load the schedule."
    ).then((rows) => rows ?? []),

  performance: (filters: { studentId?: string; teacherId?: string }) =>
    getOne<Performance>(
      dashboardEndpoints.performance(),
      filters,
      "Failed to load performance."
    ),

  calendarEvents: (date?: string) =>
    getOne<SchoolEvent[]>(
      dashboardEndpoints.calendarEvents(),
      { date },
      "Failed to load events."
    ).then((rows) => rows ?? []),

  latestAnnouncements: (take = 3) =>
    getOne<Announcement[]>(
      dashboardEndpoints.latestAnnouncements(),
      { take },
      "Failed to load announcements."
    ).then((rows) => rows ?? []),
};

// -------------------------------------------------------------- module registry

/** Table names FormModal accepts. */
export type ModuleName =
  | "student"
  | "teacher"
  | "parent"
  | "class"
  | "subject"
  | "lesson"
  | "exam"
  | "assignment"
  | "result"
  | "event"
  | "announcement"
  | "attendance";

/**
 * Lets generic UI delete a record of any module by name.
 * Typed loosely on purpose — callers only ever need `remove` here, and the
 * per-module payload types are enforced at the form layer.
 */
export const moduleServices: Record<ModuleName, CrudService<any, any, any>> = {
  student: studentService,
  teacher: teacherService,
  parent: parentService,
  class: classService,
  subject: subjectService,
  lesson: lessonService,
  exam: examService,
  assignment: assignmentService,
  result: resultService,
  event: eventService,
  announcement: announcementService,
  attendance: attendanceService,
};
