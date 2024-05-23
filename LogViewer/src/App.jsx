import React, { useState } from 'react';
import MyPlot from './MyPlot';
// import WorldSimulationViewer from './WorldSimulationViewer'; // Ensure this path is correct

const App = () => {
  const [flightData, setFlightData] = useState(null);

  const handleParsedData = (parsedData) => {
    setFlightData(parsedData);
  };

  return (
    <div>
      <MyPlot onParsedData={handleParsedData} />
      {/* {flightData && <WorldSimulationViewer data={flightData} />} */}
    </div>
  );
};

export default App;
