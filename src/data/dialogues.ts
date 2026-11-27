import type { DialogueNode } from '@engine/types';

export const DIALOGUES: Record<string, DialogueNode> = {
  vance_briefing: {
    id: 'vance_briefing',
    speaker: 'Officer Vance',
    portrait: 'npc_vance',
    lines: [
      'Initiate #07! Stand tall. Welcome to the Obsidian Syndicate’s Embervale Garrison.',
      'Admin Vex has already marched east into the Sunken Emerald Shrine to clamp a Shadow Collar onto its Guardian.',
      'Your orders are simple: cross the bridge to Elder Rowan’s Cottage in southeast Embervale, secure the Emerald Shrine Key, then report to Vex.',
    ],
    choices: [
      {
        label: '"Understood, sir. Glory to the Syndicate."',
        alignmentDelta: -2,
        nextId: 'vance_loyal',
        setFlag: 'briefing_done',
        giveGold: 60,
      },
      {
        label: '"Shadow Collars? Doesn’t that hurt the Pokémon?"',
        alignmentDelta: 2,
        nextId: 'vance_rebel',
        setFlag: 'briefing_done',
      },
    ],
  },
  vance_loyal: {
    id: 'vance_loyal',
    speaker: 'Officer Vance',
    portrait: 'npc_vance',
    lines: [
      'Heh. Sharp answer! Take 60 Gold from the garrison stipend.',
      'Grab the Seal Orbs in the supply crate before heading into Embervale Town. Dismissed!',
    ],
  },
  vance_rebel: {
    id: 'vance_rebel',
    speaker: 'Officer Vance',
    portrait: 'npc_vance',
    lines: [
      'Watch your tongue, Initiate! Supreme Lord Malakor doesn’t pay scouts to feel sorry for wild beasts.',
      'Get the Shrine Key from Elder Rowan’s Cottage in southeast Embervale and keep your doubts to yourself. Dismissed!',
    ],
  },
  vance_repeat: {
    id: 'vance_repeat',
    speaker: 'Officer Vance',
    portrait: 'npc_vance',
    lines: [
      'Move out, #07! Elder Rowan lives across the southern bridge in southeast Embervale, and the Shrine lies northeast of Verdant Wilds.',
      'Remember: press TAB to rotate your Lead Pokémon and C/SPACE to use its Field Skill!',
    ],
  },
  vance_renegade: {
    id: 'vance_renegade',
    speaker: 'Officer Vance',
    portrait: 'npc_vance',
    lines: [
      'You shattered Admin Vex’s Shadow Collar?! Command already put a bounty on your head, Initiate!',
      '...Tch. My squad won’t stop a Dragon Resonator. Get out of Embervale before Lord Malakor arrives!',
    ],
  },
  garrison_grunt_talk: {
    id: 'garrison_grunt_talk',
    speaker: 'Syndicate Grunt',
    portrait: 'npc_grunt',
    lines: [
      'Word is Admin Vex is obsessed with ancient Dragon Statues out in Verdant Wilds.',
      'He says whoever awakens the old Dragon blood can shatter Shadow Pokémon armor in a single breath!',
    ],
  },
  garrison_dossier_read: {
    id: 'garrison_dossier_read',
    speaker: 'Classified Dossier',
    lines: [
      'A crimson-stamped file lies open on Officer Vance’s desk: [PROJECT KAISER — COURIER GALEN].',
      '"Captain Galen vanished near Embervale with a dormant Ancient Dragon Scale. Initiate #07 exhibits matching Resonance..."',
      '(Unlocked Lore Codex: Classified: Project Kaiser & #07!)',
    ],
    unlockLoreId: 'project_kaiser',
  },
  garrison_map_read: {
    id: 'garrison_map_read',
    speaker: 'Tactical Map',
    lines: [
      'Four red Obsidian pins mark ancient shrines across Draconia: Emerald, Frost, Aero, and Caldera.',
      'Embervale sits right at the mouth of the eastern Emerald frontier.',
    ],
    unlockLoreId: 'obsidian_syndicate',
  },
  tavern_welcome: {
    id: 'tavern_welcome',
    speaker: 'Innkeeper Mira',
    portrait: 'npc_innkeeper',
    lines: [
      'Welcome to the Hearth & Wing PokéTavern! Warm broth and soft straw beds—even for an Obsidian scout.',
      'Would you like to rest your 4-Pokémon party and restore HP & AP for free?',
    ],
    choices: [
      { label: 'Rest & Heal Party (Free)', healParty: true, nextId: 'tavern_healed' },
      { label: 'Maybe later' },
    ],
  },
  tavern_healed: {
    id: 'tavern_healed',
    speaker: 'Innkeeper Mira',
    portrait: 'npc_innkeeper',
    lines: [
      'Your Pokémon look bright and rested! You can also use the glowing Roster Terminal over there to swap Pokémon in your Camp Box.',
    ],
  },
  bard_cedric_talk: {
    id: 'bard_cedric_talk',
    speaker: 'Bard Cedric',
    portrait: 'npc_bard',
    lines: [
      '♪ "In shallow streams the crimson carp doth splash, mocked by all who pass..." ♪',
      'Ah, hello traveler! My favorite ballad tells of Willow Pier’s Magikarp—legends say a carp raised to Level 12 leaps the Shrine falls as a Tempest Gyarados!',
      '(Unlocked Lore Codex: The Carp of Willow Pier!)',
    ],
    unlockLoreId: 'willow_carp',
  },
  scout_ren_talk: {
    id: 'scout_ren_talk',
    speaker: 'Scout Ren',
    portrait: 'npc_grunt',
    lines: [
      'Keep your voice down, #07. Once you leave Embervale, Vex isn’t the worst of the Obsidian Syndicate.',
      'Above him stand Executive Nyx of the Frost Vault, Korr of the Caldera Forge, and Lady Seraphina of the Sky Spire—all answering to Lord Malakor.',
      '(Unlocked Lore Codex: Dossier: The Four Executives!)',
    ],
    unlockLoreId: 'four_executives',
  },
  tavern_almanac_read: {
    id: 'tavern_almanac_read',
    speaker: 'Draconia Almanac',
    lines: [
      'You flip through a weathered traveler’s field guide on the tavern shelf...',
      '"When Dusk falls over Verdant Wilds, Pidgey roost and Gastly, Zubat, and Houndour prowl. Carry Dusk Orbs for 2.6x capture power in darkness or shrines!"',
      '(Unlocked Lore Codex: Spirits of the Dusk!)',
    ],
    unlockLoreId: 'nocturnal_wilds',
  },
  mart_welcome: {
    id: 'mart_welcome',
    speaker: 'Merchant Taro',
    portrait: 'npc_merchant',
    lines: [
      'Welcome to Taro’s Supply & Apothecary! Herbs, Seal Orbs, Dusk Orbs for night hunts, and River Lures for Willow Pier.',
      'What can I stock your pack with today?',
    ],
    choices: [
      { label: 'Open Supply Mart', openShop: 'mart' },
      { label: 'Leave' },
    ],
  },
  researcher_lin_talk: {
    id: 'researcher_lin_talk',
    speaker: 'Researcher Lin',
    portrait: 'npc_researcher',
    lines: [
      'Fascinating... Look at this cracked Syndicate Shadow Collar on my workbench.',
      'Shadow waves overpower normal Pokémon types by 1.5x—yet pure Dragon energy disrupts the collar’s frequency and deals 2x damage!',
      '(Unlocked Lore Codex: Anatomy of a Shadow Collar!)',
    ],
    unlockLoreId: 'shadow_collars',
  },
  mart_ledger_read: {
    id: 'mart_ledger_read',
    speaker: 'Apothecary Notes',
    lines: [
      'Taro’s neat ink ledger reads: "Green Herbs soothe battle wounds; Ether Berries recharge AP for Dragon Resonance and Field Arts."',
      '"Press [TAB] outdoors to rotate your Lead Pokémon and [C] to use Ember Torch, Razor Cut, Tremor Dig, or Surge!"',
    ],
  },
  town_grunt_talk: {
    id: 'town_grunt_talk',
    speaker: 'Patrol Grunt',
    portrait: 'npc_grunt',
    lines: [
      'Stay sharp after Dusk falls! Streetlamps light Embervale Plaza, while Gastly and Houndour prowl Verdant Wilds.',
      'Read the Notice Board by the square if you want the latest Syndicate directives.',
    ],
  },
  villager_lyra_talk: {
    id: 'villager_lyra_talk',
    speaker: 'Lyra',
    portrait: 'npc_villager',
    lines: [
      'My little Eevee gets restless whenever the Dragon-Well Fountain glows brighter...',
      'Please, if you have a kind heart, don’t let Admin Vex harm the Guardian of Sunken Emerald Shrine!',
    ],
  },
  town_eevee_talk: {
    id: 'town_eevee_talk',
    speaker: 'Village Eevee',
    lines: [
      'Vee-vui! ★ (The Eevee sniffs your pack and nuzzles the warm Ancient Dragon Scale hidden inside!)',
    ],
  },
  plaque_embervale_read: {
    id: 'plaque_embervale_read',
    speaker: 'Dragon-Well Plaque',
    lines: [
      'Carved into emerald-veined stone beside the Dragon Fountain:',
      '"Three centuries ago, Keepers founded Embervale beside Ember Brook to watch over the Sunken Emerald Shrine. May Dragon and Pokémon walk as equals."',
      '(Unlocked Lore Codex: Chronicle of Embervale!)',
    ],
    unlockLoreId: 'embervale_founding',
  },
  notice_board_read: {
    id: 'notice_board_read',
    speaker: 'Town Notice Board',
    lines: [
      'A parchment nailed over older village notices: "PROCLAMATION #04 — By order of Lord Malakor, all Shrine Relics belong to the Obsidian Syndicate."',
      'Below it, someone scratched in charcoal: "Look for the Dragon Statue in Verdant Wilds, and visit Elder Rowan across the bridge."',
      '(Unlocked Lore Codex: Rise of the Obsidian Syndicate!)',
    ],
    unlockLoreId: 'obsidian_syndicate',
  },
  sign_tavern_read: {
    id: 'sign_tavern_read',
    speaker: 'Wooden Signpost',
    lines: [
      'NORTH: Hearth & Wing PokéTavern (Free Rest & PC Box)  •  NORTHEAST: Taro’s Supply Mart',
      'SOUTH ACROSS EMBER BROOK: Memorial Grove & Elder Rowan’s Cottage  •  EAST GATE: Verdant Wilds',
    ],
  },
  master_bram_talk: {
    id: 'master_bram_talk',
    speaker: 'Master Bram',
    portrait: 'npc_master',
    lines: [
      'Hmm... That blue hair and Dragon Scale... You remind me of Captain Galen, who rode alongside a Dragonair years ago.',
      'Listen well, young one: ancient Dragon Keepers never chained Pokémon. True Resonance wakes from trust—and a Sandshrew’s Tremor Dig can uncover buried relics near Ember Brook!',
    ],
    unlockLoreId: 'dragon_resonance',
  },
  pact_stone_read: {
    id: 'pact_stone_read',
    speaker: 'Memorial Pact Stone',
    lines: [
      '"In memory of the Keepers who stood when the Four Dragon Guardians slumbered. Should Shadow rise, seek the Sunken Shrine’s Brazier and Rune."',
      '(Unlocked Lore Codex: The Age of Dragon Resonance!)',
    ],
    unlockLoreId: 'dragon_resonance',
  },
  scroll_four_guardians_read: {
    id: 'scroll_four_guardians_read',
    speaker: 'Four Guardians Scroll',
    lines: [
      'Four silk tapestries depict radiant Pokémon Guardians: Gyarados of Emerald Tempest, Lapras of Frost Glacier, Dragonite of Aero Spire, and Charizard of Caldera Core.',
      '(Unlocked Lore Codex: The Four Dragon Guardians!)',
    ],
    unlockLoreId: 'four_guardians',
  },
  tome_emerald_shrine_read: {
    id: 'tome_emerald_shrine_read',
    speaker: 'Sunken Shrine Tome',
    lines: [
      '"Two seals bar the Emerald Sanctum: ignite the left Brazier with Ember Torch OR charge the right Rune with Surge."',
      '"Hidden side vaults guard the Bolt Dragon Crest (behind cracked stone) and Pyre Dragon Crest (behind shadow brambles)."',
      '(Unlocked Lore Codex: Trials of the Sunken Shrine!)',
    ],
    unlockLoreId: 'emerald_shrine',
  },
  elder_rowan_talk: {
    id: 'elder_rowan_talk',
    speaker: 'Elder Rowan',
    portrait: 'npc_elder',
    lines: [
      'A Syndicate uniform... Yet I sense something far older coiled around your partner Pokémon.',
      'That iridescence in your pack—an Ancient Dragon Scale! So the Dragon Clan’s bond still lives in Embervale...',
      'Why do you seek the Emerald Shrine Key, young scout?',
    ],
    choices: [
      {
        label: '"Hand it over, old man. Syndicate orders."',
        alignmentDelta: -2,
        nextId: 'elder_give_key_harsh',
        setFlag: 'got_shrine_key',
        giveItem: { itemId: 'shrine_key', qty: 1 },
      },
      {
        label: '"I want to see what Vex is doing—and stop him if I must."',
        alignmentDelta: 2,
        nextId: 'elder_give_key_kind',
        setFlag: 'got_shrine_key',
        giveItem: { itemId: 'shrine_key', qty: 1 },
      },
    ],
  },
  elder_give_key_harsh: {
    id: 'elder_give_key_harsh',
    speaker: 'Elder Rowan',
    portrait: 'npc_elder',
    lines: [
      'Take the Emerald Shrine Key then. But when you witness the Guardian’s agony, remember you still hold a choice.',
    ],
  },
  elder_give_key_kind: {
    id: 'elder_give_key_kind',
    speaker: 'Elder Rowan',
    portrait: 'npc_elder',
    lines: [
      'Bless you! Take the Emerald Shrine Key—and seek the Ancient Dragon Statue in Verdant Wilds before facing Vex.',
      'Read the scrolls along my north wall too; they preserve the true history of Draconia’s Four Guardians.',
    ],
    giveItem: { itemId: 'potion', qty: 2 },
  },
  elder_after_key: {
    id: 'elder_after_key',
    speaker: 'Elder Rowan',
    portrait: 'npc_elder',
    lines: [
      'The Sunken Emerald Shrine waits in northeast Verdant Wilds. May the Ancient Dragon watch over your party.',
    ],
  },
  elder_after_victory: {
    id: 'elder_after_victory',
    speaker: 'Elder Rowan',
    portrait: 'npc_elder',
    lines: [
      'You freed the Tempest Guardian and claimed the Emerald Dragon Seal! Embervale owes you its life, Dragon Resonator.',
      'Three more Shrines remain across Draconia. Rest at the PokéTavern, complete your Lore Codex, and prepare for Chapter 2!',
    ],
  },
  angler_kai_talk: {
    id: 'angler_kai_talk',
    speaker: 'Angler Kai',
    portrait: 'npc_villager',
    lines: [
      'Nothing beats casting a line off Willow Pier! Walk to the tip of the wooden dock and press Z/Enter to fish.',
      'Wait for the bobber to PLUNGE, then mash Z/Enter to reel in Poliwag, Staryu, Magikarp—or even a rare Dratini!',
    ],
  },
  poacher_camp_event: {
    id: 'poacher_camp_event',
    speaker: 'Syndicate Poacher',
    portrait: 'npc_grunt',
    lines: [
      'Hey! Keep walking, Initiate! This cage of wild Pokémon is my personal bonus haul for Admin Vex.',
      'Wait—are you trying to cut the lock?! I’ll teach you not to meddle!',
    ],
    choices: [
      { label: '"Let them go—or fight me!"', alignmentDelta: 2, startBattle: 'poacher_battle' },
      { label: 'Step back for now' },
    ],
  },
  poacher_after_defeat: {
    id: 'poacher_after_defeat',
    speaker: 'Syndicate Poacher',
    portrait: 'npc_grunt',
    lines: [
      'Gah! Fine, take the blasted cage! Vex is gonna hear about a rogue #07!',
      '(Talk to the freed Pokémon beside the camp to recruit a field-skill partner into your party!)',
    ],
  },
  rescue_ally_choice: {
    id: 'rescue_ally_choice',
    speaker: 'Freed Pokémon',
    lines: [
      'Several grateful Pokémon look up at you from the broken Syndicate cage! One wants to join your 4-Pokémon party.',
      'Which Field-Skill companion will you recruit?',
    ],
    choices: [
      {
        label: 'Pikachu (Surge / Angler — Electric)',
        setFlag: 'rescued_ally',
        recruitSpecies: { speciesId: 'pikachu', level: 5 },
        nextId: 'rescue_done',
      },
      {
        label: 'Sandshrew (Tremor Dig — Ground)',
        setFlag: 'rescued_ally',
        recruitSpecies: { speciesId: 'sandshrew', level: 5 },
        nextId: 'rescue_done',
      },
      {
        label: 'Growlithe (Ember Torch — Fire)',
        setFlag: 'rescued_ally',
        recruitSpecies: { speciesId: 'growlithe', level: 5 },
        nextId: 'rescue_done',
      },
      {
        label: 'Oddish (Razor Cut — Grass)',
        setFlag: 'rescued_ally',
        recruitSpecies: { speciesId: 'oddish', level: 5 },
        nextId: 'rescue_done',
      },
    ],
  },
  rescue_done: {
    id: 'rescue_done',
    speaker: 'System',
    lines: [
      'Your new companion bounded happily into your roster! Press TAB anytime to rotate your Lead Pokémon and press C/SPACE for its Field Skill!',
    ],
  },
  dragon_statue_awaken: {
    id: 'dragon_statue_awaken',
    speaker: 'Ancient Dragon Statue',
    lines: [
      'Your Ancient Dragon Scale blazes with sapphire light as you touch the weathered stone...',
      '"Heir of the Bond... Not through chains of Shadow, but through heart and courage shall the Dragon wake."',
      'AWAKENED: Your starter Pokémon can now invoke [WHELP RESONANCE] in battle!',
    ],
    setFlag: 'unlocked_whelp',
    unlockResonance: 'whelp',
    healParty: true,
  },
  dragon_statue_repeat: {
    id: 'dragon_statue_repeat',
    speaker: 'Ancient Dragon Statue',
    lines: [
      'A gentle dragon breeze washes over your party. HP, AP, and Resonance Gauge are restored!',
      '(Seek the Thunder & Flame Reliquaries inside Sunken Emerald Shrine to unlock Bolt Wyrm & Pyre Wyrm!)',
    ],
    healParty: true,
  },
  shrine_sentinel_talk: {
    id: 'shrine_sentinel_talk',
    speaker: 'Obsidian Sentinel',
    portrait: 'npc_grunt',
    lines: [
      'Halt! Admin Vex ordered this sanctum sealed during the Shadow Collar calibration!',
      'Wait... why is a Dragon Scale glowing in your belt?! Intruders will be crushed!',
    ],
    startBattle: 'shrine_sentinel_battle',
  },
  shrine_sentinel_after: {
    id: 'shrine_sentinel_after',
    speaker: 'Obsidian Sentinel',
    portrait: 'npc_grunt',
    lines: [
      'Urgh... To open the Inner Sanctum Gate north of here, light the left Brazier (Ember Torch) OR charge the right Rune (Surge)!',
      'And don’t miss the cracked wall west (Tremor Dig) or shadow vines east (Razor Cut) for hidden Dragon Crests...',
    ],
  },
  vex_boss_intro: {
    id: 'vex_boss_intro',
    speaker: 'Admin Vex',
    portrait: 'npc_vex',
    lines: [
      'Ah, Initiate #07. Right on cue—behold the Obsidian Syndicate’s masterpiece!',
      'With this Shadow Collar, the Shrine’s Tempest Gyarados obeys only Lord Malakor’s will. No legends, no mercy—pure power!',
      'Now kneel and finish weakening the Guardian for extraction!',
    ],
    choices: [
      {
        label: '"Never! Break the Collar—Dragon Resonance, NOW!"',
        alignmentDelta: 4,
        startBattle: 'boss_admin_vex',
      },
      {
        label: '"Step aside, Vex. This Dragon’s power belongs to me!"',
        alignmentDelta: -2,
        startBattle: 'boss_admin_vex',
      },
    ],
  },
  vex_defeat_finale: {
    id: 'vex_defeat_finale',
    speaker: 'Admin Vex',
    portrait: 'npc_vex',
    lines: [
      'No... The Shadow Collar shattered! That Resonance—you truly carry the Breath of the Dragon!',
      'Mark my words, Renegade #07: Lord Malakor and the Four Executives will hunt you across every kingdom!',
      '(Admin Vex vanishes in a smoke bomb as emerald light floods the Sanctum...)',
    ],
    giveItem: { itemId: 'emerald_seal', qty: 1 },
    healParty: true,
    nextId: 'chapter1_victory_banner',
  },
  chapter1_victory_banner: {
    id: 'chapter1_victory_banner',
    speaker: 'Freed Shrine Guardian',
    lines: [
      'The Tempest Gyarados bows its mighty head in gratitude and bestows the [EMERALD DRAGON SEAL] upon you!',
      '★ CHAPTER 1 COMPLETE! ★ You are now a Syndicate Renegade with the power of Dragon Resonance.',
      'Feel free to keep exploring Embervale, fishing at Willow Pier, unlocking all 10 Lore Codex entries, and saving your game for Chapter 2!',
    ],
  },
  guardian_after_victory: {
    id: 'guardian_after_victory',
    speaker: 'Tempest Guardian',
    lines: [
      'The Shrine’s waters shine clear and calm once more. The Guardian restores your party’s strength!',
    ],
    healParty: true,
  },
};
