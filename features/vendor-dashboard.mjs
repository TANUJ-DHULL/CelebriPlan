export function initialize({ showToast } = {}) {
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
