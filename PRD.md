# Product Requirements Document (PRD)

## Kutchi Jain Oswal Samaj — Community Management Platform

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** March 2026  
**Owner:** Community Committee / Product Team

---

## 1. Product Overview

The Kutchi Jain Oswal Samaj Community Management Platform is a web-based application that digitizes the community's member records and replaces manual, paper-based administrative workflows. It provides a secure, role-differentiated interface for both general members and committee administrators.

The platform serves as the community's digital home — a place where members can discover each other, stay informed about events, and connect, while administrators maintain accurate, up-to-date records without relying on physical ledgers or scattered spreadsheets.

---

## 2. Problem Statement

The community currently manages member data through physical records and informal tools (paper registers, WhatsApp lists, Excel sheets shared manually). This leads to:

- **Data inconsistency:** Multiple outdated versions of member records in circulation.
- **Operational overhead:** Committee members spend significant time manually searching, updating, and sharing records.
- **Privacy risk:** Sensitive member data (phone numbers, addresses) shared indiscriminately through informal channels.
- **Poor discoverability:** Members cannot easily find or connect with others by profession or background.
- **No audit trail:** No record of who changed what and when.

---

## 3. Goals & Success Metrics

### Product Goals

| Goal                        | Description                                               |
| --------------------------- | --------------------------------------------------------- |
| Digitize member records     | 100% of active members imported and accessible digitally  |
| Enable self-serve discovery | Members can search the directory without admin assistance |
| Secure sensitive data       | Contact and address data protected by role-based access   |
| Reduce admin workload       | Committee can update records in < 2 minutes per member    |
| Build community trust       | Platform is perceived as professional and private         |

### Success Metrics (KPIs)

| Metric                                    | Target (6 months post-launch)     |
| ----------------------------------------- | --------------------------------- |
| Member accounts activated                 | ≥ 70% of total registered members |
| Monthly active users                      | ≥ 40% of activated members        |
| Admin time per record update              | < 2 minutes                       |
| Data accuracy (self-reported corrections) | < 5% error rate                   |
| Privacy incidents                         | 0                                 |
| Page load time                            | < 2 seconds on mobile             |

---

## 5. User Stories

### Authentication

- As a **member**, I want to log in with my phone number and OTP so that I don't need to remember a password.
- As a **committee member**, I want to log in with a password so that I can access admin tools securely.
- As a **visitor**, I want to browse the public landing page without logging in so that I can learn about the community before joining.

### Member Directory

- As a **member**, I want to search for other members by name or profession so that I can find relevant contacts.
- As a **member**, I want to see a member's name, occupation, and city — but not their home address or full phone number — to protect their privacy.
- As a **member**, I want to request connection with another member so that they can choose to share their contact with me.

### Admin Dashboard

- As an **admin**, I want to view all member records in a table with filters and sorting so that I can manage data efficiently.
- As an **admin**, I want to add a new member by filling a form so that new registrations are captured immediately.
- As an **admin**, I want to bulk-upload members via CSV so that I can migrate existing records quickly.
- As an **admin**, I want to edit any field of a member record so that outdated information is corrected.
- As an **admin**, I want to deactivate (not delete) a member so that historical data is preserved.
- As an **admin**, I want to see who last edited a record and when so that there is an audit trail.

### Landing Page

- As a **visitor**, I want to read about the community's history and mission so that I can understand its purpose.
- As a **visitor**, I want to see upcoming events so that I can plan attendance.
- As a **visitor**, I want a clear "Login" or "Join" button so that I know how to get access.

---

## 6. Functional Requirements

### FR-01: Authentication

- OTP-based login for members (via SMS or WhatsApp)
- Password-based login for admins
- Session timeout after 30 minutes of inactivity
- "Remember this device" option (7-day token persistence)
- Admin can reset any member's access

### FR-02: Public Landing Page

- Sections: Hero, About/History, Mission, Notable Members/Achievements, Events, Contact, CTA
- Fully accessible without login
- Events section managed by admin (CRUD from dashboard)
- Mobile-responsive

### FR-03: Member Directory

- Paginated list (20 members per page)
- Search by name (fuzzy), profession, city
- Member card shows: Full Name, Occupation, City
- Contact info shown only if member has opted in OR upon admin override
- "View Profile" link to a member detail page (still respects privacy settings)

### FR-04: Admin Dashboard

- Full data table: all fields visible
- Sortable columns, multi-filter support
- Inline editing or edit-modal per row
- Add member form (validated)
- CSV bulk upload with preview and error reporting
- Soft-delete (not delete) a member so that historical data is preserved.
- Export to CSV/Excel
- Audit log viewer (who changed what, when)

### FR-05: Member Profile (Self)

- Member can view their own full record
- Member can submit an "update request" for their data (admin approves)
- Member can toggle contact visibility (opt-in/opt-out)

---

## 7. Non-Functional Requirements

### Security

- HTTPS enforced on all routes
- Passwords hashed with bcrypt (cost factor ≥ 12)
- OTP valid for 5 minutes, single-use
- Role claims stored server-side (not solely in JWT payload)
- Admin routes protected by middleware at both API and UI level
- Rate limiting on login endpoints (max 5 attempts / 10 min)
- CSRF protection on all state-changing endpoints

### Privacy

- Sensitive fields (phone, address, DOB) encrypted at rest (AES-256)
- Member data never exposed in client-side bundle or public API
- GDPR-adjacent right-to-erasure flow (admin-initiated hard delete)
- Data export available to admin only

### Availability & Performance

- Target uptime: 99.5%
- Page load: < 2s on 4G mobile

### Accessibility

- WCAG 2.1 AA compliance target
- Adequate font sizes (min 16px body)
- Sufficient color contrast ratios
- Keyboard navigable

---

## 8. Risks & Assumptions

### Risks

| Risk                                     | Likelihood | Impact | Mitigation                                 |
| ---------------------------------------- | ---------- | ------ | ------------------------------------------ |
| Low member adoption (not tech-savvy)     | High       | High   | WhatsApp onboarding guide, helpdesk number |
| Incorrect data entered during CSV import | Medium     | High   | CSV validation preview before commit       |
| Admin misuse of full data access         | Low        | High   | Audit logs, role separation                |
| OTP delivery failure (SMS)               | Medium     | Medium | Fallback to WhatsApp OTP                   |
| Data loss on hosting failure             | Low        | High   | Daily automated backups                    |

### Assumptions

- The community has a designated technical coordinator who can assist with onboarding.
- An initial CSV/Excel of existing member records is available for bulk import.
- Committee members are available for a 1-hour admin training session post-launch.
- The platform will be hosted on a managed cloud provider (not self-hosted servers).
- Hindi/Gujarati language support is out of scope for MVP but planned for V2.
