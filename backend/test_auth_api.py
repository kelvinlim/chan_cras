import httpx

BASE_URL = "http://127.0.0.1:8888"

def test_login():
    print("Testing local admin login...")
    login_data = {
        "username": "admin@hku.hk",
        "password": "hku-admin-2026"
    }
    
    with httpx.Client() as client:
        # Step 1: Login
        response = client.post(f"{BASE_URL}/auth/login", data=login_data)
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} - {response.text}")
            return
        
        token_data = response.json()
        token = token_data["access_token"]
        print("Login successful! Token received.")
        
        # Step 2: Verify user profile
        headers = {"Authorization": f"Bearer {token}"}
        profile_response = client.get(f"{BASE_URL}/users/me", headers=headers)
        
        if profile_response.status_code == 200:
            profile = profile_response.json()
            print(f"Profile verified for user: {profile['email']}")
            print(f"Admin Level: {profile['admin_level']}")
        else:
            print(f"Profile verification failed: {profile_response.status_code}")

if __name__ == "__main__":
    test_login()
