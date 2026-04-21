/* ============================================
   CONTACT PAGE
   ============================================ */

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', topic: 'Consulting', message: '' });
  const [sent, setSent] = useState(false);
  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 6000);
  };
  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <div className="form-row">
        <div className="form-field">
          <label>Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="your name" />
        </div>
        <div className="form-field">
          <label>Email</label>
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
        </div>
      </div>
      <div className="form-field">
        <label>Topic</label>
        <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
          <option>Consulting — help us scale</option>
          <option>Full-time role</option>
          <option>Contract engagement</option>
          <option>Speaking / writing</option>
          <option>Just saying hi</option>
        </select>
      </div>
      <div className="form-field">
        <label>Message</label>
        <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell me what you're building, stage, and what you need." />
      </div>
      <div className="form-submit">
        <button type="submit" className="btn btn-primary">
          Send <span className="arrow">→</span>
        </button>
      </div>
      {sent &&
      <div className="form-success">
          Thanks — I'll reply from williamlopezc@gmail.com within 48 hours.
        </div>
      }
    </form>);

}

function ContactPage() {
  return (
    <Chrome>
      <section className="contact-hero container">
        <div className="page-label" style={{ margin: "0px 0px 24px 80px" }}>/ Contact · 04</div>
        <h1 className="contact-hero-title" style={{ margin: "0px 0px 24px 80px" }}>
          Let's build<br />
          something <span className="accent" style={{ margin: "0px 15px 0px 0px" }}>hard.</span>
        </h1>
        <p className="contact-hero-sub" style={{ margin: "0px 0px 0px 80px" }}>I work with a small number of teams each year on protocol architecture, infra scaling, and turning 0→1 products into production systems. If that's you — tell me what you're building.

</p>

        <div className="availability" style={{ padding: "24px 0px 24px 40px" }}>
          <span style={{ margin: "0px 0px 0px 40px" }}><span className="availability-dot" />Taking engagements · Q2 2026 onward</span>
          <span style={{ margin: "0px 440px 0px 0px" }}>Reply within 48 hours</span>
        </div>
      </section>

      <section className="container" style={{ paddingTop: 'var(--sp-4)' }}>
        <div className="contact-grid">
          <div className="contact-block">
            <div className="contact-block-label">Direct channels</div>
            <a className="contact-link" href="https://linkedin.com/in/william-lopez-cordero">
              <span>LinkedIn</span>
              <span className="contact-link-arrow">↗</span>
            </a>
            <a className="contact-link" href="https://github.com/wcordelo">
              <span>GitHub · wcordelo</span>
              <span className="contact-link-arrow">↗</span>
            </a>
          </div>
          <div className="contact-block">
            <div className="contact-block-label">Send a message</div>
            <ContactForm />
          </div>
        </div>
      </section>
    </Chrome>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<ContactPage />);