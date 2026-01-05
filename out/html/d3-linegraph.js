/*
 * generating a line graph of multipile parties with multiple dates...
 * */

function addMonths(date, months) {
    date = new Date(date);
    var d = date.getDate();
    date.setMonth(date.getMonth() + months);
    if (date.getDate() != d) {
      date.setDate(0);
    }
    return date;
}


d3.linegraph = function(noTicks, noDots, parties, partyColors, partyNames, dataMax, dataMin, additionalMonths) {
    /* params */
    if (!parties) {
        // Default to Danish parties used elsewhere in this project.
        parties = ['a', 'sf', 'dkp', 'vs', 'rfb', 'b', 'v', 'c', 'kf', 'cd', 'z', 'northatlantic', 'others'];
    }
    if (!partyColors) {
        // Match the Danish palette used in your scenes (library/election_1928).
        partyColors = {
            'a': '#E3000F',
            'sf': '#ee80fa',
            'dkp': '#8B0000',
            'vs': '#e26969',
            'rfb': '#4e4e94',
            'b': '#865fac',
            'v': '#73b0f6',
            'c': '#0d9340',
            'kf': '#1f3f96',
            'cd': '#a0a0a0',
            'z': '#DCCA4A',
            'northatlantic': '#818589',
            'others': '#a0a0a0'
        };
    }
    if (!partyNames) {
        partyNames = {
            'a': 'Socialdemokratiet',
            'sf': 'SF',
            'dkp': 'DKP',
            'vs': 'VS',
            'rfb': 'RFb',
            'b': 'Radikale Venstre',
            'v': 'Venstre',
            'c': 'Conservatives',
            'kf': 'KF',
            'cd': 'CD',
            'z': 'Z',
            'northatlantic': 'NAM',
            'others': 'Others'
        };
    }
    if (!additionalMonths) {
        additionalMonths = 2;
    }

    // Declare the chart dimensions and margins.
    var width = 500;
    var height = 400;
    var marginTop = 20;
    var marginRight = 160; // was 20: reserve space for legend on the right
    var marginBottom = 50;
    var marginLeft = 40;

    function linegraph(dataset) {
      dataset.each(function (data) {

        // Parse and filter dates safely
        const dates = (data || [])
          .map(d => new Date(d.date))
          .filter(d => !isNaN(d.getTime()));

        if (!dates.length) return;

        const minDate = d3.min(dates);
        const maxDate = d3.max(dates);

        // Always clear before redraw (prevents stacking / "only draws once" symptoms)
        var svg = d3.select(this);
        svg.selectAll("*").remove();

        // Resolve start date from live state, with safe fallback to minDate
        var startDateStr = null;
        var q = null;
        try {
          if (typeof window !== "undefined") {
            q =
              (window.state && window.state.q) ? window.state.q :
              (window.state) ? window.state :
              (window.Q) ? window.Q :
              null;

            if (q && q.linegraph_start_date) {
              startDateStr = String(q.linegraph_start_date);
            } else if (q && q.linegraph_start_year != null) {
              startDateStr = String(Number(q.linegraph_start_year)) + "-01-01";
            }
          }
        } catch (e) {}

        var startDate = startDateStr ? new Date(startDateStr) : minDate;
        if (isNaN(startDate.getTime())) startDate = minDate;

        // Hide CD/Z unless they are formed (q.cd_formed === 1 / q.z_formed === 1)
        // Also hide NAM and Others on the linegraph.
        var activeParties = (parties || []).slice();
        try {
          const cdFormed = !!(q && Number(q.cd_formed) === 1);
          const zFormed  = !!(q && Number(q.z_formed) === 1);

          activeParties = activeParties.filter(p => {
            // always hide these series on the linegraph
            if (p === "northatlantic") return false; // NAM
            if (p === "others") return false;        // Others bucket

            // conditionally show these
            if (p === "cd") return cdFormed;
            if (p === "z")  return zFormed;

            return true;
          });
        } catch (e) {}

        // X scale
        const xScale = d3.scaleUtc(
          [startDate, addMonths(maxDate, additionalMonths)],
          [marginLeft, width - marginRight]
        );

        // X axis (use fewer explicit tick values)
        const desiredTicks = noTicks ? 5 : 10;
        const step = Math.max(1, Math.ceil(dates.length / desiredTicks));
        const tickDates = dates.filter((_, i) => i % step === 0);

        var xaxis = d3.axisBottom(xScale)
          .tickFormat(d3.timeFormat('%b %Y'))
          .tickValues(tickDates);

        if (noTicks) {
          xaxis = d3.axisBottom()
            .tickFormat(d3.timeFormat('%b %Y'))
            .ticks(6)
            .scale(xScale);
        }

        // Y domain auto-scale across whatever series keys were passed (works for parties AND inflation/unemployment)
        if (dataMax == null || dataMin == null) {
          let maxVal = 0;
          let minVal = 0;

          for (const key of (activeParties || [])) {
            const vals = (data || []).map(d => Number(d[key]));
            const finite = vals.filter(v => Number.isFinite(v));
            if (!finite.length) continue;
            const kMax = d3.max(finite);
            const kMin = d3.min(finite);
            if (Number.isFinite(kMax) && kMax > maxVal) maxVal = kMax;
            if (Number.isFinite(kMin) && kMin < minVal) minVal = kMin;
          }

          // Padding
          dataMax = maxVal + 10;
          dataMin = Math.min(0, minVal - 0);
        }

        const yScale = d3.scaleLinear([dataMin, dataMax], [height - marginBottom, marginTop]);

        // Build per-party series for dots/labels/legend (FIX: series was previously undefined)
        const series = (activeParties || []).map(key => {
          const pts = (data || []).map(d => ({
            x: new Date(d.date),
            y: Number(d[key] || 0),
            series: key
          })).filter(p => !isNaN(p.x.getTime()) && Number.isFinite(p.y));
          return pts;
        }).filter(pts => pts.length > 0);

        // Add the x-axis.
        svg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(xaxis)
            .selectAll("text")
            .attr("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "0.1em")
            .attr("transform", "rotate(-30)");

        // Add the y-axis.
        svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(yScale));

        const partyLine = (party) => d3.line()
            .defined(d => Number.isFinite(Number(d[party])))
            .x(d => xScale(new Date(d.date)))
            .y(d => yScale(Number(d[party] || 0)));

        // draw the lines
        for (const party of (activeParties || [])) {
          svg.append("path")
            .attr("fill", "none")
            .attr("stroke", (partyColors && partyColors[party]) ? partyColors[party] : "#999")
            .attr("stroke-width", 1.5)
            .attr("class", party + " " + "party-line")
            .attr("id", party+"-line")
            .attr("series", party)
            .attr("d", partyLine(party)(data))
            .on("mouseover", function () {
                d3.selectAll(".party-line").attr("stroke-width", 0.1);
                d3.selectAll(".party-node").attr("fill-opacity", 0.1);
                d3.selectAll(".party-label").attr("opacity", 0.1);
                d3.selectAll(".party-legend-item").attr("opacity", 0.2);
                d3.selectAll("."+party+'-node').attr("fill-opacity", 1);
                d3.selectAll("."+party+'-label').attr("opacity", 1);
                d3.selectAll("."+party+'-legend').attr("opacity", 1);
                d3.select(this).attr("stroke-width", 5);
            })
            .on("mouseout", function () {
              d3.selectAll(".party-line").attr("stroke-width", 1.5);
              d3.selectAll(".party-node").attr("fill-opacity", 1);
              d3.selectAll(".party-label").attr("opacity", 1);
              d3.selectAll(".party-legend-item").attr("opacity", 1);
            });
        }

        // draw nodes (points)
        if (!noDots) {
            svg.selectAll(".series")
                .data(series)
              .enter().append("g")
              .selectAll(".point")
                .data(d => d)
              .enter().append("circle")
                .attr("class", d => d.series + " " + d.series+"-node " + "party-node")
                .attr("fill", d => (partyColors && partyColors[d.series]) ? partyColors[d.series] : "#999")
                .attr("series", d => d.series)
                .attr("r", 4)
                .attr("cx", d => xScale(d.x))
                .attr("cy", d => yScale(d.y))
                .on("mouseover", function () {
                    const node = d3.select(this);
                    const s = node.attr('series');
                    d3.selectAll(".party-line").attr("stroke-width", 0.1);
                    d3.selectAll(".party-node").attr("fill-opacity", 0.1);
                    d3.selectAll(".party-label").attr("opacity", 0.1);
                    d3.selectAll(".party-legend-item").attr("opacity", 0.2);
                    d3.selectAll("."+s+'-node').attr("fill-opacity", 1);
                    d3.selectAll("#"+s+'-line').attr("stroke-width", 5);
                    d3.selectAll("."+s+'-label').attr("opacity", 1);
                    d3.selectAll("."+s+'-legend').attr("opacity", 1);
                })
                .on("mouseout", function () {
                    d3.selectAll(".party-line").attr("stroke-width", 1.5);
                    d3.selectAll(".party-node").attr("fill-opacity", 1);
                    d3.selectAll(".party-label").attr("opacity", 1);
                    d3.selectAll(".party-legend-item").attr("opacity", 1);
                });
        }

        // draw right-hand labels (at last point)
        // Disabled: labels clutter the chart; use legend instead.
        if (false) {
          svg.selectAll(".labels")
            .data(series)
            .enter().append("text")
            .text(s => (partyNames && partyNames[s[0].series]) ? partyNames[s[0].series] : s[0].series)
            .attr("series", s => s[0].series)
            .attr("font-size", "0.8em")
            .attr("class", s => s[0].series + "-label party-label")
            .attr("x", s => xScale(s[s.length - 1].x) + 15)
            .attr("y", s => yScale(s[s.length - 1].y) + 5)
            .on("mouseover", function () {
              const text = d3.select(this);
              const s = text.attr('series');
              d3.selectAll(".party-line").attr("stroke-width", 0.1);
              d3.selectAll(".party-node").attr("fill-opacity", 0.1);
              d3.selectAll(".party-label").attr("opacity", 0.1);
              d3.selectAll(".party-legend-item").attr("opacity", 0.2);
              d3.selectAll("."+s+'-node').attr("fill-opacity", 1);
              d3.selectAll("#"+s+'-line').attr("stroke-width", 5);
              d3.selectAll("."+s+'-label').attr("opacity", 1);
              d3.selectAll("."+s+'-legend').attr("opacity", 1);
            })
            .on("mouseout", function () {
              d3.selectAll(".party-line").attr("stroke-width", 1.5);
              d3.selectAll(".party-node").attr("fill-opacity", 1);
              d3.selectAll(".party-label").attr("opacity", 1);
              d3.selectAll(".party-legend-item").attr("opacity", 1);
            });
        }

        // --- Legend ("ledger") ---
        const legendItems = (activeParties || []).filter(p => partyNames && partyNames[p]);

        // place legend in the reserved right margin
        const legendX = (width - marginRight) + 12;
        const legendY = marginTop;

        const legend = svg.append("g")
          .attr("class", "party-legend")
          .attr("transform", `translate(${legendX},${legendY})`);

        const legendWidth = marginRight - 24;

        legend.append("rect")
          .attr("x", 0).attr("y", 0)
          .attr("width", legendWidth)
          .attr("height", 18 + legendItems.length * 16)
          .attr("fill", "rgba(255,255,255,0.85)")
          .attr("stroke", "#ccc");

        legend.selectAll("g.item")
          .data(legendItems)
          .enter()
          .append("g")
          .attr("class", d => `party-legend-item ${d}-legend`)
          .attr("transform", (d, i) => `translate(8,${14 + i * 16})`)
          .each(function(d) {
            const g = d3.select(this);
            g.append("rect")
              .attr("x", 0).attr("y", -9)
              .attr("width", 10).attr("height", 10)
              .attr("fill", (partyColors && partyColors[d]) ? partyColors[d] : "#999");

            g.append("text")
              .attr("x", 16).attr("y", 0)
              .attr("font-size", "0.8em")
              .text((partyNames && partyNames[d]) ? partyNames[d] : d);
          });

      });
    }

    linegraph.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return linegraph;
    };

    linegraph.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return linegraph;
    };

    linegraph.parties = function(value) {
        if (!arguments.length) return parties;
        parties = value;
        return linegraph;
    };

    linegraph.partyNames = function(value) {
        if (!arguments.length) return partyNames;
        partyNames = value;
        return linegraph;
    };

    linegraph.partyColors = function(value) {
        if (!arguments.length) return partyColors;
        partyColors = value;
        return linegraph;
    };

    return linegraph;
  };
