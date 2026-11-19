import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="border-b border-[#E5E7EB] pb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3.5"
          >
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-2 h-7 w-12" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-[#E5E7EB] bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#E5E7EB] pt-4">
              <div>
                <Skeleton className="h-3 w-14" />
                <Skeleton className="mt-1.5 h-5 w-8" />
              </div>
              <div>
                <Skeleton className="h-3 w-12" />
                <Skeleton className="mt-1.5 h-5 w-8" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#F3F4F6] pt-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
