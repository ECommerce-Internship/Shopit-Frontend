import { Link } from 'react-router-dom';


function Admin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-purple-600 mb-2">Admin Panel</h1>
        <p className="text-gray-600 mb-4">Only visible to Admin users.</p>
        <Link to="/admin/payments" className="text-blue-600 underline block mb-2">
          View Payments
        </Link>
        <Link to="/admin/reviews" className="text-blue-600 underline block">
          View Reviews
        </Link>
        <Link to="/admin/dashboard" className="text-blue-600 underline block mb-2">
        Dashboard
        </Link>
      </div>
    </div>
  );
}

export default Admin;