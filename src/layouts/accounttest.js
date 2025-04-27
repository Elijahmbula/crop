import { useState, useEffect } from "react"; // <<< Added useEffect
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom'; // <<< Combined useNavigate
import LogoutButton from "../components/LogoutButton";
import Footer from "../components/Footer"; // <<< Assuming Footer component exists

// --- Configuration ---
// <<< IMPORTANT: Replace with your actual backend API endpoints >>>
const USER_PROFILE_API_URL = process.env.REACT_APP_USER_PROFILE_API_URL || '/api/user/profile'; // For GET (initial data) & PATCH (update info)
const CHANGE_PASSWORD_API_URL = process.env.REACT_APP_CHANGE_PASSWORD_API_URL || '/api/user/password';
const UPLOAD_PROFILE_PIC_API_URL = process.env.REACT_APP_UPLOAD_PROFILE_PIC_API_URL || '/api/user/profile-picture';
const PROFILE_PIC_FIELD_NAME = 'profileImage'; // Field name backend expects for the image file

// --- Helper to get Auth Token (Replace with your actual logic) ---
const getAuthToken = () => {
  // Example: Reading from localStorage
  return localStorage.getItem('authToken');
  // return sessionStorage.getItem('authToken');
  // Or get from context/state management
};


const Account = () => {
  const navigate = useNavigate();

  // Modal Visibility State
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showProfilePicModal, setShowProfilePicModal] = useState(false);

  // User Info State
  const [initialUsername, setInitialUsername] = useState(""); // For resetting on cancel
  const [initialEmail, setInitialEmail] = useState("");     // For resetting on cancel
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("https://via.placeholder.com/150"); // URL from server
  const [profilePicPreview, setProfilePicPreview] = useState(null); // For local preview
  const [selectedFile, setSelectedFile] = useState(null); // File object for upload

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading and Error State
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isLoadingProfilePic, setIsLoadingProfilePic] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true); // Loading for initial fetch

  const [userInfoError, setUserInfoError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [profilePicError, setProfilePicError] = useState(null);
  const [initialDataError, setInitialDataError] = useState(null);

  // --- Fetch Initial User Data ---
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoadingInitialData(true);
      setInitialDataError(null);
      const token = getAuthToken();
      if (!token) {
          setInitialDataError("Not authenticated. Please log in.");
          setIsLoadingInitialData(false);
          // Optionally redirect to login
          // navigate('/');
          return;
      }

      try {
          const response = await fetch(USER_PROFILE_API_URL, {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json',
              },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Try parsing error
            throw new Error(errorData.message || `Failed to fetch profile data. Status: ${response.status}`);
          }

          const data = await response.json();
          console.log("Fetched user data:", data);
          // <<< Adjust keys based on your backend response structure >>>
          setUsername(data.name || data.username || '');
          setEmail(data.email || '');
          setProfilePicUrl(data.profilePictureUrl || 'https://via.placeholder.com/150'); // Use placeholder if no URL

          // Set initial values for reset functionality
          setInitialUsername(data.name || data.username || '');
          setInitialEmail(data.email || '');

      } catch (error) {
          console.error("Error fetching initial user data:", error);
          setInitialDataError(error.message || "Could not load user profile.");
      } finally {
          setIsLoadingInitialData(false);
      }
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // --- Update User Info Handler ---
  const handleUpdateUserInfo = async () => {
    // Basic Client-side validation
    if (!username.trim() || !email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setUserInfoError("Please enter a valid username and email.");
      return;
    }

    setIsLoadingUserInfo(true);
    setUserInfoError(null);
    const token = getAuthToken();

    if (!token) {
      setUserInfoError("Authentication error. Please log in again.");
      setIsLoadingUserInfo(false);
      return;
    }

    try {
      const response = await fetch(USER_PROFILE_API_URL, {
        method: 'PATCH', // or 'PUT'
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username: username.trim(), email: email.trim().toLowerCase() }),
      });

      const responseData = await response.json(); // Parse JSON regardless of status

      if (!response.ok) {
        throw new Error(responseData.message || `Failed to update profile. Status: ${response.status}`);
      }

      console.log("User info updated successfully:", responseData);
      // Update initial state as well after successful save
      setInitialUsername(username.trim());
      setInitialEmail(email.trim().toLowerCase());
      setShowEditUserModal(false); // Close modal on success

    } catch (error) {
      console.error("Error updating user info:", error);
      setUserInfoError(error.message || "An error occurred while updating profile.");
    } finally {
      setIsLoadingUserInfo(false);
    }
  };

  // --- Change Password Handler ---
  const handleChangePassword = async () => {
    // Basic Client-side validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }
    if (newPassword.length < 6) {
        setPasswordError("New password must be at least 6 characters long.");
        return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
        setPasswordError("New password cannot be the same as the current password.");
        return;
    }

    setIsLoadingPassword(true);
    setPasswordError(null);
    const token = getAuthToken();

    if (!token) {
      setPasswordError("Authentication error. Please log in again.");
      setIsLoadingPassword(false);
      return;
    }

    try {
      const response = await fetch(CHANGE_PASSWORD_API_URL, {
        method: 'PATCH', // or 'PUT'
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Handle specific errors like incorrect current password
        // if (response.status === 401 || response.status === 400) {
        //   throw new Error(responseData.message || "Incorrect current password.");
        // } else {
          throw new Error(responseData.message || `Failed to change password. Status: ${response.status}`);
        // }
      }

      console.log("Password changed successfully:", responseData);
      // Clear fields and close modal on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePasswordModal(false);
      // Optionally show a success message/toast

    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError(error.message || "An error occurred while changing password.");
    } finally {
      setIsLoadingPassword(false);
    }
  };

  // --- Profile Picture Change (File Selection) ---
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) { // Basic type check
      setSelectedFile(file);
      setProfilePicPreview(URL.createObjectURL(file)); // Show local preview
      setProfilePicError(null); // Clear previous errors
    } else {
      setSelectedFile(null);
      setProfilePicPreview(null);
      if(file) setProfilePicError("Please select a valid image file.");
    }
  };

  // --- Profile Picture Upload Handler ---
  const handleSaveProfilePic = async () => {
    if (!selectedFile) {
      setProfilePicError("No image selected to upload.");
      return;
    }

    setIsLoadingProfilePic(true);
    setProfilePicError(null);
    const token = getAuthToken();

    if (!token) {
      setProfilePicError("Authentication error. Please log in again.");
      setIsLoadingProfilePic(false);
      return;
    }

    const formData = new FormData();
    formData.append(PROFILE_PIC_FIELD_NAME, selectedFile); // Use the field name backend expects

    try {
      const response = await fetch(UPLOAD_PROFILE_PIC_API_URL, {
        method: 'POST', // or 'PUT'
        headers: {
          // 'Content-Type' is set automatically by browser for FormData
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Failed to upload profile picture. Status: ${response.status}`);
      }

      console.log("Profile picture uploaded successfully:", responseData);
      // Update the main profile picture URL with the one returned from the server
      setProfilePicUrl(responseData.newProfilePictureUrl || profilePicUrl); // Adjust key based on backend response
      setSelectedFile(null); // Clear selection
      setProfilePicPreview(null); // Clear preview
      setShowProfilePicModal(false); // Close modal

    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setProfilePicError(error.message || "An error occurred while uploading the image.");
    } finally {
      setIsLoadingProfilePic(false);
    }
  };

  // --- Logout Handler ---
  const handleUserLogout = () => {
    console.log("User logging out...");
    // Add your actual logout logic here:
    localStorage.removeItem('authToken'); // Example: remove token
    // localStorage.removeItem('userInfo');
    // Clear any sensitive state in context/state management
    navigate("/"); // Redirect to login
  };

  // --- Modal Cancel Handlers ---
  const handleCancelEditUser = () => {
    // Reset fields to initial values
    setUsername(initialUsername);
    setEmail(initialEmail);
    setUserInfoError(null); // Clear errors
    setShowEditUserModal(false);
  };

  const handleCancelChangePassword = () => {
    // Clear all password fields
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null); // Clear errors
    setShowChangePasswordModal(false);
  };

    const handleCancelProfilePic = () => {
    setSelectedFile(null);
    setProfilePicPreview(null);
    setProfilePicError(null);
    setShowProfilePicModal(false);
  };

  // --- Render Loading/Error for Initial Data ---
  if (isLoadingInitialData) {
      return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">Loading account data...</div>;
  }
  if (initialDataError) {
      return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-red-400">{initialDataError}</div>;
  }

  // --- Main Component Render ---
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      {/* Navigation Bar */}
      <div className="fixed mt-0 top-0 left-0 w-full z-50">
        <nav className="bg-green-700 bg-gradient-to-t from-green-700 to-slate-200 fixed w-screen text-blac p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-black">CropAdvisor</h1>
            <ul className="flex space-x-6 items-center"> {/* Added items-center */}
              <li><Link to="/home" className="hover:underline text-black">Home</Link></li>
              <li><a href="#contact" className="hover:underline text-black">Contact</a></li>
              {/* LogoutButton might be redundant if placed below, keep one */}
              {/* <LogoutButton onLogout={handleUserLogout} /> */}
            </ul>
          </div>
        </nav>
      </div>

      <h1 className="text-3xl mt-24 font-bold mb-8">Account Settings</h1> {/* Adjusted margin-top */}

      {/* Profile Picture */}
      <div className="relative w-32 h-32 mb-6">
        <img
          // Use profilePicUrl fetched from server as the source
          src={profilePicUrl}
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover border-4 border-gray-300 shadow-lg bg-gray-600" // Added bg color for placeholder
          // Handle image loading error gracefully
          onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/150" }}
        />
        <button
          onClick={() => setShowProfilePicModal(true)}
          className="absolute bottom-0 right-0 bg-blue-600 p-2 text-xs rounded-full hover:bg-blue-700 transition leading-none" // Adjusted padding/leading
        >
          {/* Simple camera icon or "Change" */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </div>

      {/* User Info Display */}
      <div className="text-center mb-6">
        <p className="text-xl font-medium">{username || "Username not set"}</p>
        <p className="text-gray-400">{email || "Email not set"}</p>
      </div>

      {/* Action Buttons Container */}
      <div className="flex flex-col items-center space-y-4 w-full max-w-xs"> {/* Centered buttons */}
        <button
          onClick={() => setShowEditUserModal(true)}
          className="w-full bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition shadow-md"
        >
          Edit User Info
        </button>

        <button
          onClick={() => setShowChangePasswordModal(true)}
          className="w-full bg-red-600 px-4 py-2 rounded-md hover:bg-red-700 transition shadow-md"
        >
          Change Password
        </button>
        {/* Separate Logout Button */}
         <div className="pt-8 w-full">
             <LogoutButton onLogout={handleUserLogout} buttonStyle="w-full bg-gray-600 px-4 py-2 rounded-md hover:bg-gray-700 transition shadow-md text-white"/>
         </div>
      </div>


      {/* --- Modals --- */}

      {/* Edit User Info Modal */}
      {showEditUserModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="bg-white p-6 rounded-lg text-black w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Edit User Info</h2>
            {/* Error Display Area */}
            {userInfoError && <p className="text-red-600 bg-red-100 p-3 rounded mb-4 text-sm">{userInfoError}</p>}
            <div className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Username"
                disabled={isLoadingUserInfo}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email"
                disabled={isLoadingUserInfo}
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEditUser} // Use cancel handler
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                disabled={isLoadingUserInfo}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUserInfo} // Use update handler
                className={`px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition ${isLoadingUserInfo ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoadingUserInfo}
              >
                {isLoadingUserInfo ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="bg-white p-6 rounded-lg text-black w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
             {/* Error Display Area */}
            {passwordError && <p className="text-red-600 bg-red-100 p-3 rounded mb-4 text-sm">{passwordError}</p>}
            <div className="space-y-4">
              {/* Current Password */}
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500" // Added pr-10
                  placeholder="Current Password"
                  disabled={isLoadingPassword}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 focus:outline-none"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={isLoadingPassword}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* New Password */}
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="New Password (min 6 chars)"
                  disabled={isLoadingPassword}
                  autoComplete="new-password"
                />
                 <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 focus:outline-none"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isLoadingPassword}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm New Password"
                  disabled={isLoadingPassword}
                  autoComplete="new-password"
                />
                 <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoadingPassword}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelChangePassword} // Use cancel handler
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                disabled={isLoadingPassword}
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword} // Use change handler
                className={`px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition ${isLoadingPassword ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoadingPassword}
              >
                {isLoadingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

       {/* Change Profile Picture Modal */}
       {showProfilePicModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="bg-white p-6 rounded-lg text-black w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Change Profile Picture</h2>
             {/* Error Display Area */}
             {profilePicError && <p className="text-red-600 bg-red-100 p-3 rounded mb-4 text-sm">{profilePicError}</p>}
            <div className="flex flex-col items-center space-y-4">
              {/* Show preview OR current pic */}
              <img
                src={profilePicPreview || profilePicUrl}
                alt="Profile Preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-300 shadow-lg bg-gray-400" // Added bg color
                onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/150" }}
              />
              <input
                type="file"
                accept="image/png, image/jpeg, image/gif" // Be more specific
                onChange={handleProfilePicChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                disabled={isLoadingProfilePic}
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelProfilePic} // Use cancel handler
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                disabled={isLoadingProfilePic}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfilePic} // Use upload handler
                className={`px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition ${isLoadingProfilePic ? 'opacity-50 cursor-not-allowed' : ''} ${!selectedFile ? 'opacity-50 cursor-not-allowed' : ''}`} // Disable if no file selected
                disabled={isLoadingProfilePic || !selectedFile}
              >
                {isLoadingProfilePic ? 'Uploading...' : 'Save Picture'}
              </button>
            </div>
          </div>
        </div>
      )}
        {/* Footer Component (If it exists) */}
        {/* <Footer /> */}
    </div> // End main container
  );
};

export default Account;