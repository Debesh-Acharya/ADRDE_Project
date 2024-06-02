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

const findHeaderRowIndex = (data, threshold = 0.5) => {
  const isNonNumeric = (cell) => isNaN(cell) || cell.trim() === "";
  
  for (let i = 0; i < data.length; i++) {
    let nonNumericCount = data[i].reduce((count, cell) => count + isNonNumeric(cell), 0);
    let nonNumericPercentage = nonNumericCount / data[i].length;
    
    if (nonNumericPercentage >= threshold) {
      return i;
    }
  }
  return 0;
};

const parseCSVContent = (content, handleParsedData) => {
  const delimiter = detectDelimiter(content);
  Papa.parse(content, {
    delimiter: delimiter,
    skipEmptyLines: true,
    complete: (results) => {
      const data = results.data;
      const headerRowIndex = findHeaderRowIndex(data);
      const headers = cleanHeaders(data[headerRowIndex]);

      const parsedData = data.slice(headerRowIndex + 1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });

      handleParsedData({ data: parsedData, meta: { fields: headers } });
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
