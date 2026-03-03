import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  History, 
  Search, 
  Coins, 
  UserPlus,
  Users,
  Filter,
  ArrowRightLeft,
  Calendar,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings,
  Trash2,
  Download,
  Upload,
  Edit2,
  Moon,
  Sun,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  FileSpreadsheet,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'collections' | 'record_collection' | 'settings'>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [colorThresholds, setColorThresholds] = useState<ColorThreshold[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  
  // Sorting and Filtering
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');

  // Form states
  const [studentForm, setStudentForm] = useState({ id: '', first_name: '', last_name: '', phone: '', class_id: '' });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [collectionForm, setCollectionForm] = useState({ student_id: '', year_id: '', amount: '', effort: false });
  const [studentSearch, setStudentSearch] = useState('');
  const [yearForm, setYearForm] = useState({ hebrew_year: '' });
  const [classForm, setClassForm] = useState({ name: '' });
  const [thresholdForm, setThresholdForm] = useState({ min_amount: '', color: '#4f46e5' });

  // Import state
  const [importData, setImportData] = useState<any[] | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    fetchData(true);
  }, []);

  const fetchData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
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
      if (isInitial) setLoading(false);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingStudent,
          class_id: editingStudent.class_id
        })
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'פרטי התלמיד עודכנו בהצלחה' });
        setEditingStudent(null);
        fetchData();
        setTimeout(() => setStatus(null), 3000);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.error || 'שגיאה בעדכון התלמיד' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'שגיאה בתקשורת עם השרת' });
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק תלמיד זה?')) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStatus({ type: 'success', message: 'התלמיד נמחק בהצלחה' });
        fetchData();
        setTimeout(() => setStatus(null), 3000);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.error || 'שגיאה במחיקת התלמיד' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'שגיאה בתקשורת עם השרת' });
    }
  };

  const exportToExcel = () => {
    const dataToExport = students.map(s => {
      const studentCollections = collections.filter(c => c.student_id === s.id);
      const row: any = {
        'ת.ז': s.id,
        'שם פרטי': s.first_name,
        'שם משפחה': s.last_name,
        'טלפון': s.phone,
        'שיעור': s.class_name || '',
      };
      
      studentCollections.forEach((c, i) => {
        row[`שנה ${i + 1} (${c.hebrew_year})`] = c.amount;
        row[`מאמץ ${i + 1}`] = c.effort ? 'כן' : 'לא';
      });
      
      row['סה"כ'] = studentCollections.reduce((sum, c) => sum + c.amount, 0);
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "גביות");
    XLSX.writeFile(wb, `purim_collection_${new Date().toLocaleDateString('he-IL')}.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setImportData(data);
      setShowImportModal(true);
    };
    reader.readAsBinaryString(file);
  };

  const processImport = async () => {
    if (!importData) return;
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const row of importData) {
      const id = row[columnMapping['id']];
      const firstName = row[columnMapping['first_name']];
      const lastName = row[columnMapping['last_name']];
      const phone = row[columnMapping['phone']];
      const className = row[columnMapping['class_name']];
      const amount = row[columnMapping['amount']];
      const yearName = row[columnMapping['year']];
      const effortVal = row[columnMapping['effort']];
      
      if (!id || !firstName || !lastName) continue;

      try {
        // Find or create class
        let classId = null;
        if (className) {
          let cls = classes.find(c => c.name === className);
          if (!cls) {
            const clsRes = await fetch('/api/classes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: className })
            });
            if (clsRes.ok) {
              const allCls = await (await fetch('/api/classes')).json();
              setClasses(allCls);
              cls = allCls.find((c: any) => c.name === className);
            }
          }
          classId = cls?.id || null;
        }

        // Check if student exists
        const existing = students.find(s => s.id === String(id));
        const method = existing ? 'PUT' : 'POST';
        const url = existing ? `/api/students/${id}` : '/api/students';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: String(id),
            first_name: firstName,
            last_name: lastName,
            phone: phone || '',
            class_id: classId
          })
        });

        if (res.ok) {
          successCount++;
          
          // Handle collection if amount and year are provided
          if (amount !== undefined && yearName) {
            // Find or create year
            let year = years.find(y => y.hebrew_year === String(yearName));
            if (!year) {
              const yearRes = await fetch('/api/years', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hebrew_year: String(yearName) })
              });
              if (yearRes.ok) {
                const allYears = await (await fetch('/api/years')).json();
                setYears(allYears);
                year = allYears.find((y: any) => y.hebrew_year === String(yearName));
              }
            }

            if (year) {
              // Check if collection already exists for this student and year
              const existingCollection = collections.find(c => c.student_id === String(id) && c.year_id === year?.id);
              const collMethod = existingCollection ? 'PUT' : 'POST';
              const collUrl = existingCollection ? `/api/collections/${existingCollection.id}` : '/api/collections';
              
              await fetch(collUrl, {
                method: collMethod,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  student_id: String(id),
                  year_id: year.id,
                  amount: parseFloat(amount),
                  effort: effortVal === 'כן' || effortVal === '1' || effortVal === 1 || effortVal === true
                })
              });
            }
          }
        }
        else errorCount++;
      } catch (err) {
        errorCount++;
      }
    }

    setStatus({ 
      type: successCount > 0 ? 'success' : 'error', 
      message: `ייבוא הושלם: ${successCount} הצליחו, ${errorCount} נכשלו` 
    });
    setShowImportModal(false);
    setImportData(null);
    fetchData();
    setTimeout(() => setStatus(null), 5000);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.class_id) {
      setStatus({ type: 'error', message: 'יש לבחור שיעור' });
      return;
    }
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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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
        setStudentSearch('');
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

  const handleDeleteCollection = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק רשומת גבייה זו?')) return;
    try {
      const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStatus({ type: 'success', message: 'רשומת הגבייה נמחקה בהצלחה' });
        fetchData();
        setTimeout(() => setStatus(null), 3000);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.error || 'שגיאה במחיקת הגבייה' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'שגיאה בתקשורת עם השרת' });
    }
  };

  const handleUpdateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollection) return;
    try {
      const res = await fetch(`/api/collections/${editingCollection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(editingCollection.amount.toString()),
          effort: editingCollection.effort,
          year_id: editingCollection.year_id
        })
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'רשומת הגבייה עודכנה בהצלחה' });
        setEditingCollection(null);
        fetchData();
        setTimeout(() => setStatus(null), 3000);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.error || 'שגיאה בעדכון הגבייה' });
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
    const minAmount = parseFloat(thresholdForm.min_amount);
    if (isNaN(minAmount)) {
      setStatus({ type: 'error', message: 'יש להזין סכום תקין' });
      return;
    }
    try {
      const res = await fetch('/api/color-thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...thresholdForm,
          min_amount: minAmount
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

    let rows = Array.from(studentMap.values()).filter(row => {
      const matchesSearch = `${row.student.first_name} ${row.student.last_name}`.includes(searchQuery) || 
                            row.student.id.includes(searchQuery) ||
                            (row.student.class_name || '').includes(searchQuery);
      const matchesClass = !filterClass || String(row.student.class_id) === filterClass;
      return matchesSearch && matchesClass;
    });

    // Apply Sorting
    if (sortConfig) {
      rows.sort((a, b) => {
        let valA: any, valB: any;
        if (sortConfig.key === 'name') {
          valA = `${a.student.first_name} ${a.student.last_name}`;
          valB = `${b.student.first_name} ${b.student.last_name}`;
        } else if (sortConfig.key === 'total') {
          valA = a.years.reduce((sum, y) => sum + y.amount, 0);
          valB = b.years.reduce((sum, y) => sum + y.amount, 0);
        } else {
          valA = (a.student as any)[sortConfig.key];
          valB = (b.student as any)[sortConfig.key];
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Calculate maxYears across ALL students for a stable table structure
    let maxYears = 0;
    Array.from(studentMap.values()).forEach(row => {
      maxYears = Math.max(maxYears, row.years.length);
    });

    return { rows, maxYears };
  }, [students, collections, searchQuery, filterClass, sortConfig]);

  const getAmountColor = (amount: number) => {
    if (colorThresholds.length === 0) return darkMode ? '#e2e8f0' : '#1e293b';
    const sortedThresholds = [...colorThresholds].sort((a, b) => b.min_amount - a.min_amount);
    const threshold = sortedThresholds.find(t => amount >= t.min_amount);
    return threshold ? threshold.color : (darkMode ? '#e2e8f0' : '#1e293b');
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 ${darkMode ? 'dark' : ''}`} dir="rtl">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none">
              <Coins className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">מערכת גביית פורים</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center gap-1">
              <TabButton 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')}
                icon={<History className="w-4 h-4" />}
                label="לוח בקרה"
              />
              <TabButton 
                active={activeTab === 'students'} 
                onClick={() => setActiveTab('students')}
                icon={<Users className="w-4 h-4" />}
                label="ניהול תלמידים"
              />
              <TabButton 
                active={activeTab === 'collections'} 
                onClick={() => setActiveTab('collections')}
                icon={<History className="w-4 h-4" />}
                label="ניהול גביות"
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

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden lg:block"></div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                title={darkMode ? 'מצב יום' : 'מצב לילה'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={exportToExcel}
                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all"
                title="ייצוא לאקסל"
              >
                <Download className="w-5 h-5" />
              </button>
              <label className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all cursor-pointer" title="ייבוא מאקסל">
                <Upload className="w-5 h-5" />
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
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
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">סיכום גביות</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">ניהול ומעקב אחר גביות הפורים של כלל התלמידים</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder="חיפוש..."
                        className="w-full pr-9 pl-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <select 
                      className="w-full sm:w-40 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                    >
                      <option value="">כל השיעורים</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                          <SortHeader label="תלמיד" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                          <SortHeader label="ת.ז" sortKey="id" currentSort={sortConfig} onSort={handleSort} />
                          <SortHeader label="שיעור" sortKey="class_name" currentSort={sortConfig} onSort={handleSort} />
                          {Array.from({ length: dashboardData.maxYears }).map((_, i) => (
                            <th key={i} className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">שנה {i + 1}</th>
                          ))}
                          <SortHeader label='סה"כ' sortKey="total" currentSort={sortConfig} onSort={handleSort} />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {dashboardData.rows.length > 0 ? (
                          dashboardData.rows.map((row) => {
                            const total = row.years.reduce((sum, y) => sum + y.amount, 0);
                            return (
                              <tr key={row.student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-slate-800 dark:text-slate-200">{row.student.first_name} {row.student.last_name}</div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500">{row.student.phone}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{row.student.id}</td>
                                <td className="px-6 py-4">
                                  <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                                    {row.student.class_name || '-'}
                                  </span>
                                </td>
                                {Array.from({ length: dashboardData.maxYears }).map((_, i) => {
                                  const col = row.years[i];
                                  if (!col) return <td key={i} className="px-6 py-4 text-slate-200 dark:text-slate-800">-</td>;
                                  return (
                                    <td key={i} className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">{col.hebrew_year}</span>
                                        <span 
                                          className="font-black text-sm"
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
                                    className="font-black text-lg drop-shadow-sm"
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
                            <td colSpan={dashboardData.maxYears + 4} className="px-6 py-20 text-center">
                              <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-600">
                                <Search className="w-8 h-8 opacity-20" />
                                <p className="italic">לא נמצאו רשומות התואמות את החיפוש</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">ניהול תלמידים</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select 
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                      >
                        <option value="">כל השיעורים</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={() => setEditingStudent({ id: '', first_name: '', last_name: '', phone: '', class_id: 0 })}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      הוספת תלמיד
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">שם מלא</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ת.ז</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">שיעור</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">טלפון</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">פעולות</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {students.filter(s => {
                          const matchesSearch = `${s.first_name} ${s.last_name}`.includes(searchQuery) || s.id.includes(searchQuery);
                          const matchesClass = !filterClass || s.class_id === parseInt(filterClass);
                          return matchesSearch && matchesClass;
                        }).map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{s.first_name} {s.last_name}</td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-sm">{s.id}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{s.class_name || '-'}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{s.phone}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => {
                                    setCollectionForm({ ...collectionForm, student_id: s.id });
                                    setActiveTab('record_collection');
                                  }}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                  title="הוסף גבייה"
                                >
                                  <PlusCircle className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setEditingStudent(s)}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                  title="ערוך"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteStudent(s.id)}
                                  className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                  title="מחק"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'collections' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">ניהול גביות</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select 
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                      >
                        <option value="">כל השנים</option>
                        {years.map(y => (
                          <option key={y.id} value={y.id}>{y.hebrew_year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select 
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                      >
                        <option value="">כל השיעורים</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">תלמיד</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">שנה</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">סכום</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">מאמץ</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">פעולות</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {collections.filter(c => {
                          const matchesSearch = `${c.first_name} ${c.last_name}`.includes(searchQuery) || c.hebrew_year.includes(searchQuery);
                          const matchesYear = !filterYear || c.year_id === parseInt(filterYear);
                          const matchesClass = !filterClass || c.class_id === parseInt(filterClass);
                          return matchesSearch && matchesYear && matchesClass;
                        }).map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{c.first_name} {c.last_name}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.hebrew_year}</td>
                            <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">₪{c.amount.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                c.effort ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                              }`}>
                                {c.effort ? 'התאמץ' : 'לא התאמץ'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => setEditingCollection(c)}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                  title="ערוך"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteCollection(c.id)}
                                  className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                  title="מחק"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'record_collection' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <PlusCircle className="text-indigo-600 w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">רישום גבייה חדשה</h2>
                  </div>

                  <form onSubmit={handleRecordCollection} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">חפש ובחר תלמיד</label>
                      <div className="relative mb-2">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="חפש לפי שם או ת.ז..."
                          className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                        />
                      </div>
                      <select 
                        required
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none text-slate-800 dark:text-slate-200"
                        value={collectionForm.student_id}
                        onChange={(e) => setCollectionForm({...collectionForm, student_id: e.target.value})}
                      >
                        <option value="">בחר תלמיד מהרשימה...</option>
                        {students
                          .filter(s => 
                            `${s.first_name} ${s.last_name}`.includes(studentSearch) || 
                            s.id.includes(studentSearch)
                          )
                          .map(s => (
                            <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.class_name}) - {s.id}</option>
                          ))
                        }
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

                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <input 
                        type="checkbox" 
                        id="effort"
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={collectionForm.effort}
                        onChange={(e) => setCollectionForm({...collectionForm, effort: e.target.checked})}
                      />
                      <label htmlFor="effort" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
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
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                      <Calendar className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">ניהול שנים עבריות</h2>
                  </div>

                  <form onSubmit={handleAddYear} className="flex gap-4 mb-8">
                    <div className="flex-1">
                      <input 
                        type="text"
                        required
                        placeholder="הכנס שנה עברית (לדוגמה: תשפ״ה)"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-200"
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
                      <div key={y.id} className="group relative bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-indigo-300 transition-all">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{y.hebrew_year}</span>
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
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                      <ArrowRightLeft className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">ניהול שיעורים</h2>
                  </div>

                  <form onSubmit={handleAddClass} className="flex gap-4 mb-8">
                    <div className="flex-1">
                      <input 
                        type="text"
                        required
                        placeholder="שם השיעור (לדוגמה: שיעור א')"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-200"
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
                      <div key={c.id} className="group relative bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-indigo-300 transition-all">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{c.name}</span>
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
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                      <Filter className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">הגדרות צבע לפי סכום (סה"כ)</h2>
                  </div>

                  <form onSubmit={handleAddThreshold} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <input 
                      type="number"
                      required
                      placeholder="סכום מינימלי"
                      className="px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-200"
                      value={thresholdForm.min_amount}
                      onChange={(e) => setThresholdForm({ ...thresholdForm, min_amount: e.target.value })}
                    />
                    <div className="flex items-center gap-2">
                      <input 
                        type="color"
                        className="w-full h-12 p-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer"
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
                      <div key={t.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: t.color }}></div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">מעל ₪{t.min_amount.toLocaleString()}</span>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-around items-center z-10">
        <MobileNavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          icon={<History className="w-6 h-6" />}
          label="סיכום"
        />
        <MobileNavButton 
          active={activeTab === 'students'} 
          onClick={() => setActiveTab('students')} 
          icon={<Users className="w-6 h-6" />}
          label="תלמידים"
        />
        <MobileNavButton 
          active={activeTab === 'collections'} 
          onClick={() => setActiveTab('collections')} 
          icon={<History className="w-6 h-6" />}
          label="גביות"
        />
        <MobileNavButton 
          active={activeTab === 'record_collection'} 
          onClick={() => setActiveTab('record_collection')} 
          icon={<PlusCircle className="w-6 h-6" />}
          label="רישום"
        />
        <MobileNavButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
          icon={<Settings className="w-6 h-6" />}
          label="הגדרות"
        />
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {editingCollection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">עריכת רשומת גבייה</h3>
                <button onClick={() => setEditingCollection(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleUpdateCollection} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">תלמיד</label>
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500">
                      {editingCollection.first_name} {editingCollection.last_name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">שנה עברית</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-200"
                      value={editingCollection.year_id}
                      onChange={(e) => setEditingCollection({...editingCollection, year_id: parseInt(e.target.value)})}
                    >
                      {years.map(y => (
                        <option key={y.id} value={y.id}>{y.hebrew_year}</option>
                      ))}
                    </select>
                  </div>
                  <FormField 
                    label="סכום (₪)" 
                    type="number"
                    required
                    value={editingCollection.amount}
                    onChange={(val) => setEditingCollection({...editingCollection, amount: parseFloat(val)})}
                  />
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <input 
                      type="checkbox" 
                      id="edit_effort"
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={editingCollection.effort}
                      onChange={(e) => setEditingCollection({...editingCollection, effort: e.target.checked})}
                    />
                    <label htmlFor="edit_effort" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      האם התאמץ?
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                  >
                    עדכן גבייה
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingCollection(null)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  {editingStudent.id ? 'עריכת פרטי תלמיד' : 'הוספת תלמיד חדש'}
                </h3>
                <button onClick={() => setEditingStudent(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={editingStudent.id ? handleUpdateStudent : handleAddStudent} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <FormField 
                      label="ת.ז" 
                      required
                      value={editingStudent.id}
                      onChange={(val) => setEditingStudent({...editingStudent, id: val})}
                      placeholder="9 ספרות"
                    />
                  </div>
                  <FormField 
                    label="שם פרטי" 
                    required
                    value={editingStudent.first_name}
                    onChange={(val) => setEditingStudent({...editingStudent, first_name: val})}
                  />
                  <FormField 
                    label="שם משפחה" 
                    required
                    value={editingStudent.last_name}
                    onChange={(val) => setEditingStudent({...editingStudent, last_name: val})}
                  />
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">שיעור</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-200"
                      value={editingStudent.class_id}
                      onChange={(e) => setEditingStudent({...editingStudent, class_id: parseInt(e.target.value)})}
                    >
                      <option value="">בחר שיעור...</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <FormField 
                      label="טלפון" 
                      value={editingStudent.phone}
                      onChange={(val) => setEditingStudent({...editingStudent, phone: val})}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                  >
                    {editingStudent.id ? 'עדכן פרטים' : 'הוסף תלמיד'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showImportModal && importData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="text-emerald-500 w-6 h-6" />
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">ייבוא חכם מאקסל</h3>
                </div>
                <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  התאם את העמודות מהקובץ שהעלית לשדות במערכת. המערכת תעדכן תלמידים קיימים לפי ת.ז ותוסיף חדשים.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { id: 'id', label: 'תעודת זהות (חובה)' },
                    { id: 'first_name', label: 'שם פרטי (חובה)' },
                    { id: 'last_name', label: 'שם משפחה (חובה)' },
                    { id: 'phone', label: 'טלפון' },
                    { id: 'class_name', label: 'שיעור' },
                    { id: 'amount', label: 'סכום גבייה' },
                    { id: 'year', label: 'שנה עברית' },
                    { id: 'effort', label: 'מאמץ (כן/לא)' }
                  ].map(field => (
                    <div key={field.id}>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">{field.label}</label>
                      <select 
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        value={columnMapping[field.id] || ''}
                        onChange={(e) => setColumnMapping({...columnMapping, [field.id]: e.target.value})}
                      >
                        <option value="">בחר עמודה...</option>
                        {Object.keys(importData[0]).map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 flex items-start gap-3">
                  <AlertCircle className="text-amber-600 dark:text-amber-500 w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    שים לב: אם השיעור המצוין בקובץ לא קיים במערכת, הוא ייווצר אוטומטית. וודא ששמות השיעורים מדויקים.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={processImport}
                    disabled={!columnMapping['id'] || !columnMapping['first_name'] || !columnMapping['last_name']}
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    התחל ייבוא נתונים
                  </button>
                  <button 
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
        active 
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
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
        active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'
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
  value: string | number, 
  onChange: (val: string) => void,
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input 
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SortHeader({ label, sortKey, currentSort, onSort }: { 
  label: string, 
  sortKey: string, 
  currentSort: { key: string, direction: 'asc' | 'desc' } | null,
  onSort: (key: string) => void 
}) {
  const isActive = currentSort?.key === sortKey;
  return (
    <th 
      className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentSort.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </div>
    </th>
  );
}
