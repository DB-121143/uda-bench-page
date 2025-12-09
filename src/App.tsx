import { useDeferredValue, useMemo, useRef, useState, useEffect } from "react";
import type { JSX } from "react";
// import HoverSourceTable from "@/components/HoverSourceTable";
import AttributeGlossary from "@/components/AttributeGlossary";
import { GitHubIcon, PaperIcon, DataIcon } from "@/components/Icons";
import artIcon from "@/assets/icons/art.svg";
import cspaperIcon from "@/assets/icons/cspaper.svg";
import financeIcon from "@/assets/icons/finance.svg";
import healthcareIcon from "@/assets/icons/healthcare.svg";
import legalIcon from "@/assets/icons/legal.svg";
import playerIcon from "@/assets/icons/player.svg";
import DatasetSelector, {
  type DatasetOption,
} from "@/components/DatasetSelector";
import SqlShowcase from "@/components/SqlShowcase";
import Legend from "@/components/Legend";
import JoinGraph from "@/components/JoinGraph";

import joinGraphData from "@/assets/join_graph.json";

import artDescriptions from "@/assets/descriptions/art_descriptions.json";
import cspaperDescriptions from "@/assets/descriptions/cspaper_descriptions.json";
import financeDescriptions from "@/assets/descriptions/finance_descriptions.json";
import healthcareDescriptions from "@/assets/descriptions/healthcare_decriptions.json";
import legalDescriptions from "@/assets/descriptions/legal_descriptions.json";
import playerDescriptions from "@/assets/descriptions/player_descriptions.json";

// 你的 logo 文件（请在 src/assets 下放一个 uda-logo.svg 或改成你自己的文件名）
import logo from "@/public/UDA.svg";
//import benchmarkBuild from "@/public/benchmark_build.png";
import queryCategory from "@/public/Query_category.png";
import udaBig from "@/public/UDA-big.png";
import PlainSourceTable from "./components/PlainSourceTable";

type RowData = Record<string, unknown>;
type TableData = { name: string; rows: RowData[] };

type DatasetId =
  | "art"
  | "cspaper"
  | "player"
  | "legal"
  | "finance"
  | "healthcare";

type DatasetConfig = {
  id: DatasetId;
  label: string;
  data: RowData[];
};

type UsageType = "general" | "categorical" | "numerical";
type ModalityType = "text" | "image" | "table";

type AttributeMeta = {
  key: string;
  label: string;
  table: string;
  description: string;
  usage: UsageType[];
  modalities: ModalityType[];
};

type DescriptionField = {
  name?: string;
  table?: string;
  description?: string;
  usage?: string;
  modality?: string;
};

type DatasetDescriptions = Record<string, DescriptionField[]>;

const DESCRIPTION_SOURCES: Record<DatasetId, DatasetDescriptions> = {
  art: artDescriptions,
  cspaper: cspaperDescriptions,
  finance: financeDescriptions,
  healthcare: healthcareDescriptions,
  legal: legalDescriptions,
  player: playerDescriptions,
};

const DATASET_IDS: DatasetId[] = ["art", "cspaper", "player", "legal", "finance", "healthcare"];

const isDatasetId = (value: string): value is DatasetId => DATASET_IDS.includes(value as DatasetId);

const tableModules = import.meta.glob("./assets/table/**/*.json", {
  eager: true,
}) as Record<string, { default: RowData[] }>;

const TABLE_REGISTRY: Record<DatasetId, TableData[]> = (() => {
  const registry: Record<DatasetId, TableData[]> = {
    art: [],
    cspaper: [],
    player: [],
    legal: [],
    finance: [],
    healthcare: [],
  };
  for (const [path, mod] of Object.entries(tableModules)) {
    const match = path.match(/table\/([^/]+)\/([^/]+)\.json$/);
    if (!match) continue;
    const [, dataset, tableName] = match;
    if (!isDatasetId(dataset)) continue;
    registry[dataset].push({ name: tableName, rows: mod.default ?? [] });
  }
  (Object.values(registry) as TableData[][]).forEach((tables) => {
    tables.sort((a, b) => a.name.localeCompare(b.name));
  });
  return registry;
})();

const splitPipes = (value?: string): string[] => {
  if (!value) return [];
  return value
    .split(/[|;]+/)
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean);
};

const parseUsage = (value?: string): UsageType[] => {
  const allowed: UsageType[] = ["general", "categorical", "numerical"];
  const list = splitPipes(value);
  if (list.length === 0 && value) {
    const lower = value.trim().toLowerCase();
    if (allowed.includes(lower as UsageType)) return [lower as UsageType];
  }
  return list.filter((entry): entry is UsageType => allowed.includes(entry as UsageType));
};

const parseModality = (value?: string): ModalityType[] => {
  const allowed: ModalityType[] = ["text", "image", "table"];
  if (!value) return [];
  const list = splitPipes(value);
  if (list.length === 0 && value) {
    const lower = value.trim().toLowerCase();
    if (allowed.includes(lower as ModalityType)) return [lower as ModalityType];
  }
  return list.filter((entry): entry is ModalityType => allowed.includes(entry as ModalityType));
};

const flattenDescriptions = (
  tables: DatasetDescriptions,
  datasetId: DatasetId
): AttributeMeta[] => {
  const accumulated: AttributeMeta[] = [];
  Object.entries(tables ?? {}).forEach(([tableName, fields]) => {
    if (!Array.isArray(fields)) return;
    fields.forEach((field, index) => {
      const tableLabel = field.table ?? tableName ?? datasetId;
      accumulated.push({
        key: `${datasetId}-${tableLabel}-${field.name ?? index}`,
        label: field.name ?? `field-${index}`,
        table: tableLabel,
        description:
          field.description ??
          "No description has been provided for this attribute yet.",
        usage: parseUsage(field.usage),
        modalities: parseModality(field.modality),
      });
    });
  });
  return accumulated;
};

const DATASET_ATTRIBUTE_REGISTRY: Record<DatasetId, AttributeMeta[]> =
  Object.fromEntries(
    Object.entries(DESCRIPTION_SOURCES).map(([datasetId, tables]) => [
      datasetId,
      flattenDescriptions(tables, datasetId as DatasetId),
    ])
  ) as Record<DatasetId, AttributeMeta[]>;

const DATASETS: DatasetConfig[] = [
  { id: "art", label: "Art", data: [] },
  { id: "cspaper", label: "CSPaper", data: [] },
  { id: "player", label: "Player", data: [] },
  { id: "legal", label: "Legal", data: [] },
  { id: "finance", label: "Finance", data: [] },
  {
    id: "healthcare",
    label: "Healthcare",
    data: [],
  },
];

const DATASET_ICONS: Record<DatasetId, JSX.Element> = {
  art: <img src={artIcon} alt="Art dataset icon" className="h-5 w-5" />,
  cspaper: <img src={cspaperIcon} alt="CSPaper dataset icon" className="h-5 w-5" />,
  player: <img src={playerIcon} alt="Player dataset icon" className="h-5 w-5" />,
  legal: <img src={legalIcon} alt="Legal dataset icon" className="h-5 w-5" />,
  finance: <img src={financeIcon} alt="Finance dataset icon" className="h-5 w-5" />,
  healthcare: <img src={healthcareIcon} alt="Healthcare dataset icon" className="h-5 w-5" />,
};

const DATASET_OPTIONS: DatasetOption<DatasetId>[] = DATASETS.map((ds) => ({
  id: ds.id,
  label: ds.label,
  icon: DATASET_ICONS[ds.id],
}));

const FAQ_ITEMS: { question: string; answer: JSX.Element }[] = [
  {
    question: "How can we obtain more information about the benchmark?",
    answer: (
      <p>
        You can visit our <a className="text-sky-600 underline" href="https://github.com/DB-121143/UDA-Bench" target="_blank" rel="noreferrer">GitHub homepage</a> for more information.
      </p>
    ),
  },
  {
    question: "How are the classifications of SQL defined?",
    answer: (
      <div className="space-y-3">
        <p>
          We use expert-designed templates based on real-world scenarios, and the overall classification is shown in the following figure.
        </p>
        <img
          src={queryCategory}
          alt="SQL classification overview"
          className="w-full rounded-2xl border border-slate-200 shadow-sm"
          loading="lazy"
        />
      </div>
    ),
  },
  {
    question: "Can we contribute to this benchmark?",
    answer: (
      <p>
        Of course! We welcome issue reports, feature requests, or code contributions. Please ensure to follow the project's coding standards and testing requirements.
      </p>
    ),
  },
];

function App() {
  const [selectedDatasetId, setSelectedDatasetId] =
    useState<DatasetId>("player");
  const [tableIndex, setTableIndex] = useState<Record<DatasetId, number>>({
    art: 0,
    cspaper: 0,
    player: 2,
    legal: 0,
    finance: 0,
    healthcare: 0,
  });
  const [faqOpen, setFaqOpen] = useState<boolean[]>(FAQ_ITEMS.map(() => false));
  const faqRefs = useRef<Array<HTMLDivElement | null>>([]);
  const lastOpenedRef = useRef<number | null>(null);

  const currentDataset = useMemo(() => {
    return (
      DATASETS.find((ds) => ds.id === selectedDatasetId) ?? DATASETS[0]
    );
  }, [selectedDatasetId]);

  const deferredDataset = useDeferredValue(currentDataset);

  const glossaryItems: AttributeMeta[] = useMemo(
    () => DATASET_ATTRIBUTE_REGISTRY[selectedDatasetId] ?? [],
    [selectedDatasetId]
  );
  const datasetOptions: DatasetOption<DatasetId>[] = DATASET_OPTIONS;

  const currentTables = TABLE_REGISTRY[selectedDatasetId] ?? [];
  const currentTableIdx = tableIndex[selectedDatasetId] ?? 0;
  const safeTableIdx = currentTables.length
    ? ((currentTableIdx % currentTables.length) + currentTables.length) % currentTables.length
    : 0;
  const currentTable = currentTables[safeTableIdx];
  const tableRows = currentTable?.rows ?? deferredDataset.data ?? [];
  const tableName = currentTable?.name ?? "default";

  const toggleFaq = (idx: number) => {
    setFaqOpen((prev) => {
      const next = prev.map((open, i) => (i === idx ? !open : open));
      // If opening, smooth scroll to the item after layout updates
      if (!prev[idx]) {
        lastOpenedRef.current = idx;
      }
      return next;
    });
  };

  // Extra scroll pass after animations/images settle to ensure full visibility (e.g., with images)
  useEffect(() => {
    const idx = lastOpenedRef.current;
    if (idx == null || !faqOpen[idx]) return;
    const el = faqRefs.current[idx];
    if (!el) return;
      const timer = setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    return () => clearTimeout(timer);
  }, [faqOpen]);

  const cycleTable = (direction: number) => {
    setTableIndex((prev) => {
      const tables = TABLE_REGISTRY[selectedDatasetId] ?? [];
      if (!tables.length) return prev;
      const next = { ...prev };
      const len = tables.length;
      const cur = prev[selectedDatasetId] ?? 0;
      next[selectedDatasetId] = (cur + direction + len) % len;
      return next;
    });
  };

  return (
    <div
      id="top"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900"
    >
      {/* 固定左上角的图标 */}
      <div className="fixed left-4 top-4 z-[10000]">
        <a
          href="#top"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-lg shadow-md backdrop-blur-sm hover:bg-white"
        >
          <img
            src={logo}
            alt="UDA-Bench logo"
            className="h-9 w-9 rounded-full object-contain"
          />
          <span className="text-[18px] font-semibold text-slate-800">
            UDA-Bench
          </span>
        </a>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
        {/* ====================== Hero Section ====================== */}
        <section className="space-y-7 text-center">
          <div className="space-y-2">
            <p className="text-base uppercase tracking-[0.25em] text-slate-400">
              Unstructured Data Analysis Benchmark
            </p>
            {/* 两行大标题 */}
            <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 leading-relaxed">
              <span>UDA-Bench: Unstructured Data</span>
              <br />
              <span>Analysis Benchmark</span>
            </h1>
          </div>

          {/* Code / Paper / Data buttons */}
          <div className="flex flex-wrap items-center justify-center gap-5">
            <a
              href="https://github.com/DB-121143/UDA-Bench" // TODO: 替换为真实 GitHub 链接
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full border border-slate-300 bg-white px-5 md:px-6 py-2 text-base md:text-lg font-semibold text-slate-700 shadow shadow-slate-200/80 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <GitHubIcon className="h-5 w-5 md:h-6 md:w-6 text-slate-600" />
              <span>Code</span>
            </a>

            <a
              href="https://github.com/DB-121143/UDA-Bench/blob/main/technical_report.pdf" // TODO: 替换为真实论文链接
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white pl-4 pr-5 md:pl-5 md:pr-6 py-2 text-base md:text-lg font-semibold text-slate-700 shadow shadow-slate-200/80 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <PaperIcon className="h-6 w-6 md:h-7 md:w-7 text-slate-600" />
              <span>Paper</span>
            </a>

            <a
              href="https://drive.google.com/drive/folders/1GO40CMuN-NVspPFnvQnwRoHKaHI-a3t9?usp=sharing" // TODO: 替换为真实数据链接
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white pl-4 pr-5 md:pl-5 md:pr-6 py-2 text-base md:text-lg font-semibold text-slate-700 shadow shadow-slate-200/80 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <DataIcon className="h-6 w-6 md:h-7 md:w-7 text-slate-600" />
              <span>Data</span>
            </a>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-slate-200" />

        {/* ====================== Intro Section ====================== */}
        <section className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
              What is UDA-Bench?
            </h2>
          </div>

          <div className="mx-auto max-w-3xl text-xs md:text-sm leading-relaxed text-slate-600 text-justify space-y-4">
            <p>
              The UDA-Bench dataset is a benchmark for unstructured data
              analysis, encompassing large-scale and diverse datasets as well as
              a rich set of queries. It aims to provide a comprehensive, diverse,
              high-quality, and large-scale evaluation benchmark for existing
              Unsupervised Data Analysis (UDA) systems. This is the first work
              to construct such a comprehensive benchmark and conduct an
              in-depth evaluation of existing Large Language Model (LLM)-based
              unstructured data analysis systems.
            </p>
            <p>
              The benchmark includes six multi-domain, multi-modal datasets spanning healthcare, law, art, sports, science, and finance, with sizes from hundreds to hundreds of thousands of documents. The healthcare dataset alone contains over 100,000 long, complex documents, making it two orders of magnitude larger than existing benchmarks. Beyond text, the data also includes tables, images, and other modalities, enabling realistic end-to-end analysis.
            </p>
          </div>
            {/* <div className="mx-auto flex max-w-4xl justify-center">
              <img
                src={benchmarkBuild}
                alt="UDA-Bench benchmark build overview"
                className="w-full max-w-4xl rounded-2xl border border-slate-200 shadow-md"
                loading="lazy"
              />
            </div> */}
        </section>

        {/* Divider */}
        <hr className="border-slate-200" />

        {/* ====================== Data Section ====================== */}
        <section className="space-y-6">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
                Current Benchmark Data
              </h2>
            </div>

            <div className="mx-auto max-w-3xl text-xs md:text-sm leading-relaxed text-slate-600 text-justify">
              <p>
                The sections below show the current snapshot of UDA-Bench
                entities, including a glossary of attribute definitions and a
                row-level results table. You
                can switch between different datasets using the selector.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <DatasetSelector
                value={selectedDatasetId}
                options={datasetOptions}
                onChange={(val) => setSelectedDatasetId(val)}
              />
              <Legend />
            </div>
          </div>

          {/* Attribute Reference：记得传 datasetKey，避免切换数据集时动画抖动 */}
          <AttributeGlossary
            items={glossaryItems}
            datasetKey={deferredDataset.id}
          />

          {/* Table */}
          <PlainSourceTable
            data={tableRows}
            datasetKey={deferredDataset.id}
            tableName={tableName}
            onPrevTable={currentTables.length > 1 ? () => cycleTable(-1) : undefined}
            onNextTable={currentTables.length > 1 ? () => cycleTable(1) : undefined}
          />


          {/* 新的 SQL 示例模块 */}
          <SqlShowcase datasetId={deferredDataset.id} />

          {/* Joinable columns graph */}
          <JoinGraph data={joinGraphData as any} />
        </section>

        {/* Divider */}
        <hr className="border-slate-200" />

        
        {/* ====================== Overall Performance ====================== */}
        <section className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
              Overall Performance
            </h2>
          </div>

          <div className="mx-auto max-w-3xl space-y-3 text-xs md:text-sm leading-relaxed text-slate-600 text-justify">
            <p>
              Our benchmark distills diverse pipelines into a single, comparable
              quality index that blends reasoning accuracy, and downstream execution stability. Performance details can be seen in the technical report in our <a className="text-sky-600 underline" href="https://github.com/DB-121143/UDA-Bench" target="_blank" rel="noreferrer">GitHub repository</a>. 
            </p>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-slate-200" />

        {/* ====================== FAQ ====================== */}
        <section className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mx-auto max-w-3xl space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const open = faqOpen[idx];
              return (
                <div
                  key={item.question}
                  ref={(el) => {
                    faqRefs.current[idx] = el;
                  }}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                    aria-expanded={open}
                  >
                    <span className="text-sm md:text-base font-semibold text-slate-900">{item.question}</span>
                    <span
                      className={`ml-3 inline-flex h-5 w-5 items-center justify-center text-slate-500 transition-transform ${
                        open ? "rotate-180" : "rotate-0"
                      }`}
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
                        <path
                          fill="currentColor"
                          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.1 1.02l-4.25 4.5a.75.75 0 0 1-1.1 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                        />
                      </svg>
                    </span>
                  </button>
                  <div
                    className={`border-t border-slate-200 bg-white px-4 text-xs md:text-sm text-slate-700 transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)] overflow-hidden ${
                      open ? "max-h-[1200px] py-3 opacity-100 translate-y-0" : "max-h-0 py-0 opacity-0 -translate-y-1.5"
                    }`}
                  >
                    <div className="leading-relaxed space-y-3">{item.answer}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Divider */}
        <hr className="border-slate-200" />

        <section className="space-y-4">
          <div className="mx-auto flex max-w-4xl justify-center">
            <img
              src={udaBig}
              alt="UDA-Bench overview"
              className="w-full max-w-4xl rounded-2xl border border-slate-200 shadow-md"
              loading="lazy"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
