import { Cpu, MapPin, Network, Route, Waypoints, type LucideIcon } from "lucide-react";

export type PipelineStage = {
  title: string;
  description: string;
  complete: boolean;
};

const pipelineIcons: LucideIcon[] = [MapPin, Network, Route, Waypoints];

export function PipelineStages({
  pipeline,
  routedCount,
  totalCount,
}: {
  pipeline: PipelineStage[];
  routedCount: number;
  totalCount: number;
}) {
  return (
    <section
      aria-labelledby="vrp-pipeline-title"
      className="overflow-hidden rounded-3xl border border-gray-100 bg-gray-900 p-6 text-white shadow-sm lg:p-8"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-secondary">
            <Cpu size={16} aria-hidden="true" />
            Mesin Optimasi
          </div>
          <h2 id="vrp-pipeline-title" className="mt-2 text-xl font-extrabold">
            Bagaimana VRP menyusun rute
          </h2>
          <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-gray-400">
            Sistem mengubah titik penjemputan menjadi pembagian tugas dan urutan perjalanan
            yang siap divisualisasikan di jalan nyata.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-gray-300">
          {routedCount}/{totalCount} tiket sudah memiliki urutan
        </div>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-4">
        {pipeline.map((stage, index) => {
          const Icon = pipelineIcons[index];
          return (
            <div key={stage.title} className="relative">
              {index < pipeline.length - 1 && (
                <div
                  className={`absolute left-[4.25rem] top-[2.375rem] hidden h-0.5 w-[calc(100%-3rem)] md:block ${
                    stage.complete ? "bg-success/70" : "bg-white/10"
                  }`}
                  aria-hidden="true"
                />
              )}
              <div
                className={`relative rounded-2xl border p-4 ${
                  stage.complete
                    ? "border-success/30 bg-success/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      stage.complete
                        ? "bg-success text-white"
                        : "bg-white/10 text-gray-300"
                    }`}
                  >
                    <Icon size={21} aria-hidden="true" />
                  </div>
                  <span className="text-xs font-black text-gray-500">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-extrabold">{stage.title}</h3>
                <p className="mt-1 text-xs font-medium text-gray-400">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}