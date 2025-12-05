import { memo } from "react";

const modalityItems = [
  { key: "text", label: "Modality · Text", className: "bg-cyan-50 text-cyan-600 border-cyan-200" },
  { key: "image", label: "Modality · Image", className: "bg-amber-50 text-amber-500 border-amber-200" },
  { key: "table", label: "Modality · Table", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
];

const usageItems = [
  { key: "general", label: "General", className: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  { key: "categorical", label: "Categorical", className: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200" },
  { key: "numerical", label: "Numerical", className: "bg-rose-50 text-rose-600 border-rose-200" },
];

const Legend = () => {
  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white/85 px-5 py-3.5 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-center gap-1 text-[14px] font-semibold text-slate-700 md:flex-nowrap md:justify-between">
        {[...modalityItems, ...usageItems].map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <span
              className={`glossary-icon inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold ${item.className}`}
            >
              {item.key === "text" && (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 6h16" strokeLinecap="round" />
                  <path d="M8 10h12" strokeLinecap="round" />
                  <path d="M4 14h16" strokeLinecap="round" />
                  <path d="M8 18h8" strokeLinecap="round" />
                </svg>
              )}
              {item.key === "image" && (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="5" width="16" height="14" rx="2" ry="2" />
                  <path d="M9 13l2-2 3 3 2-2 3 3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
                </svg>
              )}
              {item.key === "table" && (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="5" width="16" height="14" rx="2" ry="2" />
                  <path d="M4 11h16M10 5v14M16 5v14" strokeLinecap="round" />
                </svg>
              )}
              {item.key === "general" && <span>G</span>}
              {item.key === "categorical" && <span>C</span>}
              {item.key === "numerical" && <span>N</span>}
            </span>
            <span className="text-slate-700 text-[14px]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(Legend);
