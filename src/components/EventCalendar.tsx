"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useAsync } from "@/hooks/useAsync";
import { dashboardService } from "@/services/school";
import type { SchoolEvent } from "@/types/school";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

/** yyyy-MM-dd in the viewer's timezone — the API compares on date only. */
const toDateParam = (date: Date): string => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
};

/** react-calendar hands back a range when in range mode; take the start. */
const firstDate = (value: Value): Date =>
  Array.isArray(value) ? value[0] ?? new Date() : value ?? new Date();

const EventCalendar = () => {
  const [value, onChange] = useState<Value>(new Date());

  const selected = useMemo(() => firstDate(value), [value]);
  const dateParam = toDateParam(selected);

  const { data, loading, error } = useAsync<SchoolEvent[]>(
    useCallback(() => dashboardService.calendarEvents(dateParam), [dateParam]),
    [dateParam]
  );

  const events = data ?? [];

  return (
    <div className="bg-white p-4 rounded-md dark:bg-gray-900 dark:text-white">
      <Calendar onChange={onChange} value={value} className="dark:react-calendar" />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold my-4">Events</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>

      <p className="text-xs text-gray-400 mb-2">
        {selected.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>

      <div className="flex flex-col gap-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading events...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error.message}</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-500">No events on this day.</p>
        ) : (
          events.map((event) => (
            <div
              className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple dark:border-gray-700"
              key={event.id}
            >
              <div className="flex items-center justify-between gap-2">
                <h1 className="font-semibold text-gray-600 dark:text-gray-300">
                  {event.title}
                </h1>
                {/* The API pre-formats this as "10:00 - 11:00". */}
                <span className="text-gray-400 text-xs shrink-0">
                  {event.time || "All day"}
                </span>
              </div>
              {event.description && (
                <p className="mt-2 text-gray-400 text-sm dark:text-gray-400">
                  {event.description}
                </p>
              )}
              {event.class && event.class !== "All" && (
                <p className="mt-1 text-xs text-gray-400">Class {event.class}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventCalendar;
