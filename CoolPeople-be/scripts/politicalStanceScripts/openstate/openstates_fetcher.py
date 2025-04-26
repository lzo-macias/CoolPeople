import os
import requests

API_KEY = '0bc68d68-2aa4-4ed3-9bda-f585c321f442'
BASE_URL = 'https://v3.openstates.org/'
HEADERS = {"X-API-KEY": API_KEY}

def get_legislator_id(name):
    resp = requests.get(BASE_URL + 'people', headers=HEADERS, params={'name': name, 'jurisdiction': 'New York'})
    data = resp.json()
    return data['results'][0]['id'] if data['results'] else None

def get_legislator_bills(leg_id):
    resp = requests.get(BASE_URL + 'bills', headers=HEADERS, params={'sponsor_person_id': leg_id, 'jurisdiction': 'New York'})
    return resp.json().get('results', [])

def get_legislator_votes(leg_id):
    resp = requests.get(BASE_URL + 'votes', headers=HEADERS, params={'voter_id': leg_id})
    return resp.json().get('results', [])

if __name__ == "__main__":
    name = "Jenifer Rajkumar"
    lid = get_legislator_id(name)
    print("Legislator ID:", lid)

    bills = get_legislator_bills(lid)
    votes = get_legislator_votes(lid)

    output_path = 'scripts/politicalStanceScripts/openstate/openstates_raw.txt'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("📜 Bills Sponsored:\n")
        for b in bills:
            f.write(f"- {b.get('title', 'No Title')} (ID: {b.get('identifier')})\n")

        f.write("\n🗳️ Votes Cast:\n")
        for v in votes:
            bill = v.get('bill', {})
            f.write(f"- {bill.get('title', 'Unknown Title')} (Vote on {bill.get('identifier', 'Unknown ID')})\n")

    print(f"✅ Data written to {output_path}")
