import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

function IndustryTrendsBubbles({ data, onBubbleClick }) {
  const svgRef = useRef();
  const containerRef = useRef();
  const [tooltip, setTooltip] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Responsive redraw function
  const redrawChart = useCallback((containerWidth, containerHeight) => {
    if (!data || !data.trends || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Calculate responsive dimensions
    const size = Math.max(Math.min(containerWidth, containerHeight) - 24, 460);
    const clampedSize = Math.min(size, 640);
    const margin = clampedSize * 0.04;

    // Dynamic font sizing
    const baseFontSize = Math.max(11, Math.min(14, clampedSize / 70));

    // Color scale based on growth rate (fixed to match actual percentage values)
    const getColor = (growthRate) => {
      // Handle percentage strings like "+41.2%" or "-5%"
      let rate = growthRate;
      if (typeof growthRate === 'string') {
        const match = growthRate.match(/([+-]?\d+\.?\d*)/);
        rate = match ? parseFloat(match[1]) : 0;
      }

      if (rate >= 30) return "#10b981"; // Bright green - very hot (30%+)
      if (rate >= 15) return "#22c55e"; // Green - hot (15-30%)
      if (rate >= 0) return "#f59e0b"; // Yellow/Amber - stable (0-15%)
      return "#ef4444"; // Red - shrinking (<0%)
    };

    // Create pack layout with better padding to prevent overlaps
    const pack = d3.pack()
      .size([clampedSize - margin * 2, clampedSize - margin * 2])
      .padding(clampedSize * 0.06); // Increased padding for better spacing

    // Prepare hierarchy with better size calculation
    const root = pack(d3.hierarchy({ children: data.trends })
      .sum(d => {
        // Parse growth rate properly
        let rate = d.growth_rate || 0;
        if (typeof rate === 'string') {
          const match = rate.match(/([+-]?\d+\.?\d*)/);
          rate = match ? parseFloat(match[1]) : 0;
        }
        // Use absolute value for size, ensure minimum size
        return Math.max(30, Math.abs(rate) * 3 + 40);
      }));

    // Create SVG with responsive viewBox
    const svg = d3.select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${clampedSize} ${clampedSize}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("style", `max-width: 100%; height: auto; font: ${baseFontSize}px sans-serif;`)
      .attr("text-anchor", "middle");

    // Create nodes
    const node = svg.append("g")
      .attr("transform", `translate(${margin}, ${margin})`)
      .selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .on("mouseover", function (event, d) {
        const containerRect = containerRef.current.getBoundingClientRect();
        setTooltip({
          x: event.clientX - containerRect.left,
          y: event.clientY - containerRect.top,
          data: d.data
        });

        // Scale up on hover
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", d.r * 1.1)
          .attr("fill-opacity", 0.9);
      })
      .on("mouseout", function () {
        setTooltip(null);

        // Scale back down
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", d => d.r)
          .attr("fill-opacity", 0.7);
      })
      .on("click", (event, d) => {
        if (onBubbleClick) onBubbleClick(d.data);
      })
      .style("cursor", "pointer");

    // Add circles with animation and better styling
    node.append("circle")
      .attr("r", 0)
      .attr("fill", d => getColor(d.data.growth_rate || 0))
      .attr("fill-opacity", 0.75)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 3)
      .attr("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
      .transition()
      .duration(1000)
      .ease(d3.easeBackOut)
      .attr("r", d => d.r);

    // Add text labels with responsive sizing and better visibility
    const text = node.append("text")
      .attr("clip-path", d => `circle(${d.r * 0.95})`) // Slightly smaller clip to prevent text overflow
      .attr("fill", "#ffffff")
      .attr("font-weight", "700")
      .attr("font-size", d => Math.min(d.r / 4.2, baseFontSize * 1.3))
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 0.5)
      .attr("paint-order", "stroke")
      .attr("opacity", 0)
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", "middle");

    // Industry name - better text wrapping and visibility
    text.append("tspan")
      .attr("x", 0)
      .attr("y", "-0.4em")
      .attr("font-size", d => Math.min(d.r / 3.8, baseFontSize * 1.4))
      .attr("font-weight", "800")
      .text(d => {
        const industry = d.data.industry || "Industry";
        // Better text truncation based on bubble size
        const maxChars = Math.floor(d.r / 3);
        if (industry.length > maxChars) {
          // Try to break at word boundaries
          const words = industry.split(' ');
          let result = '';
          for (const word of words) {
            if ((result + word).length <= maxChars - 3) {
              result += (result ? ' ' : '') + word;
            } else {
              break;
            }
          }
          return result || industry.substring(0, maxChars - 3) + '...';
        }
        return industry;
      });

    // Job posting change - improved formatting with better visibility
    text.append("tspan")
      .attr("x", 0)
      .attr("y", "1.1em")
      .attr("fill-opacity", 1)
      .attr("font-size", d => Math.min(d.r / 4.6, baseFontSize * 1.2))
      .attr("font-weight", "800")
      .attr("fill", "#ffffff")
      .text(d => {
        const change = d.data.job_postings_change || d.data.growth_rate || "0%";
        // Format percentage nicely
        if (typeof change === 'string' && change.includes('%')) {
          return change;
        }
        const num = typeof change === 'number' ? change : parseFloat(change) || 0;
        return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
      });

    // Fade in animation for text
    text.transition()
      .delay(500)
      .duration(500)
      .attr("opacity", 1);

    // Add full industry name as title
    node.append("title")
      .text(d => `${d.data.industry}\nChange: ${d.data.job_postings_change || "0%"}`);

  }, [data, onBubbleClick]);

  // ResizeObserver for handling zoom and window resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
        redrawChart(width, height);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [redrawChart]);

  // Initial draw
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setDimensions({ width: clientWidth, height: clientHeight });
      redrawChart(clientWidth, clientHeight);
    }
  }, [data, redrawChart]);

  return (
    <div className="w-full h-full relative">
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        ●●● Industry Trends Analysis
      </h3>
      {data?.last_updated && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Last updated: {new Date(data.last_updated).toLocaleDateString()}
        </p>
      )}
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Discover which industries are growing or shrinking. Bubble size represents growth rate.
        Hover over bubbles for details, click to explore jobs in that industry.
      </p>
      <div
        ref={containerRef}
        className="w-full flex items-center justify-center rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg chart-container relative bg-white dark:bg-gray-800"
        style={{ padding: '28px', minHeight: '560px', height: 'auto' }}
      >
        <svg ref={svgRef} className="w-full h-full" />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute bg-gray-900 text-white p-3 rounded-lg shadow-xl text-sm z-50 pointer-events-none"
            style={{
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y + 10}px`,
              maxWidth: '250px'
            }}
          >
            <div className="font-bold mb-2">{tooltip.data.industry}</div>
            <div className="mb-1">Change: {tooltip.data.job_postings_change}</div>
            {tooltip.data.top_skills && tooltip.data.top_skills.length > 0 && (
              <div className="text-xs mt-2">
                <div className="font-semibold">Top Skills:</div>
                <ul className="list-disc list-inside">
                  {tooltip.data.top_skills.slice(0, 3).map((skill, i) => (
                    <li key={i}>{skill}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs justify-center items-center">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
          Very Hot (30%+)
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          Hot (15-30%)
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          Stable (0-15%)
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          Shrinking (&lt;0%)
        </span>
      </div>
    </div>
  );
}

export default IndustryTrendsBubbles;