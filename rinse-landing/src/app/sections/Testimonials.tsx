export function TestimonialsSection() {
  return <section id="testimonials" className="px-6 py-20 border-t border-black/10"><div className="max-w-5xl mx-auto">
    <h2 className="text-4xl font-bold">Built for getting started.</h2>
    <p className="my-5 max-w-xl">You don’t need an expensive software subscription to look organized and get paid.</p>
    <div className="grid md:grid-cols-3 gap-6 mt-8">{[
      ['Your first clients', 'Keep each customer’s contact details, vehicles and notes together.'],
      ['Your next job', 'See what’s scheduled and keep track of work in progress.'],
      ['Your first invoice', 'Send a clear invoice and give customers a secure way to pay.'],
    ].map(([title, description]) => <article key={title} className="border border-black/10 rounded-2xl p-6"><h3 className="font-bold text-xl mb-3">{title}</h3><p>{description}</p></article>)}</div>
  </div></section>;
}
