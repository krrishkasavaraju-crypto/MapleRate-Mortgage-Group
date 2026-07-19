/**
 * MapleRate Mortgage Group - Main JavaScript
 * Handles: scroll animations, navbar, calculator, FAQ accordion, mobile menu, modal
 */

(function() {
    'use strict';

    // ===================== SCROLL ANIMATIONS =====================
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const animateObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-visible');
                animateObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll('[data-animate]');
        animatedElements.forEach(el => {
            // Check if element is already in viewport on load
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                // Small delay for natural feel
                setTimeout(() => {
                    el.classList.add('animate-visible');
                }, parseInt(el.dataset.delay || 0));
            } else {
                animateObserver.observe(el);
            }
        });
    }

    // ===================== NAVBAR =====================
    function initNavbar() {
        const navbar = document.getElementById('navbar');
        let lastScroll = 0;
        let ticking = false;

        function updateNavbar() {
            const scrollY = window.scrollY;

            if (scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            lastScroll = scrollY;
            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateNavbar);
                ticking = true;
            }
        }, { passive: true });
    }

    // ===================== MOBILE MENU =====================
    function initMobileMenu() {
        const toggle = document.getElementById('mobileMenuToggle');
        const navLinks = document.getElementById('navLinks');

        if (!toggle || !navLinks) return;

        toggle.addEventListener('click', () => {
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', !isExpanded);
            toggle.classList.toggle('active');
            navLinks.classList.toggle('active');

            // Prevent body scroll when menu is open
            document.body.style.overflow = isExpanded ? '' : 'hidden';
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                toggle.setAttribute('aria-expanded', 'false');
                toggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                toggle.setAttribute('aria-expanded', 'false');
                toggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // ===================== MORTGAGE CALCULATOR =====================
    function initCalculator() {
        const homePriceInput = document.getElementById('homePrice');
        const homePriceRange = document.getElementById('homePriceRange');
        const downPaymentInput = document.getElementById('downPayment');
        const downPaymentRange = document.getElementById('downPaymentRange');
        const interestRateInput = document.getElementById('interestRate');
        const amortizationSelect = document.getElementById('amortization');
        const monthlyPaymentEl = document.getElementById('monthlyPayment');
        const principalInterestEl = document.getElementById('principalInterest');
        const totalInterestEl = document.getElementById('totalInterest');
        const downPaymentPercentEl = document.getElementById('downPaymentPercent');
        const heroRateEl = document.getElementById('heroRate');
        const heroMonthlyEl = document.getElementById('heroMonthly');

        if (!homePriceInput) return;

        function formatCurrency(num) {
            return '$' + num.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        }

        function formatNumber(num) {
            return num.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        }

        function calculateMortgage() {
            const homePrice = parseFloat(homePriceInput.value) || 0;
            const downPayment = parseFloat(downPaymentInput.value) || 0;
            const rate = parseFloat(interestRateInput.value) || 0;
            const amortizationYears = parseInt(amortizationSelect.value) || 25;

            const loanAmount = Math.max(0, homePrice - downPayment);
            const monthlyRate = rate / 100 / 12;
            const numPayments = amortizationYears * 12;

            let monthlyPayment = 0;
            let totalInterest = 0;

            if (loanAmount > 0 && rate > 0) {
                monthlyPayment = loanAmount * 
                    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                    (Math.pow(1 + monthlyRate, numPayments) - 1);
                totalInterest = (monthlyPayment * numPayments) - loanAmount;
            } else if (loanAmount > 0) {
                monthlyPayment = loanAmount / numPayments;
            }

            // Update result with animation
            const newMonthly = Math.round(monthlyPayment);
            const currentMonthly = parseInt(monthlyPaymentEl.textContent.replace(/[^0-9]/g, '')) || 0;

            if (newMonthly !== currentMonthly) {
                monthlyPaymentEl.classList.add('updating');
                setTimeout(() => monthlyPaymentEl.classList.remove('updating'), 300);
            }

            monthlyPaymentEl.textContent = formatNumber(newMonthly);
            principalInterestEl.textContent = formatCurrency(newMonthly);
            totalInterestEl.textContent = formatCurrency(Math.round(totalInterest));

            // Update down payment percentage
            const downPercent = homePrice > 0 ? Math.round((downPayment / homePrice) * 100) : 0;
            downPaymentPercentEl.textContent = downPercent + '%';

            // Update hero card
            if (heroRateEl) {
                heroRateEl.textContent = rate.toFixed(2);
            }
            if (heroMonthlyEl) {
                heroMonthlyEl.textContent = formatCurrency(newMonthly);
            }
        }

        // Sync range sliders with number inputs
        function syncInputs(numberInput, rangeInput, min, max) {
            numberInput.addEventListener('input', () => {
                let val = parseInt(numberInput.value) || 0;
                val = Math.max(min, Math.min(max, val));
                rangeInput.value = val;
                calculateMortgage();
            });

            rangeInput.addEventListener('input', () => {
                numberInput.value = rangeInput.value;
                calculateMortgage();
            });
        }

        syncInputs(homePriceInput, homePriceRange, 50000, 5000000);
        syncInputs(downPaymentInput, downPaymentRange, 0, 1000000);

        interestRateInput.addEventListener('input', calculateMortgage);
        amortizationSelect.addEventListener('change', calculateMortgage);

        // Initial calculation
        calculateMortgage();
    }

    // ===================== FAQ ACCORDION =====================
    function initFAQ() {
        const faqItems = document.querySelectorAll('.faq-item');

        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');

            if (!question || !answer) return;

            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                // Close all other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherQuestion = otherItem.querySelector('.faq-question');
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        if (otherQuestion) otherQuestion.setAttribute('aria-expanded', 'false');
                        if (otherAnswer) otherAnswer.setAttribute('aria-hidden', 'true');
                    }
                });

                // Toggle current item
                item.classList.toggle('active');
                question.setAttribute('aria-expanded', !isActive);
                answer.setAttribute('aria-hidden', isActive);
            });
        });
    }

    // ===================== SMOOTH SCROLL =====================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const offsetTop = target.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ===================== MODAL =====================
    window.showContactModal = function() {
        const modal = document.getElementById('contactModal');
        if (modal) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';

            // Focus first input
            setTimeout(() => {
                const firstInput = modal.querySelector('input');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    };

    window.closeContactModal = function() {
        const modal = document.getElementById('contactModal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    };

    window.handleFormSubmit = function() {
        const modal = document.getElementById('contactModal');
        const formContent = modal.querySelector('.modal-content');

        // Simple success state
        formContent.innerHTML = `
            <div style="text-align: center; padding: 40px 0;">
                <div style="width: 64px; height: 64px; background: rgba(11, 61, 44, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: var(--color-primary);">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <h3 style="font-family: var(--font-heading); font-size: 24px; font-weight: 700; color: var(--color-text); margin-bottom: 12px;">Request Received!</h3>
                <p style="font-size: 15px; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 24px;">A mortgage advisor will reach out to you within 24 hours. Thank you for choosing MapleRate.</p>
                <button onclick="closeContactModal()" class="btn btn-primary" style="min-width: 160px;">Close</button>
            </div>
        `;
    };

    function initModal() {
        const modal = document.getElementById('contactModal');
        if (!modal) return;

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeContactModal();
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeContactModal();
            }
        });
    }

    // ===================== HERO RATE TICKER =====================
    function initHeroRateTicker() {
        const rateEl = document.getElementById('heroRate');
        if (!rateEl) return;

        // Subtle pulse animation for the rate number
        setInterval(() => {
            rateEl.style.opacity = '0.7';
            setTimeout(() => {
                rateEl.style.opacity = '1';
            }, 300);
        }, 5000);
    }

    // ===================== PARALLAX FLOATING CARDS =====================
    function initParallaxCards() {
        const floatCards = document.querySelectorAll('[data-float]');
        if (!floatCards.length) return;

        // Only on non-touch devices for performance
        if (window.matchMedia('(pointer: coarse)').matches) return;

        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    floatCards.forEach((card, index) => {
                        const speed = 0.05 + (index * 0.02);
                        const yOffset = scrollY * speed;
                        card.style.transform = `translateY(${yOffset}px)`;
                    });
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ===================== LAZY LOAD IMAGES =====================
    function initLazyLoad() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        if (!lazyImages.length) return;

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // ===================== PERFORMANCE: Debounce utility =====================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ===================== INITIALIZE =====================
    function init() {
        initScrollAnimations();
        initNavbar();
        initMobileMenu();
        initCalculator();
        initFAQ();
        initSmoothScroll();
        initModal();
        initHeroRateTicker();
        initParallaxCards();
        initLazyLoad();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-init animations on resize (for responsive layout changes)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Refresh any layout-dependent calculations
        }, 250);
    });

})();
