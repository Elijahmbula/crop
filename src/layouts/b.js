import React, { useState, useEffect } from "react";
import { Switch } from "@headlessui/react";
import { useNavigate } from 'react-router-dom';
import Footer from "../components/Footer";
import LogoutButton from "../components/LogoutButton";
import { Link } from 'react-router-dom';

const Bluetooth = () => {
  const [formData, setFormData] = useState({
    nitrogen: "",
    potassium: "",
    phosphorus: "",
    
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sensorData, setSensorData] = useState({
    nitrogen: "--",
    potassium: "--",
    phosphorus: "--",
  });

  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  useEffect(() => {
    if (isConnected) {
      scanForDevices();
    } else {
      setDevices([]);
      setSensorData({ nitrogen: "--", potassium: "--", phosphorus: "--" });
      setDataSent(false); // Reset when disconnected
    }
  }, [isConnected]);

  const scanForDevices = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service'],
      });
      setDevices([device.name || "Unknown Device"]);
    } catch (error) {
      console.error("Bluetooth scan failed", error);
    }
  };




  const [showManualForm, setShowManualForm] = useState(false);

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Prevent negative values
    value = value === "" ? "" : Math.max(0, Number(value));

    setFormData({ ...formData, [name]: value });
  };

  const isFormValid = Object.values(formData).every((value) => value !== "" && value >= 0);

  const [dataSent, setDataSent] = useState(false);


  

  const navigate = useNavigate();

  const handleProceed = () => {
  
      navigate("/Climate");
      
    };


  const toggleConnection = async (value) => {
    if (value) {
      setIsLoading(true);
      try {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['generic_access'],
        });
        // Simulate connection
        setConnectedDevice(device);
        setIsConnected(true);
        setIsLoading(false);
        setSensorData({ nitrogen: 45, potassium: 32, phosphorus: 27 });
        setDataSent(true); // Set dataSent to true once data is available
      } catch (error) {
        console.error("Bluetooth connection failed", error);
        setIsLoading(false);
      }
    } else {
      setIsConnected(false);
      setSensorData({ nitrogen: "--", potassium: "--", phosphorus: "--" });
      setDataSent(false);
      setDevices([]);
      setConnectedDevice(null);
      setDataSent(false); // Reset when disconnected

  
    }
  };


  const handleUserLogout = () => {
    console.log("User logged out");
    // Add your logout logic (e.g., remove auth token, redirect to login)
    navigate("/");
  };


  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-green-700 bg-gradient-to-b h-24 from-green-700 to-gray-200 text-black p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">CropAdvisor</h1>
          <ul className="flex space-x-6">
            <li><Link to="/home" className="hover:underline text-black">Home</Link></li>
            <li><a href="#contact" className="hover:underline text-black">Contact</a></li>
            <LogoutButton onLogout={handleUserLogout} />
          </ul>
        </div>
      </nav>

      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
        <h1 className="text-3xl font-bold mb-6">Bluetooth NPK Sensor Interface</h1>

        <div className="flex items-center space-x-4 mb-6">
          <span className="text-lg">Bluetooth:</span>
          <Switch
            checked={isConnected}
            onChange={toggleConnection}
            className={`${isConnected ? "bg-green-500" : "bg-gray-500"} relative inline-flex h-6 w-11 items-center rounded-full`}
          >
            <span
              className={`transform transition ease-in-out duration-200 inline-block w-4 h-4 bg-white rounded-full ${isConnected ? "translate-x-6" : "translate-x-1"}`}
            />
          </Switch>
        </div>

        <p className="text-lg mb-4">Status: {isConnected ? "Connected" : "Disconnected"}</p>

        {!isConnected && (
          <p className="text-yellow-300 mb-4">
            Please connect your NPK sensor via Bluetooth to obtain sensor values.
          </p>
        )}

        {isConnected && (
          <p className="text-green-500 mb-4">Sensor connected successfully</p>
        )}

        
      {isLoading && <p className="text-yellow-400">Connecting to sensor...</p>}
      
      <ul className="mb-6">
        {devices.map((device, index) => (
          <li key={index}>{device}</li>
        ))}
      </ul>



        {/* NPK Sensor Data Table */}
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

        {dataSent && (
          <button
            onClick={handleProceed}
            className="mt-6 px-6 py-3 bg-black text-white rounded-lg"
      
          >
            Proceed
          </button>
        )}

        {/* Manual Data Entry Section */}
        <div className="mt-10 text-center">
          <h2 className="text-xl font-semibold mb-4">Enter Data Manually</h2>
          <p className="text-yellow-300 mb-4">
            If the NPK hardware bluetooth connection is not successful, please enter the data manually.
          </p>
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
            onClick={() => setShowManualForm(true)}
          >
            Enter Data Manually
          </button>
        </div>

        
        {/* Manual Input Form Popup */}
        {showManualForm && (
          <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">

            
            <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-2xl">
            
            <div className='w-full text-center items-center my-3'>
    <h2 className='text-2x1 text-black font-medium'>Enter data from NPK manually</h2>
</div>

              <form className="space-y-6">
              
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lg">Nitrogen (N)</label>
                    <input
                      type="number"
                      name="nitrogen"
                      value={formData.nitrogen}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Enter Nitrogen level"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-lg">Potassium (K)</label>
                    <input
                      type="number"
                      name="potassium"
                      value={formData.potassium}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Enter Potassium level"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-lg">Phosphorus (P)</label>
                    <input
                      type="number"
                      name="phosphorus"
                      value={formData.phosphorus}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Enter Phosphorus level"
                      min="0"
                    />
                  </div>
                  
                  
                  
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowManualForm(false)}
                    className="bg-red-500 text-white px-6 py-2 rounded-lg mr-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProceed}
                    disabled={!isFormValid}
                    className={`${
                      isFormValid ? 'bg-blue-500' : 'bg-gray-500'
                    } text-white px-6 py-3 rounded-lg`}
                  >
                    Submit Data
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Bluetooth;
