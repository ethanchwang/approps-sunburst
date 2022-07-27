function _1(md){return(
  md``
  )}
  
  function _chart(partition,data,d3,DOM,width,color,arc,format,radius)
  {
    const root = partition(data);
  
    root.each(d => d.current = d);
  
    const svg = d3.select(DOM.svg(width, width))
        .style("width", "60%")
        .style("height", "auto")
        .style("font", "10px sans-serif")
        .style("margin", "auto");
  
    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${width / 2})`);
  
    const path = g.append("g")
      .selectAll("path")
      .data(root.descendants().slice(1))
      .join("path")
        // .attr("fill", d => { if (d.depth == 1) return "#B8A9AA"; while (d.depth > 2) d = d.parent; return color(d.data.name); })
        // .attr("fill", d => { if (d.depth == 1) return "#3478bb"; while (d.depth > 2) d = d.parent; return color(d.data.name); })
        .attr("fill", d => { if (d.depth == 1) return "#3b7dab"; while (d.depth > 2) d = d.parent; return color(d.data.name); })
        .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
        .attr("d", d => arc(d.current));
  
    path.filter(d => d.children)
        .style("cursor", "pointer")
        .on("click", clicked);
  
    path.append("title")
        .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);
   
  
    const label = g.append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
      .selectAll("text")
      .data(root.descendants().slice(1))
      .join("text")
        .attr("dy", "0.35em")
        .attr("fill-opacity", d => +labelVisible(d.current))
        .attr("transform", d => {if (d.depth != 1) return labelTransform(d.current); else return labelTransform(d.current) + 'rotate(90)'})
        .text(d => d.data.name);
  
    const parent = g.append("circle")
        .datum(root)
        .attr("r", radius)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("click", clicked);
  
    g.append("text")
      .transition()
      .duration(750)
      .ease(d3.easeLinear)
      .style("font-size","14px")
      .attr("id","intro")
      .attr("text-anchor", "middle")
      .attr("opacity", 1)
      .text("Click the slices to see more details");
  
    function clicked(p) {
      
      parent.datum(p.parent || root);
      
      if (p.depth != 0 && g.selectAll("#backtext").empty()){
        g.append("text")
          .datum(p)
          .transition()
          .duration(750)
          .ease(d3.easeLinear)
          .style("font-size","14px")
          .attr("id","backtext")
          .attr("text-anchor", "middle")
          .attr("opacity", 1)
          .text("Click here to go back");
  
        g.selectAll("#intro")
          .transition()
          .duration(750)
          .ease(d3.easeLinear)
          .attr("opacity", 0);
      } else if (p.depth == 0) {     
        g.selectAll("#backtext")
          .transition()
          .duration(750)
          .ease(d3.easeLinear)
          .attr("opacity", 0)
          .remove();
  
        g.selectAll("#intro")
          .transition()
          .duration(750)
          .ease(d3.easeLinear)
          .attr("opacity", 1);
      }
      
      root.each(d => d.target = {
        x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth)
      });
  
      const t = g.transition().duration(750); 
    
      // Transition the data on all arcs, even the ones that aren’t visible,
      // so that if this transition is interrupted, entering arcs will start
      // the next transition from the desired position.
      path.transition(t)
          .tween("data", d => {
            const i = d3.interpolate(d.current, d.target);
            return t => d.current = i(t);
          })
        .filter(function(d) {
          return +this.getAttribute("fill-opacity") || arcVisible(d.target);
        })
          .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
          .attrTween("d", d => () => arc(d.current));
  
      label.filter(function(d) {
          return +this.getAttribute("fill-opacity") || labelVisible(d.target);
        }).transition(t)
          .attr("fill-opacity", d => +labelVisible(d.target))
          // .attrTween("transform", d => () => labelTransform(d.current));
          .attrTween("transform", d => () => {if (d.depth != 1) return labelTransform(d.current); else return labelTransform(d.current) + 'rotate(90)'});
    }
    
    function arcVisible(d) {
      return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }
  
    function labelVisible(d) {
      return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }
  
    function labelTransform(d) {
      const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
      const y = (d.y0 + d.y1) / 2 * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }
  
    return svg.node();
  }
  
  
  function _data(d3){return(
  d3.json("files/e65374209781891f37dea1e7a6e1c5e020a3009b8aedf113b4c80942018887a1176ad4945cf14444603ff91d3da371b3b0d72419fa8d2ee0f6e815732475d5de")
  )}
  
  function _partition(d3){return(
  data => {
    const root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
    return d3.partition()
        .size([2 * Math.PI, root.height + 1])
      (root);
  }
  )}
  
  function _color(d3,data){return(
  // d3.scaleOrdinal(d3.quantize(d3.interpolatePuOr, data.children.length + 1))
  // d3.scaleOrdinal(d3.quantize(d3.interpolateYlGnBu, data.children.length + 1))
  d3.scaleOrdinal(d3.quantize(d3.interpolateRdYlBu, 13))
  // d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1))
  )}
  
  function _format(d3){return(
  d3.format(",d")
  )}
  
  function _width(){return(
  // 1200
  800
  )}
  
  function _radius(width){return(
  // 120
  width/6
  )}
  
  function _arc(d3,radius){return(
  d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius(d => d.y0 * radius)
      .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))
  )}
  
  function _d3(require){return(
  require("d3@5")
  )}
  
  export default function define(runtime, observer) {
    const main = runtime.module();
    main.variable(observer()).define(["md"], _1);
    main.variable(observer("chart")).define("chart", ["partition","data","d3","DOM","width","color","arc","format","radius"], _chart);
    main.variable(observer("data")).define("data", ["d3"], _data);
    main.variable(observer("partition")).define("partition", ["d3"], _partition);
    main.variable(observer("color")).define("color", ["d3","data"], _color);
    main.variable(observer("format")).define("format", ["d3"], _format);
    main.variable(observer("width")).define("width", _width);
    main.variable(observer("radius")).define("radius", ["width"], _radius);
    main.variable(observer("arc")).define("arc", ["d3","radius"], _arc);
    main.variable(observer("d3")).define("d3", ["require"], _d3);
    return main;
  }
