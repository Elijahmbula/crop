import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Footer from "../components/Footer";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  

  const validateForm = () => {
    let newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!password.trim()) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (errors.name==="" && errors.email===""){
      axios.post('http://localhost/8081/cropadvisor',{email,password})
      .then(res => console.log(res))
      .catch(err=> console.log(err));

    }

    else if (validateForm()) {
      navigate("/home");
    }
  };



  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-green-700 bg-gradient-to-b h-24 from-green-700 to-gray-200 text-black p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">CropAdvisor</h1>
          <ul className="flex space-x-6">
            <li><a href="#contact" className="hover:underline text-black">Contact</a></li>
            <li><Link to="/register" className="hover:underline text-black">Register</Link></li>
          </ul>
        </div>
      </nav>

      <div className="container flex items-center justify-center mx-auto p-10 lg:p-20 bg-cover w-screen h-screen" 
        style={{ backgroundImage: "url('wheat.jpg')" }}>
        <div className='w-11/12 sm:w-5/12 md:w-3/12 text-sm glass p-6 bg-white rounded-lg shadow-lg'>

          <div className='text-center mb-6'>
            <h2 className='text-2xl font-medium text-black'>Login</h2>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email Input */}
            <div className="flex flex-col mx-5 my-8">
              <div className="flex border-b-2 border-black py-2">
                <input 
                  type='email' 
                  className='w-full bg-transparent outline-none' 
                  placeholder='Enter your E-mail'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <i className='fa-solid fa-envelope text-xl  ml-2'></i>
              </div>
              {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email}</span>}
            </div>

            {/* Password Input with Eye Icon */}
            <div className="flex flex-col mx-5 my-4">
              <div className="flex border-b-2 border-black py-2 relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className='w-full bg-transparent outline-none' 
                  placeholder='Enter your password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  className="absolute right-2 text-xl " 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={showPassword ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'}></i>
                </button>
              </div>
              {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password}</span>}
            </div>

            {/* Login Button */}
            <div className='mx-5 my-6'>
              <button 
                type="submit" 
                className='bg-black w-full h-[35px] rounded-3xl text-white'
>
                Login
              </button>
            </div>

            {/* Register Link */}
            <div className='mx-3 my-2 flex items-center justify-center'>
              <p>Don't have an Account? <Link to="/Register" className='text-green-600 ml-3 font-medium'>Register</Link></p>
            </div>
          </form>

        </div>
      </div>

      {/* Footer */}
      <Footer/>
    
    </div>
  );
}
