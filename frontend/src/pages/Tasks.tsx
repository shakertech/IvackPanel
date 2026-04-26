import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Eye, Trash2, X } from 'lucide-react';

interface Task {
  id: string;
  phone: string;
  email: string;
  password?: string;
  peoples?: string;
  status: string;
  result?: string;
  paylink?: string;
  user_id?: string;
}

const Tasks = () => {

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task> | null>(null);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreate = () => {
    setCurrentTask({
      phone: '',
      email: '',
      password: '',
      peoples: '1',
      status: 'open',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this task?')) {
      try {
        await api.delete(`/tasks/${id}`);
        fetchTasks();
      } catch (error) {
        alert('Failed to delete task');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentTask?.id) {
        await api.put(`/tasks/${currentTask.id}`, currentTask);
      } else {
        await api.post('/tasks', currentTask);
      }
      setModalOpen(false);
      fetchTasks();
    } catch (error) {
      alert('Failed to save task');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'var(--success)';
      case 'in-progress': return 'var(--primary)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>System Tasks</h2>
        <button className="btn btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleCreate}>
          <Plus size={18} /> New Task
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
               <th>Phone / Email</th>
              <th>People Count</th>
              <th>Status</th>
              <th>Result</th>
              <th>Paylink</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
             {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>No tasks found</td></tr>
            ) : tasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{task.phone}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.email}</div>
                </td>
                <td>{task.peoples}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: getStatusColor(task.status) }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(task.status) }}></div>
                     {task.status}
                  </div>
                </td>
                <td style={{ fontSize: '0.875rem' }}>{task.result || '---'}</td>
                 <td>
                  {task.paylink ? (
                    <a href={task.paylink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                      <Eye size={18} />
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>N/A</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => handleDelete(task.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>New Task</h3>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={currentTask?.phone || ''} onChange={e => setCurrentTask({ ...currentTask, phone: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={currentTask?.email || ''} onChange={e => setCurrentTask({ ...currentTask, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" value={currentTask?.password || ''} onChange={e => setCurrentTask({ ...currentTask, password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">People Count</label>
                <input className="form-input" value={currentTask?.peoples || '1'} onChange={e => setCurrentTask({ ...currentTask, peoples: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }}>Save Task</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
