# Javascript Tools

<div align="center">

This repository is dedicated to JavaScript scripts and experimental tools.  
It contains a variety of small projects, mostly ideas I explored or tools I needed at some point during development.

</div>

---

## Overview

This repository gathers multiple JavaScript-based tools, split between:

- Scripts with web interface
- Scripts with console interface

The goal is to experiment with different types of JavaScript applications, ranging from visual generators to command-line utilities.

---

## Scripts with web interface

*(No projects listed yet in this category)*

---

## Scripts with console interface

### Nether Portal Spiral Generator

**Goal:** Generate a looping spiral/portal animation and export it in three formats:
- Individual PNG frames  
- Animated GIF  
- Sprite sheet  

Specifications:
- 24 frames
- 128×128px resolution
- 50ms per frame (~1.2s loop animation)

This tool focuses on procedural animation generation and export automation.

---

### Perlin Noise Generator

**Goal:** Generate one or more grayscale Perlin noise images from the command line, fully deterministic using a seed.

This tool is useful for procedural generation, especially in game development contexts.

#### Parameters

| Flag | Default | Description |
|------|--------|-------------|
| `--scale` | 4 | Zoom level of the noise pattern |
| `--seed` | random | Ensures reproducible output |
| `--count` | 1 | Number of images to generate |
| `--width` / `--height` | 1024 | Output resolution |
| `--out` | Desktop | Output folder (supports aliases like bureau, downloads) |

---

## Purpose

This project was created to:

- Experiment with JavaScript-based procedural generation
- Build small reusable developer tools
- Practice working with both CLI and visual outputs
- Explore creative coding techniques

---

## Future Improvements

- Add more web-based tools
- Improve UI for visual generators
- Expand export formats
- Add documentation for each script
- Refactor into a more modular structure

---

## Author

Andras Corda  
Game Development student

---

## Links

- GitHub: https://github.com/Andras-corda
- LinkedIn: https://www.linkedin.com/in/andras-corda-7650393a1/
