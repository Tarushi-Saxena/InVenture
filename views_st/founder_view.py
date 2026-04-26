import os
import streamlit as st
import pandas as pd
from database import execute_query

def save_uploaded_file(uploaded_file, startup_id):
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    file_path = os.path.join(upload_dir, uploaded_file.name)
    with open(file_path, "wb") as f:
        f.write(uploaded_file.getbuffer())
        
    execute_query(
        "INSERT INTO documents (startup_id, file_name, file_path) VALUES (%s, %s, %s)",
        (startup_id, uploaded_file.name, file_path),
        fetch="none"
    )
    return file_path

def show():
    from auth import require_auth
    require_auth(['founder'])
    
    st.title("🚀 Founder Dashboard")
    founder_id = st.session_state['user']['id']
    
    tab1, tab2, tab3 = st.tabs(["My Startups", "Add New Startup", "Calculators"])
    
    with tab1:
        startups = execute_query("SELECT * FROM startups WHERE founder_id = %s", (founder_id,))
        if not startups:
            st.info("You haven't created any startups yet. Go to the 'Add New Startup' tab!")
        else:
            startup_sel = st.selectbox("Select your startup", options=startups, format_func=lambda x: x['name'])
            
            if startup_sel:
                st.subheader(f"{startup_sel['name']} - Current Status")
                st.write(startup_sel['description'])
                
                col1, col2 = st.columns(2)
                with col1:
                    new_stage = st.selectbox("Stage", ["Idea", "MVP", "Funding"], index=["Idea", "MVP", "Funding"].index(startup_sel['stage']))
                with col2:
                    new_progress = st.slider("Progress %", 0, 100, int(startup_sel['progress']))
                
                if st.button("Update Progress"):
                    execute_query(
                        "UPDATE startups SET stage = %s, progress = %s WHERE id = %s",
                        (new_stage, new_progress, startup_sel['id']),
                        fetch="none"
                    )
                    st.success("Successfully updated!")
                    st.rerun()
                
                st.divider()
                st.subheader("📚 Feedback Received")
                feedbacks = execute_query(
                    "SELECT f.rating, f.category, f.comment, f.created_at, u.name as admin_name \
                    FROM feedback f JOIN users u ON f.admin_id = u.id WHERE f.startup_id = %s",
                    (startup_sel['id'],)
                )
                if feedbacks:
                    df_feedback = pd.DataFrame(feedbacks)
                    st.dataframe(df_feedback, use_container_width=True)
                else:
                    st.write("No feedback received yet.")
                
                st.divider()
                st.subheader("📄 Documents")
                docs = execute_query("SELECT * FROM documents WHERE startup_id = %s", (startup_sel['id'],))
                if docs:
                    for d in docs:
                        st.write(f"- {d['file_name']} (uploaded: {d['uploaded_at']})")
                
                uploaded_file = st.file_uploader("Upload new document (PDF, DOCX, PPTX)", type=['pdf', 'docx', 'pptx'])
                if uploaded_file is not None:
                    if st.button("Upload"):
                        save_uploaded_file(uploaded_file, startup_sel['id'])
                        st.success(f"Uploaded {uploaded_file.name} successfully!")
                        st.rerun()

    with tab2:
        st.subheader("Register a new Startup")
        with st.form("new_startup"):
            s_name = st.text_input("Startup Name")
            s_ind = st.text_input("Industry (e.g., EdTech, FinTech)")
            s_stage = st.selectbox("Current Stage", ["Idea", "MVP", "Funding"])
            s_desc = st.text_area("Description")
            s_funding = st.number_input("Funding Needed (₹)", min_value=0, step=1000)
            
            if st.form_submit_button("Create Startup"):
                if not s_name or not s_ind:
                    st.error("Name and Industry are required!")
                else:
                    existing = execute_query("SELECT id FROM startups WHERE LOWER(name) = LOWER(%s)", (s_name,), fetch="one")
                    if existing:
                        st.error("A startup with this exact name already exists in the incubator!")
                    else:
                        res = execute_query(
                            "INSERT INTO startups (name, industry, stage, description, funding_needed, founder_id) VALUES (%s, %s, %s, %s, %s, %s)",
                            (s_name, s_ind, s_stage, s_desc, s_funding, founder_id),
                            fetch="none"
                        )
                        if res is not None:
                            import time
                            st.success("Startup created successfully!")
                            time.sleep(1.5)
                            st.rerun()

    with tab3:
        st.subheader("🧮 Founder Calculators")
        
        col1, col2 = st.columns(2)
        with col1:
            st.markdown("### Burn Rate & Runway")
            cash = st.number_input("Current Cash (₹)", min_value=0, step=1000)
            rev = st.number_input("Monthly Revenue (₹)", min_value=0, step=1000)
            exp = st.number_input("Monthly Expenses (₹)", min_value=0, step=1000)
            
            burn = exp - rev
            st.metric("Monthly Burn Rate", f"₹{burn:,.2f}")
            if burn > 0:
                runway = cash / burn
                st.metric("Months of Runway", f"{runway:.1f}", delta="Warning: < 3 months!" if runway < 3 else None, delta_color="inverse" if runway < 3 else "normal")
            else:
                st.success("You are profitable! Infinite runway.")

        with col2:
            st.markdown("### Funding Required")
            desired_runway = st.number_input("Desired Runway (Months)", min_value=0, value=18)
            if burn > 0:
                needed = burn * desired_runway
                st.metric(f"Funding Need for {desired_runway}mo", f"₹{needed:,.2f}")
            else:
                st.write("You don't need funding for operations!")
