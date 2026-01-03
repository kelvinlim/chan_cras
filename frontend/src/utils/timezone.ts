/**
 * Timezone utilities using Intl.DateTimeFormat for zero-dependency TZ support.
 */

/**
 * Converts a UTC date string or Date object to a Date object in the target timezone.
 * Note: Since JS Date is always "system local", we return a Date whose "local" 
 * components match the target timezone's components.
 */
export function fromUTC(utcDate: string | Date, timezone: string = 'Asia/Hong_Kong'): Date {
    const date = typeof utcDate === 'string' ? new Date(utcDate + 'Z') : utcDate;

    // We use Intl to get the parts in the target TZ
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    }).formatToParts(date);

    const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0');

    return new Date(
        getPart('year'),
        getPart('month') - 1,
        getPart('day'),
        getPart('hour'),
        getPart('minute'),
        getPart('second')
    );
}

/**
 * Converts a local date-time string (e.g. from an input) in a target timezone to UTC ISO string.
 */
export function toUTC(localDateStr: string, timezone: string = 'Asia/Hong_Kong'): string {
    // localDateStr is usually YYYY-MM-DDTHH:mm from <input type="datetime-local">
    const date = new Date(localDateStr);

    // This is tricky without a heavy library. 
    // We can calculate the offset by comparing local and target TZ
    const now = new Date();
    const targetTZDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const offset = now.getTime() - targetTZDate.getTime();

    const finalDate = new Date(date.getTime() + offset);
    return finalDate.toISOString();
}

/**
 * Formats a date for display in the target timezone.
 */
export function formatInTZ(date: string | Date, timezone: string, formatOptions: Intl.DateTimeFormatOptions = {}): string {
    const d = typeof date === 'string' ? new Date(date + (date.endsWith('Z') ? '' : 'Z')) : date;
    return new Intl.DateTimeFormat('en-HK', {
        timeZone: timezone,
        ...formatOptions
    }).format(d);
}
