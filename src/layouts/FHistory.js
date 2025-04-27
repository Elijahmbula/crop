import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Link } from 'react-router-dom';
import Footer from "../components/Footer"; // Use correct pat
import { useNavigate } from 'react-router-dom'
import LogoutButton from "../components/LogoutButton"; // Use correct pat



const FHistory= () => {

    const navigate = useNavigate();
                 
            
              const handleExit= () => {
                // Navigate to the Login page after clicking the logout button
                navigate('/Dashboard');
              };

  const [selectedHistory, setSelectedHistory] = useState("current");
  const reportRef = useRef();

  const historyData = {
    current: {
      date: "March 30, 2025",
      inorganic: [
        { nutrient: "Nitrogen (N)", quantity: "50 kg/ha" },
        { nutrient: "Phosphorus (P)", quantity: "30 kg/ha" },
        { nutrient: "Potassium (K)", quantity: "40 kg/ha" },
      ],
      organic: [
        { nutrient: "Cow Manure", quantity: "10 tons/ha" },
        { nutrient: "Compost", quantity: "5 tons/ha" },
        { nutrient: "Bone Meal", quantity: "2 tons/ha" },
      ],
      crop: "Wheat",
    },
    previous1: {
      date: "March 20, 2025",
      inorganic: [
        { nutrient: "Nitrogen (N)", quantity: "45 kg/ha" },
        { nutrient: "Phosphorus (P)", quantity: "25 kg/ha" },
        { nutrient: "Potassium (K)", quantity: "38 kg/ha" },
      ],
      organic: [
        { nutrient: "Green Manure", quantity: "8 tons/ha" },
        { nutrient: "Fish Emulsion", quantity: "3 tons/ha" },
      ],
      crop: "Corn",
    },
  };

  const downloadPDF = () => {
    const input = reportRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 10, 10, 190, (canvas.height * 190) / canvas.width);
      pdf.save("Fertilizer_History_Report.pdf");
    });
  };

//handle logout notification
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
                       
                        
                        <li><a href="#contact" className="hover:underline text-black">Contact</a></li>
                        <LogoutButton onLogout={handleUserLogout} />
                        
                      </ul>
                    </div>
                  </nav>












      <header className="bg-gray-200 mx-auto text-center flex p-4 text-2xl font-semibold w-1/2 rounded-full mt-36 justify-center">Fertilizer History</header>
      <div className="flex justify-center space-x-4 my-4">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg" onClick={() => setSelectedHistory("current")}>Current History</button>
        <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg" onClick={() => setSelectedHistory("previous1")}>Previous History</button>
      </div>
      <div ref={reportRef} className="bg-white p-6 mx-auto rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-xl font-bold text-center mb-4">Fertilizer Application Report</h2>
        <h3 className="text-lg font-semibold mb-2">Date: {historyData[selectedHistory].date}</h3>
        <h3 className="text-lg font-semibold mb-2 text-blue-700">Inorganic Fertilizers & Recommended Quantity</h3>
        <table className="w-full border border-gray-300 mb-6">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 border">Nutrient</th>
              <th className="px-4 py-2 border">Recommended Quantity</th>
            </tr>
          </thead>
          <tbody>
            {historyData[selectedHistory].inorganic.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-gray-100" : ""}>
                <td className="px-4 py-2 border">{item.nutrient}</td>
                <td className="px-4 py-2 border">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 className="text-lg font-semibold mb-2 text-green-700">Organic Fertilizers & Quantity</h3>
        <table className="w-full border border-gray-300 mb-6">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 border">Organic Nutrient</th>
              <th className="px-4 py-2 border">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {historyData[selectedHistory].organic.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-gray-100" : ""}>
                <td className="px-4 py-2 border">{item.nutrient}</td>
                <td className="px-4 py-2 border">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 bg-yellow-100 rounded-lg text-center">
          <h4 className="text-lg font-semibold text-yellow-800">Crop Benefiting Most:</h4>
          <p className="text-gray-700">{historyData[selectedHistory].crop}</p>
        </div>
        


      </div>

      <div className="mt-6 flex gap-96 justify-center">
          <button  onClick={handleExit} className="bg-red-500 text-white px-4 py-2 rounded-lg">Exit</button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg" onClick={downloadPDF}>Download Report</button>
        </div>

      <div className="mb-0 mt-24">  <Footer/>
      </div>
    </div>
  );
};

export default FHistory;
