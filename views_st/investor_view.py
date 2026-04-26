import streamlit as st
import pandas as pd
from database import execute_query

def show():
    from auth import require_auth
    require_auth(['investor'])
    
    st.title("💼 Investor Dashboard")
    investor_id = st.session_state['user']['id']
    
    # Get current preferences
    pref = execute_query("SELECT * FROM investor_preferences WHERE investor_id = %s", (investor_id,), fetch="one")
    if not pref:
        pref = {'industry': 'Any', 'stage': 'Idea', 'min_investment': 0, 'max_investment': 0}

    tab1, tab2, tab3 = st.tabs(["Matchmaking", "My Shortlist / Interests", "Preferences"])
    
    with tab3:
        st.subheader("Update Preferences")
        with st.form("pref_form"):
            ind = st.text_input("Preferred Industry (or 'Any')", value=pref.get('industry', 'Any'))
            stage = st.selectbox("Preferred Stage", ["Idea", "MVP", "Funding"], index=["Idea", "MVP", "Funding"].index(pref.get('stage', 'Idea')))
            min_inv = st.number_input("Min Investment amount", value=float(pref.get('min_investment', 0)))
            max_inv = st.number_input("Max Investment amount", value=float(pref.get('max_investment', 0)))
            
            if st.form_submit_button("Save Preferences"):
                existing = execute_query("SELECT id FROM investor_preferences WHERE investor_id = %s", (investor_id,), fetch="one")
                if existing:
                    execute_query(
                        "UPDATE investor_preferences SET industry=%s, stage=%s, min_investment=%s, max_investment=%s WHERE investor_id=%s",
                        (ind, stage, min_inv, max_inv, investor_id), fetch="none"
                    )
                else:
                    execute_query(
                        "INSERT INTO investor_preferences (investor_id, industry, stage, min_investment, max_investment) VALUES (%s, %s, %s, %s, %s)",
                        (investor_id, ind, stage, min_inv, max_inv), fetch="none"
                    )
                st.success("Preferences updated!")
                st.rerun()

    with tab1:
        st.subheader("Startup Matchmaking Results")
        startups = execute_query("SELECT * FROM startups")
        
        matches = []
        for s in startups:
            score = 0
            reasons = []
            if pref['industry'] != 'Any' and s['industry'].lower() == pref['industry'].lower():
                score += 40
                reasons.append("Industry match")
            if s['stage'] == pref['stage']:
                score += 30
                reasons.append("Stage match")
            
            # Since funding_needed determines if it fits min/max
            fn = float(s['funding_needed'] or 0)
            if fn >= float(pref['min_investment']) and (float(pref['max_investment']) == 0 or fn <= float(pref['max_investment'])):
                score += 30
                reasons.append("Funding range fits")
                
            s['match_score'] = score
            s['match_reason'] = " + ".join(reasons) if reasons else "No specific match"
            matches.append(s)
            
        # Sort by match score
        matches = sorted(matches, key=lambda x: x['match_score'], reverse=True)
        
        for m in matches:
            with st.expander(f"{m['name']} (Score: {m['match_score']}% match)"):
                st.write(f"**Industry:** {m['industry']} | **Stage:** {m['stage']} | **Funding Needed:** ${m['funding_needed']:,.2f}")
                st.write(f"**Why matched:** {m['match_reason']}")
                st.write(m['description'])
                
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("🌟 Mark Interested", key=f"int_{m['id']}"):
                        try:
                            execute_query("INSERT INTO interests (investor_id, startup_id) VALUES (%s, %s)", (investor_id, m['id']), fetch="none")
                            st.success("Marked as Interested!")
                        except:
                            st.error("Already marked as interested")
                with col2:
                    if st.button("📌 Add to Shortlist", key=f"short_{m['id']}"):
                        try:
                            execute_query("INSERT INTO shortlists (investor_id, startup_id) VALUES (%s, %s)", (investor_id, m['id']), fetch="none")
                            st.success("Added to shortlist!")
                        except:
                            st.error("Already in shortlist")

    with tab2:
        st.subheader("Your Interests & Shortlist")
        
        inter = execute_query(
            "SELECT s.name, s.industry, s.stage FROM interests i JOIN startups s ON i.startup_id = s.id WHERE i.investor_id = %s",
            (investor_id,)
        )
        if inter:
            st.write("**Interested In:**")
            st.dataframe(pd.DataFrame(inter))
        else:
            st.write("No interests yet.")
            
        shortl = execute_query(
            "SELECT s.name, s.industry, s.stage FROM shortlists sh JOIN startups s ON sh.startup_id = s.id WHERE sh.investor_id = %s",
            (investor_id,)
        )
        if shortl:
            st.write("**Shortlisted:**")
            st.dataframe(pd.DataFrame(shortl))
        else:
            st.write("No shortlists yet.")
