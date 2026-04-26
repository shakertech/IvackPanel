import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { 
  Plus, Eye, Trash2, X, Edit, 
  ChevronLeft, ChevronRight, 
  ExternalLink, CheckCircle, CheckSquare, Clock,
  AlertCircle, Search, ListFilter, RefreshCw
} from 'lucide-react';

interface Task {
  id: string;
  phone: string;
  email: string;
  password?: string;
  peoples?: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  result?: string;
  paylink?: string | null;
  user_id?: string;
  license_id?: string;
  proxy_ip?: string;
  proxy_port?: string;
  proxy_username?: string;
  proxy_password?: string;
  created_at?: string;
  updated_at?: string;
}

const ITEMS_PER_PAGE = 80;

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({});

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTasks = useCallback(async () => {
    try {
      const response = await api.get('/tasks');
      const data = response.data?.data || response.data || [];
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Filtering
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.result || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'completed' && task.paylink) ||
      (filterStatus === 'active' && !task.paylink);

    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const showingFrom = filteredTasks.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + ITEMS_PER_PAGE, filteredTasks.length);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  // ---- HANDLERS ----
  const handleCreate = () => {
    setFormData({
      phone: '',
      email: '',
      password: '',
      peoples: '1',
      priority: 'medium',
    });
    setCreateModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setFormData({ ...task });
    setSelectedTask(task);
    setEditModalOpen(true);
  };

  const handleView = (task: Task) => {
    setSelectedTask(task);
    setViewModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tasks', formData);
      setCreateModalOpen(false);
      showToast('Task created successfully', 'success');
      fetchTasks();
    } catch {
      showToast('Failed to create task', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      await api.post(`/tasks/${selectedTask.id}`, formData);
      setEditModalOpen(false);
      showToast('Task updated successfully', 'success');
      fetchTasks();
    } catch {
      showToast('Failed to update task', 'error');
    }
  };

  const handleDelete = async (task: Task) => {
    if (task.paylink) return;
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.post(`/tasks/${task.id}/delete`);
      showToast('Task deleted successfully', 'success');
      fetchTasks();
    } catch {
      showToast('Failed to delete task', 'error');
    }
  };

  const handlePriorityChange = async (task: Task, newPriority: string) => {
    if (task.paylink) return;
    try {
      await api.post(`/tasks/${task.id}/priority`, { priority: newPriority });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, priority: newPriority as Task['priority'] } : t));
      showToast('Priority updated', 'success');
    } catch {
      showToast('Failed to update priority', 'error');
    }
  };

  const isCompleted = (task: Task) => !!task.paylink;

  const getStatusBadge = (task: Task) => {
    if (task.paylink) {
      return (
        <span className="badge badge-completed">
          <CheckCircle size={12} /> Completed
        </span>
      );
    }
    if (task.status === 'active') {
      return (
        <span className="badge badge-active">
          <span className="status-dot" style={{ background: 'var(--success)' }} /> Active
        </span>
      );
    }
    return (
      <span className="badge badge-waiting">
        <Clock size={12} /> {task.status || 'Pending'}
      </span>
    );
  };

  const getResultBadge = (result?: string) => {
    if (!result || result === 'waiting') {
      return <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Waiting</span>;
    }
    return <span style={{ fontSize: '0.8rem' }}>{result}</span>;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Pagination buttons
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div>
      {/* Stats row */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{tasks.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value">{tasks.filter(t => !t.paylink).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{tasks.filter(t => !!t.paylink).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">High Priority</div>
          <div className="stat-value">{tasks.filter(t => t.priority === 'high' && !t.paylink).length}</div>
        </div>
      </div>

      {/* Main table card */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <h2 className="card-title">Task Management</h2>
            
            {/* Search */}
            <div style={{ position: 'relative', maxWidth: '260px', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                className="form-input"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '0.82rem', padding: '7px 12px 7px 34px' }}
              />
            </div>

            {/* Filter */}
            <div style={{ position: 'relative' }}>
              <ListFilter size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <select
                className="form-select"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '0.82rem', padding: '7px 36px 7px 32px', minWidth: '130px' }}
              >
                <option value="all">All Tasks</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost" onClick={() => { setLoading(true); fetchTasks(); }} title="Refresh tasks" disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spinner' : ''} />
            </button>
            <button className="btn btn-primary" onClick={handleCreate}>
              <Plus size={16} /> New Task
            </button>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              Loading tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <CheckSquare size={24} />
              </div>
              <div className="empty-state-title">No tasks found</div>
              <div className="empty-state-desc">
                {searchQuery || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Create your first task to get started'}
              </div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Phone / Email</th>
                      <th>People</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Result</th>
                      <th>Proxy</th>
                      <th>Payment</th>                  
                      <th style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTasks.map((task, index) => (
                      <tr key={task.id} className={isCompleted(task) ? 'completed-row' : ''}>
                        <td style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                          {startIndex + index + 1}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{task.phone}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.email}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{task.peoples || '1'}</span>
                        </td>
                        <td>
                          <select
                            className={`priority-select priority-${task.priority || 'medium'}`}
                            value={task.priority || 'medium'}
                            onChange={e => handlePriorityChange(task, e.target.value)}
                            disabled={isCompleted(task)}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </td>
                        <td>{getStatusBadge(task)}</td>
                        <td>{getResultBadge(task.result)}</td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                            {task.proxy_ip || <span style={{ color: 'var(--text-dim)' }}>—</span>}
                          </span>
                        </td>
                        <td>
                          {task.paylink ? (
                            <button
                              className="btn-pay"
                              onClick={() => window.open(task.paylink!, '_blank')}
                            >
                              <ExternalLink size={13} /> Pay Now
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>—</span>
                          )}
                        </td>
                     
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              className="btn-icon" 
                              onClick={() => handleView(task)}
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                            {!isCompleted(task) && (
                              <>
                                <button 
                                  className="btn-icon" 
                                  onClick={() => handleEdit(task)}
                                  title="Edit task"
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  className="btn-icon danger" 
                                  onClick={() => handleDelete(task)}
                                  title="Delete task"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                            {isCompleted(task) && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-dim)', paddingLeft: '4px' }}>
                                <CheckCircle size={13} />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <div className="pagination-info">
                  Showing <strong>{showingFrom}</strong> to <strong>{showingTo}</strong> of <strong>{filteredTasks.length}</strong> tasks
                </div>
                <div className="pagination-controls">
                  <button
                    className="page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {getPageNumbers().map((page, i) => (
                    typeof page === 'string' ? (
                      <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text-dim)' }}>…</span>
                    ) : (
                      <button
                        key={page}
                        className={`page-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    )
                  ))}
                  <button
                    className="page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== CREATE MODAL ===== */}
      {createModalOpen && (
        <div className="modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Task</h3>
              <button className="btn-icon" onClick={() => setCreateModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="01XXXXXXXXX" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="user@email.com" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Account password" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">People Count</label>
                    <input className="form-input" value={formData.peoples || '1'} onChange={e => setFormData({ ...formData, peoples: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={formData.priority || 'medium'} onChange={e => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proxy IP</label>
                    <input className="form-input" value={formData.proxy_ip || ''} onChange={e => setFormData({ ...formData, proxy_ip: e.target.value })} placeholder="192.168.1.1" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proxy Port</label>
                    <input className="form-input" value={formData.proxy_port || ''} onChange={e => setFormData({ ...formData, proxy_port: e.target.value })} placeholder="8080" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proxy Username</label>
                    <input className="form-input" value={formData.proxy_username || ''} onChange={e => setFormData({ ...formData, proxy_username: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proxy Password</label>
                    <input type="password" className="form-input" value={formData.proxy_password || ''} onChange={e => setFormData({ ...formData, proxy_password: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {editModalOpen && selectedTask && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Task</h3>
              <button className="btn-icon" onClick={() => setEditModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">People Count</label>
                    <input className="form-input" value={formData.peoples || '1'} onChange={e => setFormData({ ...formData, peoples: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={formData.priority || 'medium'} onChange={e => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <input className="form-input" value={formData.status || ''} onChange={e => setFormData({ ...formData, status: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proxy IP</label>
                    <input className="form-input" value={formData.proxy_ip || ''} onChange={e => setFormData({ ...formData, proxy_ip: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proxy Port</label>
                    <input className="form-input" value={formData.proxy_port || ''} onChange={e => setFormData({ ...formData, proxy_port: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proxy Username</label>
                    <input className="form-input" value={formData.proxy_username || ''} onChange={e => setFormData({ ...formData, proxy_username: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proxy Password</label>
                    <input type="password" className="form-input" value={formData.proxy_password || ''} onChange={e => setFormData({ ...formData, proxy_password: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== VIEW DETAIL MODAL ===== */}
      {viewModalOpen && selectedTask && (
        <div className="modal-overlay" onClick={() => setViewModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Task Details</h3>
              <button className="btn-icon" onClick={() => setViewModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Phone</div>
                  <div className="detail-value">{selectedTask.phone}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Email</div>
                  <div className="detail-value">{selectedTask.email}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Password</div>
                  <div className="detail-value">{selectedTask.password || '—'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">People Count</div>
                  <div className="detail-value">{selectedTask.peoples || '1'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Priority</div>
                  <div className="detail-value">
                    <span className={`badge badge-${selectedTask.priority || 'medium'}`}>
                      {(selectedTask.priority || 'medium').charAt(0).toUpperCase() + (selectedTask.priority || 'medium').slice(1)}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Status</div>
                  <div className="detail-value">{getStatusBadge(selectedTask)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Result</div>
                  <div className="detail-value">{selectedTask.result || 'Waiting'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Proxy</div>
                  <div className="detail-value">{selectedTask.proxy_ip ? `${selectedTask.proxy_ip}:${selectedTask.proxy_port || ''}` : 'None'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Created</div>
                  <div className="detail-value">{formatDate(selectedTask.created_at)}</div>
                </div>
              </div>

              {selectedTask.paylink && (
                <div style={{ marginTop: '20px', padding: '16px', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--success)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={15} /> Task Completed
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Payment link is available</div>
                    </div>
                    <button
                      className="btn-pay"
                      onClick={() => window.open(selectedTask.paylink!, '_blank')}
                    >
                      <ExternalLink size={14} /> Pay Now
                    </button>
                  </div>
                </div>
              )}

              {!selectedTask.paylink && (
                <div style={{ marginTop: '20px', padding: '16px', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', fontSize: '0.85rem', fontWeight: 500 }}>
                    <AlertCircle size={15} /> Task is in progress — no payment link yet
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setViewModalOpen(false)}>Close</button>
              {!isCompleted(selectedTask) && (
                <button className="btn btn-primary" onClick={() => { setViewModalOpen(false); handleEdit(selectedTask); }}>
                  <Edit size={14} /> Edit Task
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={16} color="var(--success)" /> : <AlertCircle size={16} color="var(--error)" />}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Tasks;
