"use client";

import { useCallback, useMemo, useState } from "react";
import moment from "moment";
import { Calendar, momentLocalizer, Views, type View } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useAsync } from "@/hooks/useAsync";
import { dashboardService } from "@/services/school";
import type { ScheduleEntry } from "@/types/school";

const localizer = momentLocalizer(moment);

/** react-big-calendar wants Date objects, not the API's ISO strings. */
interface CalendarEvent {
  title: string;
  allDay: boolean;
  start: Date;
  end: Date;
}

/**
 * Timetable for a class, teacher or student.
 *
 * Lessons are stored as weekly recurrences, so the API projects them onto real
 * dates for whichever week is requested.
 */
const BigCalendar = ({
  classId,
  teacherId,
  studentId,
}: {
  classId?: string;
  teacherId?: string;
  studentId?: string;
}) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);

  const { data, loading, error } = useAsync<ScheduleEntry[]>(
    useCallback(
      () => dashboardService.schedule({ classId, teacherId, studentId }),
      [classId, teacherId, studentId]
    ),
    [classId, teacherId, studentId]
  );

  const events = useMemo<CalendarEvent[]>(
    () =>
      (data ?? []).map((entry) => ({
        title: entry.title,
        allDay: entry.allDay,
        start: new Date(entry.start),
        end: new Date(entry.end),
      })),
    [data]
  );

  // Frame the day around the earliest and latest lesson, falling back to a
  // standard school day when there is nothing scheduled. A fixed 8–17 window
  // would hide an early or late lesson entirely.
  const [minTime, maxTime] = useMemo(() => {
    const reference = new Date();
    const dayAt = (hour: number, minute = 0) =>
      new Date(
        reference.getFullYear(),
        reference.getMonth(),
        reference.getDate(),
        hour,
        minute
      );

    if (events.length === 0) return [dayAt(8), dayAt(17)];

    const earliest = Math.min(...events.map((event) => event.start.getHours()));
    const latest = Math.max(...events.map((event) => event.end.getHours()));

    return [dayAt(Math.min(earliest, 8)), dayAt(Math.max(latest + 1, 17))];
  }, [events]);

  if (loading) {
    return <p className="p-4 text-sm text-gray-500">Loading schedule...</p>;
  }

  if (error) {
    return <p className="p-4 text-sm text-red-600">{error.detail}</p>;
  }

  return (
    <>
      {events.length === 0 && (
        <p className="p-4 text-sm text-gray-500">
          No lessons scheduled. Add lessons with a day and time to fill this
          timetable.
        </p>
      )}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["work_week", "day"]}
        view={view}
        style={{ height: "98%" }}
        onView={setView}
        min={minTime}
        max={maxTime}
      />
    </>
  );
};

export default BigCalendar;
