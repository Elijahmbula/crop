import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from "../components/Footer"; // Use correct path
import LogoutButton from "../components/LogoutButton";

const WeatherSoilForm = () => {
  const [formData, setFormData] = useState({
    rainfall: '',
    temperature: '',
    humidity: '',
    nitrogen: '',
    potassium: '',
    phosphorus: '',
  });

  const [errors, setErrors] = useState({});
  const [modalMessage, setModalMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const validateInput = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(formData).forEach((key) => {
      const value = formData[key].trim();

      if (value === '') {
        newErrors[key] = 'This field is required.';
        isValid = false;
      } else if (isNaN(value)) {
        newErrors[key] = 'Please enter a valid number.';
        isValid = false;
      } else if (Number(value) < 0) {
        newErrors[key] = 'Negative values are not allowed.';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateInput()) {
      
      navigate('/Recommend');
    } else {
      setModalMessage('In order to proceed, please fill in all fields correctly.');
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const Modal = ({ message, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg text-center w-96">
          <p className="text-xl text-gray-800 mb-4">{message}</p>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const handleUserLogout = () => {
    console.log("User logged out");
    navigate("/");
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <nav className="bg-green-700 bg-gradient-to-t from-green-700 to-slate-200 fixed w-screen text-black p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">CropAdvisor</h1>
          <ul className="flex space-x-6">
            <li><Link to="/home" className="hover:underline text-black">Home</Link></li>
            <li><a href="#contact" className="hover:underline text-black">Contact</a></li>
            <LogoutButton onLogout={handleUserLogout} />
          </ul>
        </div>
      </nav>

      <div className="container min-w-0 flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
        <h2 className="text-2xl text-green-700 mt-28 font-normal mb-4">Weather and Soil Nutrients Form</h2>
        <p className="mb-6 text-slate-50">Please fill in the form below with weather and soil nutrient values in order to proceed and get crop recommendation.</p>

        <form onSubmit={handleSubmit} className="flex flex-col items-centre space-y-8">
          <div className="flex space-x-60">
            <div className='w-1/2'>
              <h3 className="text-xl font-semibold text-yellow-400 mb-4 text-center">Fill in weather</h3>

              <div>
                <label className="block mb-8">Rainfall (mm):</label>
                <input
                  type="number"
                  name="rainfall"
                  value={formData.rainfall}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded resize-none"
                  placeholder="Enter rainfall in mm"
                  min="0"
                />
                {errors.rainfall && <p className="text-red-500 text-sm mt-1">{errors.rainfall}</p>}
              </div>

              <div>
                <label className="block mb-8">Temperature (°C):</label>
                <input
                  type="number"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded resize-none"
                  placeholder="Enter temperature in °C"
                  min="0"
                />
                {errors.temperature && <p className="text-red-500 text-sm mt-1">{errors.temperature}</p>}
              </div>

              <div>
                <label className="block mb-8">Humidity (%):</label>
                <input
                  type="number"
                  name="humidity"
                  value={formData.humidity}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded resize-none"
                  placeholder="Enter humidity in %"
                  min="0"
                />
                {errors.humidity && <p className="text-red-500 text-sm mt-1">{errors.humidity}</p>}
              </div>
            </div>

            <div className="w-1/2">
              <h3 className="text-xl font-semibold text-yellow-400 mb-4 text-center">Fill Soil values</h3>

              <div>
                <label className="block mb-8">Nitrogen (N):</label>
                <input
                  type="number"
                  name="nitrogen"
                  value={formData.nitrogen}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded resize-none"
                  placeholder="Enter nitrogen level"
                  min="0"
                />
                {errors.nitrogen && <p className="text-red-500 text-sm mt-1">{errors.nitrogen}</p>}
              </div>

              <div>
                <label className="block mb-8">Potassium (K):</label>
                <input
                  type="number"
                  name="potassium"
                  value={formData.potassium}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded resize-none"
                  placeholder="Enter potassium level"
                  min="0"
                />
                {errors.potassium && <p className="text-red-500 text-sm mt-1">{errors.potassium}</p>}
              </div>

              <div>
                <label className="block mb-8">Phosphorus (P):</label>
                <input
                  type="number"
                  name="phosphorus"
                  value={formData.phosphorus}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded resize-none"
                  placeholder="Enter phosphorus level"
                  min="0"
                />
                {errors.phosphorus && <p className="text-red-500 text-sm mt-1">{errors.phosphorus}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-center w-full">
            <button
              type="submit"
              className="w-52 mt-20 p-2 rounded-full text-white bg-green-600 hover:bg-green-700"
            >
              Proceed
            </button>
          </div>
        </form>
      </div>

      <Footer />

      <Modal message={modalMessage} isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default WeatherSoilForm;
