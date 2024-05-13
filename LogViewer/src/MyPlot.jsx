import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import Papa from 'papaparse';

const MyPlot = () => {
  const [csvData, setCsvData] = useState(null);
  const [plotData, setPlotData] = useState(null);
  const [plotType, setPlotType] = useState('scatter');
  const [plotMode, setPlotMode] = useState('lines+markers');
  const [plotColor, setPlotColor] = useState('red'); 
  const [layout, setLayout] = useState(null); 

  useEffect(() => {
    if (csvData) {
      const layout = updatePlotData(csvData, plotType, plotMode, plotColor); 
      setLayout(layout); 
    }
  }, [csvData, plotType, plotMode, plotColor]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      download: true,
      header: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('CSV parsing error:', results.errors);
          return;
        }
        setCsvData(results.data);
      },
    });
  };

  const updatePlotData = (data, type, mode, color) => { 
    console.log('CSV data:', data);
    
    const firstRow = data[0];
    const xColumnName = Object.keys(firstRow)[0]; 
    const yColumnName = Object.keys(firstRow)[1]; 
    
    const x = data.map((row) => row[xColumnName]);
    const y = data.map((row) => row[yColumnName]);
    
    console.log('X data:', x);
    console.log('Y data:', y);

    const layout = {
      xaxis: { title: { text: xColumnName } },
      yaxis: { title: { text: yColumnName } }
    };
    
    setPlotData([
      {
        x,
        y,
        type,
        mode,
        marker: { color },
      },
    ]);

    return layout; 
  };

  const handlePlotTypeChange = (event) => {
    const newPlotType = event.target.value;
    setPlotType(newPlotType);
  };

  const handlePlotModeChange = (event) => {
    const newPlotMode = event.target.value;
    setPlotMode(newPlotMode);
  };

  const handleColorChange = (event) => {
    const newColor = event.target.value;
    setPlotColor(newColor);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-4">
        <label htmlFor="fileUpload" className="mr-2">
          Upload CSV:
        </label>
        <input
          type="file"
          id="fileUpload"
          accept=".csv"
          onChange={handleFileUpload}
          className="border border-gray-300 rounded-md p-2"
        />
      </div>
      <div className="mb-4 flex items-center">
        <label htmlFor="plotType" className="mr-2 ">
          Plot Type:
        </label>
        <select
          id="plotType"
          value={plotType}
          onChange={handlePlotTypeChange}
          className="border border-gray-300 rounded-md p-2 text-black"
        >
          <option value="scatter">Scatter</option>
          <option value="bar">Bar</option>
          <option value="line">Line</option>
        </select>
      </div>
      <div className="mb-4 flex items-center">
        <label htmlFor="plotMode" className="mr-2">
          Plot Mode:
        </label>
        <select
          id="plotMode"
          value={plotMode}
          onChange={handlePlotModeChange}
          className="border border-gray-300 rounded-md p-2 text-black"
        >
          <option value="lines">Lines</option>
          <option value="markers">Markers</option>
          <option value="lines+markers">Lines + Markers</option>
        </select>
      </div>
      <div className="mb-4 flex items-center">
        <label htmlFor="plotColor" className="mr-2">
          Plot Color:
        </label>
        <select
          id="plotColor"
          value={plotColor}
          onChange={handleColorChange}
          className="border border-gray-300 rounded-md p-2 text-black"
        >
          <option value="red">Red</option>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="yellow">Yellow</option>
        </select>
      </div>
      {plotData && layout && ( 
        <div className="w-full max-w-screen-lg">
          <Plot data={plotData} layout={layout} width={'100%'} height={440} title={'CSV Data Plot'} />
        </div>
      )}
    </div>
  );
};

export default MyPlot;
