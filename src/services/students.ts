// Typed calls against SchoolStudentController.
//
// Thin named wrappers over `studentService` so the student pages and forms keep
// reading as `fetchStudents(...)` rather than `studentService.list(...)`.

import type { ListQuery, ListResult, MutationResult } from "@/lib/apiClient";
import { studentService } from "./school";
import type { Student, StudentCreateInput, StudentUpdateInput } from "@/types/school";

/** GET api/GetStudents/{token} */
export const fetchStudents = (query: ListQuery): Promise<ListResult<Student>> =>
  studentService.list(query);

/** GET api/GetStudentById/{token} — includes the guardian summary. */
export const fetchStudent = (studentId: string): Promise<Student> =>
  studentService.byId(studentId);

/** POST api/AddStudent/{token} */
export const createStudent = (
  payload: StudentCreateInput
): Promise<MutationResult<Student>> => studentService.create(payload);

/** PUT api/UpdateStudent/{token} */
export const updateStudent = (
  payload: StudentUpdateInput
): Promise<MutationResult<Student>> => studentService.update(payload);

/** DELETE api/DeleteStudent/{token} */
export const deleteStudent = (studentId: string): Promise<MutationResult<null>> =>
  studentService.remove(studentId);
