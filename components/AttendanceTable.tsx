"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { AttendanceRecord } from "@/lib/dataService";
import CopyCell from "@/components/CopyCell";

interface AttendanceTableProps {
  data: AttendanceRecord[];
}

type SortKey = keyof AttendanceRecord;
type SortDir = "asc" | "desc";
interface SortConfig { key: SortKey; dir: SortDir; priority: number }

function RateBadge({ rate }: { rate: number }) {
  if (rate >= 80) return <Badge variant="default">{rate}%</Badge>;
  if (rate >= 60) return <Badge variant="secondary">{rate}%</Badge>;
  return <Badge variant="destructive">{rate}%</Badge>;
}

function SortIcon({ sortConfig, colKey }: { sortConfig: SortConfig[]; colKey: SortKey }) {
  const config = sortConfig.find((s) => s.key === colKey);
  const showPriority = sortConfig.length > 1 && config;
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {config ? (
        config.dir === "asc" ? (
          <ChevronUp className="h-3 w-3 text-primary" />
        ) : (
          <ChevronDown className="h-3 w-3 text-primary" />
        )
      ) : (
        <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />
      )}
      {showPriority && (
        <span className="text-[10px] text-primary font-bold leading-none">{config.priority}</span>
      )}
    </span>
  );
}

function applySorts(data: AttendanceRecord[], sortConfig: SortConfig[]): AttendanceRecord[] {
  if (sortConfig.length === 0) return data;
  return [...data].sort((a, b) => {
    for (const { key, dir } of sortConfig) {
      const av = a[key];
      const bv = b[key];
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else if (typeof av === "boolean" && typeof bv === "boolean") {
        cmp = Number(av) - Number(bv);
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
    }
    return 0;
  });
}

export default function AttendanceTable({ data }: AttendanceTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      const existing = prev.find((s) => s.key === key);
      if (!existing) {
        // Add as new sort with next priority
        return [...prev, { key, dir: "asc", priority: prev.length + 1 }];
      }
      if (existing.dir === "asc") {
        // Flip to descending
        return prev.map((s) => s.key === key ? { ...s, dir: "desc" } : s);
      }
      // Remove this sort and re-number priorities
      const removed = prev.filter((s) => s.key !== key);
      return removed.map((s, i) => ({ ...s, priority: i + 1 }));
    });
  };

  const sorted = applySorts(data, sortConfig);

  const thClass = "cursor-pointer select-none hover:bg-muted/50 transition-colors";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Student Attendance Records</CardTitle>
        {sortConfig.length > 0 && (
          <button
            onClick={() => setSortConfig([])}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear sorting
          </button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No records to display
          </div>
        ) : (
          <div className="overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={thClass} onClick={() => handleSort("studentName")}>
                    Student <SortIcon sortConfig={sortConfig} colKey="studentName" />
                  </TableHead>
                  <TableHead className={thClass} onClick={() => handleSort("schoolName")}>
                    School <SortIcon sortConfig={sortConfig} colKey="schoolName" />
                  </TableHead>
                  <TableHead className={thClass} onClick={() => handleSort("county")}>
                    County <SortIcon sortConfig={sortConfig} colKey="county" />
                  </TableHead>
                  <TableHead className={thClass} onClick={() => handleSort("activity")}>
                    Activity <SortIcon sortConfig={sortConfig} colKey="activity" />
                  </TableHead>
                  <TableHead className={thClass} style={{ width: 100 }} onClick={() => handleSort("bookingId")}>
                    Booking ID <SortIcon sortConfig={sortConfig} colKey="bookingId" />
                  </TableHead>
                  <TableHead className={thClass} style={{ width: 72 }} onClick={() => handleSort("grade")}>
                    Grade(s) <SortIcon sortConfig={sortConfig} colKey="grade" />
                  </TableHead>
                  <TableHead className={thClass} onClick={() => handleSort("category")}>
                    Category <SortIcon sortConfig={sortConfig} colKey="category" />
                  </TableHead>
                  <TableHead className={thClass} onClick={() => handleSort("type")}>
                    Type <SortIcon sortConfig={sortConfig} colKey="type" />
                  </TableHead>
                  <TableHead className={`text-center ${thClass}`} onClick={() => handleSort("enrolled")}>
                    Enrolled <SortIcon sortConfig={sortConfig} colKey="enrolled" />
                  </TableHead>
                  <TableHead className={`text-center ${thClass}`} onClick={() => handleSort("waitlist")}>
                    Waitlist <SortIcon sortConfig={sortConfig} colKey="waitlist" />
                  </TableHead>
                  <TableHead className={`text-right ${thClass}`} onClick={() => handleSort("totalClasses")}>
                    Total Classes <SortIcon sortConfig={sortConfig} colKey="totalClasses" />
                  </TableHead>
                  <TableHead className={`text-right ${thClass}`} onClick={() => handleSort("totalAttendance")}>
                    Attended <SortIcon sortConfig={sortConfig} colKey="totalAttendance" />
                  </TableHead>
                  <TableHead className={`text-right ${thClass}`} onClick={() => handleSort("last5Sessions")}>
                    Last 5 <SortIcon sortConfig={sortConfig} colKey="last5Sessions" />
                  </TableHead>
                  <TableHead className={`text-right ${thClass}`} onClick={() => handleSort("attendanceRate")}>
                    Rate <SortIcon sortConfig={sortConfig} colKey="attendanceRate" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.studentName}</TableCell>
                    <TableCell>{row.schoolName}</TableCell>
                    <TableCell className="text-muted-foreground">{row.county}</TableCell>
                    <TableCell className="text-muted-foreground">{row.activity}</TableCell>
                    <TableCell style={{ width: 100 }}><CopyCell value={row.bookingId} /></TableCell>
                    <TableCell className="text-muted-foreground" style={{ width: 72 }}>{row.grade || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{row.category}</TableCell>
                    <TableCell className="text-muted-foreground">{row.type}</TableCell>
                    <TableCell className="text-center">
                      {row.enrolled ? (
                        <Badge variant="default" className="text-xs">Yes</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.waitlist ? (
                        <Badge variant="default" className="text-xs">Yes</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{row.totalClasses}</TableCell>
                    <TableCell className="text-right">{row.totalAttendance}</TableCell>
                    <TableCell className="text-right">{row.last5Sessions}</TableCell>
                    <TableCell className="text-right">
                      <RateBadge rate={row.attendanceRate} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
