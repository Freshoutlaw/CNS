# Craig's Nails Studio

Premium editorial-style nail studio website with a two-step appointment request flow.

## Stack
- Semantic HTML, CSS and vanilla JavaScript
- GSAP + ScrollTrigger for progressive motion
- Responsive layout with reduced-motion support
- WhatsApp Click-to-Chat booking (customer reviews and sends the message)

## Local development
Open `index.html` in a browser or run a static server from the repository root:

```bash
python3 -m http.server 3000
```

## Configuration
- WhatsApp destination is configured at the top of `app.js` as `2348126309492`.
- Service catalogue copy is in `index.html`.
- No prices, opening hours, studio address, awards, testimonials, or live availability are fabricated.
- All appointments remain requests until the studio confirms them in WhatsApp.

## Image sources
The gallery currently references the existing Craig's Nails Studio image assets in the companion repository `Freshoutlaw/Craig-Nails-Studio`. Replace these URLs with approved production asset URLs when the final image library is added.

## Deployment
Vercel should deploy this as a static site from the repository root. No environment variables are required for the WhatsApp click-to-chat flow.
