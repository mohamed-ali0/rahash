# Permission utilities

from backend.models import UserRole

def is_super_admin(user):
    """Check if user has super admin role"""
    return user.role == UserRole.SUPER_ADMIN

def is_supervisor(user):
    """Check if user has sales supervisor role"""
    return user.role == UserRole.SALES_SUPERVISOR

def is_salesman(user):
    """Check if user has salesman role"""
    return user.role == UserRole.SALESMAN

def can_manage_users(user):
    """Check if user can manage other users (admin only)"""
    return is_super_admin(user)

def can_manage_team(user):
    """Check if user can manage team (admin or supervisor)"""
    return is_super_admin(user) or is_supervisor(user)

def can_view_all_clients(user):
    """Check if user can view all clients"""
    return is_super_admin(user)

def can_edit_client(user, client):
    """Check if user can edit a specific client"""
    if is_super_admin(user):
        return True
    return client.assigned_user_id == user.id

def can_view_client(user, client):
    """Check if user can view a specific client"""
    if is_super_admin(user):
        return True
    if is_supervisor(user):
        # Supervisor can view their own clients and their salesmen's clients
        if client.assigned_user_id == user.id:
            return True
        # Check if client is assigned to one of supervisor's salesmen
        salesmen_ids = [s.id for s in user.salesmen]
        return client.assigned_user_id in salesmen_ids
    return client.assigned_user_id == user.id
