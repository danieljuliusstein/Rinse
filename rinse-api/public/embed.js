/**
 * Paste on any website to add live booking (calendar widget + modal button).
 * Loads from your operator app — syncs with your schedule automatically.
 */
(function detailBookingEmbed() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  var STYLE_ID = 'detail-booking-embed-styles'
  var MODAL_ID = 'detail-booking-modal'

  function appOriginFromScript() {
    var script = document.currentScript
    if (script && script.src) {
      try {
        return new URL(script.src).origin
      } catch (_e) {
        /* ignore */
      }
    }
    var scripts = document.querySelectorAll('script[src*="embed.js"]')
    for (var i = scripts.length - 1; i >= 0; i--) {
      var s = scripts[i]
      if (s.src) {
        try {
          return new URL(s.src).origin
        } catch (_e2) {
          /* ignore */
        }
      }
    }
    return ''
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return
    var style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent =
      '#' +
      MODAL_ID +
      '{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}' +
      '#' +
      MODAL_ID +
      ' .detail-modal-panel{position:relative;width:100%;max-width:430px;height:min(92vh,720px);background:#fafafa;border-radius:14px;overflow:hidden;box-shadow:0 24px 48px rgba(0,0,0,.25)}' +
      '#' +
      MODAL_ID +
      ' .detail-modal-close{position:absolute;top:10px;right:10px;z-index:2;width:32px;height:32px;border:0;border-radius:8px;background:rgba(0,0,0,.06);font-size:20px;line-height:1;cursor:pointer;color:#333}' +
      '#' +
      MODAL_ID +
      ' iframe{width:100%;height:100%;border:0;display:block}' +
      '[data-detail-book]{cursor:pointer}'
    document.head.appendChild(style)
  }

  function mountCalendar(container, origin, slug) {
    if (!container || container.getAttribute('data-detail-mounted') === '1') return
    container.setAttribute('data-detail-mounted', '1')
    var iframe = document.createElement('iframe')
    iframe.src = origin + '/embed/book/' + encodeURIComponent(slug)
    iframe.title = 'Book an appointment'
    iframe.setAttribute('loading', 'lazy')
    iframe.style.cssText = 'width:100%;max-width:400px;height:520px;border:0;border-radius:12px;display:block;'
    container.appendChild(iframe)
  }

  function openBookModal(origin, slug) {
    injectStyles()
    var existing = document.getElementById(MODAL_ID)
    if (existing) existing.remove()

    var overlay = document.createElement('div')
    overlay.id = MODAL_ID
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.setAttribute('aria-label', 'Book an appointment')

    var panel = document.createElement('div')
    panel.className = 'detail-modal-panel'

    var closeBtn = document.createElement('button')
    closeBtn.type = 'button'
    closeBtn.className = 'detail-modal-close'
    closeBtn.setAttribute('aria-label', 'Close')
    closeBtn.textContent = '×'

    var iframe = document.createElement('iframe')
    iframe.src = origin + '/book/' + encodeURIComponent(slug)
    iframe.title = 'Book an appointment'

    function close() {
      overlay.remove()
      document.removeEventListener('keydown', onKey)
    }

    function onKey(e) {
      if (e.key === 'Escape') close()
    }

    closeBtn.addEventListener('click', close)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close()
    })
    document.addEventListener('keydown', onKey)

    panel.appendChild(closeBtn)
    panel.appendChild(iframe)
    overlay.appendChild(panel)
    document.body.appendChild(overlay)
  }

  function init() {
    var origin = appOriginFromScript()
    if (!origin) return

    injectStyles()

    document.querySelectorAll('[data-detail-booking]').forEach(function (el) {
      var slug = el.getAttribute('data-detail-booking')
      if (slug) mountCalendar(el, origin, slug.trim())
    })

    document.querySelectorAll('[data-detail-book]').forEach(function (btn) {
      if (btn.getAttribute('data-detail-listener') === '1') return
      btn.setAttribute('data-detail-listener', '1')
      btn.addEventListener('click', function () {
        var slug = btn.getAttribute('data-detail-book')
        if (slug) openBookModal(origin, slug.trim())
      })
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
