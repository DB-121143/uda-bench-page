// src/components/DatasetSelector.tsx
import { useState, type MouseEvent, type KeyboardEvent, type ReactNode } from "react";

export type DatasetOption<T extends string = string> = {
  id: T;
  label: string;
  icon?: ReactNode;
};

type DatasetSelectorProps<T extends string = string> = {
  value: T;
  options: DatasetOption<T>[];
  onChange: (value: T) => void;
};

const DatasetSelector = <T extends string>({
  value,
  options,
  onChange,
}: DatasetSelectorProps<T>) => {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.id === value) ?? options[0];

  const handleOptionMouseDown = (e: MouseEvent<HTMLButtonElement>, id: T) => {
    // 防止 blur 提前把菜单关掉
    e.preventDefault();
    onChange(id);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      className="relative inline-flex w-44" // ✅ 收窄整体宽度
      tabIndex={0}
      onBlur={() => {
        window.setTimeout(() => setOpen(false), 80);
      }}
      onKeyDown={handleKeyDown}
    >
      {/* 本体按钮：占满容器宽度 */}
      <button
        type="button"
        className="inline-flex w-full items-center rounded-2xl border border-slate-200 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm hover:border-slate-300"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="mr-2 inline-flex h-8 w-8 items-center justify-center text-xs font-semibold text-slate-700">
          {selected?.icon ? selected.icon : <span className="text-[10px]">DS</span>}
        </span>
        <span className="mx-1 flex-1 truncate text-xs md:text-sm font-medium text-slate-700">
          {selected?.label}
        </span>
        <span className="ml-1 flex items-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className={`h-3 w-3 text-slate-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            <path
              fill="currentColor"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.1 1.02l-4.25 4.5a.75.75 0 0 1-1.1 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            />
          </svg>
        </span>
      </button>

      {/* 自绘下拉浮层：宽度与按钮一致 */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white/95 py-1 shadow-2xl backdrop-blur-md">
          <div className="px-3 pb-1 pt-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Datasets
            </p>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {options.map((opt) => {
              const isActive = opt.id === value;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onMouseDown={(e) => handleOptionMouseDown(e, opt.id)}
                  className={[
                    "flex w-full items-center justify-between border-l-2 px-3 py-1.5 text-left text-xs md:text-sm transition-colors",
                    isActive
                      ? "border-sky-500 bg-sky-50 text-sky-900"
                      : "border-transparent text-slate-600 hover:border-sky-200 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="inline-flex h-6 w-6 items-center justify-center text-slate-600">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isActive && (
                    <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-xs font-semibold text-white">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetSelector;
