export default function Home() {
  return (
    <>
      <section className="hero" aria-labelledby="home-title">
        <h1 id="home-title">SmartChair</h1>

        <p>
          Academic paper submission and blind peer review platform inspired by
          conference management systems such as EasyChair.
        </p>

        <a href="/submissions" className="button">
          Submit a Paper
        </a>
      </section>

      <section aria-labelledby="features-title">
        <h2 id="features-title">Core Modules</h2>

        <div className="cards">
          <article className="card">
            <h3>Paper Submission</h3>
            <p>
              Authors can upload and manage research papers through a structured
              submission workflow.
            </p>
          </article>

          <article className="card">
            <h3>Blind Peer Review</h3>
            <p>
              Reviewers evaluate submissions anonymously to ensure academic
              integrity and fairness.
            </p>
          </article>

          <article className="card">
            <h3>Conference Management</h3>
            <p>
              Administrators can organize tracks, users, review processes and
              publication stages.
            </p>
          </article>
        </div>
      </section>
    </>
  )
}