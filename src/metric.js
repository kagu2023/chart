import Chart from 'chart.js/auto'

const MetricOptions = [{
    title: "Windows Memory Usage(MB)",
    rawData: require('../win/mem.json'),
    getUsage: function (entry) {
        return entry['MemoryUsage'] / (1024 * 1024);
    },
    lowerBound: 20,
},
{
    title: "Windows CPU Usage",
    rawData: require('../win/cpu.json'),
    getUsage: function (entry) {
        return entry['CpuUsage'];
    },
    lowerBound: 3,
},
{
  title: "Linux Memory Usage(MB)",
  rawData: require('../lnx/mem.json'),
  getUsage: function (entry) {
      return entry['MemoryUsage'] / (1024 * 1024);
  },
  lowerBound: 20,
},
{
  title: "Linux CPU Usage",
  rawData: require('../lnx/cpu.json'),
  getUsage: function (entry) {
      return entry['CpuUsage'];
  },
  lowerBound: 3,
}];

function GetLabels(dataOptions) {
    const labels = dataOptions.rawData.map((d) => d.Timestamp);

    // Remove duplicates
    return [...new Set(labels)];
}

function GetDatasets(dataOptions) {
    // Group the elements by processId and processName
    const groupedData = {};
    const totalCpuUsage = {};

    dataOptions.rawData.forEach(element => {
      const key = `${element.ProcessName}-${element.ProcessId}`;
      if (!groupedData[key]) {
        groupedData[key] = [];
        totalCpuUsage[key] = 0;
      }

      let usage = dataOptions.getUsage(element);
      groupedData[key].push(usage);
      totalCpuUsage[key] += usage;
    });

    const groupedDataList = Object.entries(groupedData);
    const datasets = [];
    groupedDataList.forEach(element => {
        if (totalCpuUsage[element[0]] / element[1].length < dataOptions.lowerBound) {
          return;
        }

        datasets.push({
            label: element[0],
            data: element[1],
            //borderColor: Utils.CHART_COLORS.red,
            //backgroundColor: Utils.transparentize(Utils.CHART_COLORS.red, 0.5),
        });
    });

    return datasets;
}

function GetSumDatasets(datasets) {
    let sumResult = [];
    datasets.forEach(element => {
        for (let i = 0; i < element.data.length; i++) {
            if (i >= sumResult.length) {
                sumResult.push(0);
            }

            sumResult[i] += element.data[i];
        }
    });

    return [{
        label: "Usage Sum",
        data: sumResult,
    }];
}

function DrawChart(elmentId, dataOptions) {
    let datasets = GetDatasets(dataOptions);
    let sumDatasets = GetSumDatasets(datasets);
    const data = {
      labels: GetLabels(dataOptions),
      datasets: datasets.concat(sumDatasets),
    };

    const config = {
      type: 'line',
      data: data,
      options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
            },
            title: {
              display: true,
              text: dataOptions.title
            }
          }
        },
    };

  new Chart(
    document.getElementById(elmentId),
    config,
  );
}

for (let i = 0; i < MetricOptions.length; i++) {
  DrawChart(`metric-${i}`, MetricOptions[i]);
}