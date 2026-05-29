from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from recommendation_model import recommend, load_model, train_model

app = Flask(__name__)
CORS(app)

try:
    load_model()
except FileNotFoundError:
    print('Recommendation model not found, training new model...')
    train_model()

scholarship_catalog = [
    {
        'id': 1,
        'name': 'Prime Merit Fellowship',
        'category': 'Merit-based',
        'min_cgpa': 8.0,
        'max_income': 999999,
        'eligible_communities': ['General', 'SC', 'ST', 'OBC', 'EWS'],
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
        'eligible_communities': ['General', 'SC', 'ST', 'OBC', 'EWS'],
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
        'eligible_communities': ['General', 'SC', 'ST', 'OBC', 'EWS'],
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
        'eligible_communities': ['General', 'SC', 'ST', 'OBC', 'EWS'],
        'courses': ['Computer Science', 'Electronics', 'Mechanical', 'Civil'],
        'location': 'All',
        'last_date': '2026-08-01',
        'amount': '₹30,000',
        'required_documents': ['Aadhaar Card', 'Student Photo', 'Marksheet', 'Student ID Card']
    }
]

required_documents = [
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


@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({'status': 'ok', 'timestamp': datetime.utcnow().isoformat() + 'Z'})


@app.route('/api/recommendations', methods=['POST'])
def recommendations():
    payload = request.json or {}
    profile = payload.get('profile', {})
    documents = set(payload.get('documents', []))
    recommendations = recommend(profile, documents)
    return jsonify({'recommendations': recommendations})


@app.route('/api/documents', methods=['GET'])
def documents_list():
    return jsonify({'required_documents': required_documents})


@app.route('/api', methods=['GET'])
def api_index():
    return jsonify({'status': 'ok', 'message': 'Scholarship Bloom API is running'})


@app.route('/', methods=['GET'])
def root_index():
    return jsonify({'status': 'ok', 'message': 'Scholarship Bloom backend is running'})


def parse_cgpa(value):
    try:
        numeric = float(str(value).replace('%', '').strip())
    except ValueError:
        return 0.0
    if '%' in str(value):
        return numeric / 10.0
    return numeric if numeric <= 10 else numeric / 10.0


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
