import { API_URL } from '../shared/urls';
export function Footer() {
  return <footer className="px-6 py-12 border-t border-black/10"><div className="max-w-7xl mx-auto flex flex-wrap gap-8 justify-between">
    <p>Rinse · For your first client and the jobs that follow.</p>
    <nav aria-label="Footer" className="flex gap-5 flex-wrap"><a href="/features">Features</a><a href="/#pricing">Pricing</a><a href={`${API_URL}/privacy`}>Privacy</a><a href={`${API_URL}/terms`}>Terms</a></nav>
  </div></footer>;
}
