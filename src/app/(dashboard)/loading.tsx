import { Loader } from "@/components/Spinner";

// Shown in place of the page content while a route is loading, so clicking a
// menu item gives instant feedback. The sidebar and navbar stay put.
export default function DashboardLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <Loader label="Loading page..." />
    </div>
  );
}
