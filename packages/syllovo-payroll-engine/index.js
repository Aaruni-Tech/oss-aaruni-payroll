/**
 * @syllovo-oss/payroll-engine (MIT License)
 * Open-source Indian Payroll, Calendar-Day Proration, Sunday Comp-Off,
 * Multi-Email Alias Resolution, and Encrypted Salary Vault Engine.
 * Maintained by Syllovo & Aaruni Tech Open-Source Commons.
 */

export const EMAIL_ALIAS_MAP = {
  "nandini.chukka.fsm@gmail.com": "AAR-0004",
  "nandinichukka72@gmail.com": "AAR-0004",
  "janvi.varma.fsm@gmail.com": "AAR-0005",
  "kjhanvi88@gmail.com": "AAR-0005",
  "koppula.ramya.fsm@gmail.com": "AAR-0006",
  "roopkt2@gmail.com": "AAR-0002",
  "rupesh@fullstackmaster.net": "AAR-0002",
  "nisha.tiwari.mail@gmail.com": "AAR-0001",
};

/**
 * Resolves any primary or legacy/alternate employee email to a canonical Employee ID.
 */
export function resolveEmployeeByEmail(email, employees = []) {
  if (!email) return null;
  const clean = String(email).trim().toLowerCase();
  for (const emp of employees) {
    const emails = [emp.email, ...(emp.alternateEmails || [])].map((e) =>
      String(e || "").trim().toLowerCase()
    );
    if (emails.includes(clean)) return emp.id;
  }
  return EMAIL_ALIAS_MAP[clean] || null;
}

/**
 * Calculates exact working hours from Entry Time ("10:00") and Exit Time ("18:00")
 * minus optional break minutes.
 */
export function calculateWorkingHours(entryTime, exitTime, breakMinutes = 0) {
  if (!entryTime || !exitTime) return 0;
  const [inH, inM] = entryTime.split(":").map(Number);
  const [outH, outM] = exitTime.split(":").map(Number);
  if (Number.isNaN(inH) || Number.isNaN(outH)) return 0;
  let diffMinutes = outH * 60 + outM - (inH * 60 + inM) - Number(breakMinutes || 0);
  if (diffMinutes < 0) diffMinutes += 24 * 60;
  return Math.max(0, Math.round((diffMinutes / 60) * 100) / 100);
}

/**
 * Computes Monthly Attendance, Comp-Off, LOP, Accrued Salary So Far, and Final Net Pay
 * following the Aaruni Tech Standard Operating Procedure (SOP).
 */
export function calculateMonthlyPayroll({
  employee,
  yearMonth, // e.g. "2026-11"
  throughDate, // e.g. "2026-11-09" or end of month "2026-11-30"
  timesheets = [],
  holidays = [],
  approvedCompOffHours = 0,
  activeLoanDeduction = 0,
  bonusAmount = 0,
}) {
  const [year, month] = yearMonth.split("-").map(Number);
  const calendarDays = new Date(year, month, 0).getDate();
  const fullDayHours = Number(employee.shiftHours || 8);
  const monthlyCtc = Number(employee.monthlyCtc || 0);
  const dailyRate = calendarDays > 0 ? monthlyCtc / calendarDays : 0;

  const holidaySet = new Set(holidays.map((h) => h.date));
  const byDate = new Map();
  for (const ts of timesheets) {
    if (ts.empId === employee.id && ts.date && ts.date.startsWith(yearMonth)) {
      byDate.set(ts.date, ts);
    }
  }

  let coveredDays = 0;
  let paidSundays = 0;
  let paidHolidays = 0;
  let regularHoursWorked = 0;
  let sundayExtraHours = 0;
  let shortHours = 0;
  let unexcusedAbsentDays = 0;
  let workedDaysCount = 0;

  const limitDay = throughDate
    ? Math.min(calendarDays, Number(throughDate.split("-")[2] || calendarDays))
    : calendarDays;

  for (let d = 1; d <= limitDay; d++) {
    coveredDays++;
    const dateStr = `${yearMonth}-${String(d).padStart(2, "0")}`;
    const dt = new Date(year, month - 1, d);
    const isSunday = dt.getDay() === 0;
    const isHoliday = holidaySet.has(dateStr);
    const entry = byDate.get(dateStr);
    const hrs = entry ? Number(entry.hours || 0) : 0;

    if (isSunday) {
      paidSundays++;
      if (hrs > 0) {
        sundayExtraHours += hrs;
        workedDaysCount++;
      }
    } else if (isHoliday) {
      paidHolidays++;
      if (hrs > 0) {
        sundayExtraHours += hrs;
        workedDaysCount++;
      }
    } else {
      if (hrs > 0) {
        workedDaysCount++;
        regularHoursWorked += hrs;
        if (hrs < fullDayHours) {
          shortHours += fullDayHours - hrs;
        }
      } else if (entry && entry.status === "Approved Paid Leave") {
        regularHoursWorked += fullDayHours;
      } else {
        unexcusedAbsentDays += 1;
      }
    }
  }

  // Comp-off offset (Sunday extra hours can offset short hours or weekday absence 1:1 on admin approval)
  const usableOffsetHours = Math.min(
    sundayExtraHours,
    approvedCompOffHours > 0 ? approvedCompOffHours : sundayExtraHours
  );
  const shortHoursAfterOffset = Math.max(0, shortHours - usableOffsetHours);
  const remainingCompOffHours = Math.max(0, usableOffsetHours - shortHours);
  const absentDaysAfterCompOff = Math.max(
    0,
    unexcusedAbsentDays - Math.floor(remainingCompOffHours / fullDayHours)
  );

  const shortHourLopDays = Math.round((shortHoursAfterOffset / fullDayHours) * 1000) / 1000;
  const totalLopDays = Math.round((absentDaysAfterCompOff + shortHourLopDays) * 1000) / 1000;

  // Accrued days so far vs Full Month Payable Days
  const accruedPayableDays = Math.max(0, coveredDays - totalLopDays);
  const accruedGrossSoFar = Math.round(dailyRate * accruedPayableDays);

  const fullMonthPayableDays = Math.max(0, calendarDays - totalLopDays);
  const earnedGrossPay = Math.round(dailyRate * fullMonthPayableDays) + Number(bonusAmount || 0);
  const basicPay = Math.round((earnedGrossPay - Number(bonusAmount || 0)) * 0.5);
  const fixedAllowance = earnedGrossPay - Number(bonusAmount || 0) - basicPay;
  const netPay = Math.max(0, earnedGrossPay - Number(activeLoanDeduction || 0));

  return {
    empId: employee.id,
    empName: employee.name,
    yearMonth,
    calendarDays,
    coveredDays,
    workedDaysCount,
    paidSundays,
    paidHolidays,
    regularHoursWorked,
    sundayExtraHours,
    totalHoursWorked: regularHoursWorked + sundayExtraHours,
    shortHours,
    totalLopDays,
    accruedPayableDays,
    accruedGrossSoFar,
    fullMonthPayableDays,
    monthlyCtc,
    dailyRate: Math.round(dailyRate * 100) / 100,
    basicPay,
    fixedAllowance,
    bonusAmount: Number(bonusAmount || 0),
    earnedGrossPay,
    loanDeduction: Number(activeLoanDeduction || 0),
    netPay,
    netPayInWords: numberToIndianRupeeWords(netPay),
  };
}

/**
 * Converts a number into Indian Rupee Words matching Zoho Payroll format:
 * e.g. 7500 -> "Indian Rupee Seven Thousand Five Hundred Only"
 */
export function numberToIndianRupeeWords(amount) {
  const num = Math.round(Number(amount || 0));
  if (num === 0) return "Indian Rupee Zero Only";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];
  function twoDigit(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }
  function convert(n) {
    let out = "";
    if (n >= 10000000) {
      out += convert(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      out += twoDigit(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      out += twoDigit(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    if (n >= 100) {
      out += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 0) {
      out += twoDigit(n);
    }
    return out.trim();
  }
  return `Indian Rupee ${convert(num)} Only`;
}
