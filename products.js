/* Sample 2 — catalogue data (single source of truth for index.html and product.html).
   Pre-launch (brief §11, D4): only the Toys segment is live; FMCG, Accessories and Apparel are "coming soon".
   ALL PRODUCT CONTENT IS DUMMY: names, prices, ages, descriptions, wholesale tiers, lead times,
   packaging and seller labels are invented for design review and must be replaced with real data.
   Prices are in £ only (Decisions 29 Oct): `price.GBP`.
   `category` is a slug from JIVORA_CATEGORIES; `added` (ISO date) drives "Newest" sorting and the "New" filter;
   `inStock: false` marks a sold-out toy (default: in stock). `ages` is the suitable age range in months (Gift Finder).
   Wholesale tiers are in £ too; `min` is a quantity in pieces. `lead.UK` = UK delivery lead time.
   Seller is shown only as "Sold by Jivora" or "Verified partner seller" (D13).
   27 Oct (brief §14): `hot: true` = shown in the "Hot Picks" section (editorial pre-launch pick, not sales data);
   `priceMatch: true` = covered by the "Shop & Save" Price Promise (badge + toys.html filter). Both DUMMY selections. */
(function () {
  "use strict";

  // Segments the client named (brief §11, D3). Footwear is deliberately left out.
  window.JIVORA_SEGMENTS = [
    {
      id: "toys",
      name: "Toys",
      live: true,
      image: "assets/toys/wooden-learning-set.jpg",
      alt: "Colourful wooden learning toys on a white shelf",
      blurb: "Wooden, plush, puzzles, RC and more"
    },
    {
      id: "fmcg",
      name: "FMCG",
      live: false,
      image: "assets/toys/segment-fmcg.jpg",
      alt: "Jars and bowls of pulses and spices at a market stall",
      blurb: "Grocery, spices, dal, atta, packaged food, cosmetics, toiletries"
    },
    {
      id: "accessories",
      name: "Accessories",
      live: false,
      image: "assets/toys/segment-accessories.jpg",
      alt: "A delicate bracelet, ring, earrings and pendant on a green card",
      blurb: "Artificial jewellery, bracelets, watches, purses, belts"
    },
    {
      id: "apparel",
      name: "Apparel",
      live: false,
      image: "assets/toys/segment-apparel.jpg",
      alt: "Colourful T-shirts and jumpers on wooden hangers",
      blurb: "Everyday clothing for the family"
    }
  ];

  // Toy categories — the client's exact list and names (brief "Decisions 26 Oct (2)", C1).
  // `slug` is used in toys.html?cat=<slug>; `image` is the round bubble / mega-menu photo.
  window.JIVORA_CATEGORIES = [
    { slug: "action-figures", name: "Action Figures", image: "dinosaur-figures.jpg" },
    { slug: "sensory-toys", name: "Sensory Toys", image: "pop-it-fidget.jpg" },
    { slug: "puzzles-brain-games", name: "Puzzles & Brain Games", image: "jigsaw-puzzle.jpg" },
    { slug: "construction-building", name: "Construction & Building", image: "wooden-building-pieces.jpg" },
    { slug: "art-craft", name: "Art & Craft", image: "art-crayons.jpg" },
    { slug: "soft-toys", name: "Soft Toys", image: "teddy-bear.jpg" },
    { slug: "stuffed-animal", name: "Stuffed Animal", image: "crochet-bunny.jpg" },
    { slug: "vehicles-transport", name: "Vehicles & Transport", image: "wooden-cars.jpg" },
    { slug: "creative-toy", name: "Creative Toy", image: "modelling-clay.jpg" },
    { slug: "active-outdoor", name: "Active & Outdoor", image: "kite.jpg" }
  ];

  // Age groups for "Shop by age", the header links and the toys.html filter. A toy belongs to every group its
  // suitable range (`ages`, months) overlaps. `tone` is its toy-palette accent; `image` the "Shop by age" tile photo.
  window.JIVORA_AGES = [
    { id: "0-2", label: "0–2 yrs", name: "Baby & toddler", range: [0, 35], tone: "pink", image: "wooden-shape-stacker.jpg" },
    { id: "3-5", label: "3–5 yrs", name: "Little explorers", range: [36, 71], tone: "yellow", image: "wooden-train.jpg" },
    { id: "6-8", label: "6–8 yrs", name: "Big kids", range: [72, 107], tone: "sky", image: "kite.jpg" },
    { id: "9+", label: "9+ yrs", name: "Tweens & up", range: [108, 999], tone: "purple", image: "jigsaw-puzzle.jpg" }
  ];

  // Trade terms shared by all toys (DUMMY — listed in brief §9 for the client to check)
  window.JIVORA_TRADE = {
    incoterms: ["Delivered (DAP) — UK", "Delivered duty paid (DDP) — on request"]
  };

  var JIVORA = "jivora";
  var PARTNER = "partner";

  window.JIVORA_PRODUCTS = [
    {
      id: "wooden-train-set",
      category: "vehicles-transport", added: "2026-09-12", ages: [36, 96], priceMatch: true,
      name: "Wooden Train & Track Set (24 pcs)",
      images: ["wooden-train.jpg"],
      alt: ["A toddler pushing a red and black wooden toy train beside curved wooden track"],
      age: "3-5", ageLabel: "3+ yrs",
      price: { GBP: 19.99 },
      badge: "Popular pick",
      seller: JIVORA,
      short: "Magnetic wooden carriages with curved and straight track to build a loop on the floor.",
      highlights: ["24 pieces: engine, 3 carriages, 20 track parts", "Magnetic couplings that are easy for small hands", "Smooth-sanded beech wood, water-based paint"],
      description: "A first railway that grows with your child. Click the track together into a loop or a figure of eight, couple the carriages with magnets and push the engine round. Every piece is sanded smooth and finished with child-safe, water-based paint.",
      details: { "Material": "Beech wood, water-based paint", "Box size": "32 × 24 × 7 cm", "Pieces": "24" },
      wholesale: {
        moq: 12, carton: "12 sets per carton", packaging: "Printed gift box, 12 boxes per master carton (8.4 kg)",
        tiers: { GBP: [{ min: 12, price: 12.40 }, { min: 48, price: 11.40 }, { min: 120, price: 10.60 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "rainbow-xylophone",
      category: "sensory-toys", added: "2026-09-12", ages: [18, 60], hot: true,
      name: "Rainbow Wooden Xylophone",
      images: ["rainbow-xylophone.jpg"],
      alt: ["A rainbow-coloured toy xylophone with a wooden mallet on a white surface"],
      age: "0-2", ageLabel: "18m+",
      price: { GBP: 9.99 },
      badge: "Popular pick",
      seller: JIVORA,
      short: "Eight tuned metal keys on a wooden base, with a rounded mallet sized for toddlers.",
      highlights: ["8 colour-coded tuned keys", "Rounded wooden mallet included", "Colour song card for first tunes"],
      description: "Bright, cheerful and actually in tune. Each colour is a note, so little ones can follow the song card and learn simple melodies while they build hand–eye coordination.",
      details: { "Material": "Pine base, aluminium keys", "Size": "24 × 10 × 4 cm", "Includes": "Mallet, song card" },
      wholesale: {
        moq: 24, carton: "24 pcs per carton", packaging: "Window box, 24 per master carton (7.2 kg)",
        tiers: { GBP: [{ min: 24, price: 5.90 }, { min: 96, price: 5.40 }, { min: 240, price: 4.95 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "teddy-bear-scarf",
      category: "soft-toys", added: "2026-09-14", ages: [0, 999],
      name: "Classic Teddy with Scarf (35 cm)",
      images: ["teddy-bear.jpg"],
      alt: ["A soft brown teddy bear wearing a red checked scarf, sitting on a white table"],
      age: "0-2", ageLabel: "0m+",
      price: { GBP: 12.99 },
      badge: "Popular pick",
      seller: JIVORA,
      short: "Super-soft brown teddy with embroidered eyes and a removable checked scarf.",
      highlights: ["Embroidered eyes — no small parts", "Surface washable", "35 cm, perfect for cuddling"],
      description: "A timeless first friend. Embroidered features make it suitable from birth, and the extra-soft fur stays fluffy after gentle washing.",
      details: { "Material": "Polyester plush, polyester fill", "Height": "35 cm", "Care": "Surface wash" },
      wholesale: {
        moq: 24, carton: "24 pcs per carton", packaging: "Poly bag + hang tag, 24 per carton (6.1 kg)",
        tiers: { GBP: [{ min: 24, price: 7.60 }, { min: 96, price: 6.95 }, { min: 240, price: 6.40 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "dinosaur-figure-set",
      category: "action-figures", added: "2026-09-16", ages: [36, 144], hot: true,
      name: "Dinosaur Figure Set (12 pcs)",
      images: ["dinosaur-figures.jpg", "dinosaur-figures-2.jpg"],
      alt: ["Twelve plastic dinosaur figures spread out on a white background", "Dinosaur figures arranged in a circle on a white surface"],
      age: "3-5", ageLabel: "3+ yrs",
      price: { GBP: 5.99 },
      badge: "Popular pick",
      seller: JIVORA,
      short: "Twelve detailed, hand-painted dinosaurs for small-world play and story time.",
      highlights: ["12 different species", "Hand-painted detail", "Name card with fun facts"],
      description: "From long-necked plant-eaters to fierce hunters — twelve sturdy figures that stand on their own and come with a name card so kids can learn who's who.",
      details: { "Material": "PVC-free vinyl", "Figure size": "6–9 cm", "Pieces": "12" },
      wholesale: {
        moq: 48, carton: "48 sets per carton", packaging: "Clear tub with label, 48 per carton (9.6 kg)",
        tiers: { GBP: [{ min: 48, price: 3.30 }, { min: 192, price: 3.00 }, { min: 480, price: 2.75 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "rc-off-road-truck",
      category: "vehicles-transport", added: "2026-10-18", ages: [72, 180], hot: true, priceMatch: true,
      name: "RC Off-Road Truck (2.4 GHz)",
      images: ["rc-off-road-truck.jpg"],
      alt: ["A yellow and black remote-control off-road truck next to its handheld controller"],
      age: "6+", ageLabel: "6+ yrs",
      price: { GBP: 24.99 },
      badge: "New",
      seller: JIVORA,
      short: "Chunky-tyred RC truck with a simple two-stick controller and rechargeable battery.",
      highlights: ["2.4 GHz — race with friends without interference", "USB rechargeable, ~20 min play", "Soft rubber tyres for indoors and out"],
      description: "Built for bumps. Big rubber tyres and a sprung chassis handle carpet, grass and garden paths, and the two-stick controller is easy for first-time drivers.",
      details: { "Scale": "1:18", "Battery": "USB rechargeable (cable included)", "Range": "Up to 30 m" },
      wholesale: {
        moq: 12, carton: "12 pcs per carton", packaging: "Display box, 12 per master carton (9.0 kg)",
        tiers: { GBP: [{ min: 12, price: 15.50 }, { min: 48, price: 14.20 }, { min: 120, price: 13.20 }] },
        lead: { UK: "18–25 days" }
      }
    },
    {
      id: "wooden-shape-stacker",
      category: "puzzles-brain-games", added: "2026-09-18", ages: [12, 48],
      name: "Wooden Shape Stacker Board",
      images: ["wooden-shape-stacker.jpg"],
      alt: ["A wooden board with red, orange, yellow, green and blue stacking shapes on pegs"],
      age: "0-2", ageLabel: "12m+",
      price: { GBP: 6.99 },
      badge: "Popular pick",
      seller: JIVORA,
      short: "Five colours, five shapes, one peg each — a classic first sorting and counting toy.",
      highlights: ["Teaches colours, shapes and counting 1–5", "Chunky pieces for small hands", "Montessori-style design"],
      description: "Match each colour to its peg and stack them up. A calm, screen-free toy that builds fine-motor skills and early maths through play.",
      details: { "Material": "Pine wood, water-based paint", "Size": "28 × 7 × 8 cm", "Pieces": "15 + base" },
      wholesale: {
        moq: 24, carton: "24 pcs per carton", packaging: "Shrink-wrapped with label, 24 per carton (6.8 kg)",
        tiers: { GBP: [{ min: 24, price: 4.10 }, { min: 96, price: 3.75 }, { min: 240, price: 3.45 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "wooden-number-blocks",
      category: "construction-building", added: "2026-09-20", ages: [24, 72],
      name: "Wooden Number & Letter Blocks (30 pcs)",
      images: ["wooden-number-blocks.jpg"],
      alt: ["Close-up of wooden alphabet and number blocks with bright printed numbers"],
      age: "0-2", ageLabel: "2+ yrs",
      price: { GBP: 8.99 },
      seller: JIVORA,
      short: "Thirty solid blocks printed with numbers, letters and pictures on every side.",
      highlights: ["30 solid wood blocks, 4 cm", "Numbers, letters and pictures", "Comes in a cotton storage bag"],
      description: "Stack them, sort them, spell with them. Solid 4 cm blocks with printed numbers and letters that stay bright, packed in a cotton drawstring bag for easy tidy-up.",
      details: { "Material": "Solid wood, child-safe print", "Block size": "4 × 4 × 4 cm", "Pieces": "30" },
      wholesale: {
        moq: 24, carton: "24 bags per carton", packaging: "Cotton bag + header card, 24 per carton (10.2 kg)",
        tiers: { GBP: [{ min: 24, price: 5.30 }, { min: 96, price: 4.85 }, { min: 240, price: 4.45 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "wooden-sea-animals",
      category: "creative-toy", added: "2026-09-24", ages: [24, 72],
      name: "Wooden Sea Animals Set (6 pcs)",
      images: ["wooden-sea-animals.jpg", "wooden-sea-animals-2.jpg"],
      alt: ["Hand-painted wooden whale, fish and octopus figures on a white background", "Wooden sea animal toys in soft window light"],
      age: "0-2", ageLabel: "2+ yrs",
      price: { GBP: 7.99 },
      badge: "Gift pick",
      seller: PARTNER,
      short: "A whale, octopus, fish and friends — chunky, hand-painted wooden sea creatures.",
      highlights: ["6 hand-painted animals", "Stand-up bases for small-world play", "Rounded edges, no small parts"],
      description: "An ocean on the playroom floor. Each creature is cut from thick wood, sanded round and hand-painted, so it's lovely to hold and tough enough for bath-time stories (keep dry after!).",
      details: { "Material": "Lime wood, water-based paint", "Figure size": "7–12 cm", "Pieces": "6" },
      wholesale: {
        moq: 24, carton: "24 sets per carton", packaging: "Kraft box, 24 per carton (5.9 kg)",
        tiers: { GBP: [{ min: 24, price: 4.80 }, { min: 96, price: 4.40 }, { min: 240, price: 4.05 }] },
        lead: { UK: "18–25 days" }
      }
    },
    {
      id: "wind-up-robot",
      category: "action-figures", added: "2026-09-28", ages: [36, 144],
      name: "Wind-Up Walking Robot",
      images: ["wind-up-robot.jpg"],
      alt: ["A blue wind-up toy robot with one big eye and a yellow dial on its chest"],
      age: "3-5", ageLabel: "3+ yrs",
      price: { GBP: 4.99 },
      seller: JIVORA,
      short: "Twist the key and watch it march — a retro wind-up robot with no batteries needed.",
      highlights: ["Clockwork — no batteries", "Walks and swings its arms", "Pocket-sized party favour"],
      description: "A little bit of retro fun. Wind the key on the side and the robot marches across the table, arms swinging. Great as a party-bag gift or desk toy.",
      details: { "Material": "ABS plastic, metal clockwork", "Height": "11 cm", "Power": "Wind-up" },
      wholesale: {
        moq: 48, carton: "48 pcs per carton", packaging: "Window box, 48 per carton (6.5 kg)",
        tiers: { GBP: [{ min: 48, price: 2.70 }, { min: 192, price: 2.45 }, { min: 480, price: 2.25 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "wooden-robot-figure",
      category: "action-figures", added: "2026-10-02", inStock: false, ages: [72, 180],
      name: "Poseable Wooden Robot",
      images: ["wooden-robot.jpg"],
      alt: ["A colourful wooden robot toy with a smiling face on a black background"],
      age: "6+", ageLabel: "6+ yrs",
      price: { GBP: 9.49 },
      seller: PARTNER,
      short: "A hand-painted wooden robot with bendy arms and legs — part toy, part room décor.",
      highlights: ["Poseable arms and legs", "Hand-painted face and dials", "Lovely shelf piece for kids' rooms"],
      description: "Characterful and built to last. Elastic-strung joints let kids pose the robot into dance moves, and the hand-painted details make it a favourite shelf piece too.",
      details: { "Material": "Beech wood, elastic cord", "Height": "18 cm", "Finish": "Water-based paint" },
      wholesale: {
        moq: 24, carton: "24 pcs per carton", packaging: "Kraft box, 24 per carton (5.0 kg)",
        tiers: { GBP: [{ min: 24, price: 5.70 }, { min: 96, price: 5.20 }, { min: 240, price: 4.80 }] },
        lead: { UK: "18–25 days" }
      }
    },
    {
      id: "wooden-rocket-stacker",
      category: "construction-building", added: "2026-10-18", ages: [18, 60],
      name: "Wooden Rocket Stacker",
      images: ["wooden-rocket.jpg"],
      alt: ["A red and white wooden toy rocket with a round window on a white background"],
      age: "0-2", ageLabel: "18m+",
      price: { GBP: 7.49 },
      badge: "New",
      seller: JIVORA,
      short: "Stack the rings to build a rocket, then blast off — with a little astronaut inside.",
      highlights: ["5 stacking pieces + mini astronaut", "Builds sequencing skills", "Smooth, rounded wood"],
      description: "Three, two, one… stack! Rings slot onto a central peg to build a red-and-white rocket, and the porthole hides a tiny wooden astronaut.",
      details: { "Material": "Beech wood, water-based paint", "Height": "22 cm", "Pieces": "6" },
      wholesale: {
        moq: 24, carton: "24 pcs per carton", packaging: "Gift box, 24 per carton (6.2 kg)",
        tiers: { GBP: [{ min: 24, price: 4.50 }, { min: 96, price: 4.10 }, { min: 240, price: 3.80 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "jigsaw-puzzle-500",
      category: "puzzles-brain-games", added: "2026-10-04", ages: [96, 999], priceMatch: true,
      name: "500-Piece Jigsaw Puzzle",
      images: ["jigsaw-puzzle.jpg", "jigsaw-puzzle-2.jpg"],
      alt: ["A pile of colourful jigsaw puzzle pieces on a white table", "A jigsaw puzzle being put together, pieces spread across a table"],
      age: "6+", ageLabel: "8+ yrs",
      price: { GBP: 6.99 },
      seller: JIVORA,
      short: "A bright 500-piece family puzzle on thick card, with a poster to work from.",
      highlights: ["500 thick, snug-fit pieces", "Reference poster included", "Finished size 48 × 34 cm"],
      description: "A rainy-afternoon classic. Thick, glare-free pieces lock together firmly, and the reference poster helps younger puzzlers sort edges and colours.",
      details: { "Material": "Recycled board", "Finished size": "48 × 34 cm", "Pieces": "500" },
      wholesale: {
        moq: 36, carton: "36 boxes per carton", packaging: "Printed box, 36 per carton (11.0 kg)",
        tiers: { GBP: [{ min: 36, price: 3.90 }, { min: 144, price: 3.55 }, { min: 360, price: 3.25 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "panda-plush",
      category: "soft-toys", added: "2026-10-06", ages: [0, 999], priceMatch: true,
      name: "Soft Panda Plush (30 cm)",
      images: ["panda-plush.jpg"],
      alt: ["A black and white panda soft toy sitting on a desk"],
      age: "0-2", ageLabel: "0m+",
      price: { GBP: 11.99 },
      badge: "Gift pick",
      seller: JIVORA,
      short: "A floppy, huggable panda with extra-soft fur and embroidered features.",
      highlights: ["Embroidered eyes and nose", "Bean-free, floppy body", "Surface washable"],
      description: "Made for naps and long car rides. The floppy body moulds into a cuddle, and embroidered features keep it safe from birth.",
      details: { "Material": "Polyester plush", "Height": "30 cm", "Care": "Surface wash" },
      wholesale: {
        moq: 24, carton: "24 pcs per carton", packaging: "Poly bag + hang tag, 24 per carton (5.4 kg)",
        tiers: { GBP: [{ min: 24, price: 7.10 }, { min: 96, price: 6.50 }, { min: 240, price: 6.00 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "crochet-cot-mobile",
      category: "sensory-toys", added: "2026-10-08", ages: [0, 24],
      name: "Crochet Animal Cot Mobile",
      images: ["crochet-cot-mobile.jpg"],
      alt: ["Hand-crocheted animal toys hanging from a cot mobile in soft light"],
      age: "0-2", ageLabel: "0m+",
      price: { GBP: 16.99 },
      badge: "Gift pick",
      seller: PARTNER,
      short: "Hand-crocheted animals on a wooden ring — a gentle, colourful mobile for the nursery.",
      highlights: ["Hand-crocheted cotton animals", "Natural wooden hanging ring", "For display above the cot only"],
      description: "Each little animal is crocheted by hand in soft cotton yarn, so no two mobiles are exactly alike. Hang it out of reach above the cot for something calm to look at.",
      details: { "Material": "Cotton yarn, beech ring", "Drop length": "45 cm", "Use": "Decoration — not a toy to hold" },
      wholesale: {
        moq: 12, carton: "12 pcs per carton", packaging: "Gift box with tissue, 12 per carton (3.1 kg)",
        tiers: { GBP: [{ min: 12, price: 10.40 }, { min: 48, price: 9.60 }, { min: 120, price: 8.90 }] },
        lead: { UK: "21–28 days" }
      }
    },
    {
      id: "wooden-counting-stacker",
      category: "puzzles-brain-games", added: "2026-10-10", ages: [24, 72],
      name: "Wooden Counting Stacker",
      images: ["wooden-counting-stacker.jpg"],
      alt: ["A child playing with wooden counting rings and stacking toys on a white floor"],
      age: "3-5", ageLabel: "2+ yrs",
      price: { GBP: 7.99 },
      seller: JIVORA,
      short: "Number pegs and wooden rings that turn counting to ten into a game.",
      highlights: ["Pegs numbered 1–10", "55 wooden counting rings", "Early maths through play"],
      description: "Pop one ring on peg 1, two on peg 2… up to ten. A hands-on way to learn numbers and quantities, with natural wood and soft colours.",
      details: { "Material": "Pine wood, water-based paint", "Size": "30 × 10 × 12 cm", "Pieces": "55 rings + base" },
      wholesale: {
        moq: 24, carton: "24 pcs per carton", packaging: "Shrink-wrapped with label, 24 per carton (8.0 kg)",
        tiers: { GBP: [{ min: 24, price: 4.80 }, { min: 96, price: 4.40 }, { min: 240, price: 4.05 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "wooden-learning-set",
      category: "creative-toy", added: "2026-10-12", ages: [36, 84],
      name: "Wooden Learning Toys Set (5-in-1)",
      images: ["wooden-learning-set.jpg"],
      alt: ["A shelf of colourful wooden learning toys: abacus, bead maze and sorting boards"],
      age: "3-5", ageLabel: "3+ yrs",
      price: { GBP: 17.99 },
      badge: "Gift pick",
      seller: PARTNER,
      short: "Abacus, bead maze, shape sorter, peg board and lacing beads in one value set.",
      highlights: ["5 learning toys in one set", "Colours, counting, shapes and fine-motor skills", "Wooden storage tray"],
      description: "A whole shelf of early-learning favourites. Five wooden activities cover counting, colours, shapes and hand control, and everything packs away into a sturdy tray.",
      details: { "Material": "Birch plywood and beech", "Tray size": "40 × 30 × 6 cm", "Activities": "5" },
      wholesale: {
        moq: 12, carton: "12 sets per carton", packaging: "Printed box, 12 per carton (12.5 kg)",
        tiers: { GBP: [{ min: 12, price: 11.20 }, { min: 48, price: 10.30 }, { min: 120, price: 9.50 }] },
        lead: { UK: "18–25 days" }
      }
    },
    {
      id: "army-figures-set",
      category: "action-figures", added: "2026-10-22", ages: [48, 144],
      name: "Classic Army Figures (50 pcs)",
      images: ["toy-soldiers.jpg"],
      alt: ["Rows of small green plastic toy soldier figures on a pale green background"],
      age: "3-5", ageLabel: "4+ yrs",
      price: { GBP: 4.99 },
      badge: "New",
      seller: JIVORA,
      short: "Fifty unbranded green figures in classic poses — for forts, sandpits and tabletop battles.",
      highlights: ["50 figures in 10 poses", "Soft, flexible PVC-free plastic", "Drawstring storage bag"],
      description: "The classic bucket of little green figures. Set them up on the floor, in the garden or around a cardboard fort and let the story unfold. Flexible plastic means bent bases simply spring back.",
      details: { "Material": "PVC-free plastic", "Figure height": "5 cm", "Pieces": "50" },
      wholesale: {
        moq: 48, carton: "48 bags per carton", packaging: "Drawstring bag with header card, 48 per carton (6.2 kg)",
        tiers: { GBP: [{ min: 48, price: 2.90 }, { min: 192, price: 2.65 }, { min: 480, price: 2.45 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "rainbow-pop-it-board",
      category: "sensory-toys", added: "2026-10-21", ages: [36, 216], hot: true,
      name: "Rainbow Pop-It Sensory Board",
      images: ["pop-it-fidget.jpg", "pop-it-fidget-2.jpg"],
      alt: ["A rainbow-coloured silicone pop-it board on pastel paper", "Hands pressing the bubbles of a rainbow pop-it board"],
      age: "3-5", ageLabel: "3+ yrs",
      price: { GBP: 3.99 },
      badge: "New",
      seller: JIVORA,
      short: "Press the bubbles, flip it over, press again — a calming fidget for busy hands.",
      highlights: ["Food-grade silicone, washable", "Rainbow colours for colour games", "Pocket size, no batteries"],
      description: "A soft silicone board full of bubbles that pop down with a satisfying click. Great for quiet time, car journeys and simple counting or colour games.",
      details: { "Material": "Food-grade silicone", "Size": "13 × 13 cm", "Care": "Wipe or rinse clean" },
      wholesale: {
        moq: 48, carton: "48 pcs per carton", packaging: "Clear polybag with header, 48 per carton (3.0 kg)",
        tiers: { GBP: [{ min: 48, price: 2.10 }, { min: 192, price: 1.90 }, { min: 480, price: 1.75 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "family-board-game",
      category: "puzzles-brain-games", added: "2026-10-20", ages: [72, 999], priceMatch: true,
      name: "Family Board Game with Wooden Pawns",
      images: ["board-game.jpg"],
      alt: ["Wooden pawns and dice on an illustrated board game"],
      age: "6+", ageLabel: "6+ yrs",
      price: { GBP: 11.99 },
      badge: "Gift pick",
      seller: PARTNER,
      short: "A race-and-collect board game for 2–4 players with chunky wooden pawns and dice.",
      highlights: ["2–4 players, 20-minute games", "Wooden pawns and dice", "Simple rules, real strategy"],
      description: "Roll, race and collect across an illustrated farm board. Easy enough for a six-year-old to learn in a minute, with enough choices to keep grown-ups at the table.",
      details: { "Players": "2–4", "Game time": "About 20 minutes", "Box size": "27 × 27 × 6 cm" },
      wholesale: {
        moq: 12, carton: "12 games per carton", packaging: "Printed box, 12 per carton (7.8 kg)",
        tiers: { GBP: [{ min: 12, price: 7.20 }, { min: 48, price: 6.60 }, { min: 120, price: 6.10 }] },
        lead: { UK: "18–25 days" }
      }
    },
    {
      id: "wooden-building-planks",
      category: "construction-building", added: "2026-10-23", ages: [36, 144], priceMatch: true,
      name: "Wooden Building Planks (120 pcs)",
      images: ["wooden-building-pieces.jpg"],
      alt: ["A child building shapes from plain wooden planks on a rug"],
      age: "3-5", ageLabel: "3+ yrs",
      price: { GBP: 14.99 },
      badge: "New",
      seller: JIVORA,
      short: "Identical natural-wood planks that stack into towers, bridges and houses — no glue, no clips.",
      highlights: ["120 identical pine planks", "Builds towers, bridges and patterns", "Cotton storage bag"],
      description: "Every plank is the same size, so balance does the work. Start with simple walls and towers, then try arches and bridges. Open-ended building that grows with your child.",
      details: { "Material": "Pine wood, unpainted", "Plank size": "11.7 × 2.3 × 0.8 cm", "Pieces": "120" },
      wholesale: {
        moq: 12, carton: "12 sets per carton", packaging: "Cotton bag in kraft box, 12 per carton (9.6 kg)",
        tiers: { GBP: [{ min: 12, price: 9.20 }, { min: 48, price: 8.50 }, { min: 120, price: 7.90 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "jumbo-crayons",
      category: "art-craft", added: "2026-10-19", ages: [24, 96],
      name: "Jumbo Washable Crayons (12 colours)",
      images: ["art-crayons.jpg"],
      alt: ["A small child drawing with chunky coloured crayons on paper"],
      age: "0-2", ageLabel: "2+ yrs",
      price: { GBP: 3.99 },
      seller: JIVORA,
      short: "Chunky, easy-grip crayons that wash off hands, tables and most fabrics.",
      highlights: ["12 bright colours", "Thick, break-resistant sticks", "Washable, non-toxic wax"],
      description: "Made for first drawings: thick enough for small fists, strong enough not to snap and washable when the art goes off the page.",
      details: { "Material": "Non-toxic washable wax", "Crayon size": "10 × 1.5 cm", "Colours": "12" },
      wholesale: {
        moq: 48, carton: "48 packs per carton", packaging: "Card tuck box, 48 per carton (6.0 kg)",
        tiers: { GBP: [{ min: 48, price: 2.40 }, { min: 192, price: 2.20 }, { min: 480, price: 2.00 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "watercolour-pencil-set",
      category: "art-craft", added: "2026-10-16", ages: [60, 999],
      name: "Watercolour Paint & Pencil Set",
      images: ["art-watercolour-set.jpg"],
      alt: ["A girl colouring with pencils beside an open watercolour paint palette"],
      age: "6+", ageLabel: "5+ yrs",
      price: { GBP: 7.99 },
      seller: PARTNER,
      short: "12 watercolour cakes, 12 colouring pencils and a brush in one flat tin.",
      highlights: ["12 watercolour cakes + brush", "12 pre-sharpened pencils", "Slim metal tin for school bags"],
      description: "Everything for an afternoon of painting and colouring in one tin. The palette lid doubles as a mixing tray.",
      details: { "Includes": "12 paints, 12 pencils, 1 brush", "Tin size": "20 × 12 × 2 cm", "Material": "Metal tin" },
      wholesale: {
        moq: 24, carton: "24 sets per carton", packaging: "Shrink-wrapped tin, 24 per carton (5.4 kg)",
        tiers: { GBP: [{ min: 24, price: 4.80 }, { min: 96, price: 4.40 }, { min: 240, price: 4.10 }] },
        lead: { UK: "18–25 days" }
      }
    },
    {
      id: "crochet-bunny",
      category: "stuffed-animal", added: "2026-10-25", ages: [0, 999], hot: true,
      name: "Hand-Crocheted Bunny (28 cm)",
      images: ["crochet-bunny.jpg"],
      alt: ["A cream hand-crocheted bunny toy on a soft pink background"],
      age: "0-2", ageLabel: "0m+",
      price: { GBP: 12.99 },
      badge: "New",
      seller: PARTNER,
      short: "A cream cotton bunny, crocheted by hand with long ears and a tiny pink nose.",
      highlights: ["Hand-crocheted cotton yarn", "Stitched eyes — safe from birth", "Every bunny is slightly unique"],
      description: "Made stitch by stitch in soft cotton yarn, this bunny is gentle enough for a newborn and pretty enough for the nursery shelf.",
      details: { "Material": "Cotton yarn, fibre fill", "Height": "28 cm", "Care": "Hand wash" },
      wholesale: {
        moq: 12, carton: "12 pcs per carton", packaging: "Gift bag with tag, 12 per carton (2.2 kg)",
        tiers: { GBP: [{ min: 12, price: 8.10 }, { min: 48, price: 7.40 }, { min: 120, price: 6.90 }] },
        lead: { UK: "21–28 days" }
      }
    },
    {
      id: "crochet-bear",
      category: "stuffed-animal", added: "2026-10-15", ages: [0, 999],
      name: "Crochet Brown Bear (30 cm)",
      images: ["crochet-bear.jpg"],
      alt: ["A brown crocheted bear toy sitting on a sunny window sill"],
      age: "0-2", ageLabel: "0m+",
      price: { GBP: 13.49 },
      seller: PARTNER,
      short: "A chunky hand-crocheted bear with a round tummy and floppy arms.",
      highlights: ["Hand-crocheted cotton yarn", "Stitched eyes, no small parts", "Sits up on its own"],
      description: "This round little bear is crocheted by hand in warm brown cotton. Weighted just enough to sit up on a shelf or window sill — and soft enough for bedtime.",
      details: { "Material": "Cotton yarn, fibre fill", "Height": "30 cm", "Care": "Hand wash" },
      wholesale: {
        moq: 12, carton: "12 pcs per carton", packaging: "Gift bag with tag, 12 per carton (2.6 kg)",
        tiers: { GBP: [{ min: 12, price: 8.40 }, { min: 48, price: 7.70 }, { min: 120, price: 7.20 }] },
        lead: { UK: "21–28 days" }
      }
    },
    {
      id: "felt-bunny-pompoms",
      category: "stuffed-animal", added: "2026-10-11", inStock: false, ages: [36, 999],
      name: "Felt Bunny with Pom-Pom Friends",
      images: ["felt-bunny.jpg"],
      alt: ["A soft felt bunny toy surrounded by pastel pom-poms"],
      age: "3-5", ageLabel: "3+ yrs",
      price: { GBP: 8.99 },
      seller: JIVORA,
      short: "A soft felt bunny that comes with a bag of pastel pom-poms for play and craft.",
      highlights: ["Soft felt bunny, 22 cm", "40 pastel pom-poms", "Fabric storage pouch"],
      description: "A cuddly felt bunny with a bag of pom-pom 'carrots' and 'flowers' for pretend play — and plenty left over for craft projects.",
      details: { "Material": "Felt, polyester fill", "Height": "22 cm", "Includes": "40 pom-poms, pouch" },
      wholesale: {
        moq: 24, carton: "24 sets per carton", packaging: "Printed pouch, 24 per carton (3.4 kg)",
        tiers: { GBP: [{ min: 24, price: 5.60 }, { min: 96, price: 5.15 }, { min: 240, price: 4.80 }] },
        lead: { UK: "18–25 days" }
      }
    },
    {
      id: "wooden-cars-pair",
      category: "vehicles-transport", added: "2026-10-21", ages: [12, 72], hot: true,
      name: "Wooden Push-Along Cars (set of 2)",
      images: ["wooden-cars.jpg"],
      alt: ["A yellow and a green wooden toy car with a wooden peg figure on a dark background"],
      age: "0-2", ageLabel: "12m+",
      price: { GBP: 8.49 },
      badge: "New",
      seller: JIVORA,
      short: "Two chunky wooden cars with rubber-rim wheels and a peg-doll driver.",
      highlights: ["2 cars + 1 peg-doll driver", "Rubber-rim wheels roll quietly", "Water-based paint, rounded edges"],
      description: "Simple, sturdy cars sized for small hands. The rubber rims grip the floor and keep things quiet, and the peg-doll driver swaps between cars.",
      details: { "Material": "Beech wood, water-based paint", "Car length": "10 cm", "Pieces": "3" },
      wholesale: {
        moq: 24, carton: "24 sets per carton", packaging: "Kraft box, 24 per carton (6.0 kg)",
        tiers: { GBP: [{ min: 24, price: 5.20 }, { min: 96, price: 4.80 }, { min: 240, price: 4.40 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "modelling-clay-set",
      category: "creative-toy", added: "2026-10-20", ages: [36, 144], hot: true,
      name: "Soft Modelling Clay (12 colours)",
      images: ["modelling-clay.jpg", "modelling-clay-2.jpg"],
      alt: ["A child shaping soft, colourful modelling clay on a table", "Children's hands making shapes from colourful clay on a white table"],
      age: "3-5", ageLabel: "3+ yrs",
      price: { GBP: 5.99 },
      badge: "Gift pick",
      seller: JIVORA,
      short: "Soft, non-sticky clay in 12 colours with 3 shaping tools — never dries out.",
      highlights: ["12 colours, 200 g in total", "Stays soft — never dries out", "3 shaping tools included"],
      description: "Squish, roll and shape animals, food and anything else. This clay stays soft for months, does not stick to hands and blends into new colours.",
      details: { "Material": "Non-toxic, non-drying clay", "Weight": "200 g", "Includes": "12 colours, 3 tools" },
      wholesale: {
        moq: 48, carton: "48 packs per carton", packaging: "Clear box, 48 per carton (11.0 kg)",
        tiers: { GBP: [{ min: 48, price: 3.50 }, { min: 192, price: 3.20 }, { min: 480, price: 2.95 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "rainbow-kite",
      category: "active-outdoor", added: "2026-10-22", ages: [60, 999], hot: true,
      name: "Rainbow Tail Kite",
      images: ["kite.jpg", "kite-2.jpg"],
      alt: ["A girl in a green T-shirt flying a blue bird-shaped kite in a field", "A woman and a little girl running with a rainbow kite in a park"],
      age: "6+", ageLabel: "5+ yrs",
      price: { GBP: 7.49 },
      badge: "New",
      seller: JIVORA,
      short: "Easy-launch kite with a long rainbow tail, 30 m line and a comfy handle.",
      highlights: ["Ripstop nylon, fibreglass frame", "30 m line on a winder handle", "Flies in light wind"],
      description: "A forgiving kite that lifts in a light breeze, so first-time flyers get it up quickly. Packs flat into its own sleeve for the park or the beach.",
      details: { "Material": "Ripstop nylon, fibreglass", "Wingspan": "110 cm", "Line": "30 m" },
      wholesale: {
        moq: 24, carton: "24 kites per carton", packaging: "Flat sleeve, 24 per carton (4.2 kg)",
        tiers: { GBP: [{ min: 24, price: 4.40 }, { min: 96, price: 4.05 }, { min: 240, price: 3.75 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "skipping-rope",
      category: "active-outdoor", added: "2026-10-13", ages: [60, 999],
      name: "Long Group Skipping Rope (5 m)",
      images: ["skipping-rope.jpg"],
      alt: ["A group of children playing with a long skipping rope on the grass"],
      age: "6+", ageLabel: "5+ yrs",
      price: { GBP: 4.49 },
      seller: JIVORA,
      short: "A 5-metre rope for playground games — two turners and a whole group jumping.",
      highlights: ["5 m soft braided rope", "Wooden handles", "Great for group games"],
      description: "Bring back playground skipping with a long, soft rope that turns smoothly. Two turners, one or more jumpers and plenty of rhymes.",
      details: { "Material": "Braided cotton, beech handles", "Length": "5 m", "Players": "3+" },
      wholesale: {
        moq: 48, carton: "48 pcs per carton", packaging: "Header card, 48 per carton (7.0 kg)",
        tiers: { GBP: [{ min: 48, price: 2.60 }, { min: 192, price: 2.40 }, { min: 480, price: 2.20 }] },
        lead: { UK: "14–21 days" }
      }
    },
    {
      id: "foam-glider-plane",
      category: "active-outdoor", added: "2026-10-18", inStock: false, ages: [48, 999],
      name: "Foam Glider Plane (48 cm)",
      images: ["foam-glider.jpg"],
      alt: ["A boy holding up an orange foam glider plane in a park"],
      age: "3-5", ageLabel: "4+ yrs",
      price: { GBP: 4.99 },
      seller: JIVORA,
      short: "Light foam glider that loops and swoops — throw it hard for stunts or gently for long glides.",
      highlights: ["Bendy EPP foam — survives crashes", "48 cm wingspan", "No batteries, no assembly"],
      description: "Throw it level for a long, smooth glide or angle it up for a loop. Soft foam bends instead of breaking, so it is ready for the next flight.",
      details: { "Material": "EPP foam", "Wingspan": "48 cm", "Weight": "45 g" },
      wholesale: {
        moq: 48, carton: "48 pcs per carton", packaging: "Polybag, 48 per carton (3.8 kg)",
        tiers: { GBP: [{ min: 48, price: 3.00 }, { min: 192, price: 2.75 }, { min: 480, price: 2.55 }] },
        lead: { UK: "14–21 days" }
      }
    }
  ];
})();
