import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MemberList from './memberList.jsx';
import { formatFirstNames, debounce } from './utils.js';
import AddMemberForm from './addMemberForm.jsx';
import EditMemberForm from './editMemberForm.jsx';
import UpdateManager from './updateManager.jsx';
import PiClientManager from './piClientManager.jsx';
import QueueManager from './queueManager.jsx';
import MemberMergeManager from './memberMergeManager.jsx';
import Fuse from 'fuse.js';

// Debounce hook for search optimization
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const ControlPanel = () => {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDisplayed, setShowDisplayed] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showBannerNumbers, setShowBannerNumbers] = useState(true);
  const [settings, setSettings] = useState({
    banners: [
      { id: 1, enabled: false, display: 0 },
      { id: 2, enabled: false, display: 1 }
    ],
    fontColor: '#8B9091' // Always use this as the default
  });
  const [showSettings, setShowSettings] = useState(false);
  const [availableDisplays, setAvailableDisplays] = useState([]);
  const [colorInputValue, setColorInputValue] = useState('#8B9091'); // Always use this as the default
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [mediaCollapsed, setMediaCollapsed] = useState(false);
  const [displayCollapsed, setDisplayCollapsed] = useState(false);
  const [memberCollapsed, setMemberCollapsed] = useState(false);
  const [updateCollapsed, setUpdateCollapsed] = useState(false);
  const [piCollapsed, setPiCollapsed] = useState(false);
  const [queueCollapsed, setQueueCollapsed] = useState(false);
  const [slideshowCollapsed, setSlideshowCollapsed] = useState(false);
  const [slideshowStatus, setSlideshowStatus] = useState({
    enabled: true,
    interval: 20000,
    imageCount: 0,
    isRunning: false,
    currentSlideIndex: 0
  });
  const [mergeMode, setMergeMode] = useState(false);

  // Debounce search term to improve performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized search handler to prevent unnecessary re-renders
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Memoized member filtering for better performance
  const { membersToDisplay, recentlyDisplayedMembers } = useMemo(() => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    
    // Configure Fuse.js for fuzzy search
    const fuseOptions = {
      keys: ['Member1', 'Member2', 'Member3', 'Member4', 'LastName'],
      threshold: 0.3, // Lower threshold = more strict matching
      includeScore: true,
      minMatchCharLength: 2,
      shouldSort: true,
      findAllMatches: true
    };

    // Create search function
    const searchMembers = (memberList, searchTerm) => {
      if (!searchTerm.trim()) {
        return memberList;
      }
      
      const fuse = new Fuse(memberList, fuseOptions);
      const results = fuse.search(searchTerm);
      return results.map(result => result.item);
    };

    // Filter and search members
    const notDisplayedMembers = members.filter(member => !member.displayed);
    const displayedMembers = members.filter(member => member.displayed);

    const membersToDisplay = searchMembers(notDisplayedMembers, debouncedSearchTerm);
    const recentlyDisplayedMembers = searchMembers(displayedMembers, debouncedSearchTerm)
      .sort((a, b) => (b.displayedAt || 0) - (a.displayedAt || 0));

    return { membersToDisplay, recentlyDisplayedMembers };
  }, [members, debouncedSearchTerm]);

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

  const fetchSlideshowStatus = async () => {
    try {
      const status = await window.electronAPI.invoke('get-slideshow-status');
      setSlideshowStatus(status);
    } catch (error) {
      console.error('Failed to load slideshow status:', error);
    }
  };

  // Fetch initial data on component mount
  useEffect(() => {
    fetchMembers();
    fetchSettings();
    fetchAvailableDisplays();
    fetchSlideshowStatus();
    
    // Refresh slideshow status every 5 seconds
    const interval = setInterval(fetchSlideshowStatus, 5000);
    
    return () => clearInterval(interval);
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

  const handleSelectMember = async (member, banner, action = 'display') => {
    if (action === 'queue') {
      // Add to queue
      try {
        const result = await window.electronAPI.invoke('add-to-queue', { bannerId: banner, member });
        if (result.success) {
          alert(result.message);
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('Failed to add to queue:', error);
        alert('Failed to add member to queue');
      }
    } else {
      // Direct display (existing functionality)
      const firstNames = formatFirstNames(member);
      const nameData = {
        firstLine: firstNames,
        secondLine: member.LastName,
      };
      await window.electronAPI.invoke('banner-display', { banner, nameData });
      await window.electronAPI.invoke('mark-as-displayed', member.id);
      fetchMembers(); // Refresh list
      setSearchTerm(''); // Clear the search bar after displaying a name
    }
  };

  const handleDisplayMerged = async (nameData, banner) => {
    await window.electronAPI.invoke('banner-display', { banner, nameData });
    fetchMembers(); // Refresh list
    setSearchTerm(''); // Clear the search bar after displaying merged names
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

  // Helper function to update a specific banner's settings
  const updateBannerSetting = (bannerId, field, value) => {
    const newSettings = {
      ...settings,
      banners: settings.banners.map(banner => 
        banner.id === bannerId ? { ...banner, [field]: value } : banner
      )
    };
    handleSettingsChange(newSettings);
  };

  // Helper function to get banner setting
  const getBannerSetting = (bannerId, field) => {
    const banner = settings.banners.find(b => b.id === bannerId);
    return banner ? banner[field] : null;
  };

  // Helper function to check if banner is enabled
  const isBannerEnabled = (bannerId) => {
    return getBannerSetting(bannerId, 'enabled') || false;
  };

  const handleSlideshowToggle = async () => {
    try {
      const action = slideshowStatus.enabled ? 'disable-slideshow' : 'enable-slideshow';
      const result = await window.electronAPI.invoke(action);
      if (result.success) {
        setError('');
        fetchSlideshowStatus();
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Failed to toggle slideshow:', error);
      setError('Failed to toggle slideshow');
    }
  };

  const handleIntervalChange = async (newInterval) => {
    try {
      const result = await window.electronAPI.invoke('set-slideshow-interval', newInterval);
      if (result.success) {
        setError('');
        fetchSlideshowStatus();
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Failed to set slideshow interval:', error);
      setError('Failed to set slideshow interval');
    }
  };

  const formatInterval = (ms) => {
    const seconds = Math.round(ms / 1000);
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  };

  return (
    <div className="container">
      <div className="header-section">
        <h1>Member Name Display Control Panel</h1>
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
              {settings.banners.map(banner => {
                // Always default targetType to 'local' if missing
                const targetType = banner.targetType || 'local';
                // For local banners, default display and targetId to 0 if missing
                const displayIndex = (typeof banner.display === 'number' && banner.display >= 0) ? banner.display : 0;
                const targetId = (targetType === 'local') ? ((typeof banner.targetId === 'number' && banner.targetId >= 0) ? banner.targetId : 0) : banner.targetId;
                return (
                  <div key={banner.id} className="setting-item banner-setting-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={banner.enabled}
                        onChange={e => updateBannerSetting(banner.id, 'enabled', e.target.checked)}
                      />
                      Enable Banner {banner.id}
                    </label>
                    <select
                      value={targetType}
                      onChange={e => {
                        const newType = e.target.value;
                        if (newType === 'pi') {
                          // Update both fields in one go
                          const newSettings = {
                            ...settings,
                            banners: settings.banners.map(b =>
                              b.id === banner.id
                                ? { ...b, targetType: 'pi', targetId: null }
                                : b
                            )
                          };
                          handleSettingsChange(newSettings);
                        } else {
                          const idx = (typeof banner.display === 'number' && banner.display >= 0) ? banner.display : 0;
                          const newSettings = {
                            ...settings,
                            banners: settings.banners.map(b =>
                              b.id === banner.id
                                ? { ...b, targetType: 'local', targetId: idx, display: idx }
                                : b
                            )
                          };
                          handleSettingsChange(newSettings);
                        }
                      }}
                    >
                      <option value="local">Local Display</option>
                      <option value="pi">Pi Display</option>
                    </select>
                    {targetType === 'local' ? (
                      <select
                        value={displayIndex}
                        onChange={e => {
                          const idx = parseInt(e.target.value);
                          updateBannerSetting(banner.id, 'display', idx);
                          updateBannerSetting(banner.id, 'targetId', idx);
                        }}
                      >
                        {availableDisplays.map(display => (
                          <option key={display.index} value={display.index}>
                            {display.name} ({display.bounds.width}x{display.bounds.height})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ marginLeft: 8, fontStyle: 'italic' }}>All Pi Displays</span>
                    )}
                  </div>
                );
              })}
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
                  <button
                    type="button"
                    onClick={() => {
                      const defaultColor = '#FFFFFF';
                      setColorInputValue(defaultColor);
                      handleSettingsChange({
                        ...settings,
                        fontColor: defaultColor
                      });
                    }}
                    className="reset-color-button"
                    title="Reset to default color"
                  >
                    🔄
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="display-section">
        <div className="section-header" onClick={() => setDisplayCollapsed(!displayCollapsed)}>
          <span>{displayCollapsed ? '►' : '▼'}</span> <h3>Display Controls</h3>
        </div>
        {!displayCollapsed && (
          <div>
            <div className="button-group">
              {settings.banners.map(banner => (
                <button 
                  key={banner.id}
                  onClick={() => handleClearBanner(banner.id)} 
                  className="display-button"
                >
                  🖥️ Clear Banner {banner.id}
                </button>
              ))}
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

      <div className="member-section">
        <div className="section-header" onClick={() => setMemberCollapsed(!memberCollapsed)}>
          <span>{memberCollapsed ? '►' : '▼'}</span> <h3>Member Management</h3>
        </div>
        {!memberCollapsed && (
          <div>
            {/* Data Management Controls */}
            <div className="button-group">
              <button onClick={handleLoadCsv} className="primary-button">
                📁 Load Member CSV
              </button>
              <button onClick={() => setShowAddForm(!showAddForm)} className="primary-button">
                {showAddForm ? '❌ Cancel Adding' : '➕ Add New Member'}
              </button>
            </div>
            {showAddForm && <AddMemberForm onAddMember={handleAddMember} onCancel={() => setShowAddForm(false)} />}
            
            {/* Member List Controls */}
            {members.length > 0 && (
              <>
                <div className="search-container">
                  <input 
                    type="text" 
                    placeholder="Search names..." 
                    value={searchTerm}
                    onChange={handleSearchChange} 
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
                
                {/* Member Merge Manager */}
                <MemberMergeManager 
                  members={showDisplayed ? recentlyDisplayedMembers : membersToDisplay}
                  onDisplayMerged={handleDisplayMerged}
                  enabledBanners={settings.banners.filter(b => b.enabled).map(b => b.id)}
                />
                
                <MemberList 
                  members={showDisplayed ? recentlyDisplayedMembers : membersToDisplay} 
                  onSelectMember={handleSelectMember} 
                  onEditMember={handleEditMember}
                  enabledBanners={settings.banners.filter(b => b.enabled).map(b => b.id)}
                />
                {editingMember && <EditMemberForm member={editingMember} onUpdateMember={handleUpdateMember} onCancel={() => setEditingMember(null)} />}
              </>
            )}
            
            {/* No Members Message */}
            {members.length === 0 && (
              <div className="info-section">
                <p className="info-text">No members loaded. Click "Load Member CSV" to begin.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="media-section">
        <div className="section-header" onClick={() => setMediaCollapsed(!mediaCollapsed)}>
          <span>{mediaCollapsed ? '►' : '▼'}</span> <h3>Slideshow Management</h3>
        </div>
        {!mediaCollapsed && (
          <div>
            {/* Slideshow Status */}
            <div className="slideshow-status">
              <div className="status-grid">
                <div className="status-item">
                  <span className="label">Status:</span>
                  <span className={`value ${slideshowStatus.enabled ? 'enabled' : 'disabled'}`}>
                    {slideshowStatus.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="label">Images:</span>
                  <span className="value">{slideshowStatus.imageCount}</span>
                </div>
                <div className="status-item">
                  <span className="label">Interval:</span>
                  <span className="value">{formatInterval(slideshowStatus.interval)}</span>
                </div>
                <div className="status-item">
                  <span className="label">Running:</span>
                  <span className={`value ${slideshowStatus.isRunning ? 'running' : 'stopped'}`}>
                    {slideshowStatus.isRunning ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Slideshow Controls */}
            <div className="slideshow-controls">
              <div className="button-group">
                <button 
                  onClick={handleSlideshowToggle} 
                  className={`toggle-button ${slideshowStatus.enabled ? 'disable' : 'enable'}`}
                >
                  {slideshowStatus.enabled ? '🖼️ Disable Slideshow' : '🖼️ Enable Slideshow'}
                </button>
                
                {slideshowStatus.enabled && (
                  <div className="interval-control">
                    <label>Interval:</label>
                    <select
                      value={Math.round(slideshowStatus.interval / 1000)}
                      onChange={(e) => handleIntervalChange(parseInt(e.target.value) * 1000)}
                    >
                      <option value={5}>5 seconds</option>
                      <option value={10}>10 seconds</option>
                      <option value={15}>15 seconds</option>
                      <option value={20}>20 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={60}>60 seconds</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Image Management */}
            <div className="image-management">
              <h4>Image Management</h4>
              <div className="button-group">
                <button onClick={handleImportImages} className="secondary-button">
                  🖼️ Import Slideshow Images
                </button>
                <button onClick={handleClearCache} className="danger-button">
                  🗑️ Clear Slideshow Images
                </button>
              </div>
            </div>

            {/* Slideshow Information */}
            <div className="slideshow-info">
              <h4>About Slideshow</h4>
              <div className="info-content">
                <p>
                  The slideshow displays background images on banners when no names are being shown.
                  When disabled, banners will show a blank screen instead of rotating images.
                </p>
                <ul>
                  <li><strong>Enabled:</strong> Background images rotate automatically</li>
                  <li><strong>Disabled:</strong> Clean blank screen when no names are displayed</li>
                  <li><strong>Interval:</strong> Time between image changes (5-60 seconds)</li>
                  <li><strong>Efficiency:</strong> Disabling reduces resource usage</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="update-section">
        <div className="section-header" onClick={() => setUpdateCollapsed(!updateCollapsed)}>
          <span>{updateCollapsed ? '►' : '▼'}</span> <h3>Software Updates</h3>
        </div>
        {!updateCollapsed && (
          <div>
            <UpdateManager />
          </div>
        )}
      </div>

      <div className="pi-section">
        <div className="section-header" onClick={() => setPiCollapsed(!piCollapsed)}>
          <span>{piCollapsed ? '►' : '▼'}</span> <h3>Pi Client Manager</h3>
        </div>
        {!piCollapsed && (
          <div>
            <PiClientManager />
          </div>
        )}
      </div>

      {/* Queue Management Section */}
      <div className="queue-section">
        <div className="section-header" onClick={() => setQueueCollapsed(!queueCollapsed)}>
          <span>{queueCollapsed ? '►' : '▼'}</span> <h3>Queue Management</h3>
        </div>
        {!queueCollapsed && (
          <QueueManager enabledBanners={settings.banners.filter(b => b.enabled).map(b => b.id)} />
        )}
      </div>

      {/* Display Management Section */}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
};

export default ControlPanel;