import React, { useState, useEffect, useRef } from "react"; // Import useEffect and useRef
import { useNavigate } from 'react-router-dom';
import Footer from "../components/Footer";
import LogoutButton from "../components/LogoutButton";
import { Link } from 'react-router-dom';
import GaugeChart from 'react-gauge-chart'; // Import the gauge chart component

// --- Constants ---
// !!! WARNING: 2 seconds is likely too fast for ThingSpeak's free rate limit !!!
const POLLING_INTERVAL_MS = 500; // Poll every 2 seconds

const Bluetooth = () => {
  const [sensorData, setSensorData] = useState({
    nitrogen: "",
    potassium: "",
    phosphorus: "",
    timestamp: "", // Added timestamp to initial state
  });

  // Original State
  const [isLoading, setIsLoading] = useState(false); // For the initial button click
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [dataFetched, setDataFetched] = useState(false); // Tracks if initial fetch was successful

  // --- Additions for Polling and Stabilization ---
  const [isPollingActive, setIsPollingActive] = useState(false); // Controls if the loop is running
  const [isStabilized, setIsStabilized] = useState(false); // Controls Proceed button visibility
  const intervalRef = useRef(null); // Stores the interval ID
  // --- End Additions ---


  // --- Define gauge constants & styles (Keep as is) ---
  const NITROGEN_MAX = 200;
  const POTASSIUM_MAX = 400;
  const PHOSPHORUS_MAX = 100;
  const gaugeContainerStyle = { width: '90%', maxWidth: '250px', margin: '0 auto' };
  const commonGaugeProps = {
    nrOfLevels: 20, arcsLength: [0.3, 0.4, 0.3], colors: ['#EA4228', '#F5CD19', '#5BE12C'],
    arcWidth: 0.3, needleColor: "#AAAAAA", needleBaseColor: "#FFFFFF", textColor: "#FFFFFF",
    animate: true, animDelay: 50, animateDuration: 1000, /* Faster animation */ hideText: false,
  };
  // --- End Gauge Config ---


  // --- Server endpoint (Keep as is) ---
  const SERVER_URL = process.env.REACT_APP_SERVER_URL || "https://your-server.com/api/npk-data";

  // --- ThingSpeak Configuration (Keep as is) ---
  // !!! Verify Field Mapping: N=field1, P=field2, K=field3 based on your code !!!
  const THINGSPEAK_CHANNEL_ID = "2935549";
  const THINGSPEAK_API_KEY = "7OSI7I9M19Z5C7G9";
  const THINGSPEAK_BASE_URL = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_API_KEY}&results=1`;


  // --- fetch function to be used by initial click and polling loop ---
  const performFetch = async (isInitial = false) => {
      // Add cache busting parameter for fresh data
      const cacheBuster = `&_=${new Date().getTime()}`;
      const fetchUrl = THINGSPEAK_BASE_URL + cacheBuster;

      if (!isInitial) {
          // Limit logging during fast polling to avoid flooding console
          // console.log("Polling ThingSpeak...", fetchUrl);
      } else {
          console.log("Fetching Initial Data...", fetchUrl);
      }

      try {
          const response = await fetch(fetchUrl, {
              method: 'GET',
              headers: { // Anti-cache headers removed to fix CORS issue
                  // 'Cache-Control': 'no-cache, no-store, must-revalidate',
                  // 'Pragma': 'no-cache',
                  // 'Expires': '0'
              }
          });


          if (!response.ok) {
              let errorDetails = `HTTP error! Status: ${response.status}`;
              // Add check for rate limiting error specifically
              if (response.status === 429) {
                  errorDetails += " - Likely Rate Limit Exceeded!";
                  console.warn("ThingSpeak Rate Limit likely exceeded. Consider increasing POLLING_INTERVAL_MS.");
              }
              try { const errorText = await response.text(); errorDetails += ` - ${errorText}`; } catch (e) {/* Ignore */}
              throw new Error(errorDetails);
          }

          const data = await response.json();
          // Limit logging during fast polling
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

              // Update state with the new data
              setSensorData(formattedData);
              setError(null); // Clear any previous error on successful fetch

              if (isInitial) {
                setDataFetched(true); // Mark initial fetch complete
                setShowSuccessModal(true); // Show success only for the first fetch
                sendDataToServer(formattedData); // Send initial data
              } else {
                // --- Stabilization logic ---
                if (!isStabilized) {
                    console.log("First successful poll detected. Setting isStabilized to true.");
                    setIsStabilized(true); // Mark as stabilized after the first poll succeeds
                }
              }
              return true; // Indicate success

          } else {
              // console.warn("No data feeds found in ThingSpeak response.");
              if(isInitial) throw new Error("No data feeds found in ThingSpeak channel response.");
              // Don't treat empty feed during polling as error, just means no new data
              return false; // Indicate no *new* data found during poll
          }
      } catch (error) {
          console.error(`Error during ${isInitial ? 'initial fetch' : 'polling'}:`, error);
          // Don't flood error state during fast polling if it's recoverable (like rate limit)
          if (isInitial || !error.message.includes("Rate Limit")) {
              setError(`Data Update Failed: ${error.message}. Check console.`);
              setShowManualModal(true);
              setIsStabilized(false); // Not stable if fetch fails
          }
          if (isInitial) {
              setDataFetched(false);
              setShowErrorModal(true);
              setSensorData({ nitrogen: "", potassium: "", phosphorus: "", timestamp: "" }); // Clear data on initial fail
          }
          return false; // Indicate failure
      }
  };


  // --- Original function NAME kept, but MODIFIED behavior for initial fetch ---
  const fetchDataFromThingSpeak = async () => {
      // --- ADDITION: Stop previous polling before starting ---
      if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          console.log("Cleared previous polling interval.");
      }
      setIsPollingActive(false); // Ensure polling state is reset
      setIsStabilized(false);    // Reset stabilization state
      // --- End Addition ---

      setIsLoading(true); // Show loading for the button click

      const success = await performFetch(true); // Call the actual fetch logic, marking as initial

      if (success) {
          // --- ADDITION: Start polling loop after successful initial fetch ---
          setIsPollingActive(true); // This will trigger the useEffect
          // --- End Addition ---
      } else {
          setIsPollingActive(false); // Make sure polling doesn't start if initial fetch failed
      }

      setIsLoading(false); // Hide loading indicator after attempt
  };


  // --- ADDITION: useEffect to handle the polling loop ---
  useEffect(() => {
    // Clear previous interval if it exists (safety check)
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start the interval ONLY if polling is active
    if (isPollingActive) {
      console.log(`Starting polling loop (Interval: ${POLLING_INTERVAL_MS}ms)...`);
      intervalRef.current = setInterval(() => {
        performFetch(false); // Call fetch logic, marked as NOT initial
      }, POLLING_INTERVAL_MS);
    } else {
      console.log("Polling is inactive.");
    }

    // Cleanup function: Clears the interval when the component unmounts
    // or when isPollingActive becomes false (which happens on initial fetch button click again)
    return () => {
      if (intervalRef.current) {
        console.log("Clearing polling interval on cleanup/polling stop.");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // This effect should ONLY re-run when isPollingActive changes
  }, [isPollingActive]);
  // --- End Addition ---


  // --- Send data to server (Keep as is) ---
  const sendDataToServer = async (sensorDataToSend) => { /* ... function body ... */ };

  // --- Navigation handlers (Added cleanup) ---
  const navigate = useNavigate();
  const handlerec = () => {
    // --- ADDITION: Stop polling when navigating away ---
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsPollingActive(false); setIsStabilized(false);
    // --- End Addition ---
    if (dataFetched) { // Navigate if initial fetch was ok & proceed clicked
      navigate('/Climate', { state: { sensorData } });
    }
  };
  const handlemanual = () => {
     // --- ADDITION: Stop polling when navigating away ---
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsPollingActive(false); setIsStabilized(false);
     // --- End Addition ---
    navigate('/WeatherSoil');
  };

  // --- Gauge value calculations (Keep as is) ---
  const getGaugeValue = (valueStr, max) => {
      const num = parseFloat(valueStr);
      if (isNaN(num) || !isFinite(num)) return 0;
      return Math.max(0, Math.min(num, max));
   };
  const nitrogenValue = getGaugeValue(sensorData.nitrogen, NITROGEN_MAX);
  const phosphorusValue = getGaugeValue(sensorData.phosphorus, PHOSPHORUS_MAX); // P=f2
  const potassiumValue = getGaugeValue(sensorData.potassium, POTASSIUM_MAX);   // K=f3
  const nitrogenPercent = NITROGEN_MAX > 0 ? nitrogenValue / NITROGEN_MAX : 0;
  const phosphorusPercent = PHOSPHORUS_MAX > 0 ? phosphorusValue / PHOSPHORUS_MAX : 0;
  const potassiumPercent = POTASSIUM_MAX > 0 ? potassiumValue / POTASSIUM_MAX : 0;

  // --- Component Rendering ---
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Navigation Bar (Keep as is) */}
      <nav className="bg-green-700 w-screen fixed text-black p-4 shadow-lg bg-gradient-to-b h-24 from-green-700 to-gray-200 z-10">
        <div className="container mx-auto flex justify-between items-center h-full px-4">
          <h1 className="text-2xl font-bold">CropAdvisor</h1>
          <ul className="flex space-x-6 items-center">
            <li><Link to="/home" className="hover:underline">Home</Link></li>
            <li><a href="#contact" className="hover:underline">Contact</a></li>
           
          </ul>
        </div>
      </nav>

      //<LogoutButton onLogout={() => navigate("/")} />

      {/* Main Content */}
      <main className="flex-grow text-white flex flex-col items-center p-6 pt-28 w-full">
        <h1 className="text-3xl font-normal mt-11 mb-6 text-center">NPK Sensor Data Interface</h1>

        {/* Instructions and Fetch Button Box (Keep as is) */}
        <div className="w-full mb-8 max-w-lg bg-gray-800 p-6 rounded-lg shadow-lg">
          {/* MODIFIED Text */}
          <h2 className="text-xl font-semibold text-amber-400 mb-4 text-center">Live Sensor Data Fetching</h2>
          <p className="text-gray-300 text-center mb-6">
            Click the button to fetch initial NPK readings. Gauges will then auto-update with live data. The 'Proceed' button appears once readings stabilize after the first update.
          </p>
          <div className="flex justify-center">
            {/* Button calls original fetch function name */}
            <button
              onClick={fetchDataFromThingSpeak} // Calls the initiating function
              disabled={isLoading || isPollingActive} // Disable if loading OR if polling is already active
              className={`px-8 py-3 rounded-lg text-white font-semibold transition duration-300 ease-in-out ${
                isLoading
                  ? "bg-gray-500 cursor-not-allowed animate-pulse" // Loading style
                  : isPollingActive
                    ? "bg-gray-600 cursor-not-allowed" // Polling active style
                    : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" // Default style
              }`}
              title={isPollingActive ? "Live updates running..." : "Fetch initial data"}
            >
              {isLoading ? "Fetching..." : (isPollingActive ? "Live Updates Active" : "Fetch Sensor Data")}
            </button>
          </div>
           {/* ADDITION: Polling Status Indicator */}
           {isPollingActive && !isLoading && (
              <p className="text-center text-sm text-cyan-400 mt-4">
                  {/* MODIFIED TEXT */}
                  Auto-updating every {POLLING_INTERVAL_MS / 1000}s... (Warning: High Frequency)
              </p>
          )}
          {/* --- End Addition --- */}
        </div>

        {/* Loading Indicator (Only for initial fetch click) */}
        {isLoading && ( <div className="text-center my-4"> {/* ... Loading spinner ... */} <p className="text-yellow-400 text-lg">Fetching initial data...</p> <div className="mt-2 inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" role="status"> <span className="sr-only">Loading...</span></div> </div> )}

        {/* Display Gauges & Table SECTION */}
        {/* Show section if initial fetch was successful (dataFetched is true) */}
        {dataFetched && (
          <div className="w-full max-w-5xl bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg mt-6 mb-6">
            <h2 className="text-2xl font-semibold mb-8 text-center text-green-400">Live Sensor Readings</h2>
            <p className="text-center text-sm text-gray-400 mb-6 -mt-4">
                Last Reading Recorded: {sensorData.timestamp ? new Date(sensorData.timestamp).toLocaleString() : 'N/A'}
            </p>
            {/* Gauge Grid (Keep as is) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-8 mb-8 items-start justify-items-center">
              {/* Gauges */}
              <div className="text-center w-full flex flex-col items-center px-2"> <h3 className="text-lg font-semibold mb-3">Nitrogen (N)</h3> <div style={gaugeContainerStyle}> <GaugeChart id="gauge-nitrogen" {...commonGaugeProps} percent={nitrogenPercent} formatTextValue={() => `${nitrogenValue.toFixed(1)} kg/ha`} /> </div> <p className="text-xs text-gray-400 mt-2">Range: 0 - {NITROGEN_MAX} kg/ha</p> </div>
              <div className="text-center w-full flex flex-col items-center px-2"> <h3 className="text-lg font-semibold mb-3">Phosphorus (P)</h3> <div style={gaugeContainerStyle}> <GaugeChart id="gauge-phosphorus" {...commonGaugeProps} percent={phosphorusPercent} formatTextValue={() => `${phosphorusValue.toFixed(1)} mg/kg`} /> </div> <p className="text-xs text-gray-400 mt-2">Range: 0 - {PHOSPHORUS_MAX} mg/kg</p> </div>
              <div className="text-center w-full flex flex-col items-center px-2"> <h3 className="text-lg font-semibold mb-3">Potassium (K)</h3> <div style={gaugeContainerStyle}> <GaugeChart id="gauge-potassium" {...commonGaugeProps} percent={potassiumPercent} formatTextValue={() => `${potassiumValue.toFixed(1)} mg/kg`} /> </div> <p className="text-xs text-gray-400 mt-2">Range: 0 - {POTASSIUM_MAX} mg/kg</p> </div>
            </div>
            {/* Data Summary Table (Keep as is) */}
            <div className="mt-8 overflow-x-auto"> {/* ... Table structure ... */}
               <h3 className="text-xl font-semibold mb-4 text-center text-gray-300">Data Summary</h3>
                <table className="w-full sm:w-auto border-collapse border border-gray-700 mx-auto max-w-md bg-gray-700 rounded">
                   <thead> <tr className="bg-gray-600"> <th className="border border-gray-500 p-2 text-left font-semibold">Nutrient</th> <th className="border border-gray-500 p-2 text-right font-semibold">Level</th> <th className="border border-gray-500 p-2 text-right font-semibold">Unit</th> </tr></thead>
                   <tbody>
                     <tr><td className="border border-gray-500 p-2">Nitrogen (N)</td><td className="border border-gray-500 p-2 text-right">{nitrogenValue.toFixed(1)}</td><td className="border border-gray-500 p-2 text-right">kg/ha</td></tr>
                     <tr><td className="border border-gray-500 p-2">Phosphorus (P)</td><td className="border border-gray-500 p-2 text-right">{phosphorusValue.toFixed(1)}</td><td className="border border-gray-500 p-2 text-right">mg/kg</td></tr>
                     <tr><td className="border border-gray-500 p-2">Potassium (K)</td><td className="border border-gray-500 p-2 text-right">{potassiumValue.toFixed(1)}</td><td className="border border-gray-500 p-2 text-right">mg/kg</td></tr>
                     <tr className="bg-gray-600"><td className="border border-gray-500 p-2 text-xs text-gray-400" colSpan="3">Recorded At: {sensorData.timestamp ? new Date(sensorData.timestamp).toLocaleString() : 'N/A'}</td></tr>
                   </tbody>
                </table>
            </div>

            {/* --- MODIFIED: Proceed Button Visibility --- */}
            {/* Show button ONLY if stabilized AND no current error */}
            {isStabilized && !error && (
                <div className="mt-10 text-center">
                    <p className="text-sm text-green-400 mb-3">Readings stabilized.</p>
                    <button onClick={handlerec} className={`px-8 py-3 text-white rounded-lg font-semibold transition duration-300 ease-in-out bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50`} >
                        Proceed with this Data
                    </button>
                </div>
            )}
            {/* Indicate waiting for stabilization */}
            {dataFetched && isPollingActive && !isStabilized && !error && (
                 <div className="mt-10 text-center">
                     {/* MODIFIED TEXT */}
                    <p className="text-sm text-yellow-400">Waiting for live update (every {POLLING_INTERVAL_MS / 1000}s) & stabilization...</p>
                 </div>
            )}
             {/* --- End Proceed Button Modification --- */}

          </div>
        )}

        {/* Error Message Display */}
        {/* Only show error when not initial loading */}
        {!isLoading && error && ( /* ... Error display JSX ... */ <div className="w-full max-w-lg bg-red-900 border border-red-600 text-red-100 p-4 rounded-lg shadow-lg mt-6 mb-4 text-center"><h3 className="font-semibold text-lg mb-2">⚠ Data Fetch Error</h3><p className="text-sm">{error}</p></div> )}

        {/* Manual Entry Section (Keep as is) */}
        {showManualModal && !isLoading && ( /* ... Manual entry JSX ... */ <div className="w-full max-w-lg bg-gray-800 p-6 rounded-lg shadow-lg mt-6"><div className="w-full bg-orange-100 border border-orange-400 p-4 rounded-lg shadow-inner mb-6 text-gray-900"><h2 className="text-xl font-semibold text-orange-800 mb-2 text-center">Manual Data Entry Option</h2><p className="text-orange-700 text-center mb-4">Automatic data fetching encountered an issue. You can proceed by entering the NPK sensor data manually.</p><div className="flex justify-center"><button onClick={handlemanual} className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition duration-300 ease-in-out">Enter Data Manually</button></div></div></div> )}
      </main>

      {/* Footer (Keep as is) */}
      <Footer />

      {/* Modals (Keep as is, for initial fetch feedback) */}
      {showErrorModal && ( /* ... Error Modal JSX ... */ <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4"><div className="bg-white p-6 rounded-lg shadow-xl text-black max-w-sm text-center"><div className="text-red-500 mb-3"><svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><h2 className="text-xl font-bold text-red-600 mb-3">Fetch Error!</h2><p className="text-gray-700 mb-5">{error || "Failed to fetch NPK data. Check connection/setup."}</p><button onClick={() => { setShowErrorModal(false); }} className="mt-4 px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition duration-200">Close</button></div></div> )}
      {showSuccessModal && ( /* ... Success Modal JSX ... */ <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4"><div className="bg-white p-6 rounded-lg shadow-xl text-black max-w-sm text-center"><div className="text-green-500 mb-3"><svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><h2 className="text-xl font-bold text-green-600 mb-3">Success!</h2><p className="text-gray-700 mb-5">Initial data fetched successfully! Starting live updates...</p><button onClick={() => setShowSuccessModal(false)} className="mt-4 px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 transition duration-200">OK</button></div></div> )}

    </div>
  );
};

export default Bluetooth;