import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2, X } from 'lucide-react';

interface User {
  id: number;
  name?: string; // Backend User model doesn't have name, but might have it in migration. Let's check.
  phone: string;
  role: 'admin' | 'user';
  status: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = () => {
    setCurrentUser({ phone: '', role: 'user', status: 'active' });
    setModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setCurrentUser(user);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentUser?.id) {
        await api.put(`/users/${currentUser.id}`, currentUser);
      } else {
        await api.post('/users', currentUser);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (error) {
      alert('Failed to save user');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">System Users</h2>
        <button className="btn btn-primary" onClick={handleCreate}>
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="card-body">
        <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : users.map((user) => (
              <tr key={user.id}>
                <td style={{ fontWeight: 500 }}>{user.phone}</td>
                <td>
                  <span className={`badge badge-${user.role}`}>{user.role}</span>
                </td>
                <td>{user.status}</td>
                <td>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => handleEdit(user)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(user.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{currentUser?.id ? 'Edit User' : 'Create User'}</h3>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleSubmit}>
              {!currentUser?.id && (
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input 
                    className="form-input" 
                    value={currentUser?.phone || ''} 
                    onChange={e => setCurrentUser({...currentUser, phone: e.target.value})}
                    required 
                  />
                </div>
              )}
              {!currentUser?.id && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input 
                    type="password"
                    className="form-input" 
                    onChange={e => setCurrentUser({...currentUser, password: e.target.value} as any)}
                    required 
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Role</label>
                <select 
                  className="form-input" 
                  value={currentUser?.role || 'user'} 
                  onChange={e => setCurrentUser({...currentUser, role: e.target.value as any})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-input" 
                  value={currentUser?.status || 'active'} 
                  onChange={e => setCurrentUser({...currentUser, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Save User</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
