import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Footer from "../components/Footer";
import LogoutButton from "../components/LogoutButton";

export default function Climate() {
    const location = useLocation();
    const navigate = useNavigate();

    // Destructure sensorData safely
    const { sensorData = {} } = location.state || {};

    // --- State Variables ---
    const [city, setCity] = useState("");
    const [weather, setWeather] = useState(null);
    const [loadingWeather, setLoadingWeather] = useState(false);
    const [loadingPrediction, setLoadingPrediction] = useState(false);
    const [error, setError] = useState(null);
    const [canProceed, setCanProceed] = useState(false); // Controls if weather data is ready
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // --- Extract and Prepare Data ---
    const nitrogen = sensorData?.nitrogen ?? "not available";
    const phosphorus = sensorData?.phosphorus ?? "not available";
    const potassium = sensorData?.potassium ?? "not available";
    const temperature = weather?.current?.temp_c ?? "not available";
    const humidity = weather?.current?.humidity ?? "not available";
    const rainfall = weather?.current?.precip_mm ?? "not available";

    // Helper to check if a value is a valid number
    const isNumeric = (value) => value !== "not available" && !isNaN(parseFloat(value)) && isFinite(value);

    // --- Fetch Weather Data ---
    const fetchWeather = async () => {
        if (!city) {
            setError("Please enter a city name.");
            setShowErrorModal(true);
            return;
        }
        setLoadingWeather(true);
        setError(null);
        setCanProceed(false);
        setWeather(null);

        try {
            const apiKey = "c9bd72ec0fc04093a1982220252303"; // Replace with your key
            const response = await fetch(
                `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`
            );
            const data = await response.json();

            if (data.error) {
                setError(`Weather API Error: ${data.error.message}`);
                setShowErrorModal(true);
                setWeather(null);
            } else {
                setWeather(data);
                setCanProceed(true); // <-- Allows the Proceed button to be active
                setShowSuccessModal(true);
                setError(null);
            }
        } catch (fetchError) {
            console.error("Error fetching weather data:", fetchError);
            setError("Failed to fetch weather data. Check network connection or API key.");
            setShowErrorModal(true);
            setWeather(null);
        } finally {
            setLoadingWeather(false);
        }
    };

    /**
     * Sends validated data to the prediction server.
     * @returns {Promise<object|null>} A promise that resolves with the server response object
     *                                  (containing top5_predictions) on success, or null on failure.
     */
    const sendDataToServer = async () => {
        const serverUrl = "http://192.168.43.35:5000/predict_top5";

        // 1. Validate data points
        const dataPoints = [nitrogen, phosphorus, potassium, rainfall, temperature, humidity];
        const dataLabels = ["Nitrogen", "Phosphorus", "Potassium", "Rainfall", "Temperature", "Humidity"];
        for (let i = 0; i < dataPoints.length; i++) {
            if (!isNumeric(dataPoints[i])) {
                 setError(`Invalid or missing value for ${dataLabels[i]} ('${dataPoints[i]}'). Cannot get prediction.`);
                 setShowErrorModal(true);
                 return null; // Return null to indicate failure
            }
        }

        // 2. Construct payload
        const payload = {
            'features': dataPoints.map(p => parseFloat(p))
        };

        console.log("Sending data to prediction server:", JSON.stringify(payload));
        setLoadingPrediction(true); // Show loading state on button
        setError(null);

        try {
            // 3. Make the API call
            const response = await fetch(serverUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            // 4. Check for server errors (like 4xx, 5xx)
            if (!response.ok) {
                let errorMsg = `Server Error: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMsg += ` - ${errorData.message || errorData.error || JSON.stringify(errorData)}`;
                } catch (e) { /* Ignore */ }
                throw new Error(errorMsg); // Throw error to be caught below
            }

            // 5. Parse the successful response
            const data = await response.json();
            console.log("Server Response Received:", data); // Log the actual response

            // 6. **CORRECTED CHECK**: Validate the structure for 'top5_predictions' array
            if (data && Array.isArray(data.top5_predictions)) {
                console.log("CONDITION MET: Server response contains 'top5_predictions' array.");
                // 7. Return the *entire successful response data*
                return data;
            } else {
                // If structure is wrong, log details and throw the CORRECT error
                console.error("CONDITION FAILED: Invalid response structure. 'data' exists:", !!data, "'data.top5_predictions' is Array:", Array.isArray(data?.top5_predictions), "Response:", data);
                // ** THIS IS THE ERROR MESSAGE THAT SHOULD BE THROWN IF THE CHECK FAILS **
                throw new Error("Prediction server response did not contain 'top5_predictions' array.");
            }

        } catch (serverError) {
            // 8. Handle any errors (fetch network error, server error, thrown validation error)
            console.error("Error caught in sendDataToServer:", serverError);
            setError(`Failed to get prediction: ${serverError.message}`); // Display the caught error message
            setShowErrorModal(true);
            // 9. Return null to indicate failure
            return null;
        } finally {
            setLoadingPrediction(false); // Stop loading state on button
        }
    };

    /**
     * Navigates to the Recommend page, passing necessary data.
     * @param {object} predictionData - The successful response object from the prediction server.
     */
    const navigateToRecommend = (predictionData) => {
         if (predictionData) {
            console.log("Navigating to /Recommend with prediction data:", predictionData);
             navigate('/Recommend', {
                 state: {
                     serverData: predictionData,
                     weather: weather,
                     sensorData: sensorData
                 }
             });
         } else {
             console.error("Internal Error: navigateToRecommend called without valid predictionData.");
         }
    };

    /**
     * Handles the click event for the 'Proceed' button.
     */
     const handleProceedAndPredict = async () => {
        if (!canProceed || loadingPrediction) return;

        console.log("Proceed button clicked. Calling sendDataToServer...");
        const predictionResult = await sendDataToServer(); // This holds the server response or null
        console.log("Result from sendDataToServer:", predictionResult);

        // Only navigate if predictionResult is truthy (meaning it holds the data object)
        if (predictionResult) {
            console.log("Prediction result is valid. Navigating...");
            navigateToRecommend(predictionResult);
        } else {
            console.log("Prediction result is null or invalid. Navigation aborted.");
            // Error handling is done within sendDataToServer
        }
     };

    // --- Logout Handler ---
    const handleUserLogout = () => {
        console.log("User logged out");
        navigate("/");
    };

    // --- JSX Rendering ---
    return (
        <div className="min-h-screen flex flex-col bg-gray-900">
            {/* Navigation Bar */}
            <nav className="bg-gradient-to-b h-24 from-green-700 to-gray-200 fixed w-screen text-black p-4 shadow-lg z-10">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-black">CropAdvisor</h1>
                    <ul className="flex space-x-6 items-center">
                        <li><Link to="/home" className="hover:underline text-black">Home</Link></li>
                        <li><a href="#contact" className="hover:underline mr-5 text-black">Contact</a></li>
                       
                    </ul>
                </div>
            </nav>
            <li><LogoutButton onLogout={handleUserLogout} buttonClass="bg-red-500 hover:bg-red-600 text-xs md:text-sm" /></li>

            {/* Content Area */}
            <div className="flex-grow pt-24 md:pt-28">
                 {/* Info Box */}
                 <div className="bg-gray-800 p-4 md:p-6 text-center text-white mt-4 mx-auto shadow-xl rounded-lg max-w-2xl w-11/12 ">
                     <p className="text-sm md:text-base text-gray-300">
                        Enter your city to get current weather conditions. This data, along with NPK values, will be used to recommend suitable crops.
                     </p>
                 </div>

                {/* Weather Search Section */}
                <div className="container mx-auto flex flex-col items-center justify-center p-6 md:p-10 text-white">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6">Check Weather</h2>
                    {/* Search Input */}
                    <div className="flex bg-gray-800 p-3 rounded-lg shadow-lg w-full max-w-md mb-6">
                        <input
                            type="text"
                            placeholder="Enter city name..."
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && fetchWeather()}
                            className="flex-grow p-2 bg-transparent border-none outline-none text-white placeholder-gray-400"
                        />
                        <button
                            onClick={fetchWeather}
                            className={`p-2 rounded-lg transition ${loadingWeather ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            disabled={loadingWeather || !city}
                        >
                           {loadingWeather ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <FaSearch size={20} />}
                        </button>
                    </div>

                    {/* Display Weather Data & Proceed Button */}
                    {weather && !error && canProceed && (
                        <div className="mt-6 bg-gray-800 p-6 rounded-lg shadow-lg text-center w-full max-w-md">
                            <h3 className="text-xl md:text-2xl font-semibold">{weather?.location?.name}, {weather?.location?.country}</h3>
                            <p className="text-lg mb-4 capitalize">{weather?.current?.condition?.text}</p>
                            {/* Data Table */}
                            <table className="table-auto border-collapse w-full text-white mb-6 text-sm md:text-base">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="border border-gray-600 px-4 py-2 text-left">Parameter</th>
                                        <th className="border border-gray-600 px-4 py-2 text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                   
                                    {/* Weather Data */}
                                    <tr className="bg-gray-900"><td colSpan="2" className="p-2 font-semibold text-cyan-400">Current Weather</td></tr>
                                    <tr className="bg-gray-800"><td className="border border-gray-600 px-4 py-2">🌡️ Temperature</td><td className="border border-gray-600 px-4 py-2 text-right">{isNumeric(temperature) ? `${temperature}°C` : <span className="text-red-400">{temperature}</span>}</td></tr>
                                    <tr className="bg-gray-900"><td className="border border-gray-600 px-4 py-2">💧 Humidity</td><td className="border border-gray-600 px-4 py-2 text-right">{isNumeric(humidity) ? `${humidity}%` : <span className="text-red-400">{humidity}</span>}</td></tr>
                                    <tr className="bg-gray-800"><td className="border border-gray-600 px-4 py-2">🌧️ Rainfall (Prec.)</td><td className="border border-gray-600 px-4 py-2 text-right">{isNumeric(rainfall) ? `${rainfall} mm` : <span className="text-red-400">{rainfall}</span>}</td></tr>
                                </tbody>
                            </table>
                            {/* Proceed Button */}
                             <button
                                 onClick={handleProceedAndPredict}
                                 className={`mt-4 px-6 py-3 text-white rounded-lg transition w-full ${(!canProceed || loadingPrediction) ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                 disabled={!canProceed || loadingPrediction}
                             >
                                 {loadingPrediction ? 'Getting Prediction...' : 'Proceed to Recommendation'}
                             </button>
                        </div>
                    )}
                    {/* Display general error messages */}
                    {error && !showErrorModal && <p className="mt-6 text-lg text-red-500">{error}</p>}
                </div>
            </div>

            {/* Footer */}
            <Footer />

            {/* Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-black max-w-sm w-11/12">
                        <h2 className="text-xl font-bold text-red-600 mb-4">Error!</h2>
                        <p className="text-gray-700 mb-6">{error || "An unexpected error occurred."}</p>
                        <button onClick={() => {setShowErrorModal(false); setError(null);}} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-full">Close</button>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                 <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-black max-w-sm w-11/12">
                        <h2 className="text-xl font-bold text-green-600 mb-4">Success</h2>
                        <p className="text-gray-700 mb-6">Weather Data fetched successfully! Please review the combined data below and click 'Proceed' to get crop recommendations.</p>
                        <button onClick={() => setShowSuccessModal(false)} className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full">OK</button>
                    </div>
                </div>
            )}
        </div>
    );
}