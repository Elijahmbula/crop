import React, { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Footer from "../components/Footer";
import LogoutButton from "../components/LogoutButton";

/**
 * Fertilizer Component
 *
 * Displays fertilizer recommendations based on data received via route state.
 * Attempts to parse the response as JSON { fertilizer_recommendation: [...] }
 * or displays it as a plain message. Renders recommendations professionally.
 * Allows the user to download the displayed recommendations as a PDF.
 */
const Fertilizer = () => {
  // --- Hooks Initialization ---
  const location = useLocation();
  const navigate = useNavigate();
  const reportContentRef = useRef();

  // --- State Variables ---
  // Stores the processed list of recommendations [{ type: string, quantity: string }]
  const [recommendations, setRecommendations] = useState([]);
  // Stores any standalone string message or error message
  const [message, setMessage] = useState("");
  // Tracks if the component is loading/processing
  const [isLoading, setIsLoading] = useState(true);
  // Tracks PDF download status
  const [isDownloading, setIsDownloading] = useState(false);

  // --- Data Extraction from Route State ---
  // Safely destructure, defaulting to undefined if state is missing
  const { selectedCrop, recommendationTextResponse } = location.state || {};

  // --- Effect Hook for Processing Server Response ---
  useEffect(() => {
    setIsLoading(true);
    let processedRecs = [];
    let displayMessage = "";

    console.log("Raw server response received:", recommendationTextResponse); // Log raw response

    // --- Analyze the response ---
    if (typeof recommendationTextResponse === 'string' && recommendationTextResponse.trim() !== '') {
      try {
        // Attempt to parse the string as JSON
        const parsedData = JSON.parse(recommendationTextResponse);
        console.log("Successfully parsed response as JSON:", parsedData);

        // **** Check for the specific expected JSON structure ****
        if (parsedData && Array.isArray(parsedData.fertilizer_recommendation)) {
          const recArray = parsedData.fertilizer_recommendation;
          console.log(`Found 'fertilizer_recommendation' array with ${recArray.length} items.`);

          if (recArray.length > 0) {
            // Map the array items to the desired state structure
            processedRecs = recArray
              .map((item, index) => {
                // Validate each item has the required fields
                if (item && typeof item.fertilizer_type === 'string' && typeof item.quantity === 'string') {
                  return {
                    id: `rec-${index}`, // Add a unique key for rendering
                    type: item.fertilizer_type,
                    quantity: item.quantity,
                  };
                } else {
                  console.warn(`Skipping invalid item in fertilizer_recommendation array at index ${index}:`, item);
                  return null; // Filter out invalid items later
                }
              })
              .filter(rec => rec !== null); // Remove nulls from invalid items

            if (processedRecs.length > 0) {
               console.log("Processed recommendations:", processedRecs);
               displayMessage = ""; // Clear message if we have recommendations
            } else {
               console.log("fertilizer_recommendation array contained invalid/unusable items.");
               displayMessage = "Received recommendation data, but items were not in the expected format.";
            }

          } else {
            // The fertilizer_recommendation array was empty
            console.log("fertilizer_recommendation array is empty.");
            displayMessage = "No specific fertilizer recommendations were provided.";
            processedRecs = [];
          }
        } else {
          // Parsed successfully, but NOT the expected structure. Treat as a plain message.
          console.warn("Parsed JSON, but did not find 'fertilizer_recommendation' array structure. Treating as plain text.");
          displayMessage = recommendationTextResponse; // Show the original string
          processedRecs = [];
        }
      } catch (e) {
        // JSON.parse failed, means it was likely a plain string message
        console.log("Response is not valid JSON, treating as plain text message:", recommendationTextResponse);
        displayMessage = recommendationTextResponse; // Treat as a simple message
        processedRecs = [];
      }
    } else if (recommendationTextResponse === null || recommendationTextResponse === undefined || recommendationTextResponse === '') {
        // Handle null, undefined, or empty string explicitly
        console.log("Received null, undefined, or empty response.");
        displayMessage = "No recommendation data received from the server.";
        processedRecs = [];
    }
    else {
      // Handle cases where it's not a string (e.g., maybe already an object?) - less likely based on your flow
      console.error("Unexpected format for recommendationTextResponse (expected string):", recommendationTextResponse);
      displayMessage = "Could not understand the format of the fertilizer recommendations.";
      processedRecs = [];
    }

    // Update state
    setRecommendations(processedRecs);
    setMessage(displayMessage);
    setIsLoading(false);

  }, [recommendationTextResponse]); // Re-run if the response data changes

  // --- Navigation Handlers ---
  const handleExit = () => navigate('/FBluetooth');
  const handleViewHistory = () => navigate('/FHistory', { state: { currentRecommendation: recommendationTextResponse, selectedCrop } });
  const handleUserLogout = () => { /* Add logout logic */ navigate("/"); };

  // --- PDF Download Handler (No changes needed to logic) ---
  const handleDownloadPdf = () => {
    const contentToCapture = reportContentRef.current;
    if (!contentToCapture) {
        console.error("Content area ref not found for PDF.");
        alert("Error: Could not find content to download.");
        return;
    }
    // Prevent download if no recommendations or if already downloading
    if (recommendations.length === 0 || isLoading || isDownloading) {
        alert("No recommendations available to download or download already in progress.");
        return;
    }

    setIsDownloading(true);
    const options = { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' };

    html2canvas(contentToCapture, options)
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const contentWidth = pdfWidth - margin * 2;
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * contentWidth) / imgProps.width;
        let currentHeight = margin;

        if (imgHeight > pdfHeight - margin * 2) {
            console.warn("PDF content might exceed one page.");
        }
        pdf.addImage(imgData, 'PNG', margin, currentHeight, contentWidth, imgHeight);

        const fileName = `CropAdvisor-Fertilizer-${selectedCrop || 'Report'}-${new Date().toISOString().slice(0,10)}.pdf`;
        pdf.save(fileName);
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF.");
      })
      .finally(() => setIsDownloading(false));
  };


  // --- Render Helper Function for Recommendations ---
  // *** UPDATED TO DISPLAY TYPE AND QUANTITY ***
  const renderRecommendations = () => {
    if (isLoading) {
      return <p className="text-center text-gray-600 py-10">Loading recommendations...</p>;
    }

    // Display message if present (errors, plain text responses, no recommendations)
    if (message) {
      return (
        <div className="p-6 bg-yellow-100 rounded-lg text-center border border-yellow-300 shadow mb-6">
          <p className="text-yellow-800 text-lg font-medium">{message}</p>
        </div>
      );
    }

    // Display recommendations if available
    if (recommendations.length > 0) {
      return (
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4 text-center text-gray-800">Fertilizer Recommendations</h3>
          {/* Use a simpler card layout for 1 or more items */}
          <div className="space-y-6 max-w-2xl mx-auto">
            {recommendations.map((rec, index) => (
               // Card for each recommendation
              <div key={rec.id || index} className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-md text-left space-y-3">
                 {/* Optional Title */}
                 {recommendations.length > 1 && <h4 className="text-lg font-bold text-indigo-800 border-b border-indigo-200 pb-2 mb-3">{`Recommendation ${index + 1}`}</h4>}

                 {/* Fertilizer Type */}
                 <div className="bg-white/80 p-3 rounded shadow-sm border border-gray-200">
                     <p className="text-md font-semibold text-gray-700 mb-1">Fertilizer Type:</p>
                     <p className="text-md text-indigo-700 font-medium">{rec.type}</p>
                 </div>

                 {/* Quantity */}
                 <div className="bg-white/80 p-3 rounded shadow-sm border border-gray-200">
                     <p className="text-md font-semibold text-gray-700 mb-1">Quantity:</p>
                     <p className="text-md text-indigo-700 font-medium">{rec.quantity}</p>
                 </div>
              </div>
            ))}
          </div>
        </div>
      );
    }


    // Fallback Case: Should not be reached if logic is correct
    return <p className="text-center text-gray-600 py-10">No data available to display.</p>;
  };

  // --- Main Component JSX Return ---
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* Navigation Bar */}
      <nav className="bg-green-700 w-screen fixed text-black p-4 shadow-lg bg-gradient-to-b h-24 from-green-700 to-gray-200 z-10">
        <div className="container mx-auto flex justify-between items-center h-full px-4">
          <h1 className="text-2xl font-bold">CropAdvisor</h1>
          <ul className="flex space-x-6 items-center">
            <li><Link to="/home" className="hover:underline">Home</Link></li>
            <li><a href="#contact" className="hover:underline">Contact</a></li>
            <li><LogoutButton onLogout={() => navigate("/")} /></li> {/* Assuming LogoutButton handles its logic */}
          </ul>
        </div>
      </nav>
      
      {/* Main Content Area */}
      <main className="flex-grow container mt-20 mx-auto px-4 pt-28 pb-12">

            {/* --- Content Wrapper for PDF Capture --- */}
            <div ref={reportContentRef} className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-3xl mx-auto mb-8">
                {/* Report Header */}
                <header className="bg-gradient-to-r  from-green-600 to-teal-500 text-white text-center flex items-center justify-center p-5 text-2xl font-semibold rounded-lg shadow-lg mb-8 -mt-2 -mx-2 md:-mt-4 md:-mx-4">
                    {/* Icon (Optional) */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                   Smart Fertilizer Recommendation
                </header>

                {/* Render Recommendations or Message */}
                {renderRecommendations()}

                {/* Selected Crop Display */}
                {selectedCrop && (
                 <div className="mt-6 p-4 bg-lime-100 rounded-lg text-center border border-lime-300 shadow-sm">
                    <h4 className="text-lg font-semibold text-lime-800">Crop Selected</h4>
                    <p className="text-lime-700 text-xl font-medium mt-1">{selectedCrop}</p>
                 </div>
                )}
            </div>
            {/* --- End Content Wrapper --- */}


            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center items-center max-w-3xl mx-auto">
              <button
                onClick={handleExit}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow transition duration-150 ease-in-out w-full sm:w-auto font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
                Go Back
              </button>
              <button
                onClick={handleDownloadPdf}
                // Disable if loading, downloading, or no recommendations exist
                disabled={isLoading || isDownloading || recommendations.length === 0}
                className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow transition duration-150 ease-in-out w-full sm:w-auto font-medium ${isLoading || isDownloading || recommendations.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {isDownloading ? 'Downloading...' : 'Download PDF'}
              </button>
               <button
                onClick={handleViewHistory}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg shadow transition duration-150 ease-in-out w-full sm:w-auto font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                View History
              </button>
            </div>
      </main>

      {/* Footer */}
      <div id="contact" className="w-full mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default Fertilizer;