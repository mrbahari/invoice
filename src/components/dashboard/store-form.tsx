
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
import type { Store, Category, Product, UnitOfMeasurement } from '@/lib/definitions';
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
import { useUser, useFirestore } from '@/firebase';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { DragDropContext, Droppable, Draggable, type DropResult, type DragStart } from '@hello-pangea/dnd';
import { useUpload } from '@/hooks/use-upload';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import useBeforeUnload from '@/hooks/use-before-unload';


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
  level = 0,
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
  openAccordionItems,
  onToggle,
}: {
  categories: Category[];
  level?: number;
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
  openAccordionItems: string[];
  onToggle: (id: string, level: number) => void;
}) => {
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);
  const [newSubCategoryNames, setNewSubCategoryNames] = useState<Record<string, string>>({});

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
    <div className="space-y-1">
      {categories.map((cat, index) => {
        const subCategories = allCategories.filter(sc => sc.parentId === cat.id);
        const hasSubCategories = subCategories.length > 0;
        const isAiLoading = aiLoading === cat.id;
        const isAdding = addingToParentId === cat.id;

        const TriggerContent = (
          <div className="flex items-center gap-2">
            {hasSubCategories && (
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", openAccordionItems.includes(cat.id) && "rotate-180")} />
            )}
            <h4 className="font-semibold">{cat.name}</h4>
          </div>
        );

        return (
          <Draggable draggableId={cat.id} index={index} key={cat.id}>
            {(dragProvided, dragSnapshot) => (
              <div
                ref={dragProvided.innerRef}
                {...dragProvided.draggableProps}
                className={cn('relative group/item', dragSnapshot.isDragging && 'bg-accent/50 rounded-lg shadow-lg opacity-90')}
              >
                <Accordion type="single" collapsible value={openAccordionItems.includes(cat.id) ? cat.id : ""}>
                  <AccordionItem value={cat.id} className="border-b-0">
                     <div className="flex items-center p-2 rounded-md hover:bg-muted/50 w-full" >
                        <div {...dragProvided.dragHandleProps} className="flex items-center pr-2 cursor-grab">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-grow items-center gap-2">
                             {hasSubCategories ? (
                                <AccordionTrigger
                                    onClick={() => onToggle(cat.id, level)}
                                    className="p-0 hover:no-underline flex-grow justify-start"
                                >
                                    {TriggerContent}
                                </AccordionTrigger>
                            ) : (
                                <div className="p-0 flex-grow justify-start flex">
                                    {TriggerContent}
                                </div>
                            )}
                        </div>
                       
                        <div className="flex items-center gap-1 shrink-0">
                          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onAiGenerate(cat); }} disabled={isAiLoading}>{isAiLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <WandSparkles className="w-4 h-4" />}</Button></TooltipTrigger><TooltipContent><p>تولید زیر دسته با AI</p></TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); toggleAddForm(cat.id); }}><PlusCircle className="w-4 h-4 text-green-600" /></Button></TooltipTrigger><TooltipContent><p>افزودن زیردسته</p></TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onStartEdit(cat);}}><Pencil className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>ویرایش</p></TooltipContent></Tooltip>
                          <AlertDialog><AlertDialogTrigger asChild><Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7"><Trash2 className="w-4 h-4 text-destructive" /></Button></TooltipTrigger><TooltipContent><p>حذف</p></TooltipContent></Tooltip></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>حذف دسته</AlertDialogTitle><AlertDialogDescription>آیا از حذف دسته «{cat.name}» و تمام زیردسته‌های آن مطمئن هستید؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(cat.id)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                        </div>
                    </div>

                    {editingCategoryId === cat.id ? (<div className="flex-grow flex gap-2 items-center p-2 pt-0 ml-8"><Input value={editingCategoryName} onClick={(e) => e.stopPropagation()} onChange={(e) => setEditingCategoryName(e.target.value)} /><Button size="icon" variant="ghost" onClick={() => onSaveEdit(cat.id)}><Save className="w-4 h-4" /></Button><Button size="icon" variant="ghost" onClick={onCancelEdit}><X className="w-4 h-4" /></Button></div>) : null}
                    {isAdding && (<div className="flex gap-2 p-2 ml-8"><Input value={newSubCategoryNames[cat.id] || ''} onChange={(e) => setNewSubCategoryNames(prev => ({ ...prev, [cat.id]: e.target.value }))} placeholder={`نام زیردسته برای «${cat.name}»...`} onKeyDown={(e) => e.key === 'Enter' && handleAdd(cat.id)} autoFocus /><Button variant="outline" size="sm" onClick={() => handleAdd(cat.id)}><PlusCircle className="ml-2 h-4 h-4" /> افزودن</Button></div>)}
                    
                    <AccordionContent>
                        <Droppable droppableId={cat.id} type="CATEGORY">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="p-4 pt-2 border-l pr-4 ml-4 space-y-4">
                                    <CategoryTree 
                                        categories={subCategories} 
                                        level={level + 1}
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
                                        openAccordionItems={openAccordionItems}
                                        onToggle={onToggle}/>
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </Draggable>
        );
      })}
    </div>
  );
};


export function StoreForm({ store, onSave, onCancel }: StoreFormProps) {
  const { toast } = useToast();
  const isEditMode = !!store;
  const { user } = useUser();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, addDocument, deleteDocument, deleteDocuments, setData: setGlobalData } = useData();
  const { products, categories, units: unitsOfMeasurement } = data;
  
  // Store fields
  const [initialState, setInitialState] = useState<string | null>(null);
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
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);


  const [isProcessing, setIsProcessing] = useState(false);
  const [aiLoadingCategory, setAiLoadingCategory] = useState<string | null>(null);
  const [isAiLogoLoading, setIsAiLogoLoading] = useState(false);
  
  const { uploadFile, isUploading, progress } = useUpload();

  // State for AI logo prompts
  const [logoPrompts, setLogoPrompts] = useState<string[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  
  const [newUnitName, setNewUnitName] = useState('');
  const [localUnits, setLocalUnits] = useState<UnitOfMeasurement[]>([]);

  useEffect(() => {
    if (store) {
      setLocalUnits(unitsOfMeasurement.filter(u => u.storeId === store.id));
    } else {
      setLocalUnits([]);
    }
  }, [store, unitsOfMeasurement]);

  const isDuplicateUnit = newUnitName.trim() !== '' && localUnits.some(u => u.name === newUnitName.trim());

  
  const isDuplicateCategory = useMemo(() => {
    if (!newCategoryName.trim()) return false;
    return storeCategories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase() && !c.parentId);
  }, [newCategoryName, storeCategories]);

  const isCategoryInputEmpty = newCategoryName.trim() === '';
  
  const isDirty = useMemo(() => {
    const currentState = JSON.stringify({
      name, description, address, phone, logoUrl,
      bankAccountHolder, bankName, bankAccountNumber, bankIban, bankCardNumber,
      storeCategories, localUnits
    });
    return initialState !== null && currentState !== initialState;
  }, [initialState, name, description, address, phone, logoUrl, bankAccountHolder, bankName, bankAccountNumber, bankIban, bankCardNumber, storeCategories, localUnits]);

  useBeforeUnload(isDirty, "تغییرات ذخیره نشده است. آیا مطمئن هستید که می‌خواهید خارج شوید؟");

  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  
  const handleCancel = () => {
    if (isDirty) {
      setIsCancelAlertOpen(true);
    } else {
      onCancel();
    }
  };

  const handleConfirmCancel = () => {
    onCancel();
    setIsCancelAlertOpen(false);
  };

  useEffect(() => {
    if (store) {
      setStoreCategories(data.categories.filter(c => c.storeId === store.id));
      setLocalUnits(data.units.filter(u => u.storeId === store.id));
    } else {
      setStoreCategories([]);
      setLocalUnits([]);
    }
    // Set initial state for dirty check
    const currentData = {
      name: store?.name || '',
      description: store?.description || '',
      address: store?.address || '',
      phone: store?.phone || '',
      logoUrl: store?.logoUrl || null,
      bankAccountHolder: store?.bankAccountHolder || '',
      bankName: store?.bankName || '',
      bankAccountNumber: store?.bankAccountNumber || '',
      bankIban: store?.bankIban || '',
      bankCardNumber: store?.bankCardNumber || '',
      storeCategories: store ? data.categories.filter(c => c.storeId === store.id) : [],
      localUnits: store ? data.units.filter(u => u.storeId === store.id) : [],
    };
    setInitialState(JSON.stringify(currentData));
  }, [store, data.categories, data.units]);


  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const path = `images/shop/logo/${Date.now()}-${file.name}`;
      const downloadedUrl = await uploadFile(file, path);
      if (downloadedUrl) {
        setLogoUrl(downloadedUrl);
      }
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
      
      setIsAiLogoLoading(true);
      try {
          let promptToUse;
          if (logoPrompts.length === 0) {
              const { prompts } = await generateLogoPrompts({ storeName: name, description });
              if (!prompts || prompts.length === 0) throw new Error("Failed to generate prompts.");
              setLogoPrompts(prompts);
              promptToUse = prompts[0];
              setCurrentPromptIndex(1);
          } else {
                promptToUse = logoPrompts[currentPromptIndex];
                setCurrentPromptIndex((prevIndex) => (prevIndex + 1) % logoPrompts.length);
          }
          
          const result = await generateLogo({ prompt: promptToUse, storeName: name });
          if (result.imageUrl) {
              const response = await fetch(result.imageUrl);
              const blob = await response.blob();
              const file = new File([blob], `logo-${Date.now()}.png`, { type: 'image/png' });
              const path = `images/shop/logo/${file.name}`;
              const downloadedUrl = await uploadFile(file, path);
              if (downloadedUrl) {
                  setLogoUrl(downloadedUrl);
              }
          }
      } catch (error) {
          console.error("Error during logo generation process:", error);
      } finally {
          setIsAiLogoLoading(false);
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
            const input: { storeName: string; description: string; parentCategoryPath?: string; existingCategoryNames?: string[] } = {
                storeName: name,
                description,
            };
    
            if (parentCategory) {
                input.parentCategoryPath = getCategoryPath(parentCategory.id, storeCategories);
                input.existingCategoryNames = storeCategories
                    .filter(c => c.parentId === parentCategory.id)
                    .map(c => c.name);
            } else {
                 input.existingCategoryNames = storeCategories
                    .filter(c => !c.parentId)
                    .map(c => c.name);
            }
    
            const result = await generateCategories(input);
            
            if (result && result.categories && result.categories.length > 0) {
                const newCats: Category[] = [];
                const processNode = (node: any, pId?: string) => {
                    if (!node || !node.name) return;
                    
                    const newCat: Category = {
                        id: `temp-${Math.random().toString(36).substr(2, 9)}`,
                        name: node.name,
                        storeId: store?.id || 'temp',
                        parentId: pId || undefined,
                        description: node.description || undefined,
                    };
                    newCats.push(newCat);
                    
                    if (node.children && node.children.length > 0) {
                        const children = Array.isArray(node.children) ? node.children : [node.children];
                        children.forEach((child: any) => processNode(child, newCat.id));
                    }
                };

                result.categories.forEach(node => processNode(node, parentCategory?.id));

                setStoreCategories(prev => [...prev, ...newCats]);
                toast({ variant: 'success', title: `${newCats.length} دسته و زیردسته جدید اضافه شد` });
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


    const buildStoreData = useCallback((): Omit<Store, 'id'> => {
        return {
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
        }
    }, [name, description, address, phone, logoUrl, bankAccountHolder, bankName, bankAccountNumber, bankIban, bankCardNumber]);

  const handleSaveAll = useCallback(async () => {
    if (!name) {
      toast({ variant: 'destructive', title: 'نام فروشگاه الزامی است.' });
      return;
    }
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'برای ذخیره باید وارد شوید.' });
      return;
    }
    
    setIsProcessing(true);

    try {
        const batch = writeBatch(firestore);
        let finalStoreId = store?.id;

        // 1. Handle Store Document
        const storeData = buildStoreData();
        if (isEditMode && finalStoreId) {
            const storeRef = doc(firestore, 'users', user.uid, 'stores', finalStoreId);
            batch.update(storeRef, storeData);
        } else {
            const storeRef = doc(collection(firestore, 'users', user.uid, 'stores'));
            batch.set(storeRef, storeData);
            finalStoreId = storeRef.id;
        }

        if (!finalStoreId) {
            throw new Error("Store ID is not available.");
        }

        // 2. Handle Categories
        const existingCategories = data.categories.filter(c => c.storeId === store?.id);
        const currentCatIds = new Set(storeCategories.map(c => c.id));
        
        const idMap = new Map<string, string>();

        // Process new categories first to get their real IDs
        const newCats = storeCategories.filter(c => c.id.startsWith('temp-'));
        for (const cat of newCats) {
            const newCatRef = doc(collection(firestore, 'users', user.uid, 'categories'));
            idMap.set(cat.id, newCatRef.id);
        }
        
        // Save or Update all categories in the list
        for (const cat of storeCategories) {
            const isNew = cat.id.startsWith('temp-');
            const realId = isNew ? idMap.get(cat.id)! : cat.id;
            const parentId = cat.parentId ? (idMap.get(cat.parentId) || cat.parentId) : undefined;
            
            const catRef = doc(firestore, 'users', user.uid, 'categories', realId);
            
            const finalCatData = {
                name: cat.name,
                storeId: finalStoreId,
                ...(parentId && { parentId }),
                ...(cat.description && { description: cat.description }),
            };
            
            if (isNew) {
                batch.set(catRef, finalCatData);
            } else {
                 batch.update(catRef, finalCatData);
            }
        }


        // Delete categories that are no longer in the list
        for (const cat of existingCategories) {
            if (!currentCatIds.has(cat.id)) {
                const catRef = doc(firestore, 'users', user.uid, 'categories', cat.id);
                batch.delete(catRef);
            }
        }

        // 3. Handle Units
        const existingUnits = unitsOfMeasurement.filter(u => u.storeId === store?.id);
        const currentUnitIds = new Set(localUnits.map(u => u.id));
        
        for (const unit of localUnits) {
            const unitRef = doc(firestore, 'users', user.uid, 'units', unit.id);
            if (unit.id.startsWith('temp-')) {
                const { id, ...unitData } = unit;
                const newUnitRef = doc(collection(firestore, 'users', user.uid, 'units'));
                batch.set(newUnitRef, { ...unitData, storeId: finalStoreId });
            } else {
                 batch.update(unitRef, { name: unit.name, storeId: finalStoreId });
            }
        }

        for (const unit of existingUnits) {
            if (!currentUnitIds.has(unit.id)) {
                const unitRef = doc(firestore, 'users', user.uid, 'units', unit.id);
                batch.delete(unitRef);
            }
        }


        // 4. Commit the batch
        await batch.commit();
        
        toast({ variant: 'success', title: isEditMode ? 'فروشگاه با موفقیت ویرایش شد' : 'فروشگاه با موفقیت ایجاد شد' });
        onSave();

    } catch (error) {
        console.error("Error saving store with batch:", error);
        toast({ variant: 'destructive', title: 'خطا در ذخیره‌سازی', description: 'لطفا دوباره امتحان کنید' });
    } finally {
        setIsProcessing(false);
    }
  }, [name, user, firestore, isEditMode, store, buildStoreData, storeCategories, data.categories, unitsOfMeasurement, localUnits, toast, onSave]);
  
  const handleDeleteAllCategories = useCallback(() => {
    const allCategoryIds = new Set(storeCategories.map(c => c.id));
    const isUsed = products.some(p => p.subCategoryId && allCategoryIds.has(p.subCategoryId));
    
    if (isUsed) {
        toast({
            variant: 'destructive',
            title: 'خطا در حذف',
            description: 'برخی از دسته‌بندی‌ها به محصولات اختصاص داده شده‌اند و قابل حذف نیستند.',
        });
        return;
    }
    
    setStoreCategories([]);
    toast({
        variant: 'default',
        title: 'دسته‌بندی‌ها پاک شدند',
        description: 'تغییرات پس از ذخیره نهایی اعمال خواهد شد.',
    });
  }, [storeCategories, products, toast]);

  
  // Category Handlers
  const handleAddCategory = (parentId?: string) => {
    if (!newCategoryName.trim()) return;

    const isDuplicate = storeCategories.some(c => 
        c.name.toLowerCase() === newCategoryName.trim().toLowerCase() && !c.parentId
    );

    if(isDuplicate) return;

    const newCat: Category = {
      id: `temp-${Math.random().toString(36).substr(2, 9)}`,
      name: newCategoryName.trim(),
      storeId: store?.id || 'temp', // temp id until store is saved
      parentId: parentId || undefined,
    };
    setStoreCategories(prev => [...prev, newCat]);
    setNewCategoryName('');
  };

  const handleAddSubCategory = (parentId: string, name: string) => {
    const newSubCat: Category = {
      id: `temp-${Math.random().toString(36).substr(2, 9)}`,
      name,
      storeId: store?.id || 'temp',
      parentId,
    };
    setStoreCategories(prev => [...prev, newSubCat]);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const allIdsToDelete = new Set<string>();
    const queue = [categoryId];
    allIdsToDelete.add(categoryId);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = storeCategories.filter(c => c.parentId === currentId);
      children.forEach(child => {
        allIdsToDelete.add(child.id);
        queue.push(child.id);
      });
    }

    const isUsed = products.some(p => p.subCategoryId && allIdsToDelete.has(p.subCategoryId));

    if (isUsed) {
      toast({
        variant: 'destructive',
        title: 'خطا در حذف',
        description: 'این دسته یا زیردسته‌های آن به یک یا چند محصول اختصاص داده شده و قابل حذف نیست.'
      });
      return;
    }

    setStoreCategories(prev => prev.filter(c => !allIdsToDelete.has(c.id)));
    toast({
        variant: 'success',
        title: 'حذف موفق',
        description: 'دسته بندی حذف شد. برای نهایی شدن تغییرات را ذخیره کنید.'
    });
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
  
  const handleAccordionToggle = useCallback((itemId: string, level: number) => {
      setOpenAccordionItems(prev => {
          const newOpenItems = prev.slice(0, level);
          if (prev[level] !== itemId) {
              newOpenItems.push(itemId);
          }
          return newOpenItems;
      });
  }, []);

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
            const finalCatData: Partial<Omit<Category, 'id'>> = {
                ...catData,
                storeId: newStoreId,
                ...(catData.parentId && { parentId: catData.parentId }),
                ...(catData.description && { description: catData.description }),
            };
            await addDocument('categories', finalCatData);
        }
    }
    
    setIsProcessing(false);
    toast({ variant: 'success', title: 'کپی از فروشگاه با موفقیت ایجاد شد.' });
    onSave();
  }, [name, buildStoreData, storeCategories, addDocument, toast, onSave]);

  const handleDelete = useCallback(async () => {
      if (!store) return;
  
      setIsProcessing(true);
  
      try {
          const productIdsToDelete = data.products.filter(p => p.storeId === store.id).map(p => p.id);
          const categoryIdsToDelete = data.categories.filter(c => c.storeId === store.id).map(c => c.id);
          const unitIdsToDelete = data.units.filter(u => u.storeId === store.id).map(u => u.id);
  
          if (productIdsToDelete.length > 0) await deleteDocuments('products', productIdsToDelete);
          if (categoryIdsToDelete.length > 0) await deleteDocuments('categories', categoryIdsToDelete);
          if (unitIdsToDelete.length > 0) await deleteDocuments('units', unitIdsToDelete);
          
          await deleteDocument('stores', store.id);
  
          toast({ variant: 'success', title: 'حذف موفق', description: `فروشگاه «${store.name}» و تمام داده‌های آن حذف شد.` });
          onCancel();
      } catch (error) {
          console.error("Error deleting store and its data:", error);
          toast({ variant: 'destructive', title: 'خطا در حذف', description: 'مشکلی در هنگام حذف فروشگاه و داده‌های مرتبط با آن رخ داد.' });
      } finally {
          setIsProcessing(false);
      }
  }, [store, data, deleteDocument, deleteDocuments, onCancel, toast]);

    const handleDragEnd = (result: DropResult) => {
        const { destination, source, draggableId, type } = result;
    
        if (!destination) {
            return;
        }
    
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newItems = Array.from(storeCategories);
        const draggedItemIndex = newItems.findIndex(item => item.id === draggableId);
        if (draggedItemIndex === -1) return;

        const [draggedItem] = newItems.splice(draggedItemIndex, 1);
        
        // Update Parent
        const newParentId = destination.droppableId === 'root' ? undefined : destination.droppableId;
        draggedItem.parentId = newParentId;

        newItems.splice(destination.index, 0, draggedItem);
        
        setStoreCategories(newItems);
    };

    const handleDragStart = (start: DragStart) => {
      if (start.source.droppableId !== 'root') {
          setOpenAccordionItems(prev => {
              if (prev.includes(start.source.droppableId)) return prev;
              return [...prev, start.source.droppableId];
          })
      }
    };
  
  const parentCategories = useMemo(() => {
    return storeCategories
      .filter(c => !c.parentId)
      .sort((a, b) => storeCategories.indexOf(a) - storeCategories.indexOf(b));
  }, [storeCategories]);

  const handleAddUnit = () => {
    const name = newUnitName.trim();
    if (name === '' || isDuplicateUnit) {
        return;
    }
    const newUnit: UnitOfMeasurement = {
      id: `temp-${Date.now()}`,
      name,
      storeId: store?.id || 'temp',
      defaultQuantity: 1,
    };
    setLocalUnits(prev => [...prev, newUnit]);
    setNewUnitName('');
  };

  const handleUnitKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddUnit();
    }
  };

  const handleDeleteUnit = (unitId: string) => {
     setLocalUnits(prev => prev.filter(u => u.id !== unitId));
  };

  return (
    <TooltipProvider>
      <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>لغو تغییرات</AlertDialogTitle>
            <AlertDialogDescription>
              تغییرات ذخیره نشده از بین خواهند رفت. آیا مطمئن هستید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ادامه ویرایش</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} variant="destructive">
              بله، لغو کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="max-w-4xl mx-auto grid gap-6 pb-28">
          <FloatingToolbar pageKey="store-form">
              <div className="flex flex-col items-center gap-1">
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground w-8 h-8">
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
                          <AlertDialogHeader>
                            <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                            <AlertDialogDescription>این عمل غیرقابل بازگشت است و فروشگاه «{store?.name}» را به همراه تمام محصولات، دسته‌بندی‌ها و واحدهای مرتبط با آن برای همیشه حذف می‌کند.</AlertDialogDescription>
                          </AlertDialogHeader>
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
                                {isUploading && <Progress value={progress} className="absolute top-0 left-0 w-full h-1" />}
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
                                          disabled={isAiLogoLoading || isUploading}
                                      >
                                          {isAiLogoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>تولید لوگو با هوش مصنوعی</p></TooltipContent>
                                </Tooltip>
                            </div>

                            <div className='flex-1 grid gap-4'>
                                <div className="flex items-center justify-center w-full">
                                  <Button type="button" variant="outline" className="w-full h-24 border-dashed" onClick={handleUploadClick}>
                                      <div className="flex flex-col items-center justify-center">
                                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                          <p className="text-xs text-muted-foreground"><span className="font-semibold">آپلود لوگوی سفارشی</span></p>
                                      </div>
                                  </Button>
                                  <Input id="dropzone-file" type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
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
            <CardHeader>
                <CardTitle>مدیریت واحدها</CardTitle>
                <CardDescription>
                    واحدهای اندازه‌گیری جدید برای این فروشگاه اضافه کنید یا واحدهای موجود را حذف کنید.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-1.5 mb-4">
                    <Label htmlFor="new-unit-name">نام واحد جدید</Label>
                    <div className="flex items-center gap-2">
                            <Input
                            id="new-unit-name"
                            placeholder="مثال: کارتن"
                            value={newUnitName}
                            onChange={(e) => setNewUnitName(e.target.value)}
                            onKeyDown={handleUnitKeyDown}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleAddUnit}
                            disabled={newUnitName.trim() === '' || isDuplicateUnit}
                        >
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                    </div>
                    {isDuplicateUnit && <p className="text-xs text-destructive">این واحد قبلاً اضافه شده است.</p>}
                </div>
                <div className="flex flex-wrap gap-2 rounded-lg border p-4 min-h-[6rem]">
                    {localUnits.length > 0 ? localUnits.map(unit => (
                        <Badge key={unit.id} variant="secondary" className="text-base font-normal pl-2 pr-3 py-1">
                            <span>{unit.name}</span>
                            <button onClick={() => handleDeleteUnit(unit.id)} className="mr-2 rounded-full p-0.5 hover:bg-destructive/20 text-destructive">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )) : <p className="text-sm text-muted-foreground">هیچ واحدی برای این فروشگاه تعریف نشده است.</p>}
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
                              <Button variant="outline" size="icon" disabled={isProcessing}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>حذف همه دسته‌بندی‌ها</AlertDialogTitle><AlertDialogDescription>آیا مطمئن هستید که می‌خواهید تمام دسته‌بندی‌های این فروشگاه را حذف کنید؟ این عمل غیرقابل بازگشت است.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction onClick={handleDeleteAllCategories} className="bg-destructive hover:bg-destructive/90">حذف همه</AlertDialogAction></AlertDialogFooter>
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
                  <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                      <Droppable droppableId="root" type="CATEGORY">
                          {(provided) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} className="grid gap-4">
                        
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
                                          openAccordionItems={openAccordionItems}
                                          onToggle={handleAccordionToggle}
                                      />
                                  ) : <p className="text-sm text-muted-foreground text-center py-4">هنوز دسته‌ای برای این فروشگاه تعریف نشده است.</p>}
                                  {provided.placeholder}
                              </div>
                          )}
                      </Droppable>
                  </DragDropContext>
              </CardContent>
          </Card>
      </div>
    </TooltipProvider>
  );
}
