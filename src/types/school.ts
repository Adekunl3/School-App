// Shapes returned by the PowerAPI school module.
// Mirrors the DTOs in PowerAPI.Data/ViewModels/School*Dtos.cs

/** PowerAPI's `metadata` block on every list response. */
export interface PaginationMetadata {
  currentPage: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/** Id/name pair from the GetXList lookup endpoints, for select inputs. */
export interface Lookup {
  id: string;
  name: string;
  /** Secondary line, e.g. a class's grade or a parent's phone. */
  description: string | null;
}

/** Fields every school record carries. */
interface AuditFields {
  active: boolean;
  branchCode?: string | null;
  enteredDate: string | null;
  modifiedDate: string | null;
}

// ------------------------------------------------------------------ students

/** Lightweight parent/guardian summary attached to a single student. */
export interface GuardianSummary {
  id: string;
  name: string;
  phone: string | null;
  photo: string | null;
  email: string | null;
  relationship: string | null;
}

export interface Student extends AuditFields {
  /** Same value as studentId — the API sends both so rows have a stable key. */
  id: string;
  studentId: string;
  /** Full name composed server-side. */
  name: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  email: string | null;
  phone: string | null;
  photo: string | null;
  address: string | null;
  grade: number | null;
  /** Class code, e.g. "1B". */
  class: string | null;
  sex: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  admissionDate: string | null;
  parentId: string | null;
  /** Only populated by GetStudentById — null on list responses. */
  parent: GuardianSummary | null;
}

export interface StudentCreateInput {
  /** Omit to let the server allocate the next admission number. */
  studentId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  photo?: string;
  grade?: number | null;
  classId?: string;
  address?: string;
  sex?: string;
  dateOfBirth?: string | null;
  bloodType?: string;
  admissionDate?: string | null;
  parentId?: string;
  branchCode?: string;
}

/** Every field but `studentId` is optional — omitted fields are left as-is. */
export interface StudentUpdateInput extends Partial<StudentCreateInput> {
  studentId: string;
  active?: boolean;
}

// ------------------------------------------------------------------ teachers

export interface Teacher extends AuditFields {
  id: string;
  teacherId: string;
  username: string | null;
  name: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  email: string | null;
  phone: string | null;
  photo: string | null;
  address: string | null;
  sex: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  hireDate: string | null;
  /** Alias of enteredDate — the list's "Joined" column. */
  createdAt: string | null;
}

export interface TeacherCreateInput {
  /** Omit to let the server allocate the next staff number. */
  teacherId?: string;
  username?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  photo?: string;
  address?: string;
  sex?: string;
  dateOfBirth?: string | null;
  bloodType?: string;
  hireDate?: string | null;
  branchCode?: string;
}

export interface TeacherUpdateInput extends Partial<TeacherCreateInput> {
  teacherId: string;
  active?: boolean;
}

// ------------------------------------------------------------------- parents

export interface Parent extends AuditFields {
  id: string;
  parentId: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  photo: string | null;
  address: string | null;
  relationship: string | null;
  /** Children's names, resolved server-side. */
  students: string[];
  studentIds: string[];
}

export interface ParentCreateInput {
  parentId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  photo?: string;
  address?: string;
  relationship?: string;
  branchCode?: string;
}

export interface ParentUpdateInput extends Partial<ParentCreateInput> {
  parentId: string;
  active?: boolean;
}

// ------------------------------------------------------------------- classes

export interface SchoolClass extends AuditFields {
  id: string;
  classId: string;
  name: string;
  capacity: number | null;
  grade: number | null;
  supervisorId: string | null;
  /** Form teacher's name, or null when unassigned. */
  supervisor: string | null;
  enrolledCount: number;
}

export interface ClassCreateInput {
  /** Required — the class code, e.g. "1B". */
  classId: string;
  name?: string;
  capacity?: number | null;
  grade?: number | null;
  supervisorId?: string;
  branchCode?: string;
}

export interface ClassUpdateInput extends Partial<ClassCreateInput> {
  classId: string;
  active?: boolean;
}

// ------------------------------------------------------------------ subjects

export interface Subject extends AuditFields {
  id: string;
  subjectId: string;
  name: string;
  /** Assigned teachers' names. */
  teachers: string[];
  teacherIds: string[];
}

export interface SubjectCreateInput {
  /** Required — the subject code, e.g. "MTH". */
  subjectId: string;
  name: string;
  teacherIds?: string[];
  branchCode?: string;
}

/**
 * `teacherIds` is tri-state: omit to leave assignments alone, pass `[]` to
 * clear them, pass a list to replace them.
 */
export interface SubjectUpdateInput extends Partial<SubjectCreateInput> {
  subjectId: string;
  active?: boolean;
}

// ------------------------------------------------------------------- lessons

/** Fields shared by the records that hang off a subject, class and teacher. */
interface AcademicRefs {
  subjectId: string | null;
  /** Resolved subject name. */
  subject: string | null;
  classId: string | null;
  class: string | null;
  teacherId: string | null;
  teacher: string | null;
}

export interface Lesson extends AuditFields, AcademicRefs {
  id: string;
  lessonId: string;
  name: string | null;
  /** 0 = Sunday through 6 = Saturday. */
  dayOfWeek: number | null;
  /** "HH:mm". */
  startTime: string | null;
  endTime: string | null;
}

export interface LessonCreateInput {
  lessonId?: string;
  name?: string;
  subjectId: string;
  classId: string;
  teacherId?: string;
  dayOfWeek?: number | null;
  /** "HH:mm". */
  startTime?: string;
  endTime?: string;
  branchCode?: string;
}

export interface LessonUpdateInput extends Partial<LessonCreateInput> {
  lessonId: string;
  active?: boolean;
}

// --------------------------------------------------------------------- exams

export interface Exam extends AuditFields, AcademicRefs {
  id: string;
  examId: string;
  title: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  maxScore: number | null;
}

export interface ExamCreateInput {
  examId?: string;
  title?: string;
  subjectId: string;
  classId: string;
  teacherId?: string;
  examDate?: string | null;
  startTime?: string;
  endTime?: string;
  maxScore?: number | null;
  branchCode?: string;
}

export interface ExamUpdateInput extends Partial<ExamCreateInput> {
  examId: string;
  active?: boolean;
}

// --------------------------------------------------------------- assignments

export interface Assignment extends AuditFields, AcademicRefs {
  id: string;
  assignmentId: string;
  title: string | null;
  description: string | null;
  startDate: string | null;
  dueDate: string | null;
  maxScore: number | null;
}

export interface AssignmentCreateInput {
  assignmentId?: string;
  title: string;
  description?: string;
  subjectId: string;
  classId: string;
  teacherId?: string;
  startDate?: string | null;
  dueDate?: string | null;
  maxScore?: number | null;
  branchCode?: string;
}

export interface AssignmentUpdateInput extends Partial<AssignmentCreateInput> {
  assignmentId: string;
  active?: boolean;
}

// ------------------------------------------------------------------- results

export type ResultType = "exam" | "assignment";

export interface Result extends AcademicRefs {
  id: string;
  resultId: string;
  studentId: string | null;
  /** Resolved student name. */
  student: string | null;
  type: ResultType | string | null;
  examId: string | null;
  assignmentId: string | null;
  date: string | null;
  score: number | null;
  maxScore: number | null;
  /** Score as a percentage of maxScore, computed server-side. */
  percentage: number | null;
  remark: string | null;
  enteredDate: string | null;
  modifiedDate: string | null;
}

/**
 * Subject, class, teacher and maxScore are inherited from the exam or
 * assignment, so they are deliberately not part of the payload.
 */
export interface ResultCreateInput {
  resultId?: string;
  studentId: string;
  resultType: ResultType;
  examId?: string;
  assignmentId?: string;
  resultDate?: string | null;
  score: number;
  remark?: string;
  branchCode?: string;
}

/** Only the mark, date and remark are editable. */
export interface ResultUpdateInput {
  resultId: string;
  resultDate?: string | null;
  score?: number;
  remark?: string;
}

// -------------------------------------------------------------------- events

export interface SchoolEvent extends AuditFields {
  id: string;
  eventId: string;
  title: string | null;
  description: string | null;
  classId: string | null;
  /** Class code, or "All" when school-wide. */
  class: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  /** Pre-formatted "10:00 - 11:00". */
  time: string | null;
}

export interface EventCreateInput {
  eventId?: string;
  title: string;
  description?: string;
  /** Omit for a school-wide event. */
  classId?: string;
  eventDate?: string | null;
  startTime?: string;
  endTime?: string;
  branchCode?: string;
}

export interface EventUpdateInput extends Partial<EventCreateInput> {
  eventId: string;
  active?: boolean;
}

// ------------------------------------------------------------- announcements

export interface Announcement extends AuditFields {
  id: string;
  announcementId: string;
  title: string | null;
  description: string | null;
  classId: string | null;
  class: string | null;
  date: string | null;
}

export interface AnnouncementCreateInput {
  announcementId?: string;
  title: string;
  description?: string;
  classId?: string;
  announcementDate?: string | null;
  branchCode?: string;
}

export interface AnnouncementUpdateInput extends Partial<AnnouncementCreateInput> {
  announcementId: string;
  active?: boolean;
}

// ---------------------------------------------------------------- attendance

export interface Attendance {
  id: string;
  attendanceId: string;
  studentId: string | null;
  student: string | null;
  classId: string | null;
  class: string | null;
  lessonId: string | null;
  date: string;
  present: boolean;
  late: boolean;
  /** "Present", "Late" or "Absent", derived server-side. */
  status: string | null;
  remark: string | null;
  enteredDate: string | null;
  modifiedDate: string | null;
}

export interface AttendanceCreateInput {
  attendanceId?: string;
  studentId: string;
  /** Omit to default to the student's current class. */
  classId?: string;
  lessonId?: string;
  attendanceDate?: string | null;
  present: boolean;
  late: boolean;
  remark?: string;
  branchCode?: string;
}

export interface AttendanceUpdateInput {
  attendanceId: string;
  attendanceDate?: string | null;
  present?: boolean;
  late?: boolean;
  remark?: string;
}

// ------------------------------------------------------------------ messages

export interface Message {
  id: string;
  messageId: string;
  senderUsername: string | null;
  recipientUsername: string | null;
  subject: string | null;
  body: string | null;
  sentDate: string | null;
  readDate: string | null;
  isRead: boolean;
  /** True when the current user sent it. */
  isOutgoing: boolean;
}

export interface MessageCreateInput {
  recipientUsername: string;
  subject?: string;
  body: string;
}

// ----------------------------------------------------------------- dashboard

export interface DashboardSummary {
  students: number;
  teachers: number;
  parents: number;
  classes: number;
  subjects: number;
}

export interface GenderCount {
  total: number;
  boys: number;
  girls: number;
  unspecified: number;
}

export interface WeeklyAttendance {
  /** Short day name, e.g. "Mon". */
  name: string;
  present: number;
  absent: number;
}

export interface ScheduleEntry {
  title: string;
  allDay: boolean;
  /** ISO timestamp. */
  start: string;
  end: string;
}

export interface PerformanceBreakdown {
  subjectId: string | null;
  subject: string | null;
  score: number;
  resultCount: number;
}

export interface Performance {
  score: number;
  max: number;
  resultCount: number;
  breakdown: PerformanceBreakdown[];
}
