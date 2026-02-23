import { AladhanResponse, PrayerSchedule, PrayerTime, PrayerName } from '@/types';

const PRAYER_NAMES: PrayerName[] = [
    'Imsak', 'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha',
];

function parseTime(timeStr: string, dateStr: string): number {
    const clean = timeStr.replace(/\s*\(.*\)/, '');
    const [hours, minutes] = clean.split(':').map(Number);
    const date = new Date(dateStr + 'T00:00:00');
    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
}

function formatTime(timestamp: number): string {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function subtractMinutes(timestamp: number, minutes: number): number {
    return timestamp - minutes * 60 * 1000;
}

export async function fetchPrayerTimes(
    latitude: number,
    longitude: number,
    date?: Date
): Promise<PrayerSchedule> {
    const d = date || new Date();
    const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
    const isoDate = d.toISOString().split('T')[0];

    const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=11`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const json: AladhanResponse = await response.json();

    if (json.code !== 200) {
        throw new Error(`Aladhan API returned code ${json.code}`);
    }

    const { timings, date: aladhanDate } = json.data;

    const timingsMap: Record<PrayerName, string> = {
        Imsak: timings.Imsak,
        Fajr: timings.Fajr,
        Sunrise: timings.Sunrise,
        Dhuhr: timings.Dhuhr,
        Asr: timings.Asr,
        Maghrib: timings.Maghrib,
        Isha: timings.Isha,
    };

    const prayers: PrayerTime[] = PRAYER_NAMES.map((name) => {
        const timestamp = parseTime(timingsMap[name], isoDate);
        const preAdhanTimestamp = subtractMinutes(timestamp, 10);

        return {
            name,
            time: formatTime(timestamp),
            timestamp,
            preAdhanTimestamp,
            preAdhanTime: formatTime(preAdhanTimestamp),
        };
    });

    const imsak = prayers.find((p) => p.name === 'Imsak');
    const fajr = prayers.find((p) => p.name === 'Fajr');
    if (imsak && fajr && imsak.timestamp > fajr.timestamp) {
        imsak.timestamp = subtractMinutes(fajr.timestamp, 10);
        imsak.time = formatTime(imsak.timestamp);
        imsak.preAdhanTimestamp = subtractMinutes(imsak.timestamp, 10);
        imsak.preAdhanTime = formatTime(imsak.preAdhanTimestamp);
    }

    return {
        date: aladhanDate.gregorian.date,
        hijriDate: `${aladhanDate.hijri.day} ${aladhanDate.hijri.month.en} ${aladhanDate.hijri.year}`,
        hijriMonth: aladhanDate.hijri.month.en,
        hijriYear: aladhanDate.hijri.year,
        prayers,
    };
}

export function getNextPrayer(prayers: PrayerTime[]): PrayerTime | null {
    const now = Date.now();
    const prayerOnly = prayers.filter((p) => p.name !== 'Sunrise' && p.name !== 'Imsak');
    for (const prayer of prayerOnly) {
        if (prayer.timestamp > now) {
            return prayer;
        }
    }
    return null;
}

export function getCountdown(targetTimestamp: number): string {
    const diff = targetTimestamp - Date.now();
    if (diff <= 0) return '00:00:00';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
