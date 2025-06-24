import React, { useState, useEffect } from 'react';

const PiClientManager = () => {
  const [piClients, setPiClients] = useState([]);
  const [discoveredClients, setDiscoveredClients] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Scan for Pi clients on the network
  const scanForPiClients = async () => {
    setIsScanning(true);
    try {
      // Scan local network for Pi clients
      const clients = await window.electronAPI.invoke('scan-pi-clients');
      setDiscoveredClients(clients);
    } catch (error) {
      console.error('Error scanning for Pi clients:', error);
    } finally {
      setIsScanning(false);
    }
  };

  // Get detailed information about a Pi client
  const getClientDetails = async (client) => {
    setIsLoading(true);
    try {
      const details = await window.electronAPI.invoke('get-pi-client-details', client);
      setClientDetails(details);
      setSelectedClient(client);
    } catch (error) {
      console.error('Error getting client details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Change update channel for a Pi client
  const changeClientChannel = async (client, channel) => {
    try {
      await window.electronAPI.invoke('set-pi-client-channel', { client, channel });
      // Refresh client details
      if (selectedClient && selectedClient.ip === client.ip) {
        await getClientDetails(client);
      }
    } catch (error) {
      console.error('Error changing client channel:', error);
    }
  };

  // Check for updates on a Pi client
  const checkClientUpdates = async (client) => {
    try {
      const result = await window.electronAPI.invoke('check-pi-client-updates', client);
      // Refresh client details
      if (selectedClient && selectedClient.ip === client.ip) {
        await getClientDetails(client);
      }
      return result;
    } catch (error) {
      console.error('Error checking client updates:', error);
    }
  };

  // Perform update on a Pi client
  const performClientUpdate = async (client) => {
    try {
      const result = await window.electronAPI.invoke('perform-pi-client-update', client);
      // Refresh client details
      if (selectedClient && selectedClient.ip === client.ip) {
        await getClientDetails(client);
      }
      return result;
    } catch (error) {
      console.error('Error performing client update:', error);
    }
  };

  // Auto-refresh client list
  useEffect(() => {
    const interval = setInterval(() => {
      if (discoveredClients.length > 0) {
        scanForPiClients();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [discoveredClients.length]);

  const getChannelColor = (channel) => {
    return channel === 'stable' ? '#27ae60' : '#f39c12';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return '#27ae60';
      case 'disconnected': return '#e74c3c';
      case 'updating': return '#3498db';
      case 'error': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="pi-client-manager">
      <div className="section-header">
        <h3>Pi Client Management</h3>
        <button 
          onClick={scanForPiClients} 
          className="scan-button"
          disabled={isScanning}
        >
          {isScanning ? '🔄 Scanning...' : '🔍 Scan for Pi Clients'}
        </button>
      </div>

      <div className="pi-clients-container">
        {discoveredClients.length === 0 ? (
          <div className="no-clients">
            <p>No Pi clients discovered. Click "Scan for Pi Clients" to search the network.</p>
          </div>
        ) : (
          <div className="clients-grid">
            {discoveredClients.map((client) => (
              <div 
                key={client.ip} 
                className={`client-card ${selectedClient?.ip === client.ip ? 'selected' : ''}`}
                onClick={() => getClientDetails(client)}
              >
                <div className="client-header">
                  <div className="client-status">
                    <span 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(client.status) }}
                    ></span>
                    <span className="client-ip">{client.ip}</span>
                  </div>
                  <div className="client-channel">
                    <span 
                      className="channel-badge"
                      style={{ backgroundColor: getChannelColor(client.channel) }}
                    >
                      {client.channel}
                    </span>
                  </div>
                </div>
                
                <div className="client-info">
                  <div className="info-row">
                    <span className="label">Version:</span>
                    <span className="value">{client.version || 'Unknown'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Status:</span>
                    <span className="value">{client.status}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Last Update:</span>
                    <span className="value">{client.lastUpdate || 'Never'}</span>
                  </div>
                </div>

                {selectedClient?.ip === client.ip && clientDetails && (
                  <div className="client-actions">
                    <div className="action-buttons">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          changeClientChannel(client, client.channel === 'stable' ? 'testing' : 'stable');
                        }}
                        className="channel-button"
                        style={{ backgroundColor: getChannelColor(client.channel === 'stable' ? 'testing' : 'stable') }}
                      >
                        Switch to {client.channel === 'stable' ? 'Testing' : 'Stable'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          checkClientUpdates(client);
                        }}
                        className="update-button"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Checking...' : 'Check Updates'}
                      </button>
                      {clientDetails.updateAvailable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            performClientUpdate(client);
                          }}
                          className="install-button"
                        >
                          Install Update
                        </button>
                      )}
                    </div>
                    
                    <div className="detailed-info">
                      <h4>Client Details</h4>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">Client ID:</span>
                          <span className="detail-value">{clientDetails.clientId}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Update Channel:</span>
                          <span className="detail-value">{clientDetails.channel}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Current Version:</span>
                          <span className="detail-value">{clientDetails.currentVersion}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Latest Version:</span>
                          <span className="detail-value">{clientDetails.latestVersion}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Update Status:</span>
                          <span className="detail-value">{clientDetails.updateStatus}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Last Check:</span>
                          <span className="detail-value">{clientDetails.lastCheck}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .pi-client-manager {
          margin-top: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .scan-button {
          padding: 8px 16px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .scan-button:disabled {
          background: #95a5a6;
          cursor: not-allowed;
        }

        .no-clients {
          text-align: center;
          padding: 40px;
          color: #7f8c8d;
          font-style: italic;
        }

        .clients-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
        }

        .client-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }

        .client-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .client-card.selected {
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .client-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .client-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .client-ip {
          font-weight: bold;
          font-family: monospace;
        }

        .channel-badge {
          padding: 2px 8px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .client-info {
          margin-bottom: 10px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 14px;
        }

        .label {
          color: #7f8c8d;
        }

        .value {
          font-weight: 500;
        }

        .client-actions {
          border-top: 1px solid #eee;
          padding-top: 15px;
          margin-top: 15px;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .channel-button,
        .update-button,
        .install-button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          color: white;
        }

        .channel-button {
          background: #f39c12;
        }

        .update-button {
          background: #3498db;
        }

        .install-button {
          background: #27ae60;
        }

        .update-button:disabled {
          background: #95a5a6;
          cursor: not-allowed;
        }

        .detailed-info h4 {
          margin: 0 0 10px 0;
          color: #2c3e50;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .detail-label {
          color: #7f8c8d;
        }

        .detail-value {
          font-weight: 500;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
};

export default PiClientManager; 