
'use client';

import { useState, useEffect, useMemo, useRef, useCallback, ChangeEvent } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Store, Category, Product } from '@/lib/definitions';
import { Upload, Trash2, ArrowRight, PlusCircle, Pencil, Save, GripVertical, WandSparkles, Loader2, Copy, ChevronsUpDown, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '../ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useData } from '@/context/data-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '../ui/textarea';
import { generateLogo, type GenerateLogoInput } from '@/ai/flows/generate-logo-flow';
import { generateLogoPrompts } from '@/ai/flows/generate-logo-prompts';
import type { GenerateLogoPromptsInput } from '@/ai/flows/generate-logo-prompts';
import { cn } from '@/lib/utils';
import { generateCategories } from '@/ai/flows/generate-categories-flow';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FloatingToolbar } from './floating-toolbar';
import { motion, AnimatePresence } from 'framer-motion';


type StoreFormProps = {
  store?: Store;
  onSave: () => void;
  onCancel: () => void;
};

// =================================================================
// CategoryTree Component for Recursive Rendering
// =================================================================
const CategoryTree = ({
  categories,
  parentId = undefined,
  allCategories,
  onAddSubCategory,
  onDelete,
  onStartEdit,
  onAiGenerate,
  onToggle,
  editingCategoryId,
  editingCategoryName,
  onSaveEdit,
  onCancelEdit,
  setEditingCategoryName,
  aiLoading,
}: {
  categories: Category[];
  parentId?: string;
  allCategories: Category[];
  onAddSubCategory: (parentId: string, name: string) => void;
  onDelete: (categoryId: string) => void;
  onStartEdit: (category: Category) => void;
  onAiGenerate: (parentCategory: Category) => void;
  onToggle: (categoryId: string, element: HTMLDivElement | null) => void;
  editingCategoryId: string | null;
  editingCategoryName: string;
  onSaveEdit: (categoryId: string) => void;
  onCancelEdit: () => void;
  setEditingCategoryName: (name: string) => void;
  aiLoading: string | null;
}) => {
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);
  const [newSubCategoryNames, setNewSubCategoryNames] = useState<Record<string, string>>({});
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  if (categories.length === 0) {
    return null;
  }
  
  const handleAdd = (pId: string) => {
    const name = newSubCategoryNames[pId]?.trim();
    if (name) {
      onAddSubCategory(pId, name);
      setNewSubCategoryNames(prev => ({ ...prev, [pId]: '' }));
      setAddingToParentId(null); // Close form on add
    }
  };

  const toggleAddForm = (categoryId: string) => {
    setAddingToParentId(prev => (prev === categoryId ? null : categoryId));
  };


  return (
    <Accordion type="single" collapsible className="w-full">
      <AnimatePresence>
        {categories.map(cat => {
          const subCategories = allCategories.filter(sc => sc.parentId === cat.id);
          const hasSubCategories = subCategories.length > 0;
          const isAiLoading = aiLoading === cat.id;
          const isAdding = addingToParentId === cat.id;

          return (
             <motion.div
                key={cat.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, x: -50, transition: { duration: 0.3 } }}
                transition={{ duration: 0.3, delay: 0.1 * categories.indexOf(cat) }}
              >
            <AccordionItem value={cat.id} className="border-b-0 mt-2" ref={el => itemRefs.current[cat.id] = el}>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div className="flex items-center gap-1">
                      <Tooltip>
                          <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onAiGenerate(cat); }} disabled={isAiLoading}>
                              {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <WandSparkles className="w-4 h-4" />}
                          </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>تولید زیر دسته با AI</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); toggleAddForm(cat.id); }}>
                                  <PlusCircle className="w-4 h-4 text-green-600" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>افزودن زیردسته</p></TooltipContent>
                      </Tooltip>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onStartEdit(cat);}}><Pencil className="w-4 h-4" /></Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => e.stopPropagation()}><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>حذف دسته</AlertDialogTitle><AlertDialogDescription>آیا از حذف دسته «{cat.name}» و تمام زیردسته‌های آن مطمئن هستید؟</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>انصراف</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(cat.id)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
                          </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  </div>

                  <AccordionTrigger
                      className="p-2 flex-1 justify-end hover:no-underline"
                      onClick={(e) => {
                          if (!hasSubCategories) {
                            e.preventDefault();
                            return;
                          }
                          if (itemRefs.current[cat.id]) {
                              onToggle(cat.id, itemRefs.current[cat.id]);
                          }
                      }}
                  >
                      <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{cat.name}</h4>
                          {hasSubCategories && <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />}
                      </div>
                  </AccordionTrigger>
              </div>

              {editingCategoryId === cat.id ? (
                <div className="flex-grow flex gap-2 items-center p-2 pt-0 ml-8">
                  <Input value={editingCategoryName} onClick={(e) => e.stopPropagation()} onChange={(e) => setEditingCategoryName(e.target.value)} />
                    <Button size="icon" variant="ghost" onClick={() => onSaveEdit(cat.id)}><Save className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={onCancelEdit}><X className="w-4 h-4" /></Button>
                </div>
              ) : null}

              {isAdding && (
                    <div className="flex gap-2 p-2 ml-8">
                      <Input 
                        value={newSubCategoryNames[cat.id] || ''} 
                        onChange={(e) => setNewSubCategoryNames(prev => ({ ...prev, [cat.id]: e.target.value }))} 
                        placeholder={`نام زیردسته برای «${cat.name}»...`}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd(cat.id)}
                        autoFocus
                      />
                      <Button variant="outline" size="sm" onClick={() => handleAdd(cat.id)}><PlusCircle className="ml-2 h-4 h-4" /> افزودن</Button>
                  </div>
              )}

              <AccordionContent>
                  <div className="p-4 pt-2 border rounded-lg bg-muted/30 ml-2 mr-8 space-y-4">
                      <CategoryTree
                          categories={subCategories}
                          parentId={cat.id}
                          allCategories={allCategories}
                          onAddSubCategory={onAddSubCategory}
                          onDelete={onDelete}
                          onStartEdit={onStartEdit}
                          onAiGenerate={onAiGenerate}
                          onToggle={onToggle}
                          editingCategoryId={editingCategoryId}
                          editingCategoryName={editingCategoryName}
                          onSaveEdit={onSaveEdit}
                          onCancelEdit={onCancelEdit}
                          setEditingCategoryName={setEditingCategoryName}
                          aiLoading={aiLoading}
                      />
                  </div>
              </AccordionContent>
            </AccordionItem>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </Accordion>
  );
};


export function StoreForm({ store, onSave, onCancel }: StoreFormProps) {
  const { toast } = useToast();
  const isEditMode = !!store;

  const { data, setData, addDocument, updateDocument, deleteDocument } = useData();
  const { products } = data;
  
  const [name, setName] = useState(store?.name || '');
  const [description, setDescription] = useState(store?.description || '');
  const [address, setAddress] = useState(store?.address || '');
  const [phone, setPhone] = useState(store?.phone || '');
  const [logoUrl, setLogoUrl] = useState<string | null>(store?.logoUrl || null);
  
  const [bankAccountHolder, setBankAccountHolder] = useState(store?.bankAccountHolder || '');
  const [bankName, setBankName] = useState(store?.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(store?.bankAccountNumber || '');
  const [bankIban, setBankIban] = useState(store?.bankIban || '');
  const [bankCardNumber, setBankCardNumber] = useState(store?.bankCardNumber || '');

  // Validation states
  const [nameError, setNameError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);

  // Category Management State
  const [storeCategories, setStoreCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');


  const [isProcessing, setIsProcessing] = useState(false);
  const [isLogoGenerating, setIsLogoGenerating] = useState(false);
  const [aiLoadingCategory, setAiLoadingCategory] = useState<string | null>(null);
  
  // State for AI logo prompts
  const [logoPrompts, setLogoPrompts] = useState<string[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  const isDuplicateCategory = useMemo(() => {
    if (!newCategoryName.trim()) return false;
    return storeCategories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase() && !c.parentId);
  }, [newCategoryName, storeCategories]);

  const isCategoryInputEmpty = newCategoryName.trim() === '';


  useEffect(() => {
    if (store) {
      setStoreCategories(data.categories.filter(c => c.storeId === store.id));
    } else {
      setStoreCategories([]);
    }
  }, [store, data.categories]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateLogo = async () => {
      let hasError = false;
      if (!name) {
          setNameError(true);
          hasError = true;
      }
      if (!description) {
          setDescriptionError(true);
          hasError = true;
      }

      if(hasError) {
        toast({
            variant: 'destructive',
            title: 'نام و توضیحات الزامی است',
            description: 'برای تولید لوگو با هوش مصنوعی، هر دو فیلد نام و توضیحات فروشگاه باید پر شوند.',
        });
        return;
      }

      setIsLogoGenerating(true);
       try {
            if (logoPrompts.length === 0) {
                const { prompts } = await generateLogoPrompts({ storeName: name, description });
                if (!prompts || prompts.length === 0) throw new Error("Failed to generate prompts.");
                setLogoPrompts(prompts);
                setCurrentPromptIndex(0);
                const result = await generateLogo({ prompt: prompts[0], storeName: name });
                if (result.imageUrl) setLogoUrl(result.imageUrl);
                setCurrentPromptIndex(1);
            } else {
                 const prompt = logoPrompts[currentPromptIndex];
                 const result = await generateLogo({ prompt, storeName: name });
                 if (result.imageUrl) setLogoUrl(result.imageUrl);
                 setCurrentPromptIndex((prevIndex) => (prevIndex + 1) % logoPrompts.length);
            }

        } catch (error) {
            console.error("Error during logo generation process:", error);
        } finally {
            setIsLogoGenerating(false);
        }
  };
  
    const getCategoryPath = useCallback((categoryId: string, allCats: Category[]): string => {
        const cat = allCats.find(c => c.id === categoryId);
        if (!cat) return '';
        if (!cat.parentId) return cat.name;
        const parentCat = allCats.find(c => c.id === cat.parentId);
        if (!parentCat) return cat.name;
        const parentPath = getCategoryPath(parentCat.id, allCats);
        return parentPath ? `${parentPath} > ${cat.name}` : cat.name;
    }, []);

    const handleAiGenerateSubCategories = async (parentCategory?: Category) => {
        if (!name || !description) {
            toast({
                variant: 'destructive',
                title: 'نام و توضیحات الزامی است',
                description: 'نام و توضیحات فروشگاه برای تولید دسته‌بندی الزامی است.',
            });
            return;
        }
    
        const loaderId = parentCategory ? parentCategory.id : 'main';
        setAiLoadingCategory(loaderId);
    
        try {
            const input: { storeName: string; description: string; parentCategoryPath?: string; existingSubCategories?: string[] } = {
                storeName: name,
                description,
            };
    
            if (parentCategory) {
                input.parentCategoryPath = getCategoryPath(parentCategory.id, storeCategories);
                input.existingSubCategories = storeCategories
                    .filter(c => c.parentId === parentCategory.id)
                    .map(c => c.name);
            }
    
            const result = await generateCategories(input);
            
            if (result && result.categories && result.categories.length > 0) {
                const newCats = result.categories.map(catName => ({
                    id: `cat-${Math.random().toString(36).substr(2, 9)}`,
                    name: catName,
                    storeId: store?.id || 'temp',
                    parentId: parentCategory?.id,
                }));
    
                setStoreCategories(prev => [...prev, ...newCats]);
                toast({ variant: 'success', title: `${newCats.length} دسته جدید اضافه شد` });
            } else {
                 toast({ variant: 'default', title: 'نتیجه‌ای یافت نشد', description: 'هوش مصنوعی نتوانست دسته‌بندی جدیدی پیشنهاد دهد.' });
            }
        } catch (error) {
            console.error("Error generating categories:", error);
            toast({ variant: 'destructive', title: 'خطا در تولید دسته‌بندی', description: 'لطفاً دوباره تلاش کنید.' });
        } finally {
            setAiLoadingCategory(null);
        }
    };


const updateCategoriesForStore = async (storeId: string) => {
    const existingCategories = data.categories.filter(c => c.storeId === storeId);
    const existingCategoryIds = new Set(existingCategories.map(c => c.id));
    const currentCategoryIds = new Set(storeCategories.map(c => c.id));

    // Categories to delete
    for (const cat of existingCategories) {
        if (!currentCategoryIds.has(cat.id)) {
            await deleteDocument('categories', cat.id);
        }
    }

    // Categories to add or update
    for (const cat of storeCategories) {
        if (existingCategoryIds.has(cat.id)) {
            // Update existing
            await updateDocument('categories', cat.id, { ...cat, storeId });
        } else {
            // Add new
            const { id, ...catData } = cat;
            await addDocument('categories', { ...catData, storeId });
        }
    }
};

  const buildStoreData = useCallback((): Omit<Store, 'id'> => ({
    name,
    description,
    address,
    phone,
    logoUrl: logoUrl || `https://picsum.photos/seed/${Math.random()}/110/110`,
    bankAccountHolder,
    bankName,
    bankAccountNumber,
    bankIban,
    bankCardNumber,
  }), [name, description, address, phone, logoUrl, bankAccountHolder, bankName, bankAccountNumber, bankIban, bankCardNumber]);

  const handleSaveAll = useCallback(async () => {
    if (!name) {
      toast({ variant: 'destructive', title: 'نام فروشگاه الزامی است.' });
      return;
    }
    
    setIsProcessing(true);

    const storeData = buildStoreData();

    if (isEditMode && store) {
        await updateDocument('stores', store.id, storeData);
        await updateCategoriesForStore(store.id);
        toast({ variant: 'success', title: 'فروشگاه با موفقیت ویرایش شد' });
    } else {
        const newStoreId = await addDocument('stores', storeData);
        if (newStoreId) {
            // Now add categories with the new storeId
            for (const category of storeCategories) {
                const { id, ...catData } = category;
                await addDocument('categories', { ...catData, storeId: newStoreId });
            }
            toast({ variant: 'success', title: 'فروشگاه با موفقیت ایجاد شد' });
        }
    }

    setIsProcessing(false);
    onSave();
  }, [name, isEditMode, store, buildStoreData, storeCategories, toast, onSave, updateDocument, addDocument]);
  
  const handleDeleteAllCategories = useCallback(() => {
    setStoreCategories([]);
  }, []);

  
  // Category Handlers
  const handleAddCategory = (parentId?: string) => {
    if (!newCategoryName.trim()) return;

    const isDuplicate = storeCategories.some(c => 
        c.name.toLowerCase() === newCategoryName.trim().toLowerCase() && c.parentId === parentId
    );

    if(isDuplicate) return;

    const newCat: Category = {
      id: `cat-${Math.random().toString(36).substr(2, 9)}`,
      name: newCategoryName.trim(),
      storeId: store?.id || 'temp', // temp id until store is saved
      parentId,
    };
    setStoreCategories(prev => [...prev, newCat]);
    setNewCategoryName('');
  };

  const handleAddSubCategory = (parentId: string, name: string) => {
    const newSubCat: Category = {
      id: `cat-${Math.random().toString(36).substr(2, 9)}`,
      name,
      storeId: store?.id || 'temp',
      parentId,
    };
    setStoreCategories(prev => [...prev, newSubCat]);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (products.some(p => p.subCategoryId === categoryId)) {
        toast({ variant: 'destructive', title: 'خطا', description: 'این دسته به یک یا چند محصول اختصاص داده شده است و قابل حذف نیست.' });
        return;
    }

    let allIdsToDelete = new Set<string>();
    let queue = [categoryId];
    allIdsToDelete.add(categoryId);

    while(queue.length > 0) {
        const currentId = queue.shift()!;
        const children = storeCategories.filter(c => c.parentId === currentId);
        children.forEach(child => {
            allIdsToDelete.add(child.id);
            queue.push(child.id);
        });
    }

    setStoreCategories(prev => prev.filter(c => !allIdsToDelete.has(c.id)));
  };
  
  const handleStartEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };
  
  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const handleSaveCategoryEdit = (categoryId: string) => {
    if (!editingCategoryName.trim()) return;
    setStoreCategories(prev => prev.map(c => 
      c.id === categoryId ? { ...c, name: editingCategoryName.trim() } : c
    ));
    handleCancelEditCategory();
  };
  
  const handleAccordionToggle = (categoryId: string, element: HTMLDivElement | null) => {
    if(element) {
        setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300); // Delay to allow accordion animation to finish
    }
  };

  const handleSaveAsCopy = useCallback(async () => {
    if (!name) {
      toast({ variant: 'destructive', title: 'نام فروشگاه الزامی است.' });
      return;
    }
    
    setIsProcessing(true);

    const storeData = buildStoreData();
    const newStoreId = await addDocument('stores', storeData);

    if (newStoreId) {
        for (const category of storeCategories) {
            const { id, ...catData } = category;
            await addDocument('categories', { ...catData, storeId: newStoreId });
        }
    }
    
    setIsProcessing(false);
    toast({ variant: 'success', title: 'کپی از فروشگاه با موفقیت ایجاد شد.' });
    onSave();
  }, [name, buildStoreData, storeCategories, addDocument, toast, onSave]);

  const handleDelete = useCallback(async () => {
      if (!store) return;
      const storeHasProducts = data.products.some(p => p.storeId === store.id);
      if (storeHasProducts) {
          toast({ variant: 'destructive', title: 'خطا', description: 'این فروشگاه دارای محصول است و قابل حذف نیست.' });
          return;
      }
      
      const categoryIdsToDelete = data.categories.filter(c => c.storeId === store.id).map(c => c.id);
      for (const catId of categoryIdsToDelete) {
          await deleteDocument('categories', catId);
      }
      
      await deleteDocument('stores', store.id);

      toast({ variant: 'success', title: 'فروشگاه حذف شد' });
      onCancel();
  }, [store, data.products, data.categories, deleteDocument, toast, onCancel]);

  const parentCategories = useMemo(() => storeCategories.filter(c => !c.parentId), [storeCategories]);

  return (
    <TooltipProvider>
    <div className="max-w-4xl mx-auto grid gap-6 pb-28">
         <FloatingToolbar pageKey="store-form">
            <div className="flex flex-col items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="text-muted-foreground w-8 h-8">
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>بازگشت به لیست</p></TooltipContent>
                </Tooltip>
                {isEditMode && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                variant="ghost" 
                                size="icon" 
                                disabled={isProcessing} 
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive w-8 h-8"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left"><p>حذف فروشگاه</p></TooltipContent>
                        </Tooltip>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle><AlertDialogDescription>این عمل غیرقابل بازگشت است و فروشگاه «{store?.name}» را برای همیشه حذف می‌کند.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className='bg-destructive hover:bg-destructive/90'>حذف</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                )}
                {isEditMode && (
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={handleSaveAsCopy} disabled={isProcessing} className="w-8 h-8">
                            <Copy className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>ذخیره با عنوان جدید</p></TooltipContent>
                    </Tooltip>
                )}
            </div>
            <Separator orientation="horizontal" className="w-6" />
            <div className="flex flex-col items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button onClick={handleSaveAll} disabled={isProcessing} variant="ghost" size="icon" className="w-10 h-10 bg-green-600 text-white hover:bg-green-700">
                            <Save className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>ذخیره کل تغییرات</p></TooltipContent>
                </Tooltip>
            </div>
        </FloatingToolbar>
        <Card>
            <CardHeader>
                <div className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>
                            {isEditMode ? `ویرایش فروشگاه: ${store?.name}` : 'افزودن فروشگاه جدید'}
                        </CardTitle>
                        <CardDescription>
                           اطلاعات اصلی و دسته‌بندی‌های فروشگاه را مدیریت کنید.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="store-name">نام فروشگاه</Label>
                        <Input id="store-name" value={name} onChange={(e) => {setName(e.target.value); setNameError(false);}} placeholder="مثال: دکوربند" required className={cn(nameError && 'border-destructive')} />
                    </div>
                     <div className="grid gap-3">
                        <Label htmlFor="store-phone">تلفن</Label>
                        <Input id="store-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="مثال: ۰۲۱-۸۸۸۸۴۴۴۴" />
                    </div>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="store-description">توضیحات فروشگاه</Label>
                    <Textarea id="store-description" value={description} onChange={(e) => {setDescription(e.target.value); setDescriptionError(false);}} placeholder="توضیح مختصری درباره زمینه فعالیت فروشگاه..." className={cn(descriptionError && 'border-destructive')} />
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="store-address">آدرس</Label>
                    <Input id="store-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="مثال: میدان ولیعصر، برج فناوری" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-4">
                        <Label>لوگوی فروشگاه</Label>
                        <div className='flex items-start gap-6'>
                          <div className="relative w-24 h-24">
                              {logoUrl ? (
                                <Image src={logoUrl} alt="پیش‌نمایش لوگو" layout="fill" objectFit="contain" className="rounded-md border p-2 bg-white" key={logoUrl} unoptimized />
                              ) : <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                                      <span className="text-xs text-muted-foreground">پیش‌نمایش</span>
                                  </div>}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full bg-background"
                                        onClick={handleGenerateLogo}
                                        disabled={isLogoGenerating}
                                    >
                                        {isLogoGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>تولید لوگو با هوش مصنوعی</p></TooltipContent>
                              </Tooltip>
                          </div>

                          <div className='flex-1 grid gap-4'>
                              <div className="flex items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground"><span className="font-semibold">آپلود لوگوی سفارشی</span></p>
                                    </div>
                                    <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                </label>
                              </div> 
                          </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>اطلاعات حساب بانکی</CardTitle>
                <CardDescription>این اطلاعات به صورت خودکار در فاکتورهای این فروشگاه نمایش داده می‌شود.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="bank-account-holder">نام صاحب حساب</Label>
                        <Input id="bank-account-holder" value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} placeholder="مثال: اسماعیل بهاری" />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="bank-name">نام بانک</Label>
                        <Input id="bank-name" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="مثال: بانک سامان" />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="bank-account-number">شماره حساب</Label>
                        <Input id="bank-account-number" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="اختیاری" />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="bank-card-number">شماره کارت</Label>
                        <Input id="bank-card-number" value={bankCardNumber} onChange={(e) => setBankCardNumber(e.target.value)} placeholder="اختیاری" />
                    </div>
                    <div className="grid gap-3 col-span-2">
                        <Label htmlFor="bank-iban">شماره شبا (IBAN)</Label>
                        <Input id="bank-iban" value={bankIban} onChange={(e) => setBankIban(e.target.value)} placeholder="مثال: IR..." dir="ltr" className="text-left" />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                 <div>
                    <CardTitle>مدیریت دسته‌بندی‌ها</CardTitle>
                    <CardDescription>دسته‌ها و زیردسته‌های محصولات این فروشگاه را تعریف کنید.</CardDescription>
                 </div>
                 <div className='flex items-center gap-2'>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => handleAiGenerateSubCategories()}
                                disabled={aiLoadingCategory === 'main'}
                            >
                                {aiLoadingCategory === 'main' ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>تولید دسته‌بندی با هوش مصنوعی</p></TooltipContent>
                    </Tooltip>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>حذف همه دسته‌بندی‌ها</p></TooltipContent>
                            </Tooltip>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>حذف همه دسته‌بندی‌ها</AlertDialogTitle><AlertDialogDescription>آیا مطمئن هستید که می‌خواهید تمام دسته‌بندی‌های این فروشگاه را حذف کنید؟ این عمل غیرقابل بازگشت است.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAllCategories} className="bg-destructive hover:bg-destructive/90">حذف همه</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 </div>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="relative">
                    <Input 
                        value={newCategoryName} 
                        onChange={(e) => setNewCategoryName(e.target.value)} 
                        placeholder="نام دسته اصلی جدید..."
                        className="pl-24"
                    />
                    <Button 
                        onClick={() => handleAddCategory()}
                        disabled={isCategoryInputEmpty || isDuplicateCategory}
                        className={cn(
                            "absolute left-1 top-1/2 -translate-y-1/2 h-8 w-20",
                            isCategoryInputEmpty && "bg-muted-foreground",
                            !isCategoryInputEmpty && !isDuplicateCategory && "bg-green-600 hover:bg-green-700",
                            isDuplicateCategory && "bg-red-600 hover:bg-red-700"
                        )}
                    >
                        {isCategoryInputEmpty ? 'افزودن' : (isDuplicateCategory ? 'تکراری' : 'افزودن')}
                    </Button>
                </div>
                <Separator />
                <div className="grid gap-4">
                    {parentCategories.length > 0 ? (
                        <CategoryTree 
                            categories={parentCategories}
                            allCategories={storeCategories}
                            onAddSubCategory={handleAddSubCategory}
                            onDelete={handleDeleteCategory}
                            onStartEdit={handleStartEditCategory}
                            onAiGenerate={handleAiGenerateSubCategories}
                            onToggle={handleAccordionToggle}
                            editingCategoryId={editingCategoryId}
                            editingCategoryName={editingCategoryName}
                            onSaveEdit={handleSaveCategoryEdit}
                            onCancelEdit={handleCancelEditCategory}
                            setEditingCategoryName={setEditingCategoryName}
                            aiLoading={aiLoadingCategory}
                        />
                    ) : <p className="text-sm text-muted-foreground text-center py-4">هنوز دسته‌ای برای این فروشگاه تعریف نشده است.</p>}
                </div>
            </CardContent>
        </Card>
    </div>
    </TooltipProvider>
  );
}
