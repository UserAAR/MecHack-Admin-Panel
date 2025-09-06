import type { JSX, SVGProps } from "react";

type PropsType = {
  label: string;
  data: {
    value: number | string;
    secondaryLabel?: string;
    secondaryValue?: number | string;
  };
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
};

export function OverviewCard({ label, data, Icon }: PropsType) {
  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
      <Icon />

      <div className="mt-6">
        <div className="flex items-end gap-4">
          <div>
            <div className="text-sm font-medium text-dark-6">{label}</div>
            <div className="text-2xl font-bold text-dark dark:text-white">{data.value}</div>
          </div>

          {data.secondaryLabel !== undefined && (
            <div className="text-right">
              <div className="text-sm font-medium text-dark-6">{data.secondaryLabel}</div>
              <div className="text-2xl font-bold text-dark dark:text-white">{data.secondaryValue}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
