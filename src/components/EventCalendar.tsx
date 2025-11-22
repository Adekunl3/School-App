"use client";

import Image from "next/image";
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../app/globals.css"; // Ensure global styles are applied

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

// TEMPORARY
const events = [
  {
    id: 1,
    title: "School Assembly",
    time: "8:00 AM - 9:00 AM",
    description: "A gathering of all students and staff for announcements and updates.",
  },
  {
    id: 2,
    title: "Parent-Teacher Meeting",
    time: "10:00 AM - 12:00 PM",
    description: "An opportunity for parents to discuss their child's progress with teachers.",
  },
  {
    id: 3,
    title: "Science Fair",
    time: "1:00 PM - 3:00 PM",
    description: "An exhibition showcasing students' science projects and experiments.",
  },
];

const EventCalendar = () => {
  const [value, onChange] = useState<Value>(new Date());

  return (
    <div className="bg-white p-4 rounded-md dark:bg-gray-900 dark:text-white">
      <Calendar
        onChange={onChange}
        value={value}
        className="dark:react-calendar"
      />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold my-4">Events</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <div className="flex flex-col gap-4">
        {events.map((event) => (
          <div
            className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple dark:border-gray-700"
            key={event.id}
          >
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-gray-600 dark:text-gray-300">
                {event.title}
              </h1>
              <span className="text-gray-300 text-xs dark:bg-red-700 dark:text-white">
                {event.time}
              </span>
            </div>
            <p className="mt-2 text-gray-400 text-sm dark:text-gray-400">
              {event.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventCalendar;
