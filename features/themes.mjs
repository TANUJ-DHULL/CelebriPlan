export function initialize({ showToast } = {}) {
    // Mood buttons
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Season buttons
    document.querySelectorAll('.season-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Generate
    document.getElementById('generate-theme-btn').addEventListener('click', generateThemeConcepts);

    // Initial generation
    generateThemeConcepts();
}

function generateThemeConcepts() {
    const mood = document.querySelector('.mood-btn.active')?.dataset.mood || 'romantic';
    const season = document.querySelector('.season-btn.active')?.dataset.season || 'spring';

    const concepts = getThemeConcepts(mood, season);
    const container = document.getElementById('theme-gen-results');

    container.innerHTML = concepts.map(c => `
        <div class="theme-concept-card">
            <div class="theme-concept-preview" style="background:${c.gradient}">
                <i class="fas ${c.icon}"></i>
            </div>
            <div class="theme-concept-info">
                <div class="theme-concept-name">${c.name}</div>
                <div class="theme-concept-desc">${c.description}</div>
                <div class="theme-palette">
                    ${c.colors.map(color => `<div class="palette-swatch" style="background:${color}"></div>`).join('')}
                </div>
                <div class="theme-elements">
                    ${c.elements.map(el => `<span class="theme-tag">${el}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function getThemeConcepts(mood, season) {
    const conceptsDB = {
        romantic: {
            spring: [
                { name: '🌸 Cherry Blossom Romance', description: 'Soft pink petals, gentle lighting, and romantic arches create a dreamy spring atmosphere.', gradient: 'linear-gradient(135deg, #fce4ec, #f8bbd0)', icon: 'fa-heart', colors: ['#f48fb1', '#ce93d8', '#fff9c4', '#c8e6c9', '#ffffff'], elements: ['Cherry Blossom Arches', 'Floating Candles', 'Pastel Draping', 'Petal Walkway'] },
                { name: '🌿 Garden of Love', description: 'Lush greenery with white florals, string lights, and natural wood elements.', gradient: 'linear-gradient(135deg, #c8e6c9, #a5d6a7)', icon: 'fa-leaf', colors: ['#81c784', '#ffffff', '#e8f5e9', '#ffcc80', '#a5d6a7'], elements: ['Living Walls', 'Wooden Arches', 'White Roses', 'Fairy Light Canopy'] },
            ],
            summer: [
                { name: '🌅 Golden Hour Romance', description: 'Warm golden tones, sunset-inspired décor with cascading fairy lights.', gradient: 'linear-gradient(135deg, #ffe0b2, #ffcc80)', icon: 'fa-sun', colors: ['#ffb74d', '#ff8a65', '#fff3e0', '#d4e157', '#ffffff'], elements: ['Golden Drapes', 'Sunset Backdrop', 'Warm Fairy Lights', 'Marigold Strings'] },
                { name: '🏖️ Beach Romance', description: 'Oceanic blues with seashell accents, flowing fabrics, and candlelit paths.', gradient: 'linear-gradient(135deg, #b3e5fc, #81d4fa)', icon: 'fa-umbrella-beach', colors: ['#4fc3f7', '#ffffff', '#e1f5fe', '#ffcc80', '#80cbc4'], elements: ['Seashell Centerpieces', 'Flowing Fabric', 'Bamboo Torches', 'Sand Path'] },
            ],
            autumn: [
                { name: '🍂 Autumn Enchantment', description: 'Rich burgundy and gold with falling leaves, warm candles, and rustic charm.', gradient: 'linear-gradient(135deg, #d7ccc8, #bcaaa4)', icon: 'fa-leaf', colors: ['#8d6e63', '#d84315', '#ffab40', '#fff8e1', '#795548'], elements: ['Pumpkin Centerpieces', 'Velvet Draping', 'Autumn Leaf Garlands', 'Rustic Lanterns'] },
                { name: '🍷 Vineyard Romance', description: 'Deep wine and plum tones with grape vine décor and vintage charm.', gradient: 'linear-gradient(135deg, #ce93d8, #ab47bc)', icon: 'fa-wine-glass', colors: ['#7b1fa2', '#e1bee7', '#f3e5f5', '#ffcc80', '#4a148c'], elements: ['Grape Vine Arches', 'Wine Barrel Tables', 'Purple Florals', 'Vintage Candelabras'] },
            ],
            winter: [
                { name: '❄️ Winter Wonderland', description: 'Silver and white with crystal accents, snowflake motifs, and warm candlelight.', gradient: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', icon: 'fa-snowflake', colors: ['#90caf9', '#ffffff', '#e8eaf6', '#b0bec5', '#cfd8dc'], elements: ['Crystal Chandeliers', 'Silver Candelabras', 'White Fur Runners', 'Snowflake Motifs'] },
                { name: '🕯️ Cozy Firelight', description: 'Warm amber and burgundy with fireplace glow, velvet textures, and pine accents.', gradient: 'linear-gradient(135deg, #ffccbc, #ff8a65)', icon: 'fa-fire', colors: ['#ff7043', '#d32f2f', '#fff3e0', '#4e342e', '#ffab40'], elements: ['Faux Fireplace', 'Pine Garlands', 'Velvet Table Runners', 'Warm Candle Clusters'] },
            ]
        },
        fun: {
            spring: [
                { name: '🎈 Pop of Color', description: 'Vibrant balloons, confetti stations, and rainbow-inspired décor for maximum fun!', gradient: 'linear-gradient(135deg, #f06292, #ba68c8)', icon: 'fa-face-laugh', colors: ['#e91e63', '#ff9800', '#4caf50', '#2196f3', '#9c27b0'], elements: ['Balloon Arches', 'Confetti Cannons', 'Photo Booth Props', 'Candy Bar'] },
                { name: '🎪 Carnival Fiesta', description: 'Carnival-themed with striped tents, game booths, and cotton candy stations.', gradient: 'linear-gradient(135deg, #ffeb3b, #ff9800)', icon: 'fa-ticket', colors: ['#f44336', '#ffeb3b', '#ffffff', '#2196f3', '#4caf50'], elements: ['Striped Tent', 'Game Stalls', 'Popcorn Machine', 'Giant Lollipops'] },
            ],
            summer: [
                { name: '🌈 Summer Splash', description: 'Neon colors, pool vibes, tropical fruits, and water elements.', gradient: 'linear-gradient(135deg, #00bcd4, #26c6da)', icon: 'fa-water', colors: ['#00bcd4', '#ff4081', '#ffeb3b', '#76ff03', '#ff6e40'], elements: ['Inflatable Decor', 'Neon Signs', 'Tropical Fruits', 'Splash Zones'] },
                { name: '🍕 Food Festival', description: 'Food-themed décor with live cooking stations, food cart displays, and fun signage.', gradient: 'linear-gradient(135deg, #ff5722, #ff9800)', icon: 'fa-utensils', colors: ['#ff5722', '#ffeb3b', '#ffffff', '#8bc34a', '#795548'], elements: ['Food Cart Stations', 'Giant Menu Boards', 'Chef Hat Props', 'Chalkboard Signs'] },
            ],
            autumn: [
                { name: '🎃 Harvest Festival', description: 'Pumpkins, hay bales, and warm autumn colors for a festive fall party.', gradient: 'linear-gradient(135deg, #ff9800, #f57f17)', icon: 'fa-pumpkin', colors: ['#ff9800', '#795548', '#ffeb3b', '#e65100', '#8d6e63'], elements: ['Pumpkin Displays', 'Hay Bale Seating', 'Apple Bobbing', 'Scarecrow Décor'] },
                { name: '🎭 Masquerade Fun', description: 'Masked theme with dramatic lighting, mystery photo booth, and themed props.', gradient: 'linear-gradient(135deg, #212121, #424242)', icon: 'fa-masks-theater', colors: ['#212121', '#ffd700', '#c62828', '#ffffff', '#4a148c'], elements: ['Venetian Masks', 'Dramatic Draping', 'Gold Accents', 'Mystery Photo Booth'] },
            ],
            winter: [
                { name: '🎄 Holiday Bash', description: 'Festive Christmas-inspired party with trees, lights, and gift exchanges.', gradient: 'linear-gradient(135deg, #c62828, #2e7d32)', icon: 'fa-tree', colors: ['#c62828', '#2e7d32', '#ffd700', '#ffffff', '#6d4c41'], elements: ['Christmas Tree', 'Gift Exchange', 'Hot Cocoa Bar', 'Snowman Props'] },
                { name: '🎆 New Year Bash', description: 'Glitter, sparkle, and countdown clock for an epic New Year celebration!', gradient: 'linear-gradient(135deg, #212121, #ffd700)', icon: 'fa-champagne-glasses', colors: ['#000000', '#ffd700', '#c0c0c0', '#ffffff', '#1a237e'], elements: ['Giant Countdown Clock', 'Glitter Balloons', 'Confetti Drop', 'Sparkler Exit'] },
            ]
        },
        elegant: {
            spring: [
                { name: '🦋 Butterfly Garden', description: 'Delicate butterflies, crystal accents, and pastel elegance in a garden setting.', gradient: 'linear-gradient(135deg, #e8eaf6, #c5cae9)', icon: 'fa-gem', colors: ['#7986cb', '#ce93d8', '#ffffff', '#b2dfdb', '#fff9c4'], elements: ['Butterfly Releases', 'Crystal Centerpieces', 'Pastel Florals', 'Silk Draping'] },
                { name: '🕊️ White Elegance', description: 'All-white with varying textures, crystal chandeliers, and soft candlelight.', gradient: 'linear-gradient(135deg, #fafafa, #eeeeee)', icon: 'fa-dove', colors: ['#ffffff', '#f5f5f5', '#e0e0e0', '#c0c0c0', '#eeeeee'], elements: ['White Orchids', 'Crystal Chandeliers', 'Silk Runners', 'Pearl Accents'] },
            ],
            summer: [
                { name: '🌺 Tropical Elegance', description: 'Lush tropical blooms with sophisticated gold accents and ambient lighting.', gradient: 'linear-gradient(135deg, #00695c, #004d40)', icon: 'fa-leaf', colors: ['#00695c', '#ffd700', '#ffffff', '#e65100', '#1b5e20'], elements: ['Tropical Orchids', 'Gold Vases', 'Green Velvet', 'Candle Walkways'] },
                { name: '💎 Crystal Night', description: 'Sparkling crystals, mirrored surfaces, and sophisticated lighting design.', gradient: 'linear-gradient(135deg, #1a237e, #0d47a1)', icon: 'fa-gem', colors: ['#1a237e', '#c0c0c0', '#ffffff', '#64b5f6', '#e8eaf6'], elements: ['Crystal Curtains', 'Mirror Tables', 'Spotlighting', 'Diamond Motifs'] },
            ],
            autumn: [
                { name: '🥂 Black Tie Affair', description: 'Sophisticated black and gold with tall centerpieces and dramatic lighting.', gradient: 'linear-gradient(135deg, #212121, #424242)', icon: 'fa-crown', colors: ['#212121', '#ffd700', '#ffffff', '#757575', '#e0e0e0'], elements: ['Tall Gold Centerpieces', 'Black Linen', 'Spotlights', 'Grand Entrance'] },
                { name: '🍾 Champagne Toast', description: 'Champagne and blush tones with delicate florals and refined elegance.', gradient: 'linear-gradient(135deg, #d7ccc8, #efebe9)', icon: 'fa-champagne-glasses', colors: ['#d7ccc8', '#f48fb1', '#ffd700', '#ffffff', '#bcaaa4'], elements: ['Champagne Tower', 'Blush Roses', 'Gold Cutlery', 'Silk Napkins'] },
            ],
            winter: [
                { name: '🏰 Royal Palace', description: 'Grand royal theme with rich velvets, crown motifs, and palace-worthy décor.', gradient: 'linear-gradient(135deg, #4a148c, #6a1b9a)', icon: 'fa-crown', colors: ['#4a148c', '#ffd700', '#ffffff', '#e1bee7', '#311b92'], elements: ['Royal Thrones', 'Velvet Draping', 'Crown Centerpieces', 'Grand Chandelier'] },
                { name: '✨ Starlight Gala', description: 'Celestial theme with twinkling stars, deep navy, and silver accents.', gradient: 'linear-gradient(135deg, #0d1b2a, #1b2838)', icon: 'fa-star', colors: ['#0d1b2a', '#c0c0c0', '#ffd700', '#90caf9', '#1a237e'], elements: ['Star Ceiling', 'Silver Draping', 'Crescent Arches', 'Galaxy Projections'] },
            ]
        },
        festive: {
            spring: [
                { name: '🪔 Holi Celebration', description: 'Vibrant colors, powder play zones, and Bollywood-style entertainment.', gradient: 'linear-gradient(135deg, #e91e63, #ff9800)', icon: 'fa-palette', colors: ['#e91e63', '#ff9800', '#4caf50', '#2196f3', '#ffeb3b'], elements: ['Color Play Zone', 'Flower Showers', 'Dhol Players', 'Gulal Balloons'] },
                { name: '🌺 Spring Festival', description: 'Flower-filled celebration with garlands, rangoli, and traditional music.', gradient: 'linear-gradient(135deg, #ff6f00, #e65100)', icon: 'fa-drum', colors: ['#ff6f00', '#f44336', '#ffeb3b', '#4caf50', '#ffffff'], elements: ['Marigold Garlands', 'Rangoli Design', 'Traditional Music', 'Dance Stage'] },
            ],
            summer: [
                { name: '🥁 Dhol Night', description: 'High-energy dhol beats, LED dance floor, and energetic Bollywood vibes.', gradient: 'linear-gradient(135deg, #f44336, #d32f2f)', icon: 'fa-drum', colors: ['#f44336', '#ffd700', '#ff9800', '#ffffff', '#4caf50'], elements: ['Dhol Players', 'LED Dance Floor', 'Bollywood Photo Booth', 'Neon Signs'] },
                { name: '🎵 Music Festival', description: 'Concert-style setup with stage, sound, lights, and festival vibes.', gradient: 'linear-gradient(135deg, #6200ea, #304ffe)', icon: 'fa-music', colors: ['#6200ea', '#00e5ff', '#ff1744', '#ffea00', '#ffffff'], elements: ['Concert Stage', 'Light Show', 'VIP Lounge', 'Food Trucks'] },
            ],
            autumn: [
                { name: '🪔 Diwali Spectacular', description: 'Grand Diwali celebration with diyas, lanterns, rangoli, and fireworks.', gradient: 'linear-gradient(135deg, #ff6f00, #bf360c)', icon: 'fa-fire', colors: ['#ff6f00', '#ffd700', '#d32f2f', '#ffffff', '#4e342e'], elements: ['1000 Diyas', 'Lantern Walkways', 'Grand Rangoli', 'Firecracker Display'] },
                { name: '🎊 Navratri Garba', description: 'Traditional garba night with dandiya, chaniya choli, and vibrant décor.', gradient: 'linear-gradient(135deg, #e91e63, #c2185b)', icon: 'fa-music', colors: ['#e91e63', '#4caf50', '#ffeb3b', '#ff9800', '#ffffff'], elements: ['Garba Ground', 'Dandiya Sticks', 'Traditional Décor', 'Spinning Lights'] },
            ],
            winter: [
                { name: '🎊 Grand Celebration', description: 'Majestic winter celebration with warm lights, traditional décor, and feast.', gradient: 'linear-gradient(135deg, #b71c1c, #880e4f)', icon: 'fa-champagne-glasses', colors: ['#b71c1c', '#ffd700', '#ffffff', '#4a148c', '#00695c'], elements: ['Grand Entrance Gate', 'Traditional Torans', 'Brass Décor', 'Live Music Stage'] },
                { name: '🎇 Lohri Celebration', description: 'Bonfire, folk music, and traditional Punjabi celebration vibes.', gradient: 'linear-gradient(135deg, #ff5722, #e64a19)', icon: 'fa-fire', colors: ['#ff5722', '#ffeb3b', '#795548', '#ffffff', '#ff9800'], elements: ['Bonfire Setup', 'Folk Music', 'Dhol', 'Traditional Food Stalls'] },
            ]
        },
        zen: {
            spring: [
                { name: '🧘 Zen Garden', description: 'Minimalist Japanese-inspired with bamboo, stones, and water features.', gradient: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', icon: 'fa-spa', colors: ['#81c784', '#a1887f', '#ffffff', '#90a4ae', '#e8f5e9'], elements: ['Bamboo Screens', 'Stone Garden', 'Water Fountain', 'Bonsai Trees'] },
                { name: '🌸 Sakura Serenity', description: 'Japanese cherry blossom inspired with soft pink, white, and natural elements.', gradient: 'linear-gradient(135deg, #fce4ec, #f8bbd0)', icon: 'fa-spa', colors: ['#f48fb1', '#ffffff', '#e8f5e9', '#bcaaa4', '#fce4ec'], elements: ['Sakura Branches', 'Paper Lanterns', 'Tatami Seating', 'Zen Stones'] },
            ],
            summer: [
                { name: '🌿 Forest Retreat', description: 'Deep greens, natural wood, and ambient sounds for a peaceful escape.', gradient: 'linear-gradient(135deg, #1b5e20, #2e7d32)', icon: 'fa-tree', colors: ['#1b5e20', '#4caf50', '#795548', '#ffffff', '#a5d6a7'], elements: ['Natural Greenery', 'Wood Elements', 'Ambient Sounds', 'Candle Paths'] },
                { name: '💧 Water Elements', description: 'Flowing water features, lotus ponds, and reflective surfaces.', gradient: 'linear-gradient(135deg, #0277bd, #01579b)', icon: 'fa-water', colors: ['#0277bd', '#ffffff', '#e1f5fe', '#81d4fa', '#b3e5fc'], elements: ['Water Curtain', 'Lotus Arrangements', 'Mirror Pool', 'Floating Candles'] },
            ],
            autumn: [
                { name: '🍵 Tea Ceremony', description: 'Warm earth tones, ceramic accents, and intimate gathering setup.', gradient: 'linear-gradient(135deg, #5d4037, #4e342e)', icon: 'fa-mug-hot', colors: ['#5d4037', '#d7ccc8', '#ffffff', '#a1887f', '#efebe9'], elements: ['Tea Station', 'Ceramic Décor', 'Earth Tone Linens', 'Meditation Corner'] },
                { name: '🌾 Harvest Calm', description: 'Natural grains, dried flowers, and warm ambient earth-tone celebration.', gradient: 'linear-gradient(135deg, #bf360c, #e65100)', icon: 'fa-wheat-awn', colors: ['#bf360c', '#d7ccc8', '#ffcc80', '#ffffff', '#8d6e63'], elements: ['Wheat Bundles', 'Dried Flower Arches', 'Linen Draping', 'Warm Candle Clusters'] },
            ],
            winter: [
                { name: '🕯️ Candlelit Peace', description: 'Hundreds of candles, warm blankets, and peaceful winter ambiance.', gradient: 'linear-gradient(135deg, #3e2723, #4e342e)', icon: 'fa-fire', colors: ['#3e2723', '#ffab40', '#ffffff', '#d7ccc8', '#5d4037'], elements: ['Candle Clusters', 'Warm Blankets', 'Soft Music', 'Aromatherapy'] },
                { name: '🏔️ Mountain Lodge', description: 'Cozy mountain lodge feeling with wood, stone, and warm lighting.', gradient: 'linear-gradient(135deg, #455a64, #37474f)', icon: 'fa-mountain', colors: ['#455a64', '#8d6e63', '#ffffff', '#ffab40', '#37474f'], elements: ['Log Furniture', 'Stone Accents', 'Plaid Textiles', 'Warm String Lights'] },
            ]
        }
    };

    const moodConcepts = conceptsDB[mood] || conceptsDB.romantic;
    return moodConcepts[season] || moodConcepts.spring;
}
