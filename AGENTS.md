# Personal Digital World

## Project Collaboration Guidelines

This repository is building a personal interactive digital portfolio world.

The website is not a traditional portfolio website.

It is a personal digital environment that combines:

- personal identity
- design portfolio
- photography archive
- travel diary
- digital memories
- interactive exploration

The user should feel like entering a private digital world rather than browsing a normal website.

---

# 1. Core Product Concept

The experience structure:

Entrance World
↓
Interactive Digital Space
↓
Personal Archives

Main spaces:

1. 2026 Portfolio Archive
2. Photography Archive
3. Travel Diary Archive

These are independent content worlds.

They share the same Website Shell but must not be merged.

---

# 2. Website Architecture

The project consists of two major layers:

## Website Shell

Stable interactive environment:

- entrance gate
- background world
- navigation system
- desktop/window framework
- interaction system
- responsive behavior

## Content Modules

Replaceable personal content:

- portfolio projects
- photos
- travel records
- advertisements
- personal information

Content should be data-driven and modular.

Do not hard-code specific content directly into reusable components.

---

# 3. Visual Direction

## Overall Style

The visual direction is:

Y2K digital nostalgia +
early internet aesthetics +
Windows XP era memory +
future virtual environment.

The world should feel like:

"a personal computer world from the future imagined in the early 2000s."

## Important Visual Keywords

Use:

- Y2K interface
- early internet graphics
- Windows XP nostalgia
- digital dreamscape
- virtual desktop world
- glossy interface
- soft futuristic atmosphere
- playful digital artifacts

## Avoid

Do NOT interpret this project as:

- modern SaaS website
- Apple minimal website
- corporate portfolio website
- empty futuristic showroom
- generic blue gradient landing page

The project should not become overly clean or empty.

The richness comes from:

- interactive objects
- interface elements
- digital memories
- small visual details

Not from simply adding large decorative graphics.

---

# 4. Entrance World

The entrance is a physical-to-digital transition.

The main entrance element:

A retractable metal gate.

Requirements:

- NOT a roller shutter.
- It is a realistic expandable gate.
- Opens from the center toward left and right.
- Left and right outer frames remain fixed.
- Opening animation should feel like a real physical gate.

The gate should have:

- metallic texture
- 2.5D depth
- realistic lighting
- visible background through the gaps

Do not make it:

- flat geometric bars
- wooden fence
- solid wall
- full opaque panel

---

# 5. Background World

Behind the gate is the Personal Digital World.

It is NOT a simple background.

The environment should contain:

## Atmosphere

The world should feel translucent and bright, but not empty.

Maintain white-blue transparency while allowing layered digital details, nostalgic internet elements, and environmental depth.

## Ground

Inspired by Windows XP grass memory.

Important:

Do NOT copy Windows XP wallpaper.

Use:

- digital grass
- soft green landscape
- curved terrain
- virtual meadow feeling

Do NOT include:

- blue sky
- clouds
- realistic outdoor photography

The ground should feel like:

"a digital recreation of nature inside a computer world."

---

# 6. Interactive Objects

The main world will gradually contain interactive objects.

Examples:

- folders
- windows
- icons
- stickers
- advertisements
- digital artifacts

Objects should feel placed inside the world.

Avoid traditional website buttons.

---

# 7. Main Archive Entrances

Three main clickable objects:

## 2026 Portfolio Archive

Possible visual language:

- Windows folder
- archive file
- digital document
- software window

## Photography Archive

Possible visual language:

- photo library
- camera system
- image viewer

## Travel Diary Archive

Possible visual language:

- map database
- travel file
- digital journal

They should behave like objects in a desktop world.

---

# 8. Window System

Secondary pages should not feel like normal webpage navigation.

Preferred interaction:

Desktop object
↓
Click
↓
Windows-style window opens
↓
Content appears inside

The window system should support:

- draggable feeling
- expandable content
- archive browsing

---

# 9. Responsive Requirements

Desktop and mobile share the same React components.

Do not create separate versions.

Important:

The digital world should adapt without destroying composition.

For example:

Gate:

- maintain proportions
- adjust repeated modules
- never stretch individual elements

Avoid:

- distorted gate
- broken connections
- compressed background
- collapsed layouts

---

# 10. Development Rules

Before changing existing systems:

Understand current architecture.

Do not:

- rewrite the whole project
- replace dependencies
- reorganize folders
- redesign unrelated components

Every task should focus on the requested stage.

---

# 11. Development Stages

## Stage 1

Build:

- gate system
- opening animation
- basic world container
- responsive foundation

## Stage 2

Build:

- richer digital environment
- grass landscape
- atmosphere
- first interactive objects

## Stage 3

Build:

- archive entrances
- Windows-style content windows
- portfolio/photo/travel modules

Future stages:

- advertisement system
- personal information stickers
- deeper interactions

---

# 12. Asset Management

Assets should be organized:

ASSETS/

navigation/
advertisements/
portfolio/
photography/
travel-diary/
background/
objects/

Reference images:

REFERENCES/

are only for:

- visual direction
- atmosphere
- material reference

Do not directly copy protected layouts or designs.

---

# 13. Coding Philosophy

Prioritize:

1. Stable architecture
2. Replaceable content
3. Smooth interaction
4. Visual consistency

Do not optimize only for speed of implementation.

This project is an interactive personal world, not just a webpage.

---

# 14. Locked Gate Module and CSS Isolation

Fence / Gate is a locked visual module. Unless the user explicitly requests a
gate change, do not modify Gate component, Gate stylesheet, Gate geometry, Gate
animation, responsive sizing, or visual parameters. New modules must adapt
around the existing Gate rather than changing it.

New module styles must be scoped to their own component namespace and must not
use broad global selectors that can affect Gate. In particular, do not introduce
unscoped rules for `img`, `svg`, `canvas`, `button`, `.window`, `.scene`, or a
universal selector. Any reset or component-specific adjustment must remain
inside that module's namespace.
