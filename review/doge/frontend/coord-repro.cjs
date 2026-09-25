// Reproduces the actual ECharts dependency failure before the uniform-color fix.
const fs = require('node:fs');
Object.defineProperty(globalThis, 'navigator', { value: undefined });
const echarts = require('../../../frontend/node_modules/echarts');
const rows = [];
for (const data of [[], [[1, 0]], [[1, 0], [2, 0]], [[1, 2], [2, 3]]]) {
  for (const fixed of [false, true]) {
    const chart = echarts.init(null, null, { renderer: 'svg', ssr: true, width: 500, height: 300 });
    let error = null;
    try {
      chart.setOption({ animation: false, xAxis: { type: 'time' }, yAxis: { type: 'value' },
        series: [{ type: 'line', data, ...(fixed ? { color: '#c3a634' } : {}) }],
        ...(fixed ? {} : { visualMap: { show: false, pieces: [{ gte: 0, color: '#c3a634' }] } }) });
      chart.renderToSVGString();
    } catch (e) { error = e.stack; }
    chart.dispose();
    if (fixed && error) throw Error(error);
    if (!fixed && data.length && !error?.includes("reading 'coord'")) throw Error('Expected pre-fix failure absent');
    rows.push({ data, fixed, error });
  }
}
fs.writeFileSync(__dirname + '/coord-repro.json', JSON.stringify(rows, null, 2));
console.log(rows.map(({data,fixed,error})=>({points:data.length,fixed,error:error?.split('\n')[0]||null})));
