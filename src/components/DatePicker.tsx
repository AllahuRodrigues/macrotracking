"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  APP_TIMEZONE,
  APP_TIMEZONE_LABEL,
  calendarDateToISO,
  dateISOToCalendarDate,
  formatDateMedium,
  formatDateShort,
  isTodayISO,
  shiftDateISO,
  todayISO,
} from "@/lib/timezone";
import { Button } from "./ui";

interface DateNavProps {
  value: string;
  onChange: (iso: string) => void;
  compact?: boolean;
}

/** Header control: prev / calendar popover / next */
export function DateNav({ value, onChange, compact }: DateNavProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="flex items-center gap-1" ref={ref}>
      <Button
        variant="ghost"
        type="button"
        aria-label="Previous day"
        onClick={() => onChange(shiftDateISO(value, -1))}
      >
        <ChevronLeft size={18} />
      </Button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] font-medium transition-colors hover:border-[var(--accent)] ${
            compact ? "px-2 py-1.5 text-xs" : "px-3 py-1.5 text-sm"
          }`}
        >
          <Calendar size={compact ? 14 : 16} className="shrink-0 text-[var(--accent)]" />
          <span className={compact ? "hidden sm:inline" : ""}>
            {compact ? formatDateShort(value) : formatDateMedium(value)}
          </span>
          {compact && <span className="sm:hidden">{formatDateShort(value)}</span>}
        </button>

        {open && (
          <CalendarPopover
            value={value}
            onSelect={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
            align="right"
          />
        )}
      </div>

      <Button
        variant="ghost"
        type="button"
        aria-label="Next day"
        onClick={() => onChange(shiftDateISO(value, 1))}
      >
        <ChevronRight size={18} />
      </Button>
    </div>
  );
}

interface DatePickerFieldProps {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
  className?: string;
  disabled?: boolean;
}

/** Form field with calendar popover */
export function DatePickerField({
  label,
  value,
  onChange,
  className = "",
  disabled = false,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className={`block space-y-1 ${className}`} ref={ref}>
      {label && <span className="text-xs text-[var(--muted)]">{label}</span>}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={`flex w-full items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-left text-sm outline-none transition-colors ${
            disabled
              ? "cursor-default opacity-70"
              : "hover:border-[var(--accent)] focus:border-[var(--accent)]"
          }`}
        >
          <Calendar size={16} className="shrink-0 text-[var(--accent)]" />
          <span className="flex-1">{formatDateMedium(value)}</span>
        </button>
        {open && !disabled && (
          <CalendarPopover
            value={value}
            onSelect={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
            align="left"
          />
        )}
      </div>
    </div>
  );
}

function CalendarPopover({
  value,
  onSelect,
  onClose,
  align,
}: {
  value: string;
  onSelect: (iso: string) => void;
  onClose: () => void;
  align: "left" | "right";
}) {
  const selected = dateISOToCalendarDate(value);

  return (
    <div
      className={`absolute top-full z-50 mt-2 min-w-[280px] rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-3 shadow-xl ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      <DayPicker
        mode="single"
        timeZone={APP_TIMEZONE}
        selected={selected}
        defaultMonth={selected}
        onSelect={(d) => {
          if (d) onSelect(calendarDateToISO(d));
        }}
        disabled={{ after: dateISOToCalendarDate(todayISO()) }}
        classNames={{
          root: "rdp-root",
          months: "rdp-months",
          month: "rdp-month",
          month_caption: "rdp-month_caption",
          caption_label: "rdp-caption_label",
          nav: "rdp-nav",
          button_previous: "rdp-button_previous",
          button_next: "rdp-button_next",
          weekdays: "rdp-weekdays",
          weekday: "rdp-weekday",
          week: "rdp-week",
          day: "rdp-day",
          day_button: "rdp-day_button",
          selected: "rdp-selected",
          today: "rdp-today",
          outside: "rdp-outside",
          disabled: "rdp-disabled",
        }}
      />
      <div className="mt-2 flex items-center justify-between border-t border-[var(--card-border)] pt-2">
        {!isTodayISO(value) ? (
          <button
            type="button"
            className="text-xs font-medium text-[var(--accent)] hover:underline"
            onClick={() => {
              onSelect(todayISO());
              onClose();
            }}
          >
            Jump to today (SF)
          </button>
        ) : (
          <span className="text-xs text-[var(--muted)]">Today in SF</span>
        )}
        <span className="text-[10px] text-[var(--muted)]">{APP_TIMEZONE_LABEL}</span>
      </div>
    </div>
  );
}
