const { formatFirstNames } = require('./utils.js');

class QueueManager {
  constructor() {
    this.queues = new Map(); // bannerId -> Array of queued members
    this.currentDisplay = new Map(); // bannerId -> currently displayed member
  }

  /**
   * Add a member to a banner's queue
   * @param {number} bannerId - The banner ID
   * @param {Object} member - The member object
   * @returns {Object} - Queue status
   */
  addToQueue(bannerId, member) {
    if (!this.queues.has(bannerId)) {
      this.queues.set(bannerId, []);
    }

    const queue = this.queues.get(bannerId);
    
    // Check if member is already in queue
    const existingIndex = queue.findIndex(item => item.member.id === member.id);
    if (existingIndex !== -1) {
      return {
        success: false,
        message: 'Member is already in queue',
        queueLength: queue.length
      };
    }

    // Add member to queue with timestamp
    const queueItem = {
      member: member,
      addedAt: Date.now(),
      nameData: {
        firstLine: formatFirstNames(member),
        secondLine: member.LastName
      }
    };

    queue.push(queueItem);

    return {
      success: true,
      message: `Added ${formatFirstNames(member)} ${member.LastName} to Banner ${bannerId} queue`,
      queueLength: queue.length,
      position: queue.length
    };
  }

  /**
   * Remove a member from a banner's queue
   * @param {number} bannerId - The banner ID
   * @param {string} memberId - The member ID
   * @returns {Object} - Queue status
   */
  removeFromQueue(bannerId, memberId) {
    if (!this.queues.has(bannerId)) {
      return {
        success: false,
        message: 'No queue exists for this banner'
      };
    }

    const queue = this.queues.get(bannerId);
    const index = queue.findIndex(item => item.member.id === memberId);
    
    if (index === -1) {
      return {
        success: false,
        message: 'Member not found in queue'
      };
    }

    const removedItem = queue.splice(index, 1)[0];
    
    return {
      success: true,
      message: `Removed ${formatFirstNames(removedItem.member)} ${removedItem.member.LastName} from queue`,
      queueLength: queue.length
    };
  }

  /**
   * Get the next member from a banner's queue
   * @param {number} bannerId - The banner ID
   * @returns {Object|null} - The next member or null if queue is empty
   */
  getNextFromQueue(bannerId) {
    if (!this.queues.has(bannerId) || this.queues.get(bannerId).length === 0) {
      return null;
    }

    const queue = this.queues.get(bannerId);
    return queue[0]; // Return first item in queue
  }

  /**
   * Advance the queue (remove the first item)
   * @param {number} bannerId - The banner ID
   * @returns {Object} - Queue status
   */
  advanceQueue(bannerId) {
    if (!this.queues.has(bannerId) || this.queues.get(bannerId).length === 0) {
      return {
        success: false,
        message: 'Queue is empty'
      };
    }

    const queue = this.queues.get(bannerId);
    const removedItem = queue.shift(); // Remove first item

    return {
      success: true,
      message: `Advanced queue for Banner ${bannerId}`,
      queueLength: queue.length,
      nextMember: queue.length > 0 ? queue[0] : null
    };
  }

  /**
   * Display the next member from queue
   * @param {number} bannerId - The banner ID
   * @returns {Object|null} - The member data to display or null if queue is empty
   */
  displayNextFromQueue(bannerId) {
    const nextItem = this.getNextFromQueue(bannerId);
    if (!nextItem) {
      return null;
    }

    // Set as currently displayed
    this.currentDisplay.set(bannerId, nextItem);
    
    // Advance the queue
    this.advanceQueue(bannerId);

    return nextItem;
  }

  /**
   * Clear a member from current display
   * @param {number} bannerId - The banner ID
   * @returns {Object} - Status
   */
  clearCurrentDisplay(bannerId) {
    const wasDisplaying = this.currentDisplay.has(bannerId);
    this.currentDisplay.delete(bannerId);
    
    return {
      success: true,
      message: wasDisplaying ? 'Cleared current display' : 'No member was currently displayed',
      hasNext: this.getNextFromQueue(bannerId) !== null
    };
  }

  /**
   * Get queue for a specific banner
   * @param {number} bannerId - The banner ID
   * @returns {Array} - Array of queued members
   */
  getQueue(bannerId) {
    return this.queues.get(bannerId) || [];
  }

  /**
   * Get current display for a specific banner
   * @param {number} bannerId - The banner ID
   * @returns {Object|null} - Currently displayed member or null
   */
  getCurrentDisplay(bannerId) {
    return this.currentDisplay.get(bannerId) || null;
  }

  /**
   * Get all queues and current displays
   * @returns {Object} - All queue and display data
   */
  getAllQueues() {
    const result = {};
    
    // Get all banner IDs from queues and current displays
    const allBannerIds = new Set([
      ...this.queues.keys(),
      ...this.currentDisplay.keys()
    ]);

    allBannerIds.forEach(bannerId => {
      result[bannerId] = {
        queue: this.getQueue(bannerId),
        currentDisplay: this.getCurrentDisplay(bannerId),
        queueLength: this.getQueue(bannerId).length,
        hasCurrentDisplay: this.currentDisplay.has(bannerId)
      };
    });

    return result;
  }

  /**
   * Clear all queues for a banner
   * @param {number} bannerId - The banner ID
   * @returns {Object} - Status
   */
  clearQueue(bannerId) {
    const queueLength = this.getQueue(bannerId).length;
    this.queues.delete(bannerId);
    
    return {
      success: true,
      message: `Cleared queue for Banner ${bannerId}`,
      clearedCount: queueLength
    };
  }

  /**
   * Clear all queues and current displays
   * @returns {Object} - Status
   */
  clearAllQueues() {
    try {
      const totalQueued = Array.from(this.queues.values()).reduce((sum, queue) => sum + queue.length, 0);
      const totalDisplaying = this.currentDisplay.size;
      
      this.queues.clear();
      this.currentDisplay.clear();
      
      return {
        success: true,
        message: `Cleared all queues and displays (${totalQueued} queued, ${totalDisplaying} displaying)`,
        clearedQueued: totalQueued,
        clearedDisplaying: totalDisplaying
      };
    } catch (error) {
      console.error('[QueueManager] Error clearing all queues:', error);
      return {
        success: false,
        message: 'Failed to clear all queues',
        error: error.message
      };
    }
  }

  /**
   * Move a member up in the queue
   * @param {number} bannerId - The banner ID
   * @param {string} memberId - The member ID
   * @returns {Object} - Queue status
   */
  moveUpInQueue(bannerId, memberId) {
    try {
      if (!this.queues.has(bannerId)) {
        return {
          success: false,
          message: 'No queue exists for this banner'
        };
      }

      const queue = this.queues.get(bannerId);
      const index = queue.findIndex(item => item.member.id === memberId);
      
      if (index === -1) {
        return {
          success: false,
          message: 'Member not found in queue'
        };
      }

      if (index === 0) {
        return {
          success: false,
          message: 'Member is already at the top of the queue'
        };
      }

      // Swap with previous item
      [queue[index], queue[index - 1]] = [queue[index - 1], queue[index]];
      
      return {
        success: true,
        message: `Moved ${formatFirstNames(queue[index - 1].member)} ${queue[index - 1].member.LastName} up in queue`,
        newPosition: index,
        queueLength: queue.length
      };
    } catch (error) {
      console.error('[QueueManager] Error moving up in queue:', error);
      return {
        success: false,
        message: 'Failed to move member up in queue',
        error: error.message
      };
    }
  }

  /**
   * Move a member down in the queue
   * @param {number} bannerId - The banner ID
   * @param {string} memberId - The member ID
   * @returns {Object} - Status
   */
  moveDownInQueue(bannerId, memberId) {
    if (!this.queues.has(bannerId)) {
      return {
        success: false,
        message: 'No queue exists for this banner'
      };
    }

    const queue = this.queues.get(bannerId);
    const index = queue.findIndex(item => item.member.id === memberId);
    
    if (index === -1) {
      return {
        success: false,
        message: 'Member not found in queue'
      };
    }

    if (index === queue.length - 1) {
      return {
        success: false,
        message: 'Member is already at the bottom of the queue'
      };
    }

    // Swap with next item
    [queue[index], queue[index + 1]] = [queue[index + 1], queue[index]];
    
    return {
      success: true,
      message: `Moved ${formatFirstNames(queue[index + 1].member)} ${queue[index + 1].member.LastName} down in queue`,
      newPosition: index + 2
    };
  }

  /**
   * Move a member from one banner's queue to another banner's queue
   * @param {number} fromBannerId - The source banner ID
   * @param {number} toBannerId - The destination banner ID
   * @param {string} memberId - The member ID
   * @returns {Object} - Status
   */
  moveToBanner(fromBannerId, toBannerId, memberId) {
    if (fromBannerId === toBannerId) {
      return {
        success: false,
        message: 'Source and destination banners are the same'
      };
    }

    if (!this.queues.has(fromBannerId)) {
      return {
        success: false,
        message: 'Source banner queue does not exist'
      };
    }

    const fromQueue = this.queues.get(fromBannerId);
    const memberIndex = fromQueue.findIndex(item => item.member.id === memberId);
    
    if (memberIndex === -1) {
      return {
        success: false,
        message: 'Member not found in source banner queue'
      };
    }

    // Check if member is already in destination queue
    if (this.queues.has(toBannerId)) {
      const toQueue = this.queues.get(toBannerId);
      const existingIndex = toQueue.findIndex(item => item.member.id === memberId);
      if (existingIndex !== -1) {
        return {
          success: false,
          message: 'Member is already in destination banner queue'
        };
      }
    }

    // Remove from source queue
    const [memberItem] = fromQueue.splice(memberIndex, 1);
    
    // Add to destination queue
    if (!this.queues.has(toBannerId)) {
      this.queues.set(toBannerId, []);
    }
    const toQueue = this.queues.get(toBannerId);
    toQueue.push(memberItem);

    return {
      success: true,
      message: `Moved ${formatFirstNames(memberItem.member)} ${memberItem.member.LastName} from Banner ${fromBannerId} to Banner ${toBannerId}`,
      fromQueueLength: fromQueue.length,
      toQueueLength: toQueue.length
    };
  }
}

module.exports = QueueManager; 