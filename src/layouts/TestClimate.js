import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Footer from "../components/Footer";
import LogoutButton from "../components/LogoutButton";
// Assuming Recommend component is not needed here for this logic
// import { Recommend } from "./Recommend";

// --- Helper Components ---

// Simple Loading Spinner Component (Can be customized)
const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
);

// Recommendation Loading Modal Component
const RecommendationLoadingModal = ({ show }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl text-black max-w-sm text-center">
        <h2 className="text-lg font-bold mb-4">Processing Data</h2>
        <LoadingSpinner />
        <p>Getting crop recommendation...</p>
        <p className="text-sm text-gray-600 mt-2">Please wait a moment.</p>
      </div>
    </div>
  );
};

// --- Main Component ---

export default function TestClimate() {
  const location = useLocation();
  const navigate = useNavigate();

  // --- State Variables ---

  // Data from previous screen
  const { sensorData } = location.state || {}; // NPK data { N, P, K }

  // Weather related state
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null); // Stores successful weather API response
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null); // Specific error for weather fetch

  // Server recommendation related state
  const [recommendationData, setRecommendationData] = useState(null); // Stores successful server response (e.g., predicted crop)
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false); // Loading state for server call
  const [recommendationError, setRecommendationError] = useState(null); // Specific error for recommendation fetch

  // UI Control State
  const [showWeatherSuccessModal, setShowWeatherSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false); // Generic error modal
  const [errorModalMessage, setErrorModalMessage] = useState(""); // Message for the generic error modal


  // --- Data Extraction (with safe defaults) ---
  // Extracted values are updated whenever sensorData or weather changes
  const nitrogen = sensorData?.N ?? "0"; // Default to "0" or appropriate numeric default
  const phosphorus = sensorData?.P ?? "0";
  const potassium = sensorData?.K ?? "0";
  const temperature = weather?.current?.temp_c ?? "0";
  const humidity = weather?.current?.humidity ?? "0";
  const rainfall = weather?.current?.precip_mm ?? "0";

  // --- Weather Fetch Logic ---
  const fetchWeather = async () => {
    if (!city) {
        setErrorModalMessage("Please enter a city name.");
        setShowErrorModal(true);
        return;
    };

    setIsWeatherLoading(true);
    setWeatherError(null);
    setWeather(null); // Reset previous weather data
    setRecommendationData(null); // Reset previous recommendation if city changes
    setShowWeatherSuccessModal(false);
    setShowErrorModal(false);


    try {
      // Replace with your actual WeatherAPI key
      const WEATHER_API_KEY = "c9bd72ec0fc04093a1982220252303";
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${city}`
      );
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data?.error?.message || `HTTP error! Status: ${response.status}`);
      }

      setWeather(data); // Store successful weather data
      setShowWeatherSuccessModal(true); // Show success modal for weather

    } catch (error) {
      console.error("Error fetching weather data:", error);
      setWeatherError(error.message); // Store weather-specific error
      setErrorModalMessage(`Failed to fetch weather data: ${error.message}`);
      setShowErrorModal(true); // Show generic error modal
      setWeather(null); // Clear weather data on error
    } finally {
      setIsWeatherLoading(false);
    }
  };

  // --- Server Interaction & Recommendation Fetch Logic ---
  const getRecommendation = async () => {
    // Ensure we have weather data before proceeding
    if (!weather || !sensorData) {
        setErrorModalMessage("Cannot proceed without valid NPK and Weather data.");
        setShowErrorModal(true);
        console.error("Missing weather or sensor data for recommendation.");
        return;
    }

    setIsRecommendationLoading(true); // Show loading modal via state
    setRecommendationError(null);     // Clear previous recommendation errors
    setRecommendationData(null);    // Reset previous recommendation
    setShowErrorModal(false);         // Hide any previous error modal


    // Prepare data payload
    const isNumeric = (value) => !isNaN(parseFloat(value)) && isFinite(value);

    // Convert extracted values to numbers, defaulting to 0 if not numeric
    const dataArray = [
        isNumeric(nitrogen) ? parseFloat(nitrogen) : 0,
        isNumeric(phosphorus) ? parseFloat(phosphorus) : 0,
        isNumeric(potassium) ? parseFloat(potassium) : 0,
        isNumeric(temperature) ? parseFloat(temperature) : 0, // Use fetched weather temp
        isNumeric(humidity) ? parseFloat(humidity) : 0,     // Use fetched weather humidity
        isNumeric(rainfall) ? parseFloat(rainfall) : 0,     // Use fetched weather rainfall
    ];

    // Adjust server URL as needed
    // const serverUrl = "http://192.168.137.62:5000/predict"; // Example local URL
     const serverUrl = "http://127.0.0.1:5000/predict"; // Example local URL flask backend
    const payload = { 'features': dataArray };

    console.log("Sending data to server for prediction:", JSON.stringify(payload));

    try {
        const response = await fetch(serverUrl, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            // Add any other required headers (e.g., Authorization)
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            let errorBody = null;
            try {
                errorBody = await response.json();
            } catch (e) { /* Ignore if body isn't JSON */ }
            console.error("Server Error Response:", errorBody);
            throw new Error(`Server error! Status: ${response.status} ${response.statusText}. ${errorBody ? JSON.stringify(errorBody) : ''}`);
        }

        const result = await response.json();
        console.log("Server Response (Prediction):", result);

        // ** Set the server response to state **
        // Adjust 'predicted_crop' based on your actual server response structure
        if (result && result.predicted_crop !== undefined) {
             setRecommendationData(result); // Store the entire response or just the prediction
        } else {
            throw new Error("Server response did not contain 'predicted_crop'.");
        }

    } catch (error) {
        console.error("Error getting recommendation from server:", error);
        setRecommendationError(error.message); // Store recommendation-specific error
        setErrorModalMessage(`Failed to get crop recommendation: ${error.message}`);
        setShowErrorModal(true); // Show generic error modal
        setRecommendationData(null); // Clear recommendation data on error
    } finally {
        // ** Hide the loading modal AFTER processing response or error **
        setIsRecommendationLoading(false);
    }
  };


  // --- Effect for Navigation ---
  // This useEffect triggers navigation *after* recommendationData state is updated
  // AND the recommendation loading process is finished (modal is hidden implicitly).
  useEffect(() => {
    // Check if we have recommendationData and loading is complete
    if (recommendationData && !isRecommendationLoading) {
      console.log("Navigating to /Recommend with data:", { recommendationData, weather, sensorData });
      navigate('/Recommend', { state: { serverData: recommendationData, weather, sensorData } });
      // Optional: Reset recommendationData here if you want to prevent immediate
      // re-navigation if the component re-renders for other reasons.
      // setRecommendationData(null);
    }
  }, [recommendationData, isRecommendationLoading, navigate, weather, sensorData]); // Dependencies


  // --- Other Handlers ---
  const handleUserLogout = () => {
    console.log("User logged out");
    // Add actual logout logic (clear tokens, context, etc.)
    navigate("/");
  };

  // --- Render ---
  return (
    <div className="min-h-screen flex flex-col bg-gray-900"> {/* Apply base bg here */}
        {/* Navigation Bar */}
        <nav className="bg-gradient-to-b from-green-700 to-gray-200 fixed w-screen text-black p-4 shadow-lg z-10 h-20 flex items-center">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold text-black">CropAdvisor</h1>
                <ul className="flex space-x-6 items-center">
                    <li><Link to="/home" className="hover:underline text-black">Home</Link></li>
                    <li><a href="#contact" className="hover:underline text-black">Contact</a></li> {/* Assuming Footer has #contact */}
                    <li><LogoutButton onLogout={handleUserLogout} /></li>
                </ul>
            </div>
        </nav>

        {/* Main Content Area */}
        <div className="flex-grow container mb-52 mx-auto flex flex-col items-center pt-28 px-4"> {/* Added padding top for nav, padding x */}

            {/* Weather Data Importance Info Box */}
            <div className="bg-gray-800 p-4 text-center text-white mb-8 shadow-xl rounded-lg w-full max-w-2xl">
                <p className="text-sm">
                    Weather data for your chosen city will be combined with your NPK sensor data to recommend a suitable crop.
                </p>
            </div>

            {/* Weather Search Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md mb-10">
                <h2 className="text-2xl font-bold mb-4 text-white text-center">Check Weather</h2>
                <div className="flex">
                    <input
                        type="text"
                        placeholder="Enter city name..."
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-l-lg outline-none text-white placeholder-gray-400"
                         onKeyPress={(event) => { // Allow Enter key submission
                             if (event.key === 'Enter') {
                                 fetchWeather();
                             }
                         }}
                    />
                    <button
                        onClick={fetchWeather}
                        disabled={isWeatherLoading || isRecommendationLoading} // Disable during either loading state
                        className={`bg-blue-600 p-3 rounded-r-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition text-white`}
                    >
                        {isWeatherLoading ? (
                            <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                        ) : (
                            <FaSearch size={20} />
                        )}
                    </button>
                </div>
                 {weatherError && <p className="mt-4 text-sm text-red-400 text-center">{weatherError}</p>}
            </div>


            {/* Display Weather Data & Proceed Button */}
            {/* Show this section only if weather data is successfully fetched AND no recommendation is currently loading */}
            {weather && !weatherError && !isRecommendationLoading && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center w-full max-w-md text-white">
                    <h3 className="text-xl font-semibold">{weather.location.name}, {weather.location.country}</h3>
                    <img src={weather.current.condition.icon} alt={weather.current.condition.text} className="mx-auto my-2"/>
                    <p className="text-lg mb-4">{weather.current.condition.text}</p>

                    {/* Weather Data Table */}
                    <table className="table-auto border-collapse w-full text-white mb-6">
                        {/* ... table headers ... */}
                        <thead>
                            <tr className="bg-gray-700">
                                <th className="border border-gray-600 px-4 py-2">Parameter</th>
                                <th className="border border-gray-600 px-4 py-2">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-gray-800 hover:bg-gray-700">
                                <td className="border border-gray-600 px-4 py-2">🌡️ Temperature</td>
                                <td className="border border-gray-600 px-4 py-2">{temperature}°C</td>
                            </tr>
                            <tr className="bg-gray-900 hover:bg-gray-700">
                                <td className="border border-gray-600 px-4 py-2">💧 Humidity</td>
                                <td className="border border-gray-600 px-4 py-2">{humidity}%</td>
                            </tr>
                            <tr className="bg-gray-800 hover:bg-gray-700">
                                <td className="border border-gray-600 px-4 py-2">🌧️ Rainfall (Precipitation)</td>
                                <td className="border border-gray-600 px-4 py-2">{rainfall} mm</td>
                            </tr>
                            {/* Add more relevant weather details if needed */}
                        </tbody>
                    </table>

                    {/* Button to trigger recommendation fetch */}
                    <button
                        onClick={getRecommendation} // Call the function to fetch recommendation
                        disabled={isRecommendationLoading} // Disable only when recommendation is loading
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-500 disabled:cursor-not-allowed w-full"
                    >
                        Get Crop Recommendation
                    </button>
                     {recommendationError && <p className="mt-4 text-sm text-red-400">{recommendationError}</p>}
                </div>
            )}
        </div> {/* End Main Content Area */}

        {/* Footer */}
        <Footer />

        {/* --- Modals --- */}

        {/* Recommendation Loading Modal */}
        <RecommendationLoadingModal show={isRecommendationLoading} />

        {/* Generic Error Modal */}
        {showErrorModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40">
                <div className="bg-white p-6 rounded-lg shadow-lg text-black max-w-sm">
                    <h2 className="text-lg text-red-600 font-bold mb-4">Error!</h2>
                    <p className="text-gray-800">{errorModalMessage || "An unexpected error occurred."}</p>
                    <button
                    onClick={() => {
                        setShowErrorModal(false);
                        setErrorModalMessage(""); // Clear message on close
                        // Optionally clear specific errors too if needed
                        // setWeatherError(null);
                        // setRecommendationError(null);
                    }}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-full"
                    >
                    Close
                    </button>
                </div>
            </div>
        )}

        {/* Weather Fetch Success Modal */}
        {showWeatherSuccessModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40">
            <div className="bg-white p-6 rounded-lg shadow-lg text-black max-w-sm">
                <h2 className="text-lg font-bold mb-4 text-green-600">Success</h2>
                <p>Weather data for {city} fetched successfully!</p>
                <p className="text-sm text-gray-600 mt-2">You can now proceed to get the crop recommendation.</p>
                <button
                onClick={() => setShowWeatherSuccessModal(false)}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 w-full"
                >
                OK
                </button>
            </div>
            </div>
        )}
    </div> // End Root Div
  );
}