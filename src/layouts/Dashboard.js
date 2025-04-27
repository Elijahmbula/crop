import React, { useState } from "react";
import { useNavigate, Link } from 'react-router-dom'; // Keep Link for items that remain links

import LogoutButton from "../components/LogoutButton";
import { FiMenu, FiX, FiUser, FiMail, FiEdit3, FiHome, FiSettings, FiClock, FiBarChart2 } from "react-icons/fi";

const Dashboard = () => {
    const navigate = useNavigate(); // Get the navigate function

    // State for mobile sidebar visibility
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [userProfile, setUserProfile] = useState({
        username: "",
        email: "",
        profileImageUrl: "profile.jpg" // Ensure path is correct
    });
    const [editedProfile, setEditedProfile] = useState({ ...userProfile });

    // --- Navigation Handlers for Buttons ---
    const handleNavigateToCropHistory = () => {
        closeMobileSidebar();
        navigate('/CHistory');
    };

    const handleNavigateToFertilizerHistory = () => {
        closeMobileSidebar();
        navigate('/FHistory');
    };

    const handleNavigateToAccountSettings = () => { // New handler for Account Settings
        closeMobileSidebar();
        navigate('/Account');
    };

    // --- Other Handlers ---
    const handleSaveChanges = () => {
        setUserProfile(editedProfile);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedProfile({ ...userProfile });
        setIsEditing(false);
    };

    const handleUserLogout = () => {
        console.log("User logged out");
        navigate("/");
    };

    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    const closeMobileSidebar = () => {
        setIsMobileSidebarOpen(false);
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            {/* --- Navigation Bar (z-30) --- */}
            <nav className="bg-gradient-to-b from-green-700 to-gray-200 w-full fixed top-0 left-0 text-black z-30 p-4 shadow-md h-20 flex items-center">
                 <div className="container mx-auto flex justify-between items-center">
                     <button
                         onClick={toggleMobileSidebar}
                         className="text-2xl text-white p-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-white lg:hidden"
                         aria-label="Toggle menu"
                         aria-expanded={isMobileSidebarOpen}
                         aria-controls="sidebar-navigation"
                     >
                         {isMobileSidebarOpen ? <FiX /> : <FiMenu />}
                     </button>

                     <div className="flex-1 flex justify-center lg:justify-start lg:ml-4">
                         <Link to="/dashboard" className="text-xl font-semibold">
                             CropAdvisor Dashboard
                         </Link>
                     </div>

                     <div className="flex items-center space-x-4 sm:space-x-6">
                         <Link to="/home" className="hover:text-green-200 transition duration-200 hidden sm:block">Home</Link>
                         <LogoutButton onLogout={handleUserLogout} buttonClass="bg-red-600 hover:bg-red-700" />
                     </div>
                 </div>
            </nav>

            {/* --- Page Container (Holds Sidebar and Main Content) --- */}
            <div className="flex flex-1 pt-20">

                {/* --- Sidebar --- */}
                <aside
                    id="sidebar-navigation"
                    className={`
                        top-0 left-0 z-40 h-screen pt-20
                        w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-gray-200
                        shadow-xl transition-transform duration-300 ease-in-out flex flex-col
                        -translate-x-full
                        ${isMobileSidebarOpen ? 'translate-x-0' : ''}
                        lg:translate-x-0 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)]
                    `}
                    aria-label="Sidebar Navigation"
                >
                     <button
                        onClick={closeMobileSidebar}
                        className="absolute top-2 right-2 mt-20 mr-2 text-gray-400 hover:text-white p-2 rounded-full hover:bg-slate-700 lg:hidden"
                        aria-label="Close menu"
                    >
                        <FiX size={20} />
                    </button>

                     <div className="p-4 border-b border-slate-700 hidden lg:block">
                        <h2 className="text-lg font-semibold text-white">Navigation</h2>
                     </div>

                    <nav className="flex-grow p-4 overflow-y-auto">
                        <ul className="space-y-2">
                             <li><span className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Main</span></li>
                             {/* Keep Dashboard and Home as Links for example */}
                             <li><Link to="/dashboard" onClick={closeMobileSidebar} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-700 transition duration-200"><FiBarChart2 /> Dashboard</Link></li>
                             <li><Link to="/home" onClick={closeMobileSidebar} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-700 transition duration-200"><FiHome /> Home Page</Link></li>

                             <li className="pt-2"><span className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">History</span></li>
                             <li>
                                 <button
                                    onClick={handleNavigateToCropHistory}
                                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-700 transition duration-200"
                                    aria-label="Navigate to Crop History"
                                 >
                                     <FiClock /> Crop History
                                 </button>
                             </li>
                              <li>
                                 <button
                                    onClick={handleNavigateToFertilizerHistory}
                                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-700 transition duration-200"
                                    aria-label="Navigate to Fertilizer History"
                                 >
                                     <FiClock /> Fertilizer History
                                 </button>
                             </li>

                             <li className="pt-2"><span className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Account</span></li>
                             {/* --- ACCOUNT SETTINGS BUTTON --- */}
                             <li>
                                 <button
                                    onClick={handleNavigateToAccountSettings} // Use new navigation handler
                                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-700 transition duration-200" // Style as link
                                    aria-label="Navigate to Account Settings"
                                 >
                                     <FiSettings /> Account Settings
                                 </button>
                             </li>
                        </ul>
                    </nav>

                    {/* Sidebar Footer - User Info */}
                    <div className="p-4 border-t border-slate-700">
                         <div className="flex items-center gap-3">
                            <img
                                src={userProfile.profileImageUrl || 'https://via.placeholder.com/40'}
                                alt="User avatar"
                                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                                onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/40' }}
                            />
                            <div>
                                <p className="text-sm font-medium text-white truncate">{userProfile.username}</p>
                                <p className="text-xs text-gray-400 truncate">{userProfile.email}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                 {/* --- Sidebar Overlay (for mobile) --- */}
                 {isMobileSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                        onClick={closeMobileSidebar}
                    ></div>
                 )}

                {/* --- Main Content Area --- */}
                <main className="flex-1 overflow-y-auto">
                    <div className="lg:ml-64">
                        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
                             <h1 className="text-3xl font-bold text-gray-800 mb-8">Account Dashboard</h1>
                              {/* Rest of the dashboard content remains the same */}
                              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                                 {/* Profile Card */}
                                 <div className="bg-white w-full lg:w-1/3 shadow-lg rounded-xl p-6 flex flex-col items-center border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                                      <img
                                         src={userProfile.profileImageUrl || 'https://via.placeholder.com/150'}
                                         alt="User Profile"
                                         className="w-28 h-28 rounded-full border-4 border-emerald-500 object-cover mb-4"
                                         onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/150' }}
                                     />
                                     <h2 className="text-2xl font-semibold text-gray-800 mt-2">{userProfile.username}</h2>
                                     <p className="text-gray-500 mt-1">{userProfile.email}</p>
                                 </div>
                                 {/* User Info Card */}
                                 <div className="bg-white w-full lg:w-2/3 shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                                     <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                                         <h2 className="text-xl font-semibold text-gray-800">User Information</h2>
                                         <button
                                             className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                             onClick={() => { setEditedProfile({...userProfile}); setIsEditing(true); }}
                                             aria-label="Edit user information"
                                         >
                                             <FiEdit3 className="text-lg" /> Edit
                                         </button>
                                     </div>
                                     <div className="space-y-4">
                                         <div className="flex items-center justify-between py-2">
                                             <div className="flex items-center text-gray-700"><FiUser className="mr-3 text-emerald-600" size={20} /><span className="font-medium">Username</span></div>
                                             <span className="text-gray-800">{userProfile.username}</span>
                                         </div>
                                         <div className="flex items-center justify-between py-2">
                                             <div className="flex items-center text-gray-700"><FiMail className="mr-3 text-emerald-600" size={20} /><span className="font-medium">Email</span></div>
                                             <span className="text-gray-800">{userProfile.email}</span>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                        </div>
                        <div className="w-full mt-12">
                            {/* Footer Placeholder */}
                        </div>
                    </div>
                </main>
            </div>

            {/* --- Edit Information Modal (z-50) --- */}
            {isEditing && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center px-4 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                         <h2 className="text-xl font-semibold mb-6 text-gray-800">Edit Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input id="edit-username" type="text" className="w-full p-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500" value={editedProfile.username} onChange={(e) => setEditedProfile({...editedProfile, username: e.target.value})} />
                            </div>
                            <div>
                                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input id="edit-email" type="email" className="w-full p-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500" value={editedProfile.email} onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-200" onClick={handleCancelEdit}> Cancel </button>
                            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition duration-200" onClick={handleSaveChanges}> Save Changes </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;