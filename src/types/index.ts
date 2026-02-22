export interface AladhanTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  Firstthird: string;
  Lastthird: string;
}

export interface AladhanDate {
  readable: string;
  timestamp: string;
  hijri: {
    date: string;
    format: string;
    day: string;
    weekday: { en: string; ar: string };
    month: { number: number; en: string; ar: string };
    year: string;
    designation: { abbreviated: string; expanded: string };
    holidays: string[];
  };
  gregorian: {
    date: string;
    format: string;
    day: string;
    weekday: { en: string };
    month: { number: number; en: string };
    year: string;
    designation: { abbreviated: string; expanded: string };
  };
}

export interface AladhanData {
  timings: AladhanTimings;
  date: AladhanDate;
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: {
      id: number;
      name: string;
    };
  };
}

export interface AladhanResponse {
  code: number;
  status: string;
  data: AladhanData;
}

export type PrayerName = 'Imsak' | 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export interface PrayerTime {
  name: PrayerName;
  time: string;
  timestamp: number;
  preAdhanTimestamp: number;
  preAdhanTime: string;
}

export interface PrayerSchedule {
  date: string;
  hijriDate: string;
  hijriMonth: string;
  hijriYear: string;
  prayers: PrayerTime[];
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

export interface CityOption {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface Profile {
  id: string;
  updated_at: string;
  username: string | null;
  location_data: LocationData | null;
}

export interface Agenda {
  id: string;
  user_id: string;
  task_name: string;
  target_time: string;
  is_notified: boolean;
  created_at: string;
}

export interface AgendaInsert {
  task_name: string;
  target_time: string;
  user_id: string;
}

export interface AgendaUpdate {
  task_name?: string;
  target_time?: string;
  is_notified?: boolean;
}
