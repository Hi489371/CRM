import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { taskService } from '../services';
import '../styles/Tasks.css';

export const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const navigate = useNavigate();

  const fetchTasks = useCallback(async (pageNum) => {
    try {
      setLoading(true);
      const data = await taskService.getTasks({
        page: pageNum,
        limit: 10,
        status: status || undefined,
        priority: priority || undefined,
      });
      setTasks(data.data);
      setPagination(data.pagination);
      setPage(pageNum);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [status, priority]);

  useEffect(() => {
    fetchTasks(1);
  }, [fetchTasks]);

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(id);
        fetchTasks(page);
      } catch (err) {
        setError('Failed to delete task');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await taskService.updateTask(id, { status: newStatus });
      fetchTasks(page);
    } catch (err) {
      setError('Failed to update task');
    }
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h1>Tasks</h1>
        <button className="btn-primary" onClick={() => navigate('/tasks/new')}>
          + Add New Task
        </button>
      </div>

      <div className="filters">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="filter-select"
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">No tasks found</div>
      ) : (
        <>
          <div className="tasks-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td>{task.title}</td>
                    <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`priority-badge ${task.priority}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>{task.assignedTo?.name}</td>
                    <td className="actions">
                      <button
                        className="btn-small btn-secondary"
                        onClick={() => navigate(`/tasks/${task._id}`)}
                      >
                        View
                      </button>
                      <button
                        className="btn-small btn-danger"
                        onClick={() => handleDeleteTask(task._id)}
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
                onClick={() => fetchTasks(p)}
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

export const TaskDetail = () => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id && id !== 'new') {
      fetchTask();
    } else {
      setLoading(false);
    }
  }, [id, fetchTask]);

  const fetchTask = useCallback(async () => {
    try {
      const data = await taskService.getTask(id);
      setTask(data);
    } catch (err) {
      setError('Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleSave = async (formData) => {
    try {
      if (id === 'new') {
        await taskService.createTask(formData);
      } else {
        await taskService.updateTask(id, formData);
      }
      navigate('/tasks');
    } catch (err) {
      setError('Failed to save task');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="task-detail">
      <button className="btn-secondary" onClick={() => navigate('/tasks')}>
        ← Back to Tasks
      </button>
      <TaskForm task={task} onSave={handleSave} error={error} />
    </div>
  );
};

const TaskForm = ({ task, onSave, error }) => {
  const [formData, setFormData] = useState(
    task || {
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      category: 'other',
      status: 'todo',
      tags: [],
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
    <form onSubmit={handleSubmit} className="task-form">
      <h2>{task ? 'Edit Task' : 'New Task'}</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="form-grid">
        <div className="form-group full">
          <label>Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Priority</label>
          <select name="priority" value={formData.priority} onChange={handleChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="form-group">
          <label>Category</label>
          <select name="category" value={formData.category} onChange={handleChange}>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
            <option value="follow-up">Follow-up</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate?.split('T')[0]}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group full">
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Save Task
        </button>
      </div>
    </form>
  );
};
