import React from 'react';

const CustomerDashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Customer Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-primary-600">0</p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Pending Orders</h3>
          <p className="text-3xl font-bold text-yellow-600">0</p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Completed Orders</h3>
          <p className="text-3xl font-bold text-green-600">0</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
