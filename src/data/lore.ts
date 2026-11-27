export interface LoreEntry {
  id: string;
  category: 'MYTH' | 'SYNDICATE' | 'EMBERVALE' | 'FIELD';
  title: string;
  subtitle: string;
  paragraphs: string[];
}

export const LORE_ENTRIES: LoreEntry[] = [
  {
    id: 'four_guardians',
    category: 'MYTH',
    title: 'The Four Dragon Guardians',
    subtitle: 'Scroll of the Ancient Covenant',
    paragraphs: [
      'Before Seal Orbs existed, Draconia was sheltered by four Elemental Shrines—Emerald of Tempest, Frost of Glacier, Aero of Spire, and Caldera of Core.',
      'Guardian Pokémon attuned to ancient Dragon Aura—Gyarados, Lapras, Dragonite, and Charizard—kept wild storms and Shadow rifts in harmony.',
    ],
  },
  {
    id: 'dragon_resonance',
    category: 'MYTH',
    title: 'The Age of Dragon Resonance',
    subtitle: 'Elder Rowan’s Keeper Notes',
    paragraphs: [
      'True Dragon Keepers never commanded through fear. By carrying an attuned Dragon Scale, a partner Pokémon can resonate with dormant dragon blood.',
      'In battle, Resonance transforms the partner into a radiant Wyrm form—piercing even Syndicate Shadow armor.',
    ],
  },
  {
    id: 'obsidian_syndicate',
    category: 'SYNDICATE',
    title: 'Rise of the Obsidian Syndicate',
    subtitle: 'Public Proclamation #04',
    paragraphs: [
      'Forged in the iron foundries of Mt. Korr, the Obsidian Syndicate unified rogue poachers and shadow-smiths under Supreme Lord Malakor.',
      'To the townsfolk they promise "order against wild disasters." Behind closed doors, they harvest Shrine Guardians as living weapons.',
    ],
  },
  {
    id: 'project_kaiser',
    category: 'SYNDICATE',
    title: 'Classified: Project Kaiser & #07',
    subtitle: 'Garrison Intel Dossier',
    paragraphs: [
      'Admin Vex’s private notes mention an old Dragon Clan courier—Captain Galen—who vanished near Embervale with a single Ancient Dragon Scale.',
      'Note scribbled in red ink: "Initiate #07 carries that same bloodline resonance. Watch #07 closely near the Verdant Dragon Statue."',
    ],
  },
  {
    id: 'embervale_founding',
    category: 'EMBERVALE',
    title: 'Chronicle of Embervale',
    subtitle: 'Town Square Dragon-Well Plaque',
    paragraphs: [
      'Three centuries ago, Dragon Keepers built Embervale beside the shimmering Ember Brook to guard the eastern trail into Sunken Emerald Shrine.',
      'The stone Dragon Fountain at the town plaza was carved from shrine emerald; its waters still hum softly when a Resonator passes.',
    ],
  },
  {
    id: 'emerald_shrine',
    category: 'MYTH',
    title: 'Trials of the Sunken Shrine',
    subtitle: 'Elder’s Sanctuary Tome',
    paragraphs: [
      'To keep unworthy raiders out of the Inner Sanctum, the ancients sealed its gate behind dual elemental locks: an Ember Brazier and a Surge Rune.',
      'Side vaults hold the Bolt Dragon Crest and Pyre Dragon Crest—guarded by cracked stone walls and living shadow brambles.',
    ],
  },
  {
    id: 'shadow_collars',
    category: 'SYNDICATE',
    title: 'Anatomy of a Shadow Collar',
    subtitle: 'Researcher Lin’s Apothecary Notes',
    paragraphs: [
      'Syndicate Shadow Collars pump polarized dark-wavelength static into a Pokémon’s nerves, turning gentle species ruthless and aggressive.',
      'Shadow energy overwhelms ordinary types (1.5x), yet ancient Dragon Resonance neutralizes the frequency and deals 2x counter-damage!',
    ],
  },
  {
    id: 'nocturnal_wilds',
    category: 'FIELD',
    title: 'Spirits of the Dusk',
    subtitle: 'Draconia Field Almanac',
    paragraphs: [
      'As Embervale’s lanterns flicker on at Dusk and Night, Verdant Wilds shifts: daytime Pidgey roost while Gastly, Zubat, and Houndour emerge.',
      'Seasoned scouts carry Dusk Orbs—engineered to resonate at 2.6x capture strength under starlight or inside ancient shrines.',
    ],
  },
  {
    id: 'willow_carp',
    category: 'EMBERVALE',
    title: 'The Carp of Willow Pier',
    subtitle: 'Bard Cedric’s Ballad',
    paragraphs: [
      '"Though mocked for its Splash in shallow streams, the Crimson Carp remembers the sky..."',
      'Local legend says any Magikarp raised to Level 12 leaps the Emerald waterfall and awakens as a Tempest Gyarados.',
    ],
  },
  {
    id: 'four_executives',
    category: 'SYNDICATE',
    title: 'Dossier: The Four Executives',
    subtitle: 'Scout Ren’s Whispered Intel',
    paragraphs: [
      'Vex commands only the eastern frontier. Three ruthless Executives wait beyond Embervale: Nyx of the Frost Vault, Korr of the Caldera Forge, and Lady Seraphina of the Sky Spire.',
      'Freeing the Emerald Guardian is only the first spark of rebellion across Draconia.',
    ],
  },
];

export const LORE_BY_ID: Record<string, LoreEntry> = Object.fromEntries(
  LORE_ENTRIES.map((e) => [e.id, e]),
);
