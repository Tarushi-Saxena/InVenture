import streamlit as st
import pandas as pd
from database import execute_query

def show():
    from auth import require_auth
    require_auth(['admin'])
    
    st.title("Admin Portal")
    st.write(f"Welcome back, **{st.session_state['user']['name']}**!")
    
    startups = execute_query("SELECT * FROM startups")
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
        
    st.subheader("Ecosystem Health")
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Startups", len(df) if not df.empty else 0)
    col2.metric("At-Risk Startups", at_risk_count, delta="- Requires Attention" if at_risk_count > 0 else "All Good", delta_color="inverse")
    col3.metric("Avg Progress", f"{avg_progress:.1f}%")
    
    if not df.empty:
        st.write("### Stage Distribution")
        stage_counts = df['stage'].value_counts()
        st.bar_chart(stage_counts)
    
    st.divider()
    
    tab1, tab2 = st.tabs(["Startup Management", "User Management"])
    
    with tab1:
        st.subheader("Portfolio Startups")
        
        if not df.empty:
            filter_val = st.selectbox("Stage Filter", ["All", "At Risk", "Idea", "MVP", "Funding"])
            
            if filter_val == "At Risk":
                filtered_df = df[df['is_at_risk'] == True]
            elif filter_val != "All":
                filtered_df = df[df['stage'] == filter_val]
            else:
                filtered_df = df
                
            for _, s in filtered_df.iterrows():
                alert_icon = "[AT RISK]" if s['is_at_risk'] else "[OK]"
                with st.expander(f"{alert_icon} {s['name']}  —  {s['stage']}  ({s['progress']}%)"):
                    st.write(f"**Industry:** {s['industry']}  |  **Funding Needed:** ₹{s['funding_needed']:,.2f}")
                    st.write(s['description'])
                    st.progress(int(s['progress']) / 100)
                    
                    st.write("---")
                    colA, colB = st.columns(2)
                    with colA:
                        if st.button(f"View Full Profile", key=f"view_{s['id']}"):
                            st.session_state['view_startup_id'] = s['id']
                            st.rerun()
                    with colB:
                        if st.button(f"Delete Startup", key=f"del_s_{s['id']}", type="primary"):
                            execute_query("DELETE FROM startups WHERE id = ?", (s['id'],), fetch="none")
                            st.success("Deleted!")
                            st.rerun()
                            
                    st.write("#### Add Feedback")
                    with st.form(f"fb_{s['id']}"):
                        rating = st.slider("Rating", 1, 5, 3)
                        category = st.selectbox("Category", ["Product", "Market", "Finance"])
                        comment = st.text_area("Comment")
                        if st.form_submit_button("Submit Application Feedback"):
                            execute_query(
                                "INSERT INTO feedback (startup_id, admin_id, rating, category, comment) VALUES (?, ?, ?, ?, ?)",
                                (s['id'], st.session_state['user']['id'], rating, category, comment),
                                fetch="none"
                            )
                            st.success("Feedback added!")
        else:
            st.info("No startups found.")

    with tab2:
        st.subheader("System Users")
        users = execute_query("SELECT id, name, email, role, created_at FROM users")
        if users:
            for u in users:
                c1, c2, c3, c4 = st.columns([2, 2, 1, 1])
                c1.write(f"**{u['name']}**")
                c2.write(u['email'])
                c3.write(f"`{u['role']}`")
                with c4:
                    if u['id'] != st.session_state['user']['id']: # Prevent self-delete
                        if st.button("Delete", key=f"del_u_{u['id']}", type="primary"):
                            execute_query("DELETE FROM users WHERE id = ?", (u['id'],), fetch="none")
                            st.rerun()
        
        st.write("---")
        st.subheader("Create New User")
        with st.form("create_user_form"):
            new_name = st.text_input("Name")
            new_email = st.text_input("Email")
            new_pass = st.text_input("Password", type="password")
            new_role = st.selectbox("Role", ["admin", "founder", "investor"])
            user_submit = st.form_submit_button("Create User")
            
            if user_submit:
                if not new_email or not new_pass:
                    st.error("Fields cannot be empty.")
                else:
                    import bcrypt
                    hashed = bcrypt.hashpw(new_pass.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    try:
                        execute_query(
                            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                            (new_name, new_email, hashed, new_role),
                            fetch="none"
                        )
                        st.success(f"User {new_email} created successfully!")
                        st.rerun()
                    except Exception as e:
                        st.error("Error creating user: Email might already exist.")
