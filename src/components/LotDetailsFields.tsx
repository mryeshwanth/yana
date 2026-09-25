"use client";

import { Circle, RadioButton } from "@phosphor-icons/react";
import { LOT_KINDS, type LotKind } from "@/lib/lot-kinds";
import {
  HOURS_12,
  MINUTES,
  type ClockTime,
  type DayPeriod,
  type LotFormState,
  type PriceKind,
  type PriceUnit,
} from "@/lib/lot-form";

export function LotDetailsFields({
  value,
  onChange,
}: {
  value: LotFormState;
  onChange: (next: LotFormState) => void;
}) {
  const showAmount = value.priceKind !== "free";

  return (
    <>
      <input
        required
        value={value.name}
        onChange={(event) => onChange({ ...value, name: event.target.value })}
        placeholder="Lot name"
        className="rounded-[4px] border border-line px-4 py-3"
      />
      <select
        required
        value={value.lotKind}
        onChange={(event) => onChange({ ...value, lotKind: event.target.value as LotKind | "" })}
        className="rounded-[4px] border border-line px-4 py-3 text-ink"
      >
        <option value="" disabled>
          Lot type
        </option>
        {LOT_KINDS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-ink-soft">Price</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Price">
          {(
            [
              { id: "free", label: "Free" },
              { id: "free_paid", label: "Free + paid" },
              { id: "paid", label: "Paid" },
            ] as const
          ).map((option) => {
            const selected = value.priceKind === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() =>
                  onChange({
                    ...value,
                    priceKind: option.id,
                    priceAmount: option.id === "free" ? "" : value.priceAmount,
                  })
                }
                className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[4px] border bg-white px-2 py-3 text-left ${
                  selected ? "border-accent" : "border-line"
                }`}
              >
                {selected ? (
                  <RadioButton size={20} weight="fill" className="shrink-0 text-accent" />
                ) : (
                  <Circle size={20} className="shrink-0 text-ink-soft" />
                )}
                <span className="whitespace-nowrap text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {showAmount && (
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Amount (₹)</span>
            <input
              required
              inputMode="decimal"
              value={value.priceAmount}
              onChange={(event) => onChange({ ...value, priceAmount: event.target.value })}
              placeholder="40"
              className="w-full rounded-[4px] border border-line px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Per</span>
            <select
              value={value.priceUnit}
              onChange={(event) => onChange({ ...value, priceUnit: event.target.value as PriceUnit })}
              className="w-full rounded-[4px] border border-line px-4 py-3"
            >
              <option value="hour">Hour</option>
              <option value="day">Day</option>
              <option value="visit">Visit</option>
            </select>
          </label>
        </div>
      )}
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-ink-soft">Operating hours</p>
        <div className="grid grid-cols-2 gap-3">
          <ClockPicker
            label="Start"
            value={value.opensAt}
            onChange={(opensAt) => onChange({ ...value, opensAt })}
          />
          <ClockPicker
            label="End"
            value={value.closesAt}
            onChange={(closesAt) => onChange({ ...value, closesAt })}
          />
        </div>
      </div>
      <textarea
        value={value.notes}
        onChange={(event) => onChange({ ...value, notes: event.target.value })}
        placeholder="Notes"
        className="min-h-20 rounded-[4px] border border-line px-4 py-3"
      />
    </>
  );
}

function ClockPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ClockTime;
  onChange: (value: ClockTime) => void;
}) {
  const field = "rounded-[4px] border border-line px-2 py-3 text-sm";
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-soft">{label}</span>
      <span className="grid grid-cols-[1fr_1fr_4.5rem] gap-1">
        <select
          value={value.hour}
          onChange={(event) => onChange({ ...value, hour: event.target.value })}
          className={field}
        >
          <option value="">Hr</option>
          {HOURS_12.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
        <select
          value={value.minute}
          onChange={(event) => onChange({ ...value, minute: event.target.value })}
          className={field}
        >
          <option value="">Min</option>
          {MINUTES.map((minute) => (
            <option key={minute} value={minute}>
              {minute}
            </option>
          ))}
        </select>
        <select
          value={value.period}
          onChange={(event) => onChange({ ...value, period: event.target.value as DayPeriod })}
          className={field}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </span>
    </label>
  );
}
