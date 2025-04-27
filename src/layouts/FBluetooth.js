import React, { useState, useEffect, useRef } from "react"; // Import useEffect and useRef
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from "../components/Footer";       // Assuming component exists
import LogoutButton from "../components/LogoutButton"; // Assuming component exists
import { Link } from 'react-router-dom';
import GaugeChart from 'react-gauge-chart';

// --- Constants ---
// !!! WARNING: 1 second is DEFINITELY too fast for ThingSpeak's free rate limit !!!
// Recommend 18000 (18s) or higher. Using 1000ms as requested but expect errors.
const POLLING_INTERVAL_MS = 500; // Poll every 1 second

const FBluetooth = () => {
  const [sensorData, setSensorData] = useState({
    nitrogen: "",
    potassium: "",
    phosphorus: "",
    timestamp: ""
  });

  const location = useLocation();
  const navigate = useNavigate();

  const selectedCrop = location.state?.selectedCrop;

  // Original FBluetooth State
  const [isLoading, setIsLoading] = useState(false); // For initial fetch button
  const [isSendingToServer, setIsSendingToServer] = useState(false); // For recommendation server
  const [error, setError] = useState(null); // For ThingSpeak fetch errors
  const [serverError, setServerError] = useState(null); // For Recommendation server errors
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [dataFetched, setDataFetched] = useState(false); // Tracks initial ThingSpeak fetch

  // --- Additions for Polling and Stabilization ---
  const [isPollingActive, setIsPollingActive] = useState(false); // Is the polling loop running?
  const [isStabilized, setIsStabilized] = useState(false); // Has at least one poll succeeded?
  const intervalRef = useRef(null); // Stores the interval ID
  // --- End Additions ---


  // --- Gauge Constants & Styles (Keep as is) ---
  const NITROGEN_MAX = 200;
  const POTASSIUM_MAX = 400;
  const PHOSPHORUS_MAX = 100;
  const gaugeContainerStyle = { width: '90%', maxWidth: '250px', margin: '0 auto' };
  const commonGaugeProps = {
    nrOfLevels: 20, arcsLength: [0.3, 0.4, 0.3], colors: ['#EA4228', '#F5CD19', '#5BE12C'],
    arcWidth: 0.3, needleColor: "#AAAAAA", needleBaseColor: "#FFFFFF",
    textColor: "#FFFFFF", animate: true, animateDuration: 800, /* Faster animation */ hideText: false,
  };

  // --- API Configuration (Keep as is) ---
  // !!! Verify Field Mapping: N=field1, P=f2, K=f3 based on previous code !!!
  const THINGSPEAK_CHANNEL_ID = "2935549"; // Your Channel ID (Using ID from previous example)
  const THINGSPEAK_API_KEY = "7OSI7I9M19Z5C7G9";   // Your Read API Key (Using Key from previous example)
  const THINGSPEAK_BASE_URL = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_API_KEY}&results=1`;
  const BACKEND_RECOMMENDATION_URL = process.env.REACT_APP_FERTILIZER_URL || 'http://192.168.43.35:5000/fertilizer';

  // --- ADDITION: Fetch function used by initial click & polling ---
  // Returns true on success, false on failure
  const performFetchAndUpdateState = async (isInitial = false) => {
      // Add cache busting parameter
      const cacheBuster = `&_=${new Date().getTime()}`;
      const fetchUrl = THINGSPEAK_BASE_URL + cacheBuster;

      if (!isInitial) {
          // Limit console logs for fast polling
          // console.log("Polling ThingSpeak...", fetchUrl);
      } else {
          console.log("Fetching Initial Data...", fetchUrl);
      }

      try {
          const response = await fetch(fetchUrl, {
              method: 'GET',
              // Removed anti-cache headers as they caused CORS issues
          });

          if (!response.ok) {
              let errorDetails = `HTTP error! Status: ${response.status}`;
              if (response.status === 429) { // Check for rate limiting
                  errorDetails += " - Likely Rate Limit Exceeded!";
                  console.warn("ThingSpeak Rate Limit likely exceeded. Increase POLLING_INTERVAL_MS.");
              }
              try { const errorText = await response.text(); errorDetails += ` - ${errorText}`; } catch (e) {/* Ignore */}
              throw new Error(errorDetails);
          }

          const data = await response.json();
          // Limit logging
          // if (isInitial) console.log("ThingSpeak Response:", data);

          if (data.feeds && data.feeds.length > 0) {
              const latestData = data.feeds[0];

              // !!! VERIFY FIELD MAPPING !!!
              const formattedData = {
                  nitrogen: latestData.field1 || "0",
                  phosphorus: latestData.field2 || "0", // P = field2
                  potassium: latestData.field3 || "0", // K = field3
                  timestamp: latestData.created_at || new Date().toISOString(),
              };

              // Basic validation
              if (isNaN(parseFloat(formattedData.nitrogen)) || isNaN(parseFloat(formattedData.potassium)) || isNaN(parseFloat(formattedData.phosphorus))) {
                 console.warn("Received non-numeric or invalid data from ThingSpeak:", latestData);
              }

              // --- Update State ---
              setSensorData(formattedData); // Update the data
              setError(null);             // Clear any previous ThingSpeak fetch error on successful fetch
              // Keep serverError as is, it's related to the other button

              if (isInitial) {
                  setDataFetched(true);       // Mark that data has been loaded at least once
                  setShowSuccessModal(true); // Show success only for the first fetch
                  sendDataToServerForLogging(formattedData); // Optional: Send initial data for logging if needed
              } else {
                  // --- Stabilization logic ---
                  if (!isStabilized) {
                      console.log("First successful poll detected. Setting isStabilized to true.");
                      setIsStabilized(true); // Mark as stabilized after the first poll succeeds
                  }
                  // Optionally send poll data for logging
                  // sendDataToServerForLogging(formattedData);
              }
              return true; // Indicate success

          } else {
              console.warn("No data feeds found in ThingSpeak response.");
              if(isInitial) throw new Error("No data feeds found in ThingSpeak channel response.");
              // Don't treat empty feed during polling as error, just means no new data
              return false; // Indicate no *new* data found during poll
          }
      } catch (fetchError) {
          console.error(`Error during ${isInitial ? 'initial fetch' : 'polling'}:`, fetchError);
          setError(`Data Update Failed: ${fetchError.message}. Check console.`); // Set ThingSpeak fetch error
          setShowManualModal(true); // Show manual option on any fetch error
          setIsStabilized(false); // Not stable if fetch fails

          if (isInitial) {
              setDataFetched(false); // Mark initial fetch as failed
              setShowErrorModal(true); // Show error modal only for initial fetch
              setSensorData({ nitrogen: "", potassium: "", phosphorus: "", timestamp: "" }); // Clear data on initial fail
          }
          // Keep polling active to retry unless it's a fatal error? Maybe stop on 401/404?
          // For now, let's keep it trying.
          return false; // Indicate failure
      }
  };


  // --- Fetch Data Button Handler (Initiates fetch & polling) ---
  const fetchDataFromThingSpeak = async () => {
    // Stop previous polling first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log("Cleared previous polling interval.");
    }
    setIsPollingActive(false); // Reset polling state
    setIsStabilized(false);    // Reset stabilization state

    setIsLoading(true); // Show loading for the button click

    const success = await performFetchAndUpdateState(true); // Call the main fetch function for initial fetch

    if (success) {
        // --- ADDITION: Start polling loop after successful initial fetch ---
        setIsPollingActive(true); // This will trigger the useEffect to start the interval
        // --- End Addition ---
    } else {
        setIsPollingActive(false); // Make sure polling doesn't start if initial fetch failed
    }

    setIsLoading(false); // Hide loading indicator after attempt
  };

   // --- ADDITION: useEffect for managing polling interval ---
   useEffect(() => {
    // Clear previous interval if it exists (safety check)
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start interval ONLY if polling is active
    if (isPollingActive) {
      console.log(`Setting up polling interval (${POLLING_INTERVAL_MS}ms)...`);
      intervalRef.current = setInterval(() => {
        // Call fetch logic, marked as NOT initial
        performFetchAndUpdateState(false);
      }, POLLING_INTERVAL_MS);
    } else {
      console.log("Polling is inactive.");
    }

    // Cleanup function: Clears the interval
    return () => {
      if (intervalRef.current) {
        console.log("Clearing polling interval on cleanup/polling stop.");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // Rerun effect if isPollingActive changes
  }, [isPollingActive]);
  // --- End Addition ---


  // --- Send Data to Backend Server FOR LOGGING (Optional) ---
  // Renamed to avoid confusion with the recommendation request
  const sendDataToServerForLogging = async (dataToSend) => {
      // Implement if needed, perhaps send to a different URL
      console.log("Optional: Sending data for logging:", dataToSend);
  };

  // --- Send Data to Backend Server FOR RECOMMENDATION ---
  const sendDataToServer = async () => {
    if (!dataFetched) { /* ... error handling ... */ return null; }
    if (!selectedCrop || selectedCrop === "Unknown Crop") { /* ... error handling ... */ return null; }

    setIsSendingToServer(true);
    setServerError(null);

    const nitrogenValue = getGaugeValue(sensorData.nitrogen, NITROGEN_MAX);
    const phosphorusValue = getGaugeValue(sensorData.phosphorus, PHOSPHORUS_MAX); // P=f2
    const potassiumValue = getGaugeValue(sensorData.potassium, POTASSIUM_MAX);   // K=f3

    const dataArray = [nitrogenValue, phosphorusValue, potassiumValue];
    const payload = { 'features': dataArray, 'crop': selectedCrop };

    console.log("Sending data for recommendation:", BACKEND_RECOMMENDATION_URL, JSON.stringify(payload));

    try {
      const response = await fetch(BACKEND_RECOMMENDATION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const responseText = await response.text();
      if (!response.ok) throw new Error(`Server error! Status: ${response.status}. Response: ${responseText || '(empty response)'}`);
      console.log("Received recommendation response:", responseText);
      return responseText.trim(); // Return the raw text response
    } catch (error) {
      console.error("Error sending data for recommendation:", error);
      setServerError(error.message || "Error contacting recommendation server.");
      setShowErrorModal(true); // Show the generic error modal
      return null; // Indicate failure
    } finally {
      setIsSendingToServer(false);
    }
  };

  // --- Proceed Button Handler (Get Recommendation) ---
  const handlerec = async () => {
     // --- ADDITION: Stop polling when proceeding ---
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsPollingActive(false); setIsStabilized(false); // Stop polling and reset state
     // --- End Addition ---

    // Prevent action if not ready (stabilized means initial fetch was also ok)
    if (!isStabilized || isSendingToServer || isLoading) {
        console.log("Proceed action blocked: Data not stabilized or already processing.");
        return;
    }

    const serverResponse = await sendDataToServer(); // Call the recommendation server

    if (serverResponse !== null) {
      console.log("Recommendation received. Navigating...");
      navigate('/Fertilizer', {
          state: { recommendationTextResponse: serverResponse, sensorData: sensorData, selectedCrop: selectedCrop }
        });
    } else {
        console.log("Navigation cancelled due to recommendation server failure.");
    }
  };

  // --- Manual Entry Navigation Handler ---
  const handlemanual= () => {
    // --- ADDITION: Stop polling when navigating away ---
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsPollingActive(false); setIsStabilized(false);
    // --- End Addition ---
    console.log("Navigating to manual entry form.");
    navigate('/FertilizerForm',{ state: {selectedCrop} });
  };

  // --- Effect to Log Crop Selection ---
  useEffect(() => {
    if (!selectedCrop) { console.warn("FBluetooth mounted without selectedCrop."); }
    else { console.log("FBluetooth ready with crop:", selectedCrop); }
  }, [selectedCrop]);

  // --- Helper to Parse and Clamp Gauge Values ---
  const getGaugeValue = (valueStr, max) => {
    const num = parseFloat(valueStr);
    if (isNaN(num) || !isFinite(num)) return 0;
    return Math.max(0, Math.min(num, max));
  };

  // --- Calculate Gauge Values and Percentages ---
  const nitrogenValue = getGaugeValue(sensorData.nitrogen, NITROGEN_MAX);
  const phosphorusValue = getGaugeValue(sensorData.phosphorus, PHOSPHORUS_MAX); // P=f2
  const potassiumValue = getGaugeValue(sensorData.potassium, POTASSIUM_MAX);   // K=f3
  const nitrogenPercent = NITROGEN_MAX > 0 ? nitrogenValue / NITROGEN_MAX : 0;
  const potassiumPercent = POTASSIUM_MAX > 0 ? potassiumValue / POTASSIUM_MAX : 0;
  const phosphorusPercent = PHOSPHORUS_MAX > 0 ? phosphorusValue / PHOSPHORUS_MAX : 0;

  // --- JSX Rendering ---
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-green-700 w-screen fixed text-black p-4 shadow-lg bg-gradient-to-b h-24 from-green-700 to-gray-200 z-10">
        {/* ... Nav content ... */}
         <div className="container mx-auto flex justify-between items-center h-full px-4">
          <h1 className="text-2xl font-bold">CropAdvisor</h1>
          <ul className="flex space-x-6 items-center">
            <li><Link to="/home" className="hover:underline">Home</Link></li>
            <li><a href="#contact" className="mr-5 hover:underline">Contact</a></li>
           
          </ul>
        </div>
      </nav>
      <li><LogoutButton onLogout={() => navigate("/")} /></li>
      {/* Main Content Area */}
      <main className="flex-grow text-white flex flex-col items-center p-6 pt-28 w-full">
        <h2 className="text-3xl font-normal mt-11 mb-6 text-center">Fertilizer Recommendation </h2>
        <h1 className="text-3xl font-normal mb-6 text-center"> NPK Sensor Data</h1> {/* Corrected typo */}

        {/* Fetch Section */}
        <div className="w-full mb-8 max-w-lg bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-amber-400 mb-4 text-center">Fetch Live Sensor Data</h2>
           <p className="text-gray-300 text-center mb-6">
             Click below to fetch initial readings via ThingSpeak. Live updates will start automatically.
           </p>
           <div className="flex justify-center">
              {/* MODIFIED onClick, disabled, text */}
              <button
                onClick={fetchDataFromThingSpeak} // Uses the modified initiating function
                disabled={isLoading || isPollingActive} // Disable if initial loading OR polling active
                className={`px-8 py-3 text-white rounded-lg shadow-md transition-colors duration-150 ${
                  isLoading
                  ? 'bg-gray-500 cursor-not-allowed animate-pulse' // Loading
                  : isPollingActive
                      ? 'bg-gray-600 cursor-not-allowed' // Polling
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50' // Idle
                }`}
                 title={isPollingActive ? "Live updates running..." : "Fetch initial data"}
              >
                {isLoading ? 'Fetching...' : (isPollingActive ? "Live Updates Active" : 'Fetch Sensor Data')}
              </button>
           </div>
           {/* ADDITION: Polling Status Indicator */}
           {isPollingActive && !isLoading && (
              <p className="text-center text-sm text-cyan-400 mt-4">
                  Auto-updating every {POLLING_INTERVAL_MS / 1000}s...
              </p>
           )}
           {/* --- End Addition --- */}
        </div>

        {/* Loading Indicator for Initial Fetch */}
        {isLoading && ( /* ... loading spinner ... */ <div className="text-center my-4"> <p className="text-yellow-400 text-lg">Fetching data...</p> <div className="mt-2 inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status"> <span className="sr-only">Loading...</span></div></div> )}

        {/* Gauge and Table Display Section */}
        {/* Show if initial fetch successful */}
        {dataFetched && (
          <div className="w-full max-w-5xl bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg mt-6 mb-6">
            <h2 className="text-2xl font-semibold mb-8 text-center text-green-400">Live Sensor Readings</h2>
             <p className="text-center text-sm text-gray-400 mb-6 -mt-4">
                Last Reading Recorded: {sensorData.timestamp ? new Date(sensorData.timestamp).toLocaleString() : 'N/A'}
            </p>

            {/* Gauge Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-8 mb-10 items-start justify-items-center">
              {/* Gauges */}
              <div className="text-center w-full flex flex-col items-center px-2"> <h3 className="text-lg font-semibold mb-3">Nitrogen (N)</h3> <div style={gaugeContainerStyle}> <GaugeChart id="gauge-nitrogen-f" {...commonGaugeProps} percent={nitrogenPercent} formatTextValue={() => `${nitrogenValue.toFixed(1)} kg/ha`} /> </div> <p className="text-xs text-gray-400 mt-2">Range: 0 - {NITROGEN_MAX} kg/ha</p> </div>
              <div className="text-center w-full flex flex-col items-center px-2"> <h3 className="text-lg font-semibold mb-3">Phosphorus (P)</h3> <div style={gaugeContainerStyle}> <GaugeChart id="gauge-phosphorus-f" {...commonGaugeProps} percent={phosphorusPercent} formatTextValue={() => `${phosphorusValue.toFixed(1)} mg/kg`} /> </div> <p className="text-xs text-gray-400 mt-2">Range: 0 - {PHOSPHORUS_MAX} mg/kg</p> </div>
              <div className="text-center w-full flex flex-col items-center px-2"> <h3 className="text-lg font-semibold mb-3">Potassium (K)</h3> <div style={gaugeContainerStyle}> <GaugeChart id="gauge-potassium-f" {...commonGaugeProps} percent={potassiumPercent} formatTextValue={() => `${potassiumValue.toFixed(1)} mg/kg`} /> </div> <p className="text-xs text-gray-400 mt-2">Range: 0 - {POTASSIUM_MAX} mg/kg</p> </div>
            </div>

             {/* Data Summary Table */}
             <div className="mt-4 mb-8 overflow-x-auto">
                {/* ... table structure ... */}
                <h3 className="text-xl font-semibold mb-4 text-center text-gray-300">Data Summary</h3>
                <table className="w-full sm:w-auto border-collapse border border-gray-700 mx-auto max-w-md bg-gray-700 rounded">
                   <thead> <tr className="bg-gray-600"> <th className="border border-gray-500 p-2 text-left font-semibold">Nutrient</th> <th className="border border-gray-500 p-2 text-right font-semibold">Level</th> <th className="border border-gray-500 p-2 text-right font-semibold">Unit</th> </tr></thead>
                   <tbody>
                     <tr><td className="border border-gray-500 p-2">Nitrogen (N)</td><td className="border border-gray-500 p-2 text-right">{nitrogenValue.toFixed(1)}</td><td className="border border-gray-500 p-2 text-right">kg/ha</td></tr>
                     <tr><td className="border border-gray-500 p-2">Phosphorus (P)</td><td className="border border-gray-500 p-2 text-right">{phosphorusValue.toFixed(1)}</td><td className="border border-gray-500 p-2 text-right">mg/kg</td></tr>
                     <tr><td className="border border-gray-500 p-2">Potassium (K)</td><td className="border border-gray-500 p-2 text-right">{potassiumValue.toFixed(1)}</td><td className="border border-gray-500 p-2 text-right">mg/kg</td></tr>
                     <tr className="bg-gray-600"><td className="border border-gray-500 p-2 text-xs text-gray-400 text-center" colSpan="3"> Fetched for: <span className="font-semibold text-amber-400">{selectedCrop || 'N/A'}</span> at: {sensorData.timestamp ? new Date(sensorData.timestamp).toLocaleString() : 'N/A'}</td></tr>
                   </tbody>
                </table>
             </div>

             {/* Server Error Display (if recommendation request failed) */}
             {serverError && <p className="text-red-500 mt-4 mb-4 text-center font-semibold">{serverError}</p>}

             {/* --- MODIFIED: Proceed Button (Get Recommendation) Visibility --- */}
             {/* Show button ONLY if stabilized AND no current ThingSpeak error AND no recommendation server error */}
             {isStabilized && !error && !serverError && (
                 <div className="mt-6 text-center">
                     <p className="text-sm text-green-400 mb-3">Readings stabilized.</p>
                     <button
                         onClick={handlerec} // Calls the recommendation function
                         disabled={isSendingToServer} // Disable only while sending to recommendation server
                         className={`px-8 py-3 text-white rounded-lg font-semibold transition-colors duration-150 ${
                             isSendingToServer
                             ? "bg-gray-600 cursor-not-allowed animate-pulse" // Sending style
                             : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50" // Ready style
                         }`}
                     >
                     {isSendingToServer ? 'Processing...' : 'Get Fertilizer Recommendation'}
                     </button>
                 </div>
             )}
             {/* Indicate waiting for stabilization */}
             {dataFetched && isPollingActive && !isStabilized && !error && !serverError && (
                  <div className="mt-10 text-center">
                     <p className="text-sm text-yellow-400">Waiting for live update & stabilization...</p>
                  </div>
             )}
              {/* --- End Proceed Button Modification --- */}

          </div>
        )}

        {/* ThingSpeak Fetch Error Display Area */}
        {error && !isLoading && ( // Show ThingSpeak fetch errors
             <div className="w-full max-w-lg bg-red-900 border border-red-600 text-red-100 p-4 rounded-lg shadow-lg mt-6 mb-4 text-center">
                <h3 className="font-semibold text-lg mb-2">⚠ Error Fetching Live Data</h3>
                 <p className="text-sm">{error}</p>
             </div>
        )}

      </main>

      {/* Manual Entry Section - Shows ONLY if initial fetch fails */}
      {showManualModal && !dataFetched && (
        // ... Manual Entry JSX ...
         <div className="w-full items-center justify-center flex flex-col bg-gray-800 p-6 shadow-inner pb-10">
            <div className="w-full mb-6 max-w-lg bg-slate-200 p-6 rounded-lg shadow-lg mt-6">
             <h2 className="text-xl font-semibold text-red-700 mb-4 text-center">MANUAL DATA ENTRY OPTION</h2>
             <p className="text-pink-700 text-center mb-4">
               Automatic data fetch failed. Enter sensor data manually instead?
             </p>
           </div>
           <button
               onClick={handlemanual}
               className="w-auto px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors duration-150 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
           >
               Enter NPK Data Manually
           </button>
       </div>
      )}

      {/* Footer */}
      <div id="contact" className="w-full mt-auto">
          <Footer />
      </div>


      {/* --- Modals --- */}
      {/* Error Modal (Generic for Fetch or Server errors) */}
      {showErrorModal && ( /* ... Error Modal JSX as before ... */ <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4"><div className="bg-white p-6 rounded-lg shadow-xl text-black max-w-sm mx-4 text-center"><div className="text-red-500 mb-3"><svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><h2 className="text-lg font-bold text-red-600 mb-4">Error!</h2><p className="text-red-700">{serverError || error || "An unexpected error occurred."}</p>{error && error.includes("Failed to fetch") && <p className="text-sm text-gray-600 mt-2">Consider trying manual entry if the problem persists.</p>}<button onClick={() => { setShowErrorModal(false); if (serverError) setServerError(null); if (error) setError(null); }} className="mt-4 px-4 py-2 w-full bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-150">Close</button></div></div> )}
      {/* Success Modal (For successful INITIAL data fetch) */}
      {showSuccessModal && ( /* ... Success Modal JSX as before ... */ <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4"><div className="bg-white p-6 rounded-lg shadow-lg text-black max-w-sm mx-4 text-center"><div className="text-green-500 mb-3"><svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><h2 className="text-lg font-bold text-green-600 mb-4">Data Fetched Successfully!</h2><p>Starting live updates. View readings below. 'Get Recommendation' button will appear when ready.</p><button onClick={() => setShowSuccessModal(false)} className="mt-4 px-4 py-2 w-full bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-150">OK</button></div></div> )}

    </div>
  );
};

export default FBluetooth;