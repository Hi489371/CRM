import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services';
import '../styles/Dashboard.css';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {error && <div className="error-banner">{error}</div>}

      <div className="stats-grid">
        <StatCard
          title="Total Clients"
          value={stats?.overview?.totalClients}
          color="blue"
          onClick={() => navigate('/clients')}
        />
        <StatCard
          title="Active Clients"
          value={stats?.overview?.activeClients}
          color="green"
          onClick={() => navigate('/clients?status=active')}
        />
        <StatCard
          title="Total Leads"
          value={stats?.overview?.totalLeads}
          color="orange"
          onClick={() => navigate('/leads')}
        />
        <StatCard
          title="New Leads"
          value={stats?.overview?.newLeads}
          color="purple"
          onClick={() => navigate('/leads?status=new')}
        />
        <StatCard
          title="Total Tasks"
          value={stats?.overview?.totalTasks}
          color="yellow"
          onClick={() => navigate('/tasks')}
        />
        <StatCard
          title="Completed Tasks"
          value={stats?.overview?.completedTasks}
          color="teal"
          onClick={() => navigate('/tasks?status=completed')}
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overview?.overdueTasks}
          color="red"
          onClick={() => navigate('/tasks?status=overdue')}
        />
        <StatCard
          title="Total Revenue"
          value={`$${(stats?.revenue?.totalClientRevenue || 0).toLocaleString()}`}
          color="green"
        />
      </div>

      <div className="dashboard-section">
        <h2>Recent Clients</h2>
        <div className="client-list">
          {stats?.recentClients?.map((client) => (
            <div key={client._id} className="client-item" onClick={() => navigate(`/clients/${client._id}`)}>
              <h4>{client.companyName}</h4>
              <p>{client.contactName}</p>
              <span className={`status ${client.status}`}>{client.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Recent Leads</h2>
        <div className="lead-list">
          {stats?.recentLeads?.map((lead) => (
            <div key={lead._id} className="lead-item" onClick={() => navigate(`/leads/${lead._id}`)}>
              <h4>{lead.firstName} {lead.lastName}</h4>
              <p>{lead.company}</p>
              <span className={`status ${lead.status}`}>{lead.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color, onClick }) => (
  <div className={`stat-card stat-${color}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <h3>{title}</h3>
    <p className="stat-value">{value}</p>
  </div>
);
