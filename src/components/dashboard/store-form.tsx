
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { Upload, Trash2, ArrowRight, PlusCircle, Pencil, Save, GripVertical, WandSparkles, Loader2, Copy } from 'lucide-react';
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
import { FloatingToolbar } from './floating-toolbar';
import { Textarea } from '../ui/textarea';
import { generateLogo, type GenerateLogoInput } from '@/ai/flows/generate-logo-flow';
import { generateLogoPrompts } from '@/ai/flows/generate-logo-prompts';
import type { GenerateLogoPromptsInput } from '@/ai/flows/generate-logo-prompts';
import { cn } from '@/lib/utils';
import { generateCategories, type GenerateCategoriesInput, type GenerateCategoriesOutput } from '@/ai/flows/generate-categories-flow';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';


type StoreFormProps = {
  store?: Store;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (storeId: string) => void;
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
  editingCategoryId: string | null;
  editingCategoryName: string;
  onSaveEdit: (categoryId: string) => void;
  onCancelEdit: () => void;
  setEditingCategoryName: (name: string) => void;
  aiLoading: string | null;
}) => {
  const [newSubCategoryNames, setNewSubCategoryNames] = useState<Record<string, string>>({});
  
  if (categories.length === 0) {
    return null;
  }

  const handleAdd = (pId: string) => {
    const name = newSubCategoryNames[pId]?.trim();
    if (name) {
      onAddSubCategory(pId, name);
      setNewSubCategoryNames(prev => ({ ...prev, [pId]: '' }));
    }
  };

  return (
    <div className="pl-4 space-y-2">
      {categories.map(cat => {
        const subCategories = allCategories.filter(sc => sc.parentId === cat.id);
        const isAiLoading = aiLoading === cat.id;

        return (
          <Collapsible key={cat.id} defaultOpen={true} className="p-2 border rounded-lg bg-muted/20">
            <div className="flex justify-between items-center mb-2">
              {editingCategoryId === cat.id ? (
                <div className="flex-grow flex gap-2 items-center">
                  <Input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} />
                  <Button size="icon" variant="ghost" onClick={() => onSaveEdit(cat.id)}><Save className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={onCancelEdit}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ) : (
                <CollapsibleTrigger className="flex-grow text-right">
                  <h4 className="font-semibold">{cat.name}</h4>
                </CollapsibleTrigger>
              )}
              {!editingCategoryId && (
                <div className="flex gap-1 items-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onAiGenerate(cat)} disabled={isAiLoading}>
                        {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <WandSparkles className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                     <TooltipContent><p>تولید زیر دسته با AI</p></TooltipContent>
                  </Tooltip>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onStartEdit(cat)}><Pencil className="w-4 h-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7"><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>حذف دسته</AlertDialogTitle><AlertDialogDescription>آیا از حذف دسته «{cat.name}» و تمام زیردسته‌های آن مطمئن هستید؟</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter className="grid grid-cols-2 gap-2">
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(cat.id)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
            <CollapsibleContent>
              <div className="mt-2 space-y-2">
                <CategoryTree
                  categories={subCategories}
                  parentId={cat.id}
                  allCategories={allCategories}
                  onAddSubCategory={onAddSubCategory}
                  onDelete={onDelete}
                  onStartEdit={onStartEdit}
                  onAiGenerate={onAiGenerate}
                  editingCategoryId={editingCategoryId}
                  editingCategoryName={editingCategoryName}
                  onSaveEdit={onSaveEdit}
                  onCancelEdit={onCancelEdit}
                  setEditingCategoryName={setEditingCategoryName}
                  aiLoading={aiLoading}
                />
                 <div className="flex gap-2 pt-2">
                  <Input 
                    value={newSubCategoryNames[cat.id] || ''} 
                    onChange={(e) => setNewSubCategoryNames(prev => ({ ...prev, [cat.id]: e.target.value }))} 
                    placeholder="نام زیردسته جدید..." 
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd(cat.id)}
                  />
                  <Button variant="outline" size="sm" onClick={() => handleAdd(cat.id)}><PlusCircle className="ml-2 h-4 h-4" /> افزودن</Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
};


export function StoreForm({ store, onSave, onCancel, onDelete }: StoreFormProps) {
  const { toast } = useToast();
  const isEditMode = !!store;

  const { data, setData } = useData();
  const { stores, categories, products } = data;
  
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
  const [isCategoryGenerating, setIsCategoryGenerating] = useState(false);
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
      setStoreCategories(categories.filter(c => c.storeId === store.id));
    }
  }, [store, categories]);

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
            // Generate prompts if they don't exist yet
            if (logoPrompts.length === 0) {
                const { prompts } = await generateLogoPrompts({ storeName: name, description });
                if (!prompts || prompts.length === 0) {
                    throw new Error("Failed to generate logo prompts.");
                }
                setLogoPrompts(prompts);
                setCurrentPromptIndex(0); // Reset index
                const result = await generateLogo({ prompt: prompts[0], storeName: name });
                if (result.imageUrl) {
                    setLogoUrl(result.imageUrl);
                } else {
                    const seed = encodeURIComponent(`${name}-${Date.now()}`);
                    setLogoUrl(`https://picsum.photos/seed/${seed}/110/110`);
                }
                setCurrentPromptIndex(1); // Set for next click
            } else {
                 const prompt = logoPrompts[currentPromptIndex];
                 const result = await generateLogo({ prompt, storeName: name });
                 if (result.imageUrl) {
                     setLogoUrl(result.imageUrl);
                 } else {
                    const seed = encodeURIComponent(`${name}-${Date.now()}`);
                    setLogoUrl(`https://picsum.photos/seed/${seed}/110/110`);
                 }
                 setCurrentPromptIndex((prevIndex) => (prevIndex + 1) % logoPrompts.length);
            }

        } catch (error) {
            console.error("Error during logo generation process:", error);
             const seed = encodeURIComponent(`${name}-${Date.now()}`);
             setLogoUrl(`https://picsum.photos/seed/${seed}/110/110`);
        } finally {
            setIsLogoGenerating(false);
        }
  };
  
    const getCategoryPath = useCallback((categoryId: string, allCats: Category[]): string => {
        const cat = allCats.find(c => c.id === categoryId);
        if (!cat) return '';
        if (!cat.parentId) return cat.name;
        // Recursively find the parent's path
        const parentPath = getCategoryPath(cat.parentId, allCats);
        return parentPath ? `${parentPath} > ${cat.name}` : cat.name;
    }, []);


    const handleAiGenerateSubCategories = async (parentCategory: Category) => {
        if (!name || !description) {
        toast({
            variant: 'destructive',
            title: 'نام و توضیحات الزامی است',
            description: 'نام و توضیحات فروشگاه برای تولید زیردسته الزامی است.',
        });
        return;
        }

        setAiLoadingCategory(parentCategory.id);
        
        try {
            const categoryPath = getCategoryPath(parentCategory.id, storeCategories);
            const input: GenerateCategoriesInput = { 
                storeName: name, 
                description: `${description}. The context is product categorization. Generate sub-categories for the following parent category path: "${categoryPath}"` 
            };
            const result = await generateCategories(input);

            if (result && result.categories) {
                // We'll take the subcategories from the first category generated, as it's the most relevant
                const subCategoriesToAdd = result.categories[0]?.subCategories || [];
                
                if(subCategoriesToAdd.length === 0) {
                    toast({ variant: 'default', title: 'نتیجه‌ای یافت نشد', description: 'هوش مصنوعی زیردسته جدیدی برای این بخش پیدا نکرد.' });
                    setAiLoadingCategory(null);
                    return;
                }

                const newCats: Category[] = [];
                const existingSubNames = new Set(storeCategories.filter(c => c.parentId === parentCategory.id).map(c => c.name.toLowerCase()));
                
                subCategoriesToAdd.forEach(subCatName => {
                    if (!existingSubNames.has(subCatName.toLowerCase())) {
                        const subCat: Category = {
                            id: `cat-${Math.random().toString(36).substr(2, 9)}`,
                            name: subCatName,
                            storeId: store?.id || 'temp',
                            parentId: parentCategory.id,
                        };
                        newCats.push(subCat);
                        existingSubNames.add(subCatName.toLowerCase());
                    }
                });
                
                if (newCats.length > 0) {
                    setStoreCategories(prev => [...prev, ...newCats]);
                    toast({ variant: 'success', title: `${newCats.length} زیردسته جدید اضافه شد` });
                } else {
                     toast({ variant: 'default', title: 'بدون تغییر', description: 'زیردسته‌های تولید شده از قبل وجود داشتند.' });
                }
            }
        } catch (error) {
            console.error("Error generating sub-categories:", error);
            toast({ variant: 'destructive', title: 'خطا در تولید زیردسته', description: 'لطفاً دوباره تلاش کنید.' });
        } finally {
            setAiLoadingCategory(null);
        }
    };

  const handleGenerateCategories = async () => {
    if (!name || !description) {
      toast({
        variant: 'destructive',
        title: 'نام و توضیحات الزامی است',
        description: 'برای تولید دسته‌بندی، نام و توضیحات فروشگاه را وارد کنید.',
      });
      return;
    }
    setIsCategoryGenerating(true);
    try {
      const input: GenerateCategoriesInput = { storeName: name, description };
      const result = await generateCategories(input);

      if (result && result.categories) {
        const newCats: Category[] = [];
        const existingParentNames = new Set(storeCategories.filter(c => !c.parentId).map(c => c.name.toLowerCase()));

        result.categories.forEach(catData => {
          let parentName = catData.name;
          // Check for duplicate parent category name
          if (existingParentNames.has(parentName.toLowerCase())) {
            parentName = `_${parentName}`; // Add prefix if name exists
          }
          
          const parentId = `cat-${Math.random().toString(36).substr(2, 9)}`;
          const parentCat: Category = {
            id: parentId,
            name: parentName,
            storeId: store?.id || 'temp',
          };
          newCats.push(parentCat);
          existingParentNames.add(parentName.toLowerCase());

          const existingSubNames = new Set(storeCategories.map(c => c.name.toLowerCase()));
          catData.subCategories.forEach(subCatName => {
            let finalSubCatName = subCatName;
            if (existingSubNames.has(finalSubCatName.toLowerCase())) {
                finalSubCatName = `_${finalSubCatName}`;
            }

            const subCat: Category = {
              id: `cat-${Math.random().toString(36).substr(2, 9)}`,
              name: finalSubCatName,
              storeId: store?.id || 'temp',
              parentId: parentId,
            };
            newCats.push(subCat);
            existingSubNames.add(finalSubCatName.toLowerCase());
          });
        });
        
        // Append new categories to existing ones instead of replacing
        setStoreCategories(prev => [...prev, ...newCats]);

        toast({ variant: 'success', title: 'دسته‌بندی‌ها با موفقیت تولید و اضافه شدند' });
      }
    } catch (error) {
      console.error("Error generating categories:", error);
      toast({ variant: 'destructive', title: 'خطا در تولید دسته‌بندی', description: 'لطفاً دوباره تلاش کنید.' });
    } finally {
      setIsCategoryGenerating(false);
    }
  };


  const handleSaveAll = () => {
    if (!name) {
      toast({ variant: 'destructive', title: 'نام فروشگاه الزامی است.' });
      return;
    }
    
    setIsProcessing(true);

    const storeId = store?.id || `store-${Math.random().toString(36).substr(2, 9)}`;

    const newOrUpdatedStore: Store = {
      id: storeId,
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
    };
    
    // Update store
    let updatedStores;
    if (isEditMode) {
      updatedStores = stores.map(s => s.id === storeId ? newOrUpdatedStore : s);
    } else {
      updatedStores = [newOrUpdatedStore, ...stores];
    }

    // Update categories (delete removed, update existing, add new)
    const existingStoreCategoryIds = categories.filter(c => c.storeId === storeId).map(c => c.id);
    const currentCategoryIds = storeCategories.map(c => c.id);
    
    const otherStoresCategories = categories.filter(c => c.storeId !== storeId);
    const finalCategories = [...otherStoresCategories, ...storeCategories.map(c => ({...c, storeId}))];
    
    setData(prev => ({
        ...prev,
        stores: updatedStores,
        categories: finalCategories,
    }));

    toast({ variant: 'success', title: isEditMode ? 'فروشگاه با موفقیت ویرایش شد' : 'فروشگاه با موفقیت ایجاد شد' });
    setIsProcessing(false);
    onSave();
  };

  const handleDelete = () => {
    if (!store) return;
    // Add checks for related products/invoices if needed
    onDelete(store.id);
    toast({ title: 'فروشگاه حذف شد' });
  };
  
  // Category Handlers
  const handleAddCategory = () => {
    if (!newCategoryName.trim() || isDuplicateCategory) return;
    const newCat: Category = {
      id: `cat-${Math.random().toString(36).substr(2, 9)}`,
      name: newCategoryName.trim(),
      storeId: store?.id || 'temp', // temp id until store is saved
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

    let allIdsToDelete = new Set<string>([categoryId]);
    let queue = [categoryId];

    while(queue.length > 0) {
        const currentId = queue.shift()!;
        const children = storeCategories.filter(c => c.parentId === currentId);
        children.forEach(child => {
            if (products.some(p => p.subCategoryId === child.id)) {
                // If a subcategory has products, we should probably stop the whole deletion.
                // For now, we'll just not delete it or its children.
                // A better UX might be to warn the user.
            } else {
                allIdsToDelete.add(child.id);
                queue.push(child.id);
            }
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


  const parentCategories = useMemo(() => storeCategories.filter(c => !c.parentId), [storeCategories]);

  return (
    <TooltipProvider>
    <div className="max-w-4xl mx-auto grid gap-6 pb-28">
        <FloatingToolbar pageKey="store-form">
            <div className="flex flex-col items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="text-muted-foreground w-10 h-10">
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>بازگشت به لیست</p></TooltipContent>
                </Tooltip>
                {isEditMode && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={isProcessing} className="text-destructive hover:bg-destructive/10 hover:text-destructive w-10 h-10">
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left"><p>حذف فروشگاه</p></TooltipContent>
                            </Tooltip>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                                <AlertDialogDescription>این عمل غیرقابل بازگشت است و فروشگاه «{store.name}» و تمام دسته‌بندی‌های آن را برای همیشه حذف می‌کند.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="grid grid-cols-2 gap-2">
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
            <Separator orientation="horizontal" className="w-8" />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button onClick={handleSaveAll} disabled={isProcessing} variant="ghost" size="icon" className="w-12 h-12 bg-green-600 text-white hover:bg-green-700">
                        <Save className="h-6 w-6" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>ذخیره کل تغییرات</p></TooltipContent>
            </Tooltip>
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
            <CardContent className="grid gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="bank-iban">شماره شبا (IBAN)</Label>
                    <Input id="bank-iban" value={bankIban} onChange={(e) => setBankIban(e.target.value)} placeholder="مثال: IR..." dir="ltr" className="text-left" />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                 <div>
                    <CardTitle>مدیریت دسته‌بندی‌ها</CardTitle>
                    <CardDescription>دسته‌ها و زیردسته‌های محصولات این فروشگاه را تعریف کنید.</CardDescription>
                 </div>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={handleGenerateCategories}
                            disabled={isCategoryGenerating}
                        >
                            {isCategoryGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>تولید دسته‌بندی با هوش مصنوعی</p></TooltipContent>
                  </Tooltip>
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
                        onClick={handleAddCategory}
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

    