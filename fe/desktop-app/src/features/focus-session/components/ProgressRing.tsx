import "../pages/ActiveView.css";

interface ProgressRingProps {
  radius: number;
  stroke: number;
  progress: number;
  color: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  radius,
  stroke,
  progress,
  color,
  children,
}: ProgressRingProps) {
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;

  return (
    <div
      className="progress-ring-wrapper"
      style={{
        width: radius * 2,
        height: radius * 2,
        ["--circumference" as any]: circumference,
        ["--total-progress" as any]: progress,
      }}
    >
      <svg height={radius * 2} width={radius * 2} className="progress-ring-svg">
        <circle
          stroke="#F1F5F9"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className="progress-ring-circle-fill"
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="progress-ring-content">{children}</div>
    </div>
  );
}
