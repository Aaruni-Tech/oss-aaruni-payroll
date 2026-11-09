/**
 * @syllovo-oss/cf-webpush (MIT License)
 * Cloudflare Workers Cron Trigger + Web Push (VAPID) Notification Engine
 * for persistent 6:00 PM – 9:00 PM IST daily timesheet reminders and
 * 1st-of-month Admin Payroll Run notifications.
 */

export const REMINDER_WINDOWS_IST = [
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
];

/**
 * Evaluates which active employees still need an evening push reminder
 * for the given IST date. Once an employee submits their timesheet for `dateStr`,
 * reminders immediately stop for that employee.
 */
export function getPendingTimesheetReminders({
  dateStr,
  employees = [],
  timesheets = [],
  holidays = [],
}) {
  const dt = new Date(`${dateStr}T12:00:00+05:30`);
  const isSunday = dt.getDay() === 0;
  const isHoliday = holidays.some((h) => h.date === dateStr);
  if (isSunday || isHoliday) {
    return { skippedReason: isSunday ? "Paid Sunday Rest Day" : "Company Paid Holiday", pending: [] };
  }

  const submittedEmpIds = new Set(
    timesheets.filter((t) => t.date === dateStr && Number(t.hours) > 0).map((t) => t.empId)
  );

  const pending = employees
    .filter((e) => e.status === "Active" && e.trackTimesheet !== false && !submittedEmpIds.has(e.id))
    .map((emp) => ({
      empId: emp.id,
      name: emp.name,
      mobile: emp.mobile,
      email: emp.email,
      title: `⏰ Aaruni Tech Timesheet Reminder (${emp.name.split(" ")[0]})`,
      body: `Hi ${emp.name.split(" ")[0]}, you haven't logged your Entry & Exit time for ${dateStr} yet. Tap to submit in 10 seconds!`,
      deepLink: `/?empId=${emp.id}&tab=timesheet&date=${dateStr}`,
    }));

  return { skippedReason: null, pending };
}

/**
 * Evaluates 1st-of-month Admin reminder for Rupesh Tiwari (AAR-0002).
 */
export function getAdminMonthlyPayrollReminder({ yearMonth, pendingNetPayTotal }) {
  return {
    recipientId: "AAR-0002",
    recipientName: "Rupesh Tiwari (Admin)",
    title: `🗓️ 1st of Month Payroll Ready (${yearMonth})`,
    body: `Monthly attendance & LOP summary for ${yearMonth} is ready. Review net payouts, pay via 1-Tap UPI, and click 'Payment Done' to publish PDF payslips & update CA Tax Docs.`,
    deepLink: `/?role=admin&tab=payroll&month=${yearMonth}`,
    pendingNetPayTotal,
  };
}
