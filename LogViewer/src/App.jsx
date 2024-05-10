import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import Papa from 'papaparse';

function App() {
  const [data, setData] = useState([]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const csvData = reader.result;
      parseCSVData(csvData);
    };

    reader.readAsText(file);
  };

  const parseCSVData = (csvData) => {
    Papa.parse(csvData, {
      complete: (result) => {
        // Assuming the first row contains headers
        const headers = result.data[0];
        const parsedData = result.data.slice(1); // Exclude headers
        setData(parsedData);
      },
    });
  };

  return (
    <div>
      <input type="file" onChange={handleFileUpload} />
      {data.length > 0 && (
        <Plot
          data={[
            {
              x: data.map((row) => row[0]),
              y: data.map((row) => row[1]),
              type: 'scatter',
              mode: 'lines+markers',
              marker: { color: 'blue' },
            },
          ]}
          layout={{ width: 800, height: 400, title: 'Data Plot',autosize:true }}
        />
      )}
    </div>
  );
}

export default App;
