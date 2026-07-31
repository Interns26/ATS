type CircularProgressProps = {
  score: number;
};

function CircularProgress({ score }: CircularProgressProps) {
  const radius = 70;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const strokeDashoffset =
    circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 85) return "#16a34a";
    if (score >= 70) return "#ca8a04";
    return "#dc2626";
  };

  return (
    <div className="flex items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="-rotate-90"
      >
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />

        <circle
          stroke={getColor()}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-700"
        />
      </svg>

      <div className="absolute text-center">
        <p className="text-4xl font-bold">
          {score}
        </p>

        <p className="text-sm muted">
          ATS
        </p>
      </div>
    </div>
  );
}

export default CircularProgress;