import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <>
      <Header/>
      <main className="charge-shell editorial-page">
        <p className="editorial-kicker">OUR STORY</p>
        <h1>Designed for Intentional Living</h1>
        <div className="editorial-grid">
          <div>
            <p>Velvet Journal Co creates thoughtfully designed journals and planners for people who want to reflect, plan with purpose, and make meaningful progress one page at a time.</p>
            <p>Our collection brings together gratitude journals, goal-setting journals, wellness journals, planners, and guided notebooks selected to support mindfulness, personal growth, and intentional everyday routines.</p>
            <p>We believe a journal can be more than stationery. It can be a private place to capture ideas, build better habits, celebrate progress, and return to what matters.</p>
          </div>
          <img src="/charge-media/aesthetic_1.jpg" alt="Velvet Journal Co"/>
        </div>
      </main>
      <Footer/>
    </>
  );
}
