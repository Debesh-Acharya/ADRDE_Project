import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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

  // Initialize worker
  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL('./fileParserWorker.js', import.meta.url), {
        type: 'module'
      });
      
      workerRef.current.onmessage = (e) => {
        handleParsedData(e.data);
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
      };
    } catch (error) {
      console.warn('Worker initialization failed:', error);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Memoized handlers
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    parseCSV(file, handleParsedData);
    setGraphs([]);
  }, []);

  const handleParsedData = useCallback((results) => {
    if (results.errors && results.errors.length > 0) {
      console.error('File parsing error:', results.errors);
      return;
    }
    setCsvData(results.data);
    setHeaders(results.headers);
    if (onParsedData) {
      onParsedData(results.data);
    }
  }, [onParsedData]);

  const addNewGraph = useCallback(() => {
    if (!csvData || csvData.length === 0) {
      console.log("CSV data is empty or not available.");
      return;
    }

    const xColumn = headers[selectedHeaderIndex] || headers[0];
    const yColumn = headers[selectedHeaderIndex + 1] || headers[1] || headers[0];
    
    const newGraph = {
      id: Date.now(),
      selectedXColumn: xColumn,
      selectedYColumns: [yColumn],
      selectedZColumn: headers.length > selectedHeaderIndex + 2 ? headers[selectedHeaderIndex + 2] : null,
      yColumnColors: { [yColumn]: getRandomColor() },
      scalingFactors: { [yColumn]: 1 },
      offsets: { [yColumn]: 0 },
      plotType: 'scatter',
      plotMode: 'lines+markers',
      is3D: false,
    };

    setGraphs(prev => [...prev, newGraph]);
  }, [csvData, headers, selectedHeaderIndex]);

  const updateGraph = useCallback((id, updatedGraph) => {
    setGraphs(prev => prev.map(graph => graph.id === id ? updatedGraph : graph));
  }, []);

  const removeGraph = useCallback((id) => {
    setGraphs(prev => prev.filter(graph => graph.id !== id));
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full relative">
      {/* Header */}
      <header className="flex-shrink-0 w-full p-4 bg-gray-800 text-white flex items-center justify-center relative">
        <div className="flex items-center">
          <img src="adrde_drdo.png" alt="Logo" className="h-11 mr-3 md:h-12 lg:h-10" />
          <h1 className="text-2xl md:text-2xl lg:text-3xl font-semibold">ADRDE Trial Log Viewer</h1>
        </div>
      </header>

      {/* Tab System */}
      <div className="flex-shrink-0">
        <TabSystem activeTab={activeTab} setActiveTab={setActiveTab} csvData={csvData} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 w-full">
        {/* Sidebar */}
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
              className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              onMouseEnter={() => setSidebarHovered(true)}
              onMouseLeave={() => setSidebarHovered(false)}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-lg font-medium text-white">Controls</h2>
                <motion.button
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={() => setShowControls(false)}
                  animate={{ opacity: sidebarHovered ? 1 : 0.7 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Upload Data File
                  </label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".csv,.json,.yaml,.yml,.txt,.tsv"
                    className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  {csvData && (
                    <div className="mt-2 text-sm text-green-400">
                      {csvData.length} rows loaded
                    </div>
                  )}
                </div>

                {/* Add Graph Button */}
                <motion.button 
                  onClick={addNewGraph}
                  disabled={!csvData || csvData.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  whileHover={{ scale: csvData ? 1.02 : 1 }}
                  whileTap={{ scale: csvData ? 0.98 : 1 }}
                >
                  Add New Graph
                </motion.button>

                {/* Graph List */}
                <div className="space-y-3">
                  {graphs.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Graphs ({graphs.length})</span>
                      {graphs.length > 1 && (
                        <button
                          onClick={() => setGraphs([])}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  )}
                  
                  {graphs.map((graph) => (
                    <GraphControls
                      key={graph.id}
                      graph={graph}
                      csvData={csvData}
                      updateGraph={updateGraph}
                      removeGraph={removeGraph}
                    />
                  ))}
                </div>

                {/* Empty States */}
                {!csvData && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">Upload a file to start plotting</p>
                  </div>
                )}

                {csvData && graphs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">Click "Add New Graph" to create your first plot</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-700 p-4">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Graphs: {graphs.length}</span>
                  <span>{csvData ? `${csvData.length} rows` : 'No data'}</span>
                </div>
              </div>
            </motion.div>
          </CSSTransition>
        )}

        {/* Content Area */}
        <div className="flex-1 transition-all duration-300">
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
              
              {/* Graphs */}
              <div className="h-full overflow-y-auto">
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
            </div>
          ) : (
            <SimulationTab csvData={csvData} headers={headers} />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 w-full p-4 bg-gray-800 text-white text-center border-t border-gray-700">
        <div className="text-sm">
          Designed & Developed by: SDD, ADRDE, AGRA
        </div>
      </footer>
    </div>
  );
};

// GraphControls component
const GraphControls = React.memo(({ graph, csvData, updateGraph, removeGraph }) => {
  if (!csvData || csvData.length === 0) return null;

  const { id, selectedXColumn, selectedYColumns, selectedZColumn, yColumnColors, scalingFactors, offsets, plotType, plotMode, is3D } = graph;
  const columns = useMemo(() => Object.keys(csvData[0]), [csvData]);

  const handleUpdate = useCallback((updates) => {
    updateGraph(id, { ...graph, ...updates });
  }, [id, graph, updateGraph]);

  const handleXColumnChange = useCallback((event) => {
    handleUpdate({ selectedXColumn: event.target.value });
  }, [handleUpdate]);

  const handleYColumnChange = useCallback((index, event) => {
    const newYColumns = [...selectedYColumns];
    newYColumns[index] = event.target.value;
    handleUpdate({ selectedYColumns: newYColumns });
  }, [selectedYColumns, handleUpdate]);

  const handleAddYColumn = useCallback(() => {
    const newColumn = columns[0];
    const newYColumns = [...selectedYColumns, newColumn];
    const newScalingFactors = { ...scalingFactors, [newColumn]: 1 };
    const newOffsets = { ...offsets, [newColumn]: 0 };
    const newColors = { ...yColumnColors, [newColumn]: getRandomColor() };
    
    handleUpdate({ 
      selectedYColumns: newYColumns, 
      scalingFactors: newScalingFactors, 
      offsets: newOffsets,
      yColumnColors: newColors
    });
  }, [selectedYColumns, columns, scalingFactors, offsets, yColumnColors, handleUpdate]);

  const handleRemoveYColumn = useCallback((index) => {
    const newYColumns = [...selectedYColumns];
    const removedColumn = newYColumns[index];
    newYColumns.splice(index, 1);
    
    const newScalingFactors = { ...scalingFactors };
    const newOffsets = { ...offsets };
    const newColors = { ...yColumnColors };
    
    delete newScalingFactors[removedColumn];
    delete newOffsets[removedColumn];
    delete newColors[removedColumn];
    
    handleUpdate({ 
      selectedYColumns: newYColumns,
      scalingFactors: newScalingFactors,
      offsets: newOffsets,
      yColumnColors: newColors
    });
  }, [selectedYColumns, scalingFactors, offsets, yColumnColors, handleUpdate]);

  const handleZColumnChange = useCallback((event) => {
    handleUpdate({ selectedZColumn: event.target.value });
  }, [handleUpdate]);

  const handleColorChange = useCallback((yColumn, event) => {
    const newYColumnColors = { ...yColumnColors, [yColumn]: event.target.value };
    handleUpdate({ yColumnColors: newYColumnColors });
  }, [yColumnColors, handleUpdate]);

  const handleScalingFactorChange = useCallback((yColumn, event) => {
    const newScalingFactors = { ...scalingFactors, [yColumn]: parseFloat(event.target.value) || 1 };
    handleUpdate({ scalingFactors: newScalingFactors });
  }, [scalingFactors, handleUpdate]);
  
  const handleOffsetChange = useCallback((yColumn, event) => {
    const newOffsets = { ...offsets, [yColumn]: parseFloat(event.target.value) || 0 };
    handleUpdate({ offsets: newOffsets });
  }, [offsets, handleUpdate]);

  const handlePlotTypeChange = useCallback((event) => {
    handleUpdate({ plotType: event.target.value });
  }, [handleUpdate]);

  const handlePlotModeChange = useCallback((event) => {
    handleUpdate({ plotMode: event.target.value });
  }, [handleUpdate]);

  const handlePlotDimensionChange = useCallback((event) => {
    const is3DValue = event.target.value === '3D';
    handleUpdate({ is3D: is3DValue });
  }, [handleUpdate]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <span className="text-blue-400">📊</span>
          Graph
        </h3>
        <button 
          onClick={() => removeGraph(id)} 
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-300">X Column:</label>
          <select
            value={selectedXColumn}
            onChange={handleXColumnChange}
            className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            {columns.map(column => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">Y Columns:</label>
          {selectedYColumns.map((yColumn, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={yColumn}
                onChange={(e) => handleYColumnChange(index, e)}
                className="flex-1 p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                {columns.map(column => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
              
              <input
                type="color"
                value={yColumnColors[yColumn] || '#000000'}
                onChange={(e) => handleColorChange(yColumn, e)}
                className="w-10 h-10 border border-gray-600 rounded cursor-pointer"
              />
              
              {selectedYColumns.length > 1 && (
                <button
                  onClick={() => handleRemoveYColumn(index)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          
          <button
            onClick={handleAddYColumn}
            className="w-full py-2 px-3 text-sm text-blue-400 border border-blue-600 rounded-lg hover:bg-blue-900/20 transition-colors"
          >
            Add Y Column
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Plot Type:</label>
            <select
              value={plotType}
              onChange={handlePlotTypeChange}
              className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="scatter">Scatter</option>
              <option value="bar">Bar</option>
              <option value="line">Line</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Plot Mode:</label>
            <select
              value={plotMode}
              onChange={handlePlotModeChange}
              className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="lines+markers">Lines + Markers</option>
              <option value="lines">Lines</option>
              <option value="markers">Markers</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Dimension:</label>
            <select
              value={is3D ? '3D' : '2D'}
              onChange={handlePlotDimensionChange}
              className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="2D">2D</option>
              <option value="3D">3D</option>
            </select>
          </div>

          {is3D && (
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">Z Column:</label>
              <select
                value={selectedZColumn || ''}
                onChange={handleZColumnChange}
                className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="">None</option>
                {columns.map(column => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// PlotComponent with proper Plotly.js configuration
const PlotComponent = React.memo(({ graph, csvData }) => {
  if (!csvData || csvData.length === 0) return null;

  const { selectedXColumn, selectedYColumns, selectedZColumn, plotType, plotMode, is3D, scalingFactors, offsets } = graph;

  const plotData = useMemo(() => {
    return selectedYColumns.map((yColumn) => {
      const xData = csvData.map(row => {
        const value = parseFloat(row[selectedXColumn]);
        return isNaN(value) ? 0 : value;
      });
      
      const yData = csvData.map(row => {
        const value = parseFloat(row[yColumn]);
        const scaledValue = (isNaN(value) ? 0 : value) * (scalingFactors[yColumn] || 1) + (offsets[yColumn] || 0);
        return scaledValue;
      });
      
      const name = `${yColumn} vs ${selectedXColumn}`;
      const markerColor = graph.yColumnColors[yColumn] || '#3B82F6';

      if (is3D && selectedZColumn) {
        const zData = csvData.map(row => {
          const value = parseFloat(row[selectedZColumn]);
          return isNaN(value) ? 0 : value;
        });
        
        return {
          x: xData,
          y: yData,
          z: zData,
          type: plotType === 'scatter' ? 'scatter3d' : plotType,
          mode: plotMode,
          name,
          marker: { color: markerColor, size: 3 },
          line: { color: markerColor, width: 2 }
        };
      } else {
        return {
          x: xData,
          y: yData,
          type: plotType,
          mode: plotMode,
          name,
          marker: { color: markerColor, size: 6 },
          line: { color: markerColor, width: 2 }
        };
      }
    });
  }, [csvData, selectedXColumn, selectedYColumns, selectedZColumn, plotType, plotMode, is3D, scalingFactors, offsets, graph.yColumnColors]);

  const layout = useMemo(() => ({
    xaxis: { 
      title: { text: selectedXColumn },
      zeroline: false,
      gridcolor: '#374151'
    },
    yaxis: { 
      title: { text: selectedYColumns.join(', ') },
      zeroline: false,
      gridcolor: '#374151'
    },
    autosize: true,
    margin: { l: 60, r: 40, t: 40, b: 60 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#374151' },
    showlegend: selectedYColumns.length > 1,
    legend: {
      orientation: 'h',
      y: -0.2
    }
  }), [selectedXColumn, selectedYColumns]);

  const config = useMemo(() => ({
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'resetScale2d']
  }), []);

  return (
    <div className="h-full p-4">
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </div>
  );
});

export default MyPlot;
