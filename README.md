# Pokémon: Breath of the Dragon
### *Chronicles of the Obsidian Syndicate* — 16-Bit SNES Fan RPG

**Play Online (GitHub Pages):** https://exaltedgrey.github.io/BestPokemon/

A playable 16-bit SNES-style browser RPG that blends the classic feel of **Breath of Fire (SNES)** with the creatures, world, and anti-hero intrigue of a **Pokémon fan game (inspired by Team Rocket Edition)**.

## Highlights
- **Isometric 4vN Breath of Fire Battles**: Diagonal 16-bit SNES battle arena with a 4-Pokémon active party, classic royal-blue BoF HUD, 7-icon command bar, Auto-Battle, Guard, Pokémon type matchups, and wild Pokémon capture Orbs.
- **Dragon Resonance Transformations**: Awaken the Ancient Dragon Statue in Verdant Wilds (and uncover Dragon Crests inside Sunken Emerald Shrine) to transform your bonded starter mid-battle into **Whelp Resonance**, **Pyre Wyrm**, or **Bolt Wyrm**!
- **4-Pokémon Trailing Party & Lead Field Skills**: Rotate your Lead Pokémon on the fly (`Tab` / `Q` / `E`) and press `C` / `Space` to use **Ember Torch**, **Razor Cut**, **Tremor Dig**, or **Surge / Angler** to solve shrine puzzles and uncover hidden treasures.
- **Expanded Embervale Village & 10-Entry Lore Codex**: Explore Embervale Garrison, the Dragon-Well Plaza, Memorial Grove, and 3 enterable interiors (**Hearth & Wing PokéTavern**, **Taro's Supply & Apothecary**, and **Elder Rowan's Cottage**) while unlocking Chronicles in your Camp Menu's **Lore Codex**.
- **Day / Night Cycle & Willow Pier Fishing**: Real-time overworld lighting transitions with glowing lanterns and distinct nocturnal wild encounters (`Gastly`, `Zubat`, `Houndour`), plus a classic *Breath of Fire* fishing mini-game!
- **Auto-Save + Portable Save Files**: Automatic checkpoint saving (`AUTO-SAVE`) plus 3 manual slots in browser storage, **Quick Save (`💾 Save`)**, and downloadable/uploadable `.json` save files (`⬇ Export` / `⬆ Import`).

## Controls
| Key | Action |
| :--- | :--- |
| `WASD` / `Arrow Keys` | Turn in place (tap) & move (hold) / navigate menus |
| `Z` / `Enter` | Confirm / Talk / Read / Open Chest / Fish |
| `X` / `Esc` | Cancel / Camp Pause Menu |
| `C` / `Space` | Use Lead Pokémon's Field Skill |
| `Tab` / `E` / `Q` | Rotate Lead Pokémon |
| `M` | Toggle SNES Synth Audio |

## Development & Build
```bash
npm install
npm run typecheck
npm test
npm run dev
npm run build         # Production web bundle (dist/)
npm run build:single  # Self-contained single-file HTML (dist-single/)
```
