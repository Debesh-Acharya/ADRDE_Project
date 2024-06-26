import React, { useState, useRef,useEffect } from 'react';
import Plot from 'react-plotly.js';
import { getRandomColor } from './utils/plottingUtils';
import { CSSTransition } from 'react-transition-group';
import ThreeJSScene from './ThreeJSScene';
import './MyPlot.css';
import { parseCSV } from './utils/fileParserUtils';

const MyPlot = ({ onParsedData }) => {
  const [csvData, setCsvData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [graphs, setGraphs] = useState([]);
  const [selectedHeaderIndex, setSelectedHeaderIndex] = useState(0); 
  const [showControls, setShowControls] = useState(true);
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const nodeRef = useRef(null);  // Create a ref
  const workerRef = useRef(null);

  useEffect(() => {
    // Initialize the web worker
    workerRef.current = new Worker(new URL('./fileParserWorker.js', import.meta.url),{type:'module'});
    workerRef.current.onmessage = (e) => {
      handleParsedData(e.data);
    };

    return () => {
      // Terminate the worker when the component is unmounted
      workerRef.current.terminate();
    };
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    parseCSV(file, handleParsedData); // Use the parseCSV function to parse the uploaded CSV file
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
    // Update selectedHeaderIndex when headerRowIndex changes
    setSelectedHeaderIndex(Math.max(headerRowIndex - 1, 0));
  }, [headerRowIndex]);

  return (
    <div className="flex flex-col items-start w-full h-full relative">
    <header className="w-full p-4 bg-gray-800 text-white flex items-center justify-center">
      <div className="flex items-center">
        <img src="adrde_drdo.png" alt="Logo" className="h-11 mr-3 md:h-12 lg:h-10" /> {/* Replace 'path_to_your_logo' with the actual path to your logo */}
        <h1 className="text-2xl md:text-2xl lg:text-3xl">ADRDE Trial Log Viewer</h1>
      </div>

      </header>
      <CSSTransition
        nodeRef={nodeRef}
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
            <label className="block mb-2 text-white">Upload File:(*.csv,*.tsv,*.json,*.txt,*.yml,*.yaml)</label>
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".csv,.json,.yaml,.yml,.txt,.tsv"
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
      <div className={`flex-grow w-full h-full transition-all duration-300 mt-16 ${showControls ? 'ml-72' : 'ml-0'}`} style={{
          width: showControls ? `100%` : '77%',
        } }>
        {graphs.map(graph => (
          <div key={graph.id}>
            <PlotComponent graph={graph} csvData={csvData} isResponsive={showControls} />
            
          </div>
        ))}
        {graphs.length > 0 && (
          <div className="w-full">
            <ThreeJSScene graph={graphs[0]} csvData={csvData} />
          </div>
        )}
      </div>
      <div className={`fixed bottom-0 left-0 w-full ${graphs.length > 0 ? 'absolute bottom-0 left-0' : 'fixed bottom-0 left-0'}`}>
        <footer className="w-full p-4 bg-gray-800 text-white text-center ">
          Designed & Developed by: SDD, ADRDE, AGRA
        </footer>
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
  if (!csvData || csvData.length === 0) return null;

  const { id, selectedXColumn, selectedYColumns, selectedZColumn, yColumnColors, scalingFactors, offsets, plotType, plotMode, is3D=false } = graph;
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
        {columns.map(column => (
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
            {columns.map(column => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleRemoveYColumn(index)}
            className="ml-2 bg-red-500 text-white px-2 py-1 rounded-md"
          >
            ×
          </button>
        </div>
        <input
          type="color"
          value={yColumnColors[yColumn]}
          onChange={(e) => handleColorChange(yColumn, e)}
          className="ml-2 w-6 h-6 p-0 border rounded mt-1"
          style={{ backgroundColor: yColumnColors[yColumn] }}
        />
        <div className="mb-2">
          <label htmlFor={`scalingFactor${id}-${index}`} className="block mb-1">
            Scaling Factor:
          </label>
          <input
            type="number"
            id={`scalingFactor${id}-${index}`}
            value={scalingFactors[yColumn]}
            onChange={(e) => handleScalingFactorChange(yColumn, e)}
            className="w-full p-2"
          />
        </div>
        <div className="mb-2">
          <label htmlFor={`offset${id}-${index}`} className="block mb-1">
            Offset:
          </label>
          <input
            type="number"
            id={`offset${id}-${index}`}
            value={offsets[yColumn]}
            onChange={(e) => handleOffsetChange(yColumn, e)}
            className="w-full p-2"
          />
        </div>
      </div>
    ))}
    <button
      onClick={handleAddYColumn}
      className="bg-blue-500 text-white px-4 py-2 rounded-md mb-4"
    >
      Add Y Column
    </button>
    <div className="mb-4">
      <label htmlFor={`plotType${id}`} className="block mb-2">
        Plot Type:
      </label>
      <select
        id={`plotType${id}`}
        value={plotType}
        onChange={handlePlotTypeChange}
        className="w-full p-2"
      >
        <option value="scatter">Scatter</option>
        <option value="bar">Bar</option>
        <option value="line">Line</option>
      </select>
    </div>
    <div className="mb-4">
      <label htmlFor={`plotMode${id}`} className="block mb-2">
        Plot Mode:
      </label>
      <select
        id={`plotMode${id}`}
        value={plotMode}
        onChange={handlePlotModeChange}
        className="w-full p-2"
      >
        <option value="lines+markers">Lines + Markers</option>
        <option value="lines">Lines</option>
        <option value="markers">Markers</option>
      </select>
    </div>
    <div className="mb-4">
      <label htmlFor={`plotDimension${id}`} className="block mb-2">
        Plot Dimension:
      </label>
      <select
        id={`plotDimension${id}`}
        value={is3D ? '3D' : '2D'}
        onChange={handlePlotDimensionChange}
        className="w-full p-2"
      >
        <option value="2D">2D</option>
        <option value="3D">3D</option>
      </select>
    </div>
    {is3D && (
      <div className="mb-4">
        <label htmlFor={`zColumn${id}`} className="block mb-2">
          Z Column:
        </label>
        <select
          id={`zColumn${id}`}
          value={selectedZColumn || ''}
          onChange={handleZColumnChange}
          className="w-full p-2"
        >
          <option value="">None</option>
          {columns.map(column => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </div>
    )}
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