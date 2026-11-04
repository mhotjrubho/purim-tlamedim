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
  X,
  TrendingUp,
  Percent,
  Plus,
  Zap
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
  const [importDefaultYear, setImportDefaultYear] = useState<string>('');
  const [importAmountMode, setImportAmountMode] = useState<'replace' | 'add'>('replace');
  const [importOnlyExisting, setImportOnlyExisting] = useState<boolean>(false);

  // Dashboard FAB & Quick Add Collection Modal state
  const [fabOpen, setFabOpen] = useState(false);
  const [showQuickCollectionModal, setShowQuickCollectionModal] = useState(false);

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
      const data = XLSX.utils.sheet_to_json(ws) as any[];
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        const autoMap: Record<string, string> = {};
        columns.forEach(col => {
          const clean = col.trim();
          if (['ת.ז', 'תעודת זהות', 'תז', 'מספר זהות', 'id', 'ID'].includes(clean)) autoMap['id'] = col;
          else if (['שם פרטי', 'פרטי', 'first_name'].includes(clean)) autoMap['first_name'] = col;
          else if (['שם משפחה', 'משפחה', 'last_name'].includes(clean)) autoMap['last_name'] = col;
          else if (['טלפון', 'נייד', 'פלאפון', 'מספר טלפון', 'phone'].includes(clean)) autoMap['phone'] = col;
          else if (['שיעור', 'כיתה', 'מחזור', 'class', 'class_name'].includes(clean)) autoMap['class_name'] = col;
          else if (['סכום', 'סכום גבייה', 'גבייה', 'סה"כ', 'סהכ', 'amount'].includes(clean)) autoMap['amount'] = col;
          else if (['שנה', 'שנה עברית', 'year', 'hebrew_year'].includes(clean)) autoMap['year'] = col;
          else if (['מאמץ', 'התאמץ', 'effort'].includes(clean)) autoMap['effort'] = col;
        });
        setColumnMapping(autoMap);
      }
      if (years.length > 0 && !importDefaultYear) {
        setImportDefaultYear(years[0].hebrew_year);
      }
      setImportData(data);
      setShowImportModal(true);
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const processImport = async () => {
    if (!importData || !columnMapping['id']) return;
    setLoading(true);
    let updatedCount = 0;
    let createdCount = 0;
    let errorCount = 0;

    // Keep local mutable copies of classes, years, students, collections during batch processing
    let currentClasses = [...classes];
    let currentYears = [...years];
    let currentStudents = [...students];
    let currentCollections = [...collections];

    for (const row of importData) {
      const rawId = row[columnMapping['id']];
      if (rawId === undefined || rawId === null || String(rawId).trim() === '') continue;
      const id = String(rawId).trim();

      const firstName = columnMapping['first_name'] ? row[columnMapping['first_name']] : undefined;
      const lastName = columnMapping['last_name'] ? row[columnMapping['last_name']] : undefined;
      const phone = columnMapping['phone'] ? row[columnMapping['phone']] : undefined;
      const className = columnMapping['class_name'] ? row[columnMapping['class_name']] : undefined;
      const rawAmount = columnMapping['amount'] ? row[columnMapping['amount']] : undefined;
      const rowYearName = columnMapping['year'] ? row[columnMapping['year']] : undefined;
      const effortVal = columnMapping['effort'] ? row[columnMapping['effort']] : undefined;

      try {
        // Find or create class only if className is mapped and non-empty
        let classId: number | undefined = undefined;
        if (className !== undefined && String(className).trim() !== '') {
          const cleanClassName = String(className).trim();
          let cls = currentClasses.find(c => c.name === cleanClassName);
          if (!cls) {
            const clsRes = await fetch('/api/classes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: cleanClassName })
            });
            if (clsRes.ok) {
              const allCls = await (await fetch('/api/classes')).json();
              currentClasses = allCls;
              setClasses(allCls);
              cls = allCls.find((c: any) => c.name === cleanClassName);
            }
          }
          if (cls) classId = cls.id;
        }

        const existingStudent = currentStudents.find(s => s.id === id);

        if (!existingStudent && importOnlyExisting) {
          continue;
        }

        let studentOk = true;
        const hasStudentFieldUpdates =
          (firstName !== undefined && String(firstName).trim() !== '') ||
          (lastName !== undefined && String(lastName).trim() !== '') ||
          (phone !== undefined && String(phone).trim() !== '') ||
          classId !== undefined;

        if (existingStudent) {
          // Only send PUT if at least one student detail column was provided in this row
          if (hasStudentFieldUpdates) {
            const payload: Record<string, any> = {
              first_name: firstName !== undefined && String(firstName).trim() !== '' ? String(firstName).trim() : existingStudent.first_name,
              last_name: lastName !== undefined && String(lastName).trim() !== '' ? String(lastName).trim() : existingStudent.last_name,
              phone: phone !== undefined && String(phone).trim() !== '' ? String(phone).trim() : existingStudent.phone,
              class_id: classId !== undefined ? classId : existingStudent.class_id
            };
            const res = await fetch(`/api/students/${encodeURIComponent(id)}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            studentOk = res.ok;
          }
          if (studentOk) updatedCount++;
        } else {
          // Student doesn't exist yet -> create with available fields
          const payload = {
            id,
            first_name: firstName !== undefined && String(firstName).trim() !== '' ? String(firstName).trim() : 'תלמיד',
            last_name: lastName !== undefined && String(lastName).trim() !== '' ? String(lastName).trim() : id,
            phone: phone !== undefined ? String(phone).trim() : '',
            class_id: classId ?? null
          };
          const res = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          studentOk = res.ok;
          if (studentOk) {
            createdCount++;
            currentStudents.push({
              id,
              first_name: payload.first_name,
              last_name: payload.last_name,
              phone: payload.phone,
              class_id: payload.class_id || 0
            });
          }
        }

        if (studentOk) {
          // Handle collection update/creation if amount is provided
          const parsedAmount = rawAmount !== undefined && rawAmount !== null && String(rawAmount).trim() !== ''
            ? parseFloat(String(rawAmount).replace(/[^\d.-]/g, ''))
            : NaN;
          const targetYearName = (rowYearName !== undefined && String(rowYearName).trim() !== '')
            ? String(rowYearName).trim()
            : importDefaultYear.trim();

          if (!isNaN(parsedAmount) && targetYearName) {
            let year = currentYears.find(y => y.hebrew_year === targetYearName);
            if (!year) {
              const yearRes = await fetch('/api/years', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hebrew_year: targetYearName })
              });
              if (yearRes.ok) {
                const allYears = await (await fetch('/api/years')).json();
                currentYears = allYears;
                setYears(allYears);
                year = allYears.find((y: any) => y.hebrew_year === targetYearName);
              }
            }

            if (year) {
              const existingCollection = currentCollections.find(
                c => c.student_id === id && c.year_id === year?.id
              );

              const hasEffortColumn = effortVal !== undefined && String(effortVal).trim() !== '';
              const parsedEffort = hasEffortColumn
                ? (effortVal === 'כן' || effortVal === '1' || effortVal === 1 || effortVal === true || String(effortVal).trim() === 'התאמץ')
                : (existingCollection ? Boolean(existingCollection.effort) : false);

              if (existingCollection) {
                const finalAmount = importAmountMode === 'add'
                  ? existingCollection.amount + parsedAmount
                  : parsedAmount;

                const collRes = await fetch(`/api/collections/${existingCollection.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    student_id: id,
                    year_id: year.id,
                    amount: finalAmount,
                    effort: parsedEffort
                  })
                });
                if (collRes.ok) {
                  existingCollection.amount = finalAmount;
                  existingCollection.effort = parsedEffort;
                }
              } else {
                const collRes = await fetch('/api/collections', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    student_id: id,
                    year_id: year.id,
                    amount: parsedAmount,
                    effort: parsedEffort
                  })
                });
                if (collRes.ok) {
                  currentCollections.push({
                    id: Date.now(),
                    student_id: id,
                    year_id: year.id,
                    amount: parsedAmount,
                    effort: parsedEffort,
                    created_at: new Date().toISOString(),
                    first_name: '',
                    last_name: '',
                    class_id: 0,
                    class_name: '',
                    hebrew_year: year.hebrew_year
                  });
                }
              }
            }
          }
        } else {
          errorCount++;
        }
      } catch (err) {
        errorCount++;
      }
    }

    const totalSuccess = updatedCount + createdCount;
    setStatus({ 
      type: totalSuccess > 0 ? 'success' : 'error', 
      message: `ייבוא הושלם: ${updatedCount} עודכנו, ${createdCount} נוספו${errorCount > 0 ? `, ${errorCount} נכשלו` : ''}` 
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
        setShowQuickCollectionModal(false);
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

    // Real-time Summary Statistics (based on current filtered view or all active data)
    const totalActiveStudents = rows.length;
    const studentsWithCollections = rows.filter(r => r.years.some(y => y.amount > 0)).length;
    const totalCollectedAmount = rows.reduce(
      (sum, r) => sum + r.years.reduce((ySum, y) => ySum + y.amount, 0),
      0
    );
    const collectionRate = totalActiveStudents > 0
      ? Math.round((studentsWithCollections / totalActiveStudents) * 100)
      : 0;
    const averagePerStudent = studentsWithCollections > 0
      ? Math.round(totalCollectedAmount / studentsWithCollections)
      : 0;

    return {
      rows,
      maxYears,
      stats: {
        totalCollectedAmount,
        totalActiveStudents,
        studentsWithCollections,
        collectionRate,
        averagePerStudent
      }
    };
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
              <div className="space-y-6 relative pb-16">
                {/* Summary Statistics Card at Top of Dashboard */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-base font-bold text-slate-800 dark:text-white">מדדי גבייה בזמן אמת</h3>
                    </div>
                    {(filterClass || searchQuery) && (
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg">
                        מוצג לפי סינון נוכחי
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Collected Amount */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-950/30 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">סה"כ סכום שנגבה</p>
                        <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                          ₪{dashboardData.stats.totalCollectedAmount.toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          ממוצע לגובה פעיל: ₪{dashboardData.stats.averagePerStudent.toLocaleString()}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Coins className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Total Active Students */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-slate-900 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">סה"כ תלמידים פעילים</p>
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                          {dashboardData.stats.totalActiveStudents.toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          מתוכם {dashboardData.stats.studentsWithCollections.toLocaleString()} השתתפו בגבייה
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Users className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Collection Rate */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/30 dark:to-slate-900 border border-amber-100 dark:border-amber-900/40 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">אחוז גבייה (שיעור השתתפות)</p>
                          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                            {dashboardData.stats.collectionRate}%
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-600/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                          <Percent className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, dashboardData.stats.collectionRate)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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

                {/* Floating Action Button (FAB) & Context Menu in Dashboard */}
                <div className="fixed bottom-20 md:bottom-8 left-6 z-40 flex flex-col items-end">
                  <AnimatePresence>
                    {fabOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-30" 
                          onClick={() => setFabOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 15, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="relative z-40 mb-3 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 space-y-1"
                        >
                          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                            פעולות מהירות
                          </div>
                          <button
                            onClick={() => {
                              setFabOpen(false);
                              setShowQuickCollectionModal(true);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-right"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <PlusCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <div>הוספת גבייה מהירה</div>
                              <div className="text-[10px] font-normal text-slate-400">רישום מיידי ללא מעבר לשונית</div>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setFabOpen(false);
                              exportToExcel();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-right"
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <Download className="w-4 h-4" />
                            </div>
                            <div>
                              <div>ייצוא דוח לאקסל</div>
                              <div className="text-[10px] font-normal text-slate-400">הורדת טבלת סיכום הגביות</div>
                            </div>
                          </button>

                          <label
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-right cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              <Upload className="w-4 h-4" />
                            </div>
                            <div>
                              <div>ייבוא / עדכון מאקסל</div>
                              <div className="text-[10px] font-normal text-slate-400">עדכון סכומים או פרטים לפי ת.ז</div>
                            </div>
                            <input
                              type="file"
                              accept=".xlsx, .xls"
                              className="hidden"
                              onChange={(e) => {
                                setFabOpen(false);
                                handleFileUpload(e);
                              }}
                            />
                          </label>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() => setFabOpen(!fabOpen)}
                    className={`relative z-40 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-200 ${
                      fabOpen
                        ? 'bg-slate-800 dark:bg-slate-700 text-white rotate-45'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-300 dark:shadow-none hover:scale-105'
                    }`}
                    title="פעולות מהירות"
                  >
                    <Plus className="w-7 h-7" />
                  </button>
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

        {showQuickCollectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl">
                    <Zap className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">הוספת גבייה מהירה</h3>
                </div>
                <button onClick={() => setShowQuickCollectionModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleRecordCollection} className="p-6 space-y-5">
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
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-200"
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
                        <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.class_name || 'ללא שיעור'}) - {s.id}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">שנה עברית <span className="text-rose-500">*</span></label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-200"
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
                    id="quick_effort"
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={collectionForm.effort}
                    onChange={(e) => setCollectionForm({...collectionForm, effort: e.target.checked})}
                  />
                  <label htmlFor="quick_effort" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    האם התאמץ השנה? (ירוק = כן, אדום = לא)
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    שמור גבייה
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowQuickCollectionModal(false)}
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
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="text-emerald-500 w-6 h-6" />
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">ייבוא ועדכון חכם מאקסל</h3>
                    <p className="text-xs text-slate-400">ניתן לעדכן רק חלק מהשדות (למשל רק ת.ז וסכום) מבלי לדרוס נתונים קיימים</p>
                  </div>
                </div>
                <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="bg-indigo-50/70 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                  <strong>איך זה עובד?</strong> חובה לבחור רק עמודת <strong>תעודת זהות</strong>. כל שאר העמודות הן רשות בלבד! שדות שלא תבחר יישארו כפי שהם במערכת ולא יימחקו.
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'id', label: 'תעודת זהות (חובה *)', required: true },
                    { id: 'amount', label: 'סכום גבייה (אופציונלי)' },
                    { id: 'year', label: 'שנה עברית בקובץ (אופציונלי)' },
                    { id: 'effort', label: 'מאמץ - כן/לא (אופציונלי)' },
                    { id: 'first_name', label: 'שם פרטי (אופציונלי)' },
                    { id: 'last_name', label: 'שם משפחה (אופציונלי)' },
                    { id: 'phone', label: 'טלפון (אופציונלי)' },
                    { id: 'class_name', label: 'שיעור (אופציונלי)' }
                  ].map(field => (
                    <div key={field.id}>
                      <label className={`block text-xs font-bold mb-1.5 ${
                        field.required ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {field.label}
                      </label>
                      <select 
                        className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                          field.required && !columnMapping[field.id]
                            ? 'border-rose-300 dark:border-rose-800'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                        value={columnMapping[field.id] || ''}
                        onChange={(e) => setColumnMapping({...columnMapping, [field.id]: e.target.value})}
                      >
                        <option value="">-- ללא שינוי / לא נבחר --</option>
                        {Object.keys(importData[0] || {}).map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Collection update options when amount column is mapped */}
                {columnMapping['amount'] && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Coins className="w-4 h-4 text-indigo-600" />
                      הגדרות עדכון סכום גבייה
                    </h4>

                    {!columnMapping['year'] && (
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                          לא נבחרה עמודת "שנה עברית" בקובץ — לאיזו שנה לשייך את הסכומים?
                        </label>
                        <div className="flex gap-2">
                          <select
                            className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            value={importDefaultYear}
                            onChange={(e) => setImportDefaultYear(e.target.value)}
                          >
                            <option value="">בחר שנה קיימת...</option>
                            {years.map(y => (
                              <option key={y.id} value={y.hebrew_year}>{y.hebrew_year}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="או הקלד שנה (כגון תשפ״ה)"
                            className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            value={importDefaultYear}
                            onChange={(e) => setImportDefaultYear(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                        כיצד לעדכן כאשר כבר קיימת גבייה לתלמיד באותה שנה?
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setImportAmountMode('replace')}
                          className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all text-right ${
                            importAmountMode === 'replace'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          עדכן סכום (החלף סכום קיים בחדש)
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportAmountMode('add')}
                          className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all text-right ${
                            importAmountMode === 'add'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          הוסף לסכום הקיים (צבירה)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <input
                    type="checkbox"
                    id="import_only_existing"
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={importOnlyExisting}
                    onChange={(e) => setImportOnlyExisting(e.target.checked)}
                  />
                  <label htmlFor="import_only_existing" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    עדכן תלמידים קיימים בלבד (דלג על מספרי ת.ז שלא קיימים במערכת)
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={processImport}
                    disabled={!columnMapping['id'] || (Boolean(columnMapping['amount']) && !columnMapping['year'] && !importDefaultYear.trim())}
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    התחל ייבוא ועדכון נתונים
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
