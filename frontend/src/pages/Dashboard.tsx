import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { CheckSquare, Clock, Zap, CreditCard } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, highPriority: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/tasks');
        const tasks = response.data?.data || response.data || [];
        if (Array.isArray(tasks)) {
          setStats({
            total: tasks.length,
            active: tasks.filter((t: any) => !t.paylink).length,
            completed: tasks.filter((t: any) => !!t.paylink).length,
            highPriority: tasks.filter((t: any) => t.priority === 'high' && !t.paylink).length,
          });
        }
      } catch {
        // ignore
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Tasks', value: stats.total, icon: CheckSquare, color: 'var(--primary)' },
    { label: 'Active', value: stats.active, icon: Clock, color: 'var(--warning)' },
    { label: 'Completed', value: stats.completed, icon: CreditCard, color: 'var(--success)' },
    { label: 'High Priority', value: stats.highPriority, icon: Zap, color: 'var(--error)' },
  ];

  return (
    <div>
      {/* Welcome card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '28px 28px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px' }}>
            Welcome back, <span style={{ background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.phone}</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Here's an overview of your {user?.role === 'admin' ? 'system' : 'task'} activity.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stat-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="stat-card" key={card.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div className="stat-label">{card.label}</div>
                <div style={{ 
                  width: '36px', height: '36px', borderRadius: '8px', 
                  background: `${card.color}15`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <Icon size={18} color={card.color} />
                </div>
              </div>
              <div className="stat-value">{card.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
