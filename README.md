# Rose & Thread - Clothing Boutique HTML Template

A static HTML5, CSS3, Bootstrap 5 clothing boutique and fashion store website. Built for modern front-end template presentation with dark mode, RTL support, responsive sections, Font Awesome icons, Google Fonts, SEO tags, JSON-LD, sitemap, robots, and documentation.

## Pages

- pages/index.html
- pages/about.html
- pages/collections.html
- pages/product-details.html
- pages/lookbook.html
- pages/size-guide.html
- pages/blog.html
- pages/blog-details.html
- pages/contact.html
- pages/404.html
- pages/coming-soon.html

## Features

- CSS variables for theme colors
- Playfair Display headings and Lato body font
- Bootstrap 5 responsive layout
- Font Awesome icons only
- Sticky white navbar with cart icon and mobile hamburger
- Dark/light mode toggle
- RTL stylesheet
- Client-side contact/comment form validation
- Countdown timer on coming soon page
- WebP image assets with alt text
- Google Maps, Formspree, Mailchimp, Stripe/PayPal placeholders

## Browser Support

Test with latest Chrome, Firefox, Safari, and Edge.

## How to Run

Open `pages/index.html` directly or use VS Code Live Server.


Update Notes:
- Added a top offer banner above the navbar on all pages.
- Changed navbar behavior to sticky-top so the banner is visible first.
- Added beginner-friendly HTML comments across all pages for easy explanation.


## Checkout
- Checkout does not require an account: the shopper can enter name, email, phone, and address directly on `pages/checkout.html` and the order is saved to browser localStorage.
- An optional account system is available via the sign-in icon in the navbar (`pages/login.html`, `pages/register.html`), including simulated Google/Apple sign-in. Accounts are stored in browser localStorage; this is a front-end demo with no real backend or OAuth.


Updates in this version:
- Removed visible RTL/LTR buttons from all pages while keeping the direction function in assets/js/main.js.
- Added checkout.html with customer validation, shipping details, payment method and order saving to localStorage.
- Cart payment button now opens the checkout page.


## Product update
- Collections page now includes the 10 requested products.
- Search, category, price and sort filters are added.
- Product details page loads details dynamically using `product-details.html?id=product-id`.
