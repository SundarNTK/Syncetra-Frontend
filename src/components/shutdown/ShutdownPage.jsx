export default function ShutdownPage() {
  return (
    <div className="shutdown-page">
      <div className="shutdown-vignette" aria-hidden="true" />
      <div className="shutdown-grain" aria-hidden="true" />
      <div className="shutdown-scratch shutdown-scratch--1" aria-hidden="true" />
      <div className="shutdown-scratch shutdown-scratch--2" aria-hidden="true" />

      <div className="shutdown-frame">
        <div className="shutdown-content">
          <h1 className="shutdown-title">Service Shutdown</h1>
          <div className="shutdown-rule" aria-hidden="true" />

          <p className="shutdown-text">
            This service has been permanently shut down.
          </p>
          <p className="shutdown-text">
            Thank you to everyone who supported and used this project
            throughout its journey.
          </p>
          <p className="shutdown-text">Your support is sincerely appreciated.</p>

          <p className="shutdown-closing">Goodbye, and thank you.</p>
        </div>
      </div>
    </div>
  );
}
