import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Arrow
import numpy as np

OUTPUT_DIR = 'Project Documentation/figures'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Common color tokens matching Santa Maria DocSys Civic Design Doctrine
C_NAVY = '#0B2545'
C_GREEN = '#15803D'
C_FOREST = '#14532D'
C_SLATE = '#1E293B'
C_MUTED_SLATE = '#475569'
C_LIGHT_BG = '#F8FAFC'
C_CARD_BG = '#FFFFFF'
C_BORDER = '#CBD5E1'
C_AMBER = '#D97706'
C_RED = '#DC2626'
C_BLUE = '#2563EB'
C_TEAL = '#0D9488'

plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Helvetica', 'Arial']

# -------------------------------------------------------------
# FIGURE 1: Technical Architecture
# -------------------------------------------------------------
def generate_figure1():
    fig, ax = plt.subplots(figsize=(14, 8), dpi=300)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 8)
    ax.axis('off')

    # Background
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    # Title
    ax.text(7, 7.6, "Cloud-Based Document Management System (DocSys v2.6)", 
            fontsize=16, fontweight='bold', ha='center', color=C_NAVY)
    ax.text(7, 7.25, "System & Cloud Infrastructure Architecture Diagram", 
            fontsize=11, ha='center', color=C_MUTED_SLATE)

    # 4 Main Columns / Tiers
    tiers = [
        ("CLIENT TIER", 0.5, 6.7, 2.7, 5.8, "#EFF6FF", C_BLUE),
        ("PRESENTATION TIER", 3.7, 6.7, 2.9, 5.8, "#F0FDF4", C_GREEN),
        ("APPLICATION & IDENTITY TIER", 7.1, 6.7, 3.2, 5.8, "#FEF3C7", C_AMBER),
        ("DATA & STORAGE TIER", 10.8, 6.7, 2.7, 5.8, "#F1F5F9", C_SLATE)
    ]

    for title, x, top_y, w, h, bg_c, border_c in tiers:
        rect = FancyBboxPatch((x, top_y - h), w, h, boxstyle="round,pad=0.1,rounding_size=0.15",
                              linewidth=1.5, edgecolor=border_c, facecolor=bg_c)
        ax.add_patch(rect)
        ax.text(x + w/2, top_y - 0.35, title, fontsize=10, fontweight='bold', ha='center', color=border_c)

    # Boxes in Client Tier
    clients = [
        ("Desktop Workstation\n(Admin & Clerk Desks)\nWindows 11 / Chrome / Edge", 0.7, 5.0, 2.3, 1.1),
        ("Mobile Browsers\n(Personnel Field View)\nSchedule & Agenda Portal", 0.7, 3.4, 2.3, 1.1),
        ("Live Document Scanner\nHTML5 Camera & Feeder\nMulti-Page Annex Upload", 0.7, 1.8, 2.3, 1.1),
    ]
    for text, x, y, w, h in clients:
        b = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.1",
                           linewidth=1, edgecolor='#93C5FD', facecolor='#FFFFFF')
        ax.add_patch(b)
        ax.text(x + w/2, y + h/2, text, fontsize=8.5, ha='center', va='center', color=C_SLATE)

    # Boxes in Presentation Tier (Azure Static Web Apps)
    ax.text(5.15, 6.0, "Microsoft Azure Static Web Apps\n(Southeast Asia Region)", 
            fontsize=8.5, fontstyle='italic', ha='center', color='#166534')
    
    frontend_boxes = [
        ("Next.js 16 App Router\nReact 19 & TypeScript\nTailwind CSS Civic Design", 3.9, 4.4, 2.5, 1.3),
        ("Statutory UI Modules\n- Intake Wizard & Radar\n- Drafting & Template Studio\n- Executive Review Desk\n- Venue Logistics & Calendar", 3.9, 2.2, 2.5, 1.8),
        ("XML / XSD Validator\nDocument Schema Check\nCivic XML Export Engine", 3.9, 1.1, 2.5, 0.85)
    ]
    for text, x, y, w, h in frontend_boxes:
        b = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.1",
                           linewidth=1, edgecolor='#86EFAC', facecolor='#FFFFFF')
        ax.add_patch(b)
        ax.text(x + w/2, y + h/2, text, fontsize=8, ha='center', va='center', color=C_SLATE)

    # Boxes in Application & Identity Tier
    app_boxes = [
        ("Azure App Service\nNode.js / Express GraphQL API\nhttps://santamaria-docsys-api.azurewebsites.net\n(Apollo Server & Drizzle ORM)", 7.3, 4.2, 2.8, 1.7),
        ("Keycloak Identity Provider\nOpenID Connect (OIDC) / OAuth 2.0\nRole-Based Access Control (RBAC)\nPlantilla Accounts & Sessions", 7.3, 2.1, 2.8, 1.6),
        ("Background Job Engine\nRA 11032 SLA Alert Monitor\n72-Hour Turnaround Engine", 7.3, 1.1, 2.8, 0.85)
    ]
    for text, x, y, w, h in app_boxes:
        b = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.1",
                           linewidth=1, edgecolor='#FDE047', facecolor='#FFFFFF')
        ax.add_patch(b)
        ax.text(x + w/2, y + h/2, text, fontsize=8, ha='center', va='center', color=C_SLATE)

    # Boxes in Data & Storage Tier
    db_boxes = [
        ("Azure Database for PostgreSQL\nFlexible Server (Burstable B1ms)\n9 Relational Tables\nSchema 'app' + Keycloak Realm\nSSL/TLS 1.2+ Enforced", 11.0, 4.0, 2.3, 2.0),
        ("Object Storage\nMinIO / Backblaze B2\nAttachment Annexes & Scans\nSigned Delivery Receipts\nSHA-256 Checksum Proofs", 11.0, 2.0, 2.3, 1.6),
        ("Automated Daily Backups\nPoint-In-Time Restore (PITR)\nRPO < 24h, RTO < 4h", 11.0, 1.1, 2.3, 0.75)
    ]
    for text, x, y, w, h in db_boxes:
        b = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.1",
                           linewidth=1, edgecolor='#CBD5E1', facecolor='#FFFFFF')
        ax.add_patch(b)
        ax.text(x + w/2, y + h/2, text, fontsize=8, ha='center', va='center', color=C_SLATE)

    # Connecting Arrows
    arrow_props = dict(facecolor=C_NAVY, edgecolor=C_NAVY, width=1.5, headwidth=6, shrink=0.05)
    
    # Client -> Presentation
    ax.annotate('', xy=(3.7, 4.0), xytext=(3.2, 4.0), arrowprops=arrow_props)
    ax.text(3.45, 4.2, "HTTPS / TLS", fontsize=7, ha='center', color=C_NAVY, fontweight='bold')

    # Presentation -> Application
    ax.annotate('', xy=(7.1, 4.7), xytext=(6.6, 4.7), arrowprops=arrow_props)
    ax.text(6.85, 4.9, "GraphQL / JSON", fontsize=7, ha='center', color=C_NAVY, fontweight='bold')

    # Presentation -> Keycloak (OIDC)
    ax.annotate('', xy=(7.1, 3.0), xytext=(6.6, 3.0), arrowprops=arrow_props)
    ax.text(6.85, 3.2, "OIDC / Auth", fontsize=7, ha='center', color=C_AMBER, fontweight='bold')

    # Application -> Database
    ax.annotate('', xy=(10.8, 5.0), xytext=(10.3, 5.0), arrowprops=arrow_props)
    ax.text(10.55, 5.2, "TCP 5432 (SSL)", fontsize=7, ha='center', color=C_SLATE, fontweight='bold')

    # Application -> Storage
    ax.annotate('', xy=(10.8, 2.8), xytext=(10.3, 2.8), arrowprops=arrow_props)
    ax.text(10.55, 3.0, "S3 API", fontsize=7, ha='center', color=C_SLATE, fontweight='bold')

    # Footer note
    ax.text(7, 0.4, "Office of the Municipal Administrator — Municipality of Santa Maria, Bulacan | Built for ITS122P Group 9", 
            fontsize=8, fontstyle='italic', ha='center', color=C_MUTED_SLATE)

    plt.tight_layout()
    fig.savefig(os.path.join(OUTPUT_DIR, 'fig1_technical_architecture.png'), bbox_inches='tight')
    plt.close(fig)
    print("Generated: fig1_technical_architecture.png")


# -------------------------------------------------------------
# FIGURE 2: 6-Step Document Lifecycle Flowchart
# -------------------------------------------------------------
def generate_figure2():
    fig, ax = plt.subplots(figsize=(15, 7.5), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 7.5)
    ax.axis('off')

    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    ax.text(7.5, 7.1, "Statutory 6-Step Municipal Document Lifecycle Workflow", 
            fontsize=16, fontweight='bold', ha='center', color=C_NAVY)
    ax.text(7.5, 6.7, "Republic Act 11032 Compliance & Municipal Administrator's Office Standard Operating Procedure", 
            fontsize=10.5, ha='center', color=C_MUTED_SLATE)

    steps = [
        ("STEP 1\nReception & Intake", 
         "• Formal docket entry\n• Auto control no.\n  [TYPE]-[YEAR]-[SEQ]\n• Camera scan & file\n  annexes uploaded\n• 72-hr SLA clock starts", 
         0.6, 2.3, 2.0, 3.8, C_BLUE, "#EFF6FF"),
        
        ("STEP 2\nInitial Screening", 
         "• Completeness audit\n• Attachment verification\n• Addressee & sign check\n• Check for duplicates\n• Action: Complete or\n  Return for Compliance", 
         2.9, 2.3, 2.0, 3.8, C_TEAL, "#F0FDFA"),
        
        ("STEP 3\nDocument Preparation", 
         "• Assigned to Officer\n• Standard Template\n  Studio selection\n• Live letterhead format\n• Draft generation & edit\n• Submit to Review Desk", 
         5.2, 2.3, 2.0, 3.8, C_AMBER, "#FFFBEB"),
        
        ("STEP 4\nExecutive Review", 
         "• Municipal Admin &\n  Mayor review queue\n• 3 Action Pathways:\n  1. Approve docket\n  2. Endorse to SB/Dept\n  3. Deny (mandatory\n     written grounds)", 
         7.5, 2.3, 2.2, 3.8, C_GREEN, "#F0FDF4"),
        
        ("STEP 5\nTransmission Desk", 
         "• Outward dispatch desk\n• Channels:\n  - Courier / Pickup\n  - Official Email\n  - Gov Portal\n• Upload signed proof\n  of delivery receipt", 
         10.0, 2.3, 2.0, 3.8, '#7C3AED', "#F5F3FF"),
        
        ("STEP 6\nCompletion & Archive", 
         "• Final signed copy\n  archived permanently\n• Status set to CLOSED\n• Immutable audit seal\n• Dossier search &\n  retrieval with PDF view", 
         12.3, 2.3, 2.1, 3.8, C_SLATE, "#F1F5F9")
    ]

    for title, desc, x, y, w, h, border_c, bg_c in steps:
        b = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1,rounding_size=0.15",
                           linewidth=1.8, edgecolor=border_c, facecolor=bg_c)
        ax.add_patch(b)
        
        # Header inside box
        header_b = FancyBboxPatch((x + 0.05, y + h - 0.9), w - 0.1, 0.85, 
                                  boxstyle="round,pad=0.05,rounding_size=0.1",
                                  linewidth=0, facecolor=border_c)
        ax.add_patch(header_b)
        ax.text(x + w/2, y + h - 0.45, title, fontsize=9.5, fontweight='bold', 
                ha='center', va='center', color='#FFFFFF')
        
        # Body text
        ax.text(x + 0.15, y + h - 1.15, desc, fontsize=8, ha='left', va='top', color=C_SLATE, linespacing=1.3)

    # Sequential Connecting Arrows
    for i in range(len(steps) - 1):
        x1 = steps[i][2] + steps[i][4]
        x2 = steps[i+1][2]
        mid_y = 4.2
        ax.annotate('', xy=(x2, mid_y), xytext=(x1, mid_y),
                    arrowprops=dict(facecolor=C_NAVY, edgecolor=C_NAVY, width=2, headwidth=7, shrink=0.08))

    # Return for compliance loop arrow from Step 2 to Step 1
    ax.annotate('', xy=(1.6, 2.3), xytext=(3.9, 2.3),
                arrowprops=dict(facecolor=C_RED, edgecolor=C_RED, width=1.5, headwidth=6, shrink=0.05, connectionstyle="arc3,rad=-0.4"))
    ax.text(2.75, 1.45, "Incomplete: Returned for Compliance", fontsize=7.5, fontweight='bold', color=C_RED, ha='center')

    # RA 11032 SLA indicator bar at bottom
    sla_b = FancyBboxPatch((0.6, 0.5), 13.8, 0.65, boxstyle="round,pad=0.05,rounding_size=0.1",
                           linewidth=1, edgecolor=C_GREEN, facecolor='#DCFCE7')
    ax.add_patch(sla_b)
    ax.text(7.5, 0.82, "REPUBLIC ACT 11032 STATUTORY SERVICE LEVEL AGREEMENT (SLA) THRESHOLD: MAXIMUM 72 WORKING HOURS (3 WORKING DAYS)", 
            fontsize=8.5, fontweight='bold', ha='center', color=C_FOREST)

    plt.tight_layout()
    fig.savefig(os.path.join(OUTPUT_DIR, 'fig2_document_lifecycle_flow.png'), bbox_inches='tight')
    plt.close(fig)
    print("Generated: fig2_document_lifecycle_flow.png")


# -------------------------------------------------------------
# FIGURE 3: Master Relational ERD
# -------------------------------------------------------------
def generate_figure3():
    fig, ax = plt.subplots(figsize=(16, 10), dpi=300)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.axis('off')

    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    ax.text(8, 9.6, "Santa Maria DocSys Relational Database Schema (Master ERD)", 
            fontsize=16, fontweight='bold', ha='center', color=C_NAVY)
    ax.text(8, 9.25, "PostgreSQL 16 Schema 'app' & Keycloak Realm Integration", 
            fontsize=10.5, ha='center', color=C_MUTED_SLATE)

    # Entity definition: (Name, Attributes List, x, y, w, h, border_color)
    entities = [
        ("USERS (Plantilla Personnel)", [
            "id : string [PK, UUID]",
            "full_name : string",
            "email : string [UK]",
            "role : enum (MAYOR, ADMIN, ...)",
            "department : string",
            "title : string",
            "is_active : boolean",
            "created_at : timestamptz"
        ], 0.6, 5.8, 3.2, 3.1, C_NAVY),

        ("DOCUMENTS (Municipal Dockets)", [
            "id : string [PK, UUID]",
            "control_number : string [UK]",
            "type : enum (TO, EO, IND, ...)",
            "category : enum (ADMIN, LEG, ...)",
            "title : string",
            "requesting_party : string",
            "origin_office : string",
            "assigned_to_user_id : string [FK]",
            "status : enum (REC, SCR, REV, ...)",
            "priority : enum (NORMAL, HIGH, URG)",
            "sla_deadline : timestamptz",
            "is_overdue : boolean",
            "denial_reason : text",
            "endorsement_notes : text",
            "created_by_user_id : string [FK]"
        ], 4.5, 4.8, 3.5, 4.1, C_GREEN),

        ("ATTACHMENTS (Digital Annexes)", [
            "id : string [PK, UUID]",
            "document_id : string [FK]",
            "file_name : string",
            "file_url : string",
            "file_size : bigint",
            "file_type : string (MIME)",
            "uploaded_by_user_id : string [FK]",
            "uploaded_at : timestamptz"
        ], 8.7, 6.4, 3.2, 2.5, C_BLUE),

        ("TRANSMISSIONS (Dispatches)", [
            "id : string [PK, UUID]",
            "document_id : string [FK, UK]",
            "transmitted_date : timestamptz",
            "transmitted_to_office : string",
            "recipient_name : string",
            "received_by : string",
            "method : enum (COURIER, EMAIL..)",
            "proof_document_url : string",
            "notes : text"
        ], 8.7, 3.5, 3.2, 2.6, '#7C3AED'),

        ("DOCUMENT_TEMPLATES", [
            "id : string [PK, UUID]",
            "code : string [UK]",
            "title : string",
            "category : string",
            "template_body_schema : jsonb",
            "is_active : boolean"
        ], 8.7, 1.0, 3.2, 2.1, C_AMBER),

        ("VENUES (6 Municipal Facilities)", [
            "id : string [PK]",
            "code : string [UK]",
            "name : string",
            "location : string",
            "capacity : integer",
            "is_active : boolean"
        ], 12.4, 6.7, 3.0, 2.2, C_TEAL),

        ("EVENT_BOOKINGS (Scheduler)", [
            "id : string [PK, UUID]",
            "venue_id : string [FK]",
            "title : string",
            "organizer : string",
            "booking_date : date",
            "start_time : time",
            "end_time : time",
            "involves_mayor : boolean",
            "involves_admin : boolean",
            "status : enum (CONF, TENT, CANC)"
        ], 12.4, 3.5, 3.0, 2.8, C_TEAL),

        ("EVENT_ATTENDEES", [
            "id : string [PK, UUID]",
            "event_id : string [FK]",
            "full_name : string",
            "role_title : string"
        ], 12.4, 1.2, 3.0, 1.8, C_MUTED_SLATE),

        ("AUDIT_LOGS (Custody Chain)", [
            "id : string [PK, UUID]",
            "document_id : string [FK, opt]",
            "event_id : string [FK, opt]",
            "action : enum (INTAKE, APP, ...)",
            "user_id : string [FK]",
            "user_name : string",
            "user_role : string",
            "timestamp : timestamptz",
            "details : text",
            "hash_checksum : string (SHA-256)"
        ], 0.6, 1.5, 3.4, 3.5, C_RED)
    ]

    for title, attrs, x, y, w, h, border_c in entities:
        # Box
        b = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.1",
                           linewidth=1.5, edgecolor=border_c, facecolor='#FFFFFF')
        ax.add_patch(b)
        
        # Header banner
        header = FancyBboxPatch((x + 0.04, y + h - 0.5), w - 0.08, 0.46,
                                boxstyle="round,pad=0.04,rounding_size=0.08",
                                linewidth=0, facecolor=border_c)
        ax.add_patch(header)
        ax.text(x + w/2, y + h - 0.27, title, fontsize=8.5, fontweight='bold', 
                ha='center', va='center', color='#FFFFFF')

        # Attributes
        curr_y = y + h - 0.72
        for attr in attrs:
            color = C_SLATE
            fontweight = 'normal'
            if '[PK' in attr:
                color = C_NAVY
                fontweight = 'bold'
            elif '[FK' in attr:
                color = C_BLUE
            ax.text(x + 0.15, curr_y, attr, fontsize=7.2, va='center', color=color, fontweight=fontweight)
            curr_y -= 0.22

    # Draw Relationship Lines & Cardinality labels
    def draw_rel(x1, y1, x2, y2, label, card1="1", card2="N"):
        ax.plot([x1, x2], [y1, y2], color='#64748B', lw=1.5, ls='--')
        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        ax.text(mid_x, mid_y + 0.12, label, fontsize=7, ha='center', color=C_MUTED_SLATE,
                bbox=dict(boxstyle='round,pad=0.2', facecolor='#F8FAFC', edgecolor='none'))

    # USERS -> DOCUMENTS (1:N)
    draw_rel(3.8, 7.3, 4.5, 7.3, "creates / assigns", "1", "N")

    # DOCUMENTS -> ATTACHMENTS (1:N)
    draw_rel(8.0, 7.5, 8.7, 7.5, "contains", "1", "N")

    # DOCUMENTS -> TRANSMISSIONS (1:1)
    draw_rel(8.0, 5.5, 8.7, 4.8, "dispatches", "1", "0..1")

    # DOCUMENT_TEMPLATES -> DOCUMENTS
    draw_rel(8.7, 2.0, 7.5, 4.8, "standardizes", "1", "N")

    # VENUES -> EVENT_BOOKINGS (1:N)
    draw_rel(13.9, 6.7, 13.9, 6.3, "hosts", "1", "N")

    # EVENT_BOOKINGS -> EVENT_ATTENDEES (1:N)
    draw_rel(13.9, 3.5, 13.9, 3.0, "includes", "1", "N")

    # USERS -> AUDIT_LOGS
    draw_rel(2.2, 5.8, 2.2, 5.0, "performs", "1", "N")

    # DOCUMENTS -> AUDIT_LOGS
    draw_rel(4.5, 5.2, 3.5, 4.0, "records_history", "1", "N")

    plt.tight_layout()
    fig.savefig(os.path.join(OUTPUT_DIR, 'fig3_master_erd.png'), bbox_inches='tight')
    plt.close(fig)
    print("Generated: fig3_master_erd.png")


# -------------------------------------------------------------
# FIGURE 4: System Information Architecture / Sitemap
# -------------------------------------------------------------
def generate_figure4():
    fig, ax = plt.subplots(figsize=(15, 8), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 8)
    ax.axis('off')

    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    ax.text(7.5, 7.6, "Santa Maria DocSys Information Architecture & Sitemap Tree", 
            fontsize=16, fontweight='bold', ha='center', color=C_NAVY)
    ax.text(7.5, 7.25, "Hierarchical Navigation and Subsystem Functional Map", 
            fontsize=10.5, ha='center', color=C_MUTED_SLATE)

    # Root
    root = FancyBboxPatch((6.0, 6.1), 3.0, 0.75, boxstyle="round,pad=0.08,rounding_size=0.1",
                          linewidth=1.8, edgecolor=C_NAVY, facecolor=C_NAVY)
    ax.add_patch(root)
    ax.text(7.5, 6.47, "MUNICIPAL DOCSYS PORTAL\n/ (Root Directs to /dashboard)", 
            fontsize=9.5, fontweight='bold', ha='center', va='center', color='#FFFFFF')

    # Main Branches
    branches = [
        ("DIVISION I:\nINTAKE & REGISTRY", 1.8, 4.8, 2.5, 0.75, C_BLUE, "#EFF6FF"),
        ("DIVISION II:\nEXECUTIVE REVIEW", 5.6, 4.8, 2.5, 0.75, C_GREEN, "#F0FDF4"),
        ("DIVISION III:\nLOGISTICS & COMPLIANCE", 9.4, 4.8, 2.5, 0.75, C_AMBER, "#FFFBEB"),
        ("DIVISION IV:\nADMIN & AUDIT", 12.6, 4.8, 2.0, 0.75, C_SLATE, "#F1F5F9")
    ]

    for title, x, y, w, h, border_c, bg_c in branches:
        b = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.1",
                           linewidth=1.5, edgecolor=border_c, facecolor=bg_c)
        ax.add_patch(b)
        ax.text(x + w/2, y + h/2, title, fontsize=8.5, fontweight='bold', 
                ha='center', va='center', color=border_c)
        # Line from root to branch
        ax.plot([7.5, x + w/2], [6.1, y + h], color='#94A3B8', lw=1.5)

    # Sub-nodes
    subnodes = [
        # Div 1
        ("/dashboard\nExecutive Command Center\nSLA Radar & Docket Ledger", 0.6, 2.8, 2.3, 1.4),
        ("/incoming\nReception & Screening Queue\nIntake Wizard & Camera Feeder", 0.6, 1.0, 2.3, 1.4),
        # Div 2
        ("/prepare\nDocument Drafting Studio\nTemplate Engine & Letterhead", 3.2, 2.8, 2.3, 1.4),
        ("/review\nSignature & Endorsement Desk\nApproval / Endorsement / Denial", 3.2, 1.0, 2.3, 1.4),
        ("/transmit\nTransmission Desk\nDispatch Proof & Courier Tracker", 5.8, 2.8, 2.3, 1.4),
        ("/archive\nMunicipal Records Archive\nSearch, Dossier & Lightbox PDF", 5.8, 1.0, 2.3, 1.4),
        # Div 3
        ("/schedule\nVenue & Gavel Calendar\nConflict Engine & Mayor Flags", 8.4, 2.8, 2.3, 1.4),
        ("/reports\nARTA Compliance Ledger\nTurnaround Analytics & Balance", 8.4, 1.0, 2.3, 1.4),
        # Div 4
        ("/admin & /settings\nStatutory Audit Trail\nUser Roster & Plantilla Roles", 11.0, 2.8, 2.3, 1.4),
        ("MODALS & SUB-VIEWS\n• Intake Docket Wizard\n• Document Dossier Inspector\n• Printable Routing Slip", 11.0, 1.0, 2.3, 1.4)
    ]

    for text, x, y, w, h in subnodes:
        b = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.06,rounding_size=0.08",
                           linewidth=1, edgecolor='#CBD5E1', facecolor='#FFFFFF')
        ax.add_patch(b)
        ax.text(x + w/2, y + h/2, text, fontsize=7.8, ha='center', va='center', color=C_SLATE)

    plt.tight_layout()
    fig.savefig(os.path.join(OUTPUT_DIR, 'fig4_system_sitemap.png'), bbox_inches='tight')
    plt.close(fig)
    print("Generated: fig4_system_sitemap.png")


# -------------------------------------------------------------
# FIGURE 5: Venue Conflict Prevention Algorithm Flowchart
# -------------------------------------------------------------
def generate_figure5():
    fig, ax = plt.subplots(figsize=(14, 7), dpi=300)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 7)
    ax.axis('off')

    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    ax.text(7, 6.6, "Centralized Venue Scheduling & Automated Double-Booking Conflict Prevention", 
            fontsize=15, fontweight='bold', ha='center', color=C_NAVY)
    ax.text(7, 6.25, "Algorithm Logic Flow across 6 Municipal Venues & Executive Attendance Flags", 
            fontsize=10, ha='center', color=C_MUTED_SLATE)

    flow_nodes = [
        ("Applicant Initiates Reservation\nSelect Venue (1 of 6 Facilities)\nEnter Date, Start Time & End Time", 0.6, 4.0, 2.5, 1.4, C_NAVY),
        ("Query Existing Bookings in DB\nFilter by venue_id & booking_date\nExclude CANCELLED status records", 3.6, 4.0, 2.6, 1.4, C_BLUE),
        ("Evaluate Time Overlap Condition:\n(NewStart < ExistEnd) AND\n(NewEnd > ExistStart)?", 6.7, 3.8, 2.8, 1.8, C_AMBER),
        ("Conflict Detected!\nOverlapping time slot exists.\nPrompt user with conflicting event.\nOption: Re-schedule or flag TENTATIVE.", 10.0, 4.8, 3.4, 1.4, C_RED),
        ("Conflict-Free Slot Confirmed!\nCheck Executive Flags:\n- Involves Mayor? (Gavel)\n- Involves Admin?", 10.0, 2.6, 3.4, 1.4, C_GREEN),
        ("Commit Booking to PostgreSQL\nStatus: CONFIRMED\nNotify Organizer & Tag Attendees\nAppend Event to Audit Trail (RA 10175)", 10.0, 0.6, 3.4, 1.4, C_FOREST)
    ]

    for title, x, y, w, h, border_c in flow_nodes:
        b = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.1",
                           linewidth=1.5, edgecolor=border_c, facecolor='#FFFFFF')
        ax.add_patch(b)
        ax.text(x + w/2, y + h/2, title, fontsize=8, ha='center', va='center', color=C_SLATE)

    # Arrows
    arrow_props = dict(facecolor=C_NAVY, edgecolor=C_NAVY, width=1.5, headwidth=6, shrink=0.05)
    ax.annotate('', xy=(3.6, 4.7), xytext=(3.1, 4.7), arrowprops=arrow_props)
    ax.annotate('', xy=(6.7, 4.7), xytext=(6.2, 4.7), arrowprops=arrow_props)

    # Condition branches
    # YES -> Conflict
    ax.annotate('', xy=(10.0, 5.5), xytext=(9.5, 5.0),
                arrowprops=dict(facecolor=C_RED, edgecolor=C_RED, width=1.5, headwidth=6, shrink=0.05))
    ax.text(9.6, 5.4, "YES", fontsize=8.5, fontweight='bold', color=C_RED)

    # NO -> Confirmed
    ax.annotate('', xy=(10.0, 3.3), xytext=(9.5, 4.4),
                arrowprops=dict(facecolor=C_GREEN, edgecolor=C_GREEN, width=1.5, headwidth=6, shrink=0.05))
    ax.text(9.6, 3.7, "NO", fontsize=8.5, fontweight='bold', color=C_GREEN)

    # Confirmed -> Commit
    ax.annotate('', xy=(11.7, 2.0), xytext=(11.7, 2.6),
                arrowprops=dict(facecolor=C_FOREST, edgecolor=C_FOREST, width=1.5, headwidth=6, shrink=0.05))

    plt.tight_layout()
    fig.savefig(os.path.join(OUTPUT_DIR, 'fig5_venue_conflict_workflow.png'), bbox_inches='tight')
    plt.close(fig)
    print("Generated: fig5_venue_conflict_workflow.png")


# -------------------------------------------------------------
# FIGURE 6: RA 11032 Performance Analytics Dashboard Graphs
# -------------------------------------------------------------
def generate_figure6():
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(14, 9), dpi=300)
    fig.patch.set_facecolor('#F8FAFC')

    for ax in [ax1, ax2, ax3, ax4]:
        ax.set_facecolor('#FFFFFF')
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color('#CBD5E1')
        ax.spines['bottom'].set_color('#CBD5E1')
        ax.grid(axis='y', linestyle='--', alpha=0.5, color='#E2E8F0')

    # Panel 1: Document Volume by Classification
    categories = ['Travel\nOrders', 'Executive\nOrders', 'SB\nEndorse.', 'Venue\nRequests', 'Overtime\nAuth.', 'Permits &\nCerts', 'Legal\nOpinions']
    counts = [142, 68, 95, 118, 84, 160, 45]
    bars = ax1.bar(categories, counts, color=C_NAVY, width=0.55, edgecolor='#081E36', lw=1)
    ax1.set_title("A. Monthly Intake Volume by Civic Document Classification", fontsize=10.5, fontweight='bold', color=C_NAVY, pad=12)
    ax1.set_ylabel("Total Dockets Recorded", fontsize=9, color=C_SLATE)
    for bar in bars:
        yval = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2, yval + 3, f"{yval}", ha='center', va='bottom', fontsize=8, fontweight='bold', color=C_SLATE)

    # Panel 2: RA 11032 SLA Compliance (Donut Chart)
    labels = ['Compliant (<72 Hours)', 'Escalated / Overdue (>72 Hours)']
    sizes = [94.8, 5.2]
    colors = [C_GREEN, C_RED]
    wedges, texts, autotexts = ax2.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=140,
                                      colors=colors, textprops=dict(color=C_SLATE, fontsize=8.5),
                                      wedgeprops=dict(width=0.45, edgecolor='#FFFFFF', lw=2))
    for at in autotexts:
        at.set_fontsize(9)
        at.set_fontweight('bold')
        at.set_color('#FFFFFF')
    ax2.set_title("B. RA 11032 Statutory 72-Hour Turnaround Compliance Rate", fontsize=10.5, fontweight='bold', color=C_NAVY, pad=12)

    # Panel 3: Average Processing Turnaround (Days) vs 3-Day Mandate
    depts = ['Admin\nOffice', 'HRMO\nDesk', 'Legal\nCounsel', 'Planning\n(MPDO)', 'Eng.\nOffice', 'Mayor\nOffice']
    avg_days = [1.2, 1.4, 2.1, 1.8, 2.4, 0.9]
    ax3.bar(depts, avg_days, color=C_TEAL, width=0.55, edgecolor='#0F766E', lw=1)
    ax3.axhline(3.0, color=C_RED, linestyle='--', linewidth=1.8, label='RA 11032 Threshold (3.0 Working Days)')
    ax3.set_title("C. Average Municipal Turnaround Speed vs. Statutory Threshold", fontsize=10.5, fontweight='bold', color=C_NAVY, pad=12)
    ax3.set_ylabel("Turnaround Duration (Days)", fontsize=9, color=C_SLATE)
    ax3.set_ylim(0, 3.8)
    ax3.legend(loc='upper right', fontsize=8)
    for i, v in enumerate(avg_days):
        ax3.text(i, v + 0.08, f"{v}d", ha='center', fontsize=8, fontweight='bold', color=C_SLATE)

    # Panel 4: System Status Distribution
    statuses = ['Archived\n& Closed', 'Transmitted', 'Approved\n& Signed', 'Under\nReview', 'Screening\n& Prep']
    stat_counts = [340, 115, 88, 42, 28]
    colors_status = [C_SLATE, '#7C3AED', C_GREEN, C_AMBER, C_BLUE]
    bars4 = ax4.bar(statuses, stat_counts, color=colors_status, width=0.55, edgecolor='#334155', lw=1)
    ax4.set_title("D. Active & Historical Docket Lifecycle State Breakdown", fontsize=10.5, fontweight='bold', color=C_NAVY, pad=12)
    ax4.set_ylabel("Docket Count", fontsize=9, color=C_SLATE)
    for bar in bars4:
        yval = bar.get_height()
        ax4.text(bar.get_x() + bar.get_width()/2, yval + 5, f"{yval}", ha='center', va='bottom', fontsize=8, fontweight='bold', color=C_SLATE)

    plt.suptitle("Municipal Document Management System — Statutory Operational Analytics (DocSys v2.6)", 
                 fontsize=13, fontweight='bold', color=C_NAVY, y=0.99)
    plt.tight_layout()
    fig.savefig(os.path.join(OUTPUT_DIR, 'fig6_performance_analytics_chart.png'), bbox_inches='tight')
    plt.close(fig)
    print("Generated: fig6_performance_analytics_chart.png")


# -------------------------------------------------------------
# FIGURE 7: Test Execution & Quality Assurance Results Chart
# -------------------------------------------------------------
def generate_figure7():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5), dpi=300)
    fig.patch.set_facecolor('#F8FAFC')

    for ax in [ax1, ax2]:
        ax.set_facecolor('#FFFFFF')
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color('#CBD5E1')
        ax.spines['bottom'].set_color('#CBD5E1')
        ax.grid(axis='y', linestyle='--', alpha=0.5, color='#E2E8F0')

    # Panel 1: Test Cases Executed per Module (100% Pass)
    modules = ['Auth & RBAC', 'Intake/Screen', 'Draft Studio', 'Review/Approve', 'Transmission', 'Archive/Search', 'Venue Sched', 'Audit & XML']
    tc_counts = [5, 6, 4, 5, 4, 4, 5, 4]
    
    x = np.arange(len(modules))
    bars = ax1.bar(x, tc_counts, color=C_GREEN, width=0.55, edgecolor='#166534', lw=1, label='Passed Test Cases')
    ax1.set_xticks(x)
    ax1.set_xticklabels(modules, rotation=25, ha='right', fontsize=8.5, color=C_SLATE)
    ax1.set_title("A. Test Execution Distribution by Core Module (100% Pass Rate)", fontsize=10.5, fontweight='bold', color=C_NAVY, pad=12)
    ax1.set_ylabel("Total Test Cases", fontsize=9, color=C_SLATE)
    ax1.set_ylim(0, 8)
    for bar in bars:
        yval = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2, yval + 0.2, f"{yval}/{yval}", ha='center', va='bottom', fontsize=8, fontweight='bold', color=C_FOREST)
    ax1.legend(loc='upper right', fontsize=8.5)

    # Panel 2: System Quality Metrics Comparison
    metrics = ['Page Load\n(<3.0s SLA)', 'API Latency\n(<500ms)', 'Uptime\n(Target 99%)', 'SLA Detection\nAccuracy', 'Mobile Audit\nPass Rate']
    actual_vals = [1.2, 0.18, 99.8, 100.0, 100.0]
    target_vals = [3.0, 0.50, 99.0, 100.0, 100.0]
    
    # Normalized score out of 100 for visual clarity
    scores = [100, 100, 100, 100, 100]
    bars2 = ax2.bar(metrics, scores, color=C_NAVY, width=0.5, edgecolor='#081E36', lw=1)
    ax2.set_title("B. Non-Functional Quality & Performance Compliance Score (%)", fontsize=10.5, fontweight='bold', color=C_NAVY, pad=12)
    ax2.set_ylabel("Compliance Score (%)", fontsize=9, color=C_SLATE)
    ax2.set_ylim(0, 120)
    for i, bar in enumerate(bars2):
        ax2.text(bar.get_x() + bar.get_width()/2, 103, f"{actual_vals[i]} ({'sec' if i==0 else 'sec' if i==1 else '%'})", 
                 ha='center', va='bottom', fontsize=7.8, fontweight='bold', color=C_NAVY)

    plt.suptitle("System Quality Assurance, Verification & Validation Results (Total: 37 Test Cases)", 
                 fontsize=13, fontweight='bold', color=C_NAVY, y=0.98)
    plt.tight_layout()
    fig.savefig(os.path.join(OUTPUT_DIR, 'fig7_test_results_chart.png'), bbox_inches='tight')
    plt.close(fig)
    print("Generated: fig7_test_results_chart.png")

if __name__ == '__main__':
    generate_figure1()
    generate_figure2()
    generate_figure3()
    generate_figure4()
    generate_figure5()
    generate_figure6()
    generate_figure7()
    print("All figures successfully created in", OUTPUT_DIR)
