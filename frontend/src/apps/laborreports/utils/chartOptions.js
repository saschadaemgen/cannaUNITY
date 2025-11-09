// frontend/src/apps/laborreports/utils/chartOptions.js

// Radar-Diagramm-Optionen für Cannabinoide
export const getCannabinoidChartOptions = (data) => {
  return {
    title: {
      text: 'Cannabinoid-Profil',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `${params.name}: ${params.value}%`;
      }
    },
    radar: {
      indicator: [
        { name: 'THC', max: 30 },
        { name: 'THCA', max: 30 },
        { name: 'CBD', max: 30 },
        { name: 'CBDA', max: 30 },
        { name: 'CBN', max: 5 },
        { name: 'CBG', max: 5 },
        { name: 'CBGA', max: 5 },
      ]
    },
    series: [
      {
        name: 'Cannabinoide (%)',
        type: 'radar',
        data: [
          {
            value: [
              data.thc || 0,
              data.thca || 0,
              data.cbd || 0,
              data.cbda || 0,
              data.cbn || 0,
              data.cbg || 0,
              data.cbga || 0,
            ],
            name: 'Gehalt (%)'
          }
        ],
        areaStyle: {
          color: 'rgba(76, 175, 80, 0.3)'
        },
        lineStyle: {
          color: '#4CAF50'
        },
        itemStyle: {
          color: '#4CAF50'
        }
      }
    ]
  };
};

// Radar-Diagramm-Optionen für Terpene
export const getTerpeneChartOptions = (data) => {
  return {
    title: {
      text: 'Terpen-Profil',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `${params.name}: ${params.value}%`;
      }
    },
    radar: {
      indicator: [
        { name: 'Myrcen', max: 1 },
        { name: 'Limonen', max: 1 },
        { name: 'Caryophyllen', max: 1 },
        { name: 'Terpinolen', max: 1 },
        { name: 'Linalool', max: 1 },
        { name: 'Pinen', max: 1 },
        { name: 'Humulen', max: 1 },
        { name: 'Ocimen', max: 1 },
      ]
    },
    series: [
      {
        name: 'Terpene (%)',
        type: 'radar',
        data: [
          {
            value: [
              data.myrcene || 0,
              data.limonene || 0,
              data.caryophyllene || 0,
              data.terpinolene || 0,
              data.linalool || 0,
              data.pinene || 0,
              data.humulene || 0,
              data.ocimene || 0,
            ],
            name: 'Gehalt (%)'
          }
        ],
        areaStyle: {
          color: 'rgba(156, 39, 176, 0.3)'
        },
        lineStyle: {
          color: '#9C27B0'
        },
        itemStyle: {
          color: '#9C27B0'
        }
      }
    ]
  };
};