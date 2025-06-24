import React, { useState, useEffect } from 'react';
const { ipcRenderer } = window.require('electron');

const UpdateManager = () => {
  const [updateStatus, setUpdateStatus] = useState({
    isUpdateAvailable: false,
    updateInfo: null,
    updateProgress: 0,
    isUpdating: false,
    lastCheckTime: null,
    currentVersion: ''
  });
  const [channelInfo, setChannelInfo] = useState({
    channel: 'stable',
    availableChannels: ['stable', 'testing']
  });
  const [isChecking, setIsChecking] = useState(false);
  const [isChangingChannel, setIsChangingChannel] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get initial update status and channel info
    getUpdateStatus();
    getChannelInfo();

    // Listen for update status changes
    const handleUpdateStatusChange = (event, data) => {
      setUpdateStatus(prev => ({
        ...prev,
        ...data.data,
        lastUpdate: data.timestamp
      }));
      setError(null);
    };

    ipcRenderer.on('update-status-changed', handleUpdateStatusChange);

    return () => {
      ipcRenderer.removeListener('update-status-changed', handleUpdateStatusChange);
    };
  }, []);

  const getUpdateStatus = async () => {
    try {
      const status = await ipcRenderer.invoke('get-update-status');
      setUpdateStatus(status);
    } catch (error) {
      console.error('Failed to get update status:', error);
      setError('Failed to get update status');
    }
  };

  const getChannelInfo = async () => {
    try {
      const info = await ipcRenderer.invoke('get-update-channel');
      setChannelInfo(info);
    } catch (error) {
      console.error('Failed to get channel info:', error);
    }
  };

  const changeChannel = async (newChannel) => {
    setIsChangingChannel(true);
    setError(null);
    
    try {
      const result = await ipcRenderer.invoke('set-update-channel', newChannel);
      if (result.success) {
        setChannelInfo(prev => ({ ...prev, channel: newChannel }));
        // Trigger an immediate update check
        await checkForUpdates();
      } else {
        setError(result.error || 'Failed to change channel');
      }
    } catch (error) {
      console.error('Change channel failed:', error);
      setError('Failed to change channel');
    } finally {
      setIsChangingChannel(false);
    }
  };

  const checkForUpdates = async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const result = await ipcRenderer.invoke('check-for-updates');
      if (!result.success) {
        setError(result.error || 'Failed to check for updates');
      }
    } catch (error) {
      console.error('Check for updates failed:', error);
      setError('Failed to check for updates');
    } finally {
      setIsChecking(false);
    }
  };

  const downloadUpdate = async () => {
    setError(null);
    
    try {
      const result = await ipcRenderer.invoke('download-update');
      if (!result.success) {
        setError(result.error || 'Failed to download update');
      }
    } catch (error) {
      console.error('Download update failed:', error);
      setError('Failed to download update');
    }
  };

  const installUpdate = async () => {
    setError(null);
    
    try {
      const result = await ipcRenderer.invoke('install-update');
      if (!result.success) {
        setError(result.error || 'Failed to install update');
      }
    } catch (error) {
      console.error('Install update failed:', error);
      setError('Failed to install update');
    }
  };

  const openGitHubReleases = async () => {
    try {
      await ipcRenderer.invoke('open-github-releases');
    } catch (error) {
      console.error('Failed to open GitHub releases:', error);
    }
  };

  const formatLastCheckTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = () => {
    if (updateStatus.isUpdateAvailable) return 'text-green-600';
    if (updateStatus.isUpdating) return 'text-blue-600';
    if (error) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusText = () => {
    if (updateStatus.isUpdateAvailable) return 'Update Available';
    if (updateStatus.isUpdating) return 'Updating...';
    if (error) return 'Error';
    return 'Up to Date';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Software Updates</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* Current Version */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <div className="text-sm text-gray-600">Current Version</div>
        <div className="text-lg font-semibold text-gray-800">
          {updateStatus.currentVersion || 'Unknown'}
        </div>
      </div>

      {/* Update Channel */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <div className="text-sm text-gray-600 mb-2">Update Channel</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span 
              className={`px-2 py-1 rounded text-xs font-medium ${
                channelInfo.channel === 'stable' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {channelInfo.channel.toUpperCase()}
            </span>
            <span className="text-sm text-gray-600">
              {channelInfo.channel === 'stable' ? 'Production releases' : 'Development builds'}
            </span>
          </div>
          <button
            onClick={() => changeChannel(channelInfo.channel === 'stable' ? 'testing' : 'stable')}
            disabled={isChangingChannel}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isChangingChannel ? 'Changing...' : `Switch to ${channelInfo.channel === 'stable' ? 'Testing' : 'Stable'}`}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {channelInfo.channel === 'stable' 
            ? 'Receives official releases only. High stability, recommended for production.'
            : 'Receives latest development builds. May contain bugs, recommended for testing.'
          }
        </div>
      </div>

      {/* Last Check Time */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <div className="text-sm text-gray-600">Last Check</div>
        <div className="text-sm text-gray-800">
          {formatLastCheckTime(updateStatus.lastCheckTime)}
        </div>
      </div>

      {/* Update Information */}
      {updateStatus.isUpdateAvailable && updateStatus.updateInfo && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-green-800">
              New Version Available: {updateStatus.updateInfo.version}
            </div>
            {updateStatus.updateInfo.channel && (
              <span 
                className={`px-2 py-1 rounded text-xs font-medium ${
                  updateStatus.updateInfo.channel === 'stable' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {updateStatus.updateInfo.channel.toUpperCase()}
              </span>
            )}
          </div>
          
          {updateStatus.updateInfo.releaseNotes && (
            <div className="text-sm text-green-700 mb-3">
              <div className="font-medium mb-1">Release Notes:</div>
              <div className="max-h-32 overflow-y-auto text-xs">
                {updateStatus.updateInfo.releaseNotes}
              </div>
            </div>
          )}

          {updateStatus.updateInfo.channel === 'testing' && (
            <div className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
              ⚠️ This is a development build from the testing channel. It may contain bugs or incomplete features.
            </div>
          )}
        </div>
      )}

      {/* Download Progress */}
      {updateStatus.isUpdating && updateStatus.updateProgress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Downloading...</span>
            <span>{Math.round(updateStatus.updateProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${updateStatus.updateProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={checkForUpdates}
          disabled={isChecking}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isChecking ? 'Checking...' : 'Check for Updates'}
        </button>

        {updateStatus.isUpdateAvailable && !updateStatus.isUpdating && (
          <button
            onClick={downloadUpdate}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Download Update
          </button>
        )}

        {updateStatus.updateInfo?.localPath && (
          <button
            onClick={installUpdate}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Install Update
          </button>
        )}

        <button
          onClick={openGitHubReleases}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          View on GitHub
        </button>
      </div>

      {/* Update Sources Info */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="text-sm font-medium text-blue-800 mb-2">Update Sources</div>
        <div className="text-xs text-blue-700 space-y-1">
          <div>• <strong>Stable Channel:</strong> GitHub Releases (production builds)</div>
          <div>• <strong>Testing Channel:</strong> Development builds and pre-releases</div>
          <div>• Local update directory</div>
          <div>• Network shares (if configured)</div>
          <div>• USB drives with MemberNameDisplayUpdates folder</div>
        </div>
      </div>
    </div>
  );
};

export default UpdateManager; 