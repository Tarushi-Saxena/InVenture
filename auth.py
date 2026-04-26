import bcrypt
import streamlit as st
from database import execute_query

def login(email, password):
    query = "SELECT * FROM users WHERE email = %s"
    user = execute_query(query, (email,), fetch="one")
    
    if user:
        # Check password with bcrypt
        if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            st.session_state['user'] = user
            st.session_state['logged_in'] = True
            st.session_state['role'] = user['role']
            return True
    return False

def logout():
    st.session_state.clear()
    st.session_state['logged_in'] = False

def require_auth(roles=None):
    if 'logged_in' not in st.session_state or not st.session_state['logged_in']:
        st.warning("Please log in to access this page.")
        st.stop()
    
    if roles and st.session_state.get('role') not in roles:
        st.error(f"Access Denied. Only {', '.join(roles)} can access this.")
        st.stop()
