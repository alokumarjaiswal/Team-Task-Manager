import { useState, useEffect } from 'react';
import { Shield, Mail, Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import { authAPI, userAPI } from '../services/api';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      const { data } = await userAPI.getAll();
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team members');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: newUser } = await authAPI.signup({
        name: form.name,
        email: form.email,
        password: form.password,
        // role intentionally excluded — server always creates as 'member'
      });
      // If admin role was selected, promote via the role endpoint
      if (form.role === 'admin') {
        await userAPI.setRole(newUser._id, 'admin');
      }
      toast.success(`${form.name} added successfully!`);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'member' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }
    try {
      await userAPI.delete(userId);
      toast.success(`${userName} deleted successfully!`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete member');
    }
  };

  return (
    <div>
      <div className="flex-between" style={{marginBottom: '24px'}}>
        <h2>Team Members</h2>
        {currentUser?.role === 'admin' && (
          <button className="btn" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Member
          </button>
        )}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px'}}>
        {users.map(u => (
          <div key={u._id} className="glass-panel" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative'}}>
            {currentUser?.role === 'admin' && currentUser?._id !== u._id && (
              <button
                onClick={() => handleDeleteMember(u._id, u.name)}
                style={{
                  position: 'absolute', top: '12px', right: '12px', background: 'var(--danger)',
                  color: 'white', border: 'none', borderRadius: '6px', padding: '6px 8px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '12px', fontWeight: '500', transition: 'opacity 0.2s'
                }}
                title="Delete member"
              >
                <Trash2 size={14} />
              </button>
            )}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: u.role === 'admin' ? 'linear-gradient(135deg, var(--warning), var(--primary))' : 'var(--primary)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              marginBottom: '16px', fontSize: '24px', fontWeight: 'bold', color: 'white'
            }}>
              {u.name.charAt(0).toUpperCase()}
            </div>
            <h3 style={{marginBottom: '4px'}}>
              {u.name} {currentUser?._id === u._id && <span style={{fontSize: '12px', color: 'var(--success)'}}>(You)</span>}
            </h3>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px'}}>
              <Mail size={14} /> {u.email}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              color: u.role === 'admin' ? 'var(--warning)' : 'var(--text-primary)',
              fontSize: '13px', fontWeight: '600', marginTop: '8px',
              background: u.role === 'admin' ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.05)',
              padding: '4px 12px', borderRadius: '20px'
            }}>
              <Shield size={13} /> {u.role.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="glass-panel"
            style={{width: '100%', maxWidth: '420px', position: 'relative'}}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)'}}
            ><X size={20} /></button>
            <h3 style={{marginBottom: '20px'}}>Add New Member</h3>
            <form onSubmit={handleAddMember}>
              <input
                type="text" placeholder="Full Name" required
                value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              />
              <input
                type="email" placeholder="Email Address" required
                value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              />
              <input
                type="password" placeholder="Password" required minLength={8}
                value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex-between" style={{marginTop: '20px'}}>
                <button type="button" className="btn btn-danger" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
