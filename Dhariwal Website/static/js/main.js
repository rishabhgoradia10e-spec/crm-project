/**
 * Dhariwal Securities - Premium Corporate Website JS
 * Orchestrates:
 * - Live Ticker updates
 * - SIP Wealth Planner & Brokerage Calculator
 * - Page Nav, Hamburger toggles
 * - Modals for bios
 * - Search filter for Research archive
 * - Contact Form Handler
 */

document.addEventListener('DOMContentLoaded', () => {
  initGlobalHeader();
  initLiveTicker();
  initCalculators();
  initServicesTabs();
  initResearchFilters();
  initTeamModals();
  initContactForm();
});

/* ==========================================
   GLOBAL HEADER & MENU NAVIGATION
   ========================================== */
function initGlobalHeader() {
  const header = document.querySelector('header');
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  // Sticky Header scroll styling
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile Menu Toggle
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close mobile menu on link click
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }
}

/* ==========================================
   LIVE MOCK STOCK TICKER SYSTEM
   ========================================== */
function initLiveTicker() {
  const tickerContainer = document.querySelector('.ticker-scroll');
  if (!tickerContainer) return;

  // Mock list of Indian market indices/stocks
  const tickerData = [
    { name: 'NIFTY 50', val: 24320.50, chg: 145.20, pct: 0.60 },
    { name: 'SENSEX', val: 79895.10, chg: 480.60, pct: 0.61 },
    { name: 'NIFTY BANK', val: 52410.80, chg: -110.35, pct: -0.21 },
    { name: 'DHARIWAL EQ', val: 1245.50, chg: 38.40, pct: 3.18 },
    { name: 'RELIANCE', val: 3124.00, chg: 12.50, pct: 0.40 },
    { name: 'HDFC BANK', val: 1726.80, chg: -8.45, pct: -0.49 },
    { name: 'TCS', val: 3915.20, chg: 45.10, pct: 1.17 },
    { name: 'INFOSYS', val: 1640.40, chg: -4.30, pct: -0.26 },
    { name: 'ICICI BANK', val: 1215.10, chg: 18.25, pct: 1.52 },
    { name: 'NIFTY NEXT 50', val: 72150.30, chg: 320.70, pct: 0.45 }
  ];

  // Render original items
  renderTicker(tickerData, tickerContainer);

  // Live Updates Simulation
  setInterval(() => {
    tickerData.forEach(item => {
      // Simulate random fluctuations
      const factor = (Math.random() - 0.48) * 0.1; // Slight positive bias
      const delta = item.val * (factor / 100);
      item.val += delta;
      item.chg += delta;
      item.pct = (item.chg / (item.val - item.chg)) * 100;
    });
    
    // Clear and re-render
    tickerContainer.innerHTML = '';
    renderTicker(tickerData, tickerContainer);
  }, 4000);
}

function renderTicker(data, container) {
  data.forEach(item => {
    const isUp = item.chg >= 0;
    const arrow = isUp ? '▲' : '▼';
    const sign = isUp ? '+' : '';
    const stateClass = isUp ? 'up' : 'down';
    
    const tickerItem = document.createElement('div');
    tickerItem.className = 'ticker-item';
    tickerItem.innerHTML = `
      <span class="ticker-name">${item.name}</span>
      <span class="ticker-value">${item.val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      <span class="ticker-change ${stateClass}">${arrow} ${sign}${item.chg.toFixed(2)} (${sign}${item.pct.toFixed(2)}%)</span>
    `;
    container.appendChild(tickerItem);
  });
}

/* ==========================================
   INTERACTIVE WEALTH CALCULATORS
   ========================================== */
function initCalculators() {
  const calcTabs = document.querySelectorAll('.calc-tab-btn');
  const calcWrappers = document.querySelectorAll('.calc-wrapper');

  // Tab switching
  calcTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      calcTabs.forEach(t => t.classList.remove('active'));
      calcWrappers.forEach(w => w.classList.remove('active'));

      tab.classList.add('active');
      const calcId = tab.dataset.calc;
      const targetWrapper = document.getElementById(`${calcId}-calc-wrapper`);
      if (targetWrapper) targetWrapper.classList.add('active');
    });
  });

  // 1. SIP Calculator Bindings
  const sipMonthly = document.getElementById('sip-monthly');
  const sipReturn = document.getElementById('sip-return');
  const sipYears = document.getElementById('sip-years');

  const sipMonthlyVal = document.getElementById('sip-monthly-val');
  const sipReturnVal = document.getElementById('sip-return-val');
  const sipYearsVal = document.getElementById('sip-years-val');

  if (sipMonthly && sipReturn && sipYears) {
    const inputs = [sipMonthly, sipReturn, sipYears];
    
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        // Update display text
        sipMonthlyVal.textContent = `₹${parseInt(sipMonthly.value).toLocaleString('en-IN')}`;
        sipReturnVal.textContent = `${sipReturn.value}%`;
        sipYearsVal.textContent = `${sipYears.value} Yr${sipYears.value > 1 ? 's' : ''}`;
        
        calculateSIP();
      });
    });

    // Initial calculation
    calculateSIP();
  }

  function calculateSIP() {
    const P = parseFloat(sipMonthly.value);
    const expectedReturn = parseFloat(sipReturn.value);
    const years = parseFloat(sipYears.value);

    const i = (expectedReturn / 100) / 12; // Monthly rate
    const n = years * 12; // Monthly periods

    // SIP Formula: M = P * [((1 + i)^n - 1) / i] * (1 + i)
    const totalValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const investedAmount = P * n;
    const estReturns = totalValue - investedAmount;

    // Update UI elements
    document.getElementById('sip-est-invested').textContent = formatCurrency(investedAmount);
    document.getElementById('sip-est-returns').textContent = formatCurrency(estReturns);
    document.getElementById('sip-total-wealth').textContent = formatCurrency(totalValue);
  }

  // 2. Brokerage Calculator Bindings
  const brokerageType = document.getElementById('brokerage-type');
  const brokerageAsset = document.getElementById('brokerage-asset');
  const brokerageTradeVal = document.getElementById('brokerage-trade-val');

  if (brokerageType && brokerageAsset && brokerageTradeVal) {
    const inputs = [brokerageType, brokerageAsset, brokerageTradeVal];
    inputs.forEach(input => {
      input.addEventListener('change', calculateBrokerage);
      input.addEventListener('input', calculateBrokerage);
    });

    // Initial calculation
    calculateBrokerage();
  }

  function calculateBrokerage() {
    const asset = brokerageAsset.value;
    const val = parseFloat(brokerageTradeVal.value) || 0;
    
    let brokerageRate = 0;
    let maxBrokerage = 20; // Flat fee cap standard (e.g. ₹20 per trade)
    let sttRate = 0; // Securities Transaction Tax
    
    // Structure like premium digital discount/full-service hybrids (similar to HDFC Sky/Securities premium plans)
    if (asset === 'delivery') {
      brokerageRate = 0.001; // 0.1% for premium HDFC/corporate high-wealth tier
      sttRate = 0.001;      // 0.1% on delivery buy/sell
    } else if (asset === 'intraday') {
      brokerageRate = 0.0002; // 0.02%
      sttRate = 0.00025;      // 0.025% on sell side
    } else if (asset === 'futures') {
      brokerageRate = 0.0002; // 0.02%
      sttRate = 0.0001;       // 0.01% on sell side
    }

    let calculatedBrokerage = val * brokerageRate;
    if (calculatedBrokerage > maxBrokerage) {
      calculatedBrokerage = maxBrokerage;
    }
    if (val === 0) calculatedBrokerage = 0;

    const gst = calculatedBrokerage * 0.18; // 18% GST on brokerage
    const stt = val * sttRate;
    const exchangeCharges = val * 0.0000345; // ~0.00345% Transaction charges
    const totalTaxes = gst + stt + exchangeCharges;
    const netTransactionCost = calculatedBrokerage + totalTaxes;

    document.getElementById('brokerage-est-fee').textContent = formatCurrency(calculatedBrokerage);
    document.getElementById('brokerage-est-tax').textContent = formatCurrency(totalTaxes);
    document.getElementById('brokerage-total').textContent = formatCurrency(netTransactionCost);
  }

  function formatCurrency(num) {
    if (isNaN(num) || num === null) return '₹0';
    return '₹' + Math.round(num).toLocaleString('en-IN');
  }
}

/* ==========================================
   SERVICES DETAILED TAB PANE TOGGLING
   ========================================== */
function initServicesTabs() {
  const serviceNavBtns = document.querySelectorAll('.service-nav-btn');
  const servicePanes = document.querySelectorAll('.service-pane-content');

  if (serviceNavBtns.length > 0 && servicePanes.length > 0) {
    serviceNavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        serviceNavBtns.forEach(b => b.classList.remove('active'));
        servicePanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const serviceId = btn.dataset.service;
        const targetPane = document.getElementById(`service-pane-${serviceId}`);
        if (targetPane) targetPane.classList.add('active');
      });
    });
  }
}

/* ==========================================
   RESEARCH ARCHIVE SEARCH & FILTER LOGIC
   ========================================== */
function initResearchFilters() {
  const searchInput = document.getElementById('research-search');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const archiveCards = document.querySelectorAll('.archive-card');

  if (!searchInput && filterBtns.length === 0) return;

  let activeCategory = 'all';
  let searchQuery = '';

  // Input Search Listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  // Filter Category Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      applyFilters();
    });
  });

  function applyFilters() {
    archiveCards.forEach(card => {
      const cardCategory = card.dataset.category;
      const title = card.querySelector('h3').textContent.toLowerCase();
      const desc = card.querySelector('p').textContent.toLowerCase();

      const matchesCategory = (activeCategory === 'all' || cardCategory === activeCategory);
      const matchesSearch = (title.includes(searchQuery) || desc.includes(searchQuery));

      if (matchesCategory && matchesSearch) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }
}

/* ==========================================
   EXECUTIVE TEAM BIO MODAL INTERACTION
   ========================================== */
function initTeamModals() {
  const teamCards = document.querySelectorAll('.team-card');
  const modalOverlay = document.querySelector('.modal-overlay');
  const modalClose = document.querySelector('.modal-close');
  
  if (!modalOverlay || teamCards.length === 0) return;

  const modalTitleName = modalOverlay.querySelector('.modal-title h3');
  const modalTitleRole = modalOverlay.querySelector('.modal-title p');
  const modalBody = modalOverlay.querySelector('.modal-body');
  const modalPhotoMock = modalOverlay.querySelector('.modal-photo-mock');

  // Hardcoded premium executive bios to avoid simple mockups
  const teamBios = {
    '1': {
      name: 'Rameshwar Dhariwal',
      role: 'Founder & Chairman',
      bio: 'Rameshwar Dhariwal is a veteran of the Indian capital markets with over 35 years of investment advisory and securities banking experience. Formerly serving on advisory committees of regional exchanges, he established Dhariwal Securities with a clear mandate of absolute integrity, institutional-grade equity intelligence, and premium wealth services for high-net-worth families.'
    },
    '2': {
      name: 'Dr. Aditi Dhariwal',
      role: 'Managing Director & Head of PMS',
      bio: 'Dr. Aditi Dhariwal holds a PhD in Financial Economics from London School of Economics and has served as a senior portfolio manager at marquee European funds. She drives the quant investment models and custom bespoke Portfolio Management Services (PMS) at Dhariwal, delivering consistent alpha relative to broad indexes.'
    },
    '3': {
      name: 'Vikram Malhotra',
      role: 'Chief Investment Officer (CIO)',
      bio: 'Vikram Malhotra possesses over 22 years of experience leading research and asset allocation desks across top-tier private wealth firms in Mumbai. He is the author of Dhariwal Securities weekly Market Pulse newsletters and manages the institutional equity broking relationships.'
    },
    '4': {
      name: 'Satish Shah',
      role: 'Compliance Officer',
      bio: 'Satish Shah has over 18 years of capital markets regulatory compliance experience. He oversees all exchange audits, trade operations surveillance, CDSL compliance, and SEBI SCORE grievance redressal channels to maintain the firm\'s pristine compliance record.'
    },
    '5': {
      name: 'Ananya Sen',
      role: 'Head of Private Wealth Advisory',
      bio: 'Ananya Sen has over 15 years of experience structuring bespoke estate planning and asset allocation blueprints for large family offices and high-net-worth client accounts. She specializes in corporate tax rebalancing and wealth preservation.'
    }
  };

  teamCards.forEach(card => {
    card.addEventListener('click', () => {
      const execId = card.dataset.execId;
      const data = teamBios[execId];
      if (!data) return;

      modalTitleName.textContent = data.name;
      modalTitleRole.textContent = data.role;
      modalBody.textContent = data.bio;
      modalPhotoMock.textContent = data.name.split(' ').map(n => n[0]).join('');

      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // Stop page scrolling
    });
  });

  // Close triggers
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* ==========================================
   CONTACT FORM SUBMISSION HANDLER
   ========================================== */
function initContactForm() {
  const contactForm = document.getElementById('corporate-contact-form');
  const successAlert = document.getElementById('success-msg-container');

  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Perform mock premium validation & action
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const phone = document.getElementById('contact-phone').value;
    const service = document.getElementById('contact-service').value;

    if (!name || !email || !phone) {
      alert('Please fill out all required fields.');
      return;
    }

    // Trigger mock loading on button (Premium details)
    const btn = contactForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'TRANSMITTING INQUIRY...';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;

      // Show custom premium success visual notification
      if (successAlert) {
        successAlert.innerHTML = `
          <strong>Inquiry Submitted Successfully.</strong><br>
          Thank you, ${name}. A Senior Wealth Executive has been assigned to your profile and will contact you at <strong>${phone}</strong> or <strong>${email}</strong> within 2 business hours regarding our <strong>${service.toUpperCase()}</strong> advisory services.
        `;
        successAlert.classList.add('show');
        
        // Scroll to success notification
        successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      contactForm.reset();
    }, 1500);
  });
}
