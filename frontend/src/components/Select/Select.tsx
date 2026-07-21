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
      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 dark:border-slate-600 dark:bg-slate-700"
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