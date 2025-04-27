import React from "react";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Footer from "../components/Footer"; // Ensure this path is correct

export default function Home() {
  const navigate = useNavigate();

  const handleDashboard = () => {
    navigate('/Dashboard');
  };

  const handleBluetooth = () => {
    navigate('/Bluetooth');
  };

  const handlePlant = () => {
    navigate('/Plant');

  };

  const handleclimate = () => {
    // This currently navigates to Bluetooth, update if needed
    navigate('/Bluetooth');
  };

  return (
    // Main container
    <div className="min-h-screen w-screen flex flex-col bg-gray-50"> {/* Added a light bg for contrast */}
      {/* Navigation Bar - Fixed and on top */}
      <nav className="bg-green-700 w-full fixed top-0 left-0 text-black p-4 shadow-lg bg-gradient-to-b h-24 from-green-700 to-gray-200 z-50"> {/* Added z-50, adjusted gradient slightly, used w-full */}
        <div className="container mx-auto flex justify-between items-center h-full"> {/* Ensure content uses full height */}
          <h1 className="text-2xl font-bold text-black">CropAdvisor</h1> {/* White text for better contrast */}
          <ul className="flex space-x-6 items-center"> {/* Added items-center */}
            <li><Link to="/home" className="text-black hover:underline">Home</Link></li>
            <li><a href="#about" className="text-black hover:underline">About</a></li>
            <li><a href="#services" className="text-black hover:underline">Services</a></li>
            <li><a href="#contact" className="text-black hover:underline">Contact</a></li>
            <li><Link to="/" className="text-black hover:underline">Login</Link></li>
            <li><Link to="/Register" className="text-black hover:underline">Register</Link></li>
            <li> {/* Moved button into li for consistency */}
              <button
                onClick={handleDashboard}
                className='bg-fuchsia-950 w-10 h-10 rounded-full text-slate-100 flex items-center justify-center hover:bg-fuchsia-800 transition duration-200' /* Adjusted size/shape */
                aria-label="User Dashboard"
              >
                <i className='fa-solid fa-user text-xl'></i>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content Wrapper - Add padding-top equal to navbar height */}
      <main className="flex-grow pt-24 w-full"> {/* Added pt-24, w-full, flex-grow */}

        {/* Header Section - Removed margin-top */}
        <header className="bg-slate-100 text-lime-600 text-center py-16 md:py-20"> {/* Adjusted padding */}
          <h2 className="text-4xl font-bold">Welcome to CropAdvisor</h2>
          <p className="mt-4 text-lg">Helping farmers make better crop and soil decisions.</p>
        </header>

        {/* Main Content with Image Cards */}
        {/* Adjusted section for better responsiveness and removed w-screen */}
        <section
          className="container mx-auto mt-10 p-6 md:p-10 lg:p-16 bg-cover bg-center"
          style={{ backgroundImage: "url('corn.jpg')" }} // Ensure corn.jpg is in public folder or imported
        >
          <div className="flex flex-col lg:flex-row justify-center items-center gap-10 my-10 lg:my-16">
            {/* First Image Card */}
            <div className="bg-white bg-opacity-30 backdrop-blur-md p-6 rounded-xl shadow-lg w-full lg:w-5/12 text-center transform transition duration-300 hover:scale-105">
              <img src="wheat.jpg" alt="Wheat Display" className="w-full h-48 object-cover rounded-lg mb-4" /> {/* Adjusted image size */}
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Crop Prediction</h3> {/* Added title */}
              <button onClick={handleBluetooth} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 w-auto h-auto mt-3"> {/* Adjusted button style */}
                Predict Crop
              </button>
            </div>

            {/* Second Image Card */}
            <div className="bg-white bg-opacity-30 backdrop-blur-md p-6 rounded-xl shadow-lg w-full lg:w-5/12 text-center transform transition duration-300 hover:scale-105">
              <img src="soil.jpg" alt="Soil Display" className="w-full h-48 object-cover rounded-lg mb-4" /> {/* Adjusted image size */}
               <h3 className="text-xl font-semibold mb-3 text-gray-800">Fertilizer Advice</h3> {/* Added title */}
              <button onClick={handlePlant} className="bg-green-600 w-auto h-auto text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200 mt-3"> {/* Adjusted button style */}
                Get Advice
              </button>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <div id="about" className="bg-gradient-to-r from-green-50 to-blue-50 py-16"> {/* Adjusted gradient */}
          <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-green-700 mb-4"> {/* Adjusted color */}
                About CropAdvisor
              </h2>
              <p className="text-lg text-gray-700"> {/* Adjusted color */}
                Revolutionizing agriculture with data-driven decisions, helping farmers grow smarter and more sustainably.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start"> {/* Adjusted gap */}
              <div className="space-y-6">
                <h3 className="text-3xl font-semibold text-green-600">Our Mission</h3> {/* Adjusted color */}
                <p className="text-lg text-gray-600 leading-relaxed">
                  At CropAdvisor, we empower farmers with cutting-edge technology and data insights to help them plant better and more wisely. Our goal is to boost crop yields, optimize resource use, and promote sustainability in agriculture.
                </p>
              </div>
              <div className="space-y-6">
                <h3 className="text-3xl font-semibold text-green-600">Key Features</h3> {/* Adjusted color */}
                <ul className="list-disc pl-5 text-lg text-gray-600 space-y-3">
                  <li><strong>Data-Driven Decisions:</strong> Personalized crop and fertilizer recommendations based on soil and weather data.</li>
                  <li><strong>Sustainability Focus:</strong> Helping farmers reduce waste and conserve natural resources.</li>
                  <li><strong>Cost-Effective:</strong> Increasing yields while reducing input costs for better profitability.</li>
                </ul>
              </div>
            </div>
            <div className="mt-16 bg-white p-8 rounded-lg shadow-lg">
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-blue-800 mb-4">Impacting Farmers, Improving Agriculture</h3> {/* Adjusted color */}
                <p className="text-lg text-gray-700">
                  CropAdvisor is not just a platform; it's a partner in the journey towards smarter, sustainable farming. By providing real-time insights and recommendations, we help farmers make the most of their resources and improve crop productivity.
                </p>
              </div>
            </div>
            <div className="text-center mt-16">
              <button onClick={handleclimate}
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg rounded-full shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition duration-300 transform hover:-translate-y-1" /* Adjusted padding/size */
              >
                Get Started with CropAdvisor
              </button>
            </div>
          </div>
        </div>

        {/* Our Services Section */}
        <section id="services" className="container mx-auto my-16 px-6 lg:px-12">
          <h3 className="text-4xl font-semibold text-center mb-12 text-green-700"> {/* Adjusted color and margin */}
            Our Services
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12"> {/* Adjusted gap */}
            {/* Service Card 1 */}
            <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-xl shadow-lg p-6 transition-transform transform hover:scale-105 hover:shadow-xl overflow-hidden"> {/* Added overflow-hidden */}
              <img src="soil.jpg" alt="Soil Analysis" className="w-full h-40 object-cover rounded-t-xl mb-4" />
               {/* Link wrapper for the whole card content could be an option too */}
               <Link to="/FBluetooth" className="text-2xl font-semibold text-green-700 hover:text-green-800 transition duration-200">Soil Analysis</Link>
              <p className="text-md text-gray-700 mt-2"> {/* Adjusted text size */}
                Understand your soil's health and composition to ensure optimal crop growth.
              </p>
            </div>
            {/* Service Card 2 */}
            <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-xl shadow-lg p-6 transition-transform transform hover:scale-105 hover:shadow-xl overflow-hidden">
              <img src="maize.jpg" alt="Crop Recommendations" className="w-full h-40 object-cover rounded-t-xl mb-4" />
              <Link to="/Bluetooth" className="text-2xl font-semibold text-green-700 hover:text-green-800 transition duration-200">Crop Recommendations</Link>
              <p className="text-md text-gray-700 mt-2">
                Receive personalized crop recommendations based on your soil and climate data.
              </p>
            </div>
            {/* Service Card 3 */}
            <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-xl shadow-lg p-6 transition-transform transform hover:scale-105 hover:shadow-xl overflow-hidden">
              <img src="germ.jpg" alt="Fertilizer Guidance" className="w-full h-40 object-cover rounded-t-xl mb-4" />
              <Link to="/plant" className="text-2xl font-semibold text-green-700 hover:text-green-800 transition duration-200">Fertilizer Advisor</Link>
              <p className="text-md text-gray-700 mt-2">
                Get expert recommendations on the right fertilizers to enhance soil fertility.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer /> {/* Footer is now inside the main scrollable area but at the end */}

      </main> {/* End Main Content Wrapper */}
    </div> // End Main Container
  );
}