import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import Footer from "../components/Footer";
import LogoutButton from "../components/LogoutButton";
import { Link } from 'react-router-dom';

const Bluetooth = () => {
  const [sensorData, setSensorData] = useState({
    nitrogen: "",
    potassium: "",
    phosphorus: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

// server end point
  const SERVER_URL = "https://your-server.com/api/npk-data";

  const THINGSPEAK_CHANNEL_ID = "2912531";
  const THINGSPEAK_API_KEY = "Q370L5MLVMP8D4HL";
  const THINGSPEAK_URL = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_API_KEY}&results=1`;


  // fetch data from thingspeak and send it to the server.
  const fetchDataFromThingSpeak = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(THINGSPEAK_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.feeds && data.feeds.length > 0) {
        const latestData = data.feeds[0];
        const formattedData={
          nitrogen: latestData.field1 || "",
         
          potassium: latestData.field2 || "",
          phosphorus: latestData.field3 || "",
          timestamp: latestData.created_at || new Date().toISOString(),
        };

        setDataFetched(true);
        setShowSuccessModal(true);
        setSensorData(formattedData);

        // Send the fetched data to the server
        sendDataToServer(formattedData);

      } else {
        throw new Error("No data found in ThingSpeak channel");
      }
    } catch (error) {
      console.error("Error fetching data from NPK:", error);
      setError("Failed to fetch data from NPK");
      setShowErrorModal(true);
      setShowManualModal(true);
      setDataFetched(false);
    } finally {
      setIsLoading(false);
    }
  };


/**
   * Sends the fetched NPK sensor data to the server.
   * @param {Object} sensorData - The sensor data to send in JSON format.
   * @param {string} sensorData.nitrogen - Nitrogen level.
   * @param {string} sensorData.potassium - Potassium level.
   * @param {string} sensorData.phosphorus - Phosphorus level.
   * @param {string} sensorData.timestamp - Timestamp of the reading.
   */
const sendDataToServer = async (sensorData) => {
  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sensorData),
    });

    if (!response.ok) {
      throw new Error(`Server Error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Data sent successfully:", result);
  } catch (error) {
    console.error("Error sending data to server:", error);
  }
};




  const navigate = useNavigate();
  const handlerec= () => {

    // Navigate to the climate interface  with sensor after clicking  proceed button.
    if(dataFetched){
    navigate('/Climate', { state: { sensorData } });
  }
  }; 

  const handlemanual= () => {
    // Navigate to the manual input form after cliclicking button
    navigate('/WeatherSoil');
  }; 



  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-green-700 w-screen fixed bg-gradient-to-b h-24 from-green-700 to-gray-200 text-black p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">CropAdvisor</h1>
          <ul className="flex space-x-6">
            <li><Link to="/home" className="hover:underline text-black">Home</Link></li>
            <li><a href="#contact" className="hover:underline text-black">Contact</a></li>
            <LogoutButton onLogout={() => navigate("/")} />
          </ul>
        </div>
      </nav>

      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
        <h1 className="text-3xl font-bold mt-32 ">NPK Sensor Data Interface</h1>


        <div className="w-full mb-6 max-w-lg bg-gray-800 p-6 rounded-lg shadow-lg mt-12">
          <h2 className="text-xl font-semibold text-amber-400 mb-4 text-center">Automatic Sensor data fetching from NPK</h2>
          <p className="text-gray-300 text-center mb-4">
            Please ensure you are connected to internet, the NPK is powered on and the sensor is placed in the soil in order to fetch sensor data Automatically by clicking the button below.
          </p>
          
        </div>
      


        <button
          onClick={fetchDataFromThingSpeak}
          className="mb-6 px-6 py-3 bg-blue-500 text-white rounded-lg"
        >
          Click to fetch Data
        </button>

        {isLoading && <p className="text-yellow-400">Fetching data from ThingSpeak...</p>}

        {!isLoading && !error && dataFetched && (
          <div className="w-full max-w-lg bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">NPK Sensor Data</h2>
            <table className="w-full border-collapse border border-gray-700">
              <thead>
                <tr className="bg-gray-700">
                  <th className="border border-gray-600 p-2">Nutrient</th>
                  <th className="border border-gray-600 p-2">Level</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-600 p-2">Nitrogen</td>
                  <td className="border border-gray-600 p-2">{sensorData.nitrogen}</td>
                </tr>
                <tr>
                  <td className="border border-gray-600 p-2">Potassium</td>
                  <td className="border border-gray-600 p-2">{sensorData.potassium}</td>
                </tr>
                <tr>
                  <td className="border border-gray-600 p-2">Phosphorus</td>
                  <td className="border border-gray-600 p-2">{sensorData.phosphorus}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {error && <p className="text-red-500">{error}</p>}

        {/* Proceed Button */}
        <div className="relative group">
        <button
          onClick={ handlerec}
          className={`mt-6 px-6 py-3 text-white rounded-lg ${
            dataFetched ? "bg-green-500 hover:bg-green-600" : "bg-gray-600 cursor-not-allowed"
          }`}
          disabled={!dataFetched}
        >
          Proceed
        </button>

        {!dataFetched && (
            <span className="absolute left-0 top-full mt-4 h-10 w-max bg-slate-100 text-black text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100">
              Please click the fetch data button first to fetch data before proceeding
            </span>
          )}

</div>
</div>

{/* Manual Entry Section */}
{showManualModal && (
        <div className="w-screen  mt-4 items-center justify-center flex flex-col bg-gray-800 p-6 rounded-lg shadow-lg ">
        <div className="w-full mb-6 max-w-lg bg-slate-200 p-6 rounded-lg shadow-lg mt-12">
          <h2 className="text-xl font-semibold text-red-700 mb-4 text-center">MANUAL DATA ENTRY</h2>
          <p className="text-pink-600 text-center mb-4">
            Due to the system failure to fetch data automatically ,You can proceed  and enter the sensor data manually by clicking the get started button below.
          </p>
          
        </div>

        
          <p className="text-gray-300 text-center mb-4">
            Since Automatic fetching of NPK sensor data has failed, please click the "Get Started" button to proceed and enter the data manually.
          </p>
          <button
            onClick={handlemanual}
            className="w-80 px-6 py-3 bg-blue-700  text-white rounded-full hover:bg-orange-600"
          >
            Get Started
          </button>
        </div>
      )}
        

      <Footer />

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-black max-w-sm">
            <h2 className="text-lg text-red-500 mb-4">Error!!!</h2>
            <p className="text-red-700">Failed to fetch NPK data. Please check your internet connection or ensure the NPK sensor is powered on,if failure persists enter data manually.</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-black max-w-sm">
            <h2 className="text-lg font-bold mb-4">Success</h2>
            <p>Data fetched successfully! Click the Proceed button to continue.</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              OK
            </button>
          </div>
        </div>
      )}

      
        

    </div>
  );
};

export default Bluetoot;
