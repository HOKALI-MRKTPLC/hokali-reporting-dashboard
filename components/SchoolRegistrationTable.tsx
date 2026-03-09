"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SchoolRow {
  school: string;
  totalStudents: number;
  district?: string;
}

interface SchoolRegistrationTableProps {
  data: SchoolRow[];
}

export default function SchoolRegistrationTable({ data }: SchoolRegistrationTableProps) {
  const showDistrict = data.some((r) => r.district);
  const sorted = [...data].sort((a, b) =>
    showDistrict
      ? (a.district ?? "").localeCompare(b.district ?? "") || a.school.localeCompare(b.school)
      : b.totalStudents - a.totalStudents
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Students Registered per School</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[480px]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-accent">
                {showDistrict && (
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-left whitespace-nowrap">
                    District
                  </th>
                )}
                <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-left whitespace-nowrap">
                  School
                </th>
                <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-right whitespace-nowrap">
                  Total Students
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={i} className="border-b hover:bg-accent/30 transition-colors">
                  {showDistrict && (
                    <td className="px-4 py-2 text-muted-foreground text-xs">
                      {row.district ?? "—"}
                    </td>
                  )}
                  <td className="px-4 py-2 font-medium">{row.school}</td>
                  <td className="px-4 py-2 text-right font-semibold">{row.totalStudents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
