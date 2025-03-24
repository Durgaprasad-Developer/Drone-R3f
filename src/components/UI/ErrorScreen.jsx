import React from 'react';
export default function ErrorScreen({ error, onRetry }) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col justify-center items-center z-[9999]">
        <div className="bg-gray-900 p-8 rounded-lg border border-gray-700 max-w-md text-center">
          <h2 className="text-red-500 mb-5 text-xl font-semibold">Error Loading Model</h2>
          <p className="text-gray-300 mb-5">{error}</p>
          <button
            onClick={onRetry}
            className="bg-blue-500 text-white px-5 py-2 rounded-md font-bold text-lg hover:bg-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }