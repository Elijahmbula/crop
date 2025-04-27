import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Link, useNavigate } from 'react-router-dom';
import { FiDownload, FiCalendar, FiThermometer, FiDroplet, FiWind, FiSun, FiUsers, FiLogOut, FiDatabase, FiRefreshCw, FiAlertTriangle, FiCheckCircle } from "react-icons/fi"; // Added more icons

// --- Placeholder Components (Replace with your actual components) ---
const Footer = () => {
    return (
        <footer className="bg-gray-800 text-gray-400 text-center p-4 mt-10">
            © {new Date().getFullYear()} CropAdvisor. All rights reserved.
        </footer>
    );
};

const LogoutButton = ({ onLogout, buttonClass = '' }) => {
    return (
        <button
            onClick={onLogout}
            className={`flex items-center gap-1 px-3 py-1 rounded text-white text-sm font-medium transition duration-200 ${buttonClass || 'bg-red-600 hover:bg-red-700'}`}
        >
           <FiLogOut size={14}/> Logout
        </button>
    );
};

// --- API Simulation (Replace with actual fetch calls to your backend) ---
// This simulates fetching data. Replace with your actual API logic.
const api = {
    getLatestRecommendation: async () => {
        console.log("API: Fetching latest recommendation...");
        await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate delay
        // In a real app, fetch from: GET /api/recommendations/latest
        return {
            id: "rec_latest_123",
            timestamp: new Date().toISOString(), // Use current time for latest
            crop: "Maize (Zea mays)",
            alternatives: ["Sorghum", "Soybeans"],
            weather: { rainfall: "125 mm", temperature: "23°C", humidity: "76%", /* Add wind, sun hours if available */ },
            soil: { nitrogen: "47 mg/kg", potassium: "310 mg/kg", phosphorus: "58 mg/kg", ph: 6.5 },
            notes: "Good conditions for maize growth. Ensure adequate nitrogen supply.",
        };
        // To simulate error: throw new Error("Network error: Failed to fetch latest recommendation.");
    },
    getHistoricalRecommendations: async (limit = 5) => {
        console.log(`API: Fetching last ${limit} historical recommendations...`);
        await new Promise(resolve => setTimeout(resolve, 1800)); // Simulate delay
        // In a real app, fetch from: GET /api/recommendations/history?limit=5
        // Should return an array of recommendation objects, oldest first or newest first based on API design
        return [
             {
                id: "rec_hist_789",
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // ~2 days ago
                crop: "Rice (Oryza sativa)",
                alternatives: ["Maize", "Millet"],
                weather: { rainfall: "140 mm", temperature: "25°C", humidity: "80%" },
                soil: { nitrogen: "40 mg/kg", potassium: "280 mg/kg", phosphorus: "50 mg/kg", ph: 6.2 },
                notes: "Suitable for rice, monitor water levels.",
             },
             {
                id: "rec_hist_456",
                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // ~1 week ago
                crop: "Wheat (Triticum aestivum)",
                alternatives: ["Barley", "Oats"],
                weather: { rainfall: "110 mm", temperature: "20°C", humidity: "72%" },
                soil: { nitrogen: "50 mg/kg", potassium: "290 mg/kg", phosphorus: "60 mg/kg", ph: 6.8 },
                notes: "Favorable cool conditions for wheat.",
             },
             {
                id: "rec_hist_123",
                timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // ~2 weeks ago
                crop: "Soybeans (Glycine max)",
                alternatives: ["Groundnuts", "Cowpeas"],
                weather: { rainfall: "115 mm", temperature: "24°C", humidity: "75%" },
                soil: { nitrogen: "55 mg/kg", potassium: "300 mg/kg", phosphorus: "55 mg/kg", ph: 6.4 }, // Note: Soybeans fix nitrogen
                notes: "Good conditions. Ensure proper inoculation.",
             },
             // Add more dummy historical records if needed
        ];
         // To simulate error: throw new Error("Network error: Failed to fetch history.");
    }
};


// --- The CHistory Component ---

const CHistory = () => {
    const navigate = useNavigate();
    const reportRef = useRef(); // Ref for the printable report area

    // State
    const [currentDate, setCurrentDate] = useState(''); // For displaying formatted current date
    const [latestRecommendation, setLatestRecommendation] = useState(null); // Store the fetched latest record
    const [historicalRecommendations, setHistoricalRecommendations] = useState([]); // Store array of fetched historical records
    const [displayedRecord, setDisplayedRecord] = useState(null); // The record currently shown in the report view
    const [selectedRecordId, setSelectedRecordId] = useState('latest'); // ID of the record selected in the dropdown

    const [isLoadingLatest, setIsLoadingLatest] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [error, setError] = useState(null);

    // Format Date Function
    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        try {
            // Use more options for a user-friendly format
            return new Date(isoString).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            console.error("Error formatting date:", e);
            return 'Invalid Date';
        }
    };

    // Fetch Latest Recommendation on Mount
    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

        const fetchLatest = async () => {
            setIsLoadingLatest(true);
            setError(null);
            try {
                const data = await api.getLatestRecommendation();
                setLatestRecommendation(data);
                setDisplayedRecord(data); // Display latest by default
                setSelectedRecordId('latest'); // Set dropdown default
            } catch (err) {
                console.error("Error fetching latest recommendation:", err);
                setError(err.message || "Failed to load latest recommendation.");
                setDisplayedRecord(null); // Clear display on error
            } finally {
                setIsLoadingLatest(false);
            }
        };
        fetchLatest();
    }, []); // Empty dependency array: runs only once on mount

    // Fetch Historical Data Handler
    const fetchHistory = async () => {
        // Prevent fetching if already loading or if history is already loaded
        if (isLoadingHistory || historicalRecommendations.length > 0) return;

        setIsLoadingHistory(true);
        setError(null);
        try {
            const historyData = await api.getHistoricalRecommendations();
             // Sort by date descending (newest first) just in case API doesn't
            historyData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setHistoricalRecommendations(historyData);
            // Optionally, you could switch the view to the newest historical record here
            // if (historyData.length > 0) {
            //     setDisplayedRecord(historyData[0]);
            //     setSelectedRecordId(historyData[0].id);
            // }
        } catch (err) {
            console.error("Error fetching historical recommendations:", err);
            setError(err.message || "Failed to load recommendation history.");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Handle Selection Change from Dropdown
    const handleRecordSelection = (event) => {
        const recordId = event.target.value;
        setSelectedRecordId(recordId);
        if (recordId === 'latest') {
            setDisplayedRecord(latestRecommendation);
        } else {
            const selectedHistory = historicalRecommendations.find(rec => rec.id === recordId);
            setDisplayedRecord(selectedHistory || null); // Fallback to null if not found
        }
    };


    // Download PDF Handler
    const downloadPDF = () => {
        const input = reportRef.current;
        if (!input) {
            console.error("Report element not found for PDF generation.");
            alert("Could not generate PDF. Report content missing.");
            return;
        }

        // Give a brief moment for any final rendering tweaks
        setTimeout(() => {
             // Options to improve quality/capture styles better
             const options = {
                scale: 2, // Higher scale for better resolution
                useCORS: true, // If using external images
                logging: true, // Enable logging for debugging
                backgroundColor: '#ffffff' // Ensure background is white
            };

            html2canvas(input, options).then((canvas) => {
                try {
                    const imgData = canvas.toDataURL("image/png");
                    const pdf = new jsPDF({
                        orientation: "p", // portrait
                        unit: "mm", // millimeters
                        format: "a4" // standard A4 size
                    });

                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    const canvasWidth = canvas.width;
                    const canvasHeight = canvas.height;
                    const ratio = canvasWidth / canvasHeight;

                    // Calculate image dimensions to fit A4, maintaining aspect ratio
                    let imgWidth = pdfWidth - 20; // A4 width (210mm) with 10mm margins
                    let imgHeight = imgWidth / ratio;
                    let imgX = 10;
                    let imgY = 10;

                    // Check if height exceeds page height
                    if (imgHeight > pdfHeight - 20) {
                        imgHeight = pdfHeight - 20; // Max height with 10mm margins
                        imgWidth = imgHeight * ratio;
                         // Center horizontally if width is less than page width
                        imgX = (pdfWidth - imgWidth) / 2;
                    }

                    pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth, imgHeight);

                     // Add footer with generation date
                    const generationDate = new Date().toLocaleString();
                    pdf.setFontSize(8);
                    pdf.setTextColor(150);
                    pdf.text(`Report generated on: ${generationDate} by CropAdvisor`, imgX, pdfHeight - 5);

                    const fileName = `CropAdvisor_Report_${displayedRecord?.id || 'current'}_${new Date().toISOString().split('T')[0]}.pdf`;
                    pdf.save(fileName);
                } catch (pdfError) {
                    console.error("Error generating PDF:", pdfError);
                    alert("Failed to generate PDF. Please try again.");
                }
            }).catch(canvasError => {
                 console.error("Error capturing report content:", canvasError);
                alert("Failed to capture report content for PDF. Please ensure the report is fully visible.");
            });
        }, 100); // Small delay
    };


    const handleUserLogout = () => {
        console.log("User logged out");
        navigate("/");
    };

     const handleExit = () => {
        navigate('/dashboard'); // Navigate back to dashboard
    };

    // --- Render Logic ---
    const renderReportContent = () => {
        if (!displayedRecord) {
            return <div className="text-center text-gray-500 py-10">No recommendation data selected or available.</div>;
        }

        // Destructure for easier access, provide defaults
        const {
            timestamp = '',
            crop = 'N/A',
            alternatives = [],
            weather = {},
            soil = {},
            notes = 'No additional notes.'
         } = displayedRecord;

        const { rainfall = 'N/A', temperature = 'N/A', humidity = 'N/A' } = weather;
        const { nitrogen = 'N/A', potassium = 'N/A', phosphorus = 'N/A', ph = 'N/A' } = soil;

        return (
            <>
                <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">Crop Recommendation Report</h2>
                <div className="text-center mb-6 text-sm text-gray-600">
                    <FiCalendar className="inline mr-1 mb-1" /> Report Generated/Valid For: <span className="font-medium">{formatDate(timestamp)}</span>
                </div>

                {/* Weather Section */}
                <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                     <h3 className="text-lg font-semibold mb-3 text-blue-800 flex items-center gap-2"><FiThermometer /> Weather Conditions</h3>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <p><strong className="text-gray-700">Rainfall:</strong> {rainfall}</p>
                        <p><strong className="text-gray-700">Temperature:</strong> {temperature}</p>
                        <p><strong className="text-gray-700">Humidity:</strong> {humidity}</p>
                        {/* Add other weather params if available */}
                    </div>
                </div>

                 {/* Soil Section */}
                 <div className="mb-6 p-4 border border-yellow-300 rounded-lg bg-yellow-50">
                     <h3 className="text-lg font-semibold mb-3 text-yellow-800 flex items-center gap-2"><FiDroplet /> Soil Nutrient Levels</h3>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <p><strong className="text-gray-700">Nitrogen (N):</strong> {nitrogen}</p>
                        <p><strong className="text-gray-700">Potassium (K):</strong> {potassium}</p>
                        <p><strong className="text-gray-700">Phosphorus (P):</strong> {phosphorus}</p>
                        <p><strong className="text-gray-700">pH:</strong> {ph}</p>
                     </div>
                 </div>

                 {/* Recommendation Section */}
                <div className="mb-4 p-4 border-2 border-green-500 rounded-lg bg-green-50 shadow-sm">
                    <h4 className="text-xl font-bold text-green-800 mb-2 flex items-center gap-2"><FiCheckCircle /> Recommended Crop:</h4>
                    <p className="text-lg text-gray-900 font-medium">{crop}</p>
                </div>

                {/* Alternatives Section */}
                {alternatives.length > 0 && (
                     <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-700 mb-3">Alternative Options:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {alternatives.map((alt, index) => (
                                <div key={index} className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                                    <p className="text-gray-800 font-medium">{alt}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes Section */}
                {notes && (
                    <div className="mt-6 p-4 border-t border-gray-200 text-sm text-gray-600">
                        <strong className="text-gray-700">Notes:</strong> {notes}
                    </div>
                )}
            </>
        );
    };


    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            {/* Navigation Bar */}
            <nav className="bg-gradient-to-b from-green-700 to-gray-200 w-full fixed top-0 left-0 text-black z-30 p-4 shadow-md h-20 flex items-center">
                 <div className="container mx-auto flex justify-between items-center">
                    <Link to="/dashboard" className="text-xl font-semibold">CropAdvisor</Link>
                    <ul className="flex items-center space-x-4 sm:space-x-6">
                        <li><Link to="/home" className="hover:text-green-200 transition duration-200">Home</Link></li>
                        <li><Link to="/dashboard" className="hover:text-green-200 transition duration-200">Dashboard</Link></li>
                        <li><LogoutButton onLogout={handleUserLogout} /></li>
                    </ul>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-grow pt-20 w-full">
                <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8 text-center md:text-left">
                         <h1 className="text-3xl font-bold text-gray-800 mb-1">Recommendation History</h1>
                         <p className="text-gray-600">View current and past crop recommendations. Today is {currentDate}.</p>
                    </div>

                     {/* Loading/Error Display Area */}
                     {isLoadingLatest && <div className="text-center py-4 text-gray-600">Loading latest recommendation...</div>}
                     {error && <div className="mb-6 p-4 bg-red-100 text-red-700 border border-red-300 rounded text-center" role="alert"><FiAlertTriangle className="inline mr-2" /> {error}</div>}


                     {/* Action Bar: Selection and Fetch History */}
                     <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                        {/* Record Selection Dropdown */}
                         <div className="flex-grow md:flex-grow-0">
                             <label htmlFor="recordSelect" className="block text-sm font-medium text-gray-700 mb-1">View Report:</label>
                             <select
                                id="recordSelect"
                                value={selectedRecordId}
                                onChange={handleRecordSelection}
                                disabled={isLoadingLatest || !latestRecommendation} // Disable while loading or if no latest data
                                className="w-full md:w-auto p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm"
                             >
                                {/* Ensure latest is always an option if loaded */}
                                {latestRecommendation && <option value="latest">Latest Recommendation ({formatDate(latestRecommendation.timestamp)})</option>}
                                {/* Add historical options */}
                                {historicalRecommendations.map(rec => (
                                    <option key={rec.id} value={rec.id}>
                                        History ({formatDate(rec.timestamp)}) - {rec.crop}
                                    </option>
                                ))}
                             </select>
                         </div>

                         {/* Fetch History Button */}
                         <button
                            onClick={fetchHistory}
                            disabled={isLoadingHistory || historicalRecommendations.length > 0} // Disable if loading or already loaded
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                         >
                            {isLoadingHistory ? (
                                 <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Loading History...
                                </>
                            ) : (
                                <>
                                    <FiDatabase size={16} /> Load Previous Records
                                </>
                            )}
                         </button>
                     </div>


                    {/* Report Display Area */}
                    {/* Only render the report container if there's something to display or loading isn't finished */}
                    {(!isLoadingLatest || displayedRecord) && (
                         <div ref={reportRef} className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-gray-200 w-full max-w-4xl mx-auto">
                            {renderReportContent()}
                         </div>
                    )}


                     {/* Download/Exit Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                         <button
                            onClick={handleExit}
                            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition duration-200"
                         >
                            Back to Dashboard
                         </button>
                         <button
                            onClick={downloadPDF}
                            disabled={!displayedRecord || isLoadingLatest} // Disable if no data or loading
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                         >
                            <FiDownload size={16} /> Download Report
                         </button>
                    </div>

                </div> {/* End Container */}
            </main>

             {/* Footer */}
            <div className="w-full mt-auto">
                
            </div>
        </div>
    );
};

export default CHistory;