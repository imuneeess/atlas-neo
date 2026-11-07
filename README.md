# Atlas Neo — 3D animated bank concept

A multi-page, animated 3D website for a **fictional** Moroccan digital bank, built as a portfolio piece.
No build step: plain HTML, CSS and JavaScript, with [Three.js](https://threejs.org) loaded from a CDN.

> Atlas Neo is a made-up brand. It is not a real bank and is not affiliated with any financial institution.

## Pages

| Page | 3D / animation |
| --- | --- |
| `index.html` | Floating metal cards, orbiting zellige stars, particle field, scroll-driven camera, rotating security "vault" |
| `cards.html` | Card configurator: drag to rotate (with inertia), double-click to flip, 4 designs with a spin transition |
| `invest.html` | GPU shader wave terrain that reacts to the mouse, floating coins, live savings calculator |
| `about.html` | Draggable dotted globe with animated arcs from Casablanca, scroll timeline |
| `contact.html` | Iridescent torus knot that reacts while you type, floating-label form (demo only, nothing is sent) |

Shared effects: page-transition curtain, split-word headline reveals, scroll reveals, counters, custom cursor, 3D tilt cards, magnetic buttons, scroll progress bar, and support for `prefers-reduced-motion`.

## Run locally

ES modules need a local server (opening the file directly won't work):

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Deploy to GitHub Pages

1. Push this folder to a new GitHub repository.
2. In the repo, go to **Settings → Pages**, set **Source** to *Deploy from a branch*, and choose `main` / `root`.
3. Your site goes live at `https://<your-username>.github.io/<repo-name>/`.

## Structure

```
css/style.css          design system, layout, animations
js/main.js             shared UI interactions
js/scenes/common.js    Three.js helpers (stage, lights, card, star, particles)
js/scenes/*.js         one 3D scene per page
```

## Customize

- Brand colors are CSS variables at the top of `css/style.css`.
- Card designs live in `CARD_THEMES` in `js/scenes/common.js`.
- Put your name in the footer of each HTML page ("portfolio concept by Your Name").
