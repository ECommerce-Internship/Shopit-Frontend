import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function Seller() {
  const { user } = useAuth();
  const hasApprovedStore = (user?.storeIds.length ?? 0) > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <h1 className="text-2xl font-bold text-purple-600 mb-2">Seller Dashboard</h1>
        <p className="text-gray-600 mb-4">
          Welcome, {user?.firstName} {user?.lastName}
          <br />
          <Link to="/seller/stores">View my stores</Link>
          {' · '}
          <Link to="/seller/products">Manage products</Link>
          {' · '}
          <Link to="/seller/orders">Manage orders</Link>
        </p>
        {!hasApprovedStore && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded p-3">
            You don't have an approved store yet. Selling actions are disabled until your
            store is approved.
          </div>
        )}
      </div>
    </div>
  );
}

export default Seller;