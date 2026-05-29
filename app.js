const registrationForm = document.getElementById('registrationForm');
const completeProfileSection = document.getElementById('completeProfileSection');
const recommendationSection = document.getElementById('recommendationSection');
const recommendationResults = document.getElementById('recommendationResults');
const aiSuggestion = document.getElementById('aiSuggestion');
const notificationPanel = document.getElementById('notificationPanel');
const notificationList = document.getElementById('notificationList');
const notifyToggle = document.getElementById('notifyToggle');
const profileProgressLabel = document.getElementById('profileProgressLabel');
const progressPercentage = document.getElementById('progressPercentage');
const progressFill = document.getElementById('progressFill');
const dashboardRecommended = document.getElementById('dashboardRecommended');
const dashboardMissingDocs = document.getElementById('dashboardMissingDocs');
const dashboardVerified = document.getElementById('dashboardVerified');
const verificationStatus = document.getElementById('verificationStatus');
const recommendationCount = document.getElementById('recommendationCount');

const documents = [
  'Community Certificate',
  'Income Certificate',
  'Transfer Certificate',
  'Marksheet',
  'Bonafide Certificate',
  'Bank Passbook',
  'Student ID Card',
  'Address Proof',
  'Fee Receipt',
  'Signature Scan'
];

const scholarshipCatalog = [
  {
    name: 'Prime Merit Fellowship',
    category: 'Merit-based',
    minCgpa: 8.0,
    maxIncome: 999999,
    eligibleCommunities: ['General', 'SC', 'ST', 'OBC', 'EWS'],
    courses: ['B.Tech', 'B.Sc', 'B.Com', 'BA', 'MCA'],
    location: 'All',
    lastDate: '2026-08-15',
    amount: '₹25,000',
    requiredDocuments: ['Aadhaar Card', 'Student Photo', 'Marksheet', 'Income Certificate']
  },
  {
    name: 'Community Uplift Grant',
    category: 'Need-based',
    minCgpa: 6.5,
    maxIncome: 300000,
    eligibleCommunities: ['SC', 'ST', 'OBC', 'EWS'],
    courses: ['All'],
    location: 'All',
    lastDate: '2026-07-30',
    amount: '₹18,000',
    requiredDocuments: ['Aadhaar Card', 'Community Certificate', 'Income Certificate']
  },
  {
    name: 'State Scholar Assistance',
    category: 'Need-based',
    minCgpa: 7.0,
    maxIncome: 600000,
    eligibleCommunities: ['General', 'SC', 'ST', 'OBC', 'EWS'],
    courses: ['B.Tech', 'MCA', 'MBA', 'B.Sc'],
    location: 'Chennai',
    lastDate: '2026-09-10',
    amount: '₹22,000',
    requiredDocuments: ['Aadhaar Card', 'Income Certificate', 'Address Proof', 'Fee Receipt']
  },
  {
    name: 'Urban College Support Fund',
    category: 'Need-based',
    minCgpa: 7.5,
    maxIncome: 450000,
    eligibleCommunities: ['General', 'SC', 'ST', 'OBC', 'EWS'],
    courses: ['B.Tech', 'B.Sc', 'MCA'],
    location: 'All',
    lastDate: '2026-10-05',
    amount: '₹20,000',
    requiredDocuments: ['Aadhaar Card', 'Income Certificate', 'Bank Passbook', 'Student ID Card']
  },
  {
    name: 'Departmental Excellence Award',
    category: 'Merit-based',
    minCgpa: 8.5,
    maxIncome: 999999,
    eligibleCommunities: ['General', 'SC', 'ST', 'OBC', 'EWS'],
    courses: ['Computer Science', 'Electronics', 'Mechanical', 'Civil'],
    location: 'All',
    lastDate: '2026-08-01',
    amount: '₹30,000',
    requiredDocuments: ['Aadhaar Card', 'Student Photo', 'Marksheet', 'Student ID Card']
  }
];

let applicantProfile = {};
let uploadedDocuments = new Set(['Aadhaar Card', 'Student Photo']);

function parseCgpa(value) {
  const numeric = parseFloat(value.replace('%', '').trim());
  if (isNaN(numeric)) return 0;
  if (value.includes('%')) return numeric / 10;
  return numeric > 10 ? numeric / 10 : numeric;
}

function updateProgress() {
  const uploadedCount = uploadedDocuments.size;
  const progress = Math.min(100, Math.round((uploadedCount / documents.length) * 100));
  profileProgressLabel.textContent = `${progress}%`;
  progressPercentage.textContent = `${progress}%`;
  progressFill.style.width = `${progress}%`;
  dashboardMissingDocs.textContent = `${Math.max(0, documents.length - uploadedCount)}`;
}

function calculateEligibility(profile) {
  const cgpa = parseCgpa(profile.marks);
  const income = Number(profile.familyIncome) || 0;
  const location = profile.location.toLowerCase();
  const course = profile.course.toLowerCase();
  const department = profile.department.toLowerCase();
  const community = profile.community;

  return scholarshipCatalog
    .map((scholarship) => {
      let score = 0;
      if (cgpa >= scholarship.minCgpa) score += 30;
      if (income <= scholarship.maxIncome) score += 25;
      if (scholarship.eligibleCommunities.includes(community)) score += 20;
      if (scholarship.courses.includes('All') || scholarship.courses.some((courseName) => course.includes(courseName.toLowerCase()) || department.includes(courseName.toLowerCase()))) score += 15;
      if (scholarship.location === 'All' || location.includes(scholarship.location.toLowerCase())) score += 10;
      const missing = scholarship.requiredDocuments.filter((doc) => !uploadedDocuments.has(doc) && doc !== 'Aadhaar Card' && doc !== 'Student Photo');
      const eligibility = Math.max(10, Math.min(100, Math.round(score - missing.length * 8)));

      return {
        ...scholarship,
        eligibility,
        missingDocuments: missing,
        matchInfo: {
          incomeMatch: income <= scholarship.maxIncome,
          meritMatch: cgpa >= scholarship.minCgpa,
          communityMatch: scholarship.eligibleCommunities.includes(community),
          courseMatch: scholarship.courses.includes('All') || scholarship.courses.some((courseName) => course.includes(courseName.toLowerCase()) || department.includes(courseName.toLowerCase())),
          locationMatch: scholarship.location === 'All' || location.includes(scholarship.location.toLowerCase())
        }
      };
    })
    .filter((item) => item.eligibility >= 40)
    .sort((a, b) => b.eligibility - a.eligibility);
}

function renderRecommendations(list) {
  recommendationResults.innerHTML = '';
  if (!list.length) {
    recommendationResults.innerHTML = '<div class="recommendation-card"><h3>No matching scholarships found</h3><p>Try updating your family income, marks, or uploading more documents for better matches.</p></div>';
    recommendationCount.textContent = '0';
    dashboardRecommended.textContent = '0';
    return;
  }
  list.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'recommendation-card';
    card.innerHTML = `
      <div class="badge-row">
        <span class="badge">${item.category}</span>
        <span class="badge">Eligibility ${item.eligibility}%</span>
      </div>
      <h3>${item.name}</h3>
      <p><strong>Amount offered:</strong> ${item.amount}</p>
      <p><strong>Last date:</strong> ${new Date(item.lastDate).toDateString()}</p>
      <p><strong>Match details:</strong> ${item.matchInfo.meritMatch ? 'Merit OK' : 'Improve marks'}, ${item.matchInfo.incomeMatch ? 'Income OK' : 'Income too high'}, ${item.matchInfo.communityMatch ? 'Community OK' : 'Community criteria'}</p>
      <p><strong>Missing documents:</strong> ${item.missingDocuments.length ? item.missingDocuments.join(', ') : 'None'}</p>
      <button class="btn btn-primary" onclick="alert('Apply flow for ${item.name} not implemented in this demo.')">Apply Now</button>
    `;
    recommendationResults.appendChild(card);
  });
  recommendationCount.textContent = String(list.length);
  dashboardRecommended.textContent = String(list.length);
}

function updateAISuggestion(profile) {
  if (!profile.name) {
    aiSuggestion.textContent = 'Complete your profile to receive AI-powered scholarship matches and document guidance.';
    return;
  }

  const suggestions = [];
  if (parseCgpa(profile.marks) >= 8.5) {
    suggestions.push('You are a strong candidate for merit scholarships. Keep your grades steady and submit your marksheets soon.');
  }
  if (Number(profile.familyIncome) <= 450000) {
    suggestions.push('Your income level makes you eligible for several need-based funds. Upload your income certificate and bank passbook quickly.');
  }
  if (profile.community === 'SC' || profile.community === 'ST' || profile.community === 'OBC') {
    suggestions.push('Community certificates may unlock additional government scholarships. Ensure it is current and legible.');
  }
  if (profile.location.toLowerCase().includes('chennai')) {
    suggestions.push('State-specific scholarships for Chennai students are available. Verify your address proof and fee receipt.');
  }

  if (!suggestions.length) {
    aiSuggestion.textContent = 'Update your academic marks or income details to see more tailored scholarship matches. More documents gives better recommendations.';
  } else {
    aiSuggestion.innerHTML = suggestions.map((text) => `<p>• ${text}</p>`).join('');
  }
}

function addNotification(message) {
  const li = document.createElement('li');
  li.textContent = message;
  notificationList.prepend(li);
}

registrationForm.addEventListener('submit', (event) => {
  event.preventDefault();

  applicantProfile = {
    name: document.getElementById('studentName').value.trim(),
    email: document.getElementById('studentEmail').value.trim(),
    phone: document.getElementById('studentPhone').value.trim(),
    community: document.getElementById('studentCommunity').value,
    familyIncome: document.getElementById('familyIncome').value.trim(),
    marks: document.getElementById('studentMarks').value.trim(),
    course: document.getElementById('studentCourse').value.trim(),
    department: document.getElementById('studentDepartment').value.trim(),
    location: document.getElementById('studentLocation').value.trim()
  };

  completeProfileSection.classList.remove('hidden');
  recommendationSection.classList.remove('hidden');
  verificationStatus.textContent = 'In review';
  addNotification('Registration complete. Upload remaining documents to increase your profile score and scholarship match rate.');
  updateAISuggestion(applicantProfile);
  updateProgress();
  renderRecommendations(calculateEligibility(applicantProfile));
});

function handleDocumentUpload(event) {
  const input = event.target;
  const docName = input.dataset.doc;
  if (!docName) return;
  if (input.files.length) {
    uploadedDocuments.add(docName);
    addNotification(`Uploaded ${docName}. Processing verification...`);
    setTimeout(() => {
      verificationStatus.textContent = 'Partial verification';
      addNotification(`${docName} has been received and queued for verification.`);
    }, 600);
    updateProgress();
    renderRecommendations(calculateEligibility(applicantProfile));
  }
}

document.querySelectorAll('[data-doc]').forEach((input) => {
  input.addEventListener('change', handleDocumentUpload);
});

notifyToggle.addEventListener('click', () => {
  notificationPanel.classList.toggle('hidden');
});

window.addEventListener('DOMContentLoaded', () => {
  updateProgress();
});
