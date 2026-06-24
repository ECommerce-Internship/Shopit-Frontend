import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-purple-600 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-4">
          Welcome, {user?.firstName} {user?.lastName} ({user?.role})
        </p>
        <button
          onClick={logout}
          className="bg-gray-800 text-white rounded px-4 py-2"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default Dashboard;