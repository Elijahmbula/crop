import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'
import Footer from "../components/Footer";
import LogoutButton from "../components/LogoutButton";

export default function FClimate() {
  
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proceed, setProceed] = useState(false);

  const fetchWeather = async () => {
    if (!city) return;
    setLoading(true);
    setError(null);
    setProceed(false);

    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=c9bd72ec0fc04093a1982220252303&q=${city}`
      );
      const data = await response.json();

      if (data.error) {
        setError(data.error.message);
        setWeather(null);
      } else {
        setWeather(data);
        setProceed(true);
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
      setError("Failed to fetch weather data.");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

   const navigate = useNavigate();
             
        
          const handleLogout= () => {
            // Navigate to the home page after clicking the login button
            navigate('/');
          };

          const handleFertilizer= () => {
            // Navigate to the home page after clicking the login button
            navigate('/Fertilizer');
          };

          // handle logout notification
          const handleUserLogout = () => {
            console.log("User logged out");
            // Add your logout logic (e.g., remove auth token, redirect to login)
            navigate("/");
          };
        



  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-green-700 fixed w-screen text-black p-4 shadow-lg ">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">CropAdvisor</h1>
          <ul className="flex space-x-6">
            <li><Link to ="/home" className="hover:underline text-black">Home</Link></li>
            <li><a href="#contact" className="hover:underline text-black">Contact</a></li>
            <LogoutButton onLogout={handleUserLogout} />
          </ul>
        </div>
      </nav>

      {/* Weather Data Importance (Now Below the Nav Bar) */}
      <div className="bg-gray-800 p-10 h-20 text-center text-white mt-20 mx-auto shadow-xl rounded-full  w-1/2 items-center place-items-center">
        <p className="text-sm text-centervtext-justify-centre">
          Weather data will be used along with NPK sensor data to help reccomend a crop that is suitable to grow in a particular region.
        </p>
      </div>

      {/* Weather Search Section */}
      <div className="container mx-auto flex flex-col items-center justify-center p-10 lg:p-20 w-screen h-screen bg-gray-900 text-white">
        <h2 className="text-3xl font-bold mb-6">Check Weather in any City</h2>
        
        <div className="flex bg-gray-800 p-3 rounded-lg shadow-lg w-full max-w-md">
          <input
            type="text"
            placeholder="Enter city name..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="flex-grow p-2 bg-transparent border-none outline-none text-white placeholder-gray-400"
          />
          <button onClick={fetchWeather} className="bg-blue-600 p-2 rounded-lg hover:bg-blue-700">
            <FaSearch size={20} />
          </button>
        </div>

        {/* Display Weather Data */}
        {loading && <p className="mt-6 text-lg">Loading...</p>}
        {error && <p className="mt-6 text-lg text-red-500">{error}</p>}

        {weather && !error && (
          <div className="mt-6 bg-gray-800 p-6 rounded-lg shadow-lg text-center w-full max-w-md">
            <h3 className="text-2xl font-semibold">{weather?.location?.name || "Unknown City"}</h3>
            <p className="text-lg mb-4">{weather?.current?.condition?.text || "No condition data"}</p>

            {/* Weather Data Table */}
            <table className="table-auto border-collapse w-full text-white">
              <thead>
                <tr className="bg-gray-700">
                  <th className="border border-gray-600 px-4 py-2">Parameter</th>
                  <th className="border border-gray-600 px-4 py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-800">
                  <td className="border border-gray-600 px-4 py-2">🌡️ Temperature</td>
                  <td className="border border-gray-600 px-4 py-2">{weather?.current?.temp_c ?? "N/A"}°C</td>
                </tr>
                <tr className="bg-gray-900">
                  <td className="border border-gray-600 px-4 py-2">💧 Humidity</td>
                  <td className="border border-gray-600 px-4 py-2">{weather?.current?.humidity ?? "N/A"}%</td>
                </tr>
                <tr className="bg-gray-800">
                  <td className="border border-gray-600 px-4 py-2">🌧️ Rainfall</td>
                  <td className="border border-gray-600 px-4 py-2">{weather?.current?.precip_mm ?? "N/A"} mm</td>
                </tr>
              </tbody>
            </table>

            {/* Proceed Button - Appears After Data is Loaded */}
            {proceed && (
              <button  onClick={handleFertilizer}
                className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
               
              >
                Proceed
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div>
         <Footer />
      </div>
      
    </div>
  );
}
