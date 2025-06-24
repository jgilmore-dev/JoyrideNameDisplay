import React, { useState, useEffect } from 'react';
const { ipcRenderer } = window.require('electron');

const QueueManager = ({ enabledBanners = [] }) => {
  const [queues, setQueues] = useState({});
  const [currentDisplays, setCurrentDisplays] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchQueueData();
    
    // Refresh queue data every 2 seconds
    const interval = setInterval(fetchQueueData, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchQueueData = async () => {
    try {
      const allQueues = await ipcRenderer.invoke('get-all-queues');
      setQueues(allQueues);
      
      // Extract current displays
      const displays = {};
      Object.keys(allQueues).forEach(bannerId => {
        displays[bannerId] = allQueues[bannerId].currentDisplay;
      });
      setCurrentDisplays(displays);
    } catch (error) {
      console.error('Failed to fetch queue data:', error);
    }
  };

  const showMessage = (msg, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  const handleDisplayNext = async (bannerId) => {
    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('display-next-from-queue', bannerId);
      if (result) {
        showMessage(`Displayed ${result.nameData.firstLine} ${result.nameData.secondLine} on Banner ${bannerId}`);
      } else {
        showMessage('No members in queue for this banner');
      }
      fetchQueueData();
    } catch (error) {
      console.error('Failed to display next:', error);
      showMessage('Failed to display next member');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCurrent = async (bannerId) => {
    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('clear-current-display', bannerId);
      showMessage(result.message);
      fetchQueueData();
    } catch (error) {
      console.error('Failed to clear current display:', error);
      showMessage('Failed to clear current display');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromQueue = async (bannerId, memberId) => {
    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('remove-from-queue', { bannerId, memberId });
      showMessage(result.message);
      fetchQueueData();
    } catch (error) {
      console.error('Failed to remove from queue:', error);
      showMessage('Failed to remove from queue');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveUp = async (bannerId, memberId) => {
    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('move-up-in-queue', { bannerId, memberId });
      showMessage(result.message);
      fetchQueueData();
    } catch (error) {
      console.error('Failed to move up:', error);
      showMessage('Failed to move member up');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveDown = async (bannerId, memberId) => {
    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('move-down-in-queue', { bannerId, memberId });
      showMessage(result.message);
      fetchQueueData();
    } catch (error) {
      console.error('Failed to move down:', error);
      showMessage('Failed to move member down');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToBanner = async (fromBannerId, toBannerId, memberId) => {
    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('move-to-banner', { fromBannerId, toBannerId, memberId });
      showMessage(result.message);
      fetchQueueData();
    } catch (error) {
      console.error('Failed to move to banner:', error);
      showMessage('Failed to move member to banner');
    } finally {
      setLoading(false);
    }
  };

  const handleClearQueue = async (bannerId) => {
    if (!confirm('Are you sure you want to clear the entire queue for this banner?')) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('clear-queue', bannerId);
      showMessage(result.message);
      fetchQueueData();
    } catch (error) {
      console.error('Failed to clear queue:', error);
      showMessage('Failed to clear queue');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllQueues = async () => {
    if (!confirm('Are you sure you want to clear ALL queues and displays?')) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('clear-all-queues');
      showMessage(result.message);
      fetchQueueData();
    } catch (error) {
      console.error('Failed to clear all queues:', error);
      showMessage('Failed to clear all queues');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (enabledBanners.length === 0) {
    return (
      <div className="queue-manager">
        <h3>Queue Management</h3>
        <p className="info-text">No banners enabled. Enable banners in settings to use queue management.</p>
      </div>
    );
  }

  return (
    <div className="queue-manager">
      <div className="queue-header">
        <h3>Queue Management</h3>
        <div className="queue-actions">
          <button 
            onClick={handleClearAllQueues}
            disabled={loading}
            className="danger-button"
          >
            Clear All Queues
          </button>
        </div>
      </div>

      {message && (
        <div className="message-banner">
          {message}
        </div>
      )}

      <div className="banner-queues">
        {enabledBanners.map(bannerId => {
          const queue = queues[bannerId]?.queue || [];
          const currentDisplay = currentDisplays[bannerId];
          const queueLength = queue.length;

          return (
            <div key={bannerId} className="banner-queue">
              <div className="banner-header">
                <h4>Banner {bannerId}</h4>
                <div className="banner-stats">
                  <span className="queue-count">{queueLength} in queue</span>
                  {currentDisplay && (
                    <span className="current-display">
                      Currently: {currentDisplay.nameData.firstLine} {currentDisplay.nameData.secondLine}
                    </span>
                  )}
                </div>
              </div>

              {/* Current Display */}
              {currentDisplay && (
                <div className="current-display-section">
                  <div className="current-display-card">
                    <div className="member-info">
                      <div className="member-name">
                        {currentDisplay.nameData.firstLine} {currentDisplay.nameData.secondLine}
                      </div>
                      <div className="display-time">
                        Displayed at {formatTime(currentDisplay.addedAt)}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleClearCurrent(bannerId)}
                      disabled={loading}
                      className="clear-button"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Queue */}
              <div className="queue-section">
                <div className="queue-header-row">
                  <span>Queue</span>
                  <button 
                    onClick={() => handleDisplayNext(bannerId)}
                    disabled={loading || queueLength === 0}
                    className="primary-button"
                  >
                    Display Next
                  </button>
                </div>

                {queueLength === 0 ? (
                  <div className="empty-queue">
                    <p>No members in queue</p>
                  </div>
                ) : (
                  <div className="queue-list">
                    {queue.map((item, index) => (
                      <div key={item.member.id} className="queue-item">
                        <div className="queue-position">{index + 1}</div>
                        <div className="member-info">
                          <div className="member-name">
                            {item.nameData.firstLine} {item.nameData.secondLine}
                          </div>
                          <div className="queue-time">
                            Added at {formatTime(item.addedAt)}
                          </div>
                        </div>
                        <div className="queue-actions">
                          <button 
                            onClick={() => handleMoveUp(bannerId, item.member.id)}
                            disabled={loading || index === 0}
                            className="move-button"
                            title="Move Up"
                          >
                            ↑
                          </button>
                          <button 
                            onClick={() => handleMoveDown(bannerId, item.member.id)}
                            disabled={loading || index === queueLength - 1}
                            className="move-button"
                            title="Move Down"
                          >
                            ↓
                          </button>
                          <div className="move-to-banner-dropdown">
                            <select 
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleMoveToBanner(bannerId, parseInt(e.target.value), item.member.id);
                                  e.target.value = ''; // Reset selection
                                }
                              }}
                              disabled={loading}
                              className="move-to-banner-select"
                              title="Move to Banner"
                            >
                              <option value="">Move to...</option>
                              {enabledBanners
                                .filter(targetBannerId => targetBannerId !== bannerId)
                                .map(targetBannerId => (
                                  <option key={targetBannerId} value={targetBannerId}>
                                    Banner {targetBannerId}
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                          <button 
                            onClick={() => handleRemoveFromQueue(bannerId, item.member.id)}
                            disabled={loading}
                            className="remove-button"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {queueLength > 0 && (
                  <div className="queue-footer">
                    <button 
                      onClick={() => handleClearQueue(bannerId)}
                      disabled={loading}
                      className="clear-queue-button"
                    >
                      Clear Queue ({queueLength})
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QueueManager; 