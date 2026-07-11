export declare function ReminderTimePicker(props: {
  hour: number;
  minute: string;
  period: "AM" | "PM";
  disabled?: boolean;
  onChange: (hour: number, minute: string, period: "AM" | "PM") => void;
}): import("react").ReactElement;
