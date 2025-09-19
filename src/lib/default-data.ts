import type { Category, Customer, Invoice, Product, UnitOfMeasurement, Store } from '@/lib/definitions';

const storesData: Store[] = [
  { 
    "id": "store-dekorband", 
    "name": "دکوربند", 
    "address": "تهران خیابان قزوین خیابان بلور سازی پلاک 156",
    "phone": "09125486083",
    "logoUrl": "https://picsum.photos/seed/0.0990875151282885/110/110",
    "bankAccountHolder": "اسماعیل بهاری",
    "bankName": "سامان",
    "bankAccountNumber": "123-456-789",
    "bankIban": "IR690560081680002151791001",
    "bankCardNumber": "6219861051578325"
  }
];

const categoriesData: Category[] = [
    {
      "id": "cat-5qmk2cymq",
      "name": "سقف کاذب",
      "storeId": "store-dekorband"
    },
    {
      "id": "cat-5barmsbxr",
      "name": "پنل",
      "storeId": "store-dekorband",
      "parentId": "cat-5qmk2cymq"
    },
    {
      "id": "cat-2qtm2q3ui",
      "name": "سازه سقف",
      "storeId": "store-dekorband",
      "parentId": "cat-5qmk2cymq"
    },
    {
      "id": "cat-k8geqzhtv",
      "name": "ملزومات نصب",
      "storeId": "store-dekorband",
      "parentId": "cat-5qmk2cymq"
    },
    {
      "id": "cat-uu5zv61v0",
      "name": "تایل",
      "storeId": "store-dekorband",
      "parentId": "cat-5qmk2cymq"
    },
    {
      "id": "cat-8rd1h42l2",
      "name": "سپری",
      "storeId": "store-dekorband",
      "parentId": "cat-5qmk2cymq"
    },
    {
      "id": "cat-kymcjdgzs",
      "name": "پیچ",
      "storeId": "store-dekorband",
      "parentId": "cat-5qmk2cymq"
    },
    {
      "id": "cat-t4qy2aurx",
      "name": "میخ و چاشنی",
      "storeId": "store-dekorband",
      "parentId": "cat-5qmk2cymq"
    },
    {
      "id": "cat-lyf6c3wdd",
      "name": "بتونه و ماستیک",
      "storeId": "store-dekorband",
      "parentId": "cat-5qmk2cymq"
    },
    {
      "id": "cat-dikklt4ld",
      "name": "سازه دیوار",
      "storeId": "store-dekorband",
      "parentId": "cat-5qmk2cymq"
    },
    {
      "id": "cat-upvglp6gs",
      "name": "سازه سقف مشبک",
      "storeId": "store-dekorband",
      "parentId": "cat-5qmk2cymq"
    }
];

const customersData: Customer[] = [
    {
      "id": "cust-t7qq0wtzl",
      "name": "09197166675",
      "email": "ایمیل ثبت نشده",
      "phone": "شماره ثبت نشده",
      "address": "آدرس ثبت نشده",
      "purchaseHistory": "مشتری جدید"
    },
    {
      "id": "cust-zv7mf3v4i",
      "name": "مشتری بدون نام",
      "email": "ایمیل ثبت نشده",
      "phone": "09398330932",
      "address": "آدرس ثبت نشده",
      "purchaseHistory": "مشتری جدید"
    },
    {
      "id": "cust-uv6dic62a",
      "name": "اصغر حسن زاده | شرکت همراه کوشا کیش",
      "email": "ایمیل ثبت نشده",
      "phone": "09121372580",
      "address": "فرودگاه امام خمینی",
      "purchaseHistory": "مشتری جدید"
    }
];

const productsData: Product[] = [
    {
      "id": "prod-ioz0fpkp5",
      "name": "تایل پی وی سی",
      "code": "",
      "description": "تایل‌های پی وی سی کناف، انتخابی ایده‌آل برای سقف‌های کاذب با ظاهری مدرن و دوام بالا. این تایل‌ها با مقاومت فوق‌العاده در برابر رطوبت و قابلیت شستشو، راه‌حلی کاربردی و زیبا برای فضاهای گوناگون ارائه می‌دهند. نصب آسان و نگهداری بی‌دردسر، آن‌ها را به گزینه‌ای محبوب در صنعت کناف تبدیل کرده است.",
      "price": 1800000,
      "storeId": "store-dekorband",
      "subCategoryId": "cat-uu5zv61v0",
      "unit": "متر مربع",
      "subUnit": "عدد",
      "subUnitQuantity": 2.8,
      "subUnitPrice": 642857,
      "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTv9zbeP0dR6MppCqZiyQG-q2eEsUZ1aH8zCg&s"
    },
    {
      "id": "prod-1onwme7ao",
      "name": "نبشی L24",
      "code": "",
      "description": "نبشی L24 سفید، راه حلی ایده‌آل برای تکمیل گوشه‌های کناف‌کاری شما. این محصول با کیفیت بالا، استحکام و ظاهری بی‌نقص را به پروژه‌های ساختمانی شما هدیه می‌دهد و نصبی آسان و سریع دارد.",
      "price": 650000,
      "storeId": "store-dekorband",
      "subCategoryId": "cat-upvglp6gs",
      "unit": "شاخه",
      "subUnit": "متر طول",
      "subUnitQuantity": 3,
      "subUnitPrice": 216667,
      "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGu2q4vg1wqDefecaXU5yU7f15XZO7Vn3qYg&s"
    },
    {
      "id": "prod-5aw71so6j",
      "name": "سپری T60",
      "code": "",
      "description": "سپری T60، انتخابی ایده‌آل برای زیرسازی سقف‌های کاذب کناف شما. این محصول با طراحی دقیق و کیفیت بالا، نصب سریع و آسان را تضمین کرده و استحکامی بی‌نظیر به سازه می‌بخشد.",
      "price": 192000,
      "storeId": "store-dekorband",
      "subCategoryId": "cat-upvglp6gs",
      "unit": "شاخه",
      "subUnit": "متر طول",
      "subUnitQuantity": 0.6,
      "subUnitPrice": 320000,
      "imageUrl": "data:image/jpeg;base64,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"
    },
    {
      "id": "prod-1jc8p8d6k",
      "name": "نوار درزگیری",
      "code": "",
      "description": "نوار درزگیری فایبر گلاس مش پشت چسب دار، راه حلی سریع و آسان برای درزگیری و ترمیم ترک‌ها است. با چسبندگی عالی و مقاومت بالا، سطحی صاف و یکدست را تضمین می‌کند.",
      "price": 1800000,
      "storeId": "store-dekorband",
      "subCategoryId": "cat-lyf6c3wdd",
      "unit": "بسته",
      "subUnit": "متر طول",
      "subUnitQuantity": 100,
      "subUnitPrice": 18000,
      "imageUrl": "data:image/jpeg;base64,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"
    },
    {
      "id": "prod-mnlj5syxn",
      "name": "رانر 4000 - U100",
      "code": "",
      "description": "رانر U100-4000 کناف، انتخابی ایده‌آل برای زیرسازی مستحکم و دقیق سیستم‌های درای‌وال. این محصول با کیفیت بالا و طراحی مهندسی، نصب آسان و پایداری فوق‌العاده‌ای را تضمین می‌کند و به شما کمک می‌کند تا دیوارهایی با دوام و بی‌نقص بسازید.",
      "price": 1628000,
      "storeId": "store-dekorband",
      "subCategoryId": "cat-dikklt4ld",
      "unit": "شاخه",
      "subUnit": "متر طول",
      "subUnitQuantity": 4,
      "subUnitPrice": 407000,
      "imageUrl": "data:image/jpeg;base64,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"
    }
  ];

const invoicesData: Invoice[] = [
    {
      "id": "inv-xd99ajcuo",
      "invoiceNumber": "EST-0006",
      "customerId": "cust-t7qq0wtzl",
      "customerName": "09197166675",
      "customerEmail": "ایمیل ثبت نشده",
      "date": "2025-09-18T10:40:50.351Z",
      "status": "Pending",
      "items": [
        {
          "productId": "prod-ioz0fpkp5",
          "productName": "تایل پی وی سی",
          "quantity": 26,
          "unit": "عدد",
          "unitPrice": 642857,
          "totalPrice": 16714282
        },
        {
          "productId": "prod-1onwme7ao",
          "productName": "نبشی L24",
          "quantity": 4,
          "unit": "شاخه",
          "unitPrice": 650000,
          "totalPrice": 2600000
        },
        {
          "productId": "prod-n697qpd6m",
          "productName": "سپری T360",
          "quantity": 3,
          "unit": "شاخه",
          "unitPrice": 1152000,
          "totalPrice": 3456000
        },
        {
          "productId": "prod-kpki0s342",
          "productName": "سپری T120",
          "quantity": 11,
          "unit": "شاخه",
          "unitPrice": 384000,
          "totalPrice": 4224000
        },
        {
          "productId": "prod-5aw71so6j",
          "productName": "سپری T60",
          "quantity": 13,
          "unit": "شاخه",
          "unitPrice": 192000,
          "totalPrice": 2496000
        }
      ],
      "subtotal": 29490282,
      "discount": 0,
      "additions": 0,
      "tax": 0,
      "total": 29490282,
      "description": "ایجاد شده از برآورد مصالح سقف مشبک"
    },
    {
      "id": "inv-qfhbiqf7h",
      "invoiceNumber": "EST-0005",
      "customerId": "cust-zv7mf3v4i",
      "customerName": "مشتری بدون نام",
      "customerEmail": "ایمیل ثبت نشده",
      "date": "2025-09-18T10:34:26.854Z",
      "status": "Pending",
      "items": [
        {
          "productId": "prod-ioz0fpkp5",
          "productName": "تایل پی وی سی",
          "quantity": 461,
          "unit": "عدد",
          "unitPrice": 642857,
          "totalPrice": 296357077
        },
        {
          "productId": "prod-1onwme7ao",
          "productName": "نبشی L24",
          "quantity": 20,
          "unit": "شاخه",
          "unitPrice": 650000,
          "totalPrice": 13000000
        },
        {
          "productId": "prod-n697qpd6m",
          "productName": "سپری T360",
          "quantity": 39,
          "unit": "شاخه",
          "unitPrice": 1152000,
          "totalPrice": 44928000
        },
        {
          "productId": "prod-kpki0s342",
          "productName": "سپری T120",
          "quantity": 222,
          "unit": "شاخه",
          "unitPrice": 384000,
          "totalPrice": 85248000
        },
        {
          "productId": "prod-5aw71so6j",
          "productName": "سپری T60",
          "quantity": 224,
          "unit": "شاخه",
          "unitPrice": 192000,
          "totalPrice": 43008000
        },
        {
          "productId": "prod-8676z49k8",
          "productName": "پیچ پنل 2.5",
          "quantity": 1,
          "unit": "بسته",
          "unitPrice": 4600000,
          "totalPrice": 4600000
        }
      ],
      "subtotal": 487141077,
      "discount": 0,
      "additions": 0,
      "tax": 0,
      "total": 487141077,
      "description": "ایجاد شده از برآورد مصالح سقف مشبک"
    },
    {
      "id": "inv-kmzrn6y4f",
      "invoiceNumber": "INV-1547",
      "customerId": "cust-zv7mf3v4i",
      "customerName": "مشتری بدون نام",
      "customerEmail": "ایمیل ثبت نشده",
      "date": "2025-09-18T07:00:39.843Z",
      "status": "Paid",
      "items": [
        {
          "productId": "prod-pb3qrc09n",
          "productName": "پانل گچی RG12.5 والیز",
          "quantity": 7,
          "unit": "برگ",
          "unitPrice": 3500000,
          "totalPrice": 24500000
        },
        {
          "productId": "prod-8676z49k8",
          "productName": "پیچ پنل 2.5",
          "quantity": 1,
          "unit": "بسته",
          "unitPrice": 4600000,
          "totalPrice": 4600000
        },
        {
          "productId": "prod-ok2tikiw6",
          "productName": "L25 نبشی",
          "quantity": 32,
          "unit": "شاخه",
          "unitPrice": 600000,
          "totalPrice": 19200000
        },
        {
          "productId": "prod-jzqwsyrlb",
          "productName": "U36",
          "quantity": 3,
          "unit": "شاخه",
          "unitPrice": 800000,
          "totalPrice": 2400000
        }
      ],
      "subtotal": 50700000,
      "discount": 0,
      "additions": 0,
      "tax": 0,
      "total": 50700000,
      "description": "فاکتور ایجاد شده"
    },
    {
      "id": "inv-x64j30f79",
      "invoiceNumber": "INV-002",
      "customerId": "cust-uv6dic62a",
      "customerName": "اصغر حسن زاده | شرکت همراه کوشا کیش",
      "customerEmail": "ایمیل ثبت نشده",
      "date": "2025-09-17T11:42:09.392Z",
      "status": "Pending",
      "items": [
        {
          "productId": "prod-5gpelli6w",
          "productName": "پانل گچی RG12.5 جی برد",
          "quantity": 216,
          "unit": "متر مربع",
          "unitPrice": 1150000,
          "totalPrice": 248400000
        },
        {
          "productId": "prod-cc3873duy",
          "productName": "استاد 3000 - C100",
          "quantity": 300,
          "unit": "متر طول",
          "unitPrice": 460000,
          "totalPrice": 138000000
        },
        {
          "productId": "prod-mnlj5syxn",
          "productName": "رانر 4000 - U100",
          "quantity": 80,
          "unit": "متر طول",
          "unitPrice": 407000,
          "totalPrice": 32560000
        },
        {
          "productId": "prod-8676z49k8",
          "productName": "پیچ پنل 2.5",
          "quantity": 8,
          "unit": "بسته",
          "unitPrice": 4600000,
          "totalPrice": 36800000
        },
        {
          "productId": "prod-jdwgrf6x8",
          "productName": "میخ چاشنی بتن",
          "quantity": 5,
          "unit": "بسته",
          "unitPrice": 3750000,
          "totalPrice": 18750000
        },
        {
          "productId": "prod-94zedzble",
          "productName": "بتونه درزگیر 20 کیلو",
          "quantity": 1,
          "unit": "بسته",
          "unitPrice": 2000000,
          "totalPrice": 2000000
        },
        {
          "productId": "prod-1jc8p8d6k",
          "productName": "نوار درزگیری",
          "quantity": 1,
          "unit": "بسته",
          "unitPrice": 1800000,
          "totalPrice": 1800000
        },
        {
          "productId": "prod-xbylhh3vs",
          "productName": "پیچ پنل 3.5",
          "quantity": 1,
          "unit": "بسته",
          "unitPrice": 5200000,
          "totalPrice": 5200000
        }
      ],
      "subtotal": 483510000,
      "discount": 0,
      "tax": 0,
      "total": 483510000,
      "description": "فاکتور ایجاد شده",
      "additions": 0
    }
];

const unitsData: UnitOfMeasurement[] = [
    {
      "name": "کارتن",
      "defaultQuantity": 1
    },
    {
      "name": "شاخه",
      "defaultQuantity": 4
    },
    {
      "name": "بسته",
      "defaultQuantity": 1
    },
    {
      "name": "برگ",
      "defaultQuantity": 2.88
    },
    {
      "name": "متر طول",
      "defaultQuantity": 1
    },
    {
      "name": "کیلو",
      "defaultQuantity": 1
    },
    {
      "name": "عدد",
      "defaultQuantity": 1
    },
    {
      "name": "متر مربع",
      "defaultQuantity": 1
    }
];

export function getDefaultData() {
  return {
    stores: storesData,
    categories: categoriesData,
    products: productsData,
    customers: customersData,
    invoices: invoicesData,
    units: unitsData,
  };
}
