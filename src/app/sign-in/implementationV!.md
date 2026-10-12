# PowerAPI + Frontend Sweep — Claude Code Implementation Spec

## Context

You asked for a single document that Claude Code can read and use as an implementation plan. This doc is organized as:

1. Auth (existing backend endpoints + frontend wiring gaps)
2. School-domain API surface to build (modules, routes, list query contract)
3. Dashboard aggregates
4. Form lookup endpoints
5. Account self-service
6. Open decisions

---

## 1) Auth (backend exists — wiring only)

### 1.1 Canonical login endpoint to adopt

**Endpoint:** `POST api/Login/{token}`

- `{token}` is a **license/tenant token** (NOT a JWT).
- It resolves company/division/department **before** Identity lookup.
- Therefore it must be present on every route.

**Source:** `AccountController.cs:113–250`

#### Route

`POST {base}/Login/{token}`

Example:

```
```

#### Body (`LoginDto`)

```json
{
  "username": "string",
  "password": "string"
}
```

#### Success response (200)

```json
{
  "statusCode": 200,
  "message": "string",
  "data": {
    "userId": "string",
    "userName": "string",
    "location": {
      "company": "string",
      "division": "string",
      "department": "string",
      "branch": "string"
    },
    "accType": ["user"],
    "warehouses": []
  },
  "jwtToken": "string",
  "expiration": "string",
  "refreshToken": "string"
}
```

#### Failure response (401)

```json
{
  "statusCode": 401,
  "status": "Failed",
  "message": "Invalid Token" 
           | "Incorrect Username and/or Password." 
           | "Enter A Valid Username"
}
```

---

### 1.2 Frontend gaps vs the login/refresh contract

#### A) Endpoints mapping

**Where now:** `apiEndPoints.ts:27`

- currently: `login: "/Auth/login"`

**Should be:**

- `login: (t) =>` /Login/${t}``

#### B) Token parsing + storage

**Where now:** `sign-in/page.tsx:81–85`

- reads `response.data.token`
- stores it as **both** access and refresh token

**Should be:**

- read `data.jwtToken` for access token
- read `data.refreshToken` for refresh token
- treat them as two distinct values

#### C) Refresh flow

**Where now:** `api.ts:36`

- calls `POST /Login/RefreshToken` with `{ refreshToken }`

**Should be:**
`POST api/Refresh/{token}` with body (`RefreshTokenDto`):

```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

Expected response:

```json
{
  "jwtToken": "string",
  "expiration": "string",
  "refreshToken": "string"
}
```

#### D) Environment token

**Where now:** `.env:3`

- `NEXT_PUBLIC_API_TOKEN` commented out

**Should be:**

- must be set, because every route requires `{token}`

#### E) User parsing

**Where now:** `userUtils.ts:113` (`parseUserData`)

- reads `apiResponse.email`

**Issue:** response has no `email`

**Should be:** use:

- `data.userName`
- `data.accType`

---

### 1.3 Auth endpoints that already exist (no backend work)

Wire the frontend to these existing endpoints:

- `GET api/Auth/{token}` (license check)
- `POST api/Refresh/{token}`
- `DELETE api/Logout/{token}`
- `GET api/account/location/{token}`
- `POST api/account/location/switch/{token}`
- `POST api/account/location/home/{token}`

---

## 2) School-domain endpoints to build (none exist)

I checked all **57 controllers** in `PowerAPI/Controllers/`.

- There is **no school-domain controller**.
- Every list page except **Teachers** still reads mock arrays from `src/lib/data.ts`.

Conventions to follow (match existing PowerAPI style):

- Naming: `api/GetX/{token}`, `api/AddX/{token}`, etc.
- Query binding: `FilterRequest` (for list endpoints)
- Envelope shape: `{ status, code, message, metadata, data }`

---

### 2.1 List endpoint query contract (applies to ALL list endpoints)

All list routes must accept (as query params):

```
?Pagination.Page=
&Pagination.ItemsPerPage=
&SearchParams.SearchTerm=
&SortProperty=
&SortDirection=
&Filters=
```

Frontend evidence:

- `Pagination.tsx` and `TableSearch.tsx` are rendered on every list page but currently inert.
- `countService.ts:11` already expects `metadata.totalCount`.

**Implementation requirement:** ensure list responses include `metadata.totalCount`.

---

### 2.2 Core CRUD modules (11 modules × 5 routes)

Each module needs:

- `GET api/GetX/{token}`
- `GET api/GetXById/{token}`
- `POST api/AddX/{token}`
- `PUT api/UpdateX/{token}`
- `DELETE api/DeleteX/{token}`

Consumed by: `src/app/(dashboard)/list/*` and `FormModal.tsx`.

#### Teachers

Routes:

- `GET api/GetTeachers/{token}`
- `GET api/GetTeacherById/{token}`
- `POST api/AddTeacher/{token}`
- `PUT api/UpdateTeacher/{token}`
- `DELETE api/DeleteTeacher/{token}`

Additional query endpoints (for “teachers by subject/class” screens & filters):

- `GET api/GetTeachersBySubject/{token}?subjectId=`
- `GET api/GetTeachersByClass/{token}?classId=`

UI fields:

- list: `id, username, email, firstName, lastName, createdAt`
- detail adds: `phone, address, bloodType, dateOfBirth, sex, img, subjects[], classes[]`

#### Students

Routes:

- `GET api/GetStudents/{token}`
- `GET api/GetStudentById/{token}`
- `POST api/AddStudent/{token}`
- `PUT api/UpdateStudent/{token}`
- `DELETE api/DeleteStudent/{token}`

UI fields:

- `id, studentId, name, email, photo, phone, grade, class, address`

Required on student detail view (Nigeria primary/secondary context):

- `dateOfAdmission` (or `admissionDate`) — show in UI
- Parent/guardian details when clicking a student:
    - return a nested `parent`/`guardian` summary object (preferred for UX) with:
        - `id`
        - `name`
        - `phone`
        - `photo` (URL) / `img`
    - optionally include more fields if available (email/address), but keep the nested object lightweight
    - also return `parentId` (or `guardianId`) so the UI can call `GetParentById` for the full record when needed

#### Parents

Routes:

- `GET api/GetParents/{token}`
- `GET api/GetParentById/{token}`
- `POST api/AddParent/{token}`
- `PUT api/UpdateParent/{token}`
- `DELETE api/DeleteParent/{token}`

UI fields:

- `id, name, students[], email, phone, address`

#### Subjects

Routes:

- `GET api/GetSubjects/{token}`
- `GET api/GetSubjectById/{token}`
- `POST api/AddSubject/{token}`
- `PUT api/UpdateSubject/{token}`
- `DELETE api/DeleteSubject/{token}`

UI fields:

- `id, name, teachers[]`

#### Classes

Routes:

- `GET api/GetClasses/{token}`
- `GET api/GetClassById/{token}`
- `POST api/AddClass/{token}`
- `PUT api/UpdateClass/{token}`
- `DELETE api/DeleteClass/{token}`

UI fields:

- `id, name, capacity, grade, supervisor`

#### Lessons

Routes:

- `GET api/GetLessons/{token}`
- `GET api/GetLessonById/{token}`
- `POST api/AddLesson/{token}`
- `PUT api/UpdateLesson/{token}`
- `DELETE api/DeleteLesson/{token}`

UI fields:

- `id, subject, class, teacher`

#### Exams

Routes:

- `GET api/GetExams/{token}`
- `GET api/GetExamById/{token}`
- `POST api/AddExam/{token}`
- `PUT api/UpdateExam/{token}`
- `DELETE api/DeleteExam/{token}`

UI fields:

- `id, subject, class, teacher, date`

#### Assignments

Routes:

- `GET api/GetAssignments/{token}`
- `GET api/GetAssignmentById/{token}`
- `POST api/AddAssignment/{token}`
- `PUT api/UpdateAssignment/{token}`
- `DELETE api/DeleteAssignment/{token}`

UI fields:

- `id, subject, class, teacher, dueDate`

#### Results

Routes:

- `GET api/GetResults/{token}`
- `GET api/GetResultById/{token}`
- `POST api/AddResult/{token}`
- `PUT api/UpdateResult/{token}`
- `DELETE api/DeleteResult/{token}`

UI fields:

- `id, subject, class, teacher, student, date, type ("exam"|"assignment"), score`

#### Events

Routes:

- `GET api/GetEvents/{token}`
- `GET api/GetEventById/{token}`
- `POST api/AddEvent/{token}`
- `PUT api/UpdateEvent/{token}`
- `DELETE api/DeleteEvent/{token}`

UI fields:

- `id, title, class, date, startTime, endTime, description`

#### Announcements

Routes:

- `GET api/GetAnnouncements/{token}`
- `GET api/GetAnnouncementById/{token}`
- `POST api/AddAnnouncement/{token}`
- `PUT api/UpdateAnnouncement/{token}`
- `DELETE api/DeleteAnnouncement/{token}`

UI fields:

- `id, title, class, date, description`

---

### 2.3 Modules with a menu entry but no page yet

Menu.tsx:66–88 links to these.
Pages don’t exist yet, so build the API alongside them.

#### Attendance (student attendance)

Routes:

- `GET api/GetAttendance/{token}`
- `GET api/GetAttendanceById/{token}`
- `POST api/AddAttendance/{token}`
- `PUT api/UpdateAttendance/{token}`
- `DELETE api/DeleteAttendance/{token}`

Important note:

- An `AttendanceController` exists, but it is **HR employee attendance** (payroll-facing).
- Do **not** reuse it for student attendance.

#### Messages

Routes:

- `GET api/GetMessages/{token}`
- `GET api/GetMessageById/{token}`
- `POST api/SendMessage/{token}`
- `DELETE api/DeleteMessage/{token}`

---

## 3) Dashboard aggregates (required to remove hardcoded arrays)

These back `admin/page.tsx`.
Currently each chart component has hardcoded arrays.

### Endpoints

#### `GET api/GetDashboardSummary/{token}`

Feeds: `UserCard` ×4
Returns:

```json
{ "students": 0, "teachers": 0, "parents": 0, "staff": 0 }
```

Goal: one call, not four list fetches.

#### `GET api/GetStudentGenderCount/{token}`

Feeds: `CountChart:10`
Returns:

```json
{ "total": 0, "boys": 0, "girls": 0 }
```

#### `GET api/GetWeeklyAttendance/{token}`

Feeds: `AttendanceChart:15`
Returns:

```json
[
  { "name": "Mon", "present": 0, "absent": 0 }
]
```

#### `GET api/GetFinanceSummary/{token}`

Feeds: `FinanceChart:15`
Returns:

```json
[
  { "name": "Jan", "income": 0, "expense": 0 }
]
```

#### `GET api/GetCalendarEvents/{token}?date=`

Feeds: `EventCalendar:13`
Returns:

```json
[
  { "id": "string", "title": "string", "time": "string", "description": "string" }
]
```

#### `GET api/GetSchedule/{token}?classId=&teacherId=&studentId=`

Feeds: `BigCalender.tsx` (teacher/student/parent pages)
Returns:

```json
[
  { "title": "string", "allDay": false, "start": "string", "end": "string" }
]
```

#### `GET api/GetPerformance/{token}?studentId=&teacherId=`

Feeds: `Performance.tsx:5`
Returns:

```json
{ "score": 0, "max": 0, "breakdown": [] }
```

---

## 4) Lookups for create/update forms

TeacherForm, StudentForm, ParentForm need these select-input sources:

- `GET api/GetSubjectList/{token}` — id/name pairs for teacher-subject assignment
- `GET api/GetClassList/{token}` — id/name pairs for student class and lesson assignment
- `GET api/GetGradeList/{token}` — grade levels
- `GET api/GetTeacherList/{token}` — class supervisor and lesson teacher pickers
- `GET api/GetParentList/{token}` — linking a student to a parent

---

## 5) Account self-service

Menu.tsx:95–105 links to `/profile` and `/settings`.
`sign-in/page.tsx:193` has “Forgot password?” link.

Endpoints:

- `GET api/GetMyProfile/{token}`
- `PUT api/UpdateMyProfile/{token}`
- `POST api/ChangePassword/{token}` — `ChangePasswordEmp` exists on `EmployeeController` (may be reusable)
- `POST api/ForgotPassword/{token}`
- `POST api/ResetPassword/{token}`

---

## 6) Totals + scope summary

- **Auth endpoints already built (wiring only):** 5
- **School-domain endpoints to build:** 65 total
    - 55 CRUD across 11 modules
    - 9 attendance/messages
    - 7 dashboard aggregates
    - 5 lookups
    - 5 account

---

## 7) Open decisions (confirm before implementing)

1. Student attendance controller naming:
    - Recommendation: new `SchoolAttendanceController`.
    - Reason: existing `AttendanceController` is HR/payroll-facing.
2. Dashboard summary aggregation:
    - Decide whether `GetDashboardSummary` returns a single aggregate payload (recommended)
    - Or frontend keeps fanning out to list endpoints for counts (not recommended)