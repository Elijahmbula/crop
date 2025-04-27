
import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'
import Footer from "../components/Footer";
import LogoutButton from "../components/LogoutButton";


export default function Plant() {


  const navigate = useNavigate();
  const [selectedCrop, setSelectedCrop] = useState("");

  const handleProceed = () => {
    if (selectedCrop!=="") {
      navigate("/FBluetooth", { state: { selectedCrop } });
    } else {
      alert("Please select a crop before proceeding.");
      console.log('selecteCrop')
    }
    
    

  };

  //handle logout notification and button
  const handleUserLogout = () => {
    console.log("User logged out");
    // Add your logout logic (e.g., remove auth token, redirect to login)
    navigate("/");
  };



  return (

    
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-green-700 fixed w-screen bg-gradient-to-b h-24 from-green-700 to-gray-200 text-blac p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold  text-black">CropAdvisor</h1>
         
          <ul className="flex space-x-6">
            <li><Link to="/home" className="hover:underline  text-black">Home</Link></li>
           
            
            <li><a href="#contact" className="hover:underline mr-5 text-black">Contact</a></li>
           
            
          </ul>
        </div>
      </nav>
      <LogoutButton onLogout={handleUserLogout} />

     
      
      
      
      {/* Main Content */}

    <section className="container items-center justify-center mx-auto flex p-10 lg:p-20 bg-cover w-screen h-auto "  >
    <div className="flex flex-col mt-20 items-center min-h-screen bg-gray-100 p-6">
      {/* Explanatory Section */}
      <div className="max-w-2xl bg-white p-6 rounded-xl h-60 shadow-lg mb-6 text-center">
        <h1 className="text-2xl font-bold text-green-700 mb-2">
          Smart Fertilizer Advisor
        </h1>
        <p className="text-gray-700 text-center">
          Select a crop from the list below to receive tailored fertilizer recommendations.  
          Our system analyzes soil nutrients and crop needs to suggest the best fertilizer  
          for optimal growth and yield.
        </p>
      </div>

      {/* Crop Selection Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg w-80">
        <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
          Please Select a Crop
        </h2>
        
        {/* Dropdown */}
        <select
          className="w-full p-3 border mt-14 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
        >
          <option value="">Select Crop </option>
          <option value="soyabeans">Soyabeans</option>
          <option value="apple">Apple</option>
          <option value="banana">Banana</option>
          <option value="coffee">Coffee</option>
          <option value="cotton">Cotton</option>
          <option value="cowpeas">Cowpeas</option>
          <option value="grapes">Grapes</option>
          <option value="groundnuts">Groundnuts</option>
          <option value="maize">Maize</option>
          <option value="mango">Mango</option>
          <option value="orange">Orange</option>
          <option value="peas">Peas</option>
          <option value="rice">Rice</option>
          <option value="watermelon">Watermelon</option>
        </select>

        {/* Proceed Button */}
        <div className="relative group">
        <button
          className={`mt-4 w-full p-3 text-white font-semibold rounded-lg transition ${
            selectedCrop
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          onClick={handleProceed}
          disabled={!selectedCrop}
        >
          Proceed
        </button>

        
        {!selectedCrop && (
            <span className="absolute left-0 top-full mt-6 h-14 w-max bg-red-500 text-white rounded text-sm px-2 py-1  opacity-0 group-hover:opacity-100">
              Please select crop  from the drop down list to proceed
            </span>
          )}

        </div>



      </div>
    </div>
   

    </section>



    



   



      <div>
      

      {/* Footer */}
      
             <Footer />
      
    </div>
    </div>
  );
}

