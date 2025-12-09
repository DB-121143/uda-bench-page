import { memo, useMemo } from "react";

export type RowData = Record<string, unknown>;

interface PlainSourceTableProps {
  data: RowData[];
  datasetKey?: string;
  tableName?: string;
  onPrevTable?: () => void;
  onNextTable?: () => void;
}

/**
 * 与 HoverSourceTable 调用方式保持一致的纯表格版本：
 * - props: data / datasetKey / tableName / onPrevTable / onNextTable
 * - 不展示 source tooltip，且默认过滤 *_source 列
 */
const PlainSourceTable = ({
  data,
  datasetKey = "default",
  tableName,
  onPrevTable,
  onNextTable,
}: PlainSourceTableProps) => {
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [] as string[];
    const allKeys = Object.keys(data[0] ?? {});
    return allKeys.filter((key) => !key.endsWith("_source"));
  }, [data]);

  const viewKey = `${datasetKey}-${tableName ?? "default"}-${data.length}`;

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-8 text-center text-xs text-slate-500">
        No data available.
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur shadow-xl" key={viewKey}>
      <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-slate-900">Attribute Table</h2>
          <p className="mt-0.5 text-xs text-slate-500">Showing part of the ground truth tables.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          {onPrevTable && (
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 shadow-sm transition hover:bg-slate-50"
              onClick={onPrevTable}
            >
              ◀
            </button>
          )}
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-sm font-semibold text-slate-800">
            {tableName || "Table"}
          </div>
          {onNextTable && (
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 shadow-sm transition hover:bg-slate-50"
              onClick={onNextTable}
            >
              ▶
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-[12px]">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((col, idx) => (
                <th
                  key={col}
                  className={[
                    "border-b border-slate-200 px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500",
                    idx === 0 ? "rounded-tl-2xl" : "",
                    idx === columns.length - 1 ? "rounded-tr-2xl" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition-colors hover:bg-slate-50">
                {columns.map((col) => {
                  const value = (row as RowData)[col];
                  const displayValue = value === null || value === undefined ? "" : String(value);
                  return (
                    <td key={col} className="border-t border-slate-200 px-4 py-2 align-top">
                      <span className="clamp-3 text-[12px] font-medium text-slate-900">{displayValue}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(PlainSourceTable);
