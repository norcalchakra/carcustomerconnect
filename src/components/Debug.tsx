import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dealershipApi } from '../lib/api';
import { Dealership } from '../lib/api';

const Debug: React.FC = () => {
  const { user } = useAuth();
  const [dealership, setDealership] = useState<Dealership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDealershipInfo = async () => {
      if (user) {
        try {
          setLoading(true);
          const dealershipData = await dealershipApi.getByUserId(user.id);
          setDealership(dealershipData);
          console.log('Debug - Current dealership:', dealershipData);
        } catch (err) {
          console.error('Debug - Error fetching dealership:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch dealership data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDealershipInfo();
  }, [user]);

  if (!user) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
        <p>Not logged in. Please sign in to see debug information.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 border border-gray-300 rounded p-4 mb-4 text-sm">
      <h3 className="font-bold text-lg mb-2">Debug Information</h3>
      
      <div className="mb-2">
        <strong>User ID:</strong> {user.id}
      </div>
      
      <div className="mb-2">
        <strong>Email:</strong> {user.email}
      </div>
      
      {loading ? (
        <p>Loading dealership information...</p>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : dealership ? (
        <div>
          <strong>Dealership:</strong>
          <ul className="list-disc pl-5 mt-1">
            <li><strong>ID:</strong> {dealership.id}</li>
            <li><strong>Name:</strong> {dealership.name}</li>
            <li><strong>Address:</strong> {dealership.address}, {dealership.city}, {dealership.state} {dealership.zip}</li>
            <li><strong>Phone:</strong> {dealership.phone}</li>
          </ul>
        </div>
      ) : (
        <div className="text-red-600">No dealership found for your account</div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>If you're experiencing issues adding vehicles, make sure the dealership ID matches what's in your database (ID: 4).</p>
      </div>
    </div>
  );
};

export default Debug;
