import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { parseCSV as parseCSVUtil, parseXLS as parseXLSUtil, parseJSON as parseJSONUtil, parseYAML as parseYAMLUtil } from './utils/fileParserUtils';
import { getRandomColor } from './utils/plottingUtils';

const MyPlot = ({ onParsedData }) => {
  const [csvData, setCsvData] = useState(null);
  const [plotData, setPlotData] = useState(null);
  const [plotType, setPlotType] = useState('scatter');
  const [plotMode, setPlotMode] = useState('lines+markers');
  const [is3D, setIs3D] = useState(false);
  const [layout, setLayout] = useState(null);
  const [selectedXColumn, setSelectedXColumn] = useState(null);
  const [selectedYColumns, setSelectedYColumns] = useState([]);
  const [selectedZColumn, setSelectedZColumn] = useState(null);
  const [yColumnColors, setYColumnColors] = useState({});
  const [showUpdateButton, setShowUpdateButton] = useState(false);

  useEffect(() => {
    if (csvData) {
      const layout = updatePlotData(csvData, plotType, plotMode, is3D);
      setLayout(layout);
      onParsedData(csvData);  // Notify parent with parsed data
    }
  }, [csvData, plotType, plotMode, selectedXColumn, selectedYColumns, selectedZColumn, is3D]);

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
    const columns = Object.keys(results.data[0]);
    setSelectedXColumn(columns[0]);
    setSelectedYColumns([columns[1]]);
    setSelectedZColumn(columns.length > 2 ? columns[2] : null);
    const defaultColors = {};
    columns.forEach((column, index) => {
      if (index > 0) {
        defaultColors[column] = getRandomColor();
      }
    });
    setYColumnColors(defaultColors);
  };

  const updatePlotData = (data, type, mode, is3D) => {
    const layout = {
      xaxis: { title: { text: selectedXColumn } },
      yaxis: { title: { text: 'Values' } },
    };
  
    const plots = is3D ? [{
      x: data.map((row) => row[selectedXColumn]),
      y: data.map((row) => row[selectedYColumns[0]]),
      z: data.map((row) => row[selectedZColumn]),
      type: type === 'scatter' ? 'scatter3d' : type,
      mode: 'markers',
      marker: { color: yColumnColors[selectedYColumns[0]] },
      name: `${selectedYColumns[0]} vs ${selectedXColumn} vs ${selectedZColumn}`,
    }] : selectedYColumns.map(yColumn => ({
      x: data.map((row) => row[selectedXColumn]),
      y: data.map((row) => row[yColumn]),
      type,
      mode,
      marker: { color: yColumnColors[yColumn] },
      name: `${yColumn} vs ${selectedXColumn}`,
    }));
  
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

  const handlePlotDimensionChange = (event) => {
    setIs3D(event.target.value === '3D');
    setShowUpdateButton(true);
  };

  const handleColorChange = (yColumn, event) => {
    setYColumnColors({ ...yColumnColors, [yColumn]: event.target.value });
    setShowUpdateButton(true);
  };

  const handleXColumnChange = (event) => {
    setSelectedXColumn(event.target.value);
    setShowUpdateButton(true);
  };

  const handleAddYColumn = () => {
    setSelectedYColumns([...selectedYColumns, '']);
  };

  const handleRemoveYColumn = (index) => {
    const newSelectedYColumns = [...selectedYColumns];
    newSelectedYColumns.splice(index, 1);
    setSelectedYColumns(newSelectedYColumns);
    setShowUpdateButton(true);
  };

  const handleYColumnChange = (index, event) => {
    const newSelectedYColumns = [...selectedYColumns];
    newSelectedYColumns[index] = event.target.value;
    setSelectedYColumns(newSelectedYColumns);
    setShowUpdateButton(true);
  };

  const handleZColumnChange = (event) => {
    setSelectedZColumn(event.target.value);
    setShowUpdateButton(true);
  };

  const handleSubmit = () => {
    const layout = updatePlotData(csvData, plotType, plotMode, is3D);
    setLayout(layout);
    setShowUpdateButton(false);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
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
      {selectedXColumn && selectedYColumns.map((yColumn, index) => (
        <div key={index} className="mb-4 flex items-center">
          <label htmlFor={`yColumn${index}`} className="mr-2">
            Y Column {index + 1}:
          </label>
          <select
            id={`yColumn${index}`}
            value={yColumn}
            onChange={(e) => handleYColumnChange(index, e)}
            className="border border-gray-300 rounded-md p-2 text-black"
          >
            {Object.keys(csvData[0]).map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
          <input
            type="color"
            value={yColumnColors[yColumn]}
            onChange={(e) => handleColorChange(yColumn, e)}
            className="mr-1 ml-1 p-1  size-3 rounded-lg"
            style={{ backgroundColor: yColumnColors[yColumn] }}
          />
          <button
            onClick={() => handleRemoveYColumn(index)}
            className="bg-red-500 text-white px-2 py-1 rounded-md ml-1"
          >
            Remove
          </button>
        </div>
      ))}
      <div className="flex">
  {showUpdateButton && (
    <button onClick={handleSubmit} className="mt-4 mb-4 mr-2 bg-blue-500 text-white p-2 rounded">
      Update Plot
    </button>
  )}
  {selectedXColumn && (
    <button
      onClick={handleAddYColumn}
      className="mt-4 mb-4 bg-blue-500 text-white p-2 rounded"
    >
      Add Parameter
    </button>
  )}
</div>

      {selectedXColumn && selectedYColumns.length > 0 && is3D && (
        <div className="mb-4 flex items-center">
          <label htmlFor="zColumn" className="mr-2">
            Z Column:
          </label>
          <select
            id="zColumn"
            value={selectedZColumn}
            onChange={handleZColumnChange}
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
        <label htmlFor="plotDimension" className="mr-2">
          Plot Dimension:
        </label>
        <select
          id="plotDimension"
          value={is3D ? '3D' : '2D'}
          onChange={handlePlotDimensionChange}
          className="border border-gray-300 rounded-md p-2 text-black"
        >
          <option value="2D">2D</option>
          <option value="3D">3D</option>
        </select>
      </div>
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
          {is3D ? (
            <>
              <option value="scatter">3D Scatter</option>
              <option value="surface">3D Surface</option>
            </>
          ) : (
            <>
              <option value="scatter">Scatter</option>
              <option value="bar">Bar</option>
              <option value="line">Line</option>
            </>
          )}
        </select>
      </div>
      {!is3D && (
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
            <option value="lines+markers">Lines + Markers</option>
            <option value="lines">Lines</option>
            <option value="markers">Markers</option>
          </select>
        </div>
      )}
      {plotData && layout && (
        <div className="w-full h-full" style={{ margin: 0, padding: 0 }}>
          <Plot data={plotData} layout={layout} style={{ width: '100%', height: '100%' }} title={'File Data Plot'} responsive={true} />
        </div>
      )}
      
    </div>
  );
};

export default MyPlot;
