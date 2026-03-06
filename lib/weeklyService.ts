// Weekly Stats Service — parses and processes weekly_stats.xlsx data
// No XLSX import here; raw 2D rows are passed from the client

export interface WeekData {
  weekLabel: string;
  enrollment: number;
  ada: number;
  attPct: number;
}

export interface WeeklyRecord {
  district: string;
  schoolName: string;
  county: string;
  activity: string;
  bookingId: string;
  grade: string;
  category: string;
  type: string;
  maxCapacity: number;
  totalEnrolled: number;
  waitroom: number;
  weeks: WeekData[];
}

export type WeeklyMetric = "enrollment" | "ada" | "attPct";

// Parse raw 2D array from XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" })
//
// Row 0: [District, School Name, County, Activity, Booking ID, Grade(s), Category, Type,
//          Max Capacity, Total Enrolled, Waitroom, "Jan 6 - Jan 10", "", "", ...]
// Row 1: [ignored fixed labels..., "Enrollment", "ADA", "Att%", "Enrollment", "ADA", "Att%", ...]
// Row 2+: data
//
// Fixed columns 0-10, weeks start at column 11 (3 cols each: Enrollment, ADA, Att%)
const WEEKS_START_COL = 11;

export function parseWeeklyStats(rows: unknown[][]): WeeklyRecord[] {
  if (rows.length < 3) return [];

  const headerRow = rows[0] as (string | number | null | undefined)[];

  // Collect week labels from col 9, 12, 15, ... (every 3rd col)
  const weekLabels: string[] = [];
  for (let c = WEEKS_START_COL; c < headerRow.length; c += 3) {
    const label = String(headerRow[c] ?? "").trim();
    weekLabels.push(label || `Week ${weekLabels.length + 1}`);
  }

  if (weekLabels.length === 0) return [];

  const parseNum = (val: unknown): number => {
    if (val === null || val === undefined || val === "") return 0;
    if (typeof val === "number") return val;
    const n = parseFloat(String(val).replace(/[,%]/g, "").trim());
    return isNaN(n) ? 0 : n;
  };

  const parsePercent = (val: unknown): number => {
    const n = parseNum(val);
    // Convert decimal (0.85) to percentage (85)
    return n > 1 ? Math.round(n) : Math.round(n * 100);
  };

  const records: WeeklyRecord[] = [];

  for (let r = 2; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    const district = String(row[0] ?? "").trim();
    const schoolName = String(row[1] ?? "").trim();
    const county = String(row[2] ?? "").trim();
    const activity = String(row[3] ?? "").trim();
    const bookingId = String(row[4] ?? "").trim();
    const grade = String(row[5] ?? "").trim();
    const category = String(row[6] ?? "").trim();
    const type = String(row[7] ?? "").trim();
    const maxCapacity = parseNum(row[8]);
    const totalEnrolled = parseNum(row[9]);
    const waitroom = parseNum(row[10]);

    if (!schoolName && !activity) continue;

    const weeks: WeekData[] = weekLabels.map((weekLabel, i) => {
      const base = WEEKS_START_COL + i * 3;
      return {
        weekLabel,
        enrollment: parseNum(row[base]),
        ada: parseNum(row[base + 1]),
        attPct: parsePercent(row[base + 2]),
      };
    });

    records.push({ district, schoolName, county, activity, bookingId, grade, category, type, maxCapacity, totalEnrolled, waitroom, weeks });
  }

  return records;
}

export function getWeeklyOptions(records: WeeklyRecord[]) {
  const districts = Array.from(new Set(records.filter((r) => r.district).map((r) => r.district))).sort();
  const schools = Array.from(new Set(records.map((r) => r.schoolName).filter(Boolean))).sort();
  const activities = Array.from(new Set(records.map((r) => r.activity).filter(Boolean))).sort();
  const categories = Array.from(new Set(records.map((r) => r.category).filter(Boolean))).sort();
  const grades = Array.from(new Set(records.map((r) => r.grade).filter(Boolean))).sort();
  const bookingIds = Array.from(new Set(records.map((r) => r.bookingId).filter(Boolean))).sort();
  const weekLabels = records.length > 0 ? records[0].weeks.map((w) => w.weekLabel) : [];
  return { districts, schools, activities, categories, grades, bookingIds, weekLabels };
}

export function filterWeekly(
  records: WeeklyRecord[],
  districts: string[],
  schools: string[],
  activity: string,
  category: string,
  grades: string[] = [],
  bookingIds: string[] = [],
): WeeklyRecord[] {
  return records.filter((r) => {
    if (districts.length > 0 && !districts.includes(r.district)) return false;
    if (schools.length > 0 && !schools.includes(r.schoolName)) return false;
    if (activity !== "all" && r.activity !== activity) return false;
    if (category !== "all" && r.category !== category) return false;
    if (grades.length > 0 && !grades.includes(r.grade)) return false;
    if (bookingIds.length > 0 && !bookingIds.includes(r.bookingId)) return false;
    return true;
  });
}

export function getWeeklyMetrics(records: WeeklyRecord[]) {
  const maxCapacity = records.reduce((s, r) => s + r.maxCapacity, 0);
  const totalEnrolled = records.reduce((s, r) => s + r.totalEnrolled, 0);
  const waitroom = records.reduce((s, r) => s + r.waitroom, 0);
  // Latest attended = sum of most recent non-zero ADA per record
  const latestAttended = records.reduce((s, r) => {
    const latest = [...r.weeks].reverse().find((w) => w.ada > 0);
    return s + (latest ? latest.ada : 0);
  }, 0);
  const enrollmentRate = maxCapacity > 0 ? Math.round((totalEnrolled / maxCapacity) * 100) : 0;
  return { maxCapacity, totalEnrolled, waitroom, latestAttended, enrollmentRate };
}

export function getMetricValue(week: WeekData, metric: WeeklyMetric): number {
  if (metric === "enrollment") return week.enrollment;
  if (metric === "ada") return week.ada;
  return week.attPct;
}

export function getMetricLabel(metric: WeeklyMetric): string {
  if (metric === "enrollment") return "Enrollment";
  if (metric === "ada") return "ADA";
  return "Att%";
}

export function isPercentMetric(metric: WeeklyMetric): boolean {
  return metric === "attPct";
}

// Stable color map: activity → hex color (sorted alphabetically for consistency)
const PALETTE = [
  "#3e8ccc", "#e81e76", "#53b078", "#fd7723", "#c652ff",
  "#13c8ae", "#284ae3", "#daba00", "#ff6b6b", "#4ecdc4",
  "#a29bfe", "#fd79a8", "#00cec9", "#e17055", "#636e72",
];

export function buildActivityColorMap(activities: string[]): Record<string, string> {
  const sorted = [...activities].sort();
  const map: Record<string, string> = {};
  sorted.forEach((a, i) => {
    map[a] = PALETTE[i % PALETTE.length];
  });
  return map;
}
