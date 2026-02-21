# Retrokit

A lightweight pixel-perfect 2D browser game ~~framework~~ template for modern JavaScript.

Retrokit provides:

* Pixel-perfect rendering (no blur, no half-pixel jitter)
* Camera & integer viewport scaling
* Keyboard & input handling
* Sound support
* Text rendering utilities
* No build step required
* Scene-based architecture

Designed to feel the simplicity of JS with convenient setup (you can vibe code the game and still maintain it with this template).

---

# Project Structure

retrokit/           → Engine core (modify if you dare, and submit PR to the repo)
src/                → Your game code (START HERE)
sprites/            → Image assets
audio/              → Sound assets
index.html          → Entry HTML
index.js            → Entry JS
styles.css          → Styles (normally you would not modify this, except you want ot change the background or fonts)

Everything inside `retrokit/` is the engine and should not be modified for normal development.
Game development should happen inside the `src/` folder.

---

# Quick Start

## 1. Install a local HTTP server

npm install -g http-server

(or use `npx http-server`)

## 2. Start the project

From the project root:

http-server -c-1

Then open in your browser:

[http://localhost:8080](http://localhost:8080)

Do NOT open `index.html` directly from the filesystem. ES modules require an HTTP server.

---

# Debugging

You can debug using:

* Browser DevTools (F12 → Console / Sources)
* WebStorm → JS Debug configuration
* VS Code → Chrome Debug extension

No build step is required.

---

# Creating Your Game

1. Define sprites and sounds in `src/startup.js`
2. Create scenes in `src/scenes/`
3. Create game objects in `src/gameObjects/`
4. Use viewport scaling via `super({ vpWidth: 128 })` or `vpHeight`

Objects render through the viewport by default.
For UI elements, set:

this.gui = true;

---

# License

MIT License

Copyright (c) 2026 Artem Ovechko

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---

Author: Artem Ovechko
