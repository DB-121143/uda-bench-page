import { useDeferredValue, useMemo, useState } from "react";
import HoverSourceTable from "@/components/HoverSourceTable";
import AttributeGlossary from "@/components/AttributeGlossary";
import { GitHubIcon, PaperIcon, DataIcon } from "@/components/Icons";
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

const DATASET_OPTIONS: DatasetOption<DatasetId>[] = DATASETS.map((ds) => ({
  id: ds.id,
  label: ds.label,
}));

function App() {
  const [selectedDatasetId, setSelectedDatasetId] =
    useState<DatasetId>("player");
  const [tableIndex, setTableIndex] = useState<Record<DatasetId, number>>({
    art: 0,
    cspaper: 0,
    player: 0,
    legal: 0,
    finance: 0,
    healthcare: 0,
  });

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
              href="https://arxiv.org/abs/0000.0000" // TODO: 替换为真实论文链接
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
              UDA-Bench includes six unstructured datasets from different
              domains, covering representative fields such as healthcare, law,
              art, sports, science, and finance. Each dataset contains hundreds
              to hundreds of thousands of documents, with the healthcare dataset
              being particularly large, containing over 100,000 long and complex
              documents, which is 100 times larger than existing benchmarks.
              These datasets include not only text but also tables, images, and
              other modalities, supporting a wide range of analytical tasks.
            </p>
            <p>
              We designed 608 queries, grouped into five main categories:
              Select, Filter, Join, Agg, and Mixed queries. These queries
              encompass various complex combinations of operations, allowing for
              comprehensive testing of system performance under different query
              loads. Through these queries, UDA-Bench provides a multidimensional
              evaluation framework to help researchers assess system performance
              across different tasks and data attributes. Additionally, the
              dataset defines 167 meaningful attributes, including categorical,
              numerical, and string types, covering various document types,
              modalities, and analysis difficulties. This aims to enhance the
              system's ability to handle diverse and complex data processing
              tasks. All labels have been manually annotated by a team of 30
              graduate students, ensuring the quality and accuracy of the
              dataset annotations.
            </p>
          </div>
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
                row-level results table with hoverable source explanations. You
                can switch between different datasets using the selector, and
                the attribute reference and table will update accordingly,
                providing a consistent view over heterogeneous unstructured data
                sources.
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
          <HoverSourceTable
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
              quality index that blends retrieval fidelity, reasoning accuracy,
              and downstream execution stability. The score is recalculated with
              every release to reflect the latest datasets and system upgrades.
            </p>
            <p>
              Beyond the composite score, we expose latency percentiles and
              normalized cost footprints so teams can identify whether their
              stack is throttled by infrastructure, model size, or orchestration
              overhead. Each metric is anchored to reproducible workloads.
            </p>
            <p>
              Performance deltas are tracked longitudinally, allowing readers to
              see how new techniques impact production-style traces instead of
              cherry-picked demos. The view below will eventually host live
              charts sourced from our evaluation pipeline.
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

          <div className="mx-auto max-w-3xl space-y-3 text-xs md:text-sm leading-relaxed text-slate-600 text-justify">
            <p>
              What makes UDA-Bench different from legacy leaderboards? We focus
              on messy, multi-source corpora with provenance tracking, and our
              tasks explicitly reward explainability and operator trust.
            </p>
            <p>
              How frequently is the benchmark refreshed? We snapshot new logs,
              text dumps, and semi-structured payloads every quarter, then run a
              full evaluation sweep to keep historical comparisons meaningful.
            </p>
            <p>
              Can teams contribute workloads or metrics? Absolutely—submit pull
              requests with dataset manifests or evaluation hooks, and our
              steering group will validate and merge them into the next cycle.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
