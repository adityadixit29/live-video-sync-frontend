import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import './Home.css';

const Home = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStartSession = async () => {
    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.CREATE_SESSION);
      if (response.data.success) {
        // Store admin session in sessionStorage (per tab/window)
        sessionStorage.setItem(`admin_session_${response.data.session.unique_id}`, 'true');
        navigate(`/session/${response.data.session.unique_id}`);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">Video Player Live Sessions</h1>
        <p className="home-subtitle">Start a live video session and share it with students</p>
        <button 
          className="start-session-btn" 
          onClick={handleStartSession}
          disabled={loading}
        >
          {loading ? 'Creating Session...' : 'START SESSION'}
        </button>
      </div>
    </div>
  );
};

export default Home;

