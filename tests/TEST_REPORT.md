# QA Penetration & Backend Report

### 1. Authenticating as Admin
✅ Admin authenticated successfully.

### 2. Fetching existing Collaboratore User
✅ Found Collaboratore: Stefano03 (ID: 2)
✅ Reset password and set role to COLLABORATORE for Stefano03
✅ Collaboratore (Stefano03) authenticated successfully.

### 3. Creating Dummy Cantiere (Indirizzo)
✅ Dummy Cantiere created with ID: 10

### 4. Creating Dummy Commessa linked to Cantiere
✅ Dummy Commessa created with ID: 7 and valore_totale: 2500.50

### 5. RBAC Test (Collaboratore Role)
✅ RBAC READ PASS: `valore_totale` is fully masked or absent for COLLABORATORE.
✅ RBAC DELETE PASS: Server correctly rejected deletion with 403 Forbidden.

### 6. Full Text Search (FTS) Test
✅ FTS PASS: Searching for 'SearchTest' correctly returned the associated Commessa.

### 7. Deletion Test (cascade=false)
✅ Cantiere deleted successfully with `cascade=false`.
✅ CASCADE PASS: Commessa 7 still exists after Cantiere deletion (cascade prevented deletion).
