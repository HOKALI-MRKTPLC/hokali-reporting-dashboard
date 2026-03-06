"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { AttendanceRecord } from "@/lib/dataService";
import CopyCell from "@/components/CopyCell";

interface LowEngagementTableProps {
  data: AttendanceRecord[];
}

interface BookingSummary {
  bookingId: string;
  schoolName: string;
  activity: string;
  grade: string;
  totalStudents: number;
  enrolled: number;
  enrollmentRate: number;
  avgAttendanceRate: number;
}

function RateCell({ value }: { value: number }) {
  const low = value <= 10;
  return (
    <Badge variant={low ? "destructive" : "secondary"} className="text-xs">
      {value}%
    </Badge>
  );
}

export default function LowEngagementTable({ data }: LowEngagementTableProps) {
  const lowBookings = useMemo<BookingSummary[]>(() => {
    const byKey: Record<string, AttendanceRecord[]> = {};
    data.forEach((r) => {
      const key = r.bookingId || `${r.schoolName}||${r.activity}`;
      if (!byKey[key]) byKey[key] = [];
      byKey[key].push(r);
    });

    return Object.entries(byKey)
      .map(([, records]) => {
        const first = records[0];
        const enrolled = records.filter((r) => r.enrolled).length;
        const enrollmentRate = Math.round((enrolled / records.length) * 100);
        const avgAttendanceRate = Math.round(
          records.reduce((sum, r) => sum + r.attendanceRate, 0) / records.length
        );
        return {
          bookingId: first.bookingId,
          schoolName: first.schoolName,
          activity: first.activity,
          grade: first.grade,
          totalStudents: records.length,
          enrolled,
          enrollmentRate,
          avgAttendanceRate,
        };
      })
      .filter((s) => s.enrollmentRate <= 10 || s.avgAttendanceRate <= 10)
      .sort(
        (a, b) =>
          a.enrollmentRate + a.avgAttendanceRate -
          (b.enrollmentRate + b.avgAttendanceRate)
      );
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <CardTitle>Low Enrollment &amp; Attendance (0–10%)</CardTitle>
        {lowBookings.length > 0 && (
          <Badge variant="destructive" className="text-xs ml-1">
            {lowBookings.length} booking{lowBookings.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {lowBookings.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            No bookings with 0–10% enrollment or attendance
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-left">Booking ID</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-left">School</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-left">Activity</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-left">Grade(s)</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-right">Students</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-right">Enrolled</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-right">Enrollment %</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {lowBookings.map((s, i) => (
                  <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2"><CopyCell value={s.bookingId} /></td>
                    <td className="px-4 py-2 font-medium">{s.schoolName}</td>
                    <td className="px-4 py-2 text-muted-foreground">{s.activity}</td>
                    <td className="px-4 py-2 text-muted-foreground">{s.grade || "—"}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{s.totalStudents}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{s.enrolled}</td>
                    <td className="px-4 py-2 text-right"><RateCell value={s.enrollmentRate} /></td>
                    <td className="px-4 py-2 text-right"><RateCell value={Math.round(s.avgAttendanceRate)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
