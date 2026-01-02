# AGENT_SESSION_CHECKLIST — Run This Every Time

This is a **one-page operational checklist** for running multiple Cursor agents safely.

Keep this file open during agent sessions.

---

## BEFORE STARTING AGENTS

☐ Repo is clean (no half-merged work)  
☐ All files in `ai-taskboards/` and `ai-taskboards/docs/` exist  
☐ Redis is available (or planned)  
☐ You know how many agents you are running (2–4)

---

## SELECT AGENTS FOR THIS SESSION

Choose ONE option:

☐ LEAD + A + B  
☐ LEAD + A + B + C  
☐ LEAD + A + B + C + D  

(UI agent should not start until contracts exist.)

---

## FOR EACH AGENT (DO THIS EXACTLY)

☐ Open ONLY the files listed in `CURSOR_AGENT_LAUNCH_INSTRUCTIONS.md`  
☐ Paste the correct **System Prompt** for that agent  
☐ Assign a **single clear first milestone**  
☐ Remind agent:
   - do NOT edit contracts/db directly
   - use CHANGE_REQUESTS.md if needed

---

## DURING AGENT EXECUTION

☐ Monitor for scope creep  
☐ Watch for invented API shapes or paths  
☐ If agent asks “should I just add X?” → answer NO → create Change Request  

---

## CHANGE REQUEST HANDLING

When a CR is added:

☐ Review scope (minimal?)  
☐ Check impact on other agents  
☐ Approve / Reject / Request revision  
☐ Merge contracts/db changes FIRST  
☐ Notify affected agents to update

---

## END OF AGENT SESSION (MANDATORY)

For EACH agent, require a **handoff bundle**:

☐ Files changed  
☐ How to run / test  
☐ Any Change Requests created  
☐ Known TODOs or risks  

Do NOT merge without this.

---

## MERGE ORDER (NEVER DEVIATE)

1) packages/contracts + packages/db  
2) apps/control-plane  
3) apps/agent  
4) packages/common (settings/ini/templates)  
5) apps/desktop-ui  

---

## RED FLAGS (STOP IMMEDIATELY)

🚩 Agent modifies files outside its ownership  
🚩 Agent invents new endpoints silently  
🚩 Agent changes storage paths  
🚩 Agent mixes ASA and ASE logic  

If seen:
- STOP agent
- revert changes
- create Change Request if needed

---

## SESSION SUCCESS CRITERIA

☐ All agents stayed in lane  
☐ No surprise diffs in contracts/db  
☐ Everything builds  
☐ No unresolved CRs  

If all boxes checked → session successful.
