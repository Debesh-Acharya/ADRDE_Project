import Papa from 'papaparse';
import jsyaml from 'js-yaml';

export const parseCSV = (file, handleParsedData) => {
  Papa.parse(file, {
    download: true,
    header: true,
    complete: handleParsedData,
  });
};

export const parseXLS = (file, XLSX, handleParsedData) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const csvData = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
    Papa.parse(csvData, {
      header: true,
      complete: handleParsedData,
    });
  };
  reader.readAsArrayBuffer(file);
};

export const parseJSON = (file, handleParsedData) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const jsonData = JSON.parse(e.target.result);
    const csvData = Papa.unparse(jsonData);
    Papa.parse(csvData, {
      header: true,
      complete: handleParsedData,
    });
  };
  reader.readAsText(file);
};

export const parseYAML = (file, handleParsedData) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const yamlData = jsyaml.load(e.target.result);
    const csvData = Papa.unparse(yamlData);
    Papa.parse(csvData, {
      header: true,
      complete: handleParsedData,
    });
  };
  reader.readAsText(file);
};
