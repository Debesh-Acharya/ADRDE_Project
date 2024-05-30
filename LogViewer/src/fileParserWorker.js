// fileParserWorker.js
import {
      parseCSV,
      parseXLS,
      parseJSON, 
      parseYAML, 
      parseTXT
    } from './utils/fileParserUtils';

self.onmessage = (e) => {
  const { file, fileType } = e.data;

  const handleParsedData = (parsedData) => {
    self.postMessage(parsedData);
  };

  switch (fileType) {
    case 'csv':
    case 'tsv':
      parseCSV(file, handleParsedData);
      break;
    case 'xls':
      parseXLS(file, handleParsedData);
      break;
    case 'json':
      parseJSON(file, handleParsedData);
      break;
    case 'yml':
    case 'yaml':
      parseYAML(file, handleParsedData);
      break;
    case 'txt':
      parseTXT(file, handleParsedData);
      break;
    default:
      self.postMessage({ error: 'Unsupported file type' });
  }
};
