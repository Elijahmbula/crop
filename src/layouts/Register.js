import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Combined useNavigate import
import Footer from "../components/Footer";
import { IoEyeOff, IoEye } from "react-icons/io5";

// --- Configuration ---
const REGISTER_API_URL = process.env.REACT_APP_REGISTER_API_URL || 'http://192.168.43.35:5000/add_user';

export default function Register() {
  const navigate = useNavigate();
  // State for form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // State for UI elements
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({}); // Client-side validation errors
  const [serverError, setServerError] = useState(null); // Server communication errors
  const [isLoading, setIsLoading] = useState(false); // Loading state for submission

  // --- Client-Side Validation ---
  const validateForm = () => {
    let newErrors = {};
    setErrors({}); // Clear previous errors
    setServerError(null); // Clear previous server error

    if (!name.trim()) {
      newErrors.name = "Name is required.";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!password.trim()) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // True if form is valid
  };

  // --- Handle Registration Submission ---
  const handleRegister = async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Run client-side validation first
    if (!validateForm()) {
      return; // Stop if validation fails
    }

    // Start loading state, clear errors
    setIsLoading(true);
    setServerError(null);

    // --- *** UPDATED PAYLOAD MAPPING *** ---
    // Prepare data payload for the server
    // 'username' key now gets value from the 'name' state
    const registrationData = {
      username: name.trim(),                 // Map 'username' key to the 'name' state value
      email: email.trim().toLowerCase(),   // Keep 'email' key mapped to 'email' state value
      password: password,                    // Keep 'password' key mapped to 'password' state value
    };
    // --- *** END UPDATE *** ---


    try {
      console.log("Sending registration data to:", REGISTER_API_URL);
      // Log the actual payload being sent for debugging
      console.log("Payload:", JSON.stringify(registrationData));

      // Send the request to the backend
      const response = await fetch(REGISTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData), // Send the correctly mapped payload
      });

      // Check if the server responded successfully (status 2xx)
      if (!response.ok) {
        let errorMessage = `Registration failed with status: ${response.status}`;
        try {
          // Attempt to get a more specific error message from the server response body
          const errorData = await response.json();
          // Use the message from the server if available (adjust keys like 'message' or 'error' if needed)
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // If parsing fails, use the HTTP status text
          errorMessage = `${errorMessage} - ${response.statusText}`;
          console.warn("Could not parse error response as JSON.");
        }
        // Throw an error to be handled by the catch block
        throw new Error(errorMessage);
      }

      // --- Success Case ---
      console.log("Registration successful!");
      // Redirect the user to the login page after successful registration
      navigate("/"); // Navigate to Login route

    } catch (error) {
      // --- Error Handling ---
      console.error("Registration Error:", error);
      // Display the error message to the user
      setServerError(error.message || "Registration failed. Please check your connection and try again.");
    } finally {
      // --- Cleanup ---
      // Always turn off the loading indicator
      setIsLoading(false);
    }
  };

  // --- JSX Structure ---
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-green-700 bg-gradient-to-b h-24 from-green-700 to-gray-200 text-black p-4 shadow-lg">
         <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">CropAdvisor</h1>
          <ul className="flex space-x-6">
            <li><a href="#contact" className="hover:underline text-black">Contact</a></li>
            <li><Link to="/" className="hover:underline text-black">Login</Link></li>
          </ul>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="container items-center justify-center mx-auto flex p-10 lg:p-20 bg-cover w-screen h-screen flex-grow" style={{ backgroundImage: "url('wheat.jpg')" }} >
        {/* Registration Form Card */}
        <div className='w-11/12 items-center justify-center sm:w-5/12 md:w-3/12 text-sm glass-s'> {/* Glassmorphism style */}

          <div className='w-full text-center items-center my-3'>
            <h2 className='text-sm text-black mt-8 font-medium'>Register</h2>
          </div>

          {/* Display Server Error Messages */}
          {serverError && (
            <div className="mx-5 my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-center">
              {serverError}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} noValidate> {/* Use custom validation */}

            {/* Name Input Field */}
            <div className="flex flex-col mx-5 my-8">
               <div className="flex border-b-2 border-black py-2">
                <input
                  type='text'
                  name="name" // Added name attribute for clarity
                  className={`w-10/12 bg-transparent outline-none placeholder-gray-600 ${errors.name ? 'border-red-500' : ''}`}
                  placeholder='Enter your name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={errors.name ? "true" : "false"}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  disabled={isLoading} // Disable during loading
                />
                <div className='w-2/12 flex items-center justify-center text-black'>
                  <i className='fa-solid fa-user text-xl'></i> {/* Icon */}
                </div>
              </div>
              {/* Display validation error for name */}
              {errors.name && <span id="name-error" className="text-red-500 text-sm mt-1">{errors.name}</span>}
            </div>

            {/* Email Input Field */}
            <div className="flex flex-col mx-5 my-8">
               <div className="flex border-b-2 border-black py-2">
                <input
                  type='email'
                  name="email" // Added name attribute
                  className={`w-10/12 bg-transparent outline-none placeholder-gray-600 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder='Enter your E-mail'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  disabled={isLoading}
                  autoCapitalize="none" // Prevent auto capitalization on mobile
                />
                <div className='w-2/12 flex items-center justify-center text-black'>
                  <i className='fa-solid fa-envelope text-xl'></i> {/* Icon */}
                </div>
              </div>
              {/* Display validation error for email */}
              {errors.email && <span id="email-error" className="text-red-500 text-sm mt-1">{errors.email}</span>}
            </div>

            {/* Password Input Field */}
            <div className="flex flex-col mx-5 my-8">
              <div className="flex border-b-2 border-black py-2 relative"> {/* Relative for positioning toggle */}
                <input
                  type={showPassword ? 'text' : 'password'} // Toggle input type
                  name="password" // Added name attribute
                  className={`w-10/12 bg-transparent outline-none placeholder-gray-600 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder='Create a password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  disabled={isLoading}
                />
                {/* Password visibility toggle button */}
                <div className='w-2/12 flex items-center justify-center text-black'>
                  <button
                    type="button" // Important: type="button" prevents form submission
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={isLoading}
                  >
                    {/* Show different icons based on state */}
                    {showPassword ? <IoEye className='text-xl' /> : <IoEyeOff className='text-xl' />}
                  </button>
                </div>
              </div>
              {/* Display validation error for password */}
              {errors.password && <span id="password-error" className="text-red-500 text-sm mt-1">{errors.password}</span>}
            </div>

            {/* Submit Button */}
            <div className='mx-5 my-7 py-2'>
               <button
                type="submit"
                className={`bg-black w-full h-[35px] rounded-3xl text-white flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800'}`}
                disabled={isLoading} // Disable button when loading
              >
                {/* Show loading indicator or text */}
                {isLoading ? (
                  <>
                    {/* Simple SVG Spinner */}
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </>
                ) : (
                  'Register' // Default button text
                )}
              </button>
            </div>

            {/* Link to Login Page */}
            <div className='mx-3 my-2 py-2 flex items-center justify-center '>
              <p className='text-black'>Already have an Account? <Link to="/" className='ml-3 cursor-pointer text-green-600 font-bold text-sm hover:underline'>Login</Link> </p>
            </div>

          </form>
        </div>
      </div>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}