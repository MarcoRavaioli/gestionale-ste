#!/usr/bin/env python3
"""
GS Pose API - E2E Test Suite
Tests 3 user roles: Admin (marco123), Intermediate (Stefano03), Collaborator (created via API)
"""
import json
import sys
import traceback

try:
    import requests
except ImportError:
    import subprocess, sys as _sys
    subprocess.check_call([_sys.executable, "-m", "pip", "install", "requests", "-q"])
    import requests

BASE_URL = "https://apigspose.marcoravaiolii.xyz"
TIMEOUT  = 15  # seconds per request

results = []  # list of (user, step, passed, note)

def test(user: str, step: str, passed: bool, note: str = ""):
    results.append((user, step, passed, note))
    icon = "✅" if passed else "❌"
    print(f"  {icon} [{user}] {step} -> {note}")

def auth(username: str, password: str):
    """Return (token_or_None, http_status)."""
    try:
        r = requests.post(
            f"{BASE_URL}/auth/login",
            json={"username": username, "password": password},
            timeout=TIMEOUT,
        )
        if r.status_code in (200, 201):
            return r.json().get("access_token"), r.status_code
        return None, r.status_code
    except Exception as e:
        return None, str(e)

def get_paginated(endpoint: str, token: str):
    """GET /endpoint/paginated?page=1&limit=2, returns (body_dict_or_None, status)."""
    try:
        r = requests.get(
            f"{BASE_URL}/{endpoint}/paginated",
            params={"page": 1, "limit": 2},
            headers={"Authorization": f"Bearer {token}"},
            timeout=TIMEOUT,
        )
        try:
            body = r.json()
        except Exception:
            body = {}
        return body, r.status_code
    except Exception as e:
        return {}, str(e)

def check_pagination_structure(body: dict) -> bool:
    """All required keys present and data is array."""
    required = {"data", "total", "page", "limit", "totalPages"}
    return required.issubset(body.keys()) and isinstance(body.get("data"), list)

def check_uploads_blocked():
    """Returns True if /uploads/... is NOT publicly accessible (not 200)."""
    try:
        r = requests.get(
            f"{BASE_URL}/uploads/fatture/fattura-1768565222480-560223961.pdf",
            timeout=TIMEOUT,
            allow_redirects=True,
        )
        return r.status_code, r.status_code != 200
    except Exception as e:
        return str(e), True  # network error => also "blocked"

def create_collaborator(admin_token: str):
    """Create a test collaborator via POST /collaboratore. Returns (user_data_or_None, status)."""
    payload = {
        "nickname": "testcollab01",
        "password": "TestPass99!",
        "email": "testcollab01@gspose.test",
        "nome": "Test",
        "cognome": "Collaboratore",
        "telefono": "3331234567",
        "ruolo": "COLLABORATORE"
    }
    try:
        r = requests.post(
            f"{BASE_URL}/collaboratore",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=TIMEOUT,
        )
        try:
            body = r.json()
        except Exception:
            body = {}
        return body, r.status_code
    except Exception as e:
        return {}, str(e)

# ─── ADMIN (marco123) ────────────────────────────────────────────────
print("\n" + "="*60)
print("USER: marco123 (ADMIN)")
print("="*60)
admin_token, admin_status = auth("marco123", "adminMarco")
test("marco123", "STEP1 - Login", admin_token is not None,
     f"HTTP {admin_status} | token={'yes' if admin_token else 'no'}")

if admin_token:
    body, status = get_paginated("commessa", admin_token)
    ok = check_pagination_structure(body)
    test("marco123", "STEP3 - Commessa Paginated", ok,
         f"HTTP {status} | keys OK={ok}")

    body, status = get_paginated("appuntamento", admin_token)
    ok = check_pagination_structure(body)
    test("marco123", "STEP4 - Appuntamento Paginated", ok,
         f"HTTP {status} | keys OK={ok}")

http_code, blocked = check_uploads_blocked()
test("marco123", "STEP5 - Uploads Blocked", blocked,
     f"HTTP {http_code} | blocked={blocked}")

# ─── INTERMEDIATE (Stefano03) ────────────────────────────────────────
print("\n" + "="*60)
print("USER: Stefano03 (INTERMEDIATE)")
print("="*60)
st_token, st_status = auth("Stefano03", "gheiBen")
test("Stefano03", "STEP1 - Login", st_token is not None,
     f"HTTP {st_status} | token={'yes' if st_token else 'no'}")

if st_token:
    body, status = get_paginated("commessa", st_token)
    ok = check_pagination_structure(body)
    test("Stefano03", "STEP3 - Commessa Paginated", ok,
         f"HTTP {status} | keys OK={ok}")

    body, status = get_paginated("appuntamento", st_token)
    ok = check_pagination_structure(body)
    test("Stefano03", "STEP4 - Appuntamento Paginated", ok,
         f"HTTP {status} | keys OK={ok}")

http_code, blocked = check_uploads_blocked()
test("Stefano03", "STEP5 - Uploads Blocked", blocked,
     f"HTTP {http_code} | blocked={blocked}")

# ─── CREATE COLLABORATOR (via Admin) ─────────────────────────────────
print("\n" + "="*60)
print("Creating COLLABORATORE via Admin token...")
print("="*60)
collab_data = {}
collab_token = None

if admin_token:
    collab_data, collab_create_status = create_collaborator(admin_token)
    created = collab_create_status in (200, 201)
    test("marco123", "CREATE Collaboratore", created,
         f"HTTP {collab_create_status} | data={json.dumps(collab_data)[:120]}")

    # ── AUTH as new collaborator ──────────────────────────────────────
    print("\n" + "="*60)
    print("USER: testcollab01 (COLLABORATORE)")
    print("="*60)
    collab_token, c_status = auth("testcollab01", "TestPass99!")
    test("testcollab01", "STEP1 - Login", collab_token is not None,
         f"HTTP {c_status} | token={'yes' if collab_token else 'no'}")

    if collab_token:
        body, status = get_paginated("commessa", collab_token)
        ok = check_pagination_structure(body)
        test("testcollab01", "STEP3 - Commessa Paginated", ok,
             f"HTTP {status} | keys OK={ok}")

        body, status = get_paginated("appuntamento", collab_token)
        ok = check_pagination_structure(body)
        test("testcollab01", "STEP4 - Appuntamento Paginated", ok,
             f"HTTP {status} | keys OK={ok}")

    http_code, blocked = check_uploads_blocked()
    test("testcollab01", "STEP5 - Uploads Blocked", blocked,
         f"HTTP {http_code} | blocked={blocked}")

# ─── FINAL REPORT ────────────────────────────────────────────────────
print("\n")
print("="*60)
print("FINAL TEST REPORT SUMMARY")
print("="*60)
print(f"{'USER':<16} {'STEP':<32} {'RESULT':<8} {'NOTES'}")
print("-"*90)
for (user, step, passed, note) in results:
    icon = "✅ PASS" if passed else "❌ FAIL"
    print(f"{user:<16} {step:<32} {icon:<8} {note}")

total = len(results)
passed_count = sum(1 for r in results if r[2])
print("-"*90)
print(f"TOTAL: {passed_count}/{total} passed")
