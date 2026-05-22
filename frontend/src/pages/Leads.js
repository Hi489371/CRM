import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { leadService } from '../services';
import LeadDetailView from './LeadDetailView';
import '../styles/Leads.css';

export const Leads = () => {
  const [leads, setLeads] = useState([]);
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
    fetchLeads(1);
  }, [searchParams]);

  useEffect(() => {
    fetchLeads(1);
  }, [search, status]);

  const fetchLeads = async (pageNum) => {
    try {
      setLoading(true);
      const data = await leadService.getLeads({
        page: pageNum,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
      });
      setLeads(data.data);
      setPagination(data.pagination);
      setPage(pageNum);
    } catch (err) {
      setError('Failed to load leads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await leadService.deleteLead(id);
        fetchLeads(page);
      } catch (err) {
        setError('Failed to delete lead');
      }
    }
  };

  return (
    <div className="leads-container">
      <div className="leads-header">
        <h1>Leads</h1>
        <button className="btn-primary" onClick={() => navigate('/leads/new')}>
          + Add New Lead
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search leads..."
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
          <option value="new">New</option>
          <option value="email_sent">Email Sent</option>
          <option value="interested">Interested</option>
          <option value="negotiating">Negotiating</option>
          <option value="meeting_scheduled">Meeting Scheduled</option>
          <option value="follow_up">Follow Up</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="no_response">No Response</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal">Proposal</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : leads.length === 0 ? (
        <div className="empty-state">No leads found</div>
      ) : (
        <>
          <div className="leads-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Probability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id}>
                    <td>{lead.firstName} {lead.lastName}</td>
                    <td>{lead.email}</td>
                    <td>{lead.company}</td>
                    <td>
                      <span className={`status-badge ${lead.status}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>${lead.value?.toLocaleString()}</td>
                    <td>{lead.probability}%</td>
                    <td className="actions">
                      <button
                        className="btn-small btn-secondary"
                        onClick={() => navigate(`/leads/${lead._id}`)}
                      >
                        View
                      </button>
                      <button
                        className="btn-small btn-danger"
                        onClick={() => handleDeleteLead(lead._id)}
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
                onClick={() => fetchLeads(p)}
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

export const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  if (id && id !== 'new') {
    return <LeadDetailView />;
  }

  const handleSave = async (formData) => {
    try {
      if (id === 'new') {
        await leadService.createLead(formData);
      } else {
        await leadService.updateLead(id, formData);
      }
      navigate('/leads');
    } catch (err) {
      setError('Failed to save lead');
    }
  };

  return (
    <div className="lead-detail">
      <button className="btn-secondary" onClick={() => navigate('/leads')}>
        ← Back to Leads
      </button>
      <LeadForm lead={null} onSave={handleSave} error={error} />
    </div>
  );
};

const LeadForm = ({ lead, onSave, error }) => {
  const [formData, setFormData] = useState(
    lead || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      source: 'other',
      status: 'new',
      value: 0,
      probability: 0,
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
    <form onSubmit={handleSubmit} className="lead-form">
      <h2>{lead ? 'Edit Lead' : 'New Lead'}</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="form-grid">
        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
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
          <label>Company</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Source</label>
          <select name="source" value={formData.source} onChange={handleChange}>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="social-media">Social Media</option>
            <option value="email">Email</option>
            <option value="event">Event</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="new">New</option>
            <option value="email_sent">Email Sent</option>
            <option value="interested">Interested</option>
            <option value="negotiating">Negotiating</option>
            <option value="meeting_scheduled">Meeting Scheduled</option>
            <option value="follow_up">Follow Up</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="no_response">No Response</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="converted">Converted</option>
          </select>
        </div>
        <div className="form-group">
          <label>Deal Value ($)</label>
          <input
            type="number"
            name="value"
            value={formData.value}
            onChange={handleChange}
            min="0"
          />
        </div>
        <div className="form-group">
          <label>Probability (%)</label>
          <input
            type="number"
            name="probability"
            value={formData.probability}
            onChange={handleChange}
            min="0"
            max="100"
          />
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
          Save Lead
        </button>
      </div>
    </form>
  );
};
