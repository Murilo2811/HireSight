import React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => {
    const progressValue = value ?? 0;
    
    const getProgressColor = (val: number) => {
        if (val < 60) return 'bg-destructive';
        if (val < 80) return 'bg-yellow-500';
        return 'bg-green-500';
    }

    return (
      <div
        ref={ref}
        className={`relative h-2 w-full overflow-hidden rounded-full bg-secondary ${className}`}
        {...props}
      >
        <div
          className={`h-full w-full flex-1 ${getProgressColor(progressValue)} transition-all duration-500 ease-out`}
          style={{ transform: `translateX(-${100 - progressValue}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
