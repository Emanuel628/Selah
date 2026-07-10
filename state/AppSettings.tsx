import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

type Settings = { darkMode: boolean; setDarkMode: (v: boolean) => void; showVerseNumbers: boolean; setShowVerseNumbers: (v: boolean) => void; redLettering: boolean; setRedLettering: (v: boolean) => void; reminderHour: number; setReminderHour: (v: number) => void; reminderMinute: string; setReminderMinute: (v: string) => void; reminderPeriod: 'AM'|'PM'; setReminderPeriod: (v: 'AM'|'PM') => void; reminderDays: number[]; setReminderDays: (v: number[]) => void };
const Context = createContext<Settings | null>(null);

export function AppSettingsProvider({ children }: PropsWithChildren) {
  const [darkMode, setDarkMode] = useState(true);
  const [showVerseNumbers, setShowVerseNumbers] = useState(true);
  const [redLettering, setRedLettering] = useState(true);
  const [reminderHour, setReminderHour] = useState(8);
  const [reminderMinute, setReminderMinute] = useState('00');
  const [reminderPeriod, setReminderPeriod] = useState<'AM'|'PM'>('AM');
  const [reminderDays, setReminderDays] = useState([1,2,3,4,5]);
  const value = useMemo(() => ({ darkMode, setDarkMode, showVerseNumbers, setShowVerseNumbers, redLettering, setRedLettering, reminderHour, setReminderHour, reminderMinute, setReminderMinute, reminderPeriod, setReminderPeriod, reminderDays, setReminderDays }), [darkMode, showVerseNumbers, redLettering, reminderHour, reminderMinute, reminderPeriod, reminderDays]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAppSettings() { const value = useContext(Context); if (!value) throw new Error('Missing AppSettingsProvider'); return value; }
