/**
 * Copyright (c) 2026 Coworx UK. All rights reserved.
 */

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

function Select({
  value,
  onChange,
  options,
}: Props) {
  return (
    <select
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className="w-full rounded-lg px-4 py-2 app-select"
    >
      <option value="">
        Select Bucket
      </option>

      {options.map((bucket) => (
        <option
          key={bucket}
          value={bucket}
        >
          {bucket}
        </option>
      ))}
    </select>
  );
}

export default Select;