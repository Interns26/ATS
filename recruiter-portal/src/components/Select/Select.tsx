/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
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