
import React from 'react';
import MyPlot from './MyPlot';
import PlaneTrajectoryViewer from './PlaneTrajectoryViewer';

const App = () => {
  return (
    <div>
      <h1>Log Viewer</h1>
      <MyPlot />
      <PlaneTrajectoryViewer/>

    </div>
  );
};

export default App;