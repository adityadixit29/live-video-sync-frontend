import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { API_ENDPOINTS, SOCKET_URL } from '../config';
import VideoPlayer from './VideoPlayer';
import './Session.css';

const Session = () => {
  const { unique_id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionUrl, setSessionUrl] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if current user is admin (created this session in this tab/window)
        // Use sessionStorage so each tab/window is independent
        const isUserAdmin = sessionStorage.getItem(`admin_session_${unique_id}`) === 'true';
        
        console.log('Fetching session for unique_id:', unique_id);
        
        // First, try to get the session
        const response = await axios.get(API_ENDPOINTS.GET_SESSION(unique_id));
        
        console.log('Session response:', response.data);
        
        if (response.data.success) {
          const sessionData = response.data.session;
          setSessionUrl(sessionData.userurl);

          // Determine if user is admin based on sessionStorage
          // If they directly opened the URL (not from home page), they're a student
          setIsAdmin(isUserAdmin);
          
          console.log('User role determined:', isUserAdmin ? 'ADMIN' : 'STUDENT');

          // If not admin, try to join as student (but don't fail if this errors)
          if (!isUserAdmin) {
            try {
              await axios.post(API_ENDPOINTS.JOIN_SESSION(unique_id));
              console.log('Successfully joined session as student');
            } catch (joinError) {
              console.warn('Could not join session as student (continuing anyway):', joinError.message);
              // Continue anyway - student can still access the session
            }
          }

          // Initialize socket connection
          socketRef.current = io(SOCKET_URL);
          
          // Wait for socket to connect before joining session
          socketRef.current.on('connect', () => {
            console.log('Socket connected, joining session:', unique_id);
            console.log('User role:', isUserAdmin ? 'ADMIN' : 'STUDENT');
            socketRef.current.emit('join-session', unique_id);
            
            // If student, request video state immediately after joining
            if (!isUserAdmin) {
              setTimeout(() => {
                console.log('Requesting video state as student...');
                socketRef.current.emit('request-video-state', { unique_id });
              }, 1000);
            }
          });
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          unique_id: unique_id
        });
        
        if (error.response?.status === 404) {
          alert('Session not found. Please check the URL and try again.');
        } else {
          alert('Error loading session. Please try again.');
        }
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [unique_id, navigate]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sessionUrl);
    alert('Session URL copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="session-container">
        <div className="loading">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="session-container">
      <div className="session-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        {isAdmin && (
          <div className="session-info">
            <p className="session-label">Session URL:</p>
            <div className="url-container">
              <input 
                type="text" 
                value={sessionUrl} 
                readOnly 
                className="url-input"
              />
              <button className="copy-btn" onClick={copyToClipboard}>
                Copy
              </button>
            </div>
            <p className="session-type">You are: <span className="admin-badge">ADMIN</span></p>
          </div>
        )}
        {!isAdmin && (
          <p className="session-type">You are: <span className="student-badge">STUDENT</span></p>
        )}
      </div>
      
      <div className="video-container">
        <VideoPlayer 
          unique_id={unique_id} 
          isAdmin={isAdmin}
          socket={socketRef.current}
        />
      </div>
    </div>
  );
};

export default Session;

