"""Authentication module for the application."""

from .dependencies import get_current_user
from .supabase import (
    change_password,
    delete_user,
    get_authenticated_client,
    get_supabase_admin_client,
    get_supabase_client,
    login_user,
    refresh_user_session,
    reset_password,
    signup_user,
)
