const w = 1550,
    h = 790,
    legendCellSize = 22;
    summer = {colors : ['#ffc2a3','#ffad85','#ff9966', '#fc9161', '#fa8a5c', '#f78257', '#f57a52', '#f2734c', '#f06b47', '#ed6342', '#eb5c3d', '#e85438', '#e64c33', '#e3452e', '#e03d29', '#de3624', '#db2e1f', '#d61f14','#d2140d','#cc0000']};
var year = 1904;
var svg = d3
    .select("div#container")
    .append("svg")
    .attr("id","test")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .style("background-color", "#323334")
    .attr("viewBox", "0 0 " + w + " " + h)
    .classed("svg-content", true);
var projection = d3
    .geoMercator()
    .translate([w / 2, h / 2])
    .scale(265)
    .center([7, 32]);
var path = d3.geoPath().projection(projection);

// load data
var worldmapCSV = d3.json("world-countries-no-antartica.json");
var summerTempCSV = d3.csv("summerTemp.csv");
var summerTemp;

Promise.all([worldmapCSV,summerTempCSV]).then(function (values) {
    summerTemp = values[1];
    svg
        .selectAll("path")
        .data(values[0].features)
        .enter()
        .append("path")
        .attr("class", "continent")
        .attr("id", d => d.properties.name)
        .attr("d", path);

    var title = svg.append("g");
    title.append("rect")
        .style("fill","#323334")
        .attr("width",w)
        .attr("height",60);
    title.append("text")
        .attr("x", (w / 2)+15)
        .attr("y", 45)
        .attr("text-anchor", "middle")
        .style("fill", "#FFA57D")
        .style("font-weight", "300")
        .style("font-size", "32px")
        .text("Évolution de la température mondiale");
    svg.append("text")
        .attr("x", (w / 2)-12)
        .attr("y", 92)
        .attr("text-anchor", "middle")
        .attr("id","h2")
        .style("fill", "#929292")
        .style("font-weight", "200")
        .style("font-size", "32px")
        .text("");
    svg.append("rect")
        .attr("y",h-390)
        .attr("x",740)
        .style("fill","#323334")
        .attr("width",820)
        .attr("height",360);

    summer.min = d3.min(summerTemp, d => d.Statistics.includes('Aug') ? +d.Temperature : NaN);
    summer.max = d3.max(summerTemp, d =>  d.Statistics.includes('Aug') ? +d.Temperature : NaN);
    summer.quantile = d3.scaleQuantile().domain([summer.min, summer.max]).range(summer.colors);

    var legend = addLegend(summer.min, summer.max, summer.colors);
    var tooltip = addTooltip();
    var slider = addSlider(parseInt(d3.min(summerTemp, d => d.Year)),parseInt(d3.max(summerTemp, d => d.Year)));
    addChart(year);
    colorMap(year,summerTemp);
});

function colorMap(year, temps) {
    temps.filter(temp => temp.Year == year).forEach(function (e, i) {
        var country = e.Country;
        var countryPath = d3.select("#" + country);
        var tooltip = d3.select("#tooltip");
        var legend = d3.select("#legend");
        countryPath
            .attr("tempcolor", summer.quantile(+e.Temperature))
            .style("fill", summer.quantile(+e.Temperature))
            .on("mouseover", function (d) {
                countryPath.style("fill", "#286671");
                tooltip.style("display", null);
                tooltip.select('#tooltip-country')
                    .text(e.Country);
                tooltip.select('#tooltip-score')
                    .text(e.Temperature);
                legend.select("#cursor")
                    .attr('transform', 'translate(' + (legendCellSize + 5) + ', ' + (getColorIndex(summer.quantile(+e.Temperature)) * legendCellSize) + ')')
                    .style("display", null);
            })
            .on("mouseout", function (d) {
                countryPath.style("fill", summer.quantile(+e.Temperature));
                tooltip.style("display", "none");
                legend.select("#cursor").style("display", "none");
            })
            .on("mousemove", function (event, d) {
                var mouse = d3.pointer(event);
                tooltip.attr("transform", "translate(" + mouse[0] + "," + (mouse[1] - 75) + ")");
            });
    });
}
function addLegend(min, max,colors) {
    var legend = svg.append('g')
        .attr('transform', 'translate(50, 300)')
        .attr("id", "legend");

    legend.selectAll()
        .data(d3.range(colors.length))
        .enter().append('rect')
        .attr('height', legendCellSize + 'px')
        .attr('width', legendCellSize + 'px')
        .attr('x', 5)
        .attr('y', d => d * legendCellSize)
        .attr('class', 'legend-cell')
        .style("fill", d => colors[d]);

    legend.append("polyline")
        .attr("points", legendCellSize + ",0 " + legendCellSize + "," + legendCellSize + " " + (legendCellSize * 0.2) + "," + (legendCellSize / 2))
        .attr("id", "cursor")
        .style("display", "none")
        .style('fill', "#286671");

    var legendScale = d3.scaleLinear().domain([min, max])
        .range([0, colors.length * legendCellSize]);

    legendAxis = legend.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(legendScale));
    return legend;
}

function addTooltip() {
    var tooltip = svg.append("g") // Group for the whole tooltip
        .attr("id", "tooltip")
        .style("display", "none");

    tooltip.append("polyline") // The rectangle containing the text, it is 210px width and 60 height
        .attr("points","0,0 210,0 210,60 0,60 0,0")
        .style("fill", "#1D272B")
        .style("stroke","black")
        .style("opacity","0.9")
        .style("stroke-width","1")
        .style("padding", "1em");

    tooltip.append("line") // A line inserted between country name and score
        .attr("x1", 40)
        .attr("y1", 25)
        .attr("x2", 160)
        .attr("y2", 25)
        .style("stroke","#929292")
        .style("stroke-width","0.5")
        .attr("transform", "translate(0, 5)");

    var text = tooltip.append("text") // Text that will contain all tspan (used for multilines)
        .style("font-size", "13px")
        .style("fill", "#B1E2EB")
        .attr("transform", "translate(0, 20)");

    text.append("tspan") // Country name udpated by its id
        .attr("x", 105) // ie, tooltip width / 2
        .attr("y", 0)
        .attr("id", "tooltip-country")
        .attr("text-anchor", "middle")
        .style("font-weight", "600")
        .style("font-size", "16px");

    text.append("tspan") // Fixed text
        .attr("x", 105) // ie, tooltip width / 2
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("fill", "929292")
        .text("Température : ");

    text.append("tspan") // Score udpated by its id
        .attr("id", "tooltip-score")
        .style("fill","#B1E2EB")
        .style("font-weight", "bold");

    return tooltip;
}

function addSlider(min,max) {
    const step = 4;
    var dataTime = d3.range(0, 29).map(function(d) {
        return new Date(min+3 + (d*step), 10, 3);
    });
    var sliderTime = d3
        .sliderBottom()
        .min(d3.min(dataTime))
        .max(d3.max(dataTime))
        .step(1000 * 60 * 60 * 24 * 365 * step)
        .width(700)
        .tickFormat(d3.timeFormat('%Y'))
        .tickValues(dataTime)
        .default(new Date(year, 10, 3))
        .handle(
            d3
                .symbol()
                .type(d3.symbolCircle)
                .size(400)()
        )
        .on('onchange', val => {
            colorMap(val.getFullYear(), summerTemp);
            addChart(val.getFullYear());
            d3.select('#h2').text(val.getFullYear());
        });

    var gTime = svg.append('g')
        .attr('transform', 'translate(790,420)');
    gTime.call(sliderTime);
    d3.select('p#value-time').text(d3.timeFormat('%Y')(sliderTime.value()));
}

function addChart(maxDate) {
    var margin = {top: 10, right: 30, bottom: 30, left: 60},
        height = 400 - margin.top - margin.bottom,
        chart;

    d3.csv("tempByYear.csv").then(function(data) {
        // Add X axis --> it is a date format
        var x = d3.scaleTime()
            .domain(d3.extent(data, function(d) { return d3.timeParse("%Y")(d.Year); }))
            .range([ 0, 717 ]);

        var y = d3.scaleLinear()
            .domain([d3.min(data, function(d) { return +d.Temperature; }), d3.max(data, function(d) { return +d.Temperature; })])
            .range([ height, 100 ]);

        //pour update le graph on l'efface et on le redraw
        d3.select('#chart').remove();

        chart = svg.append("g")
            .attr("transform",
                "translate(780,380)")
            .attr("id","chart");
        chart.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));
        chart.append("text")
            .attr("transform",
                "translate(360,400)")
            .style("text-anchor", "middle")
            .style("fill", "#FFA57D")
            .text("Date");

        chart.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y));
        chart.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2)-40)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("fill", "#FFA57D")
            .text("Température");

        // Add the line
        data2 = [{x:1902,y:18.6},{x:2016,y:19.8}]
        var datafilter = data.filter(d => d.Year <= maxDate);
        chart.append("path")
            .datum(datafilter)
            .attr("fill", "none")
            .attr("stroke", "#FFA57D")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(function(d) { return x(d3.timeParse("%Y")(d.Year)) })
                .y(function(d) { return y(d.Temperature) })
            )
        if(maxDate == 2016) {
            chart.append("path")
                .datum(data2)
                .attr("fill", "none")
                .attr("stroke", "RED")
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .x(function (d) {
                        return x(d3.timeParse("%Y")(d.x))
                    })
                    .y(function (d) {
                        return y(d.y)
                    })
                )
        }
    })
}
function getColorIndex(color) {
    for (var i = 0; i < summer.colors.length; i++) {
        if (summer.colors[i] === color) {
            return i;
        }
    }
    return -1;
}
