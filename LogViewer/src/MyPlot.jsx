import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { parseCSV as parseCSVUtil, parseXLS as parseXLSUtil, parseJSON as parseJSONUtil, parseYAML as parseYAMLUtil } from './utils/fileParserUtils';
import { getRandomColor } from './utils/plottingUtils';
import { CSSTransition } from 'react-transition-group';
import './MyPlot.css';

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
  const [showControls, setShowControls] = useState(false);
  const [scalingFactors, setScalingFactors] = useState({});
  const [offsets, setOffsets] = useState({});

  useEffect(() => {
    if (csvData) {
      const layout = updatePlotData(csvData, plotType, plotMode, is3D);
      setLayout(layout);
      onParsedData(csvData);
    }
  }, [csvData, plotType, plotMode, selectedXColumn, selectedYColumns, selectedZColumn, is3D, scalingFactors, offsets]);

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
    const defaultScalingFactors = {};
    const defaultOffsets = {};
    columns.forEach((column, index) => {
      if (index > 0) {
        defaultColors[column] = getRandomColor();
        defaultScalingFactors[column] = 1;
        defaultOffsets[column] = 0;
      }
    });
    setYColumnColors(defaultColors);
    setScalingFactors(defaultScalingFactors);
    setOffsets(defaultOffsets);
  };

  const updatePlotData = (data, type, mode, is3D) => {
    const layout = {
      xaxis: { title: { text: selectedXColumn } },
      yaxis: { title: { text: 'Values' } },
      autosize: true,
    };

    const transformData = (column, row) => (parseFloat(row[column]) * scalingFactors[column]) + offsets[column];

    const plots = is3D ? [{
      x: data.map((row) => row[selectedXColumn]),
      y: data.map((row) => transformData(selectedYColumns[0], row)),
      z: data.map((row) => transformData(selectedZColumn, row)),
      type: type === 'scatter' ? 'scatter3d' : type,
      mode,
      marker: { color: yColumnColors[selectedYColumns[0]] },
      name: `${selectedYColumns[0]} vs ${selectedXColumn} vs ${selectedZColumn}`,
    }] : selectedYColumns.map(yColumn => ({
      x: data.map((row) => row[selectedXColumn]),
      y: data.map((row) => transformData(yColumn, row)),
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
  };

  const handlePlotModeChange = (event) => {
    setPlotMode(event.target.value);
  };

  const handlePlotDimensionChange = (event) => {
    setIs3D(event.target.value === '3D');
  };

  const handleColorChange = (yColumn, event) => {
    setYColumnColors({ ...yColumnColors, [yColumn]: event.target.value });
  };

  const handleXColumnChange = (event) => {
    setSelectedXColumn(event.target.value);
  };

  const handleAddYColumn = () => {
    setSelectedYColumns([...selectedYColumns, '']);
    setScalingFactors({ ...scalingFactors, [`Y Column ${selectedYColumns.length}`]: 1 });
    setOffsets({ ...offsets, [`Y Column ${selectedYColumns.length}`]: 0 });
  };

  const handleRemoveYColumn = (index) => {
    const newSelectedYColumns = [...selectedYColumns];
    newSelectedYColumns.splice(index, 1);
    setSelectedYColumns(newSelectedYColumns);
  };

  const handleYColumnChange = (index, event) => {
    const newSelectedYColumns = [...selectedYColumns];
    newSelectedYColumns[index] = event.target.value;
    setSelectedYColumns(newSelectedYColumns);
  };

  const handleZColumnChange = (event) => {
    setSelectedZColumn(event.target.value);
  };

  const handleScalingFactorChange = (column, event) => {
    setScalingFactors({ ...scalingFactors, [column]: parseFloat(event.target.value) });
  };

  const handleOffsetChange = (column, event) => {
    setOffsets({ ...offsets, [column]: parseFloat(event.target.value) });
  };

  const handleSubmit = () => {
    const layout = updatePlotData(csvData, plotType, plotMode, is3D);
    setLayout(layout);
  };

  return (
    <div className="flex flex-col items-start w-full h-full relative">
      <header>
        <h1>Log-viewer</h1>
      </header>
      <CSSTransition
        in={showControls}
        timeout={300}
        classNames="sidebar"
        unmountOnExit
      >
        <div className="fixed left-0 top-16 h-full w-72 bg-dark p-4 z-20 sidebar">
          <button
            className="close-btn"
            onClick={() => setShowControls(false)}
          >
            ×
          </button>
          <div className="mb-4">
            <label className="block mb-2">Upload File:</label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="w-full p-2 mb-2"
            />
          </div>
          {csvData && (
            <>
              <div className="mb-4">
                <label htmlFor="xColumn" className="block mb-2">
                  X Column:
                </label>
                <select
                  id="xColumn"
                  value={selectedXColumn}
                  onChange={handleXColumnChange}
                  className="w-full p-2"
                >
                  {Object.keys(csvData[0]).map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </div>
              {selectedYColumns.map((yColumn, index) => (
                <div key={index} className="mb-4">
                  <label htmlFor={`yColumn${index}`} className="block mb-2">
                    Y Column:
                  </label>
                  <select
                    id={`yColumn${index}`}
                    value={yColumn}
                    onChange={(e) => handleYColumnChange(index, e)}
                    className="w-full p-2"
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
                    className="ml-2 w-6 h-6 p-0 border rounded  mt-1"
                    style={{ backgroundColor: yColumnColors[yColumn] }}
                  />
                  <div className="flex items-center justify-between">
                    <label htmlFor={`scalingFactor${index}`} className="mr-2">
                      Scaling Factor:
                    </label>
                    <input
                      id={`scalingFactor${index}`}
                      type="number"
                      step="0.1"
                      value={scalingFactors[yColumn]}
                      onChange={(e) => handleScalingFactorChange(yColumn, e)}
                      className="w-full p-2"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <label htmlFor={`offset${index}`} className="mr-2">
                      Offset:
                    </label>
                    <input
                      id={`offset${index}`}
                      type="number"
                      step="0.1"
                      value={offsets[yColumn]}
                      onChange={(e) => handleOffsetChange(yColumn, e)}
                      className="w-full p-2"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveYColumn(index)}
                    className="bg-red-500 text-white px-2 py-1 rounded-md mt-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="mb-4">
                <button onClick={handleAddYColumn} className="bg-dark-blue text-white p-2 rounded w-full">
                  Add Parameter
                </button>
              </div>
              {is3D && (
                <div className="mb-4">
                  <label htmlFor="zColumn" className="block mb-2">
                    Z Column:
                  </label>
                  <select
                    id="zColumn"
                    value={selectedZColumn}
                    onChange={handleZColumnChange}
                    className="w-full p-2"
                  >
                    {Object.keys(csvData[0]).map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="plotDimension" className="block mb-2">
                  Plot Dimension:
                </label>
                <select
                  id="plotDimension"
                  value={is3D ? '3D' : '2D'}
                  onChange={handlePlotDimensionChange}
                  className="w-full p-2"
                >
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="plotType" className="block mb-2">
                  Plot Type:
                </label>
                <select
                  id="plotType"
                  value={plotType}
                  onChange={handlePlotTypeChange}
                  className="w-full p-2"
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
              {(plotType === 'scatter' || !is3D) && (
                <div className="mb-4">
                  <label htmlFor="plotMode" className="block mb-2">
                    Plot Mode:
                  </label>
                  <select
                    id="plotMode"
                    value={plotMode}
                    onChange={handlePlotModeChange}
                    className="w-full p-2"
                  >
                    <option value="lines+markers">Lines + Markers</option>
                    <option value="lines">Lines</option>
                    <option value="markers">Markers</option>
                  </select>
                </div>
              )}
              <div className="mb-4">
                <button onClick={handleSubmit} className="bg-dark-blue text-white p-2 rounded w-full mb-9">
                  Update Plot
                </button>
              </div>
            </>
          )}
        </div>
      </CSSTransition>
      <div className={`flex-grow w-full h-full transition-all duration-300 mt-16 ${showControls ? 'ml-72' : 'ml-0'}`}>
        {plotData && layout && (
          <Plot data={plotData} layout={layout} style={{ width: '100%', height: '100%' }} title={'File Data Plot'} responsive={true} />
        )}
      </div>
      <div className="fixed top-4 left-4 z-30">
        <button
          onClick={() => setShowControls(!showControls)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg"
        >
          {showControls ? '×' : '☰'}
        </button>
      </div>
    </div>
  );
};

export default MyPlot;
