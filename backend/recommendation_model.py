import os
import pickle
import random
import math

COMMUNITIES = ['General', 'SC', 'ST', 'OBC', 'EWS']
COURSE_BUCKETS = ['computer science', 'electronics', 'mechanical', 'civil', 'management', 'science', 'commerce', 'arts', 'all']
DOCUMENTS = [
    'Aadhaar Card',
    'Student Photo',
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
]
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')

scholarship_catalog = [
    {
        'id': 1,
        'name': 'Prime Merit Fellowship',
        'category': 'Merit-based',
        'min_cgpa': 8.0,
        'max_income': 999999,
        'eligible_communities': COMMUNITIES,
        'courses': ['B.Tech', 'B.Sc', 'B.Com', 'BA', 'MCA'],
        'location': 'All',
        'last_date': '2026-08-15',
        'amount': '₹25,000',
        'required_documents': ['Aadhaar Card', 'Student Photo', 'Marksheet', 'Income Certificate']
    },
    {
        'id': 2,
        'name': 'Community Uplift Grant',
        'category': 'Need-based',
        'min_cgpa': 6.5,
        'max_income': 300000,
        'eligible_communities': ['SC', 'ST', 'OBC', 'EWS'],
        'courses': ['All'],
        'location': 'All',
        'last_date': '2026-07-30',
        'amount': '₹18,000',
        'required_documents': ['Aadhaar Card', 'Community Certificate', 'Income Certificate']
    },
    {
        'id': 3,
        'name': 'State Scholar Assistance',
        'category': 'Need-based',
        'min_cgpa': 7.0,
        'max_income': 600000,
        'eligible_communities': COMMUNITIES,
        'courses': ['B.Tech', 'MCA', 'MBA', 'B.Sc'],
        'location': 'Chennai',
        'last_date': '2026-09-10',
        'amount': '₹22,000',
        'required_documents': ['Aadhaar Card', 'Income Certificate', 'Address Proof', 'Fee Receipt']
    },
    {
        'id': 4,
        'name': 'Urban College Support Fund',
        'category': 'Need-based',
        'min_cgpa': 7.5,
        'max_income': 450000,
        'eligible_communities': COMMUNITIES,
        'courses': ['B.Tech', 'B.Sc', 'MCA'],
        'location': 'All',
        'last_date': '2026-10-05',
        'amount': '₹20,000',
        'required_documents': ['Aadhaar Card', 'Income Certificate', 'Bank Passbook', 'Student ID Card']
    },
    {
        'id': 5,
        'name': 'Departmental Excellence Award',
        'category': 'Merit-based',
        'min_cgpa': 8.5,
        'max_income': 999999,
        'eligible_communities': COMMUNITIES,
        'courses': ['Computer Science', 'Electronics', 'Mechanical', 'Civil'],
        'location': 'All',
        'last_date': '2026-08-01',
        'amount': '₹30,000',
        'required_documents': ['Aadhaar Card', 'Student Photo', 'Marksheet', 'Student ID Card']
    }
]


def parse_cgpa(value):
    try:
        numeric = float(str(value).replace('%', '').strip())
    except ValueError:
        return 0.0
    if '%' in str(value):
        return numeric / 10.0
    return numeric if numeric <= 10 else numeric / 10.0


def normalize_income(income):
    try:
        income_value = float(income)
    except (TypeError, ValueError):
        income_value = 0.0
    return math.log1p(max(income_value, 0))


def bucket_course(course, department):
    value = f"{course} {department}".strip().lower()
    for bucket in COURSE_BUCKETS[:-1]:
        if bucket in value:
            return bucket
    return 'all'


def bucket_location(location):
    if not location:
        return 'other'
    normalized = location.lower()
    return 'chennai' if 'chennai' in normalized else 'other'


def feature_vector(profile, documents):
    cgpa = parse_cgpa(profile.get('marks', '0'))
    income_log = normalize_income(profile.get('familyIncome', 0))
    community = profile.get('community', 'General')
    course_bucket = bucket_course(profile.get('course', ''), profile.get('department', ''))
    location_bucket = bucket_location(profile.get('location', ''))
    community_index = float(COMMUNITIES.index(community)) if community in COMMUNITIES else float(len(COMMUNITIES))
    course_index = float(COURSE_BUCKETS.index(course_bucket)) if course_bucket in COURSE_BUCKETS else float(len(COURSE_BUCKETS) - 1)
    location_index = 0.0 if location_bucket == 'chennai' else 1.0
    docs_present = [1.0 if doc in documents else 0.0 for doc in DOCUMENTS]
    return [cgpa, income_log, community_index, course_index, location_index] + docs_present


def create_training_sample():
    profile = {
        'marks': f"{random.uniform(5.0, 10.0):.1f}",
        'familyIncome': random.uniform(0, 1200000),
        'community': random.choice(COMMUNITIES),
        'course': random.choice(['B.Tech', 'B.Sc', 'MCA', 'MBA', 'B.Com', 'BA']),
        'department': random.choice(['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Commerce', 'Arts']),
        'location': random.choice(['Chennai', 'Coimbatore', 'Mumbai', 'Hyderabad', 'Delhi'])
    }
    documents = set(random.sample(DOCUMENTS, random.randint(2, len(DOCUMENTS))))
    return profile, documents


def label_for_scholarship(profile, documents, scholarship):
    cgpa = parse_cgpa(profile['marks'])
    income = float(profile['familyIncome'])
    community = profile['community']
    course = profile['course'].lower()
    department = profile['department'].lower()
    location = profile['location'].lower()
    score = 0

    if cgpa >= scholarship['min_cgpa']:
        score += 30
    if income <= scholarship['max_income']:
        score += 25
    if community in scholarship['eligible_communities']:
        score += 20
    if scholarship['courses'] == ['All'] or any(course_name.lower() in course or course_name.lower() in department for course_name in scholarship['courses']):
        score += 15
    if scholarship['location'] == 'All' or scholarship['location'].lower() in location:
        score += 10
    if any(doc not in documents for doc in scholarship['required_documents']):
        score -= 10

    return 1 if score >= 40 else 0


def generate_training_data(n_samples=1500):
    profiles = []
    documents = []
    labels = []
    for _ in range(n_samples):
        profile, docs = create_training_sample()
        profiles.append(profile)
        documents.append(docs)
        labels.append([label_for_scholarship(profile, docs, sch) for sch in scholarship_catalog])
    return profiles, documents, labels


def sigmoid(value):
    try:
        return 1.0 / (1.0 + math.exp(-value))
    except OverflowError:
        return 0.0 if value < 0 else 1.0


def train_model(output_path=MODEL_PATH):
    random.seed(42)
    profiles, documents, labels = generate_training_data()
    X = [feature_vector(profile, docs) for profile, docs in zip(profiles, documents)]
    n_features = len(X[0])
    n_labels = len(scholarship_catalog)

    weights = [[random.uniform(-0.01, 0.01) for _ in range(n_features)] for _ in range(n_labels)]
    biases = [0.0 for _ in range(n_labels)]
    learning_rate = 0.05
    epochs = 120

    for _ in range(epochs):
        gradients_w = [[0.0] * n_features for _ in range(n_labels)]
        gradients_b = [0.0] * n_labels

        for x_vec, y_vec in zip(X, labels):
            for label_index in range(n_labels):
                z = sum(weight * x for weight, x in zip(weights[label_index], x_vec)) + biases[label_index]
                prediction = sigmoid(z)
                error = prediction - y_vec[label_index]
                for feature_index, x_value in enumerate(x_vec):
                    gradients_w[label_index][feature_index] += error * x_value
                gradients_b[label_index] += error

        batch_size = len(X)
        for label_index in range(n_labels):
            for feature_index in range(n_features):
                weights[label_index][feature_index] -= learning_rate * gradients_w[label_index][feature_index] / batch_size
            biases[label_index] -= learning_rate * gradients_b[label_index] / batch_size

    model_data = {'weights': weights, 'biases': biases}
    with open(output_path, 'wb') as model_file:
        pickle.dump(model_data, model_file)
    return output_path


def load_model(path=MODEL_PATH):
    if not os.path.exists(path):
        raise FileNotFoundError(f'Model file not found at {path}')
    with open(path, 'rb') as model_file:
        return pickle.load(model_file)


def predict_probabilities(profile, documents, model):
    x_vec = feature_vector(profile, documents)
    probabilities = []
    for label_index in range(len(scholarship_catalog)):
        z = sum(weight * x for weight, x in zip(model['weights'][label_index], x_vec)) + model['biases'][label_index]
        probabilities.append(sigmoid(z))
    return probabilities


def recommend(profile, documents):
    model = load_model()
    probabilities = predict_probabilities(profile, documents, model)
    recommendations = []
    for scholarship, probability in zip(scholarship_catalog, probabilities):
        missing_documents = [doc for doc in scholarship['required_documents'] if doc not in documents]
        eligibility = max(0, int(probability * 100) - len(missing_documents) * 5)
        if eligibility >= 25:
            recommendations.append({
                'scholarship_id': scholarship['id'],
                'name': scholarship['name'],
                'category': scholarship['category'],
                'amount': scholarship['amount'],
                'eligibility': eligibility,
                'missing_documents': missing_documents,
                'details': {
                    'min_cgpa': scholarship['min_cgpa'],
                    'max_income': scholarship['max_income'],
                    'eligible_communities': scholarship['eligible_communities'],
                    'required_documents': scholarship['required_documents']
                }
            })
    recommendations.sort(key=lambda item: item['eligibility'], reverse=True)
    return recommendations
import os
import pickle
import random
import math

COMMUNITIES = ['General', 'SC', 'ST', 'OBC', 'EWS']
COURSE_BUCKETS = ['computer science', 'electronics', 'mechanical', 'civil', 'management', 'science', 'commerce', 'arts', 'all']
DOCUMENTS = [
    'Aadhaar Card',
    'Student Photo',
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
]
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')

scholarship_catalog = [
    {
        'id': 1,
        'name': 'Prime Merit Fellowship',
        'category': 'Merit-based',
        'min_cgpa': 8.0,
        'max_income': 999999,
        'eligible_communities': COMMUNITIES,
        'courses': ['B.Tech', 'B.Sc', 'B.Com', 'BA', 'MCA'],
        'location': 'All',
        'last_date': '2026-08-15',
        'amount': '₹25,000',
        'required_documents': ['Aadhaar Card', 'Student Photo', 'Marksheet', 'Income Certificate']
    },
    {
        'id': 2,
        'name': 'Community Uplift Grant',
        'category': 'Need-based',
        'min_cgpa': 6.5,
        'max_income': 300000,
        'eligible_communities': ['SC', 'ST', 'OBC', 'EWS'],
        'courses': ['All'],
        'location': 'All',
        'last_date': '2026-07-30',
        'amount': '₹18,000',
        'required_documents': ['Aadhaar Card', 'Community Certificate', 'Income Certificate']
    },
    {
        'id': 3,
        'name': 'State Scholar Assistance',
        'category': 'Need-based',
        'min_cgpa': 7.0,
        'max_income': 600000,
        'eligible_communities': COMMUNITIES,
        'courses': ['B.Tech', 'MCA', 'MBA', 'B.Sc'],
        'location': 'Chennai',
        'last_date': '2026-09-10',
        'amount': '₹22,000',
        'required_documents': ['Aadhaar Card', 'Income Certificate', 'Address Proof', 'Fee Receipt']
    },
    {
        'id': 4,
        'name': 'Urban College Support Fund',
        'category': 'Need-based',
        'min_cgpa': 7.5,
        'max_income': 450000,
        'eligible_communities': COMMUNITIES,
        'courses': ['B.Tech', 'B.Sc', 'MCA'],
        'location': 'All',
        'last_date': '2026-10-05',
        'amount': '₹20,000',
        'required_documents': ['Aadhaar Card', 'Income Certificate', 'Bank Passbook', 'Student ID Card']
    },
    {
        'id': 5,
        'name': 'Departmental Excellence Award',
        'category': 'Merit-based',
        'min_cgpa': 8.5,
        'max_income': 999999,
        'eligible_communities': COMMUNITIES,
        'courses': ['Computer Science', 'Electronics', 'Mechanical', 'Civil'],
        'location': 'All',
        'last_date': '2026-08-01',
        'amount': '₹30,000',
        'required_documents': ['Aadhaar Card', 'Student Photo', 'Marksheet', 'Student ID Card']
    }
]


def parse_cgpa(value):
    try:
        numeric = float(str(value).replace('%', '').strip())
    except ValueError:
        return 0.0
    if '%' in str(value):
        return numeric / 10.0
    return numeric if numeric <= 10 else numeric / 10.0


def normalize_income(income):
    try:
        income_value = float(income)
    except (TypeError, ValueError):
        income_value = 0.0
    return math.log1p(max(income_value, 0))


def bucket_course(course, department):
    value = f"{course} {department}".strip().lower()
    for bucket in COURSE_BUCKETS[:-1]:
        if bucket in value:
            return bucket
    return 'all'


def bucket_location(location):
    if not location:
        return 'other'
    normalized = location.lower()
    return 'chennai' if 'chennai' in normalized else 'other'


def feature_vector(profile, documents):
    cgpa = parse_cgpa(profile.get('marks', '0'))
    income_log = normalize_income(profile.get('familyIncome', 0))
    community = profile.get('community', 'General')
    course_bucket = bucket_course(profile.get('course', ''), profile.get('department', ''))
    location_bucket = bucket_location(profile.get('location', ''))
    community_index = float(COMMUNITIES.index(community)) if community in COMMUNITIES else float(len(COMMUNITIES))
    course_index = float(COURSE_BUCKETS.index(course_bucket)) if course_bucket in COURSE_BUCKETS else float(len(COURSE_BUCKETS) - 1)
    location_index = 0.0 if location_bucket == 'chennai' else 1.0
    docs_present = [1.0 if doc in documents else 0.0 for doc in DOCUMENTS]
    return [cgpa, income_log, community_index, course_index, location_index] + docs_present


def create_training_sample():
    profile = {
        'marks': f"{random.uniform(5.0, 10.0):.1f}",
        'familyIncome': random.uniform(0, 1200000),
        'community': random.choice(COMMUNITIES),
        'course': random.choice(['B.Tech', 'B.Sc', 'MCA', 'MBA', 'B.Com', 'BA']),
        'department': random.choice(['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Commerce', 'Arts']),
        'location': random.choice(['Chennai', 'Coimbatore', 'Mumbai', 'Hyderabad', 'Delhi'])
    }
    documents = set(random.sample(DOCUMENTS, random.randint(2, len(DOCUMENTS))))
    return profile, documents


def label_for_scholarship(profile, documents, scholarship):
    cgpa = parse_cgpa(profile['marks'])
    income = float(profile['familyIncome'])
    community = profile['community']
    course = profile['course'].lower()
    department = profile['department'].lower()
    location = profile['location'].lower()
    score = 0

    if cgpa >= scholarship['min_cgpa']:
        score += 30
    if income <= scholarship['max_income']:
        score += 25
    if community in scholarship['eligible_communities']:
        score += 20
    if scholarship['courses'] == ['All'] or any(course_name.lower() in course or course_name.lower() in department for course_name in scholarship['courses']):
        score += 15
    if scholarship['location'] == 'All' or scholarship['location'].lower() in location:
        score += 10
    if any(doc not in documents for doc in scholarship['required_documents']):
        score -= 10

    return 1 if score >= 40 else 0


def generate_training_data(n_samples=1500):
    profiles = []
    documents = []
    labels = []
    for _ in range(n_samples):
        profile, docs = create_training_sample()
        profiles.append(profile)
        documents.append(docs)
        labels.append([label_for_scholarship(profile, docs, sch) for sch in scholarship_catalog])
    return profiles, documents, labels


def sigmoid(value):
    try:
        return 1.0 / (1.0 + math.exp(-value))
    except OverflowError:
        return 0.0 if value < 0 else 1.0


def train_model(output_path=MODEL_PATH):
    random.seed(42)
    profiles, documents, labels = generate_training_data()
    X = [feature_vector(profile, docs) for profile, docs in zip(profiles, documents)]
    n_features = len(X[0])
    n_labels = len(scholarship_catalog)

    weights = [[random.uniform(-0.01, 0.01) for _ in range(n_features)] for _ in range(n_labels)]
    biases = [0.0 for _ in range(n_labels)]
    learning_rate = 0.05
    epochs = 120

    for _ in range(epochs):
        gradients_w = [[0.0] * n_features for _ in range(n_labels)]
        gradients_b = [0.0] * n_labels

        for x_vec, y_vec in zip(X, labels):
            for label_index in range(n_labels):
                z = sum(weight * x for weight, x in zip(weights[label_index], x_vec)) + biases[label_index]
                prediction = sigmoid(z)
                error = prediction - y_vec[label_index]
                for feature_index, x_value in enumerate(x_vec):
                    gradients_w[label_index][feature_index] += error * x_value
                gradients_b[label_index] += error

        batch_size = len(X)
        for label_index in range(n_labels):
            for feature_index in range(n_features):
                weights[label_index][feature_index] -= learning_rate * gradients_w[label_index][feature_index] / batch_size
            biases[label_index] -= learning_rate * gradients_b[label_index] / batch_size

    model_data = {'weights': weights, 'biases': biases}
    with open(output_path, 'wb') as model_file:
        pickle.dump(model_data, model_file)
    return output_path


def load_model(path=MODEL_PATH):
    if not os.path.exists(path):
        raise FileNotFoundError(f'Model file not found at {path}')
    with open(path, 'rb') as model_file:
        return pickle.load(model_file)


def predict_probabilities(profile, documents, model):
    x_vec = feature_vector(profile, documents)
    probabilities = []
    for label_index in range(len(scholarship_catalog)):
        z = sum(weight * x for weight, x in zip(model['weights'][label_index], x_vec)) + model['biases'][label_index]
        probabilities.append(sigmoid(z))
    return probabilities


def recommend(profile, documents):
    model = load_model()
    probabilities = predict_probabilities(profile, documents, model)
    recommendations = []
    for scholarship, probability in zip(scholarship_catalog, probabilities):
        missing_documents = [doc for doc in scholarship['required_documents'] if doc not in documents]
        eligibility = max(0, int(probability * 100) - len(missing_documents) * 5)
        if eligibility >= 25:
            recommendations.append({
                'scholarship_id': scholarship['id'],
                'name': scholarship['name'],
                'category': scholarship['category'],
                'amount': scholarship['amount'],
                'eligibility': eligibility,
                'missing_documents': missing_documents,
                'details': {
                    'min_cgpa': scholarship['min_cgpa'],
                    'max_income': scholarship['max_income'],
                    'eligible_communities': scholarship['eligible_communities'],
                    'required_documents': scholarship['required_documents']
                }
            })
    recommendations.sort(key=lambda item: item['eligibility'], reverse=True)
    return recommendations
