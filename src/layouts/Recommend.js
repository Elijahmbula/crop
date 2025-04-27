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

ChartJS.register(
    CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
);
// --- End Chart.js imports ---

// --- Reusable Suitability Bar Component ---
// (Component code as provided before - no changes needed)
const SuitabilityBar = ({ percentage, label }) => {
    const displayPercentage = Math.max(0, Math.min(100, Math.round(percentage || 0)));
    const bgColor = displayPercentage >= 85 ? 'bg-green-500' : displayPercentage >= 70 ? 'bg-yellow-500' : 'bg-orange-500';
    return (
        <div className="w-full mt-2">
            <div className="flex justify-between items-center mb-1">
                {label && (<span className="text-sm font-medium text-gray-700 truncate pr-2">{label} Suitability</span>)}
                <span className={`text-sm font-bold ml-auto ${displayPercentage >= 85 ? 'text-green-700' : displayPercentage >= 70 ? 'text-yellow-700' : 'text-orange-700'}`}>{displayPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                <div className={`${bgColor} h-2.5 rounded-full transition-all duration-500 ease-out`} style={{ width: `${displayPercentage}%` }} role="progressbar" aria-valuenow={displayPercentage} aria-valuemin="0" aria-valuemax="100" aria-label={`${label || 'Crop'} Suitability ${displayPercentage}%`}></div>
            </div>
        </div>
    );
};

// --- Recommendation Modal Component ---
// (Component code as provided before - no changes needed)
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


// --- Main Recommend Component ---
const Recommend = () => {
    const location = useLocation(); // Hook to access navigation state
    const navigate = useNavigate();

    // State for this component's UI logic
    const [allPredictions, setAllPredictions] = useState([]);
    const [mainCrop, setMainCrop] = useState({ name: 'N/A', suitability: 0 });
    const [alternativeCrops, setAlternativeCrops] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // *** ACCESSING THE PASSED STATE DATA ***
    // Get the whole state object passed during navigation
    const stateData = location.state;
    // Extract the specific pieces of data needed
    const serverData = stateData?.serverData;       // Contains { top5_predictions: [...] }
    const weather = stateData?.weather;             // Contains the full weather object
    const sensorData = stateData?.sensorData;       // Contains the original sensor data { nitrogen, ... }
    // Extract the prediction array itself for processing
    const predictionsFromServer = serverData?.top5_predictions;
    // *** END ACCESSING STATE DATA ***


    useEffect(() => {
        setIsLoading(true);
        let processed = false;

        console.log("Recommend Page - Received full state data:", stateData); // Log all received data

        // Process predictions (using predictionsFromServer)
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
                setIsModalOpen(true);
                processed = true;
            } else { /* Handle invalid top prediction */ }
        }

        // Handle cases where data is missing or invalid
        if (!processed) {
            console.warn("Recommend Page - Prediction data not found or invalid.");
            setMainCrop({ name: 'N/A', suitability: 0 });
            setAlternativeCrops([]);
            setAllPredictions([]);
            setIsModalOpen(false);
        }

        setIsLoading(false);
        // Depend on the overall stateData object, as its presence indicates navigation occurred
    }, [stateData]);

    const closeModal = () => setIsModalOpen(false);
    const handleUserLogout = () => {
        console.log("User logged out from Recommend page");
        navigate("/");
    };

    // --- Prepare Data for Rendering & Chart ---
    // Check if there's any sensor or weather data to display in the summary table
    const hasSensorOrWeatherData = sensorData || weather?.current;

    // Chart data preparation (uses allPredictions derived from serverData)
    const chartLabels = allPredictions.map(crop => crop.name);
    const chartSuitabilityData = allPredictions.map(crop => crop.suitability);
    const chartBackgroundColors = allPredictions.map(crop => { /* color logic */
        const percentage = crop.suitability;
        if (percentage >= 85) return 'rgba(34, 197, 94, 0.6)';
        if (percentage >= 70) return 'rgba(234, 179, 8, 0.6)';
        return 'rgba(249, 115, 22, 0.6)';
    });
    const chartBorderColors = chartBackgroundColors.map(color => color.replace('0.6', '1'));
    const chartData = { /* chart data object */
        labels: chartLabels,
        datasets: [{
            label: 'Suitability (%)', data: chartSuitabilityData, backgroundColor: chartBackgroundColors, borderColor: chartBorderColors, borderWidth: 1,
        }],
    };
    const chartOptions = { /* chart options object */
        responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: 'Top 5 Crop Suitability Comparison', font: { size: 16 }, padding: { top: 10, bottom: 20 } }, tooltip: { callbacks: { label: function(context) { return `${context.dataset.label || ''}: ${context.parsed.y}%`; } } } }, scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Suitability (%)' } }, x: { title: { display: true, text: 'Predicted Crops' } } },
    };

    // Pad alternatives for grid display
    const paddedAlternatives = [...alternativeCrops];
    while (paddedAlternatives.length < 4) { paddedAlternatives.push({ name: 'Not Available', suitability: 0, isPlaceholder: true }); }
    const displayAlternatives = paddedAlternatives.slice(0, 4);

    // --- Component Rendering ---
    return (
        <div className="bg-gray-100 min-h-screen flex flex-col">
            {/* Navigation Bar */}
            <nav className="bg-green-700 bg-gradient-to-t from-green-700 to-slate-200 fixed w-screen  text-blac p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold  text-black">CropAdvisor</h1>
         
          <ul className="flex space-x-6">
            <li><Link to="/home" className="hover:underline  text-black">Home</Link></li>
           
            
            <li><a href="#contact" className="hover:underline text-black">Contact</a></li>
            <LogoutButton onLogout={handleUserLogout} />
            
          </ul>
        </div>
      </nav>

            {/* Recommendation Modal */}
            <RecommendationModal isOpen={isModalOpen} onClose={closeModal} cropName={mainCrop.name} />

            {/* Main Content Area */}
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 md:pt-28">
                {/* Header Title */}
                <header className="text-center mb-8 md:mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800"> Crop Recommendations</h2>
                    <p className="text-gray-500 mt-2 text-sm md:text-base">Analysis based on provided soil & weather data</p>
                </header>

                {/* Loading Indicator */}
                {isLoading && <div className="text-center py-10"><p className="text-lg text-gray-600">Loading recommendations...</p></div>}

                {/* Layout Container */}
                {!isLoading && (
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                        {/* Left Column: Data Table */}
                        <div className="w-full lg:w-1/3 flex-shrink-0">
                            <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg h-full">
                                <h3 className="text-lg md:text-xl font-semibold text-gray-700 text-center mb-4">Input Data Summary</h3>
                                {!hasSensorOrWeatherData ? (
                                    <p className="text-center text-gray-500 italic">Input data not available.</p>
                                ) : (
                                    // *** USING PASSED DATA IN TABLE ***
                                    <table className="w-full border-collapse text-sm md:text-base">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border border-gray-300 p-2 text-left font-medium text-gray-600">Parameter</th>
                                                <th className="border border-gray-300 p-2 text-left font-medium text-gray-600">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Use sensorData from location.state */}
                                            {sensorData && Object.keys(sensorData).length > 0 && (
                                                <>
                                                    <tr className="bg-gray-50"><td colSpan="2" className="border border-gray-300 p-2 font-semibold text-gray-700">Soil Nutrients</td></tr>
                                                    <tr><td className="border border-gray-300 p-2">Nitrogen (N)</td><td className="border border-gray-300 p-2 font-medium text-blue-600">{sensorData.nitrogen ?? "N/A"} {sensorData.nitrogen != null ? ' mg/kg' : ''}</td></tr>
                                                    <tr><td className="border border-gray-300 p-2">Phosphorus (P)</td><td className="border border-gray-300 p-2 font-medium text-orange-600">{sensorData.phosphorus ?? "N/A"} {sensorData.phosphorus != null ? ' mg/kg' : ''}</td></tr>
                                                    <tr><td className="border border-gray-300 p-2">Potassium (K)</td><td className="border border-gray-300 p-2 font-medium text-purple-600">{sensorData.potassium ?? "N/A"} {sensorData.potassium != null ? ' mg/kg' : ''}</td></tr>
                                                </>
                                            )}
                                             {/* Use weather from location.state */}
                                             {weather?.current && (
                                                <>
                                                    <tr className="bg-gray-50"><td colSpan="2" className="border border-gray-300 p-2 font-semibold text-gray-700">Weather Conditions ({weather?.location?.name})</td></tr>
                                                    <tr><td className="border border-gray-300 p-2">Temperature</td><td className="border border-gray-300 p-2 font-medium text-red-600">{weather.current.temp_c ?? "N/A"}{weather.current.temp_c != null ? '°C' : ''}</td></tr>
                                                    <tr><td className="border border-gray-300 p-2">Humidity</td><td className="border border-gray-300 p-2 font-medium text-teal-600">{weather.current.humidity ?? "N/A"}{weather.current.humidity != null ? '%' : ''}</td></tr>
                                                    <tr><td className="border border-gray-300 p-2">Rainfall (Prec.)</td><td className="border border-gray-300 p-2 font-medium text-cyan-600">{weather.current.precip_mm ?? "N/A"}{weather.current.precip_mm != null ? ' mm' : ''}</td></tr>
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                    // *** END USING PASSED DATA ***
                                )}
                            </div>
                        </div>

                        {/* Right Column: Recommendations (uses serverData) */}
                         <div className="w-full lg:w-2/3 flex flex-col gap-6">
                             {mainCrop.name === 'N/A' ? (
                                <div className="bg-white p-6 rounded-lg shadow-lg text-center text-gray-500">Could not determine crop recommendations. Please check input data.</div>
                            ) : (
                                <>
                                    {/* Main Recommendation Card */}
                                    <div className="bg-gradient-to-br from-green-50 to-lime-100 p-4 md:p-6 rounded-lg shadow-lg border border-green-200">
                                        <h3 className="text-lg md:text-xl font-semibold text-green-800 text-center mb-3 flex items-center justify-center gap-2"><FaLeaf className="text-green-600"/> Most Suitable Crop</h3>
                                        <p className="text-2xl md:text-3xl font-bold text-center text-lime-700 mb-3 uppercase">{mainCrop.name}</p>
                                        {mainCrop.suitability > 0 && <SuitabilityBar percentage={mainCrop.suitability} label={mainCrop.name} />}
                              
                                    </div>
                                    {/* Alternative Recommendations Grid */}
                                    {alternativeCrops.length > 0 && ( <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg"> <h3 className="text-lg md:text-xl font-semibold text-gray-700 text-center mb-4">Alternative Crop Options</h3> <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6"> {displayAlternatives.map((altCrop, index) => ( <div key={index} className={`p-4 rounded-lg border flex flex-col justify-between transition-shadow min-h-[100px] ${altCrop.isPlaceholder ? 'bg-gray-100 border-gray-200' : 'bg-gray-50 border-gray-200 hover:shadow-md'}`}> {!altCrop.isPlaceholder ? ( <> <div> <p className="text-md md:text-lg font-semibold text-center text-gray-800 mb-2">{altCrop.name}</p> {altCrop.suitability > 0 && <SuitabilityBar percentage={altCrop.suitability} label={altCrop.name} />} </div> <div className="text-center mt-4"><button className="bg-blue-500 text-white font-semibold px-4 py-1.5 text-xs md:text-sm rounded-lg hover:bg-blue-600 transition duration-300">View Fertilizer Advice</button></div> </> ) : (<div className="text-center text-gray-400 italic p-4 h-full flex items-center justify-center">No more alternatives found</div>)} </div> ))} </div> </div> )}
                                    {/* Suitability Chart Section */}
                                     {allPredictions.length > 0 && ( <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg"> <div className="relative h-64 md:h-80 lg:h-96"> <Bar options={chartOptions} data={chartData} /> </div> </div> )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}

export { Recommend };