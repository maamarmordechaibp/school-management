import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Loader2, BookOpen, Bus, Receipt, Printer, Wallet, Banknote,
  CreditCard, CheckCircle, DollarSign, ArrowLeftRight
} from 'lucide-react';

const ACADEMIC_YEAR = '2024-2025';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'credit_card', label: 'Credit Card' },
];

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;
const studentName = (s) => (s?.hebrew_name || `${s?.first_name || ''} ${s?.last_name || ''}`).trim();

const CATEGORY_LABELS = {
  tuition: 'Tuition',
  books: 'Books (fee)',
  supplies: 'Supplies',
  trip: 'Trips',
  donation: 'Donations',
  registration: 'Registration',
  other: 'Other fees',
};
const categoryLabel = (cat) => CATEGORY_LABELS[cat] || (cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Other fees');

const BulkCollectionView = ({ currentUser }) => {
  const { toast } = useToast();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [items, setItems] = useState([]); // { key, type, id, name, price, meta }
  const [booksByStudent, setBooksByStudent] = useState({}); // { [studentId]: { [book_id]: row } }
  const [feesByStudent, setFeesByStudent] = useState({});   // { [studentId]: { [fee_id]: row } }
  const [payments, setPayments] = useState([]);             // payments for these students

  // selected[studentId][itemKey] = true  (newly checked, not yet recorded)
  const [selected, setSelected] = useState({});

  // What kind of items to collect right now: set of type keys ('book', 'fee:<category>').
  // Empty set = show everything.
  const [selectedTypes, setSelectedTypes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Collect modal
  const [collectOpen, setCollectOpen] = useState(false);
  const [collectStudent, setCollectStudent] = useState(null);
  const [collectForm, setCollectForm] = useState({
    amount: '', payment_method: 'cash', reference_number: '', change_given: '0', notes: ''
  });

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) loadClassData(selectedClassId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId]);

  const loadClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('id, name, grade_id, grade:grades(name)')
      .order('name');
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load classes' });
      return;
    }
    setClasses(data || []);
  };

  const loadClassData = async (classId) => {
    setLoading(true);
    setSelected({});
    setSelectedTypes([]);
    try {
      const cls = classes.find((c) => c.id === classId);
      const gradeId = cls?.grade_id || null;

      // Students in the class
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, first_name, last_name, hebrew_name, class_id')
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('last_name');
      const studentList = studentsData || [];
      setStudents(studentList);
      const studentIds = studentList.map((s) => s.id);

      // Required books for this class
      const { data: bookReqs } = await supabase
        .from('class_book_requirements')
        .select('id, quantity_per_student, book:books(id, title, price)')
        .eq('class_id', classId)
        .eq('academic_year', ACADEMIC_YEAR);

      // Applicable fees/trips: school-wide, this grade, or this class
      let feeQuery = supabase
        .from('fees')
        .select('id, name, amount, scope, grade_id, class_id, fee_type:fee_types(category)')
        .eq('status', 'active');
      const orParts = ['scope.eq.school_wide', `class_id.eq.${classId}`];
      if (gradeId) orParts.push(`grade_id.eq.${gradeId}`);
      feeQuery = feeQuery.or(orParts.join(','));
      const { data: feesData } = await feeQuery;

      const bookItems = (bookReqs || [])
        .filter((r) => r.book)
        .map((r) => {
          const qty = r.quantity_per_student || 1;
          return {
            key: `book:${r.book.id}`,
            type: 'book',
            id: r.book.id,
            name: qty > 1 ? `${r.book.title} ×${qty}` : r.book.title,
            price: (Number(r.book.price) || 0) * qty,
            unitPrice: Number(r.book.price) || 0,
            qty,
          };
        });

      const feeItems = (feesData || []).map((f) => ({
        key: `fee:${f.id}`,
        type: 'fee',
        id: f.id,
        name: f.name,
        price: Number(f.amount) || 0,
        category: f.fee_type?.category || 'other',
      }));

      setItems([...bookItems, ...feeItems]);

      // Existing records to lock already-collected items
      let studentBooks = [];
      let studentFees = [];
      let paymentsData = [];
      if (studentIds.length) {
        const [sb, sf, pay] = await Promise.all([
          supabase.from('student_books')
            .select('id, student_id, book_id, status, has_own_copy, amount_charged')
            .in('student_id', studentIds),
          supabase.from('student_fees')
            .select('id, student_id, fee_id, amount, amount_paid, status')
            .in('student_id', studentIds),
          supabase.from('payments')
            .select('id, student_id, amount, payment_method, reference_number, change_given, payment_date, description')
            .in('student_id', studentIds)
            .order('payment_date', { ascending: false }),
        ]);
        studentBooks = sb.data || [];
        studentFees = sf.data || [];
        paymentsData = pay.data || [];
      }

      const bMap = {};
      for (const row of studentBooks) {
        (bMap[row.student_id] = bMap[row.student_id] || {})[row.book_id] = row;
      }
      const fMap = {};
      for (const row of studentFees) {
        (fMap[row.student_id] = fMap[row.student_id] || {})[row.fee_id] = row;
      }
      setBooksByStudent(bMap);
      setFeesByStudent(fMap);
      setPayments(paymentsData);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to load class' });
    } finally {
      setLoading(false);
    }
  };

  // Is an item already recorded/paid for a student?
  const itemDone = (studentId, item) => {
    if (item.type === 'book') {
      const row = booksByStudent[studentId]?.[item.id];
      return !!row && ['purchased', 'received', 'has_own'].includes(row.status);
    }
    const row = feesByStudent[studentId]?.[item.id];
    return !!row && (row.status === 'paid' || (Number(row.amount_paid) || 0) >= (Number(row.amount) || 0) && (Number(row.amount) || 0) > 0);
  };

  const toggleItem = (studentId, item) => {
    if (itemDone(studentId, item)) return; // locked
    setSelected((prev) => {
      const forStudent = { ...(prev[studentId] || {}) };
      if (forStudent[item.key]) delete forStudent[item.key];
      else forStudent[item.key] = true;
      return { ...prev, [studentId]: forStudent };
    });
  };

  const studentSelectedItems = (studentId) =>
    visibleItems.filter((it) => selected[studentId]?.[it.key] && !itemDone(studentId, it));

  const studentTotal = (studentId) =>
    studentSelectedItems(studentId).reduce((sum, it) => sum + it.price, 0);

  const openCollect = (student) => {
    const total = studentTotal(student.id);
    if (total <= 0) {
      toast({ title: 'Nothing selected', description: 'Check at least one book or fee first.' });
      return;
    }
    setCollectStudent(student);
    setCollectForm({
      amount: total.toFixed(2),
      payment_method: 'cash',
      reference_number: '',
      change_given: '0',
      notes: '',
    });
    setCollectOpen(true);
  };

  const confirmCollect = async () => {
    if (!collectStudent) return;
    const student = collectStudent;
    const chosen = studentSelectedItems(student.id);
    if (chosen.length === 0) {
      setCollectOpen(false);
      return;
    }
    setSaving(true);
    try {
      // Record books
      for (const it of chosen.filter((i) => i.type === 'book')) {
        const existing = booksByStudent[student.id]?.[it.id];
        const payload = {
          student_id: student.id,
          book_id: it.id,
          status: 'purchased',
          amount_charged: it.price,
          purchase_date: new Date().toISOString().split('T')[0],
          academic_year: ACADEMIC_YEAR,
        };
        if (existing) {
          await supabase.from('student_books').update(payload).eq('id', existing.id);
        } else {
          await supabase.from('student_books').insert(payload);
        }
      }

      // Record fees
      for (const it of chosen.filter((i) => i.type === 'fee')) {
        await supabase.from('student_fees').upsert(
          {
            student_id: student.id,
            fee_id: it.id,
            amount: it.price,
            amount_paid: it.price,
            status: 'paid',
          },
          { onConflict: 'student_id,fee_id' }
        );
      }

      // One payment for the whole collection
      const amount = parseFloat(collectForm.amount);
      const change = parseFloat(collectForm.change_given) || 0;
      const itemNames = chosen.map((i) => i.name).join(', ');
      await supabase.from('payments').insert({
        student_id: student.id,
        amount: Number.isFinite(amount) ? amount : chosen.reduce((s, i) => s + i.price, 0),
        payment_method: collectForm.payment_method,
        reference_number: collectForm.reference_number || null,
        change_given: change,
        payment_date: new Date().toISOString().split('T')[0],
        received_by: currentUser?.id || null,
        description: `Bulk collection: ${itemNames}`.slice(0, 255),
        notes: collectForm.notes || null,
      });

      toast({ title: 'Collected', description: `${studentName(student)} — ${money(amount)}` });
      setCollectOpen(false);
      setCollectStudent(null);
      // clear this student's selection and reload records
      setSelected((prev) => ({ ...prev, [student.id]: {} }));
      await loadClassData(selectedClassId);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  // Financial summary for the loaded class payments
  const summary = useMemo(() => {
    let cashIn = 0, checksFace = 0, cardIn = 0, otherIn = 0, changeOut = 0, total = 0;
    for (const p of payments) {
      const amt = Number(p.amount) || 0;
      const chg = Number(p.change_given) || 0;
      total += amt;
      changeOut += chg;
      if (p.payment_method === 'cash') cashIn += amt;
      else if (p.payment_method === 'check') checksFace += amt + chg;
      else if (p.payment_method === 'credit_card') cardIn += amt;
      else otherIn += amt;
    }
    return { cashIn, checksFace, cardIn, otherIn, changeOut, total, netCash: cashIn - changeOut };
  }, [payments]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // Collection-type filter options built from the loaded items
  const filterOptions = useMemo(() => {
    const opts = [];
    if (items.some((i) => i.type === 'book')) opts.push({ value: 'book', label: 'Books' });
    const cats = [];
    for (const it of items) {
      if (it.type === 'fee' && it.category && !cats.includes(it.category)) cats.push(it.category);
    }
    cats.forEach((c) => opts.push({ value: `fee:${c}`, label: categoryLabel(c) }));
    return opts;
  }, [items]);

  const itemTypeKey = (it) => (it.type === 'book' ? 'book' : `fee:${it.category}`);
  const toggleType = (value) =>
    setSelectedTypes((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  // Only the columns matching the chosen collection types (empty = all)
  const visibleItems = useMemo(() => {
    if (!selectedTypes.length) return items;
    return items.filter((it) => selectedTypes.includes(itemTypeKey(it)));
  }, [items, selectedTypes]);

  // ---- Printing ----
  const openPrint = (title, bodyHtml) => {
    const w = window.open('', '_blank');
    if (!w) {
      toast({ variant: 'destructive', title: 'Pop-up blocked', description: 'Allow pop-ups to print.' });
      return;
    }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:24px;}
        h1{font-size:18px;margin:0 0 4px;} .sub{color:#555;font-size:12px;margin-bottom:16px;}
        table{border-collapse:collapse;width:100%;font-size:12px;}
        th,td{border:1px solid #bbb;padding:5px 7px;text-align:left;}
        th{background:#f1f5f9;}
        .r{text-align:right;} .c{text-align:center;} .paid{color:#16a34a;font-weight:bold;}
        .cards{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0 20px;}
        .cardbox{border:1px solid #ddd;border-radius:8px;padding:10px 14px;min-width:130px;}
        .cardbox .lbl{font-size:11px;color:#666;} .cardbox .val{font-size:18px;font-weight:bold;}
        @media print{body{margin:10mm;}}
      </style></head><body onload="window.focus();window.print();setTimeout(function(){try{window.close()}catch(e){}},400);">
      ${bodyHtml}</body></html>`);
    w.document.close();
  };

  const printClassList = () => {
    if (!selectedClass) return;
    const header = visibleItems.map((it) => `<th class="c">${it.name}<br><span style="font-weight:normal">${money(it.price)}</span></th>`).join('');
    const rows = students.map((s) => {
      const cells = visibleItems.map((it) => {
        const done = itemDone(s.id, it);
        const checked = !!selected[s.id]?.[it.key];
        return `<td class="c">${done ? '<span class="paid">✓ paid</span>' : (checked ? '✔' : '')}</td>`;
      }).join('');
      const owed = studentTotal(s.id);
      return `<tr><td>${studentName(s)}</td>${cells}<td class="r">${owed > 0 ? money(owed) : ''}</td></tr>`;
    }).join('');
    const body = `
      <h1>${selectedClass.name} — Class Collection List</h1>
      <div class="sub">${selectedClass.grade?.name || ''} · ${ACADEMIC_YEAR} · ${new Date().toLocaleDateString('en-US')}</div>
      <table><thead><tr><th>Student</th>${header}<th class="r">Selected total</th></tr></thead>
      <tbody>${rows}</tbody></table>`;
    openPrint(`${selectedClass.name} collection list`, body);
  };

  const printFinancial = () => {
    if (!selectedClass) return;
    const body = `
      <h1>${selectedClass.name} — Financial Report</h1>
      <div class="sub">${selectedClass.grade?.name || ''} · ${ACADEMIC_YEAR} · ${new Date().toLocaleDateString('en-US')}</div>
      <div class="cards">
        <div class="cardbox"><div class="lbl">Total collected</div><div class="val">${money(summary.total)}</div></div>
        <div class="cardbox"><div class="lbl">Cash received</div><div class="val">${money(summary.cashIn)}</div></div>
        <div class="cardbox"><div class="lbl">Checks (face value)</div><div class="val">${money(summary.checksFace)}</div></div>
        <div class="cardbox"><div class="lbl">Credit card</div><div class="val">${money(summary.cardIn)}</div></div>
        <div class="cardbox"><div class="lbl">Change given (cash out)</div><div class="val">${money(summary.changeOut)}</div></div>
        <div class="cardbox"><div class="lbl">Net cash on hand</div><div class="val">${money(summary.netCash)}</div></div>
      </div>
      <table><thead><tr><th>Student</th><th>Date</th><th>Method</th><th class="r">Amount</th><th class="r">Change (cash)</th><th>Reference</th></tr></thead>
      <tbody>${payments.map((p) => {
        const s = students.find((st) => st.id === p.student_id);
        return `<tr><td>${s ? studentName(s) : ''}</td><td>${p.payment_date || ''}</td><td>${(p.payment_method || '').replace('_', ' ')}</td><td class="r">${money(p.amount)}</td><td class="r">${p.change_given ? money(p.change_given) : ''}</td><td>${p.reference_number || ''}</td></tr>`;
      }).join('')}</tbody></table>`;
    openPrint(`${selectedClass.name} financial report`, body);
  };

  const iconForItem = (it) => {
    if (it.type === 'book') return <BookOpen className="h-3.5 w-3.5" />;
    if (it.category === 'trip') return <Bus className="h-3.5 w-3.5" />;
    return <Receipt className="h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px]">
          <Label className="text-sm">Select a class</Label>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Choose a class to collect…" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}{c.grade?.name ? ` — ${c.grade.name}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedClassId && filterOptions.length > 0 && (
          <div className="min-w-[220px]">
            <Label className="text-sm">Collect for</Label>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedTypes([])}
                className={`px-3 h-8 rounded-full text-xs font-medium border transition-colors ${
                  selectedTypes.length === 0
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white/60 text-slate-600 border-slate-200 hover:bg-white'
                }`}
              >
                All items
              </button>
              {filterOptions.map((o) => {
                const active = selectedTypes.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggleType(o.value)}
                    className={`px-3 h-8 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-white/60 text-slate-600 border-slate-200 hover:bg-white'
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {selectedClassId && (
          <div className="flex gap-2">
            <Button variant="outline" className="h-11" onClick={printClassList} disabled={loading || !visibleItems.length}>
              <Printer className="h-4 w-4 me-2" /> Print class list
            </Button>
            <Button variant="outline" className="h-11" onClick={printFinancial} disabled={loading}>
              <DollarSign className="h-4 w-4 me-2" /> Financial report
            </Button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-56">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && !selectedClassId && (
        <Card><CardContent className="p-10 text-center text-slate-500">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          Pick a class above to open its roster and collect books &amp; fees in bulk.
        </CardContent></Card>
      )}

      {!loading && selectedClassId && (
        <>
          {/* Financial summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card><CardContent className="p-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs"><DollarSign className="h-4 w-4" /> Collected</div>
              <div className="text-lg font-bold">{money(summary.total)}</div>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs"><Banknote className="h-4 w-4" /> Cash</div>
              <div className="text-lg font-bold">{money(summary.cashIn)}</div>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs"><Wallet className="h-4 w-4" /> Checks</div>
              <div className="text-lg font-bold">{money(summary.checksFace)}</div>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs"><CreditCard className="h-4 w-4" /> Card</div>
              <div className="text-lg font-bold">{money(summary.cardIn)}</div>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs"><ArrowLeftRight className="h-4 w-4" /> Change out</div>
              <div className="text-lg font-bold">{money(summary.changeOut)}</div>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs"><Banknote className="h-4 w-4" /> Net cash</div>
              <div className="text-lg font-bold">{money(summary.netCash)}</div>
            </CardContent></Card>
          </div>

          {items.length === 0 && (
            <Card><CardContent className="p-6 text-center text-slate-500">
              This class has no required books or applicable fees yet. Add them in the Books and Fees pages.
            </CardContent></Card>
          )}

          {items.length > 0 && visibleItems.length === 0 && (
            <Card><CardContent className="p-6 text-center text-slate-500">
              No items match this filter for this class. Choose a different “Collect for” option.
            </CardContent></Card>
          )}

          {students.length === 0 && (
            <Card><CardContent className="p-6 text-center text-slate-500">
              No active students in this class.
            </CardContent></Card>
          )}

          {/* Collection grid */}
          {students.length > 0 && visibleItems.length > 0 && (
            <Card className="overflow-hidden">
              <CardContent className="p-0 overflow-x-auto max-w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-white/40">
                      <th className="text-start p-3 sticky start-0 bg-white/80 backdrop-blur z-10 min-w-[150px]">Student</th>
                      {visibleItems.map((it) => (
                        <th key={it.key} className="p-2 text-center min-w-[84px] align-bottom">
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 text-slate-600">{iconForItem(it)}</span>
                            <span className="font-medium leading-tight">{it.name}</span>
                            <span className="text-xs text-slate-500">{money(it.price)}</span>
                          </div>
                        </th>
                      ))}
                      <th className="p-3 text-end min-w-[100px]">Total</th>
                      <th className="p-3 text-center min-w-[110px] sticky end-0 bg-white/80 backdrop-blur z-10">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => {
                      const total = studentTotal(s.id);
                      return (
                        <tr key={s.id} className="border-b hover:bg-primary/5">
                          <td className="p-3 sticky start-0 bg-white/80 backdrop-blur font-medium">{studentName(s)}</td>
                          {visibleItems.map((it) => {
                            const done = itemDone(s.id, it);
                            const checked = !!selected[s.id]?.[it.key];
                            return (
                              <td key={it.key} className="p-2 text-center">
                                {done ? (
                                  <span className="inline-flex items-center justify-center text-green-600" title="Already paid / owned">
                                    <CheckCircle className="h-4 w-4" />
                                  </span>
                                ) : (
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-primary cursor-pointer"
                                    checked={checked}
                                    onChange={() => toggleItem(s.id, it)}
                                  />
                                )}
                              </td>
                            );
                          })}
                          <td className="p-3 text-end font-semibold">{total > 0 ? money(total) : <span className="text-slate-400">—</span>}</td>
                          <td className="p-2 text-center sticky end-0 bg-white/80 backdrop-blur">
                            <Button size="sm" disabled={total <= 0} onClick={() => openCollect(s)}>
                              Collect
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Collect modal */}
      <Dialog open={collectOpen} onOpenChange={setCollectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Collect payment{collectStudent ? ` — ${studentName(collectStudent)}` : ''}</DialogTitle>
          </DialogHeader>
          {collectStudent && (
            <div className="space-y-3 py-1">
              <div className="rounded-lg border border-white/60 bg-white/50 p-3">
                <div className="text-xs text-slate-500 mb-1">Items</div>
                <ul className="text-sm space-y-1">
                  {studentSelectedItems(collectStudent.id).map((it) => (
                    <li key={it.key} className="flex justify-between">
                      <span className="inline-flex items-center gap-1">{iconForItem(it)} {it.name}</span>
                      <span>{money(it.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between font-semibold border-t mt-2 pt-2">
                  <span>Total owed</span>
                  <span>{money(studentTotal(collectStudent.id))}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Payment method</Label>
                  <Select
                    value={collectForm.payment_method}
                    onValueChange={(v) => setCollectForm({ ...collectForm, payment_method: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Amount received</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={collectForm.amount}
                    onChange={(e) => {
                      const amount = e.target.value;
                      const owed = studentTotal(collectStudent.id);
                      const received = parseFloat(amount);
                      const change = Number.isFinite(received) && received > owed
                        ? (received - owed).toFixed(2)
                        : '0';
                      setCollectForm((f) => ({ ...f, amount, change_given: change }));
                    }}
                  />
                </div>
              </div>

              {(() => {
                const owed = studentTotal(collectStudent.id);
                const received = parseFloat(collectForm.amount);
                const change = Number.isFinite(received) ? received - owed : 0;
                if (change <= 0.0001) return null;
                return (
                  <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800">
                      <ArrowLeftRight className="h-4 w-4" /> Change to give back
                    </span>
                    <span className="text-lg font-bold text-amber-700">{money(change)}</span>
                  </div>
                );
              })()}

              {collectForm.payment_method !== 'cash' && (
                <div>
                  <Label className="text-sm">Reference / check #</Label>
                  <Input
                    value={collectForm.reference_number}
                    onChange={(e) => setCollectForm({ ...collectForm, reference_number: e.target.value })}
                    placeholder="Check number, transaction id…"
                  />
                </div>
              )}

              <div>
                <Label className="text-sm">Cash change given back</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={collectForm.change_given}
                  onChange={(e) => setCollectForm({ ...collectForm, change_given: e.target.value })}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Auto-filled from the amount received. Adjust if you hand back a different amount.
                </p>
              </div>

              <div>
                <Label className="text-sm">Notes (optional)</Label>
                <Textarea
                  rows={2}
                  value={collectForm.notes}
                  onChange={(e) => setCollectForm({ ...collectForm, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={confirmCollect} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <CheckCircle className="h-4 w-4 me-2" />}
              Confirm collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkCollectionView;
