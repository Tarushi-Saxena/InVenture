import streamlit as st
import pandas as pd
from database import execute_query

def show(startup_id):
    st.button("⬅️ Back to Dashboard", on_click=lambda: st.session_state.pop("view_startup_id", None))
    
    startup = execute_query("SELECT * FROM startups WHERE id = %s", (startup_id,), fetch="one")
    if not startup:
        st.error("Startup not found.")
        return
        
    st.title(f"{startup['name']} 🚀")
    
    col1, col2, col3 = st.columns(3)
    col1.metric("Industry", startup['industry'])
    col2.metric("Stage", startup['stage'])
    col3.metric("Progress", f"{startup['progress']}%")
    
    st.progress(startup['progress'] / 100)
    
    st.divider()
    st.subheader("About")
    st.write(startup['description'])
    st.write(f"**Funding Needed:** ₹{startup['funding_needed']:,.2f}")
    
    colA, colB = st.columns(2)
    with colA:
        st.subheader("💬 Feedback & Ratings")
        feedbacks = execute_query(
            "SELECT f.rating, f.category, f.comment FROM feedback f WHERE f.startup_id = %s",
            (startup_id,)
        )
        if feedbacks:
            df = pd.DataFrame(feedbacks)
            st.dataframe(df, use_container_width=True)
            avg_rating = df['rating'].mean()
            st.write(f"**Average Rating:** {avg_rating:.1f}/5.0")
        else:
            st.write("No feedback available.")
            
    with colB:
        st.subheader("📄 Public Documents")
        docs = execute_query("SELECT * FROM documents WHERE startup_id = %s", (startup_id,))
        if docs:
            for d in docs:
                st.write(f"📎 **{d['file_name']}**")
                # Since we don't have a static file server easily in standard Streamlit code without extra config,
                # we'll use Streamlit's native st.download_button by reading the file.
                try:
                    with open(d['file_path'], "rb") as f:
                        file_data = f.read()
                        st.download_button(label=f"Download {d['file_name']}", data=file_data, file_name=d['file_name'])
                except Exception as e:
                    st.write("(File not found on server.)")
        else:
            st.write("No documents uploaded.")
