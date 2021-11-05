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
likelihoodbtnselected = true;
marginalbtnselected = false;
jointsbtnselected = false;
posteriorsbtnselected = false;

var highlightedPoint = [];
var AllData = {};
AllData.DataPoints = [];
AllData.mu_estimates = [];
AllData.k = 2;

Dist_datapoints = [];
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
// x-axis view
var xAxis = svg
  .append("g")
  .attr("class", "xaxis")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x_scale));
// y-axis view
var yAxis = svg.append("g").attr("class", "yaxis").call(d3.axisLeft(y_scale));
//control section
var inputSec = d3.select(".controls").append("div").attr("id", "inputsec");
// dropdownbox in control panel
var dropDownbox = inputSec.append("div").attr("class", "inputbox0");
dropDownbox.append("label").attr("for", "dropdown").text("Number of Groups");
var dropDown = dropDownbox
  .append("select")
  .attr("name", "name-list")
  .attr("id", "dropdown");
var dropDownOptions = [0, 1, 2];
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
  // d3.select(".inputbox_xrange_labels").remove();
  // d3.selectAll(".labels").remove();
  // //d3.select(".inputbox0").remove();
  // d3.select(".xrange_labels").remove();
  // d3.selectAll(".inputbox").remove();
  // for (let group_i = 0; group_i < dataPoints_groups.n; group_i++) {
  //   svg.select("selected_group_" + group_i + "").remove();
  // }
  //console.log(this.value);
  AllData.k = d3.select("#dropdown").property("value");
});
// Control panel
function setupControlPanel(noOfGroups) {
  //console.log("setupControlPanel", noOfGroups);
  // Specifying the number of groups
  d3.select("#dropdown").attr("value", noOfGroups);
  // Group parametets section
  var groups = new Array(noOfGroups).fill(0);
  // intialize view components
  mu_inputcheck = inputSec.append("div").attr("class", "inputbox");
  mu_inputcheck
    .append("label")
    .attr("for", "mu_inputcheck")
    .text("Select Estimated Means");
  mu_inputcheck
    .append("input")
    .attr("type", "checkbox")
    .attr("id", "mu_inputcheck");
  // dropdown_div.append("label").attr("for", "mu1dropdown").text("mu_1");
  // dropdown_div.append("select").attr("id", "mu1dropdown");

  // dropdown_div.append("label").attr("for", "mu2dropdown").text("mu_2");
  // dropdown_div.append("select").attr("id", "mu2dropdown");

  initialize_btn_div = inputSec.append("div").attr("class", "inputbox");
  initialize_btn_div
    .append("input")
    .attr("type", "button")
    .attr("id", "initialize-button")
    .attr("value", "Initialize")
    .on("click", function () {
      initialization(AllData.k);
      visualize();
      output_table();
      plot_distributions(AllData.k);
      setup_axis();
    });

  expectation_btn_div = inputSec.append("div").attr("class", "inputbox");
  expectation_btn_div
    .append("input")
    .attr("type", "button")
    .attr("id", "expectation-button")
    .attr("value", "Expectation")
    .on("click", function () {
      expectation(AllData.k);
      maximization(AllData.k);
      visualize();
      output_table();
    });
  maximization_btn_div = inputSec.append("div").attr("class", "inputbox");
  maximization_btn_div
    .append("input")
    .attr("type", "button")
    .attr("id", "maximization-button")
    .attr("value", "Maximization")
    .on("click", function () {
      expectation(AllData.k);
      maximization(AllData.k);
      visualize();
      output_table();
    });

  output_box = inputSec.append("div").attr("class", "outputbox");
  outputboxheader = output_box.append("div").attr("class", "outputboxheader");
  table_div = output_box.append("div").attr("class", "outputtablediv");
  table = table_div.append("table").attr("class", "outputtable");
  outputboxheader
    .append("input")
    .attr("type", "button")
    .attr("class", "tabs")
    .attr("value", "Likelihood")
    .on("click", function () {
      likelihoodbtnselected = true;
      marginalbtnselected = false;
      jointsbtnselected = false;
      posteriorsbtnselected = false;
      output_table();
    });
  outputboxheader
    .append("input")
    .attr("type", "button")
    .attr("class", "tabs")
    .attr("value", "Joints")
    .on("click", function () {
      likelihoodbtnselected = false;
      marginalbtnselected = false;
      jointsbtnselected = true;
      posteriorsbtnselected = false;
      output_table();
    });
  outputboxheader
    .append("input")
    .attr("type", "button")
    .attr("class", "tabs")
    .attr("value", "Marginal")
    .on("click", function () {
      likelihoodbtnselected = false;
      marginalbtnselected = true;
      jointsbtnselected = false;
      posteriorsbtnselected = false;
      output_table();
    });
  outputboxheader
    .append("input")
    .attr("type", "button")
    .attr("class", "tabs")
    .attr("value", "Posteriors")
    .on("click", function () {
      likelihoodbtnselected = false;
      marginalbtnselected = false;
      jointsbtnselected = false;
      posteriorsbtnselected = true;
      output_table();
    });
  // initialize model: arrays in dataPoints_Groups
  // calc_param();
  var mue_dropDownboxes = inputSec
    .append("div")
    .attr("class", "mue_dropdown_div");
  mue_dropDownboxes.append("label").attr("for", "mue1").text("mu 1");
  var dropDown1 = mue_dropDownboxes
    .append("select")
    .attr("name", "name-list")
    .attr("id", "mu1_dropdown");
  var dropDownOptions = [0, 1, 2];
  var options = dropDown1
    .selectAll("option")
    .data(dropDownOptions)
    .enter()
    .append("option")
    .text(function (d) {
      return d;
    });

  mue_dropDownboxes.append("label").attr("for", "mue1").text("mu 2");
  var dropDown2 = mue_dropDownboxes
    .append("select")
    .attr("name", "name-list")
    .attr("id", "mu2_dropdown");
  var dropDownOptions = [0, 1, 2];
  var options = dropDown2
    .selectAll("option")
    .data(dropDownOptions)
    .enter()
    .append("option")
    .text(function (d) {
      return d;
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
  // X-axis range section
  var xrange_labels = inputSec.append("div").attr("class", "xrange_labels");
  xrange_labels
    .selectAll("li")
    .data(["X-min", "X-max"])
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

  visualize();
  register_listeners();
}
setupControlPanel(1);
function visualize() {
  // console.log("visualize");
  setup_axis();
  plot_datapoints();
  // plot_distributions(2);
  setup_axis();
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
}
function sortByProperty(property) {
  return function (a, b) {
    if (a[property] > b[property]) return 1;
    else if (a[property] < b[property]) return -1;

    return 0;
  };
}

function plot_distributions(K) {
  svg.selectAll("path").remove();
  var line = d3
    .line()
    .x(function (d) {
      return x_scale(d.Xi);
    })
    .y(function (d) {
      return y_scale(d.P_Xi);
    });

  Dist_datapoints = [];
  // console.log("dg",dataPoints_groups);
  //console.log("ds", dataPoints_stats)
  for (let group_i = 0; group_i < K; group_i++) {
    // if (dataPoints_groups[group_i].n < 2)
    // 	continue; // group has less than 2 members yet.
    var mean = AllData.mu_estimates[group_i];
    var sd = Math.sqrt(AllData.cov_estimates[group_i]);
    //console.log(mean,sd)
    var datapoints = [];
    var left = mean - 4 * sd;
    var right = mean + 4 * sd;
    step_size = (right - left) / 200;
    // console.log("left",left);
    // console.log("right",right);
    for (let Xi = mean - 4 * sd; Xi < mean + 4 * sd; Xi += step_size) {
      Dist_datapoints.push(Xi);
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

function output_table() {
  d3.select(".outputtable").selectAll("tr").remove();
  if (likelihoodbtnselected) {
    tr = ["Index", "Likelihood_K1", "Likelihood_K1"];
  } else if (marginalbtnselected) {
    tr = ["Index", "Marginal"];
  } else if (jointsbtnselected) {
    tr = ["Index", "Joint_K1", "Joint_K2"];
  } else if (posteriorsbtnselected) {
    tr = ["Groups", "Posteriors_K1", "Posteriors_K1"];
  }
  table
    .append("tr")
    .selectAll("th")
    .data(tr)
    .enter()
    .append("th")
    .text(function (d) {
      return d;
    });
  if (likelihoodbtnselected) {
    for (let row = 0; row < AllData.clusters.likelihood[0].length; row++) {
      temp_ary = [];
      temp_ary.push(row);
      temp_ary.push(AllData.clusters.likelihood[0][row]);
      temp_ary.push(AllData.clusters.likelihood[1][row]);
      table
        .append("tr")
        .selectAll("td")
        .data(temp_ary)
        .enter()
        .append("td")
        .text(function (d) {
          return d;
        });
    }
  } else if (marginalbtnselected) {
    for (let row = 0; row < AllData.clusters.marginal.length; row++) {
      temp_ary = [];
      temp_ary.push(row);
      temp_ary.push(AllData.clusters.marginal[row]);
      table
        .append("tr")
        .selectAll("td")
        .data(temp_ary)
        .enter()
        .append("td")
        .text(function (d) {
          return d;
        });
    }
  } else if (jointsbtnselected) {
    for (let row = 0; row < AllData.clusters.jointprob[0].length; row++) {
      temp_ary = [];
      temp_ary.push(row);
      temp_ary.push(AllData.clusters.jointprob[0][row]);
      temp_ary.push(AllData.clusters.jointprob[1][row]);
      table
        .append("tr")
        .selectAll("td")
        .data(temp_ary)
        .enter()
        .append("td")
        .text(function (d) {
          return d;
        });
    }
  } else if (posteriorsbtnselected) {
    for (let row = 0; row < AllData.clusters.posterior[0].length; row++) {
      temp_ary = [];
      temp_ary.push(row);
      temp_ary.push(AllData.clusters.posterior[0][row]);
      temp_ary.push(AllData.clusters.posterior[1][row]);
      table
        .append("tr")
        .selectAll("td")
        .data(temp_ary)
        .enter()
        .append("td")
        .text(function (d) {
          return d;
        });
    }
  }
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
  svg.selectAll(".circletext").remove();
  svg
    .append("g")
    .selectAll("circle")
    .data(AllData.DataPoints)
    .enter()
    .append("circle")
    .attr("cy", height)
    .attr("fill", "red")
    .style("opacity", "0.5")
    .attr("cx", function (d) {
      return x_scale(d);
    })
    .attr("r", 8)
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .on("mouseover", function (d) {
      highlightedPoint = [];
      d3.select(this)
        .transition()
        .duration(100)
        .style("opacity", "1")
        .attr("stroke-width", 5);

      // svg
      //   .append("line")
      //   .attr("class", "hoverlines")
      //   .style("stroke", "grey")
      //   .style("stroke-width", 1)
      //   .attr("x1", x_scale(d))
      //   .attr("y1", y_scale(0))
      //   .attr("x2", x_scale(d))
      //   .attr("y2", function (d) {
      //     return y_scale(
      //       AllData.clusters.likelihood[0][AllData.DataPoints.indexOf(d)]
      //     );
      //   });
      // svg
      //   .append("line")
      //   .attr("class", "hoverlines")
      //   .style("stroke", "grey")
      //   .style("stroke-width", 1)
      //   .attr("x1", x_scale(xmin))
      //   .attr("y1", y_scale(d.P_Xi))
      //   .attr("x2", x_scale(d.Xi))
      //   .attr("y2", y_scale(d.P_Xi));
    })
    .on("mouseout", function (d) {
      d3.selectAll(".hoverlines").remove();
      d3.select(this)
        .transition()
        .duration(100)
        .style("opacity", "0.5")
        .attr("stroke-width", 0);
    })
    .on("mouseup", function (d) {
      if (document.getElementById("mu_inputcheck").checked) {
        if (AllData.mu_estimates.length >= 2) {
          AllData.mu_estimates.pop();
          AllData.mu_estimates[0] = d;
        } else {
          AllData.mu_estimates.push(d);
        }
      }
    });

  svg
    .append("g")
    .selectAll("text")
    .data(AllData.DataPoints)
    .enter()
    .append("text")
    .attr("class", "circletext")
    .attr("dx", function (d) {
      return x_scale(d) - 3.5;
    })
    .attr("dy", height - 9)
    .text(function (d) {
      return AllData.DataPoints.indexOf(d);
    })

    .attr("color", "black");
  // .on("click", function () {
  //   var index = findindex(highlightedPoint[0].Xi);
  //   console.log(highlightedPoint[0].Xi, highlightedPoint[0].P_Xi, index);
  //   dataPoints_groups[group_i].datapoints.splice(index, 1);
  //   console.log(dataPoints_groups[group_i].datapoints);
  //   this.remove();
  //   calc_param();
  //   visualize();
  // });

  // draw mean circles if datapoints more than 1
  // mean_data = [];
  // if (dataPoints_groups[group_i].datapoints.length > 1)
  //   mean_data.push(dataPoints_groups[group_i].mean);

  // circles[group_i] = svg
  //   .append("g")
  //   .selectAll("circle")
  //   .data(mean_data)
  //   .enter()
  //   .append("circle")
  //   .attr("cy", height)
  //   .attr("fill", fillcolors[group_i])
  //   .style("opacity", "0.7")
  //   .attr("cx", function (d) {
  //     return x_scale(d);
  //   })
  //   .attr("r", 9)
  //   .style("stroke", "black")
  //   .attr("stroke-width", 0)
  //   .on("mouseover", function (d) {
  //     d3.select(this)
  //       .transition()
  //       .duration(100)
  //       .style("opacity", "1")
  //       .attr("stroke-width", 3);
  //   })
  //   .on("mouseout", function (d) {
  //     d3.select(this)
  //       .transition()
  //       .duration(100)
  //       .style("opacity", "0.7")
  //       .attr("stroke-width", 0);
  //   })
  //   .on("click", function () {
  //     this.remove();
  //   });

  // draw global mean for all datapoints of all groups
  // circle_global_mean = svg
  //   .append("g")
  //   .selectAll("circle")
  //   .data([dataPoints_stats.mean])
  //   .enter()
  //   .append("circle")
  //   .attr("cy", height)
  //   .attr("fill", "grey")
  //   //.style("opacity", "0.3")
  //   .style("stroke", "black")
  //   .attr("cx", function (d) {
  //     return x_scale(d);
  //   })
  //   .attr("r", 9)
  //   .style("stroke", "black")
  //   .attr("stroke-width", 0)
  //   .on("mouseover", function (d) {
  //     d3.select(this)
  //       .transition()
  //       .duration(100)
  //       .style("opacity", "1")
  //       .attr("stroke-width", 3);
  //   })
  //   .on("mouseout", function (d) {
  //     d3.select(this)
  //       .transition()
  //       .duration(100)
  //       .style("opacity", "0.7")
  //       .attr("stroke-width", 0);
  //   })
  //   .on("click", function () {
  //     this.remove();
  //   });
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
function setup_axis() {
  //updating x & y ranges
  xmin = d3.select("#x_Min").property("value");
  xmax = d3.select("#x_Max").property("value");
  if (Dist_datapoints.length != 0) {
    datamin = d3.min(Dist_datapoints);
    datamax = d3.max(Dist_datapoints);
  } else {
    datamin = 0;
    datamax = 0;
  }

  if (xmin < datamin - 1 && xmax > datamax + 1) {
    x_scale.domain([xmin, xmax]).nice;
  } else if (xmin < datamin - 1 && xmax < datamax + 1) {
    x_scale.domain([xmin, datamax + 2]).nice;
  } else if (xmin > datamin - 1 && xmax > datamax + 1) {
    x_scale.domain([datamin - 2, xmax]).nice;
  } else if (xmin > datamin - 1 && xmax < datamax + 1) {
    x_scale.domain([datamin - 2, datamax + 2]).nice;
  } else {
    x_scale.domain([datamin - 5, datamax + 5]).nice;
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
  if (!document.getElementById("mu_inputcheck").checked) {
    m = d3.mouse(svg.node());
    Xi = x_scale.invert(m[0]);
    Xi = round(Xi, 2);
    AllData.DataPoints.push(Xi);
    console.log(AllData.DataPoints);
    // initialization(2);
    visualize();
    // output_table();
    // plot_distributions(2);
    // setup_axis();
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
}

function initialization(K) {
  // AllData.DataPoints = [1, 2, 3, 2, 1, 6, 4, 4, 5, 7];
  AllData.Priors = [];
  AllData.cov_estimates = [];
  AllData.clusters = {};
  AllData.clusters.likelihood = [];
  AllData.clusters.marginal = [];
  AllData.clusters.jointprob = [];
  AllData.clusters.posterior = [];
  // index1 = Math.floor(Math.random() * AllData.DataPoints.length);
  // index2 = Math.floor(Math.random() * AllData.DataPoints.length);
  // console.log(index1, index2);
  // AllData.mu_estimates.push(AllData.DataPoints[index1]);
  // AllData.mu_estimates.push(AllData.DataPoints[index2]);
  mu =
    AllData.DataPoints.reduce((total, num) => total + num) /
    AllData.DataPoints.length;
  for (i = 0; i < K; i++) {
    AllData.Priors.push(1 / K);
    //AllData.mu_estimates.push(
    //  AllData.DataPoints[Math.floor(Math.random() * AllData.DataPoints.length)]
    //);
    console.log(AllData.mu_estimates, AllData.DataPoints.length);
    //AllData.cov_estimates.push(
    //    AllData.DataPoints.map((num) =>
    //     Math.pow(num - AllData.mu_estimates[i], 2)
    //   ).reduce((total, num) => total + num) / (AllData.DataPoints.length - 1));
    AllData.cov_estimates.push(
      AllData.DataPoints.map((x) => Math.pow(x - mu, 2)).reduce(
        (total, x) => total + x
      ) /
        (AllData.DataPoints.length - 1)
    );
    AllData.clusters.likelihood.push([]);
    AllData.clusters.marginal = [];
    AllData.clusters.jointprob.push([]);
    AllData.clusters.posterior.push([]);
  }
  console.log(
    "Initial Parameters",
    "mu",
    AllData.mu_estimates,
    "cov",
    AllData.cov_estimates
  );
  // for (iteration = 1; iteration < 10; iteration++) {
  //   console.log(
  //     "iteration",
  //     iteration,
  //     "mu",
  //     AllData.mu_estimates,
  //     "cov",
  //     AllData.cov_estimates
  //   );
  //   expectation(2);
  //   maximization(2);
  // }
}

function expectation(K) {
  for (i = 0; i < K; i++) {
    AllData.clusters.likelihood[i] = AllData.DataPoints.map((d) =>
      round(
        jStat.normal.pdf(
          d,
          AllData.mu_estimates[i],
          Math.sqrt(AllData.cov_estimates[i])
        ),
        3
      )
    );
    AllData.clusters.jointprob[i] = AllData.clusters.likelihood[i].map((x) =>
      round(x * AllData.Priors[i], 3)
    );
  }
  AllData.clusters.marginal = AllData.clusters.jointprob.reduce((row1, row2) =>
    row1.map((num, index) => round(num + row2[index], 3))
  );
  for (i = 0; i < K; i++) {
    AllData.clusters.posterior[i] = AllData.clusters.jointprob[i].map(
      (num, index) => round(num / AllData.clusters.marginal[index], 3)
    );
  }
  console.log(AllData);
}
function maximization(K) {
  mu = [];
  for (k = 0; k < K; k++) {
    total_posterior = AllData.clusters.posterior[k].reduce(
      (total, num) => total + num
    );
    normalized_posterior = AllData.clusters.posterior[k].map(
      (p_of_k_given_x) => p_of_k_given_x / total_posterior
    );

    weighted_points = AllData.DataPoints.map(
      (x, index) => x * AllData.clusters.posterior[k][index]
    );
    console.log("normalized_posterior ", normalized_posterior);
    AllData.mu_estimates[k] =
      weighted_points.reduce((total, num) => total + num) / total_posterior;

    // calc covariance w.r.t. weighted points
    AllData.cov_estimates[k] = AllData.DataPoints.map(
      (x, index) =>
        Math.pow(x - AllData.mu_estimates[k], 2) * normalized_posterior[index]
    ).reduce((total, num) => total + num);
  }
}
