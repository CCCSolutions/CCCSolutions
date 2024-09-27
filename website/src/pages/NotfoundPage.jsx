import React from "react";

const NotFound = () => {
  return (
      <div
          className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-r from-blue-800 to-indigo-900 text-center py-16 px-6">
          <title>Page Not Found</title>
          <h1 className="text-5xl font-extrabold text-white mb-6">404 - Page Not Found</h1>
          <p className="text-2xl text-white">Sorry, the page you are looking for does not exist.</p>
      </div>
  );
};

export default NotFound;
