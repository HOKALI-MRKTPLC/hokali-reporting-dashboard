"use client";

import { useState, useMemo } from "react";
import FileUpload from "@/components/FileUpload";
import MetricCards from "@/components/MetricCards";
import AttendanceChart from "@/components/AttendanceChart";
import ActivityChart from "@/components/ActivityChart";
import CategoryChart from "@/components/CategoryChart";
import TypeChart from "@/components/TypeChart";
import CountyPieChart from "@/components/CountyPieChart";
import DistrictChart from "@/components/DistrictChart";
import DistrictSummaryTable from "@/components/DistrictSummaryTable";
import DistrictSchoolChart from "@/components/DistrictSchoolChart";
import Filters from "@/components/Filters";
import MultiSelect from "@/components/MultiSelect";
import AttendanceTable from "@/components/AttendanceTable";
import ZeroAttendanceTable from "@/components/ZeroAttendanceTable";
import WeeklyTable from "@/components/WeeklyTable";
import WeeklyLineChart from "@/components/WeeklyLineChart";
import WeeklyMetricCards from "@/components/WeeklyMetricCards";
import DailyTable from "@/components/DailyTable";
import DailyChart from "@/components/DailyChart";
import DailyMetricCards from "@/components/DailyMetricCards";
import DayOfWeekChart from "@/components/DayOfWeekChart";
import DayOfWeekTable from "@/components/DayOfWeekTable";
import InsightsTable from "@/components/InsightsTable";
import { generateInsights } from "@/lib/insightsService";
import {
  AttendanceRecord,
  filterData,
  filterByDistrict,
  getMetrics,
  getSchools,
  getDistricts,
  getSchoolSummaries,
  getActivitySummaries,
  getCategorySummaries,
  getTypeSummaries,
  getDistrictSummaries,
  getCountySummaries,
  get1to1Data,
  getDistrictData,
} from "@/lib/dataService";
import {
  WeeklyRecord,
  WeeklyMetric,
  getWeeklyOptions,
  getWeeklyMetrics,
  filterWeekly,
  getMetricLabel,
} from "@/lib/weeklyService";
import {
  DailyRecord,
  getDailyOptions,
  filterDaily,
  getDailyMetrics,
  getUniqueDates,
  buildDailyChartData,
  getDayOfWeekStats,
} from "@/lib/dailyService";

type View = "overall" | "weekly" | "daily" | "insights";

export default function DashboardPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [rawData, setRawData] = useState<AttendanceRecord[]>([]);
  const [weeklyRecords, setWeeklyRecords] = useState<WeeklyRecord[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);

  // ── Navigation ───────────────────────────────────────────────────────────────
  const [view, setView] = useState<View>("overall");
  const [overallSubView, setOverallSubView] = useState<"1to1" | "districts">("1to1");

  // ── Attendance filters ───────────────────────────────────────────────────────
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);

  // ── Weekly filters ───────────────────────────────────────────────────────────
  const [wSubView, setWSubView] = useState<"1to1" | "districts">("1to1");
  const [wDistricts, setWDistricts] = useState<string[]>([]);
  const [wSchools, setWSchools] = useState<string[]>([]);
  const [wActivity, setWActivity] = useState("all");
  const [wCategory, setWCategory] = useState("all");
  const [wMetric, setWMetric] = useState<WeeklyMetric>("enrollment");
  const [wView, setWView] = useState<"table" | "chart">("table");
  const [wWeekFrom, setWWeekFrom] = useState(0);
  const [wWeekTo, setWWeekTo] = useState<number | null>(null);

  // ── Daily filters ────────────────────────────────────────────────────────────
  const [dSubView, setDSubView] = useState<"1to1" | "districts">("1to1");
  const [dSchools, setDSchools] = useState<string[]>([]);
  const [dActivity, setDActivity] = useState("all");
  const [dDistricts, setDDistricts] = useState<string[]>([]);
  const [dCategory, setDCategory] = useState("all");
  const [dView, setDView] = useState<"table" | "chart">("table");
  const [dDateFromIdx, setDDateFromIdx] = useState<number | null>(null); // null = auto last-20
  const [dDateToIdx, setDDateToIdx] = useState<number | null>(null);    // null = last

  // ── Derived: attendance ──────────────────────────────────────────────────────
  const data1to1 = useMemo(() => get1to1Data(rawData), [rawData]);
  const dataDistricts = useMemo(() => getDistrictData(rawData), [rawData]);
  const schools = useMemo(() => getSchools(data1to1), [data1to1]);
  const districts = useMemo(() => getDistricts(dataDistricts), [dataDistricts]);

  const filtered1to1 = useMemo(() => filterData(data1to1, selectedSchools), [data1to1, selectedSchools]);
  const filteredDistricts = useMemo(() => filterByDistrict(dataDistricts, selectedDistricts), [dataDistricts, selectedDistricts]);

  const metrics1to1 = useMemo(() => getMetrics(filtered1to1), [filtered1to1]);
  const metricsDistricts = useMemo(() => getMetrics(filteredDistricts), [filteredDistricts]);

  const schoolSummaries = useMemo(() => getSchoolSummaries(filtered1to1), [filtered1to1]);
  const activitySummaries1to1 = useMemo(() => getActivitySummaries(filtered1to1), [filtered1to1]);
  const categorySummaries1to1 = useMemo(() => getCategorySummaries(filtered1to1), [filtered1to1]);
  const typeSummaries1to1 = useMemo(() => getTypeSummaries(filtered1to1), [filtered1to1]);
  const countySummaries = useMemo(() => getCountySummaries(filtered1to1), [filtered1to1]);

  const districtSummaries = useMemo(() => getDistrictSummaries(filteredDistricts), [filteredDistricts]);
  const districtSchoolSummaries = useMemo(() => getSchoolSummaries(filteredDistricts), [filteredDistricts]);
  const activitySummariesDistricts = useMemo(() => getActivitySummaries(filteredDistricts), [filteredDistricts]);
  const categorySummariesDistricts = useMemo(() => getCategorySummaries(filteredDistricts), [filteredDistricts]);
  const typeSummariesDistricts = useMemo(() => getTypeSummaries(filteredDistricts), [filteredDistricts]);

  // ── Derived: weekly ──────────────────────────────────────────────────────────
  const weekly1to1 = useMemo(() => weeklyRecords.filter((r) => !r.district || r.district.trim() === ""), [weeklyRecords]);
  const weeklyDistricts = useMemo(() => weeklyRecords.filter((r) => r.district && r.district.trim() !== ""), [weeklyRecords]);
  const hasWeekly1to1 = weekly1to1.length > 0;
  const hasWeeklyDistricts = weeklyDistricts.length > 0;

  const activeWeeklySet = wSubView === "districts" && hasWeeklyDistricts ? weeklyDistricts : weekly1to1;
  const weeklyOptions = useMemo(() => getWeeklyOptions(activeWeeklySet), [activeWeeklySet]);
  const weekCount = weeklyOptions.weekLabels.length;
  const weekToActual = wWeekTo !== null ? wWeekTo : Math.max(0, weekCount - 1);

  const filteredWeekly = useMemo(
    () => filterWeekly(activeWeeklySet, wDistricts, wSchools, wActivity, wCategory),
    [activeWeeklySet, wDistricts, wSchools, wActivity, wCategory],
  );
  const weeklyMetrics = useMemo(() => getWeeklyMetrics(filteredWeekly), [filteredWeekly]);

  // ── Derived: daily ───────────────────────────────────────────────────────────
  const daily1to1 = useMemo(() => dailyRecords.filter((r) => !r.district || r.district.trim() === ""), [dailyRecords]);
  const dailyDistricts = useMemo(() => dailyRecords.filter((r) => r.district && r.district.trim() !== ""), [dailyRecords]);
  const hasDaily1to1 = daily1to1.length > 0;
  const hasDailyDistricts = dailyDistricts.length > 0;

  const activeDailySet = dSubView === "districts" && hasDailyDistricts ? dailyDistricts : daily1to1;
  const dailyOptions = useMemo(() => getDailyOptions(activeDailySet), [activeDailySet]);

  const filteredDaily = useMemo(
    () => filterDaily(activeDailySet, dSchools, dActivity, dDistricts, dCategory),
    [activeDailySet, dSchools, dActivity, dDistricts, dCategory],
  );

  const uniqueDates = useMemo(() => getUniqueDates(filteredDaily), [filteredDaily]);
  const totalDates = uniqueDates.length;

  // Default: show last 20 dates
  const dDateToActual = dDateToIdx !== null ? dDateToIdx : Math.max(0, totalDates - 1);
  const dDateFromActual = dDateFromIdx !== null ? dDateFromIdx : Math.max(0, totalDates - 20);

  const visibleDates = uniqueDates.slice(dDateFromActual, dDateToActual + 1);

  const dailyMetrics = useMemo(() => getDailyMetrics(filteredDaily), [filteredDaily]);
  const dailyActivities = useMemo(
    () => Array.from(new Set(filteredDaily.map((r) => r.activity))).sort(),
    [filteredDaily],
  );
  const dailyChartData = useMemo(
    () => buildDailyChartData(filteredDaily, visibleDates),
    [filteredDaily, visibleDates],
  );

  const dayOfWeekStats = useMemo(() => getDayOfWeekStats(filteredDaily), [filteredDaily]);

  // ── Insights ─────────────────────────────────────────────────────────────────
  const insights = useMemo(
    () => generateInsights(data1to1, dataDistricts, weeklyRecords, dailyRecords),
    [data1to1, dataDistricts, weeklyRecords, dailyRecords],
  );

  // ── Callbacks ────────────────────────────────────────────────────────────────
  const handleAttendanceLoaded = (data: AttendanceRecord[]) => {
    setRawData(data);
    setSelectedSchools([]);
    setSelectedDistricts([]);
  };

  const handleWeeklyLoaded = (records: WeeklyRecord[]) => {
    setWeeklyRecords(records);
    setWSubView("1to1");
    setWDistricts([]);
    setWSchools([]);
    setWActivity("all");
    setWCategory("all");
    setWWeekFrom(0);
    setWWeekTo(null);
    if (records.length > 0) setView("weekly");
  };

  const handleDailyLoaded = (records: DailyRecord[]) => {
    setDailyRecords(records);
    setDSubView("1to1");
    setDSchools([]);
    setDActivity("all");
    setDDistricts([]);
    setDCategory("all");
    setDDateFromIdx(null);
    setDDateToIdx(null);
    if (records.length > 0) setView("daily");
  };

  const switchOverallSubView = (sv: "1to1" | "districts") => {
    setOverallSubView(sv);
    setSelectedSchools([]);
    setSelectedDistricts([]);
  };

  const switchWSubView = (sv: "1to1" | "districts") => {
    setWSubView(sv);
    setWDistricts([]); setWSchools([]); setWActivity("all"); setWCategory("all");
    setWWeekFrom(0); setWWeekTo(null);
  };

  const switchDSubView = (sv: "1to1" | "districts") => {
    setDSubView(sv);
    setDSchools([]); setDActivity("all"); setDDistricts([]); setDCategory("all");
    setDDateFromIdx(null); setDDateToIdx(null);
  };

  const has1to1Data = data1to1.length > 0;
  const hasDistrictsData = dataDistricts.length > 0;
  const safeOverallSubView: "1to1" | "districts" =
    has1to1Data && !hasDistrictsData ? "1to1"
    : !has1to1Data && hasDistrictsData ? "districts"
    : overallSubView;

  const hasAttendance = rawData.length > 0;
  const hasWeekly = weeklyRecords.length > 0;
  const hasDaily = dailyRecords.length > 0;
  const hasAny = hasAttendance || hasWeekly || hasDaily;

  const safeView: View =
    view === "overall" && !hasAttendance ? (hasDaily ? "daily" : hasWeekly ? "weekly" : "overall")
    : view === "weekly" && !hasWeekly ? (hasAttendance ? "overall" : hasDaily ? "daily" : "overall")
    : view === "daily" && !hasDaily ? (hasAttendance ? "overall" : hasWeekly ? "weekly" : "overall")
    : view === "insights" && !hasAny ? "overall"
    : view;

  const METRICS: WeeklyMetric[] = ["enrollment", "ada", "attPct"];

  const btnClass = (active: boolean) =>
    `px-4 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-transparent border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground"
    }`;

  const subTabClass = (active: boolean) =>
    `px-5 py-2 text-sm font-semibold rounded-t-lg transition-colors border border-b-0 ${
      active
        ? "bg-background text-foreground border-border"
        : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
    }`;

  return (
    <div className="min-h-screen bg-background">
      {/* View Navigation */}
      {hasAny && (
        <div className="bg-muted border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 pt-2">
            {hasAttendance && (
              <button onClick={() => setView("overall")} className={`px-6 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border border-b-0 ${safeView === "overall" ? "bg-background text-foreground border-border" : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-background/50"}`}>
                Overall Stats
              </button>
            )}
            {hasWeekly && (
              <button onClick={() => setView("weekly")} className={`px-6 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border border-b-0 ${safeView === "weekly" ? "bg-background text-foreground border-border" : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-background/50"}`}>
                Weekly Stats
              </button>
            )}
            {hasDaily && (
              <button onClick={() => setView("daily")} className={`px-6 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border border-b-0 ${safeView === "daily" ? "bg-background text-foreground border-border" : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-background/50"}`}>
                Daily Stats
              </button>
            )}
            <button onClick={() => setView("insights")} className={`px-6 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border border-b-0 ${safeView === "insights" ? "bg-background text-foreground border-border" : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-background/50"}`}>
              Insights {insights.length > 0 && <span className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold">{insights.filter(i => i.severity === "critical").length}</span>}
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* File Upload */}
        <FileUpload
          onAttendanceLoaded={handleAttendanceLoaded}
          onWeeklyLoaded={handleWeeklyLoaded}
          onDailyLoaded={handleDailyLoaded}
        />

        {/* Overall Stats View */}
        {hasAttendance && safeView === "overall" && (
          <>
            {has1to1Data && hasDistrictsData && (
              <div className="flex gap-1 border-b">
                <button onClick={() => switchOverallSubView("1to1")} className={subTabClass(safeOverallSubView === "1to1")}>1to1 Schools</button>
                <button onClick={() => switchOverallSubView("districts")} className={subTabClass(safeOverallSubView === "districts")}>Districts</button>
              </div>
            )}

            {/* 1to1 sub-view */}
            {safeOverallSubView === "1to1" && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <Filters schools={schools} selectedSchools={selectedSchools} onSchoolsChange={setSelectedSchools} />
                  <span className="text-xs text-muted-foreground">Showing {filtered1to1.length} of {data1to1.length} students</span>
                </div>
                <MetricCards {...metrics1to1} />
                <AttendanceChart schoolData={schoolSummaries} />
                <ActivityChart data={activitySummaries1to1} />
                <CategoryChart data={categorySummaries1to1} />
                <TypeChart data={typeSummaries1to1} />
                <CountyPieChart data={countySummaries} />
                <AttendanceTable data={filtered1to1} />
                <ZeroAttendanceTable data={filtered1to1} />
              </>
            )}

            {/* Districts sub-view */}
            {safeOverallSubView === "districts" && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">District:</span>
                    <MultiSelect
                      options={districts}
                      selected={selectedDistricts}
                      onChange={setSelectedDistricts}
                      placeholder="All Districts"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">Showing {filteredDistricts.length} of {dataDistricts.length} students</span>
                </div>
                <MetricCards {...metricsDistricts} />
                <DistrictChart data={districtSummaries} />
                <DistrictSchoolChart data={districtSchoolSummaries} />
                <ActivityChart data={activitySummariesDistricts} />
                <CategoryChart data={categorySummariesDistricts} />
                <TypeChart data={typeSummariesDistricts} />
                <DistrictSummaryTable data={districtSummaries} />
                <AttendanceTable data={filteredDistricts} />
                <ZeroAttendanceTable data={filteredDistricts} />
              </>
            )}
          </>
        )}

        {/* Weekly Stats View */}
        {hasWeekly && safeView === "weekly" && (
          <>
            {hasWeekly1to1 && hasWeeklyDistricts && (
              <div className="flex gap-1 border-b">
                <button onClick={() => switchWSubView("1to1")} className={subTabClass(wSubView === "1to1")}>1to1 Schools</button>
                <button onClick={() => switchWSubView("districts")} className={subTabClass(wSubView === "districts")}>Districts</button>
              </div>
            )}
            <WeeklyMetricCards {...weeklyMetrics} />
            <div className="flex flex-wrap items-center gap-3">
              {wSubView === "districts" && weeklyOptions.districts.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">District:</span>
                  <MultiSelect
                    options={weeklyOptions.districts}
                    selected={wDistricts}
                    onChange={setWDistricts}
                    placeholder="All Districts"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">School:</span>
                <MultiSelect
                  options={weeklyOptions.schools}
                  selected={wSchools}
                  onChange={setWSchools}
                  placeholder="All Schools"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Activity:</span>
                <select value={wActivity} onChange={(e) => setWActivity(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="all">All</option>
                  {weeklyOptions.activities.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {weeklyOptions.categories.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Category:</span>
                  <select value={wCategory} onChange={(e) => setWCategory(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="all">All</option>
                    {weeklyOptions.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {weekCount > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Weeks:</span>
                  <select value={wWeekFrom} onChange={(e) => { const v = Number(e.target.value); setWWeekFrom(v); if (wWeekTo !== null && wWeekTo < v) setWWeekTo(v); }} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                    {weeklyOptions.weekLabels.map((label, i) => <option key={i} value={i}>{label}</option>)}
                  </select>
                  <span className="text-muted-foreground text-sm">to</span>
                  <select value={weekToActual} onChange={(e) => setWWeekTo(Number(e.target.value))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                    {weeklyOptions.weekLabels.map((label, i) => <option key={i} value={i} disabled={i < wWeekFrom}>{label}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-1">
                {METRICS.map((m) => (
                  <button key={m} onClick={() => setWMetric(m)} className={btnClass(wMetric === m)}>{getMetricLabel(m)}</button>
                ))}
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <button onClick={() => setWView("table")} className={btnClass(wView === "table")}>Table</button>
                <button onClick={() => setWView("chart")} className={btnClass(wView === "chart")}>Chart</button>
              </div>
              <span className="text-xs text-muted-foreground">{filteredWeekly.length} of {activeWeeklySet.length} rows</span>
            </div>
            {wView === "table" ? (
              <WeeklyTable data={filteredWeekly} metric={wMetric} weekFrom={wWeekFrom} weekTo={weekToActual} />
            ) : (
              <WeeklyLineChart data={filteredWeekly} metric={wMetric} weekFrom={wWeekFrom} weekTo={weekToActual} />
            )}
          </>
        )}

        {/* Daily Stats View */}
        {hasDaily && safeView === "daily" && (
          <>
            {hasDaily1to1 && hasDailyDistricts && (
              <div className="flex gap-1 border-b">
                <button onClick={() => switchDSubView("1to1")} className={subTabClass(dSubView === "1to1")}>1to1 Schools</button>
                <button onClick={() => switchDSubView("districts")} className={subTabClass(dSubView === "districts")}>Districts</button>
              </div>
            )}
            <DailyMetricCards {...dailyMetrics} />
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {dSubView === "districts" && dailyOptions.districts.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">District:</span>
                  <MultiSelect
                    options={dailyOptions.districts}
                    selected={dDistricts}
                    onChange={setDDistricts}
                    placeholder="All Districts"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">School:</span>
                <MultiSelect
                  options={dailyOptions.schools}
                  selected={dSchools}
                  onChange={setDSchools}
                  placeholder="All Schools"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Activity:</span>
                <select value={dActivity} onChange={(e) => setDActivity(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="all">All</option>
                  {dailyOptions.activities.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {dailyOptions.categories.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Category:</span>
                  <select value={dCategory} onChange={(e) => setDCategory(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="all">All</option>
                    {dailyOptions.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>
            {/* Date range + view toggle */}
            <div className="flex flex-wrap items-center gap-4">
              {totalDates > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Dates:</span>
                  <select
                    value={dDateFromActual}
                    onChange={(e) => { const v = Number(e.target.value); setDDateFromIdx(v); if (dDateToIdx !== null && dDateToIdx < v) setDDateToIdx(v); }}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {uniqueDates.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                  <span className="text-muted-foreground text-sm">to</span>
                  <select
                    value={dDateToActual}
                    onChange={(e) => setDDateToIdx(Number(e.target.value))}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {uniqueDates.map((d, i) => <option key={i} value={i} disabled={i < dDateFromActual}>{d}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-1 ml-auto">
                <button onClick={() => setDView("table")} className={btnClass(dView === "table")}>Table</button>
                <button onClick={() => setDView("chart")} className={btnClass(dView === "chart")}>Chart</button>
              </div>
              <span className="text-xs text-muted-foreground">
                {filteredDaily.length} students · {visibleDates.length} of {totalDates} dates shown
              </span>
            </div>
            {dView === "table" ? (
              <DailyTable
                data={filteredDaily.slice(0, 200)}
                allDates={uniqueDates}
                dateFromIdx={dDateFromActual}
                dateToIdx={dDateToActual}
              />
            ) : (
              <DailyChart data={dailyChartData} activities={dailyActivities} />
            )}

            {/* Day of week analysis — always visible, specific to each school */}
            <div className="pt-2 border-t">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4 px-1">
                Day of Week Analysis
              </h2>
              <div className="space-y-6">
                <DayOfWeekChart data={dayOfWeekStats} />
                <DayOfWeekTable data={dayOfWeekStats} />
              </div>
            </div>
          </>
        )}

        {/* Insights View */}
        {safeView === "insights" && (
          <InsightsTable insights={insights} />
        )}

        {!hasAny && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-muted-foreground text-sm">
              Upload your Excel or CSV files above to get started.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
