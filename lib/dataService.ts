// Data Service — swap this layer when connecting to a real DB
// Currently reads from parsed Excel data passed in from the client

export interface AttendanceRecord {
  district: string;
  studentName: string;
  schoolName: string;
  county: string;
  activity: string;
  bookingId: string;
  grade: string;
  category: string;
  type: string;
  enrolled: boolean;
  waitlist: boolean;
  totalClasses: number;
  totalAttendance: number;
  attendanceRate: number;
  last5Sessions: number;
  parent1Name: string;
  parent1Email: string;
  parent1Phone: string;
  parent2Name: string;
  parent2Email: string;
  parent2Phone: string;
  externalId: string;
}

export interface SchoolSummary {
  school: string;
  avgAttendanceRate: number;
  totalStudents: number;
  avgLast5: number;
  enrolled: number;
  enrollmentRate: number;
}

export interface ActivitySummary {
  activity: string;
  totalStudents: number;
  enrolled: number;
  enrollmentRate: number;
  avgAttendanceRate: number;
}

export interface CategorySummary {
  category: string;
  totalStudents: number;
  enrolled: number;
  enrollmentRate: number;
  avgAttendanceRate: number;
}

export interface TypeSummary {
  type: string;
  totalStudents: number;
  enrolled: number;
  enrollmentRate: number;
  avgAttendanceRate: number;
}

export interface CountySummary {
  county: string;
  totalStudents: number;
  avgAttendanceRate: number;
}

export interface DistrictSummary {
  district: string;
  totalStudents: number;
  enrolled: number;
  enrollmentRate: number;
  avgAttendanceRate: number;
  avgLast5: number;
  atRisk: number;
  schools: number;
}

export function getSchools(data: AttendanceRecord[]): string[] {
  return Array.from(new Set(data.map((r) => r.schoolName))).sort();
}

export function getDistricts(data: AttendanceRecord[]): string[] {
  return Array.from(new Set(data.filter((r) => r.district).map((r) => r.district))).sort();
}

export function get1to1Data(data: AttendanceRecord[]): AttendanceRecord[] {
  return data.filter((r) => !r.district || r.district.trim() === "");
}

export function getDistrictData(data: AttendanceRecord[]): AttendanceRecord[] {
  return data.filter((r) => r.district && r.district.trim() !== "");
}

export function filterData(
  data: AttendanceRecord[],
  schools: string[],
  grades: string[] = [],
  bookingIds: string[] = []
): AttendanceRecord[] {
  return data.filter((r) => {
    if (schools.length > 0 && !schools.includes(r.schoolName)) return false;
    if (grades.length > 0 && !grades.includes(r.grade)) return false;
    if (bookingIds.length > 0 && !bookingIds.includes(r.bookingId)) return false;
    return true;
  });
}

export function filterByDistrict(
  data: AttendanceRecord[],
  districts: string[],
  grades: string[] = [],
  bookingIds: string[] = []
): AttendanceRecord[] {
  return data.filter((r) => {
    if (districts.length > 0 && !districts.includes(r.district)) return false;
    if (grades.length > 0 && !grades.includes(r.grade)) return false;
    if (bookingIds.length > 0 && !bookingIds.includes(r.bookingId)) return false;
    return true;
  });
}

export function getSchoolSummaries(data: AttendanceRecord[]): SchoolSummary[] {
  const bySchool: Record<string, AttendanceRecord[]> = {};
  data.forEach((r) => {
    if (!bySchool[r.schoolName]) bySchool[r.schoolName] = [];
    bySchool[r.schoolName].push(r);
  });

  return Object.entries(bySchool).map(([school, records]) => {
    const enrolled = records.filter((r) => r.enrolled).length;
    return {
      school,
      totalStudents: records.length,
      enrolled,
      enrollmentRate: Math.round((enrolled / records.length) * 100),
      avgAttendanceRate: Math.round(
        records.reduce((sum, r) => sum + r.attendanceRate, 0) / records.length
      ),
      avgLast5: Math.round(
        records.reduce((sum, r) => sum + r.last5Sessions, 0) / records.length
      ),
    };
  });
}

export function getDistrictSummaries(data: AttendanceRecord[]): DistrictSummary[] {
  const byDistrict: Record<string, AttendanceRecord[]> = {};
  data.forEach((r) => {
    if (!byDistrict[r.district]) byDistrict[r.district] = [];
    byDistrict[r.district].push(r);
  });

  return Object.entries(byDistrict)
    .map(([district, records]) => {
      const enrolled = records.filter((r) => r.enrolled).length;
      const schools = new Set(records.map((r) => r.schoolName)).size;
      return {
        district,
        totalStudents: records.length,
        enrolled,
        enrollmentRate: Math.round((enrolled / records.length) * 100),
        avgAttendanceRate: Math.round(
          records.reduce((sum, r) => sum + r.attendanceRate, 0) / records.length
        ),
        avgLast5: Math.round(
          records.reduce((sum, r) => sum + r.last5Sessions, 0) / records.length
        ),
        atRisk: records.filter((r) => r.attendanceRate < 60).length,
        schools,
      };
    })
    .sort((a, b) => b.avgAttendanceRate - a.avgAttendanceRate);
}

export function getCountySummaries(data: AttendanceRecord[]): CountySummary[] {
  const byCounty: Record<string, AttendanceRecord[]> = {};
  data.forEach((r) => {
    const key = r.county || "Unknown";
    if (!byCounty[key]) byCounty[key] = [];
    byCounty[key].push(r);
  });

  return Object.entries(byCounty).map(([county, records]) => ({
    county,
    totalStudents: records.length,
    avgAttendanceRate: Math.round(
      records.reduce((sum, r) => sum + r.attendanceRate, 0) / records.length
    ),
  }));
}

export function getActivitySummaries(data: AttendanceRecord[]): ActivitySummary[] {
  const byActivity: Record<string, AttendanceRecord[]> = {};
  data.forEach((r) => {
    const key = r.activity || "Unknown";
    if (!byActivity[key]) byActivity[key] = [];
    byActivity[key].push(r);
  });

  return Object.entries(byActivity)
    .map(([activity, records]) => {
      const enrolled = records.filter((r) => r.enrolled).length;
      return {
        activity,
        totalStudents: records.length,
        enrolled,
        enrollmentRate: Math.round((enrolled / records.length) * 100),
        avgAttendanceRate: Math.round(
          records.reduce((sum, r) => sum + r.attendanceRate, 0) / records.length
        ),
      };
    })
    .sort((a, b) => b.enrollmentRate - a.enrollmentRate);
}

export function getCategorySummaries(data: AttendanceRecord[]): CategorySummary[] {
  const byCategory: Record<string, AttendanceRecord[]> = {};
  data.forEach((r) => {
    const key = r.category || "Unknown";
    if (!byCategory[key]) byCategory[key] = [];
    byCategory[key].push(r);
  });

  return Object.entries(byCategory)
    .map(([category, records]) => {
      const enrolled = records.filter((r) => r.enrolled).length;
      return {
        category,
        totalStudents: records.length,
        enrolled,
        enrollmentRate: Math.round((enrolled / records.length) * 100),
        avgAttendanceRate: Math.round(
          records.reduce((sum, r) => sum + r.attendanceRate, 0) / records.length
        ),
      };
    })
    .sort((a, b) => b.enrollmentRate - a.enrollmentRate);
}

export function getTypeSummaries(data: AttendanceRecord[]): TypeSummary[] {
  const byType: Record<string, AttendanceRecord[]> = {};
  data.forEach((r) => {
    const key = r.type || "Unknown";
    if (!byType[key]) byType[key] = [];
    byType[key].push(r);
  });

  return Object.entries(byType)
    .map(([type, records]) => {
      const enrolled = records.filter((r) => r.enrolled).length;
      return {
        type,
        totalStudents: records.length,
        enrolled,
        enrollmentRate: Math.round((enrolled / records.length) * 100),
        avgAttendanceRate: Math.round(
          records.reduce((sum, r) => sum + r.attendanceRate, 0) / records.length
        ),
      };
    })
    .sort((a, b) => b.enrollmentRate - a.enrollmentRate);
}

export function getMetrics(data: AttendanceRecord[]) {
  const totalStudents = data.length;
  const enrolled = data.filter((r) => r.enrolled).length;
  const avgRate =
    totalStudents > 0
      ? Math.round(data.reduce((sum, r) => sum + r.attendanceRate, 0) / totalStudents)
      : 0;
  const atRisk = data.filter((r) => r.attendanceRate < 60).length;
  const avgLast5 =
    totalStudents > 0
      ? Math.round(data.reduce((sum, r) => sum + r.last5Sessions, 0) / totalStudents)
      : 0;

  return { totalStudents, enrolled, avgAttendanceRate: avgRate, atRisk, avgLast5 };
}

// Parse raw Excel rows into AttendanceRecord[]
// Columns: Student Name, District, School Name, County, Activity, Category, Type,
//          Enrolled?, Waitlist, Total Classes, Total Attendance%, Attendance,
//          Attendance last 5 sessions, Parent 1 Name, Parent 1 Email, Parent 1 Phone,
//          Parent 2 Name, Parent 2 Email, Parent 2 Phone, External ID
export function parseExcelRows(rows: Record<string, unknown>[]): AttendanceRecord[] {
  const normalizeRow = (row: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [k.trim(), v]));

  const parseNum = (val: unknown): number => {
    if (val === null || val === undefined || val === "") return 0;
    const n = Number(String(val).replace(/,/g, "").trim());
    return isNaN(n) ? 0 : n;
  };

  return rows
    .map(normalizeRow)
    .filter((row) => row["Student Name"] || row["School Name"])
    .map((row) => {
      const rawRate = row["Total Attendance%"];
      let rate = 0;
      if (typeof rawRate === "number") {
        rate = rawRate > 1 ? Math.round(rawRate) : Math.round(rawRate * 100);
      } else if (typeof rawRate === "string") {
        const parsed = parseFloat(rawRate.replace("%", "").trim());
        rate = isNaN(parsed) ? 0 : (parsed > 1 ? Math.round(parsed) : Math.round(parsed * 100));
      }

      const enrolledRaw = String(row["Enrolled?"] ?? "").toLowerCase().trim();
      const enrolled = enrolledRaw === "yes" || enrolledRaw === "true" || enrolledRaw === "1";

      const waitlistRaw = String(row["Waitlist"] ?? "").toLowerCase().trim();
      const waitlist = waitlistRaw === "yes" || waitlistRaw === "true" || waitlistRaw === "1";

      return {
        district: String(row["District"] ?? "").trim(),
        studentName: String(row["Student Name"] ?? ""),
        schoolName: String(row["School Name"] ?? "Unknown School"),
        county: String(row["County"] ?? "").trim(),
        activity: String(row["Activity"] ?? ""),
        bookingId: String(row["booking_id"] ?? "").trim(),
        grade: String(row["Grade(s)"] ?? "").trim(),
        category: String(row["Category"] ?? "").trim(),
        type: String(row["Type"] ?? "").trim(),
        enrolled,
        waitlist,
        totalClasses: parseNum(row["Total Classes"]),
        totalAttendance: parseNum(row["Attendance"]),
        attendanceRate: rate,
        last5Sessions: parseNum(row["Attendance last 5 sessions"]),
        parent1Name: String(row["Parent 1 Name"] ?? ""),
        parent1Email: String(row["Parent 1 Email"] ?? ""),
        parent1Phone: String(row["Parent 1 Phone"] ?? ""),
        parent2Name: String(row["Parent 2 Name"] ?? ""),
        parent2Email: String(row["Parent 2 Email"] ?? ""),
        parent2Phone: String(row["Parent 2 Phone"] ?? ""),
        externalId: String(row["External ID"] ?? ""),
      };
    });
}
