/**
 * Main Javascript for Hon. Haruna Iddrisu Website
 * Centralizes scroll effects, reveal animations, and interactive elements.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar-custom');
    const isNoScroll = navbar && navbar.classList.contains('navbar-no-scroll');

    if (navbar) {
        window.addEventListener('scroll', () => {
            if (isNoScroll) return; // Don't toggle classes if it should stay scrolled

            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
        
        // Check initial state (if page is refreshed while scrolled)
        if (window.scrollY > 50 || isNoScroll) {
            navbar.classList.add('scrolled');
        }
    }

    // 2. Reveal Animation Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // Start slightly before it hits the viewport
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-up').forEach(el => {
        revealObserver.observe(el);
    });

    // 3. Rolling Text Generation (for homepage cards)
    document.querySelectorAll('.rolling-text').forEach(el => {
        const text = el.getAttribute('data-text');
        if (text) {
            el.innerHTML = text.split('').map((char, i) => `
                <div class="rolling-text-letter">
                    <span class="letter-wrapper" style="--delay: ${i * 0.035}s">
                        <span>${char === ' ' ? '&nbsp;' : char}</span>
                        <span>${char === ' ' ? '&nbsp;' : char}</span>
                    </span>
                </div>
            `).join('');
        }
    });

});
