import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  PlusCircle, 
  History, 
  Search, 
  Coins, 
  UserPlus,
  Filter,
  ArrowRightLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings,
  Trash2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  class_id: number;
  class_name?: string;
}

interface Class {
  id: number;
  name: string;
}

interface ColorThreshold {
  id: number;
  min_amount: number;
  color: string;
}

interface Year {
  id: number;
  hebrew_year: string;
}

interface Collection {
  id: number;
  student_id: string;
  year_id: number;
  amount: number;
  effort: boolean;
  created_at: string;
  first_name: string;
  last_name: string;
  class_id: number;
  class_name: string;
  hebrew_year: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add_student' | 'record_collection' | 'settings'>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [colorThresholds, setColorThresholds] = useState<ColorThreshold[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form states
  const [studentForm, setStudentForm] = useState({ id: '', first_name: '', last_name: '', phone: '', class_id: '' });
  const [collectionForm, setCollectionForm] = useState({ student_id: '', year_id: '', amount: '', effort: false });
  const [yearForm, setYearForm] = useState({ hebrew_year: '' });
  const [classForm, setClassForm] = useState({ name: '' });
  const [thresholdForm, setThresholdForm] = useState({ min_amount: '', color: '#4f46e5' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, yearsRes, collectionsRes, classesRes, thresholdsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/years'),
        fetch('/api/collections'),
        fetch('/api/classes'),
        fetch('/api/color-thresholds')
      ]);
      
      const [studentsData, yearsData, collectionsData, classesData, thresholdsData] = await Promise.all([
        studentsRes.json(),
        yearsRes.json(),
        collectionsRes.json(),
        classesRes.json(),
        thresholdsRes.json()
      ]);

      if (Array.isArray(studentsData)) setStudents(studentsData);
      if (Array.isArray(yearsData)) setYears(yearsData);
      if (Array.isArray(collectionsData)) setCollections(collectionsData);
      if (Array.isArray(classesData)) setClasses(classesData);
      if (Array.isArray(thresholdsData)) setColorThresholds(thresholdsData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setStatus({ type: 'error', message: 'שגיאה בטעינת נתונים מהשרת' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...studentForm,
          class_id: parseInt(studentForm.class_id)
        })
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'התלמיד נוסף בהצלחה' });
        setStudentForm({ id: '', first_name: '', last_name: '', phone: '', class_id: '' });
        fetchData();
        setTimeout(() => setStatus(null), 3000);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.error || 'שגיאה בהוספת התלמיד' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'שגיאה בתקשורת עם השרת' });
    }
  };

  const handleRecordCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...collectionForm,
          amount: parseFloat(collectionForm.amount),
          year_id: parseInt(collectionForm.year_id)
        })
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'הגבייה נרשמה בהצלחה' });
        setCollectionForm({ student_id: '', year_id: '', amount: '', effort: false });
        fetchData();
        setTimeout(() => setStatus(null), 3000);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.error || 'שגיאה ברישום הגבייה' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'שגיאה בתקשורת עם השרת' });
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classForm)
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'השיעור נוסף בהצלחה' });
        setClassForm({ name: '' });
        fetchData();
        setTimeout(() => setStatus(null), 3000);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.error || 'שגיאה בהוספת השיעור' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'שגיאה בתקשורת עם השרת' });
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק שיעור זה?')) return;
    try {
      const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStatus({ type: 'success', message: 'השיעור נמחק בהצלחה' });
        fetchData();
        setTimeout(() => setStatus(null), 3000);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.error || 'שגיאה במחיקת השיעור' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'שגיאה בתקשורת עם השרת' });
    }
  };

  const handleAddThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/color-thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...thresholdForm,
          min_amount: parseFloat(thresholdForm.min_amount)
        })
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'הגדרת הצבע נוספה בהצלחה' });
        setThresholdForm({ min_amount: '', color: '#4f46e5' });
        fetchData();
        setTimeout(() => setStatus(null), 3000);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.error || 'שגיאה בהוספת הגדרת הצבע' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'שגיאה בתקשורת עם השרת' });
    }
  };

  const handleDeleteThreshold = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק הגדרת צבע זו?')) return;
    try {
      const res = await fetch(`/api/color-thresholds/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStatus({ type: 'success', message: 'הגדרת הצבע נמחקה בהצלחה' });
        fetchData();
        setTimeout(() => setStatus(null), 3000);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.error || 'שגיאה במחיקת הגדרת הצבע' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'שגיאה בתקשורת עם השרת' });
    }
  };

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yearForm)
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'השנה נוספה בהצלחה' });
        setYearForm({ hebrew_year: '' });
        fetchData();
        setTimeout(() => setStatus(null), 3000);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.error || 'שגיאה בהוספת השנה' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'שגיאה בתקשורת עם השרת' });
    }
  };

  const handleDeleteYear = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק שנה זו?')) return;
    try {
      const res = await fetch(`/api/years/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStatus({ type: 'success', message: 'השנה נמחקה בהצלחה' });
        fetchData();
        setTimeout(() => setStatus(null), 3000);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.error || 'שגיאה במחיקת השנה' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'שגיאה בתקשורת עם השרת' });
    }
  };

  const dashboardData = useMemo(() => {
    const studentMap = new Map<string, { student: Student, years: Collection[] }>();
    
    students.forEach(s => {
      studentMap.set(s.id, { student: s, years: [] });
    });

    collections.forEach(c => {
      const entry = studentMap.get(c.student_id);
      if (entry) {
        entry.years.push(c);
      }
    });

    const rows = Array.from(studentMap.values()).filter(row => 
      `${row.student.first_name} ${row.student.last_name}`.includes(searchQuery) || 
      row.student.id.includes(searchQuery) ||
      (row.student.class_name || '').includes(searchQuery)
    );

    let maxYears = 0;
    rows.forEach(row => {
      maxYears = Math.max(maxYears, row.years.length);
    });

    return { rows, maxYears };
  }, [students, collections, searchQuery]);

  const getAmountColor = (amount: number) => {
    const sortedThresholds = [...colorThresholds].sort((a, b) => b.min_amount - a.min_amount);
    const threshold = sortedThresholds.find(t => amount >= t.min_amount);
    return threshold ? threshold.color : 'inherit';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Coins className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">מערכת גביית פורים</h1>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <TabButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
              icon={<History className="w-4 h-4" />}
              label="לוח בקרה"
            />
            <TabButton 
              active={activeTab === 'add_student'} 
              onClick={() => setActiveTab('add_student')}
              icon={<UserPlus className="w-4 h-4" />}
              label="הוספת תלמיד"
            />
            <TabButton 
              active={activeTab === 'record_collection'} 
              onClick={() => setActiveTab('record_collection')}
              icon={<PlusCircle className="w-4 h-4" />}
              label="רישום גבייה"
            />
            <TabButton 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')}
              icon={<Settings className="w-4 h-4" />}
              label="הגדרות"
            />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {status && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
              }`}
            >
              {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{status.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium">טוען נתונים...</p>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-slate-800">סיכום גביות</h2>
                  <div className="relative max-w-md w-full">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="חיפוש לפי שם, ת.ז או שיעור..."
                      className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-sm font-semibold text-slate-600">תלמיד</th>
                          <th className="px-6 py-4 text-sm font-semibold text-slate-600">ת.ז</th>
                          <th className="px-6 py-4 text-sm font-semibold text-slate-600">שיעור</th>
                          {Array.from({ length: dashboardData.maxYears }).map((_, i) => (
                            <th key={i} className="px-6 py-4 text-sm font-semibold text-slate-600">שנה {i + 1}</th>
                          ))}
                          <th className="px-6 py-4 text-sm font-semibold text-slate-600">סה"כ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dashboardData.rows.length > 0 ? (
                          dashboardData.rows.map((row) => {
                            const total = row.years.reduce((sum, y) => sum + y.amount, 0);
                            return (
                              <tr key={row.student.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">{row.student.first_name} {row.student.last_name}</td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-sm">{row.student.id}</td>
                                <td className="px-6 py-4 text-slate-600">{row.student.class_name || '-'}</td>
                                {Array.from({ length: dashboardData.maxYears }).map((_, i) => {
                                  const col = row.years[i];
                                  if (!col) return <td key={i} className="px-6 py-4 text-slate-300">-</td>;
                                  return (
                                    <td key={i} className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400">({col.hebrew_year})</span>
                                        <span 
                                          className="font-bold"
                                          style={{ color: col.effort ? '#10b981' : '#f43f5e' }}
                                        >
                                          ₪{col.amount.toLocaleString()}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                })}
                                <td className="px-6 py-4">
                                  <span 
                                    className="font-black text-lg"
                                    style={{ color: getAmountColor(total) }}
                                  >
                                    ₪{total.toLocaleString()}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={dashboardData.maxYears + 4} className="px-6 py-12 text-center text-slate-400 italic">
                              לא נמצאו רשומות
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'add_student' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <UserPlus className="text-indigo-600 w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">הוספת תלמיד חדש</h2>
                  </div>
                  
                  <form onSubmit={handleAddStudent} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField 
                        label="ת.ז" 
                        required
                        value={studentForm.id}
                        onChange={(val) => setStudentForm({...studentForm, id: val})}
                        placeholder="9 ספרות"
                      />
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">שיעור (כיתה)</label>
                        <select 
                          required
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none"
                          value={studentForm.class_id}
                          onChange={(e) => setStudentForm({...studentForm, class_id: e.target.value})}
                        >
                          <option value="">בחר שיעור מהרשימה...</option>
                          {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <FormField 
                        label="שם פרטי" 
                        required
                        value={studentForm.first_name}
                        onChange={(val) => setStudentForm({...studentForm, first_name: val})}
                      />
                      <FormField 
                        label="שם משפחה" 
                        required
                        value={studentForm.last_name}
                        onChange={(val) => setStudentForm({...studentForm, last_name: val})}
                      />
                      <div className="md:col-span-2">
                        <FormField 
                          label="טלפון" 
                          value={studentForm.phone}
                          onChange={(val) => setStudentForm({...studentForm, phone: val})}
                          placeholder="05X-XXXXXXX"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      הוסף תלמיד למערכת
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'record_collection' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <PlusCircle className="text-indigo-600 w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">רישום גבייה חדשה</h2>
                  </div>

                  <form onSubmit={handleRecordCollection} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">בחר תלמיד</label>
                      <select 
                        required
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none"
                        value={collectionForm.student_id}
                        onChange={(e) => setCollectionForm({...collectionForm, student_id: e.target.value})}
                      >
                        <option value="">בחר תלמיד מהרשימה...</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.class_name})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">שנה עברית</label>
                        <select 
                          required
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none"
                          value={collectionForm.year_id}
                          onChange={(e) => setCollectionForm({...collectionForm, year_id: e.target.value})}
                        >
                          <option value="">בחר שנה...</option>
                          {years.map(y => (
                            <option key={y.id} value={y.id}>{y.hebrew_year}</option>
                          ))}
                        </select>
                      </div>
                      <FormField 
                        label="סכום (₪)" 
                        type="number"
                        required
                        value={collectionForm.amount}
                        onChange={(val) => setCollectionForm({...collectionForm, amount: val})}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <input 
                        type="checkbox" 
                        id="effort"
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={collectionForm.effort}
                        onChange={(e) => setCollectionForm({...collectionForm, effort: e.target.checked})}
                      />
                      <label htmlFor="effort" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                        האם התאמץ השנה? (ירוק = כן, אדום = לא)
                      </label>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      בצע רישום גבייה
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Hebrew Years Management */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <Calendar className="text-indigo-600 w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">ניהול שנים עבריות</h2>
                  </div>

                  <form onSubmit={handleAddYear} className="flex gap-4 mb-8">
                    <div className="flex-1">
                      <input 
                        type="text"
                        required
                        placeholder="הכנס שנה עברית (לדוגמה: תשפ״ה)"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={yearForm.hebrew_year}
                        onChange={(e) => setYearForm({ hebrew_year: e.target.value })}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      הוסף שנה
                    </button>
                  </form>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {years.map(y => (
                      <div key={y.id} className="group relative bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:border-indigo-300 transition-all">
                        <span className="font-bold text-slate-700">{y.hebrew_year}</span>
                        <button 
                          onClick={() => handleDeleteYear(y.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          title="מחק שנה"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Classes Management */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <ArrowRightLeft className="text-indigo-600 w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">ניהול שיעורים</h2>
                  </div>

                  <form onSubmit={handleAddClass} className="flex gap-4 mb-8">
                    <div className="flex-1">
                      <input 
                        type="text"
                        required
                        placeholder="שם השיעור (לדוגמה: שיעור א')"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={classForm.name}
                        onChange={(e) => setClassForm({ name: e.target.value })}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      הוסף שיעור
                    </button>
                  </form>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {classes.map(c => (
                      <div key={c.id} className="group relative bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:border-indigo-300 transition-all">
                        <span className="font-bold text-slate-700">{c.name}</span>
                        <button 
                          onClick={() => handleDeleteClass(c.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          title="מחק שיעור"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Color Thresholds Management */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <Filter className="text-indigo-600 w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">הגדרות צבע לפי סכום (סה"כ)</h2>
                  </div>

                  <form onSubmit={handleAddThreshold} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <input 
                      type="number"
                      required
                      placeholder="סכום מינימלי"
                      className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={thresholdForm.min_amount}
                      onChange={(e) => setThresholdForm({ ...thresholdForm, min_amount: e.target.value })}
                    />
                    <div className="flex items-center gap-2">
                      <input 
                        type="color"
                        className="w-full h-12 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer"
                        value={thresholdForm.color}
                        onChange={(e) => setThresholdForm({ ...thresholdForm, color: e.target.value })}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      הוסף הגדרה
                    </button>
                  </form>

                  <div className="space-y-3">
                    {colorThresholds.map(t => (
                      <div key={t.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: t.color }}></div>
                          <span className="font-bold text-slate-700">מעל ₪{t.min_amount.toLocaleString()}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteThreshold(t.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 flex justify-around items-center z-10">
        <MobileNavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          icon={<History className="w-6 h-6" />}
          label="סיכום"
        />
        <MobileNavButton 
          active={activeTab === 'add_student'} 
          onClick={() => setActiveTab('add_student')} 
          icon={<UserPlus className="w-6 h-6" />}
          label="תלמיד"
        />
        <MobileNavButton 
          active={activeTab === 'record_collection'} 
          onClick={() => setActiveTab('record_collection')} 
          icon={<PlusCircle className="w-6 h-6" />}
          label="גבייה"
        />
        <MobileNavButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
          icon={<Settings className="w-6 h-6" />}
          label="הגדרות"
        />
      </nav>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
        active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileNavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${
        active ? 'text-indigo-600' : 'text-slate-400'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

function FormField({ label, type = "text", required = false, value, onChange, placeholder }: { 
  label: string, 
  type?: string, 
  required?: boolean, 
  value: string, 
  onChange: (val: string) => void,
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input 
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
