const notificationQueueService = require('../../services/notificationQueueService');

async function getQueue(req, res, next) {
  try {
    const data = await notificationQueueService.getNotificationQueue();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

async function markSent(req, res, next) {
  try {
    const notificationId = Number(req.params.notificationId);
    const data = await notificationQueueService.markNotificationSent(notificationId);
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

async function markFailed(req, res, next) {
  try {
    const notificationId = Number(req.params.notificationId);
    const errorMessage = req.body?.errorMessage || 'Manual failure mark';
    const data = await notificationQueueService.markNotificationFailed(notificationId, errorMessage);
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getQueue,
  markSent,
  markFailed
};