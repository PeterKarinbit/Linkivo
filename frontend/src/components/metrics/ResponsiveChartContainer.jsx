import React, { useEffect, useRef, useState } from 'react';

/**
 * ResponsiveChartContainer
 * A lightweight shell that enforces consistent chart sizing, padding, and responsive behavior.
 * Usage:
 * <ResponsiveChartContainer minHeight={480} maxHeight={620}>
 *   {({ width, height }) => <MyChart width={width} height={height} />}
 * </ResponsiveChartContainer>
 */
function ResponsiveChartContainer({
  className = '',
  style = {},
  minHeight = 480,
  maxHeight = 620,
  padding = 24,
  children
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: minHeight });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const clampedHeight = Math.min(Math.max(height - padding * 2, minHeight), maxHeight);
        setDimensions({
          width: Math.max(width - padding * 2, 0),
          height: clampedHeight
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [minHeight, maxHeight, padding]);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg ${className}`}
      style={{
        padding: `${padding}px`,
        minHeight,
        ...style
      }}
    >
      {typeof children === 'function'
        ? children({ width: dimensions.width, height: dimensions.height })
        : children}
    </div>
  );
}

export default ResponsiveChartContainer;



























