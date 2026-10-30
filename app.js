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
    eventBudget: 50000,
    eventTimeline: [],
    eventDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
};

// ─── Initialization ───
let eventStorageReady = false;
let eventSaveTimer;
let eventStorageWarningShown = false;
function saveEvent() {
    if (!eventStorageReady) return;
    try {
        CelebrationData.save(localStorage,{version:1,budget:AppState.eventBudget,timeline:AppState.eventTimeline,guests:AppState.guests,tasks:AppState.tasks,expenses:AppState.expenses});
        const status = document.getElementById('saved-event-status');
        if (status) status.textContent = 'Event saved on this device';
    } catch {
        const status = document.getElementById('saved-event-status');
        if (status) status.textContent = 'This session only — device storage is unavailable';
        if (!eventStorageWarningShown) { eventStorageWarningShown = true; showToast('Device storage is unavailable. Changes will last for this session only.', 'info'); }
    }
}
function scheduleEventSave() {
    if (!eventStorageReady) return;
    clearTimeout(eventSaveTimer);
    eventSaveTimer = setTimeout(saveEvent,150);
}
function initEventPersistence() {
    let saved = null;
    try { saved = CelebrationData.load(localStorage); } catch { /* Browser may block storage. */ }
    if (saved) {
        AppState.guests=saved.guests; AppState.tasks=saved.tasks; AppState.expenses=saved.expenses; AppState.eventBudget=saved.budget; AppState.eventTimeline=saved.timeline;
        renderGuestTable(); renderSeatingChart(); renderTasks(); renderExpenses(); renderTimeline(); updateProgress(); updateRSVPTracker();
    }
    eventStorageReady = true;
    const header = document.querySelector('#dashboard .section-header');
    const status = document.createElement('p'); status.id='saved-event-status'; status.className='section-subtitle';
    header.appendChild(status);
    const reset = document.createElement('button'); reset.type='button'; reset.className='btn btn-outline btn-sm'; reset.textContent='Clear saved event';
    reset.addEventListener('click',()=>{
        if (!window.confirm('Clear the saved event on this device and restore demo data?')) return;
        eventStorageReady=false; clearTimeout(eventSaveTimer);
        try { localStorage.removeItem(CelebrationData.KEY); window.location.reload(); }
        catch { eventStorageReady=true; showToast('Device storage could not be cleared', 'error'); }
    });
    header.appendChild(reset);
    window.addEventListener('pagehide',saveEvent);
    saveEvent();
}

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
    initChatbot();
    initThemeToggle();
    initSmoothScroll();
    initFooterLinks();
    initAccessibility();
    initEventPersistence();
    // Run initial budget calculation
    calculateBudget();
});

// ═══════════════════════════════════════════
// MULTI-PAGE ROUTER & NAVIGATION
// ═══════════════════════════════════════════
const VALID_PAGES = Object.freeze([
    'home', 'ai-planner', 'budget-calculator', 'vendor-marketplace',
    'invitations', 'venue-3d', 'guest-management', 'expense-tracker',
    'dashboard', 'vendor-dashboard', 'theme-generator'
]);
const PAGE_FEATURES = {
    'venue-3d': () => import('./features/venue.mjs'),
    'vendor-dashboard': () => import('./features/vendor-dashboard.mjs'),
    'theme-generator': () => import('./features/themes.mjs'),
};
const featureLoads = new Map();
let activeRoute = null;
function loadPageFeature(pageName) {
    if (!PAGE_FEATURES[pageName]) return;
    const page = document.getElementById(`page-${pageName}`);
    if (!featureLoads.has(pageName)) {
        page.setAttribute('aria-busy', 'true');
        featureLoads.set(pageName, PAGE_FEATURES[pageName]().then(feature => {
            feature.initialize({ showToast });
            page.dataset.ready = 'true';
        }).catch(() => {
            showToast('This feature could not load. Reload the page to try again.', 'error');
        }).finally(() => page.setAttribute('aria-busy', 'false')));
    }
    featureLoads.get(pageName).then(() => {
        if (activeRoute === 'venue-3d') {
            window.redrawVenue3D?.();
            window.startVenueAnimation?.();
        }
    });
}
function navigateToPage(pageName) {
    if (!pageName || pageName === '#' || pageName === '') pageName = 'home';
    pageName = pageName.replace(/^#\/?/, '').replace(/\/$/, '');


    if (!VALID_PAGES.includes(pageName)) {
        pageName = 'home';
    }

    if (activeRoute === pageName) return;
    activeRoute = pageName;
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
    loadPageFeature(pageName);
    window.refreshCountdown?.();
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


    // Universal click delegate for all page navigations (buttons, data-page, footer & hero anchors)
    document.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        // Navigation has one delegated handler, including nested card buttons.
        const targetBtn = e.target.closest('[data-page]');
        if (targetBtn) {
            const page = targetBtn.dataset.page;
            if (page) {
                e.preventDefault();
                navigateToPage(page);
                document.getElementById('nav-links').classList.remove('active');
                const menu = document.getElementById('nav-hamburger');
                menu.classList.remove('active');
                menu.setAttribute('aria-expanded', 'false');
                return;
            }
        }

        // 3. Anchor links (e.g. footer links, hero CTAs, navbar hrefs)
        const anchor = e.target.closest('a[href]');
        if (anchor) {
            const href = anchor.getAttribute('href');
            if (href) {
                const cleanHref = href.replace(/^#\/?/, '').replace(/\/$/, '');
                if (VALID_PAGES.includes(cleanHref)) {
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
    }, { passive: true });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.focus();
        }
    });
    // Hamburger toggle for mobile
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', String(navLinks.classList.contains('active')));
        });
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.textContent = target.toLocaleString();
        return;
    }
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
            const minutes = Math.round((startHour + i * activityDuration) * 60) % 1440;
            timeline.push({
                start: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
                activity
            });
        });

        // Generate tasks
        const baseTasks = [
            { task: `Book ${budgetCategory.toLowerCase()} venue in ${city}`, priority: 'high', deadline: '2 weeks before' },
            { task: `Finalize ${food === 'veg' ? 'vegetarian' : food === 'nonveg' ? 'non-veg' : food === 'jain' ? 'Jain' : 'multi-cuisine'} menu for ${guests} guests`, priority: 'high', deadline: '10 days before' },
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

        let plan = AIPlanner.generatePlan(input);
        plan.mode = 'rules';
        const submit = document.getElementById('generate-plan-btn');
        submit.disabled = true;
        resultSection.setAttribute('aria-busy', 'true');
        try {
            const response = await fetch('/api/ai/plan', {
                method:'POST', headers:{'Content-Type':'application/json'},
                signal:AbortSignal.timeout(25000),
                body:JSON.stringify({...input,durationHours:input.duration}),
            });
            if (!response.ok) throw new Error('Planner unavailable');
            const output = await response.json();
            if (output.mode === 'generative') {
                plan = {...plan,...output,tasks:output.tasks.map(task => ({task,priority:'high'}))};
            } else plan.notice = output.notice || 'Showing a built-in plan.';
        } catch {
            plan.notice = 'Personalised AI is unavailable. Showing a built-in plan.';
        } finally {
            submit.disabled = false;
            resultSection.setAttribute('aria-busy', 'false');
        }
        plan.rawType = input.type;
        plan.rawTheme = input.theme;
        renderPlanResult(plan, resultContainer);
        showToast(plan.mode === 'generative' ? 'Personalised Gemini plan generated! 🎉' : 'Built-in plan ready. AI suggestions are currently unavailable.', 'info');
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

    // Apply exactly the plan shown to the user; never recompute a different
    // budget, checklist or timeline when moving to the dashboard.
    AppState.dashboardPlan = {
        title: plan.title,
        budget: plan.budget,
        tasks: plan.tasks.map(item => item.task),
        timeline: plan.timeline
    };
    container.innerHTML = `
        <p class="plan-source" role="status">${plan.mode === 'generative' ? 'Personalised with Google Gemini' : 'Built-in planning mode'}${plan.notice ? ` — ${escapeHTML(plan.notice)}` : ''}</p>
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
                        <span class="timeline-time">${escapeHTML(item.start)}</span>
                        <span class="timeline-activity">${escapeHTML(item.activity)}</span>
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
                        <span>${escapeHTML(d)}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        ${plan.foodMenu?.length ? `<div class="plan-section"><h3>Suggested Menu</h3><ul>${plan.foodMenu.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul></div>` : ''}
        <div class="plan-section">
            <h3><i class="fas fa-lightbulb"></i> Planning Recommendations</h3>
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
    AppState.eventBudget = AppState.currentPlan?.totalBudget || 50000;
    AppState.eventTimeline = AppState.dashboardPlan.timeline || [];
    renderTimeline();

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
            category: cat,
            amount: amount,
            status: 'pending'
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
    const file = document.getElementById('guest-csv-file');
    document.getElementById('import-csv').addEventListener('click', () => file.click());
    file.addEventListener('change', async () => {
        try {
            const selected = file.files[0];
            if (!selected) return;
            if (selected.size > 1048576) throw new Error('Please import a CSV smaller than 1 MB');
            const guests = CelebrationData.parseCSV(await selected.text());
            const existing = new Set(AppState.guests.map(g => `${g.name.toLowerCase()}|${g.phone}`));
            const fresh = guests.filter(g => {
                const key = `${g.name.toLowerCase()}|${g.phone}`;
                if (existing.has(key)) return false;
                existing.add(key); return true;
            });
            if (AppState.guests.length + fresh.length > 5000) throw new Error('Guest limit is 5000 per event');
            AppState.guests.push(...fresh);
            renderGuestTable(); renderSeatingChart(); updateRSVPTracker();
            showToast(`Imported ${fresh.length} guests; ${guests.length - fresh.length} duplicates skipped`, 'success');
        } catch (error) { showToast(error.message, 'error'); }
        finally { file.value = ''; }
    });
    document.getElementById('export-guests-csv').addEventListener('click', () => {
        downloadBlob(new Blob([CelebrationData.guestCSV(AppState.guests)],{type:'text/csv;charset=utf-8'}),'celebriplan-guests.csv');
    });
}

function renderGuestTable(filter = 'all') {
    scheduleEventSave();
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
    scheduleEventSave();
    const container = document.getElementById('expense-items');
    const totalBudget = AppState.eventBudget;
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
    scheduleEventSave();
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
    const timelineData = AppState.eventTimeline.length ? AppState.eventTimeline.map(item=>({time:item.start,title:item.activity,desc:''})) : [
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
            <span class="tl-time">${escapeHTML(t.time)}</span>
            <span class="tl-title">${escapeHTML(t.title)}</span>
            <span class="tl-desc">${escapeHTML(t.desc)}</span>
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

    let timer;
    window.refreshCountdown = () => {
        clearInterval(timer);
        if (!document.hidden && activeRoute === 'dashboard') {
            update();
            timer = setInterval(update, 1000);
        }
    };
    document.addEventListener('visibilitychange', window.refreshCountdown);
    window.refreshCountdown();
}

// ═══════════════════════════════════════════
// VENDOR DASHBOARD
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// AI THEME GENERATOR
// ═══════════════════════════════════════════
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

async function sendChatMessage() {
    const input = document.getElementById('chatbot-input');
    const send = document.getElementById('chatbot-send');
    const message = input.value.trim();
    if (!message || send.disabled) return;
    if (message.length > 2000) return showToast('Please keep the message under 2000 characters', 'error');

    addChatMessage('user', message);
    input.value = '';

    // Show typing indicator
    const typingId = addChatMessage('bot', '<div class="loading-dots" style="display:flex;gap:4px;"><span style="width:8px;height:8px;background:var(--primary-light);border-radius:50%;animation:pulse 1s infinite;"></span><span style="width:8px;height:8px;background:var(--primary-light);border-radius:50%;animation:pulse 1s 0.2s infinite;"></span><span style="width:8px;height:8px;background:var(--primary-light);border-radius:50%;animation:pulse 1s 0.4s infinite;"></span></div>', true);

    send.disabled = true;
    try {
        const response = await fetch('/api/ai/chat', {
            method:'POST',headers:{'Content-Type':'application/json'},
            signal:AbortSignal.timeout(25000),body:JSON.stringify({message}),
        });
        if (!response.ok) throw new Error('AI unavailable');
        const output = await response.json();
        if (typeof output.reply !== 'string' || output.reply.length > 4000) throw new Error('Invalid reply');
        addChatMessage('bot', escapeHTML(output.reply));
    } catch {
        addChatMessage('bot', '<strong>Built-in guidance (Gemini unavailable):</strong><br>' + generateChatResponse(message));
    } finally {
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        send.disabled = false;
    }
}

function addChatMessage(type, content, isHtml = false) {
    const container = document.getElementById('chatbot-messages');
    const id = 'msg-' + crypto.randomUUID();
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
    const inputLimits={'event-city':120,'event-notes':2000,'guest-name':120,'guest-phone':40,'guest-email':160,'task-title':500,'task-assignee':160,'expense-desc':500,'rsvp-guest-name':120,'rsvp-guest-phone':40};
    for (const [id,limit] of Object.entries(inputLimits)) document.getElementById(id)?.setAttribute('maxlength',String(limit));
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

// ═══════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════
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

