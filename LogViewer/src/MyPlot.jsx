import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { parseCSV as parseCSVUtil, parseXLS as parseXLSUtil, parseJSON as parseJSONUtil, parseYAML as parseYAMLUtil } from './utils/fileParserUtils';
import { getRandomColor } from './utils/plottingUtils';

const MyPlot = ({ onParsedData }) => {
  const [csvData, setCsvData] = useState(null);
  const [plotData, setPlotData] = useState(null);
  const [plotType, setPlotType] = useState('scatter');
  const [plotMode, setPlotMode] = useState('lines+markers');
  const [layout, setLayout] = useState(null);
  const [selectedXColumn, setSelectedXColumn] = useState(null);
  const [selectedYColumns, setSelectedYColumns] = useState([]);
  const [yColumnColors, setYColumnColors] = useState({});
  const [showUpdateButton, setShowUpdateButton] = useState(false);

  useEffect(() => {
    if (csvData) {
      const layout = updatePlotData(csvData, plotType, plotMode);
      setLayout(layout);
      onParsedData(csvData);  // Notify parent with parsed data
    }
  }, [csvData, plotType, plotMode, selectedXColumn, selectedYColumns]);

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
    if (results.errors && results.errors.length > 0) {
      console.error('File parsing error:', results.errors);
      return;
    }
    setCsvData(results.data);
    setSelectedXColumn(Object.keys(results.data[0])[0]);
    setSelectedYColumns([Object.keys(results.data[0])[1]]);
    const defaultColors = {};
    Object.keys(results.data[0]).forEach((column, index) => {
      if (index !== 0) {
        defaultColors[column] = getRandomColor();
      }
    });
    setYColumnColors(defaultColors);
  };

  const updatePlotData = (data, type, mode) => {
    const layout = {
      xaxis: { title: { text: selectedXColumn } },
      yaxis: { title: { text: 'Values' } },
    };

    const plots = selectedYColumns.map((column) => {
      const y = data.map((row) => row[column]);
      return {
        x: data.map((row) => row[selectedXColumn]),
        y,
        type,
        mode,
        marker: { color: yColumnColors[column] },
        name: column,
      };
    });

    setPlotData(plots);
    return layout;
  };

  const handlePlotTypeChange = (event) => {
    setPlotType(event.target.value);
    setShowUpdateButton(true);
  };

  const handlePlotModeChange = (event) => {
    setPlotMode(event.target.value);
    setShowUpdateButton(true);
  };

  const handleColorChange = (column, event) => {
    setYColumnColors({ ...yColumnColors, [column]: event.target.value });
    setShowUpdateButton(true);
  };

  const handleXColumnChange = (event) => {
    setSelectedXColumn(event.target.value);
    setShowUpdateButton(true);
  };

  const handleYColumnChange = (index, event) => {
    const newSelectedYColumns = [...selectedYColumns];
    newSelectedYColumns[index] = event.target.value;
    setSelectedYColumns(newSelectedYColumns);
    setShowUpdateButton(true);
  };

  const handleAddParameter = () => {
    const columns = Object.keys(csvData[0]);
    const remainingColumns = columns.filter(column => !selectedYColumns.includes(column) && column !== selectedXColumn);
    if (remainingColumns.length > 0) {
      setSelectedYColumns([...selectedYColumns, remainingColumns[0]]);
      setShowUpdateButton(true);
    }
  };

  const handleRemoveParameter = (index) => {
    const newSelectedYColumns = [...selectedYColumns];
    newSelectedYColumns.splice(index, 1);
    setSelectedYColumns(newSelectedYColumns);
    setShowUpdateButton(true);
  };

  const handleSubmit = () => {
    const layout = updatePlotData(csvData, plotType, plotMode);
    setLayout(layout);
    setShowUpdateButton(false);
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
      {selectedXColumn && (
        <div className="mb-4">
          <label>Y Columns:</label>
          {selectedYColumns.map((column, index) => (
            <div key={index} className="flex items-center mb-2">
              <select
                value={column}
                onChange={(e) => handleYColumnChange(index, e)}
                className="border border-gray-300 rounded-md p-2 text-black mr-2"
              >
                {Object.keys(csvData[0]).map((yColumn) => (
                  <option key={yColumn} value={yColumn}>
                    {yColumn}
                  </option>
                ))}
              </select>
              <input
                type="color"
                value={yColumnColors[column]}
                onChange={(e) => handleColorChange(column, e)}
                className="mr-2 p-1 size-3 rounded-lg"
                style={{ backgroundColor: yColumnColors[column] }}
              />
              {index > 0 && (
                <button onClick={() => handleRemoveParameter(index)} className="bg-red-500 text-white px-2 py-1 rounded-md">
                  Remove
                </button>
              )}
            </div>
          ))}
          <button onClick={handleAddParameter} className="bg-green-500 text-white px-2 py-1 rounded-md mr-2">
            Add Parameter
          </button>
          {showUpdateButton && (
            <button onClick={handleSubmit} className="bg-blue-500 text-white px-2 py-1 rounded-md">
              Update Plot
            </button>
          )}
        </div>
      )}
      <div className="mb-4 flex items-center">
        <label htmlFor="plotType" className="mr-2">
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
      {plotData && layout && (
        <div className="w-full max-w-screen-l" style={{ margin: 0, padding: 0 }}>
          <Plot data={plotData} layout={layout} style={{ width: '100%', height: '100%' }} title={'File Data Plot'} responsive={true} />
        </div>
      )}
    </div>
  );
};

export default MyPlot;
