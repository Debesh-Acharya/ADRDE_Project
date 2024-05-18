import React, { useState } from 'react';
import MyPlot from './MyPlot';
import WorldSimulationViewer from './WorldSimulationViewer'; // Assuming the correct import path

const App = () => {
  const [flightData, setFlightData] = useState(null);

  const handleParsedData = (parsedData) => {
    setFlightData(parsedData);
  };

  return (
    <div>
      <h1>Log Viewer</h1>
      <MyPlot onParsedData={handleParsedData} />
      <WorldSimulationViewer data={flightData} />
    </div>
  );
};

export default App;
