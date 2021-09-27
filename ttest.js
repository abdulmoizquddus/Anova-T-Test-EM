var temp_ary = new Array(10).fill(0);
var fillcolors = ["red", "skyblue ", "green", "yellow", "purple"];
// container for all groups and corresponding datapoints
var dataPoints_groups = []; //{"datapoints":[], "mean":NaN, "min":NaN, "max":NaN};
var dataPoints_stats = {};
// selected group index for manual creation of datapoints
var selected_group = -1;
//
var margin = { top: 20, right: 30, bottom: 30, left: 40 },
  width = 900 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

//for 2nd svg
width2 = 310;
height2 = 200;
// ??
var highlightedPoint = [];
var AllData = {};
//
var svg = d3
  .select(".box")
  .append("svg")
  .on("mouseup", mouseup)
  .on("mousemove", mousemove)
  .on("mouseout", mouseout)
  .on("mouseover", mouseover)
  .style("cursor", "crosshair")
  .attr("id", "svg1")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
anova_text = svg
  .append("g")
  .append("foreignObject")
  .attr("width", 600)
  .attr("height", 200)
  .attr("id", "anova_summary_text")
  //.style("opacity", 50)
  .append("xhtml:body");
// 2nd svg

var svg2 = d3
  .select(".box")
  .append("svg")
  .attr("id", "svg2")
  .attr("width", width2)
  .attr("height", height2)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top / 3 + ")");

// Mouse pointer
var focus = svg
  .append("g")
  .append("circle")
  .style("fill", "none")
  .attr("stroke", "black")
  .attr("r", 8.5)
  .style("opacity", 100);
// Create the text that shows along the mouse pointer
var focusText = svg
  .append("g")
  .append("text")
  .style("opacity", 50)
  .attr("text-anchor", "left")
  .attr("alignment-baseline", "middle");
// x-axis scale
var x_scale = d3.scaleLinear().rangeRound([0, width]);
// y-axis scale
var y_scale = d3.scaleLinear().domain([0, 0.5]).range([height, 0]);
// x-axis scale	for svg2
var x_scale2 = d3.scaleLinear().rangeRound([0, width / 3.4]);
// y-axis scale for svg2
var y_scale2 = d3
  .scaleLinear()
  .domain([0, 0.5])
  .range([height / 3, 0]);
// x-axis view
var xAxis = svg
  .append("g")
  .attr("class", "xaxis")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x_scale));
// y-axis view
var yAxis = svg.append("g").attr("class", "yaxis").call(d3.axisLeft(y_scale));

// x-axis view in svg2
var xAxis2 = svg2
  .append("g")
  .attr("class", "xaxis")
  .attr("transform", "translate(0," + height / 3 + ")")
  .call(d3.axisBottom(x_scale2));
// y-axis view in svg2
var yAxis2 = svg2
  .append("g")
  .attr("class", "yaxis")
  .call(d3.axisLeft(y_scale2));
//control section
var inputSec = d3.select(".controls").append("div").attr("id", "inputsec");
// dropdownbox in control panel
var dropDownbox = inputSec.append("div").attr("class", "inputbox0");
dropDownbox.append("label").attr("for", "dropdown").text("Number of Groups");
var dropDown = dropDownbox
  .append("select")
  .attr("name", "name-list")
  .attr("id", "dropdown");
var dropDownOptions = [1, 2];
var options = dropDown
  .selectAll("option")
  .data(dropDownOptions)
  .enter()
  .append("option")
  .text(function (d) {
    return d;
  });
//d3.select("#dropdown option:nth-child(2)").attr("selected", "selected");

//
var circles = [];
var circle_global_mean;
//
// group distribution curve line

//
d3.select("#dropdown").on("input", function () {
  d3.select(".inputbox_xrange_labels").remove();
  d3.select(".alphadiv").remove();
  d3.selectAll(".labels").remove();
  d3.select(".radbtncontainer").remove();
  //d3.select(".inputbox0").remove();
  d3.select(".xrange_labels").remove();
  d3.selectAll(".inputbox").remove();
  for (let group_i = 0; group_i < dataPoints_groups.n; group_i++) {
    svg.select("selected_group_" + group_i + "").remove();
  }
  //console.log(this.value);
  dataPoints_groups = [];
  setupControlPanel(this.value);
});
// Control panel
function setupControlPanel(noOfGroups) {
  //console.log("setupControlPanel", noOfGroups);
  // X-axis range section

  alphadiv = inputSec.append("div").attr("class", "alphadiv");
  alphadiv.append("label").attr("for", "alphavalue").text("Confidence Level");
  alphadiv
    .append("input")
    .attr("type", "number")
    .attr("id", "alphavalue")
    .attr("min", "0.01")
    .attr("max", "0.99")
    .attr("step", "0.01")
    .attr("value", "0.95")
    .on("input", function () {
      calc_param();
      visualize();
    });

  var xrange_labels = inputSec.append("div").attr("class", "xrange_labels");
  xrange_labels
    .selectAll("li")
    .data(["x-Min", "x-Max"])
    .enter()
    .append("li")
    .attr("class", "labels")
    .text(function (d) {
      return d;
    });
  var xrange_inputs = inputSec
    .append("div")
    .attr("class", "inputbox_xrange_labels");
  xrange_inputs
    .append("input")
    .attr("type", "number")
    .attr("id", "x_Min")
    .attr("name", "x_Min")
    .attr("value", 10);

  xrange_inputs
    .append("input")
    .attr("type", "number")
    .attr("id", "x_Max")
    .attr("name", "x_Max")
    .attr("value", 20);
  // Specifying the number of groups
  d3.select("#dropdown").attr("value", noOfGroups);
  // Group parametets section
  var groups = new Array(noOfGroups).fill(0);
  // intialize view components
  var param_labels = inputSec.append("div").attr("class", "labels");
  label_names = ["Mean (μ)", "SD (σ)", "Sample Points", "Input Datapoints"];
  param_labels
    .selectAll("li")
    .data(label_names)
    .enter()
    .append("li")
    .attr("class", "labels")
    .text(function (d) {
      return d;
    });
  for (let group_i = 0; group_i < noOfGroups; group_i++) {
    groups[group_i] = inputSec.append("div").attr("class", "inputbox");

    groups[group_i]
      .append("input")
      .attr("type", "number")
      .attr("id", "mean" + group_i + "")
      .attr("name", "field1")
      .attr("value", group_i + 15)
      .attr("step", 0.1);

    groups[group_i]
      .append("input")
      .attr("type", "number")
      .attr("id", "sd" + group_i + "")
      .attr("name", "field2")
      .attr("min", 1)
      .attr("step", "0.1")
      .attr("value", 1);

    groups[group_i]
      .append("input")
      .attr("type", "number")
      .attr("id", "n" + group_i + "")
      .attr("name", "field3")
      .attr("min", 5)
      .attr("step", "1")
      .attr("value", 10);

    groups[group_i]
      .append("input")
      .attr("type", "checkbox")
      .attr("id", "selected_group_" + group_i + "")
      .attr("name", "checkBox_AddDataPoint")
      .property("checked", false)
      .on("change", input_datapoints_checkbox_update)
      .on("mouseup", function () {})
      .on("mousemove", function () {})
      .on("mouseout", function () {})
      .on("mouseover", function () {});
  }

  Radbtncontainer = inputSec.append("div").attr("class", "radbtncontainer");
  firstcon = Radbtncontainer.append("div");
  firstcon.append("label").attr("for", "rad0").text("μ < x̄");
  firstcon
    .append("input")
    .attr("type", "radio")
    .attr("id", "rad0")
    .on("change", radiobtnchange);
  seccon = Radbtncontainer.append("div");
  seccon.append("label").attr("for", "rad1").text("μ != x̄");
  seccon
    .append("input")
    .attr("type", "radio")
    .attr("checked", true)
    .attr("id", "rad1")
    .on("change", radiobtnchange);
  thirdcon = Radbtncontainer.append("div");
  thirdcon.append("label").attr("for", "rad2").text("μ > x̄");
  thirdcon
    .append("input")
    .attr("type", "radio")
    .attr("id", "rad2")
    .on("change", radiobtnchange);

  if (d3.select("#dropdown").property("value") == 2) {
    one = "1";
    two = "2";
    d3.select("label[for=rad0]").text("x̄1 < x̄2");
    d3.select("label[for=rad1]").text("x̄1 != x̄2");
    d3.select("label[for=rad2]").text("x̄1 > x̄2");
  }

  sample_refresh_btn = inputSec.append("div").attr("class", "inputbox");
  sample_refresh_btn
    .append("input")
    .attr("type", "button")
    .attr("id", "sample-button")
    .attr("value", "Sample");
  d3.select("#sample-button").on("click", function () {
    if (d3.select("#dropdown").property("value") == 1) {
      update_data(0);
    } else if (d3.select("#dropdown").property("value") == 2) {
      update_data(0);
      update_data(1);
    }
  });
  download_btn_div = inputSec.append("div").attr("class", "inputbox");
  download_btn_div
    .append("input")
    .attr("type", "button")
    .attr("id", "download-button")
    .attr("value", "Export Data");

  d3.select("#download-button").on("click", function () {
    const a = document.createElement("a");
    const file = new Blob([ConvertToCSV(dataPoints_groups)], {
      type: "text/plain",
    });
    a.href = URL.createObjectURL(file);
    a.download = "data.csv";
    a.click();
  });

  // initialize model: arrays in dataPoints_Groups
  for (let group_i = 0; group_i < noOfGroups; group_i++) {
    dataPoints_groups.push({
      datapoints: sample_from_dist(
        (mean = d3.select("#mean" + group_i + "").property("value")),
        d3.select("#sd" + group_i + "").property("value"),
        d3.select("#n" + group_i + "").property("value")
      ),
    });
  }
  calc_param();
  visualize();
  register_listeners();
}
setupControlPanel(1);
function visualize() {
  // console.log("visualize");
  setup_axis();
  plot_datapoints();
  plot_distributions();
  setup_axis();
  plot_tdistribution();
}

function input_datapoints_checkbox_update() {
  if (this.checked) {
    // deselect checkboxes of all other groups
    for (let group_i = 0; group_i < dataPoints_groups.length; group_i++) {
      if (this.id != "selected_group_" + group_i + "") {
        d3.select("#selected_group_" + group_i + "").node().checked = false;
      }
    }
    selected_group = parseInt(this.id.substring(15, this.id.length));
    // erase the datapoints of selected group, user will create again
    dataPoints_groups[selected_group].datapoints = [];
    calc_param();
    visualize();
  }
  if (!this.checked) {
    selected_group = -1;
  }
}

function register_listeners() {
  // Assign event listerners to ui controls (view)
  d3.select("#x_Min").on("input", function () {
    visualize();
  });
  d3.select("#x_Max").on("input", function () {
    visualize();
  });

  //
  for (let i = 0; i < d3.select("#dropdown").property("value"); i++) {
    d3.select("#mean" + i + "").on("input", function () {
      update_data(i);
    });
    d3.select("#sd" + i + "").on("input", function () {
      update_data(i);
    });
    d3.select("#n" + i + "").on("input", function () {
      update_data(i);
    });
  }
}

function update_data(group_i) {
  dataPoints_groups[group_i] = {
    datapoints: sample_from_dist(
      (mean = d3.select("#mean" + group_i + "").property("value")),
      (sd = d3.select("#sd" + group_i + "").property("value")),
      (points = d3.select("#n" + group_i + "").property("value"))
    ),
  };
  calc_param();
  visualize();
}

function sortByProperty(property) {
  return function (a, b) {
    if (a[property] > b[property]) return 1;
    else if (a[property] < b[property]) return -1;

    return 0;
  };
}

function plot_distributions() {
  svg.selectAll("path").remove();
  var line = d3
    .line()
    .x(function (d) {
      return x_scale(d.Xi);
    })
    .y(function (d) {
      return y_scale(d.P_Xi);
    });
  // console.log("dg",dataPoints_groups);
  //console.log("ds", dataPoints_stats)
  for (let group_i = 0; group_i < dataPoints_groups.length; group_i++) {
    // if (dataPoints_groups[group_i].n < 2)
    // 	continue; // group has less than 2 members yet.
    var mean = Number(d3.select("#mean" + group_i + "").property("value"));
    var sd = Number(d3.select("#sd" + group_i + "").property("value"));
    //console.log(mean,sd)
    var datapoints = [];
    var left = mean - 4 * sd;
    var right = mean + 4 * sd;
    step_size = (right - left) / 200;
    // console.log("left",left);
    // console.log("right",right);
    for (let Xi = mean - 4 * sd; Xi < mean + 4 * sd; Xi += step_size) {
      P_Xi = jStat.normal.pdf(Xi, mean, sd);
      datapoints.push({ Xi: Xi, P_Xi: P_Xi });
    }
    datapoints.sort(sortByProperty("Xi"));
    // console.log("pd",datapoints);
    norm_dist_line = svg
      .append("path")
      .datum(new Array())
      .attr("class", "line")
      .attr("d", line)
      .style("opacity", "0.2");

    norm_dist_line
      .datum(datapoints)
      .attr("d", line)
      .style("fill", fillcolors[group_i]);
  }
}

function sample_from_dist(mean, sd, points) {
  datapoints = [];
  for (i = 0; i < points; i++) {
    Xi = jStat.normal.sample(parseFloat(mean), parseFloat(sd));
    P_Xi = jStat.normal.pdf(Xi, mean, sd);
    Xi = round(Xi, 2);
    P_Xi = round(P_Xi, 2);
    datapoints.push({ Xi: Xi, P_Xi: P_Xi });
  }
  return datapoints;
}

function sortByProperty(property) {
  return function (a, b) {
    if (a[property] > b[property]) return 1;
    else if (a[property] < b[property]) return -1;

    return 0;
  };
}

function plot_datapoints() {
  //console.log('	plotting datapoints', dataPoints_groups)
  //setup_axis()
  svg.selectAll("circle").remove();
  for (let group_i = 0; group_i < dataPoints_groups.length; group_i++) {
    circles[group_i] = svg
      .append("g")
      .selectAll("circle")
      .data(dataPoints_groups[group_i].datapoints)
      .enter()
      .append("circle")
      .attr("cy", height)
      .attr("fill", fillcolors[group_i])
      .style("opacity", "0.5")
      .attr("cx", function (d) {
        return x_scale(d.Xi);
      })
      .attr("r", 5)
      .attr("stroke", fillcolors[group_i])
      .attr("stroke-width", 0)
      .on("mouseover", function (d) {
        highlightedPoint = [];
        highlightedPoint.push({
          Xi: d.Xi,
          P_Xi: d.P_Xi,
        });
        console.log(d.Xi, d.P_Xi);
        d3.select(this)
          .transition()
          .duration(100)
          .style("opacity", "1")
          .attr("stroke-width", 5);

        svg
          .append("line")
          .attr("class", "hoverlines")
          .style("stroke", "grey")
          .style("stroke-width", 1)
          .attr("x1", x_scale(d.Xi))
          .attr("y1", y_scale(0))
          .attr("x2", x_scale(d.Xi))
          .attr("y2", y_scale(d.P_Xi));
        svg
          .append("line")
          .attr("class", "hoverlines")
          .style("stroke", "grey")
          .style("stroke-width", 1)
          .attr("x1", x_scale(xmin))
          .attr("y1", y_scale(d.P_Xi))
          .attr("x2", x_scale(d.Xi))
          .attr("y2", y_scale(d.P_Xi));
      })
      .on("mouseout", function (d) {
        d3.selectAll(".hoverlines").remove();
        d3.select(this)
          .transition()
          .duration(100)
          .style("opacity", "0.5")
          .attr("stroke-width", 0);
      })
      .on("click", function () {
        var index = findindex(highlightedPoint[0].Xi);
        console.log(highlightedPoint[0].Xi, highlightedPoint[0].P_Xi, index);
        dataPoints_groups[group_i].datapoints.splice(index, 1);
        console.log(dataPoints_groups[group_i].datapoints);
        this.remove();
        calc_param();
        visualize();
      });

    // draw mean circles if datapoints more than 1
    mean_data = [];
    if (dataPoints_groups[group_i].datapoints.length > 1)
      mean_data.push(dataPoints_groups[group_i].mean);

    circles[group_i] = svg
      .append("g")
      .selectAll("circle")
      .data(mean_data)
      .enter()
      .append("circle")
      .attr("cy", height)
      .attr("fill", fillcolors[group_i])
      .style("opacity", "0.7")
      .attr("cx", function (d) {
        return x_scale(d);
      })
      .attr("r", 9)
      .style("stroke", "black")
      .attr("stroke-width", 0)
      .on("mouseover", function (d) {
        d3.select(this)
          .transition()
          .duration(100)
          .style("opacity", "1")
          .attr("stroke-width", 3);
      })
      .on("mouseout", function (d) {
        d3.select(this)
          .transition()
          .duration(100)
          .style("opacity", "0.7")
          .attr("stroke-width", 0);
      })
      .on("click", function () {
        this.remove();
      });
  }
  // draw global mean for all datapoints of all groups
  circle_global_mean = svg
    .append("g")
    .selectAll("circle")
    .data([dataPoints_stats.mean])
    .enter()
    .append("circle")
    .attr("cy", height)
    .attr("fill", "grey")
    //.style("opacity", "0.3")
    .style("stroke", "black")
    .attr("cx", function (d) {
      return x_scale(d);
    })
    .attr("r", 9)
    .style("stroke", "black")
    .attr("stroke-width", 0)
    .on("mouseover", function (d) {
      d3.select(this)
        .transition()
        .duration(100)
        .style("opacity", "1")
        .attr("stroke-width", 3);
    })
    .on("mouseout", function (d) {
      d3.select(this)
        .transition()
        .duration(100)
        .style("opacity", "0.7")
        .attr("stroke-width", 0);
    })
    .on("click", function () {
      this.remove();
    });
  //console.log('	done plotting datapoints')
}
function findindex(xvalue) {
  console.log(xvalue);
  for (var i = 0; i < d3.select("#dropdown").property("value"); i++) {
    for (var j = 0; j < dataPoints_groups[i].datapoints.length; j++) {
      if (dataPoints_groups[i].datapoints[j].Xi == xvalue) {
        console.log(i, j);
        return j;
      }
    }
  }
  return -1;
}
function radiobtnchange() {
  radid = this.id;
  document.getElementById("rad0").checked = false;
  document.getElementById("rad1").checked = false;
  document.getElementById("rad2").checked = false;
  if (radid == "rad0") {
    document.getElementById("rad0").checked = true;
  } else if (radid == "rad1") {
    document.getElementById("rad1").checked = true;
  } else if (radid == "rad2") {
    document.getElementById("rad2").checked = true;
  }
  calc_param();
  visualize();
}

function plot_tdistribution() {
  d3.selectAll(".t_line").remove();
  d3.selectAll("#alphaline").remove();
  d3.selectAll("#svg2").select("circle").remove();
  var datapoints_tdist = [];

  if (d3.select("#dropdown").property("value") == 1) {
    dof = dataPoints_stats.n - 1;
  } else if (d3.select("#dropdown").property("value") == 2) {
    dof = dataPoints_stats.n - 2;
  }
  for (let x = -4; x <= 4; x += 0.01) {
    y = jStat.studentt.pdf(x, dof);
    datapoints_tdist.push({
      xt: x,
      yt: y,
    });
  }
  datapoints_tdist.sort(sortByProperty("xt"));
  //Min xf
  var min_xt = d3.min(datapoints_tdist, function (d) {
    return d.xt;
  });

  //Max xf
  var max_xt = d3.max(datapoints_tdist, function (d) {
    return d.xt;
  });

  //settingup scales
  x_scale2.domain([-5, 5]).nice;
  y_scale2 = d3
    .scaleLinear()
    .domain([0, 0.5])
    .range([height / 3, 0]);

  console.log(dataPoints_stats.T);
  console.log(min_xt);
  console.log(max_xt);
  xAxis2.call(d3.axisBottom(x_scale2));
  yAxis2.call(d3.axisLeft(y_scale2));

  var line2 = d3
    .line()
    .x(function (d) {
      return x_scale2(d.xt);
    })
    .y(function (d) {
      return y_scale2(d.yt);
    });

  t_dist_line = svg2
    .append("path")
    .datum(datapoints_tdist)
    .attr("class", "t_line")
    .attr("d", line2)
    .attr("stroke", "red")
    .style("opacity", "0.5")
    .style("fill-opacity", "0");

  t_circle = svg2
    .append("g")
    .selectAll("circle")
    .data([dataPoints_stats.T])
    .enter()
    .append("circle")
    .attr("cy", height2 - 50)
    .attr("fill", "black")
    .style("opacity", "0.7")
    .attr("cx", function (d) {
      return x_scale2(d);
    })
    .attr("r", 5)
    .style("stroke", "black")
    .attr("stroke-width", 0)
    .on("mouseover", function (d) {
      d3.select(this)
        .transition()
        .duration(100)
        .style("opacity", "1")
        .attr("stroke-width", 3);
    })
    .on("mouseout", function (d) {
      d3.select(this)
        .transition()
        .duration(100)
        .style("opacity", "0.7")
        .attr("stroke-width", 0);
    })
    .on("click", function () {
      this.remove();
    });
  console.log(t_circle);
  y2 = jStat.studentt.pdf(dataPoints_stats.Alpha, dataPoints_stats.n - 1);
  svg2
    .append("line")
    .attr("id", "alphaline")
    .style("stroke", "grey")
    .style("stroke-width", 2)
    .attr("x1", x_scale2(dataPoints_stats.Alpha))
    .attr("y1", y_scale2(0))
    .attr("x2", x_scale2(dataPoints_stats.Alpha))
    .attr("y2", y_scale2(y2));

  if (document.getElementById("rad1").checked) {
    y2 = jStat.studentt.pdf(-dataPoints_stats.Alpha, dataPoints_stats.n - 1);
    svg2
      .append("line")
      .attr("id", "alphaline")
      .style("stroke", "grey")
      .style("stroke-width", 2)
      .attr("x1", x_scale2(-dataPoints_stats.Alpha))
      .attr("y1", y_scale2(0))
      .attr("x2", x_scale2(-dataPoints_stats.Alpha))
      .attr("y2", y_scale2(y2));
  }
}

function setup_axis() {
  //updating x & y ranges
  xmin = d3.select("#x_Min").property("value");
  xmax = d3.select("#x_Max").property("value");
  if (xmin < dataPoints_stats.min - 1 && xmax > dataPoints_stats.max + 1) {
    x_scale.domain([xmin, xmax]).nice;
  } else if (
    xmin < dataPoints_stats.min - 1 &&
    xmax < dataPoints_stats.max + 1
  ) {
    x_scale.domain([xmin, dataPoints_stats.max + 2]).nice;
  } else if (
    xmin > dataPoints_stats.min - 1 &&
    xmax > dataPoints_stats.max + 1
  ) {
    x_scale.domain([dataPoints_stats.min - 2, xmax]).nice;
  } else if (
    xmin > dataPoints_stats.min - 1 &&
    xmax < dataPoints_stats.max + 1
  ) {
    x_scale.domain([dataPoints_stats.min - 2, dataPoints_stats.max + 2]).nice;
  } else {
    x_scale.domain([dataPoints_stats.min - 5, dataPoints_stats.max + 5]).nice;
  }

  y_scale = d3.scaleLinear().domain([0, 0.5]).range([height, 0]);

  //rendering updates scales
  xAxis.call(d3.axisBottom(x_scale));
  yAxis.call(d3.axisLeft(y_scale));
}

function mousemove() {
  m = d3.mouse(svg.node());
  var x0 = x_scale.invert(m[0]);
  var y0 = y_scale.invert(m[1]);
  focus.attr("cx", m[0]).attr("cy", m[1]);

  focusText
    .html("(" + round(x0, 2) + ", " + round(y0, 2) + ")")
    .attr("x", m[0] - 45)
    .attr("y", m[1] - 15);
}

function mouseout() {
  focus.style("opacity", 0);
  focusText.style("opacity", 0);
}

function mouseover() {
  focus.style("opacity", 1);
  focusText.style("opacity", 1);
}

function mouseup() {
  if (selected_group != -1) {
    m = d3.mouse(svg.node());
    Xi = x_scale.invert(m[0]);
    P_Xi = jStat.normal.pdf(
      Xi,
      dataPoints_groups[selected_group].mean,
      dataPoints_groups[selected_group].stdev
    ); // mean, sd of the  group in focus
    Xi = round(Xi, 2);
    P_Xi = round(P_Xi, 2);
    data_point = {
      Xi: Xi,
      P_Xi: P_Xi,
    };
    dataPoints_groups[selected_group].datapoints.push(data_point);
    // console.log(dataPoints_groups[selected_group].datapointsbyclick)
    calc_param();
    visualize();
  }
}

function display_anova_results() {
  critical_value = " Critical Value: " + round(dataPoints_stats.Alpha, 4);
  p_value =
    "P-Value ( μ = x̄) : " + round(1 - dataPoints_stats.T_P_Value, 6) + "<br>";
  alpha_value = 1 - d3.select("#alphavalue").property("value");
  if (document.getElementById("rad1").checked) {
    p_value += "P-Value ( μ != x̄) : " + round(dataPoints_stats.T_P_Value, 6);
    critical_value =
      " Critical Value: +/- " + Math.abs(round(dataPoints_stats.Alpha, 4));
    alpha_value /= 2;
  } else if (document.getElementById("rad0").checked) {
    p_value += "P-Value ( μ < x̄) : " + round(dataPoints_stats.T_P_Value, 6);
  } else {
    p_value += "P-Value ( μ > x̄) : " + round(dataPoints_stats.T_P_Value, 6);
  }
  gs = "greater than ";
  acpt = " is accepted.";
  if (round(dataPoints_stats.T_P_Value, 6) < alpha_value) {
    gs = "smaller than ";
    acpt = " cannot be accepted.";
  }
  decision =
    "The likelihood of observing T-Statistic<br>as extreme as " +
    round(dataPoints_stats.T, 4) +
    " due to random chance<br>" +
    "is " +
    round(dataPoints_stats.T_P_Value, 6) +
    "<br>which is " +
    gs +
    "the alpha " +
    round(alpha_value, 4) +
    "<br>Therefore, HO " +
    acpt;

  if (d3.select("#dropdown").property("value") == 1) {
    anova_text
      .html(
        "<p class=anovaresults>" +
          "	T-Statistic : " +
          round(dataPoints_stats.T, 4) +
          "<br>" +
          p_value +
          "<br>" +
          critical_value +
          "<br>" +
          "μ : " +
          d3.select("#mean0").property("value") +
          " x̄ : " +
          round(dataPoints_groups[0].mean, 4) +
          " sd: " +
          round(dataPoints_groups[0].sd, 4) +
          "<br>" +
          decision +
          "</p>"
      )
      .attr("x", 5)
      .attr("y", 10);
  } else if (d3.select("#dropdown").property("value") == 2) {
    anova_text
      .html(
        "<p class=anovaresults>" +
          "	T-Statistic : " +
          round(dataPoints_stats.T, 4) +
          "<br>" +
          p_value +
          "<br>" +
          critical_value +
          "<br>" +
          "x̄ 1: " +
          round(dataPoints_groups[0].mean, 6) +
          "<br>" +
          "x̄ 2: " +
          round(dataPoints_groups[1].mean, 6) +
          "<br>" +
          "sd 1: " +
          round(dataPoints_groups[0].sd, 6) +
          "<br>" +
          "sd 2: " +
          round(dataPoints_groups[1].sd, 6) +
          decision +
          "<br>" +
          "</p>"
      )
      .attr("x", 5)
      .attr("y", 10);
  }
}

function ConvertToCSV(objArray) {
  var array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
  var all_data = "";
  var header = "X, treatments";

  for (var i = 0; i < array.length; i++) {
    var group_i = "";
    for (var index in array[i].datapoints) {
      group_i += array[i].datapoints[index].Xi + "," + i + "\r\n";
    }
    all_data += group_i;
  }
  all_data = header + "\r\n" + all_data;
  return all_data;
}
/*Math functions (model)*/
function round(number, decimal = 2) {
  return Math.round(number * 10 ** decimal) / 10 ** decimal;
}
// calc param
function calc_param() {
  all_data = [];
  dataPoints_stats.SSE = 0;
  for (let group_i = 0; group_i < dataPoints_groups.length; group_i++) {
    data = [];
    for (let i = 0; i < dataPoints_groups[group_i].datapoints.length; i++) {
      data.push(dataPoints_groups[group_i].datapoints[i].Xi);
      all_data.push(dataPoints_groups[group_i].datapoints[i].Xi);
    }
    dataPoints_groups[group_i].n = data.length;
    // Within Group Variation: Sum of Squared Errors (SSE)
    if (data.length >= 2) {
      n = data.length;
      mean = data.reduce((a, b) => a + b) / n;
      //dataPoints_groups[group_i].sd = data.map(x => Math.pow(x - dataPoints_groups[group_i].mean, 2))
      //	.reduce((a, b) => a + b) / (dataPoints_groups[group_i].n)
      sd = Math.sqrt(
        data.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / (n - 1)
      );
      // cov_matrix = [0, 0]
      // for (let k = 0 ; k < 2 ; k ++){
      // cov_matrix[k] = data.map((x) => (x - mean).reduce((a, b) => a + b) / (n - 1));
      // }
      dataPoints_groups[group_i].mean = mean;
      dataPoints_groups[group_i].sd = sd;
      //if (dataPoints_groups[group_i].sd < 1) dataPoints_groups[group_i].sd = 1; // for visualization purpose
      dataPoints_stats.SSE += data
        .map((x) => Math.pow(x - dataPoints_groups[group_i].mean, 2))
        .reduce((a, b) => a + b);
    }
  }
  dataPoints_stats.n = all_data.length;
  dataPoints_stats.k = dataPoints_groups.length;

  if (all_data.length >= 2) {
    dataPoints_stats.min = d3.min(all_data);
    dataPoints_stats.max = d3.max(all_data);
    dataPoints_stats.mean = all_data.reduce((a, b) => a + b) / all_data.length;
    dataPoints_stats.total_variation = all_data
      .map((x) => Math.pow(x - dataPoints_stats.mean, 2))
      .reduce((a, b) => a + b);
  }
  // Between Group Variation: Sum of Squared Treatments (SST)
  dataPoints_stats.SST = dataPoints_groups
    .map((group) => Math.pow(group.mean - dataPoints_stats.mean, 2) * group.n)
    .reduce((a, b) => a + b);
  //
  dataPoints_stats.MST = dataPoints_stats.SST / (dataPoints_stats.k - 1);
  dataPoints_stats.MSE =
    dataPoints_stats.SSE / (dataPoints_stats.n - dataPoints_stats.k);
  // Between-group variation / Within-group variation
  // F-Ratio (MST/MSE)
  dataPoints_stats.F = dataPoints_stats.MST / dataPoints_stats.MSE;
  population_mean0 = d3.select("#mean0").property("value");
  if (dataPoints_groups.length == 1) {
    dataPoints_stats.T =
      (dataPoints_groups[0].mean - d3.select("#mean0").property("value")) /
      (dataPoints_groups[0].sd / Math.sqrt(dataPoints_groups[0].n));
    // console.log("sample mean", dataPoints_groups[0].mean);
    // console.log("sample std", dataPoints_groups[0].sd);
    // console.log("population mean", population_mean0);
    // console.log(
    //   "tscore",
    //   jStat.tscore(
    //     dataPoints_groups[0].mean,
    //     population_mean0,
    //     dataPoints_groups[0].sd,
    //     dataPoints_groups[0].n
    //   )
    // );
  } else if (dataPoints_groups.length == 2) {
    population_mean1 = d3.select("#mean1").property("value");
    mean0 = dataPoints_groups[0].mean;
    mean1 = dataPoints_groups[1].mean;
    sd0 = dataPoints_groups[0].sd;
    sd1 = dataPoints_groups[1].sd;
    dataPoints_stats.T =
      (mean0 - mean1) /
      Math.sqrt(
        Math.pow(sd0, 2) / dataPoints_groups[0].n +
          Math.pow(sd1, 2) / dataPoints_groups[1].n
      );
  }
  dataPoints_stats.df1 = dataPoints_stats.k - 1;
  dataPoints_stats.df2 = dataPoints_stats.n - dataPoints_stats.k;
  // cdf returns the probability that a number randomly selected from the central F distribution
  // with df1 and df2 will be less than x
  // dataPoints_stats.F_P_Value = 1 - jStat.centralF.cdf(x = dataPoints_stats.F, df1 = dataPoints_stats.df1, df2 = dataPoints_stats.df2);
  // dataPoints_stats.T_P_Value =
  //   1 -
  //   jStat.studentt.cdf(
  //     (x = dataPoints_stats.T),
  //     (dof = dataPoints_stats.n - 1)
  //   );
  // console.log("p from cdf ", dataPoints_stats.T_P_Value);
  if (document.getElementById("rad0").checked) {
    dataPoints_stats.T_P_Value =
      1 -
      jStat.ttest(
        (tscore = dataPoints_stats.T),
        (n = dataPoints_stats.n),
        (sides = 1)
      );
    dataPoints_stats.Alpha =
      -1 *
      jStat.studentt.inv(
        d3.select("#alphavalue").property("value"),
        dataPoints_stats.n - 1
      );
  } else if (document.getElementById("rad1").checked) {
    dataPoints_stats.T_P_Value = jStat.ttest(
      (tscore = dataPoints_stats.T),
      (n = dataPoints_stats.n),
      (sides = 2)
    );
    dataPoints_stats.Alpha = jStat.studentt.inv(
      (1 - d3.select("#alphavalue").property("value")) / 2,
      dataPoints_stats.n - 1
    );
  } else if (document.getElementById("rad2").checked) {
    dataPoints_stats.T_P_Value = jStat.ttest(
      (tscore = dataPoints_stats.T),
      (n = dataPoints_stats.n),
      (sides = 1)
    );
    dataPoints_stats.Alpha = jStat.studentt.inv(
      d3.select("#alphavalue").property("value"),
      dataPoints_stats.n - 1
    );
  }
  /*
  if (document.getElementById("rad1").checked) {
    dataPoints_stats.Alpha = jStat.studentt.inv(
      (1 - d3.select("#alphavalue").property("value")) / 2,
      dataPoints_stats.n - 1
    );
  } else {
    dataPoints_stats.Alpha = jStat.studentt.inv(
      d3.select("#alphavalue").property("value"),
      dataPoints_stats.n - 1
    );
  }
  console.log("A", dataPoints_stats.Alpha);  
  */
  // console.log("p from ttest", dataPoints_stats.T_P_Value);
  display_anova_results();
  //console.log(dataPoints_stats.min)
}

function initialization(K) {
  AllData.DataPoints = all_data;
  AllData.Priors = [];
  AllData.mu_estimates = [];
  AllData.cov_estimates = [];
  AllData.clusters = {};
  for (i = 0; i < K; i++) {
    AllData.Priors.push(1 / K);
    AllData.mu_estimates.push(
      AllData.DataPoints[Math.floor(Math.random() * AllData.DataPoints.length)]
    );
    AllData.cov_estimates.push(
      round(
        AllData.DataPoints.map((x) =>
          Math.pow(x - AllData.mu_estimates[i], 2)
        ).reduce((a, b) => a + b) /
          (n - 1),
        2
      )
    );
  }
}

function expectation(K) {
  AllData.clusters.likelihood_Px_k1 = [];
  AllData.clusters.likelihood_Px_k2 = [];
  AllData.clusters.marginal = [];
  AllData.clusters.joints_k1 = [];
  AllData.clusters.joints_k2 = [];
  AllData.clusters.posterior_k1 = [];
  AllData.clusters.posterior_k2 = [];
  for (i = 0; i < K; i++) {
    tempary = [];
    for (j = 0; j < AllData.DataPoints.length; j++) {
      tempary.push(
        round(
          jStat.normal.pdf(
            AllData.DataPoints[j],
            AllData.mu_estimates[i],
            AllData.cov_estimates[i]
          ),
          2
        )
      );
    }
    if (i == 0) {
      AllData.clusters.likelihood_Px_k1 = tempary;
    } else if (i == 1) {
      AllData.clusters.likelihood_Px_k2 = tempary;
    }
  }
  for (i = 0; i < AllData.clusters.likelihood_Px_k1.length; i++) {
    AllData.clusters.marginal.push(
      round(
        AllData.clusters.likelihood_Px_k1[i] +
          AllData.clusters.likelihood_Px_k2[i],
        2
      )
    );
  }
  for (i = 0; i < K; i++) {
    tempary = [];
    tempary2 = [];
    for (j = 0; j < AllData.DataPoints.length; j++) {
      tempary.push(AllData.clusters.marginal[j] * AllData.Priors[i]);
      tempary2.push(tempary[j] / AllData.clusters.marginal[j]);
    }
    if (i == 0) {
      AllData.clusters.joints_k1 = tempary;
      AllData.clusters.posterior_k1=tempary2;
    } else if (i == 1) {
      AllData.clusters.joints_k2 = tempary;
      AllData.clusters.posterior_k2=tempary2;
    }
  }

  console.log(AllData);
}

initialization(2);
expectation(2);
