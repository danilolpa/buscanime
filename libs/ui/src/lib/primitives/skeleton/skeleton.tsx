import { cn } from '../../utils/cn';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  rounded?: boolean;
  className?: string;
}

export function Skeleton({
  width,
  height,
  rounded = false,
  className,
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn(
        'animate-pulse bg-black/10',
        rounded ? 'rounded-full' : 'rounded-sm',
        className,
      )}
    />
  );
}
