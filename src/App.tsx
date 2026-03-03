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
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  class: string;
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
  created_at: string;
  first_name: string;
  last_name: string;
  class: string;
  hebrew_year: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add_student' | 'record_collection'>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form states
  const [studentForm, setStudentForm] = useState({ id: '', first_name: '', last_name: '', phone: '', class: '' });
  const [collectionForm, setCollectionForm] = useState({ student_id: '', year_id: '', amount: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, yearsRes, collectionsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/years'),
        fetch('/api/collections')
      ]);
      
      const [studentsData, yearsData, collectionsData] = await Promise.all([
        studentsRes.json(),
        yearsRes.json(),
        collectionsRes.json()
      ]);

      setStudents(studentsData);
      setYears(yearsData);
      setCollections(collectionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
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
        body: JSON.stringify(studentForm)
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'התלמיד נוסף בהצלחה' });
        setStudentForm({ id: '', first_name: '', last_name: '', phone: '', class: '' });
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
          amount: parseFloat(collectionForm.amount)
        })
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'הגבייה נרשמה בהצלחה' });
        setCollectionForm({ student_id: '', year_id: '', amount: '' });
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

  const filteredCollections = useMemo(() => {
    return collections.filter(c => 
      `${c.first_name} ${c.last_name}`.includes(searchQuery) || 
      c.student_id.includes(searchQuery) ||
      c.class.includes(searchQuery) ||
      c.hebrew_year.includes(searchQuery)
    );
  }, [collections, searchQuery]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      `${s.first_name} ${s.last_name}`.includes(searchQuery) || 
      s.id.includes(searchQuery)
    );
  }, [students, searchQuery]);

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
                      placeholder="חיפוש לפי שם, ת.ז, כיתה או שנה..."
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
                          <th className="px-6 py-4 text-sm font-semibold text-slate-600">שנה עברית</th>
                          <th className="px-6 py-4 text-sm font-semibold text-slate-600">סכום</th>
                          <th className="px-6 py-4 text-sm font-semibold text-slate-600">תאריך רישום</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCollections.length > 0 ? (
                          filteredCollections.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-800">{c.first_name} {c.last_name}</td>
                              <td className="px-6 py-4 text-slate-500 font-mono text-sm">{c.student_id}</td>
                              <td className="px-6 py-4 text-slate-600">{c.class}</td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                  {c.hebrew_year}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-900">₪{c.amount.toLocaleString()}</td>
                              <td className="px-6 py-4 text-slate-400 text-sm">
                                {new Date(c.created_at).toLocaleDateString('he-IL')}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                              לא נמצאו רשומות גבייה
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
                      <FormField 
                        label="שיעור (כיתה)" 
                        required
                        value={studentForm.class}
                        onChange={(val) => setStudentForm({...studentForm, class: val})}
                        placeholder="לדוגמה: שיעור א'"
                      />
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
                          <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.class})</option>
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
