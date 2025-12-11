import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

/**
 * SkillGapSunburst - A D3.js sunburst chart visualization for skill gap analysis
 * Shows skills you have vs skills needed for a target role
 */
function SkillGapSunburst({ data, targetRole, onSegmentClick, onRoleChange, isLoading }) {
    const svgRef = useRef();
    const containerRef = useRef();
    const [tooltip, setTooltip] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Process data into hierarchical format for sunburst
    const processData = useCallback((rawData) => {
        if (!rawData) return null;
        
        // If there's a message indicating no skill mapping, return null to show empty state
        if (rawData.message) return null;

        // Extract skills data
        const currentSkills = rawData.currentSkills || rawData.skills_have || [];
        const requiredSkills = rawData.requiredSkills || rawData.skills_needed || [];
        const gapSkills = rawData.gapSkills || rawData.skills_gap || [];
        
        // If no required skills, return null to show empty state
        if (!requiredSkills || requiredSkills.length === 0) return null;

        // Build hierarchical structure
        const hierarchy = {
            name: targetRole || 'Target Role',
            children: [
                {
                    name: 'Skills You Have',
                    category: 'have',
                    children: currentSkills.map(skill => ({
                        name: typeof skill === 'string' ? skill : skill.name || skill.skill,
                        value: typeof skill === 'object' ? (skill.proficiency || skill.level || 1) : 1,
                        category: 'have',
                        details: typeof skill === 'object' ? skill : null
                    }))
                },
                {
                    name: 'Skills to Develop',
                    category: 'gap',
                    children: gapSkills.map(skill => ({
                        name: typeof skill === 'string' ? skill : skill.name || skill.skill,
                        value: typeof skill === 'object' ? (skill.importance || skill.priority || 1) : 1,
                        category: 'gap',
                        priority: typeof skill === 'object' ? skill.priority : 'medium',
                        details: typeof skill === 'object' ? skill : null
                    }))
                }
            ]
        };

        // Add required skills if provided separately
        if (requiredSkills.length > 0 && gapSkills.length === 0) {
            // Filter out skills user already has
            const currentSkillNames = new Set(currentSkills.map(s =>
                typeof s === 'string' ? s.toLowerCase() : (s.name || s.skill || '').toLowerCase()
            ));

            const gaps = requiredSkills.filter(skill => {
                const skillName = typeof skill === 'string' ? skill : skill.name || skill.skill;
                return !currentSkillNames.has(skillName.toLowerCase());
            });

            hierarchy.children[1].children = gaps.map(skill => ({
                name: typeof skill === 'string' ? skill : skill.name || skill.skill,
                value: typeof skill === 'object' ? (skill.importance || skill.priority || 1) : 1,
                category: 'gap',
                priority: typeof skill === 'object' ? (skill.priority || 'medium') : 'medium',
                details: typeof skill === 'object' ? skill : null
            }));
        }

        return hierarchy;
    }, [targetRole]);

    // Redraw chart function
    const redrawChart = useCallback((containerWidth, containerHeight) => {
        if (!data || !svgRef.current) return;

        const processedData = processData(data);
        if (!processedData) return;

        // Clear previous chart
        d3.select(svgRef.current).selectAll("*").remove();

        // Calculate responsive dimensions: keep full circle in view even in short containers
        // Use clamp to keep the full sunburst visible without over-zooming
        const size = Math.max(Math.min(containerWidth, containerHeight) - 32, 440);
        const clampedSize = Math.min(size, 640);
        const radius = clampedSize / 2;

        // Color scales with distinct high-contrast colors for priority-based gap skills
        const colorScale = {
            have: d3.scaleLinear()
                .domain([0, 1])
                .range(['#34d399', '#059669']), // Green shades
            gap: {
                high: ['#ef4444', '#dc2626'], // Red shades for high priority
                medium: ['#f59e0b', '#d97706'], // Orange/Amber shades for medium priority
                low: ['#fbbf24', '#f59e0b'] // Yellow shades for low priority
            }
        };

        const getColor = (d) => {
            if (!d.data.category) {
                // Parent node
                return d.depth === 0 ? '#3b82f6' : (d.data.category === 'have' ? '#10b981' : '#f59e0b');
            }
            
            if (d.data.category === 'have') {
                const scale = colorScale.have;
                return scale(Math.random() * 0.4 + 0.3); // Slight variation
            }
            
            // For gap skills, use priority-based colors
            if (d.data.category === 'gap') {
                const priority = d.data.priority || 'medium';
                const priorityColors = colorScale.gap[priority] || colorScale.gap.medium;
                
                // Use a linear scale for the priority color range
                const priorityScale = d3.scaleLinear()
                    .domain([0, 1])
                    .range(priorityColors);
                
                // Add slight variation but maintain high contrast
                return priorityScale(0.7 + Math.random() * 0.3);
            }
            
            return colorScale.have(0.5); // Fallback
        };

        // Create partition layout
        const partition = d3.partition()
            .size([2 * Math.PI, radius]);

        // Create hierarchy with normalized values to ensure weak skills are visible
        const root = d3.hierarchy(processedData)
            .sum(d => {
                // For skills to develop, ensure minimum visibility
                if (d.category === 'gap') {
                    // Use importance/priority if available, otherwise ensure minimum value
                    const baseValue = d.value || 1;
                    // Boost gap skills to ensure they're visible (minimum 0.3 of max value)
                    const maxValue = Math.max(
                        ...processedData.children.flatMap(c => c.children.map(s => s.value || 1))
                    );
                    return Math.max(baseValue, maxValue * 0.3);
                }
                return d.value || 1;
            })
            .sort((a, b) => {
                // Sort to prioritize gap skills for better visibility
                if (a.data.category === 'gap' && b.data.category !== 'gap') return -1;
                if (a.data.category !== 'gap' && b.data.category === 'gap') return 1;
                return b.value - a.value;
            });

        partition(root);

        // Arc generator
        const arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(0.02)
            .padRadius(radius / 3)
            .innerRadius(d => Math.max(0, d.y0))
            .outerRadius(d => Math.max(0, d.y1 - 2));

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `${-radius} ${-radius} ${clampedSize} ${clampedSize}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("font", "12px sans-serif");

        // Add paths
        const path = svg.append("g")
            .selectAll("path")
            .data(root.descendants())
            .join("path")
            .attr("fill", d => getColor(d))
            .attr("fill-opacity", d => d.depth === 0 ? 0.3 : 0.8)
            .attr("d", arc)
            .style("cursor", "pointer")
            .style("stroke", "#fff")
            .style("stroke-width", 2)
            .on("mouseover", function (event, d) {
                if (d.depth === 0) return; // Skip center

                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill-opacity", 1)
                    .style("stroke-width", 3);

                const containerRect = containerRef.current.getBoundingClientRect();
                setTooltip({
                    x: event.clientX - containerRect.left,
                    y: event.clientY - containerRect.top,
                    data: d.data,
                    depth: d.depth,
                    category: d.data.category || d.parent?.data?.category
                });
            })
            .on("mouseout", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill-opacity", d.depth === 0 ? 0.3 : 0.8)
                    .style("stroke-width", 2);

                setTooltip(null);
            })
            .on("click", (event, d) => {
                if (d.depth > 0 && onSegmentClick) {
                    onSegmentClick(d.data);
                }
            });

        // Animate paths
        path.transition()
            .duration(1000)
            .attrTween("d", function (d) {
                const i = d3.interpolate(d.x0, d.x1);
                return function (t) {
                    d.x1 = i(t);
                    return arc(d);
                };
            });

        // Add labels for larger segments - lower threshold for gap skills to ensure visibility
        const label = svg.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(root.descendants().filter(d => {
                if (d.depth === 0) return false;
                // Lower threshold for gap skills to ensure they get labels
                const minAngle = d.data.category === 'gap' ? 0.08 : 0.15;
                return (d.x1 - d.x0) > minAngle;
            }))
            .join("text")
            .attr("transform", d => {
                const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
                const y = (d.y0 + d.y1) / 2;
                return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
            })
            .attr("dy", "0.35em")
            .attr("fill", "#fff")
            .attr("font-weight", "600")
            .attr("font-size", d => d.depth === 1 ? "13px" : "11px")
            .text(d => {
                const name = d.data.name || '';
                return name.length > 15 ? name.substring(0, 12) + '...' : name;
            })
            .style("text-shadow", "0 1px 2px rgba(0,0,0,0.5)")
            .attr("opacity", 0)
            .transition()
            .delay(800)
            .duration(500)
            .attr("opacity", 1);

        // Center label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "-0.3em")
            .attr("font-size", "15px")
            .attr("font-weight", "700")
            .attr("fill", "#1f2937")
            .text(targetRole || "Target Role");

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "1.2em")
            .attr("font-size", "12px")
            .attr("fill", "#6b7280")
            .text("Skills Analysis");

    }, [data, processData, targetRole, onSegmentClick]);

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

    // Calculate summary stats
    const getStats = () => {
        if (!data) return { have: 0, gap: 0, coverage: 0 };

        const currentSkills = data.currentSkills || data.skills_have || [];
        const gapSkills = data.gapSkills || data.skills_gap || [];
        const requiredSkills = data.requiredSkills || data.skills_needed || [];

        const have = currentSkills.length;
        const required = requiredSkills.length || (have + gapSkills.length);
        const gap = gapSkills.length || Math.max(0, required - have);
        const coverage = required > 0 ? Math.round((have / required) * 100) : 0;

        return { have, gap, coverage };
    };

    const stats = getStats();

    return (
        <div className="w-full h-full relative">
            <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    🎯 Skill Gap Analysis
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Visualize your skills compared to what's needed for{' '}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {targetRole || 'your target role'}
                    </span>
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.have}</div>
                    <div className="text-xs text-green-700 dark:text-green-300">Skills You Have</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.gap}</div>
                    <div className="text-xs text-amber-700 dark:text-amber-300">Skills to Develop</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.coverage}%</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">Coverage</div>
                </div>
            </div>

            {/* Chart Container */}
            <div
                ref={containerRef}
                className="w-full flex items-center justify-center rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg relative bg-white dark:bg-gray-800"
                style={{ padding: '16px', minHeight: '560px', height: 'auto' }}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    </div>
                ) : (!data || (data.requiredSkills && data.requiredSkills.length === 0) || data.message) ? (
                    <div className="flex flex-col items-center justify-center text-center p-8">
                        <i className="fa-solid fa-info-circle text-blue-500 text-4xl mb-4"></i>
                        <p className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                            No skill data available for {targetRole || 'this role'}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">
                            {data?.message || 'We don\'t have a predefined skill set for this role yet. Please update your target role to a supported role.'}
                        </p>
                    </div>
                ) : (
                    <svg ref={svgRef} className="w-full h-full" />
                )}

                {/* Tooltip */}
                {tooltip && (
                    <div
                        className="absolute bg-gray-900 text-white p-3 rounded-lg shadow-xl text-sm z-50 pointer-events-none"
                        style={{
                            left: `${Math.min(tooltip.x + 10, dimensions.width - 200)}px`,
                            top: `${tooltip.y + 10}px`,
                            maxWidth: '200px'
                        }}
                    >
                        <div className="font-bold mb-1">{tooltip.data.name}</div>
                        {tooltip.depth === 1 && (
                            <div className="text-xs text-gray-300">
                                {tooltip.data.category === 'have'
                                    ? 'Skills you already possess'
                                    : 'Skills to develop for this role'}
                            </div>
                        )}
                        {tooltip.depth > 1 && tooltip.data.details && (
                            <>
                                {tooltip.data.details.proficiency && (
                                    <div className="text-xs">
                                        Proficiency: {tooltip.data.details.proficiency}
                                    </div>
                                )}
                                {tooltip.data.details.priority && (
                                    <div className="text-xs">
                                        Priority: <span className={
                                            tooltip.data.details.priority === 'high' ? 'text-red-400' :
                                                tooltip.data.details.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'
                                        }>{tooltip.data.details.priority}</span>
                                    </div>
                                )}
                            </>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                            Click to learn more
                        </div>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-3 text-xs justify-center items-center">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    Skills You Have
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    High Priority
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    Medium Priority
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    Low Priority
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    Target Role
                </span>
            </div>
        </div>
    );
}

export default SkillGapSunburst;


