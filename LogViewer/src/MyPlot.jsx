import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import Papa from 'papaparse';

const MyPlot = () => {
  const [csvData, setCsvData] = useState(null);
  const [plotData, setPlotData] = useState(null);
  const [plotType, setPlotType] = useState('scatter');
  const [plotMode, setPlotMode] = useState('lines+markers');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    Papa.parse(file, {
      download: true,
      header: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('CSV parsing error:', results.errors);
          return;
        }
        setCsvData(results.data);
        if (results.data.length > 0) {
          updatePlotData(results.data, plotType, plotMode);
        }
      },
    });
  };

  const updatePlotData = (data, type, mode) => {
    console.log('CSV data:', data);
    
    // Get the first row to determine column names
    const firstRow = data[0];
    const xColumnName = Object.keys(firstRow)[0]; // Assuming the X data is in the first column
    const yColumnName = Object.keys(firstRow)[1]; // Assuming the Y data is in the second column
    
    const x = data.map((row) => row[xColumnName]);
    const y = data.map((row) => row[yColumnName]);
    
    console.log('X data:', x);
    console.log('Y data:', y);
    
    setPlotData([
      {
        x,
        y,
        type,
        mode,
        marker: { color: 'red' },
      },
    ]);
  };

  const handlePlotTypeChange = (event) => {
    const newPlotType = event.target.value;
    setPlotType(newPlotType);
    updatePlotData(csvData, newPlotType, plotMode);
  };

  const handlePlotModeChange = (event) => {
    const newPlotMode = event.target.value;
    setPlotMode(newPlotMode);
    updatePlotData(csvData, plotType, newPlotMode);
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
        <label htmlFor="plotType" className="mr-2">
          Plot Type:
        </label>
        <select
          id="plotType"
          value={plotType}
          onChange={handlePlotTypeChange}
          className="border border-gray-300 rounded-md p-2"
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
          className="border border-gray-300 rounded-md p-2"
        >
          <option value="lines">Lines</option>
          <option value="markers">Markers</option>
          <option value="lines+markers">Lines + Markers</option>
        </select>
      </div>
      {plotData && (
        <div className="w-full max-w-screen-lg">
          <Plot data={plotData} layout={{ width: '100%', height: 440, title: 'CSV Data Plot' }} />
        </div>
      )}
    </div>
  );
};

export default MyPlot;
