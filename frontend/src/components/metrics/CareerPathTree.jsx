import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

function CareerPathTree({ data, onNodeClick }) {
  const svgRef = useRef();
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    const containerWidth = svgRef.current?.parentElement?.parentElement?.clientWidth || window.innerWidth * 0.95;
    const width = Math.max(containerWidth - 40, 1200);
    const nodeWidth = 260;
    const nodeHeight = 160;
    const marginTop = 60;
    const marginBottom = 60;
    const marginLeft = 100;
    const marginRight = 100;

    const root = d3.hierarchy(data);

    // Default expanded state - removed the arbitrary length check
    root.descendants().forEach((d, i) => {
      d.id = i;
      d._children = d.children;
      // Keep everything expanded by default, or just depth > 2 collapsed
      if (d.depth > 3) d.children = null;
    });

    const tree = d3.tree().nodeSize([nodeHeight + 60, nodeWidth + 100]);
    tree(root);

    let x0 = Infinity;
    let x1 = -x0;
    let y0 = Infinity;
    let y1 = -y0;

    root.each(d => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
      if (d.y > y1) y1 = d.y;
      if (d.y < y0) y0 = d.y;
    });

    const padding = 100;
    const calculatedHeight = x1 - x0 + marginTop + marginBottom + padding * 2;
    const calculatedWidth = y1 - y0 + marginLeft + marginRight + padding * 2;

    const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

    const svg = d3.select(svgRef.current)
      .attr("width", calculatedWidth)
      .attr("height", calculatedHeight)
      .attr("viewBox", [y0 - marginLeft - padding, x0 - marginTop - padding, calculatedWidth, calculatedHeight])
      .attr("style", "width: 100%; height: auto; min-height: 800px; cursor: grab; font-family: 'Inter', sans-serif;");

    const g = svg.append("g");

    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 2])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);
    svg.node().__zoomBehavior = zoomBehavior;

    // Center the initial view
    svg.call(zoomBehavior.translateTo, 0, (x1 - x0) / 2);

    const gLink = g.append("g").attr("fill", "none").attr("stroke", "#94a3b8").attr("stroke-width", 2);
    const gNode = g.append("g").attr("cursor", "pointer").attr("pointer-events", "all");

    function update(event, source) {
      const duration = 400;
      const nodes = root.descendants().reverse();
      const links = root.links();

      tree(root);

      const node = gNode.selectAll("g.node")
        .data(nodes, d => d.id);

      const nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .on("click", (event, d) => {
          // Toggle children on click
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          update(event, d);
          if (onNodeClick) onNodeClick(d.data);
        });

      // --- ForeignObject Card ---
      const foreignObject = nodeEnter.append("foreignObject")
        .attr("width", nodeWidth)
        .attr("height", nodeHeight)
        .attr("x", -nodeWidth / 2) // Center horizontally
        .attr("y", -nodeHeight / 2); // Center vertically inside group

      foreignObject.append("xhtml:div")
        .style("width", "100%")
        .style("height", "100%")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .html(d => {

          const isUnlocked = d.data.unlocked;
          const userSkills = d.data.skills_have?.length || 0;
          const requiredSkills = d.data.skills_needed?.length || 1;
          const overlap = Math.min(100, Math.round((userSkills / requiredSkills) * 100));

          // Refined Design System
          const statusColors = isUnlocked
            ? 'border-emerald-500 bg-white dark:bg-gray-800'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900';

          const shadow = isUnlocked ? 'shadow-[0_4px_20px_rgba(16,185,129,0.15)]' : 'shadow-sm';
          const opacity = isUnlocked ? 'opacity-100' : 'opacity-80 grayscale';

          return `
            <div class="relative w-full h-full rounded-2xl border flex flex-col justify-between transition-all duration-300 hover:scale-[1.03] hover:shadow-xl overflow-hidden group ${statusColors} ${shadow} ${opacity} p-5">
              
              <!-- Initial View -->
              <div class="flex flex-col h-full justify-between transition-all duration-300 group-hover:translate-y-[-2px]">
                <div class="flex justify-between items-start">
                  <div class="flex flex-col">
                    <span class="text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-1">
                      ${d.depth === 0 ? 'Current Role' : d.depth === 1 ? 'Next Step' : 'Career Goal'}
                    </span>
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">
                       ${d.data.name}
                    </h3>
                  </div>
                  <div class="${isUnlocked ? 'text-emerald-500' : 'text-slate-400'} text-lg">
                    ${isUnlocked ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-lock"></i>'}
                  </div>
                </div>

                <div class="mt-2 text-xs text-slate-600 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 rounded-lg p-2 flex items-center gap-2">
                  <i class="fa-solid fa-chart-pie opacity-70"></i>
                  <span>${overlap}% Skill Overlap</span>
                </div>
              </div>

              <!-- Hover Detail Overlay -->
              <div class="absolute inset-0 bg-slate-900/95 p-5 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <p class="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">Key Competencies</p>
                <div class="flex flex-wrap gap-1.5">
                  ${(d.data.skills_needed || ['Strategic Leadership', 'Domain Expertise']).slice(0, 4).map(s =>
            `<span class="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700">${s}</span>`
          ).join('')}
                  ${(d.data.skills_needed?.length > 4) ? `<span class="text-[10px] text-slate-500">+${d.data.skills_needed.length - 4} more</span>` : ''}
                </div>
                
                ${!isUnlocked
              ? `<div class="mt-3 text-[10px] text-amber-400 flex items-center gap-1.5"><i class="fa-solid fa-triangle-exclamation"></i> Skills Gap Detected</div>`
              : `<div class="mt-3 text-[10px] text-emerald-400 flex items-center gap-1.5"><i class="fa-solid fa-check"></i> Compatible Profile</div>`
            }
              </div>

              <!-- Child Indicator -->
               ${d._children ? `
                <div class="absolute bottom-1 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                  <i class="fa-solid fa-chevron-down text-slate-400 text-xs animate-bounce"></i>
                </div>
              ` : ''}
            </div>
          `;
        });

      // Transition nodes
      const nodeUpdate = node.merge(nodeEnter).transition().duration(duration)
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

      node.exit().transition().duration(duration).remove()
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

      // Links
      const link = gLink.selectAll("path.link").data(links, d => d.target.id);

      const linkEnter = link.enter().append("path")
        .attr("class", "link")
        .attr("d", d => {
          const o = { x: source.x0, y: source.y0 };
          return diagonal({ source: o, target: o });
        });

      link.merge(linkEnter).transition().duration(duration).attr("d", diagonal);

      link.exit().transition().duration(duration).remove()
        .attr("d", d => {
          const o = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o });
        });

      nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    // Force React to re-render the HTML content inside foreignObject when zooming (browser quirk workaround)
    // Actually, D3 handles transforms on the group, so CSS scale is fine.

    update(null, root);
  }, [data, onNodeClick]);

  return (
    <div className="w-full h-full animate-fadeIn relative">
      <div className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-lg max-w-sm pointer-events-none">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Career Pathfinder
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Interactive map of your potential career evolution. Nodes are generated based on your skill portfolio and market compatibility.
        </p>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            const svg = d3.select(svgRef.current);
            if (svg.node() && svg.node().__zoomBehavior) {
              svg.transition().duration(300).call(svg.node().__zoomBehavior.scaleBy, 1.2);
            }
          }}
          className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <i className="fa-solid fa-plus text-gray-600 dark:text-gray-300"></i>
        </button>
        <button
          onClick={() => {
            const svg = d3.select(svgRef.current);
            if (svg.node() && svg.node().__zoomBehavior) {
              svg.transition().duration(300).call(svg.node().__zoomBehavior.scaleBy, 0.8);
            }
          }}
          className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <i className="fa-solid fa-minus text-gray-600 dark:text-gray-300"></i>
        </button>
        <button
          onClick={() => {
            const svg = d3.select(svgRef.current);
            if (svg.node() && svg.node().__zoomBehavior) {
              svg.transition().duration(750).call(svg.node().__zoomBehavior.transform, d3.zoomIdentity.translate(0, 0).scale(1));
              setZoom(1);
            }
          }}
          className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-xs font-semibold hover:bg-blue-200 transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 shadow-inner h-screen max-h-[800px] relative cursor-grabbing">
        {/* Grid Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}>
        </div>
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}

export default CareerPathTree;


