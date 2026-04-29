import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/axios';
import { 
  Plus, Eye, Trash2, X, Edit, 
  ChevronLeft, ChevronRight, 
  ExternalLink, CheckCircle, CheckSquare, Clock,
  AlertCircle, Search, ListFilter, RefreshCw,
  Upload, FileText, Smartphone, Copy
} from 'lucide-react';

interface TaskFile {
  name: string;
  path: string;
  url: string;
}

interface Task {
  id: string;
  phone: string;
  email: string;
  password?: string;
  peoples?: number;
  priority: 'low' | 'medium' | 'high';
  files?: TaskFile[];
  ivacCenter?: string;
  mission?: string;
  visatype?: string;
  status: string;
  result?: string;
  paylink?: string | null;
  success_at?: string;
  device_last_seen?: string | null;
  device_online?: boolean;
  user_id?: string;
  license_id?: string;
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

  // File upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks', {
        params: {
          status: filterStatus,
          search: searchQuery
        }
      });
      const data = response.data?.data || response.data || [];
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 400);
    return () => clearTimeout(timer);
  }, [filterStatus, searchQuery, fetchTasks]);

  // Filtering is now done on the backend
  const filteredTasks = tasks;

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
    setFormData({ phone: '', email: '', password: '', priority: 'medium' });
    setSelectedFiles([]);
    setCreateModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setFormData({ ...task });
    setSelectedTask(task);
    setSelectedFiles([]);
    setEditModalOpen(true);
  };

  const handleView = (task: Task) => {
    setSelectedTask(task);
    setViewModalOpen(true);
  };

  // File helpers
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter(f => f.type === 'application/pdf');
    setSelectedFiles(prev => [...prev, ...pdfs]);
  };
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('phone', formData.phone || '');
      fd.append('email', formData.email || '');
      fd.append('password', formData.password || '');
      fd.append('priority', formData.priority || 'medium');
      selectedFiles.forEach(f => fd.append('files[]', f));
      await api.post('/tasks', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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
      const fd = new FormData();
      if (formData.phone) fd.append('phone', formData.phone);
      if (formData.email) fd.append('email', formData.email);
      if (formData.password) fd.append('password', formData.password);
      if (formData.priority) fd.append('priority', formData.priority);
      selectedFiles.forEach(f => fd.append('files[]', f));
      await api.post(`/tasks/${selectedTask.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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



  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const timeAgo = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
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
      <div className="stat-grid" style={{ marginBottom: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="stat-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="stat-label" style={{ marginBottom: 0 }}>Total Tasks</div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>{tasks.length}</div>
        </div>
        <div className="stat-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="stat-label" style={{ marginBottom: 0 }}>Active</div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>{tasks.filter(t => !t.paylink).length}</div>
        </div>
        <div className="stat-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="stat-label" style={{ marginBottom: 0 }}>Completed</div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>{tasks.filter(t => !!t.paylink).length}</div>
        </div>
        <div className="stat-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="stat-label" style={{ marginBottom: 0 }}>High Priority</div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>{tasks.filter(t => t.priority === 'high' && !t.paylink).length}</div>
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
                <option value="active">Active (Pending Pay)</option>
                <option value="completed">Completed (Paid)</option>
                <option value="online">Online Devices</option>
                <option value="offline">Offline Devices</option>
                <option value="pending">Status: Pending</option>
                <option value="success">Status: Success</option>
                <option value="error">Status: Error</option>
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
                      <th>Mission / Visa</th>
                      <th>Files</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Device</th>
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
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{task.mission || '—'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.visatype || '—'}</div>
                        </td>
                        <td>
                          {task.files && task.files.length > 0 ? (
                            <span className="files-badge"><FileText size={11} /> {task.files.length}</span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>—</span>
                          )}
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
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            {getStatusBadge(task)}
                            {task.result && task.result !== 'waiting' && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.3, maxWidth: '140px' }}>
                                {task.result}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          {task.device_last_seen ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className={`device-dot ${task.device_online ? 'online' : 'offline'}`} />
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: task.device_online ? 'var(--success)' : 'var(--text-dim)' }}>
                                  {task.device_online ? 'Online' : 'Offline'}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{timeAgo(task.device_last_seen)}</div>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Smartphone size={12} /> No device
                            </span>
                          )}
                        </td>
                        <td>
                          {task.paylink ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                className="btn-pay"
                                style={{ padding: '5px 10px' }}
                                onClick={() => window.open(task.paylink!, '_blank')}
                              >
                                <ExternalLink size={13} /> Pay
                              </button>
                              <button
                                className="btn-icon"
                                style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-glow)', width: '30px', height: '30px' }}
                                onClick={() => {
                                  navigator.clipboard.writeText(task.paylink!);
                                  showToast('Link copied!', 'success');
                                }}
                                title="Copy Link"
                              >
                                <Copy size={13} />
                              </button>
                            </div>
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
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={formData.priority || 'medium'} onChange={e => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '8px' }}>
                  <label className="form-label">PDF Documents</label>
                  <input type="file" ref={fileInputRef} accept=".pdf" multiple style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
                  <div
                    className={`file-drop-zone${dragOver ? ' drag-over' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                  >
                    <div className="file-drop-zone-icon"><Upload size={28} /></div>
                    <div className="file-drop-zone-text">Click or drag PDF files here</div>
                    <div className="file-drop-zone-hint">Max 10MB per file · PDF only</div>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="file-list">
                      {selectedFiles.map((f, i) => (
                        <div className="file-item" key={i}>
                          <div className="file-item-name"><FileText size={14} /> <span>{f.name}</span></div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="file-item-size">{formatFileSize(f.size)}</span>
                            <button type="button" className="file-item-remove" onClick={e => { e.stopPropagation(); removeFile(i); }}><X size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={formData.priority || 'medium'} onChange={e => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                {/* Existing files */}
                {selectedTask?.files && selectedTask.files.length > 0 && (
                  <div className="form-group" style={{ marginTop: '8px' }}>
                    <label className="form-label">Existing Files</label>
                    <div className="file-list">
                      {selectedTask.files.map((f, i) => (
                        <div className="file-item" key={i}>
                          <div className="file-item-name"><FileText size={14} /> <span>{f.name}</span></div>
                          <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: 'var(--primary)' }}>View</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Upload new files */}
                <div className="form-group" style={{ marginTop: '8px' }}>
                  <label className="form-label">Add More PDFs</label>
                  <input type="file" accept=".pdf" multiple style={{ display: 'none' }} id="edit-file-input" onChange={e => addFiles(e.target.files)} />
                  <div className="file-drop-zone" onClick={() => document.getElementById('edit-file-input')?.click()}>
                    <div className="file-drop-zone-icon"><Upload size={24} /></div>
                    <div className="file-drop-zone-text">Click to add PDF files</div>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="file-list">
                      {selectedFiles.map((f, i) => (
                        <div className="file-item" key={i}>
                          <div className="file-item-name"><FileText size={14} /> <span>{f.name}</span></div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="file-item-size">{formatFileSize(f.size)}</span>
                            <button type="button" className="file-item-remove" onClick={() => removeFile(i)}><X size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <div className="detail-label">Mission</div>
                  <div className="detail-value">{selectedTask.mission || '—'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Visa Type</div>
                  <div className="detail-value">{selectedTask.visatype || '—'}</div>
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
                  <div className="detail-label">Device Status</div>
                  <div className="detail-value">
                    {selectedTask.device_last_seen ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`device-dot ${selectedTask.device_online ? 'online' : 'offline'}`} />
                        <div>
                          <span style={{ fontWeight: 600, color: selectedTask.device_online ? 'var(--success)' : 'var(--error)' }}>
                            {selectedTask.device_online ? 'Online' : 'Offline'}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            Last seen: {timeAgo(selectedTask.device_last_seen)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>No device connected</span>
                    )}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Created</div>
                  <div className="detail-value">{formatDate(selectedTask.created_at)}</div>
                </div>
              </div>

              {/* Files Section */}
              {selectedTask.files && selectedTask.files.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div className="detail-label" style={{ marginBottom: '8px' }}>Uploaded Documents ({selectedTask.files.length})</div>
                  <div className="file-list">
                    {selectedTask.files.map((f, i) => (
                      <div className="file-item" key={i}>
                        <div className="file-item-name"><FileText size={14} /> <span>{f.name}</span></div>
                        <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                          <ExternalLink size={12} style={{ marginRight: '4px' }} />View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
