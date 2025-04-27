import { useState } from "react";

const LogoutButton = ({ onLogout }) => {
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    setShowModal(false);
    if (onLogout) onLogout(); // Call the logout function passed as a prop
  };

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="bg-red-700 w-16 h-7 rounded-3xl text-slate-100"
      >
        Logout
      </button>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-semibold">Are you sure?</h2>
            <p className="text-gray-600">Do you really want to logout?</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-white bg-red-600 rounded-full hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogoutButton;
