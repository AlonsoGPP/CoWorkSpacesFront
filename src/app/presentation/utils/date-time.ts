export interface TimeOption {
  value: string;
  label: string;
}

export interface DateTimeRangeDefaults {
  startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
}

function padTwoDigits(value: number): string {
  return value.toString().padStart(2, '0');
}

function toTimeValue(date: Date): string {
  return `${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}`;
}

function roundDateToStep(date: Date, stepMinutes: number): Date {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const flooredMinutes = Math.floor(minutes / stepMinutes) * stepMinutes;
  rounded.setMinutes(flooredMinutes, 0, 0);
  return rounded;
}

export function buildTimeOptions(stepMinutes = 15): TimeOption[] {
  const options: TimeOption[] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += stepMinutes) {
      const value = `${padTwoDigits(hour)}:${padTwoDigits(minute)}`;
      options.push({ value, label: value });
    }
  }

  return options;
}

export function combineDateAndTimeToIso(dateValue: unknown, timeValue: unknown): string | null {
  if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) {
    return null;
  }

  if (typeof timeValue !== 'string' || !/^\d{2}:\d{2}$/.test(timeValue)) {
    return null;
  }

  const [hours, minutes] = timeValue.split(':').map((value) => Number(value));
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  const dateTime = new Date(dateValue);
  dateTime.setHours(hours, minutes, 0, 0);

  if (Number.isNaN(dateTime.getTime())) {
    return null;
  }

  return dateTime.toISOString();
}

export function getDefaultDateTimeRange(
  durationMinutes = 60,
  stepMinutes = 15,
  startAt = new Date()
): DateTimeRangeDefaults {
  const startDateTime = roundDateToStep(startAt, stepMinutes);
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60_000);

  return {
    startDate: startDateTime,
    startTime: toTimeValue(startDateTime),
    endDate: endDateTime,
    endTime: toTimeValue(endDateTime)
  };
}
