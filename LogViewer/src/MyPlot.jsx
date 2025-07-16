import React, { useState, useRef, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { getRandomColor } from './utils/plottingUtils';
import { CSSTransition } from 'react-transition-group';
import TabSystem from './components/TabSystem';
import SimulationTab from './components/SimulationTab';
import { motion } from 'framer-motion';
import './MyPlot.css';
import { parseCSV } from './utils/fileParserUtils';

const MyPlot = ({ onParsedData }) => {
  const [csvData, setCsvData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [graphs, setGraphs] = useState([]);
  const [selectedHeaderIndex, setSelectedHeaderIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [activeTab, setActiveTab] = useState('plotting');
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const nodeRef = useRef(null);
  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./fileParserWorker.js', import.meta.url), {type: 'module'});
    workerRef.current.onmessage = (e) => {
      handleParsedData(e.data);
    };

    return () => {
      workerRef.current.terminate();
    };
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    parseCSV(file, handleParsedData);
    setGraphs([]);
  };

  const handleParsedData = (results) => {
    if (results.errors && results.errors.length > 0) {
      console.error('File parsing error:', results.errors);
      return;
    }
    setCsvData(results.data);
    setHeaders(results.headers);
    onParsedData(results.data);
  };

  const addNewGraph = () => {
    if (!csvData || csvData.length === 0) {
      console.log("CSV data is empty or not available.");
      return;
    }

    const newGraph = {
      id: graphs.length,
      selectedXColumn: headers[selectedHeaderIndex],
      selectedYColumns: [headers[selectedHeaderIndex + 1]],
      selectedZColumn: headers.length > selectedHeaderIndex + 2 ? headers[selectedHeaderIndex + 2] : null,
      yColumnColors: { [headers[selectedHeaderIndex + 1]]: getRandomColor() },
      scalingFactors: { [headers[selectedHeaderIndex + 1]]: 1 },
      offsets: { [headers[selectedHeaderIndex + 1]]: 0 },
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

  useEffect(() => {
    setSelectedHeaderIndex(Math.max(0, 0));
  }, []);

  return (
    <div className="flex flex-col items-start w-full h-full relative">
      {/* Header - Keep as is */}
      <header className="w-full p-4 bg-gray-800 text-white flex items-center justify-center relative">
        <div className="flex items-center">
          <img src="adrde_drdo.png" alt="Logo" className="h-11 mr-3 md:h-12 lg:h-10" />
          <h1 className="text-2xl md:text-2xl lg:text-3xl">ADRDE Trial Log Viewer</h1>
        </div>
      </header>

      {/* Tab System */}
      <TabSystem activeTab={activeTab} setActiveTab={setActiveTab} csvData={csvData} />

      {/* Main Content Area */}
      <div className="flex w-full h-full">
        {/* Sidebar - Only show for plotting tab */}
        {activeTab === 'plotting' && (
          <CSSTransition
            nodeRef={nodeRef}
            in={showControls}
            timeout={300}
            classNames="sidebar"
            unmountOnExit
          >
            <motion.div 
              ref={nodeRef} 
              className="relative w-72 bg-gray-900 border-r border-gray-700 p-4 overflow-y-auto"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              onMouseEnter={() => setSidebarHovered(true)}
              onMouseLeave={() => setSidebarHovered(false)}
            >
              {/* Close button - appears on hover */}
              <motion.button
                className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg z-10"
                onClick={() => setShowControls(false)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: sidebarHovered ? 1 : 0, 
                  scale: sidebarHovered ? 1 : 0.8 
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
              
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-300">
                  Upload Data File
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".csv,.json,.yaml,.yml,.txt,.tsv"
                  className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500"
                />
              </div>

              <motion.button 
                onClick={addNewGraph}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium mb-4"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ➕ Add New Graph
              </motion.button>

              {graphs.map(graph => (
                <GraphControls
                  key={graph.id}
                  graph={graph}
                  csvData={csvData}
                  updateGraph={updateGraph}
                  removeGraph={removeGraph}
                />
              ))}
            </motion.div>
          </CSSTransition>
        )}

        {/* Content Area */}
        <div className={`flex-1 transition-all duration-300 ${
          activeTab === 'plotting' && showControls ? 'ml-0' : 'ml-0'
        }`}>
          {activeTab === 'plotting' ? (
            <div className="h-full">
              {/* Show toggle button only when sidebar is closed */}
              {!showControls && (
                <motion.button
                  onClick={() => setShowControls(true)}
                  className="fixed top-20 left-4 z-30 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-3 rounded-xl shadow-lg border border-blue-500/30 backdrop-blur-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.button>
              )}
              
              {graphs.map(graph => (
                <motion.div 
                  key={graph.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full"
                >
                  <PlotComponent graph={graph} csvData={csvData} />
                </motion.div>
              ))}
            </div>
          ) : (
            <SimulationTab csvData={csvData} headers={headers} />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full p-4 bg-gray-800 text-white text-center border-t border-gray-700">
        Designed & Developed by: SDD, ADRDE, AGRA
      </footer>
    </div>
  );
};





const GraphControls = ({ graph, csvData, updateGraph, removeGraph }) => {
  if (!csvData || csvData.length === 0) return null;

  const { id, selectedXColumn, selectedYColumns, selectedZColumn, yColumnColors, scalingFactors, offsets, plotType, plotMode, is3D = false } = graph;
  const columns = Object.keys(csvData[0]);

  const handleXColumnChange = (event) => {
    updateGraph(id, { ...graph, selectedXColumn: event.target.value });
  };

  const handleYColumnChange = (index, event) => {
    const newYColumns = [...selectedYColumns];
    newYColumns[index] = event.target.value;
    updateGraph(id, { ...graph, selectedYColumns: newYColumns });
  };

  const handleAddYColumn = () => {
    const newYColumns = [...selectedYColumns, columns[0]];
    const newScalingFactors = { ...scalingFactors, [columns[0]]: 1 };
    const newOffsets = { ...offsets, [columns[0]]: 0 };
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
    const newScalingFactors = { ...scalingFactors, [yColumn]: parseFloat(event.target.value) || 1 };
    updateGraph(id, { ...graph, scalingFactors: newScalingFactors });
  };
  
  const handleOffsetChange = (yColumn, event) => {
    const newOffsets = { ...offsets, [yColumn]: parseFloat(event.target.value) || 0 };
    updateGraph(id, { ...graph, offsets: newOffsets });
  };

  const handlePlotTypeChange = (event) => {
    updateGraph(id, { ...graph, plotType: event.target.value });
  };

  const handlePlotModeChange = (event) => {
    updateGraph(id, { ...graph, plotMode: event.target.value });
  };

  const handlePlotDimensionChange = (event) => {
    const is3DValue = event.target.value === '3D';
    updateGraph(id, { ...graph, is3D: is3DValue });
  };

  return (
    <div className="mb-6 p-4 bg-gray-800 rounded-xl border border-gray-600 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-blue-400">📈</span>
          Graph {id + 1}
        </h2>
        <button 
          onClick={() => removeGraph(id)} 
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-medium transition-colors duration-200"
        >
          🗑️ Remove
        </button>
      </div>

      {/* X Column Selection */}
      <div className="mb-4">
        <label htmlFor={`xColumn${id}`} className="block mb-2 text-sm font-medium text-gray-300">
          X Column:
        </label>
        <select
          id={`xColumn${id}`}
          value={selectedXColumn}
          onChange={handleXColumnChange}
          className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
        >
          {columns.map(column => (
            <option key={column} value={column} className="bg-gray-700 text-white py-2">
              {column}
            </option>
          ))}
        </select>
      </div>

      {/* Y Columns */}
      {selectedYColumns.map((yColumn, index) => (
        <div key={index} className="mb-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
          <label htmlFor={`yColumn${id}-${index}`} className="block mb-2 text-sm font-medium text-gray-300">
            Y Column {index + 1}:
          </label>
          
          <div className="flex items-center gap-2 mb-3">
            <select
              id={`yColumn${id}-${index}`}
              value={yColumn}
              onChange={(e) => handleYColumnChange(index, e)}
              className="flex-1 p-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            >
              {columns.map(column => (
                <option key={column} value={column} className="bg-gray-600 text-white py-1">
                  {column}
                </option>
              ))}
            </select>
            
            <input
              type="color"
              value={yColumnColors[yColumn]}
              onChange={(e) => handleColorChange(yColumn, e)}
              className="w-10 h-10 border border-gray-500 rounded cursor-pointer"
              title="Choose color"
            />
            
            <button
              onClick={() => handleRemoveYColumn(index)}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors duration-200"
            >
              ✕
            </button>
          </div>

          {/* Scaling Factor and Offset */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`scalingFactor${id}-${index}`} className="block mb-1 text-xs text-gray-400">
                Scaling Factor:
              </label>
              <input
                type="number"
                id={`scalingFactor${id}-${index}`}
                value={scalingFactors[yColumn]}
                onChange={(e) => handleScalingFactorChange(yColumn, e)}
                className="w-full p-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
            
            <div>
              <label htmlFor={`offset${id}-${index}`} className="block mb-1 text-xs text-gray-400">
                Offset:
              </label>
              <input
                type="number"
                id={`offset${id}-${index}`}
                value={offsets[yColumn]}
                onChange={(e) => handleOffsetChange(yColumn, e)}
                className="w-full p-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add Y Column Button */}
      <button
        onClick={handleAddYColumn}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium mb-4 transition-colors duration-200"
      >
        ➕ Add Y Column
      </button>

      {/* Plot Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plot Type */}
        <div>
          <label htmlFor={`plotType${id}`} className="block mb-2 text-sm font-medium text-gray-300">
            Plot Type:
          </label>
          <select
            id={`plotType${id}`}
            value={plotType}
            onChange={handlePlotTypeChange}
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          >
            <option value="scatter" className="bg-gray-700 text-white">Scatter</option>
            <option value="bar" className="bg-gray-700 text-white">Bar</option>
            <option value="line" className="bg-gray-700 text-white">Line</option>
          </select>
        </div>

        {/* Plot Mode */}
        <div>
          <label htmlFor={`plotMode${id}`} className="block mb-2 text-sm font-medium text-gray-300">
            Plot Mode:
          </label>
          <select
            id={`plotMode${id}`}
            value={plotMode}
            onChange={handlePlotModeChange}
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          >
            <option value="lines+markers" className="bg-gray-700 text-white">Lines + Markers</option>
            <option value="lines" className="bg-gray-700 text-white">Lines</option>
            <option value="markers" className="bg-gray-700 text-white">Markers</option>
          </select>
        </div>

        {/* Plot Dimension */}
        <div>
          <label htmlFor={`plotDimension${id}`} className="block mb-2 text-sm font-medium text-gray-300">
            Plot Dimension:
          </label>
          <select
            id={`plotDimension${id}`}
            value={is3D ? '3D' : '2D'}
            onChange={handlePlotDimensionChange}
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          >
            <option value="2D" className="bg-gray-700 text-white">2D</option>
            <option value="3D" className="bg-gray-700 text-white">3D</option>
          </select>
        </div>

        {/* Z Column (if 3D) */}
        {is3D && (
          <div>
            <label htmlFor={`zColumn${id}`} className="block mb-2 text-sm font-medium text-gray-300">
              Z Column:
            </label>
            <select
              id={`zColumn${id}`}
              value={selectedZColumn || ''}
              onChange={handleZColumnChange}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            >
              <option value="" className="bg-gray-700 text-white">None</option>
              {columns.map(column => (
                <option key={column} value={column} className="bg-gray-700 text-white">
                  {column}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};


const PlotComponent = ({ graph, csvData }) => {
if (!csvData || csvData.length === 0) return null;

const { selectedXColumn, selectedYColumns, selectedZColumn, plotType, plotMode, is3D, scalingFactors, offsets } = graph;

const plotData = selectedYColumns.map((yColumn) => {
  const xData = csvData.map((row) => parseFloat(row[selectedXColumn]));
  const yData = csvData.map((row) => parseFloat(row[yColumn]) * (scalingFactors[yColumn] || 1) + (offsets[yColumn] || 0));
  const name = `${yColumn} vs ${selectedXColumn}`;
  const markerColor = graph.yColumnColors[yColumn] || '#000000';

 
  if (is3D) {
    const zData = csvData.map((row) => parseFloat(row[selectedZColumn]));
    return {
      x: xData,
      y: yData,
      z: zData,
      type: plotType === 'scatter' ? 'scatter3d' : plotType,
      mode: plotMode,
      name,
      marker: { color: markerColor },
    };
  } else {
    return {
      x: xData,
      y: yData,
      type: plotType,
      mode: plotMode,
      name,
      marker: { color: markerColor },
    };
  }
});

const layout = {
  xaxis: { title: { text: selectedXColumn } },
  yaxis: { title: { text: selectedYColumns.join(', ')  } },
  autosize: true,
};

return (
  <Plot
    data={plotData}
    layout={layout}
    style={{ width: '100%', height: '100%' }}
    responsive={true}
  />
  
);
};

export default MyPlot;