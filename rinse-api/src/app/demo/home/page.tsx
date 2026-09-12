export default function DemoHomePage() {
  return (
    <div className="demo-frame">
      <div className="screen page-content body demo-screenshot">
        <header className="page-header">
          <div>
            <h1>Good afternoon</h1>
            <p>Wednesday · Rinse</p>
          </div>
        </header>

        <div
          className="demo-screenshot__hero"
          style={{
            background: 'linear-gradient(135deg, #14532d 0%, #052e16 100%)',
            minHeight: 160,
            display: 'flex',
            alignItems: 'flex-end',
            padding: 16,
            color: '#fff',
          }}
        >
          <span>Mobile detailing · Premium finish</span>
        </div>

        <div className="demo-screenshot__kpi">
          <div className="card">
            <div className="ui-section__title">Revenue MTD</div>
            <strong>$4,280</strong>
          </div>
          <div className="card">
            <div className="ui-section__title">Outstanding</div>
            <strong>$620</strong>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Today</div>
          <p>Full Detail · 10:00 AM · James Rivera</p>
          <p className="form-field-hint">742 Oak Lane · Mobile</p>
        </div>
      </div>
    </div>
  )
}
