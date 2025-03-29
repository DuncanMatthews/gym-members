import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subDays } from "date-fns";

// Normally this would fetch from an API or database
async function getMemberAttendance(memberId: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data
  const today = new Date();
  return [
    { date: subDays(today, 12), checkInTime: "08:15 AM", duration: 75 },
    { date: subDays(today, 9), checkInTime: "07:45 AM", duration: 90 },
    { date: subDays(today, 7), checkInTime: "06:30 PM", duration: 60 },
    { date: subDays(today, 5), checkInTime: "09:00 AM", duration: 120 },
    { date: subDays(today, 2), checkInTime: "05:15 PM", duration: 45 },
    { date: subDays(today, 1), checkInTime: "08:30 AM", duration: 85 },
  ];
}

interface MemberAttendanceCardProps {
  memberId: string;
}

export async function MemberAttendanceCard({ memberId }: MemberAttendanceCardProps) {
  const attendance = await getMemberAttendance(memberId);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance History</CardTitle>
        <CardDescription>Recent gym visits and check-ins</CardDescription>
      </CardHeader>
      <CardContent>
        {attendance.length > 0 ? (
          <div className="space-y-1">
            <div className="grid grid-cols-3 text-sm font-medium text-muted-foreground pb-2">
              <div>Date</div>
              <div>Check-in Time</div>
              <div>Duration</div>
            </div>
            {attendance.map((record, index) => (
              <div 
                key={index}
                className="grid grid-cols-3 py-2 text-sm border-t border-border"
              >
                <div>{format(record.date, 'MMM d, yyyy')}</div>
                <div>{record.checkInTime}</div>
                <div>{record.duration} minutes</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No attendance records found for this member.
          </div>
        )}
      </CardContent>
    </Card>
  );
}