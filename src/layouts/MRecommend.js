import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Footer from "../components/Footer";
import LogoutButton from "../components/LogoutButton";
import { FaCheckCircle, FaTimes, FaLeaf } from 'react-icons/fa';

// --- Chart.js imports and registration ---
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// ***** NEW: Import Gauge Component *****
import GaugeComponent from 'react-gauge-component';
// ***** END NEW IMPORT *****

ChartJS.register(
    CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
);
// --- End Chart.js imports ---


// --- Reusable Suitability Bar Component ---
const SuitabilityBar = ({ percentage, label }) => {
    const displayPercentage = Math.max(0, Math.min(100, Math.round(percentage || 0)));
    const bgColor = displayPercentage >= 85 ? 'bg-green-500' : displayPercentage >= 70 ? 'bg-yellow-500' : 'bg-orange-500';
    return (
        <div className="w-full mt-2">
            <div className="flex justify-between items-center mb-1">
                {label && (<span className="text-xs sm:text-sm font-medium text-gray-700 truncate pr-2">{label} Suitability</span>)}
                <span className={`text-xs sm:text-sm font-bold ml-auto ${displayPercentage >= 85 ? 'text-green-700' : displayPercentage >= 70 ? 'text-yellow-700' : 'text-orange-700'}`}>{displayPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                <div
                    className={`${bgColor} h-2 rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${displayPercentage}%` }}
                    role="progressbar"
                    aria-valuenow={displayPercentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label={`${label || 'Crop'} Suitability ${displayPercentage}%`}
                ></div>
            </div>
        </div>
    );
};

// --- Recommendation Modal Component ---
// (No changes needed)
const RecommendationModal = ({ isOpen, onClose, cropName }) => {
    if (!isOpen || !cropName || cropName === 'N/A') return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50 transition-opacity duration-300 ease-out">
            <div className="relative bg-gradient-to-br from-green-50 via-white to-lime-50 p-6 md:p-8 rounded-xl shadow-2xl text-center w-full max-w-md transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-scale-in">
                <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
                <h2 className="text-xl md:text-2xl font-bold text-green-800 mb-3">Recommendation Ready!</h2>
                <p className="text-gray-600 mb-4 text-sm md:text-base">Based on the data, the most suitable crop is:</p>
                <p className="text-3xl md:text-4xl font-extrabold text-lime-600 uppercase my-3 md:my-4 tracking-wider animate-pulse">{cropName}</p>
                <p className="text-xs md:text-sm text-gray-500 mb-5 md:mb-6">See the detailed summary and alternatives below.</p>
                <button onClick={onClose} className="bg-green-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm md:text-base" aria-label="Close Recommendation Modal">View Details</button>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition" aria-label="Close"><FaTimes size={20} /></button>
            </div>
            <style jsx="true">{`@keyframes fade-scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-fade-scale-in { animation: fade-scale-in 0.3s ease-out forwards; }`}</style>
        </div>
    );
};


// --- Main MRecommend Component ---
const MRecommend = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Component State
    const [allPredictions, setAllPredictions] = useState([]);
    const [mainCrop, setMainCrop] = useState({ name: 'N/A', suitability: 0 });
    const [alternativeCrops, setAlternativeCrops] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Access state passed from WeatherSoil
    const stateData = location.state;
    const serverData = stateData?.serverData;
    const formData = stateData?.formData; // User inputs { nitrogen: '90', ... }
    const predictionsFromServer = serverData?.top5_predictions;


    useEffect(() => {
        setIsLoading(true);
        let processed = false;
        console.log("MRecommend Page - Received state data:", stateData);

        if (predictionsFromServer && Array.isArray(predictionsFromServer) && predictionsFromServer.length > 0) {
            const processedPredictions = predictionsFromServer.map(pred => ({
                name: pred.crop ?? 'Unknown Crop',
                suitability: Math.round((pred.probability ?? 0) * 100)
            })).slice(0, 5);

            setAllPredictions(processedPredictions);
            const topPrediction = processedPredictions[0];

            if (topPrediction && topPrediction.name !== 'Unknown Crop') {
                setMainCrop(topPrediction);
                setAlternativeCrops(processedPredictions.slice(1));
                setIsModalOpen(true); // Show modal when data is processed
                processed = true;
            } else {
                 console.warn("MRecommend Page - Top prediction was invalid:", topPrediction);
                 setMainCrop({ name: 'N/A', suitability: 0 });
                 setAlternativeCrops([]);
                 setAllPredictions([]);
             }
        } else {
             console.warn("MRecommend Page - 'predictionsFromServer' array not found or invalid:", predictionsFromServer);
        }

        if (!processed && !predictionsFromServer) { // Only set defaults if processing failed AND there was no server data initially
            setMainCrop({ name: 'N/A', suitability: 0 });
            setAlternativeCrops([]);
            setAllPredictions([]);
            setIsModalOpen(false); // Don't show modal if there's nothing to show
        }
        setIsLoading(false); // Loading finished regardless of success
    }, [stateData]); // Rerun if stateData changes

    const closeModal = () => setIsModalOpen(false);
    const handleUserLogout = () => { console.log("User logged out"); navigate("/"); };

    // --- Prepare Data for Rendering & Charts ---
    const hasFormData = formData && Object.keys(formData).length > 0;

    // --- Bar Chart Data (Crop Suitability) ---
    const chartLabels = allPredictions.map(crop => crop.name);
    const chartSuitabilityData = allPredictions.map(crop => crop.suitability);
    const chartBackgroundColors = allPredictions.map(crop => {
        const percentage = crop.suitability;
        if (percentage >= 85) return 'rgba(34, 197, 94, 0.7)'; // Green 500
        if (percentage >= 70) return 'rgba(234, 179, 8, 0.7)'; // Yellow 500
        return 'rgba(249, 115, 22, 0.7)'; // Orange 500
    });
    const chartBorderColors = chartBackgroundColors.map(color => color.replace('0.7', '1'));
    const barChartData = {
        labels: chartLabels,
        datasets: [{
            label: 'Suitability (%)',
            data: chartSuitabilityData,
            backgroundColor: chartBackgroundColors,
            borderColor: chartBorderColors,
            borderWidth: 1,
            borderRadius: 5, // Slightly rounded bars
        }],
    };
    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false, // Crucial for height control
        plugins: {
            legend: { display: false },
            title: { display: false }, // Title moved outside chart
            tooltip: {
                callbacks: {
                    label: function(context) { return `${context.dataset.label || ''}: ${context.parsed.y}%`; }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: 'Suitability (%)', font: {size: 12} },
                grid: { color: 'rgba(200, 200, 200, 0.2)' } // Lighter grid lines
            },
            x: {
                title: { display: true, text: 'Predicted Crops', font: {size: 12} },
                grid: { display: false } // Hide vertical grid lines
            }
        },
        // Add some padding inside the chart area
        layout: {
            padding: { top: 10, bottom: 5, left: 5, right: 5 }
        }
    };

    // --- ** NEW: Gauge Chart Configuration ** ---
    // Define realistic maximum values for gauges (ADJUST THESE BASED ON YOUR DATA/EXPECTATIONS)
    const gaugeMaxValues = {
        nitrogen: 200,    // Example: Max expected N in kg/ha
        phosphorus: 100,  // Example: Max expected P in kg/ha
        potassium: 100,   // Example: Max expected K in kg/ha
        temperature: 50,  // Example: Max plausible temperature °C
        humidity: 100,   // Max humidity is 100%
        rainfall: 300,   // Example: Max plausible rainfall in mm (adjust for period if needed)
    };
    // Define units for display
    const gaugeUnits = {
        nitrogen: 'kg/ha', phosphorus: 'kg/ha', potassium: 'kg/ha', temperature: '°C', humidity: '%', rainfall: 'mm'
    };
    // Define labels for display
    const gaugeLabels = {
        nitrogen: 'Nitrogen (N)', phosphorus: 'Phosphorus (P)', potassium: 'Potassium (K)', temperature: 'Temperature', humidity: 'Humidity', rainfall: 'Rainfall'
    };
    // Define color segments (e.g., Low, Medium, High ranges relative to max value)
    const createGaugeArcs = (maxValue) => {
        // Example thresholds (adjust these percentages)
        const lowLimit = maxValue * 0.3;
        const midLimit = maxValue * 0.7;
        return {
             limits: [lowLimit, midLimit], // Define the end points of the color segments
             colorArray: ['#EA4228', '#F5CD19', '#5BE12C'], // Red, Yellow, Green
             padding: 0.02, // Small padding between arcs
             width: 0.2, // Thickness of the arc relative to radius
             cornerRadius: 7, // Rounded ends
         }
    };
    // --- ** END: Gauge Chart Configuration ** ---


    // --- Prepare Alternatives for Grid Display ---
    const paddedAlternatives = [...alternativeCrops];
    while (paddedAlternatives.length < 4) { paddedAlternatives.push({ name: 'Not Available', suitability: 0, isPlaceholder: true }); }
    const displayAlternatives = paddedAlternatives.slice(0, 4);

    // --- Component Rendering ---
    return (
        <div className="bg-gray-100 min-h-screen flex flex-col font-sans">
            {/* Navigation Bar */}
            <nav className="bg-white fixed w-full text-gray-800 p-3 shadow-md z-40 border-b border-gray-200">
                <div className="container mx-auto flex justify-between items-center px-4">
                    <Link to="/home" className="flex items-center gap-2 text-xl font-bold text-green-700 hover:text-green-800 transition">
                        <FaLeaf />
                        <span>CropAdvisor</span>
                    </Link>
                    <div className="flex items-center space-x-4 md:space-x-6">
                        <Link to="/home" className="text-sm md:text-base hover:text-green-600 transition duration-200">Home</Link>
                        {/* Add other nav links here if needed */}
                        <LogoutButton onLogout={handleUserLogout} />
                    </div>
                </div>
            </nav>

            {/* Recommendation Modal */}
            <RecommendationModal isOpen={isModalOpen} onClose={closeModal} cropName={mainCrop.name} />

            {/* Main Content Area - Added padding top for fixed navbar */}
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20 md:pt-24 w-full">
                {/* Header Title - Less prominent */}
                <header className="text-left mb-6 md:mb-8 border-b pb-4 border-gray-300">
                    <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">Recommendation Dashboard</h2>
                    <p className="text-gray-500 mt-1 text-sm md:text-base">Analysis based on your provided environmental data.</p>
                </header>

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="text-center py-20 flex justify-center items-center h-[50vh]">
                         {/* Simple Spinner */}
                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                         <p className="ml-4 text-lg text-gray-600">Loading recommendations...</p>
                    </div>
                )}

                {/* Layout Container - Use flex-col to ensure sections stack vertically initially */}
                {!isLoading && (
                    <div className="flex flex-col gap-6 lg:gap-8">

                        {/* --- Section 1: Input Summary & Gauges --- */}
                        {/* Uses flex-col initially, becomes flex-row on large screens */}
                        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                             {/* Left Sub-Column: Input Data Summary Table */}
                             <div className="w-full lg:w-1/3 flex-shrink-0">
                                 <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-200 h-full">
                                     <h3 className="text-lg md:text-xl font-semibold text-gray-700 text-center mb-4">Input Data</h3>
                                     {!hasFormData ? (
                                         <div className="flex items-center justify-center h-full text-gray-500 italic pt-10">Input data not available.</div>
                                     ) : (
                                         <table className="w-full border-collapse text-sm md:text-base">
                                             <thead>
                                                 <tr className="bg-gray-50">
                                                     <th className="border border-gray-300 p-2 text-left font-medium text-gray-600 text-xs sm:text-sm">Parameter</th>
                                                     <th className="border border-gray-300 p-2 text-left font-medium text-gray-600 text-xs sm:text-sm">Value</th>
                                                 </tr>
                                             </thead>
                                             <tbody>
                                                 {/* Simplified Rows */}
                                                 <tr><td className="border border-gray-300 px-2 py-1.5 text-gray-700">Nitrogen (N)</td><td className="border border-gray-300 px-2 py-1.5 font-medium text-blue-600">{formData.nitrogen ?? "N/A"} kg/ha</td></tr>
                                                 <tr><td className="border border-gray-300 px-2 py-1.5 text-gray-700 bg-gray-50">Phosphorus (P)</td><td className="border border-gray-300 px-2 py-1.5 font-medium text-orange-600 bg-gray-50">{formData.phosphorus ?? "N/A"} kg/ha</td></tr>
                                                 <tr><td className="border border-gray-300 px-2 py-1.5 text-gray-700">Potassium (K)</td><td className="border border-gray-300 px-2 py-1.5 font-medium text-purple-600">{formData.potassium ?? "N/A"} kg/ha</td></tr>
                                                 <tr><td className="border border-gray-300 px-2 py-1.5 text-gray-700 bg-gray-50">Temperature</td><td className="border border-gray-300 px-2 py-1.5 font-medium text-red-600 bg-gray-50">{formData.temperature ?? "N/A"} °C</td></tr>
                                                 <tr><td className="border border-gray-300 px-2 py-1.5 text-gray-700">Humidity</td><td className="border border-gray-300 px-2 py-1.5 font-medium text-teal-600">{formData.humidity ?? "N/A"} %</td></tr>
                                                 <tr><td className="border border-gray-300 px-2 py-1.5 text-gray-700 bg-gray-50">Rainfall</td><td className="border border-gray-300 px-2 py-1.5 font-medium text-cyan-600 bg-gray-50">{formData.rainfall ?? "N/A"} mm</td></tr>
                                             </tbody>
                                         </table>
                                     )}
                                 </div>
                             </div>

                             {/* Right Sub-Column: Input Parameter Gauges */}
                              <div className="w-full lg:w-2/3">
                                  {/* **** NEW GAUGE SECTION **** */}
                                  {hasFormData ? (
                                      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-200 h-full">
                                          <h3 className="text-lg md:text-xl font-semibold text-gray-700 text-center mb-5 md:mb-8">Input Parameter Gauges</h3>
                                          {/* Grid for gauges - Responsive columns */}
                                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-8 gap-x-4 place-items-center">
                                              {/* Map over defined parameters */}
                                              {Object.keys(gaugeMaxValues).map((key) => {
                                                  // Get value, handle missing/NaN, ensure numeric
                                                  const value = formData && formData[key] !== undefined && formData[key] !== null ? Number(formData[key]) : 0;
                                                  const numericValue = isNaN(value) ? 0 : Math.max(0, value); // Ensure non-negative for gauge
                                                  const maxValue = gaugeMaxValues[key];

                                                  return (
                                                      <div key={key} className="text-center w-full max-w-[160px] sm:max-w-[180px]"> {/* Control width */}
                                                          <GaugeComponent
                                                              // Config for the gauge appearance
                                                              arc={createGaugeArcs(maxValue)} // Arcs based on max value
                                                              value={numericValue} // Current value from form data
                                                              minValue={0} // Gauges start at 0
                                                              maxValue={maxValue} // Dynamic max value
                                                              // --- Customize Labels ---
                                                              labels={{
                                                                  valueLabel: {
                                                                      // Format the main value display
                                                                      formatTextValue: v => `${v.toFixed(0)}`, // Show value without decimal
                                                                      style: { fontSize: "30px", fill: "#4A5568", textShadow: 'none' }, // Adjust size and color
                                                                      maxDecimalDigits: 0,
                                                                  },
                                                                   // Optional: Ticks inside or outside
                                                                   // tickLabels: {
                                                                   //     type: "inner",
                                                                   //     ticks: [ { value: maxValue * 0.2 }, { value: maxValue * 0.8 } ],
                                                                   //     valueConfig: { formatTextValue: v => v.toFixed(0), fontSize: 10 }
                                                                   // }
                                                              }}
                                                              // --- Pointer Customization (Optional) ---
                                                               pointer={{
                                                                    type: "arrow", // Or "needle"
                                                                    color: "#4A5568", // Dark gray pointer
                                                                    length: 0.6, // Adjust length
                                                                    width: 8, // Adjust width
                                                                    // animate: true, // Enable animation
                                                                    // animationDuration: 800 // Animation speed
                                                               }}
                                                          />
                                                          {/* Label below the gauge */}
                                                          <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1.5 truncate">
                                                            {gaugeLabels[key] || key}
                                                            <span className="text-gray-500 text-xs block">({gaugeUnits[key] || ''})</span> {/* Show units below */}
                                                          </p>
                                                      </div>
                                                  );
                                              })}
                                          </div>
                                      </div>
                                  ) : (
                                      // Placeholder if no form data was received
                                       <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full flex items-center justify-center">
                                           <p className="text-center text-gray-400 italic">Input parameter gauges require data from the previous step.</p>
                                       </div>
                                  )}
                                  {/* **** END NEW GAUGE SECTION **** */}
                              </div>
                        </div>


                         {/* --- Section 2: Recommendations --- */}
                         {/* Uses flex-col initially, becomes flex-row on XL screens */}
                         <div className="w-full flex flex-col gap-6">
                              {mainCrop.name === 'N/A' && allPredictions.length === 0 ? (
                                 <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center text-gray-500 italic">
                                    Could not determine crop recommendations based on the provided data. Please check your inputs or try different values.
                                 </div>
                              ) : (
                                 // Container for Recommendations (left) and Chart (right)
                                 <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">

                                     {/* Left Side: Main/Alternative Cards */}
                                     <div className="w-full xl:w-1/2 flex flex-col gap-6">
                                         {/* Main Recommendation Card */}
                                         <div className="bg-gradient-to-br from-green-50 to-lime-100 p-4 md:p-6 rounded-lg shadow-lg border border-green-200 flex flex-col items-center">
                                             <h3 className="text-lg md:text-xl font-semibold text-green-800 mb-2 flex items-center gap-2"><FaLeaf className="text-green-600"/> Most Suitable Crop</h3>
                                             <p className="text-2xl md:text-3xl font-bold text-lime-700 mb-3 uppercase tracking-wide">{mainCrop.name}</p>
                                             {mainCrop.suitability > 0 && (
                                                 <div className="w-full max-w-xs"> {/* Constrain width of bar */}
                                                     <SuitabilityBar percentage={mainCrop.suitability} label={null} /> {/* Remove label duplication */}
                                                 </div>
                                             )}
                                             {mainCrop.name === 'N/A' && <p className="text-gray-500 italic mt-2">N/A</p>}
                                         </div>

                                         {/* Alternative Recommendations Grid */}
                                         {alternativeCrops.length > 0 && (
                                             <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-200">
                                                 <h3 className="text-lg md:text-xl font-semibold text-gray-700 text-center mb-4">Alternative Crop Options</h3>
                                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                     {displayAlternatives.map((altCrop, index) => (
                                                         <div
                                                            key={index}
                                                            className={`p-3 rounded-lg border flex flex-col justify-between transition-shadow min-h-[90px] ${
                                                                altCrop.isPlaceholder
                                                                ? 'bg-gray-100 border-gray-200 opacity-60'
                                                                : 'bg-gray-50 border-gray-200 hover:shadow-md'
                                                            }`}
                                                        >
                                                             {!altCrop.isPlaceholder ? (
                                                                 <>
                                                                     <div>
                                                                         <p className="text-sm sm:text-base font-semibold text-center text-gray-800 mb-2">{altCrop.name}</p>
                                                                         {altCrop.suitability > 0 && <SuitabilityBar percentage={altCrop.suitability} label={null} />}
                                                                     </div>
                                                                 </>
                                                             ) : (
                                                                 <div className="text-center text-gray-400 italic p-2 h-full flex items-center justify-center text-sm">No more alternatives</div>
                                                             )}
                                                         </div>
                                                     ))}
                                                 </div>
                                             </div>
                                         )}
                                     </div>

                                     {/* Right Side: Suitability Bar Chart */}
                                     <div className="w-full xl:w-1/2">
                                         {allPredictions.length > 0 ? (
                                            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-200 h-full flex flex-col">
                                                <h3 className="text-lg md:text-xl font-semibold text-gray-700 text-center mb-4">Crop Suitability Comparison</h3>
                                                 {/* Chart container needs explicit height */}
                                                 <div className="relative flex-grow min-h-[350px] md:min-h-[450px]">
                                                     <Bar options={barChartOptions} data={barChartData} />
                                                 </div>
                                            </div>
                                         ) : (
                                             // Show a placeholder if there's no chart data but processing happened
                                              !isLoading && mainCrop.name !== 'N/A' && (
                                                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full flex items-center justify-center">
                                                    <p className="text-center text-gray-400 italic">No comparative data to display.</p>
                                                </div>
                                              )
                                         )}
                                     </div>

                                 </div>
                             )}
                         </div> {/* End Section 2 inner container */}
                    </div> // End Main Layout Container
                )}
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}

export { MRecommend };