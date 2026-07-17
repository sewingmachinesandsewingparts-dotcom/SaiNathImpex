    # Stitch Parts Finder

    A full-stack sewing machine parts catalog and admin dashboard built with Next.js, MongoDB, and Cloudinary.

    This project is intended for commercial and industrial use. It is made available under the MIT License. See LICENSE for details.

    ## Project Overview

    Stitch Parts Finder is a product catalog and management application for sewing machine parts. It includes:

    - A Next.js frontend using the App Router
    - MongoDB data persistence via Mongoose
    - Cloudinary-based image uploads
    - Admin interfaces for issues, orders, products, sales, brands, and users
    - Client-side cart and checkout flows
    - RESTful API routes implemented with Next.js App Router API routes

    ## Technologies Used

    - Next.js 15
    - React 19
    - Node.js
    - MongoDB
    - Mongoose
    - Cloudinary
    - Tailwind CSS
    - Radix UI
    - ESLint / Prettier
    - JavaScript / JSX
    - Axios
    - Zod

    ## Project Structure

    - `src/app/` — Next.js App Router pages and routes
    - `src/app/api/` — Next.js API routes
    - `src/components/` — UI components
    - `src/lib/` — shared helpers and services
    - `src/models/` — Mongoose models
    - `uploads/` — temporary upload staging for Cloudinary
    - `.next/` — Next.js build output

    ## Backend Data Models

    ### Brand

    Fields:
    - `slug`: string, required, unique
    - `name`: string, required
    - `isBrand`: boolean, default `true`
    - `models`: array of embedded model objects
    - `timestamps`

    Embedded model fields:
    - `slug`: string, required
    - `name`: string, required
    - `partsCount`: number, default `0`

    ### Part

    Fields:
    - `sku`: string, required, unique
    - `id1`, `id2`: string
    - `name`: string, required
    - `description`: string
    - `price`: number, required
    - `compareAt`: number
    - `stock`: number, default `0`
    - `hasMotor`: boolean, default `false`
    - `diagramNumber`: string
    - `altPartNumbers`: string[]
    - `images`: string[]
    - `compat.machineModels`: string[]
    - `compat.stitchType`: string[]
    - `compat.needleSystem`: string
    - `compat.threadType`: string
    - `specs.material`: string
    - `specs.weight`: string
    - `maintenance.lubrication`: string
    - `maintenance.replacementInterval_hours`: number
    - `brandSlug`, `brandName`, `modelSlug`, `modelName`: strings
    - `isBrand`: boolean
    - `rating`: number, default `0`
    - `reviews`: number, default `0`
    - `timestamps`

    ### Order

    Fields:
    - `id`: string, required, unique
    - `placedAt`: string, required
    - `status`: enum `[placed, shipped, delivered, cancelled]`, default `placed`
    - `total`: number, required
    - `itemsCount`: number, required
    - `items`: array of order item objects
    - `customerName`: string, required
    - `customerEmail`: string, required
    - `customerPhone`: string
    - `shippingAddress`: string
    - `paymentMethod`: string, default `COD`
    - `timestamps`

    Order item fields:
    - `sku`: string, required
    - `name`: string, required
    - `price`: number, required
    - `qty`: number, required
    - `image`: string

    ### Sale

    Fields:
    - `id`: string, required, unique
    - `name`: string, required
    - `scope`: string, required
    - `scopeRef`: string, required
    - `percent`: number, required
    - `endsAt`: Date, required
    - `timestamps`

    ### Issue

    Fields:
    - `id`: string, required, unique
    - `subject`: string, required
    - `user`: string, required
    - `phone`: string
    - `location`: string
    - `status`: enum `[open, resolved]`, default `open`
    - `at`: string, required
    - `description`: string, required
    - `image`: string, default `""`
    - `timestamps`

    ### User

    Fields:
    - `id`: string, required, unique
    - `name`: string, required
    - `email`: string, required, unique
    - `phone`: string
    - `orders`: number, default `0`
    - `spent`: number, default `0`
    - `status`: enum `[active, blocked]`, default `active`
    - `role`: enum `[user, admin, superadmin]`, default `user`
    - `timestamps`

    ## Database Connection

    The MongoDB helper is located at `src/lib/mongo.js`.
    It uses the environment variable `MONGODB_URI`, or defaults to:

    ```bash
    mongodb://localhost:27017/stitch-parts-finder
    ```

    A global connection cache is used so Mongoose reuses the same client in development.

    ## Client-side Cache Behavior

    This project previously used browser caching for convenience, but those local cache features were removed to simplify behavior.

    ### What was cached

    - `src/app/track-order/page.jsx`
    - used `localStorage` key `mw_user_email`
    - saved the user's email after tracking an order
    - prefills the email input on next visit

    - `src/lib/cart-context.jsx`
    - used `localStorage` keys `mw_cart` and `mw_wishlist`
    - saved cart contents and wishlist items in the browser
    - restored cart and wishlist on page reload

    ### What was changed

    - `track-order` now only uses React state for the email input
    - `cart-context` now initializes cart and wishlist in memory only
    - no browser persistence is used anymore

    ### Why this was removed

    - avoid browser cache bugs or stale state
    - make the app simpler and more predictable
    - ensure behavior is driven by React state and API data, not hidden local storage

    ### Auth session behavior

    - authentication uses a secure cookie named `mw_user_id`
    - the frontend does not store auth credentials in `localStorage`
    - session state is retrieved from the backend via `/api/auth`

    ### Resulting workflow

    1. User enters email or cart items
    2. React state stores the values during the session
    3. No values are remembered after refresh or browser close
    4. The app behaves as a normal non-cached web app

    ### Important note

    - `src/lib/mongo.js` still reuses a server-side Mongoose connection in development; this is not browser caching and should remain.

    ## Cloudinary Integration

    The Cloudinary helper is in `src/lib/cloudinary.js` and requires:

    - `CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`

    Images are:
    - written temporarily to `uploads/`
    - uploaded with `cloudinary.uploader.upload`
    - then removed locally

    ## API Routes

    Implemented as Next.js App Router API routes.

    ### `/api/brands`
    - `GET` — fetch all brands and models

    ### `/api/parts`
    - `GET` — list and filter parts
    - `POST` — create a new part and upload images

    ### `/api/parts/[sku]`
    - `GET` — fetch a single part
    - `PUT` — update a part and manage images
    - `DELETE` — delete a part (if implemented)

    ### `/api/orders`
    - `GET` — list orders
    - `POST` — create a new order

    ### `/api/sales`
    - `GET` — fetch sale/promotions data

    ### `/api/issues`
    - `GET` — fetch issue tickets
    - `POST` — submit a new issue

    ### `/api/admin/[slug]`
    - `GET` — fetch admin dashboard metrics and KPI data

    ## Frontend Overview

    The frontend is a Next.js App Router application in `src/app/`.
    It includes:

    - Home, catalog, search, brand, part, cart, checkout, profile, wishlist, and support pages
    - Admin pages for issues, orders, products, sales, settings, and users
    - Shared components under `src/components/`
    - Client data helpers in `src/lib/`

    ## Environment Variables

    Recommended variables for `.env`:

    ```env
    MONGODB_URI=mongodb://localhost:27017/stitch-parts-finder
    CLOUDINARY_CLOUD_NAME=your-cloud-name
    CLOUDINARY_API_KEY=your-api-key
    CLOUDINARY_API_SECRET=your-api-secret
    ```

    ## Scripts

    - `npm install` — install dependencies
    - `npm run dev` — start Next.js development server
    - `npm run build` — build production app
    - `npm run start` — run built app
    - `npm run lint` — run ESLint
    - `npm run format` — format code with Prettier

    ## Notes

    - This repo is configured as a Next.js App Router project.
    - API backend functionality is provided by Next.js App Router API routes in `src/app/api/`.
    - MongoDB is used for backend persistence.
    - Cloudinary is used for image storage.
    - The project is currently intended for private/internal use.



    todo-->

    (Product manager by Admin -->
    -->adding a search bar to search and modify or delete the product ✅
    -->display the data as the flow works in product manager ✅
    isbrand-->brand-->mode-->part✅
    isNotBrand-->Category-->Part✅
    show there only category,brand  ✅
    the brand is required for every time we create a product product to identify (every products has the brand or category)
    )

    (issue Page

    live chat preview -->
    fix the live chat preview from user and admin to chat live on issue 

    admin update the status of the problem either it is resolved,pending,in working,seen

    Share(whatsapp) the data of the user (that register the complaint,{location,phone No,issue}) 

    in admin support page show the issues in category wise like machine(category),website(category) etc.

    )

    (
        Cart Page
        the cart item only removed when clicking on the cross or the qty on cart not go less that 1
    )

    (
        Adding Sales
        Adding Sales to the Products by their brand name,models name,categories(eye Guard,with motor,without motor,min/max price,lockstitch,)

        layout -->
        if the sales were added then show the sales like advertisemet on the website more than one sales show the sales like an auto carousel container that shows the sales by sliding animation at home at product

    )   

    (
        Product operations -->
        make the review operation in working
        make the Rating operation in working
    )

    {
        model -->
        fix the model's parts counting in frontend
    }

    {
        order Track
        --> Order tarck separate page that shows the updates in animation
        --> if already login then show the update otherwise enter the Email or OrderID
    }


    {
        cloudinary
        -->in cloudinary create a folder every product like 

        product 1 :-->
        Home/Products/Product_name1/image1
        Home/Products/Product_name/image2

        product 1 :-->
        Home/Products/Product_name2/image1
        Home/Products/Product_name/image2

        -->in cloudinary create a folder every support like 
        Home/support/supportID_1/image1
        Home/support/supportID_1/image2
        Home/support/supportID_2/image1
        Home/support/supportID_2/image2

    in this structure add the data or upload the images

    }

    {
        Admin Graphs :-->
        make the analytics graphs working for data representation 
        provide styles in graphs--> change the layouts of the graphs like candle,Bar,Lines
    }

{
            Creating Product -->
        operation issue --> 
        normally it works good but when i create the product name with "Brother-200/700" there this will shown an "This page could not be found." because it include the name 200/700 there it gets the / as the route 200 --> 700 not as a name
        }
 
git reset --hard HEAD --> use too get the last git data but remove the all present data 

1. we fill only two field not product name or no SKU 
1. we only need to fill the two things  --> 
                                            category-(Eg(Eye Guard))
                                            BrandName-(HX) 
                                            SeriesCode-(35000)
                                            ISC(Industrial STandard Code)-(747D)

                                            or now replace the id1,id2,productname,SKU to this data 

Create SKU --> if the data is like this -->
category-(Eg(Eye Guard))
BrandName-(HX) 
SeriesCode-(35000)
ISC(Industrial STandard Code)-(747D)

the the SKU will be --> EG-HX35000-747D
<category>-<Brandname><SeriesCode>-<ISC>
the product name--> Eye Guard Hx-35000 747D


3. if the product has only 
category-(Eg(Eye Guard))
BrandName-(HX) 
SeriesCode-(51693)

the SKU will be --> EG-HX-51693
<category>-<Brandname><SeriesCode>
the product name--> Eye Guard for Hx-51693

if the product is category then the data will be  Eye Guard Hx-35000 747D
-->

otherswise if the product has the brand(Pegasus) the just like -->Pegasus Eye Guard Hx-35000 747D and in sku PEG-EG

--> (pending)( the product name was never be editable in the product updationn they only update by the data changed )


(pending ) (if ISE Code Exist then --> 
add the Dedso eye-Guard Hx-7000 747D 
<Brand> <Category> <Brand Code>-<Series Code> <ISE Code >

otherwise --> 
Dedso eye-Guard for Hx-7000  
<Brand> <Category> for <Brand Code>-<Series Code>)

if the category is selected then the data will be show like -->  (<Brand> for <Brand Code>-<Series Code>)

(pending (SKU))

1. fix the SKU --> 
--><Brand> <Category>  <Brand Code>-<Series Code>  <ISE Code >
from this product name --> Hengxu Eye Guard Hx-35000 R53
to SKU of this -->HEN-EG-HX35000-R53
--><Brand (create a custom brand name and select from receny created)><Category>-<Brand Code><Series Code>-<ISE Code >




{
  "_id": {
    "$oid": "6a560aeeb045b26dfce739f2"
  },
  "sku": "HEN-PF-HX35012-747V",
  "id1": "35012",
  "id2": "747V",
  "name": "Hengxu Presser Foot Hx-35012 747V",
  "description": "newwith SKU",
  "price": 1233,
  "compareAt": 2333,
  "stock": 45,
  "hasMotor": false,
  "diagramNumber": "D-112",
  "altPartNumbers": [
    "11"
  ],
  "images": [
    "https://res.cloudinary.com/ck1z5bvn/image/upload/v1784023789/Home/Products/Hengxu%20Presser%20Foot%20Hx-35012%20747V/Home/Products/Hengxu-Presser-Foot-Hx-35012-747V/1784023786274-IMG_20260713_123010.jpg.jpeg.jpg",
    "https://res.cloudinary.com/ck1z5bvn/image/upload/v1784023790/Home/Products/Hengxu%20Presser%20Foot%20Hx-35012%20747V/Home/Products/Hengxu-Presser-Foot-Hx-35012-747V/1784023788896-IMG_20260713_123010.jpg.jpeg.jpg"
  ],
  "compat": {
    "machineModels": [
      "Juki-100"
    ],
    "needleSystem": "DBx1",
    "threadType": "Cotton",
    "stitchType": [
      "Lockstitch"
    ]
  },
  "specs": {
    "material": "Steel",
    "weight": "56"
  },
  "maintenance": {
    "replacementInterval_hours": 2000
  },
  "brandSlug": "hengxu",
  "brandName": "Hengxu",
  "modelSlug": "hx-35000",
  "modelName": "HX-35000",
  "rating": 0,
  "reviews": 0,
  "reviewEntries": [],
  "createdAt": {
    "$date": "2026-07-14T10:09:50.126Z"
  },
  "updatedAt": {
    "$date": "2026-07-14T10:55:43.859Z"
  },
  "__v": 0
}
