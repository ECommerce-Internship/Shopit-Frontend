import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-purple-600 mb-4">Shopit</h1>
        <Link to="/login" className="text-purple-600 underline">
          Go to login
        </Link>
      </div>
    </div>
  );
}

export default Home;