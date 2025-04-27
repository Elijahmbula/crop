import React, { useState, useEffect } from "react";
// Correct Icon Imports: Keep Lucide for Eye/EyeOff, Feather for the rest
import { Eye, EyeOff } from "lucide-react";
import { FiCamera, FiEdit, FiLock, FiUser, FiMail, FiX, FiMenu } from "react-icons/fi"; // Removed Eye, EyeOff from here
import { Link, useNavigate } from 'react-router-dom';
import LogoutButton from "../components/LogoutButton";
import Footer from "../components/Footer"; // Assuming you might want a footer

// Placeholder API functions (Keep as they are)
const api = {
    getUserProfile: async () => {
        console.log("API: Fetching user profile...");
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            username: "Noah Odong",
            email: "noah.database@example.com",
            profilePicUrl: "https://via.placeholder.com/150/007bff/ffffff?text=DB"
        };
    },
    updateUserProfile: async (userData) => {
        console.log("API: Updating user profile...", userData);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { ...userData };
    },
    updatePassword: async (passwordData) => {
        console.log("API: Updating password...");
        await new Promise(resolve => setTimeout(resolve, 500));
        if (passwordData.currentPassword !== 'password123') {
             throw new Error('Incorrect current password');
        }
        return { message: 'Password updated successfully' };
    },
     updateProfilePicture: async (file) => {
        console.log("API: Uploading profile picture...");
         await new Promise(resolve => setTimeout(resolve, 500));
         return { profilePicUrl: URL.createObjectURL(file) };
    }
};


const Account = () => {
    const navigate = useNavigate();

    // === State (Keep as is) ===
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showProfilePicModal, setShowProfilePicModal] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [profilePicUrl, setProfilePicUrl] = useState("https://via.placeholder.com/150/cccccc/ffffff?text=...");
    const [editedUsername, setEditedUsername] = useState("");
    const [editedEmail, setEditedEmail] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [passwordError, setPasswordError] = useState(null);

    // === Effects (Keep as is) ===
    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await api.getUserProfile();
                setUsername(data.username);
                setEmail(data.email);
                setProfilePicUrl(data.profilePicUrl || "https://via.placeholder.com/150/cccccc/ffffff?text=User");
                setEditedUsername(data.username);
                setEditedEmail(data.email);
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                setError("Could not load profile data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // === Handlers (Keep as is) ===
    const handleUserLogout = () => {
        console.log("User logged out");
        navigate("/");
    };
    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setSelectedFile(null);
            setPreviewUrl(null);
        }
    };
    const handleSaveProfilePic = async () => {
        if (!selectedFile) return;
        setError(null);
        setSuccessMessage(null);
        try {
            const data = await api.updateProfilePicture(selectedFile);
            setProfilePicUrl(data.profilePicUrl);
            setShowProfilePicModal(false);
            setSelectedFile(null);
            setPreviewUrl(null);
            setSuccessMessage("Profile picture updated successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Failed to update profile picture:", err);
            setError("Failed to upload profile picture. Please try again.");
        }
    };
    const openProfilePicModal = () => {
        setError(null);
        setPreviewUrl(profilePicUrl);
        setShowProfilePicModal(true);
    }
    const handleSaveUserInfo = async () => {
        setError(null);
        setSuccessMessage(null);
        if (!editedUsername.trim() || !editedEmail.trim()) {
            setError("Username and Email cannot be empty.");
            return;
        }
        try {
            const updatedData = await api.updateUserProfile({ username: editedUsername, email: editedEmail });
            setUsername(updatedData.username);
            setEmail(updatedData.email);
            setShowEditUserModal(false);
            setSuccessMessage("User info updated successfully!");
             setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Failed to update user info:", err);
            setError("Failed to update user info. Please try again.");
        }
    };
     const openEditUserModal = () => {
        setError(null);
        setEditedUsername(username);
        setEditedEmail(email);
        setShowEditUserModal(true);
    }
    const handlePasswordUpdate = async () => {
        setPasswordError(null);
        setSuccessMessage(null);
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("All password fields are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters long.");
            return;
        }
        try {
            await api.updatePassword({ currentPassword, newPassword });
            setShowChangePasswordModal(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setSuccessMessage("Password updated successfully!");
             setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Password update failed:", err);
            setPasswordError(err.message || "Failed to update password. Please check current password and try again.");
        }
    };
     const openChangePasswordModal = () => {
        setPasswordError(null);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowChangePasswordModal(true);
    }

    // === Render (Keep the structure, icons will now work) ===
    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen bg-gray-100">Loading account details...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            {/* Navigation Bar */}
            <nav className="bg-gradient-to-b from-green-700 to-gray-200 w-full fixed top-0 left-0 text-black z-30 p-4 shadow-md h-20 flex items-center">
                <div className="container mx-auto flex justify-between items-center">
                    <Link to="/dashboard" className="text-xl font-semibold">CropAdvisor</Link>
                    <ul className="flex items-center space-x-4 sm:space-x-6">
                        <li><Link to="/home" className="hover:text-green-200 transition duration-200">Home</Link></li>
                        <li><LogoutButton onLogout={handleUserLogout} buttonClass="bg-red-600 hover:bg-red-700" /></li>
                    </ul>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-grow pt-20 w-full">
                <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center md:text-left">Account Settings</h1>

                    {/* Success/Error Messages */}
                    {error && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded text-center">{error}</div>}
                    {successMessage && <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded text-center">{successMessage}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {/* Profile Card */}
                        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col items-center text-center">
                            <h2 className="text-xl font-semibold text-gray-700 mb-4">Profile</h2>
                            <div className="relative w-32 h-32 mb-4 group">
                                <img
                                    src={profilePicUrl}
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover border-4 border-emerald-500 shadow-lg"
                                    onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/150/cccccc/ffffff?text=N/A' }}
                                />
                                <button
                                    onClick={openProfilePicModal}
                                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full transition duration-300 text-white opacity-0 group-hover:opacity-100"
                                    aria-label="Change profile picture"
                                >
                                    <FiCamera size={24} /> {/* Use Feather icon */}
                                </button>
                            </div>
                             <p className="text-lg font-medium text-gray-800">{username}</p>
                             <p className="text-sm text-gray-500">{email}</p>
                             <button
                                onClick={openProfilePicModal}
                                className="mt-3 text-sm text-emerald-600 hover:text-emerald-800 hover:underline"
                             >
                                 Change Picture
                             </button>
                        </div>

                        {/* Settings Card */}
                        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-700 mb-6 pb-3 border-b border-gray-200">Manage Account</h2>
                            <div className="space-y-6">
                                {/* Edit User Info Section */}
                                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded border border-gray-200">
                                    <div>
                                        <h3 className="font-medium text-gray-800 flex items-center gap-2"><FiUser /> User Information</h3>
                                        <p className="text-sm text-gray-600 mt-1">Update your username and email address.</p>
                                    </div>
                                    <button
                                        onClick={openEditUserModal}
                                        className="mt-3 sm:mt-0 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition duration-200"
                                    >
                                        <FiEdit size={16}/> Edit Info
                                    </button>
                                </div>

                                {/* Change Password Section */}
                                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded border border-gray-200">
                                     <div>
                                        <h3 className="font-medium text-gray-800 flex items-center gap-2"><FiLock /> Security</h3>
                                        <p className="text-sm text-gray-600 mt-1">Change your account password.</p>
                                    </div>
                                    <button
                                        onClick={openChangePasswordModal}
                                        className="mt-3 sm:mt-0 flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition duration-200"
                                    >
                                        <FiLock size={16}/> Change Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <div className="w-full mt-auto">
          
            </div>

            {/* Modals (Structure remains the same, but Eye/EyeOff icons will now render correctly) */}

             {/* Change Profile Picture Modal */}
            {showProfilePicModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
                    {/* Modal content... */}
                     <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Profile Picture</h2>
                         {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                        <div className="flex flex-col items-center space-y-4 mb-6">
                             <img src={previewUrl || 'https://via.placeholder.com/150/cccccc/ffffff?text=Preview'} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-gray-300 shadow-lg" onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/150/cccccc/ffffff?text=N/A' }} />
                            <label className="block w-full">
                                 <span className="sr-only">Choose profile photo</span>
                                 <input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleProfilePicChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"/>
                            </label>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setShowProfilePicModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"> Cancel </button>
                            <button onClick={handleSaveProfilePic} disabled={!selectedFile} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"> Save Picture </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Info Modal */}
            {showEditUserModal && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
                     {/* Modal content... */}
                     <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit User Information</h2>
                        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                        <div className="space-y-4 mb-6">
                             <div>
                                <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input id="edit-username" type="text" value={editedUsername} onChange={(e) => setEditedUsername(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500" placeholder="Username" />
                            </div>
                            <div>
                                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input id="edit-email" type="email" value={editedEmail} onChange={(e) => setEditedEmail(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500" placeholder="Email" />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setShowEditUserModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"> Cancel </button>
                            <button onClick={handleSaveUserInfo} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition"> Save Changes </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showChangePasswordModal && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
                        {passwordError && <p className="text-sm text-red-600 mb-3">{passwordError}</p>}
                        <div className="space-y-4 mb-6">
                            {/* Current Password - Uses Lucide Icons */}
                            <div className="relative">
                                <label htmlFor="current-pass" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input id="current-pass" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full p-2 pr-10 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter current password" />
                                <button type="button" className="absolute top-8 right-3 text-gray-500" onClick={() => setShowCurrentPassword(!showCurrentPassword)} aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}>
                                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />} {/* Lucide Icon */}
                                </button>
                            </div>
                             {/* New Password - Uses Lucide Icons */}
                            <div className="relative">
                                <label htmlFor="new-pass" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input id="new-pass" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-2 pr-10 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter new password" />
                                <button type="button" className="absolute top-8 right-3 text-gray-500" onClick={() => setShowNewPassword(!showNewPassword)} aria-label={showNewPassword ? "Hide new password" : "Show new password"}>
                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />} {/* Lucide Icon */}
                                </button>
                            </div>
                            {/* Confirm Password - Uses Lucide Icons */}
                            <div className="relative">
                                 <label htmlFor="confirm-pass" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <input id="confirm-pass" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2 pr-10 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500" placeholder="Confirm new password" />
                                <button type="button" className="absolute top-8 right-3 text-gray-500" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}>
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />} {/* Lucide Icon */}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setShowChangePasswordModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"> Cancel </button>
                            <button onClick={handlePasswordUpdate} className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition"> Update Password </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Account;