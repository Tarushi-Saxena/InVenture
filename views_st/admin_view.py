import streamlit as st
import pandas as pd
from database import execute_query

def show():
    from auth import require_auth
    require_auth(['admin'])
    
    st.title("👑 Admin Dashboard")
    st.write(f"Welcome back, {st.session_state['user']['name']}!")
    
    # Fetch Data
    startups = execute_query("SELECT * FROM startups")
    
    # Calculate stats
    total_startups = len(startups)
    
    # Calculate At Risk ('last_updated' > 7 days OR 'progress' < 30)
    # Using python pandas to easily calculate dates and percentages
    df = pd.DataFrame(startups)
    if not df.empty:
        df['last_updated'] = pd.to_datetime(df['last_updated'])
        now = pd.Timestamp.now()
        df['days_since_update'] = (now - df['last_updated']).dt.days
        df['is_at_risk'] = (df['days_since_update'] > 7) | (df['progress'] < 30)
        at_risk_count = df['is_at_risk'].sum()
        avg_progress = df['progress'].mean()
    else:
        at_risk_count = 0
        avg_progress = 0
    
    # Stats row
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Startups", total_startups)
    col2.metric("At-Risk Startups", at_risk_count, delta="Requires Attention", delta_color="inverse")
    col3.metric("Avg Progress", f"{avg_progress:.1f}%")
    
    st.divider()
    
    tab1, tab2 = st.tabs(["🚀 Startups & Feedback", "👥 User Management"])
    
    with tab1:
        st.subheader("Manage Startups")
        
        if not df.empty:
            filter_val = st.selectbox("Stage Filter", ["All", "At Risk", "Idea", "MVP", "Funding"])
            
            if filter_val == "At Risk":
                filtered_df = df[df['is_at_risk'] == True]
            elif filter_val != "All":
                filtered_df = df[df['stage'] == filter_val]
            else:
                filtered_df = df
                
            st.dataframe(filtered_df[['id', 'name', 'industry', 'stage', 'progress', 'funding_needed', 'is_at_risk']], use_container_width=True)
            
            # Feedback Form
            st.subheader("Add Feedback")
            with st.form("feedback_form"):
                startup_id_sel = st.selectbox("Select Startup", options=df['id'].tolist(), format_func=lambda x: df[df['id']==x]['name'].values[0])
                rating = st.slider("Rating", 1, 5, 3)
                category = st.selectbox("Category", ["Product", "Market", "Finance"])
                comment = st.text_area("Comment")
                submitted = st.form_submit_button("Submit Feedback")
                
                if submitted:
                    execute_query(
                        "INSERT INTO feedback (startup_id, admin_id, rating, category, comment) VALUES (%s, %s, %s, %s, %s)",
                        (startup_id_sel, st.session_state['user']['id'], rating, category, comment),
                        fetch="none"
                    )
                    st.success("Feedback submitted successfully!")
                    st.rerun()
        else:
            st.info("No startups found.")

    with tab2:
        st.subheader("System Users")
        users = execute_query("SELECT id, name, email, role, created_at FROM users")
        if users:
            users_df = pd.DataFrame(users)
            st.dataframe(users_df, use_container_width=True)
        
        st.subheader("Create New User")
        with st.form("create_user_form"):
            new_name = st.text_input("Name")
            new_email = st.text_input("Email")
            new_pass = st.text_input("Password", type="password")
            new_role = st.selectbox("Role", ["admin", "founder", "investor"])
            user_submit = st.form_submit_button("Create User")
            
            if user_submit:
                import bcrypt
                hashed = bcrypt.hashpw(new_pass.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                try:
                    execute_query(
                        "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
                        (new_name, new_email, hashed, new_role),
                        fetch="none"
                    )
                    st.success(f"User {new_email} created successfully!")
                    st.rerun()
                except Exception as e:
                    st.error(f"Error creating user: {e}")
