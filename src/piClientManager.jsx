import React, { useState, useEffect, useCallback, useRef } from 'react';

const PiClientManager = () => {
  const [piClients, setPiClients] = useState([]);
  const [discoveredClients, setDiscoveredClients] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [piSystemStatus, setPiSystemStatus] = useState({
    enabled: false,
    isRunning: false,
    connectedClients: 0,
    port: null
  });
  const [message, setMessage] = useState('');

  // Use refs to track intervals for cleanup
  const statusIntervalRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  // Cleanup function for intervals
  const cleanupIntervals = useCallback(() => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchPiSystemStatus();
    
    // Refresh status every 5 seconds
    statusIntervalRef.current = setInterval(fetchPiSystemStatus, 5000);
    
    return cleanupIntervals;
  }, [cleanupIntervals]);

  const fetchPiSystemStatus = useCallback(async () => {
    try {
      const status = await window.electronAPI.invoke('get-pi-system-status');
      setPiSystemStatus(status);
    } catch (error) {
      console.error('Failed to fetch Pi system status:', error);
    }
  }, []);

  const showMessage = useCallback((msg, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  }, []);

  const handlePiSystemAction = useCallback(async (action) => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.invoke(`${action}-pi-system`);
      showMessage(result.message);
      fetchPiSystemStatus();
    } catch (error) {
      console.error(`Failed to ${action} Pi system:`, error);
      showMessage(`Failed to ${action} Pi system`);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPiSystemStatus, showMessage]);

  const handleEnablePiSystem = () => handlePiSystemAction('enable');
  const handleDisablePiSystem = () => handlePiSystemAction('disable');
  const handleRestartPiSystem = () => handlePiSystemAction('restart');

  // Scan for Pi clients on the network
  const scanForPiClients = useCallback(async () => {
    setIsScanning(true);
    try {
      const clients = await window.electronAPI.invoke('scan-pi-clients');
      setDiscoveredClients(clients);
      setPiClients(clients);
    } catch (error) {
      console.error('Failed to scan for Pi clients:', error);
      showMessage('Failed to scan for Pi clients');
    } finally {
      setIsScanning(false);
    }
  }, [showMessage]);

  // Get detailed information about a Pi client
  const getClientDetails = useCallback(async (client) => {
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
  }, []);

  // Auto-refresh client list only when Pi system is enabled and running
  useEffect(() => {
    if (piSystemStatus.enabled && piSystemStatus.isRunning && discoveredClients.length > 0) {
      refreshIntervalRef.current = setInterval(scanForPiClients, 30000); // Refresh every 30 seconds
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [piSystemStatus.enabled, piSystemStatus.isRunning, discoveredClients.length, scanForPiClients]);

  const getChannelColor = (channel) => {
    return channel === 'stable' ? '#27ae60' : '#f39c12';
  };

  const getStatusColor = () => {
    if (!piSystemStatus.enabled) return 'text-gray-500';
    if (piSystemStatus.isRunning) return 'text-green-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (!piSystemStatus.enabled) return 'Disabled';
    if (piSystemStatus.isRunning) return 'Running';
    return 'Error';
  };

  return (
    <div className="pi-client-manager">
      <div className="pi-header">
        <h3>Raspberry Pi System</h3>
        <div className="pi-status">
          <span className={`status-indicator ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {message && (
        <div className="message-banner">
          {message}
        </div>
      )}

      {/* Pi System Controls */}
      <div className="pi-controls">
        <div className="pi-status-info">
          <div className="status-item">
            <span className="label">Status:</span>
            <span className={`value ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          {piSystemStatus.enabled && piSystemStatus.isRunning && (
            <>
              <div className="status-item">
                <span className="label">Port:</span>
                <span className="value">{piSystemStatus.port || 'N/A'}</span>
              </div>
              <div className="status-item">
                <span className="label">Connected Clients:</span>
                <span className="value">{piSystemStatus.connectedClients}</span>
              </div>
            </>
          )}
        </div>

        <div className="pi-actions">
          {!piSystemStatus.enabled ? (
            <button
              onClick={handleEnablePiSystem}
              disabled={isLoading}
              className="primary-button"
            >
              {isLoading ? 'Enabling...' : 'Enable Pi System'}
            </button>
          ) : (
            <>
              <button
                onClick={handleRestartPiSystem}
                disabled={isLoading}
                className="secondary-button"
              >
                {isLoading ? 'Restarting...' : 'Restart'}
              </button>
              <button
                onClick={handleDisablePiSystem}
                disabled={isLoading}
                className="danger-button"
              >
                {isLoading ? 'Disabling...' : 'Disable Pi System'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pi System Information */}
      <div className="pi-info">
        <h4>About Pi System</h4>
        <div className="info-content">
          <p>
            The Raspberry Pi system allows you to display names on remote Pi devices over the network.
            When disabled, the application runs more efficiently for local-only setups.
          </p>
          <ul>
            <li><strong>Enabled:</strong> Pi clients can connect and display names</li>
            <li><strong>Disabled:</strong> Lower resource usage, local displays only</li>
            <li><strong>Auto-discovery:</strong> Automatically finds Pi clients on the network</li>
            <li><strong>Real-time updates:</strong> Names and settings sync instantly</li>
          </ul>
        </div>
      </div>

      {/* Pi Client Discovery (only show when enabled) */}
      {piSystemStatus.enabled && piSystemStatus.isRunning && (
        <div className="pi-discovery">
          <div className="discovery-header">
            <h4>Pi Client Discovery</h4>
            <button
              onClick={scanForPiClients}
              disabled={isScanning}
              className="secondary-button"
            >
              {isScanning ? 'Scanning...' : 'Scan for Clients'}
            </button>
          </div>

          {piClients.length > 0 ? (
            <div className="pi-clients-list">
              {piClients.map((client, index) => (
                <div key={index} className="pi-client-item">
                  <div className="client-info">
                    <div className="client-name">{client.name || 'Unknown Pi'}</div>
                    <div className="client-ip">{client.ip}</div>
                    <div className="client-status">
                      Status: {client.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-clients">
              <p>No Pi clients found. Click "Scan for Clients" to search the network.</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .pi-client-manager {
          margin-top: 20px;
        }

        .pi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .pi-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .pi-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .pi-status-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-item {
          display: flex;
          flex-direction: column;
        }

        .label {
          color: #7f8c8d;
        }

        .value {
          font-weight: 500;
        }

        .pi-actions {
          display: flex;
          gap: 8px;
        }

        .primary-button,
        .secondary-button,
        .danger-button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .primary-button {
          background: #3498db;
          color: white;
        }

        .secondary-button {
          background: #f39c12;
          color: white;
        }

        .danger-button {
          background: #e74c3c;
          color: white;
        }

        .pi-info {
          margin-bottom: 15px;
        }

        .pi-info h4 {
          margin: 0 0 10px 0;
          color: #2c3e50;
        }

        .info-content {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        .pi-discovery {
          margin-top: 15px;
        }

        .discovery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .no-clients {
          text-align: center;
          padding: 40px;
          color: #7f8c8d;
          font-style: italic;
        }

        .pi-clients-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
        }

        .pi-client-item {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }

        .pi-client-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .client-info {
          margin-bottom: 10px;
        }

        .client-name {
          font-weight: bold;
          font-family: monospace;
        }

        .client-ip {
          font-weight: 500;
          font-family: monospace;
        }

        .client-status {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default PiClientManager; 