import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { clientService } from '../services';
import '../styles/Clients.css';

export const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) setStatus(statusParam);
    fetchClients(1);
  }, [searchParams]);

  useEffect(() => {
    fetchClients(1);
  }, [search, status]);

  const fetchClients = async (pageNum) => {
    try {
      setLoading(true);
      const data = await clientService.getClients({
        page: pageNum,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
      });
      setClients(data.data);
      setPagination(data.pagination);
      setPage(pageNum);
    } catch (err) {
      setError('Failed to load clients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await clientService.deleteClient(id);
        fetchClients(page);
      } catch (err) {
        setError('Failed to delete client');
      }
    }
  };

  return (
    <div className="clients-container">
      <div className="clients-header">
        <h1>Clients</h1>
        <button className="btn-primary" onClick={() => navigate('/clients/new')}>
          + Add New Client
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="prospect">Prospect</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : clients.length === 0 ? (
        <div className="empty-state">No clients found</div>
      ) : (
        <>
          <div className="clients-table">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client._id}>
                    <td>{client.companyName}</td>
                    <td>{client.contactName}</td>
                    <td>{client.email}</td>
                    <td>{client.phone}</td>
                    <td>
                      <span className={`status-badge ${client.status}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        className="btn-small btn-secondary"
                        onClick={() => navigate(`/clients/${client._id}`)}
                      >
                        View
                      </button>
                      <button
                        className="btn-small btn-danger"
                        onClick={() => handleDeleteClient(client._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`page-button ${p === page ? 'active' : ''}`}
                onClick={() => fetchClients(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const ClientDetail = () => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id && id !== 'new') {
      fetchClient();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchClient = async () => {
    try {
      const data = await clientService.getClient(id);
      setClient(data);
    } catch (err) {
      setError('Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (id === 'new') {
        await clientService.createClient(formData);
      } else {
        await clientService.updateClient(id, formData);
      }
      navigate('/clients');
    } catch (err) {
      setError('Failed to save client');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="client-detail">
      <button className="btn-secondary" onClick={() => navigate('/clients')}>
        ← Back to Clients
      </button>
      <ClientForm client={client} onSave={handleSave} error={error} />
    </div>
  );
};

const ClientForm = ({ client, onSave, error }) => {
  const [formData, setFormData] = useState(
    client || {
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      website: '',
      address: {},
      industry: '',
      status: 'prospect',
      notes: '',
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="client-form">
      <h2>{client ? 'Edit Client' : 'New Client'}</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="form-grid">
        <div className="form-group">
          <label>Company Name *</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Contact Name *</label>
          <input
            type="text"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Website</label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Industry</label>
          <input
            type="text"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="prospect">Prospect</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="form-group full">
        <label>Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="4"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Save Client
        </button>
      </div>
    </form>
  );
};
