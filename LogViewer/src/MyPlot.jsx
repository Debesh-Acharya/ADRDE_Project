import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { parseCSV as parseCSVUtil, parseXLS as parseXLSUtil, parseJSON as parseJSONUtil, parseYAML as parseYAMLUtil } from './utils/fileParser'

const MyPlot = () => {
  const [csvData, setCsvData] = useState(null);
  const [plotData, setPlotData] = useState(null);
  const [plotType, setPlotType] = useState('scatter');
  const [plotMode, setPlotMode] = useState('lines+markers');
  const [plotColor, setPlotColor] = useState('red');
  const [layout, setLayout] = useState(null);
  const [selectedXColumn, setSelectedXColumn] = useState(null);
  const [selectedYColumn, setSelectedYColumn] = useState(null);

  useEffect(() => {
    if (csvData) {
      const layout = updatePlotData(csvData, plotType, plotMode, plotColor);
      setLayout(layout);
    }
  }, [csvData, plotType, plotMode, plotColor]);

  useEffect(() => {
    if (selectedXColumn && selectedYColumn) {
      if (csvData) {
        const layout = updatePlotData(csvData, plotType, plotMode, plotColor);
        setLayout(layout);
      }
    }
  }, [selectedXColumn, selectedYColumn, csvData, plotType, plotMode, plotColor]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const extension = file.name.split('.').pop().toLowerCase();

    switch (extension) {
      case 'csv':
        parseCSVUtil(file, handleParsedData);
        break;
      case 'xls':
      case 'xlsx':
        import('xlsx').then((XLSX) => {
          parseXLSUtil(file, XLSX, handleParsedData);
        });
        break;
      case 'json':
        parseJSONUtil(file, handleParsedData);
        break;
      case 'yml':
      case 'yaml':
        parseYAMLUtil(file, handleParsedData);
        break;
      default:
        console.error('Unsupported file format');
    }
  };

  const handleParsedData = (results) => {
    if (results.errors.length > 0) {
      console.error('File parsing error:', results.errors);
      return;
    }
    setCsvData(results.data);
    // Set default selected columns
    setSelectedXColumn(Object.keys(results.data[0])[0]);
    setSelectedYColumn(Object.keys(results.data[0])[1]);
  };

  const updatePlotData = (data, type, mode, color) => {
    const layout = {
      xaxis: { title: { text: selectedXColumn } },
      yaxis: { title: { text: selectedYColumn } },
    };

    const x = data.map((row) => row[selectedXColumn]);
    const y = data.map((row) => row[selectedYColumn]);

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

  const handleXColumnChange = (event) => {
    setSelectedXColumn(event.target.value);
  };

  const handleYColumnChange = (event) => {
    setSelectedYColumn(event.target.value);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-4">
        <label htmlFor="fileUpload" className="mr-2">
          Upload File:
        </label>
        <input
          type="file"
          id="fileUpload"
          accept=".csv,.xls,.xlsx,.json,.yml,.yaml"
          onChange={handleFileUpload}
          className="border border-gray-300 rounded-md p-2"
        />
      </div>
      {csvData && (
        <div className="mb-4 flex items-center">
          <label htmlFor="xColumn" className="mr-2">
            X Column:
          </label>
          <select
            id="xColumn"
            value={selectedXColumn}
            onChange={handleXColumnChange}
            className="border border-gray-300 rounded-md p-2 text-black"
          >
            {Object.keys(csvData[0]).map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>
      )}
      {csvData && (
        <div className="mb-4 flex items-center">
          <label htmlFor="yColumn" className="mr-2">
            Y Column:
          </label>
          <select
            id="yColumn"
            value={selectedYColumn}
            onChange={handleYColumnChange}
            className="border border-gray-300 rounded-md p-2 text-black"
          >
            {Object.keys(csvData[0]).map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>
      )}
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
          <Plot data={plotData} layout={layout} width={'100%'} height={440} title={'File Data Plot'} />
        </div>
      )}
    </div>
  );
};

export default MyPlot;