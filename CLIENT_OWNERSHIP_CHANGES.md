# Client Ownership Model - Migration Guide

## 🎯 New Business Logic

### OLD Model (Wrong):
- Client assigned to ONE user only
- When supervisor assigns to salesman → client moves to salesman
- Supervisor loses access

### NEW Model (Correct):
- **Supervisor OWNS the client** (assigned_user_id)
- **Supervisor SHARES with salesman** (shared_with_salesman_id)
- Supervisor keeps full access (edit, report, manage)
- Salesman gets read-only access (view, report only)

## 📊 Database Changes

### New Field Added to `clients` table:
```sql
shared_with_salesman_id INTEGER  -- FK to users.id, nullable
```

### Field Meanings:
- **`assigned_user_id`** = Owner (supervisor) - FULL ACCESS
- **`shared_with_salesman_id`** = Shared salesman - READ-ONLY ACCESS  
- **`salesman_name`** = Display field only (unchanged)

## 🔧 Migration Steps

### 1. Run Migration Script:
```bash
python add_shared_salesman_field.py
```
Press ENTER when prompted.

### 2. Restart Flask App:
```bash
python app.py
```

## 📝 What Changed

### Backend (`app.py`):

1. **Client Model** (`database/models.py`):
   - Added `shared_with_salesman_id` field
   - Added `shared_with_salesman` relationship

2. **Client List Endpoint** (`/api/clients/list`):
   - **Supervisors**: See ONLY clients they OWN (assigned_user_id = supervisor)
   - **Salesmen**: See ONLY clients SHARED with them (shared_with_salesman_id = salesman)

3. **Client Names Endpoint** (`/api/clients/names`):
   - **Supervisors**: See their owned clients for reporting
   - **Salesmen**: See shared clients for reporting

4. **Batch Assignment** (`/api/clients/names-with-salesman`):
   - Returns `shared_with_salesman_id` for displaying current assignments

5. **Assign Client** (`/api/supervisors/assign-client`):
   - Sets `shared_with_salesman_id` = salesman
   - Sets `salesman_name` = salesman username
   - Keeps `assigned_user_id` = supervisor (unchanged)

6. **Unassign Client** (`/api/supervisors/unassign-client`):
   - Clears `shared_with_salesman_id`
   - Clears `salesman_name`
   - Keeps `assigned_user_id` = supervisor (unchanged)

7. **Permission Checks**:
   - Salesmen CANNOT edit clients (read-only)
   - Supervisors can ONLY edit their owned clients
   - Admins can edit all clients

## 🎨 Frontend Changes

### Team Management:
- Displays clients owned by supervisor
- Shows which salesman each client is shared with
- Batch assignment shares clients (doesn't transfer ownership)

### Clients Page:
- **Supervisors**: See all their owned clients
- **Salesmen**: See all clients shared with them

### Reports:
- **Supervisors**: Can create reports for their owned clients
- **Salesmen**: Can create reports for shared clients (read-only)

## ✅ Testing Checklist

After migration:

1. **As Supervisor**:
   - [ ] Can see all owned clients in Clients page
   - [ ] Can edit owned clients
   - [ ] Can assign clients to salesmen via Team Management
   - [ ] Can unassign clients from salesmen
   - [ ] Can create reports for owned clients
   - [ ] Can view/print salesman reports

2. **As Salesman**:
   - [ ] Can see clients shared with them in Clients page
   - [ ] CANNOT edit any client (read-only)
   - [ ] Can create reports for shared clients
   - [ ] Cannot access Team Management

3. **Client Assignment**:
   - [ ] Assigning client to salesman keeps supervisor as owner
   - [ ] Salesman can see the client after assignment
   - [ ] Supervisor still sees the client after assignment
   - [ ] Unassigning removes client from salesman's view
   - [ ] Supervisor still has the client after unassignment

## 🚨 Important Notes

1. **DO NOT** manually edit `salesman_name` field - it's managed automatically
2. **DO NOT** change `assigned_user_id` when sharing - it's the ownership field
3. **Salesmen are READ-ONLY** - they cannot edit clients, only view and report
4. **Supervisor retains ownership** - clients never leave the supervisor's list

## 🔄 Rollback (if needed)

If you need to rollback:
1. Stop the Flask app
2. Restore database backup
3. Revert code changes in `app.py` and `database/models.py`

