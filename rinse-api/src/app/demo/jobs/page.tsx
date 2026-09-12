export default function DemoJobsPage() {
  return (
    <div className="demo-frame">
      <div className="screen page-content body demo-screenshot">
        <header className="page-header">
          <div>
            <h1>Jobs</h1>
            <p>12 total · July 2026</p>
          </div>
        </header>
        <div className="card">
          <div className="section-title">This week</div>
          <p>James Rivera · Full Detail · $285</p>
          <p>Maria Chen · Maintenance Wash · $95</p>
        </div>
        <div className="card">
          <div className="section-title">Recurring</div>
          <p>Tyler Brooks · Biweekly detail · $160</p>
        </div>
      </div>
    </div>
  )
}
