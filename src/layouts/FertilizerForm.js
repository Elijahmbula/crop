import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Footer from "../components/Footer"; // Assuming component exists
import LogoutButton from "../components/LogoutButton"; // Assuming component exists

// --- Helper Components ---
const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
);

const RecommendationLoadingModal = ({ show }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl text-black max-w-sm text-center">
                <h2 className="text-lg font-bold mb-4">Processing Data</h2>
                <LoadingSpinner />
                <p>Getting fertilizer recommendation...</p>
                <p className="text-sm text-gray-600 mt-2">Please wait a moment.</p>
            </div>
        </div>
    );
};

const ValidationModal = ({ message, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg text-center w-full max-w-sm shadow-xl">
                <h3 className="text-lg font-semibold text-red-600 mb-4">Validation Error</h3>
                <p className="text-gray-800 mb-4">{message}</p>
                <button
                    onClick={onClose}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 w-full"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

// --- Main Component ---
const FertilizerForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const selectedCrop = location.state?.selectedCrop;

    useEffect(() => {
        if (!selectedCrop) {
            console.warn("FertilizerForm: Selected crop data not found in location state.");
        } else {
            console.log("FertilizerForm mounted with crop:", selectedCrop);
        }
    }, [selectedCrop]);

    // --- State Variables ---
    const [formData, setFormData] = useState({
        nitrogen: '',
        phosphorus: '',
        potassium: '',
    });
    const [errors, setErrors] = useState({});

    // *** RENAMED STATE VARIABLE to hold the raw server response text ***
    const [recommendationTextResponse, setRecommendationTextResponse] = useState(null);

    const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
    const [serverError, setServerError] = useState(null); // Server communication errors

    const [validationModalMessage, setValidationModalMessage] = useState('');
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        const sanitizedValue = value.replace(/[^0-9.]/g, '');
        setFormData((prevData) => ({ ...prevData, [name]: sanitizedValue }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
        if (serverError) setServerError(null);
        // Clear previous server response if user changes input
        if (recommendationTextResponse) setRecommendationTextResponse(null); // Use renamed state setter
    };

    const validateInput = () => {
        const newErrors = {};
        let isValid = true;
        const fieldsToValidate = ['nitrogen', 'phosphorus', 'potassium'];

        fieldsToValidate.forEach((key) => {
            const value = formData[key]?.trim();
            if (value === '' || value === undefined) {
                newErrors[key] = 'This field is required.';
                isValid = false;
            } else if (isNaN(value)) {
                newErrors[key] = 'Please enter a valid number.';
                isValid = false;
            } else if (Number(value) < 0) {
                newErrors[key] = 'Value cannot be negative.';
                isValid = false;
            }
        });
        setErrors(newErrors);
        return isValid;
    };

    // --- Server Interaction Function ---
    // *** MODIFIED: Sets renamed state variable on success ***
    const getRecommendationFromServer = async () => {
        if (!selectedCrop) {
            console.error("Cannot get recommendation: Selected crop is missing.");
            setServerError("Crop information is missing. Please go back and select a crop.");
            return;
        }

        setIsRecommendationLoading(true);
        setServerError(null);
        setRecommendationTextResponse(null); // Clear previous response using renamed setter

        const fieldOrder = ['nitrogen', 'phosphorus', 'potassium'];
        const dataArray = fieldOrder.map(key => parseFloat(formData[key] || 0));

        const payload = {
            'features': dataArray,
            'crop': selectedCrop
        };
        const serverUrl = process.env.REACT_APP_FERTILIZER_URL || "http://192.168.43.35:5000/fertilizer";

        console.log("Sending data to fertilizer server:", serverUrl, JSON.stringify(payload));

        try {
            const response = await fetch(serverUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const responseText = await response.text();

            if (!response.ok) {
                console.error(`Server Error ${response.status}:`, responseText);
                throw new Error(`Server error! Status: ${response.status}. ${responseText || response.statusText}`);
            }

            console.log("Server responded successfully (2xx). Raw Response Text:", responseText);
            // *** Store the raw text response in the RENAMED state variable ***
            setRecommendationTextResponse(responseText.trim());

        } catch (error) {
            console.error("Error getting fertilizer recommendation from server:", error);
            setServerError(`Failed to get recommendation: ${error.message}`);
            setRecommendationTextResponse(null); // Ensure null on error using renamed setter
        } finally {
            setIsRecommendationLoading(false);
        }
    };

    // --- Form Submission Handler ---
    const handleSubmit = (e) => {
        e.preventDefault();
        setServerError(null);
        // Clear previous success response on new submission attempt using renamed setter
        setRecommendationTextResponse(null);

        if (validateInput()) {
            console.log('Form validated. Sending data for fertilizer recommendation...');
            getRecommendationFromServer(); // Call server function
        } else {
            console.log('Form validation failed.');
            setValidationModalMessage('Please fill in all fields correctly with valid, non-negative numbers.');
            setIsValidationModalOpen(true);
        }
    };

    // --- Effect Hook for Navigation ---
    // *** MODIFIED: Watches renamed state variable ***
    useEffect(() => {
        // Check if we have the response text AND loading is complete
        if (recommendationTextResponse && !isRecommendationLoading) { // Use renamed state variable
            console.log("Server response received and loading finished. Navigating to /Fertilizer...");

            navigate('/MFertilizer', {
                state: {
                    // Pass the raw server response text using the requested key name
                    // The key name and the variable holding the value now match
                    recommendationTextResponse: recommendationTextResponse,
                    selectedCrop: selectedCrop,
                    // formData: formData // Optional
                }
            });
        }
        // Dependencies: trigger when these values change
    }, [recommendationTextResponse, isRecommendationLoading, navigate, selectedCrop, formData]); // Updated dependency


    // --- Other Handlers ---
    const closeValidationModal = () => setIsValidationModalOpen(false);
    const handleUserLogout = () => { navigate("/"); };

    // --- Render (No visual changes needed for this refactor) ---
    return (
        <div className="bg-gray-900 min-h-screen text-white flex flex-col">
            {/* Navigation Bar */}
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
                <h2 className="text-3xl font-bold text-green-500 mb-4">Soil Nutrient Entry</h2>
                <p className="mb-8 text-center text-gray-300 max-w-xl">
                    Enter the measured soil nutrient values below to get a fertilizer recommendation for <strong className="text-amber-400">{selectedCrop || 'the selected crop'}</strong>.
                </p>

                {/* Form Container */}
                <form onSubmit={handleSubmit} className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-xl space-y-6">
                    <h3 className="text-xl font-semibold text-amber-400 mb-4 text-center border-b border-gray-700 pb-2">Soil Values</h3>

                    {/* Nitrogen Input Field */}
                    <div>
                        <label htmlFor="nitrogen" className="block mb-1 text-sm font-medium text-gray-300">Nitrogen (N - kg/ha):</label>
                        <input
                            id="nitrogen" type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" name="nitrogen"
                            value={formData.nitrogen} onChange={handleChange} placeholder="e.g., 90"
                            className={`w-full p-2 bg-gray-700 text-white border ${errors.nitrogen ? 'border-red-500' : 'border-gray-600'} rounded outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {errors.nitrogen && <p className="text-red-500 text-xs mt-1">{errors.nitrogen}</p>}
                    </div>

                    {/* Phosphorus Input Field */}
                    <div>
                        <label htmlFor="phosphorus" className="block mb-1 text-sm font-medium text-gray-300">Phosphorus (P - mg/kg):</label>
                        <input
                            id="phosphorus" type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" name="phosphorus"
                            value={formData.phosphorus} onChange={handleChange} placeholder="e.g., 45"
                            className={`w-full p-2 bg-gray-700 text-white border ${errors.phosphorus ? 'border-red-500' : 'border-gray-600'} rounded outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {errors.phosphorus && <p className="text-red-500 text-xs mt-1">{errors.phosphorus}</p>}
                    </div>

                    {/* Potassium Input Field */}
                    <div>
                        <label htmlFor="potassium" className="block mb-1 text-sm font-medium text-gray-300">Potassium (K - mg/kg):</label>
                        <input
                            id="potassium" type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" name="potassium"
                            value={formData.potassium} onChange={handleChange} placeholder="e.g., 40"
                            className={`w-full p-2 bg-gray-700 text-white border ${errors.potassium ? 'border-red-500' : 'border-gray-600'} rounded outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {errors.potassium && <p className="text-red-500 text-xs mt-1">{errors.potassium}</p>}
                    </div>


                    {/* Submit Button Area */}
                    <div className="flex flex-col items-center w-full pt-6">
                         {/* Display Server Communication Error */}
                         {serverError && (
                            <p className="text-red-500 text-sm mb-4 text-center">{serverError}</p>
                         )}
                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isRecommendationLoading} // Disable button during API call
                            className="w-full max-w-xs p-3 rounded-lg text-white font-semibold bg-green-600 hover:bg-green-700 transition duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {/* Change button text based on loading state */}
                            {isRecommendationLoading ? 'Getting Recommendation...' : 'Get Fertilizer Recommendation'}
                        </button>
                    </div>
                </form>
            </div> {/* End Main Content Flex Container */}

            {/* Footer */}
             <div id="contact" className="w-full mt-auto">
                <Footer />
            </div>


            {/* Modals */}
            <RecommendationLoadingModal show={isRecommendationLoading} />
            <ValidationModal message={validationModalMessage} isOpen={isValidationModalOpen} onClose={closeValidationModal} />
        </div> // End Root Div
    );
};

export default FertilizerForm;