#!/usr/bin/env node
/**
 * Generate VAPID keys for Web Push.
 * Usage: node scripts/generate-vapid-keys.mjs
 */

import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()

console.log('Add these to .env.local:\n')
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log('VAPID_SUBJECT=mailto:you@yourdomain.com')
