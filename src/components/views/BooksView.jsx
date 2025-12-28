import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BookMarked, Package, DollarSign, Search, Filter, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BooksView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [books, setBooks] = useState([]);
  const [grades, setGrades] = useState([]);
  const [gradeRequirements, setGradeRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Book Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    subtitle: '',
    author: '',
    isbn: '',
    publisher: '',
    category: 'textbook',
    subject: '',
    price: '',
    quantity_in_stock: '0',
    reorder_threshold: '10'
  });

  // Grade Requirements Modal State
  const [isRequirementsModalOpen, setIsRequirementsModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [academicYear, setAcademicYear] = useState('2024-2025');

  const categories = [
    { value: 'textbook', label: 'Textbook' },
    { value: 'workbook', label: 'Workbook' },
    { value: 'hebrew', label: 'Hebrew' },
    { value: 'english', label: 'English' },
    { value: 'math', label: 'Math' },
    { value: 'science', label: 'Science' },
    { value: 'other', label: 'Other' }
  ];

  const subjects = [
    { value: 'hebrew', label: 'Hebrew' },
    { value: 'english', label: 'English' },
    { value: 'math', label: 'Math' },
    { value: 'science', label: 'Science' },
    { value: 'history', label: 'History' },
    { value: 'chumash', label: 'Chumash' },
    { value: 'gemara', label: 'Gemara' },
    { value: 'mishnayos', label: 'Mishnayos' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load books
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .order('title');
      if (booksError) throw booksError;
      setBooks(booksData || []);

      // Load grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .order('grade_number');
      if (gradesError) throw gradesError;
      setGrades(gradesData || []);

      // Load grade requirements
      const { data: reqData, error: reqError } = await supabase
        .from('grade_book_requirements')
        .select(`
          *,
          grade:grades(id, name),
          book:books(id, title, price)
        `);
      if (reqError) throw reqError;
      setGradeRequirements(reqData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  // Filter books
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Books that need reordering
  const lowStockBooks = books.filter(b => b.quantity_in_stock <= b.reorder_threshold);

  // Book Modal Functions
  const openBookModal = (book = null) => {
    if (book) {
      setEditingBook(book);
      setBookForm({
        title: book.title || '',
        subtitle: book.subtitle || '',
        author: book.author || '',
        isbn: book.isbn || '',
        publisher: book.publisher || '',
        category: book.category || 'textbook',
        subject: book.subject || '',
        price: book.price?.toString() || '',
        quantity_in_stock: book.quantity_in_stock?.toString() || '0',
        reorder_threshold: book.reorder_threshold?.toString() || '10'
      });
    } else {
      setEditingBook(null);
      setBookForm({
        title: '', subtitle: '', author: '', isbn: '', publisher: '',
        category: 'textbook', subject: '', price: '', quantity_in_stock: '0', reorder_threshold: '10'
      });
    }
    setIsBookModalOpen(true);
  };

  const handleSaveBook = async () => {
    if (!bookForm.title || !bookForm.price) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in title and price' });
      return;
    }

    try {
      const payload = {
        title: bookForm.title,
        subtitle: bookForm.subtitle || null,
        author: bookForm.author || null,
        isbn: bookForm.isbn || null,
        publisher: bookForm.publisher || null,
        category: bookForm.category,
        subject: bookForm.subject || null,
        price: parseFloat(bookForm.price),
        quantity_in_stock: parseInt(bookForm.quantity_in_stock) || 0,
        reorder_threshold: parseInt(bookForm.reorder_threshold) || 10
      };

      if (editingBook) {
        const { error } = await supabase
          .from('books')
          .update(payload)
          .eq('id', editingBook.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Book updated successfully' });
      } else {
        const { error } = await supabase
          .from('books')
          .insert([payload]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Book added successfully' });
      }

      setIsBookModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving book:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save book' });
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Book deleted' });
      loadData();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete book' });
    }
  };

  // Grade Requirements Functions
  const openRequirementsModal = (grade) => {
    setSelectedGrade(grade);
    const currentReqs = gradeRequirements
      .filter(r => r.grade_id === grade.id && r.academic_year === academicYear)
      .map(r => r.book_id);
    setSelectedBooks(currentReqs);
    setIsRequirementsModalOpen(true);
  };

  const toggleBookRequirement = (bookId) => {
    setSelectedBooks(prev => 
      prev.includes(bookId)
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleSaveRequirements = async () => {
    if (!selectedGrade) return;

    try {
      // Delete existing requirements for this grade/year
      const { error: deleteError } = await supabase
        .from('grade_book_requirements')
        .delete()
        .eq('grade_id', selectedGrade.id)
        .eq('academic_year', academicYear);
      if (deleteError) throw deleteError;

      // Insert new requirements
      if (selectedBooks.length > 0) {
        const newReqs = selectedBooks.map(bookId => ({
          grade_id: selectedGrade.id,
          book_id: bookId,
          academic_year: academicYear,
          is_required: true
        }));

        const { error: insertError } = await supabase
          .from('grade_book_requirements')
          .insert(newReqs);
        if (insertError) throw insertError;
      }

      toast({ title: 'Success', description: 'Book requirements updated' });
      setIsRequirementsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving requirements:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save requirements' });
    }
  };

  // Get books for a grade
  const getGradeBooks = (gradeId) => {
    return gradeRequirements
      .filter(r => r.grade_id === gradeId && r.academic_year === academicYear)
      .map(r => r.book);
  };

  // Calculate total cost for a grade
  const getGradeTotalCost = (gradeId) => {
    return gradeRequirements
      .filter(r => r.grade_id === gradeId && r.academic_year === academicYear)
      .reduce((sum, r) => sum + (r.book?.price || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Books Management</h1>
          <p className="text-slate-500">Manage book inventory and grade requirements</p>
        </div>
        <Button onClick={() => openBookModal()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Book
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookMarked className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{books.length}</p>
              <p className="text-sm text-slate-500">Total Books</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{books.reduce((sum, b) => sum + b.quantity_in_stock, 0)}</p>
              <p className="text-sm text-slate-500">In Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lowStockBooks.length}</p>
              <p className="text-sm text-slate-500">Low Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">${books.reduce((sum, b) => sum + (b.price * b.quantity_in_stock), 0).toFixed(0)}</p>
              <p className="text-sm text-slate-500">Inventory Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalog">Book Catalog</TabsTrigger>
          <TabsTrigger value="requirements">Grade Requirements</TabsTrigger>
          <TabsTrigger value="lowstock">Low Stock ({lowStockBooks.length})</TabsTrigger>
        </TabsList>

        {/* Book Catalog Tab */}
        <TabsContent value="catalog">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Book Catalog</CardTitle>
                  <CardDescription>All books in your inventory</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search books..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{book.title}</p>
                          {book.author && <p className="text-sm text-slate-500">{book.author}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{book.category}</Badge>
                      </TableCell>
                      <TableCell>{book.subject || '-'}</TableCell>
                      <TableCell className="text-right font-medium">${book.price.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={book.quantity_in_stock <= book.reorder_threshold ? 'destructive' : 'secondary'}>
                          {book.quantity_in_stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openBookModal(book)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteBook(book.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grade Requirements Tab */}
        <TabsContent value="requirements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Grade Book Requirements</CardTitle>
                  <CardDescription>Set which books each grade needs</CardDescription>
                </div>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {grades.map((grade) => {
                  const gradeBooks = getGradeBooks(grade.id);
                  const totalCost = getGradeTotalCost(grade.id);
                  return (
                    <div key={grade.id} className="p-4 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{grade.name}</h3>
                          <p className="text-sm text-slate-500">
                            {gradeBooks.length} books • Total: ${totalCost.toFixed(2)}
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => openRequirementsModal(grade)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Books
                        </Button>
                      </div>
                      {gradeBooks.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {gradeBooks.map((book) => book && (
                            <Badge key={book.id} variant="secondary" className="text-sm">
                              {book.title} - ${book.price?.toFixed(2)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No books assigned yet</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Stock Tab */}
        <TabsContent value="lowstock">
          <Card>
            <CardHeader>
              <CardTitle className="text-yellow-700">Low Stock Alert</CardTitle>
              <CardDescription>Books that need to be reordered</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockBooks.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>All books are well stocked!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead className="text-center">Current Stock</TableHead>
                      <TableHead className="text-center">Reorder At</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockBooks.map((book) => (
                      <TableRow key={book.id} className="bg-yellow-50">
                        <TableCell className="font-semibold">{book.title}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive">{book.quantity_in_stock}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{book.reorder_threshold}</TableCell>
                        <TableCell className="text-right">${book.price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Book Modal */}
      <Dialog open={isBookModalOpen} onOpenChange={setIsBookModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Title *</Label>
              <Input
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                placeholder="Book title"
              />
            </div>
            <div className="space-y-2">
              <Label>Author</Label>
              <Input
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                placeholder="Author name"
              />
            </div>
            <div className="space-y-2">
              <Label>Publisher</Label>
              <Input
                value={bookForm.publisher}
                onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                placeholder="Publisher"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={bookForm.category} onValueChange={(v) => setBookForm({ ...bookForm, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={bookForm.subject} onValueChange={(v) => setBookForm({ ...bookForm, subject: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(sub => (
                    <SelectItem key={sub.value} value={sub.value}>{sub.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={bookForm.price}
                onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>ISBN</Label>
              <Input
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                placeholder="ISBN number"
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity in Stock</Label>
              <Input
                type="number"
                min="0"
                value={bookForm.quantity_in_stock}
                onChange={(e) => setBookForm({ ...bookForm, quantity_in_stock: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Reorder Threshold</Label>
              <Input
                type="number"
                min="0"
                value={bookForm.reorder_threshold}
                onChange={(e) => setBookForm({ ...bookForm, reorder_threshold: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBook} className="bg-blue-600 hover:bg-blue-700">
              {editingBook ? 'Update' : 'Add Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grade Requirements Modal */}
      <Dialog open={isRequirementsModalOpen} onOpenChange={setIsRequirementsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedGrade?.name} - Book Requirements
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-500 mb-4">
              Select the books required for {selectedGrade?.name} ({academicYear})
            </p>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {books.map((book) => (
                <div
                  key={book.id}
                  onClick={() => toggleBookRequirement(book.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedBooks.includes(book.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{book.title}</p>
                      <p className="text-sm text-slate-500">{book.category} • {book.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${book.price.toFixed(2)}</p>
                      {selectedBooks.includes(book.id) && (
                        <Badge className="bg-blue-600">Selected</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-slate-100 rounded-lg">
              <p className="font-medium">
                Total: {selectedBooks.length} books • $
                {books
                  .filter(b => selectedBooks.includes(b.id))
                  .reduce((sum, b) => sum + b.price, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequirementsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRequirements} className="bg-blue-600 hover:bg-blue-700">
              Save Requirements
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BooksView;
