// src/components/HoverSourceTable.tsx
import {
  memo,
  useMemo,
  useRef,
  useState,
  type MouseEventHandler,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

type RowData = Record<string, unknown>;

interface HoverSourceTableProps {
  data: RowData[];
  datasetKey?: string;
}

interface HoverCellProps {
  value: unknown;
  source?: string;
}

/**
 * 单元格：
 * - 鼠标进入 0.3 秒后显示 tooltip
 * - tooltip 通过 Portal 挂在 document.body，避免被遮挡
 * - 如果 source 为空，则显示 [No Source]
 * - 单元格内容最多展示 3 行，多余内容用 ... 截断
 */
const HoverCell = ({ value, source }: HoverCellProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter: MouseEventHandler<HTMLTableCellElement> = (e) => {
    setPos({ x: e.clientX, y: e.clientY });
    timeoutRef.current = window.setTimeout(() => {
      setShowTooltip(true);
    }, 300);
  };

  const handleMouseLeave: MouseEventHandler<HTMLTableCellElement> = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowTooltip(false);
    setPos(null);
  };

  const handleMouseMove: MouseEventHandler<HTMLTableCellElement> = (e) => {
    setPos({ x: e.clientX, y: e.clientY });
  };

  // ✅ tooltip 改为出现在鼠标的右上方（鼠标在框的左下角附近）
  const tooltipStyle: CSSProperties | undefined =
    pos && showTooltip
      ? {
          left: pos.x + 12, // 往右移一点
          top: pos.y - 12, // 再往上移一点
          transform: "translate(0, -100%)", // 以左下角为锚点
        }
      : undefined;

  const displaySource =
    source && source.trim().length > 0 ? source : "[No Source]";

  const tooltip =
    showTooltip && pos
      ? createPortal(
          <div
            className="fixed z-[9999] w-72 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs text-slate-800 shadow-2xl backdrop-blur-md pointer-events-none"
            style={tooltipStyle}
          >
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Source
            </div>
            <div className="leading-snug break-words text-justify clamp-8">
              {displaySource}
            </div>
            {/* 小三角移到左下角附近 */}
            <div className="absolute left-2 bottom-0 h-2 w-2 translate-y-1/2 rotate-45 border-r border-b border-slate-200/80 bg-white/80" />
          </div>,
          document.body
        )
      : null;

  const displayValue =
    value === null || value === undefined ? "" : String(value);

  return (
    <td
      className="relative border-t border-slate-200 px-4 py-2 align-top"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* 保持 3 行截断，字体提升至 12px 便于阅读 */}
      <span className="clamp-3 text-[12px] font-medium text-slate-900">
        {displayValue}
      </span>
      {tooltip}
    </td>
  );
};

const HoverSourceTableComponent = ({ data, datasetKey = "default" }: HoverSourceTableProps) => {
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [] as string[];
    const allKeys = Object.keys(data[0] ?? {});
    return allKeys.filter((key) => !key.endsWith("_source"));
  }, [data]);

  const viewKey = `${datasetKey}-${data.length}`;

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-8 text-center text-xs text-slate-500">
        No data available.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur shadow-xl">
      {/* 头部 */}
      <div className="px-5 pt-3 pb-2.5 border-b border-slate-200">
        <h2 className="text-lg md:text-xl font-semibold text-slate-900">
          Attribute Table
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Hover a cell for at least 0.3 seconds to see the explanation. If no explanation is available,{" "}
          <span className="font-mono text-xs">[No Source]</span> is shown.
        </p>
      </div>

      {/* 表格主体 */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={viewKey}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            opacity: { duration: 0.48, ease: [0.33, 1, 0.68, 1] },
            y: { duration: 0.48, ease: [0.33, 1, 0.68, 1] },
            layout: { duration: 0.675, ease: [0.22, 1, 0.36, 1] },
          }}
          className="overflow-x-auto"
        >
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
                <tr
                  key={rowIndex}
                  className="transition-colors hover:bg-slate-50"
                >
                  {columns.map((col) => {
                    const value = (row as RowData)[col];
                    const sourceKey = `${col}_source`;
                    const source = (row as RowData)[sourceKey] as
                      | string
                      | undefined;

                    return (
                      <HoverCell
                        key={col}
                        value={value}
                        source={typeof source === "string" ? source : undefined}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default memo(HoverSourceTableComponent);
