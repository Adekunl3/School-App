"use client";

import Link from "next/link";
import { homeRouteFor, useRole } from "@/hooks/useRole";

/** Links to the signed-in user's own dashboard. */
const HomeLink = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  const role = useRole();

  return (
    <Link href={homeRouteFor(role)} className={className}>
      {children}
    </Link>
  );
};

export default HomeLink;
