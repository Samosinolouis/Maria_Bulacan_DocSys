import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

from build_sections_part1 import SECTION_COVER, SECTION_TOC, SECTION_I, SECTION_II, SECTION_III, SECTION_IV
from build_sections_part2 import SECTION_V, SECTION_VI, SECTION_VII
from build_sections_part3 import SECTION_VIII, SECTION_IX, SECTION_X
from build_sections_part4 import SECTION_XI, SECTION_XII, SECTION_XIII

DOC_DIR = 'Project Documentation'
FIGURES_DIR = os.path.join(DOC_DIR, 'figures')
SCREENSHOTS_DIR = os.path.join(DOC_DIR, 'screenshots')
WIREFRAMES_DIR = 'wireframe/screenshots'

def build_markdown():
    print("1. Assembling Master Markdown Document...")
    md_path = os.path.join(DOC_DIR, 'ITS122P_Group9_Final_Project_Documentation.md')
    
    # We will enhance Section VIII with wireframe image embeds, 
    # Section IX with letter image embeds, 
    # Section X with live screenshot embeds, 
    # and Section VII / XI with generated figures.

    full_md = []
    full_md.append(SECTION_COVER)
    full_md.append(SECTION_TOC)
    full_md.append(SECTION_I)
    full_md.append(SECTION_II)
    full_md.append(SECTION_III)
    
    # In Section IV, add Figure 1
    sec_iv = SECTION_IV.replace(
        "*Figure 1. High-level multi-tier cloud infrastructure diagram of Santa Maria DocSys v2.6.*",
        f"![Figure 1: Cloud Infrastructure Architecture](figures/fig1_technical_architecture.png)\n\n*Figure 1. High-level multi-tier cloud infrastructure diagram of Santa Maria DocSys v2.6.*"
    )
    full_md.append(sec_iv)
    full_md.append(SECTION_V)
    full_md.append(SECTION_VI)
    
    # In Section VII, add Figure 2, 3
    sec_vii = SECTION_VII.replace(
        "*Figure 2. Master Entity-Relationship Diagram of the Santa Maria DocSys Relational Database.*",
        f"![Figure 2: Master Entity-Relationship Diagram](figures/fig3_master_erd.png)\n\n*Figure 2. Master Entity-Relationship Diagram of the Santa Maria DocSys Relational Database.*"
    )
    full_md.append(sec_vii)
    
    # In Section VIII, add Figure 4 (Sitemap) and all 12 wireframes
    sec_viii = SECTION_VIII.replace(
        "*Figure 3. Hierarchical Information Architecture and Sitemap Tree of Santa Maria DocSys v2.6.*",
        f"![Figure 3: System Sitemap and Information Architecture](figures/fig4_system_sitemap.png)\n\n*Figure 3. Hierarchical Information Architecture and Sitemap Tree of Santa Maria DocSys v2.6.*"
    )
    
    wireframe_embeds = [
        ("wireframe-01-dashboard.png", "Figure 4. Wireframe 01: Executive Command Center.", "../wireframe/screenshots/wireframe-01-dashboard.png"),
        ("wireframe-02-incoming.png", "Figure 5. Wireframe 02: Reception and Screening Queue.", "../wireframe/screenshots/wireframe-02-incoming.png"),
        ("wireframe-03-prepare.png", "Figure 6. Wireframe 03: Document Preparation Studio.", "../wireframe/screenshots/wireframe-03-prepare.png"),
        ("wireframe-04-review.png", "Figure 7. Wireframe 04: Signature and Endorsement Desk.", "../wireframe/screenshots/wireframe-04-review.png"),
        ("wireframe-05-transmit.png", "Figure 8. Wireframe 05: Transmission Desk.", "../wireframe/screenshots/wireframe-05-transmit.png"),
        ("wireframe-06-archive.png", "Figure 9. Wireframe 06: Municipal Records Archive.", "../wireframe/screenshots/wireframe-06-archive.png"),
        ("wireframe-07-schedule.png", "Figure 10. Wireframe 07: Venue and Gavel Calendar.", "../wireframe/screenshots/wireframe-07-schedule.png"),
        ("wireframe-08-reports.png", "Figure 11. Wireframe 08: ARTA Compliance Ledger.", "../wireframe/screenshots/wireframe-08-reports.png"),
        ("wireframe-09-admin.png", "Figure 12. Wireframe 09: Statutory Audit Trail.", "../wireframe/screenshots/wireframe-09-admin.png"),
        ("wireframe-10-modal-intake.png", "Figure 13. Wireframe 10: New Intake Wizard Modal.", "../wireframe/screenshots/wireframe-10-modal-intake.png"),
        ("wireframe-11-modal-dossier.png", "Figure 14. Wireframe 11: Document Detail Dossier Modal.", "../wireframe/screenshots/wireframe-11-modal-dossier.png"),
        ("wireframe-12-modal-routingslip.png", "Figure 15. Wireframe 12: Printable Routing Slip Modal.", "../wireframe/screenshots/wireframe-12-modal-routingslip.png"),
    ]
    for fn, caption, rel_path in wireframe_embeds:
        token = f"(`{fn}`)"
        replacement = f"(`{fn}`)\n\n![{caption}]({rel_path})\n*{caption}*\n"
        sec_viii = sec_viii.replace(token, replacement)
        
    full_md.append(sec_viii)
    
    # In Section IX, add the letter images
    sec_ix = SECTION_IX
    if os.path.exists(os.path.join(DOC_DIR, 'extracted_page_29_img_0.jpeg')):
        sec_ix = sec_ix.replace(
            "### A. Formal Communication Letter of Intent",
            "### A. Formal Communication Letter of Intent\n\n![Proof of Letter of Intent](extracted_page_29_img_0.jpeg)\n*Figure 16. Scanned Copy of Formal Letter of Intent submitted to Engr. Elmer B. Clemente.*"
        )
    if os.path.exists(os.path.join(DOC_DIR, 'extracted_page_30_img_0.jpeg')):
        sec_ix = sec_ix.replace(
            "### B. Client Acceptance and Agreement Document",
            "### B. Client Acceptance and Agreement Document\n\n![Proof of Agreement of Client](extracted_page_30_img_0.jpeg)\n*Figure 17. Scanned Copy of Client Agreement signed by Municipal Administrator Engr. Elmer B. Clemente.*"
        )
    full_md.append(sec_ix)
    
    # In Section X, add Figure 2 (Lifecycle flow) and all 14 live screenshots
    sec_x = SECTION_X
    sec_x = sec_x.replace(
        "### A. Operational Walkthrough of Live Deployed System",
        "### A. Operational Walkthrough of Live Deployed System\n\n![Figure 18: Statutory Document Lifecycle Workflow](figures/fig2_document_lifecycle_flow.png)\n*Figure 18. End-to-End 6-Step Statutory Document Lifecycle Workflow.*"
    )
    
    live_screens = [
        ("live_01_login_portal.png", "Figure 19. Civil Service Authentication Portal & Keycloak Login Flow."),
        ("live_02_keycloak_idp.png", "Figure 20. Keycloak OpenID Connect (OIDC) Identity Provider."),
        ("live_03_dashboard.png", "Figure 21. Executive Operations Command Center & ARTA 72-Hour SLA Radar."),
        ("live_04_incoming_screening.png", "Figure 22. Reception and Screening Queue Subsystem."),
        ("live_12_modal_intake.png", "Figure 23. 3-Step Intake Docket Wizard & Live HTML5 Camera Scanner."),
        ("live_05_prepare_studio.png", "Figure 24. Official Document Preparation & Drafting Studio."),
        ("live_06_review_endorsement.png", "Figure 25. Executive Signature & Endorsement Desk."),
        ("live_07_transmission_desk.png", "Figure 26. Central Transmission Desk & Central Dispatch Queue."),
        ("live_08_records_archive.png", "Figure 27. Municipal Records Archive & Search Engine."),
        ("live_09_venue_scheduler.png", "Figure 28. Central Municipal Venue & Gavel Scheduler with Conflict Detection."),
        ("live_10_reports_compliance.png", "Figure 29. Statutory ARTA Compliance & Performance Analytics Ledger."),
        ("live_11_audit_admin.png", "Figure 30. Immutable Statutory Audit Trail & Plantilla Administration."),
        ("live_13_modal_dossier.png", "Figure 31. Interactive Docket Dossier & 6-Stage Progress Tracker."),
        ("live_14_modal_routingslip.png", "Figure 32. Printable Official LGU Routing Slip Modal.")
    ]
    for fn, caption in live_screens:
        token = f"(`{fn}`)"
        rel_path = f"screenshots/{fn}"
        replacement = f"(`{fn}`)\n\n![{caption}]({rel_path})\n*{caption}*\n"
        sec_x = sec_x.replace(token, replacement)
        
    full_md.append(sec_x)
    
    # In Section XI, add Figure 6 & Figure 7
    sec_xi = SECTION_XI.replace(
        "### C. Quality Metrics, Turnaround Benchmarks, and Verification Summary",
        f"![Figure 33: Statutory Performance Analytics](figures/fig6_performance_analytics_chart.png)\n*Figure 33. RA 11032 Statutory Operational Performance & Turnaround Analytics.*\n\n![Figure 34: Test Results & Quality Assurance Metrics](figures/fig7_test_results_chart.png)\n*Figure 34. Quality Assurance, Test Execution Results & Verification Metrics.*\n\n### C. Quality Metrics, Turnaround Benchmarks, and Verification Summary"
    )
    full_md.append(sec_xi)
    full_md.append(SECTION_XII)
    full_md.append(SECTION_XIII)

    content = "\n\n".join(full_md)
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Successfully wrote {md_path} ({len(content)} characters, ~{len(content.split())} words)")
    return md_path

if __name__ == '__main__':
    build_markdown()
