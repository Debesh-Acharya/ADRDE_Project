import React, { useEffect } from 'react';
import Plotly from 'plotly.js-basic-dist';

const MyPlot = () => {
  useEffect(() => {
    const TESTER = document.getElementById('tester');

    // Plotly.newPlot
    Plotly.newPlot(TESTER, [{
      x: [1, 2, 3, 4, 5],
      y: [1, 2, 4, 8, 16]
    }], {
      margin: { t: 0 }
    });

    // Cleanup function
    return () => {
      Plotly.purge(TESTER);
    };
  }, []); // Empty dependency array means this effect runs once after the first render

  return <div id="tester" style={{ width: '600px', height: '250px' }}></div>;
};

export default MyPlot;
