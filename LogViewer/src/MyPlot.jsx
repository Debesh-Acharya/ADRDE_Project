import React, { useState, useRef } from 'react';
import Plot from 'react-plotly.js';
import { parseCSV, parseXLS, parseJSON, parseYAML, parseTXT } from './utils/fileParserUtils';
import { getRandomColor } from './utils/plottingUtils';
import { CSSTransition } from 'react-transition-group';
import './MyPlot.css';

const MyPlot = ({ onParsedData }) => {
  const [csvData, setCsvData] = useState(null);
  const [graphs, setGraphs] = useState([]);
  const [showControls, setShowControls] = useState(false);
  const nodeRef = useRef(null);  // Create a ref

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const extension = file.name.split('.').pop().toLowerCase();
  
    switch (extension) {
      case 'csv':
      case 'tsv':
      case 'txt':
        parseCSV(file, handleParsedData);
        break;
      case 'xls':
      case 'xlsx':
        import('xlsx').then((XLSX) => {
          parseXLS(file, XLSX, handleParsedData);
        });
        break;
      case 'json':
        parseJSON(file, handleParsedData);
        break;
      case 'yml':
      case 'yaml':
        parseYAML(file, handleParsedData);
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
    onParsedData(results.data);
  };

  const addNewGraph = () => {
    const columns = Object.keys(csvData[0]);
    const newGraph = {
      id: graphs.length,
      selectedXColumn: columns[0],
      selectedYColumns: [columns[1]],
      selectedZColumn: columns.length > 2 ? columns[2] : null,
      yColumnColors: { [columns[1]]: getRandomColor() },
      scalingFactors: { [columns[1]]: 1 },
      offsets: { [columns[1]]: 0 },
      plotType: 'scatter',
      plotMode: 'lines+markers',
      is3D: false,
    };
    setGraphs([...graphs, newGraph]);
  };

  const updateGraph = (id, updatedGraph) => {
    setGraphs(graphs.map(graph => graph.id === id ? updatedGraph : graph));
  };

  const removeGraph = (id) => {
    setGraphs(graphs.filter(graph => graph.id !== id));
  };

  return (
    <div className="flex flex-col items-start w-full h-full relative">
      <header className="w-full p-4 bg-gray-800 text-white">
        <h1 className="text-2xl">Log Viewer</h1>
      </header>
      <CSSTransition
        nodeRef={nodeRef}  // Pass the ref to CSSTransition
        in={showControls}
        timeout={300}
        classNames="sidebar"
        unmountOnExit
      >
        <div ref={nodeRef} className="fixed left-0 top-16 h-full w-72 bg-dark p-4 z-20 sidebar overflow-y-auto">
          <button
            className="close-btn text-white"
            onClick={() => setShowControls(false)}
          >
            ×
          </button>
          <div className="mb-4">
            <label className="block mb-2 text-white">Upload File:</label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="w-full p-2 mb-2"
            />
          </div>
          <div className="mb-4">
            <button onClick={addNewGraph} className="bg-dark-blue text-white p-2 rounded w-full">
              Add New Graph
            </button>
          </div>
          {graphs.map(graph => (
            <GraphControls
              key={graph.id}
              graph={graph}
              csvData={csvData}
              updateGraph={updateGraph}
              removeGraph={removeGraph}
            />
          ))}
        </div>
      </CSSTransition>
      <div className={`flex-grow w-full h-full transition-all duration-300 mt-16 ${showControls ? 'ml-72' : 'ml-0'}`}>
        {graphs.map(graph => (
          <PlotComponent
            key={graph.id}
            graph={graph}
            csvData={csvData}
          />
        ))}
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

const GraphControls = ({ graph, csvData, updateGraph, removeGraph }) => {
  const { id, selectedXColumn, selectedYColumns, selectedZColumn, yColumnColors, scalingFactors, offsets, plotType, plotMode, is3D } = graph;

  const handleXColumnChange = (event) => {
    updateGraph(id, { ...graph, selectedXColumn: event.target.value });
  };

  const handleYColumnChange = (index, event) => {
    const newYColumns = [...selectedYColumns];
    newYColumns[index] = event.target.value;
    updateGraph(id, { ...graph, selectedYColumns: newYColumns });
  };

  const handleAddYColumn = () => {
    const newYColumns = [...selectedYColumns, Object.keys(csvData[0])[0]];
    const newScalingFactors = { ...scalingFactors, [Object.keys(csvData[0])[0]]: 1 };
    const newOffsets = { ...offsets, [Object.keys(csvData[0])[0]]: 0 };
    updateGraph(id, { ...graph, selectedYColumns: newYColumns, scalingFactors: newScalingFactors, offsets: newOffsets });
  };

  const handleRemoveYColumn = (index) => {
    const newYColumns = [...selectedYColumns];
    newYColumns.splice(index, 1);
    updateGraph(id, { ...graph, selectedYColumns: newYColumns });
  };

  const handleZColumnChange = (event) => {
    updateGraph(id, { ...graph, selectedZColumn: event.target.value });
  };

  const handleColorChange = (yColumn, event) => {
    const newYColumnColors = { ...yColumnColors, [yColumn]: event.target.value };
    updateGraph(id, { ...graph, yColumnColors: newYColumnColors });
  };

  const handleScalingFactorChange = (yColumn, event) => {
    const newScalingFactors = { ...scalingFactors, [yColumn]: parseFloat(event.target.value) };
    updateGraph(id, { ...graph, scalingFactors: newScalingFactors });
  };

  const handleOffsetChange = (yColumn, event) => {
    const newOffsets = { ...offsets, [yColumn]: parseFloat(event.target.value) };
    updateGraph(id, { ...graph, offsets: newOffsets });
  };

  const handlePlotTypeChange = (event) => {
    updateGraph(id, { ...graph, plotType: event.target.value });
  };

  const handlePlotModeChange = (event) => {
    updateGraph(id, { ...graph, plotMode: event.target.value });
  };

  const handlePlotDimensionChange = (event) => {
    updateGraph(id, { ...graph, is3D: event.target.value === '3D' });
  };

  return (
    <div className="mb-8 p-4 border border-gray-300 rounded bg-gray-700 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">Graph {id + 1}</h2>
        <button onClick={() => removeGraph(id)} className="bg-red-500 text-white px-2 py-1 rounded-md">
          Remove Graph
        </button>
      </div>
      <div className="mb-4">
        <label htmlFor={`xColumn${id}`} className="block mb-2">
          X Column:
        </label>
        <select
          id={`xColumn${id}`}
          value={selectedXColumn}
          onChange={handleXColumnChange}
          className="w-full p-2"
        >
          {Object.keys(csvData[0]).map(column => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </div>
      {selectedYColumns.map((yColumn, index) => (
        <div key={index} className="mb-4">
          <label htmlFor={`yColumn${id}-${index}`} className="block mb-2">
            Y Column {index + 1}:
          </label>
          <div className="flex items-center mb-2">
            <select
              id={`yColumn${id}-${index}`}
              value={yColumn}
              onChange={(e) => handleYColumnChange(index, e)}
              className="w-full p-2"
            >
              {Object.keys(csvData[0]).map(column => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
            {index > 0 && (
              <button
                onClick={() => handleRemoveYColumn(index)}
                className="bg-red-500 text-white px-2 py-1 ml-2 rounded-md"
              >
                ×
              </button>
            )}
          </div>
          <div className="flex items-center mb-2">
            <label className="block w-1/3">Color:</label>
            <input
              type="color"
              value={yColumnColors[yColumn]}
              onChange={(e) => handleColorChange(yColumn, e)}
              className="w-2/3"
            />
          </div>
          <div className="flex items-center mb-2">
            <label className="block w-1/3">Scaling Factor:</label>
            <input
              type="number"
              value={scalingFactors[yColumn]}
              onChange={(e) => handleScalingFactorChange(yColumn, e)}
              className="w-2/3 p-2"
            />
          </div>
          <div className="flex items-center mb-2">
            <label className="block w-1/3">Offset:</label>
            <input
              type="number"
              value={offsets[yColumn]}
              onChange={(e) => handleOffsetChange(yColumn, e)}
              className="w-2/3 p-2"
            />
          </div>
        </div>
      ))}
      <button onClick={handleAddYColumn} className="bg-dark-blue text-white p-2 rounded w-full mb-4">
        Add Y Column
      </button>
      <div className="mb-4">
        <label htmlFor={`zColumn${id}`} className="block mb-2">
          Z Column (for 3D plots):
        </label>
        <select
          id={`zColumn${id}`}
          value={selectedZColumn || ''}
          onChange={handleZColumnChange}
          className="w-full p-2"
          disabled={!is3D}
        >
          <option value="">None</option>
          {Object.keys(csvData[0]).map(column => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2">Plot Type:</label>
        <select value={plotType} onChange={handlePlotTypeChange} className="w-full p-2">
          <option value="scatter">Scatter</option>
          <option value="bar">Bar</option>
          <option value="line">Line</option>
          <option value="histogram">Histogram</option>
        </select>
      </div>
      {plotType === 'scatter' && (
        <div className="mb-4">
          <label className="block mb-2">Plot Mode:</label>
          <select value={plotMode} onChange={handlePlotModeChange} className="w-full p-2">
            <option value="lines">Lines</option>
            <option value="markers">Markers</option>
            <option value="lines+markers">Lines + Markers</option>
          </select>
        </div>
      )}
      <div className="mb-4">
        <label className="block mb-2">Plot Dimension:</label>
        <select value={is3D ? '3D' : '2D'} onChange={handlePlotDimensionChange} className="w-full p-2">
          <option value="2D">2D</option>
          <option value="3D">3D</option>
        </select>
      </div>
    </div>
  );
};

const PlotComponent = ({ graph, csvData }) => {
  const { selectedXColumn, selectedYColumns, selectedZColumn, yColumnColors, scalingFactors, offsets, plotType, plotMode, is3D } = graph;

  const plotData = selectedYColumns.map(yColumn => {
    const xData = csvData.map(row => parseFloat(row[selectedXColumn]));
    const yData = csvData.map(row => (parseFloat(row[yColumn]) * scalingFactors[yColumn]) + offsets[yColumn]);

    const plotObject = {
      x: xData,
      y: yData,
      type: plotType,
      mode: plotMode,
      marker: { color: yColumnColors[yColumn] },
      name: yColumn,
    };

    if (is3D) {
      plotObject.z = csvData.map(row => parseFloat(row[selectedZColumn]));
      plotObject.type = 'scatter3d';
      plotObject.mode = 'markers';
    }

    return plotObject;
  });

  const layout = {
    title: `Graph ${graph.id + 1}`,
    xaxis: { title: selectedXColumn },
    yaxis: { title: selectedYColumns.join(', ') },
    showlegend: true,
    height: 600,
  };

  if (is3D) {
    layout.scene = {
      xaxis: { title: selectedXColumn },
      yaxis: { title: selectedYColumns.join(', ') },
      zaxis: { title: selectedZColumn },
    };
  }

  return <Plot data={plotData} layout={layout} />;
};

export default MyPlot;
