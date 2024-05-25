import Papa from 'papaparse';
import jsyaml from 'js-yaml';

const cleanHeaders = (headers) => {
  return headers.map(header => header.trim().replace(/,+/g, ''));
};

const detectDelimiter = (input) => {
  const delimiters = [',', '\t', ';', '|', ' '];
  let bestDelimiter = ',';
  let maxCount = 0;

  delimiters.forEach(delimiter => {
    const count = input.split(delimiter).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  });

  return bestDelimiter;
};

const parseCSVContent = (content, handleParsedData) => {
  const delimiter = detectDelimiter(content);
  Papa.parse(content, {
    header: true,
    delimiter: delimiter,
    complete: (results) => {
      if (results.meta.fields) {
        results.meta.fields = cleanHeaders(results.meta.fields);
      }
      handleParsedData(results);
    },
  });
};

export const parseCSV = (file, handleParsedData) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    parseCSVContent(e.target.result, handleParsedData);
  };
  reader.readAsText(file);
};

export const parseXLS = (file, XLSX, handleParsedData) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const csvContent = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
    parseCSVContent(csvContent, handleParsedData);
  };
  reader.readAsArrayBuffer(file);
};

export const parseJSON = (file, handleParsedData) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const jsonData = JSON.parse(e.target.result);
    const csvContent = Papa.unparse(jsonData);
    parseCSVContent(csvContent, handleParsedData);
  };
  reader.readAsText(file);
};

export const parseYAML = (file, handleParsedData) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const yamlData = jsyaml.load(e.target.result);
    const csvContent = Papa.unparse(yamlData);
    parseCSVContent(csvContent, handleParsedData);
  };
  reader.readAsText(file);
};

export const parseTXT = (file, handleParsedData) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    parseCSVContent(e.target.result, handleParsedData);
  };
  reader.readAsText(file);
};
