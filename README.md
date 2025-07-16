# ADRDE Trial Log Viewer

A sophisticated web application for visualizing and analyzing flight trial data developed for the Armament Research and Development Establishment (ADRDE) of DRDO. This application provides comprehensive tools for data plotting, 3D flight simulation, and real-time telemetry visualization.

![ADRDE Logo](LogViewer/public/adrde_drdo.png)

## 🚀 Features

### 📊 Data Plotting & Analysis
- **Multi-format Support**: Parse and visualize CSV, JSON, YAML, TSV, and TXT files
- **Interactive Plotting**: Create multiple interactive plots with Plotly.js
- **Real-time Data Processing**: Web worker-based file parsing for smooth performance
- **Customizable Visualizations**: 
  - Multiple Y-axis support
  - Color customization
  - Scaling factors and offsets
  - 2D/3D plotting modes
  - Various plot types (scatter, line, markers)
- **Responsive Design**: Modern UI with Tailwind CSS and smooth animations

### ✈️ 3D Flight Simulation
- **Cesium Integration**: High-fidelity 3D globe visualization
- **Aircraft Models**: Support for multiple 3D aircraft models (GLB format)
- **Flight Path Visualization**: Real-time trajectory rendering
- **Coordinate Systems**: Support for both GPS (LAT/LON) and local (X/Y) coordinates
- **Simulation Controls**: Adjustable playback speed and timeline navigation
- **Telemetry Display**: Real-time flight data overlay

### 🛠️ Technical Features
- **Modern React Architecture**: Built with React 18 and modern hooks
- **Performance Optimized**: Web workers for heavy data processing
- **Interactive UI**: Smooth animations with Framer Motion
- **Modular Design**: Component-based architecture for maintainability
- **File Format Detection**: Automatic delimiter and header detection
- **Error Handling**: Comprehensive error handling and user feedback

## 🛠️ Technology Stack

### Frontend Framework
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **JavaScript (ES6+)**: Modern JavaScript features

### Visualization Libraries
- **Plotly.js**: Interactive 2D/3D plotting
- **Cesium**: 3D globe and geospatial visualization
- **Three.js**: 3D graphics and animation
- **React Three Fiber**: React renderer for Three.js

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **React Transition Group**: Component transition effects

### Data Processing
- **Papa Parse**: CSV parsing and processing
- **js-yaml**: YAML file parsing
- **xlsx**: Excel file support
- **Web Workers**: Background data processing

### Development Tools
- **ESLint**: Code linting and quality
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Debesh-Acharya/ADRDE_Project.git
   cd ADRDE_Project
   ```

2. **Install root dependencies**:
   ```bash
   npm install
   ```

3. **Navigate to LogViewer and install dependencies**:
   ```bash
   cd LogViewer
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:5173`

### Building for Production

```bash
cd LogViewer
npm run build
```

The built files will be in the `dist/` directory.

## 📖 Usage Guide

### Data Plotting
1. **Upload Data**: Use the file upload button to load CSV, JSON, YAML, or other supported formats
2. **Create Graphs**: Click "Add New Graph" to create new visualizations
3. **Customize Plots**: 
   - Select X and Y columns
   - Choose plot types and modes
   - Adjust colors, scaling, and offsets
   - Enable 3D mode for spatial data

### 3D Flight Simulation
1. **Switch to Simulation Tab**: Click the "3D Simulation" tab
2. **Configure Coordinates**: Select coordinate system (GPS or Local)
3. **Map Data Columns**: Map your data columns to simulation parameters
4. **Run Simulation**: Use playback controls to visualize flight paths
5. **Adjust Settings**: Modify simulation speed and view options

### Supported Data Formats
- **CSV**: Comma-separated values
- **TSV**: Tab-separated values
- **JSON**: JavaScript Object Notation
- **YAML/YML**: YAML Ain't Markup Language
- **TXT**: Text files with various delimiters

## 🔧 Configuration

### Cesium Token
The application uses Cesium for 3D visualization. The default token is included, but for production use, you should:

1. Get your own token from [Cesium Ion](https://cesium.com/ion/)
2. Replace the token in `src/components/SimulationTab.jsx`:
   ```javascript
   window.Cesium.Ion.defaultAccessToken = 'YOUR_TOKEN_HERE';
   ```

### Customization
- **Themes**: Modify Tailwind CSS configuration in `tailwind.config.js`
- **3D Models**: Add new aircraft models to the `public/` directory
- **File Parsers**: Extend parsing capabilities in `src/utils/fileParserUtils.js`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is developed for ADRDE (Armament Research and Development Establishment), DRDO. All rights reserved.

## 🙏 Acknowledgments

- **ADRDE, DRDO** for project requirements and support
- **Cesium** for 3D geospatial visualization
- **Plotly** for interactive plotting capabilities
- **Three.js** community for 3D graphics support

## 📞 Support

For technical support or questions about this application, please contact the development team or refer to the project documentation.

---

**Developed for ADRDE, DRDO** | **Version 1.0** | **2025**