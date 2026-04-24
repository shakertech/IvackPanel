import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '8px' }}>Hello, {user?.name}!</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Welcome to your {user?.role} dashboard. Here you can manage your system components.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <div className="card">
          <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Role</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, textTransform: 'capitalize' }}>{user?.role}</p>
        </div>
        
        {user?.role === 'admin' && (
          <>
            <div className="card">
              <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Users</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>--</p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Licenses Active</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>--</p>
            </div>
          </>
        )}

        <div className="card">
          <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Pending Tasks</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>--</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
