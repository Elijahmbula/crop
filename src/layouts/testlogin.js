import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoEyeOff, IoEye } from "react-icons/io5"; // Using react-icons
import Footer from "../components/Footer";

// --- Configuration ---
const LOGIN_API_URL = process.env.REACT_APP_LOGIN_API_URL || 'http://192.168.43.35:5000/login';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    let newErrors = {};
    setErrors({});
    setServerError(null);
    if (!username.trim()) newErrors.username = "Username is required.";
    if (!password.trim()) newErrors.password = "Password is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError(null);

    const loginCredentials = {
      username: username.trim(), // Send username
      password: password,
    };

    try {
      console.log("Attempting login for username:", loginCredentials.username);
      console.log("Sending login request to:", LOGIN_API_URL);
      console.log("Payload:", JSON.stringify(loginCredentials));

      const response = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(loginCredentials),
      });

      let responseData;
      try {
         responseData = await response.json();
         console.log("Raw Server Response Body:", responseData);
      } catch (jsonError) {
         console.warn("Could not parse server response as JSON.", jsonError);
         if (!response.ok) {
             throw new Error(`Login failed. Server responded with status: ${response.status} ${response.statusText}`);
         }
         // If response was OK but not JSON, treat as an issue for login context
         throw new Error(`Login failed. Unexpected response format from server.`);
      }

      if (!response.ok) {
        const errorMessage = responseData?.message || responseData?.error || `Login failed. Status: ${response.status}`;
        throw new Error(errorMessage);
      }

      // --- Success Case (response.ok is true) ---
      console.log("Login successful!", responseData);

      // --- MODIFICATION START ---
      // ** WARNING: Bypassing token check. Assumes response.ok means login is valid for navigation. **
      // In a real application, you SHOULD get and store a token here.
      // This current approach is insecure as there's no persistent proof of login.

      // Optional: Store user info if needed later (still no security token)
      if (responseData && responseData.user_id && responseData.username) {
          try {
              localStorage.setItem('userInfo', JSON.stringify({
                  userId: responseData.user_id,
                  username: responseData.username
              }));
              console.log("Stored user info (userId, username) in localStorage.");
          } catch (storageError) {
              console.error("Failed to store user info in localStorage", storageError);
          }
      } else {
          console.warn("User info (user_id, username) not found in successful login response.");
      }

      // Navigate to home because the server said login was successful (status 200 OK)
      navigate("/home");
      // --- MODIFICATION END ---


      /* --- ORIGINAL TOKEN CHECK (Commented Out) ---
      if (responseData && responseData.token) {
        localStorage.setItem('authToken', responseData.token);
        console.log("Authentication token received and stored.");
        navigate("/home"); // Navigate on successful login + token storage
      } else {
        console.error("Login succeeded according to server, but no token was received.");
        // Throw error because token is expected for secure session
        throw new Error("Login successful, but session could not be established.");
      }
      */

    } catch (error) {
      console.error("Login Error:", error);
      setServerError(error.message || "An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- JSX Structure (Remains the same) ---
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-green-700 bg-gradient-to-b h-24 from-green-700 to-gray-200 text-black p-4 shadow-lg">
        {/* ... nav content ... */}
         <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">CropAdvisor</h1>
          <ul className="flex space-x-6">
            <li><a href="#contact" className="hover:underline text-black">Contact</a></li>
            <li><Link to="/register" className="hover:underline text-black">Register</Link></li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container flex items-center justify-center mx-auto p-10 lg:p-20 bg-cover w-screen h-screen flex-grow"
        style={{ backgroundImage: "url('wheat.jpg')" }}>
        {/* Login Form Card */}
        <div className='w-11/12 sm:w-5/12 md:w-3/12 text-sm glass-s p-6 bg-white rounded-lg shadow-lg'>

          <div className='text-center mb-6'>
            <h2 className='text-2xl font-medium text-black'>Login</h2>
          </div>

           {/* Display Server Error Messages */}
           {serverError && (
            <div className="mx-5 mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-center text-sm" role="alert">
              {serverError}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} noValidate>
            {/* Username Input Field */}
            <div className="flex flex-col mx-5 my-8">
               {/* ... input ... */}
                <label htmlFor="login-username" className="sr-only">Username</label>
                <div className="flex border-b-2 border-black py-2 items-center">
                    <input id="login-username" type='text' name="username"
                           className={`w-full bg-transparent outline-none placeholder-gray-600 ${errors.username ? 'border-red-500' : ''}`}
                           placeholder='Enter your Username' value={username} onChange={(e) => setUsername(e.target.value)}
                           aria-invalid={!!errors.username} aria-describedby={errors.username ? "username-error" : undefined}
                           disabled={isLoading} autoComplete="username" autoCapitalize="none" />
                    <i className='fa-solid fa-user text-xl text-black ml-2 flex-shrink-0'></i>
                </div>
                {errors.username && <span id="username-error" className="text-red-500 text-sm mt-1">{errors.username}</span>}
            </div>

            {/* Password Input with Eye Icon */}
            <div className="flex flex-col mx-5 my-4">
               {/* ... input ... */}
               <label htmlFor="login-password" className="sr-only">Password</label>
                <div className="flex border-b-2 border-black py-2 relative items-center">
                    <input id="login-password" type={showPassword ? "text" : "password"} name="password"
                           className={`w-full bg-transparent outline-none placeholder-gray-600 ${errors.password ? 'border-red-500' : ''}`}
                           placeholder='Enter your password' value={password} onChange={(e) => setPassword(e.target.value)}
                           aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined}
                           disabled={isLoading} autoComplete="current-password" />
                    <button type="button" className="text-xl text-black focus:outline-none pl-2 flex-shrink-0"
                            onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}
                            disabled={isLoading}>
                        {showPassword ? <IoEye /> : <IoEyeOff />}
                    </button>
                </div>
                {errors.password && <span id="password-error" className="text-red-500 text-sm mt-1">{errors.password}</span>}
            </div>

            {/* Login Button */}
            <div className='mx-5 my-6'>
               {/* ... button ... */}
                <button type="submit"
                        className={`bg-black w-full h-[40px] rounded-3xl text-white flex items-center justify-center transition duration-150 ease-in-out ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800'}`}
                        disabled={isLoading}>
                    {isLoading ? (<> {/* Spinner SVG */} </> ) : ( 'Login' )}
                </button>
            </div>

            {/* Link to Registration Page */}
            <div className='mx-3 my-2 flex items-center justify-center text-center'>
              <p className="text-black text-sm">Don't have an Account? <Link to="/register" className='text-green-600 ml-1 font-medium hover:underline'>Register</Link></p>
            </div>
          </form>

        </div>
      </div>

      {/* Footer */}
      <Footer/>

    </div>
  );
}