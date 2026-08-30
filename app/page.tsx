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
const bills = [
  ['INV-2841', 'BuildRight Supplies', 'Concrete & aggregates', '₦2,480,000', 'Due in 3 days', 'pending'],
  ['INV-2837', 'Northstar Logistics', 'Haulage services', '₦860,500', 'Paid', 'paid'],
  ['INV-2829', 'PowerGrid Energy', 'Site power — August', '₦1,245,000', 'Overdue', 'overdue'],
  ['INV-2822', 'Apex Safety Ltd.', 'PPE replenishment', '₦384,750', 'Paid', 'paid'],
]

function Spark({ values, tone = 'orange' }: { values: number[]; tone?: 'orange' | 'blue' }) {
  const max = Math.max(...values), min = Math.min(...values)
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${88 - ((v - min) / (max - min || 1)) * 70}`).join(' ')
  return <svg className={`spark spark-${tone}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg>
}

function Status({ children, kind }: { children: React.ReactNode; kind: string }) {
  return <span className={`status status-${kind}`}>{kind === 'paid' && <Check size={12} />}{children}</span>
}

export default function Page() {
  const [active, setActive] = useState('Dashboard')
  const [dark, setDark] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [billState, setBillState] = useState(bills)
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600) }
  const filteredBills = useMemo(() => billState.filter((b) => b.join(' ').toLowerCase().includes(search.toLowerCase())), [billState, search])
  const show = (label: string) => { setActive(label); setMobileNav(false) }

  return (
    <div className={dark ? 'erp-shell dark' : 'erp-shell'}>
      <aside className={mobileNav ? 'sidebar sidebar-open' : 'sidebar'}>
        <div className="brand"><div className="brand-mark"><Zap size={18} fill="currentColor" /></div><div><strong>BROWNS</strong><span>ENGINEERING & CONSTRUCTION</span></div><button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X /></button></div>
        <div className="workspace"><span className="eyebrow">WORKSPACE</span><button className="workspace-select">Browns HQ <ChevronDown size={14} /></button></div>
        <nav className="main-nav" aria-label="Main navigation">{nav.filter((item) => !item.authorized || true).map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'nav-item active' : 'nav-item'} onClick={() => show(label)}><Icon size={18} /><span>{label}</span>{label === 'Finance' && <i>4</i>}{label === 'Admin Panel' && <i className="admin-pill">AUTH</i>}</button>)}</nav>
        <div className="nav-group"><span className="eyebrow">MANAGE</span><button className="nav-item"><Package size={18} /><span>Projects</span></button><button className="nav-item"><Users size={18} /><span>People</span></button><button className="nav-item"><Settings2 size={18} /><span>Settings</span></button></div>
        <div className="sidebar-foot"><div className="help-card"><div className="help-icon"><Activity size={16} /></div><strong>Need help?</strong><span>Talk to your workspace admin.</span><button onClick={() => notify('Support request opened')}>Contact support <ArrowUpRight size={14} /></button></div><div className="profile"><div className="avatar">KO</div><div><strong>Kemi Ojo</strong><span>Administrator</span></div><MoreHorizontal size={17} /></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><button className="menu-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></button><div className="crumb"><span>Workspace</span><ChevronDown size={14} /><b>{active}</b></div><div className="top-actions"><label className="search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search anything..." /><kbd>⌘ K</kbd></label><button className="icon-button" onClick={() => notify('No new notifications')} aria-label="Notifications"><Bell size={18} /><i /></button><button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button><div className="top-avatar">KO</div></div></header>
        <div className="content">
          <section className="page-heading"><div><span className="eyebrow">THURSDAY, AUGUST 28, 2026</span><h1>{active === 'Dashboard' ? 'Good morning, Kemi.' : active}</h1><p>{active === 'Dashboard' ? 'Here’s what’s happening across your operations today.' : `Manage your ${active.toLowerCase()} from one connected workspace.`}</p></div><div className="heading-actions"><button className="button secondary" onClick={() => notify('Report export started')}><Download size={16} /> Export report</button><button className="button primary" onClick={() => notify('New record form opened')}><Plus size={16} /> New record</button></div></section>

          {active === 'Dashboard' && <Dashboard notify={notify} checkedIn={checkedIn} setCheckedIn={setCheckedIn} />}
          {active === 'Attendance' && <Attendance checkedIn={checkedIn} setCheckedIn={setCheckedIn} notify={notify} />}
          {active === 'Finance' && <Finance bills={filteredBills} setBillState={setBillState} notify={notify} />}
          {active === 'Logistics' && <Logistics notify={notify} />}
          {active === 'Invoices' && <Invoices notify={notify} />}
          {active === 'Vehicle Management' && <VehicleManagement notify={notify} />}
          {active === 'Admin Panel' && <AdminPanel notify={notify} />}
        </div>
      </main>
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  )
}

function Dashboard({ notify, checkedIn, setCheckedIn }: any) {
  return <>
    <div className="stat-grid"><Stat title="Active projects" value="12" change="+2 this month" icon={BriefcaseBusiness} tone="blue" /><Stat title="Team attendance" value="94.2%" change="+1.8% vs last week" icon={Users} tone="orange" /><Stat title="Pending bills" value="₦8.42m" change="₦1.2m due this week" icon={WalletCards} tone="purple" /><Stat title="Fuel consumption" value="4,280 L" change="-8.4% vs last month" icon={Fuel} tone="green" /></div>
    <div className="dashboard-grid"><section className="panel chart-panel"><div className="panel-head"><div><span className="eyebrow">OPERATIONS OVERVIEW</span><h2>Project activity</h2></div><button className="select-button">Last 7 days <ChevronDown size={14} /></button></div><div className="chart-legend"><span><i className="dot dot-orange" />Revenue</span><span><i className="dot dot-blue" />Expenses</span></div><div className="activity-chart"><div className="y-labels"><span>₦6m</span><span>₦4m</span><span>₦2m</span><span>₦0</span></div><div className="chart-canvas"><div className="grid-lines" /><svg viewBox="0 0 600 210" preserveAspectRatio="none"><path d="M0 170 C50 154 68 112 112 128 S180 156 220 92 S290 106 330 80 S390 105 430 60 S500 82 600 28" fill="none" stroke="var(--orange)" strokeWidth="3" /><path d="M0 188 C70 178 90 164 140 174 S210 151 260 158 S340 124 390 140 S480 110 600 96" fill="none" stroke="var(--blue)" strokeWidth="3" strokeDasharray="5 5" /><path d="M0 170 C50 154 68 112 112 128 S180 156 220 92 S290 106 330 80 S390 105 430 60 S500 82 600 28 L600 210 L0 210Z" fill="url(#fade)" opacity=".16" /><defs><linearGradient id="fade" x1="0" x2="0" y1="0" y2="1"><stop stopColor="var(--orange)"/><stop offset="1" stopColor="var(--orange)" stopOpacity="0"/></linearGradient></defs></svg><div className="x-labels"><span>Aug 22</span><span>Aug 23</span><span>Aug 24</span><span>Aug 25</span><span>Aug 26</span><span>Aug 27</span><span>Today</span></div></div></div></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">QUICK ACTIONS</span><h2>Get things done</h2></div></div><div className="quick-list"><Quick icon={CalendarCheck2} title="Record attendance" sub="12 team members pending" onClick={() => notify('Attendance module opened')} /><Quick icon={ReceiptText} title="Review bills" sub="4 invoices need attention" onClick={() => notify('Finance module opened')} /><Quick icon={FileText} title="Create invoice" sub="Draft a client invoice" onClick={() => notify('Invoice draft started')} /></div></section></div>
    <div className="bottom-grid"><section className="panel"><div className="panel-head"><div><span className="eyebrow">TODAY</span><h2>Attendance snapshot</h2></div><button className="text-button" onClick={() => notify('Attendance report opened')}>View all <ArrowUpRight size={14} /></button></div><div className="attendance-row"><div className="big-progress"><span>94%</span><small>Present today</small></div><div className="mini-bars"><div><span>On time</span><b><i style={{width:'82%'}} /></b><em>41</em></div><div><span>Late</span><b><i style={{width:'25%'}} /></b><em>3</em></div><div><span>Absent</span><b><i style={{width:'12%'}} /></b><em>2</em></div></div></div><button className={checkedIn ? 'checkin checked' : 'checkin'} onClick={() => {setCheckedIn(!checkedIn); notify(checkedIn ? 'Checked out successfully' : 'Checked in at 8:42 AM')}}>{checkedIn ? <Check size={16} /> : <Clock3 size={16} />}{checkedIn ? 'Checked in today' : 'Check in for today'}<span>{checkedIn ? '8:42 AM' : 'Tap to record'}</span></button></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">FLEET MONITOR</span><h2>Fuel usage</h2></div><Gauge size={18} className="panel-icon" /></div><div className="fuel-hero"><div className="fuel-ring"><strong>72%</strong><span>within limit</span></div><div><strong>4,280 L</strong><span>of 6,000 L monthly limit</span><div className="progress"><i style={{width:'72%'}} /></div><small>₦1.92m spent this month</small></div></div><div className="fuel-foot"><span><i className="dot dot-orange" />Construction site</span><b>2,840 L</b><span><i className="dot dot-blue" />Fleet operations</span><b>1,440 L</b></div></section></div>
  </>
}
function Stat({title,value,change,icon:Icon,tone}:any){return <div className="stat"><div className={`stat-icon ${tone}`}><Icon size={18}/></div><span className="stat-title">{title}</span><strong>{value}</strong><small className={change.startsWith('+') ? 'positive' : 'neutral'}>{change.startsWith('+') ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>} {change}</small></div>}
function Quick({icon:Icon,title,sub,onClick}:any){return <button className="quick" onClick={onClick}><div className="quick-icon"><Icon size={18}/></div><div><strong>{title}</strong><span>{sub}</span></div><ArrowUpRight size={16}/></button>}
function Attendance({checkedIn,setCheckedIn,notify}:any){return <section className="panel full-panel"><div className="table-toolbar"><div><span className="eyebrow">AUGUST 28, 2026</span><h2>Daily attendance</h2></div><button className="button primary" onClick={()=>{setCheckedIn(!checkedIn);notify(checkedIn?'Checked out':'Checked in at 8:42 AM')}}><Clock3 size={16}/>{checkedIn?'Check out':'Check in'}</button></div><div className="summary-strip"><div><span>Present</span><strong>41</strong></div><div><span>Late arrivals</span><strong>3</strong></div><div><span>Absent</span><strong>2</strong></div><div><span>Attendance rate</span><strong>94.2%</strong></div></div><div className="table-wrap"><table><thead><tr><th>Team member</th><th>Role</th><th>Check-in time</th><th>Status</th><th /></tr></thead><tbody>{attendance.map(([name,role,time,status,initials])=><tr key={name}><td><div className="person"><span className="avatar small">{initials}</span><strong>{name}</strong></div></td><td>{role}</td><td>{time}</td><td><Status kind={status.toLowerCase()}>{status}</Status></td><td><button className="icon-button"><MoreHorizontal size={16}/></button></td></tr>)}</tbody></table></div></section>}
function Finance({bills,setBillState,notify}:any){return <><div className="stat-grid"><Stat title="Outstanding" value="₦8.42m" change="₦1.2m due this week" icon={WalletCards} tone="purple"/><Stat title="Paid this month" value="₦14.8m" change="+12.4% vs July" icon={Check} tone="green"/><Stat title="Overdue" value="₦1.24m" change="2 invoices" icon={AlertTriangle} tone="orange"/><Stat title="Petty cash balance" value="₦640,500" change="₦120k spent this week" icon={WalletCards} tone="blue"/></div><section className="panel full-panel"><div className="table-toolbar"><div><span className="eyebrow">ACCOUNTS PAYABLE</span><h2>Recent bills</h2></div><button className="button secondary" onClick={()=>notify('Bill report exported')}><Download size={16}/> Export</button></div><div className="table-wrap"><table><thead><tr><th>Bill ID</th><th>Vendor</th><th>Description</th><th>Amount</th><th>Status</th><th /></tr></thead><tbody>{bills.map((b:any,i:number)=><tr key={b[0]}><td><strong>{b[0]}</strong></td><td>{b[1]}</td><td>{b[2]}</td><td><strong>{b[3]}</strong></td><td><button onClick={()=>{const next=b[5]==='paid'?'pending':'paid';setBillState((old:any)=>old.map((x:any)=>x[0]===b[0]?[...x,x[1],x[2],x[3],x[4],next]:x));notify(`${b[0]} marked ${next}`)}}><Status kind={b[5]}>{b[4]}</Status></button></td><td><MoreHorizontal size={16}/></td></tr>)}</tbody></table></div></section></>}
function Logistics({notify}:any){return <><div className="logistics-hero"><div><span className="eyebrow">FLEET & LOGISTICS</span><h2>Keep every site moving.</h2><p>Monitor fuel cards, vehicle assignments, and dispatch activity from one view.</p></div><button className="button primary" onClick={()=>notify('Fuel limit request opened')}><Plus size={16}/> Request fuel limit</button></div><div className="bottom-grid"><section className="panel"><div className="panel-head"><div><span className="eyebrow">FUEL CARDS</span><h2>Usage by card</h2></div><Fuel className="panel-icon" size={18}/></div><div className="card-list"><div className="fuel-card"><span className="card-chip">B</span><div><strong>BE-0042</strong><span>Site operations · Hilux</span></div><b>₦420,800</b><Status kind="active">Active</Status></div><div className="fuel-card"><span className="card-chip orange-chip">B</span><div><strong>BE-0038</strong><span>Fleet · Transit</span></div><b>₦198,400</b><Status kind="warning">Near limit</Status></div></div></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">DISPATCH BOARD</span><h2>Today’s movements</h2></div><Truck size={18} className="panel-icon"/></div><div className="dispatch"><div><span className="time">09:30</span><strong>Steel delivery</strong><span>Lekki → Project Atlas</span></div><Status kind="active">In transit</Status></div><div className="dispatch"><div><span className="time">11:00</span><strong>Equipment transfer</strong><span>Ikeja → Project Delta</span></div><Status kind="pending">Scheduled</Status></div></section></div></>}
function VehicleManagement({notify}:any){
  const [selected, setSelected] = useState<any>(null)
  const [query, setQuery] = useState('')
  const [vehiclesList, setVehiclesList] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ vehicle_number: '', vehicle_type: '', assigned_driver: '', current_mileage: '', fuel_card_number: '', fuel_balance: '' })

  useEffect(() => {
    let mounted = true
    const fetchVehicles = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('vehicles').select('*').order('id', { ascending: false })
      if (error) {
        console.error('Supabase fetch vehicles error', error)
        notify('Failed to load vehicles')
      } else if (mounted) {
        setVehiclesList(data || [])
      }
      setLoading(false)
    }
    fetchVehicles()

    const channel = supabase
      .channel('vehicles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, (payload) => {
        const type = (payload.eventType || payload.event) as string
        if (type === 'INSERT' || type === 'insert') {
          setVehiclesList((prev) => {
            if (prev.some((v) => v.id === payload.new.id)) return prev
            return [payload.new, ...prev]
          })
        } else if (type === 'UPDATE' || type === 'update') {
          setVehiclesList((prev) => prev.map((v) => (v.id === payload.new.id ? payload.new : v)))
        } else if (type === 'DELETE' || type === 'delete') {
          setVehiclesList((prev) => prev.filter((v) => v.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      mounted = false
      try { channel.unsubscribe() } catch (e) { /* ignore */ }
    }
  }, [notify])

  const filtered = vehiclesList.filter(v => `${v.vehicle_number || ''} ${v.vehicle_type || ''} ${v.assigned_driver || ''}`.toLowerCase().includes(query.toLowerCase()))

  const handleChange = (e:any) => setForm((s:any) => ({ ...s, [e.target.name]: e.target.value }))

  const handleAdd = async (e:any) => {
    e.preventDefault()
    const payload = { ...form }
    const { data, error } = await supabase.from('vehicles').insert([payload]).select().single()
    if (error) {
      console.error('Insert vehicle error', error)
      notify('Failed to add vehicle')
      return
    }
    if (data) {
      setVehiclesList((prev) => (prev.some((v) => v.id === data.id) ? prev : [data, ...prev]))
    }
    setForm({ vehicle_number: '', vehicle_type: '', assigned_driver: '', current_mileage: '', fuel_card_number: '', fuel_balance: '' })
    setShowAdd(false)
    notify('Vehicle added')
  }

  return <>
    <div className="stat-grid"><Stat title="Fleet vehicles" value={String(vehiclesList.length)} change="Live" icon={FleetCar} tone="blue"/><Stat title="Active vehicles" value="21" change="87.5% availability" icon={Gauge} tone="green"/><Stat title="Fuel balance" value="₦933,800" change="Across active cards" icon={Fuel} tone="orange"/><Stat title="Total mileage" value="842,410 km" change="+6.2% this month" icon={History} tone="purple"/></div>
    <section className="panel full-panel"><div className="table-toolbar"><div><span className="eyebrow">FLEET REGISTER</span><h2>Vehicle management</h2></div><div className="heading-actions"><label className="table-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search fleet..."/></label><button className="button primary" onClick={()=>setShowAdd(true)}><Plus size={16}/> Add vehicle</button></div></div>

    {showAdd && <div className="panel" style={{margin:'12px 16px'}}><form onSubmit={handleAdd} className="vehicle-form"><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        <label>Vehicle number<input name="vehicle_number" value={form.vehicle_number} onChange={handleChange} required/></label>
        <label>Type<input name="vehicle_type" value={form.vehicle_type} onChange={handleChange} required/></label>
        <label>Assigned driver<input name="assigned_driver" value={form.assigned_driver} onChange={handleChange} /></label>
        <label>Odometer<input name="current_mileage" value={form.current_mileage} onChange={handleChange} /></label>
        <label>Fuel card<input name="fuel_card_number" value={form.fuel_card_number} onChange={handleChange} /></label>
        <label>Fuel balance<input name="fuel_balance" value={form.fuel_balance} onChange={handleChange} /></label>
      </div>
      <div style={{display:'flex',gap:8,marginTop:12}}><button className="button secondary" type="button" onClick={()=>setShowAdd(false)}>Cancel</button><button className="button primary" type="submit">Save vehicle</button></div></form></div>}

    <div className="table-wrap"><table><thead><tr><th>Vehicle number</th><th>Type</th><th>Assigned driver</th><th>Odometer</th><th>Fuel card</th><th>Fuel balance</th><th>Status</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={8}>Loading…</td></tr> : filtered.map((v:any) => {
      const statusTone = v.status?.toLowerCase() === 'near limit' ? 'warning' : (v.status?.toLowerCase() === 'active' ? 'active' : 'pending')
      return <tr key={v.id} onClick={()=>setSelected(v)} className="clickable-row"><td><div className="vehicle-name"><span className="vehicle-icon"><FleetCar size={16}/></span><strong>{v.vehicle_number}</strong></div></td><td>{v.vehicle_type}</td><td>{v.assigned_driver || 'Unassigned'}</td><td>{v.current_mileage || '—'}</td><td><span className="mono">{v.fuel_card_number || '—'}</span></td><td><strong>{v.fuel_balance || '₦0'}</strong></td><td><Status kind={statusTone}>{v.status || 'In service'}</Status></td><td><button className="icon-button" aria-label={`View ${v.vehicle_number}`}><Eye size={16}/></button></td></tr>
    })}</tbody></table></div></section>
    {selected && <VehicleModal vehicle={selected} onClose={()=>setSelected(null)} />}
  </>
}
function VehicleModal({vehicle,onClose}:any){return <div className="modal-backdrop" onClick={onClose}><div className="vehicle-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">VEHICLE PROFILE</span><h2>{vehicle.number}</h2><p>{vehicle.type} · {vehicle.driver}</p></div><button className="icon-button" onClick={onClose} aria-label="Close vehicle details"><X size={18}/></button></div><div className="vehicle-summary"><div><span>Odometer</span><strong>{vehicle.odo}</strong></div><div><span>Fuel card</span><strong>{vehicle.card}</strong></div><div><span>Balance</span><strong>{vehicle.balance}</strong></div></div><div className="modal-section"><div className="panel-head"><div><span className="eyebrow">MILEAGE TREND</span><h3>Running chart history</h3></div><span className="period">Last 6 months</span></div><div className="running-chart"><div className="chart-bars"><i style={{height:'35%'}}/><i style={{height:'48%'}}/><i style={{height:'42%'}}/><i style={{height:'67%'}}/><i style={{height:'76%'}}/><i style={{height:'92%'}}/></div><div className="x-labels"><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span></div></div></div><div className="modal-section"><div className="panel-head"><div><span className="eyebrow">FUEL ACTIVITY</span><h3>Recent consumption logs</h3></div><Fuel size={17} className="panel-icon"/></div><div className="fuel-log"><span>Aug 28 · 08:14</span><strong>120 L</strong><em>₦86,400 · Chevron Lekki</em></div><div className="fuel-log"><span>Aug 25 · 16:02</span><strong>85 L</strong><em>₦61,200 · Total Ikeja</em></div><div className="fuel-log"><span>Aug 21 · 09:43</span><strong>140 L</strong><em>₦100,800 · Mobil Victoria Island</em></div></div><div className="modal-actions"><button className="button secondary" onClick={onClose}>Close</button><button className="button primary" onClick={()=>onClose()}><Pencil size={15}/> Edit vehicle</button></div></div></div>}

function AdminPanel({notify}:any){const [saved,setSaved]=useState(false); return <><div className="admin-banner"><div className="admin-shield"><ShieldCheck size={22}/></div><div><span className="eyebrow">AUTHORIZED ACCESS · ADMINISTRATOR</span><h2>Company management center</h2><p>Manage access, monitor sensitive activity, and configure Browns workspace defaults.</p></div><Status kind="active">Protected</Status></div><div className="admin-grid"><section className="panel"><div className="panel-head"><div><span className="eyebrow">ACCESS CONTROL</span><h2>User role management</h2></div><UserCog size={18} className="panel-icon"/></div><div className="role-list">{[['Kemi Ojo','Administrator','KO'],['Aisha Bello','Site Manager','AB'],['Daniel Okafor','Accountant','DO'],['Grace Mensah','Quantity Surveyor','GM']].map(([name,role,initials])=><div className="role-row" key={name}><span className="avatar small">{initials}</span><div><strong>{name}</strong><span>{role}</span></div><select defaultValue={role} onChange={()=>notify(`${name}'s role updated`)}><option>Administrator</option><option>Site Manager</option><option>Accountant</option><option>Employee</option></select></div>)}</div></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">COMPANY DEFAULTS</span><h2>Global settings</h2></div><SlidersHorizontal size={18} className="panel-icon"/></div><div className="settings-form"><label>Default fuel rate<input defaultValue="₦720 / litre"/></label><label>Attendance cutoff time<input type="time" defaultValue="08:00"/></label><label>Monthly fleet fuel limit<input defaultValue="₦6,000,000"/></label><button className="button primary" onClick={()=>{setSaved(true);notify('Global settings saved')}}><Save size={15}/> {saved?'Settings saved':'Save settings'}</button></div></section></div><section className="panel full-panel"><div className="panel-head"><div><span className="eyebrow">AUDIT TRAIL · LIVE</span><h2>System activity logs</h2></div><ScrollText size={18} className="panel-icon"/></div><div className="log-list"><div><span className="log-time">2 min ago</span><div className="log-icon orange"><Pencil size={14}/></div><p><strong>Daniel Okafor</strong> updated bill <b>INV-2841</b><small>Amount changed to ₦2,480,000</small></p></div><div><span className="log-time">18 min ago</span><div className="log-icon blue"><Fuel size={14}/></div><p><strong>Kemi Ojo</strong> approved fuel card increase <b>BE-0042</b><small>Limit increased by ₦120,000</small></p></div><div><span className="log-time">42 min ago</span><div className="log-icon green"><UserCog size={14}/></div><p><strong>Kemi Ojo</strong> assigned role <b>Accountant</b> to Daniel Okafor<small>Access permissions updated</small></p></div></div></section></>}

function Invoices({notify}:any){const [client,setClient]=useState('Meridian Developments Ltd.'); return <section className="invoice-layout"><div className="panel invoice-form"><div className="panel-head"><div><span className="eyebrow">NEW DOCUMENT</span><h2>Client invoice</h2></div><Status kind="draft">Draft</Status></div><label>Bill to<input value={client} onChange={e=>setClient(e.target.value)}/></label><div className="field-row"><label>Invoice number<input defaultValue="BE-2026-0098"/></label><label>Due date<input defaultValue="Sep 28, 2026"/></label></div><div className="invoice-line"><div><strong>Site supervision & project management</strong><span>Project Atlas · August 2026</span></div><strong>₦4,800,000</strong></div><button className="add-line" onClick={()=>notify('Line item added')}><Plus size={15}/> Add line item</button><div className="invoice-total"><span>Subtotal</span><strong>₦4,800,000</strong><span>VAT (7.5%)</span><strong>₦360,000</strong><span className="total-label">Total due</span><strong className="total">₦5,160,000</strong></div><div className="invoice-actions"><button className="button secondary" onClick={()=>notify('PDF preview generated')}><Download size={16}/> Preview PDF</button><button className="button primary" onClick={()=>notify('Invoice sent via Gmail')}><ReceiptText size={16}/> Send via Gmail</button></div></div><div className="invoice-preview"><div className="paper"><div className="paper-top"><div className="brand-mark small-mark"><Zap size={14} fill="currentColor"/></div><span>INVOICE</span></div><div className="paper-title"><strong>BROWNS</strong><span>ENGINEERING & CONSTRUCTION</span></div><div className="paper-meta"><span>Invoice no.<b>BE-2026-0098</b></span><span>Issue date<b>Aug 28, 2026</b></span></div><div className="paper-client"><span>Bill to</span><strong>{client}</strong><small>14 Admiralty Way, Lagos</small></div><div className="paper-item"><span>DESCRIPTION</span><b>AMOUNT</b><p>Site supervision & project management<small>Project Atlas · August 2026</small></p><strong>₦4,800,000</strong></div><div className="paper-bottom"><span>Total due</span><strong>₦5,160,000</strong></div><small className="paper-note">Thank you for your business. Payment is due within 30 days.</small></div></div></section>}
