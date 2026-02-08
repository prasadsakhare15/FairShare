import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <h1 className="text-6xl font-bold text-gray-400 dark:text-gray-500">404</h1>
    <p className="mt-2 text-xl text-gray-600 dark:text-gray-400">Page not found</p>
    <Link
      to="/dashboard"
      className="mt-6 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
    >
      Back to Dashboard
    </Link>
  </div>
);

export default NotFound;
