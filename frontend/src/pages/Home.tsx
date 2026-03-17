import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import projectService from '../services/projectservices';
import type{ Project } from '../types';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectService.getMyProjects();
      setRecentProjects(response.data.slice(0, 3));
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '10px', fontSize: '28px' }}>
        Welcome back, {user?.name}! 
      </h1>
      <p style={{ color: '#666', marginBottom: '40px', fontSize: '16px' }}>
        Here's what's happening with your projects
      </p>

      {error && (
        <div style={{ color: '#dcd935ff', marginBottom: '20px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => navigate('/projects')}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            View All Projects
          </button>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Recent Projects</h2>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
        ) : recentProjects.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {recentProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  cursor: 'pointer',
                }}
              >
                <h3 style={{ marginBottom: '10px', fontSize: '18px' }}>{project.name}</h3>
                {project.description && (
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                    {project.description}
                  </p>
                )}
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {project.boardCount || 0} boards • {project.memberCount || 0} members
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999', backgroundColor: 'white', borderRadius: '8px' }}>
            <p style={{ marginBottom: '20px' }}>No projects yet. Create one to get started!</p>
            <button
              onClick={() => navigate('/projects')}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Create Your First Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
