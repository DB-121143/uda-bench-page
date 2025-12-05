// src/components/AttributeGlossary.tsx
import { memo, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ModalityType = "text" | "image" | "table";
type UsageType = "general" | "categorical" | "numerical";

type IconDefinition = {
  label: string;
  icon: React.ReactNode;
  className: string;
};

type AttributeMeta = {
  key: string;
  label: string;
  table: string;
  description: string;
  modalities?: ModalityType[];
  usage?: UsageType[];
};

const MODALITY_ICONS: Record<ModalityType, IconDefinition> = {
  text: {
    label: "Text",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6h16" strokeLinecap="round" />
        <path d="M8 10h12" strokeLinecap="round" />
        <path d="M4 14h16" strokeLinecap="round" />
        <path d="M8 18h8" strokeLinecap="round" />
      </svg>
    ),
    className: "bg-cyan-50 text-cyan-600 border-cyan-200",
  },
  image: {
    label: "Image",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="5" width="16" height="14" rx="2" ry="2" />
        <path d="M9 13l2-2 3 3 2-2 3 3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
    className: "bg-amber-50 text-amber-500 border-amber-200",
  },
  table: {
    label: "Table",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="5" width="16" height="14" rx="2" ry="2" />
        <path d="M4 11h16M10 5v14M16 5v14" strokeLinecap="round" />
      </svg>
    ),
    className: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
};

const USAGE_BADGES: Record<UsageType, { label: string; className: string }> = {
  general: {
    label: "G",
    className: "bg-indigo-50 text-indigo-600 border-indigo-200",
  },
  categorical: {
    label: "C",
    className: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200",
  },
  numerical: {
    label: "N",
    className: "bg-rose-50 text-rose-600 border-rose-200",
  },
};

interface AttributeGlossaryProps {
  items: AttributeMeta[];
  /** 用于区分当前所属的数据集，配合动画避免“抖动” */
  datasetKey?: string;
}

const COLLAPSED_COUNT = 4;

const AttributeGlossaryComponent = ({ items, datasetKey = "default" }: AttributeGlossaryProps) => {
  if (!items || items.length === 0) {
    return null;
  }

  const [expanded, setExpanded] = useState(false);
  const canCollapse = items.length > COLLAPSED_COUNT;

  // 切换数据集时：统一先折叠
  useEffect(() => {
    setExpanded(false);
  }, [datasetKey]);

  const visibleItems = expanded ? items : items.slice(0, COLLAPSED_COUNT);

  // 用 datasetKey + expanded 组合成一个“视图状态”的 key
  const viewKey = `${datasetKey}-${expanded ? "expanded" : "collapsed"}`;

  const handleToggle = () => setExpanded((v) => !v);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 px-5 py-5 shadow-xl backdrop-blur">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900">
            Attribute Reference
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Attributes used in our benchmark and their corresponding descriptions.
          </p>
        </div>

        {canCollapse && (
          <div className="flex flex-col items-center">
            {/* 固定宽度按钮 + 文案过渡动画 */}
            <button
              type="button"
              onClick={handleToggle}
              className="inline-flex w-[118px] items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-800"
            >
              <AnimatePresence mode="wait" initial={false}>
                {expanded ? (
                  <motion.span
                    key="collapse-label"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    Collapse
                  </motion.span>
                ) : (
                  <motion.span
                    key="showall-label"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    Show All
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* 宽度和按钮一致，永远在正下方居中 */}
            <span className="mt-1 w-[118px] text-center text-xs text-slate-400">
              {items.length} fields
            </span>
          </div>
        )}
      </div>

      {/* Grid：用 AnimatePresence + 整块渐变，避免“晃动” */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={viewKey}
          layout
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{
            opacity: { duration: 0.48, ease: [0.33, 1, 0.68, 1] },
            y: { duration: 0.48, ease: [0.33, 1, 0.68, 1] },
            layout: { duration: 0.675, ease: [0.22, 1, 0.36, 1] },
          }}
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          {visibleItems.map((item) => (
              <div
                key={item.key}
                className="group relative overflow-hidden rounded-2xl border border-slate-300 bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100/70 px-3.5 py-3 shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md"
              >
              {/* 左侧彩条 */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-400 via-indigo-400 to-purple-400" />

              <div className="mb-1 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-white px-3 py-0.5 text-base font-semibold text-slate-700 shadow-sm">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {(item.modalities ?? []).map((mod) => {
                      const cfg = MODALITY_ICONS[mod];
                      if (!cfg)
                        return null;
                      return (
                        <span
                          key={`${item.key}-mod-${mod}`}
                          title={cfg.label}
                          className={`glossary-icon inline-flex h-6 w-6 items-center justify-center rounded-full border text-[0px] ${cfg.className}`}
                        >
                          {cfg.icon}
                        </span>
                      );
                    })}
                    {(item.usage ?? []).map((usage) => {
                      const cfg = USAGE_BADGES[usage];
                      if (!cfg)
                        return null;
                      return (
                        <span
                          key={`${item.key}-usage-${usage}`}
                          title={usage}
                          className={`glossary-icon inline-flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${cfg.className}`}
                        >
                          {cfg.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <span className="ml-auto whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  {item.table}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-slate-600 text-justify px-2">
                {item.description}
              </p>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default memo(AttributeGlossaryComponent);
