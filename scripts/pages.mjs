// route key -> [original webflow file, react route]
export const PAGES = {
  home: ['index.html', '/'],
  about: ['about-us.html', '/about-us'],
  terms: ['terms-and-conditions.html', '/terms-and-conditions'],
  privacy: ['privacy-policy.html', '/privacy-policy'],
  refunds: ['refunds-cancellation.html', '/refunds-cancellation'],
  eligibility: ['eligibility-restrictions.html', '/eligibility-restrictions'],
}
export const ORIGINAL_BASE = process.env.ORIGINAL_BASE || 'http://localhost:5500'
export const REACT_BASE = process.env.REACT_BASE || 'http://localhost:4173'
export const WIDTHS = [1440, 991, 767, 479]
