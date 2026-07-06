const COLUMNS = [
  { title: 'Company', links: ['About', 'Jobs', 'For the Record'] },
  { title: 'Communities', links: ['For Artists', 'Developers', 'Advertising', 'Investors', 'Vendors'] },
  { title: 'Useful links', links: ['Support', 'Free Mobile App', 'Popular by Country', 'Import your music'] },
  { title: 'Spotify Plans', links: ['Premium Standard', 'Premium Platinum', 'Premium Student', 'Spotify Free'] },
]

const LEGAL_LINKS = ['Legal', 'Safety & Privacy Center', 'Privacy Policy', 'Cookies', 'About Ads', 'Accessibility']

function SocialIcon({ path }) {
  return (
    <span className="w-9 h-9 rounded-full bg-[#292929] hover:bg-[#3a3a3a] flex items-center justify-center cursor-pointer transition-colors">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff">
        <path d={path} />
      </svg>
    </span>
  )
}

export default function Footer() {
  return (
    <footer className="mt-16 pt-8 border-t border-[#292929]">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-white font-bold text-sm mb-3">{col.title}</h3>
            <ul className="flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link}>
                  <span className="text-spotify-gray text-sm hover:text-white transition-colors cursor-pointer">{link}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-[#292929] pt-6">
        <div className="flex items-center gap-3">
          <SocialIcon path="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.332 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.668-.072-4.948-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
          <SocialIcon path="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          <SocialIcon path="M22.675 0h-21.35c-.734 0-1.325.591-1.325 1.325v21.351c0 .733.591 1.324 1.325 1.324h11.494v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24h-1.918c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.733 0 1.324-.591 1.324-1.324v-21.35c0-.734-.59-1.325-1.324-1.325z" />
        </div>
        <span className="text-spotify-gray text-xs">© 2026 Spotify AB</span>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6">
        {LEGAL_LINKS.map((link) => (
          <span key={link} className="text-spotify-gray text-xs hover:text-white transition-colors cursor-pointer">
            {link}
          </span>
        ))}
      </div>
    </footer>
  )
}
