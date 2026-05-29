import { useEffect, useMemo, useState } from 'react';

const scholarshipCatalog = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
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
    id: 5,
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

function App() {
  const rawApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const API_URL = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/i, '');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    community: 'General',
    familyIncome: '',
    marks: '',
    course: '',
    department: '',
    location: ''
  });
  const [uploadedDocs, setUploadedDocs] = useState(new Set(['Aadhaar Card', 'Student Photo']));
  const [registered, setRegistered] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [notificationList, setNotificationList] = useState([
    'Welcome to Scholarship Bloom! Complete registration to receive smart matches.'
  ]);
  const [verificationStatus, setVerificationStatus] = useState('Pending');
  const [apiError, setApiError] = useState(null);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  const progress = useMemo(() => {
    return Math.min(100, Math.round((uploadedDocs.size / documents.length) * 100));
  }, [uploadedDocs]);

  async function fetchRecommendationsFromBackend(profile, docs) {
    try {
      const response = await fetch(`${API_URL}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profile, documents: Array.from(docs) })
      });
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const data = await response.json();
      setApiError(null);
      return data.recommendations;
    } catch (error) {
      setApiError('Unable to reach recommendation API, using local fallback engine.');
      return calculateEligibility(profile, docs);
    }
  }

  async function refreshRecommendations(profile, docs) {
    setIsLoadingRecs(true);
    const recs = await fetchRecommendationsFromBackend(profile, docs);
    setRecommendations(recs);
    setIsLoadingRecs(false);
  }

  useEffect(() => {
    if (registered) {
      refreshRecommendations(formData, uploadedDocs);
    }
  }, [registered, formData, uploadedDocs]);

  function parseCgpa(value) {
    const numeric = parseFloat(value.replace('%', '').trim());
    if (isNaN(numeric)) return 0;
    if (value.includes('%')) return numeric / 10;
    return numeric > 10 ? numeric / 10 : numeric;
  }

  function calculateEligibility(profile, docs) {
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
        if (
          scholarship.courses.includes('All') ||
          scholarship.courses.some((courseName) =>
            course.includes(courseName.toLowerCase()) || department.includes(courseName.toLowerCase())
          )
        ) score += 15;
        if (scholarship.location === 'All' || location.includes(scholarship.location.toLowerCase())) score += 10;
        const missing = scholarship.requiredDocuments.filter((doc) => !docs.has(doc));
        const eligibility = Math.max(10, Math.min(100, Math.round(score - missing.length * 8)));

        return {
          ...scholarship,
          eligibility,
          missingDocuments: missing,
          matchInfo: {
            incomeMatch: income <= scholarship.maxIncome,
            meritMatch: cgpa >= scholarship.minCgpa,
            communityMatch: scholarship.eligibleCommunities.includes(community),
            courseMatch:
              scholarship.courses.includes('All') ||
              scholarship.courses.some((courseName) =>
                course.includes(courseName.toLowerCase()) || department.includes(courseName.toLowerCase())
              ),
            locationMatch: scholarship.location === 'All' || location.includes(scholarship.location.toLowerCase())
          }
        };
      })
      .filter((item) => item.eligibility >= 40)
      .sort((a, b) => b.eligibility - a.eligibility);
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = (event) => {
    event.preventDefault();
    setRegistered(true);
    setVerificationStatus('In review');
    setNotificationList((prev) => [
      'Registration complete. Upload remaining documents to increase your profile score and scholarship match rate.',
      ...prev
    ]);
  };

  const handleDocumentUpload = (event) => {
    const docName = event.target.dataset.doc;
    if (!docName) return;
    if (event.target.files.length) {
      setUploadedDocs((prev) => new Set(prev).add(docName));
      setVerificationStatus('Partial verification');
      setNotificationList((prev) => [`${docName} uploaded and queued for verification.`, ...prev]);
    }
  };

  const addNotification = (message) => {
    setNotificationList((prev) => [message, ...prev]);
  };

  const missingCount = documents.length - uploadedDocs.size;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <span className="brand-pill">Scholarship Bloom</span>
          <h1>AI Scholarship Recommendation Portal</h1>
          <p>Smart guidance for your academic journey with soft, student-friendly design.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => addNotification('Notifications refreshed.')}>Refresh alerts</button>
      </header>

      <section className="quick-stats">
        <article className="stat-card">
          <span>Profile Progress</span>
          <strong>{progress}%</strong>
        </article>
        <article className="stat-card">
          <span>Scholarships Recommended</span>
          <strong>{recommendations.length}</strong>
        </article>
        <article className="stat-card">
          <span>Verification Status</span>
          <strong>{verificationStatus}</strong>
        </article>
      </section>

      <div className="layout-grid">
        <main>
          <section className="card-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Registration</p>
                <h2>Create your student account</h2>
              </div>
              <span className="tag">Mandatory uploads: Aadhaar & Photo</span>
            </div>

            <form className="form-card" onSubmit={handleRegister}>
              <div className="form-grid">
                <label>
                  Student Name
                  <input required name="name" value={formData.name} onChange={handleInputChange} placeholder="Aarav Sharma" />
                </label>
                <label>
                  Email Address
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="aarav@example.com" />
                </label>
                <label>
                  Phone Number
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 99999 12345" />
                </label>
                <label>
                  Community Category
                  <select required name="community" value={formData.community} onChange={handleInputChange}>
                    <option value="General">General</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="OBC">OBC</option>
                    <option value="EWS">EWS</option>
                  </select>
                </label>
                <label>
                  Family Income (Annual)
                  <input required type="number" name="familyIncome" value={formData.familyIncome} onChange={handleInputChange} placeholder="250000" />
                </label>
                <label>
                  Current CGPA / Percentage
                  <input required name="marks" value={formData.marks} onChange={handleInputChange} placeholder="8.4 / 84%" />
                </label>
                <label>
                  Course
                  <input required name="course" value={formData.course} onChange={handleInputChange} placeholder="B.Tech Computer Science" />
                </label>
                <label>
                  Department
                  <input required name="department" value={formData.department} onChange={handleInputChange} placeholder="Computer Science" />
                </label>
                <label>
                  Location
                  <input required name="location" value={formData.location} onChange={handleInputChange} placeholder="Chennai, Tamil Nadu" />
                </label>
              </div>

              <div className="upload-grid">
                <label className="upload-card">
                  Aadhaar Card Upload
                  <input required type="file" accept="image/*,.pdf" data-doc="Aadhaar Card" onChange={handleDocumentUpload} />
                </label>
                <label className="upload-card">
                  Student Photo Upload
                  <input required type="file" accept="image/*" data-doc="Student Photo" onChange={handleDocumentUpload} />
                </label>
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" type="submit">Register and Analyze Eligibility</button>
              </div>
            </form>
          </section>

          {registered && (
            <section className="card-section">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Complete Profile</p>
                  <h2>Upload remaining documents</h2>
                </div>
                <span className="tag tag-soft">Documents help verify eligibility faster</span>
              </div>

              <div className="progress-block">
                <div className="progress-labels">
                  <span>Profile completion</span>
                  <strong>{progress}%</strong>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="doc-grid">
                {documents.map((doc) => (
                  <label key={doc} className="upload-card">
                    {doc}
                    <input type="file" accept="image/*,.pdf" data-doc={doc} onChange={handleDocumentUpload} />
                  </label>
                ))}
              </div>
            </section>
          )}

          {registered && (
            <section className="card-section">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Scholarship Recommendations</p>
                  <h2>Your best-fit scholarships</h2>
                </div>
                <span className="tag">AI-assisted eligibility insights</span>
              </div>

              {apiError && <div className="api-error">{apiError}</div>}
              {isLoadingRecs && <div className="api-loading">Loading scholarship recommendations...</div>}

              <div className="recommendation-grid">
                {recommendations.length === 0 ? (
                  <div className="recommendation-card">
                    <h3>No matching scholarships found</h3>
                    <p>Update your details and upload more documents for better recommendations.</p>
                  </div>
                ) : (
                  recommendations.map((item) => (
                    <article key={item.id} className="recommendation-card">
                      <div className="badge-row">
                        <span className="badge">{item.category}</span>
                        <span className="badge">Eligibility {item.eligibility}%</span>
                      </div>
                      <h3>{item.name}</h3>
                      <p><strong>Amount offered:</strong> {item.amount}</p>
                      <p><strong>Last date:</strong> {new Date(item.lastDate).toDateString()}</p>
                      <p><strong>Missing documents:</strong> {item.missingDocuments.length ? item.missingDocuments.join(', ') : 'None'}</p>
                      <button className="btn btn-primary">Apply Now</button>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
        </main>

        <aside>
          <section className="card-section ai-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">AI Suggestions</p>
                <h2>Actionable guidance</h2>
              </div>
            </div>
            <div className="ai-message">
              {registered ? (
                <>
                  <p>Complete missing documents and submit your profile to improve your eligibility matching.</p>
                  <p>Low family income and strong marks can unlock more need-based and merit-based scholarships.</p>
                </>
              ) : (
                'Complete your profile to receive AI-powered scholarship matches and document guidance.'
              )}
            </div>
          </section>

          <section className="card-section dashboard-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Tracking Dashboard</p>
                <h2>Application status overview</h2>
              </div>
            </div>
            <div className="dashboard-list">
              <div className="dashboard-item">
                <span>Recommended</span>
                <strong>{recommendations.length}</strong>
              </div>
              <div className="dashboard-item">
                <span>Missing Docs</span>
                <strong>{missingCount}</strong>
              </div>
              <div className="dashboard-item">
                <span>Verified</span>
                <strong>{verificationStatus === 'Pending' ? 0 : verificationStatus === 'Partial verification' ? 2 : 3}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <section className="notification-panel">
        <h3>Notifications</h3>
        <ul>
          {notificationList.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default App;
