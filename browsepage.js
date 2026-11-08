import React, { useState, useEffect } from 'react';
import './shared.css'; // Make sure your CSS file is imported!

export default function Browse() {
  // 1. Manage UI & API states (Loading, Error, Data, Filters)
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Fetch data from the real GET /api/slots API endpoint
  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/slots');
      if (!response.ok) {
        throw new Error('Failed to load slots from the server.');
      }
      const data = await response.json();
      setSlots(data);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // Run the fetch once when the page loads
  useEffect(() => {
    fetchSlots();
  }, []);

  // 3. Filter sessions by search text or category
  const filteredSlots = slots.filter((slot) => {
    const matchesCategory = selectedCategory === 'all' || slot.category === selectedCategory;
    const matchesSearch = slot.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="browse-container">
      <h1>Browse Sessions</h1>

      {/* SEARCH INPUT & FILTER BUTTONS */}
      <div className="controls">
        <label>
          Search:
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>

        {/* Activity Type Toggle Buttons (Uses your CSS from Screenshot 6) */}
        <div className="activity-types">
          <button 
            type="button" 
            aria-pressed={selectedCategory === 'all'} 
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          <button 
            type="button" 
            aria-pressed={selectedCategory === 'sports'} 
            onClick={() => setSelectedCategory('sports')}
          >
            Sports
          </button>
          <button 
            type="button" 
            aria-pressed={selectedCategory === 'music'} 
            onClick={() => setSelectedCategory('music')}
          >
            Music
          </button>
        </div>
      </div>

      {/* 4. LOADING STATE (Rubric Requirement) */}
      {loading && (
        <div id="status" role="status">
          Loading sessions, please wait...
        </div>
      )}

      {/* 5. ERROR STATE & RETRY BUTTON (Rubric Requirement - Uses your CSS from Screenshot 7) */}
      {error && (
        <div id="status" className="error" role="status">
          <p>Error: {error}</p>
          <button className="button" onClick={fetchSlots}>
            Retry
          </button>
        </div>
      )}

      {/* 6. EMPTY STATE (Rubric Requirement) */}
      {!loading && !error && filteredSlots.length === 0 && (
        <div id="status" role="status">
          No available slots found matching your criteria.
        </div>
      )}

      {/* 7. DISPLAY CARDS GRID (Uses your CSS from Screenshot 8) */}
      {!loading && !error && filteredSlots.length > 0 && (
        <div className="activity-grid">
          {filteredSlots.map((slot) => (
            <div key={slot.id} className="card">
              <h3>{slot.title}</h3>
              <p>{slot.description}</p>
              
              {/* Optional Tier Badge from your CSS */}
              {slot.isBuddy && <span className="badge-buddy">Buddy</span>}
              {slot.isEditorial && <span className="badge-editorial">Special</span>}

              {/* Session cards must link to Detail Page */}
              <a href={`/detail/${slot.id}`} className="button">
                View Details
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
