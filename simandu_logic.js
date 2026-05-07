//<![CDATA[
    // ==========================================
    // 1. CONFIG FIREBASE
    // ==========================================
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

    // --- DATA DEFAULT ---
    const todayDemo = new Date().toISOString().split('T')[0];
    const defaultTeacherData = { classes: [], students: [], schedules: [], materials: [], jurnalMengajar: [], journals: [], adminDocs: [], attendance: {}, grades: {}, gradeColumns: [], activities: [] };

    // --- COMPONENTS UI ---
    const Input = ({ label, ...props }) => ( <div className={props.className}>{label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">{label}</label>}<input className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 font-bold outline-none focus:border-indigo-500 text-sm shadow-sm" {...props} /></div> );
    const Select = ({ label, options, ...props }) => ( <div className={props.className}>{label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">{label}</label>}<select className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 font-bold outline-none focus:border-indigo-500 text-sm shadow-sm" {...props}>{options.map((o, i) => <option key={i} value={o.value}>{o.label}</option>)}</select></div> );
    const Textarea = ({ label, ...props }) => ( <div className={props.className}>{label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">{label}</label>}<textarea className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 font-bold outline-none focus:border-indigo-500 text-sm shadow-sm" {...props}></textarea></div> );

    const FormModal = ({ show, onClose, title, onSubmit, children, submitText="Simpan" }) => {
        if(!show) return null;
        return ( <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"><div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 flex flex-col"><h3 className="text-xl font-black mb-6 text-slate-800">{title}</h3><form onSubmit={onSubmit} className="space-y-4">{children}<div className="flex gap-3 pt-4 border-t border-slate-100 mt-2"><button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 rounded-2xl font-bold text-slate-700">Batal</button><button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold">{submitText}</button></div></form></div></div> )
    };

    // --- MAIN APP ---
    const App = () => {
        const [globalDb, setGlobalDb] = useState(null);
        const [isLoggedIn, setIsLoggedIn] = useState(false);
        const [activeUser, setActiveUser] = useState(null);
        const [activeMenu, setActiveMenu] = useState('dashboard');
        const [adminViewingTeacherId, setAdminViewingTeacherId] = useState(''); // Empty = Global Access
        const [loading, setLoading] = useState(true);
        const [isSyncing, setIsSyncing] = useState(false);

        useEffect(() => {
            const unsub = db.collection('simandu_db').doc('main_data').onSnapshot(doc => {
                if (doc.exists) setGlobalDb(doc.data());
                setLoading(false);
            }, err => { alert("Error Database: " + err.message); setLoading(false); });
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

        // --- DATA AGGREGATION (GLOBAL ACCESS LOGIC) ---
        const targetId = activeUser?.role === 'admin' ? adminViewingTeacherId : activeUser?.id;
        
        let currentClasses = []; let currentStudents = []; let currentJurnal = [];
        
        if (targetId) {
            // Jika memilih guru spesifik
            const td = globalDb.teacherData[targetId] || defaultTeacherData;
            currentClasses = td.classes; currentStudents = td.students; currentJurnal = td.jurnalMengajar || [];
        } else {
            // AKSES GLOBAL UNTUK ADMIN
            Object.entries(globalDb.teacherData).forEach(([tId, tData]) => {
                currentClasses = [...currentClasses, ...tData.classes.map(c => ({...c, teacherId: tId}))];
                currentStudents = [...currentStudents, ...tData.students.map(s => ({...s, teacherId: tId}))];
                currentJurnal = [...currentJurnal, ...(tData.jurnalMengajar || []).map(j => ({...j, teacherId: tId}))];
            });
        }

        const curTData = { classes: currentClasses, students: currentStudents, jurnalMengajar: currentJurnal };

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
                <TopAppBar title={activeMenu.replace('-',' ').toUpperCase()} isSyncing={isSyncing} onBack={()=>setActiveMenu(activeUser.role==='admin'?'admin-dashboard':'dashboard')} hideBack={activeMenu.includes('dashboard')} />

                {activeMenu === 'admin-dashboard' && (
                    <div className="pb-24 animate-in fade-in">
                        <div className="bg-slate-900 p-8 rounded-b-[40px] text-white shadow-lg text-center"><Shield className="mx-auto mb-3 text-amber-400" size={32}/><h1 className="text-2xl font-black tracking-widest uppercase">Admin Panel</h1><div className="bg-white/10 p-4 rounded-2xl border mt-6"><p className="text-xs text-slate-300">Madrasah Aktif</p><h2 className="text-lg font-black">{globalDb.adminSettings.namaMadrasah}</h2></div></div>
                        <div className="p-6 space-y-4">
                            <button onClick={()=>setActiveMenu('jurnal-mengajar')} className="w-full bg-white p-5 rounded-3xl border shadow-sm flex items-center gap-4 group"><div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all"><ClipboardList/></div><div className="text-left"><h4 className="font-bold">Semua Jurnal Guru</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Akses Global Real-time</p></div></button>
                            <button onClick={()=>setActiveMenu('admin-guru')} className="w-full bg-white p-5 rounded-3xl border shadow-sm flex items-center gap-4 group"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all"><Users/></div><div className="text-left"><h4 className="font-bold">Kelola Akun Guru</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tambah & Monitor Sandi</p></div></button>
                            <button onClick={()=>setActiveMenu('admin-madrasah')} className="w-full bg-white p-5 rounded-3xl border shadow-sm flex items-center gap-4 group"><div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all"><Building/></div><div className="text-left"><h4 className="font-bold">Setelan Madrasah</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Identitas & Broadcast</p></div></button>
                        </div>
                    </div>
                )}

                {activeMenu === 'dashboard' && (
                    <div className="pb-24 animate-in fade-in">
                        <div className="bg-indigo-600 p-8 rounded-b-[40px] text-white shadow-lg"><div className="flex justify-between items-center mb-8"><h1 className="text-2xl font-black">SIMANDU</h1><Settings size={24}/></div><div className="flex items-center gap-4"><div className="w-16 h-16 rounded-full border-2 bg-white/20 flex items-center justify-center font-black text-2xl shadow-inner">{activeUser.name[0]}</div><div><p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Selamat Datang,</p><h2 className="text-xl font-black">{activeUser.name}</h2><p className="text-xs opacity-90">{activeUser.mapel} • {globalDb.adminSettings.namaMadrasah}</p></div></div></div>
                        <div className="p-6">
                            {globalDb.adminSettings.pesanBroadcast && <div className="mb-6 bg-amber-400 p-3 rounded-2xl text-white font-bold flex items-center gap-3 shadow-md"><Megaphone size={20} className="shrink-0 animate-pulse"/><marquee className="text-xs">{globalDb.adminSettings.pesanBroadcast}</marquee></div>}
                            <div className="grid grid-cols-3 gap-y-8 text-center mt-4">
                                {[ {id:'data-kelas', label:'Kelas', icon:Folders, color:'bg-orange-500 shadow-orange-200'}, {id:'siswa', label:'Siswa', icon:Users, color:'bg-purple-500 shadow-purple-200'}, {id:'jurnal-mengajar', label:'Jurnal', icon:ClipboardList, color:'bg-cyan-500 shadow-cyan-200'} ].map(m=>(<button key={m.id} onClick={()=>setActiveMenu(m.id)} className="flex flex-col items-center group outline-none"><div className={`${m.color} w-16 h-16 rounded-[22px] flex items-center justify-center text-white mb-2 shadow-lg group-hover:scale-110 transition-all`}><m.icon size={28}/></div><span className="text-[11px] font-bold text-slate-700">{m.label}</span></button>))}
                            </div>
                        </div>
                    </div>
                )}

                {activeMenu === 'jurnal-mengajar' && (
                    <div className="p-6 space-y-6 pb-24">
                        <AdminFilterHeader role={activeUser.role} selectedTeacherId={adminViewingTeacherId} setSelectedTeacherId={setAdminViewingTeacherId} teachers={globalDb.teachers} />
                        <div className="flex gap-2">
                            <button onClick={()=>window.print()} className="px-4 py-4 bg-slate-900 text-white rounded-2xl shadow-sm"><Printer size={20}/></button>
                            <button className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold">+ Jurnal Baru</button>
                        </div>
                        <div className="space-y-4">
                            {curTData.jurnalMengajar.length === 0 && <p className="text-center py-10 text-slate-400 font-bold italic">Belum ada data jurnal ditemukan.</p>}
                            {curTData.jurnalMengajar.map(j=>(
                                <div key={j.id} className="bg-white p-5 rounded-3xl border shadow-sm relative overflow-hidden group">
                                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-50 rounded-full blur-xl group-hover:bg-indigo-100 transition-all"></div>
                                    <div className="relative z-10 flex justify-between items-center mb-4"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{formatTanggalIndo(j.date)}</span><button className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button></div>
                                    <h4 className="font-bold text-lg text-slate-800 leading-tight mb-1">{j.subject}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kls {curTData.classes.find(c=>c.id===j.classId)?.name} • Pertemuan {j.pertemuan}</p>
                                    <div className="mt-4 bg-slate-50 p-4 rounded-2xl text-xs font-bold text-slate-600 border border-slate-100"><p className="mb-2">Topik: <span className="text-indigo-600">{j.topic}</span></p><p>Hadir: {j.hadir} • Absen: {j.tidakHadir}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="fixed bottom-0 left-0 right-0 bg-white border-t rounded-t-[32px] p-4 flex justify-between items-center max-w-md mx-auto print:hidden shadow-2xl z-40">
                    <button onClick={()=>setActiveMenu(activeUser.role==='admin'?'admin-dashboard':'dashboard')} className={`flex-1 flex flex-col items-center font-black text-[10px] ${activeMenu.includes('dashboard')?'text-indigo-600':'text-slate-300'}`}><Home size={24} className="mb-1"/>HOME</button>
                    <button onClick={()=>{ if(confirm('Keluar?')){ setIsLoggedIn(false); setActiveUser(null); setActiveMenu('dashboard'); } }} className="flex-1 flex flex-col items-center font-black text-slate-300 text-[10px] hover:text-rose-500"><LogOut size={24} className="mb-1"/>KELUAR</button>
                </div>
            </div>
        );
    };

    const root = createRoot(document.getElementById('root'));
    root.render(<App />);
//]]>