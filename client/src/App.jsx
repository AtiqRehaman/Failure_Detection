import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProjectSubmission from './pages/ProjectSubmission';
import Dashboard from './pages/Dashboard';
import ProjectAnalysis from './pages/ProjectAnalysis';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="*" element={<Dashboard />} />
          <Route path="/submit" element={<ProjectSubmission />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analysis/:id" element={<ProjectAnalysis />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
