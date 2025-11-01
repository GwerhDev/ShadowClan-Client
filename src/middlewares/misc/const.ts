import { environment } from "../../environment";

export const API_URL: string = environment === "development" ? 'http://localhost:8080' : 'https://api.shadowclan.cl';

export const classes = [
  { name: "Druida", value: "druid", image: "https://blz-contentstack-images.akamaized.net/v3/assets/blt77f4425de611b362/blt75eca7075dbe5195/6851ec39300f1cc6e7953c4b/druid_svg_1.svg" },
  { name: "Bárbaro", value: "barbarian", image: "https://blz-contentstack-images.akamaized.net/v3/assets/blt77f4425de611b362/bltb1bf7cc5cf89d819/64b045d7b4f503538bb32b79/class-icons_barbarian2.svg" },
  { name: "Caballero de Sangre", value: "bloodknight", image: "https://blz-contentstack-images.akamaized.net/v3/assets/blt77f4425de611b362/bltf64f01e05eb84480/663a8766d83f5f651716ddc4/class-icons_bloodknight2.svg" },
  { name: "Guerrero Divino", value: "crusader", image: "https://blz-contentstack-images.akamaized.net/v3/assets/blt77f4425de611b362/blt9dc5247233c5f70a/64b045d7cb8a39260add7fd6/class-icons_crusader2.svg" },
  { name: "Cazador de Demonios", value: "demonhunter", image: "https://blz-contentstack-images.akamaized.net/v3/assets/blt77f4425de611b362/blt2a35acdcf570d8c2/64b045d7c08cca43789b2796/class-icons_demonhunter2.svg" },
  { name: "Monje", value: "monk", image: "https://blz-contentstack-images.akamaized.net/v3/assets/blt77f4425de611b362/blta20b6ac6454f28e4/64b045d7c08cca42bd9b2792/class-icons_monk2.svg" },
  { name: "Nigromante", value: "necromancer", image: "https://blz-contentstack-images.akamaized.net/v3/assets/blt77f4425de611b362/blt98e1e1105822157d/64b045d7e052526a87ff673f/class-icons_necromancer2.svg" },
  { name: "Tempest", value: "tempest", image: "https://blz-contentstack-images.akamaized.net/v3/assets/blt77f4425de611b362/blt0149b32287c8c5c7/663ab7846c90795f7544bece/class-icons_tempest3.svg" },
  { name: "Arcanista", value: "wizard", image: "https://blz-contentstack-images.akamaized.net/v3/assets/blt77f4425de611b362/bltb1877f62e0edfd8e/64b045d7e052522a71ff6743/class-icons_wizard2.svg" },
];