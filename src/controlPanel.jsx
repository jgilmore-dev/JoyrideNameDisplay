import React, { useState, useEffect } from 'react';
import MemberList from './memberList.jsx';
import { formatFirstNames } from './utils.js';
import AddMemberForm from './addMemberForm.jsx';
import EditMemberForm from './editMemberForm.jsx';

const ControlPanel = () => {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDisplayed, setShowDisplayed] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showBannerNumbers, setShowBannerNumbers] = useState(true);
  const [settings, setSettings] = useState({
    banner1Enabled: false,
    banner2Enabled: false,
    banner1Display: 0,
    banner2Display: 1,
    fontColor: '#8B9091' // Always use this as the default
  });
  const [showSettings, setShowSettings] = useState(false);
  const [availableDisplays, setAvailableDisplays] = useState([]);
  const [colorInputValue, setColorInputValue] = useState('#8B9091'); // Always use this as the default
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [dataCollapsed, setDataCollapsed] = useState(false);
  const [mediaCollapsed, setMediaCollapsed] = useState(false);
  const [displayCollapsed, setDisplayCollapsed] = useState(false);
  const [memberCollapsed, setMemberCollapsed] = useState(false);

  const fetchMembers = async () => {
    const memberList = await window.electronAPI.invoke('get-members');
    setMembers(memberList);
  };

  const fetchSettings = async () => {
    try {
      const savedSettings = await window.electronAPI.invoke('get-settings');
      setSettings(prev => ({
        ...prev,
        ...(savedSettings || {}),
        fontColor: (savedSettings && savedSettings.fontColor) ? savedSettings.fontColor : '#8B9091'
      }));
      setColorInputValue((savedSettings && savedSettings.fontColor) ? savedSettings.fontColor : '#8B9091');
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchAvailableDisplays = async () => {
    try {
      const displays = await window.electronAPI.invoke('get-available-displays');
      setAvailableDisplays(displays);
    } catch (error) {
      console.error('Error fetching available displays:', error);
      // Fallback to basic display options
      setAvailableDisplays([
        { index: 0, name: 'Display 1 (Primary)', bounds: { width: 1920, height: 1080 } },
        { index: 1, name: 'Display 2', bounds: { width: 1920, height: 1080 } }
      ]);
    }
  };

  // Fetch initial data on component mount
  useEffect(() => {
    fetchMembers();
    fetchSettings();
    fetchAvailableDisplays();
  }, []);

  const handleLoadCsv = async () => {
    const result = await window.electronAPI.invoke('load-csv');
    if (result.error) {
      setError(result.error);
    }
    fetchMembers(); // Refresh list after loading
  };

  const handleAddMember = async (newMember) => {
    await window.electronAPI.invoke('add-member', newMember);
    setShowAddForm(false); // Hide form after adding
    fetchMembers(); // Refresh list
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
  };

  const handleUpdateMember = async (updatedMember) => {
    await window.electronAPI.invoke('update-member', updatedMember);
    setEditingMember(null); // Close the form
    fetchMembers(); // Refresh list
  };

  const handleSelectMember = async (member, banner) => {
    const firstNames = formatFirstNames(member);
    const nameData = {
      firstLine: firstNames,
      secondLine: member.LastName,
    };
    await window.electronAPI.invoke('banner-display', { banner, nameData });
    await window.electronAPI.invoke('mark-as-displayed', member.id);
    fetchMembers(); // Refresh list
  };

  const handleImportImages = async () => {
    const newImages = await window.electronAPI.invoke('import-images');
    if (Array.isArray(newImages)) {
      if (newImages.length > 0) {
        alert(`${newImages.length} new image(s) imported successfully.`);
      } else {
        alert('No new images were imported. The files may already exist.');
      }
    } else {
      alert('An error occurred during image import.');
    }
  };

  const handleClearCache = async () => {
    const isConfirmed = confirm('Are you sure you want to delete all imported slideshow images? This action cannot be undone.');
    if (isConfirmed) {
      await window.electronAPI.invoke('clear-slideshow-cache');
      alert('Slideshow images have been cleared.');
    }
  };

  const handleClearBanner = (banner) => {
    window.electronAPI.invoke('banner-clear', { banner });
  };

  const toggleBannerNumberVisibility = (e) => {
    const isVisible = e.target.checked;
    setShowBannerNumbers(isVisible);
    window.electronAPI.send('toggle-banner-number', { isVisible });
  };

  const handleSettingsChange = async (newSettings) => {
    try {
      setSettings(newSettings);
      await window.electronAPI.invoke('save-settings', newSettings);
      await window.electronAPI.invoke('apply-display-settings', newSettings);
      
      // Send font color update to banner windows if it changed
      if (newSettings.fontColor !== settings.fontColor) {
        window.electronAPI.send('update-font-color', newSettings.fontColor);
      }
    } catch (error) {
      console.error('Error applying settings:', error);
      // Revert to previous settings on error
      setSettings(settings);
    }
  };

  const membersToDisplay = members.filter(member => {
    const isNotDisplayed = !member.displayed;
    const matchesSearch = `${member.Member1 || ''} ${member.Member2 || ''} ${member.Member3 || ''} ${member.Member4 || ''} ${member.LastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    return isNotDisplayed && matchesSearch;
  });

  const recentlyDisplayedMembers = members.filter(member => {
    const isDisplayed = member.displayed;
    const matchesSearch = `${member.Member1 || ''} ${member.Member2 || ''} ${member.Member3 || ''} ${member.Member4 || ''} ${member.LastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    return isDisplayed && matchesSearch;
  });

  return (
    <div className="container">
      <div className="header-section">
        <h1>JoyRide Control Panel</h1>
        <button 
          className="settings-button" 
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ Settings
        </button>
      </div>

      {showSettings && (
        <div className="settings-section">
          <div className="section-header" onClick={() => setSettingsCollapsed(!settingsCollapsed)}>
            <span>{settingsCollapsed ? '►' : '▼'}</span> <h3>Display Settings</h3>
          </div>
          {!settingsCollapsed && (
            <div className="settings-grid">
              <div className="setting-item banner-setting-row">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.banner1Enabled}
                    onChange={e => handleSettingsChange({
                      ...settings,
                      banner1Enabled: e.target.checked
                    })}
                  />
                  Enable Banner 1
                </label>
                <select
                  value={settings.banner1Display}
                  onChange={e => handleSettingsChange({
                    ...settings,
                    banner1Display: parseInt(e.target.value)
                  })}
                  disabled={!settings.banner1Enabled}
                >
                  {availableDisplays.map(display => (
                    <option key={display.index} value={display.index}>
                      {display.name} ({display.bounds.width}x{display.bounds.height})
                    </option>
                  ))}
                </select>
              </div>
              <div className="setting-item banner-setting-row">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.banner2Enabled}
                    onChange={e => handleSettingsChange({
                      ...settings,
                      banner2Enabled: e.target.checked
                    })}
                  />
                  Enable Banner 2
                </label>
                <select
                  value={settings.banner2Display}
                  onChange={e => handleSettingsChange({
                    ...settings,
                    banner2Display: parseInt(e.target.value)
                  })}
                  disabled={!settings.banner2Enabled}
                >
                  {availableDisplays.map(display => (
                    <option key={display.index} value={display.index}>
                      {display.name} ({display.bounds.width}x{display.bounds.height})
                    </option>
                  ))}
                </select>
              </div>
              <div className="setting-item">
                <label>Font Color:</label>
                <div className="color-picker-container">
                  <input 
                    type="color" 
                    value={settings.fontColor}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      setColorInputValue(newColor);
                      handleSettingsChange({
                        ...settings, 
                        fontColor: newColor
                      });
                    }}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={colorInputValue}
                    onChange={(e) => {
                      const hexValue = e.target.value.toUpperCase();
                      // Allow partial input but only update settings when valid
                      if (hexValue === '' || /^#[0-9A-Fa-f]{0,6}$/.test(hexValue)) {
                        // Update the input value immediately for responsive typing
                        setColorInputValue(hexValue);
                        
                        // Only apply the change if it's a complete valid hex color
                        if (/^#[0-9A-Fa-f]{6}$/.test(hexValue)) {
                          handleSettingsChange({
                            ...settings,
                            fontColor: hexValue
                          });
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // On blur, if the input is incomplete, revert to the last valid color
                      const hexValue = e.target.value;
                      if (!/^#[0-9A-Fa-f]{6}$/.test(hexValue)) {
                        setColorInputValue(settings.fontColor);
                      }
                    }}
                    placeholder="#8B9091"
                    className="color-input"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="data-section">
        <div className="section-header" onClick={() => setDataCollapsed(!dataCollapsed)}>
          <span>{dataCollapsed ? '►' : '▼'}</span> <h3>Data Management</h3>
        </div>
        {!dataCollapsed && (
          <div>
            <div className="button-group">
              <button onClick={handleLoadCsv} className="primary-button">
                📁 Load Member CSV
              </button>
              <button onClick={() => setShowAddForm(!showAddForm)} className="primary-button">
                {showAddForm ? '❌ Cancel Adding' : '➕ Add New Member'}
              </button>
            </div>
            {showAddForm && <AddMemberForm onAddMember={handleAddMember} onCancel={() => setShowAddForm(false)} />}
          </div>
        )}
      </div>

      <div className="media-section">
        <div className="section-header" onClick={() => setMediaCollapsed(!mediaCollapsed)}>
          <span>{mediaCollapsed ? '►' : '▼'}</span> <h3>Slideshow Management</h3>
        </div>
        {!mediaCollapsed && (
          <div>
            <div className="button-group">
              <button onClick={handleImportImages} className="secondary-button">
                🖼️ Import Slideshow Images
              </button>
              <button onClick={handleClearCache} className="danger-button">
                🗑️ Clear Slideshow Images
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="display-section">
        <div className="section-header" onClick={() => setDisplayCollapsed(!displayCollapsed)}>
          <span>{displayCollapsed ? '►' : '▼'}</span> <h3>Display Controls</h3>
        </div>
        {!displayCollapsed && (
          <div>
            <div className="button-group">
              <button onClick={() => handleClearBanner(1)} className="display-button">
                🖥️ Clear Banner 1
              </button>
              {settings.banner2Enabled && (
                <button onClick={() => handleClearBanner(2)} className="display-button">
                  🖥️ Clear Banner 2
                </button>
              )}
            </div>
            <div className="display-options">
              <label>
                <input type="checkbox" checked={showBannerNumbers} onChange={toggleBannerNumberVisibility} />
                Show Banner Numbers
              </label>
            </div>
          </div>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      {members.length > 0 ? (
        <div className="member-section">
          <div className="section-header" onClick={() => setMemberCollapsed(!memberCollapsed)}>
            <span>{memberCollapsed ? '►' : '▼'}</span> <h3>Member Management</h3>
          </div>
          {!memberCollapsed && (
            <div>
              <div className="search-container">
                <input 
                  type="text" 
                  placeholder="Search names..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
                <label>
                  <input 
                    type="checkbox" 
                    checked={showDisplayed} 
                    onChange={(e) => setShowDisplayed(e.target.checked)} 
                  />
                  Show Recently Displayed
                </label>
              </div>
              <MemberList 
                members={showDisplayed ? recentlyDisplayedMembers : membersToDisplay} 
                onSelectMember={handleSelectMember} 
                onEditMember={handleEditMember}
                banner2Enabled={settings.banner2Enabled}
              />
              {editingMember && <EditMemberForm member={editingMember} onUpdateMember={handleUpdateMember} onCancel={() => setEditingMember(null)} />}
            </div>
          )}
        </div>
      ) : (
        <div className="info-section">
          <p className="info-text">No members loaded. Click "Load Member CSV" to begin.</p>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;