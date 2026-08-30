'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Bell, BriefcaseBusiness,
  CalendarCheck2, CarFront, Check, ChevronDown, CircleDollarSign, ClipboardList,
  Clock3, Download, FileText, Fuel, Gauge, LayoutDashboard, Menu, Moon, MoreHorizontal,
  Package, PanelLeftClose, Plus, ReceiptText, Search, Settings2, Sun, Truck, Users,
  WalletCards, X, Zap, ShieldCheck, ScrollText, SlidersHorizontal, CarFront as FleetCar,
  UserCog, History, Save, Pencil, Eye,
} from 'lucide-react'

import { supabase } from '@/lib/supabaseClient'
import DashboardOverview from '@/components/dashboard'
import FinanceManagement from '@/components/billing-management'
import VehicleManagementPortal from '@/app/vehicles/page'

const nav = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Attendance', icon: CalendarCheck2 },
  { label: 'Finance', icon: CircleDollarSign },
  { label: 'Logistics', icon: Truck },
  { label: 'Invoices', icon: FileText },
  { label: 'Vehicle Management', icon: FleetCar },
  { label: 'Admin Panel', icon: ShieldCheck, authorized: true },
]

const attendance = [
  ['Aisha Bello', 'Site Manager', '07:42 AM', 'Present', 'AB'],
  ['Daniel Okafor', 'Civil Engineer', '07:58 AM', 'Present', 'DO'],
  ['Grace Mensah', 'Quantity Surveyor', '08:10 AM', 'Late', 'GM'],
  ['Michael Chen', 'Fleet Supervisor', '—', 'Absent', 'MC'],
  ['Samuel Adeyemi', 'Site Foreman', '07:35 AM', 'Present', 'SA'],
]

function Status({ children, kind }: { children: React.ReactNode; kind: string }) {
  return <span className={`status status-${kind}`}>{kind === 'paid' && <Check size={12} />}{children}</span>
}

export default function Page() {
  const [active, setActive] = useState('Dashboard')
  const [dark, setDark] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600) }
  const show = (label: string) => { setActive(label); setMobileNav(false) }

  return (
    <div className={dark ? 'erp-shell dark' : 'erp-shell'}>
      <aside className={mobileNav ? 'sidebar sidebar-open' : 'sidebar'}>
        <div className="brand"><div className="brand-mark"><Zap size={18} fill="currentColor" /></div><div><strong>BROWNS</strong><span>ENGINEERING & CONSTRUCTION</span></div><button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X /></button></div>
        <div className="workspace"><span className="eyebrow">WORKSPACE</span><button className="workspace-select">Browns HQ <ChevronDown size={14} /></button></div>
        <nav className="main-nav" aria-label="Main navigation">{nav.filter((item) => !item.authorized || true).map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'nav-item active' : 'nav-item'} onClick={() => show(label)}><Icon size={18} /><span>{label}</span>{label === 'Finance' && <i>4</i>}{label === 'Admin Panel' && <i className="admin-pill">AUTH</i>}</button>)}</nav>
        <div className="nav-group"><span className="eyebrow">MANAGE</span><button className="nav-item"><Package size={18} /><span>Projects</span></button><button className="nav-item"><Users size={18} /><span>People</span></button><button className="nav-item"><Settings2 size={18} /><span>Settings</span></button></div>
        <div className="sidebar-foot"><div className="help-card"><div className="help-icon"><Activity size={16} /></div><strong>Need help?</strong><span>Talk to your workspace admin.</span><button onClick={() => notify('Support request opened')}>Contact support <ArrowUpRight size={14} /></button></div><div className="profile"><div className="avatar">KO</div><div><strong>Sandun Harshana</strong><span>Executive Director</span></div><MoreHorizontal size={17} /></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><button className="menu-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></button><div className="crumb"><span>Workspace</span><ChevronDown size={14} /><b>{active}</b></div><div className="top-actions"><label className="search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search anything..." /><kbd>⌘ K</kbd></label><button className="icon-button" onClick={() => notify('No new notifications')} aria-label="Notifications"><Bell size={18} /><i /></button><button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button><div className="top-avatar">SH</div></div></header>
        <div className="content">
          {active !== 'Dashboard' && active !== 'Finance' && active !== 'Vehicle Management' && (
            <section className="page-heading">
              <div>
                <span className="eyebrow">BROWNS ENTERPRISE SYSTEM</span>
                <h1>{active}</h1>
                <p>Manage your {active.toLowerCase()} from one connected workspace.</p>
              </div>
              <div className="heading-actions">
                <button className="button secondary" onClick={() => notify('Report export started')}><Download size={16} /> Export report</button>
                <button className="button primary" onClick={() => notify('New record form opened')}><Plus size={16} /> New record</button>
              </div>
            </section>
          )}

          {active === 'Dashboard' && <DashboardOverview />}
          {active === 'Attendance' && <Attendance checkedIn={checkedIn} setCheckedIn={setCheckedIn} notify={notify} />}
          {active === 'Finance' && <FinanceManagement />}
          {active === 'Logistics' && <Logistics notify={notify} />}
          {active === 'Invoices' && <Invoices notify={notify} />}
          {active === 'Vehicle Management' && <VehicleManagementPortal />}
          {active === 'Admin Panel' && <AdminPanel notify={notify} />}
        </div>
      </main>
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  )
}

function Stat({title,value,change,icon:Icon,tone}:any){return <div className="stat"><div className={`stat-icon ${tone}`}><Icon size={18}/></div><span className="stat-title">{title}</span><strong>{value}</strong><small className={change.startsWith('+') ? 'positive' : 'neutral'}>{change.startsWith('+') ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>} {change}</small></div>}
function Attendance({checkedIn,setCheckedIn,notify}:any){return <section className="panel full-panel"><div className="table-toolbar"><div><span className="eyebrow">DAILY ATTENDANCE LOGS</span><h2>Daily employee attendance</h2></div><button className="button primary" onClick={()=>{setCheckedIn(!checkedIn);notify(checkedIn?'Checked out':'Checked in at 8:42 AM')}}><Clock3 size={16}/>{checkedIn?'Check out':'Check in'}</button></div><div className="summary-strip"><div><span>Present</span><strong>41</strong></div><div><span>Late arrivals</span><strong>3</strong></div><div><span>Absent</span><strong>2</strong></div><div><span>Attendance rate</span><strong>94.2%</strong></div></div><div className="table-wrap"><table><thead><tr><th>Team member</th><th>Role</th><th>Check-in time</th><th>Status</th><th /></tr></thead><tbody>{attendance.map(([name,role,time,status,initials])=><tr key={name}><td><div className="person"><span className="avatar small">{initials}</span><strong>{name}</strong></div></td><td>{role}</td><td>{time}</td><td><Status kind={status.toLowerCase()}>{status}</Status></td><td><button className="icon-button"><MoreHorizontal size={16}/></button></td></tr>)}</tbody></table></div></section>}
function Logistics({notify}:any){return <><div className="logistics-hero"><div><span className="eyebrow">FLEET & LOGISTICS</span><h2>Keep every site moving.</h2><p>Monitor fuel cards, vehicle assignments, and dispatch activity from one view.</p></div><button className="button primary" onClick={()=>notify('Fuel limit request opened')}><Plus size={16}/> Request fuel limit</button></div><div className="bottom-grid"><section className="panel"><div className="panel-head"><div><span className="eyebrow">FUEL CARDS</span><h2>Usage by card</h2></div><Fuel className="panel-icon" size={18}/></div><div className="card-list"><div className="fuel-card"><span className="card-chip">B</span><div><strong>BE-0042</strong><span>Site operations · Hilux</span></div><b>Rs. 420,800</b><Status kind="active">Active</Status></div><div className="fuel-card"><span className="card-chip orange-chip">B</span><div><strong>BE-0038</strong><span>Fleet · Transit</span></div><b>Rs. 198,400</b><Status kind="warning">Near limit</Status></div></div></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">DISPATCH BOARD</span><h2>Today’s movements</h2></div><Truck size={18} className="panel-icon"/></div><div className="dispatch"><div><span className="time">09:30</span><strong>Steel delivery</strong><span>Lekki → Project Atlas</span></div><Status kind="active">In transit</Status></div><div className="dispatch"><div><span className="time">11:00</span><strong>Equipment transfer</strong><span>Ikeja → Project Delta</span></div><Status kind="pending">Scheduled</Status></div></section></div></>}

function AdminPanel({notify}:any){const [saved,setSaved]=useState(false); return <><div className="admin-banner"><div className="admin-shield"><ShieldCheck size={22}/></div><div><span className="eyebrow">AUTHORIZED ACCESS · ADMINISTRATOR</span><h2>Company management center</h2><p>Manage access, monitor sensitive activity, and configure Browns workspace defaults.</p></div><Status kind="active">Protected</Status></div><div className="admin-grid"><section className="panel"><div className="panel-head"><div><span className="eyebrow">ACCESS CONTROL</span><h2>User role management</h2></div><UserCog size={18} className="panel-icon"/></div><div className="role-list">{[['Sandun Harshana','Administrator','SH'],['Aisha Bello','Site Manager','AB'],['Daniel Okafor','Accountant','DO'],['Grace Mensah','Quantity Surveyor','GM']].map(([name,role,initials])=><div className="role-row" key={name}><span className="avatar small">{initials}</span><div><strong>{name}</strong><span>{role}</span></div><select defaultValue={role} onChange={()=>notify(`${name}'s role updated`)}><option>Administrator</option><option>Site Manager</option><option>Accountant</option><option>Employee</option></select></div>)}</div></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">COMPANY DEFAULTS</span><h2>Global settings</h2></div><SlidersHorizontal size={18} className="panel-icon"/></div><div className="settings-form"><label>Default fuel rate<input defaultValue="Rs. 370 / litre"/></label><label>Attendance cutoff time<input type="time" defaultValue="08:00"/></label><label>Monthly fleet fuel limit<input defaultValue="Rs. 6,000,000"/></label><button className="button primary" onClick={()=>{setSaved(true);notify('Global settings saved')}}><Save size={15}/> {saved?'Settings saved':'Save settings'}</button></div></section></div><section className="panel full-panel"><div className="panel-head"><div><span className="eyebrow">AUDIT TRAIL · LIVE</span><h2>System activity logs</h2></div><ScrollText size={18} className="panel-icon"/></div><div className="log-list"><div><span className="log-time">2 min ago</span><div className="log-icon orange"><Pencil size={14}/></div><p><strong>Daniel Okafor</strong> updated bill <b>INV-2841</b><small>Amount changed to Rs. 2,480,000</small></p></div><div><span className="log-time">18 min ago</span><div className="log-icon blue"><Fuel size={14}/></div><p><strong>Sandun Harshana</strong> approved fuel card increase <b>BE-0042</b><small>Limit increased by Rs. 120,000</small></p></div><div><span className="log-time">42 min ago</span><div className="log-icon green"><UserCog size={14}/></div><p><strong>Sandun Harshana</strong> assigned role <b>Accountant</b> to Daniel Okafor<small>Access permissions updated</small></p></div></div></section></>}

function Invoices({notify}:any){const [client,setClient]=useState('Meridian Developments Ltd.'); return <section className="invoice-layout"><div className="panel invoice-form"><div className="panel-head"><div><span className="eyebrow">NEW DOCUMENT</span><h2>Client invoice</h2></div><Status kind="draft">Draft</Status></div><label>Bill to<input value={client} onChange={e=>setClient(e.target.value)}/></label><div className="field-row"><label>Invoice number<input defaultValue="BE-2026-0098"/></label><label>Due date<input defaultValue="Sep 28, 2026"/></label></div><div className="invoice-line"><div><strong>Site supervision & project management</strong><span>Project Atlas · August 2026</span></div><strong>Rs. 4,800,000</strong></div><button className="add-line" onClick={()=>notify('Line item added')}><Plus size={15}/> Add line item</button><div className="invoice-total"><span>Subtotal</span><strong>Rs. 4,800,000</strong><span>VAT (18%)</span><strong>Rs. 864,000</strong><span className="total-label">Total due</span><strong className="total">Rs. 5,664,000</strong></div><div className="invoice-actions"><button className="button secondary" onClick={()=>notify('PDF preview generated')}><Download size={16}/> Preview PDF</button><button className="button primary" onClick={()=>notify('Invoice sent via Gmail')}><ReceiptText size={16}/> Send via Gmail</button></div></div><div className="invoice-preview"><div className="paper"><div className="paper-top"><div className="brand-mark small-mark"><Zap size={14} fill="currentColor"/></div><span>INVOICE</span></div><div className="paper-title"><strong>BROWNS</strong><span>ENGINEERING & CONSTRUCTION</span></div><div className="paper-meta"><span>Invoice no.<b>BE-2026-0098</b></span><span>Issue date<b>Aug 28, 2026</b></span></div><div className="paper-client"><span>Bill to</span><strong>{client}</strong><small>Colombo 03, Sri Lanka</small></div><div className="paper-item"><span>DESCRIPTION</span><b>AMOUNT</b><p>Site supervision & project management<small>Project Atlas · August 2026</small></p><strong>Rs. 4,800,000</strong></div><div className="paper-bottom"><span>Total due</span><strong>Rs. 5,664,000</strong></div><small className="paper-note">Thank you for your business. Payment is due within 30 days.</small></div></div></section>}
