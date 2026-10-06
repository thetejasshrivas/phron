import { expect, test } from "@jest/globals";
import { expectedPayday, cycleDayIndex, remainingCycleDays, financialDateAt } from "@/domain/dates";

test.each([[2024,2,31,"2024-02-29"],[2025,2,31,"2025-02-28"],[2026,4,31,"2026-04-30"],[2026,10,15,"2026-10-15"],[2000,2,30,"2000-02-29"],[1900,2,30,"1900-02-28"],[1,1,1,"0001-01-01"]])("D05 anchor clamp %s/%s/%s", (year,month,anchor,expected) => expect(expectedPayday(year as number, month as number, anchor as number)).toBe(expected));
test("non-first anchor counts today and excludes payday", () => {
  expect(remainingCycleDays("2026-10-20","2026-11-15")).toEqual({status:"ready",remainingDays:26});
  expect(cycleDayIndex("2026-10-15","2026-10-20")).toBe(6);
  expect(cycleDayIndex("2026-10-15","2026-10-15")).toBe(1);
});
test.each([["2026-10-31","2026-11-01",1],["2026-10-30","2026-11-01",2],["2024-02-28","2024-03-01",2],["2025-02-28","2025-03-01",1],["2026-12-31","2027-01-01",1]])("date interval %s -> %s", (today,payday,days) => expect(remainingCycleDays(today as string,payday as string)).toEqual({status:"ready",remainingDays:days}));
test.each(["2026-11-15","2026-11-16"])("due/overdue %s explicitly blocks D05-extension", today => expect(remainingCycleDays(today,"2026-11-15")).toEqual({status:"blocked",decision:"D05-extension"}));
test("IST midnight is independent of machine timezone", () => {
  expect(financialDateAt("2026-10-05T18:29:59.999Z")).toBe("2026-10-05");
  expect(financialDateAt("2026-10-05T18:30:00.000Z")).toBe("2026-10-06");
});
test("IST conversion preserves the supported four-digit year range", () => {
  expect(financialDateAt("0001-01-01T00:00:00.000Z")).toBe("0001-01-01");
  expect(financialDateAt("9999-12-31T00:00:00.000Z")).toBe("9999-12-31");
  expect(expectedPayday(9999,12,31)).toBe("9999-12-31");
});
test.each([[0,1,1],[10000,1,1],[2026,0,1],[2026,13,1],[2026,1,0],[2026,1,32],[2026,1,1.5]])("invalid calendar input %p", (y,m,a) => expect(() => expectedPayday(y,m,a)).toThrow());
test("invalid/reversed dates are rejected", () => {
  expect(() => remainingCycleDays("2025-02-29","2025-03-01")).toThrow();
  expect(() => cycleDayIndex("2026-10-20","2026-10-19")).toThrow();
});
test.each(["2026-10-05","2026-02-30T00:00:00.000Z","garbage","9999-12-31T23:00:00.000Z"])("invalid/out-of-calendar instant %s", instant => expect(() => financialDateAt(instant)).toThrow());
