import { useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Crown,
  Dribbble,
  Flag,
  Globe2,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";

type Role = "student" | "admin" | "super_admin";
type Section = "overview" | "clubs" | "events" | "groups" | "admin";

type Announcement = {
  id: number;
  title: string;
  category: string;
  source: string;
  published: string;
  priority: "Important" | "Update" | "Opportunity";
};

const initialAnnouncements: Announcement[] = [
  { id: 1, title: "Semester registration closes this Friday", category: "Academic", source: "Academic Registrar", published: "Today, 08:40", priority: "Important" },
  { id: 2, title: "UTAMU Innovation Week is now open for applications", category: "Opportunity", source: "Innovation Hub", published: "Yesterday", priority: "Opportunity" },
  { id: 3, title: "Inter-faculty football fixtures are out", category: "Sports", source: "Sports Office", published: "2 days ago", priority: "Update" },
];

const clubs = [
  { name: "UTAMU Developers Community", category: "Technology", members: 284, color: "lavender", icon: Globe2 },
  { name: "Entrepreneurship & Innovation Club", category: "Innovation", members: 167, color: "peach", icon: Sparkles },
  { name: "Debate & Public Speaking Society", category: "Leadership", members: 93, color: "mint", icon: MessageCircle },
];

const events = [
  { title: "Football: School of Computing vs Business", type: "Football", when: "Today · 4:00 PM", place: "Main Sports Grounds", icon: Trophy, color: "gold" },
  { title: "Women in Tech networking circle", type: "Club event", when: "Tomorrow · 2:00 PM", place: "Innovation Lab", icon: Users, color: "lavender" },
  { title: "Netball trials and team registration", type: "Netball", when: "Saturday · 10:00 AM", place: "Sports Pavilion", icon: Dribbble, color: "peach" },
];

const groups = [
  { name: "BIS Year 2 — Study Circle", detail: "48 members · Active 5 min ago", accent: "blue" },
  { name: "UTAMU Creatives", detail: "126 members · Active 12 min ago", accent: "pink" },
  { name: "Hostel & Accommodation Help", detail: "312 members · Active 1 hour ago", accent: "green" },
];

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "clubs", label: "Clubs", icon: Users },
  { id: "events", label: "Events & sport", icon: CalendarDays },
  { id: "groups", label: "Groups", icon: MessageCircle },
];

export default function App() {
  const [section, setSection] = useState<Section>("overview");
  const [role, setRole] = useState<Role>("admin");
  const [menuOpen, setMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [announcementText, setAnnouncementText] = useState("");

  const roleLabel = role === "super_admin" ? "Super admin" : role === "admin" ? "Admin" : "Student";

  const addAnnouncement = () => {
    const title = announcementText.trim();
    if (!title) return;
    setAnnouncements((current) => [
      { id: Date.now(), title, category: "Campus", source: roleLabel, published: "Just now", priority: "Update" },
      ...current,
    ]);
    setAnnouncementText("");
  };

  const openSection = (next: Section) => {
    setSection(next);
    setMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={menuOpen ? "sidebar sidebar-open" : "sidebar"}>
        <div className="brand">
          <div className="brand-mark"><Sparkles size={20} /></div>
          <div><strong>CAMPUS HUB</strong><span>UTAMU community</span></div>
        </div>
        <div className="sidebar-label">Your campus</div>
        <nav className="side-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return <button className={section === item.id ? "side-link active" : "side-link"} key={item.id} onClick={() => openSection(item.id)}><Icon size={18} />{item.label}</button>;
          })}
          {role !== "student" && <button className={section === "admin" ? "side-link active" : "side-link"} onClick={() => openSection("admin")}><ShieldCheck size={18} />Admin centre</button>}
        </nav>
        <div className="sidebar-spacer" />
        <div className="role-switcher clay-inset">
          <span>Preview role</span>
          <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super admin</option>
          </select>
        </div>
        <div className="profile-mini">
          <div className="avatar">AO</div>
          <div><strong>Ada Okello</strong><span>{roleLabel}</span></div>
          <ChevronRight size={16} />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="menu-toggle clay-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          <div className="breadcrumb"><span>Tuesday, 24 September</span><strong>{section === "overview" ? "Good morning, Ada" : navItems.find((item) => item.id === section)?.label ?? "Admin centre"}</strong></div>
          <div className="top-actions">
            <label className="search-box"><Search size={16} /><input placeholder="Search campus hub" aria-label="Search campus hub" /></label>
            <button className="clay-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="avatar avatar-large">AO</div>
          </div>
        </header>

        <div className="content">
          {section === "overview" && <Overview openSection={openSection} announcements={announcements} />}
          {section === "clubs" && <Clubs />}
          {section === "events" && <Events />}
          {section === "groups" && <Groups />}
          {section === "admin" && role !== "student" && <AdminCentre announcements={announcements} announcementText={announcementText} setAnnouncementText={setAnnouncementText} addAnnouncement={addAnnouncement} role={role} />}
        </div>
      </main>
    </div>
  );
}

function PageHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <div className="page-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>;
}

function Overview({ openSection, announcements }: { openSection: (section: Section) => void; announcements: Announcement[] }) {
  const stats = useMemo(() => [
    { label: "Unread updates", value: announcements.length, icon: Bell, tone: "lavender" },
    { label: "Events this week", value: 8, icon: CalendarDays, tone: "peach" },
    { label: "Clubs to explore", value: 24, icon: Users, tone: "mint" },
    { label: "Active groups", value: 36, icon: MessageCircle, tone: "blue" },
  ], [announcements.length]);

  return <><PageHeading eyebrow="Your campus, in one clear view" title="Stay close to what matters." copy="Official notices, clubs, sport, events and student conversations — together in one trusted place." />
    <section className="welcome-card clay-card">
      <div><span className="status-tag"><CheckCircle2 size={14} /> Campus pulse is clear</span><h2>One home for UTAMU student life.</h2><p>Discover what is happening, join communities and never miss an important campus update.</p><button className="primary-button" onClick={() => openSection("events")}>Explore this week <ChevronRight size={16} /></button></div>
      <div className="welcome-orbit"><Sparkles size={30} /><strong>UTAMU</strong><span>connect · create · belong</span></div>
    </section>
    <div className="stats-grid">{stats.map((stat) => { const Icon = stat.icon; return <div className={`stat-card clay-card ${stat.tone}`} key={stat.label}><span className="stat-icon"><Icon size={20} /></span><strong>{stat.value}</strong><span>{stat.label}</span></div>; })}</div>
    <div className="dashboard-grid">
      <section className="panel clay-card"><div className="section-header"><div><span className="eyebrow">Verified information</span><h2>Latest announcements</h2></div><button className="text-button" onClick={() => openSection("admin")}>Manage <ChevronRight size={15} /></button></div><div className="announcement-list">{announcements.slice(0, 3).map((item) => <AnnouncementRow item={item} key={item.id} />)}</div></section>
      <section className="panel clay-card"><div className="section-header"><div><span className="eyebrow">Find your people</span><h2>Community shortcuts</h2></div></div><div className="shortcut-list"><button onClick={() => openSection("clubs")}><span className="shortcut-icon lavender"><Users size={18} /></span><span><strong>Find a club</strong><small>Innovation, tech, culture and more</small></span><ChevronRight size={16} /></button><button onClick={() => openSection("groups")}><span className="shortcut-icon peach"><MessageCircle size={18} /></span><span><strong>Join a student group</strong><small>Study, create and coordinate</small></span><ChevronRight size={16} /></button><button onClick={() => openSection("events")}><span className="shortcut-icon mint"><Trophy size={18} /></span><span><strong>See sport & events</strong><small>Football, netball, volleyball</small></span><ChevronRight size={16} /></button></div></section>
    </div>
  </>;
}

function AnnouncementRow({ item }: { item: Announcement }) {
  return <article className="announcement-row"><div className={`priority-dot ${item.priority.toLowerCase()}`} /><div><div className="row-meta"><span>{item.category}</span><span>·</span><span>{item.published}</span></div><h3>{item.title}</h3><p><ShieldCheck size={13} /> {item.source}</p></div><ChevronRight size={17} /></article>;
}

function Clubs() {
  return <><PageHeading eyebrow="Clubs & societies" title="Find your people." copy="Explore verified UTAMU clubs creating space for innovation, networking, leadership and belonging." /><div className="filter-row"><span className="filter-chip active">All clubs</span><span className="filter-chip">Technology</span><span className="filter-chip">Innovation</span><span className="filter-chip">Leadership</span><button className="primary-button small"><Plus size={15} /> Register a club</button></div><section className="cards-grid">{clubs.map((club) => { const Icon = club.icon; return <article className="club-card clay-card" key={club.name}><div className={`club-cover ${club.color}`}><Icon size={28} /><span className="verified"><ShieldCheck size={13} /> Verified</span></div><div className="card-body"><span className="eyebrow">{club.category}</span><h2>{club.name}</h2><p>{club.members} members · 2 events this month</p><button className="outline-button">View club <ChevronRight size={15} /></button></div></article>; })}</section></>;
}

function Events() {
  return <><PageHeading eyebrow="Events & sport" title="There is always something on." copy="Keep up with the activities that make UTAMU memorable — from matches and trials to clubs and campus meetups." /><div className="event-hero clay-card"><div><span className="status-tag"><CalendarDays size={14} /> This week at UTAMU</span><h2>Show up. Connect. Make it yours.</h2><p>Register for events, follow fixtures and get reminders before the action starts.</p><button className="primary-button">Create an event <Plus size={15} /></button></div><div className="event-badge"><Trophy size={24} /><strong>08</strong><span>activities</span></div></div><section className="panel clay-card event-panel"><div className="section-header"><div><span className="eyebrow">Upcoming</span><h2>Sport and community</h2></div><button className="text-button">View calendar <ChevronRight size={15} /></button></div><div className="event-list">{events.map((event) => { const Icon = event.icon; return <article className="event-row" key={event.title}><div className={`event-icon ${event.color}`}><Icon size={21} /></div><div className="event-info"><span className="eyebrow">{event.type}</span><h3>{event.title}</h3><p>{event.when} · {event.place}</p></div><button className="outline-button">Interested</button></article>; })}</div></section></>;
}

function Groups() {
  return <><PageHeading eyebrow="Student groups" title="A calmer home for conversation." copy="Create or join spaces for your class, hostel, project, sport team or any community that matters to you." /><div className="group-actions"><div className="group-search clay-inset"><Search size={17} /><input placeholder="Search groups" /></div><button className="primary-button"><Plus size={15} /> Create a group</button></div><section className="panel clay-card"><div className="section-header"><div><span className="eyebrow">Recommended for you</span><h2>Active communities</h2></div><span className="mini-count">36 groups</span></div><div className="group-list">{groups.map((group) => <article className="group-row" key={group.name}><div className={`group-avatar ${group.accent}`}><Users size={20} /></div><div><h3>{group.name}</h3><p>{group.detail}</p></div><button className="outline-button">Join group</button></article>)}</div></section><div className="trust-note clay-inset"><ShieldCheck size={19} /><div><strong>Community rules keep Campus Hub safe.</strong><p>Every group has clear ownership, reporting and moderation tools.</p></div><CircleHelp size={18} /></div></>;
}

function AdminCentre({ announcements, announcementText, setAnnouncementText, addAnnouncement, role }: { announcements: Announcement[]; announcementText: string; setAnnouncementText: (value: string) => void; addAnnouncement: () => void; role: Role }) {
  return <><PageHeading eyebrow={`${role === "super_admin" ? "Super admin" : "Admin"} centre`} title="Keep the campus clear and trusted." copy="Publish verified information, review communities and keep the UTAMU digital commons healthy." /><div className="admin-summary"><div className="admin-stat clay-card"><ShieldCheck size={20} /><strong>24</strong><span>Verified clubs</span></div><div className="admin-stat clay-card"><Flag size={20} /><strong>3</strong><span>Reports to review</span></div><div className="admin-stat clay-card"><Users size={20} /><strong>1,248</strong><span>Active students</span></div>{role === "super_admin" && <div className="admin-stat clay-card"><Crown size={20} /><strong>6</strong><span>Admins managed</span></div>}</div><div className="admin-grid"><section className="panel clay-card"><div className="section-header"><div><span className="eyebrow">Publish</span><h2>New announcement</h2></div><ClipboardList size={21} /></div><textarea value={announcementText} onChange={(event) => setAnnouncementText(event.target.value)} placeholder="Write a clear announcement for UTAMU students..." /><button className="primary-button" onClick={addAnnouncement}>Publish update <CheckCircle2 size={15} /></button></section><section className="panel clay-card"><div className="section-header"><div><span className="eyebrow">Moderation queue</span><h2>Needs attention</h2></div><span className="mini-count">3 open</span></div><div className="moderation-list"><div><Flag size={16} /><span><strong>Review a reported group post</strong><small>Reported 24 minutes ago</small></span><button className="text-button">Review</button></div><div><Users size={16} /><span><strong>Approve new club registration</strong><small>Submitted yesterday</small></span><button className="text-button">Review</button></div><div><ShieldCheck size={16} /><span><strong>Update community guidelines</strong><small>Annual review due</small></span><button className="text-button">Open</button></div></div></section></div><section className="panel clay-card"><div className="section-header"><div><span className="eyebrow">Audit trail</span><h2>Recent published updates</h2></div><span className="mini-count">{announcements.length} total</span></div><div className="announcement-list">{announcements.map((item) => <AnnouncementRow item={item} key={item.id} />)}</div></section></>;
}
