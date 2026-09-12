// PocketBase 0.39+: cronAdd(jobId, cronExpr, handler)
cronAdd('daily_notifications', '0 8 * * *', () => {
  const baseUrl = $os.getenv('APP_CRON_URL')
  const secret = $os.getenv('CRON_SECRET')
  if (!baseUrl || !secret) {
    console.warn('cron_notifications: APP_CRON_URL or CRON_SECRET not set')
    return
  }

  const url = baseUrl.replace(/\/$/, '') + '/api/cron/notifications'

  try {
    const res = $http.send({
      url: url,
      method: 'GET',
      headers: { 'x-cron-secret': secret, 'x-api-secret': secret },
      timeout: 30,
    })
    console.log('cron_notifications:', res.statusCode)
  } catch (err) {
    console.warn('cron_notifications failed:', err)
  }
})
