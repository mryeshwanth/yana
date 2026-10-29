"use client";

type Option<T extends string> = {
  id: T;
  label: string;
  count: number;
};

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
}) {
  return (
    <div className="mt-6 flex rounded-[4px] border border-line bg-white p-0.5" role="tablist">
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.id)}
            className={`min-w-0 flex-1 rounded-[4px] px-2 py-2 text-sm ${
              selected ? "bg-ink font-medium text-paper" : "text-ink-soft"
            }`}
          >
            {option.label} ({option.count})
          </button>
        );
      })}
    </div>
  );
}
