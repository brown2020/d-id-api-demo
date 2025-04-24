"use client";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto py-4 px-4 flex flex-col md:flex-row items-center justify-between">
        <div className="text-gray-600 text-sm mb-2 md:mb-0">
          © {new Date().getFullYear()} D-ID API Demo. All rights reserved.
        </div>
        <div className="flex space-x-6 text-sm text-gray-600">
          <a
            href="https://www.d-id.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500 transition-colors"
          >
            D-ID Website
          </a>
          <a
            href="https://docs.d-id.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500 transition-colors"
          >
            API Documentation
          </a>
          <a
            href="https://github.com/brown2020/d-id-api-demo"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
