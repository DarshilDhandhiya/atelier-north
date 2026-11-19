/* DEMO CONTENT – every project, person, quote and figure below is fictional. Replace before a real studio launch. */
import { img } from './images';

const d = (s: string) => new Date(s);

export const projects = [
  {
    slug: 'hallingdal-house',
    title: 'Hallingdal House',
    category: 'Residential',
    location: 'Bergen, Norway',
    year: 2025,
    areaSqFt: 3200,
    summary: 'A five-bedroom family home of board-formed concrete and pine, set into a slope so that every room borrows the view.',
    brief:
      'A young family wanted a house that felt calm in a wet climate: bright in winter, private from the road, and robust enough for children, dogs and a great deal of mud.\n\nThe site fell steeply away from the lane. Planning rules capped the height at the street edge, which left us room to go down rather than up.',
    approach:
      'We cut the house into the hillside in three stepped volumes. The concrete is board-formed with local pine so the walls carry the grain of the timber that shaped them, and the same pine is used for the joinery inside. The kitchen sits at the middle level and opens to both the lane and the garden, so the family is never more than a few steps from either.\n\nRoof overhangs were set by sun studies for December and June. Deep reveals and a single large north window keep the living room even and glare-free, while heat comes from a ground-source pump and the thermal mass of the walls.',
    scope: ['Concept design and planning application', 'Detailed architectural design', 'Interior architecture and bespoke joinery', 'Lighting, furniture and art direction', 'Site supervision to handover'],
    coverImage: img(30484316, 'Minimalist concrete house with a timber-lined entrance and a garden in front'),
    gallery: [
      img(26732551, 'Living room with a low sofa, wooden furniture and a restrained neutral palette'),
      img(20036481, 'Kitchen with marble worktops, grey cabinets and wooden accents'),
      img(6284232, 'Bedroom with timber wall panelling and a low bed dressed in soft neutrals'),
      img(6758534, 'Bathroom with wooden details, a large mirror and clean white fixtures'),
    ],
    tags: ['concrete', 'timber', 'family home', 'passive solar'],
    featured: true,
    featuredOrder: 0,
    publishedAt: d('2026-02-12'),
  },
  {
    slug: 'strand-hotel-lobby',
    title: 'Strand Hotel Lobby',
    category: 'Hospitality',
    location: 'Copenhagen, Denmark',
    year: 2024,
    areaSqFt: 8400,
    summary: 'A harbour-side hotel lobby reworked as a sequence of rooms: arrival, lounge and bar, each with its own light and level of noise.',
    brief:
      'The owners wanted the lobby to earn its keep as a neighbourhood meeting place, not just a corridor to the lifts. The existing double-height space was impressive but echoing, with one long reception desk and nowhere to sit.\n\nThe hotel had to keep trading throughout, so the work was phased in four short closures.',
    approach:
      'We broke the hall into three zones using changes in ceiling height, floor material and lighting temperature. Arrival is bright and quiet, the lounge is low and warm, and the bar sits behind a screen of oak slats that softens sound without closing the view.\n\nFurniture was drawn with the hotel’s operators: sofas are firm enough to rise from easily, side tables are wipe-clean, and every power point sits where a laptop actually goes. Acoustic plaster and woven rugs brought reverberation time down by roughly half.',
    scope: ['Space planning and phasing strategy', 'Interior architecture', 'Bespoke furniture and lighting design', 'Acoustic design coordination', 'Procurement and installation oversight'],
    coverImage: img(28999491, 'Bright hotel lobby with blue armchairs, wooden elements and natural light'),
    gallery: [
      img(35215413, 'Spacious luxury hotel lobby with modern furnishings and large windows'),
      img(18426842, 'Hotel lobby with turquoise seating and a bar area'),
      img(13369919, 'Restaurant and bar interior with a chandelier and warm lighting'),
      img(38197473, 'Modern hotel lobby with artistic design details and layered lighting'),
    ],
    tags: ['hotel', 'acoustics', 'oak', 'phased works'],
    featured: true,
    featuredOrder: 1,
    publishedAt: d('2026-01-20'),
  },
  {
    slug: 'kestrel-works',
    title: 'Kestrel Works',
    category: 'Workplace',
    location: 'Edinburgh, Scotland',
    year: 2024,
    areaSqFt: 12500,
    summary: 'Three floors of a former printworks converted into a studio-style office for a 90-person engineering firm.',
    brief:
      'The client outgrew its serviced office and wanted a place people would choose to come to. The building offered generous floor-to-ceiling heights and big north-facing windows, but a maze of partitions blocked the light.\n\nThe brief asked for quiet focus space, team areas that could change shape, and a ground floor open to the neighbourhood for events.',
    approach:
      'We stripped the floors back to their structure, then placed solid, warm “rooms” in the open plan only where privacy or sound control demanded it. Everything else stays loose: desks on castors, movable acoustic screens, and shelving that doubles as a divider.\n\nThe ground floor became a workshop café with its own entrance, so the building now has a public face in the evenings. Materials were chosen to age well: oiled oak, linoleum and powder-coated steel.',
    scope: ['Feasibility and test fits', 'Architecture and interior design', 'Workplace strategy workshops', 'Furniture selection and layouts', 'Wayfinding and signage'],
    coverImage: img(33393712, 'Minimalist office workspace with modern furniture and a large window'),
    gallery: [
      img(36631699, 'Open-plan office with wooden desks, leather chairs and ceiling lights'),
      img(34165409, 'Tall modern office building with glass windows seen from below'),
    ],
    tags: ['workplace', 'adaptive reuse', 'acoustics'],
    featured: false,
    featuredOrder: 0,
    publishedAt: d('2025-11-05'),
  },
  {
    slug: 'lantern-loft',
    title: 'Lantern Loft',
    category: 'Renovation',
    location: 'Lisbon, Portugal',
    year: 2023,
    areaSqFt: 1450,
    summary: 'A compact top-floor apartment opened up under its original timber roof, with a kitchen and bedroom divided by a single brick partition.',
    brief:
      'A couple who split their year between two cities bought a cramped attic apartment with thick walls and very little light. They wanted a place that felt generous when they were home and could be left safely for months.\n\nThe building is protected, so the roof line and facade had to stay as they were.',
    approach:
      'We removed everything added since the 1970s and let the old roof timbers show. A low brick partition now separates kitchen from bed without blocking the view through the new skylights, and storage runs along the whole of one wall behind flush doors.\n\nNew oak flooring runs through every room so the space reads as one. A small tilting window in the roof pulls air up through the apartment, which keeps it comfortable through Lisbon summers without air conditioning.',
    scope: ['Measured survey', 'Heritage consent drawings', 'Interior architecture and joinery', 'Lighting and ventilation design', 'Project management'],
    coverImage: img(6447384, 'Compact studio apartment with a kitchen counter and bedroom behind a brick partition'),
    gallery: [
      img(6186813, 'Living room with a sofa, coffee table and large window curtains'),
      img(7214332, 'Bright airy bedroom with wood accents and green curtains'),
      img(7045358, 'Modern bathroom with wooden accents and minimalist fixtures'),
    ],
    tags: ['heritage', 'small space', 'brick', 'natural ventilation'],
    featured: true,
    featuredOrder: 3,
    publishedAt: d('2025-09-18'),
  },
  {
    slug: 'ridge-glasshouse',
    title: 'Ridge Glasshouse',
    category: 'Residential',
    location: 'Seattle, USA',
    year: 2025,
    areaSqFt: 4100,
    summary: 'A long, low house of glass and concrete that frames the tree line, with deep eaves to keep the summer sun out.',
    brief:
      'The owners are keen gardeners who wanted to live among the trees without feeling exposed. The ridge-top plot was narrow, with neighbours close on one side and a long view on the other.\n\nThey asked for a house that felt open to the garden, yet private from the lane, and that would not overheat.',
    approach:
      'The plan is a single long bar with solid concrete ends and a fully glazed spine. Deep eaves, fixed timber louvres and a planted roof reduce solar gain, while operable high windows let hot air escape.\n\nA courtyard garden sits at the centre of the house, so even the bedrooms look onto planting. The outer walls are blank where the neighbours are closest, which gave us room to be generous with glass everywhere else.',
    scope: ['Concept and planning', 'Architecture', 'Landscape coordination', 'Interior finishes and fixed furniture', 'Construction administration'],
    coverImage: img(13203190, 'Contemporary house with a glass facade and a pool under a blue sky'),
    gallery: [
      img(13041118, 'Sleek modern concrete house with large glass windows and a lawn'),
      img(5570222, 'Bright modern living room with white walls, big windows and a wooden staircase'),
      img(38800611, 'Minimalist living room with a grey sofa, glass doors and soft lighting'),
    ],
    tags: ['glass', 'garden', 'courtyard', 'shading'],
    featured: true,
    featuredOrder: 2,
    publishedAt: d('2026-03-02'),
  },
  {
    slug: 'fjordgata-apartments',
    title: 'Fjordgata Apartments',
    category: 'Residential',
    location: 'Tromsø, Norway',
    year: 2022,
    areaSqFt: 21000,
    summary: 'Thirty-two homes in two linked buildings, with brick-and-glass facades that change with the low northern light.',
    brief:
      'A housing cooperative asked for apartments people would stay in for decades: daylight in the dark months, storage that really works, and shared spaces that bring neighbours together.\n\nThe budget was fixed and tight, so every detail had to earn its place.',
    approach:
      'We repeated a small number of well-drawn apartment types and spent the savings on shared spaces: a south-facing roof terrace, a bicycle workshop and a laundry room with a window onto the street.\n\nFacades are brick with deep reveals, so they cast shadow even on overcast days. Balconies are recessed, which keeps them usable through winter and protects them from the wind.',
    scope: ['Competition entry and concept', 'Architecture and coordination', 'Apartment layouts and joinery details', 'Facade design', 'Landscape and courtyard design'],
    coverImage: img(38579646, 'Modern residential building facade with glass balconies'),
    gallery: [
      img(19574410, 'Residential building facade with ornate balconies lit by sunset'),
      img(37293743, 'Modern building facade with glass and concrete in close-up', 1200, 1500),
      img(2440471, 'Modern grey living room with a fireplace and cityscape artwork'),
    ],
    tags: ['housing', 'brick', 'cooperative', 'daylight'],
    featured: false,
    featuredOrder: 0,
    publishedAt: d('2025-06-10'),
  },
  {
    slug: 'birch-room-suites',
    title: 'Birch Room Suites',
    category: 'Hospitality',
    location: 'Reykjavik, Iceland',
    year: 2023,
    areaSqFt: 5600,
    summary: 'Twelve guest suites in a former fish-processing house, finished in pale birch, lime plaster and wool.',
    brief:
      'The owners wanted guests to feel the place they were visiting rather than a hotel anywhere in the world. Each suite needed a proper desk, a deep bath and blackout that did not feel like a cave.\n\nThe building is exposed to wind and salt, so materials had to be hardwearing.',
    approach:
      'We kept the plan simple and let materials do the work. Pale birch panelling lines the walls, lime plaster softens the corners and heavy wool curtains frame each window.\n\nBathrooms are generous: stone basins, wooden shelves and a rain shower. In the corridors, we added small seating alcoves so guests can pause, read or watch the weather roll in.',
    scope: ['Interior architecture', 'Bespoke joinery', 'Lighting design', 'Fixtures and fittings', 'Procurement'],
    coverImage: img(8251914, 'Bright and airy minimalist bedroom with wood accents and white bedding', 1200, 1500),
    gallery: [
      img(2082093, 'Minimalist bedroom with wooden floors, large windows and low furniture'),
      img(29631653, 'Bathroom sink with a round basin on a wooden shelf against dark stone tiles'),
      img(17264519, 'Hotel lobby with marble columns, a high ceiling and warm lighting'),
    ],
    tags: ['hotel', 'birch', 'lime plaster', 'wool'],
    featured: false,
    featuredOrder: 0,
    publishedAt: d('2025-08-01'),
  },
  {
    slug: 'meridian-kitchen-and-study',
    title: 'Meridian Kitchen & Study',
    category: 'Renovation',
    location: 'Toronto, Canada',
    year: 2024,
    areaSqFt: 1900,
    summary: 'A tight terraced house rearranged around a new kitchen, with a quiet study carved out of the old stair hall.',
    brief:
      'A pair of writers wanted a house that worked as well for work as for dinner parties. The ground floor was a string of small rooms with a dark galley kitchen at the back.\n\nThey asked for one big shared room for cooking and eating and a separate study with a door that shuts.',
    approach:
      'We took down two walls and reframed the floor above with a flush steel beam. The new kitchen runs the full width of the rear, with a long wooden table at its heart.\n\nThe study is a small, calm room off the hall: oak bookshelves, linen curtains and a desk that looks onto the garden. Warm-white lighting and a single high window make it feel like a quiet retreat.',
    scope: ['Measured survey', 'Structural coordination', 'Kitchen and study design', 'Joinery details', 'Tender and contract administration'],
    coverImage: img(26571206, 'Modern living space with a grey couch, minimalist decor and an open kitchenette'),
    gallery: [
      img(32791637, 'Stylish modern living room with minimalist decor, neutral tones and green plants'),
      img(6436746, 'Modern living room with a grey sofa and a wooden table by the window'),
      img(27924620, 'Minimalist bathroom with a wall-hung toilet and a wooden accent wall'),
    ],
    tags: ['kitchen', 'study', 'terraced house', 'structural'],
    featured: false,
    featuredOrder: 0,
    publishedAt: d('2025-12-15'),
  },
];

export const services = [
  {
    slug: 'architecture',
    title: 'Architecture',
    order: 0,
    summary: 'New buildings and extensions, from first sketch to handover, designed around light, climate and the way you live.',
    description:
      '<p>We design houses, small apartment buildings and workplaces that are calm to live in and straightforward to build. Our architects stay with the project from the first conversation to the final snag list, so the intent of the design survives contact with the site.</p><p>We are particularly interested in daylight, passive heating and cooling, and materials that look better with age.</p>',
    deliverables: ['Site and feasibility study', 'Concept design and massing models', 'Planning and permit drawings', 'Technical design and specifications', 'Tender documents and contractor selection', 'Construction-phase site visits and reports'],
    steps: [
      { title: 'Discovery call', description: 'A free 30-minute conversation to understand your site, goals and budget, and to decide whether we are a good fit.' },
      { title: 'Feasibility and brief', description: 'We study the site and the rules that apply, then write a clear brief with you, including budget and programme.' },
      { title: 'Concept and design development', description: 'We test two or three options with sketches and models, then develop the chosen scheme in detail.' },
      { title: 'Delivery on site', description: 'We prepare construction information, help you appoint a builder and visit regularly until the project is complete.' },
    ],
    faq: [
      { question: 'How early should we involve an architect?', answer: 'As early as possible, ideally before you buy a site. A few hours of feasibility work can save months and a great deal of money.' },
      { question: 'How are your fees structured?', answer: 'We usually work to a fixed fee for each stage, agreed in writing before work begins. Larger projects may be a percentage of construction cost.' },
      { question: 'Do you handle planning applications?', answer: 'Yes. We prepare and submit drawings, deal with the authority and attend any meetings or hearings on your behalf.' },
      { question: 'Can you work remotely with clients abroad?', answer: 'We have delivered projects in four countries. Video calls, shared drawings and local partners make this straightforward.' },
    ],
    heroImage: img(13041118, 'Sleek modern concrete house with large glass windows set in a green garden'),
  },
  {
    slug: 'interior-design',
    title: 'Interior design',
    order: 1,
    summary: 'Layouts, joinery, lighting and furniture, designed together so a room feels finished rather than decorated.',
    description:
      '<p>We design interiors as architecture, not decoration. That means starting with how each room is used, then shaping light, storage and circulation before we choose a single finish.</p><p>We design much of the joinery ourselves and work with trusted craftspeople, so the details in your home are made for it.</p>',
    deliverables: ['Space planning and furniture layouts', 'Material and colour palettes', 'Bespoke joinery drawings', 'Lighting design and electrical layouts', 'Furniture, rug and art selection', 'Procurement and installation management'],
    steps: [
      { title: 'Discovery call', description: 'We talk through your home, how you use it and what is not working, and agree whether to go ahead.' },
      { title: 'Brief and concept', description: 'We write the brief with you and present a concept: layouts, a palette and reference images.' },
      { title: 'Detailed design', description: 'We draw the joinery, specify finishes and fixtures, and confirm costs with suppliers and makers.' },
      { title: 'Installation and styling', description: 'We manage deliveries and installation, then style the finished rooms with you.' },
    ],
    faq: [
      { question: 'Can you work with furniture we already own?', answer: 'Yes. We often keep the pieces you love and design around them.' },
      { question: 'Do you sell furniture?', answer: 'We do not mark up what we specify. You pay suppliers directly, or we buy on your behalf for a flat handling fee.' },
      { question: 'How long does an interior project take?', answer: 'Design usually takes two to four months. Delivery depends on joinery lead times, typically another three to five months.' },
    ],
    heroImage: img(26732551, 'Modern living room with a low sofa, wooden furniture and a restrained neutral palette'),
  },
  {
    slug: 'renovation',
    title: 'Renovation',
    order: 2,
    summary: 'Careful, well-planned rebuilds of existing homes, including protected buildings, with minimal disruption.',
    description:
      '<p>Old buildings hold more potential than most people expect. We start with a careful survey so we know what is behind each wall before we draw anything, then plan the work in phases that fit your life.</p><p>We have experience with heritage consent and with upgrading thermal and acoustic performance without losing a building’s character.</p>',
    deliverables: ['Measured survey and condition report', 'Heritage and planning consent drawings', 'Structural coordination', 'Phased construction programme', 'Detailed specifications and tender documents', 'Contract administration and snagging'],
    steps: [
      { title: 'Survey and discovery', description: 'We visit, measure and record the building, and talk through what you would like to change.' },
      { title: 'Options and consent', description: 'We test layouts, agree a scheme and prepare consent applications where they are required.' },
      { title: 'Detailed design and tender', description: 'We draw every junction and specify materials, then help you compare builders’ prices fairly.' },
      { title: 'Works on site', description: 'We visit regularly, answer queries and check quality until handover.' },
    ],
    faq: [
      { question: 'Can we live in the house during the works?', answer: 'Sometimes, with careful phasing. We will tell you honestly if moving out is safer and cheaper in the long run.' },
      { question: 'How do you handle hidden problems?', answer: 'Surveys reduce surprises but cannot eliminate them. We recommend a contingency of 10–15% and agree how to deal with unknowns before work starts.' },
      { question: 'Do you work on protected buildings?', answer: 'Yes. We have prepared several heritage consent applications and work with conservation specialists.' },
    ],
    heroImage: img(6447384, 'Compact apartment with a brick partition between the kitchen and bedroom'),
  },
];

export const articles = [
  {
    slug: 'how-a-brief-becomes-a-plan',
    title: 'How a brief becomes a plan: the first six weeks',
    category: 'Process',
    author: 'Ingrid Solberg',
    excerpt: 'What actually happens between “we would like to build something” and the first set of drawings, and why we take our time over it.',
    tags: ['process', 'brief', 'feasibility'],
    coverImage: img(9617366, 'An architect’s desk with blueprints and drafting tools'),
    publishedAt: d('2026-03-10'),
    body: '<p>Clients often expect drawings in the first week. We usually ask them to wait six. That is not reluctance: it is the most valuable time in the project.</p><h2>Weeks one and two: listening and looking</h2><p>We visit the site at different times of day and write down what we notice: where the light falls at four in the afternoon, which neighbour will overlook the garden, where water collects after rain. In the same weeks we talk, at length, about how you live.</p><h2>Weeks three and four: rules and numbers</h2><p>We read the planning rules, check the structure and services, and build a simple cost model. If the wish list and the budget do not match, this is when we tell you, while changing course is still cheap.</p><h2>Weeks five and six: the brief</h2><p>We write it down in plain language, usually four pages. It lists what the building must do, what it must not do and what can wait. Only then do we begin drawing.</p><blockquote>A good brief is a decision-making tool. When we are unsure later, we go back to it.</blockquote><p>Most of the best decisions in a project are made at this stage, with a pencil and a cup of coffee.</p>',
  },
  {
    slug: 'choosing-materials-that-age-well',
    title: 'Choosing materials that age well',
    category: 'Materials',
    author: 'Marcus Hale',
    excerpt: 'Some finishes look best on the day they are installed. Others improve with every year. Here is how we tell the difference.',
    tags: ['materials', 'timber', 'longevity'],
    coverImage: img(7045358, 'A modern bathroom with wooden accents and a minimalist basin'),
    publishedAt: d('2026-02-02'),
    body: '<p>A finish that looks perfect at handover will not necessarily look perfect in ten years. We try to choose materials that wear in rather than wear out.</p><h2>Honest surfaces</h2><p>Solid timber, lime plaster, brick, stone and linoleum all develop a patina: small marks that tell the story of a house. Thin veneers, laminates and glossy paints chip and peel, and the damage is hard to repair.</p><h2>Repair, not replace</h2><p>Oiled oak can be sanded and re-oiled. Lime plaster can be patched with a trowel. We ask of each material: <em>what happens when it is scratched, stained or dented?</em></p><h2>Touch points</h2><p>The materials you touch every day matter most: door handles, stair rails, taps and worktops. Spend there first.</p><ul><li>Choose solid brass or bronze for handles. They darken beautifully.</li><li>Prefer stone or timber for worktops over thin laminate.</li><li>Specify replaceable parts so a worn seal is a five-minute fix.</li></ul><p>Good materials also carry a smaller footprint over their life, since they last longer and need fewer chemicals to maintain.</p>',
  },
  {
    slug: 'renovating-without-erasing',
    title: 'Renovating an old apartment without erasing it',
    category: 'Renovation',
    author: 'Priya Nair',
    excerpt: 'Lessons from Lantern Loft on keeping the character of a protected building while making it comfortable to live in.',
    tags: ['renovation', 'heritage', 'small space'],
    coverImage: img(2440471, 'A modern grey living room with a fireplace and framed artwork'),
    publishedAt: d('2025-10-14'),
    body: '<p>An old building comes with a history. Our job is to decide which parts of that history deserve to stay, and which can quietly go.</p><h2>Start with a survey, not a mood board</h2><p>Before we sketch a single line, we measure everything, open up a few walls and record what we find. Timbers, old flues and bricked-up windows often turn out to be the best features of the finished home.</p><h2>Keep the big gestures, edit the small ones</h2><p>In Lantern Loft, the roof timbers and thick walls stayed. The 1970s partitions and hung ceilings went. The result feels generous because the original structure is visible again.</p><h2>Add comfort invisibly</h2><p>Insulation, heating and ventilation can be upgraded without changing the look of a room. Secondary glazing, insulation behind new linings and quiet mechanical ventilation did most of the work here.</p><p>The goal is a home that feels as though it has always been this way, only warmer and quieter.</p>',
  },
  {
    slug: 'why-we-draw-by-hand-first',
    title: 'Why we draw every elevation by hand first',
    category: 'Studio notes',
    author: 'Ingrid Solberg',
    excerpt: 'Software is brilliant at making things precise. Pencils are better at helping us decide what to make.',
    tags: ['studio', 'drawing', 'design process'],
    coverImage: img(34573691, 'Architectural blueprints and drawing tools on a designer’s desk'),
    publishedAt: d('2025-07-22'),
    body: '<p>Every project at Atelier North begins on tracing paper. It is slow and slightly old-fashioned, and we would not give it up.</p><h2>Speed of thought</h2><p>A pencil moves as fast as an idea. We can draw ten versions of an elevation in an afternoon, and discard nine, without ever opening a file or fiddling with settings.</p><h2>Proportion</h2><p>Hand drawing forces us to feel proportion before we measure it. We find windows that look wrong on paper long before they look wrong in steel.</p><h2>Conversation</h2><p>A sketch invites response. Clients are more willing to say “I do not like that” to a drawing that clearly took thirty seconds than to a polished render.</p><p>When the idea is ready, we move to the computer and draw it properly. By then, the decisions that matter have been made.</p>',
  },
];

export const team = [
  {
    name: 'Ingrid Solberg',
    role: 'Founding architect',
    order: 0,
    bio: 'Ingrid founded Atelier North in 2012 after a decade in practices in Oslo and London. She leads concept design on every project and still draws most first sketches herself.',
    credentials: ['Registered architect', 'MArch, Bergen School of Architecture', 'Passivhaus certified designer'],
  },
  {
    name: 'Marcus Hale',
    role: 'Interior design director',
    order: 1,
    bio: 'Marcus trained as a furniture maker before moving into interior architecture. He designs most of the studio’s joinery and manages relationships with workshops and suppliers.',
    credentials: ['BA Interior Architecture', 'Member, Chartered Society of Designers', 'Fellow, Guild of Makers (demo)'],
  },
  {
    name: 'Priya Nair',
    role: 'Project architect',
    order: 2,
    bio: 'Priya leads our renovation and heritage work. She is happiest on site with a tape measure, and has overseen the conversion of nine protected buildings.',
    credentials: ['Registered architect', 'MSc Building Conservation', 'Accredited conservation specialist (demo)'],
  },
];

export const testimonials = [
  { name: 'Anna & Henrik Voll', role: 'Homeowners, Hallingdal House', projectSlug: 'hallingdal-house', order: 0, quote: 'Ingrid listened for weeks before she drew a thing. The house feels like it has always belonged on that hill, and the children never want to leave it.' },
  { name: 'Katrine Dahl', role: 'General manager, Strand Hotel', projectSlug: 'strand-hotel-lobby', order: 1, quote: 'We kept trading through four short closures and the lobby now earns more from locals than from guests. The team solved problems before we knew we had them.' },
  { name: 'Duarte Lima', role: 'Owner, Lantern Loft', projectSlug: 'lantern-loft', order: 2, quote: 'They found beauty in the parts of the apartment the previous owners had hidden. It is the calmest home I have lived in.' },
  { name: 'Megan Ross', role: 'Operations director, Kestrel Engineering', projectSlug: 'kestrel-works', order: 3, quote: 'People who used to work from home now ask for desks in the office. That says everything about what Atelier North delivered.' },
];

export const settings = {
  key: 'main',
  brand: {
    name: 'Atelier North',
    tagline: 'Architecture and interiors for northern light',
    description: 'A boutique architecture and interior design studio designing calm, durable homes, workplaces and hotels.',
  },
  contact: {
    email: 'hello@atelier-north.example',
    phone: '+47 55 01 00 00',
    address: 'Studio 3, Old Rope Works, Nordnesbakken, 5005 Bergen, Norway',
    city: 'Bergen',
    mapUrl: 'https://www.openstreetmap.org/search?query=Nordnes%2C%20Bergen%2C%20Norway',
    hours: 'Monday–Friday, 9:00–17:00',
  },
  social: {
    instagram: 'https://www.instagram.com/',
    linkedin: 'https://www.linkedin.com/',
    pinterest: 'https://www.pinterest.com/',
  },
  seoDefaults: {
    title: 'Atelier North – architecture and interior design studio',
    description: 'Atelier North designs calm, durable homes, workplaces and hotels. Browse our projects and book a consultation.',
    ogImage: img(5570222, 'Bright modern living room with white walls and large windows', 1200, 630).url + '?auto=compress&cs=tinysrgb&fit=crop&w=1200&h=630',
  },
  notificationEmail: '',
  home: {
    heroTitle: 'Rooms and buildings shaped by light, weather and the people who use them.',
    heroSubtitle: 'Atelier North is a small studio of architects and interior designers. We design homes, workplaces and hotels that feel calm on the first day and better every year after.',
    heroImage: img(5570222, 'Bright modern living room with white walls, large windows and a wooden staircase', 1200, 1500),
    positioning:
      'We take on a few projects at a time so the people you meet in the first conversation are the people who draw, specify and visit site. Our work is quiet, well made and designed to last.',
    stats: [
      { value: '14', label: 'years in practice' },
      { value: '62', label: 'completed projects' },
      { value: '4', label: 'countries' },
    ],
    processTitle: 'How we work with you',
    processSteps: [
      { title: 'Discovery call', description: 'A free conversation about your site, goals and budget.' },
      { title: 'Feasibility and brief', description: 'We study the site and agree a clear written brief.' },
      { title: 'Concept and design', description: 'Options, models and detailed drawings you can react to.' },
      { title: 'Delivery on site', description: 'We stay with the project until the keys are handed over.' },
    ],
    ctaTitle: 'Planning a home, a workplace or a hotel?',
    ctaText: 'Tell us about your project. We reply to every enquiry within two working days.',
  },
  about: {
    title: 'A small studio with a long view',
    story:
      'Atelier North began in 2012 as a two-person practice in a converted rope works in Bergen. We wanted to make buildings that respond to the northern climate: low sun, long winters, sudden rain and the extraordinary light that follows.\n\nToday we are a team of eight architects, interior designers and makers. We still work on a few projects at a time, and every project is led by a partner from the first call to the final snag list.\n\nWe believe good design is quiet. It solves problems you did not know you had, uses honest materials and gets better with age.',
    values: [
      { title: 'Listen first', description: 'The best ideas come from understanding how you live. We spend longer on the brief than most practices.' },
      { title: 'Build to last', description: 'We choose materials that wear in rather than wear out, and details that can be repaired.' },
      { title: 'Be straight with you', description: 'We say early when a wish list and budget do not match, and explain every fee in writing.' },
    ],
    credentials: [
      'Chartered architectural practice (demo)',
      'Passivhaus certified designers',
      'Nordic Interior Award 2024 – hospitality category (fictional)',
      'Member, Norwegian Association of Architects (demo)',
    ],
    image: img(9617366, 'Architect’s desk with blueprints, a ruler and drafting tools'),
    gallery: [
      img(34573691, 'Architectural blueprints and drawing tools on a designer’s desk'),
      img(6614757, 'An architect drafting a plan at a desk'),
      img(33393712, 'Minimalist workspace with a wooden desk and a large window'),
    ],
  },
};
