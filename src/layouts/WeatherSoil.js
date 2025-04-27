import React, { useState, useEffect } from 'react'; // Import useEffect
import { Link, useNavigate } from 'react-router-dom';
import Footer from "../components/Footer";
import LogoutButton from "../components/LogoutButton";

// --- Helper Components ---

// Simple Loading Spinner Component
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

// Validation Error Modal Component
const ValidationModal = ({ message, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg text-center w-full max-w-sm shadow-xl">
                <h3 className="text-lg font-semibold text-red-600 mb-4">Validation Error</h3>
                <p className="text-gray-800 mb-4">{message}</p>
                <button onClick={onClose} className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 w-full">Close</button>
            </div>
        </div>
    );
};


// --- Main Component ---

const WeatherSoil = () => {
    const navigate = useNavigate();

    // --- State Variables ---
    const [formData, setFormData] = useState({
        nitrogen: '', phosphorus: '', potassium: '', temperature: '', humidity: '', rainfall: '',
    });
    const [errors, setErrors] = useState({});
    const [recommendationData, setRecommendationData] = useState(null); // Holds successful server response
    const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
    const [recommendationError, setRecommendationError] = useState(null); // Server/fetch error
    const [validationModalMessage, setValidationModalMessage] = useState('');
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        const sanitizedValue = value.replace(/[^0-9.]/g, ''); // Allow only digits and dots
        setFormData((prevData) => ({ ...prevData, [name]: sanitizedValue, }));
        if (errors[name]) { setErrors((prevErrors) => ({ ...prevErrors, [name]: null, })); }
        if (recommendationError) { setRecommendationError(null); } // Clear server error on input change
    };

    const validateInput = () => {
        const newErrors = {};
        let isValid = true;
        const fieldOrder = ['nitrogen', 'phosphorus', 'potassium', 'temperature', 'humidity', 'rainfall'];

        fieldOrder.forEach((key) => {
            if (formData[key] === undefined) {
                newErrors[key] = 'Field definition missing.'; isValid = false; return;
            }
            const value = formData[key].trim();
            if (value === '') { newErrors[key] = 'This field is required.'; isValid = false; }
            else if (isNaN(value)) { newErrors[key] = 'Please enter a valid number.'; isValid = false; }
            else if (Number(value) < 0) { newErrors[key] = 'Value cannot be negative.'; isValid = false; }
        });

        setErrors(newErrors);
        return isValid;
    };

    // --- Server Interaction ---
    const getRecommendationFromServer = async () => {
        setIsRecommendationLoading(true);
        setRecommendationError(null);
        setRecommendationData(null); // Reset previous successful result

        const fieldOrder = ['nitrogen', 'phosphorus', 'potassium', 'temperature', 'humidity', 'rainfall'];
        const dataArray = fieldOrder.map(key => parseFloat(formData[key] || 0));
        const payload = { 'features': dataArray }; // Match backend expected structure
        const serverUrl = "http://192.168.43.35:5000/predict_top5"; // Ensure this is correct

        console.log("Sending data to server:", JSON.stringify(payload));

        try {
            const response = await fetch(serverUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorBody = null;
                try { errorBody = await response.json(); } catch (e) { /* Ignore */ }
                console.error("Server Error Response:", { status: response.status, body: errorBody });
                throw new Error(`Server error! Status: ${response.status} ${response.statusText}. ${errorBody ? JSON.stringify(errorBody) : ''}`);
            }

            const result = await response.json(); // This is the server response object
            console.log("Server Response (Prediction):", result);

            // ***** CORRECTED CHECK *****
            // Verify the structure you ACTUALLY expect from /predict_top5
            if (result && Array.isArray(result.top5_predictions)) {
                console.log("Server response format check PASSED.");
                // Store the *entire* successful server response object in state.
                // This state change will trigger the useEffect for navigation.
                setRecommendationData(result);
            } else {
                 // If the structure is wrong, throw an error to prevent navigation
                console.error("Server response format check FAILED. Expected '{ top5_predictions: [...] }', got:", result);
                throw new Error("Received invalid data format from server (expected 'top5_predictions' array).");
            }
            // ***** END CORRECTED CHECK *****

        } catch (error) {
            console.error("Error during server communication:", error);
            setRecommendationError(`Failed to get recommendation: ${error.message}`); // Show error to user
            setRecommendationData(null); // Ensure no navigation happens on error
        } finally {
            setIsRecommendationLoading(false); // Hide loading modal
        }
    };


    // --- Form Submission ---
    const handleSubmit = (e) => {
        e.preventDefault();
        setRecommendationError(null); // Clear previous server error
        if (validateInput()) {
            // Validation OK -> Call server function (DO NOT NAVIGATE YET)
            console.log('Form validated. Calling getRecommendationFromServer...');
            getRecommendationFromServer();
        } else {
            // Validation failed -> Show modal
            setValidationModalMessage('Please fill in all fields correctly with valid, non-negative numbers.');
            setIsValidationModalOpen(true);
        }
    };

    // --- Effect for Navigation ---
    // This useEffect hook correctly handles navigation AFTER the server response is processed.
    useEffect(() => {
        // Only navigate if:
        // 1. recommendationData has been set (meaning server call was successful AND response format was valid)
        // 2. Loading is finished
        if (recommendationData && !isRecommendationLoading) {
            console.log("Conditions met for navigation. Navigating to /MRecommend with state:", { serverData: recommendationData, formData: formData });
            // Navigate and pass the necessary state
            navigate('/MRecommend', { // Ensure this matches your route name
                state: {
                    serverData: recommendationData, // The successful response object from the server
                    formData: formData              // The original user inputs
                }
            });
            // Optional: Reset state if you want to prevent re-navigation on component re-render
            // setRecommendationData(null);
        }
    }, [recommendationData, isRecommendationLoading, navigate, formData]); // Dependencies for the effect

    // --- Other Handlers ---
    const closeValidationModal = () => setIsValidationModalOpen(false);
    const handleUserLogout = () => {
        console.log("User logged out");
        navigate("/");
    };

    // --- Render ---
    return (
        <div className="bg-gray-900 min-h-screen text-white flex flex-col">
            {/* Navigation */}
            <nav className="bg-gradient-to-b from-green-700 to-gray-200 fixed w-screen text-black p-4 shadow-lg z-10 h-20 flex items-center">
                 <div className="container mx-auto flex justify-between items-center">
                     <h1 className="text-2xl font-bold text-black">CropAdvisor</h1>
                     <ul className="flex space-x-6 items-center">
                         <li><Link to="/home" className="hover:underline text-black">Home</Link></li>
                         <li><a href="#contact" className="mr-5 hover:underline text-black">Contact</a></li>
                       
                     </ul>
                 </div>
             </nav>
             <li><LogoutButton onLogout={handleUserLogout} /></li>
            {/* Main Content */}
            <div className="flex-grow container mx-auto flex flex-col items-center justify-center pt-28 px-4 pb-10">
                <h2 className="text-3xl font-bold text-green-500 mb-4">Manual Data Entry</h2>
                <p className="mb-8 text-center text-gray-300 max-w-xl">Enter the measured weather and soil nutrient values below to get a crop recommendation.</p>

                <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-gray-800 p-8 rounded-lg shadow-xl">
                    <div className="flex flex-col md:flex-row gap-8 md:gap-16">
                        {/* Weather Section */}
                        <div className='w-full md:w-1/2 space-y-6'>
                            <h3 className="text-xl font-semibold text-amber-400 mb-4 text-center border-b border-gray-700 pb-2">Weather Details</h3>
                            {/* Rainfall Input */}
                             <div>
                                <label htmlFor="rainfall" className="block mb-1 text-sm font-medium text-gray-300">Rainfall (mm):</label>
                                <input id="rainfall" type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" name="rainfall" value={formData.rainfall} onChange={handleChange} className={`w-full p-2 bg-gray-700 text-white border ${errors.rainfall ? 'border-red-500' : 'border-gray-600'} rounded outline-none focus:ring-2 focus:ring-blue-500`} placeholder="e.g., 100.5" />
                                {errors.rainfall && <p className="text-red-500 text-xs mt-1">{errors.rainfall}</p>}
                            </div>
                            {/* Temperature Input */}
                             <div>
                                <label htmlFor="temperature" className="block mb-1 text-sm font-medium text-gray-300">Temperature (°C):</label>
                                <input id="temperature" type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" name="temperature" value={formData.temperature} onChange={handleChange} className={`w-full p-2 bg-gray-700 text-white border ${errors.temperature ? 'border-red-500' : 'border-gray-600'} rounded outline-none focus:ring-2 focus:ring-blue-500`} placeholder="e.g., 25.5" />
                                {errors.temperature && <p className="text-red-500 text-xs mt-1">{errors.temperature}</p>}
                            </div>
                            {/* Humidity Input */}
                             <div>
                                <label htmlFor="humidity" className="block mb-1 text-sm font-medium text-gray-300">Humidity (%):</label>
                                <input id="humidity" type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" name="humidity" value={formData.humidity} onChange={handleChange} className={`w-full p-2 bg-gray-700 text-white border ${errors.humidity ? 'border-red-500' : 'border-gray-600'} rounded outline-none focus:ring-2 focus:ring-blue-500`} placeholder="e.g., 70" />
                                {errors.humidity && <p className="text-red-500 text-xs mt-1">{errors.humidity}</p>}
                            </div>
                        </div>

                        {/* Soil Section */}
                        <div className="w-full md:w-1/2 space-y-6">
                            <h3 className="text-xl font-semibold text-amber-400 mb-4 text-center border-b border-gray-700 pb-2">Soil Nutrients</h3>
                            {/* Nitrogen Input */}
                             <div>
                                <label htmlFor="nitrogen" className="block mb-1 text-sm font-medium text-gray-300">Nitrogen (N - kg/ha):</label>
                                <input id="nitrogen" type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" name="nitrogen" value={formData.nitrogen} onChange={handleChange} className={`w-full p-2 bg-gray-700 text-white border ${errors.nitrogen ? 'border-red-500' : 'border-gray-600'} rounded outline-none focus:ring-2 focus:ring-blue-500`} placeholder="e.g., 90" />
                                {errors.nitrogen && <p className="text-red-500 text-xs mt-1">{errors.nitrogen}</p>}
                            </div>
                            {/* Phosphorus Input */}
                              <div>
                                <label htmlFor="phosphorus" className="block mb-1 text-sm font-medium text-gray-300">Phosphorus (P - kg/ha):</label>
                                <input id="phosphorus" type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" name="phosphorus" value={formData.phosphorus} onChange={handleChange} className={`w-full p-2 bg-gray-700 text-white border ${errors.phosphorus ? 'border-red-500' : 'border-gray-600'} rounded outline-none focus:ring-2 focus:ring-blue-500`} placeholder="e.g., 45" />
                                {errors.phosphorus && <p className="text-red-500 text-xs mt-1">{errors.phosphorus}</p>}
                            </div>
                            {/* Potassium Input */}
                             <div>
                                <label htmlFor="potassium" className="block mb-1 text-sm font-medium text-gray-300">Potassium (K - kg/ha):</label>
                                <input id="potassium" type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" name="potassium" value={formData.potassium} onChange={handleChange} className={`w-full p-2 bg-gray-700 text-white border ${errors.potassium ? 'border-red-500' : 'border-gray-600'} rounded outline-none focus:ring-2 focus:ring-blue-500`} placeholder="e.g., 40" />
                                {errors.potassium && <p className="text-red-500 text-xs mt-1">{errors.potassium}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button Area */}
                    <div className="flex flex-col items-center w-full mt-10">
                         {/* Display Server Error */}
                         {recommendationError && (<p className="text-red-500 text-sm mb-4 text-center">{recommendationError}</p>)}
                        <button type="submit" disabled={isRecommendationLoading} className="w-full max-w-xs p-3 rounded-lg text-white font-semibold bg-green-600 hover:bg-green-700 transition duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {isRecommendationLoading ? 'Getting Recommendation...' : 'Get Recommendation'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <Footer />

            {/* Modals */}
            <RecommendationLoadingModal show={isRecommendationLoading} />
            <ValidationModal message={validationModalMessage} isOpen={isValidationModalOpen} onClose={closeValidationModal} />
        </div>
    );
};

export default WeatherSoil;