import React from 'react';
import MyPlot from './MyPlot';
import WorldSimulationViewer from './WorldSimulationViewer'; // Assuming the correct import path

const App = () => {
  return (
    <div>
      <h1>Log Viewer</h1>
      <MyPlot />
      <WorldSimulationViewer />
    </div>
  );
};

export default App;
