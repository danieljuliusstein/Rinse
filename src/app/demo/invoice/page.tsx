export default function DemoInvoicePage() {
  return (
    <div className="demo-frame">
      <div className="screen page-content body demo-screenshot">
        <header className="page-header page-header--compact">
          <div className="page-header__title-block">
            <h1>Invoice #INV-1042</h1>
          </div>
        </header>
        <div className="invoice-preview-shell">
          <div className="card">
            <div className="section-title">Rinse</div>
            <p>James Rivera · Full Detail</p>
            <p>
              <strong>$285.00</strong> due
            </p>
          </div>
        </div>
        <div className="ui-action-dock ui-action-dock--with-nav">
          <button type="button" className="btn-ghost ui-action-dock__btn">
            More
          </button>
          <button type="button" className="btn-primary ui-action-dock__btn ui-action-dock__btn--primary">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
