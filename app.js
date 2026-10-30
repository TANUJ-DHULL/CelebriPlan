/* ═══════════════════════════════════════════════════════════════
   CelebriPlan — Application Logic
   AI-Powered Celebration & Event Planning Platform
   ═══════════════════════════════════════════════════════════════ */

// ─── State Management ───
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

const AppState = {
    guests: [],
    expenses: [],
    tasks: [],
    currentVendorFilter: 'all',
    selectedVendorsForCompare: [],
    chatHistory: [],
    currentPlan: null,
    dashboardPlan: null,
    eventDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
};

// ─── Initialization ───
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initPageRouter();
    initHeroParticles();
    initCounters();
    initAIPlannerForm();
    initBudgetCalculator();
    initVendorMarketplace();
    initVendorComparison();
    initVendorModals();
    initInvitations();
    initInteractiveRSVP();
    initGuestManagement();
    initExpenseTracker();
    initDashboard();
    initGoogleCalendarIntegration();
    initVendorDashboard();
    initThemeGenerator();
    initChatbot();
    initThemeToggle();
    initSmoothScroll();
    initFooterLinks();
    initAccessibility();
    initScrollAnimations();
    // Run initial budget calculation
    calculateBudget();
});

// ═══════════════════════════════════════════
// MULTI-PAGE ROUTER & NAVIGATION
// ═══════════════════════════════════════════
function navigateToPage(pageName) {
    if (!pageName || pageName === '#' || pageName === '') pageName = 'home';
    pageName = pageName.replace(/^#\/?/, '').replace(/\/$/, '');

    const validPages = [
        'home', 'ai-planner', 'budget-calculator', 'vendor-marketplace',
        'invitations', 'venue-3d', 'guest-management', 'expense-tracker',
        'dashboard', 'vendor-dashboard', 'theme-generator'
    ];

    if (!validPages.includes(pageName)) {
        pageName = 'home';
    }

    // 1. Toggle visibility of app pages
    document.querySelectorAll('.app-page').forEach(page => {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // 2. Update active status on navbar items
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });

    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        if (link.dataset.page === pageName) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
    if (window.stopVenueAnimation) window.stopVenueAnimation();
    if (pageName === 'venue-3d') {
        if (!window.redrawVenue3D) init3DVenuePreview();
        if (window.startVenueAnimation) window.startVenueAnimation();
    }
    const heading = targetPage?.querySelector('h1, h2');
    if (heading) { heading.tabIndex = -1; heading.focus({preventScroll:true}); }

    // 3. Update browser history/URL hash cleanly
    const targetHash = pageName === 'home' ? '' : `#/${pageName}`;
    if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash || window.location.pathname);
    }

    // 4. Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 5. Special canvas re-renders when page becomes visible
    if (pageName === 'budget-calculator') {
        setTimeout(calculateBudget, 50);
    } else if (pageName === 'venue-3d') {
        setTimeout(() => {
            if (typeof window.redrawVenue3D === 'function') {
                window.redrawVenue3D();
            }
        }, 50);
    } else if (pageName === 'invitations') {
        setTimeout(generateQRCode, 50);
    }
}

function initPageRouter() {
    // Read initial URL hash
    const initialHash = window.location.hash;
    if (initialHash && initialHash !== '#') {
        navigateToPage(initialHash);
    } else {
        navigateToPage('home');
    }

    // Listen to browser Back / Forward buttons
    window.addEventListener('hashchange', () => {
        navigateToPage(window.location.hash);
    });

    const validPages = [
        'home', 'ai-planner', 'budget-calculator', 'vendor-marketplace',
        'invitations', 'venue-3d', 'guest-management', 'expense-tracker',
        'dashboard', 'vendor-dashboard', 'theme-generator'
    ];

    // Universal click delegate for all page navigations (buttons, data-page, footer & hero anchors)
    document.addEventListener('click', (e) => {
        // 1. Element with data-page attribute
        const targetBtn = e.target.closest('[data-page]');
        if (targetBtn && !targetBtn.classList.contains('nav-link')) {
            const page = targetBtn.dataset.page;
            if (page) {
                e.preventDefault();
                navigateToPage(page);
                return;
            }
        }

        // 2. Logo click
        const logo = e.target.closest('.nav-logo, #nav-logo');
        if (logo) {
            e.preventDefault();
            navigateToPage('home');
            return;
        }

        // 3. Anchor links (e.g. footer links, hero CTAs, navbar hrefs)
        const anchor = e.target.closest('a[href]');
        if (anchor) {
            const href = anchor.getAttribute('href');
            if (href) {
                const cleanHref = href.replace(/^#\/?/, '').replace(/\/$/, '');
                if (validPages.includes(cleanHref)) {
                    e.preventDefault();
                    navigateToPage(cleanHref);
                    return;
                }
            }
        }
    });
}

function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('nav-hamburger');
    const navLinks = document.getElementById('nav-links');

    // Scroll shadow effect
    window.addEventListener('scroll', () => {
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 30);
    });

    // Hamburger toggle for mobile
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', String(navLinks.classList.contains('active')));
        });

        // Close nav on link click
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                const page = link.dataset.page;
                if (page) {
                    navigateToPage(page);
                }
            });
        });
    }

    const navLogo = document.getElementById('nav-logo');
    if (navLogo) {
        navLogo.addEventListener('click', () => navigateToPage('home'));
    }

    const navGetStarted = document.getElementById('nav-get-started');
    if (navGetStarted) {
        navGetStarted.addEventListener('click', () => navigateToPage('ai-planner'));
    }
}

// ═══════════════════════════════════════════
// HERO PARTICLES
// ═══════════════════════════════════════════
function initHeroParticles() {
    const container = document.getElementById('hero-particles');
    if (!container || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const colors = ['#7c3aed', '#db2777', '#f59e0b', '#3b82f6', '#10b981'];

    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 6 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${Math.random() * 100}%;
            background: ${color};
            animation-duration: ${Math.random() * 15 + 10}s;
            animation-delay: ${Math.random() * 10}s;
            opacity: ${Math.random() * 0.5 + 0.1};
        `;
        container.appendChild(particle);
    }
}

// ═══════════════════════════════════════════
// ANIMATED COUNTERS
// ═══════════════════════════════════════════
function initCounters() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counters = entry.target.querySelectorAll('[data-count]');
                counters.forEach(counter => animateCounter(counter));
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) observer.observe(statsSection);
}

function animateCounter(el) {
    const target = parseInt(el.dataset.count);
    const duration = 2000;
    const start = performance.now();

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

// ═══════════════════════════════════════════
// AI EVENT PLANNER ENGINE
// ═══════════════════════════════════════════
const AIPlanner = {
    eventConfigs: {
        'birthday': {
            budgetSplit: { venue: 0.25, food: 0.35, decoration: 0.15, photography: 0.10, entertainment: 0.10, other: 0.05 },
            themes: { modern: '✨ Modern Elegance', traditional: '🪔 Classic Celebration', rustic: '🌿 Garden Party', glamorous: '💎 Glam Night', minimalist: '🤍 Chic Minimal', bohemian: '🌸 Boho Vibes', tropical: '🌴 Tropical Fiesta', vintage: '📸 Retro Birthday' },
            foodPerPerson: { veg: 350, nonveg: 500, both: 450, jain: 400 },
            activities: ['Guest Arrival & Welcome', 'Opening Music & Dance', 'Birthday Games & Activities', 'Cake Cutting Ceremony', 'Dance Party & DJ Night', 'Dinner / Buffet Service', 'Photo Booth & Memories', 'Gift Opening', 'Thank You & Farewell']
        },
        'wedding': {
            budgetSplit: { venue: 0.30, food: 0.30, decoration: 0.15, photography: 0.12, entertainment: 0.08, other: 0.05 },
            themes: { modern: '✨ Contemporary Royal', traditional: '🪔 Grand Indian Wedding', rustic: '🌿 Nature\'s Blessing', glamorous: '💎 Red Carpet Affair', minimalist: '🤍 Intimate & Elegant', bohemian: '🌸 Dreamy Garden', tropical: '🌴 Beach Wedding', vintage: '📸 Classic Romance' },
            foodPerPerson: { veg: 600, nonveg: 800, both: 700, jain: 650 },
            activities: ['Baraat & Welcome Ceremony', 'Jaimala / Garland Exchange', 'Pheras & Wedding Rituals', 'Kanyadaan Ceremony', 'Wedding Games & Fun', 'Grand Reception Dinner', 'Couple\'s First Dance', 'DJ & Dance Night', 'Vidaai Ceremony']
        },
        'engagement': {
            budgetSplit: { venue: 0.25, food: 0.30, decoration: 0.15, photography: 0.15, entertainment: 0.10, other: 0.05 },
            themes: { modern: '✨ Modern Love', traditional: '🪔 Royal Engagement', rustic: '🌿 Garden Romance', glamorous: '💎 Starry Night', minimalist: '🤍 Pure Love', bohemian: '🌸 Free Spirit', tropical: '🌴 Island Romance', vintage: '📸 Timeless Love' },
            foodPerPerson: { veg: 400, nonveg: 550, both: 500, jain: 450 },
            activities: ['Guest Welcome & Seating', 'Ring Exchange Ceremony', 'Family Blessings', 'Couple Photo Shoot', 'Engagement Games', 'Toast & Speeches', 'Dinner Celebration', 'Dance & Music Night']
        },
        'anniversary': {
            budgetSplit: { venue: 0.25, food: 0.30, decoration: 0.15, photography: 0.12, entertainment: 0.13, other: 0.05 },
            themes: { modern: '✨ Milestone Celebration', traditional: '🪔 Golden Memories', rustic: '🌿 Love Garden', glamorous: '💎 Silver & Gold', minimalist: '🤍 Timeless Bond', bohemian: '🌸 Love Story', tropical: '🌴 Paradise Party', vintage: '📸 Nostalgic Night' },
            foodPerPerson: { veg: 400, nonveg: 550, both: 500, jain: 450 },
            activities: ['Guest Welcome', 'Memory Lane Slideshow', 'Cake Cutting', 'Toast & Speeches', 'Couple Dance', 'Family Photo Session', 'Dinner Service', 'Music & Dance']
        },
        'college-fest': {
            budgetSplit: { venue: 0.20, food: 0.25, decoration: 0.15, photography: 0.08, entertainment: 0.25, other: 0.07 },
            themes: { modern: '✨ Tech Fest', traditional: '🪔 Cultural Fest', rustic: '🌿 Eco Fest', glamorous: '💎 Star Night', minimalist: '🤍 Minimal Fest', bohemian: '🌸 Art Festival', tropical: '🌴 Beach Bash', vintage: '📸 Retro Fest' },
            foodPerPerson: { veg: 150, nonveg: 250, both: 200, jain: 180 },
            activities: ['Registration & Inauguration', 'Cultural Performances', 'Technical Events', 'Sports Competitions', 'Band Performance / DJ', 'Food Stall Area', 'Prize Distribution', 'Closing Ceremony']
        },
        'corporate': {
            budgetSplit: { venue: 0.30, food: 0.25, decoration: 0.10, photography: 0.10, entertainment: 0.15, other: 0.10 },
            themes: { modern: '✨ Innovation Summit', traditional: '🪔 Business Excellence', rustic: '🌿 Team Retreat', glamorous: '💎 Gala Night', minimalist: '🤍 Executive Meeting', bohemian: '🌸 Creative Workshop', tropical: '🌴 Team Outing', vintage: '📸 Heritage Meet' },
            foodPerPerson: { veg: 500, nonveg: 700, both: 600, jain: 550 },
            activities: ['Registration & Networking', 'Opening Keynote', 'Panel Discussions', 'Breakout Sessions', 'Lunch & Networking', 'Award Ceremony', 'Team Building Activity', 'Cocktail & Dinner']
        },
        'baby-shower': {
            budgetSplit: { venue: 0.20, food: 0.30, decoration: 0.20, photography: 0.15, entertainment: 0.10, other: 0.05 },
            themes: { modern: '✨ Modern Baby', traditional: '🪔 Godh Bharai', rustic: '🌿 Nature\'s Gift', glamorous: '💎 Little Prince/Princess', minimalist: '🤍 Simple Elegance', bohemian: '🌸 Boho Baby', tropical: '🌴 Tropical Baby', vintage: '📸 Classic Baby' },
            foodPerPerson: { veg: 350, nonveg: 500, both: 400, jain: 380 },
            activities: ['Guest Welcome', 'Traditional Rituals', 'Baby Shower Games', 'Gift Guessing Game', 'Gender Reveal (if applicable)', 'Photo Booth Time', 'Cake Cutting', 'Dinner & Farewell']
        },
        'farewell': {
            budgetSplit: { venue: 0.25, food: 0.30, decoration: 0.15, photography: 0.10, entertainment: 0.15, other: 0.05 },
            themes: { modern: '✨ New Beginnings', traditional: '🪔 Classic Farewell', rustic: '🌿 Memory Lane', glamorous: '💎 Red Carpet Send-off', minimalist: '🤍 Simple & Sweet', bohemian: '🌸 Free Spirit', tropical: '🌴 Aloha Party', vintage: '📸 Nostalgia Night' },
            foodPerPerson: { veg: 300, nonveg: 450, both: 400, jain: 350 },
            activities: ['Welcome & Seating', 'Slideshow of Memories', 'Farewell Speeches', 'Awards & Titles', 'Dance Performances', 'Group Activities', 'Dinner Service', 'Gift Exchange & Goodbyes']
        },
        'housewarming': {
            budgetSplit: { venue: 0.10, food: 0.35, decoration: 0.25, photography: 0.10, entertainment: 0.10, other: 0.10 },
            themes: { modern: '✨ Modern Home', traditional: '🪔 Griha Pravesh', rustic: '🌿 Country Home', glamorous: '💎 Grand Opening', minimalist: '🤍 Simple Welcome', bohemian: '🌸 Boho Home', tropical: '🌴 Tropical Home', vintage: '📸 Heritage Home' },
            foodPerPerson: { veg: 300, nonveg: 450, both: 400, jain: 350 },
            activities: ['Pooja & Rituals', 'House Tour', 'Welcome Drinks', 'Fun Games', 'Lunch / Dinner', 'Photo Session', 'Music & Chat', 'Return Gifts']
        },
        'festival': {
            budgetSplit: { venue: 0.20, food: 0.30, decoration: 0.20, photography: 0.10, entertainment: 0.15, other: 0.05 },
            themes: { modern: '✨ Contemporary Festival', traditional: '🪔 Grand Celebration', rustic: '🌿 Folk Festival', glamorous: '💎 Festival Gala', minimalist: '🤍 Peaceful Gathering', bohemian: '🌸 Artistic Festival', tropical: '🌴 Festival in Paradise', vintage: '📸 Classic Festival' },
            foodPerPerson: { veg: 300, nonveg: 450, both: 400, jain: 350 },
            activities: ['Welcome & Decorations', 'Pooja / Rituals', 'Cultural Performances', 'Traditional Games', 'Feast Preparation', 'Community Dinner', 'Fireworks / Celebrations', 'Group Photos & Farewell']
        }
    },

    generatePlan(input) {
        const { type, city, guests, budget, duration, theme, food, notes } = input;
        const config = this.eventConfigs[type] || this.eventConfigs['birthday'];

        const budgetAllocation = CelebrationPlanning.allocateBudget(budget, config.budgetSplit);

        // Per person food cost
        const foodCostPerPerson = config.foodPerPerson[food] || config.foodPerPerson['both'];
        const estimatedFoodCost = foodCostPerPerson * guests;
        const budgetTier = budget / guests;

        // Determine budget category
        let budgetCategory;
        if (budgetTier < 500) budgetCategory = 'Budget-Friendly';
        else if (budgetTier < 1500) budgetCategory = 'Standard';
        else if (budgetTier < 3000) budgetCategory = 'Premium';
        else budgetCategory = 'Luxury';

        // Generate timeline
        const startHour = 18; // 6 PM default
        const timeline = [];
        const activityDuration = duration / config.activities.length;
        config.activities.forEach((activity, i) => {
            const hours = startHour + (i * activityDuration);
            const h = Math.floor(hours);
            const m = Math.round((hours - h) * 60);
            timeline.push({
                start: `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
                activity
            });
        });

        // Generate tasks
        const baseTasks = [
            { task: `Book ${budgetCategory.toLowerCase()} venue in ${city}`, priority: 'high', deadline: '2 weeks before' },
            { task: `Finalize ${food === 'veg' ? 'vegetarian' : food === 'nonveg' ? 'non-veg' : 'multi-cuisine'} menu for ${guests} guests`, priority: 'high', deadline: '10 days before' },
            { task: `Send invitations to all ${guests} guests`, priority: 'high', deadline: '1 week before' },
            { task: `Confirm ${theme} theme decorations`, priority: 'medium', deadline: '5 days before' },
            { task: 'Book photographer & videographer', priority: 'medium', deadline: '1 week before' },
            { task: 'Arrange sound system & DJ', priority: 'medium', deadline: '5 days before' },
            { task: 'Confirm transportation logistics', priority: 'low', deadline: '3 days before' },
            { task: 'Prepare return gifts / party favors', priority: 'low', deadline: '2 days before' },
            { task: 'Final walkthrough of venue', priority: 'high', deadline: '1 day before' },
            { task: 'Emergency supplies checklist', priority: 'low', deadline: '1 day before' }
        ];

        // Decoration suggestions based on theme
        const decorSuggestions = this.getDecorationSuggestions(theme, type);

        // Smart recommendations
        const recommendations = this.getSmartRecommendations(budget, guests, type, city, budgetTier);

        return {
            title: `${config.themes[theme] || '✨ Custom'} - ${this.capitalize(type.replace('-', ' '))}`,
            category: budgetCategory,
            budget: budgetAllocation,
            totalBudget: budget,
            perPersonBudget: Math.round(budget / guests),
            estimatedFoodCost,
            foodPerPerson: foodCostPerPerson,
            tasks: baseTasks,
            timeline,
            decorSuggestions,
            recommendations,
            guests,
            city,
            theme: config.themes[theme],
            duration
        };
    },

    getDecorationSuggestions(theme, eventType) {
        const suggestions = {
            modern: ['LED strip lighting', 'Geometric backdrops', 'Acrylic signage', 'Metallic balloons', 'Neon name signs', 'Glass centerpieces'],
            traditional: ['Marigold garlands', 'Diyas & candles', 'Rangoli designs', 'Brass urlis', 'Banana leaf decor', 'Traditional torans'],
            rustic: ['Jute & burlap accents', 'Mason jar lights', 'Wooden crates', 'Wildflower arrangements', 'Fairy lights', 'Hanging lanterns'],
            glamorous: ['Crystal chandeliers', 'Sequin backdrops', 'Gold centerpieces', 'Red carpet entry', 'Mirror tables', 'Floral ceiling'],
            minimalist: ['White draping', 'Single stem flowers', 'Candle arrangements', 'Clean line signage', 'Greenery walls', 'Simple fairy lights'],
            bohemian: ['Dreamcatchers', 'Macrame hangings', 'Pampas grass', 'Colored cushions', 'Teepee corners', 'Mandala art'],
            tropical: ['Palm leaf decor', 'Tropical flowers', 'Pineapple centerpieces', 'Bamboo structures', 'Tiki torches', 'Coconut shells'],
            vintage: ['Lace tablecloths', 'Antique frames', 'Old book displays', 'Typewriter decor', 'Vintage cameras', 'Retro string lights']
        };
        return suggestions[theme] || suggestions.modern;
    },

    getSmartRecommendations(budget, guests, type, city, budgetTier) {
        const recs = [];

        if (budgetTier < 300) {
            recs.push('💡 Consider a potluck arrangement to save on food costs');
            recs.push('📍 Look for community halls or terrace venues for affordable options');
            recs.push('📸 Ask a friend with photography skills instead of hiring professional');
        } else if (budgetTier < 800) {
            recs.push('🎯 Book venues during weekdays for 20-30% discount');
            recs.push('🍽️ Opt for buffet style instead of plated service to save costs');
            recs.push('🎨 DIY decorations can save up to ₹5,000-10,000');
        } else if (budgetTier < 2000) {
            recs.push('⭐ You can afford professional photography and videography');
            recs.push('🎵 Consider a live band for the entertainment segment');
            recs.push('🌸 Premium flower arrangements will fit well in your budget');
        } else {
            recs.push('👑 Consider a destination venue for a truly memorable experience');
            recs.push('🎪 Add a themed photo booth with props and instant prints');
            recs.push('🍰 Commission a custom designer cake from a premium bakery');
            recs.push('🎆 Include fireworks or drone light show for a spectacular finale');
        }

        if (guests > 200) {
            recs.push('🚗 Arrange shuttle service or valet parking for large gatherings');
        }

        if (type === 'wedding') {
            recs.push('💐 Book mehendi and sangeet artists separately for pre-wedding events');
        }

        return recs;
    },

    capitalize(str) {
        return str.replace(/\b\w/g, l => l.toUpperCase());
    },

    buildDashboardPlan(input) {
        const type = (input.type || 'birthday').toLowerCase();
        const city = input.city || 'Jind';
        const guests = parseInt(input.guests, 10) || 50;
        const theme = (input.theme || 'modern').toLowerCase();
        const durationHours = parseInt(input.durationHours, 10) || 4;

        let budgetPaise = input.budgetPaise;
        let budgetInRupees = 50000;
        if (budgetPaise !== undefined && budgetPaise !== null) {
            budgetInRupees = Math.round(Number(budgetPaise) / 100);
        } else if (input.budget !== undefined && input.budget !== null) {
            budgetInRupees = Math.round(Number(input.budget));
            budgetPaise = budgetInRupees * 100;
        }

        const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
        let title = `${capitalize(theme)} ${capitalize(type)} Celebration`;
        if (type === 'college-fest' || type === 'fest') title = `${capitalize(theme)} College Fest`;
        if (type === 'corporate') title = `${capitalize(theme)} Corporate Event`;
        if (type === 'wedding') title = `${capitalize(theme)} Royal Wedding`;

        let ratios;
        if (type === 'birthday') {
            ratios = { venue: 0.30, food: 0.35, decoration: 0.15, photography: 0.10, other: 0.10 };
        } else if (type === 'wedding') {
            ratios = { venue: 0.30, food: 0.30, decoration: 0.15, photography: 0.15, other: 0.10 };
        } else if (type === 'college-fest') {
            ratios = { venue: 0.20, food: 0.25, decoration: 0.15, photography: 0.10, other: 0.30 };
        } else {
            ratios = { venue: 0.28, food: 0.32, decoration: 0.16, photography: 0.12, other: 0.12 };
        }

        const budget = CelebrationPlanning.allocateBudget(budgetInRupees, ratios);

        let tasks;
        if (type === 'birthday') {
            tasks = [
                "Confirm venue",
                "Finalize food menu",
                "Send invitations",
                "Confirm photographer"
            ];
        } else if (type === 'wedding') {
            tasks = [
                "Confirm wedding venue and mandap",
                "Finalize food menu and tasting",
                "Send invitations with QR passes",
                "Confirm photographer & cinematography"
            ];
        } else if (type === 'college-fest') {
            tasks = [
                "Confirm auditorium and stage setup",
                "Finalize food stalls and catering",
                "Send invitations and entry passes",
                "Confirm DJ, sound setup & photographer"
            ];
        } else {
            tasks = [
                "Confirm banquet venue",
                "Finalize food menu and tea service",
                "Send corporate invitations",
                "Confirm event photographer and keynote"
            ];
        }

        const timeline = [];
        if (type === 'birthday') {
            timeline.push({ start: "18:00", activity: "Guest arrival" });
            timeline.push({ start: "19:00", activity: "Cake ceremony" });
            if (durationHours >= 3) {
                timeline.push({ start: "19:45", activity: "Games, music & dance" });
            }
            if (durationHours >= 4) {
                timeline.push({ start: "20:45", activity: "Dinner buffet & return gifts" });
            }
        } else if (type === 'wedding') {
            timeline.push({ start: "18:00", activity: "Guest arrival & welcome" });
            timeline.push({ start: "19:30", activity: "Jaimala garland ceremony" });
            timeline.push({ start: "20:30", activity: "Grand banquet dinner" });
            timeline.push({ start: "22:00", activity: "Pheras and sacred rituals" });
        } else {
            timeline.push({ start: "10:00", activity: "Guest arrival & registration" });
            timeline.push({ start: "11:30", activity: "Keynote presentation" });
            timeline.push({ start: "13:30", activity: "Networking luncheon" });
            timeline.push({ start: "15:30", activity: "Awards ceremony & closure" });
        }

        return {
            title,
            budget,
            tasks,
            timeline
        };
    }
};

function initAIPlannerForm() {
    const form = document.getElementById('ai-planner-form');
    const resultSection = document.getElementById('planner-result-section');
    const resultContainer = document.getElementById('plan-result');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const input = {
            type: document.getElementById('event-type').value,
            city: document.getElementById('event-city').value,
            guests: parseInt(document.getElementById('event-guests').value),
            budget: parseInt(document.getElementById('event-budget').value),
            duration: parseInt(document.getElementById('event-duration').value),
            theme: document.querySelector('input[name="theme"]:checked').value,
            food: document.querySelector('input[name="food"]:checked').value,
            notes: document.getElementById('event-notes').value
        };

        if (!input.type || !input.city.trim() || input.city.length > 120 || !Number.isSafeInteger(input.guests) || input.guests < 1 || input.guests > 10000 || !Number.isSafeInteger(input.budget) || input.budget < 1 || input.budget > 100000000 || !Number.isSafeInteger(input.duration) || input.duration < 1 || input.duration > 24) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        // Show loading
        resultSection.style.display = 'block';
        resultContainer.innerHTML = `
            <div class="plan-loading">
                <div class="loading-spinner"></div>
                <p>AI is generating your perfect event plan...</p>
            </div>
        `;

        // Scroll to result
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Deterministic planning completes immediately; no artificial wait.

        const plan = AIPlanner.generatePlan(input);
        plan.rawType = input.type;
        plan.rawTheme = input.theme;
        renderPlanResult(plan, resultContainer);
        showToast('AI Plan generated successfully! 🎉', 'success');
    });
}

function renderPlanResult(plan, container) {
    AppState.currentPlan = plan;
    const budgetItems = Object.entries(plan.budget);
    const maxBudget = Math.max(...budgetItems.map(([, v]) => v));

    const categoryIcons = {
        venue: '🏛️', food: '🍽️', decoration: '🎨',
        photography: '📸', entertainment: '🎵', other: '📦'
    };

    const categoryColors = {
        venue: '#7c3aed', food: '#db2777', decoration: '#f59e0b',
        photography: '#3b82f6', entertainment: '#10b981', other: '#6366f1'
    };

    // Prepare the plan used by dashboard tasks and expenses
    const dashboardPlan = AIPlanner.buildDashboardPlan({
        type: plan.rawType || 'birthday',
        city: plan.city || 'Jind',
        guests: plan.guests || 50,
        budget: plan.totalBudget || 50000,
        theme: plan.rawTheme || 'modern',
        durationHours: plan.duration || 4
    });
    AppState.dashboardPlan = dashboardPlan;
    container.innerHTML = `
        <div class="plan-result-header">
            <div class="plan-icon"><i class="fas fa-wand-magic-sparkles"></i></div>
            <div>
                <h2>${escapeHTML(plan.title)}</h2>
                <p>${plan.category} • ${plan.guests} guests • ${escapeHTML(plan.city)} • ${plan.duration}h</p>
            </div>
        </div>

        <div class="plan-section">
            <h3><i class="fas fa-chart-pie"></i> Budget Allocation (Total: ₹${plan.totalBudget.toLocaleString()})</h3>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem;">Per person budget: ₹${plan.perPersonBudget.toLocaleString()} • Estimated food cost: ₹${plan.estimatedFoodCost.toLocaleString()} (₹${plan.foodPerPerson}/person)</p>
            <div class="budget-bars">
                ${budgetItems.map(([key, value]) => `
                    <div class="budget-bar-item">
                        <span class="budget-bar-label">${categoryIcons[key] || '📦'} ${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                        <div class="budget-bar-track">
                            <div class="budget-bar-fill" style="width:${(value / maxBudget) * 100}%;background:${categoryColors[key] || '#7c3aed'}"></div>
                        </div>
                        <span class="budget-bar-value">₹${value.toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="plan-section">
            <h3><i class="fas fa-clock"></i> Event Timeline</h3>
            <div class="plan-timeline">
                ${plan.timeline.map(item => `
                    <div class="timeline-item">
                        <span class="timeline-time">${item.start}</span>
                        <span class="timeline-activity">${item.activity}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="plan-section">
            <h3><i class="fas fa-list-check"></i> Planning Checklist</h3>
            <div class="plan-tasks">
                ${plan.tasks.map(t => `
                    <div class="plan-task">
                        <i class="fas fa-circle-check"></i>
                        <span>${escapeHTML(t.task)}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="plan-section">
            <h3><i class="fas fa-palette"></i> Decoration Ideas</h3>
            <div class="plan-tasks">
                ${plan.decorSuggestions.map(d => `
                    <div class="plan-task">
                        <i class="fas fa-sparkles" style="color:var(--accent)"></i>
                        <span>${d}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="plan-section">
            <h3><i class="fas fa-lightbulb"></i> AI Recommendations</h3>
            <div class="suggestions-list">
                ${plan.recommendations.map(r => `
                    <div class="suggestion-item">
                        <i class="fas fa-star"></i>
                        <p>${escapeHTML(r)}</p>
                    </div>
                `).join('')}
            </div>
        </div>

        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:var(--space-xl);">
            <button class="btn btn-primary" onclick="applyPlanToLiveDashboard()"><i class="fas fa-gauge-high"></i> Apply to Dashboard</button>
            <button class="btn btn-outline" onclick="exportPlan()"><i class="fas fa-download"></i> Print / Save PDF</button>
            <button class="btn btn-outline" onclick="sharePlan()"><i class="fas fa-share-nodes"></i> Share Plan</button>
        </div>
    `;
}

function applyPlanToLiveDashboard() {
    if (!AppState.dashboardPlan) {
        showToast('No active plan to apply', 'error');
        return;
    }

    const { title, tasks, budget } = AppState.dashboardPlan;

    // Apply tasks to dashboard
    if (tasks && tasks.length > 0) {
        AppState.tasks = tasks.map((tName, i) => ({
            id: Date.now() + i,
            title: tName,
            priority: i === 0 ? 'high' : (i === 1 ? 'high' : 'medium'),
            due: new Date(Date.now() + (i + 2) * 86400000).toISOString().split('T')[0],
            assignee: 'Event Team',
            completed: false
        }));
        renderTasks();
        updateProgress();
    }

    // Apply expenses
    if (budget) {
        AppState.expenses = Object.entries(budget).map(([cat, amount], i) => ({
            id: Date.now() + 100 + i,
            desc: `${title} - ${cat.charAt(0).toUpperCase() + cat.slice(1)} Setup`,
            category: cat === 'venue' ? 'venue' : (cat === 'food' ? 'food' : (cat === 'decoration' ? 'decoration' : (cat === 'photography' ? 'photography' : 'other'))),
            amount: amount,
            status: i === 0 ? 'paid' : (i === 1 ? 'partial' : 'pending')
        }));
        renderExpenses();
    }

    // Update invitation preview
    const invTitleEl = document.getElementById('inv-preview-event');
    if (invTitleEl) invTitleEl.textContent = title;

    showToast(`"${title}" applied to Dashboard, Tasks & Expense Tracker! 🚀`, 'success');

    // Scroll to dashboard
    navigateToPage('dashboard');
}

// ═══════════════════════════════════════════
function exportPlan() {
    if (!AppState.currentPlan) return showToast('Generate a plan first', 'error');
    document.body.classList.add('printing-plan');
    window.print();
    document.body.classList.remove('printing-plan');
}

async function sharePlan() {
    if (!AppState.currentPlan) return showToast('Generate a plan first', 'error');
    const plan = AppState.currentPlan;
    const text = `${plan.title}\n${plan.city} • ${plan.guests} guests\nBudget: ₹${plan.totalBudget.toLocaleString()}\n${window.location.origin}/#/ai-planner`;
    try {
        await navigator.clipboard.writeText(text);
        showToast('Plan summary copied to clipboard', 'success');
    } catch { showToast('Clipboard unavailable. Use Export PDF to save your plan.', 'error'); }
}

// ═══════════════════════════════════════════
// AI BUDGET CALCULATOR
// ═══════════════════════════════════════════
function initBudgetCalculator() {
    // Event type buttons
    document.querySelectorAll('.event-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.event-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            calculateBudget();
        });
    });

    // Range sliders
    const guestSlider = document.getElementById('budget-guests');
    const amountSlider = document.getElementById('budget-amount');

    guestSlider.addEventListener('input', () => {
        document.getElementById('budget-guest-value').textContent = parseInt(guestSlider.value).toLocaleString();
        calculateBudget();
    });

    amountSlider.addEventListener('input', () => {
        document.getElementById('budget-amount-value').textContent = parseInt(amountSlider.value).toLocaleString();
        calculateBudget();
    });

    document.getElementById('calculate-budget-btn').addEventListener('click', calculateBudget);
}

function calculateBudget() {
    const type = document.querySelector('.event-type-btn.active')?.dataset.type || 'birthday';
    const guests = parseInt(document.getElementById('budget-guests').value);
    const budget = parseInt(document.getElementById('budget-amount').value);

    const config = AIPlanner.eventConfigs[type] || AIPlanner.eventConfigs['birthday'];
    const split = config.budgetSplit;

    const allocation = {};
    for (const [key, ratio] of Object.entries(split)) {
        allocation[key] = Math.round(budget * ratio);
    }

    // Draw donut chart
    drawBudgetChart(allocation, budget);

    // Render legend
    renderBudgetLegend(allocation);

    // Render suggestions
    renderBudgetSuggestions(budget, guests, type);

    // Render breakdown
    renderBudgetBreakdown(allocation, budget);

    // Update total
    document.getElementById('budget-total-value').textContent = `₹${budget.toLocaleString()}`;
}

function drawBudgetChart(allocation, total) {
    const canvas = document.getElementById('budget-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    const colors = ['#7c3aed', '#db2777', '#f59e0b', '#3b82f6', '#10b981', '#6366f1'];
    const entries = Object.entries(allocation);
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 120;
    const innerRadius = 75;

    ctx.clearRect(0, 0, size, size);

    let startAngle = -Math.PI / 2;
    entries.forEach(([, value], i) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        // Add slight gap between segments
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, endAngle - 0.02, endAngle + 0.02);
        ctx.arc(centerX, centerY, innerRadius, endAngle + 0.02, endAngle - 0.02, true);
        ctx.closePath();
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#1a1a3e';
        ctx.fill();

        startAngle = endAngle;
    });
}

function renderBudgetLegend(allocation) {
    const colors = ['#7c3aed', '#db2777', '#f59e0b', '#3b82f6', '#10b981', '#6366f1'];
    const icons = { venue: '🏛️', food: '🍽️', decoration: '🎨', photography: '📸', entertainment: '🎵', other: '📦' };
    const container = document.getElementById('budget-legend');
    container.innerHTML = Object.entries(allocation).map(([key], i) => `
        <div class="legend-item">
            <span class="legend-dot" style="background:${colors[i]}"></span>
            <span>${icons[key] || '📦'} ${key.charAt(0).toUpperCase() + key.slice(1)}</span>
        </div>
    `).join('');
}

function renderBudgetSuggestions(budget, guests, type) {
    const perPerson = budget / guests;
    const suggestions = [];

    if (perPerson < 300) {
        suggestions.push({ icon: '💰', text: `With ₹${Math.round(perPerson)}/person, consider a casual buffet-style arrangement with home-style cooking.` });
        suggestions.push({ icon: '📍', text: 'Community halls or open spaces will be the most cost-effective venues.' });
        suggestions.push({ icon: '🎨', text: 'DIY decorations with balloons and streamers can save significant costs.' });
    } else if (perPerson < 800) {
        suggestions.push({ icon: '🍽️', text: `₹${Math.round(perPerson)}/person allows for a good restaurant-style catering.` });
        suggestions.push({ icon: '📸', text: 'You can hire a professional photographer for 2-3 hours coverage.' });
        suggestions.push({ icon: '🎵', text: 'Consider a DJ setup rather than a live band to optimize entertainment budget.' });
    } else if (perPerson < 2000) {
        suggestions.push({ icon: '⭐', text: `₹${Math.round(perPerson)}/person puts you in the premium range — go for a great venue!` });
        suggestions.push({ icon: '🎪', text: 'You can afford a themed photo booth and professional entertainment.' });
        suggestions.push({ icon: '🌸', text: 'Fresh flower decorations and premium catering are within your budget.' });
    } else {
        suggestions.push({ icon: '👑', text: `₹${Math.round(perPerson)}/person is luxury-level — consider a 5-star venue or destination event!` });
        suggestions.push({ icon: '🎆', text: 'You can include fireworks, drone photography, and live performances.' });
        suggestions.push({ icon: '🍰', text: 'Commission a designer cake and premium multi-cuisine menu.' });
    }

    if (type === 'wedding' && budget < 200000) {
        suggestions.push({ icon: '💡', text: 'For a wedding under ₹2L, focus on key ceremonies and an intimate gathering.' });
    }

    document.getElementById('budget-suggestions-list').innerHTML = suggestions.map(s => `
        <div class="suggestion-item">
            <i class="fas fa-lightbulb"></i>
            <p>${s.icon} ${s.text}</p>
        </div>
    `).join('');
}

function renderBudgetBreakdown(allocation, total) {
    const icons = { venue: 'fa-building-columns', food: 'fa-utensils', decoration: 'fa-paint-roller', photography: 'fa-camera', entertainment: 'fa-music', other: 'fa-box' };
    const container = document.getElementById('budget-breakdown-items');

    container.innerHTML = Object.entries(allocation).map(([key, value]) => `
        <div class="breakdown-item">
            <span class="item-name"><i class="fas ${icons[key] || 'fa-box'}"></i> ${key.charAt(0).toUpperCase() + key.slice(1)}</span>
            <span class="item-amount">₹${value.toLocaleString()} <small style="color:var(--text-muted)">(${Math.round(value/total*100)}%)</small></span>
        </div>
    `).join('');
}

// ═══════════════════════════════════════════
// VENDOR MARKETPLACE
// ═══════════════════════════════════════════
const vendorsData = [
    { id: 1, name: 'Royal Palace Banquets', category: 'venue', city: 'Delhi', rating: 4.8, reviews: 324, price: '₹50,000-2,00,000', badge: 'featured', description: 'Premium banquet hall with AC, parking, and customizable décor for up to 500 guests.', services: ['AC Hall', 'Parking', 'Kitchen', 'Stage', 'Sound System'], image: 'fa-building-columns' },
    { id: 2, name: 'Dream Decorators', category: 'decorator', city: 'Mumbai', rating: 4.9, reviews: 215, price: '₹15,000-1,00,000', badge: 'verified', description: 'Award-winning decoration team specializing in theme-based event setups and floral artistry.', services: ['Theme Décor', 'Floral', 'Lighting', 'Stage Design', 'Mandap'], image: 'fa-wand-sparkles' },
    { id: 3, name: 'ClickPerfect Studios', category: 'photographer', city: 'Bangalore', rating: 4.7, reviews: 189, price: '₹10,000-75,000', badge: 'verified', description: 'Professional photography & videography with drone coverage, albums, and cinematic films.', services: ['Photography', 'Videography', 'Drone', 'Album', 'Pre-wedding'], image: 'fa-camera' },
    { id: 4, name: 'Taste of Punjab', category: 'caterer', city: 'Chandigarh', rating: 4.6, reviews: 456, price: '₹300-800/plate', badge: 'featured', description: 'Authentic North Indian cuisine with live counters, multi-cuisine buffets, and custom menus.', services: ['Buffet', 'Live Counter', 'Stalls', 'Desserts', 'Service Staff'], image: 'fa-utensils' },
    { id: 5, name: 'DJ Rhythm', category: 'dj', city: 'Jaipur', rating: 4.5, reviews: 167, price: '₹8,000-50,000', badge: 'verified', description: 'High-energy DJ with professional sound system, LED lights, fog machines, and dance floor setup.', services: ['DJ Setup', 'Sound', 'LED Lights', 'Fog Machine', 'Dance Floor'], image: 'fa-music' },
    { id: 6, name: 'Elegant Events', category: 'planner', city: 'Delhi', rating: 4.9, reviews: 98, price: '₹25,000-3,00,000', badge: 'featured', description: 'Full-service event planning from concept to execution. Weddings, corporate, and social events.', services: ['Full Planning', 'Vendor Coordination', 'Day-of Management', 'Theme Design'], image: 'fa-clipboard-list' },
    { id: 7, name: 'Green Garden Venue', category: 'venue', city: 'Gurgaon', rating: 4.4, reviews: 201, price: '₹30,000-1,50,000', badge: 'verified', description: 'Beautiful outdoor garden venue with lawn, poolside option, and indoor backup for 300+ guests.', services: ['Open Lawn', 'Poolside', 'Indoor Backup', 'Parking', 'Bridal Room'], image: 'fa-tree' },
    { id: 8, name: 'Spice Route Catering', category: 'caterer', city: 'Hyderabad', rating: 4.7, reviews: 312, price: '₹250-600/plate', badge: 'verified', description: 'Multi-cuisine catering with speciality in Hyderabadi biryani, South Indian, and continental dishes.', services: ['Multi-Cuisine', 'Live Kitchen', 'Starters', 'Dessert Bar', 'Beverages'], image: 'fa-bowl-food' },
    { id: 9, name: 'Shutter Stories', category: 'photographer', city: 'Pune', rating: 4.8, reviews: 143, price: '₹15,000-1,00,000', badge: 'featured', description: 'Storytelling-focused photography team with candid expertise, albums, and same-day edits.', services: ['Candid', 'Traditional', 'Same-Day Edit', 'Photo Book', 'Video'], image: 'fa-camera-retro' },
    { id: 10, name: 'Floral Fantasy', category: 'decorator', city: 'Jind', rating: 4.6, reviews: 87, price: '₹10,000-75,000', badge: 'verified', description: 'Specializing in floral decorations, mandap setups, stage designs, and entrance décor.', services: ['Floral Decor', 'Mandap', 'Stage', 'Entrance', 'Car Decor'], image: 'fa-spa' },
    { id: 11, name: 'Bass Beats DJ', category: 'dj', city: 'Mumbai', rating: 4.3, reviews: 124, price: '₹12,000-60,000', badge: 'verified', description: 'Professional DJ with Bollywood & EDM expertise, LED walls, and immersive sound experience.', services: ['DJ', 'LED Wall', 'Sound System', 'Light Show', 'Emcee'], image: 'fa-headphones' },
    { id: 12, name: 'Paradise Resort', category: 'venue', city: 'Goa', rating: 4.9, reviews: 278, price: '₹1,00,000-5,00,000', badge: 'featured', description: 'Beachfront wedding & event venue with luxury accommodation, spa, and beach ceremony setup.', services: ['Beach Setup', 'Luxury Stay', 'Spa', 'Pool Party', 'Sunset Deck'], image: 'fa-umbrella-beach' }
];

function initVendorMarketplace() {
    renderVendors(vendorsData);

    // Category filters
    document.querySelectorAll('#vendor-category-filters .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#vendor-category-filters .filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const category = chip.dataset.category;
            const filtered = category === 'all' ? vendorsData : vendorsData.filter(v => v.category === category);
            renderVendors(filtered);
        });
    });

    // Search
    document.getElementById('vendor-search').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = vendorsData.filter(v =>
            v.name.toLowerCase().includes(query) ||
            v.city.toLowerCase().includes(query) ||
            v.category.toLowerCase().includes(query)
        );
        renderVendors(filtered);
    });

    // Modal close
    document.getElementById('vendor-modal-close').addEventListener('click', () => {
        document.getElementById('vendor-modal').classList.remove('active');
    });
    document.getElementById('vendor-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('vendor-modal')) {
            document.getElementById('vendor-modal').classList.remove('active');
        }
    });
}

function renderVendors(vendors) {
    const grid = document.getElementById('vendor-grid');
    const gradients = [
        'linear-gradient(135deg, #667eea, #764ba2)',
        'linear-gradient(135deg, #f093fb, #f5576c)',
        'linear-gradient(135deg, #4facfe, #00f2fe)',
        'linear-gradient(135deg, #43e97b, #38f9d7)',
        'linear-gradient(135deg, #fa709a, #fee140)',
        'linear-gradient(135deg, #a18cd1, #fbc2eb)',
        'linear-gradient(135deg, #fccb90, #d57eeb)',
        'linear-gradient(135deg, #667eea, #764ba2)',
    ];

    grid.innerHTML = vendors.map((v, i) => `
        <div class="vendor-card" onclick="openVendorModal(${v.id})">
            <div class="vendor-card-image" style="background:${gradients[i % gradients.length]}">
                <i class="fas ${v.image}"></i>
                <span class="vendor-badge ${v.badge}">${v.badge === 'verified' ? '✓ Verified' : '⭐ Featured'}</span>
            </div>
            <div class="vendor-card-info">
                <h3>${v.name}</h3>
                <span class="vendor-category-tag">${v.category.charAt(0).toUpperCase() + v.category.slice(1)}</span>
                <div class="vendor-location"><i class="fas fa-location-dot"></i> ${v.city}</div>
                <div class="vendor-meta">
                    <span class="vendor-rating"><i class="fas fa-star"></i> ${v.rating} (${v.reviews})</span>
                    <span class="vendor-price">${v.price}</span>
                </div>
                <label class="vendor-card-compare-chk" onclick="event.stopPropagation()">
                    <input type="checkbox" onchange="toggleVendorCompare(${v.id}, this.checked)" ${AppState.selectedVendorsForCompare.includes(v.id) ? 'checked' : ''}>
                    <span>Compare with other vendors</span>
                </label>
            </div>
        </div>
    `).join('');
}

function openVendorModal(id) {
    const vendor = vendorsData.find(v => v.id === id);
    if (!vendor) return;

    const modal = document.getElementById('vendor-modal');
    const body = document.getElementById('vendor-modal-body');

    body.innerHTML = `
        <div style="text-align:center;padding:var(--space-xl) 0;">
            <div style="width:80px;height:80px;margin:0 auto var(--space-md);border-radius:var(--radius-lg);background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;">
                <i class="fas ${vendor.image}" style="font-size:2rem;color:white"></i>
            </div>
            <h2 style="font-size:1.5rem;font-weight:800;margin-bottom:0.25rem;">${vendor.name}</h2>
            <span style="color:var(--primary-light);font-weight:600;">${vendor.category.charAt(0).toUpperCase() + vendor.category.slice(1)}</span>
            <div style="margin-top:0.5rem;color:var(--text-muted);font-size:0.85rem;"><i class="fas fa-location-dot"></i> ${vendor.city}</div>
        </div>
        <div style="display:flex;justify-content:center;gap:var(--space-lg);margin-bottom:var(--space-xl);">
            <div style="text-align:center;"><span style="font-size:1.3rem;font-weight:800;color:var(--accent);">${vendor.rating}</span><br><span style="font-size:0.75rem;color:var(--text-muted);">Rating</span></div>
            <div style="text-align:center;"><span style="font-size:1.3rem;font-weight:800;">${vendor.reviews}</span><br><span style="font-size:0.75rem;color:var(--text-muted);">Reviews</span></div>
            <div style="text-align:center;"><span style="font-size:1.3rem;font-weight:800;color:var(--primary-light);">${vendor.price}</span><br><span style="font-size:0.75rem;color:var(--text-muted);">Price Range</span></div>
        </div>
        <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.7;margin-bottom:var(--space-lg);">${vendor.description}</p>
        <h4 style="margin-bottom:0.75rem;font-weight:700;">Services Offered</h4>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:var(--space-xl);">
            ${vendor.services.map(s => `<span style="padding:0.4rem 0.8rem;background:rgba(124,58,237,0.1);border-radius:var(--radius-full);font-size:0.8rem;color:var(--primary-light);font-weight:500;">${s}</span>`).join('')}
        </div>
        <div style="display:flex;gap:0.75rem;">
            <button class="btn btn-primary btn-lg" style="flex:1;" onclick="openBookingModal(${vendor.id})"><i class="fas fa-calendar-check"></i> Book Now</button>
            <button class="btn btn-outline btn-lg" onclick="openQuoteModal(${vendor.id})"><i class="fas fa-file-invoice"></i> Get Instant Quote</button>
        </div>
    `;

    modal.classList.add('active');
}

function bookVendor(id) {
    openBookingModal(id);
}

function requestQuote(id) {
    openQuoteModal(id);
}

// ═══════════════════════════════════════════
// SMART INVITATIONS
// ═══════════════════════════════════════════
function initInvitations() {
    const form = document.getElementById('invitation-form');
    const nameInput = document.getElementById('inv-name');
    const dateInput = document.getElementById('inv-date');
    const timeInput = document.getElementById('inv-time');
    const venueInput = document.getElementById('inv-venue');
    const messageInput = document.getElementById('inv-message');

    // Live preview updates
    nameInput.addEventListener('input', () => {
        document.getElementById('inv-preview-event').textContent = nameInput.value || 'Event Name';
    });

    dateInput.addEventListener('input', () => {
        const date = new Date(dateInput.value);
        document.getElementById('inv-preview-date').textContent = date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    });

    timeInput.addEventListener('input', () => {
        const [h, m] = timeInput.value.split(':');
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        document.getElementById('inv-preview-time').textContent = `${hour}:${m} ${ampm}`;
    });

    venueInput.addEventListener('input', () => {
        document.getElementById('inv-preview-venue').textContent = venueInput.value || 'Enter venue';
    });

    messageInput.addEventListener('input', () => {
        document.getElementById('inv-preview-message').textContent = messageInput.value || 'Your personal message will appear here...';
    });

    // Style switcher
    document.querySelectorAll('input[name="inv-style"]').forEach(input => {
        input.addEventListener('change', () => {
            const card = document.getElementById('inv-card');
            card.className = `inv-card ${input.value}`;
        });
    });

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        generateQRCode();
        showToast('Invitation generated! Ready to share 🎉', 'success');
    });

    // Share buttons
    document.getElementById('share-whatsapp').addEventListener('click', () => {
        const name = nameInput.value || 'Our Event';
        const text = encodeURIComponent(`You're invited to ${name}! 🎉\n\nJoin us for an amazing celebration. RSVP now!`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    });

    document.getElementById('download-invitation').addEventListener('click', () => {
        generateQRCode();
        const canvas = document.createElement('canvas');
        canvas.width = 1000; canvas.height = 1200;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0, 0, 1000, 1200);
        ctx.textAlign = 'center'; ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 54px sans-serif';
        ctx.fillText("You're Invited!", 500, 130);
        ctx.fillStyle = '#ffffff'; ctx.font = '36px sans-serif';
        const lines = [nameInput.value || 'Our Event', dateInput.value, timeInput.value, venueInput.value, messageInput.value];
        let y = 240;
        for (const line of lines) {
            const words = String(line).split(/\s+/); let row = '';
            for (const word of words) {
                if (ctx.measureText(row + ' ' + word).width > 840) { ctx.fillText(row, 500, y); y += 48; row = word; }
                else row += (row ? ' ' : '') + word;
            }
            ctx.fillText(row, 500, y); y += 72;
            if (y > 850) break;
        }
        const qrCanvas = document.getElementById('inv-qr-code');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(qrCanvas, 380, 910, 240, 240);
        canvas.toBlob(blob => { if (blob) downloadBlob(blob, 'celebriplan-invitation.png'); }, 'image/png');
    });

    document.getElementById('copy-link').textContent = 'Copy invitation details';
    document.getElementById('copy-link').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText([nameInput.value || 'Our Event', dateInput.value, timeInput.value, venueInput.value, messageInput.value].filter(Boolean).join('\n'));
            showToast('Invitation details copied', 'success');
        } catch { showToast('Clipboard unavailable. Download the card instead.', 'error'); }
    });

    // Generate initial QR
    generateQRCode();
}

function generateQRCode() {
    const canvas = document.getElementById('inv-qr-code');
    const value = ['inv-name', 'inv-date', 'inv-time', 'inv-venue'].map(id => document.getElementById(id).value).filter(Boolean).join(' | ');
    if (canvas) drawCustomQR(canvas, value.slice(0, 500) || 'CelebriPlan invitation');
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ═══════════════════════════════════════════
// 3D VENUE PREVIEW
// ═══════════════════════════════════════════
function init3DVenuePreview() {
    const canvas = document.getElementById('venue-canvas');
    if (!canvas) return;

    let venueType = 'banquet';
    let lighting = 'warm';
    let layout = 'round';
    let decorColor = 'rose';
    let capacity = 100;
    let rotation = 0;
    let animating = true;

    function draw() {
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.offsetWidth || 800;
        const h = canvas.height = canvas.offsetHeight || 500;

        // Background based on venue type
        const bgColors = {
            banquet: ['#1a1a3e', '#2d1b69'],
            outdoor: ['#1a3a2e', '#0d2b1a'],
            rooftop: ['#1a2a3e', '#0d1b2b'],
            beach: ['#2a1a3e', '#1b0d2b']
        };
        const [bg1, bg2] = bgColors[venueType] || bgColors.banquet;
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, bg1);
        gradient.addColorStop(1, bg2);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Floor
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath();
        ctx.moveTo(w * 0.1, h * 0.7);
        ctx.lineTo(w * 0.9, h * 0.7);
        ctx.lineTo(w * 0.8, h * 0.95);
        ctx.lineTo(w * 0.2, h * 0.95);
        ctx.closePath();
        ctx.fill();

        // Floor grid lines
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            const t = i / 10;
            ctx.beginPath();
            ctx.moveTo(w * (0.1 + t * 0.8), h * 0.7);
            ctx.lineTo(w * (0.2 + t * 0.6), h * 0.95);
            ctx.stroke();
        }

        // Lighting effects
        const lightColors = {
            warm: ['rgba(255, 167, 38, 0.15)', 'rgba(255, 112, 67, 0.1)'],
            cool: ['rgba(66, 165, 245, 0.15)', 'rgba(126, 87, 194, 0.1)'],
            neon: ['rgba(224, 64, 251, 0.15)', 'rgba(0, 229, 255, 0.1)'],
            fairy: ['rgba(255, 213, 79, 0.2)', 'rgba(255, 171, 64, 0.15)']
        };
        const [light1, light2] = lightColors[lighting] || lightColors.warm;

        // Ceiling lights
        for (let i = 0; i < 5; i++) {
            const lx = w * (0.2 + i * 0.15);
            const ly = h * 0.15;
            const lightGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, 100);
            lightGrad.addColorStop(0, light1);
            lightGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = lightGrad;
            ctx.fillRect(lx - 100, ly - 50, 200, 200);

            // Light fixture
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(lx, ly, 4, 0, Math.PI * 2);
            ctx.fill();

            // Light beam
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx - 30, h * 0.7);
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx + 30, h * 0.7);
            ctx.stroke();
        }

        // Fairy lights (if fairy mode)
        if (lighting === 'fairy') {
            for (let i = 0; i < 30; i++) {
                const fx = w * 0.1 + Math.random() * w * 0.8;
                const fy = h * 0.1 + Math.random() * h * 0.3;
                ctx.fillStyle = `rgba(255, 213, 79, ${Math.random() * 0.6 + 0.2})`;
                ctx.beginPath();
                ctx.arc(fx, fy, 2 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Decoration color accents
        const decorColors = {
            rose: ['rgba(244, 143, 177, 0.3)', '#f48fb1'],
            gold: ['rgba(255, 213, 79, 0.3)', '#ffd54f'],
            blue: ['rgba(100, 181, 246, 0.3)', '#64b5f6'],
            green: ['rgba(129, 199, 132, 0.3)', '#81c784'],
            purple: ['rgba(179, 157, 219, 0.3)', '#b39ddb'],
            white: ['rgba(224, 224, 224, 0.3)', '#e0e0e0']
        };
        const [dGlow, dColor] = decorColors[decorColor] || decorColors.rose;

        // Stage / Backdrop
        ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
        ctx.fillRect(w * 0.3, h * 0.2, w * 0.4, h * 0.35);
        ctx.strokeStyle = dColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(w * 0.3, h * 0.2, w * 0.4, h * 0.35);

        // Stage decoration
        ctx.fillStyle = dGlow;
        ctx.fillRect(w * 0.32, h * 0.22, w * 0.36, h * 0.31);

        // Stage text
        ctx.fillStyle = dColor;
        ctx.font = 'bold 16px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 STAGE 🎉', w * 0.5, h * 0.4);

        // Tables based on layout
        const tableCount = Math.min(Math.ceil(capacity / 8), 12);

        if (layout === 'round') {
            for (let i = 0; i < tableCount; i++) {
                const row = Math.floor(i / 4);
                const col = i % 4;
                const tx = w * (0.2 + col * 0.2);
                const ty = h * (0.65 + row * 0.12);

                // Table
                ctx.fillStyle = 'rgba(124, 58, 237, 0.2)';
                ctx.beginPath();
                ctx.arc(tx, ty, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = dColor;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Chairs around table
                for (let c = 0; c < 8; c++) {
                    const angle = (c / 8) * Math.PI * 2 + rotation;
                    const cx = tx + Math.cos(angle) * 28;
                    const cy = ty + Math.sin(angle) * 28;
                    ctx.fillStyle = 'rgba(255,255,255,0.15)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else if (layout === 'long') {
            for (let i = 0; i < Math.min(tableCount, 6); i++) {
                const tx = w * 0.2;
                const ty = h * (0.62 + i * 0.06);

                ctx.fillStyle = 'rgba(124, 58, 237, 0.2)';
                ctx.fillRect(tx, ty - 6, w * 0.6, 12);
                ctx.strokeStyle = dColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(tx, ty - 6, w * 0.6, 12);

                // Chairs on both sides
                for (let c = 0; c < 10; c++) {
                    const cx = tx + (c / 10) * w * 0.6 + w * 0.03;
                    ctx.fillStyle = 'rgba(255,255,255,0.15)';
                    ctx.beginPath();
                    ctx.arc(cx, ty - 14, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(cx, ty + 14, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else { // cocktail
            for (let i = 0; i < tableCount; i++) {
                const tx = w * (0.15 + (i % 5) * 0.17);
                const ty = h * (0.65 + Math.floor(i / 5) * 0.15);

                ctx.fillStyle = 'rgba(124, 58, 237, 0.2)';
                ctx.beginPath();
                ctx.arc(tx, ty, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = dColor;
                ctx.lineWidth = 1;
                ctx.stroke();

                // Stand
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.beginPath();
                ctx.moveTo(tx, ty + 10);
                ctx.lineTo(tx, ty + 25);
                ctx.stroke();
            }
        }

        // Entrance
        ctx.fillStyle = dColor;
        ctx.font = 'bold 11px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('↑ ENTRANCE', w * 0.5, h * 0.98);

        // Venue-specific decorations
        if (venueType === 'outdoor') {
            // Trees
            for (let i = 0; i < 4; i++) {
                const treeX = i < 2 ? w * 0.05 : w * 0.92;
                const treeY = h * (0.3 + (i % 2) * 0.3);
                ctx.fillStyle = 'rgba(129, 199, 132, 0.3)';
                ctx.beginPath();
                ctx.arc(treeX, treeY, 25, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (venueType === 'beach') {
            // Waves
            ctx.strokeStyle = 'rgba(100, 181, 246, 0.2)';
            ctx.lineWidth = 2;
            for (let w2 = 0; w2 < 3; w2++) {
                ctx.beginPath();
                for (let x = 0; x < w; x += 5) {
                    ctx.lineTo(x, h * 0.08 + Math.sin(x * 0.02 + w2 + rotation) * 8);
                }
                ctx.stroke();
            }
        }
    }

    // Initial draw & expose for multi-page switcher
    draw();
    window.redrawVenue3D = draw;

    // Auto-rotate
    let frameId = null;
    function animate() {
        frameId = null;
        if (document.hidden || !document.getElementById('page-venue-3d').classList.contains('active')) return;
        if (animating && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            rotation += 0.005;
            draw();
        }
        frameId = requestAnimationFrame(animate);
    }
    window.startVenueAnimation = () => { if (frameId === null) animate(); };
    window.stopVenueAnimation = () => { if (frameId !== null) cancelAnimationFrame(frameId); frameId = null; };
    document.addEventListener('visibilitychange', () => {
        window.stopVenueAnimation();
        if (!document.hidden && document.getElementById('page-venue-3d').classList.contains('active')) window.startVenueAnimation();
    });

    // Controls
    document.querySelectorAll('.venue-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.venue-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            venueType = btn.dataset.venue;
            updateVenueInfoBadge();
            draw();
        });
    });

    document.querySelectorAll('.lighting-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.lighting-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            lighting = btn.dataset.lighting;
            updateVenueInfoBadge();
            draw();
        });
    });

    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            layout = btn.dataset.layout;
            updateVenueInfoBadge();
            draw();
        });
    });

    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            decorColor = btn.dataset.color;
            draw();
        });
    });

    document.getElementById('venue-capacity').addEventListener('input', (e) => {
        capacity = parseInt(e.target.value);
        document.getElementById('venue-capacity-val').textContent = capacity;
        updateVenueInfoBadge();
        draw();
    });

    function updateVenueInfoBadge() {
        const badge = document.getElementById('venue-info-badge');
        const names = { banquet: 'Banquet Hall', outdoor: 'Outdoor Garden', rooftop: 'Rooftop', beach: 'Beach Venue' };
        const layouts = { round: 'Round tables', long: 'Long tables', cocktail: 'Cocktail' };
        badge.querySelector('.venue-name').textContent = names[venueType] || 'Venue';
        badge.querySelector('.venue-details').textContent = `${capacity} guests • ${lighting.charAt(0).toUpperCase() + lighting.slice(1)} lighting • ${layouts[layout]}`;
    }

    // 3D Controls
    document.getElementById('v3d-rotate').addEventListener('click', () => {
        animating = !animating;
    });
}

// ═══════════════════════════════════════════
// GUEST MANAGEMENT
// ═══════════════════════════════════════════
function initGuestManagement() {
    // Sample guests
    AppState.guests = [
        { id: 1, name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@email.com', group: 'family', rsvp: 'accepted', table: 1, checkedIn: false },
        { id: 2, name: 'Priya Patel', phone: '9876543211', email: 'priya@email.com', group: 'friends', rsvp: 'accepted', table: 1, checkedIn: true },
        { id: 3, name: 'Amit Kumar', phone: '9876543212', email: 'amit@email.com', group: 'colleagues', rsvp: 'pending', table: 2, checkedIn: false },
        { id: 4, name: 'Sneha Gupta', phone: '9876543213', email: 'sneha@email.com', group: 'vip', rsvp: 'accepted', table: 2, checkedIn: true },
        { id: 5, name: 'Vikram Singh', phone: '9876543214', email: '', group: 'family', rsvp: 'declined', table: 0, checkedIn: false },
        { id: 6, name: 'Ananya Desai', phone: '9876543215', email: 'ananya@email.com', group: 'friends', rsvp: 'accepted', table: 3, checkedIn: false },
        { id: 7, name: 'Rohan Mehta', phone: '9876543216', email: '', group: 'colleagues', rsvp: 'pending', table: 3, checkedIn: false },
        { id: 8, name: 'Kavita Joshi', phone: '9876543217', email: 'kavita@email.com', group: 'family', rsvp: 'accepted', table: 1, checkedIn: true },
    ];

    renderGuestTable();
    renderSeatingChart();

    // Add guest form
    document.getElementById('add-guest-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const guest = {
            id: Date.now(),
            name: document.getElementById('guest-name').value,
            phone: document.getElementById('guest-phone').value,
            email: document.getElementById('guest-email').value,
            group: document.getElementById('guest-group').value,
            rsvp: 'pending',
            table: 0,
            checkedIn: false
        };
        AppState.guests.push(guest);
        renderGuestTable();
        renderSeatingChart();
        e.target.reset();
        showToast(`${guest.name} added to guest list! 👤`, 'success');
    });

    // Filters
    document.querySelectorAll('.guest-filters .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.guest-filters .filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderGuestTable(chip.dataset.filter);
        });
    });

    // Send all invites
    document.getElementById('send-all-invites').addEventListener('click', () => {
        showToast('Use the invitation WhatsApp share button to send invitations. No messages have been sent automatically.', 'info');
    });
}

function renderGuestTable(filter = 'all') {
    const tbody = document.getElementById('guest-table-body');
    const groupIcons = { family: '👨‍👩‍👦', friends: '🤝', colleagues: '💼', vip: '⭐', others: '👤' };

    const filtered = filter === 'all' ? AppState.guests : AppState.guests.filter(g => g.rsvp === filter);

    tbody.innerHTML = filtered.map(g => `
        <tr>
            <td><strong>${escapeHTML(g.name)}</strong></td>
            <td>${groupIcons[g.group] || '👤'} ${g.group.charAt(0).toUpperCase() + g.group.slice(1)}</td>
            <td><span class="guest-status ${g.rsvp}">${g.rsvp.charAt(0).toUpperCase() + g.rsvp.slice(1)}</span></td>
            <td>${g.table > 0 ? `Table ${g.table}` : '—'}</td>
            <td><span class="guest-status ${g.checkedIn ? 'checked-in' : 'pending'}">${g.checkedIn ? '✓ Checked in' : 'Not yet'}</span></td>
            <td>
                <button class="guest-action-btn" onclick="toggleCheckIn(${g.id})" title="Check In"><i class="fas fa-qrcode"></i></button>
                <button class="guest-action-btn delete" onclick="removeGuest(${g.id})" title="Remove"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    document.getElementById('guest-total-count').textContent = `${AppState.guests.length} guests`;
}

function toggleCheckIn(id) {
    const guest = AppState.guests.find(g => g.id === id);
    if (guest) {
        guest.checkedIn = !guest.checkedIn;
        renderGuestTable();
        showToast(`${guest.name} ${guest.checkedIn ? 'checked in' : 'check-in reversed'}`, 'info');
    }
}

function removeGuest(id) {
    const guest = AppState.guests.find(g => g.id === id);
    AppState.guests = AppState.guests.filter(g => g.id !== id);
    renderGuestTable();
    renderSeatingChart();
    showToast(`${guest?.name || 'Guest'} removed`, 'info');
}

function renderSeatingChart() {
    const chart = document.getElementById('seating-chart');
    const tables = {};

    AppState.guests.forEach(g => {
        if (g.table > 0) {
            if (!tables[g.table]) tables[g.table] = [];
            tables[g.table].push(g);
        }
    });

    // Ensure at least 4 tables
    for (let i = 1; i <= Math.max(4, Object.keys(tables).length); i++) {
        if (!tables[i]) tables[i] = [];
    }

    chart.innerHTML = Object.entries(tables).map(([num, guests]) => {
        const seats = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * 360;
            const r = 52;
            const x = 50 + r * Math.cos((angle * Math.PI) / 180);
            const y = 50 + r * Math.sin((angle * Math.PI) / 180);
            const filled = i < guests.length;
            seats.push(`<div class="seat-dot ${filled ? '' : 'empty'}" style="left:${x}%;top:${y}%;transform:translate(-50%,-50%)" title="${filled ? escapeHTML(guests[i].name) : 'Empty'}"></div>`);
        }

        return `
            <div class="seating-table">
                <div class="table-circle">
                    <span>T${num}</span>
                    <div class="table-seats">${seats.join('')}</div>
                </div>
                <span class="table-label">${guests.length}/8 seated</span>
            </div>
        `;
    }).join('');
}

// ═══════════════════════════════════════════
// EXPENSE TRACKER
// ═══════════════════════════════════════════
function initExpenseTracker() {
    AppState.expenses = [
        { id: 1, desc: 'Royal Palace Banquet Booking', category: 'venue', amount: 15000, status: 'paid' },
        { id: 2, desc: 'Catering Advance (50 plates)', category: 'food', amount: 8500, status: 'paid' },
        { id: 3, desc: 'Theme Decoration Setup', category: 'decoration', amount: 5000, status: 'partial' },
        { id: 4, desc: 'Photography Package', category: 'photography', amount: 4000, status: 'pending' },
        { id: 5, desc: 'DJ & Sound System', category: 'music', amount: 3500, status: 'paid' },
        { id: 6, desc: 'Invitation Printing', category: 'other', amount: 1500, status: 'paid' },
    ];

    renderExpenses();

    document.getElementById('add-expense-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const expense = {
            id: Date.now(),
            desc: document.getElementById('expense-desc').value,
            category: document.getElementById('expense-category').value,
            amount: parseInt(document.getElementById('expense-amount').value),
            status: document.getElementById('expense-status').value
        };
        AppState.expenses.push(expense);
        renderExpenses();
        e.target.reset();
        showToast('Expense added! 💰', 'success');
    });
}

function renderExpenses() {
    const container = document.getElementById('expense-items');
    const totalBudget = AppState.currentPlan?.totalBudget || 50000;
    const totalSpent = AppState.expenses.reduce((sum, e) => sum + (e.status !== 'pending' ? e.amount : 0), 0);
    const totalDues = AppState.expenses.reduce((sum, e) => sum + (e.status === 'pending' ? e.amount : 0), 0);
    const remaining = totalBudget - totalSpent - totalDues;

    document.getElementById('exp-total-budget').textContent = `₹${totalBudget.toLocaleString()}`;
    document.getElementById('exp-spent').textContent = `₹${totalSpent.toLocaleString()}`;
    document.getElementById('exp-remaining').textContent = `₹${remaining.toLocaleString()}`;
    document.getElementById('exp-dues').textContent = `₹${totalDues.toLocaleString()}`;

    const categoryColors = {
        venue: '#7c3aed', food: '#db2777', decoration: '#f59e0b',
        photography: '#3b82f6', music: '#10b981', transport: '#6366f1', other: '#94a3b8'
    };
    const categoryIcons = {
        venue: '🏛️', food: '🍽️', decoration: '🎨',
        photography: '📸', music: '🎵', transport: '🚗', other: '📦'
    };

    container.innerHTML = AppState.expenses.map(e => `
        <div class="expense-item" style="border-left-color:${categoryColors[e.category] || '#94a3b8'}">
            <div class="expense-item-left">
                <span class="expense-item-desc">${escapeHTML(e.desc)}</span>
                <span class="expense-item-cat">${categoryIcons[e.category] || '📦'} ${e.category.charAt(0).toUpperCase() + e.category.slice(1)}</span>
            </div>
            <div class="expense-item-right">
                <span class="expense-item-amount" style="color:${categoryColors[e.category]}">₹${e.amount.toLocaleString()}</span>
                <span class="expense-item-status ${e.status}">${e.status.charAt(0).toUpperCase() + e.status.slice(1)}</span>
            </div>
        </div>
    `).join('');
}

// ═══════════════════════════════════════════
// LIVE DASHBOARD
// ═══════════════════════════════════════════
function initDashboard() {
    // Initialize tasks
    AppState.tasks = [
        { id: 1, title: 'Confirm venue booking', priority: 'high', due: '2026-10-25', assignee: 'Self', completed: true },
        { id: 2, title: 'Finalize catering menu', priority: 'high', due: '2026-10-28', assignee: 'Caterer', completed: true },
        { id: 3, title: 'Send invitations to all guests', priority: 'high', due: '2026-10-30', assignee: 'Self', completed: false },
        { id: 4, title: 'Book photographer', priority: 'medium', due: '2026-10-27', assignee: 'Self', completed: true },
        { id: 5, title: 'Arrange decoration materials', priority: 'medium', due: '2026-11-01', assignee: 'Decorator', completed: false },
        { id: 6, title: 'Confirm DJ availability', priority: 'medium', due: '2026-10-29', assignee: 'DJ', completed: false },
        { id: 7, title: 'Arrange return gifts', priority: 'low', due: '2026-11-02', assignee: 'Self', completed: false },
        { id: 8, title: 'Final venue walkthrough', priority: 'high', due: '2026-11-03', assignee: 'Self', completed: false },
    ];

    renderTasks();
    renderTimeline();
    renderVendorStatus();
    renderNotifications();
    startCountdown();
    updateProgress();

    // Add task modal
    document.getElementById('add-task-btn').addEventListener('click', () => {
        document.getElementById('task-modal').classList.add('active');
    });

    document.getElementById('task-modal-close').addEventListener('click', () => {
        document.getElementById('task-modal').classList.remove('active');
    });

    document.getElementById('task-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('task-modal')) {
            document.getElementById('task-modal').classList.remove('active');
        }
    });

    document.getElementById('add-task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const task = {
            id: Date.now(),
            title: document.getElementById('task-title').value,
            priority: document.getElementById('task-priority').value,
            due: document.getElementById('task-due').value,
            assignee: document.getElementById('task-assignee').value || 'Self',
            completed: false
        };
        AppState.tasks.push(task);
        renderTasks();
        updateProgress();
        document.getElementById('task-modal').classList.remove('active');
        e.target.reset();
        showToast('Task added! ✅', 'success');
    });
}

function renderTasks() {
    const container = document.getElementById('tasks-list');
    container.innerHTML = AppState.tasks.map(t => `
        <div class="task-item ${t.completed ? 'completed' : ''}">
            <button type="button" class="task-checkbox ${t.completed ? 'checked' : ''}" aria-label="Complete ${escapeHTML(t.title)}" aria-pressed="${t.completed}" onclick="toggleTask(${t.id})">
                ${t.completed ? '<i class="fas fa-check"></i>' : ''}
            </button>
            <div class="task-info">
                <span class="task-name">${escapeHTML(t.title)}</span>
                <span class="task-meta">
                    <span><i class="fas fa-user"></i> ${escapeHTML(t.assignee)}</span>
                    <span><i class="fas fa-calendar"></i> ${t.due ? new Date(t.due).toLocaleDateString('en-IN', {month:'short', day:'numeric'}) : 'No due date'}</span>
                </span>
            </div>
            <a href="javascript:void(0)" class="task-gcal-link" onclick="syncTaskToGoogleCalendar(${t.id})" title="Add this task to Google Calendar">
                <i class="fab fa-google"></i> GCal
            </a>
            <div class="task-priority ${t.priority}"></div>
        </div>
    `).join('');
}

function toggleTask(id) {
    const task = AppState.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
        updateProgress();
    }
}

function updateProgress() {
    const total = AppState.tasks.length;
    const done = AppState.tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    document.getElementById('progress-percent').textContent = `${percent}%`;

    // Update ring
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (percent / 100) * circumference;
    const ring = document.getElementById('progress-ring-fill');
    if (ring) ring.style.strokeDashoffset = offset;

    // Update stats
    const inProgress = AppState.tasks.filter(t => !t.completed).length;
    const statsContainer = document.querySelector('.progress-stats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <span><i class="fas fa-check-circle" style="color:var(--success)"></i> ${done} Done</span>
            <span><i class="fas fa-spinner" style="color:var(--warning)"></i> ${inProgress} Pending</span>
        `;
    }
}

function renderTimeline() {
    const container = document.getElementById('event-timeline');
    const timelineData = [
        { time: '06:00 PM', title: 'Guest Arrival', desc: 'Welcome drinks & registration' },
        { time: '06:30 PM', title: 'Opening', desc: 'Welcome speech & introduction' },
        { time: '07:00 PM', title: 'Main Event', desc: 'Cake cutting / ceremonies' },
        { time: '07:30 PM', title: 'Entertainment', desc: 'DJ, games & performances' },
        { time: '08:30 PM', title: 'Dinner', desc: 'Buffet service begins' },
        { time: '09:30 PM', title: 'Photo Session', desc: 'Group photos & memories' },
        { time: '10:00 PM', title: 'Farewell', desc: 'Thank you & goodbyes' },
    ];

    container.innerHTML = timelineData.map(t => `
        <div class="tl-item">
            <span class="tl-time">${t.time}</span>
            <span class="tl-title">${escapeHTML(t.title)}</span>
            <span class="tl-desc">${t.desc}</span>
        </div>
    `).join('');
}

function renderVendorStatus() {
    const container = document.getElementById('vendor-status-list');
    const statuses = [
        { name: 'Royal Palace', type: 'Venue', status: 'confirmed', color: '#7c3aed' },
        { name: 'Dream Decorators', type: 'Decoration', status: 'in-progress', color: '#f59e0b' },
        { name: 'ClickPerfect', type: 'Photography', status: 'confirmed', color: '#3b82f6' },
        { name: 'Taste of Punjab', type: 'Catering', status: 'confirmed', color: '#db2777' },
        { name: 'DJ Rhythm', type: 'Entertainment', status: 'pending', color: '#10b981' },
    ];

    container.innerHTML = statuses.map(v => `
        <div class="vs-item">
            <div class="vs-icon" style="background:${v.color}22;color:${v.color}"><i class="fas fa-store"></i></div>
            <div class="vs-info">
                <span class="vs-name">${v.name}</span>
                <span class="vs-type">${v.type}</span>
            </div>
            <span class="vs-status ${v.status === 'pending' ? 'pending-status' : v.status}">${v.status === 'in-progress' ? 'In Progress' : v.status.charAt(0).toUpperCase() + v.status.slice(1)}</span>
        </div>
    `).join('');
}

function renderNotifications() {
    const container = document.getElementById('notifications-list');
    const notifications = [
        { icon: 'fa-check-circle', color: '#10b981', text: 'Royal Palace Banquet confirmed your booking', time: '2 hours ago' },
        { icon: 'fa-user-plus', color: '#3b82f6', text: 'Priya Patel accepted your invitation', time: '3 hours ago' },
        { icon: 'fa-credit-card', color: '#7c3aed', text: 'Payment of ₹8,500 received by caterer', time: '5 hours ago' },
        { icon: 'fa-camera', color: '#f59e0b', text: 'ClickPerfect Studios sent you a quote', time: '1 day ago' },
        { icon: 'fa-bell', color: '#db2777', text: 'Reminder: Send invitations by Oct 30', time: '1 day ago' },
        { icon: 'fa-star', color: '#fbbf24', text: 'You received 5-star review from a previous client', time: '2 days ago' },
    ];

    container.innerHTML = notifications.map(n => `
        <div class="notif-item">
            <div class="notif-icon" style="background:${n.color}22;color:${n.color}"><i class="fas ${n.icon}"></i></div>
            <div class="notif-content">
                <span class="notif-text">${n.text}</span>
                <span class="notif-time">${n.time}</span>
            </div>
        </div>
    `).join('');
}

function startCountdown() {
    function update() {
        const now = new Date();
        const diff = AppState.eventDate - now;

        if (diff <= 0) {
            document.getElementById('cd-days').textContent = '00';
            document.getElementById('cd-hours').textContent = '00';
            document.getElementById('cd-minutes').textContent = '00';
            document.getElementById('cd-seconds').textContent = '00';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('cd-days').textContent = String(days).padStart(2, '0');
        document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('cd-minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('cd-seconds').textContent = String(seconds).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
}

// ═══════════════════════════════════════════
// VENDOR DASHBOARD
// ═══════════════════════════════════════════
function initVendorDashboard() {
    // Services
    const services = [
        { name: 'Wedding Photography', price: '₹25,000 - ₹75,000', desc: 'Full day coverage with album' },
        { name: 'Pre-Wedding Shoot', price: '₹15,000 - ₹40,000', desc: '4 hours outdoor/indoor shoot' },
        { name: 'Event Videography', price: '₹20,000 - ₹60,000', desc: 'Cinematic film with drone coverage' },
    ];

    document.getElementById('vd-services-list').innerHTML = services.map(s => `
        <div class="vd-service-card">
            <div class="vd-service-name">${s.name}</div>
            <div class="vd-service-price">${s.price}</div>
            <div class="vd-service-desc">${s.desc}</div>
        </div>
    `).join('');

    // Calendar
    renderVendorCalendar();

    // Bookings
    const bookings = [
        { name: 'Sharma Wedding', date: 'Nov 5, 2026 • 10:00 AM', amount: '₹45,000' },
        { name: 'Corporate Annual Meet', date: 'Nov 12, 2026 • 09:00 AM', amount: '₹35,000' },
        { name: 'Mehta Engagement', date: 'Nov 18, 2026 • 06:00 PM', amount: '₹25,000' },
        { name: 'Gupta Birthday', date: 'Nov 22, 2026 • 07:00 PM', amount: '₹15,000' },
    ];

    document.getElementById('vd-bookings-list').innerHTML = bookings.map(b => `
        <div class="vd-booking-item">
            <div class="vd-booking-info">
                <span class="vd-booking-name">${b.name}</span>
                <span class="vd-booking-date">${b.date}</span>
            </div>
            <span class="vd-booking-amount">${b.amount}</span>
        </div>
    `).join('');
}

function renderVendorCalendar() {
    const grid = document.getElementById('vd-calendar-grid');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const today = now.getDate();

    const bookedDays = [5, 12, 18, 22, 25];
    const headers = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let html = headers.map(h => `<div class="cal-header">${h}</div>`).join('');

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="cal-day empty"></div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
        let classes = 'cal-day';
        if (d === today) classes += ' today';
        else if (bookedDays.includes(d)) classes += ' booked';
        else if (d > today) classes += ' available';
        html += `<div class="${classes}">${d}</div>`;
    }

    grid.innerHTML = html;
}

// ═══════════════════════════════════════════
// AI THEME GENERATOR
// ═══════════════════════════════════════════
function initThemeGenerator() {
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

// ═══════════════════════════════════════════
// AI CHATBOT
// ═══════════════════════════════════════════
function initChatbot() {
    const toggle = document.getElementById('chatbot-toggle');
    const window_ = document.getElementById('chatbot-window');
    const close = document.getElementById('chatbot-close');
    const input = document.getElementById('chatbot-input');
    const send = document.getElementById('chatbot-send');

    toggle.addEventListener('click', () => {
        window_.classList.toggle('active');
        if (window_.classList.contains('active')) {
            input.focus();
        }
    });

    close.addEventListener('click', () => {
        window_.classList.remove('active');
    });

    send.addEventListener('click', sendChatMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            input.value = chip.dataset.msg;
            sendChatMessage();
        });
    });
}

function sendChatMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    if (!message) return;

    addChatMessage('user', message);
    input.value = '';

    // Show typing indicator
    const typingId = addChatMessage('bot', '<div class="loading-dots" style="display:flex;gap:4px;"><span style="width:8px;height:8px;background:var(--primary-light);border-radius:50%;animation:pulse 1s infinite;"></span><span style="width:8px;height:8px;background:var(--primary-light);border-radius:50%;animation:pulse 1s 0.2s infinite;"></span><span style="width:8px;height:8px;background:var(--primary-light);border-radius:50%;animation:pulse 1s 0.4s infinite;"></span></div>', true);

    setTimeout(() => {
        const response = generateChatResponse(message);
        // Remove typing indicator and add real response
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        addChatMessage('bot', response);
    }, 1500);
}

function addChatMessage(type, content, isHtml = false) {
    const container = document.getElementById('chatbot-messages');
    const id = 'msg-' + Date.now();
    const iconClass = type === 'bot' ? 'fa-robot' : 'fa-user';

    const div = document.createElement('div');
    div.className = `chat-message ${type}`;
    div.id = id;
    div.innerHTML = `
        <div class="chat-avatar"><i class="fas ${iconClass}"></i></div>
        <div class="chat-bubble">${isHtml ? content : `<p>${type === 'user' ? escapeHTML(content) : content}</p>`}</div>
    `;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
}

function generateChatResponse(message) {
    const msg = message.toLowerCase();

    // Parse event details from message
    const budgetMatch = msg.match(/(\d+[,.]?\d*)\s*(lakh|lac|k|thousand|L)/i) || msg.match(/₹?\s*(\d{4,})/);
    const guestMatch = msg.match(/(\d+)\s*(guests?|people|persons?|log)/i);
    const typePatterns = {
        birthday: /birthday|bday|b'day|janamdin/i,
        wedding: /wedding|shaadi|shadi|vivah/i,
        engagement: /engagement|sagai|ring ceremony/i,
        corporate: /corporate|office|company|business/i,
        'college-fest': /college|fest|university|campus/i,
        anniversary: /anniversary|salgirah/i,
        'baby-shower': /baby shower|godh bharai/i
    };

    let detectedType = null;
    for (const [type, pattern] of Object.entries(typePatterns)) {
        if (pattern.test(msg)) {
            detectedType = type;
            break;
        }
    }

    if (detectedType) {
        let budget = 50000;
        if (budgetMatch) {
            budget = parseInt(budgetMatch[1].replace(/,/g, ''));
            if (/lakh|lac|L/i.test(budgetMatch[2] || '')) budget *= 100000;
            else if (/k|thousand/i.test(budgetMatch[2] || '')) budget *= 1000;
        }

        let guests = 50;
        if (guestMatch) guests = parseInt(guestMatch[1]);
        if (!Number.isSafeInteger(budget) || budget < 1 || budget > 100000000 || !Number.isSafeInteger(guests) || guests < 1 || guests > 10000) {
            return 'Please use a budget between ₹1 and ₹10 crore and a guest count between 1 and 10,000.';
        }

        const plan = AIPlanner.generatePlan({
            type: detectedType,
            city: 'Your City',
            guests,
            budget,
            duration: 4,
            theme: 'modern',
            food: 'both',
            notes: ''
        });

        const budgetBreakdown = Object.entries(plan.budget)
            .map(([k, v]) => `• ${k}: ₹${v.toLocaleString()}`)
            .join('\n');

        return `🎉 Great! Here's your <strong>${escapeHTML(plan.title)}</strong> plan:\n\n` +
            `<strong>Budget: ₹${budget.toLocaleString()}</strong> (${plan.category})\n` +
            `<strong>Guests:</strong> ${guests}\n` +
            `<strong>Per Person:</strong> ₹${plan.perPersonBudget.toLocaleString()}\n\n` +
            `<strong>💰 Budget Breakdown:</strong>\n${budgetBreakdown}\n\n` +
            `<strong>📋 Key Tasks:</strong>\n${plan.tasks.slice(0, 4).map(t => `• ${escapeHTML(t.task)}`).join('\n')}\n\n` +
            `<strong>💡 Top Tip:</strong> ${plan.recommendations[0]}\n\n` +
            `Want me to help with vendor booking or invitation design? 😊`;
    }

    // General responses
    if (msg.includes('vendor') || msg.includes('book')) {
        return "🏪 I can help you find vendors! Please tell me:\n• What type of vendor? (venue, caterer, photographer, DJ, decorator)\n• Which city?\n• Your budget range?\n\nYou can also check our <strong>Vendor Marketplace</strong> section above! 👆";
    }

    if (msg.includes('invitation') || msg.includes('invite') || msg.includes('card')) {
        return "💌 For invitations, head to our <strong>Smart Invitations</strong> section! You can:\n• Create AI-designed invitation cards\n• Share via WhatsApp\n• Generate QR entry passes\n• Track RSVPs in real-time\n\nWant me to suggest invitation styles? 🎨";
    }

    if (msg.includes('budget') || msg.includes('cost') || msg.includes('price') || msg.includes('kitna')) {
        return "💰 I can help with budgeting! Tell me:\n• Event type (birthday, wedding, etc.)\n• Number of guests\n• Your total budget\n\nOr use our <strong>AI Budget Calculator</strong> above for a detailed breakdown! 📊";
    }

    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('namaste')) {
        return "Namaste! 🙏🎉 Welcome to CelebriPlan!\n\nI can help you plan any event. Just tell me:\n• Event type (birthday, wedding, etc.)\n• Number of guests\n• Your budget\n• Any preferences\n\nOr click on any suggestion below to get started! 👇";
    }

    if (msg.includes('3d') || msg.includes('venue') || msg.includes('preview')) {
        return "🏛️ Check out our <strong>3D Venue Preview</strong> section! You can:\n• Choose venue type (banquet, outdoor, rooftop, beach)\n• Customize lighting & colors\n• Change table layout\n• Adjust capacity\n\nAll in interactive 3D! Try it out! 🎨";
    }

    return "I'd love to help! 🎉 Please tell me about your event:\n• <strong>What type?</strong> (birthday, wedding, corporate, etc.)\n• <strong>How many guests?</strong>\n• <strong>What's your budget?</strong>\n• <strong>Which city?</strong>\n\nFor example: \"Plan a birthday for 50 guests with ₹50,000 budget in Delhi\" 🎂";
}

// ═══════════════════════════════════════════
// THEME TOGGLE
// ═══════════════════════════════════════════
function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    const icon = toggle.querySelector('i');

    toggle.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
        icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
    });
}

// ═══════════════════════════════════════════
// SMOOTH SCROLL & ANIMATIONS
// ═══════════════════════════════════════════
function initFooterLinks() {
    document.querySelectorAll('.footer [data-coming-soon]').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showToast('We will be right back 🫠', 'info');
        });
    });
}

function initAccessibility() {
    document.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(control => {
        if (control.labels?.length || control.hasAttribute('aria-label')) return;
        const label = control.closest('.form-group')?.querySelector('label');
        if (label && control.id) label.htmlFor = control.id;
        else control.setAttribute('aria-label', control.placeholder || control.id.replace(/-/g, ' '));
    });
    document.querySelectorAll('button').forEach(button => {
        if (!button.textContent.trim() && !button.hasAttribute('aria-label')) {
            button.setAttribute('aria-label', button.title || button.id.replace(/-/g, ' ') || 'Close dialog');
        }
    });
    document.querySelector('.skip-link').addEventListener('click', event => {
        event.preventDefault();
        const main = document.querySelector('.app-page.active');
        main.tabIndex = -1;
        main.focus();
    });
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        const heading = modal.querySelector('h2, h3');
        if (heading) {
            heading.id ||= `${modal.id}-heading`;
            modal.setAttribute('aria-labelledby', heading.id);
        }
        let opener = null;
        let wasOpen = false;
        new MutationObserver(() => {
            const isOpen = modal.classList.contains('active');
            if (isOpen === wasOpen) return;
            wasOpen = isOpen;
            const anyModalOpen = !!document.querySelector('.modal-overlay.active');
            document.querySelectorAll('.app-page, .navbar, .footer, .chatbot-widget').forEach(element => { element.inert = anyModalOpen; });
            if (isOpen) {
                opener = document.activeElement;
                modal.querySelector('button, input, select, textarea, [href]')?.focus();
            } else if (opener?.isConnected) opener.focus();
        }).observe(modal, { attributes: true, attributeFilter: ['class'] });
        modal.addEventListener('keydown', event => {
            if (event.key !== 'Tab') return;
            const elements = [...modal.querySelectorAll('button, input:not([type="hidden"]), select, textarea, a[href], [tabindex="0"]')].filter(element => !element.disabled && element.getClientRects().length);
            if (!elements.length) return;
            const first = elements[0], last = elements.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        });
    });
}

function initSmoothScroll() {
    // Only smooth-scroll to anchors that are within the current active page
    document.querySelectorAll('a[href^="#"]:not([href="#"]):not([href^="#/"])').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.length > 1) {
                const target = document.querySelector(href);
                if (target && target.closest('.app-page.active')) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

function initScrollAnimations() {
    // Keep all cards fully visible and interactive at all times
    document.querySelectorAll('.feature-card, .glass-card, .vendor-card, .expense-card, .vd-stat-card, .theme-concept-card, .cat-module-card').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.visibility = 'visible';
    });
}

// ═══════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${['success', 'error', 'info'].includes(type) ? type : 'info'}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${escapeHTML(message)}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ═══════════════════════════════════════════
// VENDOR COMPARISON SYSTEM
// ═══════════════════════════════════════════
function initVendorComparison() {
    const compareBtn = document.getElementById('btn-compare-vendors');
    const clearBtn = document.getElementById('btn-clear-vendor-compare');
    const modal = document.getElementById('vendor-compare-modal');
    const closeBtn = document.getElementById('vendor-compare-close');

    if (compareBtn) {
        compareBtn.addEventListener('click', openVendorComparisonModal);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            AppState.selectedVendorsForCompare = [];
            updateVendorCompareUI();
            const currentCat = document.querySelector('#vendor-category-filters .filter-chip.active')?.dataset.category || 'all';
            const filtered = currentCat === 'all' ? vendorsData : vendorsData.filter(v => v.category === currentCat);
            renderVendors(filtered);
            showToast('Vendor comparison cleared', 'info');
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }
}

function toggleVendorCompare(vendorId, isChecked) {
    if (isChecked) {
        if (AppState.selectedVendorsForCompare.length >= 4) {
            showToast('You can compare up to 4 vendors at a time', 'warning');
            updateVendorCompareUI();
            return;
        }
        if (!AppState.selectedVendorsForCompare.includes(vendorId)) {
            AppState.selectedVendorsForCompare.push(vendorId);
        }
    } else {
        AppState.selectedVendorsForCompare = AppState.selectedVendorsForCompare.filter(id => id !== vendorId);
    }
    updateVendorCompareUI();
}

function updateVendorCompareUI() {
    const count = AppState.selectedVendorsForCompare.length;
    const badge = document.getElementById('compare-count-badge');
    const compareBtn = document.getElementById('btn-compare-vendors');
    const clearBtn = document.getElementById('btn-clear-vendor-compare');

    if (badge) badge.textContent = count;
    if (compareBtn) {
        compareBtn.disabled = count < 2;
        if (count >= 2) {
            compareBtn.classList.add('pulse');
        } else {
            compareBtn.classList.remove('pulse');
        }
    }
    if (clearBtn) {
        clearBtn.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

function openVendorComparisonModal() {
    const selectedIds = AppState.selectedVendorsForCompare;
    if (selectedIds.length < 2) {
        showToast('Please select at least 2 vendors to compare', 'info');
        return;
    }

    const vendors = vendorsData.filter(v => selectedIds.includes(v.id));
    const container = document.getElementById('vendor-compare-container');
    const modal = document.getElementById('vendor-compare-modal');

    container.innerHTML = `
        <table class="compare-table">
            <thead>
                <tr>
                    <th>Attributes</th>
                    ${vendors.map(v => `
                        <th>
                            <div class="compare-vendor-header">
                                <span class="vendor-badge ${v.badge}">${v.badge === 'verified' ? '✓ Verified' : '⭐ Featured'}</span>
                                <h4>${v.name}</h4>
                                <span style="font-size:0.75rem;color:var(--text-muted);">${v.category.toUpperCase()} • ${v.city}</span>
                            </div>
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Rating & Reviews</td>
                    ${vendors.map(v => `
                        <td><strong>⭐ ${v.rating}</strong> <small style="color:var(--text-muted)">(${v.reviews} reviews)</small></td>
                    `).join('')}
                </tr>
                <tr>
                    <td>Price Range</td>
                    ${vendors.map(v => `
                        <td><strong style="color:var(--primary-light);">${v.price}</strong></td>
                    `).join('')}
                </tr>
                <tr>
                    <td>City / Service Area</td>
                    ${vendors.map(v => `
                        <td><i class="fas fa-location-dot"></i> ${v.city}</td>
                    `).join('')}
                </tr>
                <tr>
                    <td>Included Services</td>
                    ${vendors.map(v => `
                        <td>
                            <div style="display:flex;flex-wrap:wrap;gap:0.3rem;">
                                ${v.services.map(s => `<span style="font-size:0.7rem;padding:0.2rem 0.5rem;background:rgba(124,58,237,0.15);border-radius:var(--radius-sm);color:var(--primary-light);">${s}</span>`).join('')}
                            </div>
                        </td>
                    `).join('')}
                </tr>
                <tr>
                    <td>Overview</td>
                    ${vendors.map(v => `
                        <td style="font-size:0.8rem;color:var(--text-secondary);">${v.description}</td>
                    `).join('')}
                </tr>
                <tr>
                    <td>Booking Action</td>
                    ${vendors.map(v => `
                        <td>
                            <button class="btn btn-primary btn-sm btn-full" onclick="openBookingModal(${v.id}); document.getElementById('vendor-compare-modal').classList.remove('active');">
                                <i class="fas fa-calendar-check"></i> Book Now
                            </button>
                        </td>
                    `).join('')}
                </tr>
            </tbody>
        </table>
    `;

    modal.classList.add('active');
}

// ═══════════════════════════════════════════
// VENDOR BOOKING & QUOTE MODALS
// ═══════════════════════════════════════════
function initVendorModals() {
    const bookingModal = document.getElementById('vendor-booking-modal');
    const bookingClose = document.getElementById('vendor-booking-close');
    const bookingForm = document.getElementById('vendor-booking-form');

    const quoteModal = document.getElementById('vendor-quote-modal');
    const quoteClose = document.getElementById('vendor-quote-close');
    const quoteForm = document.getElementById('vendor-quote-form');

    if (bookingClose && bookingModal) {
        bookingClose.addEventListener('click', () => bookingModal.classList.remove('active'));
        bookingModal.addEventListener('click', (e) => {
            if (e.target === bookingModal) bookingModal.classList.remove('active');
        });
    }

    if (quoteClose && quoteModal) {
        quoteClose.addEventListener('click', () => quoteModal.classList.remove('active'));
        quoteModal.addEventListener('click', (e) => {
            if (e.target === quoteModal) quoteModal.classList.remove('active');
        });
    }

    // Booking form submit
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const vendorId = parseInt(document.getElementById('booking-vendor-id').value);
            const vendor = vendorsData.find(v => v.id === vendorId) || { name: 'Vendor' };
            const userName = document.getElementById('booking-user-name').value;
            const eventDate = document.getElementById('booking-event-date').value;
            const guests = document.getElementById('booking-guest-count').value;

            // Add booking task to organizer dashboard
            AppState.tasks.unshift({
                id: Date.now(),
                title: `Coordinate setup with ${vendor.name}`,
                priority: 'high',
                due: eventDate || new Date().toISOString().split('T')[0],
                assignee: userName,
                completed: false
            });
            renderTasks();
            updateProgress();

            // Add expense
            AppState.expenses.push({
                id: Date.now(),
                desc: `Estimated advance for ${vendor.name} (not paid)`,
                category: vendor.category || 'other',
                amount: 15000,
                status: 'pending'
            });
            renderExpenses();

            bookingModal.classList.remove('active');
            bookingForm.reset();
            showToast(`Demo booking saved for ${vendor.name}. Contact the vendor to confirm availability; no reservation has been made.`, 'success');
        });
    }

    // Quote form submit
    if (quoteForm) {
        quoteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const vendorId = parseInt(document.getElementById('quote-vendor-id').value);
            const vendor = vendorsData.find(v => v.id === vendorId) || { name: 'Vendor' };
            const contact = document.getElementById('quote-contact').value;

            quoteModal.classList.remove('active');
            quoteForm.reset();
            showToast(`Quote details prepared for ${vendor.name}. This demo does not send email or contact vendors.`, 'success');
        });
    }
}

function openBookingModal(vendorId) {
    const vendor = vendorsData.find(v => v.id === vendorId);
    if (!vendor) return;

    document.getElementById('booking-vendor-id').value = vendor.id;
    document.getElementById('booking-modal-title').innerHTML = `<i class="fas fa-calendar-check"></i> Book ${vendor.name}`;
    document.getElementById('booking-modal-subtitle').textContent = `${vendor.category.toUpperCase()} • ${vendor.city} • Price: ${vendor.price}`;
    document.getElementById('booking-estimated-price').textContent = vendor.price.split('-')[0] || '₹25,000';

    // Set default date 15 days ahead
    const defaultDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    const dateInput = document.getElementById('booking-event-date');
    if (dateInput) dateInput.value = defaultDate;

    document.getElementById('vendor-modal').classList.remove('active');
    document.getElementById('vendor-booking-modal').classList.add('active');
}

function openQuoteModal(vendorId) {
    const vendor = vendorsData.find(v => v.id === vendorId);
    if (!vendor) return;

    document.getElementById('quote-vendor-id').value = vendor.id;
    document.getElementById('quote-modal-title').innerHTML = `<i class="fas fa-file-invoice"></i> Request Quote from ${vendor.name}`;
    document.getElementById('quote-modal-subtitle').textContent = `${vendor.category.toUpperCase()} • ${vendor.city} • Verified Vendor`;

    document.getElementById('vendor-modal').classList.remove('active');
    document.getElementById('vendor-quote-modal').classList.add('active');
}

// ═══════════════════════════════════════════
// INTERACTIVE RSVP & DIGITAL QR PASS
// ═══════════════════════════════════════════
function initInteractiveRSVP() {
    const btnAccept = document.getElementById('btn-rsvp-accept');
    const btnDecline = document.getElementById('btn-rsvp-decline');
    const btnMaybe = document.getElementById('btn-rsvp-maybe');
    const btnViewQR = document.getElementById('btn-view-qr-pass');

    const rsvpModal = document.getElementById('rsvp-modal');
    const rsvpClose = document.getElementById('rsvp-modal-close');
    const rsvpForm = document.getElementById('interactive-rsvp-form');

    const qrPassModal = document.getElementById('qr-pass-modal');
    const qrPassClose = document.getElementById('qr-pass-modal-close');
    const btnPrintPass = document.getElementById('btn-print-pass');
    const btnSharePass = document.getElementById('btn-share-pass-wa');

    if (btnAccept) btnAccept.addEventListener('click', () => openRSVPModal('accepted'));
    if (btnDecline) btnDecline.addEventListener('click', () => openRSVPModal('declined'));
    if (btnMaybe) btnMaybe.addEventListener('click', () => openRSVPModal('maybe'));
    if (btnViewQR) btnViewQR.addEventListener('click', () => openQREntryPassModal());

    if (rsvpClose && rsvpModal) {
        rsvpClose.addEventListener('click', () => rsvpModal.classList.remove('active'));
        rsvpModal.addEventListener('click', (e) => {
            if (e.target === rsvpModal) rsvpModal.classList.remove('active');
        });
    }

    if (qrPassClose && qrPassModal) {
        qrPassClose.addEventListener('click', () => qrPassModal.classList.remove('active'));
        qrPassModal.addEventListener('click', (e) => {
            if (e.target === qrPassModal) qrPassModal.classList.remove('active');
        });
    }

    if (rsvpForm) {
        rsvpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('rsvp-guest-name').value;
            const phone = document.getElementById('rsvp-guest-phone').value;
            const count = parseInt(document.getElementById('rsvp-guest-count').value, 10) || 1;
            const status = document.getElementById('rsvp-status-input').value;

            const newGuest = {
                id: Date.now(),
                name: name,
                phone: phone,
                email: '',
                group: 'friends',
                rsvp: status,
                table: status === 'accepted' ? Math.floor(Math.random() * 4) + 1 : 0,
                checkedIn: false
            };

            AppState.guests.unshift(newGuest);
            renderGuestTable();
            renderSeatingChart();
            updateRSVPTracker();

            rsvpModal.classList.remove('active');
            rsvpForm.reset();

            if (status === 'accepted') {
                openQREntryPassModal(newGuest);
                showToast(`RSVP Confirmed for ${name}! Generating QR Pass 🎉`, 'success');
            } else {
                showToast(`RSVP response recorded (${status})!`, 'info');
            }
        });
    }

    if (btnPrintPass) {
        btnPrintPass.addEventListener('click', () => {
            window.print();
        });
    }

    if (btnSharePass) {
        btnSharePass.addEventListener('click', () => {
            const guestName = document.getElementById('pass-guest-name').textContent;
            const eventName = document.getElementById('pass-event-title').textContent;
            const text = encodeURIComponent(`🎉 Digital Entry Pass for ${guestName} to attend ${eventName}!\nShow your QR code pass at reception.`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
        });
    }
}

function openRSVPModal(status) {
    const rsvpModal = document.getElementById('rsvp-modal');
    document.getElementById('rsvp-status-input').value = status;
    const titleMap = {
        accepted: '🎉 Great! Confirm Your Attendance',
        declined: '🙏 Sorry you can\'t make it!',
        maybe: '🤔 Tentative Attendance'
    };
    const iconMap = {
        accepted: '<i class="fas fa-circle-check" style="color:var(--success)"></i>',
        declined: '<i class="fas fa-circle-xmark" style="color:var(--danger)"></i>',
        maybe: '<i class="fas fa-circle-question" style="color:var(--warning)"></i>'
    };
    document.getElementById('rsvp-modal-title').textContent = titleMap[status] || 'RSVP for Celebration';
    document.getElementById('rsvp-modal-icon').innerHTML = iconMap[status] || '<i class="fas fa-envelope"></i>';
    rsvpModal.classList.add('active');
}

function openQREntryPassModal(guest) {
    guest = guest || AppState.guests[0] || { name: 'Rahul Sharma', table: 1 };
    const modal = document.getElementById('qr-pass-modal');

    document.getElementById('pass-guest-name').textContent = guest.name;
    document.getElementById('pass-table-text').textContent = guest.table ? `Table #${guest.table}` : 'General Admission';
    document.getElementById('pass-code-text').textContent = `PASS-#CP-${Math.floor(10000 + Math.random() * 90000)}`;

    const passEventTitle = document.getElementById('inv-preview-event')?.textContent || 'Celebration Event';
    document.getElementById('pass-event-title').textContent = passEventTitle;

    const passDate = document.getElementById('inv-preview-date')?.textContent || 'Nov 15, 2026';
    document.getElementById('pass-date-text').textContent = passDate;

    const passVenue = document.getElementById('inv-preview-venue')?.textContent || 'Grand Palace Banquet Hall';
    document.getElementById('pass-venue-text').textContent = passVenue;

    const canvas = document.getElementById('pass-qr-canvas');
    if (canvas) {
        drawCustomQR(canvas, `CP-PASS-${guest.id}-${guest.name}`);
    }

    modal.classList.add('active');
}

function updateRSVPTracker() {
    const accepted = AppState.guests.filter(g => g.rsvp === 'accepted').length;
    const declined = AppState.guests.filter(g => g.rsvp === 'declined').length;
    const pending = AppState.guests.filter(g => g.rsvp === 'pending').length;
    const total = accepted + declined + pending || 1;

    const accEl = document.querySelector('.rsvp-stat.accepted .rsvp-count');
    const decEl = document.querySelector('.rsvp-stat.declined .rsvp-count');
    const penEl = document.querySelector('.rsvp-stat.pending .rsvp-count');

    if (accEl) accEl.textContent = accepted;
    if (decEl) decEl.textContent = declined;
    if (penEl) penEl.textContent = pending;

    const accBar = document.querySelector('.rsvp-bar.accepted');
    const decBar = document.querySelector('.rsvp-bar.declined');
    const penBar = document.querySelector('.rsvp-bar.pending');

    if (accBar) accBar.style.width = `${(accepted / total) * 100}%`;
    if (decBar) decBar.style.width = `${(declined / total) * 100}%`;
    if (penBar) penBar.style.width = `${(pending / total) * 100}%`;
}

function drawCustomQR(canvas, dataText) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    const code = qrcode(0, 'M');
    code.addData(String(dataText).slice(0, 500)); code.make();
    const count = code.getModuleCount(), margin = 4, scale = 4;
    canvas.width = canvas.height = (count + margin * 2) * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) {
        if (code.isDark(row, col)) ctx.fillRect((col + margin) * scale, (row + margin) * scale, scale, scale);
    }
}

function escapeCalendarText(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

// ═══════════════════════════════════════════
// GOOGLE CALENDAR AUTOMATIC SCHEDULING
// ═══════════════════════════════════════════
function initGoogleCalendarIntegration() {
    const syncAllBtn = document.getElementById('sync-all-gcal-btn');
    const exportIcsBtn = document.getElementById('export-ics-btn');
    const syncTimelineBtn = document.getElementById('sync-timeline-gcal-btn');

    if (syncAllBtn) {
        syncAllBtn.addEventListener('click', syncAllTasksToGoogleCalendar);
    }

    if (exportIcsBtn) {
        exportIcsBtn.addEventListener('click', downloadICSFile);
    }

    if (syncTimelineBtn) {
        syncTimelineBtn.addEventListener('click', () => {
            const eventTitle = document.getElementById('inv-preview-event')?.textContent || 'Celebration Event';
            const eventDate = document.getElementById('inv-date')?.value || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
            const startD = new Date(`${eventDate}T18:00:00`);
            const endD = new Date(`${eventDate}T22:00:00`);

            const gcalUrl = createGoogleCalendarUrl(
                `🎉 ${eventTitle}`,
                `Full event timeline:\n18:00 Guest Arrival\n19:00 Cake Ceremony\n20:30 Dinner Buffet\n22:00 Farewell`,
                document.getElementById('inv-venue')?.value || 'Banquet Hall',
                startD,
                endD
            );
            window.open(gcalUrl, '_blank');
            showToast('Opening Google Calendar for event timeline! 📅', 'success');
        });
    }
}

function createGoogleCalendarUrl(title, details, location, startDate, endDate) {
    const formatGCalDate = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const startStr = formatGCalDate(startDate);
    const endStr = formatGCalDate(endDate);
    const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    return `${baseUrl}&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
}

function syncTaskToGoogleCalendar(taskId) {
    const task = AppState.tasks.find(t => t.id === taskId);
    if (!task) return;

    const dueDate = task.due ? new Date(task.due) : new Date(Date.now() + 7 * 86400000);
    const endDate = new Date(dueDate.getTime() + 60 * 60 * 1000);

    const gcalUrl = createGoogleCalendarUrl(
        `CelebriPlan: ${task.title}`,
        `Task for upcoming celebration. Assigned to: ${task.assignee}. Priority: ${task.priority.toUpperCase()}`,
        "Celebration Event Venue",
        dueDate,
        endDate
    );

    window.open(gcalUrl, '_blank');
    showToast(`Opening Google Calendar for "${task.title}" 📅`, 'info');
}

function syncAllTasksToGoogleCalendar() {
    showToast('Opening one task in Google Calendar and downloading all tasks as an ICS file. Import the file to add the full list.', 'info');
    // Open primary milestone in Google Calendar & provide .ICS export
    if (AppState.tasks.length > 0) {
        syncTaskToGoogleCalendar(AppState.tasks[0].id);
    }
    setTimeout(downloadICSFile, 1000);
}

function downloadICSFile() {
    let icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//CelebriPlan//Event Planning Engine//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];

    AppState.tasks.forEach((t, i) => {
        const dueDate = t.due ? new Date(t.due) : new Date(Date.now() + (i + 1) * 86400000);
        const formatICS = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const start = formatICS(dueDate);
        const end = formatICS(new Date(dueDate.getTime() + 3600000));
        icsLines.push('BEGIN:VEVENT');
        icsLines.push(`UID:task-${t.id}-${Date.now()}@celebriplan.com`);
        icsLines.push(`DTSTAMP:${formatICS(new Date())}`);
        icsLines.push(`DTSTART:${start}`);
        icsLines.push(`DTEND:${end}`);
        icsLines.push(`SUMMARY:CelebriPlan: ${escapeCalendarText(t.title)}`);
        icsLines.push(`DESCRIPTION:Assigned to: ${escapeCalendarText(t.assignee)} | Priority: ${t.priority}`);
        icsLines.push(`STATUS:CONFIRMED`);
        icsLines.push('END:VEVENT');
    });

    icsLines.push('END:VCALENDAR');
    const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'celebriplan-tasks.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded celebriplan-tasks.ics for Google Calendar! 📥', 'success');
}

// ═══════════════════════════════════════════
// Keyboard shortcut for modals and chatbot
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const chatWin = document.getElementById('chatbot-window');
        if (chatWin) chatWin.classList.remove('active');
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
});

