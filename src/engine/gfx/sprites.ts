import type { Direction, TileType } from '@engine/types';

export const TILE_SIZE = 16;

interface MonVisual {
  body: string;
  shade: string;
  accent: string;
  eye: string;
  shape: 'biped' | 'serpent' | 'quad' | 'avian' | 'ghost' | 'star' | 'dragon' | 'fish' | 'plant';
  aura?: string;
}

const MON_VISUALS: Record<string, MonVisual> = {
  charmander: { body: '#f07828', shade: '#b84818', accent: '#ffe066', eye: '#183850', shape: 'biped' },
  charmeleon: { body: '#d83828', shade: '#981818', accent: '#ffd040', eye: '#184048', shape: 'biped' },
  dratini: { body: '#5898e8', shade: '#3060a8', accent: '#f0f8ff', eye: '#181838', shape: 'serpent' },
  dragonair: { body: '#4c90f0', shade: '#2858a8', accent: '#80e8ff', eye: '#101840', shape: 'serpent', aura: '#80e8ff' },
  bulbasaur: { body: '#58b890', shade: '#307860', accent: '#48a838', eye: '#c02828', shape: 'plant' },
  ivysaur: { body: '#48a890', shade: '#286860', accent: '#e85888', eye: '#c02828', shape: 'plant' },
  pikachu: { body: '#f8d030', shade: '#c89818', accent: '#e03828', eye: '#181818', shape: 'biped' },
  sandshrew: { body: '#e0c068', shade: '#a88438', accent: '#f8f0d0', eye: '#181818', shape: 'biped' },
  pidgey: { body: '#c89860', shade: '#886038', accent: '#f8e8c8', eye: '#181818', shape: 'avian' },
  oddish: { body: '#4860a8', shade: '#283870', accent: '#48b848', eye: '#d82828', shape: 'plant' },
  growlithe: { body: '#e87830', shade: '#a84818', accent: '#f8e8c0', eye: '#201818', shape: 'quad' },
  poliwag: { body: '#4880d8', shade: '#285098', accent: '#f8f8ff', eye: '#181828', shape: 'fish' },
  magikarp: { body: '#e85028', shade: '#a82818', accent: '#f8d840', eye: '#181818', shape: 'fish' },
  gyarados: { body: '#3080d8', shade: '#184890', accent: '#f0e088', eye: '#e03028', shape: 'dragon' },
  staryu: { body: '#c89048', shade: '#885828', accent: '#e83048', eye: '#f8d048', shape: 'star' },
  eevee: { body: '#b88048', shade: '#784820', accent: '#f0e0c0', eye: '#281810', shape: 'quad' },
  gastly: { body: '#302048', shade: '#181028', accent: '#a858d8', eye: '#f8f8f8', shape: 'ghost' },
  zubat: { body: '#4868b8', shade: '#283878', accent: '#b84898', eye: '#f8f8f8', shape: 'avian' },
  houndour: { body: '#383848', shade: '#181824', accent: '#e06028', eye: '#e03028', shape: 'quad' },
  scyther: { body: '#58b848', shade: '#307828', accent: '#f0f8e8', eye: '#181818', shape: 'avian' },
  shadow_gyarados: {
    body: '#482078',
    shade: '#200c40',
    accent: '#e048ff',
    eye: '#ff3048',
    shape: 'dragon',
    aura: '#b040ff',
  },
  res_whelp: {
    body: '#40b8ff',
    shade: '#1860a8',
    accent: '#fff088',
    eye: '#ffffff',
    shape: 'dragon',
    aura: '#58d8ff',
  },
  res_pyre: {
    body: '#ff5020',
    shade: '#a01810',
    accent: '#ffe860',
    eye: '#ffffff',
    shape: 'dragon',
    aura: '#ff7030',
  },
  res_bolt: {
    body: '#f8d828',
    shade: '#b07810',
    accent: '#90f0ff',
    eye: '#ffffff',
    shape: 'dragon',
    aura: '#ffe850',
  },
};

/**
 * Renders a crisp 16x16 SNES-style tile with animation support.
 */
export function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: TileType,
  px: number,
  py: number,
  tick: number,
): void {
  const x = Math.round(px);
  const y = Math.round(py);

  switch (tile) {
    case 'grass': {
      ctx.fillStyle = '#489840';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#58b048';
      ctx.fillRect(x + 2, y + 3, 2, 2);
      ctx.fillRect(x + 10, y + 10, 2, 2);
      ctx.fillStyle = '#388032';
      ctx.fillRect(x + 12, y + 4, 2, 1);
      ctx.fillRect(x + 4, y + 12, 2, 1);
      break;
    }
    case 'tall_grass': {
      ctx.fillStyle = '#3a8436';
      ctx.fillRect(x, y, 16, 16);
      const sway = Math.floor(Math.sin(tick * 0.08 + x * 0.2) * 1);
      ctx.fillStyle = '#256028';
      for (let i = 1; i < 15; i += 4) {
        ctx.fillRect(x + i, y + 6, 2, 9);
      }
      ctx.fillStyle = '#62c44c';
      for (let i = 1; i < 15; i += 4) {
        ctx.fillRect(x + i + sway, y + 2, 2, 6);
        ctx.fillRect(x + i + 1, y + 8, 2, 5);
      }
      break;
    }
    case 'path': {
      ctx.fillStyle = '#c8a868';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#b08c50';
      ctx.fillRect(x + 3, y + 4, 3, 2);
      ctx.fillRect(x + 10, y + 11, 3, 2);
      ctx.fillStyle = '#dcc080';
      ctx.fillRect(x + 8, y + 3, 2, 2);
      break;
    }
    case 'sand': {
      ctx.fillStyle = '#e0c878';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#c8a858';
      ctx.fillRect(x + 4, y + 5, 2, 1);
      ctx.fillRect(x + 11, y + 11, 2, 1);
      break;
    }
    case 'water': {
      ctx.fillStyle = '#2868c0';
      ctx.fillRect(x, y, 16, 16);
      const wave = Math.floor(tick * 0.1) % 8;
      ctx.fillStyle = '#4890e8';
      ctx.fillRect(x + ((wave + 1) % 12), y + 4, 4, 1);
      ctx.fillRect(x + ((12 - wave) % 12), y + 11, 4, 1);
      ctx.fillStyle = '#78b8ff';
      ctx.fillRect(x + ((wave + 2) % 12), y + 4, 2, 1);
      break;
    }
    case 'pier': {
      ctx.fillStyle = '#2868c0';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#8c5830';
      ctx.fillRect(x, y + 1, 16, 14);
      ctx.fillStyle = '#683c1c';
      for (let i = 3; i < 16; i += 4) {
        ctx.fillRect(x + i, y + 1, 1, 14);
      }
      ctx.fillStyle = '#b07844';
      ctx.fillRect(x, y + 2, 16, 2);
      break;
    }
    case 'tree': {
      ctx.fillStyle = '#388032';
      ctx.fillRect(x, y, 16, 16);
      // Trunk
      ctx.fillStyle = '#684020';
      ctx.fillRect(x + 6, y + 10, 4, 6);
      // Layered canopy
      ctx.fillStyle = '#1c5024';
      ctx.fillRect(x + 1, y + 2, 14, 10);
      ctx.fillStyle = '#2c7834';
      ctx.fillRect(x + 2, y + 1, 12, 9);
      ctx.fillStyle = '#48a844';
      ctx.fillRect(x + 3, y + 2, 9, 5);
      ctx.fillStyle = '#78d058';
      ctx.fillRect(x + 4, y + 2, 4, 2);
      break;
    }
    case 'wall': {
      ctx.fillStyle = '#505870';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#6c7692';
      ctx.fillRect(x + 1, y + 1, 14, 6);
      ctx.fillRect(x + 1, y + 9, 6, 6);
      ctx.fillRect(x + 9, y + 9, 6, 6);
      ctx.fillStyle = '#343a4d';
      ctx.fillRect(x, y + 7, 16, 1);
      ctx.fillRect(x, y + 15, 16, 1);
      break;
    }
    case 'shrine_wall': {
      ctx.fillStyle = '#243c3c';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#385c58';
      ctx.fillRect(x + 1, y + 1, 14, 7);
      ctx.fillStyle = '#2d4c4a';
      ctx.fillRect(x + 1, y + 9, 14, 6);
      ctx.fillStyle = '#50a888';
      ctx.fillRect(x + 6, y + 4, 4, 2);
      break;
    }
    case 'shrine_floor': {
      ctx.fillStyle = '#2c4648';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#38585a';
      ctx.fillRect(x + 1, y + 1, 14, 14);
      ctx.fillStyle = '#243a3c';
      ctx.fillRect(x + 7, y + 1, 1, 14);
      ctx.fillRect(x + 1, y + 7, 14, 1);
      break;
    }
    case 'floor_stone': {
      ctx.fillStyle = '#687084';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#788298';
      ctx.fillRect(x + 1, y + 1, 6, 6);
      ctx.fillRect(x + 9, y + 9, 6, 6);
      break;
    }
    case 'floor_wood': {
      ctx.fillStyle = '#9c6838';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#7c4c24';
      ctx.fillRect(x, y + 4, 16, 1);
      ctx.fillRect(x, y + 10, 16, 1);
      ctx.fillRect(x + 7, y, 1, 5);
      ctx.fillRect(x + 12, y + 5, 1, 6);
      break;
    }
    case 'carpet': {
      ctx.fillStyle = '#8c2038';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#b83048';
      ctx.fillRect(x + 1, y + 1, 14, 14);
      ctx.fillStyle = '#e8c058';
      ctx.fillRect(x + 2, y + 2, 12, 1);
      ctx.fillRect(x + 2, y + 13, 12, 1);
      break;
    }
    case 'door': {
      ctx.fillStyle = '#503420';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#784e2c';
      ctx.fillRect(x + 2, y + 1, 12, 14);
      ctx.fillStyle = '#f0c850';
      ctx.fillRect(x + 11, y + 8, 2, 2);
      break;
    }
    case 'flowers': {
      drawTile(ctx, 'grass', x, y, tick);
      const bob = Math.sin(tick * 0.08) > 0 ? 1 : 0;
      ctx.fillStyle = '#f85878';
      ctx.fillRect(x + 3, y + 3 + bob, 3, 3);
      ctx.fillStyle = '#ffe050';
      ctx.fillRect(x + 4, y + 4 + bob, 1, 1);
      ctx.fillStyle = '#78d8ff';
      ctx.fillRect(x + 10, y + 9, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 11, y + 10, 1, 1);
      break;
    }
    case 'lamp': {
      drawTile(ctx, 'grass', x, y, tick);
      ctx.fillStyle = '#384058';
      ctx.fillRect(x + 7, y + 6, 2, 10);
      ctx.fillRect(x + 5, y + 14, 6, 2);
      ctx.fillStyle = '#ffe070';
      ctx.fillRect(x + 5, y + 2, 6, 5);
      ctx.fillStyle = '#fff8c0';
      ctx.fillRect(x + 6, y + 3, 4, 3);
      break;
    }
    case 'campfire': {
      drawTile(ctx, 'grass', x, y, tick);
      ctx.fillStyle = '#683818';
      ctx.fillRect(x + 3, y + 10, 10, 3);
      const flicker = Math.floor(tick * 0.25) % 2;
      ctx.fillStyle = '#f05818';
      ctx.fillRect(x + 4, y + 4 + flicker, 8, 7 - flicker);
      ctx.fillStyle = '#ffd840';
      ctx.fillRect(x + 6, y + 6, 4, 4);
      break;
    }
    case 'statue': {
      drawTile(ctx, 'path', x, y, tick);
      ctx.fillStyle = '#586880';
      ctx.fillRect(x + 2, y + 11, 12, 5);
      ctx.fillStyle = '#88a0b8';
      ctx.fillRect(x + 3, y + 2, 10, 10);
      const glow = 0.5 + 0.5 * Math.sin(tick * 0.12);
      ctx.fillStyle = glow > 0.5 ? '#70f0ff' : '#38b8e0';
      ctx.fillRect(x + 6, y + 5, 4, 3);
      break;
    }
    case 'counter': {
      ctx.fillStyle = '#784820';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#b8783c';
      ctx.fillRect(x, y + 2, 16, 6);
      break;
    }
    case 'bed': {
      ctx.fillStyle = '#687084';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#e8ecf8';
      ctx.fillRect(x + 2, y + 1, 12, 5);
      ctx.fillStyle = '#3858a8';
      ctx.fillRect(x + 2, y + 6, 12, 9);
      break;
    }
    case 'sealed_gate': {
      ctx.fillStyle = '#202838';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#586880';
      ctx.fillRect(x + 1, y + 1, 14, 14);
      ctx.fillStyle = '#b048f0';
      ctx.fillRect(x + 6, y + 4, 4, 8);
      ctx.fillRect(x + 4, y + 6, 8, 4);
      break;
    }
    case 'open_gate': {
      drawTile(ctx, 'shrine_floor', x, y, tick);
      ctx.fillStyle = '#58d8a8';
      ctx.fillRect(x + 1, y + 1, 2, 14);
      ctx.fillRect(x + 13, y + 1, 2, 14);
      break;
    }
    case 'bridge': {
      drawTile(ctx, 'water', x, y, tick);
      ctx.fillStyle = '#583014';
      ctx.fillRect(x, y + 1, 16, 14);
      ctx.fillStyle = '#9c6030';
      ctx.fillRect(x, y + 2, 16, 12);
      ctx.fillStyle = '#be7e44';
      for (let i = 1; i < 16; i += 4) {
        ctx.fillRect(x + i, y + 3, 2, 10);
      }
      ctx.fillStyle = '#502c12';
      ctx.fillRect(x, y + 2, 16, 1);
      ctx.fillRect(x, y + 13, 16, 1);
      break;
    }
    case 'cobble': {
      ctx.fillStyle = '#6c768a';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#94a0b8';
      ctx.fillRect(x + 1, y + 1, 6, 6);
      ctx.fillRect(x + 9, y + 1, 6, 5);
      ctx.fillRect(x + 1, y + 9, 5, 6);
      ctx.fillRect(x + 8, y + 8, 7, 7);
      ctx.fillStyle = '#b4c0d6';
      ctx.fillRect(x + 2, y + 2, 4, 2);
      ctx.fillRect(x + 9, y + 9, 4, 2);
      break;
    }
    case 'roof_red':
    case 'roof_blue':
    case 'roof_green':
    case 'roof_slate': {
      const palettes: Record<string, [string, string, string, string]> = {
        roof_red: ['#6e2028', '#a8343c', '#d45256', '#3a1016'],
        roof_blue: ['#1c3068', '#2c4c98', '#4874cc', '#101a3a'],
        roof_green: ['#1d4e34', '#2e7c52', '#4aa872', '#102a1c'],
        roof_slate: ['#242838', '#3c445c', '#586484', '#141720'],
      };
      const [dark, mid, light, eave] = palettes[tile];
      ctx.fillStyle = dark;
      ctx.fillRect(x, y, 16, 16);
      // Shingle rows
      ctx.fillStyle = mid;
      ctx.fillRect(x, y + 1, 16, 4);
      ctx.fillRect(x, y + 6, 16, 4);
      ctx.fillRect(x, y + 11, 16, 3);
      ctx.fillStyle = light;
      for (let i = 1; i < 15; i += 4) {
        ctx.fillRect(x + i, y + 2, 2, 1);
        ctx.fillRect(x + i + 1, y + 7, 2, 1);
        ctx.fillRect(x + i, y + 12, 2, 1);
      }
      ctx.fillStyle = eave;
      ctx.fillRect(x, y + 14, 16, 2);
      break;
    }
    case 'facade_timber': {
      ctx.fillStyle = '#dfd0b4';
      ctx.fillRect(x, y, 16, 16);
      // Timber beams
      ctx.fillStyle = '#6e4422';
      ctx.fillRect(x, y, 2, 16);
      ctx.fillRect(x + 14, y, 2, 16);
      ctx.fillRect(x, y, 16, 2);
      ctx.fillRect(x, y + 10, 16, 2);
      // Stone skirting
      ctx.fillStyle = '#6c7484';
      ctx.fillRect(x, y + 12, 16, 4);
      ctx.fillStyle = '#484e5e';
      ctx.fillRect(x, y + 15, 16, 1);
      break;
    }
    case 'facade_stone': {
      ctx.fillStyle = '#464e64';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#606a86';
      ctx.fillRect(x + 1, y + 1, 6, 5);
      ctx.fillRect(x + 9, y + 1, 6, 5);
      ctx.fillRect(x + 4, y + 8, 8, 5);
      ctx.fillStyle = '#2c3242';
      ctx.fillRect(x, y + 14, 16, 2);
      break;
    }
    case 'window_lit': {
      drawTile(ctx, 'facade_timber', x, y, tick);
      ctx.fillStyle = '#4c3018';
      ctx.fillRect(x + 3, y + 3, 10, 8);
      const shimmer = Math.sin(tick * 0.08 + x) > 0 ? '#ffe888' : '#ffd060';
      ctx.fillStyle = shimmer;
      ctx.fillRect(x + 4, y + 4, 8, 6);
      ctx.fillStyle = '#5c3c20';
      ctx.fillRect(x + 7, y + 4, 2, 6);
      ctx.fillRect(x + 4, y + 6, 8, 2);
      break;
    }
    case 'fence': {
      drawTile(ctx, 'grass', x, y, tick);
      ctx.fillStyle = '#5c381c';
      ctx.fillRect(x + 1, y + 4, 3, 10);
      ctx.fillRect(x + 12, y + 4, 3, 10);
      ctx.fillStyle = '#a06a38';
      ctx.fillRect(x + 2, y + 5, 2, 8);
      ctx.fillRect(x + 12, y + 5, 2, 8);
      ctx.fillRect(x, y + 7, 16, 2);
      ctx.fillRect(x, y + 11, 16, 2);
      break;
    }
    case 'fountain': {
      drawTile(ctx, 'cobble', x, y, tick);
      // Stone basin
      ctx.fillStyle = '#38465e';
      ctx.fillRect(x + 1, y + 4, 14, 11);
      ctx.fillStyle = '#788ca8';
      ctx.fillRect(x + 2, y + 5, 12, 9);
      ctx.fillStyle = '#2878d8';
      ctx.fillRect(x + 3, y + 6, 10, 7);
      // Dragon pillar & animated splash
      ctx.fillStyle = '#9cb4cc';
      ctx.fillRect(x + 6, y + 2, 4, 8);
      const jet = Math.floor(tick * 0.25) % 2;
      ctx.fillStyle = '#a8f0ff';
      ctx.fillRect(x + 6, y + jet, 4, 3);
      ctx.fillRect(x + 4, y + 7 + jet, 2, 2);
      ctx.fillRect(x + 10, y + 7 + (1 - jet), 2, 2);
      break;
    }
    case 'sign_post': {
      drawTile(ctx, 'grass', x, y, tick);
      ctx.fillStyle = '#4e3018';
      ctx.fillRect(x + 7, y + 9, 2, 6);
      ctx.fillStyle = '#9c6430';
      ctx.fillRect(x + 2, y + 3, 12, 7);
      ctx.fillStyle = '#e0b878';
      ctx.fillRect(x + 3, y + 4, 10, 5);
      ctx.fillStyle = '#5c3c1c';
      ctx.fillRect(x + 4, y + 5, 7, 1);
      ctx.fillRect(x + 4, y + 7, 5, 1);
      break;
    }
    case 'plaque': {
      drawTile(ctx, 'cobble', x, y, tick);
      ctx.fillStyle = '#3c485c';
      ctx.fillRect(x + 3, y + 3, 10, 12);
      ctx.fillStyle = '#7890a8';
      ctx.fillRect(x + 4, y + 4, 8, 9);
      ctx.fillStyle = '#60d8ff';
      ctx.fillRect(x + 6, y + 6, 4, 3);
      break;
    }
    case 'banner': {
      drawTile(ctx, 'wall', x, y, tick);
      ctx.fillStyle = '#201824';
      ctx.fillRect(x + 3, y + 1, 10, 13);
      ctx.fillStyle = '#b82838';
      ctx.fillRect(x + 4, y + 2, 8, 10);
      ctx.fillStyle = '#f0c850';
      ctx.fillRect(x + 7, y + 5, 2, 4);
      break;
    }
    case 'crate': {
      drawTile(ctx, 'grass', x, y, tick);
      ctx.fillStyle = '#583418';
      ctx.fillRect(x + 2, y + 3, 12, 12);
      ctx.fillStyle = '#a06834';
      ctx.fillRect(x + 3, y + 4, 10, 10);
      ctx.fillStyle = '#6e4420';
      ctx.fillRect(x + 3, y + 8, 10, 2);
      ctx.fillRect(x + 7, y + 4, 2, 10);
      break;
    }
    case 'bookshelf': {
      ctx.fillStyle = '#4e2e16';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#7c4c26';
      ctx.fillRect(x + 1, y + 1, 14, 14);
      // Colored book spines
      const colors = ['#d84848', '#4888d8', '#58b850', '#e8c048', '#a858d0'];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(x + 2 + i * 2 + (i > 2 ? 1 : 0), y + 2, 2, 5);
        ctx.fillStyle = colors[(i + 2) % 5];
        ctx.fillRect(x + 2 + i * 2 + (i > 2 ? 1 : 0), y + 9, 2, 5);
      }
      break;
    }
    case 'table': {
      ctx.fillStyle = '#7c4c24';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#583418';
      ctx.fillRect(x + 2, y + 3, 12, 10);
      ctx.fillStyle = '#b87c42';
      ctx.fillRect(x + 3, y + 3, 10, 7);
      ctx.fillStyle = '#e8ecf8';
      ctx.fillRect(x + 5, y + 5, 3, 2);
      break;
    }
    case 'hearth': {
      ctx.fillStyle = '#404658';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#646c84';
      ctx.fillRect(x + 1, y + 1, 14, 5);
      ctx.fillStyle = '#181420';
      ctx.fillRect(x + 3, y + 6, 10, 9);
      const f = Math.floor(tick * 0.25) % 2;
      ctx.fillStyle = '#f05818';
      ctx.fillRect(x + 4, y + 8 + f, 8, 6 - f);
      ctx.fillStyle = '#ffe058';
      ctx.fillRect(x + 6, y + 10, 4, 4);
      break;
    }
    case 'rug_blue': {
      ctx.fillStyle = '#203c78';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#3460b8';
      ctx.fillRect(x + 1, y + 1, 14, 14);
      ctx.fillStyle = '#f0c858';
      ctx.fillRect(x + 2, y + 2, 12, 1);
      ctx.fillRect(x + 2, y + 13, 12, 1);
      break;
    }
    case 'scroll_wall': {
      drawTile(ctx, 'wall', x, y, tick);
      ctx.fillStyle = '#684420';
      ctx.fillRect(x + 3, y + 2, 10, 2);
      ctx.fillStyle = '#f0e4c8';
      ctx.fillRect(x + 4, y + 4, 8, 9);
      ctx.fillStyle = '#4098e8';
      ctx.fillRect(x + 6, y + 6, 4, 5);
      break;
    }
    case 'desk': {
      drawTile(ctx, 'floor_stone', x, y, tick);
      ctx.fillStyle = '#4e321a';
      ctx.fillRect(x + 1, y + 3, 14, 11);
      ctx.fillStyle = '#8e5c30';
      ctx.fillRect(x + 2, y + 3, 12, 7);
      ctx.fillStyle = '#f0e8d0';
      ctx.fillRect(x + 4, y + 4, 5, 4);
      ctx.fillStyle = '#c83848';
      ctx.fillRect(x + 10, y + 5, 2, 2);
      break;
    }
    default: {
      ctx.fillStyle = '#489840';
      ctx.fillRect(x, y, 16, 16);
    }
  }
}

export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  kind: 'brazier' | 'vines' | 'boulder' | 'rune' | 'buried_chest',
  cleared: boolean,
  px: number,
  py: number,
  tick: number,
): void {
  const x = Math.round(px);
  const y = Math.round(py);

  if (kind === 'brazier') {
    ctx.fillStyle = '#404858';
    ctx.fillRect(x + 3, y + 7, 10, 8);
    ctx.fillStyle = '#707888';
    ctx.fillRect(x + 2, y + 5, 12, 3);
    if (cleared) {
      const f = Math.floor(tick * 0.25) % 2;
      ctx.fillStyle = '#ff6020';
      ctx.fillRect(x + 4, y + 1 + f, 8, 5);
      ctx.fillStyle = '#ffe050';
      ctx.fillRect(x + 6, y + 2 + f, 4, 3);
    }
    return;
  }

  if (kind === 'rune') {
    ctx.fillStyle = '#283848';
    ctx.fillRect(x + 2, y + 2, 12, 12);
    ctx.fillStyle = cleared ? '#60f0ff' : '#485868';
    ctx.fillRect(x + 6, y + 3, 4, 10);
    ctx.fillRect(x + 3, y + 6, 10, 4);
    return;
  }

  if (cleared) return;

  if (kind === 'vines') {
    ctx.fillStyle = '#2a1848';
    ctx.fillRect(x + 1, y + 1, 14, 14);
    ctx.fillStyle = '#48a040';
    ctx.fillRect(x + 2, y + 3, 12, 3);
    ctx.fillRect(x + 2, y + 10, 12, 3);
    ctx.fillStyle = '#9840c8';
    ctx.fillRect(x + 5, y + 2, 3, 12);
    ctx.fillRect(x + 10, y + 2, 2, 12);
  } else if (kind === 'boulder') {
    ctx.fillStyle = '#484850';
    ctx.fillRect(x + 2, y + 3, 12, 11);
    ctx.fillStyle = '#807870';
    ctx.fillRect(x + 3, y + 2, 10, 9);
    ctx.fillStyle = '#201818';
    ctx.fillRect(x + 6, y + 4, 1, 6);
    ctx.fillRect(x + 7, y + 7, 3, 1);
  } else if (kind === 'buried_chest') {
    const shimmer = Math.sin(tick * 0.14) > 0;
    ctx.fillStyle = '#8c6838';
    ctx.fillRect(x + 3, y + 8, 10, 5);
    ctx.fillStyle = shimmer ? '#ffe870' : '#d8a848';
    ctx.fillRect(x + 7, y + 6, 2, 2);
  }
}

/**
 * Draws crisp 16x16 4-direction SNES characters & overworld interactables.
 * Every humanoid has unmistakable Down (front), Up (back/satchel), Left & Right
 * asymmetric side-profile silhouettes with a 1px dark outline and trailing scarf/cape.
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  spriteKey: string,
  px: number,
  py: number,
  facing: Direction,
  tick: number,
  walking = false,
): void {
  const x = Math.round(px);
  const y = Math.round(py);

  if (spriteKey === 'chest') {
    ctx.fillStyle = '#241408';
    ctx.fillRect(x + 1, y + 4, 14, 11);
    ctx.fillStyle = '#583010';
    ctx.fillRect(x + 2, y + 5, 12, 9);
    ctx.fillStyle = '#b86820';
    ctx.fillRect(x + 3, y + 6, 10, 7);
    ctx.fillStyle = '#f8d048';
    ctx.fillRect(x + 2, y + 8, 12, 2);
    ctx.fillRect(x + 7, y + 7, 2, 4);
    return;
  }

  if (spriteKey === 'pc_terminal') {
    ctx.fillStyle = '#121828';
    ctx.fillRect(x + 1, y + 1, 14, 14);
    ctx.fillStyle = '#283858';
    ctx.fillRect(x + 2, y + 2, 12, 13);
    ctx.fillStyle = Math.sin(tick * 0.1) > 0 ? '#50e8ff' : '#30b8e0';
    ctx.fillRect(x + 4, y + 4, 8, 5);
    ctx.fillStyle = '#c8d4e8';
    ctx.fillRect(x + 4, y + 11, 8, 2);
    return;
  }

  if (spriteKey === 'fish_spot') {
    const r = Math.floor(tick * 0.12) % 3;
    ctx.strokeStyle = '#a8f0ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 5 - r, y + 6 - r, 6 + r * 2, 4 + r * 2);
    return;
  }

  if (
    spriteKey === 'statue_npc' ||
    spriteKey === 'campfire_npc' ||
    spriteKey === 'lore_prop'
  ) {
    return; // Rendered cleanly by underlying architectural tile!
  }

  if (spriteKey.endsWith('_ow')) {
    const spId = spriteKey.replace('_ow', '');
    drawPokemonSprite(ctx, spId, x + 8, y + 14, 0.72, tick, facing === 'up', facing);
    return;
  }

  // Humanoid palettes with scarf/cape accent for clear facing silhouette
  let hair = '#2458d0';
  let coat = '#282c3e';
  let scarf = '#e84848';
  let skin = '#f8cfa0';

  if (spriteKey === 'npc_vance') {
    hair = '#585c70';
    coat = '#242030';
    scarf = '#c83040';
  } else if (spriteKey === 'npc_vex') {
    hair = '#dce8ff';
    coat = '#3c1860';
    scarf = '#f0c848';
  } else if (spriteKey === 'npc_grunt') {
    hair = '#222630';
    coat = '#282c38';
    scarf = '#b82838';
  } else if (spriteKey === 'npc_elder') {
    hair = '#eef2ff';
    coat = '#387050';
    scarf = '#e8c860';
  } else if (spriteKey === 'npc_innkeeper') {
    hair = '#c05038';
    coat = '#d86888';
    scarf = '#fff0d8';
  } else if (spriteKey === 'npc_merchant') {
    hair = '#583820';
    coat = '#2c7898';
    scarf = '#f0d058';
  } else if (spriteKey === 'npc_villager') {
    hair = '#c88038';
    coat = '#589850';
    scarf = '#f8e890';
  } else if (spriteKey === 'npc_bard') {
    hair = '#9848c0';
    coat = '#3858a8';
    scarf = '#ffe060';
  } else if (spriteKey === 'npc_researcher') {
    hair = '#384868';
    coat = '#e8eef8';
    scarf = '#48b8d8';
  } else if (spriteKey === 'npc_master') {
    hair = '#d8e0f0';
    coat = '#783828';
    scarf = '#ff9838';
  }

  const walkCycle = walking ? Math.floor(tick * 0.28) % 4 : 0;
  const bob = walking && walkCycle % 2 === 1 ? -1 : 0;
  const stride = walking ? (walkCycle === 1 ? -1 : walkCycle === 3 ? 1 : 0) : 0;
  const outline = '#0d1120';

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.fillRect(x + 3, y + 13, 10, 3);

  if (facing === 'left' || facing === 'right') {
    const dir = facing === 'right' ? 1 : -1;
    // Mirror horizontally around tile center (x + 8) for crisp left/right profile
    ctx.save();
    if (dir === -1) {
      ctx.translate(x + 16, y + bob);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(x, y + bob);
    }

    // 1px dark silhouette outline
    ctx.fillStyle = outline;
    ctx.fillRect(4, 0, 8, 7); // head
    ctx.fillRect(3, 6, 9, 6); // torso
    ctx.fillRect(1, 7, 3, 3); // trailing scarf tail behind character!
    ctx.fillRect(4 + stride, 11, 3, 4); // front leg
    ctx.fillRect(7 - stride, 11, 3, 4); // back leg

    // Trailing scarf/cape clearly marks the BACK (opposite to facing direction)
    ctx.fillStyle = scarf;
    ctx.fillRect(2, 7, 4, 2);

    // Legs (side stride)
    ctx.fillStyle = '#1c2234';
    ctx.fillRect(5 + stride, 12, 2, 3);
    ctx.fillRect(8 - stride, 12, 2, 3);

    // Torso & forward-reaching arm
    ctx.fillStyle = coat;
    ctx.fillRect(5, 7, 6, 5);
    ctx.fillStyle = scarf;
    ctx.fillRect(7, 7, 4, 2); // collar facing forward
    ctx.fillStyle = skin;
    ctx.fillRect(10 + Math.max(0, stride), 9, 2, 2); // hand in front

    // Side-profile Head (nose/face on right edge, hair sweeps back left)
    ctx.fillStyle = skin;
    ctx.fillRect(6, 2, 5, 5);
    ctx.fillRect(11, 4, 1, 2); // nose silhouette!
    ctx.fillStyle = hair;
    ctx.fillRect(4, 1, 7, 3);
    ctx.fillRect(4, 3, 3, 4); // back of hair
    ctx.fillRect(9, 2, 3, 1); // front bangs/visor

    // Single eye on front edge of profile
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(9, 4, 1, 2);
    ctx.fillStyle = '#101424';
    ctx.fillRect(10, 4, 1, 2);

    ctx.restore();
    return;
  }

  // UP (Back view) & DOWN (Front view)
  const pyOff = y + bob;

  // Outline
  ctx.fillStyle = outline;
  ctx.fillRect(x + 3, pyOff, 10, 7);
  ctx.fillRect(x + 3, pyOff + 6, 10, 6);
  ctx.fillRect(x + 4, pyOff + 11, 3, 4);
  ctx.fillRect(x + 9, pyOff + 11, 3, 4);

  // Legs
  ctx.fillStyle = '#1c2234';
  ctx.fillRect(x + 5, pyOff + 12 + (stride > 0 ? 1 : 0), 2, 3);
  ctx.fillRect(x + 9, pyOff + 12 + (stride < 0 ? 1 : 0), 2, 3);

  // Coat & Arms
  ctx.fillStyle = coat;
  ctx.fillRect(x + 4, pyOff + 7, 8, 5);

  if (facing === 'up') {
    // Unmistakable back view: full hair covering head + back cape/satchel
    ctx.fillStyle = scarf;
    ctx.fillRect(x + 4, pyOff + 7, 8, 2);
    ctx.fillRect(x + 5, pyOff + 9, 2, 3); // flowing back scarf ribbon
    if (spriteKey === 'player') {
      // Kael's Dragon-Scale backpack/satchel on back!
      ctx.fillStyle = '#8e5a2c';
      ctx.fillRect(x + 5, pyOff + 8, 6, 4);
      ctx.fillStyle = '#ffd858';
      ctx.fillRect(x + 7, pyOff + 9, 2, 2);
    }
    ctx.fillStyle = hair;
    ctx.fillRect(x + 4, pyOff + 1, 8, 6);
    ctx.fillStyle = skin;
    ctx.fillRect(x + 3, pyOff + 9, 1, 2);
    ctx.fillRect(x + 12, pyOff + 9, 1, 2);
  } else {
    // Front view (facing === 'down')
    ctx.fillStyle = scarf;
    ctx.fillRect(x + 5, pyOff + 7, 6, 2);
    ctx.fillStyle = skin;
    ctx.fillRect(x + 3, pyOff + 9, 1, 2);
    ctx.fillRect(x + 12, pyOff + 9, 1, 2);
    // Face
    ctx.fillStyle = skin;
    ctx.fillRect(x + 4, pyOff + 2, 8, 5);
    ctx.fillStyle = hair;
    ctx.fillRect(x + 4, pyOff + 1, 8, 3);
    ctx.fillRect(x + 4, pyOff + 3, 1, 1);
    ctx.fillRect(x + 11, pyOff + 3, 1, 1);
    // Expressive SNES eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 5, pyOff + 4, 2, 2);
    ctx.fillRect(x + 9, pyOff + 4, 2, 2);
    ctx.fillStyle = '#101628';
    ctx.fillRect(x + 6, pyOff + 4, 1, 2);
    ctx.fillRect(x + 9, pyOff + 4, 1, 2);
  }
}

/**
 * Draws crisp 16-bit pixel-art Pokémon sprites for overworld followers,
 * isometric battle front-view, 3/4 back-view, and Dragon Resonance forms!
 */
export function drawPokemonSprite(
  ctx: CanvasRenderingContext2D,
  spriteKey: string,
  cx: number,
  bottomY: number,
  scale: number,
  tick: number,
  backView = false,
  facing?: Direction,
): void {
  const v = MON_VISUALS[spriteKey] ?? MON_VISUALS.charmander;
  const bob = Math.round(Math.sin(tick * 0.14 + cx * 0.1) * 1.2);
  const s = scale;
  const isBack = backView || facing === 'up';
  const mirrorRight = !backView && facing === 'right';

  ctx.save();
  ctx.translate(Math.round(cx), Math.round(bottomY + bob));
  if (mirrorRight) {
    ctx.scale(-1, 1);
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(Math.round(-8 * s), Math.round(-2 * s), Math.round(16 * s), Math.round(4 * s));

  // Optional Dragon / Shadow glowing aura!
  if (v.aura) {
    const pulse = 0.22 + 0.15 * Math.sin(tick * 0.2);
    ctx.fillStyle = v.aura;
    ctx.globalAlpha = pulse;
    ctx.fillRect(Math.round(-12 * s), Math.round(-24 * s), Math.round(24 * s), Math.round(24 * s));
    ctx.globalAlpha = 1;
  }

  const px = (rx: number, ry: number, rw: number, rh: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(rx * s),
      Math.round(ry * s),
      Math.max(1, Math.round(rw * s)),
      Math.max(1, Math.round(rh * s)),
    );
  };

  const flip = isBack ? -1 : 1;

  switch (v.shape) {
    case 'dragon': {
      const wingLift = Math.round(Math.sin(tick * 0.22) * 2);
      px(-13, -20 + wingLift, 6, 8, v.shade);
      px(-11, -19 + wingLift, 4, 5, v.accent);
      px(7, -20 + wingLift, 6, 8, v.shade);
      px(7, -19 + wingLift, 4, 5, v.accent);
      px(-8, -12, 16, 10, v.shade);
      px(-6, -15, 12, 12, v.body);
      px(-3, -13, 6, 9, v.accent);
      px(-5, -23, 10, 9, v.body);
      px(-6, -26, 2, 4, v.accent);
      px(4, -26, 2, 4, v.accent);
      if (!isBack) {
        px(-3, -20, 2, 2, v.eye);
        px(2, -20, 2, 2, v.eye);
      }
      break;
    }
    case 'serpent': {
      px(-7, -6, 14, 5, v.shade);
      px(-6, -10, 12, 7, v.body);
      px(-4, -8, 8, 4, v.accent);
      px(-4, -18, 8, 9, v.body);
      px(-6, -17, 2, 3, v.accent);
      px(4, -17, 2, 3, v.accent);
      if (!isBack) {
        px(-3, -15, 2, 2, v.eye);
        px(2, -15, 2, 2, v.eye);
      }
      break;
    }
    case 'plant': {
      px(-7, -10, 14, 9, v.body);
      px(-7, -4, 4, 4, v.shade);
      px(3, -4, 4, 4, v.shade);
      px(-6, -16, 12, 7, v.accent);
      px(-3, -19, 6, 4, '#70e058');
      if (!isBack) {
        px(-4, -8, 2, 2, v.eye);
        px(2, -8, 2, 2, v.eye);
      }
      break;
    }
    case 'quad': {
      px(-8, -10, 15, 7, v.body);
      px(-7, -4, 3, 4, v.shade);
      px(3, -4, 3, 4, v.shade);
      px(5 * flip - 2, -14, 4, 5, v.accent);
      px(-6, -17, 10, 8, v.body);
      px(-7, -20, 3, 4, v.shade);
      px(2, -20, 3, 4, v.shade);
      px(-4, -12, 6, 3, v.accent);
      if (!isBack) {
        px(-4, -15, 2, 2, v.eye);
        px(1, -15, 2, 2, v.eye);
      }
      break;
    }
    case 'avian': {
      const flap = Math.round(Math.sin(tick * 0.28) * 2);
      px(-11, -15 + flap, 6, 5, v.shade);
      px(5, -15 + flap, 6, 5, v.shade);
      px(-5, -14, 10, 10, v.body);
      px(-3, -11, 6, 6, v.accent);
      px(-4, -19, 8, 6, v.body);
      if (!isBack) {
        px(-2, -17, 2, 2, v.eye);
        px(2, -17, 2, 2, v.eye);
      }
      break;
    }
    case 'ghost': {
      const drift = Math.round(Math.sin(tick * 0.2) * 2);
      px(-9, -20 + drift, 18, 14, v.accent);
      px(-6, -18 + drift, 12, 11, v.body);
      if (!isBack) {
        px(-4, -15 + drift, 3, 3, v.eye);
        px(1, -15 + drift, 3, 3, v.eye);
        px(-3, -14 + drift, 1, 1, '#181818');
        px(2, -14 + drift, 1, 1, '#181818');
      }
      break;
    }
    case 'star': {
      px(-3, -20, 6, 18, v.body);
      px(-10, -13, 20, 5, v.body);
      px(-7, -7, 4, 6, v.shade);
      px(3, -7, 4, 6, v.shade);
      px(-3, -13, 6, 6, '#f0d058');
      px(-2, -12, 4, 4, v.accent);
      break;
    }
    case 'fish': {
      px(-7, -14, 13, 10, v.body);
      px(6, -13, 4, 8, v.accent);
      px(-3, -10, 6, 5, v.accent);
      if (!isBack) {
        px(-5, -12, 2, 2, '#ffffff');
        px(-4, -11, 1, 1, v.eye);
      }
      break;
    }
    default: {
      px(5 * flip, -10, 5, 3, v.body);
      if (spriteKey === 'charmander' || spriteKey === 'charmeleon') {
        px(8 * flip, -14, 3, 4, '#ffe050');
        px(9 * flip, -16, 2, 3, '#ff5020');
      }
      px(-5, -12, 10, 10, v.body);
      px(-3, -10, 6, 7, v.accent);
      px(-5, -3, 3, 3, v.shade);
      px(2, -3, 3, 3, v.shade);
      px(-5, -19, 10, 8, v.body);
      if (spriteKey === 'pikachu') {
        px(-5, -24, 2, 5, v.body);
        px(-5, -24, 2, 2, '#181818');
        px(3, -24, 2, 5, v.body);
        px(3, -24, 2, 2, '#181818');
      }
      if (!isBack) {
        px(-3, -16, 2, 2, v.eye);
        px(2, -16, 2, 2, v.eye);
        if (spriteKey === 'pikachu') {
          px(-5, -14, 2, 2, v.accent);
          px(3, -14, 2, 2, v.accent);
        }
      }
    }
  }

  ctx.restore();
}
