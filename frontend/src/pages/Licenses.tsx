import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2, X } from 'lucide-react';

interface License {
  id: number;
  license_key: string;
  machine?: string;
  license_type: string;
  status: string;
  expiry_date: string;
}

const Licenses = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentLicense, setCurrentLicense] = useState<Partial<License> | null>(null);

  const fetchLicenses = async () => {
    try {
      const response = await api.get('/licenses');
      setLicenses(response.data);
    } catch (error) {
      console.error('Error fetching licenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleCreate = () => {
    setCurrentLicense({ 
      license_key: '', 
      machine: '', 
      license_type: 'trial', 
      status: 'active', 
      expiry_date: '' 
    });
    setModalOpen(true);
  };

  const handleEdit = (lic: License) => {
    setCurrentLicense(lic);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Revoke this license?')) {
      try {
        await api.delete(`/licenses/${id}`);
        fetchLicenses();
      } catch (error) {
        alert('Failed to revoke license');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentLicense?.id) {
        await api.put(`/licenses/${currentLicense.id}`, currentLicense);
      } else {
        await api.post('/licenses', currentLicense);
      }
      setModalOpen(false);
      fetchLicenses();
    } catch (error) {
      alert('Failed to save license');
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>License Keys</h2>
        <button className="btn btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleCreate}>
          <Plus size={18} /> Generate License
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>License Key</th>
              <th>Type</th>
              <th>Machine</th>
              <th>Status</th>
              <th>Expiry</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : licenses.map((lic) => (
              <tr key={lic.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>{lic.license_key}</td>
                <td>
                  <span style={{ textTransform: 'capitalize' }}>{lic.license_type}</span>
                </td>
                <td style={{ fontSize: '0.75rem' }}>{lic.machine || 'Any'}</td>
                <td>
                  <span className={`badge`} style={{ 
                    background: lic.status === 'active' ? '#dcfce7' : '#fee2e2',
                    color: lic.status === 'active' ? '#166534' : '#991b1b',
                    textTransform: 'capitalize'
                  }}>
                    {lic.status}
                  </span>
                </td>
                <td>{new Date(lic.expiry_date).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => handleEdit(lic)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(lic.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}>
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
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{currentLicense?.id ? 'Edit License' : 'Generate License'}</h3>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">License Key</label>
                <input className="form-input" value={currentLicense?.license_key || ''} onChange={e => setCurrentLicense({...currentLicense, license_key: e.target.value})} placeholder="IVACK-XXXX-XXXX" required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">License Type</label>
                  <select 
                    className="form-input" 
                    value={currentLicense?.license_type || 'trial'} 
                    onChange={e => setCurrentLicense({...currentLicense, license_type: e.target.value})}
                  >
                    <option value="trial">Trial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input" 
                    value={currentLicense?.status || 'active'} 
                    onChange={e => setCurrentLicense({...currentLicense, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Machine ID (Optional)</label>
                <input className="form-input" value={currentLicense?.machine || ''} onChange={e => setCurrentLicense({...currentLicense, machine: e.target.value})} placeholder="HWID-XXXXXXXX" />
              </div>

              <div className="form-group">
                <label className="form-label">Expiration Date</label>
                <input type="date" className="form-input" value={currentLicense?.expiry_date ? currentLicense.expiry_date.split('T')[0] : ''} onChange={e => setCurrentLicense({...currentLicense, expiry_date: e.target.value})} required />
              </div>

              <button type="submit" className="btn btn-primary">
                {currentLicense?.id ? 'Update License' : 'Generate License'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Licenses;
