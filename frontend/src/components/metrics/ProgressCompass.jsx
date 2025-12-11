import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

/**
 * ProgressCompass - A D3.js compass/radar chart for career progress tracking
 * Shows progress across different career dimensions
 */
function ProgressCompass({ data }) {
    const svgRef = useRef();
    const containerRef = useRef();
    const [tooltip, setTooltip] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Process data into radar format
    const processData = useCallback((rawData) => {
        if (!rawData) return null;

        // Default dimensions if not provided
        const defaultDimensions = [
            { axis: 'Technical Skills', current: 0, target: 100 },
            { axis: 'Soft Skills', current: 0, target: 100 },
            { axis: 'Experience', current: 0, target: 100 },
            { axis: 'Education', current: 0, target: 100 },
            { axis: 'Network', current: 0, target: 100 },
            { axis: 'Industry Knowledge', current: 0, target: 100 }
        ];

        // Use provided dimensions or map from raw data
        if (rawData.dimensions && Array.isArray(rawData.dimensions)) {
            return rawData.dimensions.map(d => ({
                axis: d.name || d.axis || 'Unknown',
                current: d.current || d.value || d.score || 0,
                target: d.target || d.max || 100,
                description: d.description || ''
            }));
        }

        // Try to extract from various data formats
        if (rawData.skills) {
            return [
                { axis: 'Technical Skills', current: rawData.skills.technical || 0, target: 100 },
                { axis: 'Soft Skills', current: rawData.skills.soft || 0, target: 100 },
                { axis: 'Experience', current: rawData.experience || 0, target: 100 },
                { axis: 'Education', current: rawData.education || 0, target: 100 },
                { axis: 'Network', current: rawData.network || 0, target: 100 },
                { axis: 'Industry Knowledge', current: rawData.industry || 0, target: 100 }
            ];
        }

        // Use raw values if they match expected format
        if (rawData.technical_skills !== undefined) {
            return [
                { axis: 'Technical Skills', current: rawData.technical_skills, target: 100 },
                { axis: 'Soft Skills', current: rawData.soft_skills || 0, target: 100 },
                { axis: 'Experience', current: rawData.experience_level || 0, target: 100 },
                { axis: 'Education', current: rawData.education_level || 0, target: 100 },
                { axis: 'Network', current: rawData.network_strength || 0, target: 100 },
                { axis: 'Industry Knowledge', current: rawData.industry_knowledge || 0, target: 100 }
            ];
        }

        return defaultDimensions;
    }, []);

    // Redraw chart function
    const redrawChart = useCallback((containerWidth, containerHeight) => {
        if (!data || !svgRef.current) return;

        const processedData = processData(data);
        if (!processedData || processedData.length === 0) return;

        // Clear previous chart
        d3.select(svgRef.current).selectAll("*").remove();

        // Calculate responsive dimensions
        const size = Math.max(Math.min(containerWidth, containerHeight) - 24, 420);
        const clampedSize = Math.min(size, 640);
        const radius = clampedSize / 2 - 54;
        const levels = 5; // Number of concentric circles

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${clampedSize} ${clampedSize}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const g = svg.append("g")
            .attr("transform", `translate(${clampedSize / 2}, ${clampedSize / 2})`);

        // Calculate angles
        const angleSlice = (Math.PI * 2) / processedData.length;

        // Scale for radius
        const rScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, radius]);

        // Draw concentric circles (grid)
        for (let level = 1; level <= levels; level++) {
            const levelRadius = (radius / levels) * level;

            g.append("circle")
                .attr("r", levelRadius)
                .style("fill", "none")
                .style("stroke", "#e5e7eb")
                .style("stroke-width", level === levels ? 2 : 1)
                .style("stroke-dasharray", level === levels ? "none" : "3,3");

            // Add level labels
            g.append("text")
                .attr("x", 5)
                .attr("y", -levelRadius)
                .attr("dy", "0.35em")
                .style("font-size", "10px")
                .style("fill", "#9ca3af")
                .text(`${(100 / levels) * level}%`);
        }

        // Draw axis lines and labels
        processedData.forEach((d, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            // Axis line
            g.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", x)
                .attr("y2", y)
                .style("stroke", "#d1d5db")
                .style("stroke-width", 1);

            // Axis label
            const labelRadius = radius + 25;
            const labelX = Math.cos(angle) * labelRadius;
            const labelY = Math.sin(angle) * labelRadius;

            g.append("text")
                .attr("x", labelX)
                .attr("y", labelY)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .style("font-size", "12px")
                .style("font-weight", "700")
                .style("fill", "#374151")
                .text(d.axis);
        });

        // Create radar area path
        const radarLine = d3.lineRadial()
            .radius(d => rScale(d.current))
            .angle((d, i) => i * angleSlice)
            .curve(d3.curveLinearClosed);

        // Draw filled area with animation
        const radarPath = g.append("path")
            .datum(processedData)
            .attr("d", radarLine)
            .style("fill", "rgba(16, 185, 129, 0.3)")
            .style("stroke", "#10b981")
            .style("stroke-width", 2)
            .style("opacity", 0);

        radarPath.transition()
            .duration(1000)
            .style("opacity", 1);

        // Draw target area (dashed line)
        const targetLine = d3.lineRadial()
            .radius(d => rScale(d.target))
            .angle((d, i) => i * angleSlice)
            .curve(d3.curveLinearClosed);

        g.append("path")
            .datum(processedData)
            .attr("d", targetLine)
            .style("fill", "none")
            .style("stroke", "#3b82f6")
            .style("stroke-width", 2)
            .style("stroke-dasharray", "5,5")
            .style("opacity", 0.6);

        // Draw data points
        processedData.forEach((d, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const x = Math.cos(angle) * rScale(d.current);
            const y = Math.sin(angle) * rScale(d.current);

            g.append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 6)
                .style("fill", "#10b981")
                .style("stroke", "#fff")
                .style("stroke-width", 2)
                .style("cursor", "pointer")
                .on("mouseover", function (event) {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("r", 9);

                    const containerRect = containerRef.current.getBoundingClientRect();
                    setTooltip({
                        x: event.clientX - containerRect.left,
                        y: event.clientY - containerRect.top,
                        data: d
                    });
                })
                .on("mouseout", function () {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("r", 6);

                    setTooltip(null);
                });
        });

        // Add center point
        g.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 4)
            .style("fill", "#374151");

    }, [data, processData]);

    // ResizeObserver for handling window resize
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

    // Calculate overall progress
    const getOverallProgress = () => {
        if (!data) return 0;

        const processedData = processData(data);
        if (!processedData || processedData.length === 0) return 0;

        const total = processedData.reduce((sum, d) => sum + (d.current / d.target) * 100, 0);
        return Math.round(total / processedData.length);
    };

    const overallProgress = getOverallProgress();

    return (
        <div className="w-full h-full relative">
            <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    🧭 Career Progress Compass
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Track your progress across key career dimensions. Solid green shows your current level,
                    dashed blue shows your target.
                </p>
            </div>

            {/* Overall Progress Card */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-4 flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{overallProgress}%</div>
                </div>
                <div className="w-16 h-16 relative">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="4"
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="4"
                            strokeDasharray={`${(overallProgress / 100) * 176} 176`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-green-600">{overallProgress}%</span>
                    </div>
                </div>
            </div>

            {/* Chart Container */}
            <div
                ref={containerRef}
                className="w-full flex items-center justify-center rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg relative bg-white dark:bg-gray-800"
                style={{ padding: '20px', minHeight: '350px', height: 'auto' }}
            >
                <svg ref={svgRef} className="w-full h-full" />

                {/* Tooltip */}
                {tooltip && (
                    <div
                        className="absolute bg-gray-900 text-white p-3 rounded-lg shadow-xl text-sm z-50 pointer-events-none"
                        style={{
                            left: `${Math.min(tooltip.x + 10, dimensions.width - 180)}px`,
                            top: `${tooltip.y + 10}px`,
                            maxWidth: '180px'
                        }}
                    >
                        <div className="font-bold mb-1">{tooltip.data.axis}</div>
                        <div className="flex justify-between text-xs">
                            <span>Current:</span>
                            <span className="text-green-400 font-semibold">{tooltip.data.current}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span>Target:</span>
                            <span className="text-blue-400 font-semibold">{tooltip.data.target}%</span>
                        </div>
                        {tooltip.data.description && (
                            <div className="text-xs text-gray-400 mt-1">
                                {tooltip.data.description}
                            </div>
                        )}
                        <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-green-500"
                                style={{ width: `${(tooltip.data.current / tooltip.data.target) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-3 text-xs justify-center items-center">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="w-4 h-1 bg-green-500 rounded"></span>
                    Current Progress
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="w-4 h-1 bg-blue-500 rounded" style={{ borderStyle: 'dashed', borderWidth: '1px', background: 'none', borderColor: '#3b82f6' }}></span>
                    Target Goal
                </span>
            </div>
        </div>
    );
}

export default ProgressCompass;

