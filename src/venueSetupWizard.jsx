import React, { useState, useEffect } from 'react';
import VenueConfig from './venueConfig';

const VenueSetupWizard = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [venueConfig] = useState(new VenueConfig());
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    eventType: '',
    fontColor: '#ffffff',
    fontSize: '4vw',
    autoScale: true
  });
  const [existingVenues, setExistingVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    loadExistingVenues();
    detectNetworkInfo();
  }, []);

  const loadExistingVenues = () => {
    const venues = venueConfig.getVenues();
    setExistingVenues(venues);
  };

  const detectNetworkInfo = () => {
    const info = venueConfig.getNetworkInfo();
    setNetworkInfo(info);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVenueSelect = (venue) => {
    setSelectedVenue(venue);
    setFormData({
      name: venue.name,
      location: venue.location,
      eventType: venue.eventType,
      fontColor: venue.displayConfig.fontColor,
      fontSize: venue.displayConfig.fontSize,
      autoScale: venue.displayConfig.autoScale
    });
  };

  const handleCreateNew = () => {
    setSelectedVenue(null);
    setFormData({
      name: `Venue ${new Date().toLocaleDateString()}`,
      location: networkInfo?.location || 'Auto-Detected',
      eventType: 'Auto-Detected',
      fontColor: '#ffffff',
      fontSize: '4vw',
      autoScale: true
    });
    setStep(2);
  };

  const handleSaveVenue = () => {
    if (selectedVenue) {
      // Update existing venue
      venueConfig.updateVenue(selectedVenue.id, {
        name: formData.name,
        location: formData.location,
        eventType: formData.eventType,
        displayConfig: {
          fontColor: formData.fontColor,
          fontSize: formData.fontSize,
          autoScale: formData.autoScale
        }
      });
    } else {
      // Create new venue
      venueConfig.addVenue({
        name: formData.name,
        location: formData.location,
        eventType: formData.eventType,
        fontColor: formData.fontColor,
        fontSize: formData.fontSize,
        autoScale: formData.autoScale,
        fallbackIP: networkInfo?.gateway
      });
    }

    loadExistingVenues();
    setStep(3);
  };

  const handleComplete = () => {
    if (selectedVenue) {
      venueConfig.setCurrentVenue(selectedVenue.id);
    } else {
      // Set the newly created venue as current
      const venues = venueConfig.getVenues();
      const newVenue = venues[venues.length - 1];
      venueConfig.setCurrentVenue(newVenue.id);
    }

    if (onComplete) {
      onComplete(venueConfig.getCurrentVenue());
    }
  };

  const renderStep1 = () => (
    <div className="venue-wizard-step">
      <h2>Welcome to Venue Setup</h2>
      <p>This wizard will help you configure the display system for your venue.</p>
      
      <div className="network-info">
        <h3>Network Information</h3>
        <p><strong>Network:</strong> {networkInfo?.subnet || 'Detecting...'}</p>
        <p><strong>Location:</strong> {networkInfo?.location || 'Unknown'}</p>
      </div>

      <div className="venue-options">
        <h3>Choose an Option</h3>
        
        {existingVenues.length > 0 && (
          <div className="existing-venues">
            <h4>Existing Venues</h4>
            <div className="venue-list">
              {existingVenues.map(venue => (
                <div 
                  key={venue.id} 
                  className={`venue-item ${selectedVenue?.id === venue.id ? 'selected' : ''}`}
                  onClick={() => handleVenueSelect(venue)}
                >
                  <div className="venue-name">{venue.name}</div>
                  <div className="venue-details">
                    {venue.location} • {venue.eventType}
                  </div>
                  {venue.lastUsed && (
                    <div className="venue-last-used">
                      Last used: {new Date(venue.lastUsed).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="new-venue-option">
          <button 
            className="btn btn-primary"
            onClick={handleCreateNew}
          >
            Create New Venue
          </button>
        </div>
      </div>

      <div className="wizard-actions">
        {selectedVenue && (
          <button 
            className="btn btn-success"
            onClick={() => setStep(2)}
          >
            Continue with Selected Venue
          </button>
        )}
        <button 
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="venue-wizard-step">
      <h2>{selectedVenue ? 'Edit Venue' : 'Create New Venue'}</h2>
      
      <div className="form-group">
        <label htmlFor="venue-name">Venue Name</label>
        <input
          type="text"
          id="venue-name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter venue name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="venue-location">Location</label>
        <input
          type="text"
          id="venue-location"
          value={formData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          placeholder="Enter location"
        />
      </div>

      <div className="form-group">
        <label htmlFor="event-type">Event Type</label>
        <select
          id="event-type"
          value={formData.eventType}
          onChange={(e) => handleInputChange('eventType', e.target.value)}
        >
          <option value="">Select event type</option>
          <option value="Photo Event">Photo Event</option>
          <option value="Registration Event">Registration Event</option>
          <option value="Award Ceremony">Award Ceremony</option>
          <option value="Check-in Station">Check-in Station</option>
          <option value="Trade Show">Trade Show</option>
          <option value="Sporting Event">Sporting Event</option>
          <option value="School Event">School Event</option>
          <option value="Community Event">Community Event</option>
          <option value="Fundraiser">Fundraiser</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="display-settings">
        <h3>Display Settings</h3>
        
        <div className="form-group">
          <label htmlFor="font-color">Font Color</label>
          <input
            type="color"
            id="font-color"
            value={formData.fontColor}
            onChange={(e) => handleInputChange('fontColor', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="font-size">Font Size</label>
          <select
            id="font-size"
            value={formData.fontSize}
            onChange={(e) => handleInputChange('fontSize', e.target.value)}
          >
            <option value="3vw">Small</option>
            <option value="4vw">Medium</option>
            <option value="5vw">Large</option>
            <option value="6vw">Extra Large</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.autoScale}
              onChange={(e) => handleInputChange('autoScale', e.target.checked)}
            />
            Auto-scale text to fit display
          </label>
        </div>
      </div>

      <div className="wizard-actions">
        <button 
          className="btn btn-primary"
          onClick={handleSaveVenue}
        >
          Save Venue
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => setStep(1)}
        >
          Back
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="venue-wizard-step">
      <h2>Setup Complete!</h2>
      
      <div className="success-message">
        <div className="checkmark">✓</div>
        <h3>Venue configured successfully</h3>
        <p>The system is now ready to use at <strong>{formData.name}</strong>.</p>
      </div>

      <div className="venue-summary">
        <h3>Venue Summary</h3>
        <div className="summary-item">
          <strong>Name:</strong> {formData.name}
        </div>
        <div className="summary-item">
          <strong>Location:</strong> {formData.location}
        </div>
        <div className="summary-item">
          <strong>Event Type:</strong> {formData.eventType}
        </div>
        <div className="summary-item">
          <strong>Network:</strong> {networkInfo?.subnet || 'Auto-detected'}
        </div>
      </div>

      <div className="next-steps">
        <h3>Next Steps</h3>
        <ol>
          <li>Connect your Raspberry Pi displays to the same network</li>
          <li>The displays will automatically find and connect to this control panel</li>
          <li>Load your participant data and start displaying names</li>
        </ol>
      </div>

      <div className="wizard-actions">
        <button 
          className="btn btn-success"
          onClick={handleComplete}
        >
          Start Using System
        </button>
      </div>
    </div>
  );

  return (
    <div className="venue-setup-wizard">
      <div className="wizard-header">
        <div className="wizard-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>
      </div>

      <div className="wizard-content">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default VenueSetupWizard; 