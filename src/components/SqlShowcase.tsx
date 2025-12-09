// src/components/SqlShowcase.tsx
import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

interface SqlShowcaseProps {
  /** 对应你 App 里的 selectedDatasetId，例如 "players" 或 "medicine" */
  datasetId: string;
}

type SqlDatasetFile = Record<string, string[]>;

type SqlModule = {
  default: SqlDatasetFile;
};

/**
 * 通过 Vite 的 import.meta.glob 把所有 sql/*.json 都扫一遍，
 * 生成 registry[datasetId][code] = SQL[]
 */
const sqlModules = import.meta.glob("../assets/sql/*.json", {
  eager: true,
}) as Record<string, SqlModule>;

const sqlRegistry: Record<string, SqlDatasetFile> = {};

for (const [path, mod] of Object.entries(sqlModules)) {
  const match = path.match(/\/sql\/([^/]+)\.json$/);
  if (!match) continue;
  const dataset = match[1];
  sqlRegistry[dataset] = mod.default ?? {};
}

/** 四个类别的状态定义（索引从 0 开始） */
const S_STATES = ["OFF", "ON"] as const;
const F_STATES = ["OFF", "SINGLE", "AND", "OR", "CONJ", "DISJ", "MIXED"] as const;
const A_STATES = ["OFF", "ON"] as const;
const J_STATES = ["OFF", "SINGLE", "MULTI"] as const;

type RollerLabel = "S" | "F" | "A" | "J";

type RollerProps = {
  label: RollerLabel;
  states: readonly string[];
  index: number;
  onChange: (index: number) => void;
};

const ACCENT_CLASS: Record<
  RollerLabel,
  { activeBadge: string }
> = {
  S: { activeBadge: "bg-gradient-to-br from-sky-400 to-cyan-400" },
  F: { activeBadge: "bg-gradient-to-br from-emerald-400 to-lime-400" },
  A: { activeBadge: "bg-gradient-to-br from-amber-400 to-orange-400" },
  J: { activeBadge: "bg-gradient-to-br from-violet-400 to-fuchsia-400" },
};

/**
 * 单个“滚轮盘”开关：
 * - 点击：切换到下一个状态
 * - hover >= 0.5s 后，滚轮滚动可上下切换状态
 * - 当前状态文字使用 Framer Motion 做上下滑动动画
 */
const RollerToggle = memo(({ label, states, index, onChange }: RollerProps) => {
  const currentState = states[index];
  const isOff = currentState === "OFF";

  const next = () => {
    const nextIndex = (index + 1) % states.length;
    onChange(nextIndex);
  };

  const accent = ACCENT_CLASS[label];

  return (
    <div
      className={[
        "flex cursor-pointer select-none items-center justify-between gap-3 rounded-2xl px-3 py-2 border",
        isOff
          ? "border-slate-200 bg-slate-50/80 text-slate-400"
          : "border-slate-300 bg-white text-slate-800 shadow-sm",
      ].join(" ")}
      onClick={next}
    >
      {/* 左侧：字母方块 */}
      <div
        className={[
          "flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold shadow-sm",
          isOff ? "bg-slate-300 text-slate-100" : `${accent.activeBadge} text-white`,
        ].join(" ")}
      >
        {label}
      </div>

      {/* 右侧：当前状态文字的“滚轮”动画区域 */}
      <div className="relative flex-1 overflow-hidden text-right">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentState}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-end text-[15px] font-semibold tracking-wide"
          >
            {currentState}
          </motion.div>
        </AnimatePresence>
        {/* 为了撑高容器高度，放一个透明占位 */}
        <div className="invisible text-[15px] font-semibold tracking-wide">
          {currentState}
        </div>
      </div>
    </div>
  );
});

const SqlShowcaseComponent = ({ datasetId }: SqlShowcaseProps) => {
  // 四个滚轮的索引状态
  const [sIndex, setSIndex] = useState(0); // S: OFF, ON
  const [fIndex, setFIndex] = useState(0); // F: OFF, SINGLE, AND, OR, CONJ, DISJ, MIXED
  const [aIndex, setAIndex] = useState(0); // A: OFF, COUNT, CALC
  const [jIndex, setJIndex] = useState(0); // J: OFF, SINGLE, MULTI

  // 组合编码：S F A J
  const code = useMemo(
    () => `${sIndex}${fIndex}${aIndex}${jIndex}`,
    [sIndex, fIndex, aIndex, jIndex]
  );

  // 当前数据集 + 组合对应的 SQL 列表
  const sqlList = useMemo(() => {
    const datasetSql = sqlRegistry[datasetId] ?? {};
    return datasetSql[code] ?? [];
  }, [datasetId, code]);

  const deferredCode = useDeferredValue(code);
  const deferredSqlList = useDeferredValue(sqlList);
  const animationKey = `${datasetId}-${deferredCode}-${deferredSqlList.length}`;

  // 数据集切换时，建议把 F/A/J 的状态重置一下（S 只有一个 ON）
  useEffect(() => {
    setSIndex(0);
    setFIndex(0);
    setAIndex(0);
    setJIndex(0);
  }, [datasetId]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 px-5 py-5 shadow-xl backdrop-blur space-y-4">
      {/* 标题区域 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-slate-900">
            SQL Example Queries
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Click the four buttons to configure the template of the SQL query.
          </p>
        </div>
      </div>

      {/* 四个滚轮开关 */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <RollerToggle
          label="S"
          states={S_STATES}
          index={sIndex}
          onChange={setSIndex}
        />
        <RollerToggle
          label="F"
          states={F_STATES}
          index={fIndex}
          onChange={setFIndex}
        />
        <RollerToggle
          label="A"
          states={A_STATES}
          index={aIndex}
          onChange={setAIndex}
        />
        <RollerToggle
          label="J"
          states={J_STATES}
          index={jIndex}
          onChange={setJIndex}
        />
      </div>

      {/* SQL 展示区域 */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={animationKey}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            opacity: { duration: 0.48, ease: [0.33, 1, 0.68, 1] },
            y: { duration: 0.48, ease: [0.33, 1, 0.68, 1] },
            layout: { duration: 0.675, ease: [0.22, 1, 0.36, 1] },
          }}
          className="space-y-3"
        >
          {deferredSqlList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-3 text-xs md:text-sm text-slate-500">
              No SQL example for this combination yet.
            </div>
          ) : (
            deferredSqlList.map((sql, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 shadow-sm"
              >
                <div className="flex items-center justify-between bg-slate-100/80 px-4 py-2 text-xs uppercase tracking-wide text-slate-500">
                  <span>Example #{idx + 1}</span>
                </div>
                <SyntaxHighlighter
                  language="sql"
                  style={oneLight}
                  customStyle={{
                    margin: 0,
                    padding: "0.75rem 1rem",
                    fontSize: "14px", // 调大字体大小
                    background: "transparent",
                  }}
                  wrapLines
                  wrapLongLines
                >
                  {sql}
                </SyntaxHighlighter>
              </div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default memo(SqlShowcaseComponent);
