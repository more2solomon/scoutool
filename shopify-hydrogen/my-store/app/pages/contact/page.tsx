import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Contact() {
  return (
    <>
      <Header />

      <div className="breadcrumb charge-shell">
        <a href="/">Home</a> › <span>Contact</span>
      </div>

      <main className="charge-shell contact-page">
        <h1>Contact</h1>

        <div className="contact-columns">
          <form className="contact-form" action="mailto:gnewton581@gmail.com" method="post" encType="text/plain">
            <div className="contact-two">
              <label>Name<input name="name" placeholder="Name" /></label>
              <label>Email*<input required name="email" type="email" placeholder="Email" /></label>
            </div>

            <label>Comment*
              <textarea required name="comment" placeholder="Comment" />
            </label>

            <button className="charge-button" type="submit">Send message</button>
          </form>

          <aside className="contact-info">
            <h2>Got Questions?</h2>
            <p>If you'd like to learn more about us and our products, contact us!</p>
            <div className="contact-info-grid">
              <div>
                <b>Company Info</b>
                <p>VELVET JOURNAL CO<br/>Online Store<br/>Worldwide Shipping</p>
              </div>
              <div>
                <b>Contact Info</b>
                <p><a href="mailto:gnewton581@gmail.com">gnewton581@gmail.com</a></p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
