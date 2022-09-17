//partial color from colorbrewer, http://colorbrewer2.org/
const colorbrewer = {
  RdBu: [
  '#67001f',
  '#b2182b',
  '#d6604d',
  '#f4a582',
  '#fddbc7',
  '#f7f7f7',
  '#d1e5f0',
  '#92c5de',
  '#4393c3',
  '#2166ac',
  '#053061'] };



const url = 'https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/global-temperature.json';

const req = new XMLHttpRequest();

req.open('GET', url, true);
req.send();
req.onload = function () {
  const globalTem = JSON.parse(req.responseText);

  globalTem.monthlyVariance.forEach(function (item) {
    return item.month = item.month - 1;
  });

  const w = 5 * Math.ceil(globalTem.monthlyVariance.length / 12);
  const h = 480;
  const padding = {
    top: 120,
    right: 100,
    bottom: 150,
    left: 130 };


  const svg = d3.select('#svg-container').
  append('svg').
  attr('width', w + padding.right + padding.left).
  attr('height', h + padding.top + padding.bottom);

  const yScale = d3.scaleBand().
  domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).
  rangeRound([h, 0]);

  const yAxis = d3.axisLeft(yScale).
  tickSize(5).
  tickValues(yScale.domain()).
  tickFormat(function (month) {
    const timeFormat = d3.timeFormat('%B');
    const dateObj = new Date(0);
    dateObj.setUTCMonth(month);
    return timeFormat(dateObj);
  });

  const xScale = d3.scaleBand().
  domain(globalTem.monthlyVariance.map(function (item) {
    return item.year;
  })).
  rangeRound([0, w]);

  const xAxis = d3.axisBottom(xScale).
  tickSize(5).
  tickValues(xScale.domain().filter(function (year) {
    return year % 10 === 0;
  })).

  tickFormat(function (year) {
    const timeFormat = d3.timeFormat('%Y');
    const dateObj = new Date(0);
    dateObj.setUTCFullYear(year);
    return timeFormat(dateObj);
  });



  const varianceSet = globalTem.monthlyVariance.map(function (item) {
    return item.variance;
  });
  const minTem = globalTem.baseTemperature + Math.min.apply(null, varianceSet);
  const maxTem = globalTem.baseTemperature + Math.max.apply(null, varianceSet);
  const legendAxisTem = function (min, max, count) {
    const step = (max - min) / count;
    const calResult = [];

    for (var i = 1; i < count; i++) {
      calResult.push(min + i * step);
    };
    return calResult;
  };
  const legendColor = colorbrewer.RdBu.reverse();

  const legendHeight = 70;
  const legendWidth = 400;

  const legendThreshold = d3.scaleThreshold().
  domain(legendAxisTem(minTem, maxTem, legendColor.length)).
  range(legendColor);

  const legendX = d3.scaleLinear().
  domain([minTem, maxTem]).
  range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendX).
  tickSize(5).
  tickValues(legendThreshold.domain()).
  tickFormat(d3.format('.1f'));

  const legendArea = svg.append('g').
  attr('id', 'legend').
  attr('transform', 'translate(' + padding.left + ', ' + (padding.top + h) + ')');

  const tooltip = d3.select('body').
  append('div').
  attr('id', 'tooltip').
  style('opacity', 0);


  svg.append('g').
  call(yAxis).
  attr('id', 'y-axis').
  attr('transform', 'translate(' + padding.left + ',' + padding.top + ')').
  append('text').
  text('Month').
  attr('transform', 'translate(' + -70 + ',' + h / 2.5 + ')' + 'rotate(-90)').
  style('fill', 'black').
  style('font-size', 20);

  svg.append('g').
  call(xAxis).
  attr('id', 'x-axis').
  attr('transform', 'translate(' + padding.left + ',' + (padding.top + h) + ')').
  append('text').
  text('Years').
  attr('transform', 'translate(' + w / 2.2 + ', ' + 50 + ')').
  style('fill', 'black').
  style('font-size', 20);

  svg.append('text').
  attr('id', 'title').
  text('Global Land-Surface Temperature Heat Map').
  attr('transform', 'translate(' + w / 3 + ',' + padding.top / 2 + ')');

  svg.append('text').
  attr('id', 'description').
  html('Recording per month from ' + globalTem.monthlyVariance[0].year + ' to ' + globalTem.monthlyVariance[globalTem.monthlyVariance.length - 1].year + ' with basic temperature ' + globalTem.baseTemperature + '&#8451;').
  attr('transform', 'translate(' + w / 3.1 + ', ' + padding.top / 1.3 + ')');

  legendArea.append('g').
  call(legendAxis).
  attr('transform', 'translate(' + 0 + ', ' + (legendHeight + 50) + ')');

  legendArea.append('g').
  selectAll('rect').
  data(legendThreshold.range().map(function (color) {
    const arr = legendThreshold.invertExtent(color);

    if (arr[0] == null) {
      arr[0] = legendX.domain()[0];
    } else

    if (arr[1] == null) {
      arr[1] = legendX.domain()[1];
    }

    return arr;
  })).
  enter().
  append('rect').
  attr('y', 120 - legendHeight).
  attr('x', d => legendX(d[0])).
  attr('height', legendHeight).
  attr('width', d => legendX(d[1]) - legendX(d[0])).
  style('fill', d => legendThreshold(d[0]));

  svg.append('g').
  attr('transform', 'translate(' + padding.left + ', ' + padding.top + ')').
  selectAll('rect').
  data(globalTem.monthlyVariance).
  enter().
  append('rect').
  attr('class', 'cell').
  attr('x', d => xScale(d.year)).
  attr('y', d => yScale(d.month)).
  style('fill', d => legendThreshold(globalTem.baseTemperature + d.variance)).
  attr('width', d => xScale.bandwidth(d.year)).
  attr('height', d => yScale.bandwidth(d.month)).
  attr('data-month', d => d.month).
  attr('data-year', d => d.year).
  attr('data-temp', d => globalTem.baseTemperature + d.variance).
  on('mouseover', function (d, e) {
    tooltip.transition().duration(200).style('opacity', 0.7);
    tooltip.attr('data-year', d.year);
    const dateObj = new Date(d.year, d.month);
    tooltip.html(
    d3.timeFormat('%Y - %B')(dateObj) + '<br/>' +
    d3.format('.1f')(globalTem.baseTemperature + d.variance) + ' &#8451;' + '<br/>' +
    d3.format('.1f')(d.variance) + ' &#8451;');

  }).
  on('mouseout', function () {
    tooltip.transition().duration(0).style('opacity', 0);
  });
};