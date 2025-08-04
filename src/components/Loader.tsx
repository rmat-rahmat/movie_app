import React from "react";

const Loader: React.FC = () => (
  <div className="w-full h-fullinset-0 flex flex-col items-center justify-center bg-black/90 z-50">
    <svg
      className="animate-spin h-12 w-12 text-red-500 mb-6"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
    <span className="text-white text-xl font-semibold">Loading...</span>
  </div>
);

export default Loader;