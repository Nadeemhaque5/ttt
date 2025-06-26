// script.js – SaveItBro Dowry Trend Estimator (Professional, Data-Informed)

// Regional dowry perception multipliers (example data, can be refined)
const REGION_FACTORS = {
  national: 1,
  punjab: 1.18,
  up: 1.15,
  kerala: 0.85,
  gujarat: 1.05,
  bengal: 0.95,
  tn: 0.9,
  maharashtra: 1.0,
  rajasthan: 1.12,
  other: 1.0
};

// Profession/Education/Asset values (in INR)
const FACTORS = {
  education: {
    '10th': 200000,
    '12th': 300000,
    'ba': 400000,
    'btech': 700000,
    'mba': 900000,
    'phd': 1000000,
    'ca': 1000000,
    'mbbs': 1000000,
    'iit': 1200000
  },
  employment: {
    unemployed: 0,
    private: 300000,
    govt: 1200000,
    psu: 1000000,
    abroad: 2500000
  },
  vehicle: {
    none: 0,
    bike: 200000,
    car: 500000,
    suv: 1000000
  },
  property: {
    city: 700000,
    agri: 400000,
    metro: 1200000
  },
  family: {
    joint: 200000,
    nuclear: 0,
    single: -200000
  },
  marital: {
    never: 0,
    divorced: -500000,
    widowed: -300000
  },
  location: {
    metro: 800000,
    tier1: 500000,
    tier2: 200000,
    rural: 0
  },
  noProperty: -1000000
};

const MAX_DOWRY = 15000000; // ₹1.5 Crore

// National/state averages for chart/insight (example data)
const STATE_AVERAGES = {
  national: 6500000,
  punjab: 8000000,
  up: 7500000,
  kerala: 4000000,
  gujarat: 6800000,
  bengal: 5000000,
  tn: 4500000,
  maharashtra: 6000000,
  rajasthan: 7200000,
  other: 6000000
};

function formatINR(num) {
  return '₹' + num.toLocaleString('en-IN');
}

function calculateDowry(data) {
  let score = 0;
  let breakdown = [];
  // Education
  score += FACTORS.education[data.qualification] || 0;
  breakdown.push(`+${formatINR(FACTORS.education[data.qualification] || 0)} for Education`);
  // Employment
  score += FACTORS.employment[data.employment] || 0;
  breakdown.push(`+${formatINR(FACTORS.employment[data.employment] || 0)} for Employment`);
  // Income (add 6x monthly income, capped at 6L)
  let income = Math.min((parseInt(data.income) || 0) * 6, 600000);
  score += income;
  breakdown.push(`+${formatINR(income)} for Income`);
  // Vehicle
  score += FACTORS.vehicle[data.vehicle] || 0;
  if (data.vehicle !== 'none') breakdown.push(`+${formatINR(FACTORS.vehicle[data.vehicle])} for Vehicle`);
  // Property
  let propertyScore = 0;
  if (data.property && data.property.length) {
    data.property.forEach(p => {
      if (p !== 'none') propertyScore += FACTORS.property[p] || 0;
    });
    if (data.property.includes('none') && propertyScore === 0) {
      propertyScore += FACTORS.noProperty;
      breakdown.push(`${formatINR(FACTORS.noProperty)} for No Property`);
    }
  }
  score += propertyScore;
  if (propertyScore > 0) breakdown.push(`+${formatINR(propertyScore)} for Property`);
  // Family
  score += FACTORS.family[data.family] || 0;
  if (FACTORS.family[data.family]) breakdown.push(`${FACTORS.family[data.family] > 0 ? '+' : ''}${formatINR(FACTORS.family[data.family])} for Family Type`);
  // Marital
  score += FACTORS.marital[data.marital] || 0;
  if (FACTORS.marital[data.marital]) breakdown.push(`${formatINR(FACTORS.marital[data.marital])} for Marital History`);
  // Location
  score += FACTORS.location[data.location] || 0;
  if (FACTORS.location[data.location]) breakdown.push(`+${formatINR(FACTORS.location[data.location])} for Location`);
  // Siblings (small deduction if more sisters than brothers)
  let sisters = parseInt(data.sisters) || 0;
  let brothers = parseInt(data.brothers) || 0;
  if (sisters > brothers) {
    score -= 100000;
    breakdown.push('-₹1L for more sisters than brothers');
  }
  // Age (slight penalty for <23 or >35)
  let age = parseInt(data.age) || 0;
  if (age < 23) { score -= 100000; breakdown.push('-₹1L for being under 23'); }
  if (age > 35) { score -= 200000; breakdown.push('-₹2L for being over 35'); }
  // Region multiplier
  let regionFactor = REGION_FACTORS[data.region] || 1;
  score = Math.round(score * regionFactor);
  breakdown.push(`×${regionFactor} region factor (${data.region})`);
  // Cap
  if (score > MAX_DOWRY) score = MAX_DOWRY;
  return { score: Math.max(0, score), breakdown };
}

function getTier(score) {
  if (score >= 12000000) return { title: 'High Demand Groom', color: '#1a237e' };
  if (score >= 7000000) return { title: 'Above Average Match', color: '#3949ab' };
  if (score >= 3000000) return { title: 'Average Eligible Match', color: '#1976d2' };
  return { title: 'Needs Improvement (Cultural Biases)', color: '#b71c1c' };
}

function animateCounter(el, to) {
  let start = 0;
  let duration = 1500;
  let startTime = null;
  function animate(ts) {
    if (!startTime) startTime = ts;
    let progress = Math.min((ts - startTime) / duration, 1);
    let value = Math.floor(progress * (to - start) + start);
    el.textContent = formatINR(value);
    if (progress < 1) requestAnimationFrame(animate);
    else el.textContent = formatINR(to);
  }
  requestAnimationFrame(animate);
}

function getShareText(score, region) {
  return `My dowry perception value is ${formatINR(score)} (${region}) – calculated with SaveItBro.in. See how social factors affect marriage trends in India.`;
}

window.addEventListener('DOMContentLoaded', function() {
  // Language switcher
  const langSelect = document.getElementById('lang-select');
  const lang = new URLSearchParams(window.location.search).get('lang') || 'en';
  langSelect.value = lang;

  // Hindi translations (expanded for all visible UI)
  const translations = {
    hi: {
      // Headings
      'Dowry Trend Estimator – Based on Indian Social Norms (2025)': 'दहेज प्रवृत्ति अनुमानक – भारतीय सामाजिक मानदंडों पर आधारित (2025)',
      'About This Tool': 'इस टूल के बारे में',
      'Dowry Perception Calculator': 'दहेज धारणा कैलकुलेटर',
      'Dowry Trends & Comparison': 'दहेज प्रवृत्तियाँ और तुलना',
      'Feedback': 'प्रतिक्रिया',
      'FAQ': 'सामान्य प्रश्न',
      'Anti-Dowry Laws & Support': 'दहेज विरोधी कानून और सहायता',
      // Buttons
      'Start Estimation': 'अनुमान लगाएं',
      'Estimate': 'अनुमान लगाएं',
      'Reset': 'रीसेट',
      'Share Result': 'परिणाम साझा करें',
      'Try Again': 'फिर से प्रयास करें',
      'Submit Feedback': 'प्रतिक्रिया भेजें',
      // Labels
      'Region/State:': 'क्षेत्र/राज्य:',
      'Gender:': 'लिंग:',
      'Male': 'पुरुष',
      'Female': 'महिला',
      'Age:': 'आयु:',
      'Highest Qualification:': 'सर्वोच्च योग्यता:',
      'Employment Type:': 'रोजगार प्रकार:',
      'Monthly Income (₹):': 'मासिक आय (₹):',
      'Vehicle Owned:': 'वाहन:',
      'Family Type:': 'परिवार का प्रकार:',
      'Caste (Optional):': 'जाति (वैकल्पिक):',
      'Property Ownership:': 'संपत्ति:',
      'Marital History:': 'वैवाहिक स्थिति:',
      'Number of Sisters:': 'बहनों की संख्या:',
      'Number of Brothers:': 'भाइयों की संख्या:',
      'Location:': 'स्थान:',
      'Was this calculation accurate for your region?': 'क्या यह गणना आपके क्षेत्र के लिए सटीक थी?',
      // Placeholders
      'Any suggestions? (Optional)': 'कोई सुझाव? (वैकल्पिक)',
      // Disclaimer
      'Disclaimer:': 'अस्वीकरण:',
      'SaveItBro.fun does not endorse or promote dowry. This calculator estimates how dowry trends are perceived based on social factors in different parts of India. Always respect people beyond price tags.': 'SaveItBro.fun दहेज का समर्थन या प्रचार नहीं करता। यह कैलकुलेटर भारत के विभिन्न हिस्सों में सामाजिक कारकों के आधार पर दहेज प्रवृत्तियों का अनुमान लगाता है। हमेशा लोगों का सम्मान करें, मूल्य टैग से परे।',
      'Learn more': 'और जानें',
      // FAQ
      'Is this a real dowry calculator?': 'क्या यह एक असली दहेज कैलकुलेटर है?',
      'No. This is a data-informed estimator reflecting cultural perceptions, not a legal or ethical recommendation.': 'नहीं। यह सांस्कृतिक धारणाओं को दर्शाने वाला डेटा-आधारित अनुमानक है, कानूनी या नैतिक सिफारिश नहीं।',
      'How is the estimate calculated?': 'अनुमान कैसे लगाया जाता है?',
      'We use public research, news, and social data to reflect how dowry perceptions vary by region, profession, and education. See the resources below.': 'हम सार्वजनिक शोध, समाचार और सामाजिक डेटा का उपयोग करते हैं ताकि यह दिखाया जा सके कि क्षेत्र, पेशा और शिक्षा के अनुसार दहेज की धारणाएँ कैसे बदलती हैं। नीचे दिए गए संसाधन देखें।',
      'Can I use this for matchmaking?': 'क्या मैं इसका उपयोग विवाह के लिए कर सकता हूँ?',
      'No. This is for awareness and education only.': 'नहीं। यह केवल जागरूकता और शिक्षा के लिए है।',
      // Chart/insight
      'National average:': 'राष्ट्रीय औसत:',
      'Your region:': 'आपका क्षेत्र:'
    }
  };

  function translatePage(lang) {
    if (lang !== 'hi') return;
    // Headings, labels, buttons
    document.querySelectorAll('h1, h2, label, button, .subtitle, .disclaimer-banner, .hero-btn, .lang-label, .form-group label, .faq-section h2, .resources-section h2, .faq-section summary').forEach(el => {
      const txt = el.textContent.trim();
      if (translations.hi[txt]) {
        el.textContent = translations.hi[txt];
      }
    });
    // Placeholders
    const comments = document.querySelector('input[name="comments"]');
    if (comments) comments.placeholder = translations.hi['Any suggestions? (Optional)'];
    // Disclaimer
    const disclaimer = document.querySelector('.disclaimer-banner');
    if (disclaimer) disclaimer.innerHTML = '❗ <b>' + translations.hi['Disclaimer:'] + '</b> ' + translations.hi['SaveItBro.fun does not endorse or promote dowry. This calculator estimates how dowry trends are perceived based on social factors in different parts of India. Always respect people beyond price tags.'] + ' <a href="#resources">' + translations.hi['Learn more'] + '</a>';
    // FAQ answers
    document.querySelectorAll('.faq-section details').forEach(details => {
      const summary = details.querySelector('summary');
      if (summary && translations.hi[summary.textContent.trim()]) {
        summary.textContent = translations.hi[summary.textContent.trim()];
      }
      const p = details.querySelector('p');
      if (p && translations.hi[p.textContent.trim()]) {
        p.textContent = translations.hi[p.textContent.trim()];
      }
    });
    // Chart/insight
    const insightSummary = document.getElementById('insight-summary');
    if (insightSummary) {
      insightSummary.innerHTML = insightSummary.innerHTML.replace('National average:', translations.hi['National average:']).replace('Your region:', translations.hi['Your region:']);
    }
  }

  langSelect.addEventListener('change', function() {
    if (this.value === 'hi') {
      window.location.href = window.location.pathname + '?lang=hi';
    } else {
      window.location.href = window.location.pathname + '?lang=en';
    }
  });

  translatePage(lang);

  // Smooth scroll for nav links
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Calculator logic
  const form = document.getElementById('dahej-form');
  const resultSection = document.getElementById('result-section');
  const resultTitle = document.getElementById('result-title');
  const resultAmount = document.getElementById('result-amount');
  const resultBreakdown = document.getElementById('result-breakdown');
  const resultInsight = document.getElementById('result-insight');
  const shareBtn = document.getElementById('share-btn');
  const shareLinks = document.getElementById('share-links');
  const tryAgainBtn = document.getElementById('try-again-btn');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    data.property = Array.from(form.querySelectorAll('input[name="property"]:checked')).map(cb => cb.value);
    const { score, breakdown } = calculateDowry(data);
    const { title, color } = getTier(score);
    resultSection.classList.remove('hidden');
    resultTitle.textContent = title;
    resultTitle.style.color = color;
    animateCounter(resultAmount, score);
    resultBreakdown.innerHTML = '';
    breakdown.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      resultBreakdown.appendChild(li);
    });
    // Insight
    const avg = STATE_AVERAGES[data.region] || STATE_AVERAGES.national;
    const diff = Math.round(((score - avg) / avg) * 100);
    let insight = '';
    if (diff > 0) insight = `You are <b>${diff}% above</b> the average dowry perception for your region.`;
    else if (diff < 0) insight = `You are <b>${Math.abs(diff)}% below</b> the average dowry perception for your region.`;
    else insight = `You are exactly at the average for your region.`;
    resultInsight.innerHTML = insight;
    // Share links
    const shareText = encodeURIComponent(getShareText(score, data.region));
    shareLinks.innerHTML = `
      <a href="https://wa.me/?text=${shareText}" target="_blank" title="Share on WhatsApp">🟢</a>
      <a href="https://twitter.com/intent/tweet?text=${shareText}" target="_blank" title="Share on Twitter">🐦</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=https://saveitbro.in&quote=${shareText}" target="_blank" title="Share on Facebook">📘</a>
    `;
    resultSection.scrollIntoView({ behavior: 'smooth' });
    // Update chart
    updateChart(data.region, score);
    // Update insight summary
    document.getElementById('insight-summary').innerHTML = `National average: <b>${formatINR(STATE_AVERAGES.national)}</b>. Your region: <b>${formatINR(avg)}</b>.`;
  });

  shareBtn.addEventListener('click', function() {
    const score = resultAmount.textContent.replace(/[^\d]/g, '');
    const region = document.getElementById('region').value;
    const text = getShareText(Number(score), region);
    if (navigator.share) {
      navigator.share({ title: 'Dowry Trend Estimator', text });
    } else {
      navigator.clipboard.writeText(text);
      shareBtn.textContent = 'Copied!';
      setTimeout(() => shareBtn.textContent = 'Share Result', 1500);
    }
  });

  tryAgainBtn.addEventListener('click', function() {
    resultSection.classList.add('hidden');
    form.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Feedback form
  const feedbackForm = document.getElementById('feedback-form');
  const feedbackMsg = document.getElementById('feedback-message');
  feedbackForm.addEventListener('submit', function(e) {
    e.preventDefault();
    feedbackMsg.textContent = 'Thank you for your feedback!';
    feedbackForm.reset();
    setTimeout(() => feedbackMsg.textContent = '', 3000);
  });

  // Chart.js
  let chart;
  function updateChart(region, userScore) {
    const ctx = document.getElementById('dowry-chart').getContext('2d');
    const data = {
      labels: [
        'National',
        'Punjab',
        'UP',
        'Kerala',
        'Gujarat',
        'Bengal',
        'Tamil Nadu',
        'Maharashtra',
        'Rajasthan',
        'You'
      ],
      datasets: [{
        label: 'Avg Dowry Perception (INR)',
        data: [
          STATE_AVERAGES.national,
          STATE_AVERAGES.punjab,
          STATE_AVERAGES.up,
          STATE_AVERAGES.kerala,
          STATE_AVERAGES.gujarat,
          STATE_AVERAGES.bengal,
          STATE_AVERAGES.tn,
          STATE_AVERAGES.maharashtra,
          STATE_AVERAGES.rajasthan,
          userScore
        ],
        backgroundColor: [
          '#1a237e','#3949ab','#1976d2','#43a047','#fbc02d','#8d6e63','#00838f','#c62828','#6d4c41','#ffd600'
        ]
      }]
    };
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'bar',
      data,
      options: {
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: value => '₹' + value.toLocaleString('en-IN') }
          }
        }
      }
    });
  }
});
