import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch, deleteDoc, setDoc } from 'firebase/firestore';
import type { Category, Customer, Invoice, Product, UnitOfMeasurement, Store } from '@/lib/definitions';
import { getDefaultData } from '@/lib/default-data';

type CollectionName = 'stores' | 'categories' | 'products' | 'customers' | 'invoices' | 'units';

// Generic function to fetch a collection
export async function getCollection<T>(userId: string, collectionName: CollectionName): Promise<T[]> {
  const querySnapshot = await getDocs(collection(db, 'users', userId, collectionName));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

// Function to seed initial data for a new user
export async function seedInitialData(userId: string) {
  const defaultData = getDefaultData();
  const batch = writeBatch(db);

  for (const [collectionName, data] of Object.entries(defaultData)) {
    data.forEach((item: any) => {
      const docRef = doc(db, 'users', userId, collectionName, item.id);
      batch.set(docRef, item);
    });
  }

  await batch.commit();
}


export async function deleteAllUserData(userId: string) {
    const collectionNames: CollectionName[] = ['invoices', 'products', 'customers', 'categories', 'stores', 'units'];
    for (const collectionName of collectionNames) {
        const querySnapshot = await getDocs(collection(db, 'users', userId, collectionName));
        const batch = writeBatch(db);
        querySnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
}

// Generic function to add a document with a generated ID
export async function addDocToCollection<T extends { id?: string }>(userId: string, collectionName: CollectionName, data: T) {
    const newDocRef = doc(collection(db, 'users', userId, collectionName));
    const docWithId = { ...data, id: newDocRef.id };
    await setDoc(newDocRef, data);
    return docWithId;
}

// Generic function to update a document
export async function updateDocInCollection<T>(userId: string, collectionName: CollectionName, docId: string, data: Partial<T>) {
    const docRef = doc(db, 'users', userId, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
}

// Generic function to delete a document
export async function deleteDocFromCollection(userId: string, collectionName: CollectionName, docId: string) {
    const docRef = doc(db, 'users', userId, collectionName, docId);
    await deleteDoc(docRef);
}


// Function to restore data from a backup
export async function restoreDataFromBackup(userId: string, backupData: any) {
  await deleteAllUserData(userId);
  const batch = writeBatch(db);
  
  const { stores, categories, products, customers, invoices, units } = migrateAndPrepareData(backupData);

  const seed = async (collectionName: CollectionName, data: any[]) => {
      if (data && data.length > 0) {
          for (const item of data) {
              if (item.id) {
                  const docRef = doc(db, 'users', userId, collectionName, item.id);
                  batch.set(docRef, item);
              }
          }
      }
  };

  await seed('stores', stores);
  await seed('categories', categories);
  await seed('products', products);
  await seed('customers', customers);
  await seed('invoices', invoices);
  await seed('units', units);

  await batch.commit();
}


// This function checks for the old data structure and migrates it to the new one.
function migrateAndPrepareData(data: any): { stores: Store[], categories: Category[], products: Product[], customers: Customer[], invoices: Invoice[], units: UnitOfMeasurement[] } {
    let stores: Store[] = data.stores || [];
    let categories: Category[] = data.categories || [];
    const products: Product[] = data.products || [];
    const customers: Customer[] = data.customers || [];
    const invoices: Invoice[] = data.invoices || [];
    const units: UnitOfMeasurement[] = data.units || [];

    // Migration logic for old backup format
    const oldStoresCategories = categories.filter((cat: any) => cat.storeName);
    if (oldStoresCategories.length > 0) {
        const newStores: Store[] = oldStoresCategories.map((cat: any) => ({
            id: `store-${cat.id.split('-')[1]}`,
            name: cat.storeName,
            address: cat.storeAddress,
            phone: cat.storePhone,
            logoUrl: cat.logoUrl,
        }));
        
        const storeIdMap: { [key: string]: string } = {};
        oldStoresCategories.forEach((cat: any) => {
             storeIdMap[cat.storeName] = `store-${cat.id.split('-')[1]}`;
        });

        // Update storeId in categories
        categories.forEach((cat: any) => {
            if (cat.storeId && storeIdMap[cat.storeId]) {
                 cat.storeId = storeIdMap[cat.storeId];
            }
        });
        
        // Update storeId in products
        products.forEach((prod: any) => {
            if (prod.storeId && storeIdMap[prod.storeId]) {
                prod.storeId = storeIdMap[prod.storeId];
            }
        });


        stores = newStores;
        categories = categories.filter((cat: any) => !cat.storeName);
    }
    
    return { stores, categories, products, customers, invoices, units };
}
