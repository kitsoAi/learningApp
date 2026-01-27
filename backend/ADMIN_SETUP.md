# Admin Role Setup

## Overview

The backend now includes admin role functionality with the following features:

- `is_admin` field on User model
- Admin-only endpoints for user management
- Protected routes using `get_current_admin_user` dependency

## Admin Endpoints

### List All Users (Admin Only)

```
GET /api/v1/admin/users
```

Returns a list of all users in the system.

### Make User Admin (Admin Only)

```
POST /api/v1/admin/users/{user_id}/make-admin
```

Grants admin privileges to a specific user.

### Remove Admin Privileges (Admin Only)

```
DELETE /api/v1/admin/users/{user_id}/remove-admin
```

Revokes admin privileges from a user (cannot remove from yourself).

## Creating the First Admin

Run the setup script to create the first admin user:

```powershell
python create_admin.py
```

This creates an admin account with:

- **Email**: `admin@puolingo.com`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change this password immediately after first login!

## Using Admin Endpoints

1. **Login as admin**:

   ```bash
   POST /api/v1/auth/login
   {
     "username": "admin@puolingo.com",
     "password": "admin123"
   }
   ```

2. **Use the access token** in the Authorization header:

   ```
   Authorization: Bearer <your_access_token>
   ```

3. **Access admin endpoints** at `/api/v1/admin/*`

## Protecting Your Own Endpoints

To make any endpoint admin-only, use the `get_current_admin_user` dependency:

```python
from app.api import dependencies

@router.post("/my-admin-endpoint")
async def my_admin_function(
    current_admin: User = Depends(dependencies.get_current_admin_user)
):
    # Only admins can access this
    return {"message": "Admin only!"}
```

## Security Notes

- Regular users have `is_admin = False` by default
- Admin users can manage other users' admin status
- Admins cannot remove their own admin privileges (safety measure)
- All admin endpoints return 403 Forbidden for non-admin users
