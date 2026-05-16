import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, AlertCircle, LayoutDashboard, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Label } from 'recharts';
import { getSocket, releaseSocket } from '../services/socket';
import { dashboardAPI, userAPI } from '../services/api';

export default function DashboardHome() {
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, usersRes] = await Promise.all([
        dashboardAPI.get(),
        userAPI.getAll(),
      ]);
      setDashboardData(dashRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    }
  }, []);

  useEffect(() => {
    fetchData();
    const socket = getSocket();
    socket.on('taskUpdated', fetchData);
    return () => {
      socket.off('taskUpdated', fetchData);
      releaseSocket();
    };
  }, [fetchData]);

  // Destructure dashboard response fields
  const {
    tasksByStatus = {},
    totalTasks = 0,
    projectCount = 0,
    teamSize = 0,
    overdueTasks = 0,
    tasksByProject = [],
    recentActivity = [],
  } = dashboardData || {};

  // Derive counts from tasksByStatus (task 8.2)
  const todoCount = tasksByStatus.todo ?? 0;
  const inProgressCount = tasksByStatus['in-progress'] ?? 0;
  const doneCount = tasksByStatus.done ?? 0;

  return (
    <div>
      <h2 style={{marginBottom: '24px'}}>Dashboard Overview</h2>

      {/* Stat Cards */}
      <div className="dashboard-stat-grid">
        <div className="dashboard-stat-card dashboard-stat-card--accent">
          <div className="dashboard-stat-card__body">
            <div className="dashboard-stat-card__value">{totalTasks}</div>
            <div className="dashboard-stat-card__label">Total Tasks</div>
          </div>
          <AlertCircle size={16} color="var(--color-accent-emphasis)" aria-hidden="true" />
        </div>
        <div className="dashboard-stat-card dashboard-stat-card--success">
          <div className="dashboard-stat-card__body">
            <div className="dashboard-stat-card__value">{doneCount}</div>
            <div className="dashboard-stat-card__label">Completed</div>
          </div>
          <CheckCircle size={16} color="var(--color-success-emphasis)" aria-hidden="true" />
        </div>
        <div className="dashboard-stat-card dashboard-stat-card--attention">
          <div className="dashboard-stat-card__body">
            <div className="dashboard-stat-card__value">{inProgressCount}</div>
            <div className="dashboard-stat-card__label">In Progress</div>
          </div>
          <Clock size={16} color="var(--color-attention-fg)" aria-hidden="true" />
        </div>
      </div>

      {/* GRAPHS SECTION */}
      <div className="dashboard-charts-grid">
        {/* Tasks by Project Bar Chart */}
        <div className="glass-panel" style={{display: 'flex', flexDirection: 'column', minHeight: '300px'}}>
          <h3 className="dashboard-section-title">
            <LayoutDashboard size={18} color="var(--primary)" /> Project Distribution
          </h3>
          <div style={{flex: 1, minWidth: 0, height: 240}}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={tasksByProject.map(p => ({
                  name: p.projectName.length > 15 ? p.projectName.substring(0, 15) + '...' : p.projectName,
                  Tasks: p.taskCount,
                }))}
                margin={{top: 10, right: 10, left: -20, bottom: 0}}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                <Bar dataKey="Tasks" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Status Overview */}
        <div className="glass-panel" style={{display: 'flex', flexDirection: 'column', minHeight: '300px'}}>
          <h3 className="dashboard-section-title">
            <TrendingUp size={18} color="var(--warning)" /> Task Status Overview
          </h3>
          <div style={{flex: 1, minWidth: 0, height: 240}}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={[
                  { status: 'To Do', Count: todoCount },
                  { status: 'In Progress', Count: inProgressCount },
                  { status: 'Done', Count: doneCount },
                  { status: 'Overdue', Count: overdueTasks },
                ]}
                margin={{top: 10, right: 10, left: -20, bottom: 0}}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                <XAxis dataKey="status" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
                <Bar dataKey="Count" fill="var(--warning)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{marginBottom: '32px'}}>
        <div style={{display: 'flex', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap'}}>
          {/* Left: description + stats */}
          <div style={{flex: '1', minWidth: '220px'}}>
            <h3 style={{marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <PieChartIcon size={18} color="var(--success)" /> Task Distribution
            </h3>
            <p style={{color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6'}}>
              A complete breakdown of your team's current tasks and their overall progress.
            </p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {[
                { label: 'To Do', value: todoCount, color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
                { label: 'In Progress', value: inProgressCount, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                { label: 'Done', value: doneCount, color: '#22C55E', bg: 'rgba(34,197,94,0.12)' }
              ].map(item => (
                <div key={item.label} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', background: item.bg}}>
                  <div style={{width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0}} />
                  <span style={{flex: 1, fontSize: '14px', fontWeight: '500'}}>{item.label}</span>
                  <span style={{fontWeight: 'bold', fontSize: '20px', color: item.color}}>{item.value}</span>
                  <span style={{fontSize: '12px', color: 'var(--text-secondary)', minWidth: '36px', textAlign: 'right'}}>
                    {totalTasks > 0 ? Math.round((item.value / totalTasks) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Pie chart */}
          <div style={{flex: '1', minWidth: '280px', height: '280px'}}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'To Do', value: todoCount || (totalTasks === 0 ? 1 : 0), color: '#9CA3AF' },
                    { name: 'In Progress', value: inProgressCount, color: '#F59E0B' },
                    { name: 'Done', value: doneCount, color: '#22C55E' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {[
                    { color: '#9CA3AF' },
                    { color: '#F59E0B' },
                    { color: '#22C55E' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      const { cx, cy } = viewBox;
                      return (
                        <g>
                          <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text-primary)" style={{fontSize: '28px', fontWeight: 'bold'}}>{totalTasks}</text>
                          <text x={cx} y={cy + 16} textAnchor="middle" fill="var(--text-secondary)" style={{fontSize: '13px'}}>Total Tasks</text>
                        </g>
                      );
                    }}
                  />
                </Pie>
                <Tooltip
                  contentStyle={{borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--card-bg)'}}
                  itemStyle={{color: 'var(--text-primary)'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{display: 'flex', gap: '24px'}}>
        <div className="glass-panel" style={{flex: 1}}>
          <h3>Recent Tasks</h3>
          <div style={{marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {tasksByProject.length === 0 ? (
              <p style={{color: 'var(--text-secondary)', marginTop: '12px'}}>No tasks yet.</p>
            ) : (
              tasksByProject.map(project => (
                <div
                  key={project.projectId}
                  className="glass-panel"
                  style={{
                    padding: '16px',
                    borderLeft: '4px solid var(--primary)',
                    background: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    border: '1px solid var(--card-border)'
                  }}
                >
                  <div className="flex-between" style={{marginBottom: '4px'}}>
                    <h4 style={{marginBottom: 0}}>{project.projectName}</h4>
                    <span style={{fontSize: '13px', color: 'var(--text-secondary)'}}>{project.taskCount} task{project.taskCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '24px'}}>
          <div className="glass-panel">
            <h3>Activity Logs</h3>
            <div style={{marginTop: '16px', maxHeight: '300px', overflowY: 'auto'}}>
              {recentActivity.length === 0 ? (
                <p style={{color: 'var(--text-secondary)'}}>No recent activity.</p>
              ) : (
                recentActivity.map(act => (
                  <div key={act._id} style={{padding: '12px 0', borderBottom: '1px solid var(--card-border)'}}>
                    <div style={{fontWeight: '500'}}>{act.user?.name} <span style={{fontWeight: 'normal', color: 'var(--text-secondary)'}}>{act.action}</span></div>
                    <div style={{fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px'}}>{act.details}</div>
                    <div style={{fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px'}}>{new Date(act.createdAt).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
