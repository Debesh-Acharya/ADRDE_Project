import Papa from 'papaparse';
import jsyaml from 'js-yaml';

const cleanHeaders = (headers) => {
  // Remove empty headers and trim whitespace from each header
  return headers.filter(header => header.trim() !== '');
};


const detectDelimiter = (input) => {
  const delimiters = [',', '\t', ';', '|', '  ', ':', '/', '\\', '_', '-', '+', '*', '^', '&', '$', '#', '@', '!', '?', '\n', '\r', '"', "'", '<>', '{}', '[]', '%'];
  let bestDelimiter = ',';
  let maxCount = 0;

  delimiters.forEach(delimiter => {
    // Split the input using the delimiter
    const parts = input.split(delimiter);
    // Check if the result contains any non-empty parts
    const count = parts.some(part => part.trim() !== '') ? parts.length : 0;
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

    if (nonNumericPercentage >= threshold && i >= 0) { // Adjusted to start searching from the 6th row
      return i;
    }
  }
  return 0; // If no suitable header row is found, return 0
};


export const parseCSVContent = (content, handleParsedData) => {
  let startLine = parseInt(prompt("Enter the start line number:", "1"),10);
  if (isNaN(startLine)) {
    startLine = 1; // Use 1 as the default start line if the input is not a number
  }

  const delimiter = detectDelimiter(content);
  Papa.parse(content, {
    delimiter: delimiter,
    skipEmptyLines: true,
    complete: (results) => {
      const data = results.data;
      let headerRowIndex = findHeaderRowIndex(data);
      if (startLine > 1) {
        // Adjust the header row index based on the start line
        headerRowIndex += startLine - 1;
      }
      const headers = cleanHeaders(data[headerRowIndex]);
      const headerLength = headers.length;
      const parsedData = data.slice(headerRowIndex + 1).map(row => {
        // Clean and pad or trim the row to match the header length
        const cleanedRow = cleanAndPadRow(row, headerLength);
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = cleanedRow[index];
        });
        return obj;
      });

      handleParsedData({ data: parsedData, headers: headers }); // Return both data and headers
    },
  });
};


const cleanAndPadRow = (row, length) => {
  const cleanedRow = [];
  let numericCount = 0;

  // Clean and count the number of numeric data in the row
  row.forEach(cell => {
    const cleanedCell = cell.trim(); // Trim whitespace from each cell
    if (!isNaN(cleanedCell) && cleanedCell !== '') {
      // If the cell is numeric, increment the numeric count
      numericCount++;
    }
    cleanedRow.push(cleanedCell);
  });

  // If the number of numeric data is less than the header length,
  // pad the row with empty strings to match the header length
  if (numericCount < length) {
    cleanedRow.push(...new Array(length - numericCount).fill(''));
  }

  // If the number of numeric data is greater than the header length,
  // trim the row to match the header length
  if (numericCount > length) {
    cleanedRow.splice(length);
  }

  return cleanedRow;
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
