//<![CDATA[
    const firebaseConfig = {
        apiKey: "AIzaSyCxaOxqh6iUbyQ3kn5vWS_wybIX34T38Ac",
        authDomain: "simandu-madrasah.firebaseapp.com",
        projectId: "simandu-madrasah",
        storageBucket: "simandu-madrasah.firebasestorage.app",
        messagingSenderId: "741917778671",
        appId: "1:741917778671:web:a5c27a45cc72b07333311a"
    };
    
    if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
    const db = firebase.firestore();

    const { useState, useEffect, useRef, Fragment } = React;
    const { createRoot } = ReactDOM;
    const Lucide = window.LucideReact || {};
    const { Home, Users, Calendar, CheckSquare, FileText, Settings, BookOpen, X, Plus, Upload, Search, ChevronDown, ArrowLeft, Trash2, Pencil, CheckCircle2, Printer, LogOut, GraduationCap, FileBadge, Award, Folders, RefreshCw, Shield, UserPlus, Building, Megaphone, Database, ExternalLink, MessageSquare, Presentation, FileCode, Youtube, StickyNote, Clock, HeartHandshake, Bot, Sparkles, Lock, FileDown, UserCircle, ImagePlus, UserSearch, ClipboardList } = Lucide;

    const todayDemo = new Date().toISOString().split('T')[0];
    const defaultTeacherData = { classes: [], students: [], schedules: [], materials: [], jurnalMengajar: [], journals: [], adminDocs: [], attendance: {}, grades: {}, gradeColumns: [], activities: [] };

    // --- UI COMPONENTS ---
    const Input = ({ label, ...props }) => ( <div className={props.className}>{label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">{label}</label>}<input className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 font-bold outline-none focus:border-indigo-500 text-sm shadow-sm" {...props} /></div> );
    const Select = ({ label, options, ...props }) => ( <div className={props.className}>{label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">{label}</label>}<select className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 font-bold outline-none focus:border-indigo-500 text-sm shadow-sm" {...props}>{options.map((o, i) => <option key={i} value={o.value}>{o.label}</option>)}</select></div> );
    const Textarea = ({ label, ...props }) => ( <div className={props.className}>{label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">{label}</label>}<textarea className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 font-bold outline-none focus:border-indigo-500 text-sm shadow-sm" {...props}></textarea></div> );

    const FormModal = ({ show, onClose, title, onSubmit, children, submitText="Simpan" }) => {
        if(!show) return null;
        return ( <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"><div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 flex flex-col"><h3 className="text-xl font-black mb-6 text-slate-800">{title}</h3><form onSubmit={onSubmit} className="space-y-4">{children}<div className="flex gap-3 pt-4 border-t border-slate-100 mt-2"><button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 rounded-2xl font-bold text-slate-700">Batal</button><button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold">{submitText}</button></div></form></div></div> )
    };

    const TopAppBar = ({ title, setActiveMenu, role, isSyncing, defaultBack }) => (
      <div className="bg-white px-6 py-4 flex items-center shadow-sm sticky top-0 z-20 print:hidden justify-between">
         <div className="flex items-center"><button onClick={() => setActiveMenu(defaultBack || (role === 'admin' ? 'admin-dashboard' : 'dashboard'))} className="mr-4 p-2 hover:bg-slate-100 rounded-full transition-all outline-none"><ArrowLeft size={24} className="text-slate-700" /></button><h2 className="text-xl font-bold text-slate-800">{title}</h2></div>
         <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isSyncing ? <Fragment><RefreshCw size={14} className="animate-spin text-blue-500" /> Sinkron</Fragment> : <Fragment><Database size={14} className="text-emerald-500" /> Online</Fragment>}</div>
      </div>
    );

    const App = () => {
        const [globalDb, setGlobalDb] = useState(null);
        const [isLoggedIn, setIsLoggedIn] = useState(false);
        const [activeUser, setActiveUser] = useState(null);
        const [activeMenu, setActiveMenu] = useState('dashboard');
        const [adminViewingTeacherId, setAdminViewingTeacherId] = useState(''); // Kosong = Semua Guru
        const [loading, setLoading] = useState(true);
        const [isSyncing, setIsSyncing] = useState(false);
        const [showAddClass, setShowAddClass] = useState(false);
        const [newClass, setNewClass] = useState({ name:'', wali:'', teacherId:'' });

        useEffect(() => {
            const unsub = db.collection('simandu_db').doc('main_data').onSnapshot(doc => {
                if (doc.exists) setGlobalDb(doc.data());
                setLoading(false);
            }, err => { alert("Error: " + err.message); setLoading(false); });
            return () => unsub();
        }, []);

        const sync = async (newData) => {
            setIsSyncing(true);
            try { await db.collection('simandu_db').doc('main_data').set(newData); }
            catch (e) { alert("Gagal Simpan: " + e.message); }
            setIsSyncing(false);
        };

        if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-indigo-600">Sinkronisasi Cloud...</div>;

        const handleLogin = (code) => {
            const admin = globalDb.admins.find(a => a.password === code);
            if (admin) { setActiveUser({ role:'admin', ...admin }); setIsLoggedIn(true); setActiveMenu('admin-dashboard'); return; }
            const guru = globalDb.teachers.find(t => t.password === code);
            if (guru) { setActiveUser({ role:'guru', ...guru }); setIsLoggedIn(true); setActiveMenu('dashboard'); return; }
            alert("Kode akses salah!");
        };

        // --- GABUNGKAN DATA (ADMIN GLOBAL ACCESS) ---
        const targetId = activeUser?.role === 'admin' ? adminViewingTeacherId : activeUser?.id;
        let currentClasses = []; let currentJurnal = []; let currentStudents = [];
        
        if (targetId) {
            const td = globalDb.teacherData[targetId] || defaultTeacherData;
            currentClasses = td.classes; currentJurnal = td.jurnalMengajar || []; currentStudents = td.students || [];
        } else {
            // ADMIN MELIHAT SEMUA
            Object.entries(globalDb.teacherData).forEach(([tId, tData]) => {
                currentClasses = [...currentClasses, ...tData.classes.map(c => ({...c, teacherId: tId}))];
                currentJurnal = [...currentJurnal, ...(tData.jurnalMengajar || []).map(j => ({...j, teacherId: tId}))];
                currentStudents = [...currentStudents, ...(tData.students || []).map(s => ({...s, teacherId: tId}))];
            });
        }

        const curTData = { classes: currentClasses, jurnalMengajar: currentJurnal, students: currentStudents };

        if (!isLoggedIn) return (
            <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-6"><div className="bg-white p-10 rounded-[40px] w-full max-w-sm text-center shadow-2xl">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl mx-auto mb-6 flex items-center justify-center text-indigo-600 shadow-sm"><GraduationCap size={48}/></div>
                <h1 className="text-3xl font-black mb-1 text-slate-800">SIMANDU</h1><p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">Sistem Online Madrasah</p>
                <input type="password" onKeyDown={e=>e.key==='Enter' && handleLogin(e.target.value)} className="w-full py-4 px-6 bg-slate-100 rounded-2xl text-center text-2xl font-black mb-4 outline-none border-2 focus:border-indigo-500 shadow-inner" placeholder="••••" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Masukkan Kode Akses (321 / 123)</p>
            </div></div>
        );

        return (
            <div className="max-w-md mx-auto bg-slate-50 min-h-screen shadow-xl relative overflow-x-hidden border-x">
                <TopAppBar title={activeMenu.replace('-',' ').toUpperCase()} setActiveMenu={setActiveMenu} role={activeUser.role} isSyncing={isSyncing} />

                {activeMenu === 'admin-dashboard' && (
                    <div className="pb-24 animate-in fade-in">
                        <div className="bg-slate-900 p-8 rounded-b-[40px] text-white shadow-lg text-center"><Shield className="mx-auto mb-3 text-amber-400" size={32}/><h1 className="text-2xl font-black tracking-widest uppercase">Admin Panel</h1><div className="bg-white/10 p-4 rounded-2xl border mt-6"><p className="text-xs text-slate-300">Madrasah Aktif</p><h2 className="text-lg font-black">{globalDb.adminSettings.namaMadrasah}</h2></div></div>
                        <div className="p-6 space-y-4">
                            <button onClick={()=>setActiveMenu('jurnal-mengajar')} className="w-full bg-white p-5 rounded-3xl border shadow-sm flex items-center gap-4 group"><div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all"><ClipboardList/></div><div className="text-left"><h4 className="font-bold text-slate-800">Data Jurnal Guru</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Monitor Real-time Semua Guru</p></div></button>
                            <button onClick={()=>setActiveMenu('data-kelas')} className="w-full bg-white p-5 rounded-3xl border shadow-sm flex items-center gap-4 group"><div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all"><Folders/></div><div className="text-left"><h4 className="font-bold text-slate-800">Manajemen Kelas</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tugaskan Guru ke Kelas</p></div></button>
                            <button onClick={()=>setActiveMenu('admin-guru')} className="w-full bg-white p-5 rounded-3xl border shadow-sm flex items-center gap-4 group"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all"><Users/></div><div className="text-left"><h4 className="font-bold text-slate-800">Kelola Akun Guru</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tambah & Monitor Akun</p></div></button>
                        </div>
                    </div>
                )}

                {activeMenu === 'dashboard' && (
                    <div className="pb-24 animate-in fade-in">
                        <div className="bg-indigo-600 p-8 rounded-b-[40px] text-white shadow-lg"><div className="flex justify-between items-center mb-8"><h1 className="text-2xl font-black">SIMANDU</h1><Settings size={24}/></div><div className="flex items-center gap-4"><div className="w-16 h-16 rounded-full border-2 bg-white/20 flex items-center justify-center font-black text-2xl shadow-inner">{activeUser.name[0]}</div><div><p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Selamat Datang,</p><h2 className="text-xl font-black">{activeUser.name}</h2><p className="text-xs opacity-90">{activeUser.mapel} • {globalDb.adminSettings.namaMadrasah}</p></div></div></div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-white p-5 rounded-3xl border shadow-sm text-center"><p className="text-[10px] font-black text-slate-400">SISWA SAYA</p><h3 className="text-3xl font-black text-indigo-600">{curTData.students.length}</h3></div>
                                <div className="bg-white p-5 rounded-3xl border shadow-sm text-center"><p className="text-[10px] font-black text-slate-400">KELAS SAYA</p><h3 className="text-3xl font-black text-indigo-600">{curTData.classes.length}</h3></div>
                            </div>
                            <div className="grid grid-cols-3 gap-y-8 text-center mt-4">
                                {[ {id:'data-kelas', label:'Kelas', icon:Folders, color:'from-orange-400 to-amber-500'}, {id:'siswa', label:'Siswa', icon:Users, color:'from-purple-400 to-fuchsia-500'}, {id:'jurnal-mengajar', label:'Jurnal', icon:ClipboardList, color:'from-cyan-400 to-sky-500'} ].map(m=>(<button key={m.id} onClick={()=>setActiveMenu(m.id)} className="flex flex-col items-center group outline-none"><div className={`bg-gradient-to-br ${m.color} w-16 h-16 rounded-[22px] flex items-center justify-center text-white mb-2 shadow-lg group-hover:scale-110 transition-all`}><m.icon size={28}/></div><span className="text-[11px] font-bold text-slate-700">{m.label}</span></button>))}
                            </div>
                        </div>
                    </div>
                )}

                {activeMenu === 'data-kelas' && (
                    <div className="p-6 space-y-6 pb-24">
                        {activeUser.role === 'admin' && (
                            <div className="bg-white p-4 rounded-2xl shadow-sm border mb-4">
                                <Select label="Filter Guru Pemangku" value={adminViewingTeacherId} onChange={e=>setAdminViewingTeacherId(e.target.value)} options={[{value:'', label:'-- Semua Data Guru (Akses Global) --'}, ...globalDb.teachers.map(t=>({value:t.id, label:t.name}))]} />
                            </div>
                        )}
                        <button onClick={()=>setShowAddClass(true)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">+ Tambah & Tugaskan Kelas</button>
                        <div className="grid gap-4">
                            {curTData.classes.map((c, idx) => (
                                <div key={c.id} className={`bg-gradient-to-br ${idx%2===0?'from-blue-500 to-indigo-600':'from-emerald-400 to-teal-500'} p-6 rounded-[32px] text-white shadow-lg relative overflow-hidden`}>
                                    <h3 className="text-2xl font-black">{c.name}</h3><p className="font-bold text-xs mt-1 opacity-80">Wali: {c.wali}</p>
                                    <div className="mt-4 flex justify-between items-center"><span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase">{curTData.students.filter(s=>s.classId===c.id).length} Siswa</span><button className="p-2 bg-rose-500/80 rounded-xl"><Trash2 size={16}/></button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeMenu === 'jurnal-mengajar' && (
                    <div className="p-6 space-y-6 pb-24">
                        {activeUser.role === 'admin' && (
                            <div className="bg-white p-4 rounded-2xl shadow-sm border mb-4">
                                <Select label="Filter Guru Pengajar" value={adminViewingTeacherId} onChange={e=>setAdminViewingTeacherId(e.target.value)} options={[{value:'', label:'-- Semua Data Guru (Akses Global) --'}, ...globalDb.teachers.map(t=>({value:t.id, label:t.name}))]} />
                            </div>
                        )}
                        <div className="space-y-4">
                            {curTData.jurnalMengajar.map(j=>(
                                <div key={j.id} className="bg-white p-5 rounded-3xl border shadow-sm relative overflow-hidden group">
                                    <div className="flex justify-between items-center mb-4"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">{formatTanggalIndo(j.date)}</span></div>
                                    <h4 className="font-bold text-lg text-slate-800 leading-tight mb-1">{j.subject}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kls {curTData.classes.find(c=>c.id===j.classId)?.name} • Pertemuan {j.pertemuan}</p>
                                    <div className="mt-4 bg-slate-50 p-4 rounded-2xl text-xs font-bold text-slate-600 border border-slate-100"><p className="mb-2">Topik: <span className="text-indigo-600">{j.topic}</span></p><p>Hadir: {j.hadir} • Absen: {j.tidakHadir}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <FormModal show={showAddClass} onClose={()=>setShowAddClass(false)} title="Penugasan Guru ke Kelas" onSubmit={e=>{
                    e.preventDefault(); const tId = activeUser.role==='admin'?newClass.teacherId:activeUser.id;
                    if(!tId) return alert("Pilih guru!");
                    const nDb={...globalDb}; if(!nDb.teacherData[tId].classes) nDb.teacherData[tId].classes=[];
                    nDb.teacherData[tId].classes.push({id:'cls_'+Date.now(), name:newClass.name, wali:newClass.wali || globalDb.teachers.find(x=>x.id===tId)?.name});
                    sync(nDb); setShowAddClass(false); setNewClass({ name:'', wali:'', teacherId:'' });
                }}>
                    {activeUser.role==='admin' && <Select label="Tugaskan Ke Guru" value={newClass.teacherId} onChange={e=>setNewClass({...newClass, teacherId:e.target.value})} options={[{value:'',label:'-- Pilih Guru --'}, ...globalDb.teachers.map(t=>({value:t.id, label:t.name}))]} required/>}
                    <Input label="Nama Kelas" value={newClass.name} onChange={e=>setNewClass({...newClass, name:e.target.value})} required/>
                    <Input label="Nama Wali Kelas" value={newClass.wali} onChange={e=>setNewClass({...newClass, wali:e.target.value})} placeholder="Otomatis terisi jika kosong"/>
                </FormModal>

                <div className="fixed bottom-0 left-0 right-0 bg-white border-t rounded-t-[32px] p-4 flex justify-between items-center max-w-md mx-auto print:hidden shadow-2xl z-40">
                    <button onClick={()=>setActiveMenu(activeUser.role==='admin'?'admin-dashboard':'dashboard')} className={`flex-1 flex flex-col items-center font-black text-[10px] ${activeMenu.includes('dashboard')?'text-indigo-600':'text-slate-300'}`}><Home size={24} className="mb-1"/>HOME</button>
                    <button onClick={()=>{ setIsLoggedIn(false); setActiveUser(null); setActiveMenu('dashboard'); }} className="flex-1 flex flex-col items-center font-black text-slate-300 text-[10px] hover:text-rose-500"><LogOut size={24} className="mb-1"/>KELUAR</button>
                </div>
            </div>
        );
    };

    const root = createRoot(document.getElementById('root'));
    root.render(<App />);
//]]>
