export const createRevisionNotificationPayload = (revision) => ({
  userId: revision.userId,
  skillId: revision.skillId,
  topicId: revision.topicId,
  revisionId: revision._id,
  revisionDate: revision.revisionDate,
  status: revision.status,
})

export const sendRevisionNotification = async () => ({
  queued: false,
  provider: 'not-configured',
})
