import { useDeferredValue, useMemo, useState } from "react";
import HoverSourceTable from "@/components/HoverSourceTable";
import AttributeGlossary from "@/components/AttributeGlossary";
import { GitHubIcon, PaperIcon, DataIcon } from "@/components/Icons";
import DatasetSelector, {
  type DatasetOption,
} from "@/components/DatasetSelector";
import SqlShowcase from "@/components/SqlShowcase";

import players from "@/assets/players.json";
import playersDescriptionMap from "@/assets/players_description.json";

import medicine from "@/assets/medicine.json";
import medicineDescriptionMap from "@/assets/medicine_description.json";

// 你的 logo 文件（请在 src/assets 下放一个 uda-logo.svg 或改成你自己的文件名）
import logo from "@/public/UDA.svg";

type RowData = Record<string, unknown>;

type AttributeMeta = {
  key: string;
  label: string;
  description: string;
};

type RawDescriptionMap = Record<
  string,
  {
    label: string;
    description: string;
  }
>;

type DatasetId = "players" | "medicine";

type DatasetConfig = {
  id: DatasetId;
  label: string;
  data: RowData[];
  descriptionMap: RawDescriptionMap;
};

const DATASETS: DatasetConfig[] = [
  {
    id: "players",
    label: "Players (Demo)",
    data: players as RowData[],
    descriptionMap: playersDescriptionMap as RawDescriptionMap,
  },
  {
    id: "medicine",
    label: "Medicine Cases (Demo)",
    data: medicine as RowData[],
    descriptionMap: medicineDescriptionMap as RawDescriptionMap,
  },
];

const DATASET_OPTIONS: DatasetOption<DatasetId>[] = DATASETS.map((ds) => ({
  id: ds.id,
  label: ds.label,
}));

function App() {
  const [selectedDatasetId, setSelectedDatasetId] =
    useState<DatasetId>("players");

  const currentDataset = useMemo(() => {
    return (
      DATASETS.find((ds) => ds.id === selectedDatasetId) ?? DATASETS[0]
    );
  }, [selectedDatasetId]);

  const deferredDataset = useDeferredValue(currentDataset);

  const columnKeys = useMemo(() => {
    const firstRow = deferredDataset.data[0] as RowData | undefined;
    if (!firstRow) return [] as string[];
    return Object.keys(firstRow).filter((k) => !k.endsWith("_source"));
  }, [deferredDataset]);

  const glossaryItems: AttributeMeta[] = useMemo(
    () =>
      columnKeys.map((key) => {
        const meta = deferredDataset.descriptionMap[key];
        return {
          key,
          label: meta?.label ?? key,
          description:
            meta?.description ??
            "No description has been provided for this attribute yet.",
        };
      }),
    [columnKeys, deferredDataset]
  );
  const datasetOptions: DatasetOption<DatasetId>[] = DATASET_OPTIONS;

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

          <div className="mx-auto max-w-3xl text-xs md:text-sm leading-relaxed text-slate-600 text-justify">
            <p>
              We are dedicated to exploring unstructured data as a first-class
              object in modern analytics workflows, going beyond traditional
              benchmarks that mostly focus on clean, well-defined tables or
              single-turn question answering. UDA-Bench is designed as a
              holistic benchmark for real-world unstructured data analysis,
              where text, logs, semi-structured payloads and noisy metadata are
              combined into complex scenarios that require retrieval, reasoning,
              transformation and aggregation. Instead of optimizing for a single
              static metric, we explicitly model the trade-offs between quality,
              latency and cost across different systems and model families,
              enabling practitioners to understand how their choices behave
              under realistic workloads. By providing unified tasks, curated
              evaluation protocols and interpretable per-query diagnostics,
              UDA-Bench aims to serve as a shared playground for researchers and
              engineers who care about building robust, transparent and
              efficient unstructured data analysis pipelines.
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

            <div className="flex justify-center">
              <DatasetSelector
                value={selectedDatasetId}
                options={datasetOptions}
                onChange={(val) => setSelectedDatasetId(val)}
              />
            </div>
          </div>

          {/* Attribute Reference：记得传 datasetKey，避免切换数据集时动画抖动 */}
          <AttributeGlossary
            items={glossaryItems}
            datasetKey={deferredDataset.id}
          />

          {/* Table */}
          <HoverSourceTable
            data={deferredDataset.data}
            datasetKey={deferredDataset.id}
          />


          {/* 新的 SQL 示例模块 */}
          <SqlShowcase datasetId={deferredDataset.id} />
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
