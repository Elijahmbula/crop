// src/components/Footer.js
import React from "react";

const Footer = () => {
  // --- Define Links - Using Official Ugandan Agricultural Body Links ---
  // ** Please verify these links are the most appropriate for your users **
  const facebookLink = "https://www.facebook.com/maaifug";        // MAAIF Uganda Facebook Page
  const youtubeLink = "https://www.youtube.com/@narouganda7244"; // NARO Uganda YouTube Channel
  const instagramLink = "https://www.instagram.com/maaif_uganda/"; // MAAIF Uganda Instagram
  const whatsappNumber = "256768182448"; // Uganda country code + number without leading 0
  const telephoneNumber = "+256768182448"; // Standard tel format with country code

  return (
    <div>
      {/* Other content of your component */}

      {/* Footer */}
      <footer id='contact' className="bg-green-600 bg-gradient-to-t from-green-700 to-slate-200 p-6 h-auto md:h-64 flex flex-col justify-center items-center text-center"> {/* Adjusted height and centering */}
        <div className="max-w-screen-xl mx-auto w-full">
          <p className="text-base font-semibold text-gray-800 mb-4">Contact us via:</p> {/* Adjusted styling */}

          {/* Social Media Icons Section */}
          <div className="flex justify-center space-x-6 mb-4"> {/* Centered icons */}
            {/* Facebook */}
            <a
              href={facebookLink} // Updated Link
              target="_blank"
              rel="noopener noreferrer"
              className="text-3xl text-gray-700 hover:text-blue-600 transition-colors duration-200"
              aria-label="Facebook" // Accessibility
            >
              <i className="fab fa-facebook"></i>
            </a>

            {/* YouTube */}
            <a
              href={youtubeLink} // Updated Link
              target="_blank"
              rel="noopener noreferrer"
              className="text-3xl text-gray-700 hover:text-red-600 transition-colors duration-200" // YouTube red hover
              aria-label="YouTube"
            >
              <i className="fab fa-youtube"></i>
            </a>

            {/* Instagram */}
            <a
              href={instagramLink} // Updated Link
              target="_blank"
              rel="noopener noreferrer"
              className="text-3xl text-gray-700 hover:text-pink-600 transition-colors duration-200"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram"></i>
            </a>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${whatsappNumber}`} // Kept as is
              target="_blank"
              rel="noopener noreferrer"
              className="text-3xl text-gray-700 hover:text-green-500 transition-colors duration-200" // WhatsApp green hover
              aria-label="WhatsApp"
            >
              <i className="fab fa-whatsapp"></i>
            </a>

            {/* Telephone */}
            <a
              href={`tel:${telephoneNumber}`} // Kept as is
              rel="noopener noreferrer"
              className="text-3xl text-gray-700 hover:text-blue-500 transition-colors duration-200"
              aria-label="Telephone"
            >
              <i className="fas fa-phone"></i>
            </a>
          </div>

          {/* Added Textual Contact Info */}
          <div className="text-sm text-gray-800 mb-4">
             <p>WhatsApp: <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hover:underline">+{whatsappNumber}</a></p>
             <p>Telephone: <a href={`tel:${telephoneNumber}`} className="hover:underline">{telephoneNumber}</a></p>
          </div>

          {/* Statement Section */}
          <div className="flex justify-center">
            <p className="text-center text-base text-teal-900 font-medium"> {/* Adjusted styling */}
              CropAdvisor: Helping farmers plant better and wisely.
            </p>
          </div>

           {/* Copyright/Year (Optional) */}
           <div className="mt-4 text-xs text-gray-700">
             © {new Date().getFullYear()} CropAdvisor. All rights reserved.
           </div>

        </div>
      </footer>

      {/* Other content of your component */}
    </div>
  );
};

export default Footer;