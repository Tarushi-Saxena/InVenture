import streamlit as st
from auth import login, logout
from views_st import admin_view, founder_view, investor_view, startup_detail

st.set_page_config(page_title="InVenture", page_icon="🚀", layout="wide")

st.markdown("""
    <style>
        .block-container { padding-top: 2rem; }
    </style>
""", unsafe_allow_html=True)

# Initialize Session State
if 'logged_in' not in st.session_state:
    st.session_state['logged_in'] = False
if 'user' not in st.session_state:
    st.session_state['user'] = None

# Routing
if not st.session_state['logged_in']:
    st.title("🚀 InVenture")
    st.subheader("Startup Incubator Management System")
    
    tab1, tab2 = st.tabs(["Login", "Register"])
    
    with tab1:
        st.write("Please log in to continue.")
        with st.form("login_form"):
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Login")
            
            if submitted:
                if login(email, password):
                    st.success("Logged in successfully!")
                    st.rerun()
                else:
                    st.error("Invalid email or password")
        
        st.divider()
        st.info("**Demo Accounts (Password: `password123`)**\n"
                "- Admin: `admin@incubator.com`\n"
                "- Founder: `alice@startup.com`\n"
                "- Investor: `carol@invest.com`")
                
    with tab2:
        st.write("Create a new account.")
        with st.form("register_form"):
            new_name = st.text_input("Full Name")
            new_email = st.text_input("Email")
            new_password = st.text_input("Password", type="password")
            new_role = st.selectbox("I am a:", ["founder", "investor"], format_func=lambda x: "Founder" if x == "founder" else "Investor")
            reg_submitted = st.form_submit_button("Register")
            
            if reg_submitted:
                if not new_email or not new_password or not new_name:
                    st.error("Please fill in all fields.")
                else:
                    import bcrypt
                    from database import execute_query
                    hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    try:
                        execute_query(
                            "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
                            (new_name, new_email, hashed, new_role),
                            fetch="none"
                        )
                        st.success("Account created successfully! You can now log in.")
                    except Exception as e:
                        if "UNIQUE constraint failed" in str(e) or "Duplicate entry" in str(e):
                            st.error("Email is already registered.")
                        else:
                            st.error(f"Error creating account.")
else:
    # Sidebar
    with st.sidebar:
        st.title("InVenture")
        st.write(f"Logged in as: **{st.session_state['user']['name']}**")
        st.write(f"Role: **{st.session_state['role'].capitalize()}**")
        if st.button("Logout"):
            logout()
            st.rerun()
            
    # Main Content Router
    if 'view_startup_id' in st.session_state and st.session_state['view_startup_id']:
        startup_detail.show(st.session_state['view_startup_id'])
    else:
        role = st.session_state['role']
        if role == 'admin':
            admin_view.show()
        elif role == 'founder':
            founder_view.show()
        elif role == 'investor':
            investor_view.show()
        else:
            st.error("Unknown role!")
