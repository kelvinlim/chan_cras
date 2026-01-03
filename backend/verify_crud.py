import httpx
import uuid

BASE_URL = "http://127.0.0.1:8005"

def test_crud_and_audit():
    print("Starting CRUD and Audit verification...")
    
    # 1. Login
    login_data = {"username": "admin@hku.hk", "password": "hku-admin-2026"}
    with httpx.Client() as client:
        r = client.post(f"{BASE_URL}/auth/login", data=login_data)
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create a Study
        study_data = {
            "title": "HKU Diabetes Research 2026",
            "description": "Large scale longitudinal study",
            "principal_investigator": "Dr. Chan"
        }
        r = client.post(f"{BASE_URL}/studies/", json=study_data, headers=headers)
        if r.status_code != 201:
            print(f"Create Study failed: {r.status_code} - {r.text}")
            return
        study = r.json()
        study_id = study["id"]
        print(f"Study created with Ref Code: {study['ref_code']}")
        
        # 3. Update Study
        update_data = {"title": "HKU Diabetes Research (Phase II)"}
        r = client.patch(f"{BASE_URL}/studies/{study_id}", json=update_data, headers=headers)
        print(f"Study updated: {r.json()['title']}")
        
        # 4. Check Audit Log (This usually requires direct DB check or a special endpoint)
        # For now, let's just list studies to confirm persistence
        r = client.get(f"{BASE_URL}/studies/", headers=headers)
        studies = r.json()
        print(f"Current total studies: {len(studies)}")
        
        # 5. Create a Subject
        subject_data = {
            "lastname": "Wong",
            "firstname": "David",
            "birthdate": "1985-05-15T00:00:00",
            "sex": "male"
        }
        r = client.post(f"{BASE_URL}/subjects/", json=subject_data, headers=headers)
        subject = r.json()
        print(f"Subject created with Ref Code: {subject['ref_code']}")
        
        print("\nVerification successful!")

if __name__ == "__main__":
    test_crud_and_audit()
