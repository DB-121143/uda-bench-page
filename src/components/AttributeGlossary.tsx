// src/components/AttributeGlossary.tsx
import { memo, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type AttributeMeta = {
  key: string;
  label: string;
  description: string;
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

              <div className="mb-1 inline-flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-0.5 text-base font-semibold text-slate-700 shadow-sm">
                  {item.label}
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
