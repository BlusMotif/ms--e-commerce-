import React, { useState, useEffect } from 'react';
import { ref, onValue, update, remove, set } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { database, auth } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { Users, CheckCircle, XCircle, Ban, UserCheck, Search, Mail, Phone, Calendar, Package, DollarSign, Plus, X, Save, Key } from 'lucide-react';

const AdminAgents = () => {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, blocked
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [newAgentPassword, setNewAgentPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    // Fetch users
    const usersRef = ref(database, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const usersArray = Object.keys(data)
          .map((key) => ({
            uid: key,
            ...data[key],
          }))
          .filter(user => user.role === 'agent');
        setUsers(usersArray);
      } else {
        setUsers([]);
      }
      setLoading(false);
    });

    // Fetch products for agent stats
    const productsRef = ref(database, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setProducts(productsArray);
      }
    });

    // Fetch orders for agent stats
    const ordersRef = ref(database, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ordersArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setOrders(ordersArray);
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, {
        status: newStatus,
        updatedAt: Date.now(),
      });
      toast.success(`Agent ${newStatus === 'blocked' ? 'blocked' : 'activated'} successfully!`);
    } catch (error) {
      console.error('Error updating agent status:', error);
      toast.error('Failed to update agent status');
    }
  };

  const handleDeleteAgent = async (userId, agentName) => {
    if (window.confirm(`Are you sure you want to delete agent "${agentName}"? This action cannot be undone.`)) {
      try {
        const userRef = ref(database, `users/${userId}`);
        await remove(userRef);
        toast.success('Agent deleted successfully!');
      } catch (error) {
        console.error('Error deleting agent:', error);
        toast.error('Failed to delete agent');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
    });
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setCreating(true);

    try {
      // Create user account with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const userId = userCredential.user.uid;

      // Save agent data to database
      const userRef = ref(database, `users/${userId}`);
      await set(userRef, {
        uid: userId,
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone || '',
        role: 'agent',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      toast.success('Agent created successfully!');
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error creating agent:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak');
      } else {
        toast.error('Failed to create agent');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (agent) => {
    setSelectedAgent(agent);
    setNewAgentPassword('');
    setShowPasswordModal(true);
  };

  const handleSubmitPasswordReset = async (e) => {
    e.preventDefault();
    
    if (newAgentPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setResettingPassword(true);

    try {
      // Note: Firebase Auth doesn't allow direct password updates for other users from client
      // In production, use Firebase Admin SDK or Cloud Functions for real password reset
      // This stores a temporary password that the agent will be prompted to change on next login
      
      const agentRef = ref(database, `users/${selectedAgent.uid}`);
      await update(agentRef, {
        passwordResetRequired: true,
        temporaryPassword: newAgentPassword,
        passwordResetAt: Date.now(),
        updatedAt: Date.now(),
      });

      toast.success(`Password reset initiated for ${selectedAgent.fullName}. Agent will be prompted to change password on next login.`);
      toast.info('Temporary password has been set in the system.');
      
      setShowPasswordModal(false);
      setSelectedAgent(null);
      setNewAgentPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setResettingPassword(false);
    }
  };

  const getAgentStats = (agentId) => {
    const agentProducts = products.filter(p => p.agentId === agentId);
    const agentOrders = orders.filter(o => 
      o.items.some(item => {
        const product = products.find(p => p.name === item.name);
        return product && product.agentId === agentId;
      })
    );
    const totalSales = agentOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      products: agentProducts.length,
      orders: agentOrders.length,
      sales: totalSales,
    };
  };

  const filteredAgents = users.filter((agent) => {
    const matchesSearch = 
      agent.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return matchesSearch && agent.status !== 'blocked';
    if (filter === 'blocked') return matchesSearch && agent.status === 'blocked';
    return matchesSearch;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status !== 'blocked').length,
    blocked: users.filter(u => u.status === 'blocked').length,
    totalProducts: products.length,
    totalSales: orders.reduce((sum, o) => sum + o.total, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Agents</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Agent</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Total Agents</p>
          <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Blocked</p>
          <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Products</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalProducts}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Total Sales</p>
          <p className="text-xl font-bold text-primary-600">GH₵ {stats.totalSales.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="w-4 h-4 inline mr-2" />
              Search Agents
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, email or phone..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-2" />
              Status Filter
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Agents</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      {filteredAgents.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAgents.map((agent) => {
            const agentStats = getAgentStats(agent.uid);
            return (
              <div key={agent.uid} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{agent.fullName || 'N/A'}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          agent.status === 'blocked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {agent.status === 'blocked' ? 'Blocked' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Agent Contact Info */}
                <div className="space-y-2 mb-4">
                  {agent.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{agent.email}</span>
                    </div>
                  )}
                  {agent.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{agent.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Joined{' '}
                      {agent.createdAt
                        ? new Date(agent.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Agent Stats */}
                <div className="grid grid-cols-3 gap-4 py-3 border-t border-b mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Package className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-lg font-bold text-primary-600">{agentStats.products}</p>
                    <p className="text-xs text-gray-600">Products</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-lg font-bold text-blue-600">{agentStats.orders}</p>
                    <p className="text-xs text-gray-600">Orders</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {agentStats.sales.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-600">Sales (GH₵)</p>
                  </div>
                </div>

                {/* Agent Actions */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(agent.uid, agent.status)}
                      className={`btn-outline flex-1 flex items-center justify-center ${
                        agent.status === 'blocked'
                          ? 'text-green-600 border-green-600 hover:bg-green-50'
                          : 'text-yellow-600 border-yellow-600 hover:bg-yellow-50'
                      }`}
                    >
                      {agent.status === 'blocked' ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Activate
                        </>
                      ) : (
                        <>
                          <Ban className="w-4 h-4 mr-2" />
                          Block
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(agent.uid, agent.fullName)}
                      className="btn-outline text-red-600 border-red-600 hover:bg-red-50 flex-1 flex items-center justify-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                  <button
                    onClick={() => handleResetPassword(agent)}
                    className="btn-outline text-blue-600 border-blue-600 hover:bg-blue-50 w-full flex items-center justify-center"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Reset Password
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">
            {searchTerm || filter !== 'all' 
              ? 'No agents found matching your filters' 
              : 'No agents yet'}
          </p>
          <p className="text-gray-500 text-sm">
            Agents will appear here once they sign up with agent role
          </p>
        </div>
      )}

      {filteredAgents.length > 0 && (
        <div className="text-sm text-gray-600 text-center py-4">
          Showing {filteredAgents.length} of {users.length} agents
        </div>
      )}

      {/* Add Agent Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Add New Agent</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Agent's full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="agent@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="+233 XX XXX XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Agent will use this password to login
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-outline flex-1"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Create Agent
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold flex items-center">
                <Key className="w-6 h-6 mr-2 text-primary-600" />
                Reset Agent Password
              </h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedAgent(null);
                  setNewAgentPassword('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitPasswordReset} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Agent:</strong> {selectedAgent.fullName}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Email:</strong> {selectedAgent.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={newAgentPassword}
                  onChange={(e) => setNewAgentPassword(e.target.value)}
                  className="input"
                  placeholder="Enter new password for agent"
                  minLength="6"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 6 characters long
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Note:</strong> This sets a temporary password. The agent will be prompted to change it on their next login.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedAgent(null);
                    setNewAgentPassword('');
                  }}
                  className="btn-outline flex-1"
                  disabled={resettingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  {resettingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Key className="w-5 h-5 mr-2" />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAgents;
