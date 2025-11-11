import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Session from './components/Session';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session/:unique_id" element={<Session />} />
      </Routes>
    </Router>
  );
}

export default App;

