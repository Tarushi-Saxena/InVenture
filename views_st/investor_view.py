import streamlit as st
import pandas as pd
from database import execute_query

def show():
    from auth import require_auth
    require_auth(['investor'])
    
    st.title("Investor Portal")
    investor_id = st.session_state['user']['id']
    
    # Get current preferences
    pref = execute_query("SELECT * FROM investor_preferences WHERE investor_id = ?", (investor_id,), fetch="one")
    if not pref:
        pref = {'industry': 'Any', 'stage': 'Idea', 'min_investment': 0, 'max_investment': 0}

    tab1, tab2, tab3 = st.tabs(["Matchmaking", "Shortlist & Interests", "Preferences"])
    
    with tab3:
        st.subheader("Investment Preferences")
        with st.form("pref_form"):
            ind = st.text_input("Preferred Industry (or 'Any')", value=pref.get('industry', 'Any'))
            stage = st.selectbox("Preferred Stage", ["Idea", "MVP", "Funding"], index=["Idea", "MVP", "Funding"].index(pref.get('stage', 'Idea')))
            min_inv = st.number_input("Min Required Capital allowed (₹)", value=float(pref.get('min_investment', 0)), step=10000.0)
            max_inv = st.number_input("Max Required Capital allowed (₹)", value=float(pref.get('max_investment', 0)), step=10000.0)
            
            if st.form_submit_button("Save Strategy"):
                existing = execute_query("SELECT id FROM investor_preferences WHERE investor_id = ?", (investor_id,), fetch="one")
                if existing:
                    execute_query(
                        "UPDATE investor_preferences SET industry=?, stage=?, min_investment=?, max_investment=? WHERE investor_id=?",
                        (ind, stage, min_inv, max_inv, investor_id), fetch="none"
                    )
                else:
                    execute_query(
                        "INSERT INTO investor_preferences (investor_id, industry, stage, min_investment, max_investment) VALUES (?, ?, ?, ?, ?)",
                        (investor_id, ind, stage, min_inv, max_inv), fetch="none"
                    )
                st.success("Investment strategy updated!")
                st.rerun()

    with tab1:
        st.subheader("Startup Deal Flow")
        startups = execute_query("SELECT * FROM startups")
        
        # Missing Feature Added: Filter Startups By Stage
        filter_stage = st.radio("Filter Deals By Stage:", ["All", "Idea", "MVP", "Funding"], horizontal=True)
        
        matches = []
        for s in startups:
            # Stage Filter Logic
            if filter_stage != "All" and s['stage'] != filter_stage:
                continue
                
            score = 0
            reasons = []
            if pref['industry'] != 'Any' and s['industry'].lower() == pref['industry'].lower():
                score += 40
                reasons.append("Industry match")
            if s['stage'] == pref['stage']:
                score += 30
                reasons.append("Stage match")
            
            fn = float(s['funding_needed'] or 0)
            if fn >= float(pref['min_investment']) and (float(pref['max_investment']) == 0 or fn <= float(pref['max_investment'])):
                score += 30
                reasons.append("Funding range fits")
                
            s['match_score'] = score
            s['match_reason'] = " + ".join(reasons) if reasons else "No specific match"
            matches.append(s)
            
        # Sort by match score
        matches = sorted(matches, key=lambda x: x['match_score'], reverse=True)
        
        if not matches:
            st.info("No startups found matching your filter criteria.")
            
        for m in matches:
            color = "green" if m['match_score'] >= 70 else ("orange" if m['match_score'] >= 40 else "red")
            st.markdown(f"### {m['name']} — :{color}[{m['match_score']}% Match]")
            
            with st.container(border=True):
                c1, c2, c3 = st.columns(3)
                c1.write(f"**Industry:** {m['industry']}")
                c2.write(f"**Stage:** {m['stage']}")
                c3.write(f"**Capital Needed:** ₹{m['funding_needed']:,.2f}")
                
                st.write(f"*{m['description']}*")
                st.info(f"**Match Logic:** {m['match_reason']}")
                
                b1, b2, b3 = st.columns(3)
                with b1:
                    if st.button("View Full Profile", key=f"view_{m['id']}"):
                        st.session_state['view_startup_id'] = m['id']
                        st.rerun()
                with b2:
                    if st.button("Mark Interested", key=f"int_{m['id']}"):
                        try:
                            execute_query("INSERT INTO interests (investor_id, startup_id) VALUES (?, ?)", (investor_id, m['id']), fetch="none")
                            st.success("Marked!")
                        except:
                            st.error("Already marked")
                with b3:
                    if st.button("Add to Shortlist", key=f"short_{m['id']}", type="primary"):
                        try:
                            execute_query("INSERT INTO shortlists (investor_id, startup_id) VALUES (?, ?)", (investor_id, m['id']), fetch="none")
                            st.success("Shortlisted!")
                        except:
                            st.error("Already shortlisted")

    with tab2:
        st.subheader("Your Monitored Startups")
        
        colA, colB = st.columns(2)
        with colA:
            st.write("#### Interested In")
            inter = execute_query(
                "SELECT s.id, s.name, s.industry, s.stage FROM interests i JOIN startups s ON i.startup_id = s.id WHERE i.investor_id = ?",
                (investor_id,)
            )
            if inter:
                for i in inter:
                    st.markdown(f"- **{i['name']}** ({i['stage']}, {i['industry']})")
            else:
                st.write("No interests yet.")
                
        with colB:
            st.write("#### Shortlisted")
            shortl = execute_query(
                "SELECT s.id, s.name, s.industry, s.stage FROM shortlists sh JOIN startups s ON sh.startup_id = s.id WHERE sh.investor_id = ?",
                (investor_id,)
            )
            if shortl:
                for s in shortl:
                    st.markdown(f"- **{s['name']}** ({s['stage']}, {s['industry']})")
            else:
                st.write("No shortlists yet.")
