for adding the documents on the mongoDB
mongoimport --uri="mongodb+srv://sewingmachinesandsewingparts_db_user:wL1gCeAs3eTqtyas@cluster0.8p8rrp9.mongodb.net/stitch-parts-finder?appName=Cluster0" --collection=parts --file=018.json --jsonArray












DATA EXTRACT LIKE THIS FROM PDF 

FROM THIS UPLOADED SCAN THE PDF FETCH ALL THE DATA AND CREATE A EXCEL SHEET FOR EACH PRODUCT USE COLUMNS "SERIES(hx-80000), ID1, ID2 " , NO IMAGES OF THE PRODUCT. do for all 25 products  like this  i want always the structure like this SERIES(hx-80000),ID1,ID2
HX 80450,E238,
HX 80451,E246,
HX 80452,E247,
HX 80453,E248,
HX 80454,E249,
HX 80455,E255,
HX 80456,E261,
HX 80457,E262,
HX 80458,E263,
HX 80459,E275,
HX 80460,E277,
HX 80461,E1826K,
HX 80462,E1836L,
HX 80463,E1838K,
HX 80464,E1846,F007E-W162 (3x5.6)
HX 80464,E1847,F007E-W162 (3x6.4)
HX 80465,E1828,F007E-W922/FW (4x6.0)
HX 80465,E1838,
HX 80465,E1848,
HX 80466,E1818P,
HX 80466,E1828P,
HX 80466,E1838P,
HX 80466,E1848P,
HX 80467,E2324,C007E (2x4.0)
HX 80467,E2325,C007E (2x4.8)
HX 80467,E2325P,
HX 80467,E2324P,
HX 80468,E1836Q,
HX 80468,E1837Q,
HX 80469,E2326P,C007E (3x5.6)
HX 80469,E2327P,C007E (3x6.4)
HX 80469,E2326Q,
HX 80469,E2327Q,
HX 80470,E0223R,
HX 80470,E0215R,
HX 80470,E0225R,
HX 80470,E0235R,
HX 80471,E0225Q,
HX 80471,E0226Q,E0215Q C007E/UTP (3x5.6)
HX 80471,E0227Q,E0216Q C007E/UTP (3x6.4)
HX 80471,E0235Q,
HX 80471,E0236Q,
HX 80471,E0237Q,
HX 80472,E0226P,C007E/CRL (3x5.6)
HX 80472,E0227P,C007E/CRL (3x6.4)
HX 80472,E0226R,
HX 80472,E0236R,
HX 80472,E0227R,
HX 80472,E0237R,
HX 80473,E1514,
HX 80473,E1534,
HX 80473,E1515,
HX 80473,E1535,
HX 80473,E1524,F007E-W122 (2x4.0)
HX 80473,E1525,F007E-W122 (2x4.8)
HX 80474,E1816,
HX 80474,E1817,
HX 80474,E1836,
HX 80474,E1837,
HX 80474,E1826,F007E-W122 (3x5.6)
HX 80474,E1827,F007E-W122 (3x6.4) 




















CONVERT TO THE JSON ARRAY 

or learn from this 18. PG-80092 277515R40 PEGASUS NEEDLE PLATE Since your source does not specify a machine model for OEM 277515R40, I've left the model-related fields blank rather than guessing. { "sku": "PEG-NP-PG80092-277515R40", "MCG": "PG-80092", "OEM": "277515R40", "id1": "PG-80092", "id2": "277515R40", "name": "Pegasus Needle Plate PG80092 277515R40", "description": "OEM Pegasus needle plate for PG-80092 industrial sewing machines.", "price": 550, "stock": 0, "stockAlert": 0, "hasMotor": false, "brandName": "Pegasus", "brandSlug": "pegasus", "modelName": "", "modelSlug": "", "categoryRoot": "Needle Plate", "categoryRootSlug": "needle-plate", "linkedSeries": { "series": "PG-80092", "products": [ "PEG-NP-PG80092-277513R40", "PEG-NP-PG80092-277513R50", "PEG-NP-PG80092-277515R40" ] }, "compat": { "machineModels": [], "stitchType": [] }, "images": [], "altPartNumbers": [], "keywords": [ "Pegasus", "needle plate", "PG-80092", "277515R40", "OEM" ], "compatibleBrands": [ { "brand": "Pegasus", "machines": [] } ], "rating": 0, "reviews": 0, "status": "Active" } Next: PG-80093 277516R40 EX3261 5×4mm PEGASUS NEEDLE PLATE. n 19. PG-80093 277516R40 EX3261 (5×4mm) PEGASUS NEEDLE PLATE { "sku": "PEG-NP-PG80093-277516R40", "MCG": "PG-80093", "OEM": "277516R40", "id1": "PG-80093", "id2": "277516R40", "name": "Pegasus Needle Plate PG80093 277516R40", "description": "OEM Pegasus needle plate for EX3261 Series PG-80093 industrial overlock sewing machines. 5×4 mm needle gauge for precision overlock sewing applications.", "price": 550, "stock": 0, "stockAlert": 0, "hasMotor": false, "brandName": "Pegasus", "brandSlug": "pegasus", "modelName": "EX3261", "modelSlug": "ex3261", "categoryRoot": "Needle Plate", "categoryRootSlug": "needle-plate", "linkedSeries": { "series": "PG-80093", "products": [ "PEG-NP-PG80093-277516R40", "PEG-NP-PG80093-277516R50", "PEG-NP-PG80093-277517R40" ] }, "compat": { "machineModels": [ "Pegasus EX3261" ], "stitchType": [ "Overlock" ] }, "images": [], "altPartNumbers": [], "keywords": [ "Pegasus", "needle plate", "PG-80093", "277516R40", "EX3261", "5x4mm", "overlock", "OEM" ], "compatibleBrands": [ { "brand": "Pegasus", "machines": [ { "model": "EX3261", "series": "80093", "machineType": "Overlock" } ] } ], "rating": 0, "reviews": 0, "status": "Active" } Next: PG-80093 277516R50 EX3261 (5×5mm) PEGASUS NEEDLE PLATE. n 20. PG-80093 277516R50 EX3261 (5×5mm) PEGASUS NEEDLE PLATE { "sku": "PEG-NP-PG80093-277516R50", "MCG": "PG-80093", "OEM": "277516R50", "id1": "PG-80093", "id2": "277516R50", "name": "Pegasus Needle Plate PG80093 277516R50", "description": "OEM Pegasus needle plate for EX3261 Series PG-80093 industrial overlock sewing machines. 5×5 mm needle gauge for precision overlock sewing applications.", "price": 550, "stock": 0, "stockAlert": 0, "hasMotor": false, "brandName": "Pegasus", "brandSlug": "pegasus", "modelName": "EX3261", "modelSlug": "ex3261", "categoryRoot": "Needle Plate", "categoryRootSlug": "needle-plate", "linkedSeries": { "series": "PG-80093", "products": [ "PEG-NP-PG80093-277516R40", "PEG-NP-PG80093-277516R50", "PEG-NP-PG80093-277517R40" ] }, "compat": { "machineModels": [ "Pegasus EX3261" ], "stitchType": [ "Overlock" ] }, "images": [], "altPartNumbers": [], "keywords": [ "Pegasus", "needle plate", "PG-80093", "277516R50", "EX3261", "5x5mm", "overlock", "OEM" ], "compatibleBrands": [ { "brand": "Pegasus", "machines": [ { "model": "EX3261", "series": "80093", "machineType": "Overlock" } ] } ], "rating": 0, "reviews": 0, "status": "Active" } Next: PG-80093 277517R40 (3×4mm) PEGASUS NEEDLE PLATE. also create from this excel file but use the KIN-80151 rather than HX-80151 and the more data is KINGTEX Needle plates from this  



all in 450 Price KINGTEX Needle plates continue from this PG-80165 257033A56 W561-02 (3×5.6) and create the json file for this in the strture for this  





SERIES(hx-81000),ID1,ID2

HX 81120,5212TP0051,
(ALL DOCUMENTS HERE THAT EXTRACT FROM THE PDF)
 all docments data in json 

